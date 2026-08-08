# Coding Standards & Conventions

This document outlines the authoritative coding standards and conventions for the LLM Arena project. All contributors (human and AI) must adhere to these rules.

## Tooling & Enforcement

- **Formatter**: Prettier is used for all code formatting. It is enforced via a pre-commit hook on all staged files.
- **Linter**: ESLint is configured with strict Next.js and React rules. It automatically fixes auto-fixable issues on commit.
- **Pre-commit Hook**: Kept fast. It only runs `lint-staged` (Prettier + ESLint) on staged files. It intentionally does NOT run full TypeScript typechecking (`tsc`), as that slows down commits and encourages `--no-verify`. Typechecking should be run manually during development.

## TypeScript

- **Strict Mode**: `strict: true` is enabled and respected.
- **Types vs Interfaces**: Use `interface` for object shapes and data models. Use `type` for unions and utility types.
- **Any**: The use of `any` is strictly prohibited. If a type is truly unknown, use `unknown` and narrow it down.
- **Return Types**: Explicitly define return types for API routes and complex hooks.

## React & Next.js (App Router)

- **Server vs Client**: Default to Server Components. Only add `"use client"` when interactivity, hooks (`useState`, `useEffect`), or browser APIs are required. Push `"use client"` as far down the component tree as possible.
- **Component Exports**: Default exports are preferred for pages and primary components. Named exports are preferred for hooks and utility functions.
- **Data Fetching**: Use Server Components for initial data fetching whenever possible, passing data down as props.

## Styling (Tailwind CSS)

- **Utility Classes**: Use Tailwind natively. Do not write custom CSS unless absolutely necessary (e.g. root theme variables).
- **Class Grouping**: Group classes logically: Layout/Positioning first, Typography next, Colors/Visuals last (e.g. `flex flex-col items-center justify-center text-lg font-bold text-foreground bg-background`).

## Git Flow

- Always ensure your code passes ESLint and Prettier before committing. The husky pre-commit hook will handle staged files automatically.
- Ensure your code passes full typechecking (`pnpm exec tsc --noEmit`) before pushing to remote.
