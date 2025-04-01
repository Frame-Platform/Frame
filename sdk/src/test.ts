import * as SDKTypes from "./types";
import dotenv from "dotenv";
import { Client } from './index';

dotenv.config()

const API_KEY = process.env.API_KEY || '';

let api = new Client({ apiKey: API_KEY });
/*  Valid  */
// api.getDocuments({ limit: '1', offset: '1' }); // Request with valid query params limit and offset, should return properly
// api.getDocuments({ limit: '3' }); // Request with valid limit and NO OFFSET argument
// api.getDocuments({ offset: '1 '}); // Request with valid offset argument and NO LIMIT
// api.getDocuments(); // Request with no arguments

/* Invalid */
// api.getDocuments({ 'limit': '-2' }); // when limit is negative,  message: 'Limit must be at least 1.'
// api.getDocuments({ limit: false as any as string });   COME BACK TO / FIX ON SERVER SIDE
// api.getDocuments({ 'offset': '-2' }); // when offset is negative,  message: 'Limit must be at least 1.'
// api.getDocuments({ 'offset': false as any as string }); // COME BACK TO / FIX ON SERVER SIDE





/*  DELETE docs test */
// api.callDeleteDocById() id string needed
