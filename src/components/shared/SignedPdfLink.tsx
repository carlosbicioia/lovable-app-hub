import { useStorageUrl } from "@/hooks/useStorageUrl";
import { ExternalLink } from "lucide-react";

interface Props {
  path: string | null;
  bucket?: string;
  label?: string;
  className?: string;
}

export default function SignedPdfLink({ path, bucket = "purchase-docs", label = "Ver PDF", className = "text-primary hover:underline text-xs" }: Props) {
  const url = useStorageUrl(path, bucket);

  if (!path || !url) return <span>—</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} onClick={(e) => e.stopPropagation()}>
      {label}
    </a>
  );
}
