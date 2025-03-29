import { RouteHandler } from "@hono/zod-openapi";
import { getDocumentsRoute } from ".";
import { pgGetDocuments } from "./services";

export const getDocumentsHandler: RouteHandler<
  typeof getDocumentsRoute
> = async (c) => {
  try {
    const { limit, offset } = c.req.valid("query");
    const documents = await pgGetDocuments(limit, offset);

    return c.json(
      {
        documents,
        limit,
        offset,
        total: documents.length,
      },
      200,
    );
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
};
