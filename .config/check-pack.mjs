/**
 * Pack manifest regression check.
 *
 * `package.json` declares `"types": "./index.d.ts"`, but npm does NOT auto-ship
 * the types entry point — only files matched by the `"files"` allowlist (plus
 * npm's always-included set) end up in the tarball. If `index.d.ts` is dropped
 * from `"files"`, consumers install a package whose `"types"` pointer dangles
 * and they receive NO declarations — yet `yarn typecheck:types` (which checks
 * the file in the repo, not the packed artifact) stays green and hides it.
 *
 * This check asserts the PACKED artifact actually carries `index.d.ts`. It runs
 * `npm pack --dry-run --json --ignore-scripts` (the file list comes from the
 * allowlist, not from a build, so the `prepack` build is intentionally skipped)
 * and fails if no packed entry has `path: "index.d.ts"`.
 *
 * Complementary to `yarn typecheck:types`, not a replacement: that check proves
 * the declarations are valid; this one proves they are shipped.
 */
import { execFileSync } from 'node:child_process'

const REQUIRED = 'index.d.ts'

let raw
try {
  raw = execFileSync(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  )
} catch (err) {
  console.error('[check-pack] FAIL: `npm pack --dry-run --json` did not run:', err.message)
  process.exit(1)
}

// npm prints a JSON array on stdout with `--json`; guard against leading noise.
const start = raw.indexOf('[')
if (start === -1) {
  console.error('[check-pack] FAIL: could not locate JSON in `npm pack` output.')
  process.exit(1)
}

let manifest
try {
  manifest = JSON.parse(raw.slice(start))
} catch (err) {
  console.error('[check-pack] FAIL: could not parse `npm pack` JSON output:', err.message)
  process.exit(1)
}

const files = (manifest[0]?.files ?? []).map((entry) => entry.path)
if (!files.includes(REQUIRED)) {
  console.error(
    `[check-pack] FAIL: the published package does not include "${REQUIRED}".\n` +
      `  "types" points at it, but it is missing from the package.json "files" allowlist.\n` +
      `  Packed files: ${files.join(', ')}`
  )
  process.exit(1)
}

console.log(`[check-pack] ok: "${REQUIRED}" is included in the packed tarball.`)
