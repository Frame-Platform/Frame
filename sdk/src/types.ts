export interface ClientConfig {
  apiKey: string;
  baseURL: string;
}

/*     GET /document     */

// export interface Documents {
//   documents: Document[];
// }

export interface GetDocumentsParams {
  limit?: string | number;
  offset?: string | number;
}

// export interface GetDocsReturn {
//   documents: Documents;
//   limit: number;
//   offset: number;
//   total: number;
// }

// /*     POST /document     */
// export interface PostImageSuccess {
//   url?: string;
//   desc?: string;
//   success: boolean;
//   errors: string;
// }
// export interface PostImagesSuccess {
//   documents: PostImageSuccess[];
// }

// /*     GET /document/${id}     */
// export interface DocumentResponse {
//   document: {
//     id: string;
//     url?: string;
//     desc?: string;
//   };
//   success: boolean;
//   message?: string;
// }

// export interface DocumentsResponse {
//   documents: Document[];
//   limit: string;
//   offset: string;
//   total: number;
// }

// /*     GET /delete/${id}    current ?           */
// /*     GET /document/${id}   <<<<  outdated ?   */
// export interface DeleteDocumentResponse {
//   document: {
//     url: string;
//     desc: string;
//     id: number | string;
//   };
//   success: boolean;
//   message: string;
// }

// /*     POST /search     */
// export interface SearchReturn {
//   hits: {
//     url: string;
//     desc: string;
//     id: number;
//     timestamp: string;
//     score: number;
//   }[];
//   count: number;
// }

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

interface Document {
  id: number;
  url?: string | null;
  desc?: string | null;
  metadata?: Record<string, any> | null;
}
