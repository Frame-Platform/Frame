/*     GET /document     */

export interface Document {
  id: number,
  url: string,
  desc?: string,
}

export interface Documents {
  documents: Document[]
}

export interface GetDocsParameter {
  limit?: string,
  offset?: string,
}

export interface GetDocsReturn {
  documents: Documents,
  limit: number,
  offset: number,
  total: number,
}


/*     POST /document     */
export interface PostImageSuccess {
  url?: string;
  desc?: string;
  success: boolean;
  errors: string
}
export interface PostImagesSuccess {
  documents: PostImageSuccess[]
}

/*     GET /document/${id}     */
export interface DocumentResponse {
  document: {
    id: string;
    url?: string;
    desc?: string;
  };
  success: boolean;
  message?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  limit: string;
  offset: string;
  total: number;
}

/*     GET /delete/${id}    current ?           */
/*     GET /document/${id}   <<<<  outdated ?   */
export interface DeleteDocumentResponse {
  document: {
    url: string;
    desc: string;
    id: number | string;
  };
  success: boolean;
  message: string;
}

/*     POST /search     */
export interface SearchReturn {
  hits: {
    url: string,
    desc: string,
    id: number,
    timestamp: string,
    score: number
  }[],
  count: number
}

export interface ErrorResponse {
  error: string
}
