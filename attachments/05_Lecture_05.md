# L05｜GPU、TPU与高效核函数的硬件基础

Spring 2026 · 01:18:39 · 20 个时间窗

[官方视频](https://www.youtube.com/watch?v=izZba4UA7iY&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/05-izZba4UA7iY.en-orig.vtt) · [官方课件PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_05.pdf) · [低精度格式校正：NVIDIA Transformer Engine](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/examples/fp8_primer.html)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

建立GPU/TPU和分层存储的心智模型，解释融合、重算、量化、合并访问和分块如何合成FlashAttention。

## 核心收获

- 让Tensor Core忙起来只是半个问题，必须以足够低的数据搬运成本供给它。
- 矩阵形状、地址对齐、tile数量和SM数量会共同造成非单调性能变化。
- FlashAttention把精确运算重新组织在存储层级上；它靠在线softmax、融合及重算节省HBM访问。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:16:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=0s) | 并行计算与存储层级 | 比较CPU和GPU设计，再建立线程、warp、block与SM关系。 |
| [00:16:00–00:32:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=960s) | TPU对照与矩阵乘的地位 | 说明不同加速器共享的硬件思路，以及算力领先带宽造成的瓶颈。 |
| [00:32:00–00:48:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=1920s) | 控制流与低精度 | 分析warp分歧和混合/分块量化的收益与隐藏成本。 |
| [00:48:00–01:04:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=2880s) | 融合、重算、合并访问和分块 | 逐项减少全局内存流量，并复用有限的快存储。 |
| [01:04:00–01:12:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=3840s) | 解开矩阵性能曲线 | 用对齐、padding和wave quantization解释增加维度反而更慢或更快。 |
| [01:12:00–01:18:39](https://www.youtube.com/watch?v=izZba4UA7iY&t=4320s) | 组合成FlashAttention | 在线softmax解除分块障碍，前向融合和反向重算减少存储。 |

## 00:00:00–00:16:00｜并行计算与存储层级

比较CPU和GPU设计，再建立线程、warp、block与SM关系。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=0s)｜为什么架构研究也需懂GPU

- 矩阵稍变形状就可能吞吐骤降，不能仅凭运算数判断快慢；本讲建立硬件模型，再用优化技巧解释曲线。
- 推荐Horace He博客、GPU MODE和《How to Scale Your Model》；最后用FlashAttention串起整讲概念。

关键词：FlashAttention · GPU

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=240s)｜从频率增长到并行扩展

- CPU频率增长受物理限制后，更多并行单元成为扩算力的核心；GPU效率、芯片数和跨卡并行共同推动规模。
- Tensor Core、结构稀疏和低精度进一步提高矩阵吞吐；CPU偏重复杂控制与低延迟，GPU偏重总体吞吐。

关键词：CPU · GPU

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=480s)｜SM与显存层级

- GPU包含许多独立SM，各自含计算单元和近端存储；寄存器、共享内存/L1、L2、HBM速度与容量逐级取舍。
- 标称GPU显存通常指HBM，远慢于近端访问；优化需明确数据当前在哪一层，而非只看总可用GB。

关键词：HBM · SM · GPU

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=720s)｜Thread、Warp与Block

- 同一warp的32线程按SIMT执行，输入可不同；block由多线程组成，并在同一SM执行、共享块内存。
- 共享内存由程序显式管理，L1主要由缓存机制管理；近端存储虽快，却受面积、容量与能耗成本限制。

关键词：SM · Warp · Block

## 00:16:00–00:32:00｜TPU对照与矩阵乘的地位

说明不同加速器共享的硬件思路，以及算力领先带宽造成的瓶颈。

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=960s)｜存储访问与TPU比较

- 线程使用私有寄存器，块内线程可复用共享数据；跨块或主机交换常涉及更慢存储，需要减少往返。
- TPU同样拥有矩阵、向量计算单元和分层内存，控制更专用；芯片组织与多芯片网络是重要差异。

关键词：TPU

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=1200s)｜同名Tensor Core的不同含义

- GPU Tensor Core指矩阵计算单元，TPU TensorCore指更大的处理单元；比较资料时必须先分清术语层级。
- 课堂设备例子中GPU单元更多更小、TPU单元更少更大；相同的分块与数据复用思想仍可迁移。

关键词：GPU · TPU

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=1440s)｜Matmul成为特权操作

- Tensor Core让矩阵乘获得远高于普通算术的吞吐，现代可扩展架构因此倾向把主要计算组织成大matmul。
- 算力增长快于显存与互联带宽，计算单元越来越难被数据喂满；减少数据搬运的重要性随硬件发展上升。

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=1680s)｜不同瓶颈对应不同硬件

- 问答引出prefill/decode分离：前者更重矩阵计算，后者更受带宽影响，可部署到不同资源或服务组件。
- 矩阵吞吐总体遵循roofline：小规模受带宽限制，足够工作量后达计算平台；锯齿波动还需看执行细节。

关键词：Roofline

## 00:32:00–00:48:00｜控制流与低精度

分析warp分歧和混合/分块量化的收益与隐藏成本。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=1920s)｜控制流分歧与减少位宽

- 同warp线程走不同分支时，会分批执行并屏蔽另一部分线程，降低有效并行；统一分支或合适掩码可改善。
- 低精度减少每次读写字节，也提高支持该格式的算术吞吐；FP32逐元素一次读写共8字节，减半位宽则减半搬运。

