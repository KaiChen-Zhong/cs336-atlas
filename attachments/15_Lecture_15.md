# L15｜中期与后训练：SFT 数据、RLHF 与 DPO

Spring 2026 · 01:19:55 · 20 个时间窗

[官方视频](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/15-2oH6PWPrYFo.en-orig.vtt) · [2026 官方 PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_15.pdf)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

先理解示范数据如何塑造风格、知识与安全，再从模仿分布转向优化偏好奖励，解释 PPO 的动机、DPO 的简化与奖励过度优化。

## 核心收获

- SFT 不只是添加知识，也在塑造输出形式；风格改善、能力提高和事实可靠性要分别测量。
- 反馈质量取决于准则、标注者、教师与任务，不因标注一致或模型很强就自动可靠。
- DPO 简化了偏好优化工程，但不能消除奖励偏差、分布迁移与模式塌缩。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=0s) | 后训练目的与指令数据演变 | 从基础续写模型转为自然聊天和工具助手，核心变化首先发生在训练数据。 |
| [00:20:00–00:36:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=1200s) | 风格、知识与安全的难点 | 示范同时传播模板和事实，少量数据能引导行为，却可能诱发幻觉或过度拒绝。 |
| [00:36:00–00:48:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=2160s) | 中期训练与优化目标的改变 | 数据阶段界限变模糊，而 SFT 与 RLHF 在拟合分布和最大化奖励之间有根本差别。 |
| [00:48:00–01:04:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=2880s) | 人类与 AI 偏好数据 | 高质量反馈需要适当准则、专业核验与成本权衡，自动反馈也有能力边界。 |
| [01:04:00–01:16:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=3840s) | 策略梯度、PPO 与 DPO | 由奖励正则目标和采样复用动机走到 PPO，再用隐式奖励重参数化理解 DPO。 |
| [01:16:00–01:19:55](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=4560s) | 奖励过度优化与熵 | 偏好分数越高未必越好，多样性与校准问题连接下一讲推理强化学习。 |

## 00:00:00–00:20:00｜后训练目的与指令数据演变

从基础续写模型转为自然聊天和工具助手，核心变化首先发生在训练数据。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=0s)｜从基础模型到可控助手

- 强基础模型能续写却未必可靠服从复杂指令；本讲目标是从 GPT-3 式模型走向聊天助手，下讲再进入推理模型。
- 预训练提供广泛能力，后训练通过明确示范和反馈塑造行为；后者高度依赖数据与工程，不能替代前者。

关键词：post-training

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=240s)｜公开配方的边界与 SFT 起点

- 公开后训练细节常来自较早论文；开放模型的蒸馏路线也不等同前沿实验室的人类数据收集过程。
- 典型流程先用提示—参考回答做 SFT，再用偏好反馈优化；SFT 算法近似熟悉的语言建模，主要难点转向数据。

关键词：SFT · RLHF

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=480s)｜指令数据从多任务到合成

- FLAN 重用监督 NLP 数据，Self-Instruct 用模型造数据，Alpaca/Vicuna 做蒸馏，OpenAssistant 组织人工共创。
- 后续方法加强合成难度与多样性，并转向工具调用和 agent；回答正确性重要，但所需数据还取决于基础模型能力。

关键词：FLAN · Self-Instruct

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=720s)｜任务模板与自然对话的差距

- 邮件主题预测、短摘要等现有数据便于规模化，但指令位置、输出风格甚至原始标签缺陷都可能不符合真实聊天。
- Alpaca 式自然提示和较长回答在合适的基础模型上诱导聊天行为，推动关注少量高质量示范的作用。

关键词：Alpaca · 质量

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=960s)｜人工专家数据与工具轨迹

- OpenAssistant 尝试用详细人工回答提高质量；Nemotron 示例则把文本、工具调用和结构化字段一起纳入 SFT。
- 助手的长度、语气、条目结构与工具接口都由数据塑造，收集时要把这些行为目标明确写出来。

