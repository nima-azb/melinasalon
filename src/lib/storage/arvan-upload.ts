import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { arvanS3, ARVAN_S3_BUCKET, ARVAN_S3_ENDPOINT } from "./arvan";

export async function uploadToArvan({
  key,
  body,
  contentType,
  publicRead = false,
}: {
  key: string;
  body: Buffer;
  contentType: string;
  // Only ever pass true for content that's genuinely meant to be public
  // (e.g. service photos shown on the homepage to anyone). AI generation
  // photos must stay private and use getArvanSignedReadUrl instead.
  publicRead?: boolean;
}) {
  await arvanS3.send(
    new PutObjectCommand({
      Bucket: ARVAN_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(publicRead ? { ACL: "public-read" as const } : {}),
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

// A stable, non-expiring URL for an object uploaded with publicRead: true.
// Only valid for objects actually stored with a public-read ACL.
export function getArvanPublicUrl(key: string) {
  return `${ARVAN_S3_ENDPOINT}/${ARVAN_S3_BUCKET}/${key}`;
}

// Extracts the object key back out of a URL produced by getArvanPublicUrl,
// so a stored public image can be deleted (e.g. when replaced or the
// service itself is deleted) without persisting the key separately.
export function getArvanKeyFromPublicUrl(url: string): string | null {
  const prefix = `${ARVAN_S3_ENDPOINT}/${ARVAN_S3_BUCKET}/`;

  if (!url.startsWith(prefix)) {
    return null;
  }

  return url.slice(prefix.length);
}
