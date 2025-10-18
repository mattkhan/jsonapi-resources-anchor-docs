import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { Metadata } from "next";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Playground | JSONAPI Resources Anchor",
  description: "Generate TypeScript types from your JSONAPI Resources.",
  openGraph: {
    title: "Playground | JSONAPI Resources Anchor",
    description: "Generate TypeScript types from your JSONAPI Resources.",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsLayout tree={source.pageTree} {...baseOptions}>
        {children}
      </DocsLayout>
    </>
  );
}
