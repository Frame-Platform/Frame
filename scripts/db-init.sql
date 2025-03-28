-- Install pgvector extension
CREATE EXTENSION vector;

-- Document table
CREATE TABLE documents (
    id serial PRIMARY KEY,
    url TEXT NOT NULL,
    description TEXT,
    embedding VECTOR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
);

-- Create vector index for similarity search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INT DEFAULT 10
) 

-- SQL query
SELECT
    d.id as document_id,
    d.url as document_url,
    d.description as document_description,
    1 - (d.embedding <=> query_embedding) as similarity
FROM
    documents d
WHERE
    1 - (d.embedding <=> query_embedding) > similarity_threshold
ORDER BY
    similarity DESC
LIMIT max_results;

-- What SQL query returns
RETURNS TABLE (
    document_id UUID,
    document_url TEXT,
    document_description TEXT,
    similarity FLOAT
) 
