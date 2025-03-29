import * as Types from "./types";

const BASE_URL = "https://lyy24w2m32.execute-api.us-east-1.amazonaws.com/testStage"
const API_KEY = "gHEQTYyjZP3FKHxWDIrwoa5bSbsDB11b9CCIPcW8";
// ^ npm install dotenv ? for .env to store API_key safely ?
// dotenv.config() ?

async function callGetDocuments(
  {limit, offset} : Types.getDocsSchema
) {
  let response;

  try {
    response = await fetch(`${BASE_URL}/document`, {
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
    throw new Error(`Error fetching documents: ${error instanceof Error ? error.message : error}`);
  }

  return response;
}

callGetDocuments({ limit: '1', offset: '10'});

async function callQImagesForEmbed() { // no parameters

}



async function callGetById(id: number | string) {
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

// callGetById(39)

async function callSearch() { // no parameters

}

async function callDeleteById(id: number | string) {

}
