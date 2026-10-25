# L13｜数据来源、数据集与使用边界

Spring 2026 · 01:22:02 · 21 个时间窗

[官方视频](https://www.youtube.com/watch?v=-qm0ln33G24&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/13--qm0ln33G24.en-orig.vtt) · [2026 官方可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_13) · [美国版权局：期限核对](https://www.copyright.gov/help/faq/faq-duration.html) · [Creative Commons：许可类型核对](https://creativecommons.org/cc-licenses/)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

沿数据的真实来源追踪到训练语料：先区分访问、许可与使用，再比较历代数据集如何用规则、模型和合成处理换取质量。

## 核心收获

- 数据是工程与社会过程的产物，公开模型权重不代表训练数据透明。
- 抽取、过滤、去重和混合会改变模型能力；质量代理必须通过下游实验检验。
- 原始数据量、独立 token 和含重复训练的总 token 是不同计量。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:16:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=0s) | 数据地位与网络访问约束 | 预训练数据不是整个互联网的无损副本，其可得性取决于抓取机制、动态服务与访问条件。 |
| [00:16:00–00:32:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=960s) | 版权、许可与案件边界 | 将表达、许可、fair use、获取与训练分开，避免用记忆指标或单一案例替代复杂判断。 |
| [00:32:00–00:44:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=1920s) | 网页、百科、代码与论文来源 | 不同来源提供不同结构和快照方式，文本抽取及供应链质量需要单独处理。 |
| [00:44:00–01:00:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=2640s) | 早期语料与质量代理的演化 | 由 BERT、WebText、CCNet、C4、GPT-3 到 The Pile/Gopher，比较链接、语言模型、分类器与规则。 |
| [01:00:00–01:12:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=3600s) | 规模化过滤与合成数据 | 从 LLaMA、FineWeb、Dolma 到 DCLM、Nemotron，质量与数量在不同处理方案中权衡。 |
| [01:12:00–01:22:02](https://www.youtube.com/watch?v=-qm0ln33G24&t=4320s) | 代码结构、许可追踪与总结 | The Stack 和 Common Pile 展示专门数据工程与来源追踪，并引出作业 4 的研究空间。 |

## 00:00:00–00:16:00｜数据地位与网络访问约束

预训练数据不是整个互联网的无损副本，其可得性取决于抓取机制、动态服务与访问条件。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=0s)｜数据为何是模型差异的核心

- Llama 3 公布架构与部分训练细节却少谈数据，讲者用它说明数据兼具竞争价值与来源争议。
- 预训练偏大量原始文本，中期训练提高质量与特定能力，后训练转向对话和任务；阶段边界并不固定。

关键词：数据 · 训练阶段

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=240s)｜网络服务不等于现成训练集

- 预训练消费抓取后的静态数据；爬虫从种子链接发现页面，不能直接把全部动态互联网喂给模型。
- 动态交互、登录和付费内容形成访问缺口；公开网页也可能通过 robots.txt 表达抓取限制。

关键词：爬虫 · 数据来源

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=480s)｜访问限制会改变可用数据分布

- 区分 robots.txt、反机器人检测、IP/速率限制与服务条款：它们分别影响抓取规范、技术可达性和使用条件。
- 讲者展示 Consent in Crisis 的历史分析，说明限制随时间增多；过去抓得到的分布不能假定现在仍可获得。

关键词：robots.txt · 数据治理

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=720s)｜抓取成本与版权问题分层

- 高频爬取会增加网站成本并降低他人服务质量；这些问题在判断训练版权之前就已存在。
- 影子图书馆说明可下载不等于权利清楚；接着用知识产权的激励目的引入版权、专利等概念。

关键词：抓取 · 版权

## 00:16:00–00:32:00｜版权、许可与案件边界

将表达、许可、fair use、获取与训练分开，避免用记忆指标或单一案例替代复杂判断。

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=960s)｜版权保护对象与许可

- 课堂区分思想与表达：算法思想和具体实现不是同一保护对象，网站公开内容也不因可见就自动失去版权。
- 许可和 fair use 是两种不同的使用依据；本段对期限与 Creative Commons 作了简化，准确边界见文末核对。

