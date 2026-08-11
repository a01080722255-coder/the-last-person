import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Last Person",
  description: "A first-person and third-person zombie survival web game prototype.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const refreshRecoveryScript = `
(() => {
  const key = "the-last-person-import-retry";
  const recover = (reason) => {
    const message = String(reason && (reason.message || reason.reason || reason));
    if (!/dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(message)) return;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    const url = new URL(location.href);
    url.searchParams.set("refresh", String(Date.now()));
    location.replace(url.toString());
  };
  window.addEventListener("error", (event) => recover(event.error || event.message));
  window.addEventListener("unhandledrejection", (event) => recover(event.reason));
  window.addEventListener("load", () => sessionStorage.removeItem(key));
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: refreshRecoveryScript }} />
        {children}
      </body>
    </html>
  );
}
