/*
import chalk from "chalk";

export const displayPostgresInstructions = (tableName: string) => {
  const sqlCode = `
SQL Code to Create the Table:
The default table name is "documents". If you selected a different table name, please confirm the SQL code before running.
If you do not already have a table created with the correct schema, you can execute the following SQL code:

-- Step 1: Create the vector extension (if not already created)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop the existing documents table (if necessary)
DROP TABLE IF EXISTS documents;

-- Step 3: Create the new table with the required schema
CREATE TABLE ${tableName} (
    id serial PRIMARY KEY,
    url TEXT NOT NULL,
    description TEXT,
    embedding VECTOR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
);

-- Step 4: Create vector index for efficient similarity search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
  `;

  console.log(
    chalk.yellow(
      "Please ensure that your table has the correct schema definition."
    )
  );
  console.log(chalk.blue(sqlCode));
};
*/
