# L12｜评价：困惑度、考试、聊天、Agent与有效性

Spring 2026 · 01:18:34 · 20 个时间窗

[官方视频](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/12-JpAxdTWQJxM.en-orig.vtt) · [官方交互讲义](https://cs336.stanford.edu/lectures/?trace=lecture_12) · [官方代码讲义（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_12.py) · [HELM评测平台](https://crfm.stanford.edu/helm/)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

把“模型好不好”拆成不同测量目的，比较六类评测范式，并检查裁判偏差、真实使用代表性、训练污染与任务质量。

## 核心收获

- 评测先定义目标能力和使用场景；分数不是脱离协议与样本分布的统一智能量。
- PPL提供平滑分布指标，考试提供可判分题，开放聊天和agent需要额外裁判或环境约束。
- 必须同时审查模型、scaffold、数据来源与评测实现，定量分数应配实际输出检查。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=0s) | 评价目标与困惑度 | 区分能力、成本和偏好，理解概率评价优势及其测量和信任边界。 |
| [00:20:00–00:32:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=1200s) | 考试基准与难度升级 | 梳理MMLU、GPQA、HLE设计，辨认难度、污染和真实使用的不同问题。 |
| [00:32:00–00:44:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=1920s) | 聊天偏好与模型裁判 | 从成对比较、长度偏差到任务rubric，讨论开放回答如何可靠评分。 |
| [00:44:00–01:00:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=2640s) | Agent与纯推理评测 | 评价可执行任务和scaffold，并检视将推理从知识中分离的尝试。 |
| [01:00:00–01:16:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=3600s) | 安全、现实性与科学有效性 | 审查风险范围、职业任务代表性、隐私、数据污染与任务本身缺陷。 |
| [01:16:00–01:18:34](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=4560s) | 选指标前声明规则 | 按用途选择方法、模型或系统的比较规则，而非寻找万能排行榜。 |

## 00:00:00–00:20:00｜评价目标与困惑度

区分能力、成本和偏好，理解概率评价优势及其测量和信任边界。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=0s)｜评价把抽象目标变成可测量量

- “模型好”可指推理强、使用便宜、用户偏好高等；评测的核心是把这些抽象概念转成具体任务和指标。
- 榜单不仅记录能力，也会引导开发投入；因此先问想要什么行为，再设计prompts、环境与评分。

关键词：评价目标

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=240s)｜使用率与困惑度两种视角

- 平台使用/付费统计反映其用户群选择，不能代表全体需求；语言模型作为分布则可用测试集似然评估。
- PPL=exp[−Σlog p(x_t|x_<t)/T]；传统PTB、WikiText等采用固定训练/测试划分衡量分布内泛化。

关键词：perplexity

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=480s)｜GPT-2的零样本评价与分布目标

- GPT-2在WebText训练后直接测传统数据集，强调大规模预训练后的跨分布迁移，而非仅测同数据集划分。
- 若模型等于真实分布，交叉熵达到H(t)、困惑度达到exp(H(t))；由此推断能解决所有任务仍只是理想化论证。

关键词：零样本

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=720s)｜条件困惑度与任务相关token

- 完整PPL给每个token计分，可能稀释关心的知识或回答质量；条件PPL仅计prompt后响应部分。
- LAMBADA挑选依赖较长上下文的补词，HellaSwag比较合理续写；它们把语言预测聚焦到具体能力。

关键词：条件评测

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=960s)｜概率评分的信任边界

- 若黑盒随意返回高log-prob却不是合法归一化分布，困惑度排行榜会失真；评分接口需要可验证概率语义。
- 考试题有明确学科、难度和答案，容易自动判分；MMLU用57科选择题评估知识与推理广度。

关键词：MMLU

## 00:20:00–00:32:00｜考试基准与难度升级

梳理MMLU、GPQA、HLE设计，辨认难度、污染和真实使用的不同问题。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=1200s)｜从MMLU到更难的题目

- MMLU早期以few-shot提示测GPT-3，后来逐渐饱和；MMLU-Pro去除噪声、扩大选项并使用推理式作答。
- GPQA把目标转向研究生级知识，要求题目难到非专家即便联网检索也不容易答对。

关键词：GPQA

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=1440s)｜题目验证与数据污染

- GPQA经专家撰写、复核、修订及非专家尝试，Diamond子集按专家一致性和非专家失败等条件筛选。
- 公开分数难排除训练污染，重合可能来自题目衍生来源；HLE继续用众包、审查及私有题提高难度。

关键词：数据污染

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=1680s)｜更难考试仍有现实性限制

- HLE引入跨学科、多模态题并保留私有集合；考试可以很难，但仍难覆盖开放式、含糊且无唯一答案的请求。
- 选择题可直接或经推理后抽取最终选项，答案解析规则会影响分数，比较时需固定完整评测协议。

关键词：HLE

## 00:32:00–00:44:00｜聊天偏好与模型裁判

从成对比较、长度偏差到任务rubric，讨论开放回答如何可靠评分。

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=1920s)｜Arena如何把人类偏好变排名

- 用户提交真实问题，匿名比较两模型回答；汇集成对胜负，用评级差映射获胜概率并拟合排名。
- 无需所有模型回答完全相同题目，也无需人人评价所有模型；但来访人群与问题分布决定结论适用对象。

关键词：Arena

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=2160s)｜偏好混杂与LLM裁判

