export const extractDatabaseEndpoint = (output: string) => {
  const regex =
    /StorageStack\.DatabaseEndpoint = ([a-zA-Z0-9.-]+\.amazonaws\.com)/;
  const match = output.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  const fallbackRegex =
    /ExportsOutputFnGetAttVectorDatabase[^=]+=\s*([a-zA-Z0-9.-]+\.amazonaws\.com)/;
  const fallbackMatch = output.match(fallbackRegex);

  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  throw new Error("Could not extract database endpoint from output");
};
