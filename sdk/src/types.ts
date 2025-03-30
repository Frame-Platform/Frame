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

