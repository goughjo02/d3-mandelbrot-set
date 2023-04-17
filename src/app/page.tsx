import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Visualisation = dynamic(() => import("@src/components/Visualisation"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Suspense fallback={<div>Loading...</div>}>
        <Visualisation />
      </Suspense>
    </main>
  );
}
