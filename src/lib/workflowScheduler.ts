import { LocalDB } from '../database/localDb';
import { WorkflowRunner } from './workflowRunner';
import { ScheduledJob } from '../types';

const db = LocalDB.getInstance();
let schedulerInterval: NodeJS.Timeout | null = null;

export class WorkflowScheduler {
  /**
   * Initializes the scheduler daemon to run checks periodically
   */
  public static start() {
    if (schedulerInterval) return;
    
    console.log('[WorkflowScheduler] Starting timezone-aware scheduler daemon...');
    
    // Check for pending scheduled jobs every 10 seconds
    schedulerInterval = setInterval(async () => {
      try {
        await this.pollAndExecuteJobs();
      } catch (err) {
        console.error('[WorkflowScheduler] Error in scheduler execution tick:', err);
      }
    }, 10000);
  }

  /**
   * Stops the daemon (clean shutdown)
   */
  public static stop() {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
      console.log('[WorkflowScheduler] Scheduler daemon stopped.');
    }
  }

  /**
   * Polls database for any jobs that are due to execute
   */
  public static async pollAndExecuteJobs() {
    const allJobs = db.getAllScheduledJobs();
    const now = new Date();

    const dueJobs = allJobs.filter(job => 
      job.status === 'PENDING' && 
      new Date(job.executeAt) <= now
    );

    for (const job of dueJobs) {
      await this.executeJob(job);
    }
  }

  /**
   * Executes a scheduled job
   */
  private static async executeJob(job: ScheduledJob) {
    console.log(`[WorkflowScheduler] Executing scheduled job: ID ${job.id} for run ${job.runId}`);
    
    // Mark as running
    db.updateScheduledJob(job.id, { status: 'RUNNING' });

    try {
      // Resume the workflow execution at the specified node
      await WorkflowRunner.resumeWorkflowRun(job.runId, job.nodeId);

      // Mark completed
      db.updateScheduledJob(job.id, { status: 'COMPLETED' });

      // Handle recurring / cron schedules if configured in context or job meta
      if (job.contextData?.recurringInterval) {
        this.rescheduleRecurringJob(job);
      }
    } catch (err: any) {
      console.error(`[WorkflowScheduler] Job execution failed for ID ${job.id}:`, err.message || err);
      
      const nextRetry = job.retryCount + 1;
      if (nextRetry <= job.maxRetries) {
        // Reschedule retry in 1 minute
        const executeAt = new Date(Date.now() + 60000);
        db.updateScheduledJob(job.id, {
          status: 'PENDING',
          retryCount: nextRetry,
          executeAt: executeAt.toISOString()
        });
        console.log(`[WorkflowScheduler] Rescheduled job ${job.id} for retry #${nextRetry} at ${executeAt.toISOString()}`);
      } else {
        db.updateScheduledJob(job.id, { status: 'FAILED' });
      }
    }
  }

  /**
   * Reschedules recurring or cron based jobs
   */
  private static rescheduleRecurringJob(job: ScheduledJob) {
    const interval = job.contextData.recurringInterval; // 'hourly' | 'daily' | 'weekly' | string (cron)
    let nextExecute = new Date();

    if (interval === 'hourly') {
      nextExecute.setHours(nextExecute.getHours() + 1);
    } else if (interval === 'daily') {
      nextExecute.setDate(nextExecute.getDate() + 1);
    } else if (interval === 'weekly') {
      nextExecute.setDate(nextExecute.getDate() + 7);
    } else {
      // Simulate cron pattern evaluation (e.g. standard 5 minutes for trial)
      nextExecute.setMinutes(nextExecute.getMinutes() + 5);
    }

    const newJob: ScheduledJob = {
      id: 'job_' + Math.random().toString(36).substring(2, 11),
      workflowId: job.workflowId,
      nodeId: job.nodeId,
      runId: job.runId,
      organizationId: job.organizationId,
      executeAt: nextExecute.toISOString(),
      status: 'PENDING',
      retryCount: 0,
      maxRetries: job.maxRetries,
      contextData: job.contextData,
      timezone: job.timezone || 'UTC'
    };

    db.addScheduledJob(newJob);
    console.log(`[WorkflowScheduler] Recurring job rescheduled next execution for: ${nextExecute.toISOString()}`);
  }
}
