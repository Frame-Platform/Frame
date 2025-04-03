import * as SDKTypes from "./types";
import dotenv from "dotenv";

dotenv.config();

export class Client {
  private apiKey: string;
  private baseURL: string;

  constructor({ apiKey, baseURL }: SDKTypes.ClientConfig) {
    if (!apiKey) {
      throw new Error("API key is required to initialize the Client.");
    }
    if (!baseURL) {
      throw new Error("URL endpoint is required to initialize the Client.");
    }
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  public async getDocuments(
    params: SDKTypes.GetDocumentsParams = {}
  ): Promise<SDKTypes.APIResponse<SDKTypes.GetDocumentsResponse>> {
    try {
      const url = new URL(`${this.baseURL}/document`);

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: data.error || data.message,
        };
      } else {
        return {
          ok: true,
          status: response.status,
          data,
        };
      }
    } catch (error: unknown) {
      return {
        status: 0,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown client error occurred",
      };
    }
  }

  // public async getDocumentById(
  //   id: string | number
  // ): Promise<SDKTypes.APIResponse> {
  //   try {
  //     const response = await fetch(`${this.baseURL}/document/${id}`, {
  //       method: "GET",
  //       headers: {
  //         "x-api-key": this.apiKey,
  //         Accept: "application/json",
  //       },
  //     });

  //     const data = await response.json();

  //     return {
  //       status: response.status,
  //       ok: response.ok,
  //       data: data,
  //     };
  //   } catch (error: unknown) {
  //     return {
  //       status: 0,
  //       ok: false,
  //       data: {
  //         error:
  //           error instanceof Error
  //             ? error.message
  //             : "Unknown client error occurred",
  //       },
  //     };
  //   }
  // }

  // public async deleteDocumentById(
  //   id: string | number
  // ): Promise<SDKTypes.APIResponse> {
  //   try {
  //     const response = await fetch(`${this.baseURL}/document/${id}`, {
  //       method: "DELETE",
  //       headers: {
  //         "x-api-key": this.apiKey,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     const data = await response.json();

  //     return {
  //       status: response.status,
  //       ok: response.ok,
  //       data: data,
  //     };
  //   } catch (error: unknown) {
  //     return {
  //       status: 0,
  //       ok: false,
  //       data: {
  //         error:
  //           error instanceof Error
  //             ? error.message
  //             : "Unknown client error occurred",
  //       },
  //     };
  //   }
  // }
}

// let client = new Client({
//   apiKey: process.env.API_KEY!,
//   baseURL: process.env.BASE_URL!,
// });

// const testFunction = async () => {
//   const res1 = await client.getDocuments({ limit: -1 });
//   if (!res1.ok) {
//     console.log(res1.error);
//     if (typeof res1.error !== "string") {
//       res1.error.issues
//     }
//   } else {
//     res1.data.documents[0].metadata;
//   }
// };

// testFunction();
