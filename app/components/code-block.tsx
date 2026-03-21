import * as Base from "fumadocs-ui/components/codeblock";
import { highlight } from "fumadocs-core/highlight";
import { type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export async function CodeBlock({
  code,
  lang,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  code: string;
  lang: string;
  allowCopy: boolean;
  keepBackground?: boolean;
}) {
  const rendered = await highlight(code, {
    lang,
    components: {
      pre: ({ className, ref: _ref, ...props }) => (
        <Base.Pre
          {...props}
          className={twMerge(
            className,
            /** not in there for some reason ? */
            "bg-(--shiki-light-bg)! dark:bg-(--shiki-dark-bg)! **:text-(--shiki-light)! **:dark:text-(--shiki-dark)!",
          )}
        />
      ),
    },
    themes: {
      light: "github-light",
      dark: "tokyo-night",
    },
    // colorReplacements: { "#1a1b26": "#151515" },
    // other Shiki options
  });

  return (
    <Base.CodeBlock keepBackground {...rest}>
      {rendered}
    </Base.CodeBlock>
  );
}
