import {
  Scheduler,
  TimeHasPassedEventSchedule,
} from '@event-engine/infrastructure/scheduler/scheduler';
import { MessageBox } from '@event-engine/messaging/message-box';

// This implementation ignores the cron patterns
// It's for testing purpose only
export class PrototypeEventScheduler implements Scheduler {
  private interval: ReturnType<typeof setInterval> | null = null;
  private techAdminId: string;
  private messageBox: MessageBox;

  constructor(techAdminId: string, messageBox: MessageBox) {
    this.techAdminId = techAdminId;
    this.messageBox = messageBox;
  }

  start(schedule: TimeHasPassedEventSchedule): void {
    this.interval = setInterval(() => {
      schedule.forEach((event) => {
        setTimeout(async () => {
          const evtInfo = this.messageBox.getEventInfo(event.event);

          const evt = evtInfo.factory(
            {},
            {
              user: { userId: this.techAdminId, roles: ['TechAdmin'] },
            }
          );

          const success = await this.messageBox.eventBus.on(evt);

          if (!success) {
            console.error(`Failed to dispatch event: ${event.event}`);
          }
        }, 1);
      });
    }, 60000);

    console.log(
      '[Scheduler] started the schedule: \n' + JSON.stringify(schedule, null, 2)
    );
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    console.log('[Scheduler] stopped the schedule.');
  }
}
