import * as SDKTypes from "./types";
import dotenv from "dotenv";

dotenv.config()

const BASE_URL = "https://lyy24w2m32.execute-api.us-east-1.amazonaws.com/testStage";
const API_KEY = process.env.API_KEY || '';

export class Client {
  private apiKey: string;

  constructor({ apiKey }) {
    this.apiKey = apiKey;
  }

  public async getDocuments(
    { limit = '20', offset = '0' }: SDKTypes.GetDocsParameter = {}
  ): Promise<SDKTypes.GetDocsReturn | SDKTypes.ErrorResponse> {

    const url = `${BASE_URL}/document?limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          "x-api-key": API_KEY,
        },
      })

      if (!response.ok) {
        const errorResponse = await response.json(); // Extract error response

        throw new Error(
          JSON.stringify({
            status: response.status,
            message: errorResponse?.error
          })
        );
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {

        // Attempt to parse the error message as JSON (to extract structured errors)
        const parsedError = JSON.parse(error.message);

        switch (parsedError.status) {
          case 400:
            console.error("Validation error:", parsedError.message);
            return { error: parsedError }; // Return structured error object
          case 500:
            console.error("Server error:", parsedError.message);
            return { error: parsedError };
          default:
            throw new Error(`Unhandled error: ${parsedError.message}`);
        }
      }

      throw new Error("An unknown error occurred");
    }
  }

  public async getDocumentById(id: string): Promise<SDKTypes.DocumentResponse> {
    try {

      const response = await fetch(`${BASE_URL}/document/${id}`, {
        method: 'GET',
        headers: {
          "x-api-key": API_KEY,
          "Accept": "application/json"
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Document with ID ${id} not found`);
        } else if (response.status === 400) {
          throw new Error(`Bad request: Invalid document ID format`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication or authorization error`);
        } else if (response.status === 500) {
          throw new Error(`Server error occurred while retrieving document`);
        } else {
          throw new Error(`Failed to retrieve document: ${response.status} ${response.statusText}`);
        }
      }

      const json = await response.json();
      console.log(json)
      return json;
    } catch (error: unknown) {
      console.error("Error in getDocumentById:", error);
      throw new Error(`Error fetching document with ID ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async deleteDocById(id: string): Promise<SDKTypes.DeleteDocumentResponse> {
    if (!id) {
      throw new Error("Document ID is required");
    }

    try {
      // Include query parameters in the request
      const response = await fetch(`${BASE_URL}/document/${id}`, {
        method: 'DELETE',
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`Bad request: Invalid document ID or format`);
        } else if (response.status === 404) {
          throw new Error(`Document with ID ${id} not found`);
        } else if (response.status === 500) {
          throw new Error(`Server error occurred while deleting document`);
        } else {
          throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log(result)
      return result;
    } catch (error: unknown) {
      console.error("Error in callDeleteDocById:", error);
      throw new Error(`Error deleting document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /*
  public async getDocById(id: string): Promise<SDKTypes.DocumentsResponse> {
    return await this.callGetDocById(id);
  }
*/
}

/*
Tests
callGetDocuments({ limit: '1', offset: '10'});
callGetDocuments({ limit: '3', offset: '2'});
callGetDocuments({ limit: '5', offset: '5'});
*/

async function callPostDocument(): Promise<SDKTypes.PostImageSuccess | Error>{ // no parameters
  const testPost = {
    "images": [
      {
        "desc": "Chase's pet monkey"
      },
    ]
  }

try {
  const response = await fetch(`${BASE_URL}/document`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(testPost),
  });

    if (!response.ok) {
      const errorText = await response.text(); // Capture error response if available
      throw new Error(`Response status: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const json = await response.json();
    console.log("Response JSON:", json);
    return json;
  } catch (error: unknown) {
    console.error("Error in search:", error);
    throw new Error(`Error fetching: ${error instanceof Error ? error.message : String(error)}`);
  }
}
/*
Test
callPostDocument()
*/



/*
Test
callGetDocById('168')
*/

async function callSearch() { // no parameters
  const testPost = {
    "url": "https://media.newyorker.com/photos/59095bb86552fa0be682d9d0/master/pass/Monkey-Selfie.jpg",
    "desc": "terrible website",
    "threshold": 0,
    "topK": 10
  }

 try {
  const response = await fetch(`${BASE_URL}/search`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(testPost),
  });

    if (!response.ok) {
      const errorText = await response.text(); // Capture error response if available
      throw new Error(`Response status: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const json = await response.json();
    console.log("Response JSON:", json);
    return json;
  } catch (error: unknown) {
    console.error("Error in search:", error);
    throw new Error(`Error fetching: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/* Test
callSearch();
*/


let api = new Client({ apiKey: API_KEY });


/* tests */
/* should work */
// api.getDocuments();
// api.getDocuments({ limit: '2', offset: '3' });
// api.getDocuments({ limit: '2' });
// api.getDocuments({ offset: '2' });
// api.getDocuments({ limit: '2', offset: '2', bs: 'idk' });  * requires changing parameter type to any to run

/* shouldn't work */
api.getDocuments({ limit: '-2', offset: '3' });


// api.getDocumentById('190');
// api.callDeleteDocById('172');
