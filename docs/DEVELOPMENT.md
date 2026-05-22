# Development Notes

## Doctor

Run this when local build or provider behavior feels suspicious:

```powershell
npm run doctor
```

It checks Node/npm, Vite config readability, provider environment presence, Git SSL backend, and the known OneDrive warning.

## Windows OneDrive / Vite Access Denied

This repo currently lives under `OneDrive\Desktop`. On this machine, Vite/esbuild has previously failed while resolving config with errors like:

```text
Cannot read directory "../../../..": Access is denied
```

Expected workaround path:

1. Run `npm run doctor` first to confirm `client/vite.config.js` is readable.
2. If `npm run build` still fails with the access-denied path traversal error, try running from a non-OneDrive checkout such as `C:\tmp\music`.
3. For Git push SSL failures on this Windows setup, use:

```powershell
git -c http.sslBackend=schannel push origin main
```

This note documents the local tooling issue only. It does not change runtime app behavior.
