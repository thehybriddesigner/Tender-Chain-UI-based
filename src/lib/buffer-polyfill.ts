// buffer-polyfill.ts — Vite does not polyfill Node's `Buffer` global the way
// webpack/CRA used to. @solana/web3.js and @coral-xyz/anchor (used in
// src/lib/solana.ts for PDA derivation) call `Buffer.from(...)` directly,
// which throws "Buffer is not defined" in the browser unless we shim it.
//
// Import this file once, as early as possible on the client (see __root.tsx).
import { Buffer } from "buffer";

if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}
