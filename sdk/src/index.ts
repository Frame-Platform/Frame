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
  ): Promise<SDKTypes.APIResponse> {
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

      return {
        status: response.status,
        ok: response.ok,
        data: data,
      };
    } catch (error: unknown) {
      // just handling client-side errors (url endpoint is wrong, network failure)
      return {
        status: 0,
        ok: false,
        data: {
          error:
            error instanceof Error
              ? error.message
              : "Unknown client error occurred",
        },
      };
    }
  }
}

//   public async getDocumentById(id: string): Promise<SDKTypes.DocumentResponse> {
//     try {
//       const response = await fetch(`${BASE_URL}/document/${id}`, {
//         method: "GET",
//         headers: {
//           "x-api-key": API_KEY,
//           Accept: "application/json",
//         },
//       });

//       if (!response.ok) {
//         if (response.status === 404) {
//           throw new Error(`Document with ID ${id} not found`);
//         } else if (response.status === 400) {
//           throw new Error(`Bad request: Invalid document ID format`);
//         } else if (response.status === 401 || response.status === 403) {
//           throw new Error(`Authentication or authorization error`);
//         } else if (response.status === 500) {
//           throw new Error(`Server error occurred while retrieving document`);
//         } else {
//           throw new Error(
//             `Failed to retrieve document: ${response.status} ${response.statusText}`
//           );
//         }
//       }

//       const json = await response.json();
//       console.log(json);
//       return json;
//     } catch (error: unknown) {
//       console.error("Error in getDocumentById:", error);
//       throw new Error(
//         `Error fetching document with ID ${id}: ${
//           error instanceof Error ? error.message : String(error)
//         }`
//       );
//     }
//   }

//   public async deleteDocById(
//     id: string
//   ): Promise<SDKTypes.DeleteDocumentResponse> {
//     if (!id) {
//       throw new Error("Document ID is required");
//     }

//     try {
//       // Include query parameters in the request
//       const response = await fetch(`${BASE_URL}/document/${id}`, {
//         method: "DELETE",
//         headers: {
//           "x-api-key": API_KEY,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         if (response.status === 400) {
//           throw new Error(`Bad request: Invalid document ID or format`);
//         } else if (response.status === 404) {
//           throw new Error(`Document with ID ${id} not found`);
//         } else if (response.status === 500) {
//           throw new Error(`Server error occurred while deleting document`);
//         } else {
//           throw new Error(
//             `Failed to delete document: ${response.status} ${response.statusText}`
//           );
//         }
//       }

//       const result = await response.json();
//       console.log(result);
//       return result;
//     } catch (error: unknown) {
//       console.error("Error in callDeleteDocById:", error);
//       throw new Error(
//         `Error deleting document: ${
//           error instanceof Error ? error.message : String(error)
//         }`
//       );
//     }
//   }

//   /*
//   public async getDocById(id: string): Promise<SDKTypes.DocumentsResponse> {
//     return await this.callGetDocById(id);
//   }
// */
// }

// /*
// Tests
// callGetDocuments({ limit: '1', offset: '10'});
// callGetDocuments({ limit: '3', offset: '2'});
// callGetDocuments({ limit: '5', offset: '5'});
// */

// async function callPostDocument(): Promise<SDKTypes.PostImageSuccess | Error> {
//   // no parameters
//   const testPost = {
//     images: [
//       {
//         desc: "Chase's pet monkey",
//       },
//     ],
//   };

//   try {
//     const response = await fetch(`${BASE_URL}/document`, {
//       method: "POST",
//       headers: {
//         "x-api-key": API_KEY,
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(testPost),
//     });

//     if (!response.ok) {
//       const errorText = await response.text(); // Capture error response if available
//       throw new Error(
//         `Response status: ${response.status} - ${response.statusText}\n${errorText}`
//       );
//     }

//     const json = await response.json();
//     console.log("Response JSON:", json);
//     return json;
//   } catch (error: unknown) {
//     console.error("Error in search:", error);
//     throw new Error(
//       `Error fetching: ${
//         error instanceof Error ? error.message : String(error)
//       }`
//     );
//   }
// }
// /*
// Test
// callPostDocument()
// */

// /*
// Test
// callGetDocById('168')
// */

// async function callSearch() {
//   // no parameters
//   const testPost = {
//     url: "https://media.newyorker.com/photos/59095bb86552fa0be682d9d0/master/pass/Monkey-Selfie.jpg",
//     desc: "terrible website",
//     threshold: 0,
//     topK: 10,
//   };

//   try {
//     const response = await fetch(`${BASE_URL}/search`, {
//       method: "POST",
//       headers: {
//         "x-api-key": API_KEY,
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(testPost),
//     });

//     if (!response.ok) {
//       const errorText = await response.text(); // Capture error response if available
//       throw new Error(
//         `Response status: ${response.status} - ${response.statusText}\n${errorText}`
//       );
//     }

//     const json = await response.json();
//     console.log("Response JSON:", json);
//     return json;
//   } catch (error: unknown) {
//     console.error("Error in search:", error);
//     throw new Error(
//       `Error fetching: ${
//         error instanceof Error ? error.message : String(error)
//       }`
//     );
//   }
// }
