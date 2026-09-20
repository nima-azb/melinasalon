import { randomUUID } from "node:crypto";

export function createAIOriginalKey(userId: string, extension: string) {
  return `ai-hairdresser/originals/${userId}/${randomUUID()}.${extension}`;
}

export function createAIResultKey(userId: string, extension: string) {
  return `ai-hairdresser/results/${userId}/${randomUUID()}.${extension}`;
}

export function createServiceImageKey(serviceId: string, extension: string) {
  return `services/${serviceId}/${randomUUID()}.${extension}`;
}
