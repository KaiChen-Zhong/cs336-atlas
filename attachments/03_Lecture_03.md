# L03｜现代Transformer架构与训练稳定性

Spring 2026 · 01:29:14 · 23 个时间窗

[官方视频](https://www.youtube.com/watch?v=lVynu4bo1rY&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/03-lVynu4bo1rY.en-orig.vtt) · [官方课件PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_03.pdf)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

横向比较公开模型，梳理归一化、门控、RoPE、形状参数、稳定性措施及降低推理成本的注意力变体。

## 核心收获

- 先采用经过多模型验证的默认结构，再针对预算、任务与硬件做控制变量实验。
- 残差通路、归一化位置及softmax输入尺度决定大模型能否稳定训练。
- GQA与局部/全局混合注意力把推理成本和长上下文需求直接写进架构。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=0s) | 架构证据与归一化设计 | 通过现代模型报告解释残差流、pre-norm、RMSNorm和去偏置的共识。 |
| [00:20:00–00:32:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=1200s) | 门控MLP与串并行块 | 比较GLU激活及块结构在表达能力和系统效率上的权衡。 |
| [00:32:00–00:44:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=1920s) | RoPE与位置表示 | 用旋转的几何直觉说明相对位置内积及实现位置。 |
| [00:44:00–01:04:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=2640s) | 形状、词表与优化超参数 | 总结常见超参数范围，同时解释正则化直觉为何可能失效。 |
| [01:04:00–01:16:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=3840s) | 训练稳定性措施 | 围绕softmax风险讲解Z-loss、QK-Norm与logit soft cap。 |
| [01:16:00–01:29:14](https://www.youtube.com/watch?v=lVynu4bo1rY&t=4560s) | 推理成本与长上下文注意力 | 从KV读取瓶颈导出MQA/GQA，再讨论局部和全局层混合。 |

## 00:00:00–00:20:00｜架构证据与归一化设计

通过现代模型报告解释残差流、pre-norm、RMSNorm和去偏置的共识。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=0s)｜从模型报告寻找架构共识

- 本讲用大量公开模型报告识别稳定共识和可变设计；单篇论文常不完整，亲自做对照实验仍是最好学习方式。
- 作业1相较原始Transformer采用pre-norm、RoPE和SwiGLU；这些选择来自现代模型的集体实践。

关键词：Transformer · SwiGLU · GLU · RoPE

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=240s)｜架构同时服务三个目标

- 架构须兼顾数据泛化、GPU效率与训练稳定；2026报告又突出长上下文需求，不能只比较最终准确率。
- 原始Transformer把归一化放在残差加法之后；现代模型普遍把它移出主残差流，保留更直接的信号通路。

关键词：Transformer · GPU

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=480s)｜Pre-norm与梯度传播

- Pre-norm先归一化分支输入，再做注意力或FFN并加回残差；主残差路径保持恒等，利于深层梯度传播。
- 早期研究试图减少warmup依赖，随后发现pre-norm也能降低梯度尖峰、改善稳定性；现代训练仍常用warmup。

关键词：FFN

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=720s)｜归一化位置与RMSNorm

- 分支输出再归一化、同时做前后归一化也可保持主残差流干净；不能把所有post-norm混为一种结构。
- RMSNorm不减均值、不加偏置，主要按均方根缩放；经验上保留足够表达能力，同时减少不利于GPU的操作。

关键词：RMSNorm · GPU

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=960s)｜少量FLOPs也可能很耗时

- 归一化可能只占极少FLOPs，却受数据搬运影响占明显运行时间；课堂极端25%例子来自特定小模型工作负载。
- 现代Transformer常移除线性层偏置，减少低强度运算；有效性来自大量实验，并非一般神经网络的数学定理。

关键词：Transformer · FLOPs

## 00:20:00–00:32:00｜门控MLP与串并行块

比较GLU激活及块结构在表达能力和系统效率上的权衡。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=1200s)｜从普通激活到门控MLP

