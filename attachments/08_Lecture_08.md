# L08｜大规模并行：ZeRO、流水线、张量与专家并行

Spring 2026 · 01:20:11 · 21 个时间窗

[官方视频](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/08-6-cXp-aOmdg.en-orig.vtt) · [官方PDF（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_08.pdf)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

围绕显存、batch预算与互连带宽，推导ZeRO/FSDP及多种模型并行的成本，再用公开训练配置解释如何组合。

## 核心收获

- ZeRO按优化器状态、梯度、参数逐步分片；额外通信是否影响吞吐取决于粒度与重叠。
- PP消耗micro-batch以减少气泡，TP/EP消耗快互连以缩小模型与激活。
- SP、CP并非同一概念；配置必须区分模型结构、训练阶段和实际硬件。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:12:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=0s) | 硬件拓扑与分布式目标 | 区分规则网格与交换网络，认识计算、内存、带宽和功耗的系统取舍。 |
| [00:12:00–00:32:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=720s) | DDP与ZeRO三级分片 | 逐步降低模型状态复制，再辨认batch与激活带来的剩余瓶颈。 |
| [00:32:00–00:44:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=1920s) | 流水线与张量并行 | 从按深度和宽度切模型推导气泡、依赖和通信成本。 |
| [00:44:00–01:04:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=2640s) | 激活显存、SP与EP | 处理TP未覆盖的显存，以及MoE动态路由与注意力分组之间的冲突。 |
| [01:04:00–01:12:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=3840s) | 成本模型与多维组合 | 以计算/通信比选择并行度，结合规模实验说明经验规则的条件。 |
| [01:12:00–01:20:11](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=4320s) | 公开训练案例与课程衔接 | 对比密集、MoE和长上下文训练配置，区分实际报告与推荐配置。 |

## 00:00:00–00:12:00｜硬件拓扑与分布式目标

区分规则网格与交换网络，认识计算、内存、带宽和功耗的系统取舍。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=0s)｜多维并行的目标

- 单卡算力与显存分别构成扩展上限；多机训练须同时控制计算量、状态存储与网络通信。
- 本讲按collective核算算法成本，特别利用all-reduce与reduce-scatter加all-gather的等价关系。

关键词：并行

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=240s)｜TPU网格与GPU交换网络

- 传统TPU环面网格邻居数稳定，适合规则通信；GPU树状交换网络更灵活，但大规模互连更复杂。
- 规则密集模型切分与MoE动态路由偏好不同拓扑；讲者以新公布TPU网络变化说明硬件也随负载演进。

关键词：拓扑

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=480s)｜互连能力不是免费资源

- 课堂用大规模光互连系统说明：可用更多互连和功耗弥补单芯片不足，但要付出系统能耗成本。
- 计算单元应从单张GPU提升到整个数据中心看待；接下来区分按数据分配与按模型结构切分。

关键词：系统权衡

## 00:12:00–00:32:00｜DDP与ZeRO三级分片

逐步降低模型状态复制，再辨认batch与激活带来的剩余瓶颈。

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=720s)｜朴素DDP与显存账本

- DDP把batch B分给M台机器，每卡计算B/M样本；每步梯度all-reduce通信量约2倍参数规模。
- 混合精度Adam除参数、梯度外，还有FP32主权重与一二阶矩；课件典型合计16字节/参数。

关键词：DDP

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=960s)｜ZeRO-1与ZeRO-2

- ZeRO-1将优化器状态分片：reduce-scatter梯度、局部更新、all-gather新参数，通信量仍约2P。
- ZeRO-2进一步按层产生并立即分发梯度，释放不再需要的缓冲，避免同时保存完整梯度向量。

关键词：ZeRO

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=1200s)｜ZeRO-3按需恢复参数

- FSDP/ZeRO-3把参数也分片：前向前all-gather权重，用后释放；反向再取回并reduce-scatter梯度。
- 每步约两次参数all-gather加一次梯度reduce-scatter；分层预取使后续参数通信可与当前层计算重叠。

关键词：FSDP

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=1440s)｜何时可隐藏通信成本

- ZeRO-1/2在带宽主导近似下与DDP通信量相当；ZeRO-3约为1.5倍，低额外耗时依赖成功重叠。
- FSDP各卡仍执行完整模型、处理不同数据；它按需借来参数，与一张卡只算若干层的流水线不同。

关键词：通信重叠

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=1680s)｜临界batch与激活瓶颈

- 数据并行消耗全局batch预算；超过临界batch后，更多样本并入同一步不再等价于增加有效更新。
- ZeRO-3缩小模型状态，却未自动分片激活；模型并行转而交换激活，进一步处理显存与batch限制。

关键词：临界batch

## 00:32:00–00:44:00｜流水线与张量并行

从按深度和宽度切模型推导气泡、依赖和通信成本。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=1920s)｜流水线气泡与慢网络

- 直接按层串行分卡时，多数GPU等前后依赖而空闲；micro-batch流水线能让不同阶段同时工作。
- 理想均衡调度中气泡/有效计算约(n_stages−1)/n_micro；通信主要是相邻阶段BSH大小激活。

关键词：流水线

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=2160s)｜零气泡流水线的关键

- 交错安排前向、反向可降低空闲；更关键是把反向拆为输入梯度传播和权重梯度计算。
- 前者决定上游阶段何时开工，优先执行；后者可延迟到空档填充，收益依赖工作量与调度条件。

