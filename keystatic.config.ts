import { collection, config, fields } from "@keystatic/core";
import type {
  BasicFormField,
  ContentFormField,
  FormFieldStoredValue,
} from "@keystatic/core";
import { TextArea, TextField } from "@keystar/ui/text-field";
import { createElement, type CSSProperties } from "react";
import {
  postCategorySuggestions,
  postSubcategorySuggestions,
  postTagSuggestions,
  resourceCategorySuggestions,
  resourceSubcategorySuggestions,
  resourceTagSuggestions,
  type CmsTaxonomyOption,
} from "./src/data/cmsTaxonomy";
import { slugifyStr } from "./src/utils/slugify";

const tagSeparators = /[,\n\r;，；、]+|\s{2,}/u;

function generateSlug(name: string) {
  return slugifyStr(name);
}

function splitTags(value: string) {
  const tags = value
    .split(tagSeparators)
    .map(tag => tag.trim())
    .filter(Boolean);

  return [...new Set(tags)];
}

function parseStoredTags(value: FormFieldStoredValue) {
  if (value === undefined) return [];
  if (typeof value === "string") return splitTags(value);
  if (Array.isArray(value)) {
    return splitTags(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .join(", ")
    );
  }

  throw new Error("标签必须是文本或文本数组");
}

function formatTagsForEditing(tags: readonly string[]) {
  return tags.join(", ");
}

function parseOptionalText(value: FormFieldStoredValue) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;

  throw new Error("该字段必须是文本");
}

function serializeOptionalText(value: string) {
  const trimmed = value.trim();
  return { value: trimmed || undefined };
}

function readOptionalText(value: FormFieldStoredValue) {
  const parsed = parseOptionalText(value).trim();
  return parsed || undefined;
}

const suggestionWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 8,
};

const suggestionButtonStyle: CSSProperties = {
  border: "1px solid var(--ksv-color-border-neutral)",
  borderRadius: 999,
  background: "var(--ksv-color-background-canvas)",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1,
  padding: "6px 9px",
};

const selectedButtonStyle: CSSProperties = {
  ...suggestionButtonStyle,
  background: "var(--ksv-color-background-accent-emphasis)",
  color: "var(--ksv-color-foreground-onEmphasis)",
};

const infoPanelStyle: CSSProperties = {
  border: "1px solid var(--ksv-color-border-neutral)",
  borderRadius: 8,
  background: "var(--ksv-color-background-surface)",
  padding: 12,
};

const infoTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  margin: "0 0 8px",
};

const infoListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  lineHeight: 1.5,
  margin: 0,
  paddingLeft: 18,
};

function renderSuggestions({
  suggestions,
  currentValues,
  onPick,
  max = 30,
}: {
  suggestions: readonly CmsTaxonomyOption[];
  currentValues?: readonly string[];
  onPick(value: string): void;
  max?: number;
}) {
  if (suggestions.length === 0) return null;

  const selected = new Set(currentValues ?? []);
  const ordered = [
    ...suggestions.filter(option => selected.has(option.value)),
    ...suggestions.filter(option => !selected.has(option.value)),
  ].slice(0, max);

  return createElement(
    "div",
    { style: suggestionWrapStyle },
    ordered.map(option =>
      createElement(
        "button",
        {
          key: option.value,
          type: "button",
          style: selected.has(option.value)
            ? selectedButtonStyle
            : suggestionButtonStyle,
          onClick: () => onPick(option.value),
          title: selected.has(option.value) ? "已选择，点击移除" : "点击添加",
        },
        option.label
      )
    )
  );
}

function suggestedTextField({
  label,
  description,
  suggestions,
}: {
  label: string;
  description: string;
  suggestions: readonly CmsTaxonomyOption[];
}): BasicFormField<string, string, string | undefined> {
  return {
    kind: "form",
    label,
    Input(props) {
      return createElement(
        "div",
        null,
        createElement(TextField, {
          label,
          description,
          autoFocus: props.autoFocus,
          value: props.value,
          onChange: props.onChange,
        }),
        renderSuggestions({
          suggestions,
          currentValues: props.value.trim() ? [props.value.trim()] : [],
          onPick(value) {
            props.onChange(props.value.trim() === value ? "" : value);
          },
          max: 14,
        })
      );
    },
    defaultValue() {
      return "";
    },
    parse: parseOptionalText,
    serialize: serializeOptionalText,
    validate(value) {
      return value;
    },
    reader: {
      parse: readOptionalText,
    },
  };
}

