import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_PUBLIC_BASE_URL = process.env.AWS_S3_PUBLIC_BASE_URL;

let s3Client: S3Client | null = null;

function assertS3Config() {
  if (!AWS_REGION || !AWS_S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "Missing AWS S3 env vars. Required: AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    );
  }
}

function getS3Client() {
  assertS3Config();

  if (!s3Client) {
    const endpoint =
      AWS_REGION === "us-east-1"
        ? "https://s3.amazonaws.com"
        : `https://s3.${AWS_REGION}.amazonaws.com`;
    s3Client = new S3Client({
      region: AWS_REGION,
      endpoint,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  return s3Client;
}

function encodeS3Key(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export async function generatePresignedUrl({
  key,
  contentType,
  expiresIn = 900,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  assertS3Config();

  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(getS3Client(), command, { expiresIn });

  return {
    url,
    key,
  };
}

export async function uploadFile({
  file,
  url,
  contentType,
}: {
  file: File;
  url: string;
  contentType: string;
}) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`S3 upload failed (${response.status}): ${responseText}`);
  }
}

export function getPublicS3Url(key: string) {
  assertS3Config();

  if (AWS_S3_PUBLIC_BASE_URL) {
    return `${AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${encodeS3Key(key)}`;
  }

  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${encodeS3Key(key)}`;
}