关键词：copyright · license

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=1200s)｜Fair use 的四因素框架

- 考察使用目的和方式、原作品性质、使用部分的数量与重要性，以及对原作市场的影响，需要综合权衡。
- 教育用途、转换性或少量引用都不是自动通行证；Google Books 例子用来说明搜索展示与重发原作的差异。

关键词：fair use

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=1440s)｜侵权不能只看逐字复现

- 讲者强调情节、人物与经济替代效应也相关；n-gram 重合或逐字记忆指标不能独自决定版权问题。
- 复制数据、训练与输出使用是不同环节；即使存在许可或 fair use 理由，获取时仍可能涉及其他服务条件。

关键词：memorization · 版权

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=1680s)｜诉讼案例说明结论必须限定

- 课堂回顾 Anthropic 和 Meta 案例，区分特定训练用途的判断与先前获取书籍的争议，不能把一个环节的结果外推到全部行为。
- 讲者反复限定这些是具体案件与当时进展；随后讨论许可改变与后续新增内容，提醒记录数据取得时间和依据。

关键词：案例 · 许可

## 00:32:00–00:44:00｜网页、百科、代码与论文来源

不同来源提供不同结构和快照方式，文本抽取及供应链质量需要单独处理。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=1920s)｜Common Crawl 与文本抽取

- 爬虫近似并行图遍历，但要选择下载、重访与去重策略；同 URL 可变、不同 URL 同内容使计数并不简单。
- WARC 保留原始 HTTP/HTML，WET 是有损文本；课堂比较提取器，说明 HTML→text 的实现能改变下游训练质量。

关键词：Common Crawl · WARC · WET

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=2160s)｜Wikipedia 的质量与供应链风险

- Wikipedia 依靠引用、编辑和回滚形成高质量资料，并提供周期性 dump；批量使用时可直接下载而无需重复爬取。
- 课堂以快照中的短暂恶意编辑说明：实时页面已修复不保证历史 dump 无污染，数据质量还包含供应链问题。

关键词：Wikipedia · 数据投毒

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=2400s)｜GitHub 与 arXiv 不是平面文本

- 代码仓库含目录、历史和大量 fork，GitHub 事件元数据与代码文件是不同来源；Software Heritage 汇集多个托管平台。
- arXiv 提供论文元数据、PDF 与可能存在的 LaTeX；要决定抽取格式，并分别核对元数据和论文正文的许可。

关键词：GitHub · arXiv

## 00:44:00–01:00:00｜早期语料与质量代理的演化

由 BERT、WebText、CCNet、C4、GPT-3 到 The Pile/Gopher，比较链接、语言模型、分类器与规则。

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=2640s)｜从 BERT 到 WebText：质量代理

- BERT 以 Wikipedia 和 BooksCorpus 为代表，后者说明免费书籍与允许批量收集不是同一条件。
- GPT-2 用获得足够 Reddit 赞同的帖子的外链筛选网页；OpenWebText 是公开复现，投票只是质量代理。

关键词：BERT · WebText

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=2880s)｜CCNet 与 C4：模型或规则过滤

- CCNet 做去重和语言识别，再以 Wikipedia 训练的语言模型衡量文档相似性，适于扩展到更多语言。
- C4 用标点、句长、脏词及代码符号等规则筛选 Common Crawl；规则能提升可用性，也会排除某些领域。

关键词：CCNet · C4

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=3120s)｜GPT-3 与 The Pile 的多源混合

- GPT-3 将抓取网页、WebText、书籍和 Wikipedia 混合，用分类器筛质量并模糊去重；部分书籍来源未公开。
- The Pile 收集论文、代码、邮件和书籍等异质领域；Enron 邮件与 Gutenberg 说明每类语料都有特殊形成历史。

关键词：GPT-3 · The Pile

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=3360s)｜Q&A 语料与 Gopher 的规则路线

- Books3 的来源争议与下架说明早期数据选择会留下后果；Stack Exchange 则提供接近真实问答的结构与投票元数据。
- Gopher 的 MassiveText 描述了多源处理与规则过滤；讲者用它继续比较人工规则的可控性和模型过滤的灵活性。

关键词：Stack Exchange · Gopher

