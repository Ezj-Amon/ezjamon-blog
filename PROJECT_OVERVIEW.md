# Project Overview

This repository is the source code for Amon's personal blog at `https://ezjamon.com`.
It is based on AstroPaper and has been adapted for Chinese content, Cloudflare Pages deployment, Pagefind search, RSS/sitemap generation, and Keystatic Cloud CMS editing.

## Core Stack

- Framework: Astro 6
- Theme base: AstroPaper
- Styling: Tailwind CSS 4 through `@tailwindcss/vite`
- Content: Astro Content Collections from `src/content`
- CMS: Keystatic Cloud, mounted at `/keystatic`
- Deployment: Cloudflare Pages
- Search: Pagefind static index
- Feed/indexing: Astro RSS and sitemap routes
- Adapter: `@astrojs/cloudflare`

## Important Files

- `astro-paper.config.ts`: site identity, SEO-facing site URL, author, pagination, feature flags, social links.
- `astro.config.ts`: Astro integrations, Cloudflare adapter, sitemap, MDX, Keystatic, markdown plugins, Tailwind Vite plugin.
- `keystatic.config.ts`: CMS schema and Keystatic Cloud project configuration.
- `src/content.config.ts`: Astro content collection schemas for posts, pages, and resources.
- `src/content/posts/`: blog posts in `.md` and `.mdx`.
- `src/content/resources/`: resource/bookmark entries.
- `src/content/pages/`: content-backed pages such as About.
- `src/pages/rss.xml.ts`: RSS feed route.
- `src/pages/sitemap.xml.ts`: custom sitemap route.
- `src/pages/search.astro`: Pagefind search page.
- `src/utils/`: post sorting, filtering, slug, tag, and path helpers.

## Content Model

Blog posts live under `src/content/posts/` and may be nested in subfolders.
The public URL is based on the file path/slug, not the optional legacy `slug` frontmatter.

Post frontmatter currently supports:

- `title`: required.
- `author`: optional, defaults to site author.
- `pubDatetime`: required publish date.
- `modDatetime`: optional modified date.
- `description`: required SEO/search summary.
- `featured`: optional boolean.
- `draft`: optional boolean; drafts should not be published publicly.
- `tags`: string array, defaults to `["others"]`.
- `ogImage`: optional local image or remote URL.
- `canonicalURL`: optional canonical URL.
- `hideEditPost`: optional boolean.
- `timezone`: optional IANA timezone, e.g. `Asia/Shanghai`.
- `slug`: optional legacy compatibility field.

Keystatic exposes two post collections that point to the same `src/content/posts/**` location:

- `Posts (MDX)`: creates/edits `.mdx` posts.
- `Posts (Markdown)`: creates/edits `.md` posts.

This split is intentional because Keystatic's `fields.mdx` needs a fixed file extension per collection.

## Keystatic CMS

Keystatic is configured in cloud storage mode:

```ts
cloud: {
  project: "hhhh/ezjamon-blog",
},
storage: {
  kind: "cloud",
}
```

Admin entry point:

```txt
https://ezjamon.com/keystatic
```

Keystatic edits are expected to write content changes back through the connected GitHub repository.
The repository production branch is `main`.

When changing CMS fields, keep `keystatic.config.ts` and `src/content.config.ts` compatible.
If Keystatic allows a field that Astro's content schema rejects, Cloudflare builds can fail.

## Build And Deployment

Cloudflare Pages is connected to GitHub repo:

```txt
Ezj-Amon/ezjamon-blog
```

Production branch:

```txt
main
```

Configured Cloudflare build command:

```bash
npm run build
```

Configured Cloudflare output directory:

```txt
dist
```

Even though the build command uses npm, Cloudflare can still install dependencies with pnpm because `pnpm-lock.yaml` exists.
Keep `pnpm-lock.yaml` synchronized whenever `package.json` dependencies change.

The build script is:

```bash
astro check && astro build && pagefind --site dist/client && node -e "const fs=require('node:fs');fs.rmSync('public/pagefind',{recursive:true,force:true});fs.cpSync('dist/client/pagefind','public/pagefind',{recursive:true});"
```

Why `dist/client` matters:

- With the Cloudflare adapter, Astro outputs client/static assets under `dist/client`.
- Pagefind must index `dist/client`, not only `dist`.
- Cloudflare Pages output directory remains `dist`.

## Local Commands

Use pnpm as the primary package manager for dependency consistency:

```bash
pnpm install
pnpm dev
pnpm run build
pnpm run lint
npx tsc --noEmit
```

Cloudflare-like dependency check:

```bash
pnpm install --frozen-lockfile
```

## SEO, GEO, Search, RSS, Sitemap

SEO-facing behavior depends mostly on existing AstroPaper routes and content schemas.
The Keystatic integration should not change public article URLs or frontmatter semantics as long as file paths and frontmatter stay compatible.

Before deploying structural/content-schema changes, verify:

```bash
pnpm install --frozen-lockfile
npm run build
```

During a successful build, confirm these are generated:

- `rss.xml`
- `sitemap.xml`
- tag pages under `/tags/...`
- post pages under `/posts/...`
- Pagefind index under `dist/client/pagefind`

## Notes And Pitfalls

- Do not remove `@astrojs/react`, `react`, or `react-dom`; Keystatic needs React.
- Do not remove `@astrojs/cloudflare`; `/keystatic` needs the Cloudflare-compatible build setup.
- Do not assume Cloudflare installs with npm just because the build command is `npm run build`; lockfiles influence dependency installation.
- Do not commit local build/cache folders such as `.astro`, `.wrangler`, `dist`, or `node_modules`.
- If `/keystatic` returns 404 after deployment, first check that Cloudflare deployed the latest successful build and that `@keystatic/astro` is still included in `astro.config.ts`.
- If Cloudflare fails before running the build command with `ERR_PNPM_OUTDATED_LOCKFILE`, run `pnpm install --lockfile-only`, then commit `pnpm-lock.yaml`.
- When adding new post frontmatter fields, update both Astro's schema and Keystatic's schema.
- Keep `astro-paper.config.ts` site URL as `https://ezjamon.com/`; RSS, sitemap, canonical URLs, and social metadata depend on it.
