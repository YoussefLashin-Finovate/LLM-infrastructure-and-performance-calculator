import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} antialiased bg-slate-100 min-h-screen text-slate-900 selection:bg-indigo-100 selection:text-indigo-900`} suppressHydrationWarning>
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 opacity-95" />

          <div
            className="absolute -left-28 -top-24 w-80 h-80 rounded-full blur-3xl opacity-60"
            style={{ background: 'radial-gradient(circle at 25% 25%, rgba(148,163,184,0.08), transparent 30%)' }}
          />

          <div
            className="absolute -right-32 -bottom-28 w-96 h-96 rounded-full blur-2xl opacity-40"
            style={{ background: 'radial-gradient(circle at 75% 75%, rgba(148,163,184,0.06), transparent 30%)' }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