关键词：FP32 · Warp

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=2160s)｜混合精度与多级缩放

- Tensor Core可低精度乘法、高精度累加；哪些层和操作可降精度需验证，不能把全部中间结果一并粗化。
- FP8在E4M3与E5M2间取舍动态范围和精度；MXFP8让每32元素共享E8M0缩放因子，适应不同局部尺度。

关键词：FP8 · MXFP8

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=2400s)｜分块量化与转置代价

- 按行分块量化后，转置改变元素分组，不能简单复用原缩放；实现可能分别保留原向与转置量化副本。
- 量化/反量化会稀释理论加速；补充校正：此处所述16元素、E4M3块缩放对应NVFP4，详见所附NVIDIA文档。

关键词：FP4 · NVFP4

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=2640s)｜量化并非免费与融合入口

- 量化收益需合并算术提速、带宽节省及转换开销判断；缩放可由当前或历史统计量决定，并不总靠梯度学习。
- 算子融合把连续计算留在同一核函数中，像原料只进一次工厂、成品只出一次，避免中间结果多次搬运。

## 00:48:00–01:04:00｜融合、重算、合并访问和分块

逐项减少全局内存流量，并复用有限的快存储。

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=2880s)｜融合与重算的动机

- sin²x+cos²x的朴素计算会启动多个kernel；编译器可融合简单逐元素图，减少全局显存读写和启动次数。
- 反向传播通常保存中间激活；若计算便宜、存储昂贵，可以丢弃部分激活，反传时再从保留输入重算。

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=3120s)｜重算节省读写与合并访问

- 三层sigmoid示例通过重算将所需显存读写从8次降到5次；收益取决于把重算留在快存储内的实现。
- DRAM按连续块传输，warp线程访问相邻地址可合并为更少事务；只用到每块少数元素会浪费有效带宽。

关键词：Warp

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=3360s)｜行列布局与分块复用

- 行优先矩阵中，让同warp线程读取相邻列更易合并；跨行跳跃读取可能触发许多分散的内存事务。
- Tiling把输入和输出分成子矩阵，先载入共享内存再重复使用；一次昂贵全局读取换来多次近端计算。

关键词：Warp

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=3600s)｜Tile大小并非越大越好

- 朴素N×N乘法中元素可能从全局读N次，T宽tile可降至约N/T次；tile大小仍受共享内存容量约束。
- 矩阵维度无法整除tile会产生大量空槽；库会用分块，max-autotune等仍可为特定形状搜索更合适配置。

## 01:04:00–01:12:00｜解开矩阵性能曲线

用对齐、padding和wave quantization解释增加维度反而更慢或更快。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=3840s)｜Padding与对齐解释提速

- 维度增加一位可能打乱行首与内存块对齐，使读同一tile需要更多事务；适量padding反而可能更快。
- 吞吐曲线按可整除程度分层，来自数据对齐与tile利用率；16或32倍数是特定实现经验，不是神奇常数。

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=4080s)｜Wave quantization的骤降

- 示例256×128 tile下，边长1792需98块，1793需120块；108 SM设备从一轮变两轮，最后一轮多数SM空闲。
- 这解释增加很少工作却大幅变慢；优化应一起考虑合并访问、tile复用、融合，以及量化和重算。

关键词：SM

## 01:12:00–01:18:39｜组合成FlashAttention

在线softmax解除分块障碍，前向融合和反向重算减少存储。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=izZba4UA7iY&t=4320s)｜FlashAttention与在线Softmax

- FlashAttention将QKᵀ、softmax和乘V融合、分块，减少HBM流量；难点是softmax分母跨整行依赖。
- 在线softmax维护当前最大值与指数和；遇更大最大值时重缩放旧累积，使逐块计算保持数值稳定和正确归一化。

关键词：FlashAttention · HBM · Softmax

### [01:16:00–01:18:39](https://www.youtube.com/watch?v=izZba4UA7iY&t=4560s)｜融合、重算完成精确注意力

- 逐块计算分数和指数，累计归一化信息与加权V输出，避免把完整N×N分数或概率矩阵写到HBM。
- 反向再逐块重算必要中间量；FlashAttention节省存储与搬运，仍是精确attention，不能理解成减少二次算术项。

关键词：FlashAttention · HBM

## 复习问题

1. 一个block、warp、SM分别是什么，哪一级可直接共享块内存？
2. 为什么将矩阵维度从1792改成1793会触发额外执行波次？
3. 在线softmax遇到更大的最大值后，为什么必须重缩放已累积的分母和输出？

## 易错点

- 把SIMT理解成整张GPU所有线程必须同一时刻执行同一指令，或把shared memory等同自动缓存。
- 认为用低位宽就必得2倍提速，忽略缩放、量化、转置副本与稳定性成本。
- 混淆MXFP4与NVFP4；也不要把特定GPU上的32倍数经验直接套到全部设备。

## 核验说明

基于Young-Lord公开ASR镜像逐窗整理，官方PDF校核，未直接验证音频。字幕/课件存在A100 SM数、FP4格式名及成熟度表述不一致；不重复未核实产业事件。16元素/E4M3块缩放按NVIDIA官方资料标为NVFP4，并明确为补充校正。

[官方视频](https://www.youtube.com/watch?v=izZba4UA7iY&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/05-izZba4UA7iY.en-orig.vtt) · [官方课件PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_05.pdf) · [低精度格式校正：NVIDIA Transformer Engine](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/examples/fp8_primer.html)
