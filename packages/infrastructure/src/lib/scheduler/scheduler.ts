export type TimeHasPassedEventSchedule = Array<{
  event: string;
  pattern: string;
}>

export interface Scheduler {
  start: (schedule: TimeHasPassedEventSchedule) => void;
  stop: () => void;
}
