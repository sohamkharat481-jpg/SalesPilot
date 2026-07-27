import { Lead, Appointment, Deal } from '../types';

export interface FollowupScheduleItem {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  email: string;
  scheduledTime: string;
  followupType: 'EMAIL' | 'LINKEDIN' | 'CALL' | 'CHECK_IN' | 'MEETING_PREP';
  suggestedSubject: string;
  suggestedContent: string;
  status: 'SCHEDULED' | 'SENT' | 'SKIPPED' | 'FAILED';
  delayDays: number;
  triggerEvent: string;
  createdAt: string;
}

export interface MeetingReminderItem {
  id: string;
  appointmentId: string;
  leadName: string;
  company: string;
  meetingTime: string;
  reminderType: '24H_BEFORE' | '1H_BEFORE' | '10M_BEFORE';
  channel: 'EMAIL' | 'CALENDAR_ALERT' | 'CRM_NOTIFICATION';
  message: string;
  sentStatus: boolean;
}

/**
 * Enterprise Automatic Follow-up Scheduler & Meeting Reminder Engine
 */
export class FollowupScheduler {
  /**
   * Generates automatic multi-touch follow-up schedule for a lead
   */
  public static generateFollowupSchedule(
    lead: Lead,
    sequenceLength: number = 3,
    customOffer: string = 'SalesPilot AI SDR Suite'
  ): FollowupScheduleItem[] {
    const items: FollowupScheduleItem[] = [];
    const now = new Date();

    const followupsConfig = [
      {
        delayDays: 2,
        type: 'EMAIL' as const,
        trigger: 'No response to initial outreach',
        subject: `Quick check-in re: ${lead.company}'s outbound goals`,
        content: `Hi ${lead.firstName},\n\nFollowing up on my previous message. Wanted to make sure it didn't get buried in your inbox. Are you open to a brief 10-minute demo this week?`
      },
      {
        delayDays: 5,
        type: 'LINKEDIN' as const,
        trigger: 'Sequence Step 2 - Soft touch',
        subject: `LinkedIn Touchpoint for ${lead.firstName}`,
        content: `Connect & message ${lead.firstName} on LinkedIn regarding automated pipeline growth at ${lead.company}.`
      },
      {
        delayDays: 9,
        type: 'EMAIL' as const,
        trigger: 'Sequence Step 3 - Value audit offer',
        subject: `10 free verified lead profiles for ${lead.company}`,
        content: `Hi ${lead.firstName},\n\nI put together a quick sample list of target decision makers for ${lead.company}. Would you like me to send over the complete CSV audit?`
      },
      {
        delayDays: 14,
        type: 'CALL' as const,
        trigger: 'Sequence Step 4 - Break-up call check',
        subject: `Direct phone outreach to ${lead.firstName}`,
        content: `Initiate a 2-minute discovery call to confirm whether outbound sales automation is a priority for ${lead.company} this quarter.`
      }
    ];

    for (let i = 0; i < Math.min(sequenceLength, followupsConfig.length); i++) {
      const cfg = followupsConfig[i];
      const scheduledDate = new Date(now.getTime() + cfg.delayDays * 24 * 60 * 60 * 1000);

      items.push({
        id: `flw_${lead.id}_${i + 1}`,
        leadId: lead.id,
        leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        company: lead.company,
        email: lead.email,
        scheduledTime: scheduledDate.toISOString(),
        followupType: cfg.type,
        suggestedSubject: cfg.subject,
        suggestedContent: cfg.content,
        status: 'SCHEDULED',
        delayDays: cfg.delayDays,
        triggerEvent: cfg.trigger,
        createdAt: now.toISOString()
      });
    }

    return items;
  }

  /**
   * Generates meeting reminders for upcoming appointments
   */
  public static generateMeetingReminders(appointments: Appointment[]): MeetingReminderItem[] {
    const reminders: MeetingReminderItem[] = [];
    const now = new Date();

    appointments.forEach((apt) => {
      const aptTime = new Date(apt.startTime || apt.dateTime);
      const diffHours = (aptTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours > 0) {
        reminders.push({
          id: `rem_24h_${apt.id}`,
          appointmentId: apt.id,
          leadName: apt.leadName,
          company: apt.title || 'Scheduled Meeting',
          meetingTime: aptTime.toISOString(),
          reminderType: '24H_BEFORE',
          channel: 'EMAIL',
          message: `Reminder: Upcoming discovery session with ${apt.leadName} scheduled for tomorrow at ${aptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          sentStatus: diffHours <= 24
        });

        reminders.push({
          id: `rem_1h_${apt.id}`,
          appointmentId: apt.id,
          leadName: apt.leadName,
          company: apt.title || 'Scheduled Meeting',
          meetingTime: aptTime.toISOString(),
          reminderType: '1H_BEFORE',
          channel: 'CRM_NOTIFICATION',
          message: `1-Hour Alert: Discovery meeting with ${apt.leadName} starts in 60 minutes. Prepare research brief.`,
          sentStatus: diffHours <= 1
        });
      }
    });

    return reminders;
  }
}
