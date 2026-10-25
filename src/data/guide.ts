export const STAGES = [
  {
    id: 1,
    title: "建模闭环",
    lectures: ["l01", "l02", "l03"],
    question: "文本如何被编码？模型怎样算下一个 token 的概率？梯度更新什么？",
    practice: "手算一次 BPE 合并；标注 Transformer 各层形状；验证小样本 loss 下降",
    assignment: "A1",
  },
  {
    id: 2,
    title: "架构选择",
    lectures: ["l04"],
    question: "Attention、有限状态模型与 MoE 分别改变哪种计算或内存成本？",
    practice: "同一上下文长度下，比较三类架构的状态增长与信息访问能力",
    assignment: "A1 理解扩展",
  },
  {
    id: 3,
    title: "系统效率",
    lectures: ["l05", "l06", "l07", "l08"],
    question: "慢在算术、访存、调度还是跨卡通信？",
    practice: "记录一次正确的 GPU benchmark；画出 DDP / TP / PP / FSDP 的数据与通信位置",
    assignment: "A2",
  },
  {
    id: 4,
    title: "预算与推理",
    lectures: ["l09", "l10", "l11"],
    question: "固定预算怎样选模型与数据？训练最优与部署最优为何可能不同？",
    practice: "用小表拟合损失趋势；分别估计 prefill 与 decode 的计算 / 访存成本",
    assignment: "A3；连接 A2",
  },
  {
    id: 5,
    title: "测量与数据",
    lectures: ["l12", "l13", "l14"],
    question: "分数可信度怎样判断？哪些文本值得训练，怎样验证过滤有效？",
    practice: "固定模型和预算做一次数据消融；检查样本、去重与验证集污染",
    assignment: "A4",
  },
  {
    id: 6,
    title: "后训练与服务",
    lectures: ["l15", "l16", "l17", "dan-fu"],
    question: "SFT、偏好学习、RLVR 的信号有何不同？推理服务怎样反过来影响模型设计？",
    practice: "解释一次策略更新中的采样、奖励和优势；比较吞吐与延迟目标",
    assignment: "A5 与可选补充",
  },
] as const;

export const PATHS = [
  {
    id: "map",
    title: "先建立全局地图",
    use: "按顺序读 18 份笔记的主线与核心收获；打不开的概念再看对应 4 分钟视频窗",
    done: "能解释一条文本如何变成可部署模型，以及每阶段消耗什么资源",
    href: "/notes",
    cta: "从笔记目录开始",
  },
  {
    id: "model",
    title: "先做出最小模型",
    use: "精学 L01–L03，完成 A1 的小样本训练闭环；按失败点回查 L02 的数值、形状和资源核算",
    done: "能自己从 token 输入走到 loss、更新、保存、生成；解释每个张量的形状",
    href: "/notes/l01",
    cta: "打开第一讲",
  },
  {
    id: "full",
    title: "系统掌握整门课",
    use: "依照六个阶段过完全部讲次；五个作业先做正确性与小规模实验，再按需要扩大规模",
    done: "每个模块留下代码、实验记录、结论与失败分析",
    href: "/guide",
    cta: "查看完整路线",
  },
] as const;

export const STEPS = [
  { title: "先读大段主线", body: "确认本讲解决的问题、前置概念与最终结论。" },
  {
    title: "按小段回放",
    body: "每个 4 分钟窗有时间链接；只针对不熟的推导、示例和问答回看。话题可能横跨相邻两窗。",
  },
  {
    title: "合上笔记复述",
    body: "先遮住解答做完本讲复习题；说不清的术语、条件或成本再回看对应时间窗。",
  },
  {
    title: "留一份证据",
    body: "公式手算、形状图、小测试、计时结果或数据样本，任选与本讲相符的一项。",
  },
] as const;

export const STUCK = [
  { issue: "分词器无法还原原文、特殊 token 处理混乱", look: "L01；A1 tokenizer 题面与测试" },
  { issue: "reshape、broadcast、einsum 看不懂", look: "L02；einops 官方教程" },
  { issue: "loss 变成 NaN，不知从哪查", look: "L02 数值精度；L03 归一化、初始化、学习率；A1 对应测试" },
  { issue: "算不清训练显存、参数量或 FLOPs", look: "L02；L03；需要分片时看 L08" },
  { issue: "GPU 占用低，优化没效果", look: "L05 硬件层级；L06 计时与 kernel；跨卡任务再看 L07–L08" },
  { issue: "分不清 ZeRO、FSDP、DDP、TP、PP", look: "L07 实作建立通信图；L08 比较状态切分与成本" },
  { issue: "训练越大越好，但预算如何分配不清楚", look: "L09、L11；A3 的小规模实验路径" },
  { issue: "服务吞吐提高，单请求却更慢", look: "L10；Dan Fu 嘉宾课，检查 batch、KV cache、调度与延迟约束" },
  { issue: "模型分数上升，不确定是否真的变好", look: "L12；L14 去重 / 污染；固定评测协议与随机性" },
  { issue: "RLHF、DPO、GRPO、RLVR 混成一团", look: "L15–L17；区分数据来源、奖励类型、优化目标" },
] as const;

export const EXPERIMENT_FIELDS = [
  "代码版本",
  "数据版本 / 切分",
  "随机种子",
  "模型配置",
  "dtype",
  "硬件",
  "训练 token / 步数",
  "耗时",
  "峰值显存",
  "验证指标",
  "生成样本",
] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  "1. 先收藏这 6 个入口": "核心入口",
  "2. 2026 官方逐讲材料": "逐讲材料",
  "3. 2026 作业、代码、测试与数据": "作业与数据",
  "4. 先修与工具文档：缺什么补什么": "先修与工具",
  "5. 论文、技术报告与评测": "论文与评测",
  "6. 中文辅助：与官方分开使用": "中文辅助",
  "7. 2025 历史补充与版本避坑": "2025 对照",
};

export const STATS = {
  lectures: 18,
  durationLabel: "24 小时 09 分",
  durationSeconds: 86996,
  segments: 371,
  references: 114,
  questions: 387,
  pitfalls: 208,
  verifiedOn: "2026-09-08",
};

