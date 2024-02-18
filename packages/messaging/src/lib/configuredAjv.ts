import Ajv from 'ajv';
import addFormats from 'ajv-formats'

export const ajv = new Ajv({$data: true, useDefaults: true, strict: false});

addFormats(ajv);
