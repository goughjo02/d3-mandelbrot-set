import { Inter } from "next/font/google";
import Visualisation from "@src/components/Visualisation";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Visualisation />
    </main>
  );
}
