// ============================================================
// Server-only helpers — энэ файл client bundle-руу орох ёсгүй.
// `node:crypto` import-той учир import "server-only" guard тавьсан.
// ============================================================

import "server-only";
import { randomInt } from "node:crypto";
import { CODE_ALPHABET } from "./orders";

// Захиалгын код үүсгэх: BA-YYYYMM-XXXX (32^4 ≈ 1M-н сар тутмын unique boom)
export function generateOrderCode(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `BA-${yyyy}${mm}-${suffix}`;
}
