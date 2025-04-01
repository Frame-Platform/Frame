import dotenv from "dotenv";
import { Client } from "./index";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "";
const API_KEY = process.env.API_KEY || "";

const testMethod = async (res) => {
  const apiRes = await res;
  console.log(apiRes);
};
let client = new Client({ apiKey: API_KEY, baseURL: BASE_URL });

/*  Valid  */
// testMethod(client.getDocuments({ limit: "1", offset: "1" })); // Limit + Offset
// testMethod(client.getDocuments({ limit: "3" })); // Just Limit
// testMethod(client.getDocuments({ offset: "1 " })); // Just Offset
// testMethod(client.getDocuments()); // No Optional

/* Invalid */
// testMethod(client.getDocuments({ limit: "-2" })); // Negative Limit
// testMethod(client.getDocuments({ limit: false as any as string })); // Non-number Limit
// testMethod(client.getDocuments({ offset: "-2" })); // Negative Offset
// testMethod(client.getDocuments({ offset: false as any as string })); // Non-number Offset

// Valid
testMethod(client.getDocumentById(1 as any as string));
/*  DELETE docs test */
// api.callDeleteDocById() id string needed
