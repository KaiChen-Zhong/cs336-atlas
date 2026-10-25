# L10｜推理优化：KV缓存、量化、投机解码与动态服务

Spring 2026 · 01:25:30 · 22 个时间窗

[官方视频](https://www.youtube.com/watch?v=EfM546A79aM&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/10-EfM546A79aM.en-orig.vtt) · [官方交互讲义](https://cs336.stanford.edu/lectures/?trace=lecture_10) · [官方代码讲义（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_10.py) · [课堂使用的推理分析章节](https://jax-ml.github.io/scaling-book/inference/)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

从算术强度解释prefill与decode的不同瓶颈，建立延迟/吞吐模型，再分别整理模型压缩、无损投机和服务调度。

## 核心收获

- decode的历史KV读取缺少跨请求复用，单纯加batch无法消除注意力的带宽瓶颈。
- batch、KV大小、模型权重与带宽共同影响延迟和吞吐；提升一个指标未必提升另一个。
- 有损压缩需验质量；精确投机采样靠接受/残差规则保分布，分页与连续batch提升动态服务效率。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:16:00](https://www.youtube.com/watch?v=EfM546A79aM&t=0s) | 推理任务、指标与张量记号 | 区分首token、单请求延迟和总吞吐，建立FLOPs与字节核算方式。 |
| [00:16:00–00:36:00](https://www.youtube.com/watch?v=EfM546A79aM&t=960s) | KV缓存与两阶段算术强度 | 说明缓存为何成立，以及prefill和decode在MLP、注意力上的复用差别。 |
| [00:36:00–00:52:00](https://www.youtube.com/watch?v=EfM546A79aM&t=2160s) | 延迟吞吐模型与GQA | 用Llama示例推导batch取舍，再看减少KV头如何改善成本。 |
| [00:52:00–01:04:00](https://www.youtube.com/watch?v=EfM546A79aM&t=3120s) | MLA、共享、局部与稀疏注意力 | 沿维度、层和时间位置压缩KV，保留各机制的质量边界。 |
| [01:04:00–01:16:00](https://www.youtube.com/watch?v=EfM546A79aM&t=3840s) | 量化、剪枝与精确投机 | 区分直接压缩模型与用便宜草稿加正确性验证的两条路径。 |
| [01:16:00–01:25:30](https://www.youtube.com/watch?v=EfM546A79aM&t=4560s) | 动态批处理与分页服务 | 为不同到达时间、长度和共享前缀的请求管理计算与KV内存。 |

## 00:00:00–00:16:00｜推理任务、指标与张量记号

区分首token、单请求延迟和总吞吐，建立FLOPs与字节核算方式。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=EfM546A79aM&t=0s)｜推理成为持续成本

- 推理用于聊天、代码、agent、生成式评估及RL rollout；训练完成后仍会持续产生服务计算成本。
- agent大量token用于内部推理和工具流程，推理速度价值不再只受人类阅读速度限制。

关键词：推理

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=EfM546A79aM&t=240s)｜快的三种含义

- TTFT衡量等待首token时间，单请求每token延迟衡量流式速度，吞吐衡量多请求总token产出。
- 训练已知全部序列，可并行处理位置；自回归生成必须等前一token，因而更难充分利用GPU计算。

关键词：性能指标

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=EfM546A79aM&t=480s)｜读懂张量形状记号

- B、T、D、H分别表示batch、序列、模型和头维度；收缩维出现在两输入并消失，batch维保留。
- 用Transformer计算图追踪QKV、注意力和MLP的张量形状，为逐项核算FLOPs与搬运字节做准备。

关键词：张量形状

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=EfM546A79aM&t=720s)｜矩阵乘法的计算与IO

- GQA有N个query头、K个KV头，D=NH；prefill同时处理多个位置，decode每次新输出位置T=1。
- BF16下(B×D)(D×F)需2BDF FLOPs，读写约2(BD+DF+BF)字节，算术强度由两者比值得到。

关键词：算术强度

## 00:16:00–00:36:00｜KV缓存与两阶段算术强度

说明缓存为何成立，以及prefill和decode在MLP、注意力上的复用差别。

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=EfM546A79aM&t=960s)｜单token为什么吃带宽

- 当B远小于D、F，矩阵乘法算术强度近似B；B=1时像矩阵向量乘，读大量权重只完成少量复用。
- 课件H100 BF16峰值/带宽比约295 FLOPs/byte；这是理想roofline阈值，不是实测吞吐保证。

关键词：roofline

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=EfM546A79aM&t=1200s)｜KV cache消除前缀重算

