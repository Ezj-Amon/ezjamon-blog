# Project Overview

This repository is the source code for Amon's personal blog at `https://ezjamon.com`.
It is based on AstroPaper and has been adapted for Chinese content, Cloudflare Pages deployment, Pagefind search, RSS/sitemap generation, and Keystatic Cloud CMS editing.

## Documentation Roles

- `README.md`: public-facing repository entry point. Keep it short, personal, and focused on what the site is, how to run it, and where to find deeper notes.
- `PROJECT_OVERVIEW.md`: engineering and maintenance reference. Put architecture, deployment, content model, CMS, build, and pitfall details here instead of expanding the README.

When adding new operational knowledge, prefer updating this file unless the information is essential for a first-time reader landing on the repository.

## Core Stack

- Framework: Astro 6
- Theme base: AstroPaper
- Styling: Tailwind CSS 4 through `@tailwindcss/vite`
- Content: Astro Content Collections from `src/content`
- CMS: Keystatic Cloud, mounted by the CMS Worker at `/keystatic`
- Deployment: Cloudflare Pages for the public site, Cloudflare Workers for the CMS
- Search: Pagefind static index
- Feed/indexing: Astro RSS and sitemap routes
- Adapter: `@astrojs/cloudflare`

## Important Files

- `astro-paper.config.ts`: site identity, SEO-facing site URL, author, pagination, feature flags, social links.
- `astro.config.ts`: Astro integrations, sitemap, MDX, markdown plugins, Tailwind Vite plugin, and conditional CMS/Cloudflare adapter setup.
- `keystatic.config.ts`: CMS schema and Keystatic Cloud project configuration.
- `src/content.config.ts`: Astro content collection schemas for posts, pages, and resources.
- `src/content/posts/`: blog posts in `.md` and `.mdx`.
- `src/content/resources/`: resource/bookmark entries.
- `src/content/pages/`: content-backed pages such as About.
- `src/pages/rss.xml.ts`: RSS feed route.
- `src/pages/sitemap.xml.ts`: custom sitemap route.
- `src/pages/search.astro`: Pagefind search page.
- `scripts/generate-cms-taxonomy.mjs`: scans existing frontmatter and generates CMS category/tag suggestions.
- `src/data/cmsTaxonomy.ts`: generated Keystatic suggestion data for categories, subcategories, and tags.
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

Recommended admin entry point:

```txt
https://cms.ezjamon.com/keystatic
```

Keystatic edits are expected to write content changes back through the connected GitHub repository.
The repository production branch is `main`.

When changing CMS fields, keep `keystatic.config.ts` and `src/content.config.ts` compatible.
If Keystatic allows a field that Astro's content schema rejects, Cloudflare builds can fail.

## Build And Deployment

This project is intended to use two Cloudflare deployments:

- Public blog: Cloudflare Pages, static-only, fast deploys.
- CMS admin: Cloudflare Workers, dynamic Keystatic route.

Both can use the same GitHub repo:

```txt
Ezj-Amon/ezjamon-blog
```

Production branch:

```txt
main
```

Configured Cloudflare build command:
Public Pages build command:

```bash
npm run build
```

Public Pages output directory:

```txt
dist
```

CMS Worker build command:

```bash
npm run build:cms
```

CMS Worker deploy command:

```bash
npx wrangler deploy
```

Even though the build command uses npm, Cloudflare can still install dependencies with pnpm because `pnpm-lock.yaml` exists.
Keep `pnpm-lock.yaml` synchronized whenever `package.json` dependencies change.

The public Pages build script indexes static output in `dist`:

```bash
astro check && astro build && pagefind --site dist
```

The CMS Worker build script enables `CMS_BUILD=true`, adds Keystatic and the Cloudflare adapter, and indexes `dist/client`.

Why the two build modes matter:

- Public Pages should stay static and output to `dist` for fast blog deploys.
- CMS Worker needs Cloudflare adapter output, which produces `dist/client` and `dist/server`.
- `/keystatic` is intentionally not part of the public Pages static build.

## Local Commands

Use pnpm as the primary package manager for dependency consistency:

```bash
pnpm install
pnpm dev
pnpm run build
pnpm run build:cms
pnpm run cms:taxonomy
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
npm run build:cms
npx wrangler deploy --dry-run
```

During a successful build, confirm these are generated:

- `rss.xml`
- `sitemap.xml`
- tag pages under `/tags/...`
- post pages under `/posts/...`
- Pagefind index under `dist/pagefind` for Pages builds.
- Pagefind index under `dist/client/pagefind` for CMS Worker builds.

## UI And Interaction Conventions

The site should read as a real personal blog rather than a stock theme or product landing page.

- Homepage hierarchy should answer three questions quickly: who this is, what is being written recently, and where to continue reading.
- Keep the modern, clean visual direction with restrained teal accents.
- Article, resource, and progress modules can use light cards, but avoid oversized marketing-style sections.
- Page-level search and filters on `resources`, `progress`, and `tags` are local filters for the current page only.
- Global search is handled by the navigation search entry and Pagefind search page.
- When adding local filters, include visible state updates, clear/reset paths, and empty-result feedback.
- Prefer existing SVG icons from `src/assets/icons` over text-symbol decoration.

## Notes And Pitfalls

- Do not remove `@astrojs/react`, `react`, or `react-dom`; Keystatic needs React.
- Do not remove `@astrojs/cloudflare`; the CMS Worker build needs the Cloudflare-compatible setup.
- Do not assume Cloudflare installs with npm just because the build command is `npm run build`; lockfiles influence dependency installation.
- Do not commit local build/cache folders such as `.astro`, `.wrangler`, `dist`, or `node_modules`.
- If `/keystatic` returns 404 on the public Pages domain, that is expected for the static build. Use the CMS Worker domain.
- If `/keystatic` returns 404 on the CMS Worker domain, check that the Worker uses `npm run build:cms` before `npx wrangler deploy`.
- If Cloudflare fails before running the build command with `ERR_PNPM_OUTDATED_LOCKFILE`, run `pnpm install --lockfile-only`, then commit `pnpm-lock.yaml`.
- Build-time scripts such as `scripts/generate-cms-taxonomy.mjs` must use Node built-ins or explicitly declared `package.json` dependencies only. Do not import transitive/local-only packages such as `js-yaml`; Cloudflare installs from the lockfile and will fail with `ERR_MODULE_NOT_FOUND` if a script imports a package that is not declared for this project.
- When adding new post frontmatter fields, update both Astro's schema and Keystatic's schema.
- Keep `astro-paper.config.ts` site URL as `https://ezjamon.com/`; RSS, sitemap, canonical URLs, and social metadata depend on it.