## 01:00:00–01:12:00｜规模化过滤与合成数据

从 LLaMA、FineWeb、Dolma 到 DCLM、Nemotron，质量与数量在不同处理方案中权衡。

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=3600s)｜从 LLaMA 复现到大规模网页数据

- LLaMA 使用 Wikipedia 引用页面等质量信号；RedPajama 复现其数据方案，原始来源选择也随复现链传播。
- RefinedWeb、FineWeb 扩大高质量网页处理，强调文本抽取、规则、去重与隐私处理；Dolma 再加入多种领域。

关键词：LLaMA · FineWeb · Dolma

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=3840s)｜DCLM：用下游效果检验质量分类器

- DCLM 从极大网页池经过语言、规则、去重与模型过滤，只保留少量比例；关键不是原始 token 越多越好。
- 用 OpenHermes、ELI5 等作为正样本训练 fastText 质量分类器，课堂展示其效果；这种质量定义仍取决于正负样本。

关键词：DCLM · fastText

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=4080s)｜Nemotron-CC：过滤与合成的组合

- 用语言模型标注教育价值，再训练廉价分类器；对低质量文档改写，对高质量文档生成问答、摘要等任务。
- 过滤强度要平衡质量与数量；论文报告的训练 token 可能含重复 epoch，不能直接当作互不重复的数据量。

关键词：Nemotron-CC · 合成数据

## 01:12:00–01:22:02｜代码结构、许可追踪与总结

The Stack 和 Common Pile 展示专门数据工程与来源追踪，并引出作业 4 的研究空间。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=4320s)｜The Stack：代码之外的开发过程

- 代码清理还要去除二进制、恶意文件、机器人记录和重复项；低资源语言可借共同中间表示建立联系。
- PR、评论和 diff 需要线性化并决定上下文大小，模型由此学习开发事件序列，而不只是单个代码文件。

关键词：The Stack · 代码数据

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=-qm0ln33G24&t=4560s)｜Common Pile 与逐项权利追踪

- Common Pile 探索仅用许可明确的数据能训练到什么程度；课堂指出已有成果，但数据规模仍影响竞争力。
- 集合级许可证不能自动覆盖每篇作品，随意重贴许可会造成来源混淆；项目对合成数据也采取谨慎筛选。

关键词：Common Pile · 来源追踪

### [01:20:00–01:22:02](https://www.youtube.com/watch?v=-qm0ln33G24&t=4800s)｜数据工程主线与研究机会

- 真实流程是在线服务→原始快照→抽取、过滤、去重后的训练语料，每一步都会改变最终模型。
- 大量数据决策仍靠启发式、阈值和代理分类器；作业 4 可以围绕过滤策略提出并验证改进。

关键词：数据工程 · 作业4

## 复习问题

1. 为什么 WARC→文本的抽取器会改变训练效果，而不仅改变文件大小？
2. 比较 WebText、CCNet、C4、DCLM：各自把什么当作高质量代理，会漏掉什么？
3. 如何区分公开可访问、集合许可、单项作品许可和具体训练用途？

## 易错点

- 不要把网页总量、抓取量、过滤后独立 token 与多轮训练 token 混为一谈。
- 不要假设全部 Creative Commons 条款等同公有领域，或只需检查数据集首页许可证。
- 不要把课堂案例的历史进展当作截至今日的普遍法律结论；本讲是数据课的背景说明。

## 核验说明

完整逐窗读取 Young-Lord 镜像 ASR，未逐秒重听音频；WAT、DCLAM、archive、Brazilia 等按官方源码校正为 WET、DCLM、arXiv、resiliparse。课堂与课件写版权期限75年，不能照作通则：版权局列作者终身加70年等不同情形；CC也不是公有领域。两点为课外核对，已另列一手来源。案例仅概述课堂当时区分，不更新诉讼状态。

[官方视频](https://www.youtube.com/watch?v=-qm0ln33G24&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/13--qm0ln33G24.en-orig.vtt) · [2026 官方可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_13) · [美国版权局：期限核对](https://www.copyright.gov/help/faq/faq-duration.html) · [Creative Commons：许可类型核对](https://creativecommons.org/cc-licenses/)
