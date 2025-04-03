import * as SDK from "./types";
import dotenv from "dotenv";

dotenv.config();

export class Client {
  private apiKey: string;
  private baseURL: string;

  constructor({ apiKey, baseURL }: SDK.ClientConfig) {
    if (!apiKey) {
      throw new Error("API key is required to initialize the Client.");
    }
    if (!baseURL) {
      throw new Error("URL endpoint is required to initialize the Client.");
    }
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  private async request<T>(
    path: string,
    method: "GET" | "POST" | "DELETE",
    params?: Record<string, unknown>,
    body?: unknown
  ): Promise<SDK.APIResponse<T>> {
    try {
      const url = new URL(`${this.baseURL}${path}`);

      if (method === "GET" && params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        });
      }

      const headers: HeadersInit = {
        "x-api-key": this.apiKey,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      };
      const options: RequestInit = {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      };

      const response = await fetch(url.toString(), options);
      const data = await response.json();

      return response.ok
        ? { ok: true, status: response.status, data }
        : {
            ok: false,
            status: response.status,
            error: data.error || data.message,
          };
    } catch (error: unknown) {
      return {
        ok: false,
        status: 0,
        error:
          error instanceof Error
            ? error.message
            : "Unknown client error occurred",
      };
    }
  }

  public getDocuments(
    params: SDK.GetDocumentsParams = {}
  ): Promise<SDK.APIResponse<SDK.GetDocumentsResponse>> {
    return this.request<SDK.GetDocumentsResponse>("/document", "GET", params);
  }

  public getDocumentById(
    id: string | number
  ): Promise<SDK.APIResponse<SDK.GetDocumentByIdResponse>> {
    return this.request<SDK.GetDocumentByIdResponse>(`/document/${id}`, "GET");
  }

  public deleteDocumentById(
    id: string | number
  ): Promise<SDK.APIResponse<SDK.DeleteDocumentByIdResponse>> {
    return this.request<SDK.DeleteDocumentByIdResponse>(
      `/document/${id}`,
      "DELETE"
    );
  }

  public createDocuments(
    documents: SDK.CreateDocumentsParams[]
  ): Promise<SDK.APIResponse<SDK.CreateDocumentsResponse>> {
    return this.request<SDK.CreateDocumentsResponse>(
      `/document`,
      "POST",
      undefined,
      { documents: documents }
    );
  }

  public searchDocuments(
    documents: SDK.SearchRequest
  ): Promise<SDK.APIResponse<SDK.SearchDocumentResponse>> {
    return this.request<SDK.SearchDocumentResponse>(
      `/search`,
      "POST",
      undefined,
      { ...documents }
    );
  }

  public getRecommendations(
    id: string | number,
    options?: { topK?: number; threshold?: number }
  ): Promise<SDK.APIResponse<SDK.GetRecommendationsResponse>> {
    return this.request<SDK.GetRecommendationsResponse>(
      `/document/${id}/recommend`,
      "POST",
      undefined,
      options
    );
  }
}
