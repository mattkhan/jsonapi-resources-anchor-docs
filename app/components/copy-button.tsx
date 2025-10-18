"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { CheckIcon, ClipboardIcon } from "lucide-react";

type ButtonProps = React.ComponentProps<"button">;
export const Button = ({ onClick, className, children }: ButtonProps) => {
  return (
    <button
      className={twMerge(
        "block rounded-xl border bg-fd-card p-4 text-fd-card-foreground transition-colors @max-lg:col-span-full hover:bg-fd-accent/80 w-fit",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface CopyButtonProps extends ButtonProps {
  value: string;
  src?: string;
  link?: boolean;
}

function copyToClipboardWithMeta(value: string) {
  navigator.clipboard.writeText(value);
}

export function CopyButtonText({
  value,
  className,
  onCopy,
  ...props
}: CopyButtonProps & { onCopy: () => string }) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 1200);
  }, [hasCopied]);

  return (
    <Button
      className={twMerge(
        "whitespace-normal h-fit relative z-10 [&_svg]:h-4 [&_svg]:w-4",
        className,
      )}
      onClick={async () => {
        const val = onCopy();
        copyToClipboardWithMeta(val);
        setHasCopied(true);
      }}
      {...props}
    >
      <div className="flex flex-row items-center gap-2">
        <div>{value}</div>{" "}
        <div>{hasCopied ? <CheckIcon /> : <ClipboardIcon />}</div>
      </div>
    </Button>
  );
}
