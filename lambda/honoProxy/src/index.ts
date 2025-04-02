import { handle } from "hono/aws-lambda";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import dotenv from "dotenv";
import { initRoutes } from "./routes";

const app = new OpenAPIHono();
dotenv.config();
app.use(cors({ origin: "*" }));

// Middleware for parsing multipart form data before zod validation.
app.use("/search", async (c, next) => {
  if (c.req.header("Content-Type")?.startsWith("multipart/form-data")) {
    await c.req.parseBody();
    return await next();
  }
  return await next();
});

initRoutes(app);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Pictura",
  },
});

app.all("*", (c) => {
  return c.text("404 Not Found", 404);
});

export const handler = handle(app);
