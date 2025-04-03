import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createDocumentRoute,
  deleteDocumentRoute,
  getDocumentByIdRoute,
  getDocumentsRoute,
  recommendRoute,
} from "./documents";
import {
  createDocumentHandler,
  deleteDocumentHandler,
  getDocumentByIdHandler,
  getDocumentsHandler,
  recommendHandler,
} from "./documents/handlers";
import { searchRoute } from "./search";
import { searchHandler } from "./search/handler";

export const initRoutes = (app: OpenAPIHono<{}, {}, "/">) => {
  app.openapi(getDocumentsRoute, getDocumentsHandler);
  app.openapi(getDocumentByIdRoute, getDocumentByIdHandler);
  app.openapi(createDocumentRoute, createDocumentHandler);
  app.openapi(deleteDocumentRoute, deleteDocumentHandler);
  app.openapi(searchRoute, searchHandler);
  app.openapi(recommendRoute, recommendHandler);
};
