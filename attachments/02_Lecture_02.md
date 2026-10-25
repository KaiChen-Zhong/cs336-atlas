# L02｜PyTorch、张量与资源核算

Spring 2026 · 01:17:25 · 20 个时间窗

[官方视频](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/02-kuYAsz7zspQ.en-orig.vtt) · [官方录制版可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_02_recording) · [官方讲义源码](https://github.com/stanford-cs336/lectures/blob/main/lecture_02.py)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

从张量精度与命名维度出发，推导训练FLOPs、显存账本和计算/带宽瓶颈，再介绍两类显存优化。

## 核心收获

- 6ND来自线性层前向2ND加反向4ND，长上下文等情况需补额外成本。
- 硬件峰值不等于实测吞吐；先看算术强度，再判断该优化算术还是数据搬运。
- 参数之外还有梯度、优化器状态和激活，显存优化要找实际占用来源。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=0s) | 张量、数值精度与设备 | 建立显存核算方式并理解混合精度的效率与稳定性取舍。 |
| [00:20:00–00:28:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=1200s) | 用einops表达张量计算 | 借命名维度完成收缩、归约、拆分与重排。 |
| [00:28:00–00:40:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=1680s) | FLOPs、基准测试与MFU | 把算法运算数、GPU规格和实际运行时间连接起来。 |
| [00:40:00–01:00:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=2400s) | 算术强度与Roofline | 比较逐元素、向量和矩阵算子的计算/搬运关系。 |
| [01:00:00–01:12:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=3600s) | 反向传播与优化器账本 | 推导6ND近似并按状态类型核算训练显存。 |
| [01:12:00–01:17:25](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=4320s) | 降低激活显存 | 用梯度累积和检查点减少存储，同时明确额外计算成本。 |

## 00:00:00–00:20:00｜张量、数值精度与设备

建立显存核算方式并理解混合精度的效率与稳定性取舍。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=0s)｜先做资源账本

- Marin训练结果接近预注册缩放预测；本讲将把效率问题拆成计算量、显存容量和数据搬运成本。
- 70B模型、15T token、1024张H100、MFU=0.5估算约143天；8卡可容53B参数只是忽略激活的显存上界。

关键词：MFU · Marin

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=240s)｜张量与浮点存储

- 参数、梯度、激活、优化器状态和数据最终都由张量保存；显存量等于元素个数乘每元素字节数。
- FP32由符号、8位指数和尾数组成；4×8张量占128字节，而大模型单个权重矩阵即可达到GB量级。

关键词：FP32

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=480s)｜FP16与BF16的取舍

- FP16仅5位指数，示例1e-8会下溢成零；减少位宽能省存储和带宽，却可能带来溢出、NaN和训练不稳。
- BF16保留FP32指数范围、缩短尾数，以较低分辨率换取动态范围；在深度学习中通常比FP16更实用。

关键词：FP32 · FP16 · BF16

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=720s)｜混合精度、FP8与FP4

- 典型混合精度让参数、激活和梯度用BF16，优化器状态用FP32；AMP按算子安全性选择计算精度。
- FP8有不同指数/尾数分配，NVFP4借助块缩放扩展有效范围；课件以Nemotron 3 Super说明低精度训练进展。

关键词：FP32 · BF16 · FP8 · FP4 · NVFP4

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=960s)｜精度边界与命名维度

- 块缩放允许整块数值整体变大变小，不能让相邻值独立拥有完整动态范围；训练低位模型与训练后量化不同。
- 张量默认常在CPU，需显式移到GPU；einops用语义维度名表达运算，减少负索引与transpose引发的混淆。

关键词：CPU · GPU

## 00:20:00–00:28:00｜用einops表达张量计算

借命名维度完成收缩、归约、拆分与重排。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=1200s)｜einsum与reduce

- einsum中输出未出现的维度被求和，批量矩阵乘可直接保留batch并消去hidden，无需手写转置索引。
- 省略号可保留任意批量维；reduce把命名维度做sum、mean或max，主要改善可读性而非自动加速。

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=1440s)｜rearrange与FLOP定义

- rearrange可将合并维度拆成heads和hidden，变换后再拼回；括号中维度顺序决定展平次序。
- 计算账本以加法和乘法等浮点操作计数；存储成本与计算成本分开核算，不能由张量大小直接推时间。

## 00:28:00–00:40:00｜FLOPs、基准测试与MFU

把算法运算数、GPU规格和实际运行时间连接起来。

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=1680s)｜规格表与矩阵乘成本

- FLOPs表示运算总量，FLOP/s表示硬件速度；H100宣传数含稀疏假设，稠密BF16峰值需使用对应数值。
- X为B×D、W为D×K时，前向矩阵乘约2BDK FLOPs；系数2来自每个内积的乘法与累加。

关键词：BF16 · FLOPs

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=1920s)｜从运算数到实测时间

- 逐元素操作约与元素数成正比，大矩阵下通常由matmul主导FLOPs；线性层前向约2×数据量×参数量。
- GPU调用异步，计时前后需同步并重复测量；否则只测到CPU发出任务的时间，会虚报速度。

关键词：FLOPs · CPU · GPU

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=2160s)｜MFU连接模型与硬件

