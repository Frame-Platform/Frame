export const extractAPIEndpoint = (output: string) => {
  let apiEndpoint: string | null = null;

  const apiEndpointMatch = output.match(
    /ApiStack\.ApiEndpoint\s*=\s*(https:\/\/[^\s]+)/
  );

  if (apiEndpointMatch && apiEndpointMatch[1]) {
    apiEndpoint = apiEndpointMatch[1];
  }

  return apiEndpoint;
};

export const extractAPIKey = (output: string) => {
  let apiKeyId: string | null = null;

  const apiKeyMatch = output.match(/ApiStack\.ApiKeyId\s*=\s*([a-z0-9]+)/);

  if (apiKeyMatch && apiKeyMatch[1]) {
    apiKeyId = apiKeyMatch[1];
  }

  return apiKeyId;
};
