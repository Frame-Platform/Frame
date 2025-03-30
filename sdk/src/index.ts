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



async function callGetDocById(id: string) {
  let response;

  try {
    response = await fetch(`${BASE_URL}/document/${id}`, {
      headers: {
        "x-api-key": API_KEY,
      }
    })

    if (!response.ok) {
      throw new Error(`Response status: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    console.log("Response JSON:", json);
    // return json;
  } catch (error: unknown) {
    console.error("Error in callGetById:", error);
    throw new Error(`Error fetching document with ID ${id}: ${error instanceof Error ? error.message : error}`);
  }

  return response;
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

async function callDeleteDocById(id: string) {

}


export class DocumentAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchDocuments({ limit, offset }): Promise<any> {
    let response;
    try {
      response = await fetch(`${BASE_URL}/document`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status} - ${response.statusText}`);
      }

      const json = await response.json();
      console.log('Response JSON:', json);
      return json;
    } catch (error: unknown) {
      console.error('Error fetching documents:', error);
      throw new Error(
        `Error fetching documents: ${error instanceof Error ? error.message : error}`
      );
    }

  }
    // Method to get documents
    public async getDocuments(params: SDKTypes.GetDocsParameter): Promise<SDKTypes.GetDocsReturn> {
      return await this.fetchDocuments(params);
    }
}

/* const params = {
  limit: '10',
  offset: '0',
};

let api = new DocumentAPI(API_KEY);
console.log(api.getDocuments(params));
 */
