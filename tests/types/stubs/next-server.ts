/**
 * Minimal stand-in for `next/server`, mapped in via tests/types/tsconfig.json.
 *
 * The published `index.d.ts` only references `NextRequest` (as a parameter
 * type). Stubbing it lets us type-check OUR declarations with
 * `skipLibCheck: false` in isolation, without loading Next.js's full
 * transitive type graph — which, with React peer types unmet in this package,
 * would otherwise flood the check with unrelated third-party errors.
 */
export declare class NextRequest {}
