import * as SDKTypes from "./types";
import dotenv from "dotenv";

dotenv.config()

const BASE_URL = "https://lyy24w2m32.execute-api.us-east-1.amazonaws.com/testStage";
const API_KEY = process.env.API_KEY || '';

async function callGetDocuments(
  {limit, offset} : SDKTypes.GetDocsParameter
) {
  let desiredFormat = {
    "documents": [],
      "limit": limit,
      "offset": offset,
      "total": limit,
  };

  try {
    const response = await fetch(`${BASE_URL}/document`, {
      headers: {
        "x-api-key": API_KEY,
      }
    })

    if (!response.ok) {
      throw new Error(`Response status: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    desiredFormat.documents = json.documents.slice(offset).slice(0, limit);

    console.log(desiredFormat)
    return desiredFormat;

  } catch (error: unknown) {
    console.error("Error in callGetById:", error);
    throw new Error(`Error fetching documents: ${error instanceof Error ? error.message : error}`);
  }
}

/*
Tests
callGetDocuments({ limit: '1', offset: '10'});
callGetDocuments({ limit: '3', offset: '2'});
callGetDocuments({ limit: '5', offset: '5'});
*/


async function callPostImagesForEmbedding() { // no parameters

}
/*
Test
call();
*/



async function callGetDocById(id: string): Promise<SDKTypes.DocumentResponse> {
  if (!id) {
    throw new Error("Document ID is required");
  }

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
    console.error("Error in callGetDocById:", error);
    throw new Error(`Error fetching document with ID ${id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/*
Test
callGetDocById('135')
*/


async function callSearch() { // no parameters

  /* request body:
    {
    "url": "string",
    "desc": "string",
    "threshold": 0,
    "topK": 10
    }
  */
 // let response;

  const response = await fetch(`${BASE_URL}/search`, {
    headers: {
      "x-api-key": API_KEY,
    },
    method: "POST",
    body: JSON.stringify({
      "url": "string",   // sth real
      "desc": "string",  // sth real
      "threshold": 0,
      "topK": 10
      }),
  });
/*
  try {
    response = await fetch(`${BASE_URL}/search`, {
      headers: {
        "x-api-key": API_KEY,
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Response status: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    console.log("Response JSON:", json);
    // return json;
  } catch (error: unknown) {
    console.error("Error in callGetById:", error);
    throw new Error(`Error fetching: ${error instanceof Error ? error.message : error}`);
  }

  return response; */
 // console.log('happening')
}

// callSearch();

async function callDeleteDocById(id: string): Promise<SDKTypes.DeleteDocumentResponse> {
  if (!id) {
    throw new Error("Document ID is required");
  }

  try {
    // Include query parameters in the request
    const response = await fetch(`${BASE_URL}/delete/${id}`, {
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
    return result;
  } catch (error: unknown) {
    console.error("Error in callDeleteDocById:", error);
    throw new Error(`Error deleting document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// callDeleteDocById('152');

export class DocumentAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async callGetDocById2(
    { limit = '10', offset = '0' }: SDKTypes.GetDocsParameter
  ): Promise<SDKTypes.DocumentsResponse> {
    try {
      // Include query parameters in the request
      const url = new URL(`${BASE_URL}/document`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          "x-api-key": API_KEY,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }

      const json = await response.json();

      // Assuming the API doesn't handle pagination and returns all documents
      // We manually handle pagination client-side
      const paginatedDocuments = json.documents.slice(offset, offset + limit);

      return {
        documents: paginatedDocuments,
        limit: limit,
        offset: offset,
        total: json.documents?.length || 0 // Return actual total count, not just limit
      };
    } catch (error: unknown) {
      console.error("Error in callGetDocuments:", error);
      throw new Error(`Error fetching documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /*
  public async getDocById(id: string): Promise<SDKTypes.DocumentsResponse> {
    return await this.callGetDocById(id);
  }
*/
}

// const params = {
//   limit: '1',
//   offset: '1',
// };
/*
Test
let api = new DocumentAPI(API_KEY);
console.log(api.getDocuments(params));
*/