- 朴素生成每步重跑全部历史，注意力累计可达O(T³)；因果模型的旧位置激活不会被未来token改变。
- prefill先构建各层K/V，decode只计算新token的K/V并复用历史缓存，避免反复编码同一前缀。

关键词：KV cache

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=EfM546A79aM&t=1440s)｜Prefill与Decode的MLP强度

- KV cache按请求、位置、层及KV头存向量；prefill可并行算整段prompt，decode逐token追加缓存。
- MLP主项FLOPs约6BTDF；当BT远小于D、F时强度≈BT，prefill可利用序列长度增加权重复用。

关键词：prefill

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=EfM546A79aM&t=1680s)｜注意力Decode的低强度

- 本讲MHA/FlashAttention简化核算得注意力强度ST/(S+T)；prefill取T=S得到S/2。
- decode取T=1后强度S/(S+1)<1；增大batch不能像MLP那样直接改善这部分的算术强度。

关键词：decode

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=EfM546A79aM&t=1920s)｜为何batch救不了缓存读取

- MLP各请求共享同一组权重，批量能摊薄读权重成本；不同请求的KV缓存独立，batch增加也同步增加IO。
- 因此prefill通常更偏计算受限，decode更偏内存带宽受限；后续延迟估算从读多少字节出发。

关键词：带宽瓶颈

## 00:36:00–00:52:00｜延迟吞吐模型与GQA

用Llama示例推导batch取舍，再看减少KV头如何改善成本。

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=EfM546A79aM&t=2160s)｜Llama 2 13B内存模型

- BF16参数存储约2P字节；每序列KV约4SKHL字节，其中2份来自K/V，另2来自每元素字节数。
- 理想带宽受限模型用t≈(2P+4BSKHL)/BW估算每步延迟，吞吐≈B/t，忽略额外调度及kernel成本。

关键词：成本模型

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=EfM546A79aM&t=2400s)｜batch的吞吐与延迟取舍

- 增大B能摊薄读取权重的固定成本，但每步需处理更多KV；吞吐上升、单请求每token等待也可能上升。
- 吞吐随B趋于上限，且往往先碰显存容量；课堂B=256示例超出80GB H100，不能无限扩大batch。

关键词：batch

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=EfM546A79aM&t=2640s)｜TTFT与缩小缓存入口

- 首token时间主要受prefill影响，实际还含排队和调度；增加模型副本可扩总吞吐，但不自动降单请求延迟。
- GQA维持query头数却减少KV头；MHA为K=N、MQA为K=1，中间方案在缓存与质量间取舍。

关键词：GQA

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=EfM546A79aM&t=2880s)｜GQA的双重收益

- GQA将KV缓存缩小为原来的K/N；固定batch下可同时改善延迟和吞吐，释放显存还可换更大batch。
- 减KV头属于模型改变，准确率是否保持需看具体实验；不同论文结论不应外推为所有模型都无损。

关键词：GQA

## 00:52:00–01:04:00｜MLA、共享、局部与稀疏注意力

沿维度、层和时间位置压缩KV，保留各机制的质量边界。

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=EfM546A79aM&t=3120s)｜MLA与跨层共享

- MLA把K/V压到低维潜向量缓存，按需映射到注意力计算；DeepSeek-V2例子另留位置编码相关维度。
- CLA则在若干层间共享KV，与GQA跨头共享不同；两者都需评估缓存节省对模型表达能力的影响。

关键词：MLA

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=EfM546A79aM&t=3360s)｜局部注意力与混合层

- 滑窗注意力只保留最近窗口的KV，局部层缓存不随全序列增长；多层传播可扩展有效感受范围。
- 纯局部机制会损失远距离信息，常与全局层交错；后者仍需其全局缓存，整体不能宣称完全定长。

关键词：滑窗

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=EfM546A79aM&t=3600s)｜压缩历史与稀疏选取

