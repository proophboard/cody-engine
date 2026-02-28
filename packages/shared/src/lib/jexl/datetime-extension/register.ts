import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

const twoDigit = (numberOrStr: number | string): string => {
  if(typeof numberOrStr === 'string') {
    numberOrStr = parseInt(numberOrStr);
  }

  if(numberOrStr < 10) {
    return '0' + numberOrStr;
  } else {
    return ''+numberOrStr;
  }
}

export const registerDateTimeExtensions = (jexl: Jexl) => {
  jexl.addFunction('now', () => (new Date()));

  jexl.addTransform('date', d => new Date(d));
  jexl.addTransform('utc', d => (new Date(d)).toUTCString());
  jexl.addTransform('isoDate', d => (new Date(d)).toISOString().split("T")[0]);
  jexl.addTransform('isoTime', d => (new Date(d)).toISOString().split("T")[1]);
  jexl.addTransform('isoDateTime', d => (new Date(d)).toISOString());
  jexl.addTransform('localDate', d => (new Date(d)).toLocaleDateString());
  jexl.addTransform('localTime', t => (new Date(t)).toLocaleTimeString());
  jexl.addTransform('localDateTime', dt => (new Date(dt)).toLocaleString());
  jexl.addTransform('year', d => (new Date(d)).getFullYear());
  jexl.addTransform('utcYear', d => (new Date(d)).getUTCFullYear());
  jexl.addTransform('month', d => (new Date(d)).getMonth());
  jexl.addTransform('isoMonth', d => twoDigit((new Date(d)).getMonth() + 1));
  jexl.addTransform('utcMonth', d => (new Date(d)).getUTCMonth());
  jexl.addTransform('day', d => (new Date(d)).getDate());
  jexl.addTransform('isoDay', d => twoDigit((new Date(d)).getDate()));
  jexl.addTransform('utcDay', d => (new Date(d)).getUTCDate());
  jexl.addTransform('weekDay', d => (new Date(d)).getDay());
  jexl.addTransform('utcWeekDay', d => (new Date(d)).getUTCDay());
  jexl.addTransform('lastDayOfMonth', d => {
    const dO = new Date(d);
    const lastDay = new Date(dO.getFullYear(), dO.getMonth()+1, 0);
    return lastDay.getDate();
  })
  jexl.addTransform('hours', d => (new Date(d)).getHours());
  jexl.addTransform('utcHours', d => (new Date(d)).getUTCHours());
  jexl.addTransform('minutes', d => (new Date(d)).getMinutes());
  jexl.addTransform('utcMinutes', d => (new Date(d)).getUTCMinutes());
  jexl.addTransform('seconds', d => (new Date(d)).getSeconds());
  jexl.addTransform('utcSeconds', d => (new Date(d)).getUTCSeconds());
  jexl.addTransform('milliseconds', d => (new Date(d)).getMilliseconds());
  jexl.addTransform('utcMilliseconds', d => (new Date(d)).getUTCMilliseconds());
  jexl.addTransform('timezoneOffset', d => (new Date(d)).getTimezoneOffset());
  jexl.addTransform('timestamp', d => (new Date(d)).getTime());
  jexl.addTransform('addMilliseconds', (d, ms: number) => (new Date(d)).getTime() + (ms))
  jexl.addTransform('subMilliseconds', (d, ms: number) => (new Date(d)).getTime() - (ms))
  jexl.addTransform('addSeconds', (d, seconds: number) => (new Date(d)).getTime() + (seconds * 1000))
  jexl.addTransform('subSeconds', (d, seconds: number) => (new Date(d)).getTime() - (seconds * 1000))
  jexl.addTransform('addMinutes', (d, minutes: number) => (new Date(d)).getTime() + (minutes * 60 * 1000))
  jexl.addTransform('subMinutes', (d, minutes: number) => (new Date(d)).getTime() - (minutes * 60 * 1000))
  jexl.addTransform('addHours', (d, hours: number) => (new Date(d)).getTime() + (hours * 60 * 60 * 1000))
  jexl.addTransform('subHours', (d, hours: number) => (new Date(d)).getTime() - (hours * 60 * 60 * 1000))
  jexl.addTransform('addDays', (d, days: number) => (new Date(d)).getTime() + (days * 24 * 60 * 60 * 1000))
  jexl.addTransform('subDays', (d, days: number) => (new Date(d)).getTime() - (days * 24 * 60 * 60 * 1000))
  jexl.addTransform('addWeeks', (d, weeks: number) => (new Date(d)).getTime() + (weeks * 7 * 24 * 60 * 60 * 1000))
  jexl.addTransform('subWeeks', (d, weeks: number) => (new Date(d)).getTime() - (weeks * 7 * 24 * 60 * 60 * 1000))

  jexl.addTransform('twoDigit', twoDigit)
}
