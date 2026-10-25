# L01｜课程全景与分词

Spring 2026 · 01:19:22 · 20 个时间窗

[官方视频](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/01-JuoVZkPBiKk.en-orig.vtt) · [官方可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_01) · [官方讲义源码](https://github.com/stanford-cs336/lectures/blob/main/lecture_01.py)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

以固定资源下的效率为主线，说明从零训练语言模型的学习地图，并从朴素分词推导BPE。

## 核心收获

- 从小模型学机制和实验方法；不要默认小规模经验能外推到前沿规模。
- 模型训练贯穿表达能力、数值稳定性、计算与数据效率的权衡。
- BPE用数据驱动的常见片段压缩文本，编码与解码必须可逆。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=0s) | 课程动机、迁移边界与开放生态 | 说明为何要亲手构建模型，以及小规模课程能可靠传授哪些知识。 |
| [00:20:00–00:36:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=1200s) | 学习方式与基础训练栈 | 介绍课程实践安排，并梳理分词、架构、优化与训练稳定性的关系。 |
| [00:36:00–00:52:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=2160s) | 系统效率与缩放配方 | 从数据搬运、多卡与推理出发，解释如何利用小实验规划大规模训练。 |
| [00:52:00–01:04:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=3120s) | 评测、数据与对齐 | 先定义模型要做什么，再构建数据管线与反馈驱动的后训练。 |
| [01:04:00–01:19:22](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=3840s) | 分词设计到BPE实现 | 比较分词粒度，逐步走通BPE训练、编码和性能优化。 |

## 00:00:00–00:20:00｜课程动机、迁移边界与开放生态

说明为何要亲手构建模型，以及小规模课程能可靠传授哪些知识。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=0s)｜课程定位与2026更新

- 课程坚持亲手实现高价值组件，以建立研究与工程能力；2026版增加MoE、长上下文及智能体相关需求。
- 调用、微调到提示模型的抽象层次不断升高；研究者若要改变模型能力，仍需理解底层技术栈。

关键词：MoE

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=240s)｜小模型实验能迁移什么

- 大模型成本与闭源细节限制直接复现；小规模与大规模的FLOPs分布、涌现行为可能明显不同。
- 可迁移重点是实现机制与工作方法：理解Transformer、并行化，并持续做profiling和benchmark。

关键词：Transformer · FLOPs

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=480s)｜效率视角与苦涩教训

- 架构改动是否有效常依赖实验，不能总靠漂亮解释推出；SwiGLU论文被用来说明经验结论的地位。
- 苦涩教训强调可扩展算法；固定数据与计算预算下提高效率，大规模训练中几个百分点也价值显著。

关键词：SwiGLU · GLU

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=720s)｜现代语言模型发展脉络

- 从神经语言模型、seq2seq、Adam、注意力到Transformer，模型能力依靠架构、优化与系统共同发展。
- GPT系列推动规模化和上下文学习；早期开放复现遇到训练问题，后来Llama等显著改善开放模型生态。

关键词：Transformer · Adam

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=960s)｜开放生态与不变的基础

- 开放权重之外，AI2、NVIDIA、Marin进一步开放论文、代码、数据；公开信息仍常缺少完整数据配方。
- 交互从微调、提示、对话走向智能体，但GPU、梯度优化、Transformer仍是基础，长上下文加重推理压力。

关键词：Transformer · GPU · Marin

## 00:20:00–00:36:00｜学习方式与基础训练栈

介绍课程实践安排，并梳理分词、架构、优化与训练稳定性的关系。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=1200s)｜学习目标与作业组织

- 课程面向想理解模型内部、增强研究工程能力的人；应用落地通常应先尝试提示或微调，再考虑预训练。
- 五次作业工作量较大，提供单元测试而非完整脚手架；观看公开课后仍需实际编码才能形成能力。

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=1440s)｜AI助教、算力与五个模块

- 大部分正确性实现可先在笔记本完成，再用GPU训练或基准测试；本届介绍Modal算力与课程操作指南。
- 课堂要求AI辅助遵循教学提示词，重在答疑而非代写；五部分依次是基础、系统、缩放、数据、对齐。

关键词：GPU

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=1680s)｜Tokenizer与架构选择预览

- 分词把原始字节压缩成较短token序列，也让常见片段少用计算、少见片段保留更细粒度表示。
- 架构选择包括激活、位置编码、归一化、稀疏或线性注意力及MoE；形状参数同样影响扩展表现。

关键词：Tokenizer · MoE

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=1920s)｜训练栈与三方权衡

- 损失、优化器、初始化、学习率、批量等并非可随便搜索的细节；设置不当会导致大规模训练失稳。
- 作业1实现BPE、Transformer、优化器与训练器；总体需平衡表达能力、参数/梯度稳定性与硬件效率。

关键词：BPE · Transformer

## 00:36:00–00:52:00｜系统效率与缩放配方

