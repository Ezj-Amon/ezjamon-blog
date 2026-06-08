---
title: "如何发布文章和收藏"
description: "整理这个博客里文章与收藏的发布模板，以及从新建文件到公开发布的基本流程。"
pubDatetime: 2026-06-08T17:00:00+08:00
author: "Amon"
featured: true
draft: false
tags:
  - 博客
  - 写作
  - 收藏
---

这篇文章用来放博客的发布说明。以后要写正式文章、记录教程链接、收藏 B 站视频、保存网页资料时，可以直接从这里复制模板。

## 目录

## 两个发布模板

### 文章模板

文章用于发布我自己写的内容，比如技术总结、项目复盘、阶段性思考、长笔记。

文件放在：

```txt
src/content/posts/
```

新建一个 `.md` 文件，例如：

```txt
src/content/posts/my-first-post.md
```

复制这个模板：

```md
---
title: "文章标题"
description: "文章摘要，会显示在文章列表、搜索结果和 SEO 描述里。"
pubDatetime: 2026-06-08T17:00:00+08:00
author: "Amon"
featured: false
draft: false
tags:
  - 标签一
  - 标签二
---

这里开始写正文。

## 一个小标题

这里写具体内容。
```

常用字段说明：

| 字段          | 用途                       |
| ------------- | -------------------------- |
| `title`       | 文章标题                   |
| `description` | 文章摘要                   |
| `pubDatetime` | 发布时间                   |
| `author`      | 作者                       |
| `featured`    | 是否显示在首页「精选文章」 |
| `draft`       | 是否草稿，`true` 不公开    |
| `tags`        | 标签，用于分类和搜索       |

### 收藏模板

收藏用于记录外部资料，比如教程文章、B 站视频、工具网站、GitHub 项目、网页收藏夹条目。

文件放在：

```txt
src/content/resources/
```

新建一个 `.md` 文件，例如：

```txt
src/content/resources/vue3-bilibili-course.md
```

复制这个模板：

```md
---
title: "收藏标题"
description: "为什么收藏它，适合什么时候看，解决了什么问题。"
url: "https://example.com"
type: "bookmark"
source: "来源名称"
pubDatetime: 2026-06-08T17:00:00+08:00
tags:
  - 标签一
  - 标签二
draft: false
---
```

`type` 可以选择：

| 类型       | 适合记录            |
| ---------- | ------------------- |
| `article`  | 外部文章            |
| `video`    | 视频，比如 B 站教程 |
| `course`   | 系列课程            |
| `tool`     | 工具网站或软件      |
| `bookmark` | 普通网页收藏        |
| `repo`     | GitHub 等代码仓库   |
| `game`     | 游戏或游戏资料      |

例如记录一个 B 站视频：

```md
---
title: "Vue3 入门教程"
description: "适合快速建立 Vue3 的整体认识，之后做项目时可以回来查基础概念。"
url: "https://www.bilibili.com/video/xxx"
type: "video"
source: "Bilibili"
pubDatetime: 2026-06-08T17:00:00+08:00
tags:
  - Vue
  - 前端
  - 教程
draft: false
---
```

## 如何发布一篇文章

1. 在 `src/content/posts/` 下面新建一个 `.md` 文件。

2. 复制「文章模板」，改掉 `title`、`description`、`pubDatetime` 和 `tags`。

3. 在 frontmatter 下面写正文。

4. 如果还不想公开，把 `draft` 改成 `true`。

5. 如果想放到首页「精选文章」，把 `featured` 改成 `true`。

6. 写完后运行：

```bash
npm run build
```

构建通过后，这篇文章就会出现在「文章」页面。如果 `featured: true`，也会出现在首页「精选文章」。

## 如何发布一条收藏

1. 在 `src/content/resources/` 下面新建一个 `.md` 文件。

2. 复制「收藏模板」，填写 `title`、`description`、`url`、`type`、`source` 和 `tags`。

3. `description` 建议写自己的判断，不只是复制原标题。比如可以写：

   这条资料解决了什么问题、为什么值得回看、适合哪个阶段使用。

4. 如果只是临时存一下，还不想展示，设置：

```md
draft: true
```

5. 如果要公开展示，设置：

```md
draft: false
```

6. 写完后运行：

```bash
npm run build
```

构建通过后，这条收藏会出现在「收藏」页面。

## 我的发布习惯

文章更适合放「我已经整理过的内容」。它可以不完美，但最好有一个相对完整的主题。

收藏更适合放「我之后还会用到的材料」。它不要求完整，但最好写一句自己的判断，否则以后回看时很难知道当初为什么收藏。

一个简单判断：

| 想记录的内容           | 放哪里 |
| ---------------------- | ------ |
| 我写的一篇总结         | 文章   |
| 某个 B 站教程视频      | 收藏   |
| 一个好用的工具网站     | 收藏   |
| 一个项目复盘           | 文章   |
| 一个 GitHub 仓库       | 收藏   |
| 一组长期维护的学习笔记 | 文章   |

## 发布前检查

发布前至少看三件事：

- `draft` 是否已经设成想要的状态
- `pubDatetime` 时间是否正确
- `npm run build` 是否通过

如果构建失败，优先检查 frontmatter：缩进、引号、时间格式、URL 是否完整，通常问题都在这里。
