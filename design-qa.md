# Blog UI Redesign QA

Reference: `C:\Users\10705\AppData\Local\Temp\codex-clipboard-aaf9c756-7d92-4a2f-af48-638c49cf6893.png`

## Result

Passed.

## Checked

- Global shell matches the reference direction: soft gray background, centered white rounded canvas, subtle border/shadow, compact top navigation with Amon, text links, RSS, search, and theme icons.
- Home page matches the reference structure: hero copy, primary/secondary actions, RSS button, "最近在折腾" card, featured posts, latest posts, recent resources, and common tags.
- Posts page matches the reference list pattern: title/description, category filters, sort control, compact image/text rows, dates, tags, and pagination.
- Resources page matches the reference collection pattern: title/description, filters, sort control, three compact resource cards with category/type chips, tags, date, and bookmark affordance.
- Tags page matches the reference taxonomy pattern: category group headings and counted tag chips.
- Missing/invalid post images are handled with a designed placeholder instead of broken images or empty gaps.

## Screenshots

- `tmp-design-qa/home-final-qa.png`
- `tmp-design-qa/posts-qa.png`
- `tmp-design-qa/resources-qa.png`
- `tmp-design-qa/tags-qa.png`

## Notes

- The real content has longer resource titles/descriptions than the mock, so the home page's common tags section sits slightly lower than the static reference at a 1440x1024 capture. The layout remains visually aligned and does not overlap or break.
- Image generation for custom covers was unavailable during implementation, so the design uses existing covers where valid and a consistent no-image placeholder for the remaining posts.
