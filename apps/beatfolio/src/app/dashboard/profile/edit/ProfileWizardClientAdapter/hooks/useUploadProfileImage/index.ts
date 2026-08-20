import { createBeatfolioBffClient } from "../../../../../../../utils/client";

const readErrorMessage = (body: unknown): string | null =>
  typeof body === "object" &&
  body !== null &&
  "error" in body &&
  typeof body.error === "string" &&
  body.error !== ""
    ? body.error
    : null;

const readImageUrl = (body: unknown): string | null =>
  typeof body === "object" &&
  body !== null &&
  "imageUrl" in body &&
  typeof body.imageUrl === "string" &&
  body.imageUrl !== ""
    ? body.imageUrl
    : null;

export const useUploadProfileImage = () => {
  const uploadImage = async (artistId: string, file: File): Promise<string> => {
    const client = createBeatfolioBffClient();

    const res = await client.api.artists[":artistId"].profile.image.$post({
      param: { artistId },
      form: { file },
    });
    if (!res.ok) {
      const body: unknown = await res.json();
      throw new Error(
        readErrorMessage(body) ?? "画像のアップロードに失敗しました",
      );
    }

    const body: unknown = await res.json();
    const imageUrl = readImageUrl(body);
    if (imageUrl === null) {
      throw new Error("画像のアップロードに失敗しました");
    }
    return imageUrl;
  };

  return { uploadImage };
};
