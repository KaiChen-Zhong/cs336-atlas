# L11｜缩放进阶：公开配方、WSD、Muon与μP

Spring 2026 · 01:17:04 · 20 个时间窗

[官方视频](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/11-vTfEyOyzV9E.en-orig.vtt) · [官方PDF（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_11.pdf)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

比较MiniCPM的稳定参数化路线与DeepSeek的超参数预测路线，学习可复用训练预算、优化器公平对比和μP尺度推导。

## 核心收获

- WSD把稳定训练主干与终点衰减分开，降低扫描不同token预算的重复成本。
- 优化器比较需公平调参，并检查算力与token/参数比例两个尺度轴。
- μP目标是保持激活及更新尺度稳定，实际规则依网络结构、优化器和参数化约定。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:16:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=0s) | MiniCPM、μP与WSD | 通过初始化和调度设计，减少学习率漂移与不同训练预算的重复开销。 |
| [00:16:00–00:32:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=960s) | DeepSeek及近期模型缩放配方 | 直接拟合LR/batch，并把缩放实验扩展到MoE、架构与下游预测。 |
| [00:32:00–00:44:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=1920s) | 超参数经验规律与可靠性 | 查看高分辨率网格中的趋势，说明公式迁移的实验条件和局限。 |
| [00:44:00–00:56:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=2640s) | 优化器比较与Muon | 检验公平基线与尺度依赖，理解矩阵更新正交化及大训练证据边界。 |
| [00:56:00–01:12:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=3360s) | μP的量级推导 | 从激活与特征更新不变量推导简化网络的初始化和学习率尺度。 |
| [01:12:00–01:17:04](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=4320s) | 压力测试与工程边界 | 识别会改变超参数迁移的实现细节，回到需要验证的经验外推。 |

## 00:00:00–00:16:00｜MiniCPM、μP与WSD

通过初始化和调度设计，减少学习率漂移与不同训练预算的重复开销。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=0s)｜把缩放方法用到真实训练

- 本讲从MiniCPM、DeepSeek等公开配方检验缩放方法，聚焦batch、学习率、初始化等随规模敏感的量。
- 路线分两类：调整参数化让超参数最优值稳定，或接受最优值变化并直接拟合其缩放规律。

关键词：缩放实践

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=240s)｜MiniCPM的μP配方

- MiniCPM对embedding、残差分支、矩阵初始化、分组学习率和LM head做尺度调整，以稳定跨宽度训练。
- 小模型梯队扫描中最佳基础LR大致落在同一区间；这个数值属于其参数化，不能与普通Adam LR直接比较。

关键词：MiniCPM

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=480s)｜batch仍需调，训练长度如何复用

- μP稳定学习率不代表batch也固定；MiniCPM按模型、数据规模寻找最优batch，再拟合其与目标loss的关系。
- cosine调度依赖最终训练长度，不同预算常须重跑；WSD改为warmup、长期恒定、末段衰减三阶段。

关键词：WSD

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=720s)｜WSD的复用方式与代价

- 保留稳定阶段checkpoint后，可延长恒定LR主干，再为不同训练终点各跑衰减分支，节省重复预训练。
- 稳定阶段loss可能不如cosine，衰减后才赶上；MiniCPM据此拟合数据/模型取舍，其具体指数仍需审慎解释。

关键词：训练复用

## 00:16:00–00:32:00｜DeepSeek及近期模型缩放配方

直接拟合LR/batch，并把缩放实验扩展到MoE、架构与下游预测。

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=960s)｜DeepSeek直接预测最优超参数

- DeepSeek LLM不靠μP固定LR，而在多个规模扫描LR×batch网格，收集低loss配置并拟合随算力的变化。
- 网格太粗会使最优LR出现离散误差；batch趋势较清楚不代表学习率回归同样可靠，需检查采样范围。

关键词：DeepSeek

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=1200s)｜WSD加IsoFLOPs的公开验证

- DeepSeek用可复用学习率调度进行IsoFLOPs扫描，得到模型/数据取舍，并比较小规模预测与最终训练loss。
- Qwen报告延续LR/batch预测流程；之后的MoE报告更关注活跃参数、总容量和稀疏度的共同缩放。

关键词：IsoFLOPs

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=1440s)｜MoE、下游与架构缩放案例

- Kimi K2等扫描稀疏程度，借收益递减选择专家配置；Hunyuan固定稀疏度再估算数据/活跃参数比例。
- Llama 3尝试把log-loss映射到准确率；MiniMax比较全局、线性及混合注意力跨尺度趋势，用于架构决策。

关键词：模型案例

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=1680s)｜预训练外推的边界

- 预训练loss规律不自动包含后训练收益；如何共同优化预训练与后训练，课堂明确视为仍未充分解决的问题。
- 接下来用StepFun高密度超参数网格研究LR与batch，再转向μP，以比较预测变化和构造不变性两种方法。

关键词：后训练边界

## 00:32:00–00:44:00｜超参数经验规律与可靠性

查看高分辨率网格中的趋势，说明公式迁移的实验条件和局限。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=1920s)｜超参数曲面与变量选择

- 不同研究分别用目标loss、算力或数据量预测batch/LR，连输入变量也未完全统一，不能把某式当普适定律。
- StepFun实验的LR×batch局部切片较平滑，利于找谷底；其最佳batch主要随训练数据总量变化。

关键词：超参数搜索

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=2160s)｜学习率规律的条件依赖

