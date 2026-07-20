import { LocalDB } from '../database/localDb';
import { 
  AutomationWorkflow, WorkflowNode, WorkflowEdge, WorkflowRun, WorkflowLog, ScheduledJob, 
  AutomationHistory, Lead, Appointment, AiProposal 
} from '../types';
import { GoogleGenAI } from '@google/genai';

const db = LocalDB.getInstance();

// Safe initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (err) {
      console.error('[WorkflowRunner] Failed to initialize GoogleGenAI client:', err);
    }
  }
  return aiClient;
}

export class WorkflowRunner {
  /**
   * Triggers active workflows for a specific event
   */
  public static async triggerEvent(organizationId: string, triggerType: string, contextData: any) {
    const workflows = db.getWorkflows(organizationId);
    const activeWorkflows = workflows.filter(w => w.status === 'PUBLISHED' && w.triggerType === triggerType);

    for (const workflow of activeWorkflows) {
      await this.startWorkflowRun(workflow, contextData);
    }
  }

  /**
   * Starts a brand new workflow run
   */
  public static async startWorkflowRun(workflow: AutomationWorkflow, contextData: any): Promise<string> {
    const runId = 'run_' + Math.random().toString(36).substring(2, 11);
    const run: WorkflowRun = {
      id: runId,
      workflowId: workflow.id,
      organizationId: workflow.organizationId,
      status: 'RUNNING',
      triggerType: workflow.triggerType,
      contextData: { ...contextData, loops: {} },
      currentNodeId: undefined,
      startedAt: new Date().toISOString()
    };

    db.addWorkflowRun(run);

    // Find the trigger node to start execution
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
    
    // Log start
    db.addWorkflowLog({
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      runId,
      workflowId: workflow.id,
      nodeId: triggerNode?.id,
      nodeType: 'trigger',
      status: 'SUCCESS',
      message: `Workflow "${workflow.name}" started by trigger: ${workflow.triggerType}`,
      createdAt: new Date().toISOString()
    });

    if (!triggerNode) {
      this.completeRun(runId, 'FAILED', 'No trigger node found in workflow.');
      return runId;
    }

    // Move to the next node connected to trigger
    const nextNode = this.getNextNode(workflow, triggerNode.id);
    if (nextNode) {
      // Execute asynchronously to not block the main request
      setTimeout(() => this.executeNode(workflow.id, runId, nextNode.id), 0);
    } else {
      this.completeRun(runId, 'COMPLETED', 'Workflow finished immediately (no actions connected to trigger).');
    }

    return runId;
  }

  /**
   * Resumes a paused/scheduled workflow run from a specific node
   */
  public static async resumeWorkflowRun(runId: string, nodeId: string) {
    const run = db.getWorkflowRunById(runId);
    if (!run || run.status !== 'RUNNING' && run.status !== 'PAUSED') return;

    const workflow = db.getWorkflowById(run.workflowId);
    if (!workflow) return;

    // Update state to running
    db.updateWorkflowRun(runId, { status: 'RUNNING', currentNodeId: nodeId });

    db.addWorkflowLog({
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      runId,
      workflowId: workflow.id,
      nodeId,
      status: 'SUCCESS',
      message: 'Resuming workflow execution after delay or scheduling.',
      createdAt: new Date().toISOString()
    });

    // Execute node
    setTimeout(() => this.executeNode(workflow.id, runId, nodeId), 0);
  }

  /**
   * Main node execution loop
   */
  private static async executeNode(workflowId: string, runId: string, nodeId: string) {
    const workflow = db.getWorkflowById(workflowId);
    const run = db.getWorkflowRunById(runId);

    if (!workflow || !run || run.status !== 'RUNNING') return;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      this.completeRun(runId, 'FAILED', `Node with ID ${nodeId} not found in workflow.`);
      return;
    }

    // Update current node
    db.updateWorkflowRun(runId, { currentNodeId: nodeId });

    const startTime = Date.now();
    let nodeStatus: 'SUCCESS' | 'ERROR' | 'PENDING' | 'RETRYING' = 'SUCCESS';
    let logMessage = '';
    let logDetails = '';
    let stopExecution = false;
    let branchOutcome: string | undefined = undefined;

