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

app.get("/doc", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Swagger UI</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui'
        });
      </script>
    </body>
    </html>
  `);
});

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

app.all("*", (c) => {
  return c.text("404 Not Found", 404);
});

export const handler = handle(app);
