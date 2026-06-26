# Unreleased

- Type the public API with generics instead of `any`:
  - `setLocalStrategy<TUser>`, `FindUser<TUser>`, `ValidatePassword<TUser>` and
    `getSession<TUser>()` now flow a caller-provided user type through the API.
  - Request bodies are typed `unknown` (consumers must narrow them) and the
    `Session` index signature is now `unknown` instead of `any`.
- Document the stateless-session / logout revocation limitation, the
  `GET`-as-mutation (CSRF) tradeoff for logout and refresh, and that the
  `NEXTJS_APP_PASSPORT_TOKEN` minimum length is enforced at startup.
- Fix source/identifier typos in comments and documentation.

# v1.1.24

- Enforce a minimum `NEXTJS_APP_PASSPORT_TOKEN` length of 32 characters at
  startup (the module throws on import otherwise).
- Harden session lifetime handling: sliding `MAX_AGE` (8 hours) combined with an
  absolute lifetime (7 days) that refresh cannot extend.
- Rotate the session `csrfToken` on `APIRefreshSessionRoute`.
- Add `getSession` and the `APIRefreshSessionRoute` session-refresh route.
- Add a deprecated `setLocaLStrategy` alias for `setLocalStrategy`.

> The `v1.1.1`–`v1.1.23` releases were incremental maintenance and
> release-automation updates that were not individually recorded here.

# v1.1.0

- Add unsecure environment variable `NEXTJS_APP_PASSPORT_UNSECURE`

# v1.0.0

- Initial release
