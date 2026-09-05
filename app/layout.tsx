import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "DOPO LOGISTICS & PROCUREMENT SERVICES",
  description: "A modern logistics and procurement services in Nigeria",
  icons: {
    icon: "/icons.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}