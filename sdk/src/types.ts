export interface Document {
  url: string,
  desc?: string,
}

export interface Documents {
  documents: Document[]
}

export interface GetDocsParameter {
  limit: string,
  offset: string,
}

export interface GetDocsReturn {
  documents: Documents,
  limit: number,
  offset: number,
  total: number,
}

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

export interface DeleteDocumentResponse {
  document: {
    url: string;
    desc: string;
    id: number | string;
  };
  success: boolean;
  message: string;
}