function infoPanelField({
  label,
  items,
}: {
  label: string;
  items: readonly string[];
}): BasicFormField<null> {
  return {
    kind: "form",
    label,
    Input() {
      return createElement(
        "section",
        { style: infoPanelStyle },
        createElement("p", { style: infoTitleStyle }, label),
        createElement(
          "ul",
          { style: infoListStyle },
          items.map(item => createElement("li", { key: item }, item))
        )
      );
    },
    defaultValue() {
      return null;
    },
    parse() {
      return null;
    },
    serialize() {
      return { value: undefined };
    },
    validate() {
      return null;
    },
    reader: {
      parse() {
        return null;
      },
    },
  };
}

function tagListField({
  label,
  description,
  suggestions = [],
}: {
  label: string;
  description: string;
  suggestions?: readonly CmsTaxonomyOption[];
}): BasicFormField<string, string, readonly string[]> {
  return {
    kind: "form",
    label,
    Input(props) {
      const currentTags = splitTags(props.value);

      return createElement(
        "div",
        null,
        createElement(TextArea, {
          label,
          description,
          autoFocus: props.autoFocus,
          value: props.value,
          onChange: props.onChange,
        }),
        renderSuggestions({
          suggestions,
          currentValues: currentTags,
          onPick(value) {
            const hasTag = currentTags.includes(value);
            const nextTags = hasTag
              ? currentTags.filter(tag => tag !== value)
              : [...currentTags, value];
            props.onChange(formatTagsForEditing(nextTags));
          },
        })
      );
    },
    defaultValue() {
      return "";
    },
    parse(value) {
      return formatTagsForEditing(parseStoredTags(value));
    },
    serialize(value) {
      const tags = splitTags(value);
      return { value: tags.length > 0 ? tags : undefined };
    },
    validate(value) {
      return value;
    },
    reader: {
      parse: parseStoredTags,
    },
  };
}

function rawContentField({
  label,
  description,
  extension,
}: {
  label: string;
  description: string;
  extension: "mdx";
}): ContentFormField<string, string, string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return {
    kind: "form",
    formKind: "content",
    contentExtension: `.${extension}`,
    Input(props) {
      return createElement(TextArea, {
        label,
        description,
        autoFocus: props.autoFocus,
        value: props.value,
        onChange: props.onChange,
      });
    },
    defaultValue() {
      return "";
    },
    parse(_value, { content }) {
      return content ? decoder.decode(content) : "";
    },
    serialize(value) {
      return {
        value: undefined,
        content: encoder.encode(value),
        other: new Map(),
        external: new Map(),
      };
    },
    validate(value) {
      return value;
    },
    reader: {
      parse(_value, { content }) {
        return content ? decoder.decode(content) : "";
      },
    },
  };
}

