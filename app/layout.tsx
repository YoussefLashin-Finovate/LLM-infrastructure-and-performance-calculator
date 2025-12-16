import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Performance Calculator | Finovate",
  description: "Calculate theoretical and realistic tokens/sec, quantization effects, and concurrent user capacity based on MLCommons methodology",
  icons: {
    icon: "https://finov8.ai/wp-content/uploads/2025/07/cropped-Finovate-Logo-32x32.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="main-container">
          {children}
        </div>
      </body>
    </html>
  );
}
