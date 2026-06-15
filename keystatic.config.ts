import { collection, config, fields } from "@keystatic/core";
import type {
  BasicFormField,
  ContentFormField,
  FormFieldStoredValue,
} from "@keystatic/core";
import { TextArea } from "@keystar/ui/text-field";
import { createElement } from "react";
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

function tagListField({
  label,
  description,
}: {
  label: string;
  description: string;
}): BasicFormField<string, string, readonly string[]> {
  return {
    kind: "form",
    label,
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
  category: fields.text({
    label: "一级分类",
    description:
      "用于文章列表里的主分类。建议填写稳定主题，比如 AI 搜索、建站笔记、前端开发。",
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
  category: fields.text({
    label: "一级分类",
    description: "例如 游戏资料、资源收藏、AI 搜索。",
  }),
  subcategory: fields.text({
    label: "二级分类",
    description: "会显示在普通标签之前，适合写更细的用途或类型。",
  }),
  tags: tagListField({
    label: "标签",
    description:
      "可一次输入多个标签。支持用逗号、顿号、分号、换行或两个以上空格分隔；保存时会自动去重。",
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
      label: "写高级 MDX 文章",
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
      label: "写普通文章",
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
      columns: ["title", "type", "source", "draft"],
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
