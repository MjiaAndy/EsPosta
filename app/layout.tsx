import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import { Providers } from "./providers"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EsPosta | Verificación Inteligente",
  description: "Tu asistente de IA para analizar la credibilidad de contenido digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}