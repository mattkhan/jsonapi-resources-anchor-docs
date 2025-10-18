import { Editor } from "./editor";
import { Metadata } from "next";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Playground",
};

export default function HomePage() {
  return (
    <main className="container relative max-w-[1100px] px-2 py-4 z-2 lg:py-8">
      <Editor />
    </main>
  );
}
