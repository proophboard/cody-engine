import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerDateTimeExtensions = (jexl: Jexl) => {
  jexl.addFunction('now', () => (new Date()));

  jexl.addTransform('date', d => new Date(d));
  jexl.addTransform('utc', d => (new Date(d)).toUTCString());
  jexl.addTransform('isoDate', d => (new Date(d)).toISOString());
  jexl.addTransform('localDate', d => (new Date(d)).toLocaleDateString());
  jexl.addTransform('localTime', t => (new Date(t)).toLocaleTimeString());
  jexl.addTransform('localDateTime', dt => (new Date(dt)).toLocaleString());
  jexl.addTransform('year', d => (new Date(d)).getFullYear());
  jexl.addTransform('utcYear', d => (new Date(d)).getUTCFullYear());
  jexl.addTransform('month', d => (new Date(d)).getMonth());
  jexl.addTransform('utcMonth', d => (new Date(d)).getUTCMonth());
  jexl.addTransform('day', d => (new Date(d)).getDate());
  jexl.addTransform('utcDay', d => (new Date(d)).getUTCDate());
  jexl.addTransform('weekDay', d => (new Date(d)).getDay());
  jexl.addTransform('utcWeekDay', d => (new Date(d)).getUTCDay());
  jexl.addTransform('hours', d => (new Date(d)).getHours());
  jexl.addTransform('utcHours', d => (new Date(d)).getUTCHours());
  jexl.addTransform('minutes', d => (new Date(d)).getMinutes());
  jexl.addTransform('utcMinutes', d => (new Date(d)).getUTCMinutes());
  jexl.addTransform('seconds', d => (new Date(d)).getSeconds());
  jexl.addTransform('utcSeconds', d => (new Date(d)).getUTCSeconds());
  jexl.addTransform('milliseconds', d => (new Date(d)).getMilliseconds());
  jexl.addTransform('utcMilliseconds', d => (new Date(d)).getUTCMilliseconds());

  jexl.addTransform('twoDigit', numberOrStr => {
    if(typeof numberOrStr === 'string') {
      numberOrStr = parseInt(numberOrStr);
    }

    if(numberOrStr < 10) {
      return '0' + numberOrStr;
    } else {
      return ''+numberOrStr;
    }
  })
}
