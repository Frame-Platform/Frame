const BASE_URL = "https://lyy24w2m32.execute-api.us-east-1.amazonaws.com/testStage"
const API_KEY = "gHEQTYyjZP3FKHxWDIrwoa5bSbsDB11b9CCIPcW8";

async function callGetDocuments(limit: string, offset: string) {

}

async function callQImagesForEmbed(id: number | string) {

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

callGetById(39)

async function callSearch() {

}

async function callDeleteById(id: number | string) {

}
