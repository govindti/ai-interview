# UI Library (@repo/ui)

Shared React component library built on Radix UI, Tailwind CSS, and class-variance-authority.

## Components

- `button` — Button with variants (default, outline, ghost, link)
- `card` — Card, CardHeader, CardContent, CardTitle, CardDescription
- `input` — Text input
- `textarea` — Multi-line text input
- `label` — Form label
- `badge` — Badge with variants
- `progress` — Progress bar
- `select` — Select dropdown
- `separator` — Horizontal/vertical divider
- `scroll-area` — Scrollable container

## Usage

```tsx
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardTitle } from "@repo/ui/card";

export function Example() {
  return (
    <Card>
      <CardTitle>Hello</CardTitle>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Utility

`cn()` — Merges class names using `clsx` + `tailwind-merge`.

```ts
import { cn } from "@repo/ui/utils";

cn("px-4 py-2", isActive && "bg-blue-500", className);
```
