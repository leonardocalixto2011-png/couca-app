/** Inspo photo uploads need a Vercel Blob store connected to the project. */
export function inspoUploadEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
