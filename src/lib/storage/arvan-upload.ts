import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { arvanS3, ARVAN_S3_BUCKET } from "./arvan";

export async function uploadToArvan({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  await arvanS3.send(
    new PutObjectCommand({
      Bucket: ARVAN_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return key;
}

export async function deleteFromArvan(key: string) {
  await arvanS3.send(
    new DeleteObjectCommand({
      Bucket: ARVAN_S3_BUCKET,
      Key: key,
    }),
  );
}

// Generates a temporary, signed read URL for a private object.
// Used to hand external providers (e.g. AvalAI) a URL they can fetch
// without making the bucket or the object itself public.
export async function getArvanSignedReadUrl(
  key: string,
  expiresInSeconds = 600,
) {
  const command = new GetObjectCommand({
    Bucket: ARVAN_S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(arvanS3, command, { expiresIn: expiresInSeconds });
}
