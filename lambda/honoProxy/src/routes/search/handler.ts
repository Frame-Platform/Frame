import { RouteHandler } from "@hono/zod-openapi";
import { SearchJSONType, SearchMulitpartType } from "./schema";
import {
  deleteImageFromS3,
  uploadImageToS3,
  invokeSearchLambda,
} from "./services";
import { searchRoute } from ".";

export const searchHandler: RouteHandler<typeof searchRoute> = async (c) => {
  let imageKey: string | null = null;
  try {
    const contentType = c.req.header("Content-Type") || "";
    let message: SearchJSONType | undefined;

    if (contentType.startsWith("application/json")) {
      const jsonData = c.req.valid("json");
      message = jsonData;
    } else if (contentType.startsWith("multipart/form-data")) {
      const { image, desc, threshold, topK } = c.req.valid(
        "form",
      ) as SearchMulitpartType;

      message = {
        ...(desc && { desc }),
        threshold,
        topK,
      };

      if (image && image.size > 0) {
        const { url, key } = await uploadImageToS3(image);
        imageKey = key;
        message = { ...message, url };
      }
    }

    if (message === undefined) {
      throw new Error("Error message undefined");
    }
    const documents = await invokeSearchLambda(message);

    return c.json({ hits: documents, count: documents.length }, 200);
  } catch (e) {
    console.log(`Error in searchHandler ${e}`);
    return c.json({ error: "Internal Server Error" }, 500);
  } finally {
    if (imageKey) {
      await deleteImageFromS3(imageKey);
    }
  }
};