- 普通FFN先上投影、逐元素激活，再下投影；GLU增加一条线性分支，对激活结果做逐元素门控。
- GeGLU与SwiGLU分别使用GELU和Swish，后者为x·sigmoid(x)；现代模型多数采用某种门控单元。

关键词：MLP · FFN · GELU · SwiGLU · GLU

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=1440s)｜门控公平比较与并行块

- GLU由两矩阵变三矩阵，若匹配参数量，FFN中间宽度应乘2/3；控制参数后的实验仍显示稳定收益。
- 把attention与MLP从串行改为并行可减少依赖、方便融合；但需检验表达能力损失是否值得系统收益。

关键词：MLP · FFN · GLU

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=1680s)｜串并行权衡与位置编码入口

- GPT-J、PaLM等并行块共享输入、分别计算后加回残差；近年来多数模型继续串行，已有内核优化改变收益。
- 原始正弦位置编码、可学习绝对位置、注意力中的相对偏置均可使用；位置依赖仍是架构差异集中处。

## 00:32:00–00:44:00｜RoPE与位置表示

用旋转的几何直觉说明相对位置内积及实现位置。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=1920s)｜RoPE的相对位置目标

- RoPE希望两个位置化向量的内积只依赖词内容与位置差i−j；整体平移句子不应改变这项相互作用。
- 二维例子按位置旋转词向量：we know整体后移时，两词都多旋转同样角度，因此相对夹角保持不变。

关键词：RoPE

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=2160s)｜把二维旋转扩展到多维

- RoPE把坐标两两分组，以不同频率旋转各组；快频率表示局部位置变化，慢频率覆盖更长距离结构。
- 实际在每层attention中对Q、K施加旋转；它乘上旋转结构而非加位置向量，避免加法产生的交叉项。

关键词：RoPE

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=2400s)｜架构证据的边界

- 并行块与串行块缺少充分、统一的严格消融；模型后来弃用某设计仅是间接线索，不能视作确定因果结论。
- 相对偏置不满足RoPE追求的内积分解形式，但ALiBi等仍可有效；几何优雅并不自动证明唯一正确。

关键词：RoPE

## 00:44:00–01:04:00｜形状、词表与优化超参数

总结常见超参数范围，同时解释正则化直觉为何可能失效。

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=2640s)｜FFN倍率的常见范围

- 普通FFN常取d_ff≈4d_model；门控参数匹配后约为8d_model/3，部分Llama模型再提高MLP比例。
- T5-11B曾用64倍FFN以追求大矩阵效率，说明可行架构很多；参数选择还需看训练质量与整体计算效率。

关键词：MLP · FFN

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=2880s)｜倍率宽容区与头维度

- 引用缩放研究的消融，FFN倍率在约1至10的宽区域内差异较小，极端值才显著恶化；T5后续也回归常见倍率。
- 常见注意力设置让头数h乘头维d_head等于d_model；它是可靠起点而非必须满足的数学约束。

关键词：FFN

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=3120s)｜深宽比与词表规模

- 许多稠密模型d_model/层数约100，附近存在宽容区；更宽利于张量并行，更深可能增加流水线与顺序成本。
- 早期英语模型常用约3万词表，多语言与更大模型常升到10万至20万量级；需结合覆盖范围和模型容量。

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=3360s)｜跨Tokenizer比较与正则化问题

- 比较bits per byte须使用同一未被删改的原始字符串和同一字节分母；不同分词下直接比较token困惑度不可靠。
- 算力受限预训练往往只遍历大量数据一次，常规过拟合直觉不足以解释dropout和weight decay是否有用。

关键词：Tokenizer

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=3600s)｜Weight decay也影响优化

- 引用实验显示训练与验证损失近似同步，weight decay仍能在学习率衰减后改善收敛，作用不只控制过拟合。
- 架构超参数常有可接受的默认区间，但weight decay与学习率互相影响；应联合实验而非独立套正则化口诀。

## 01:04:00–01:16:00｜训练稳定性措施

