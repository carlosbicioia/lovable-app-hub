import { useCompanySettings } from "@/hooks/useCompanySettings";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  className?: string;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-80 h-80",
};

export default function CompanyLogo({ className, fallback, size = "md" }: CompanyLogoProps) {
  const { data: settings } = useCompanySettings();
  const logoUrl = settings?.logo_url;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={settings?.company_name || "Logo"}
        className={cn(sizeClasses[size], "object-contain", className)}
      />
    );
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className={cn(sizeClasses[size], "rounded-lg bg-primary/10 flex items-center justify-center shrink-0", className)}>
      <span className="text-primary font-display font-bold text-sm">U</span>
    </div>
  );
}
