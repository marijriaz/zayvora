import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zayvora | Restaurant & Dining",
  description:
    "Thoughtful cooking, warm hospitality, and beautiful moments around the table at Zayvora.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
