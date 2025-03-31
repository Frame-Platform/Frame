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
    let searchRequest: SearchJSONType | undefined;

    if (contentType.startsWith("application/json")) {
      searchRequest = c.req.valid("json");
    } else if (contentType.startsWith("multipart/form-data")) {
      const formData = c.req.valid("form") as SearchMulitpartType;
      const { image, desc, threshold, topK } = formData;

      searchRequest = {
        ...(desc && { desc }),
        threshold,
        topK,
      };

      if (image && image.size > 0) {
        const { url, key } = await uploadImageToS3(image);
        imageKey = key;
        searchRequest = { ...searchRequest, url };
      }
    }

    if (searchRequest === undefined) {
      throw new Error("Search Request 'undefined'");
    }

    const { statusCode, error, documents } =
      await invokeSearchLambda(searchRequest);
    if (statusCode === 400) {
      return c.json({ error }, 400);
    }

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