- 二元偏好会混合风格、正确性及迎合程度，提问者也未必有能力判断答案真伪，真人评分并非天然客观。
- AlpacaEval用模型裁判比较待测回答与基线；偏爱长回答曾造成刷分，后续用长度控制缓解该偏差。

关键词：LLM judge

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=2400s)｜怎样评价评测本身

- 与Arena高相关可作一致性检查，但只对当时模型集合成立；相关不证明两套指标都准确测到目标能力。
- WildBench从真实对话取问题，再为各任务生成checklist，使开放回答评价比笼统“好不好”更明确。

关键词：rubric

## 00:44:00–01:00:00｜Agent与纯推理评测

评价可执行任务和scaffold，并检视将推理从知识中分离的尝试。

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=2640s)｜从说得好转向做得成

- 评开放回答应给明确rubric，并检查多种裁判的偏差；agent评价则要让模型在环境中使用工具完成任务。
- SWE-bench给代码库与issue，模型产出补丁，再用测试判定修复及回归；评分对象已包含模型和执行流程。

关键词：SWE-bench

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=2880s)｜终端、安全练习与ML工程任务

- Terminal-Bench以终端环境承载通用任务；CyBench使用受控CTF题，MLE-bench考察数据处理与建模竞赛。
- 同模型换agent scaffold即可改变成绩，因此榜单不能只归功于模型权重，还须记录工具、预算与流程。

关键词：agent评测

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=3120s)｜Scaffold与纯推理任务

- 长任务常需要显式计划、子任务委派、持久文件记忆及上下文管理，而非无限堆积单条思维轨迹。
- ARC-AGI用视觉网格规则任务，尝试减少语言和事实知识影响，以观察模型是否能从少量例子推断规律。

关键词：ARC-AGI

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=3360s)｜推理与知识难以完全分开

- ARC系列随模型能力发展推出更难任务及交互环境；推理模型表现变化并不能证明预训练知识完全无关。
- 任务设计仍含先验且面向人类可解问题，不等价于所有超人推理；图像或文本编码方式也属于协议。

关键词：推理

## 01:00:00–01:16:00｜安全、现实性与科学有效性

审查风险范围、职业任务代表性、隐私、数据污染与任务本身缺陷。

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=3600s)｜安全评测不只有拒答率

- HarmBench关注有害请求响应，AIR-Bench由多地政策及规范组织风险分类；二者测量范围并不相同。
- 对抗提示可暴露常规拒答测试未覆盖的失效；理解越狱研究重点是检验稳健性，而非把单次拒绝当安全保证。

关键词：安全

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=3840s)｜现实有效性与职业任务

- 安全还涉及幻觉、迎合及双重用途，风险与能力不总是同方向变化，必须说明具体场景和影响。
- GDPval用职业任务、MedHELM用临床实际任务提高生态有效性；考试成绩高不能直接代替真实工作验证。

关键词：生态有效性

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=4080s)｜真实流量、隐私与污染检测

- 真实查询最贴近使用，但分析与公开受到隐私限制；Clio用模型汇总使用模式，而非直接展示个人对话。
- 可通过异常偏好基准原始题序推断潜在污染、要求提供重合报告，或使用新发布评测减少旧训练覆盖。

关键词：有效性

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=4320s)｜私有测试与数据质量审计

- 新时间戳不保证内容新，可能复制旧材料；私有数据也需保证未被训练使用，适合补充分布测试。
- 题目缺条件、测试不完整或环境漏洞都会歪曲成绩；应人工抽查答案和agent轨迹，确认通过确实等于完成。

关键词：质量审计

## 01:16:00–01:18:34｜选指标前声明规则

按用途选择方法、模型或系统的比较规则，而非寻找万能排行榜。

### [01:16:00–01:18:34](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=4560s)｜先声明用途和比较对象

- 采购选择、研究能力、分析收益风险、指导模型改进需要不同评测组合，没有一张榜能替代所有目的。
- 固定训练条件可比较方法，任意训练后的榜单更多比较模型/系统；明确规则后再权衡难度、现实性和有效性。

关键词：评价设计

## 复习问题

1. 为什么低perplexity不保证某个业务场景更好？条件perplexity改变了什么？
2. Arena偏好、LLM裁判与单元测试各可能漏掉什么？如何用rubric和轨迹审计补足？
3. 若评测可能混入训练，私有数据、更新题目与污染检测分别能解决什么、不能解决什么？

## 易错点

- 最小交叉熵等于真实分布熵；自然对数下最小困惑度是exp(H)，二者不能混写。
- 公开数据集变难或更高分不自动说明现实能力等比例变化，也不自动排除污染。
- 人类偏好不等于事实正确；与另一榜单高度相关不等于具备独立效度证据。
- 通过测试可能依赖测试遗漏或环境漏洞；agent成绩属于模型、scaffold和预算的共同结果。

## 核验说明

逐窗依据Young-Lord镜像ASR，并核对官方lecture_12.py。纠正课件将熵与困惑度混写、条件PPL漏倒数等表达；课堂展示的即时排行榜仅保留方法含义，不作为2026-09-08实时排名。

[官方视频](https://www.youtube.com/watch?v=JpAxdTWQJxM&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/12-JpAxdTWQJxM.en-orig.vtt) · [官方交互讲义](https://cs336.stanford.edu/lectures/?trace=lecture_12) · [官方代码讲义（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_12.py) · [HELM评测平台](https://crfm.stanford.edu/helm/)
