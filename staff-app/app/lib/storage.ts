import { del, get, head, put } from "@vercel/blob";

export type SafeDealBucket = {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream<Uint8Array> } | null>;
  head(key: string): Promise<{ customMetadata?: Record<string, string> } | null>;
};

const files: SafeDealBucket = {
  async put(key, value, options) {
    return put(key, value, { access: "private", contentType: options?.httpMetadata?.contentType, allowOverwrite: false });
  },
  async delete(key) {
    await del(key);
  },
  async get(key) {
    const result = await get(key, { access: "private" });
    return result?.statusCode === 200 && result.stream ? { body: result.stream } : null;
  },
  async head(key) {
    try {
      await head(key);
      return { customMetadata: {} };
    } catch {
      return null;
    }
  },
};

export function getFilesBucket() {
  return files;
}
