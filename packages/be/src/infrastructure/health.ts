import { Client } from 'pg';
import { env } from '@server/environments/environment.current';

export const checkPostgresConnection = async (): Promise<boolean> => {
  const client = new Client(env.postgres);

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (err: unknown) {
    console.error(
      'Could not connect to Postgres:',
      err instanceof Error ? err.message : err
    );
    return false;
  }
};

export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com/search?q=prooph', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      return true;
    }
    console.warn(`Unexpected response from Google: ${response.status}`);
  } catch (err: unknown) {
    console.error(
      'Could not reach Google:',
      err instanceof Error ? err.message : err
    );
    return false;
  }

  return false;
};
