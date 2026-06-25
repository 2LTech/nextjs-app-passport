// Provide a valid default NEXTJS_APP_PASSPORT_TOKEN (>= 32 chars) for the test
// suite, since `@/defs` now validates the secret at module load. Only set it
// when unset so tests can still supply their own values before importing.
if (!process.env.NEXTJS_APP_PASSPORT_TOKEN) {
  process.env.NEXTJS_APP_PASSPORT_TOKEN = '0123456789abcdef0123456789abcdef'
}
