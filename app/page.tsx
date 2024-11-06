import { MandelbrotSet } from "@/components/mandelbrot-set";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <MandelbrotSet />
    </main>
  );
}
