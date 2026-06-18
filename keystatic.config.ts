import { collection, config, fields } from "@keystatic/core";
import type {
  BasicFormField,
  ContentFormField,
  FormFieldStoredValue,
} from "@keystatic/core";
import { ActionButton } from "@keystar/ui/button";
import { DatePicker } from "@keystar/ui/date-time";
import { TextArea, TextField } from "@keystar/ui/text-field";
import { parseDateTime } from "@internationalized/date";
import { createElement, type CSSProperties } from "react";
import {
  postCategorySuggestions,
  postSubcategorySuggestions,
  postTagSuggestions,
  resourceCategorySuggestions,
  resourceSourceSuggestions,
  resourceSubcategorySuggestions,
  resourceTagSuggestions,
  type CmsTaxonomyOption,
} from "./src/data/cmsTaxonomy";
import { slugifyStr } from "./src/utils/slugify";

const tagSeparators = /[,\n\r;，；、]+|\s{2,}/u;
const defaultCmsTimezone = "Asia/Shanghai";
const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;
const timezoneSuggestions = [
  {
    label: "中国时间 Asia/Shanghai（推荐）",
    value: "Asia/Shanghai",
    count: 0,
  },
  { label: "UTC", value: "UTC", count: 0 },
  { label: "缅甸时间 Asia/Yangon", value: "Asia/Yangon", count: 0 },
] satisfies CmsTaxonomyOption[];

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

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeLocalDateTime(value: string) {
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?$/u
  );

  return match ? `${match[1]}T${match[2]}` : null;
}

function getZonedDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function formatDateForTimezone(date: Date, timezone = defaultCmsTimezone) {
  const parts = getZonedDateParts(date, timezone);

  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(
    parts.day
  )}T${padDatePart(parts.hour)}:${padDatePart(parts.minute)}`;
}

function getTimezoneOffset(date: Date, timezone: string) {
  const parts = getZonedDateParts(date, timezone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return zonedAsUtc - date.getTime();
}

function parseLocalDateTimeParts(value: string) {
  if (!datetimePattern.test(value)) return null;

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return { year, month, day, hour, minute };
}

function localDateTimeToDate(value: string, timezone = defaultCmsTimezone) {
  const parts = parseLocalDateTimeParts(value);
  if (!parts) return null;

  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute
  );
  let utcTime = localAsUtc;

  for (let i = 0; i < 3; i += 1) {
    utcTime = localAsUtc - getTimezoneOffset(new Date(utcTime), timezone);
  }

  return new Date(utcTime);
}

function parseStoredDateTime(
  value: FormFieldStoredValue,
  timezone = defaultCmsTimezone
) {
  if (value === undefined) return null;
  if (value instanceof Date) return formatDateForTimezone(value, timezone);
  if (typeof value !== "string") throw new Error("日期时间必须是文本或日期");

  if (/Z$|[+-]\d{2}:?\d{2}$/u.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("日期时间格式无效");
    return formatDateForTimezone(date, timezone);
  }

  const normalized = normalizeLocalDateTime(value);
  if (!normalized) throw new Error("日期时间格式无效");
  return normalized;
}

function readStoredDateTime(
  value: FormFieldStoredValue,
  timezone = defaultCmsTimezone
) {
  const parsed = parseStoredDateTime(value, timezone);
  return parsed ? (localDateTimeToDate(parsed, timezone) ?? undefined) : undefined;
}

function formatCalendarDateTime(value: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}) {
  return `${value.year}-${padDatePart(value.month)}-${padDatePart(
    value.day
  )}T${padDatePart(value.hour ?? 0)}:${padDatePart(value.minute ?? 0)}`;
}

function parseCalendarDateTime(value: string | null) {
  if (!value) return null;

  try {
    return parseDateTime(value);
  } catch {
    return null;
  }
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

const dateTimeWrapStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const dateTimeActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const dateTimeHintStyle: CSSProperties = {
  color: "var(--ksv-color-foreground-neutral-secondary)",
  fontSize: 12,
  lineHeight: 1.5,
  margin: 0,
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

function cmsDateTimeField({
  label,
  description,
  isRequired = false,
  defaultToNow = false,
  timezone = defaultCmsTimezone,
}: {
  label: string;
  description?: string;
  isRequired?: boolean;
  defaultToNow?: boolean;
  timezone?: string;
}): BasicFormField<string | null, string | null, Date | undefined> {
  return {
    kind: "form",
    label,
    Input(props) {
      const setNow = () => props.onChange(formatDateForTimezone(new Date(), timezone));
      const setTodayAt = (hour: number) => {
        const today = formatDateForTimezone(new Date(), timezone).slice(0, 10);
        props.onChange(`${today}T${padDatePart(hour)}:00`);
      };

      return createElement(
        "div",
        { style: dateTimeWrapStyle },
        createElement(DatePicker, {
          label,
          description,
          autoFocus: props.autoFocus,
          value: parseCalendarDateTime(props.value),
          onChange(value) {
            props.onChange(value ? formatCalendarDateTime(value) : null);
          },
          granularity: "minute",
          hourCycle: 24,
          shouldForceLeadingZeros: true,
          isRequired,
          placeholderValue: parseDateTime(
            formatDateForTimezone(new Date(), timezone)
          ),
        }),
        createElement(
          "div",
          { style: dateTimeActionsStyle },
          createElement(ActionButton, { onPress: setNow }, "现在"),
          createElement(ActionButton, { onPress: () => setTodayAt(9) }, "今天 09:00"),
          createElement(
            ActionButton,
            { onPress: () => setTodayAt(18) },
            "今天 18:00"
          ),
          !isRequired &&
            createElement(
              ActionButton,
              { onPress: () => props.onChange(null) },
              "清空"
            )
        ),
        createElement(
          "p",
          { style: dateTimeHintStyle },
          `按 ${timezone} 选择时间；保存后前台会按该时区展示，不会再偏移。`
        )
      );
    },
    defaultValue() {
      return defaultToNow ? formatDateForTimezone(new Date(), timezone) : null;
    },
    parse(value) {
      const parsed = parseStoredDateTime(value, timezone);
      return parsed ?? (defaultToNow ? formatDateForTimezone(new Date(), timezone) : null);
    },
    serialize(value) {
      if (value === null) return { value: undefined };

      const date = localDateTimeToDate(value, timezone);
      if (!date) throw new Error(`${label}格式无效`);

      return { value: date };
    },
    validate(value) {
      if (value === null) {
        if (isRequired) throw new Error(`${label}不能为空`);
        return value;
      }

      if (!datetimePattern.test(value) || !localDateTimeToDate(value, timezone)) {
        throw new Error(`${label}格式无效`);
      }

      return value;
    },
    reader: {
      parse(value) {
        return readStoredDateTime(value, timezone);
      },
    },
  };
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

function timezoneField(): BasicFormField<string, string, string | undefined> {
  return {
    kind: "form",
    label: "时区（通常不用改）",
    Input(props) {
      return createElement(
        "div",
        null,
        createElement(TextField, {
          label: "时区（通常不用改）",
          description:
            "默认使用 Asia/Shanghai。只有文章需要按其他地区时间展示时再改。",
          autoFocus: props.autoFocus,
          value: props.value,
          onChange: props.onChange,
        }),
        renderSuggestions({
          suggestions: timezoneSuggestions,
          currentValues: [props.value],
          onPick(value) {
            props.onChange(value);
          },
          max: timezoneSuggestions.length,
        })
      );
    },
    defaultValue() {
      return defaultCmsTimezone;
    },
    parse(value) {
      const parsed = parseOptionalText(value).trim();
      return parsed || defaultCmsTimezone;
    },
    serialize(value) {
      const trimmed = value.trim();
      return {
        value:
          trimmed && trimmed !== defaultCmsTimezone ? trimmed : undefined,
      };
    },
    validate(value) {
      const trimmed = value.trim();
      if (!trimmed) return defaultCmsTimezone;

      try {
        new Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(
          new Date()
        );
      } catch {
        throw new Error("请输入有效的 IANA 时区，例如 Asia/Shanghai 或 UTC");
      }

      return trimmed;
    },
    reader: {
      parse(value) {
        const parsed = parseOptionalText(value).trim();
        return parsed && parsed !== defaultCmsTimezone ? parsed : undefined;
      },
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
  pubDatetime: cmsDateTimeField({
    label: "发布时间",
    isRequired: true,
    defaultToNow: true,
  }),
  scheduled: fields.checkbox({
    label: "到发布时间后自动公开",
    description:
      "预约发布时勾选，并确认“草稿”已取消；草稿文章无论是否到发布时间都不会公开。",
    defaultValue: false,
  }),
  modDatetime: cmsDateTimeField({
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
    description:
      "新文章默认是草稿。写完准备发布前，记得取消勾选；预约发布也必须先取消草稿。",
    defaultValue: true,
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
      "新文章默认是草稿。即时发布：取消“草稿”。预约发布：取消“草稿”，勾选“到发布时间后自动公开”，并确认发布时间。",
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
  timezone: timezoneField(),
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
  source: suggestedTextField({
    label: "来源（可选）",
    description: "优先点击已有来源，方便收藏页保持统一。",
    suggestions: resourceSourceSuggestions,
  }),
  pubDatetime: cmsDateTimeField({
    label: "收藏时间",
    defaultToNow: true,
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
  pubDatetime: cmsDateTimeField({
    label: "日期",
    defaultToNow: true,
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
    description: "可选。填写项目地址、发布页、文档或外部记录链接。",
  }),
  draft: fields.checkbox({
    label: "草稿",
    description: "暂时不想展示到前台时勾选。",
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
    description: "可选。用于页面 SEO 描述和分享预览。",
  }),
  ogImage: fields.text({
    label: "分享图 / OG 图片（可选）",
    description: "可以填远程图片 URL 或站内图片路径；留空时使用默认分享图。",
  }),
  canonicalURL: fields.text({
    label: "规范链接（可选）",
    description: "只有页面内容还有原始发布地址时再填写。",
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
