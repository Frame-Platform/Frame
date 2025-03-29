import { Client } from "pg";

let pgClient: null | Client = null;

export const pgConnect = async () => {
  try {
    if (pgClient) return pgClient;

    pgClient = new Client({
      host: process.env.HOST_NAME,
      port: Number(process.env.PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await pgClient.connect();
    return pgClient;
  } catch (e) {
    throw new Error(`Error connecting to Postgres`);
  }
};
