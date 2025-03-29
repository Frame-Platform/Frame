import { pgConnect } from "../../db";

export const pgGetDocuments = async (
  limit: number, // default limit is 1mil, default offset is 0 => returns all
  offset: number,
) => {
  try {
    const pgClient = await pgConnect();

    const query = `
            SELECT id, url, description FROM documents
            ORDER BY id DESC LIMIT $1 OFFSET $2
    `;
    const { rows } = await pgClient.query(query, [limit, offset]);
    return rows;
  } catch (e) {
    throw new Error(`Error getting documents: ${e}`);
  }
};
