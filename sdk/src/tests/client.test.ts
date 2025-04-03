import dotenv from "dotenv";
import { Client } from "../index";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "";
const API_KEY = process.env.API_KEY || "";

let client: Client;

// IMPORTANT TESTING NOTE:
// Some tests rely on documents existing in the DB to work, e.g. getById, deleteById
// If time allows, change tests to create a document instead

beforeAll(() => {
  client = new Client({ apiKey: API_KEY, baseURL: BASE_URL });
});

describe("SDK Client initialization", () => {
  test("should initialize client correctly", () => {
    expect(client).toBeDefined();
  });

  test("should handle invalid API key", async () => {
    const invalidClient = new Client({
      apiKey: "invalid",
      baseURL: BASE_URL,
    });
    const response = await invalidClient.getDocuments();

    expect(response).toMatchObject({
      status: 403,
      ok: false,
      error: expect.any(String),
    });

    if (!response.ok) {
      expect(response.error).toBe("Forbidden");
    } else {
      throw new Error(`Expected a 403 response but got ${response.status}`);
    }
  });

  test("should return an error for wrong endpoint", async () => {
    const invalidClient = new Client({
      apiKey: API_KEY,
      baseURL: "http://invalid-url",
    });
    const response = await invalidClient.getDocuments();

    expect(response).toMatchObject({
      status: 0,
      ok: false,
      error: expect.any(String),
    });

    if (!response.ok) {
      expect(response.error).toBe("Unknown client error occurred");
    } else {
      throw new Error(
        `Expected a client error response (0) but got ${response.status}`
      );
    }
  });
});

describe("getDocuments", () => {
  test("should fetch all documents when no arguments passed", async () => {
    const response = await client.getDocuments();

    if (response.ok) {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("documents");
      expect(response.data.limit).toBe(20);
      expect(response.data.offset).toBe(0);
    } else {
      throw new Error(`Expected a 200 response but got ${response.status}`);
    }
  });

  test("should fetch documents with limit and offset", async () => {
    const response = await client.getDocuments({ limit: 1, offset: 1 });

    if (response.ok) {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("documents");
      expect(response.data.limit).toBe(1);
      expect(response.data.offset).toBe(1);
    } else {
      throw new Error(`Expected a 200 response but got ${response.status}`);
    }
  });

  test("should fetch documents with just limit", async () => {
    const response = await client.getDocuments({ limit: 1 });

    if (response.ok) {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("documents");
      expect(response.data.limit).toBe(1);
      expect(response.data.offset).toBe(0);
    } else {
      throw new Error(`Expected a 200 response but got ${response.status}`);
    }
  });

  test("should fetch documents with string arguments", async () => {
    const response = await client.getDocuments({ limit: "1", offset: "1" });

    if (response.ok) {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("documents");
      expect(response.data.limit).toBe(1);
      expect(response.data.offset).toBe(1);
    } else {
      throw new Error(`Expected a 400 response but got ${response.status}`);
    }
  });

  test("negative limit/offset are considered invalid", async () => {
    const response = await client.getDocuments({ limit: -1, offset: -1 });

    if (!response.ok) {
      expect(response.status).toBe(400);
      if (typeof response.error !== "string" && "name" in response.error) {
        expect(response.error.name).toBe("ZodError");
      } else {
        throw new Error(`Expected a ZodError but got a server or client error`);
      }
    } else {
      throw new Error(`Expected a 400 response but got ${response.status}`);
    }
  });

  test("non-number inputs are considered invalid", async () => {
    const response = await client.getDocuments({
      limit: false as any as string,
      offset: false as any as string,
    });

    if (!response.ok) {
      expect(response.status).toBe(400);
      if (typeof response.error !== "string" && "name" in response.error) {
        expect(response.error.name).toBe("ZodError");
      } else {
        throw new Error(`Expected a ZodError but got a server or client error`);
      }
    } else {
      throw new Error(`Expected a 400 response but got ${response.status}`);
    }
  });
});

// describe("getDocumentById", () => {
//   test("should fetch document with an id that exists in the db", async () => {
//     let response = await client.getDocuments();

//     if (!response.ok) throw new Error(`Expected a 200 response fetching all docs but got ${response.status}`)

//     const document1 = response.data.documents[0];
//     response = await client.getDocumentById(document1.id);

//     expect(response).toHaveProperty("status");
//     expect(response).toHaveProperty("ok");
//     expect(response).toHaveProperty("data");
//     expect(response.data).toHaveProperty("document");
//   });

//   // test("should fetch document when a string version of number is used", async () => {
//   //   let response = await client.getDocuments();
//   //   expect(response).toHaveProperty("status");
//   //   expect(response).toHaveProperty("ok");
//   //   expect(response).toHaveProperty("data");

//   //   const document1 = response.data.documents[0];
//   //   response = await client.getDocumentById(String(document1.id));

//   //   expect(response).toHaveProperty("status");
//   //   expect(response).toHaveProperty("ok");
//   //   expect(response).toHaveProperty("data");
//   //   expect(response.data).toHaveProperty("document");
//   // });

//   // test("should respond appropriately when doc id doesn't exist in the db", async () => {
//   //   const response = await client.getDocumentById(10000);
//   //   expect(response).toHaveProperty("status");
//   //   expect(response).toHaveProperty("ok");
//   //   expect(response).toHaveProperty("data");

//   //   expect(response.status).toBe(404);
//   //   expect(response.data).toHaveProperty("error");
//   //   expect(response.data.error).toBe("Document Not Found");
//   // });

//   // test("negative id inputs are considered invalid", async () => {
//   //   const response = await client.getDocumentById(-1);
//   //   expect(response).toHaveProperty("status");
//   //   expect(response).toHaveProperty("ok");
//   //   expect(response).toHaveProperty("data");

//   //   expect(response.status).toBe(400);
//   //   expect(response.data).toHaveProperty("error");
//   //   expect(response.data.error.name).toBe("ZodError");
//   // });

//   // test("non-number id inputs are considered invalid", async () => {
//   //   const response = await client.getDocumentById(false as any as number);
//   //   expect(response).toHaveProperty("status");
//   //   expect(response).toHaveProperty("ok");
//   //   expect(response).toHaveProperty("data");

//   //   expect(response.status).toBe(400);
//   //   expect(response.data).toHaveProperty("error");
//   //   expect(response.data.error.name).toBe("ZodError");
//   // });
// });

// describe("deleteDocumentById", () => {
//   test("should delete document with an id that exists in the db", async () => {
//     let response = await client.getDocuments();
//     expect(response).toHaveProperty("status");
//     expect(response).toHaveProperty("ok");
//     expect(response).toHaveProperty("data");

//     const document = response.data.documents[0];
//     await client.deleteDocumentById(document.id);

//     console.log(document, document.id);
//     response = await client.getDocumentById(document.id);
//     console.log(response);
//     expect(response).toHaveProperty("status");
//     expect(response).toHaveProperty("ok");
//     expect(response).toHaveProperty("data");
//     expect(response.status).toBe(200);
//     console.log(response);
//   });
// });

//valid
// Request with valid path ID (non-negative number) for a document that exists
// Request with valid path ID (non-negative number) for a document that does not exist

//invalid
// Request with an invalid path ID (negative or non-number data type) for a document
