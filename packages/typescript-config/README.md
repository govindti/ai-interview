# TypeScript Config (@repo/typescript-config)

Shared `tsconfig.json` presets for the monorepo.

## Configs

- `base.json` — Base TypeScript config (strict mode, ESNext modules)
- `nextjs.json` — Next.js apps (extends base)
- `react-library.json` — React libraries (extends base)

## Usage

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {}
}
```
