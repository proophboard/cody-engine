import Ajv from 'ajv';
import addFormats from 'ajv-formats'

export const ajv = new Ajv({$data: true, useDefaults: true, strict: false});

addFormats(ajv);


/* -------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------- */

const TIME_REGEX =
  /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/;

const DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/;

/* -------------------------------------------------- */
/* Override "time" */
/* -------------------------------------------------- */

ajv.addFormat("time", {
  type: "string",
  validate: (value) => {
    if (!TIME_REGEX.test(value)) return false;

    // If timezone present → let Date validate
    if (/[Z+-]/.test(value.slice(-6))) {
      const testDate = new Date(`1970-01-01T${value}`);
      return !isNaN(testDate.getTime());
    }

    return true;
  }
});

/* -------------------------------------------------- */
/* Override "date-time" */
/* -------------------------------------------------- */

ajv.addFormat("date-time", {
  type: "string",
  validate: (value) => {
    if (!DATETIME_REGEX.test(value)) return false;

    // If timezone exists → native Date handles correctly
    if (/[Z+-]/.test(value.slice(-6))) {
      const d = new Date(value);
      return !isNaN(d.getTime());
    }

    // No timezone → validate components manually
    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);

    const constructed = new Date(
      year,
      month - 1,
      day
    );

    return (
      constructed.getFullYear() === year &&
      constructed.getMonth() === month - 1 &&
      constructed.getDate() === day
    );
  }
});
