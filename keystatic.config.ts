import { collection, config, fields } from "@keystatic/core";

const postFields = (extension: "md" | "mdx") => ({
  title: fields.slug({
    name: {
      label: "Title",
      validation: { isRequired: true },
    },
    slug: {
      label: "File slug",
      description:
        "Controls the file path and the public URL. Use slashes for subfolders.",
    },
  }),
  slug: fields.text({
    label: "Legacy slug frontmatter",
    description:
      "Optional compatibility field from older AstroPaper posts. The current site URL comes from the file slug above.",
  }),
  author: fields.text({
    label: "Author",
    description: "Leave empty to use the site author from AstroPaper config.",
  }),
  pubDatetime: fields.datetime({
    label: "Published date",
    defaultValue: { kind: "now" },
    validation: { isRequired: true },
  }),
  modDatetime: fields.datetime({
    label: "Modified date",
    description: "Optional. Used for sorting and RSS when present.",
  }),
  description: fields.text({
    label: "Description",
    multiline: true,
    validation: { isRequired: true },
  }),
  featured: fields.checkbox({
    label: "Featured",
    defaultValue: false,
  }),
  draft: fields.checkbox({
    label: "Draft",
    defaultValue: false,
  }),
  tags: fields.array(fields.text({ label: "Tag" }), {
    label: "Tags",
    itemLabel: props => props.value,
  }),
  ogImage: fields.text({
    label: "OG image",
    description: "Remote URL or image path relative to the current post file.",
  }),
  canonicalURL: fields.text({
    label: "Canonical URL",
  }),
  hideEditPost: fields.checkbox({
    label: "Hide edit post link",
    defaultValue: false,
  }),
  timezone: fields.text({
    label: "Timezone",
    description: "Optional IANA timezone, for example Asia/Shanghai.",
  }),
  body: fields.mdx({
    label: "Content",
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
      label: "Title",
      validation: { isRequired: true },
    },
    slug: {
      label: "File slug",
    },
  }),
  description: fields.text({
    label: "Description",
    multiline: true,
    validation: { isRequired: true },
  }),
  url: fields.url({
    label: "URL",
    validation: { isRequired: true },
  }),
  type: fields.select({
    label: "Type",
    defaultValue: "bookmark",
    options: [
      { label: "Article", value: "article" },
      { label: "Video", value: "video" },
      { label: "Course", value: "course" },
      { label: "Tool", value: "tool" },
      { label: "Bookmark", value: "bookmark" },
      { label: "Repository", value: "repo" },
      { label: "Game", value: "game" },
    ],
  }),
  source: fields.text({
    label: "Source",
  }),
  pubDatetime: fields.datetime({
    label: "Published date",
    defaultValue: { kind: "now" },
  }),
  tags: fields.array(fields.text({ label: "Tag" }), {
    label: "Tags",
    itemLabel: props => props.value,
  }),
  draft: fields.checkbox({
    label: "Draft",
    defaultValue: false,
  }),
  body: fields.mdx({
    label: "Content",
    extension: "md",
  }),
};

const pageFields = {
  title: fields.slug({
    name: {
      label: "Title",
      validation: { isRequired: true },
    },
    slug: {
      label: "File slug",
    },
  }),
  description: fields.text({
    label: "Description",
    multiline: true,
  }),
  ogImage: fields.text({
    label: "OG image",
  }),
  canonicalURL: fields.text({
    label: "Canonical URL",
  }),
  body: fields.mdx({
    label: "Content",
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
      name: "Amon Blog CMS",
    },
    navigation: {
      Content: [
        "postsMdx",
        "postsMarkdown",
        "resources",
        "pages",
      ],
    },
  },
  collections: {
    postsMdx: collection({
      label: "Posts (MDX)",
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
      label: "Posts (Markdown)",
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
      label: "Resources",
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
    pages: collection({
      label: "Pages",
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
