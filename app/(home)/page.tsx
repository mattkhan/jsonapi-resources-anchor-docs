import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold">Hello World</h1>
      <p className="mb-2 text-fd-muted-foreground">
        🚧 Homepage under construction. 🚧
      </p>
      <p className="text-fd-muted-foreground">
        Go to{" "}
        <Link
          href="/docs"
          className="text-fd-foreground font-semibold underline"
        >
          /docs
        </Link>{" "}
        to see the documentation.
      </p>
    </main>
  );
}