const postFields = (extension: "md" | "mdx") => ({
  title: fields.slug({
    name: {
      label: "文章标题",
      validation: { isRequired: true },
    },
    slug: {
      label: "文件名 / URL 路径（通常自动生成）",
      description:
        "决定文章文件路径和公开访问地址。一般用标题自动生成即可；需要子文件夹时用斜杠分隔。",
      generate: generateSlug,
    },
  }),
  slug: fields.text({
    label: "旧版 slug（一般留空）",
    description:
      "通常不用填。这里只用于兼容旧版 AstroPaper 文章，现在网站地址主要由上面的“文件名 / URL 路径”决定。",
  }),
  author: fields.text({
    label: "作者（通常留空）",
    description: "留空时会使用站点默认作者 Amon。",
  }),
  pubDatetime: fields.datetime({
    label: "发布时间",
    defaultValue: { kind: "now" },
    validation: { isRequired: true },
  }),
  scheduled: fields.checkbox({
    label: "到发布时间后自动公开",
    description:
      "勾选后，只有到达上面的发布时间才会在生产环境显示。即时发布的文章不用勾选。",
    defaultValue: false,
  }),
  modDatetime: fields.datetime({
    label: "更新时间（可选）",
    description: "填写后会用于文章排序、RSS 和页面里的“更新于”。不需要时可以留空。",
  }),
  description: fields.text({
    label: "文章摘要（搜索和列表会显示）",
    multiline: true,
    description:
      "用 1-2 句话说明这篇文章解决什么问题。发布前建议确认它适合出现在搜索结果、文章列表和 SEO 描述里。",
    validation: { isRequired: true },
  }),
  featured: fields.checkbox({
    label: "放到首页精选",
    description: "勾选后可能出现在首页“精选文章”区域。适合长期有价值或最想推荐的内容。",
    defaultValue: false,
  }),
  draft: fields.checkbox({
    label: "草稿，不公开显示",
    description: "写完准备发布前，记得取消勾选。",
    defaultValue: false,
  }),
  category: suggestedTextField({
    label: "一级分类",
    description:
      "优先点击已有分类，避免同一主题写出多个近义分类；需要新主题时也可以直接输入。",
    suggestions: postCategorySuggestions,
  }),
  subcategory: suggestedTextField({
    label: "二级分类",
    description: "可选。适合记录系列、栏目或更细的写作场景。",
    suggestions: postSubcategorySuggestions,
  }),
  tags: tagListField({
    label: "标签",
    description:
      "点击下方已有标签即可添加/移除；也可以直接输入新标签。支持逗号、顿号、分号、换行或两个以上空格分隔，保存时会自动去重。",
    suggestions: postTagSuggestions,
  }),
  publishingGuide: infoPanelField({
    label: "发布前检查",
    items: [
      "摘要写 1-2 句话：让列表、搜索和分享预览都能看懂这篇文章。",
      "一级分类优先用已有分类，标签控制在 2-5 个，避免同义词越积越多。",
      "即时发布：取消“草稿”。预约发布：勾选“到发布时间后自动公开”并确认发布时间。",
      "普通文章优先用“普通文章（推荐）”；只有需要 import 或组件时再用高级 MDX。",
    ],
  }),
  ogImage: fields.text({
    label: "分享图 / OG 图片（可选）",
    description:
      "用于社交平台分享预览。可以填远程图片 URL，或相对当前文章文件的图片路径；留空时使用默认分享图。",
  }),
  canonicalURL: fields.text({
    label: "规范链接（可选）",
    description: "如果这篇文章还有原始发布地址，可在这里填写 canonical URL；一般可留空。",
  }),
  hideEditPost: fields.checkbox({
    label: "隐藏编辑链接",
    description: "勾选后文章页不显示“编辑本文”的入口。",
    defaultValue: false,
  }),
  timezone: fields.text({
    label: "时区（通常不用改）",
    description: "默认 Asia/Shanghai。只有文章需要特殊时区展示时再修改。",
    defaultValue: "Asia/Shanghai",
  }),
  body:
    extension === "mdx"
      ? rawContentField({
          label: "MDX 原文内容",
          description:
            "只有需要 import、Astro/React 组件或复杂 JSX 时才使用这个入口。普通文章建议使用“写普通文章”。",
          extension,
        })
      : fields.mdx({
          label: "正文内容",
          extension,
          options: {
            image: {
              directory: "public/posts",
              publicPath: "/posts/",
            },
          },
        }),
});

