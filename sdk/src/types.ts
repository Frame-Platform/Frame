export interface ClientConfig {
  apiKey: string;
  baseURL: string;
}

export interface GetDocumentsParams extends Record<string, unknown> {
  limit?: string | number;
  offset?: string | number;
}

export interface GetDocumentByIdParams {
  id: string | number;
}

export type CreateDocumentsParams =
  | {
      url: string;
      description?: string | null;
      metadata?: Record<string, any> | null;
    }
  | {
      url?: string | null;
      description: string;
      metadata?: Record<string, any> | null;
    };

interface ServerSuccess<T> {
  ok: true;
  status: number;
  data: T;
}

interface ZodIssue {
  code: string; // "invalid_type", "too_small", etc.
  expected?: string; // Expected data type
  received?: string; // Actual received type
  path: (string | number)[]; // Path to the invalid field
  message: string; // Descriptive error message
}

interface ZodError {
  name: "ZodError";
  issues: ZodIssue[];
}

interface ErrorResponse {
  ok: false;
  status: number;
  error: ZodError | string; // this property will eventually be a union between Zod errors, 500 errors, and client errors
}

export type APIResponse<T> =
  | ServerSuccess<T> // 200 responses
  | ErrorResponse; // 400/500/Client Error responses (Zod, server errors, bad endpoint)

export interface GetDocumentsResponse {
  documents: Document[];
  limit: number;
  offset: number;
  count: number;
}

export interface GetDocumentByIdResponse {
  document: Document;
}

export interface DeleteDocumentByIdResponse {
  document: Document;
}

export interface CreateDocumentsResponse {
  success: boolean;
  url?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

export interface Document {
  id: number;
  url?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
}
