const envFile = process.env['NODE_ENV'] ? `.${process.env['NODE_ENV']}` : '';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { env } = require(`./environment${envFile}`);

