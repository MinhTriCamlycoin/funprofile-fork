import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ← DÁN 3 THỨ CON VỪA COPY VÀO ĐÂY
const R2_ACCOUNT_ID = 6083e34ad429331916b93ba8a5ede81d;        // ← Thay bằng Account ID của con
const R2_ACCESS_KEY_ID = 67fc0c23f814b56afa5e328c14e0ec23;           // ← Thay bằng API Token
const R2_SECRET_ACCESS_KEY = 40ca5c5da893119bbb13f8dbec7b8d0dfe2b23468967d4d02ac8eee5e1b18bac;          // ← Thay bằng Secret

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToR2 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const key = `uploads/${Date.now()}-${file.name}`;

  await client.send(new PutObjectCommand({
    Bucket: "fun-rich-media",
    Key: key,
    Body: Buffer.from(arrayBuffer),
    ContentType: file.type,
  }));

  return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
};