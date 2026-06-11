import type { CollectionEntry } from "astro:content";

export type ResourceType = CollectionEntry<"resources">["data"]["type"];

export const resourceTypeLabels: Record<ResourceType, string> = {
  article: "文章",
  video: "视频",
  course: "教程",
  tool: "工具",
  bookmark: "收藏",
  repo: "代码",
  game: "游戏",
};