从数据搬运、多卡与推理出发，解释如何利用小实验规划大规模训练。

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=2160s)｜资源核算与核函数融合

- 以训练成本约6ND引出FLOPs和显存核算；计算单元与HBM分离，搬运数据常比执行算术更关键。
- 融合把连续算子放进一次读写中，减少中间结果往返HBM；分块计算同样围绕数据复用组织工作。

关键词：FLOPs · HBM

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=2400s)｜分布式训练与推理

- 多GPU需分配参数、激活、梯度、优化器状态，并使用集合通信；数据、张量、流水线、序列、专家均可分片。
- 推理分prefill和逐token decode，后者易受带宽限制；量化、蒸馏、投机解码和动态批处理提供不同提速路径。

关键词：GPU

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=2640s)｜缩放配方为何先于大训练

- 作业2涉及Triton核函数和并行训练；推荐《How to Scale Your Model》理解roofline与Transformer计算。
- 大预算只够一次训练时，先建立从计算预算到超参数的配方，再用小实验拟合、外推目标规模损失。

关键词：Transformer · Triton · Roofline

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=2880s)｜超参数迁移与计算最优

- 可预测性与最优性同样重要；缩放配方需说明学习率、批量等如何随规模变化，不能每个规模随意重调。
- Chinchilla约20 token/参数仅是粗略经验，受数据和架构影响；考虑推理成本后常选择更小模型训练更多token。

## 00:52:00–01:04:00｜评测、数据与对齐

先定义模型要做什么，再构建数据管线与反馈驱动的后训练。

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=3120s)｜缩放实验与评测目的

- 作业3用缓存训练结果模拟有限预算决策，练习选实验、拟合缩放关系并预测更大模型表现。
- 内部评测重视跨规模平滑性和相对排序，困惑度有用；外部评测需反映真实用途，二者服务不同目标。

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=3360s)｜数据管线与训练阶段

- 评测应覆盖多种能力并防止污染；单一平均分可能掩盖差异，非互联网评测数据有助减少泄漏。
- 数据需采集、格式转换、过滤、去重与配比；预训练、中期高质量/长上下文训练、后训练需要不同数据。

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=3600s)｜对齐流程与系统代价

- 弱监督在评价比生成容易时有用：模型生成回答、获得人类或验证器评分，再通过RL或偏好优化更新。
- 规模化RL要协调推理、训练与环境执行；吞吐和策略新鲜度存在权衡，滞后rollout会引入off-policy问题。

## 01:04:00–01:19:22｜分词设计到BPE实现

比较分词粒度，逐步走通BPE训练、编码和性能优化。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=3840s)｜可逆分词与压缩率

- Tokenizer需完成字符串到整数序列再还原的往返；空格、数字切分会改变token边界及模型可见的结构。
- 压缩率定义为UTF-8字节数/token数，示例20/8=2.5；更短序列降低注意力成本，但增大词表也有代价。

关键词：Tokenizer

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=4080s)｜字符、字节、词分词的局限

- 字符级词表利用率低且稀有字符多；字节级只需256项、覆盖完整，但序列较长、压缩率为1。
- 按词切分语义直观且压缩较好，却遇到庞大词表和未登录词；UNK会丢信息并干扰困惑度比较。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=4320s)｜BPE训练与编码

- BPE从字节开始，反复合并最频繁相邻token对；示例先合并th，再扩展常见片段，序列缩短而词表增大。
- 常见片段用单token，罕见片段拆回小单位避免UNK；新文本按训练得到的合并顺序编码，再还原原字符串。

关键词：BPE

### [01:16:00–01:19:22](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=4560s)｜BPE实现提速与后续方向

- 教学实现遍历所有merge因此很慢；实际应索引有效合并，并处理预分词与特殊token，必要时用更快语言。
- 无分词替代方案仍需形成更高层抽象与自适应计算；本讲结束后转入资源核算，再深入现代架构。

关键词：BPE

## 复习问题

1. 为什么小模型上优化注意力，未必在大模型上得到同样收益？
2. 内部困惑度评测与外部任务评测分别回答什么问题？
3. 从256个字节出发手算两轮BPE合并，并解释如何保证解码可逆。

## 易错点

- 把缩放规律当作自动成立的自然定律，忽略超参数配方和外推验证。
- 把Chinchilla的20倍关系当作所有数据、架构和部署场景的硬规则。
- 仅观看讲座或让AI代写作业，跳过实际实现与测试。

## 核验说明

基于Young-Lord公开ASR镜像逐4分钟窗整理，并用官方可执行讲义校正术语；未直接验证音频。首讲关于后续作业的说明属于当时计划。

[官方视频](https://www.youtube.com/watch?v=JuoVZkPBiKk&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/01-JuoVZkPBiKk.en-orig.vtt) · [官方可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_01) · [官方讲义源码](https://github.com/stanford-cs336/lectures/blob/main/lecture_01.py)