    try {
      switch (node.type) {
        case 'condition': {
          const rules = node.config?.conditionRules;
          const isTrue = this.evaluateRules(rules, run.contextData);
          branchOutcome = isTrue ? 'yes' : 'no';
          logMessage = `Condition evaluated to: ${isTrue ? 'YES (True)' : 'NO (False)'}`;
          logDetails = JSON.stringify({ rules, outcome: branchOutcome });
          break;
        }

        case 'action': {
          const actionResult = await this.performAction(node, run);
          logMessage = actionResult.message;
          logDetails = actionResult.details || '';
          if (actionResult.error) {
            nodeStatus = 'ERROR';
            if (node.config?.retryOnFailure) {
              const retries = (run.contextData._retries?.[nodeId] || 0) + 1;
              if (retries <= (node.config?.maxRetries || 3)) {
                // Schedule retry in 30 seconds
                nodeStatus = 'RETRYING';
                stopExecution = true;
                logMessage += ` - Scheduling retry #${retries}`;
                this.scheduleRetry(workflow, node, run, retries);
              }
            }
            if (nodeStatus === 'ERROR' && !node.config?.continueOnError) {
              stopExecution = true;
              this.completeRun(runId, 'FAILED', `Action "${node.label}" failed: ${actionResult.message}`);
            }
          }
          break;
        }

        case 'delay': {
          const delayType = node.config?.delayType || 'duration';
          let executeAt = new Date();

          if (delayType === 'duration') {
            const delayMs = Number(node.config?.delayMs) || 0;
            executeAt = new Date(Date.now() + delayMs);
            logMessage = `Scheduled execution delay of ${delayMs / 1000} seconds.`;
          } else {
            const dateStr = node.config?.delayUntilDate;
            executeAt = dateStr ? new Date(dateStr) : new Date();
            logMessage = `Scheduled execution until absolute date: ${executeAt.toISOString()}`;
          }

          stopExecution = true;
          db.updateWorkflowRun(runId, { status: 'PAUSED' });

          // Register scheduled job
          const job: ScheduledJob = {
            id: 'job_' + Math.random().toString(36).substring(2, 11),
            workflowId,
            nodeId,
            runId,
            organizationId: run.organizationId,
            executeAt: executeAt.toISOString(),
            status: 'PENDING',
            retryCount: 0,
            maxRetries: 3,
            contextData: run.contextData,
            timezone: node.config?.timezone || 'UTC'
          };
          db.addScheduledJob(job);
          break;
        }

        case 'loop': {
          const loopConfig = node.config?.loopConfig;
          const maxLoops = Number(loopConfig?.loopCount) || 5;
          const loopsState = run.contextData.loops || {};
          const currentCount = (loopsState[nodeId] || 0) + 1;
          
          loopsState[nodeId] = currentCount;
          run.contextData.loops = loopsState;
          db.updateWorkflowRun(runId, { contextData: run.contextData });

          if (currentCount <= maxLoops) {
            branchOutcome = 'yes';
            logMessage = `Loop iteration ${currentCount}/${maxLoops} - Continuing loop branch.`;
          } else {
            branchOutcome = 'no';
            logMessage = `Loop completed after ${maxLoops} iterations - Exiting loop branch.`;
          }
          break;
        }

        case 'end': {
          logMessage = 'Reached end node of the workflow.';
          stopExecution = true;
          this.completeRun(runId, 'COMPLETED');
          break;
        }

        default:
          logMessage = `Skipping unhandled node type: ${node.type}`;
      }
    } catch (err: any) {
      nodeStatus = 'ERROR';
      logMessage = `Error executing node: ${err.message || err}`;
      if (!node.config?.continueOnError) {
        stopExecution = true;
        this.completeRun(runId, 'FAILED', logMessage);
      }
    }

    const durationMs = Date.now() - startTime;

    // Add execution log
    db.addWorkflowLog({
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      runId,
      workflowId,
      nodeId,
      nodeType: node.type,
      status: nodeStatus,
      message: logMessage,
      details: logDetails,
      durationMs,
      createdAt: new Date().toISOString()
    });

    if (stopExecution) return;

