# L04｜高效注意力替代方案与混合专家

Spring 2026 · 01:26:21 · 22 个时间窗

[官方视频](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/04-cKSwj_qZ8Jg.en-orig.vtt) · [官方课件PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_04.pdf)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

从线性注意力的结合律与递归状态推导混合长上下文架构，再拆解MoE路由、训练均衡和系统实现。

## 核心收获

- 精确重排不改变注意力，去掉softmax或压缩有限状态会改变表达能力，必须区分。
- MoE把总容量与每token计算分离；显存、通信、均衡和数值稳定仍是实际成本。
- 主流稀疏路由靠简单top-k与配套约束训练，不意味着离散选择本身变成可微。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=0s) | 高效注意力与递归状态 | 从结合律推导线性注意力，再用遗忘、写入和擦除形成Mamba与DeltaNet式状态更新。 |
| [00:20:00–00:36:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=1200s) | 混合性能与稀疏注意力 | 比较有限状态与选择性读取历史的两条路线，并说明其质量边界。 |
| [00:36:00–00:48:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=2160s) | MoE价值与设计选择 | 解释激活参数、专家并行以及MoE的工程成本。 |
| [00:48:00–01:04:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=2880s) | 路由器、专家粒度与学习 | 梳理top-k、共享专家与随机探索方法，导出负载失衡问题。 |
| [01:04:00–01:20:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=3840s) | 负载均衡与系统稳定性 | 说明辅助损失、设备平衡、通信压缩及微调风险。 |
| [01:20:00–01:26:21](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=4800s) | Upcycling与DeepSeek实例 | 通过系列模型演进串起专家设计、MLA与MTP。 |

## 00:00:00–00:20:00｜高效注意力与递归状态

从结合律推导线性注意力，再用遗忘、写入和擦除形成Mamba与DeltaNet式状态更新。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=0s)｜长上下文为何迫使架构改变

- 序列增长时FFN成本线性、全注意力成本二次，后者逐渐成为主因；本讲分别修改attention与MLP两大组件。
- 局部/全局混合降低昂贵层比例，FlashAttention优化数据搬运；渐近复杂度之外，常数因子同样重要。

关键词：MLP · FFN · FlashAttention

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=240s)｜去掉Softmax后利用结合律

- FlashAttention仍计算精确二次注意力，只是不显式存巨大矩阵；百万级上下文促使研究更彻底的结构变化。
- 若先移除softmax，可将(QKᵀ)V改写为Q(KᵀV)，成本从含N²转向O(Nd_kd_v)，但这已改变模型。

关键词：FlashAttention · Softmax

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=480s)｜线性注意力的递归形式

- 因果线性注意力可写S_t=S_{t−1}+k_tv_tᵀ，y_t=q_tᵀS_t；推理携带固定大小状态，不保存所有历史KV。
- 训练可用并行形式、推理用递归形式；MiniMax M1以7个线性层配1个全注意力层，整体仍保留二次部分。

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=720s)｜从线性状态到Mamba-2

- Mamba-2示意更新为S_t=γ_tS_{t−1}+k_tv_tᵀ；输入决定遗忘门，控制历史状态保留多少。
- γ_t只依赖当前输入，保持可并行计算的结构；输出另有类似残差的当前值通路，Nemotron将其与全注意力混合。

关键词：Mamba

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=960s)｜Gated DeltaNet的写入与擦除

- 在遗忘门外加入β_t写入门；β_t为零可停止新信息进入，类似LSTM对保留和写入分别控制。
- 更新中的(I−β_tk_tk_tᵀ)先削弱当前key方向旧信息再写入新值；与快权重、测试时学习的更新有关。

关键词：DeltaNet

## 00:20:00–00:36:00｜混合性能与稀疏注意力

比较有限状态与选择性读取历史的两条路线，并说明其质量边界。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=1200s)｜混合比例与表达能力损失

- 所示消融中少量替换全注意力可能几乎不掉分，但越接近纯递归，长上下文QA等能力损失越明显。
- 并行与递归两种线性形式可等价；从softmax注意力改成线性注意力不等价，质量取舍发生在这一步。

关键词：Softmax

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=1440s)｜DSA：先筛token再注意

- DeepSeek Sparse Attention用轻量indexer打分、选top-k位置，再对候选做较昂贵注意力；可在长上下文扩展阶段加入。
- Indexer仍检查全体位置，未消除其二次复杂度；低维与低精度降低常数，候选数控制主要attention成本。

关键词：DSA

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=1680s)｜部署稀疏注意力的边界

- 常见流程是短上下文预训练、长上下文扩展、再后训练；把稀疏注意力适配放在扩展阶段可复用既有模型。
- 低精度筛选与较高精度值聚合可分工；未来可能组合多种注意力技巧及检索、压缩等上下文管理方法。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=1920s)｜有限状态限制与MoE入口

- 固定大小状态须压缩任意长历史，容易丢失全连接attention可直接访问的信息；高效训练不自动消除表达限制。
- MoE通常替换FFN：准备多个专家，每个token只激活其中少数，以更大总参数量换取接近较小网络的计算。

关键词：MoE · FFN

## 00:36:00–00:48:00｜MoE价值与设计选择

解释激活参数、专家并行以及MoE的工程成本。

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=2160s)｜总参数与激活参数分离

- 若四个同样大的专家中只选一个，FFN总参数增至四倍而该token计算近似不变；存储和通信仍需另算。
- Switch、OLMoE等结果显示相近激活计算下更多专家常改善损失，说明稀疏参数可提供有价值的模型容量。

关键词：MoE · FFN

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=2400s)｜专家并行与稀疏学习难题

