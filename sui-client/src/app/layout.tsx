import "../styles/globals.scss";
import day from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { Metadata, Viewport } from "next";
import Script from "next/script";
import Header from "@/components/base/Layout/Header";
import WalletWrapper from "@/components/base/WalletWrapper";

day.extend(relativeTime);
day.extend(utc);

export const metadata: Metadata = {
  title: "XREI",
  description: "XREI",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 2,
  userScalable: false,
};

function Layout({ children }: { children: React.ReactElement }) {
  return (
    <html lang="en">
      <link rel="icon" href="/img/favicon.ico" sizes="any" />
      <body>
        <Script src="/js/icon.min.js" strategy="beforeInteractive"></Script>
        <WalletWrapper>
          <>
            <Header />
            {children}
          </>
        </WalletWrapper>
      </body>
    </html>
  );
}

export default Layout;