围绕softmax风险讲解Z-loss、QK-Norm与logit soft cap。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=3840s)｜训练失稳与Softmax风险

- 大规模训练尖峰可能毁掉昂贵运行，稳定性成为架构设计核心；重点检查输出softmax与attention softmax。
- Softmax含指数与归一化，极端logit或归一化常数会放大数值风险；后续方法分别控制输出端与注意力端。

关键词：Softmax

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=4080s)｜Z-loss与QK-Norm

- Z-loss对(log Z)²加惩罚，把log-normalizer拉近零；利用softmax整体平移不变性改善输出数值尺度。
- QK-Norm在Q、K相乘前归一化，控制送入attention softmax的尺度；该技巧从视觉/多模态扩展到语言模型。

关键词：Softmax · Z-loss · QK-Norm

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=4320s)｜Soft cap与推理需求

- Logit soft-capping用有界tanh约束送入softmax的值，稳定性强，但限制极高置信度，可能损害质量。
- 部署既支付算术又支付显存访问成本；接下来通过KV cache与多查询/分组查询注意力减少推理开销。

关键词：Softmax · KV Cache

## 01:16:00–01:29:14｜推理成本与长上下文注意力

从KV读取瓶颈导出MQA/GQA，再讨论局部和全局层混合。

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=4560s)｜自回归解码与KV Cache

- 训练或prefill能批量处理token；decode必须逐步生成，KV cache复用过去的键和值，避免重复算旧位置。
- 逐步decode仍需反复读取权重及历史KV，降低算术强度；长序列、小批量时尤明显，缓存不会消除搬运成本。

关键词：KV Cache

### [01:20:00–01:24:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=4800s)｜MQA到GQA的折中

- MQA让所有查询头共享一组K、V，显著缩小缓存，却可能损失表达力；GQA让每组查询共享一组K、V。
- GQA保留查询头数，用KV头数调节质量与推理成本；所示实验中接近MHA质量而大幅降低时间。

关键词：GQA · MQA · MHA

### [01:24:00–01:28:00](https://www.youtube.com/watch?v=lVynu4bo1rY&t=5040s)｜局部与全局注意力交替

- 滑动窗口仅关注邻近位置，定期插入全局attention层；局部层也可间接使用前面全局层传播来的信息。
- Cohere等采用类似每四层一次全局的混合结构，并探索NoPE/RoPE搭配；MQA/GQA则需在训练时定义结构。

关键词：RoPE · GQA · MQA

### [01:28:00–01:29:14](https://www.youtube.com/watch?v=lVynu4bo1rY&t=5280s)｜更便宜层与全局层混合

- Qwen3.5等用Gated DeltaNet替代部分局部attention层，再穿插全局attention，体现新的长上下文成本取舍。
- 现代架构已有归一化、门控等共识；位置编码与长上下文混合方式仍活跃，下一讲继续讨论替代结构。

关键词：DeltaNet

## 复习问题

1. 为什么残差分支上的post-norm与原始Transformer的post-norm不能混为一谈？
2. 证明同时旋转Q、K不会改变内积，并说明RoPE如何留下相对位置差。
3. 设计GQA时保持查询头不变、减少KV头，具体节省哪类推理资源？

## 易错点

- 把主流实践当成理论必然：4倍FFN、约100深宽比和去偏置均有适用边界。
- 混淆KV cache所缓存对象；标准做法保存过去键和值，不是查询或完整注意力矩阵。
- 把QK-Norm、soft cap或weight decay看作无代价开关，忽视它们与学习率、质量的交互。

## 核验说明

基于Young-Lord公开ASR镜像逐窗整理，并对照官方PDF；未直接验证音频。对KV cache对象及算术强度口误作概念校正；Gemma等模型信息仅作为本讲举例，不扩写未核实配置。

[官方视频](https://www.youtube.com/watch?v=lVynu4bo1rY&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/03-lVynu4bo1rY.en-orig.vtt) · [官方课件PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_03.pdf)