- 该实验中更大模型需要更小LR，固定模型增加数据时最佳LR反而上升；调度改变可能改变后一趋势。
- 拟合可部分迁移到MoE，但换数据集会移动最优点；相似算力下可作起点，大训练仍要验证配方差异。

关键词：学习率

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=2400s)｜小基准成功不等于大规模优势

- nanoGPT speedrun中Muon曾显著改进速度，但优化器收益可能随规模变化，需要额外做外推检验。
- 是否直接采用别人LR公式取决于预算及实验接近程度；权重衰减、架构等差异可能改变最佳配置。

关键词：Muon

## 00:44:00–00:56:00｜优化器比较与Muon

检验公平基线与尺度依赖，理解矩阵更新正交化及大训练证据边界。

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=2640s)｜公平比较优化器的两个轴

- 不同优化器需分别调LR、weight decay等；统一套同一超参数可能制造假优势，基线调好后差距会消失。
- 除总算力外还应扫描token/参数比，区分数据受限与充分训练情形；算法可能只在某一训练比例有效。

关键词：公平实验

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=2880s)｜缩放失效与Muon机制

- 案例显示漂亮小规模趋势也可能在更大算力偏离甚至发散，须重新检查参数化、调度与优化器。
- Muon先形成动量更新矩阵，再近似将其奇异值压到单位尺度；理想映射B=UΣVᵀ→UVᵀ。

关键词：矩阵优化

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=3120s)｜Newton–Schulz与大训练证据

- Muon用有限步Newton–Schulz矩阵乘法近似正交化，避免每步完整SVD；向量参数可继续使用AdamW。
- Kimi K2采用带稳定性改进的Muon说明它能大规模训练；缺少同规模对照，不能据此证明优于Adam。

关键词：Newton–Schulz

## 00:56:00–01:12:00｜μP的量级推导

从激活与特征更新不变量推导简化网络的初始化和学习率尺度。

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=3360s)｜为什么μP要改多处尺度

- 全超参数网格成本随维数爆炸，实践优先调敏感项；μP则调整初始化、逐参数LR等，减少宽度引起的漂移。
- Cerebras-GPT等实验显示μP可使预测更稳定；接下来推导只讨论简化网络，不能直接视作完整Transformer配方。

关键词：μP

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=3600s)｜μP的两个尺度不变量

- 随宽度增加，希望单元初始激活为Θ(1)，一次更新造成的激活变化也为Θ(1)，维持非退化特征学习。
- 向量含n个同尺度分量时范数约Θ(√n)；由深线性层的随机矩阵谱范数估计来约束初始化标准差。

关键词：初始化

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=3840s)｜从激活变化约束权重更新

- 简化推导令σ≈Θ[n_in^−1/2 min(1,√(n_out/n_in))]，以控制初始激活范数。
- 单样本SGD更新为梯度与输入外积；展开Δh=WΔh_prev+ΔW(h_prev+Δh_prev)，再按量级平衡各项。

关键词：尺度推导

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=4080s)｜逐层学习率从量级推出

- 在单样本深线性网络及无主项抵消等假设下，要求‖ΔW‖约√(n_out/n_in)，才能保持激活变化尺度。
- 再假设loss变化为常数量级，示意推得SGD逐层LR∝n_out/n_in；课堂给Adam对应约1/n_in。

关键词：学习率参数化

## 01:12:00–01:17:04｜压力测试与工程边界

识别会改变超参数迁移的实现细节，回到需要验证的经验外推。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=4320s)｜μP压力测试与适用范围

- 受控宽度实验常见最佳LR较稳定，但可学习RMSNorm gain、特殊优化器及较强解耦衰减可能破坏迁移。
- 这里是所展示实现与实验的结果，不能认定某组件必然破坏所有μP；实际仍需确认采用哪套参数化。

关键词：稳健性

### [01:16:00–01:17:04](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=4560s)｜实践结论：控制漂移仍需证据

- 缩放规律能帮助选择架构、优化器与超参数，但没有方法保证无限外推；漂亮回归线仍可能越界失效。
- 可组合μP、局部LR/batch搜索和WSD预算复用，降低试错成本，并在更接近目标规模处检验趋势。

关键词：总结

## 复习问题

1. WSD为何能复用一次长训练得到多个数据预算终点？哪些衰减计算仍需重做？
2. 比较Muon与Adam时，为什么既要分别调参，又要扫描算力和token/参数比？
3. μP的两个不变量是什么？课堂推导加入哪些假设，为什么不能直接套用到任意模型？

## 易错点

- μP不是把所有参数使用同一数值LR；基础LR稳定依赖各组的缩放和前向参数化。
- WSD稳定阶段checkpoint不等价于已完成衰减的最终模型，不能直接拿中间loss公平比较。
- Muon用近似正交化而非每步SVD，且不适合把所有标量、向量参数当矩阵统一处理。
- 模型采用某优化器证明可用，不自动证明相对另一个优化器存在因果性能优势。

## 核验说明

逐窗读取Young-Lord镜像ASR，并核对官方lecture_11.pdf。ASR在20–24分钟将Kimi K2误识别为Chinchilla 2，已更正。μP公式按课件量级推导呈现，明确单样本深线性网络和附加假设，未将其扩展为普适实现教程。

[官方视频](https://www.youtube.com/watch?v=vTfEyOyzV9E&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/11-vTfEyOyzV9E.en-orig.vtt) · [官方PDF（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_11.pdf)
