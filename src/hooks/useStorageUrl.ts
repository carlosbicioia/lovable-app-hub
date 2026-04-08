import { useState, useEffect } from "react";
import { getSignedUrl } from "@/lib/storageUtils";
import { supabase } from "@/integrations/supabase/client";

const PRIVATE_BUCKETS = ["service-media", "purchase-docs", "delivery-notes"];

/**
 * Resolves a storage path or legacy URL to a viewable URL.
 * For private buckets, generates a signed URL.
 */
export function useStorageUrl(pathOrUrl: string | null | undefined, bucket: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setUrl(null);
      return;
    }

    const isLegacy = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");

    if (isLegacy && PRIVATE_BUCKETS.includes(bucket)) {
      // Try to extract path from legacy URL
      const match = pathOrUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+?)(\?|$)/);
      if (match) {
        getSignedUrl(bucket, match[1]).then((u) => setUrl(u || pathOrUrl));
      } else {
        setUrl(pathOrUrl);
      }
    } else if (isLegacy) {
      setUrl(pathOrUrl);
    } else if (PRIVATE_BUCKETS.includes(bucket)) {
      getSignedUrl(bucket, pathOrUrl).then((u) => setUrl(u || ""));
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(pathOrUrl);
      setUrl(data.publicUrl);
    }
  }, [pathOrUrl, bucket]);

  return url;
}
