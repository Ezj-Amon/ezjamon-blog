import type { CollectionEntry } from "astro:content";
import { getEntrySecondaryTags } from "./getContentTaxonomy";

type Tag = {
  tag: string;
  tagName: string;
  count: number;
};

type TaggedEntry = CollectionEntry<"posts"> | CollectionEntry<"resources">;

/**
 * Builds a de-duplicated, sorted tag list from content entries.
 *
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 */
export function getUniqueTags(entries: TaggedEntry[]) {
  const tagMap = new Map<string, Tag>();

  entries.forEach(entry => {
    getEntrySecondaryTags(entry).forEach(({ tag, tagName }) => {
      const current = tagMap.get(tag) ?? { tag, tagName, count: 0 };
      current.count += 1;
      tagMap.set(tag, current);
    });
  });

  return Array.from(tagMap.values()).sort(
    (tagA, tagB) => tagB.count - tagA.count || tagA.tag.localeCompare(tagB.tag)
  );
}
