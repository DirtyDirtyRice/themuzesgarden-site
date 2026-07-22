import type { Metadata } from "next";
import "./globals.css";
import ApplicationChrome from "./components/ApplicationChrome";
import { AuthProvider } from "./components/AuthProvider";

export const metadata: Metadata = {
  title: "The Muzes Garden",
  description: "The Muzes Garden – audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <AuthProvider>
          <ApplicationChrome>{children}</ApplicationChrome>
        </AuthProvider>
      </body>
    </html>
  );
}