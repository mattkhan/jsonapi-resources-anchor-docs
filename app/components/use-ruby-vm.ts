import { useCallback, useRef, useState } from "react";
import { RbValue, RubyVM } from "@ruby/wasm-wasi/dist/vm";
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/browser";
import { prereq } from "./source-code";

const makeRubyModule = async () => {
  const binary = await fetch(
    "https://cdn.jsdelivr.net/npm/@ruby/3.4-wasm-wasi@2.7.2/dist/ruby+stdlib.wasm",
  );
  const rubyModule = await WebAssembly.compileStreaming(binary);
  return rubyModule;
};

type InitiateStatus = "pending" | "loading" | "success" | "error";
type Status = "loading" | "success" | "error";

type Params = { testing: boolean };
export function useRubyVM(params?: Params) {
  const { testing = false } = params || {};

  const rubyModule = useRef<WebAssembly.Module>(null);
  const rvm = useRef<RubyVM>(null);
  const [initiateStatus, setInitiateStatus] =
    useState<InitiateStatus>("pending");
  const status = useRef<Status>(null);

  const initiate = () => {
    setInitiateStatus("loading");

    if (testing) {
      setTimeout(() => {
        setInitiateStatus("success");
      }, 0);
      return;
    }

    makeRubyModule()
      .then((mod) => {
        rubyModule.current = mod;
        DefaultRubyVM(mod).then(({ vm }) => {
          rvm.current = vm;
          vm.eval(prereq);
        });
        setInitiateStatus("success");
      })
      .catch(() => {
        setInitiateStatus("error");
      });
  };

  const reset = useCallback(() => {
    if (!rubyModule.current) return;

    status.current = "loading";
    DefaultRubyVM(rubyModule.current).then(({ vm }) => {
      rvm.current = vm;
      vm.eval(prereq);
      status.current = "success";
    });
  }, []);

  const evaluate = useCallback(
    (
      code: string,
    ):
      | { status: "error"; error: string | null }
      | { status: "success"; data: Pick<RbValue, "toString"> } => {
      if (!rvm.current && testing)
        return { status: "success", data: "look at it go" };

      if (!rvm.current) return { status: "error", error: null };

      try {
        const res = rvm.current.eval(code);
        reset();
        return { status: "success", data: res };
      } catch (e) {
        reset();
        return {
          status: "error",
          error: e instanceof Error ? e.message : null,
        };
      }
    },
    [reset, testing],
  );

  return { initiate, initiateStatus, evaluate };
}