- 实际吞吐为模型FLOPs除以实测秒数；MFU再除以对应精度的硬件峰值，衡量有效模型计算利用率。
- 整模型MFU约0.5已可观，纯matmul可更高；峰值分母应先排除不适用的稀疏加速，再讨论利用率。

关键词：FLOPs · MFU

## 00:40:00–01:00:00｜算术强度与Roofline

比较逐元素、向量和矩阵算子的计算/搬运关系。

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=2400s)｜搬运也消耗时间

- 输入需从HBM送到计算单元，输出再写回；H100示例同时使用约989 TFLOP/s算力与约3.35 TB/s带宽。
- 对N个BF16元素做ReLU，读写共4N字节而只做N次比较；百万元素示例搬运比计算慢约三个数量级。

关键词：ReLU · BF16 · HBM

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=2640s)｜算术强度判定瓶颈

- 在计算与搬运理想重叠假设下，总时间近似二者最大值；实际还会有未重叠部分与额外开销。
- 算法强度=FLOPs/搬运字节，硬件比值=峰值算力/带宽；ReLU仅0.25 FLOP/byte，远低于H100约295。

关键词：ReLU · FLOPs

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=2880s)｜不同算子的强度比较

- GELU虽每元素约20次操作，强度约5，仍受带宽限制；运算数更多不必等比例增加真实耗时。
- BF16点积强度约0.5、矩阵向量乘约1；方阵乘约N/3，随矩阵增大能转入计算受限区域。

关键词：GELU · BF16

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=3120s)｜批量大小与训练/推理

- 大矩阵通过复用同一批数据提高算术强度；逐token推理更像矩阵向量乘，训练可并行处理许多token。
- 低MFU可能来自带宽瓶颈而非缺少算术工作；roofline图把算法强度与不同设备性能上限联系起来。

关键词：MFU · Roofline

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=3360s)｜Roofline与深层网络账本

- Roofline低强度段随带宽和强度上升，高强度段被峰值算力封顶，转折点对应设备算力/带宽比。
- 用L层D×D线性变换加ReLU作例子，参数量为LD²；借简单网络继续核算反向传播和训练存储。

关键词：ReLU · Roofline

## 01:00:00–01:12:00｜反向传播与优化器账本

推导6ND近似并按状态类型核算训练显存。

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=3600s)｜反向传播的两类梯度

- 对H₂=H₁W₂，反传同时求输入梯度与权重梯度；用命名维度可看清分别消去输出维和批量维。
- 每类梯度仍是矩阵乘，计算量与该层前向同阶；示例把手写einsum结果与PyTorch自动梯度对照。

关键词：PyTorch

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=3840s)｜推导6ND与优化器引入

- 线性层前向约2ND、反向约4ND，所以训练合计约6ND；长上下文注意力的额外二次项会削弱该近似。
- Adagrad累计梯度平方并调整步长，作为优化器状态示例；Adam再结合一阶与二阶矩估计。

关键词：Adagrad · Adam

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=4080s)｜训练显存由谁占据

- BF16参数和梯度各2字节/参数；FP32 Adagrad状态4字节，Adam一阶与二阶状态共8字节/参数。
- 激活还随批量、宽度、层数增长；优化器状态可能大量占显存，但其计算常不是训练速度的主瓶颈。

关键词：FP32 · BF16 · Adagrad · Adam

## 01:12:00–01:17:25｜降低激活显存

用梯度累积和检查点减少存储，同时明确额外计算成本。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=4320s)｜梯度累积与激活检查点

- 梯度累积逐微批反传并累加，达到目标批量才更新参数和清零；降低同时存活的激活量。
- 激活检查点只保存部分中间状态，反传时重新计算缺失值；在计算与显存间取舍，支持更大批量或模型。

### [01:16:00–01:17:25](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=4560s)｜检查点复杂度与总结

- 按官方讲义修正口述：固定单层尺寸，以层数L计，每隔√L层存检查点，激活内存O(√L)、总重算量O(L)，并非√L倍重算。
- 资源核算归结为张量存储、6ND计算近似及roofline分析；矩阵足够大才可能计算受限，不能忽略形状与精度。

关键词：Roofline

## 复习问题

1. 推导B×D乘D×K的前向、输入梯度和权重梯度FLOPs。
2. 同一GPU上，为什么增加矩阵批量可能提高MFU，而单token解码仍慢？
3. BF16+FP32 Adam状态下，N参数模型至少占哪些显存，哪些尚未计入？

## 易错点

- 把FLOPs乘以秒数当成吞吐；正确为FLOPs/秒。
- 看到矩阵乘就认定计算受限；矩阵形状、大小、精度和带宽共同决定瓶颈。
- 把梯度累积当作减少总训练计算，或把忽略激活的参数容量估算当成可训练规模。

## 核验说明

基于Young-Lord公开ASR镜像逐窗整理，未直接验证音频；术语与公式用官方讲义校正。口述吞吐的乘除、ReLU强度及检查点重算复杂度存在说错或转录歧义，正文已标明或按公式纠正。

[官方视频](https://www.youtube.com/watch?v=kuYAsz7zspQ&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/02-kuYAsz7zspQ.en-orig.vtt) · [官方录制版可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_02_recording) · [官方讲义源码](https://github.com/stanford-cs336/lectures/blob/main/lecture_02.py)
