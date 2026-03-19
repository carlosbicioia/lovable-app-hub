import "@/App.css";

export const metadata = {
  title: "UrbanGO",
  description: "Gestión de servicios del hogar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
