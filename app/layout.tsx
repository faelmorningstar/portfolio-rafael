import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rafael Amaral Silva — Desenvolvedor de Software Júnior",
  description: "Portfólio de Rafael Amaral Silva: interfaces, Python, APIs e automações com IA.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