- 线性注意力或状态空间模型把历史压成状态，适合概括但可能丢细粒度检索信息，不能保证长上下文无损。
- 课堂另展示按块压缩token、轻量索引选重要位置等稀疏策略；核心仍是少读取历史且尽量保留质量。

关键词：稀疏注意力

## 01:04:00–01:16:00｜量化、剪枝与精确投机

区分直接压缩模型与用便宜草稿加正确性验证的两条路径。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=EfM546A79aM&t=3840s)｜量化：训练前考虑或事后处理

- QAT在前向模拟量化误差让权重适应低精度；PTQ在训练后标定量化，成本更低但需控制精度损失。
- GPTQ借二阶信息补偿逐层量化误差；AWQ部分强调按激活识别敏感通道，保护其有效精度。

关键词：量化

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=EfM546A79aM&t=4080s)｜剪枝与蒸馏修复

- 先用校准集估计层、头或隐藏维的重要性，剪成较小网络，再通过继续训练或蒸馏恢复能力。
- 激活大只是经验重要性信号；恒定高值可能还需看方差与作用，不能机械地把幅值等同真实贡献。

关键词：剪枝

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=EfM546A79aM&t=4320s)｜投机解码保留目标分布

- 小draft模型p先生成多个token，大target模型q并行验证，利用“核对一段”比逐token生成更易并行的差异。
- 依次以min(1,q/p)接受；首次拒绝时从归一化max(q−p,0)采样并停止该草稿，保证正确目标分布。

关键词：speculative decoding

## 01:16:00–01:25:30｜动态批处理与分页服务

为不同到达时间、长度和共享前缀的请求管理计算与KV内存。

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=EfM546A79aM&t=4560s)｜草稿质量与连续batch

- 草稿太短不能摊薄验证，太长拒绝浪费增大；蒸馏可提高draft与target的一致性，最优长度依负载而变。
- continuous batching每步移走完成请求、补入新请求；非注意力运算可拼接不同长度token统一计算。

关键词：continuous batching

### [01:20:00–01:24:00](https://www.youtube.com/watch?v=EfM546A79aM&t=4800s)｜PagedAttention与前缀共享

- 按最大长度预留连续KV会浪费容量且形成碎片；分页把逻辑连续序列映射到物理不连续的固定块。
- 相同前缀可共享缓存块，分支生成修改共享块时采用copy-on-write，支持系统prompt及多样本复用。

关键词：PagedAttention

### [01:24:00–01:25:30](https://www.youtube.com/watch?v=EfM546A79aM&t=5040s)｜架构与服务系统协同

- 量化、架构压缩、剪枝和投机采样处理模型计算；分页与动态调度处理实时请求的长度和到达差异。
- 结尾指出更适合推理的新架构仍有空间，但任何压缩历史方案都须以任务质量和实际速度共同检验。

关键词：总结

## 复习问题

1. 为什么MLP强度随batch增长，而普通MHA decode注意力的简化强度不随batch增长？
2. 给定P、B、S、K、H、L和带宽，如何估算KV大小与理想每步延迟？哪些成本被忽略？
3. 投机采样拒绝后为何不能随便从q重新采样？PagedAttention的共享何时需要写时复制？

## 易错点

- prefill计算受限、decode带宽受限是典型条件下的判断，不涵盖全部batch、量化、GQA及并行配置。
- 缩小KV通常降低延迟；课件个别“higher latency”或固定batch GQA变慢是文字方向错误。
- AWQ课堂图示是保护重要权重的动机简化，不应据此认定标准AWQ必须保留一部分FP16权重。
- 投机解码的无损指目标采样分布一致，不指每次输出字符串或所有浮点路径完全相同。

## 核验说明

逐窗依据Young-Lord镜像ASR，并核对官方lecture_10.py。校正GQA组记号、投机接受率、延迟增减方向；开头ASR把DeepSeek v4误为GPT-4，摘要不沿用该数字比较。MLA、AWQ等仅保留讲授层级，未声称覆盖完整工程实现。

[官方视频](https://www.youtube.com/watch?v=EfM546A79aM&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/10-EfM546A79aM.en-orig.vtt) · [官方交互讲义](https://cs336.stanford.edu/lectures/?trace=lecture_10) · [官方代码讲义（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_10.py) · [课堂使用的推理分析章节](https://jax-ml.github.io/scaling-book/inference/)
