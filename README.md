# Amon Blog

这是 [ezjamon.com](https://ezjamon.com) 的源码仓库，也是 Amon 的个人博客。

这里主要记录 AI、建站、内容系统和产品思考里的折腾、复盘与踩坑。它不是一个主题展示项目，而是一个持续维护的个人内容站点。

## 这里有什么

- 文章：较完整的技术笔记、复盘和思考。
- 收藏：工具、教程、视频、资料和网页链接。
- 进展：最近正在推进或阶段性完成的事情。
- 标签与分类：按主题继续浏览相关内容。

## 本地开发

```bash
npm install
npm run dev
```

默认本地地址：

```txt
http://localhost:4321
```

## 发布前检查

```bash
npm run lint
npm run build
npm run build:cms
```

`npm run build` 用于验证公开站点和 Pagefind 搜索索引。

`npm run build:cms` 用于验证 Cloudflare / Keystatic CMS 构建路径。

## 维护提示

- 首页应保持个人博客感，围绕“我是谁、最近在写什么、从哪里继续看”组织内容。
- 收藏、进展、标签页的搜索只筛选当前页面，全站搜索由导航栏入口承担。
- 不提交 `dist`、`.astro`、`.wrangler`、`public/pagefind`、`output`、`test-results` 等生成产物。
- 构建脚本只能引用 Node 内置模块或 `package.json` 中明确声明的依赖。

更完整的工程结构、内容模型、CMS、部署和构建注意事项见 [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)。

## 致谢

本博客最初基于 [AstroPaper](https://github.com/satnaing/astro-paper) 改造。

## License

MIT License.