关键词：OpenAssistant · agent SFT

## 00:20:00–00:36:00｜风格、知识与安全的难点

示范同时传播模板和事实，少量数据能引导行为，却可能诱发幻觉或过度拒绝。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=1200s)｜风格偏好与事实学习不是同一事

- 用户或评审常偏爱长回答和列表，偏好胜率上升不必然意味着标准能力评测提升；风格和能力要分开衡量。
- 带引用的示范同时教事实与“回答应附引用”的模板；若模型只学会形式，面对未知事实可能生成虚构引用。

关键词：style bias · hallucination

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=1440s)｜未知知识与策略相关反馈

- 课堂讨论：强迫模型模仿它尚不掌握的尾部知识，可能诱导错误泛化；高质量事实也不保证适合直接 SFT。
- RL 可能把内部知道/不知道的信号转成不同输出策略，但这是有条件的机制解释，并不意味着 RL 自动解决幻觉。

关键词：校准 · on-policy

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=1680s)｜安全数据与误拒绝的权衡

- 安全后训练同时控制有害请求通过率和正常请求误拒绝率；“kill a Python process”例子展示只看词面会失败。
- Tulu 3 从 WildChat 等使用记录筛选风险请求与 jailbreak，再配期望响应；公开安全数据细节仍有限。

关键词：safety SFT · Tulu 3

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=1920s)｜少量示范为何有用，何时还需扩量

- 有能力的模型可被很少示范明显引导，但精细区分复杂情境仍需更丰富数据，不能把小样本成功等同全面覆盖。
- “提取预训练已有行为”是有用直觉而非可直接观测的定理；SFT 与 RL 的区别也更多在反馈来源和策略分布。

关键词：行为引导 · 反馈

## 00:36:00–00:48:00｜中期训练与优化目标的改变

数据阶段界限变模糊，而 SFT 与 RLHF 在拟合分布和最大化奖励之间有根本差别。

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=2160s)｜中期训练使阶段边界模糊

- 高质量网页和指令数据可混入预训练末期的学习率衰减阶段，MiniCPM 示例展示前后数据配比变化。
- 这类训练可以连 prompt 一起预测；现代 base model 可能已接触聊天数据，不能只按名称假设它完全未经指令训练。

关键词：mid-training · MiniCPM

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=2400s)｜衰减阶段消融与目标转换

- 中期训练比全程预训练短，可用数据消融估计来源价值并反馈到配比设计，但实际配方仍有大量试错。
- SFT 拟合示范分布，RLHF 寻找高奖励策略；后者原则上可以集中到每个提示一个答案，不以复现数据多样性为直接目标。

关键词：数据消融 · imitation vs optimization

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=2640s)｜为何评价可能胜过直接示范

- 人类自己写出的答案未必是其最喜欢的答案，验证也可能比生成更容易；因此偏好比较提供不同于示范的信息。
- 常见 RLHF 流程从 SFT 模型采样多个回答，让评审排名，训练奖励模型，再优化模型生成的奖励分数。

关键词：preference data

## 00:48:00–01:04:00｜人类与 AI 偏好数据

高质量反馈需要适当准则、专业核验与成本权衡，自动反馈也有能力边界。

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=2880s)｜标注准则与专家化

- InstructGPT 的 helpful、truthful、harmless 是复合标准，需要具体标注指南；不同维度可互相冲突。
- 高难领域需要专家与足够核查时间；讲者描述高成本专家标注与规模化普通标注并存，不能把所有数据视为同质标签。

关键词：annotation

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=3120s)｜标注群体与数据中的隐性偏差

- 有限时间、使用 AI 代答和标注者经验都会改变反馈质量；后训练位于最后阶段，偏差可能明显影响输出。
- 课堂用意见调查和隐性偏好传递研究说明数据分布的重要性，但也提醒这类测量脆弱，不能当成简单因果定律。

关键词：bias · 反馈质量

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=3360s)｜一致性不等于真实质量

