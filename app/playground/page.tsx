import { Editor } from "./editor";

export default function HomePage() {
  return (
    <div className="flex w-full justify-center">
      <main className="container relative max-w-[1100px] px-2 py-4 z-2 lg:py-8">
        <Editor />
      </main>
    </div>
  );
}
