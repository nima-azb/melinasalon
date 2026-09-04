import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.ARVAN_S3_ENDPOINT;
const region = process.env.ARVAN_S3_REGION;
const accessKeyId = process.env.ARVAN_S3_ACCESS_KEY;
const secretAccessKey = process.env.ARVAN_S3_SECRET_KEY;
const bucket = process.env.ARVAN_S3_BUCKET;

if (!endpoint) {
  throw new Error("ARVAN_S3_ENDPOINT is not configured.");
}

if (!region) {
  throw new Error("ARVAN_S3_REGION is not configured.");
}

if (!accessKeyId) {
  throw new Error("ARVAN_S3_ACCESS_KEY is not configured.");
}

if (!secretAccessKey) {
  throw new Error("ARVAN_S3_SECRET_KEY is not configured.");
}

if (!bucket) {
  throw new Error("ARVAN_S3_BUCKET is not configured.");
}

export const arvanS3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export const ARVAN_S3_BUCKET = bucket;