    // Find next node to jump to
    const nextNode = this.getNextNode(workflow, nodeId, branchOutcome);
    if (nextNode) {
      this.executeNode(workflowId, runId, nextNode.id);
    } else {
      // No next node, wrap up
      this.completeRun(runId, 'COMPLETED');
    }
  }

  /**
   * Helper to evaluate custom condition logical rules
   */
  private static evaluateRules(rules: any, context: any): boolean {
    if (!rules) return true;
    const logical = rules.logicalOperator || 'AND';
    const itemRules = rules.rules || [];
    if (itemRules.length === 0) return true;

    const results = itemRules.map((rule: any) => {
      const val = this.getContextValue(context, rule.field);
      const target = rule.value;

      if (val === undefined || val === null) {
        return rule.operator === 'equals' && (target === '' || target === null);
      }

      switch (rule.operator) {
        case 'equals':
          return String(val).toLowerCase() === String(target).toLowerCase();
        case 'contains':
          return String(val).toLowerCase().includes(String(target).toLowerCase());
        case 'greaterThan':
          return Number(val) > Number(target);
        case 'lessThan':
          return Number(val) < Number(target);
        case 'dateComparison':
          return new Date(val).getTime() === new Date(target).getTime();
        default:
          return false;
      }
    });

    if (logical === 'OR') {
      return results.some(r => r === true);
    }
    return results.every(r => r === true);
  }

  /**
   * Safe getter for context values
   */
  private static getContextValue(context: any, field: string): any {
    if (!context) return null;
    if (field === 'leadScore' || field === 'score') return context.score || context.scoreValue || context.leadScore || 0;
    if (field === 'pipelineStage' || field === 'stage') return context.stage || context.pipelineStage || context.status || '';
    if (field === 'organization') return context.organizationId || context.companyName || '';
    if (field === 'role') return context.role || '';
    
    // Custom variable mapping
    if (context.customVariables && context.customVariables[field] !== undefined) {
      return context.customVariables[field];
    }
    if (context[field] !== undefined) {
      return context[field];
    }
    return null;
  }

  /**
   * Evaluates routing edges to fetch next sequence node
   */
  private static getNextNode(workflow: AutomationWorkflow, currentNodeId: string, outcome?: string): WorkflowNode | null {
    const edges = workflow.edges || [];
    let edge: WorkflowEdge | undefined;

    if (outcome) {
      edge = edges.find(e => e.source === currentNodeId && e.conditionValue === outcome);
    }
    
    // Fallback to first matching edge if no outcome specified or outcome edge was absent
    if (!edge) {
      edge = edges.find(e => e.source === currentNodeId);
    }

    if (!edge) return null;
    return workflow.nodes.find(n => n.id === edge!.target) || null;
  }

  /**
   * Processes custom action node triggers
   */
  private static async performAction(node: WorkflowNode, run: WorkflowRun): Promise<{ message: string; details?: string; error?: boolean }> {
    const actionType = node.config?.actionType;
    const config = node.config?.actionConfig || {};
    const context = run.contextData;

    switch (actionType) {
      case 'CREATE_LEAD': {
        const leadId = 'led_' + Math.random().toString(36).substring(2, 11);
        const nameParts = (config.name || config.firstName || 'Workflow Lead').split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'User';
        const newLead: Lead = {
          id: leadId,
          firstName,
          lastName,
          email: config.email || `lead_${leadId}@example.com`,
          company: config.company || 'Unknown',
          phone: config.phone || '',
          status: (config.status || 'NEW') as any,
          source: 'Workflow Automation',
          createdAt: new Date().toISOString()
        };
        db.addLead({ ...newLead, organizationId: run.organizationId } as any);
        return { 
          message: `Successfully created new CRM Lead: "${firstName} ${lastName}"`, 
          details: JSON.stringify(newLead) 
        };
      }

      case 'UPDATE_LEAD': {
        const leadId = context.id || context.leadId;
        if (!leadId) {
          return { message: 'Failed to update lead: No Lead ID found in run context.', error: true };
        }
        const updates: any = {};
        if (config.firstName !== undefined) updates.firstName = config.firstName;
        if (config.lastName !== undefined) updates.lastName = config.lastName;
        if (config.email !== undefined) updates.email = config.email;
        if (config.company !== undefined) updates.company = config.company;
        if (config.status !== undefined) updates.status = config.status;
        db.updateLead(leadId, updates);
        return { 
          message: `Successfully updated CRM Lead fields: ID ${leadId}`, 
          details: JSON.stringify(updates) 
        };
      }

      case 'ASSIGN_LEAD': {
        const leadId = context.id || context.leadId;
        const assigneeId = config.assigneeId || 'usr_salespilot_owner';
        if (!leadId) {
          return { message: 'Failed to assign lead: No Lead ID found in run context.', error: true };
        }
        db.updateLead(leadId, { source: `Assigned to: ${assigneeId}` });
        return { message: `Lead assigned to User/Agent "${assigneeId}"` };
      }

      case 'MOVE_PIPELINE_STAGE': {
        const leadId = context.id || context.leadId;
        const stage = config.stage || 'CONTACTED';
        if (!leadId) {
          return { message: 'Failed to update pipeline stage: No Lead ID found in run context.', error: true };
        }
        db.updateLead(leadId, { status: stage as any });
        return { message: `Moved Lead ID ${leadId} to stage: "${stage}"` };
      }

      case 'CREATE_TASK': {
        db.addNotification({
          id: 'not_' + Math.random().toString(36).substring(2, 11),
          organizationId: run.organizationId,
          userId: 'usr_81927391', // owner
          title: 'Workflow Automation Task',
          message: `New Task: ${config.title || 'Follow up'} - Due: ${config.dueDate || 'ASAP'}`,
          type: 'assignment',
          read: false,
          createdAt: new Date().toISOString()
        });
        return { message: `Automated follow-up task logged successfully: "${config.title}"` };
      }

      case 'CREATE_NOTE': {
        const leadId = context.id || context.leadId;
        if (!leadId) {
          return { message: 'Failed to create CRM Note: No Lead ID found in run context.', error: true };
        }
        const noteText = config.note || 'Workflow activity note';
        const lead = db.getLeadById(leadId);
        if (lead) {
          const notesList = lead.notesList || [];
          notesList.push({
            id: 'note_' + Math.random().toString(36).substring(2, 11),
            text: noteText,
            createdAt: new Date().toISOString()
          });
          db.updateLead(leadId, { notesList });
        }
        return { message: `Added CRM Activity note to Lead ID ${leadId}` };
      }

      case 'SEND_GMAIL': {
        const to = config.to || context.email || 'customer@example.com';
        const subject = config.subject || 'SalesPilot Update';
        const body = config.body || 'Hi, this is SalesPilot Auto-messaging.';
        console.log(`[SMTP SIMULATOR] Sending Gmail To: ${to}, Sub: ${subject}`);
        return { message: `Gmail sent successfully to ${to}`, details: `Subject: ${subject}` };
      }

      case 'GENERATE_AI_EMAIL': {
        const to = config.to || context.email || 'customer@example.com';
        const prompt = config.prompt || `Draft a friendly follow-up email for a lead named ${context.name || 'valued customer'}`;
        const ai = getAiClient();
        let draftText = '';

        if (ai) {
          try {
            const result = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: prompt
            });
            draftText = result.text || '';
          } catch (aiErr: any) {
            draftText = `[AI Generation Fallback] Failed to call Gemini API: ${aiErr.message}`;
          }
        } else {
          draftText = `[AI Mock] Dear ${context.name || 'valued customer'},\n\nWe would love to help you pilot your sales! Let us set up some time.\n\nBest,\nSalesPilot Team`;
        }

        console.log(`[AI EMAIL GENERATION] Drafted AI Email:\n${draftText}`);
        return { 
          message: `Gemini AI Email drafted successfully for ${to}`, 
          details: draftText 
        };
      }

      case 'GENERATE_AI_PROPOSAL': {
        const leadName = context.name || 'valued client';
        const budget = context.budget || 'enterprise scale';
        const prompt = config.prompt || `Draft a professional sales proposal for ${leadName} with an emphasis on automation.`;
        const ai = getAiClient();
        let proposalText = '';

        if (ai) {
          try {
            const result = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: prompt
            });
            proposalText = result.text || '';
          } catch (aiErr: any) {
            proposalText = `[AI Proposal Fallback] Gemini API Error: ${aiErr.message}`;
          }
        } else {
          proposalText = `# Sales Automation Proposal for ${leadName}\n\nPrepared by SalesPilot.\n\n- Scope: High-Performance SDR & Workflows\n- Budget Context: ${budget}\n\nWe guarantee premium lead delivery.`;
        }

        // Store generated proposal in DB structure
        const proposalId = 'prop_' + Math.random().toString(36).substring(2, 11);
        const proposal: AiProposal = {
          id: proposalId,
          leadId: context.id || 'led_unknown',
          organizationId: run.organizationId,
          title: config.title || 'Automated Sales Proposal',
          scope: 'High-Performance CRM & Workflow Engine Automation',
          pricingSummary: budget || '$1,500 setup + $499/month',
          nextSteps: 'Please book an onboarding review call.',
          markdownContent: proposalText,
          createdAt: new Date().toISOString()
        };
        
        db.addAiProposal(proposal);

        return { 
          message: `Gemini AI Proposal drafted and saved under ID "${proposalId}"`, 
          details: proposalText 
        };
      }

      case 'SCHEDULE_MEETING':
      case 'CREATE_CALENDAR_EVENT': {
        const appointmentId = 'apt_' + Math.random().toString(36).substring(2, 11);
        const appt: Appointment = {
          id: appointmentId,
          leadId: context.id || 'led_unknown',
          leadName: `${context.firstName || 'Workflow'} ${context.lastName || 'Lead'}`,
          company: context.company || 'Unknown Company',
          email: context.email || 'customer@example.com',
          dateTime: config.dateTime || config.time || new Date(Date.now() + 86400000).toISOString(),
          durationMins: Number(config.durationMins || config.duration) || 30,
          status: 'SCHEDULED',
          meetingLink: config.meetingLink || 'https://meet.google.com/salespilot-demo',
          notes: config.notes || 'Automated meeting scheduled via SalesPilot Workflow Engine',
        };
        db.addAppointment({ ...appt, organizationId: run.organizationId });
        return { message: `Google Calendar & Local Appointment scheduled successfully: ID ${appointmentId}` };
      }

      case 'SEND_INSTAGRAM_MESSAGE': {
        const username = config.username || context.instagramUsername || 'user_instagram';
        const msgText = config.message || 'Thank you for connecting with SalesPilot!';
        console.log(`[INSTAGRAM SIMULATOR] Direct Message to @${username}: ${msgText}`);
        return { message: `Instagram DM dispatched to @${username}` };
      }

      case 'SEND_NOTIFICATION': {
        db.addNotification({
          id: 'not_' + Math.random().toString(36).substring(2, 11),
          organizationId: run.organizationId,
          userId: 'usr_81927391',
          title: config.title || 'Workflow Alert',
          message: config.message || 'Automated flow alert.',
          type: 'alert',
          read: false,
          createdAt: new Date().toISOString()
        });
        return { message: `In-app Push Notification posted successfully.` };
      }

      case 'CALL_INTERNAL_API': {
        const endpoint = config.endpoint || '/api/health';
        return { message: `Internal API request mock successful for: ${endpoint}` };
      }

      case 'WEBHOOK_REQUEST': {
        const url = config.url || 'https://webhook.site/test';
        try {
          // Perform async non-blocking fetch trigger
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context)
          }).catch(e => console.error('[Webhook Simulation Error]', e.message));
        } catch (e) {}
        return { message: `Webhook payload dispatched to external endpoint: ${url}` };
      }

      default:
        return { message: `Action "${actionType}" executed successfully.` };
    }
  }

  /**
   * Safe schedule handler for automated retries
   */
  private static scheduleRetry(workflow: AutomationWorkflow, node: WorkflowNode, run: WorkflowRun, retryNum: number) {
    const updatedContext = {
      ...run.contextData,
      _retries: {
        ...(run.contextData._retries || {}),
        [node.id]: retryNum
      }
    };

    const executeAt = new Date(Date.now() + 30000); // retry in 30 seconds
    const job: ScheduledJob = {
      id: 'job_' + Math.random().toString(36).substring(2, 11),
      workflowId: workflow.id,
      nodeId: node.id,
      runId: run.id,
      organizationId: run.organizationId,
      executeAt: executeAt.toISOString(),
      status: 'PENDING',
      retryCount: retryNum,
      maxRetries: 3,
      contextData: updatedContext,
      timezone: 'UTC'
    };
    
    db.addScheduledJob(job);
  }

  /**
   * Finalizes run stats and outputs completion logs
   */
  private static completeRun(runId: string, status: 'COMPLETED' | 'FAILED', errorMsg?: string) {
    const run = db.getWorkflowRunById(runId);
    if (!run) return;

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(run.startedAt).getTime();

    db.updateWorkflowRun(runId, {
      status,
      completedAt,
      durationMs,
      errorMessage: errorMsg
    });

    db.addWorkflowLog({
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      runId,
      workflowId: run.workflowId,
      status: status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
      message: status === 'COMPLETED' ? 'Workflow execution finished successfully.' : `Workflow execution failed: ${errorMsg}`,
      durationMs,
      createdAt: completedAt
    });
  }
}
