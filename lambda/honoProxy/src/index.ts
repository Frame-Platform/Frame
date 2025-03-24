// import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handle } from "hono/aws-lambda";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: "get",
    path: "/api/",
    request: {},
    responses: {
      200: {
        description: "Valid Response",
        content: {
          "text/plain": {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) => c.text("Hello Hono!", 200),
);

export const handler = handle(app);