const resourceFields = {
  title: fields.slug({
    name: {
      label: "收藏标题",
      validation: { isRequired: true },
    },
    slug: {
      label: "文件名 / URL 路径（通常自动生成）",
      description: "一般用标题自动生成即可。需要分目录时再手动调整。",
      generate: generateSlug,
    },
  }),
  description: fields.text({
    label: "简介（前台卡片会显示）",
    multiline: true,
    description: "客观说明这个资源是什么。尽量短一点，方便列表浏览。",
    validation: { isRequired: true },
  }),
  note: fields.text({
    label: "收藏理由 / 使用场景",
    multiline: true,
    description:
      "可选。写一句你为什么留这个资源，或者什么时候会用到它。前台会优先展示这句个人判断。",
  }),
  url: fields.url({
    label: "链接 URL",
    validation: { isRequired: true },
  }),
  type: fields.select({
    label: "类型",
    defaultValue: "bookmark",
    options: [
      { label: "文章", value: "article" },
      { label: "视频", value: "video" },
      { label: "课程", value: "course" },
      { label: "工具", value: "tool" },
      { label: "书签", value: "bookmark" },
      { label: "代码仓库", value: "repo" },
      { label: "游戏", value: "game" },
    ],
  }),
  source: fields.text({
    label: "来源（可选）",
    description: "例如 抖音、B 站、GitHub、官方文档。",
  }),
  pubDatetime: fields.datetime({
    label: "收藏时间",
    defaultValue: { kind: "now" },
  }),
  category: suggestedTextField({
    label: "一级分类",
    description:
      "优先点击已有分类，避免收藏页出现重复或近义分类；需要新分类时也可以直接输入。",
    suggestions: resourceCategorySuggestions,
  }),
  subcategory: suggestedTextField({
    label: "二级分类",
    description: "会显示在普通标签之前，适合写更细的用途或资源类型。",
    suggestions: resourceSubcategorySuggestions,
  }),
  tags: tagListField({
    label: "标签",
    description:
      "点击下方已有标签即可添加/移除；也可以直接输入新标签。支持逗号、顿号、分号、换行或两个以上空格分隔，保存时会自动去重。",
    suggestions: resourceTagSuggestions,
  }),
  draft: fields.checkbox({
    label: "草稿，不公开显示",
    description: "先存着但暂时不想展示到前台时勾选。",
    defaultValue: false,
  }),
  body: fields.mdx({
    label: "补充说明（可选）",
    extension: "md",
  }),
};

const progressFields = {
  title: fields.slug({
    name: {
      label: "进展标题",
      validation: { isRequired: true },
    },
    slug: {
      label: "文件名 / URL 路径（通常自动生成）",
      description: "一般用标题自动生成即可。需要分目录时再手动调整。",
      generate: generateSlug,
    },
  }),
  description: fields.text({
    label: "简介",
    multiline: true,
  }),
  pubDatetime: fields.datetime({
    label: "日期",
    defaultValue: { kind: "now" },
  }),
  status: fields.select({
    label: "状态",
    defaultValue: "active",
    options: [
      { label: "进行中", value: "active" },
      { label: "计划中", value: "planned" },
      { label: "暂停", value: "paused" },
      { label: "已完成", value: "done" },
    ],
  }),
  url: fields.url({
    label: "相关链接",
  }),
  draft: fields.checkbox({
    label: "草稿",
    defaultValue: false,
  }),
  body: fields.mdx({
    label: "记录内容",
    extension: "md",
  }),
};

const pageFields = {
  title: fields.slug({
    name: {
      label: "页面标题",
      validation: { isRequired: true },
    },
    slug: {
      label: "文件名 / URL 路径（通常自动生成）",
      description: "一般用标题自动生成即可。需要分目录时再手动调整。",
      generate: generateSlug,
    },
  }),
  description: fields.text({
    label: "页面简介",
    multiline: true,
  }),
  ogImage: fields.text({
    label: "分享图 / OG 图片",
  }),
  canonicalURL: fields.text({
    label: "规范链接（可选）",
  }),
  body: fields.mdx({
    label: "页面内容",
    extension: "md",
  }),
};

export default config({
  cloud: {
    project: "hhhh/ezjamon-blog",
  },
  storage: {
    kind: "cloud",
  },
  ui: {
    brand: {
      name: "Amon 博客后台",
    },
    navigation: {
      写作: ["postsMarkdown", "postsMdx"],
      资料库: ["resources"],
      动态: ["progress"],
      站点维护: ["pages"],
    },
  },
  collections: {
    postsMdx: collection({
      label: "高级 MDX 文章（少用）",
      path: "src/content/posts/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title", "category", "pubDatetime", "draft", "featured"],
      schema: postFields("mdx"),
    }),
    postsMarkdown: collection({
      label: "普通文章（推荐）",
      path: "src/content/posts/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title", "category", "pubDatetime", "draft", "featured"],
      schema: postFields("md"),
    }),
    resources: collection({
      label: "收藏资源",
      path: "src/content/resources/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title", "type", "category", "source", "draft"],
      schema: resourceFields,
    }),
    progress: collection({
      label: "进展记录",
      path: "src/content/progress/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title", "status", "pubDatetime", "draft"],
      schema: progressFields,
    }),
    pages: collection({
      label: "独立页面",
      path: "src/content/pages/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title"],
      schema: pageFields,
    }),
  },
});