关键词：zero-bubble

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=2400s)｜Transformer中的张量并行

- 上投影与QKV按列切，下投影与注意力输出按行切；两层MLP可局部计算后all-reduce部分和。
- 前向中的复制与求和，在反向有对应的求和与恒等关系；高频collective要求低延迟高带宽互连。

关键词：张量并行

## 00:44:00–01:04:00｜激活显存、SP与EP

处理TP未覆盖的显存，以及MoE动态路由与注意力分组之间的冲突。

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=2640s)｜动态显存与激活估算

- TP没有固有流水线气泡，但每层频繁交换激活；峰值显存还取决于反向初期梯度与未释放激活叠加。
- 课件基线每层激活约SBH(34+5AS/H)字节；平方注意力项可通过重计算避免长期保存。

关键词：激活显存

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=2880s)｜Sequence parallel补齐分片

- TP仅缩小MLP和注意力部分，LayerNorm、dropout及残差输入仍留下约10SBH未分片项。
- SP沿序列维切这些逐token操作，按需gather/scatter；配合选择性重计算，课件估算降至34SBH/T。

关键词：sequence parallel

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=3120s)｜专家并行为什么常优于切矩阵

- 也可重算MLP进一步节省显存，但相比重算注意力代价更高；课堂公式不是所有实现的绝对下界。
- EP把完整专家放到不同设备，再路由token；较TP反复切小矩阵，能保留较大matmul和稀疏通信优势。

关键词：专家并行

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=3360s)｜专家路由的系统难点

- MoE每层all-to-all派发必须低延迟，否则专家等待token；DeepEP、HybridEP处理底层路由与传输优化。
- EP与DP分组可能互相约束；MoE只替换MLP，注意力仍需其他并行方式，不能直接套同一切分参数。

关键词：DeepEP

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=3600s)｜分开配置注意力和MoE

- 注意力可能需要高TP，而专家MLP叠加高TP会把矩阵切得太小；新系统分别配置两部分并行度。
- context parallel/Ring Attention切分长序列并交换所需块；与为逐token操作省显存的SP区别明确。

关键词：context parallel

## 01:04:00–01:12:00｜成本模型与多维组合

以计算/通信比选择并行度，结合规模实验说明经验规则的条件。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=3840s)｜选择并行组合的方法

- 逐层估算计算时间与通信时间；局部batch下降时FSDP可能转为通信受限，可加入模型并行拓展范围。
- 先用快互连上的TP/EP及跨机PP或ZeRO-3让模型装下，再尽量扩大DP；长序列额外考虑CP。

关键词：4D并行

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=4080s)｜规模实验与重计算收益

- Megatron实验展示：先增加TP到快速域范围，再增加PP容纳模型，剩余设备给DP，可维持较平稳利用率。
- 示例中TP=8对应当时8卡节点，不是所有硬件的定律；重计算释放显存后能容纳更大batch。

关键词：扩展实验

## 01:12:00–01:20:11｜公开训练案例与课程衔接

对比密集、MoE和长上下文训练配置，区分实际报告与推荐配置。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=4320s)｜公开模型训练配置案例

- OLMo 7B使用FSDP；DeepSeek-V3将EP扩到64路，并借助通信重叠支持跨多个节点的专家域。
- Llama 3 405B常规阶段TP/PP/DP组合训练，长上下文扩展时提高CP并降低DP，说明策略随阶段变化。

关键词：训练案例

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=4560s)｜案例边界与整体规律

- Gemma 2展示TPU上FSDP加TP/SP方案；Mixtral、Qwen等部分数字来自Megatron推荐配置，非原始训练证明。
- 总体尽量扩大DP，TP留在快互连域，EP可借专门优化扩大；真实大集群还需应对设备故障与恢复。

关键词：案例

### [01:20:00–01:20:11](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=4800s)｜下节预告

- 结尾预告进入scaling laws，衔接计算预算、模型规模与数据规模之间的定量关系。
- 本窗仅有简短下节预告，没有新的并行算法推导；复习可回看前述资源约束和组合原则。

关键词：预告

## 复习问题

1. ZeRO-1为何可把优化器状态分片却不增加近似通信字节数？ZeRO-3多出哪次通信？
2. 零气泡流水线为何可延后权重梯度计算，却不能同样延后输入梯度传播？
3. 给定8卡快互连节点、长序列MoE，你会分别怎样考虑TP、EP、SP、CP和PP？

## 易错点

- “免费”仅指特定带宽成本或充分重叠，不代表额外collective没有启动延迟。
- ZeRO-1/2仍节省状态显存；它们没有做到所有模型状态随设备数线性缩小，不能说完全不省内存。
- 34SBH/T源于课件指定结构、精度和重计算假设，不是所有Transformer必需显存下界。
- 课程案例中的推荐框架配置，不应写成模型开发方公开的真实原始训练参数。

## 核验说明

逐窗读取Young-Lord镜像ASR，以官方lecture_08.pdf校正ZeRO阶段、DeepEP、SP公式等。字幕在28–32分钟将ZeRO阶段说混，摘要按课件区分；硬件新闻仅作为课堂当时举例，未另行验证现行规格。末窗仅11秒课程预告。

[官方视频](https://www.youtube.com/watch?v=6-cXp-aOmdg&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/08-6-cXp-aOmdg.en-orig.vtt) · [官方PDF（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_08.pdf)
