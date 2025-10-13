import {
  Scheduler,
  TimeHasPassedEventSchedule,
} from '@event-engine/infrastructure/scheduler/scheduler';
import { MessageBox } from '@event-engine/messaging/message-box';
import cron from 'node-cron';
import {type ScheduledTask } from 'node-cron';

export class CronEventScheduler implements Scheduler {
  private tasks: ScheduledTask[] = [];
  private techAdminId: string;
  private messageBox: MessageBox;

  constructor(techAdminId: string, messageBox: MessageBox) {
    this.techAdminId = techAdminId;
    this.messageBox = messageBox;
  }

  start(schedule: TimeHasPassedEventSchedule): void {
    schedule.forEach(async (event) => {
      const evtInfo = this.messageBox.getEventInfo(event.event);

      const evt = evtInfo.factory(
        {},
        {
          user: { userId: this.techAdminId, roles: ['TechAdmin'] },
        }
      );

      this.tasks.push(
        cron.schedule(
          event.pattern,
          async () => {
            const success = await this.messageBox.eventBus.on(evt);

            if (!success) {
              console.error(`Failed to dispatch event: ${event.event}`);
            }
          },
          {
            timezone: 'Europe/Berlin',
          }
        )
      );
    });

    console.log(
      '[Scheduler] started the schedule: \n' + JSON.stringify(schedule, null, 2)
    );
  }

  stop(): void {
    this.tasks.forEach((task) => {
      task.stop();
    });
    console.log('[Scheduler] stopped the schedule.');
  }
}
