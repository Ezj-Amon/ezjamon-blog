import type { CollectionEntry } from "astro:content";
import { resourceTypeLabels } from "./resourceTypeLabels";
import { slugifyStr } from "./slugify";

export type TaggedEntry =
  | CollectionEntry<"posts">
  | CollectionEntry<"resources">;

export type TagStat = {
  tag: string;
  tagName: string;
  count: number;
};

export type TaxonomyGroup = {
  category: string;
  categoryName: string;
  count: number;
  tags: TagStat[];
};

function uniqBySlug(labels: string[]) {
  const seen = new Set<string>();

  return labels
    .map(label => label.trim())
    .filter(Boolean)
    .map(label => ({ tag: slugifyStr(label), tagName: label }))
    .filter(({ tag }) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

function hasAnyTag(entry: TaggedEntry, tags: string[]) {
  const entryTags = entry.data.tags.map(tag => slugifyStr(tag));
  return tags.some(tag => entryTags.includes(tag));
}

function pathIncludes(entry: TaggedEntry, value: string) {
  return `${entry.id}/${entry.filePath ?? ""}`.toLowerCase().includes(value);
}

function inferCategoryName(entry: TaggedEntry) {
  if ("type" in entry.data) {
    if (entry.data.type === "game") return "游戏资料";
    if (
      ["video", "course", "tool", "bookmark", "repo"].includes(entry.data.type)
    ) {
      return "资源收藏";
    }
  }

  if (pathIncludes(entry, "_releases") || hasAnyTag(entry, ["release"])) {
    return "版本更新";
  }

  if (
    pathIncludes(entry, "_color-schemes") ||
    hasAnyTag(entry, ["color-schemes"])
  ) {
    return "视觉主题";
  }

  if (hasAnyTag(entry, ["geo", "seo"])) return "AI 搜索";

  if (hasAnyTag(entry, ["博客", "写作", "收藏"])) return "博客建设";

  if (
    pathIncludes(entry, "examples") ||
    hasAnyTag(entry, [
      "javascript",
      "typescript",
      "reactjs",
      "nextjs",
      "tailwindcss",
      "headlesscms",
      "contextapi",
      "styled-components",
    ])
  ) {
    return "前端开发";
  }

  if (hasAnyTag(entry, ["docs", "configuration", "faq", "astro", "blog"])) {
    return "建站笔记";
  }

  return entry.data.tags[0]?.trim() || "未归类";
}

function inferSubcategoryName(entry: TaggedEntry) {
  if ("type" in entry.data) {
    return resourceTypeLabels[entry.data.type];
  }

  if (pathIncludes(entry, "_releases") || hasAnyTag(entry, ["release"])) {
    return "AstroPaper";
  }

  if (
    pathIncludes(entry, "_color-schemes") ||
    hasAnyTag(entry, ["color-schemes"])
  ) {
    return "配色";
  }

  if (hasAnyTag(entry, ["geo", "seo"])) return "GEO";

  if (hasAnyTag(entry, ["博客", "写作", "收藏"])) return "发布流程";

  if (pathIncludes(entry, "examples")) return "示例项目";

  if (hasAnyTag(entry, ["docs", "configuration", "faq", "astro", "blog"])) {
    return "AstroPaper";
  }

  return undefined;
}

export function getEntryCategory(entry: TaggedEntry) {
  const category = entry.data.category?.trim();
  const categoryName = category || inferCategoryName(entry);

  return {
    category: slugifyStr(categoryName),
    categoryName,
  };
}

export function getEntrySecondaryTags(entry: TaggedEntry) {
  const primary = getEntryCategory(entry).category;
  const subcategory =
    entry.data.subcategory?.trim() || inferSubcategoryName(entry);

  return uniqBySlug([subcategory ?? "", ...entry.data.tags]).filter(
    ({ tag }) => tag !== primary
  );
}

export function entryHasTag(entry: TaggedEntry, tag: string) {
  return getEntrySecondaryTags(entry).some(entryTag => entryTag.tag === tag);
}

export function entryHasCategory(entry: TaggedEntry, category: string) {
  return getEntryCategory(entry).category === category;
}

export function getContentTaxonomy(entries: TaggedEntry[]) {
  const groups = new Map<
    string,
    TaxonomyGroup & { tagMap: Map<string, TagStat> }
  >();

  entries.forEach(entry => {
    const { category, categoryName } = getEntryCategory(entry);
    const group =
      groups.get(category) ??
      ({
        category,
        categoryName,
        count: 0,
        tags: [],
        tagMap: new Map<string, TagStat>(),
      } satisfies TaxonomyGroup & { tagMap: Map<string, TagStat> });

    group.count += 1;

    getEntrySecondaryTags(entry).forEach(({ tag, tagName }) => {
      const current = group.tagMap.get(tag) ?? { tag, tagName, count: 0 };
      current.count += 1;
      group.tagMap.set(tag, current);
    });

    groups.set(category, group);
  });

  return Array.from(groups.values())
    .map(({ tagMap, ...group }) => ({
      ...group,
      tags: Array.from(tagMap.values()).sort(
        (tagA, tagB) =>
          tagB.count - tagA.count || tagA.tag.localeCompare(tagB.tag)
      ),
    }))
    .sort(
      (groupA, groupB) =>
        groupB.count - groupA.count ||
        groupA.category.localeCompare(groupB.category)
    );
}
