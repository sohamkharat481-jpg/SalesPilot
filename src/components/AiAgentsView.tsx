import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Play, Pause, Terminal, Send, Cpu, Sliders, CheckCircle2, 
  Loader2, AlertCircle, RefreshCw, Layers, ShieldCheck, Zap, Search, 
  Calendar, FileText, BarChart3, TrendingUp, Check, Plus, Trash2, 
  Globe, Mail, Clock, HelpCircle, History, ChevronRight, Server, 
  ArrowRight, Shield, Upload, Database, Brain, BookOpen, Award, 
  DollarSign, Flame, Filter, Users, CheckSquare, FileSpreadsheet, 
  Layers2, FileSignature, MessageSquare, Info, AlertTriangle, Eye, ArrowUpRight
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  codename: string;
  role: string;
  description: string;
  model: string;
  status: 'ACTIVE' | 'IDLE' | 'PAUSED' | 'OFFLINE';
  accuracy: string;
  speed: string;
  tasksDone: number;
  tokensUsed: string;
  currentTask: string;
  icon: any;
  history: string[];
  logs: string[];
}

export function AiAgentsView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'playgrounds' | 'workflows' | 'chat' | 'prompts' | 'knowledge' | 'recommendations'>('dashboard');

  // --- CORE SYSTEM STATE ---
  const [agents, setAgents] = useState<AIAgent[]>([
    { 
      id: 'agt-lead-finder', 
      name: 'Google Maps Spider', 
      codename: 'LEAD_FINDER', 
      role: 'Autonomous Lead & Prospecting Scout',
      description: 'Scrapes LinkedIn, Crunchbase, and public web directories to locate accounts matching target ICP parameters.', 
      model: 'gemini-3.5-flash', 
      status: 'ACTIVE', 
      accuracy: '98.4%', 
      speed: '1.4s', 
      tasksDone: 4120, 
      tokensUsed: '1.2M', 
      currentTask: 'Scanning startup registries for Bangalore-based FinTech companies (11-50 employees)...',
      icon: Search,
      history: [
        '[1 hour ago] Sourced 14 marketing agencies in Mumbai.',
        '[3 hours ago] Sourced 8 logistics leads in Chennai.',
        '[Yesterday] Extracted 42 SaaS companies matching criteria.'
      ],
      logs: [
        '[08:12:15] [INFO] Scraping public directories for target sector: FinTech',
        '[08:12:18] [INFO] Filtered by size (11-50 employees). Sourced 24 active candidate domains.',
        '[08:12:22] [SUCCESS] Sourced 24 hot lead profiles and exported to CRM buffer memory.'
      ]
    },
    { 
      id: 'agt-research', 
      name: 'Vesper Analyst', 
      codename: 'RESEARCH_AGENT', 
      role: 'Lead Telemetry & Enrichment Specialist',
      description: 'Inspects target company websites, tech stacks, recent news, and job listings to locate hyper-focused outreach angles.', 
      model: 'gemini-3.5-flash', 
      status: 'ACTIVE', 
      accuracy: '94.2%', 
      speed: '2.8s', 
      tasksDone: 2150, 
      tokensUsed: '4.5M', 
      currentTask: 'Analyzing AWS tech stack and security posture for Apex Solutions...',
      icon: Globe,
      history: [
        '[1 hour ago] Analyzed AWS architecture for StellarTech Labs.',
        '[4 hours ago] Found company headcount expansion trend for Zylker Corp.',
        '[Yesterday] Researched 24 Bangalore FinTech websites.'
      ],
      logs: [
        '[08:12:23] [INFO] Scanning technology presence of apexmarketing.in',
        '[08:12:25] [INFO] Sourced engineering stack: AWS Cognito, React, Tailwind, PostgreSQL',
        '[08:12:28] [SUCCESS] Compiled 4 personalization hooks based on recent quarterly expansion blog.'
      ]
    },
    { 
      id: 'agt-email-writer', 
      name: 'Vinci Copywriter', 
      codename: 'EMAIL_WRITER', 
      role: 'AI Copywriter & Creative Composer',
      description: 'Drafts highly personalized cold and warm email copies using company telemetry, scoring high on open-rates.', 
      model: 'gemini-3.5-flash', 
      status: 'ACTIVE', 
      accuracy: '91.5%', 
      speed: '0.9s', 
      tasksDone: 3890, 
      tokensUsed: '2.1M', 
      currentTask: 'Drafting personalized cold email campaign copy for Bangalore Fintech leads...',
      icon: Mail,
      history: [
        '[2 hours ago] Prepared customized secondary reminder sequence for Apex.',
        '[5 hours ago] Re-wrote outreach scripts for Chennai startup segment.',
        '[Yesterday] Composed 15 personalized introductory pitch templates.'
      ],
      logs: [
        '[08:12:29] [INFO] Retrieving company hooks from Vesper Memory Segment...',
        '[08:12:31] [INFO] Framing custom value: "Automate outbound workload with local-INR billing compliance"',
        '[08:12:33] [SUCCESS] Composed 2 alternative cold templates with dynamic subject line validation.'
      ]
    },
    { 
      id: 'agt-outreach', 
      name: 'Hermes Postman', 
      codename: 'OUTREACH_AGENT', 
      role: 'Campaign Dispatcher & Deliverability Optimizer',
      description: 'Manages SMTP routing schedules, outbound channels, and sends personalized sequences while protecting IP health.', 
      model: 'gemini-3.5-flash', 
      status: 'ACTIVE', 
      accuracy: '99.1%', 
      speed: '0.4s', 
      tasksDone: 12410, 
      tokensUsed: '0.4M', 
      currentTask: 'Throttling cold campaign emails to maintain pristine SMTP deliverability score (Interval: 120s)...',
      icon: Send,
      history: [
        '[1 hour ago] Transmitted 12 cold pitches to Mumbai marketing targets.',
        '[3 hours ago] Re-calibrated warm-up schedule on SMTP node #2.',
        '[Yesterday] Delivered 54 messages with 0 bounces recorded.'
      ],
      logs: [
        '[08:12:34] [INFO] Queueing 8 pending pitches for Bangalore FinTech leads',
        '[08:12:36] [INFO] Transmitting customized pitch envelope to preeti@senfinance.in',
        '[08:12:37] [SUCCESS] SMTP envelope accepted. ID: <3829-2321>. Dispatch verified.'
      ]
    },
    { 
      id: 'agt-reply-agent', 
      name: 'Aero Responder', 
      codename: 'REPLY_AGENT', 
      role: 'Outbound Response Intent & Action Classifier',
      description: 'Monitors incoming replies, detects sentiment/buying signs, recommends followups, and drafts dynamic responses.', 
      model: 'gemini-3.1-pro', 
      status: 'ACTIVE', 
      accuracy: '96.3%', 
      speed: '1.1s', 
      tasksDone: 1940, 
      tokensUsed: '1.9M', 
      currentTask: 'Parsing active inbox thread for Apex Marketing to formulate followup sequence...',
      icon: MessageSquare,
      history: [
        '[10m ago] Classified positive intent email from Priya Sen.',
        '[2h ago] Tagged spam bounce for non-existent target address.',
        '[Yesterday] Auto-responded to 5 out-of-office vacation notices.'
      ],
      logs: [
        '[08:14:11] [INFO] Connection confirmed to Gmail IMAP server.',
        '[08:14:15] [INFO] Scanned 12 incoming corporate response messages.',
        '[08:14:20] [SUCCESS] Sourced 1 high-intent reply: Interested in Scheduling Demo. Suggested booking action dispatched.'
      ]
    },
    { 
      id: 'agt-appointment', 
      name: 'Kratos Scheduler', 
      codename: 'APPOINTMENT_SETTER', 
      role: 'Conversational Intent Booking Assistant',
      description: 'Parses incoming replies for booking intent, coordinates available times, and creates Google Meet appointments.', 
      model: 'gemini-3.1-pro', 
      status: 'IDLE', 
      accuracy: '97.6%', 
      speed: '1.5s', 
      tasksDone: 720, 
      tokensUsed: '0.9M', 
      currentTask: 'Listening on sales inbox sockets for scheduled demo confirmation hooks...',
      icon: Calendar,
      history: [
        '[Yesterday] Scheduled demo alignment with Rajesh Kumar (Apex Marketing).',
        '[2 days ago] Confirmed Google Meet session with Preeti Sen (Sen Finance).',
        '[3 days ago] Re-aligned available slot constraints with Vikram Rao.'
      ],
      logs: [
        '[07:45:12] [INFO] Reviewing incoming reply mail from ananya@apexmarketing.in',
        '[07:45:15] [INFO] Sourced positive intent: BOOKING_REQUEST (Preferred slots: Thursday 3 PM)',
        '[07:45:17] [SUCCESS] Booked Google Meet slot. Invites transmitted to ananya@apexmarketing.in'
      ]
    },
    { 
      id: 'agt-proposal', 
      name: 'Scribe Generator', 
      codename: 'PROPOSAL_GENERATOR', 
      role: 'Enterprise Proposal & Quote Compiler',
      description: 'Generates polished, context-aware PDF enterprise proposals, custom agreements, and pricing quotes.', 
      model: 'gemini-3.1-pro', 
      status: 'IDLE', 
      accuracy: '93.0%', 
      speed: '3.2s', 
      tasksDone: 150, 
      tokensUsed: '3.2M', 
      currentTask: 'Standing by for closed-negotiation triggers to compile enterprise contracts...',
      icon: FileText,
      history: [
        '[Yesterday] Rendered Horizon_Media_SaaS_Outbound_Proposal.pdf.',
        '[3 days ago] Created technical AWS Security checklist for StellarTech Labs.',
        '[Last week] Compiled pricing agreement template for Zylker Systems.'
      ],
      logs: [
        '[17:20:00] [INFO] Extracting custom pricing schemas and contract variables from CRM',
        '[17:20:03] [INFO] Initializing PDF layout rendering engine with enterprise CSS theme',
        '[17:20:06] [SUCCESS] Succeeded in generating PDF proposal asset. Saved to Apex document storage.'
      ]
    },
    { 
      id: 'agt-crm', 
      name: 'Atlas Manager', 
      codename: 'CRM_MANAGER', 
      role: 'Pipeline Sync & Contact Lifecycle Coordinator',
      description: 'Maintains lead stages, logs outbound actions, cleans duplicate data, and synchronizes with Supabase.', 
      model: 'gemini-3.5-flash', 
      status: 'ACTIVE', 
      accuracy: '99.9%', 
      speed: '0.5s', 
      tasksDone: 18920, 
      tokensUsed: '0.2M', 
      currentTask: 'Synchronizing latest pipeline updates with cloud databases...',
      icon: Layers,
      history: [
        '[1 hour ago] Synced 24 lead updates from Google Maps Spider.',
        '[3 hours ago] Logged demo call notes for Rajesh Kumar deal card.',
        '[Yesterday] Cleared 12 duplicate email contacts from active lists.'
      ],
      logs: [
        '[08:12:38] [INFO] Beginning Postgres atomic transaction update for leads table',
        '[08:12:40] [INFO] Inserted 24 new FinTech records into table public.crm_pipeline',
        '[08:12:41] [SUCCESS] Supabase transaction verified and cached. State is in perfect sync.'
      ]
    },
    { 
      id: 'agt-reporting', 
      name: 'Chronos Reporter', 
      codename: 'REPORTING_AGENT', 
      role: 'Automated Briefing & Performance Reporter',
      description: 'Aggregates campaign telemetry, reply stats, and pipeline metrics into beautiful daily briefings.', 
      model: 'gemini-3.5-flash', 
      status: 'IDLE', 
      accuracy: '96.5%', 
      speed: '2.5s', 
      tasksDone: 680, 
      tokensUsed: '1.5M', 
      currentTask: 'Aggregating active campaign conversion charts for corporate briefing...',
      icon: BarChart3,
      history: [
        '[This morning] Sent Daily Performance report to CEO inbox.',
        '[Yesterday] Dispatched Weekly Pipeline Progression digest.',
        '[Last month] Prepared June Conversion ROI audit spreadsheet.'
      ],
      logs: [
        '[06:00:00] [INFO] Pulling live outreach telemetry from database analytics cluster',
        '[06:00:03] [INFO] Aggregated 5 completed appointments and 14 qualified prospects',
        '[06:00:05] [SUCCESS] Compiled Daily Executive Summary. Emailed PDF brief to admins.'
      ]
    },
    { 
      id: 'agt-analytics', 
      name: 'Newton Analyst', 
      codename: 'ANALYTICS_AGENT', 
      role: 'Outreach ROI & Statistics Optimizer',
      description: 'Calculates predictive close probabilities, cohort regressions, and optimizes active copy suggestions.', 
      model: 'gemini-3.5-flash', 
      status: 'ACTIVE', 
      accuracy: '98.2%', 
      speed: '1.8s', 
      tasksDone: 1240, 
      tokensUsed: '2.8M', 
      currentTask: 'Calculating performance regressions on subject line open rates...',
      icon: TrendingUp,
      history: [
        '[2 hours ago] Generated Bangalore vs Mumbai lead conversion comparison charts.',
        '[Yesterday] Analyzed delivery reputation statistics for outbound email IP.',
        '[3 days ago] Prepared conversion probability matrix variables for CRM UI.'
      ],
      logs: [
        '[08:11:00] [INFO] Calculating subject line sentiment regressions for sector: FinTech',
        '[08:11:05] [INFO] Sourced: Subject lines with "outsource" yield 18% lower response score',
        '[08:11:08] [SUCCESS] Completed recommendations. Shared context optimization parameters with Vinci.'
      ]
    }
  ]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>('agt-lead-finder');

  const selectedAgent = useMemo(() => {
    return agents.find(ag => ag.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // Global fleet statistics
  const fleetStats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'ACTIVE').length;
    const idle = agents.filter(a => a.status === 'IDLE').length;
    const completedTasks = agents.reduce((sum, a) => sum + a.tasksDone, 0);
    const failedTasks = Math.round(completedTasks * 0.015); // Simulated error rate
    const totalTokensUsed = agents.reduce((sum, a) => sum + parseFloat(a.tokensUsed.replace('M', '')) * 1000000, 0);
    const totalAiCost = (totalTokensUsed / 1000000) * 1.5; // $1.5 per Million tokens
    return { total, active, idle, completedTasks, failedTasks, totalAiCost };
  }, [agents]);

  // Inter-Agent Collaboration Stream logs
  const [collaborationLogs, setCollaborationLogs] = useState<string[]>([
    '[00:01:10] Google Maps Spider triggered. Found 24 Bangalore FinTech target profiles.',
    '[00:01:15] Google Maps Spider sent 24 domains to Vesper Analyst buffer pipeline.',
    '[00:01:25] Vesper Analyst successfully generated AWS Stack checklists and news summaries for 24 leads.',
    '[00:01:26] Vesper Analyst handed off company insights context to Vinci Copywriter.',
    '[00:01:38] Vinci Copywriter generated 2 alternative email pitch variations with high-fidelity compliant pricing hooks.',
    '[00:01:39] Vinci Copywriter saved copies directly into Campaign Drip Draft slots.',
    '[00:01:45] Atlas Manager synced 24 lead records & enriched fields directly into Supabase CRM database.',
    '[00:02:10] Chronos Reporter compiled nightly conversion regression charts. Sent to admin.'
  ]);

  const addCollaborationLog = (text: string) => {
    setCollaborationLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev].slice(0, 50));
  };

  // --- TAB 2: AGENT PLAYGROUNDS STATE ---
  const [activePlaygroundAgent, setActivePlaygroundAgent] = useState<string>('agt-lead-finder');
  
  // Custom Playground Inputs
  const [leadFinderInput, setLeadFinderInput] = useState({ domain: 'senfinance.in', geo: 'Bangalore', industry: 'FinTech', count: 10 });
  const [researchInput, setResearchInput] = useState({ company: 'Apex Solutions', url: 'apexmarketing.in' });
  const [emailWriterInput, setEmailWriterInput] = useState({ leadName: 'Rajesh Kumar', company: 'Apex Marketing', painPoint: 'slow manual outreach', tone: 'Professional and Bold', abTesting: true });
  const [outreachInput, setOutreachInput] = useState({ sendInterval: 120, dailyLimit: 150, ipWarmup: true });
  const [replyInput, setReplyInput] = useState({ emailBody: 'Hi Vinci team, thanks for reaching out. We actually use a legacy Outbound CRM but are facing high bounce rates and bad timezone coordination in IST. Can you show me how your automated booking coordinates and integrates?' });
  const [appointmentInput, setAppointmentInput] = useState({ timeSlot: 'Thursday 3:00 PM IST', prospectEmail: 'priya@senfinance.in', syncCal: true });
  const [proposalInput, setProposalInput] = useState({ clientName: 'Apex Marketing LLC', value: '₹1,50,000/mo', duration: '6 Months', contractType: 'SOW + Software Licenses' });
  const [crmInput, setCrmInput] = useState({ leadId: 'lead_maps_129', nextStage: 'QUALIFIED', winProbability: 85, assignOwner: 'Rohan (Senior Outbound)' });
  const [analyticsInput, setAnalyticsInput] = useState({ reportType: 'Weekly Campaign Regression Digest', dateRange: 'Last 7 Days' });

  const [playgroundOutput, setPlaygroundOutput] = useState<any>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Playgrounds Execution Trigger
  const handleExecutePlayground = async () => {
    setIsPlayingTest(true);
    setPlaygroundOutput(null);
    
    // Quick artificial wait
    setTimeout(async () => {
      let output: any = {};
      const geminiKey = true; // Use server-backed response behavior representation

      switch (activePlaygroundAgent) {
        case 'agt-lead-finder':
          output = {
            status: 'SUCCESS',
            leadsSourced: [
              { fullName: 'Priya Sen', title: 'Director of Growth', email: `priya@${leadFinderInput.domain}`, company: 'Sen Finance', score: 94 },
              { fullName: 'Rajesh Mehta', title: 'Co-Founder', email: `rajesh@${leadFinderInput.domain}`, company: 'Sen Finance', score: 88 },
            ],
            removedDuplicates: 3,
            duplicatesPruned: ['admin@senfinance.in', 'info@senfinance.in'],
            syncedToCrm: true,
            analyticsPushed: true
          };
          addCollaborationLog(`Google Maps Spider discovered ${output.leadsSourced.length} verified leads for domain ${leadFinderInput.domain}. Duplicates pruned.`);
          break;

        case 'agt-research':
          output = {
            status: 'COMPLETED',
            summary: `${researchInput.company} is a leading digital services provider in India.`,
            painPoints: [
              'Lagging email deliverability across outdated SMTP sequences',
              'Siloed client booking pipelines leading to manual calendar scheduling overlaps',
              'High cost of manual data research'
            ],
            techStack: ['AWS', 'React', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
            buyingSignals: ['Active job opening for Senior Outbound Lead', 'Headcount expanded by 18% last quarter'],
            estimatedRevenue: '₹5 Cr - ₹10 Cr / Year',
            salesOpportunities: [
              'Position SalesPilot local INR compliant billing to bypass payment bottlenecks',
              'Introduce unified Google Meet slot booking integration'
            ]
          };
          addCollaborationLog(`Vesper Analyst generated 5-dimension research profile for ${researchInput.company}. Saved to CRM memory.`);
          break;

        case 'agt-email-writer':
          output = {
            status: 'SUCCESS',
            subjectLines: [
              { variation: 'A', text: `Automating ${emailWriterInput.company}'s outbound (with INR compliant billing) 🚀` },
              { variation: 'B', text: `Solving ${emailWriterInput.leadName}'s outreach pain points` }
            ],
            emailCopies: {
              coldEmail: `Hi ${emailWriterInput.leadName},\n\nI noticed ${emailWriterInput.company} is experiencing manual constraints on sales prospecting. Our automated AI operating system streamlines Indian B2B lists directly into custom email drafts.\n\nSince you are focusing on growth, would you be open to a quick 10-minute demo this Thursday?\n\nBest,\nSalesPilot AI`,
              followUp: `Hi ${emailWriterInput.leadName},\n\nJust wanted to share that companies similar to ${emailWriterInput.company} reduced manual data costs by 45% using Vinci automated copies. Let me know if you would like me to book a slot.\n\nBest,\nSalesPilot AI`
            },
            whatsappTemplate: `Hello ${emailWriterInput.leadName}, this is SalesPilot AI. We drafted a personalized outreach proposal for ${emailWriterInput.company}. Do you have 2 minutes to review?`,
            linkedinMessage: `Hey ${emailWriterInput.leadName} - loved your recent post on team growth at ${emailWriterInput.company}. Would love to connect and share a tailored sequence we modeled for you!`,
            abTestingConfig: emailWriterInput.abTesting ? 'Enabled: Split outbound traffic 50% Variation A / 50% Variation B' : 'Disabled'
          };
          addCollaborationLog(`Vinci Copywriter composed personalized B2B sequence copy for ${emailWriterInput.leadName}. A/B variants configured.`);
          break;

        case 'agt-outreach':
          output = {
            status: 'ACTIVE',
            activeCampaignRate: '35 messages/hr',
            deliverySchedule: `Sends every ${outreachInput.sendInterval}s to protect domain IP reputation`,
            dailyDispatchCap: outreachInput.dailyLimit,
            ipWarmupStatus: outreachInput.ipWarmup ? 'WARMING - Incremental dispatch rate active (+10% daily)' : 'STABLE',
            replyTrackerActive: true,
            autoPauseOnPositiveReply: true,
            connectionNodes: ['SMTP Node Bangalore', 'Gmail OAuth Proxy Hub']
          };
          addCollaborationLog(`Hermes Postman updated IP warmup throttling and established drip interval at ${outreachInput.sendInterval}s.`);
          break;

        case 'agt-reply-agent':
          const isInterested = replyInput.emailBody.toLowerCase().includes('demo') || replyInput.emailBody.toLowerCase().includes('interest') || replyInput.emailBody.toLowerCase().includes('integrate');
          output = {
            status: 'SUCCESS',
            classifiedIntent: isInterested ? 'INTERESTED / MEETING_REQUEST' : 'NEED_MORE_INFO',
            confidence: '95.8%',
            sentiment: 'Highly Positive & Inquiry-driven',
            detectedPainPoint: 'Deliverability and Timezone Coordination',
            recommendedNextAction: 'Auto-book Google Meet slot using Kratos Scheduler and dispatch invitation',
            suggestedReplyDraft: `Hi Priya,\n\nThanks for your reply! It sounds like automated timezone coordination and secure deliverability are critical. Our Kratos Scheduler has slots available on Thursday at 3:00 PM IST (which resolves to your local timezone seamlessly).\n\nI have automatically locked that slot in for us. You will receive a Google Meet invite in 1 minute. Let's talk then!\n\nBest,\nSalesPilot AI`
          };
          addCollaborationLog(`Aero Responder classified prospect reply. Intent: ${output.classifiedIntent}. Suggested reply drafted.`);
          break;

        case 'agt-appointment':
          output = {
            status: 'BOOKED_CONFIRMED',
            googleCalendarSync: 'SUCCESS (Event pushed to primary calendar)',
            timezoneConversion: '3:00 PM IST ⇆ 5:30 AM EST',
            eventDetails: {
              summary: 'SalesPilot Demo Integration x Priya Sen',
              meetLink: 'https://meet.google.com/ugq-jlit-atc',
              durationMin: 30
            },
            smsReminderPayload: `Reminder: Your SalesPilot Demo is booked on ${appointmentInput.timeSlot}. Meet Link: https://meet.google.com/ugq-jlit-atc`,
            crmUpdated: true
          };
          addCollaborationLog(`Kratos Scheduler secured Google Meet demo slot for ${appointmentInput.prospectEmail}. Transmitted invitations.`);
          break;

        case 'agt-proposal':
          output = {
            status: 'GENERATED_VERSION_1_0',
            documentType: proposalInput.contractType,
            proposalMeta: {
              client: proposalInput.clientName,
              quotedValue: proposalInput.value,
              contractLength: proposalInput.duration,
              deliverables: [
                'Vinci AI copywriting sequence engine license',
                'Google Maps spider scraping credits (10,000/mo)',
                'Dedicated SMTP routing nodes with reputation monitors'
              ]
            },
            quotationDraftUrl: '#/preview-pdf-quote',
            invoiceDraftCode: `INV-${Date.now().toString().slice(-4)}`,
            statementOfWorkCode: `SOW-${Date.now().toString().slice(-4)}`,
            versionControlLog: [
              { version: 'v1.0', author: 'Scribe Generator', timestamp: new Date().toISOString() }
            ]
          };
          addCollaborationLog(`Scribe Generator completed enterprise SaaS quote for ${proposalInput.clientName}. Version 1.0 committed.`);
          break;

        case 'agt-crm':
          output = {
            status: 'CRM_SYNCED',
            assignedLeadOwner: crmInput.assignOwner,
            stageUpdate: `Advanced to ${crmInput.nextStage}`,
            predictedWinProbability: `${crmInput.winProbability}%`,
            estimatedPipelineValue: '₹9,00,000',
            automatedTasksCreated: [
              { title: 'Prepare custom slides for Thursday meeting', due: 'In 24h' },
              { title: 'Monitor SMTP warmup diagnostics', due: 'In 3 days' }
            ],
            projections: {
              quarterlyForecastContribution: '₹12,50,000',
              predictedCycleDays: 14
            }
          };
          addCollaborationLog(`Atlas Manager updated Lead ID ${crmInput.leadId} to stage ${crmInput.nextStage} with win probability ${crmInput.winProbability}%.`);
          break;

        case 'agt-analytics':
          output = {
            status: 'COMPILED_INSIGHTS',
            reportTitle: analyticsInput.reportType,
            deliveryRatePct: '99.4%',
            bounceRatePct: '0.6%',
            overallOpenRatePct: '68.2%',
            overallReplyRatePct: '22.8%',
            forecastRevenueInsights: {
              currentExpectedValue: '₹18,50,000',
              projectedGrowthNextMonth: '+14%'
            },
            campaignRecommendations: [
              'Increase outreach to FinTech sectors in Pune (currently yielding 42% reply rate)',
              'Phase out subject line option with word "Outsource" (replaces with "Automate")'
            ]
          };
          addCollaborationLog(`Newton Analyst compiled performance regression summaries for current active campaigns.`);
          break;
      }
      setIsPlayingTest(false);
      setPlaygroundOutput(output);
    }, 1200);
  };

  // --- TAB 3: AUTONOMOUS WORKFLOWS STATE ---
  const [enabledWorkflowStages, setEnabledWorkflowStages] = useState({
    leadFinder: true,
    research: true,
    emailWriter: true,
    managerApproval: false, // Wait for manual approval
    outreach: true,
    replyAnalyzer: true,
    scheduler: true,
    crmSync: true,
    analyticsDigest: true
  });

  const [workflowCron, setWorkflowCron] = useState('hourly');
  const [isCronRunning, setIsCronRunning] = useState(true);

  // Workflow live simulator
  const [isWfSimulating, setIsWfSimulating] = useState(false);
  const [wfSimStep, setWfSimStep] = useState<number>(-1);
  const [wfSimLogs, setWfSimLogs] = useState<string[]>([]);
  const [wfProgress, setWfProgress] = useState(0);

  const triggerWorkflowSimulation = () => {
    setIsWfSimulating(true);
    setWfSimStep(0);
    setWfProgress(5);
    setWfSimLogs([
      `[ORCHESTRATOR] Initializing SalesPilot Autonomous Master Loop...`,
      `[ORCHESTRATOR] Cron execution trigger activated. Frequency: ${workflowCron}`
    ]);

    const activeSteps = [
      { id: 'leadFinder', label: 'Lead Finder Agent', desc: 'Sourcing new corporate profiles...' },
      { id: 'research', label: 'Research Agent', desc: 'Retrieving tech stacks and buying signals...' },
      { id: 'emailWriter', label: 'Email Writer Agent', desc: 'Formulating high-conversion sequences...' },
      { id: 'managerApproval', label: 'Approval Step', desc: 'Awaiting manager check...' },
      { id: 'outreach', label: 'Outreach Agent', desc: 'Routing emails through SMTP dispatch nodes...' },
      { id: 'replyAnalyzer', label: 'Reply Analyzer Agent', desc: 'Scanning inbox for positive intent replies...' },
      { id: 'scheduler', label: 'Appointment Booker', desc: 'Syncing Google Calendar Meet slots...' },
      { id: 'crmSync', label: 'CRM Manager Agent', desc: 'Committing pipeline updates to Postgres...' },
      { id: 'analyticsDigest', label: 'Analytics Agent', desc: 'Recalculating ROI metrics...' }
    ].filter(step => enabledWorkflowStages[step.id as keyof typeof enabledWorkflowStages]);

    let idx = 0;
    const runStep = () => {
      if (idx >= activeSteps.length) {
        setTimeout(() => {
          setWfProgress(100);
          setWfSimStep(-1);
          setWfSimLogs(prev => [...prev, `[SUCCESS] Master Loop execution complete. All pipelines updated and synchronized.`]);
          setIsWfSimulating(false);
          // Increment completed task counters
          setAgents(prev => prev.map(ag => ({ ...ag, tasksDone: ag.tasksDone + 5 })));
        }, 1200);
        return;
      }

      const stepObj = activeSteps[idx];
      setWfSimStep(idx);
      setWfProgress(Math.round(((idx + 1) / activeSteps.length) * 100));
      setWfSimLogs(prev => [...prev, `[RUNNING] ${stepObj.label}: ${stepObj.desc}`]);

      setTimeout(() => {
        setWfSimLogs(prev => [...prev, `[SUCCESS] ${stepObj.label} compiled and advanced state successfully.`]);
        idx++;
        runStep();
      }, 1000);
    };

    setTimeout(runStep, 800);
  };

  // --- TAB 4: CHAT & MEMORY STATE ---
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hi! I am the SalesPilot Assistant. I have active context of all Past CRM Conversations, previous emails, company files, and research. Ask me anything about your campaigns or pipeline!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await fetch('/api/v1/ai/ask-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText, leadsCount: 45, campaignsCount: 3, dealsValue: 1250000 })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'bot', text: data.answer || 'I am processing your outbound request.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: `I processed "${userText}" using offline local memory: Hot lead "Rajesh" is classified as high close probability (85%). Shifting sequences to target Pune-based marketing decision makers tomorrow morning.` }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // --- TAB 5: PROMPT LIBRARY STATE ---
  const [promptsList, setPromptsList] = useState([
    { id: 'p1', name: 'Standard Cold Introduction', category: 'Outbound Pitch', promptText: 'Introduce SalesPilot and suggest a quick demo to {{leadName}} at {{companyName}} addressing {{painPoint}}.', version: 'v1.2', updated: '2 days ago' },
    { id: 'p2', name: 'Pain Point Centered Drip', category: 'Follow-Up Sequence', promptText: 'Emphasize local-INR compliant billing module and reduced manual research cost for {{companyName}}.', version: 'v1.0', updated: '5 days ago' },
    { id: 'p3', name: 'Urgent Google Meet Reservation', category: 'Meeting Booking', promptText: 'Offer slots for Thursday 3 PM and request a secure slot confirmation from {{leadName}}.', version: 'v1.1', updated: '1 week ago' }
  ]);
  const [newPrompt, setNewPrompt] = useState({ name: '', category: 'Outbound Pitch', promptText: '' });
  const [promptVariablesPreview, setPromptVariablesPreview] = useState({ leadName: 'Soham Kharat', companyName: 'Sen Finance', painPoint: 'deliverability drops' });

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.name || !newPrompt.promptText) return;
    const item = {
      id: `p_${Date.now()}`,
      name: newPrompt.name,
      category: newPrompt.category,
      promptText: newPrompt.promptText,
      version: 'v1.0',
      updated: 'Just now'
    };
    setPromptsList(prev => [...prev, item]);
    setNewPrompt({ name: '', category: 'Outbound Pitch', promptText: '' });
    addCollaborationLog(`Added new Prompt template "${item.name}" to Organization Library.`);
  };

  const compiledPromptPreview = (promptText: string) => {
    let out = promptText;
    out = out.replace(/\{\{leadName\}\}/g, promptVariablesPreview.leadName);
    out = out.replace(/\{\{companyName\}\}/g, promptVariablesPreview.companyName);
    out = out.replace(/\{\{painPoint\}\}/g, promptVariablesPreview.painPoint);
    return out;
  };

  // --- TAB 6: KNOWLEDGE BASE STATE ---
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState([
    { id: 'f1', name: 'SalesPilot_Enterprise_Pricing.pdf', size: '1.2 MB', source: 'Manual PDF Upload', status: 'INDEXED', date: '3 days ago' },
    { id: 'f2', name: 'https://salespilot.ai/case-studies-bangalore-fintechs', size: 'N/A', source: 'Scraped Website URL', status: 'INDEXED', date: 'Yesterday' },
    { id: 'f3', name: 'Product_Specifications_v2.docx', size: '640 KB', source: 'Google Drive Sync', status: 'INDEXED', date: '5 days ago' }
  ]);
  const [kbQuery, setKbQuery] = useState('');
  const [kbSearchOutput, setKbSearchOutput] = useState<string | null>(null);
  const [isKbSearching, setIsKbSearching] = useState(false);
  const [uploadUrlInput, setUploadUrlInput] = useState('');

  const handleSearchKnowledge = () => {
    if (!kbQuery.trim()) return;
    setIsKbSearching(true);
    setKbSearchOutput(null);

    setTimeout(() => {
      let matchedText = '';
      if (kbQuery.toLowerCase().includes('price') || kbQuery.toLowerCase().includes('tier') || kbQuery.toLowerCase().includes('cost')) {
        matchedText = `Found match in "SalesPilot_Enterprise_Pricing.pdf" (Section 3.1):\n"Enterprise license pricing is set at ₹1,50,000/mo. For cohorts exceeding 10 connected agents, a 15% discount is applied automatically."`;
      } else if (kbQuery.toLowerCase().includes('fintech') || kbQuery.toLowerCase().includes('study')) {
        matchedText = `Found match in URL "https://salespilot.ai/case-studies-bangalore-fintechs":\n"Indian FinTech companies achieved a 42% average outbound open rate. Aligning sequences with automated booking links reduced demo cycles by 6 business days."`;
      } else {
        matchedText = `Found relevant content inside "Product_Specifications_v2.docx" (Section 1.4):\n"All outbound SMTP nodes execute smart throttling delays of 120s between dispatches to preserve deliverability scores above 98%."`;
      }
      setKbSearchOutput(matchedText);
      setIsKbSearching(false);
    }, 900);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrlInput.trim()) return;
    const item = {
      id: `f_${Date.now()}`,
      name: uploadUrlInput,
      size: 'N/A',
      source: 'Scraped Website URL',
      status: 'INDEXED',
      date: 'Just now'
    };
    setKnowledgeBaseFiles(prev => [...prev, item]);
    setUploadUrlInput('');
    addCollaborationLog(`Indexed new corporate document resource: "${item.name}"`);
  };

  // --- TAB 7: AI RECOMMENDATION STATE ---
  const [recommendations, setRecommendations] = useState([
    { title: 'Best Performing Industry Target', value: 'FinTech (Bangalore & Pune)', metric: '42% Response rate', reason: 'Recent Series A headcount expansions combined with automated GST invoice billing requirements.', icon: TrendingUp },
    { title: 'Optimal Campaign Delivery Time', value: '9:30 AM - 11:30 AM IST', metric: '68% Open rate', reason: 'Prospects consistently check inbox backlogs during morning standups. Decreases weekend latency.', icon: Clock },
    { title: 'Highest Converting Offer Trigger', value: 'INR-compliant billing demo', metric: '34% Conversion lift', reason: 'Indian SaaS prospects show high friction when paying foreign USD card fees. Shifting pitch to local invoice payment is highly effective.', icon: Award },
    { title: 'Best Performing Email Subject', value: 'Automating {{companyName}} GST outbound', metric: '74% Open rate', reason: 'High customization combined with direct compliance pain points generates natural urgency.', icon: Mail }
  ]);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);

  const handleRefreshRecommendations = () => {
    setIsRefreshingRecs(true);
    setTimeout(() => {
      setRecommendations(prev => [
        { title: 'Best Performing Industry Target', value: 'Logistics & Supply Chain (Chennai)', metric: '48% Response rate', reason: 'Google Maps Spider detected a 30% spike in export licensing queries in Tamil Nadu logistics directories.', icon: TrendingUp },
        ...prev.slice(0, 3)
      ]);
      setIsRefreshingRecs(false);
      addCollaborationLog('Newton Analyst refreshed recommendation heuristics and updated target segments.');
    }, 1000);
  };

  return (
    <div id="ai_operating_system" className="space-y-6 text-slate-800 dark:text-slate-100 max-w-7xl mx-auto">
      
      {/* 18-MODULE COMMAND HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" /> SalesPilot AI Operating System
            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-900/50">ENTERPRISE CORE</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A comprehensive, multi-agent orchestrator managing leads, research, copies, outreach, replies, and calendar bookings autonomously.
          </p>
        </div>

        {/* Global Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/60 rounded-lg text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Fleet</div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              {fleetStats.active} Agents
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/60 rounded-lg text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Completed Tasks</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{(fleetStats.completedTasks).toLocaleString()}</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/60 rounded-lg text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Failed Tasks</div>
            <div className="text-sm font-bold font-mono text-rose-500">{fleetStats.failedTasks} <span className="text-[10px] text-slate-400 font-mono">(1.5%)</span></div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/60 rounded-lg text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Month AI Cost</div>
            <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">₹{(fleetStats.totalAiCost * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* SUITE NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Fleet Dashboard', icon: Cpu },
          { id: 'playgrounds', label: 'Agent Playgrounds', icon: Sliders },
          { id: 'workflows', label: 'Autonomous Loops', icon: Zap },
          { id: 'chat', label: 'AI Memory Chat', icon: MessageSquare },
          { id: 'prompts', label: 'Prompt Library', icon: BookOpen },
          { id: 'knowledge', label: 'Knowledge Base', icon: Database },
          { id: 'recommendations', label: 'AI Advice Engine', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 font-medium text-xs flex items-center gap-2 border-b-2 shrink-0 transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-100/50 dark:bg-slate-850/50 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODULE 1: FLEET DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Interactive Fleet List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Cognitive Agents Registry</span>
              <span className="text-[10px] text-slate-500 font-mono">Select agent to configure individual parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agents.map((ag) => {
                const Icon = ag.icon;
                const isSelected = selectedAgentId === ag.id;
                let statusColor = 'bg-slate-400';
                let textCol = 'text-slate-500';
                if (ag.status === 'ACTIVE') {
                  statusColor = 'bg-emerald-500 animate-pulse';
                  textCol = 'text-emerald-700 dark:text-emerald-400';
                } else if (ag.status === 'IDLE') {
                  statusColor = 'bg-amber-400';
                  textCol = 'text-amber-600 dark:text-amber-400';
                } else if (ag.status === 'PAUSED') {
                  statusColor = 'bg-red-500';
                  textCol = 'text-red-600 dark:text-red-400';
                }

                return (
                  <div
                    key={ag.id}
                    onClick={() => setSelectedAgentId(ag.id)}
                    className={`p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between h-[180px] hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/30 bg-blue-50/10' 
                        : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-350'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                          <span className={`text-[9px] font-mono font-bold uppercase ${textCol}`}>{ag.status}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white">{ag.name}</h3>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{ag.codename}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{ag.description}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-850 text-[10px] font-mono text-slate-400">
                      <span>Tasks: <strong>{ag.tasksDone}</strong></span>
                      <span>Accuracy: <strong className="text-emerald-600">{ag.accuracy}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Agent Diagnostic Control Pane */}
          <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex gap-3 border-b border-slate-150 dark:border-slate-850 pb-4">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                {React.createElement(selectedAgent.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{selectedAgent.name} Core</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{selectedAgent.codename}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">State Config</label>
                <div className="flex gap-2">
                  <select
                    value={selectedAgent.status}
                    onChange={(e) => {
                      const updated = [...agents];
                      const idx = updated.findIndex(a => a.id === selectedAgent.id);
                      if (idx !== -1) {
                        updated[idx].status = e.target.value as any;
                        setAgents(updated);
                        addCollaborationLog(`${selectedAgent.name} status updated to ${e.target.value}.`);
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 font-mono text-xs cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="IDLE">IDLE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Active NLP Directives</label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono text-[10px] border border-slate-150 dark:border-slate-800/60 leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedAgent.currentTask}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-800/50">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Inference Gateway</div>
                  <div className="font-semibold text-xs mt-0.5">{selectedAgent.model}</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-800/50">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Latent Speed</div>
                  <div className="font-semibold text-xs mt-0.5">{selectedAgent.speed}</div>
                </div>
              </div>

              {/* Logs Sandbox Terminal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Agent Diagnostics Console
                  </span>
                  <button
                    onClick={() => {
                      const updated = [...agents];
                      const idx = updated.findIndex(a => a.id === selectedAgent.id);
                      if (idx !== -1) {
                        updated[idx].logs = [`[INFO] Telemetry console cleared.`];
                        setAgents(updated);
                      }
                    }}
                    className="text-[9px] font-mono text-slate-500 hover:text-slate-350"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-850 font-mono text-[10px] leading-relaxed space-y-1.5 h-32 overflow-y-auto">
                  {selectedAgent.logs.map((logLine, index) => (
                    <div key={index} className={logLine.includes('[SUCCESS]') ? 'text-emerald-400' : logLine.includes('[INFO]') ? 'text-cyan-400' : 'text-slate-300'}>
                      {logLine}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inter-Agent Stream */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Inter-Agent Collaboration Stream</span>
                <div className="bg-slate-950 text-slate-400 p-4 rounded-xl border border-slate-850 font-mono text-[9px] leading-relaxed space-y-1.5 h-32 overflow-y-auto">
                  {collaborationLogs.map((log, index) => (
                    <div key={index} className="border-b border-slate-900/60 pb-1 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AGENT PLAYGROUNDS (MODULES 2 - 10) */}
      {/* ======================================================== */}
      {activeTab === 'playgrounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Navigation: Select Agent Module to Test */}
          <div className="lg:col-span-4 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" /> Interactive Playgrounds
            </h3>
            <p className="text-xs text-slate-500 mb-4">Choose a specialized agent module to configure parameters and execute real or simulated testing.</p>
            
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto scrollbar-none pr-1">
              {[
                { id: 'agt-lead-finder', label: 'Module 2: AI Lead Finder', desc: 'Finds companies & target decision makers' },
                { id: 'agt-research', label: 'Module 3: AI Research Agent', desc: 'Slices company news, tech stacks, opportunities' },
                { id: 'agt-email-writer', label: 'Module 4: AI Email Writer', desc: 'Generates localized cold drip templates' },
                { id: 'agt-outreach', label: 'Module 5: AI Outreach Agent', desc: 'Configures SMTP delays & send throttle caps' },
                { id: 'agt-reply-agent', label: 'Module 6: AI Reply Agent', desc: 'Analyzes intents & recommends answers' },
                { id: 'agt-appointment', label: 'Module 7: AI Appointment Agent', desc: 'Google Calendar timezone scheduler' },
                { id: 'agt-proposal', label: 'Module 8: AI Proposal Agent', desc: 'Generates quote, invoice drafts, agreements' },
                { id: 'agt-crm', label: 'Module 9: AI CRM Agent', desc: 'Predicts win weights & updates pipelines' },
                { id: 'agt-analytics', label: 'Module 10: AI Analytics Agent', desc: 'Compiles A/B campaigns regressions' }
              ].map((playAgent) => (
                <button
                  key={playAgent.id}
                  onClick={() => {
                    setActivePlaygroundAgent(playAgent.id);
                    setPlaygroundOutput(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer block ${
                    activePlaygroundAgent === playAgent.id
                      ? 'border-blue-600 bg-blue-50/15 font-semibold text-blue-700 dark:text-blue-400'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div>{playAgent.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{playAgent.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Input / Output Workspace */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                  {agents.find(a => a.id === activePlaygroundAgent)?.name} Playground
                </h3>
                <p className="text-xs text-slate-400 font-mono">Execute testing of cognitive boundaries</p>
              </div>
              <button
                onClick={handleExecutePlayground}
                disabled={isPlayingTest}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isPlayingTest ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-white" />
                    Run Live Test
                  </>
                )}
              </button>
            </div>

            {/* --- PLAYGROUND INPUT FORMS --- */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Configure Input Parameters</span>

              {activePlaygroundAgent === 'agt-lead-finder' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Target Domain</label>
                    <input type="text" value={leadFinderInput.domain} onChange={(e) => setLeadFinderInput({ ...leadFinderInput, domain: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Target Geo</label>
                    <input type="text" value={leadFinderInput.geo} onChange={(e) => setLeadFinderInput({ ...leadFinderInput, geo: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Target Industry</label>
                    <input type="text" value={leadFinderInput.industry} onChange={(e) => setLeadFinderInput({ ...leadFinderInput, industry: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Lead Count</label>
                    <input type="number" value={leadFinderInput.count} onChange={(e) => setLeadFinderInput({ ...leadFinderInput, count: parseInt(e.target.value) || 5 })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-research' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Company Name</label>
                    <input type="text" value={researchInput.company} onChange={(e) => setResearchInput({ ...researchInput, company: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Corporate Website URL</label>
                    <input type="text" value={researchInput.url} onChange={(e) => setResearchInput({ ...researchInput, url: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-email-writer' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Lead Name</label>
                      <input type="text" value={emailWriterInput.leadName} onChange={(e) => setEmailWriterInput({ ...emailWriterInput, leadName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Company</label>
                      <input type="text" value={emailWriterInput.company} onChange={(e) => setEmailWriterInput({ ...emailWriterInput, company: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tone Pitch</label>
                      <input type="text" value={emailWriterInput.tone} onChange={(e) => setEmailWriterInput({ ...emailWriterInput, tone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input type="checkbox" id="abTestCheck" checked={emailWriterInput.abTesting} onChange={(e) => setEmailWriterInput({ ...emailWriterInput, abTesting: e.target.checked })} className="text-blue-600 rounded" />
                    <label htmlFor="abTestCheck" className="text-[10px] text-slate-500 font-mono">Enable A/B testing multi-sequence variance generation</label>
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-outreach' && (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Dispatch Interval (Seconds)</label>
                    <input type="number" value={outreachInput.sendInterval} onChange={(e) => setOutreachInput({ ...outreachInput, sendInterval: parseInt(e.target.value) || 60 })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Daily Cap Limit</label>
                    <input type="number" value={outreachInput.dailyLimit} onChange={(e) => setOutreachInput({ ...outreachInput, dailyLimit: parseInt(e.target.value) || 100 })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="warmupCheck" checked={outreachInput.ipWarmup} onChange={(e) => setOutreachInput({ ...outreachInput, ipWarmup: e.target.checked })} />
                    <label htmlFor="warmupCheck" className="text-[10px] text-slate-400">IP Reputation Warmup</label>
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-reply-agent' && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Paste Incoming Email Body</label>
                  <textarea rows={3} value={replyInput.emailBody} onChange={(e) => setReplyInput({ ...replyInput, emailBody: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs font-medium leading-relaxed" />
                </div>
              )}

              {activePlaygroundAgent === 'agt-appointment' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Preferred Slot Time</label>
                    <input type="text" value={appointmentInput.timeSlot} onChange={(e) => setAppointmentInput({ ...appointmentInput, timeSlot: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Prospect Email</label>
                    <input type="text" value={appointmentInput.prospectEmail} onChange={(e) => setAppointmentInput({ ...appointmentInput, prospectEmail: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-proposal' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Client Legal Name</label>
                    <input type="text" value={proposalInput.clientName} onChange={(e) => setProposalInput({ ...proposalInput, clientName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Pricing Value</label>
                    <input type="text" value={proposalInput.value} onChange={(e) => setProposalInput({ ...proposalInput, value: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Contract Duration</label>
                    <input type="text" value={proposalInput.duration} onChange={(e) => setProposalInput({ ...proposalInput, duration: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Contract Type</label>
                    <input type="text" value={proposalInput.contractType} onChange={(e) => setProposalInput({ ...proposalInput, contractType: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-crm' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Target Lead ID</label>
                    <input type="text" value={crmInput.leadId} onChange={(e) => setCrmInput({ ...crmInput, leadId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Advance CRM Stage</label>
                    <input type="text" value={crmInput.nextStage} onChange={(e) => setCrmInput({ ...crmInput, nextStage: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Win Weight (%)</label>
                    <input type="number" value={crmInput.winProbability} onChange={(e) => setCrmInput({ ...crmInput, winProbability: parseInt(e.target.value) || 80 })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Assign CRM Owner</label>
                    <input type="text" value={crmInput.assignOwner} onChange={(e) => setCrmInput({ ...crmInput, assignOwner: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                </div>
              )}

              {activePlaygroundAgent === 'agt-analytics' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Performance Report Type</label>
                    <input type="text" value={analyticsInput.reportType} onChange={(e) => setAnalyticsInput({ ...analyticsInput, reportType: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Historical Analytics Range</label>
                    <input type="text" value={analyticsInput.dateRange} onChange={(e) => setAnalyticsInput({ ...analyticsInput, dateRange: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                  </div>
                </div>
              )}
            </div>

            {/* Playground Execution Output Console */}
            <div className="space-y-2.5 pt-4 border-t border-slate-150 dark:border-slate-850">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Agent Output Streams</span>
              
              {playgroundOutput ? (
                <div className="p-5 bg-slate-950 text-slate-300 rounded-xl border border-slate-850 font-mono text-xs leading-relaxed space-y-3 max-h-96 overflow-y-auto shadow-inner">
                  <div className="flex justify-between border-b border-slate-900 pb-2 text-[10px] text-emerald-400 font-bold">
                    <span>STATUS: {playgroundOutput.status || 'SUCCESS'}</span>
                    <span>COGNITION_VERIFIED: YES</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(playgroundOutput, null, 2)}</pre>
                </div>
              ) : (
                <div className="p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 font-mono text-xs">
                  {isPlayingTest ? 'Processing token request via Gemini Inference Gateway...' : ' стояние: IDLE. Ready for outbound agent execution.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 13: AUTONOMOUS WORKFLOWS */}
      {/* ======================================================== */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Workflow configuration toggles */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600 animate-bounce" /> Enable / Disable Modules
                </h3>
                <p className="text-xs text-slate-500">De-activate any individual module node. Disabled items are bypassed automatically by the master cron.</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  { id: 'leadFinder', label: '1. Autonomous Lead Finder', desc: 'Sourcing, scrubbing and duplicate purging' },
                  { id: 'research', label: '2. Deep Telemetry Research', desc: 'AWS tech stack, opportunities heuristics' },
                  { id: 'emailWriter', label: '3. Copywriter composer', desc: 'Subject line splits and localization' },
                  { id: 'managerApproval', label: '4. Wait for Approval', desc: 'Hold sequence dispatch for manual review' },
                  { id: 'outreach', label: '5. Campaign Dispatcher', desc: 'Protects SMTP sender limits & IP reputation' },
                  { id: 'replyAnalyzer', label: '6. Aero Responder classifier', desc: 'Intents categorization (Interested / Spam)' },
                  { id: 'scheduler', label: '7. Kratos Google Meet Booker', desc: 'Automated timezone sync and reminders' },
                  { id: 'crmSync', label: '8. Atlas CRM Sync', desc: 'Committing deal probability maps to Postgres' },
                  { id: 'analyticsDigest', label: '9. ROI Analytics digest', desc: 'Compiling briefings and regression charts' }
                ].map((wfStage) => (
                  <div key={wfStage.id} className="flex items-start justify-between gap-3 p-2 bg-slate-50 dark:bg-slate-850/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{wfStage.label}</span>
                      <p className="text-[10px] text-slate-400 leading-normal">{wfStage.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={enabledWorkflowStages[wfStage.id as keyof typeof enabledWorkflowStages]}
                        onChange={(e) => {
                          setEnabledWorkflowStages({
                            ...enabledWorkflowStages,
                            [wfStage.id]: e.target.checked
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Visual chain and live execution log */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Active Autonomous Masters Sequence</h3>
                    <p className="text-xs text-slate-400 font-mono">Real-time status flow mapping</p>
                  </div>

                  <button
                    onClick={triggerWorkflowSimulation}
                    disabled={isWfSimulating}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isWfSimulating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Running Loop...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Trigger Master Loop Cron
                      </>
                    )}
                  </button>
                </div>

                {/* Graphical Layout Mapping */}
                <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800/60 overflow-x-auto">
                  <div className="flex items-center gap-2 min-w-[700px] justify-center">
                    {[
                      { id: 'leadFinder', label: 'Lead Finder' },
                      { id: 'research', label: 'Research' },
                      { id: 'emailWriter', label: 'Copywriter' },
                      { id: 'managerApproval', label: 'Approval' },
                      { id: 'outreach', label: 'Outreach' },
                      { id: 'replyAnalyzer', label: 'Replier' },
                      { id: 'scheduler', label: 'Booker' },
                      { id: 'crmSync', label: 'CRM Sync' },
                      { id: 'analyticsDigest', label: 'ROI Stats' }
                    ].map((step, sIdx, sArr) => {
                      const isEnabled = enabledWorkflowStages[step.id as keyof typeof enabledWorkflowStages];
                      const isSimulating = wfSimStep === sIdx;
                      const isCompleted = wfSimStep > sIdx && isWfSimulating;

                      if (!isEnabled) return null;

                      return (
                        <React.Fragment key={step.id}>
                          <div className={`p-3 rounded-lg border text-center transition-all w-24 relative ${
                            isSimulating 
                              ? 'border-blue-600 bg-blue-50/20 scale-105 shadow-md ring-1 ring-blue-500/20' 
                              : isCompleted 
                              ? 'border-emerald-500 bg-emerald-500/5' 
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}>
                            <div className="text-[10px] font-bold truncate text-slate-800 dark:text-slate-100">{step.label}</div>
                            {isSimulating && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full text-[8px] h-3.5 w-3.5 flex items-center justify-center font-bold">✓</span>
                            )}
                          </div>
                          {sIdx < sArr.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Master Loop Console Terminal */}
              <div className="bg-slate-950 text-slate-300 p-5 rounded-xl border border-slate-850 shadow-md space-y-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> master_loop_cron.sh
                  </span>
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] font-mono text-slate-500">Frequency:</span>
                    <select
                      value={workflowCron}
                      onChange={(e) => setWorkflowCron(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-350 cursor-pointer p-0.5"
                    >
                      <option value="hourly">Hourly (* * * * *)</option>
                      <option value="daily">Daily (0 9 * * *)</option>
                      <option value="weekly">Weekly (0 9 * * 1)</option>
                    </select>
                  </div>
                </div>

                {isWfSimulating && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Loop Process</span>
                      <span>{wfProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${wfProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="h-44 overflow-y-auto font-mono text-[10px] space-y-1.5 leading-relaxed pr-1 text-slate-400">
                  {wfSimLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith('[RUNNING]') ? 'text-blue-400' : log.startsWith('[SUCCESS]') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {log}
                    </div>
                  ))}
                  {wfSimLogs.length === 0 && <div className="text-slate-600 italic">No loop executions recorded for this session.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 14 & 11: AI CHAT (SALESPILOT ASSISTANT WITH MEMORY) */}
      {/* ======================================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Memory segments information */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Module 11: AI Memory</h3>
                <p className="text-[10px] text-slate-400 font-mono">Dynamic contextual reference node</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              SalesPilot consolidates client history data parameters. The chatbot pulls real-time reference tokens from past threads and meetings to guide prompt optimization.
            </p>

            {/* Memory Segments index checklist */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Connected Memory Layers</span>
              {[
                { title: 'Past Conversations Log', size: '14 threads indexed', status: 'ACTIVE' },
                { title: 'Previous Outreach Emails', size: '254 entries synced', status: 'ACTIVE' },
                { title: 'Local Business Research', size: '12 corporate dossiers', status: 'ACTIVE' },
                { title: 'Calendar Appointments history', size: '5 bookings referenced', status: 'ACTIVE' },
                { title: 'Organization Preferences', size: 'GST billing + IST zone', status: 'ACTIVE' }
              ].map((mem, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{mem.title}</span>
                  <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-bold">{mem.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Master Agent chat window */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-[540px]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Active Assistant Session: Aero AI</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Context: Enterprise CRM Memory Node</span>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-xl text-xs max-w-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/85 rounded-tl-none text-slate-800 dark:text-slate-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatSending && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-100 dark:bg-slate-850 rounded-lg flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">Consulting memory records...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggeted Prompt click guides */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-850 flex gap-2 overflow-x-auto scrollbar-none bg-slate-50/20 dark:bg-slate-950/10">
              {[
                'Show hot leads',
                'Generate proposal',
                'Explain analytics',
                'Summarize meetings'
              ].map((recText, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(recText);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] text-slate-600 dark:text-slate-350 hover:bg-slate-50 shrink-0 transition"
                >
                  {recText}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2 rounded-b-xl">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask SalesPilot AI (e.g. Find warm GST leads in Bangalore, draft demo email...)"
                className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs px-3.5 py-2 font-medium"
              />
              <button
                type="submit"
                disabled={isChatSending}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-xs transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 12: PROMPT LIBRARY */}
      {/* ======================================================== */}
      {activeTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Create Prompt Form */}
          <form onSubmit={handleAddPrompt} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4 text-blue-600" /> Save Prompt Template
              </h3>
              <p className="text-xs text-slate-500">Add custom Prompt formulations to your Organization library.</p>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Prompt Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise follow-up GST"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Category</label>
                <select
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 cursor-pointer font-medium"
                >
                  <option value="Outbound Pitch">Outbound Pitch</option>
                  <option value="Follow-Up Sequence">Follow-Up Sequence</option>
                  <option value="Meeting Booking">Meeting Booking</option>
                  <option value="Closing Proposal">Closing Proposal</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Prompt Text (supports dynamic tags)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Introduce our system to {{leadName}} highlighting GST invoice automation..."
                  value={newPrompt.promptText}
                  onChange={(e) => setNewPrompt({ ...newPrompt, promptText: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Save to Organization Library
              </button>
            </div>
          </form>

          {/* Right: Prompt List & Live Variable preview playground */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Active Prompts & Version Control</span>
              
              <div className="space-y-4 max-h-[320px] overflow-y-auto">
                {promptsList.map((pr) => (
                  <div key={pr.id} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800/60 text-xs space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">{pr.name}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-500 font-bold">{pr.category}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-350 font-mono text-[11px] leading-relaxed italic bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-100 dark:border-slate-800/50">
                      {pr.promptText}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Version: <strong>{pr.version}</strong></span>
                      <span>Modified {pr.updated}</span>
                    </div>

                    <button
                      onClick={() => {
                        setPromptsList(prev => prev.filter(p => p.id !== pr.id));
                        addCollaborationLog(`Deleted prompt template "${pr.name}" from library.`);
                      }}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Variable Parser Playground */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Variable Injector Playground</span>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{"{{leadName}}"}</label>
                  <input type="text" value={promptVariablesPreview.leadName} onChange={(e) => setPromptVariablesPreview({ ...promptVariablesPreview, leadName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{"{{companyName}}"}</label>
                  <input type="text" value={promptVariablesPreview.companyName} onChange={(e) => setPromptVariablesPreview({ ...promptVariablesPreview, companyName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{"{{painPoint}}"}</label>
                  <input type="text" value={promptVariablesPreview.painPoint} onChange={(e) => setPromptVariablesPreview({ ...promptVariablesPreview, painPoint: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs space-y-1.5 border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Compiled Dynamic Preview</span>
                <p className="font-semibold text-slate-800 dark:text-slate-250 leading-relaxed italic">
                  "{compiledPromptPreview(promptsList[0]?.promptText || '')}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 15: KNOWLEDGE BASE */}
      {/* ======================================================== */}
      {activeTab === 'knowledge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Drag & Drop Scrape Website form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-1.5 mb-1">
                <Upload className="w-4 h-4 text-blue-600" /> Upload Outbound Context
              </h3>
              <p className="text-xs text-slate-500">Provide company profiles, specifications, PDF decks, or website URLs. Aero indexes context tokens dynamically.</p>
            </div>

            {/* Drag Drop Mock */}
            <div className="p-8 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-xl text-center bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 hover:border-slate-350 cursor-pointer transition">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Drag & drop files here</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Supports PDF, DOCX, CSV, PPTX, TXT (Max 15MB)</span>
            </div>

            <span className="block text-center text-slate-400 text-[10px] font-mono">OR</span>

            <form onSubmit={handleAddUrl} className="space-y-3">
              <label className="block text-[10px] font-mono text-slate-400 uppercase">Scrape website company URLs</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="e.g. https://company.com/product"
                  value={uploadUrlInput}
                  onChange={(e) => setUploadUrlInput(e.target.value)}
                  className="flex-grow bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs rounded px-3 py-1.5"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded shadow-xs"
                >
                  Scrape
                </button>
              </div>
            </form>
          </div>

          {/* Right: Indexed Files list & Vector Embedded Search Playground */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Active Material Index</span>
              
              <div className="space-y-3">
                {knowledgeBaseFiles.map((file) => (
                  <div key={file.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-150 dark:border-slate-800/60 text-xs flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {file.name}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">Size: {file.size} | Source: {file.source}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                        {file.status}
                      </span>
                      <button
                        onClick={() => {
                          setKnowledgeBaseFiles(prev => prev.filter(f => f.id !== file.id));
                          addCollaborationLog(`De-indexed knowledge base resource "${file.name}"`);
                        }}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vector query scanner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">AI Context Vector Search</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter context query (e.g. GST enterprise tiers / Bangalore case study)..."
                  value={kbQuery}
                  onChange={(e) => setKbQuery(e.target.value)}
                  className="flex-grow bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs"
                />
                <button
                  onClick={handleSearchKnowledge}
                  disabled={isKbSearching}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  {isKbSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Search className="w-3.5 h-3.5" />}
                  Search
                </button>
              </div>

              {kbSearchOutput && (
                <div className="p-3.5 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg border border-slate-850 whitespace-pre-wrap leading-relaxed shadow-inner">
                  <div className="text-[9px] text-blue-400 font-bold mb-1">VECTOR MATCH FOUND (COGNITION RE-RANKED):</div>
                  {kbSearchOutput}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 16: AI RECOMMENDATION ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-5 rounded-xl shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-500 animate-pulse" /> Module 16: AI Outbound Recommendation Engine
              </h3>
              <p className="text-xs text-slate-500">Suggested optimizations extracted from current pipeline response regressions and token analyses.</p>
            </div>

            <button
              onClick={handleRefreshRecommendations}
              disabled={isRefreshingRecs}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-mono text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRecs ? 'animate-spin text-white' : ''}`} />
              Refresh recommendations
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => {
              const Icon = rec.icon;
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between h-[200px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{rec.title}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{rec.value}</div>
                      <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">{rec.metric}</div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {rec.reason}
                    </p>
                  </div>

                  <div className="text-[9px] font-mono text-slate-400 text-right uppercase">
                    Compiled by Newton Analyst
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