- 专家可放到不同设备，激活按路由发送，增加并行轴；收益取决于通信拓扑，跨卡代价不能忽略。
- 训练也只激活top-k专家，无法观察未选专家的反事实输出；路由通常按token、用简单线性打分完成。

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=2640s)｜MoE设计空间与工程成本

- MoE总参数多、路由动态，单卡容纳、并行利用率与数值稳定都更复杂；算术效率收益不等于实现简单。
- 主要设计轴是路由函数、专家粒度与训练目标；本讲聚焦FFN专家，注意力专家化仍较少见。

关键词：MoE · FFN

## 00:48:00–01:04:00｜路由器、专家粒度与学习

梳理top-k、共享专家与随机探索方法，导出负载失衡问题。

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=2880s)｜Token-choice与路由候选

- 常见token-choice让每个token选择top-k专家；expert-choice则由专家选token，需处理每token参与数等变化。
- 可学习线性打分最普遍；哈希路由可作基线，RL也能学习，但额外方差与系统复杂度使其较少采用。

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=3120s)｜Top-k机制与共享专家

- 路由器将输入与专家向量做内积，再按分数挑top-k并加权专家输出；实现中softmax与top-k顺序存在变体。
- 共享专家始终处理所有token，路由专家承担条件计算；DeepSeek还把专家切细，使同等预算拥有更灵活组合。

关键词：Softmax

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=3360s)｜细粒度与共享专家的证据

- DeepSeek消融支持更细专家及共享专家，OLMoE支持细粒度但未发现共享专家明显收益；结论依赖设置。
- 稀疏top-k不可直接对选择索引求普通导数，训练需处理只更新被选路径以及专家利用不均的问题。

关键词：MoE

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=3600s)｜噪声路由与富者愈富

- 早期方法在路由分数中加高斯或乘性噪声，帮助相近专家轮流获得数据；后续模型并不总需要该技巧。
- 常规梯度容易强化已受欢迎专家，使其获得更多token与更新，其他专家饥饿；负载均衡成为核心约束。

## 01:04:00–01:20:00｜负载均衡与系统稳定性

说明辅助损失、设备平衡、通信压缩及微调风险。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=3840s)｜辅助负载损失与设备平衡

- Switch式损失为αNΣ_i f_iP_i，其中f_i是派发比例、P_i是平均路由概率；梯度压低过热门专家概率。
- DeepSeek还按设备聚合负载，照顾硬件利用率；V3用动态专家偏置平衡，但仍保留防极端失衡的辅助约束。

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=4080s)｜均衡消融与专家语义

- OLMoE移除均衡损失后少数专家吞掉几乎所有token，损失恶化；其余参数虽存在，却基本未被训练利用。
- 专家不必对应医学、法律等人工领域；常观察到标点、字符集等路由倾向，不能把名称理解成语义专家。

关键词：MoE

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=4320s)｜结构稀疏与通信压缩

- 专家计算可组织为块稀疏或分组矩阵乘，避免大量低利用率小matmul；还可沿专家维补充数据和模型并行。
- Nemotron示例先将待路由激活下投影，再通信至专家，减少字节量；共享专家可保留较宽表示。

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=4560s)｜Dropless、路由稳定与微调

- 早期固定专家容量会溢出丢token，使同批其他请求影响结果；MegaBlocks等dropless实现解决这类容量问题。
- Router softmax可用FP32与Z-loss稳定；MoE小数据微调易过拟合，可仅调attention/稠密层，或增加数据量。

关键词：MoE · FP32 · Block · Softmax · Z-loss

## 01:20:00–01:26:21｜Upcycling与DeepSeek实例

通过系列模型演进串起专家设计、MLA与MTP。

### [01:20:00–01:24:00](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=4800s)｜Upcycling与DeepSeek演进

- Upcycling复制已训练稠密FFN作为多个专家，随机初始化router后继续训练；路由差异使相同初值逐渐分化。
- DeepSeek系列从细粒度/共享专家，发展到设备与通信约束，再到动态偏置平衡，体现架构与系统共同设计。

关键词：FFN

### [01:24:00–01:26:21](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=5040s)｜MLA、MTP与全讲收束

- MLA缓存低维潜在KV表示来缩小cache；与RoPE结合需分离位置相关维度，本讲只介绍其动机。
- MTP加入未来token预测，可用于构建投机解码候选；MoE核心仍是只付部分计算而利用更多参数，路由需配套约束。

关键词：MoE · RoPE · MLA · MTP

## 复习问题

1. 在线性因果注意力中写出S_t更新，说明它为何不等于原始softmax注意力。
2. 解释αNΣf_iP_i对热门专家概率产生什么梯度作用。
3. 总参数相同或激活参数相同时比较MoE与稠密模型，分别遗漏了哪些系统成本？

## 易错点

- 把含全注意力层的混合模型整体复杂度称为严格线性，或把DSA的indexer称为线性。
- 把MoE稀疏激活理解成无需存储未激活专家，或理解成训练时会计算所有专家。
- 认为共享专家、更多专家或更强均衡必然提高质量；这些均有经验与预算边界。

## 核验说明

基于Young-Lord公开ASR镜像逐窗整理、用官方PDF校正DSA等术语；未直接验证音频。Gated DeltaNet的投影说法仅是直觉，未宣称一般情况下为精确正交投影；MLA和MTP在尾段仅作概览。

[官方视频](https://www.youtube.com/watch?v=cKSwj_qZ8Jg&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/04-cKSwj_qZ8Jg.en-orig.vtt) · [官方课件PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_04.pdf)
