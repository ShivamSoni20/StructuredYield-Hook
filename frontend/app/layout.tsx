import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "StructuredYield Hook",
  description: "Fixed-income primitives for Uniswap V4 LP positions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
