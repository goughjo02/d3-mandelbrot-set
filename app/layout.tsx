import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mandelbrot Set (in d3)",
  description:
    "An attempt to make a mandelbrot set in d3 whereby one could infintely zoom in",
  openGraph: {
    type: "website",
    url: "https://d3-mandelbrot-set.vercel.app/",
    title: "Mandelbrot Set (in d3)",
    description:
      "An attempt to make a mandelbrot set in d3 whereby one could infintely zoom in",
    siteName: "Mandelbrot Set (in d3)",
    images: [
      {
        url: "https://d3-mandelbrot-set.vercel.app/og-image-5.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
