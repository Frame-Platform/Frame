const { Client } = require("pg");
require("dotenv").config();

async function setupDatabase() {
  try {
    const dbName = process.env.POSTGRES_DB_NAME || "postgres";

    console.log(`Setting up database ${dbName} with table named "documents"`);

    console.log(`Connecting to database at ${process.env.DATABASE_HOST}...`);
    const client = new Client({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 5432,
      database: dbName,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log("Connected to database successfully");

    // Execute SQL
    console.log("Executing database setup SQL...");
    await client.query(`DROP TABLE IF EXISTS documents`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        embedding vector(1024) NOT NULL,
        url TEXT,
        description TEXT,
        metadata JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        url_for_constraint TEXT GENERATED ALWAYS AS (COALESCE(url, '__null__')) STORED,
        desc_for_constraint TEXT GENERATED ALWAYS AS (COALESCE(description, '__null__')) STORED,
        CONSTRAINT unique_url_desc_constraint UNIQUE (url_for_constraint, desc_for_constraint)
      );
    `
    );
    await client.query(
      `CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)`
    );
    console.log("Database table created successfully");
    client.end();
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
