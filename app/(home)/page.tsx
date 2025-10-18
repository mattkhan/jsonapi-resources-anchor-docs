import Link from "next/link";
import { Callout } from "fumadocs-ui/components/callout";
import {
  commentResource,
  commentResourceDos,
  commentSchema,
  commentType,
} from "./source-code";
import { CodeBlock } from "../components/code-block";
import { Card } from "fumadocs-ui/components/card";
import { Editor } from "../components/editor";

export default function HomePage() {
  const Title = () => (
    <>
      Playground{" "}
      <span className="text-xs text-fd-muted-foreground font-normal">WIP</span>
    </>
  );
  return (
    <main className="container relative max-w-[1100px] px-2 py-4 z-2 lg:py-8">
      <div className="prose w-[100%] relative">
        <h1 className="max-w-fit mx-auto text-center">
          JSONAPI Resources Anchor
        </h1>
        <p className="max-w-fit mx-auto">
          Generate TypeScript types from your JSONAPI resources.
        </p>
      </div>

      <div className="mt-10 flex flex-row content-stretch rounded-sm max-md:flex-col bg-[var(--shiki-light-bg)] dark:bg-[var(--shiki-dark-bg)]">
        <div className="flex flex-col gap-4 max-w-[50%] max-md:max-w-[100%] shrink grow-0">
          <CodeBlock
            key={1}
            id="left-code-block"
            title="JSONAPI Resource"
            allowCopy={false}
            className="border-b-0 border-r-0 shadow-none border-l-0 my-0"
            code={commentResource}
            lang="rb"
          />
        </div>
        <div className="w-full shrink grow-0">
          <CodeBlock
            key={2}
            title="Generated TypeScript"
            allowCopy={false}
            className="shadow-none border-b-0 border-r-0 my-0"
            code={commentType}
            lang="ts"
          />
        </div>
      </div>
      <div className="flex flex-row gap-4 my-4">
        <Card title="Get Started" href="/docs" className="w-fit">
          Quick intro and installation.
        </Card>
        <Card title={<Title />} href="/playground" className="w-fit">
          <p>Generate TypeScript types from Anchor types.</p>
        </Card>
      </div>
      <div className="prose mt-6 flex-1">
        <h2>Features</h2>
        <ul>
          <li>Type inference</li>
          <li>Type annotations</li>
          <li>Single file and multifile schemas</li>
          <li className="ml-5">
            Enforce your frontend schema to stay in sync with the backend via
            CI.
          </li>
          <li className="ml-5">
            Support for manually editable schema files that can still be
            validated by CI.
          </li>
          <li>Configurable type inference</li>
          <li>
            Configurable serialization - customize the TypeScript serialization
            or even serialize to a different language/spec
          </li>
          <li className="ml-5">
            You can create custom serializers by using the intermediate{" "}
            <code>Anchor::Types</code> representation of the resource.
          </li>
          <li className="ml-5">
            Example: A WIP JSON Schema serializer in the{" "}
            <a
              href="https://github.com/mattkhan/jsonapi-resources-anchor/blob/6d642e8294f776e4c1570e8efa26788880ffa423/lib/anchor/json_schema/serializer.rb"
              rel="noreferrer"
              target="_blank"
            >
              repo
            </a>
            .
          </li>
        </ul>
        <h3>
          <Link href="/docs/Features/type_inference">Type Inference</Link>
        </h3>
        <ul>
          <li>
            Attributes are inferred from the underlying{" "}
            <code>ActiveRecord</code> model class of the resource.
          </li>
          <li>
            For relationships, nullability is determined by the model&apos;s{" "}
            <code>ActiveRecord</code> reflections.
          </li>
          <li>Type inference for attributes from RBS signatures.</li>
        </ul>

        <p>From the example above:</p>
        <CodeBlock
          key={3}
          title="Schema"
          allowCopy={false}
          code={commentSchema}
          lang="rb"
        />
        <ul>
          <li>
            <code>text</code> - The type and JSDoc comment are derived from the
            database schema.
          </li>
          <li>
            <code>reason</code> - The union is inferred from the{" "}
            <code>ActiveRecord</code> enum definition. The nullability is
            inferred from the database schema.
          </li>
          <li>
            <code>uninferrable</code> - Not inferrable because it is a user
            defined method.
          </li>
          <Callout>
            All user defined methods on the resource or its underlying model are
            considered uninferrable because the return type is not reasonably
            guaranteed.
            <p>
              Notably, this also applies to methods that override the generated
              attribute methods from <code>ActiveRecord</code>.
            </p>
          </Callout>
          <li>
            <code>user</code> - Inferred as nullable because the{" "}
            <code>belongs_to</code> association is optional.
          </li>
        </ul>

        <h3>
          <Link href="/docs/Features/type_annotation">Type Annotation</Link>
        </h3>
        <p>
          In cases where the type of an attribute or relationship is not
          inferable (or you need to override it), you can annotate it with an{" "}
          <code>Anchor::Types</code> type.
        </p>

        <p>The annotations from above:</p>
        <CodeBlock
          key={4}
          title="JSONAPI Resource"
          allowCopy={false}
          code={commentResourceDos}
          lang="rb"
        />
      </div>
      <Editor />
    </main>
  );
}
