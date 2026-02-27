export const metadata = {
  title: "Happy Birthday 🎂",
  description: "Birthday surprise website"
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}