- 普通评审可能更重格式，专家更重事实和一致性；质量控制需要检查标注是否落实具体准则。
- 评审间一致性主要反映分歧，无法证明无共同偏差；大家同用一个模型代答，也可能高度一致。

关键词：inter-annotator agreement

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=3600s)｜AI 反馈的成本优势与适用范围

- 课堂以 Zephyr、UltraFeedback、Tulu 3 说明强模型反馈可低成本扩量，适合追赶已有能力边界。
- 突破教师尚不具备的前沿能力仍需新信息或真实反馈；Constitutional AI 展示另一种模型自生成安全数据的循环。

关键词：AI feedback · Constitutional AI

## 01:04:00–01:16:00｜策略梯度、PPO 与 DPO

由奖励正则目标和采样复用动机走到 PPO，再用隐式奖励重参数化理解 DPO。

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=3840s)｜奖励、KL 与策略梯度

- 模型评审也有长度偏差，甚至只奖励变长便能推高某些胜率，因此奖励分数本身需要审查。
- RLHF 优化 E_π[r]−β KL(π||π_ref)；策略梯度为 E_π[r∇logπ]，可看成按奖励加权的学习信号。

关键词：KL · policy gradient

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=4080s)｜PPO 的动机与 DPO 的简化

- 采样昂贵，想复用旧 rollout 就需处理策略分布变化；TRPO 约束更新，PPO 用比率裁剪构造更易优化的代理目标。
- 只保留好样本或加 GOOD/BAD 标签不必然有效；DPO 通过正确加权的偏好损失，省去独立奖励模型与内层在线采样。

关键词：PPO · DPO

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=4320s)｜DPO 闭式联系与梯度直觉

- 在可取任意策略的理想化条件下，KL 正则最优策略满足 π*(y|x)∝π_ref(y|x)exp(r/β)，由此把奖励重参数化为概率比。
- 代入偏好模型后提高 winner 相对 loser 的参考校正对数概率，更新强度随隐式奖励的预测误差变化。
- LLaMA 例子把 SFT、DPO、拒绝采样放入外循环；DPO 变体及 PPO 排名依赖实验设置，不能只看算法名称。

关键词：DPO · reference policy

## 01:16:00–01:19:55｜奖励过度优化与熵

偏好分数越高未必越好，多样性与校准问题连接下一讲推理强化学习。

### [01:16:00–01:19:55](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=4560s)｜过度优化、多样性与下讲问题

- 持续优化近似奖励可能利用其误差，KL 正则用于限制偏离；高奖励不保证真正更好。
- RLHF 可能减少输出熵并破坏原有校准，探索空间收缩会影响推理学习；下讲讨论更可验证的奖励及 GRPO。

关键词：reward hacking · entropy

## 复习问题

1. 为什么包含真实但模型未知引用的高质量 SFT 示例仍可能增加幻觉？
2. SFT 与 RLHF 在目标上有什么区别，为什么后者可能降低输出多样性？
3. 从 π*∝π_ref exp(r/β) 看 DPO：reference、winner/loser 和误差加权各做什么？

## 易错点

- 偏好胜率或更长回答不等于推理能力和事实准确率提高。
- 高标注一致性不保证无偏，强评审模型也会有长度和风格偏好。
- 不要把 RL 可能改善某些校准行为写成 RLHF 天然校准；课堂同时指出其可能破坏校准。

## 核验说明

全部20个ASR时间窗已读，结合官方PDF文本与第56页公式图核对；未直接逐秒核音。关于知识内在方向、模型已有行为的说法保留为讲者直觉而非已证明机制；标注者人口学结果仅概述实验限制，不作群体推断。

[官方视频](https://www.youtube.com/watch?v=2oH6PWPrYFo&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/15-2oH6PWPrYFo.en-orig.vtt) · [2026 官方 PDF](https://github.com/stanford-cs336/lectures/blob/main/lecture_15.pdf)
