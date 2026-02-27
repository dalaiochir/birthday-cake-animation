import "./globals.css";

export const metadata = {
  title: "Төрсөн өдрийн мэнд 🎂",
  description: "Romantic birthday surprise"
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}