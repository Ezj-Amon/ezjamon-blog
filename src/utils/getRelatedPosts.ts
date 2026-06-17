import type { CollectionEntry } from "astro:content";
import { getEntryCategory, getEntrySecondaryTags } from "./getContentTaxonomy";

export function getRelatedPosts(
  currentPost: CollectionEntry<"posts">,
  posts: CollectionEntry<"posts">[],
  limit = 3
) {
  const currentCategory = getEntryCategory(currentPost).category;
  const currentTags = new Set(
    getEntrySecondaryTags(currentPost).map(({ tag }) => tag)
  );

  return posts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const sameCategory =
        getEntryCategory(post).category === currentCategory ? 4 : 0;
      const sharedTags = getEntrySecondaryTags(post).filter(({ tag }) =>
        currentTags.has(tag)
      ).length;

      return {
        post,
        score: sameCategory + sharedTags,
      };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.data.modDatetime ?? b.post.data.pubDatetime).getTime() -
          new Date(a.post.data.modDatetime ?? a.post.data.pubDatetime).getTime()
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
