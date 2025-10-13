import { Scheduler } from '@event-engine/infrastructure/scheduler/scheduler';
import { PrototypeEventScheduler } from '@server/infrastructure/scheduler/prototype-event-scheduler';
import { env } from '@server/environments/environment.current';
import { getConfiguredMessageBox } from '@server/infrastructure/configuredMessageBox';
import { CronEventScheduler } from '@server/infrastructure/scheduler/cron-event-scheduler';

let scheduler: Scheduler;



export const schedulerFactory = (isProduction: boolean) => {
  if (scheduler) {
    return scheduler;
  }

  if(!env.scheduler) {
    throw new Error('Scheduler service is not enabled in environment.current.ts');
  }

  const messageBox = getConfiguredMessageBox();

  if (isProduction) {
    scheduler = new CronEventScheduler(env.scheduler.techAdminId, messageBox);

    return scheduler;
  }

  scheduler = new PrototypeEventScheduler(
    env.scheduler.techAdminId,
    messageBox
  );

  return scheduler;
};
