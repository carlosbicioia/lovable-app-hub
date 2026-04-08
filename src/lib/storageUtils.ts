import { supabase } from "@/integrations/supabase/client";

/**
 * Get a signed URL for a private storage bucket file.
 * Returns a URL valid for 1 hour (3600 seconds).
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Get a storage URL - uses signed URLs for private buckets, public URLs for public ones.
 */
export async function getStorageUrl(bucket: string, path: string): Promise<string> {
  const privateBuckets = ["service-media", "purchase-docs", "delivery-notes"];
  if (privateBuckets.includes(bucket)) {
    const signed = await getSignedUrl(bucket, path);
    return signed || "";
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
