"use client";
import { basicSetup } from "codemirror";
import { Vim, vim } from "@replit/codemirror-vim";

import { EditorView, keymap } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";

import { defaultKeymap } from "@codemirror/commands";
import { StreamLanguage } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";

import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { useCallback, useEffect, useRef, useState } from "react";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { Card } from "fumadocs-ui/components/card";
import { useDebounce } from "./use-debounce";
import { init } from "./source-code";
import { useRubyVM } from "./use-ruby-vm";
import { CopyButtonText } from "./copy-button";
import { compressToEncodedURIComponent } from "lz-string";

const Button = ({
  onClick,
  children,
}: React.PropsWithChildren<{ onClick?: () => void }>) => {
  return (
    <button
      className="block rounded-xl border bg-fd-card p-4 text-fd-card-foreground transition-colors @max-lg:col-span-full hover:bg-fd-accent/80 w-fit"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
const vimpartment = new Compartment();

const useEditor = (props?: {
  enabled?: boolean;
  onDocChange?: (value: string) => void;
}) => {
  const editor = useRef<EditorView>(null);
  const { onDocChange } = props ?? {};

  useEffect(() => {
    if (editor.current || !props?.enabled) return;
    Vim.map("jj", "<Esc>", "insert");

    const myTheme = EditorView.theme({
      "&": {
        borderRadius: "0px",
      },
    });

    const targetElement = document.querySelector("#editor")!;

    const view = new EditorView({
      doc: init,
      extensions: [
        vimpartment.of(vim()),
        myTheme,
        tokyoNight,
        keymap.of(defaultKeymap),
        basicSetup,
        StreamLanguage.define(ruby),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onDocChange?.(update.state.doc.toString());
        }),
      ],
      parent: targetElement,
    });
    editor.current = view;
    onDocChange?.(init);

    return () => {
      editor.current?.dom.remove();
      editor.current = null;
    };
  }, [onDocChange, props?.enabled]);

  const toggleVim = (enabled: boolean, setEnabled: (val: boolean) => void) => {
    const v = enabled ? vim() : [];

    if (!editor.current) return;

    editor.current.dispatch({
      effects: vimpartment.reconfigure(v),
    });
    editor.current.focus();
    setEnabled(enabled);
  };

  return { editor, vim: { toggle: toggleVim } };
};

const useOutputEditor = (enabled: boolean) => {
  const editor = useRef<EditorView>(null);

  useEffect(() => {
    if (editor.current || !enabled) return;
    const targetElement = document.querySelector("#editor-output")!;

    const view = new EditorView({
      doc: "",
      extensions: [
        tokyoNight,
        basicSetup,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.contentAttributes.of({ tabindex: "0" }),
        javascript({ typescript: true }),
      ],
      parent: targetElement,
    });
    editor.current = view;

    return () => {
      editor.current?.dom.remove();
      editor.current = null;
    };
  }, [enabled]);

  return editor;
};

export const Editor = () => {
  const { evaluate, initiate, initiateStatus } = useRubyVM();
  const outputEditor = useOutputEditor(initiateStatus === "success");
  const [vimEnabled, setVimEnabled] = useState(true);

  const [evalError, setEvalError] = useState<string>();

  const onDocChange = useCallback(
    (editorText: string) => {
      const result = evaluate(editorText);
      if (result.status === "error") {
        setEvalError(result.error ?? undefined);
        return;
      }
      setEvalError(undefined);

      const viewer = outputEditor.current;
      if (!viewer) return;

      const tx = viewer.state.update({
        changes: {
          from: 0,
          to: viewer.state.doc.length,
          insert: result.data.toString(),
        },
      });
      viewer.dispatch(tx);
    },
    [evaluate, outputEditor],
  );

  const debouncedOnDocChange = useDebounce({ callback: onDocChange });

  const { editor, vim } = useEditor({
    enabled: initiateStatus === "success",
    onDocChange: debouncedOnDocChange,
  });

  const onImperativeChange = () => {
    const editorText = editor.current?.state.doc.toString() ?? "";
    onDocChange(editorText);
  };

  const Playground = ({ children }: React.PropsWithChildren) => {
    return (
      <div className="flex flex-col w-full">
        <div className="prose flex flex-col">
          <h3 id="playground">
            Playground{" "}
            <span className="text-sm text-fd-muted-foreground font-normal">
              WIP
            </span>
          </h3>

          <div className="text-fd-muted-foreground mb-3 text-sm">
            Built with{" "}
            <a
              href="https://github.com/ruby/ruby.wasm"
              rel="noreferrer"
              target="_blank"
            >
              ruby/ruby.wasm
            </a>{" "}
            and{" "}
            <a href="https://codemirror.net/" rel="noreferrer" target="_blank">
              CodeMirror
            </a>
            .
          </div>

          <div className="text-fd-muted-foreground">
            Generate TypeScript from <code>Anchor::Types</code> types.
          </div>
          <div className="text-fd-muted-foreground mb-4">
            Must return a string.
          </div>
          {children}
        </div>
      </div>
    );
  };

  if (initiateStatus === "pending") {
    return (
      <Playground>
        <div>
          <Button onClick={initiate}>Load Playground</Button>
        </div>
        <div className="mb-[400px]"></div>
      </Playground>
    );
  }

  if (initiateStatus === "loading") {
    return (
      <Playground>
        <div>
          <Button>Loading...</Button>
        </div>
        <div className="mb-[400px]"></div>
      </Playground>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <Playground />

      <div className="prose px-4 flex flex-row justify-between">
        <div className="self-end">
          <input
            onChange={() => vim.toggle(!vimEnabled, setVimEnabled)}
            type="checkbox"
            checked={vimEnabled}
            value="vim"
            name="vim"
            id="vim"
          />{" "}
          <label htmlFor="vim">Vim</label>
        </div>
        <div className="flex flex-row gap-x-4">
          <CopyButtonText
            value="Share"
            onCopy={() => {
              const currentUrl = new URL(window.location.href);
              const newParams = new URLSearchParams(currentUrl.search);
              const editorText = editor.current?.state.doc.toString() ?? "";
              newParams.set("code", compressToEncodedURIComponent(editorText));
              const newUrl = `${currentUrl.protocol}//${currentUrl.host}/playground?${newParams.toString()}`;
              return newUrl;
            }}
          />
          <Button onClick={onImperativeChange}>Generate</Button>
        </div>
      </div>

      <div className="flex flex-row gap-4 p-4 max-lg:flex-col">
        <div className="flex flex-col gap-4 max-w-[60%] max-lg:max-w-[100%] shrink grow-0">
          <div className="flex flex-col">
            <div className="bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg) text-sm rounded-xl">
              <div className="bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg) flex text-fd-muted-foreground items-center gap-2 h-9.5 border-b px-4">
                <figcaption className="flex-1 truncate">Anchor Type</figcaption>
                <div className="empty:hidden -me-2"></div>
              </div>
            </div>

            <div id="editor"></div>
          </div>
          {evalError && <Card title="Error">{evalError}</Card>}
        </div>
        <div className="w-full shrink grow-0">
          <div className="flex flex-col">
            <div className="bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg) text-sm rounded-xl">
              <div className="bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg) flex text-fd-muted-foreground items-center gap-2 h-9.5 border-b px-4">
                <figcaption className="flex-1 truncate">
                  Generated TypeScript
                </figcaption>
                <div className="empty:hidden -me-2"></div>
              </div>
            </div>
            <div id="editor-output"></div>
          </div>
        </div>
      </div>
      <div className="mb-[200px]"></div>
    </div>
  );
};
