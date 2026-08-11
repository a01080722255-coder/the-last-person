import type { Metadata } from "next";
import "./globals.css";

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
    const lastRetry = Number(sessionStorage.getItem(key) || "0");
    if (Date.now() - lastRetry < 15000) return;
    sessionStorage.setItem(key, String(Date.now()));
    const url = new URL(location.href);
    url.searchParams.set("refresh", String(Date.now()));
    location.replace(url.toString());
  };
  window.addEventListener("error", (event) => recover(event.error || event.message));
  window.addEventListener("unhandledrejection", (event) => recover(event.reason));
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <script id="refresh-recovery" dangerouslySetInnerHTML={{ __html: refreshRecoveryScript }} />
        {children}
      </body>
    </html>
  );
}
