```tsx
// components/ui/button.tsx

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Spinner — shown when `loading` is true
// ---------------------------------------------------------------------------
const Spinner = () => (
  <svg
    className="animate-spin shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// CVA variant map
// Tailwind v4 uses plain utility classes — no config changes required.
// ---------------------------------------------------------------------------
const buttonVariants = cva(
  // Base styles applied to every variant
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium rounded-lg",
    "border border-transparent",
    "cursor-pointer select-none",
    "transition-all duration-150 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:pointer-events-none", // prevents clicks while loading
  ],
  {
    variants: {
      variant: {
        /** Dark solid background — primary CTA */
        primary: [
          "bg-neutral-900 text-white",
          "hover:bg-neutral-700",
          "active:bg-neutral-800",
          "focus-visible:ring-neutral-900",
        ],

        /** Transparent with border — secondary action */
        secondary: [
          "border-neutral-300 bg-transparent text-neutral-900",
          "hover:bg-neutral-100",
          "active:bg-neutral-200",
          "focus-visible:ring-neutral-400",
          "dark:border-neutral-600 dark:text-neutral-100",
          "dark:hover:bg-neutral-800 dark:active:bg-neutral-700",
        ],

        /** No background, no border — subtle action */
        ghost: [
          "bg-transparent text-neutral-700",
          "hover:bg-neutral-100 hover:text-neutral-900",
          "active:bg-neutral-200",
          "focus-visible:ring-neutral-400",
          "dark:text-neutral-300",
          "dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        ],

        /** Red tones — destructive / danger action */
        destructive: [
          "bg-red-600 text-white",
          "hover:bg-red-500",
          "active:bg-red-700",
          "focus-visible:ring-red-600",
        ],
      },

      size: {
        sm: "h-8 px-3 text-sm [&>svg]:size-3.5",
        md: "h-10 px-4 text-sm [&>svg]:size-4",
        lg: "h-12 px-6 text-base [&>svg]:size-5",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner and prevents interaction */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      loading = false,
      disabled = false,
      children,
      className,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {/* Spinner replaces the leading icon slot when loading */}
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
```

```ts
// lib/utils.ts  (if you don't already have this helper)

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes safely, resolving conflicts via tailwind-merge. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

```tsx
// Usage examples — e.g. app/page.tsx

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-8">
      {/* Variants */}
      <Button variant="primary">Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Learn more</Button>
      <Button variant="destructive">Delete account</Button>

      {/* Sizes */}
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>

      {/* States */}
      <Button loading>Saving…</Button>
      <Button disabled>Unavailable</Button>

      {/* Custom class passthrough */}
      <Button variant="primary" className="w-full max-w-xs">
        Full-width CTA
      </Button>

      {/* Native button props forwarded */}
      <Button
        variant="destructive"
        size="sm"
        type="button"
        onClick={() => console.log("clicked")}
      >
        Click me
      </Button>
    </div>
  );
}
```

```bash
# Required dependencies
npm install class-variance-authority clsx tailwind-merge
```