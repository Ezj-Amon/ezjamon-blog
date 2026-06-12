import { collection, config, fields } from "@keystatic/core";
import type {
  BasicFormField,
  ContentFormField,
  FormFieldStoredValue,
} from "@keystatic/core";
import { TextArea } from "@keystar/ui/text-field";
import { createElement } from "react";

const tagSeparators = /[,\n\r;，；、]+|\s{2,}/u;

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

function tagListField({
  label,
  description,
}: {
  label: string;
  description: string;
}): BasicFormField<readonly string[]> {
  return {
    kind: "form",
    label,
    Input(props) {
      return createElement(TextArea, {
        label,
        description,
        autoFocus: props.autoFocus,
        value: props.value.join(", "),
        onChange: (value: string) => props.onChange(splitTags(value)),
      });
    },
    defaultValue() {
      return [];
    },
    parse: parseStoredTags,
    serialize(value) {
      return { value: value.length > 0 ? value : undefined };
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
      label: "文件名 / URL 路径",
      description:
        "决定文章文件路径和公开访问地址。可用英文、数字和短横线；需要子文件夹时用斜杠分隔。",
    },
  }),
  slug: fields.text({
    label: "旧版 slug（一般留空）",
    description:
      "兼容旧版 AstroPaper 文章的字段。现在网站地址主要由上面的“文件名 / URL 路径”决定。",
  }),
  author: fields.text({
    label: "作者",
    description: "留空时会使用 AstroPaper 配置里的默认作者。",
  }),
  pubDatetime: fields.datetime({
    label: "发布时间",
    defaultValue: { kind: "now" },
    validation: { isRequired: true },
  }),
  scheduled: fields.checkbox({
    label: "定时发布",
    description:
      "勾选后，只有到达上面的发布时间才会在生产环境显示；不勾选则按普通文章处理。",
    defaultValue: false,
  }),
  modDatetime: fields.datetime({
    label: "更新时间（可选）",
    description: "填写后会用于文章排序、RSS 和页面里的“更新于”。不需要时可以留空。",
  }),
  description: fields.text({
    label: "文章摘要",
    multiline: true,
    validation: { isRequired: true },
  }),
  featured: fields.checkbox({
    label: "设为精选文章",
    description: "勾选后可能出现在首页“精选文章”区域。",
    defaultValue: false,
  }),
  draft: fields.checkbox({
    label: "草稿",
    description: "勾选后不会公开发布，适合先保存未完成的文章。",
    defaultValue: false,
  }),
  category: fields.text({
    label: "一级分类",
    description:
      "可选。用于文章列表里的主分类；留空时会用第一个标签作为分类显示。",
  }),
  subcategory: fields.text({
    label: "二级分类",
    description: "可选。显示在普通标签之前，适合更细的内容分组。",
  }),
  tags: tagListField({
    label: "标签",
    description:
      "可一次输入多个标签。支持用逗号、顿号、分号、换行或两个以上空格分隔；保存时会自动去重。",
  }),
  ogImage: fields.text({
    label: "分享图 / OG 图片",
    description: "用于社交平台分享预览。可以填远程图片 URL，或相对当前文章文件的图片路径。",
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
    label: "时区",
    description: "可选。默认 Asia/Shanghai，通常不用改。",
    defaultValue: "Asia/Shanghai",
  }),
  body:
    extension === "mdx"
      ? rawContentField({
          label: "MDX 原文内容",
          description:
            "高级文章使用原文编辑，支持 import、Astro/React 组件和复杂 JSX。普通文章建议使用 Markdown 入口。",
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
      label: "文件名 / URL 路径",
    },
  }),
  description: fields.text({
    label: "简介",
    multiline: true,
    validation: { isRequired: true },
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
    label: "来源",
  }),
  pubDatetime: fields.datetime({
    label: "发布日期",
    defaultValue: { kind: "now" },
  }),
  category: fields.text({
    label: "一级分类",
  }),
  subcategory: fields.text({
    label: "二级分类",
  }),
  tags: tagListField({
    label: "标签",
    description:
      "可一次输入多个标签。支持用逗号、顿号、分号、换行或两个以上空格分隔；保存时会自动去重。",
  }),
  draft: fields.checkbox({
    label: "草稿",
    defaultValue: false,
  }),
  body: fields.mdx({
    label: "补充说明",
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
      label: "文件名 / URL 路径",
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
      label: "文件名 / URL 路径",
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
      内容管理: [
        "postsMdx",
        "postsMarkdown",
        "resources",
        "progress",
        "pages",
      ],
    },
  },
  collections: {
    postsMdx: collection({
      label: "文章（MDX，高级）",
      path: "src/content/posts/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title", "pubDatetime", "draft", "featured"],
      schema: postFields("mdx"),
    }),
    postsMarkdown: collection({
      label: "文章（Markdown，常用）",
      path: "src/content/posts/**",
      slugField: "title",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "body",
      },
      columns: ["title", "pubDatetime", "draft", "featured"],
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
      columns: ["title", "type", "draft"],
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
