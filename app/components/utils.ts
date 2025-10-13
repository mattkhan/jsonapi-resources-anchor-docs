"use server";
import fs from "node:fs/promises";

export async function loadRubyWasmBinary() {
  const binary = await fs.readFile(
    "./node_modules/@ruby/3.4-wasm-wasi/dist/ruby.wasm",
  );
  return binary;
}
