# CS336 Atlas

Stanford CS336（Language Modeling from Scratch）Spring 2026 的个人学习站。把公开课录像、逐段笔记、作业与资料入口、参考文献，以及课堂自测收成一套可检索的工作台。

课程与原始材料归斯坦福大学及各自权利人所有。本仓库是个人整理的导航、概括和自测，不是官方课程站点，也不代做官方作业。

## 能做什么

- **18 讲笔记**：17 讲正课加 Dan Fu 嘉宾课，合计约 24 小时 09 分，按 4 分钟时间窗检索。
- **直达录像**：每个时间窗链到 2026 官方 YouTube 时间戳。
- **课堂自测**：387 道复习题、208 条易错点，均附解答。可全部展开，也可逐题自测，并标记「已会」。
- **学习路线**：三种投入方式、六个阶段、每讲四步和常见卡点。
- **资源与文献**：按 P0 / P1 / P2 索引资料，114 条官方参考文献入口。
- **覆盖核验**：写明主线固定为 Spring 2026、字幕与讲义版本，以及未公开录像的边界。
- **本地进度**：已读时间窗、收藏资源和自测进度存在浏览器 `localStorage`，不需要账号。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 总览、继续学习、三种进入方式 |
| `/guide` | 学习路线与卡点 |
| `/notes` | 18 讲目录 |
| `/notes/l01` … `/notes/l17`、`/notes/dan-fu` | 单讲笔记与自测 |
| `/resources` | 资源索引 |
| `/references` | 参考文献 |
| `/coverage` | 覆盖与核验 |

在笔记页按 `⌘K` 或 `/` 可搜索讲次、时间窗和资源。

## 本地运行

需要 Node.js 22。

```bash
npm install
npm run dev
```

开发服务器监听 `0.0.0.0:8080`。

```bash
npm run typecheck
npm run build
```

## 技术栈

React 19、TanStack Start / Router、Tailwind CSS v4、Zustand。进度只写在本机。

## 内容从哪来

笔记由 `attachments/` 里的讲义整理稿解析而来，生成结果在 `src/data/`：

| 文件 | 内容 |
| --- | --- |
| `lectures.json` | 18 讲正文与时间窗 |
| `reviews.json` | 复习题、解答、易错点 |
| `resources.json` | 资源索引 |
| `references.json` | 参考文献 |
| `coverage.json` | 覆盖核验 |
| `search-index.json` | 站内搜索 |

重新生成笔记数据：

```bash
node scripts/parse-cs336.mjs
```

自测题在 `src/data/reviews.json`，不由该脚本覆盖。

## 资料边界

核验日期 **2026-09-08**。

- 视频身份与时长来自 Stanford Online 官方播放列表。
- 时间轴使用公开 VTT 字幕镜像，按绝对时间分窗，不是教师切章。
- 摘要是逐窗概括，不是字幕全文，也不是逐帧听校。
- 官网日程中 Daniel Selsam 一讲，当时播放列表没有对应公开录像，站内未用其他年份视频填补。
- 复习题解答用于自测，公式与术语仍以官方讲义和一手论文为准。

## 目录

```text
src/routes/          页面
src/components/      界面与自测面板
src/data/            课程数据
src/lib/progress.ts  本地学习进度
attachments/         原始整理稿
scripts/parse-cs336.mjs
public/              图标与分享图
```
