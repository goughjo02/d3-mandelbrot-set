import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const MandelbrotSet = dynamic(() => import("@src/components/MandelbrotSet"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Suspense fallback={<div>Loading Mandelbrot set...</div>}>
        <MandelbrotSet />
      </Suspense>
    </main>
  );
}
