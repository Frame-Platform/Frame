export const imgToBase64 = async (image: File) => {
  const bufferArray = await image.arrayBuffer();
  const imgBuffer = Buffer.from(bufferArray);
  return imgBuffer.toString("base64");
};
