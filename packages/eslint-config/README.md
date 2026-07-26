# ESLint Config (@repo/eslint-config)

Shared ESLint configurations for the monorepo.

## Configs

- `base.js` — General TypeScript + Prettier + Turbo plugin
- `next.js` — Next.js specific (extends base)
- `react-internal.js` — React library specific (extends base)

## Usage

```js
// eslint.config.js
import base from "@repo/eslint-config/base";

export default [...base];
```
