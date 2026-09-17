import { randomInt } from "node:crypto";

/** Must match the check constraint on public.short_links.code. */
export const SHORT_CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SHORT_CODE_MIN = 3;
export const SHORT_CODE_MAX = 80;

// No 0/o, 1/i/l: random codes are read off printed material and sometimes typed by hand.
const RANDOM_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const RANDOM_LENGTH = 6;

export function randomShortCode(): string {
  let code = "";
  for (let i = 0; i < RANDOM_LENGTH; i++) {
    code += RANDOM_ALPHABET[randomInt(RANDOM_ALPHABET.length)];
  }
  return code;
}

/**
 * Turns what someone typed into the custom code field into the stored code.
 * The result is validated against SHORT_CODE_PATTERN afterwards, so anything
 * this leaves invalid is shown to the user as an error instead of being saved.
 *
 * Examples to consider: "Physicians Toronto Oct 27 2026", "  spring--offer ", "rrsp_season"
 */
export function normalizeCustomCode(value: string): string {
  // TODO: decide the convention for custom codes (spaces? underscores? repeated hyphens?).
  return value.trim().toLowerCase();
}
