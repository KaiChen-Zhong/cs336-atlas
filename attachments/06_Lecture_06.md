# L06｜核函数、Triton与性能测量实践

Spring 2026 · 01:26:41 · 22 个时间窗

[官方视频](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/06-xnDHaNUvHBg.en-orig.vtt) · [官方可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_06) · [官方讲义源码](https://github.com/stanford-cs336/lectures/blob/main/lecture_06.py) · [讲义引用：Triton融合Softmax教程](https://triton-lang.org/main/getting-started/tutorials/02-fused-softmax.html)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

先用benchmark和profiler定位成本，再从GELU、softmax、长行求和到matmul，逐步理解Triton块级编程。

## 核心收获

- 先确认正确性并测量瓶颈，再选择内置实现、编译或自写kernel。
- Triton中的逻辑块、tile和物理线程不是同一概念，索引、mask和stride决定正确的数据访问。
- 融合与分块复用是贯穿例子的核心；降低硬件占用率有时也能换来更多有效工作。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=0s) | GPU抽象与性能限制 | 复习块、warp和存储层级，说明占用率、bank冲突与合并访问。 |
| [00:20:00–00:36:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=1200s) | Benchmark、Profiler与融合证据 | 建立可靠测量流程，再解释朴素、内置和编译GELU的差异。 |
| [00:36:00–00:56:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=2160s) | 第一个Triton Kernel与PTX | 用GELU走通grid、指针、mask、加载存储及编译后的线程行为。 |
| [00:56:00–01:12:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=3360s) | 行级Softmax和长行归约 | 从一行装入单块扩展到逐tile循环，同时区分program与tile。 |
| [01:12:00–01:24:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=4320s) | 分块Matmul与融合ReLU | 用共享复用提高算术强度，并把stride和tile循环落实到代码结构。 |
| [01:24:00–01:26:41](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=5040s) | 工具选择与多GPU入口 | 讨论替代DSL，强调按实际工作负载决定粒度。 |

## 00:00:00–00:20:00｜GPU抽象与性能限制

复习块、warp和存储层级，说明占用率、bank冲突与合并访问。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=0s)｜GPU层级与核函数启动

- 每个SM拥有有限寄存器和近端共享内存，L2由全芯片共享，HBM容量大而访问较慢；硬件世代变化不能抹平层级差。
- GPU kernel启动一个grid，grid由thread block/CTA组成，block内部有线程；先明确程序抽象，再看硬件映射。

关键词：HBM · SM · Block · GPU

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=240s)｜为什么需要Thread Block

- 逐元素运算可让线程各做各的，softmax和matmul却需要归约或数据复用，反复通过HBM交换会很慢。
- Block让同一SM上的线程通过共享内存合作；Triton把这种块级工作作为编程单位，隐藏许多线程同步细节。

关键词：Triton · HBM · SM · Block · Softmax

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=480s)｜Warp、延迟隐藏与占用率

- 一个warp有32线程，分歧分支会串行处理不同活跃线程；SM可在等待内存的warp之外调度其他就绪warp。
- 每线程寄存器越多，能同时驻留的线程可能越少；occupancy影响延迟隐藏，但高occupancy并非性能充分条件。

关键词：SM · Warp

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=720s)｜线程粗化与Bank Conflict

- 128线程块、每线程160寄存器时，65536寄存器仅够3块，即12/64=18.75% warp occupancy；粗化可让少线程做更多事。
- 共享内存分bank，不同线程访问同bank的不同地址会串行；32线程沿冲突列读取可形成最坏32路冲突。

关键词：Warp

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=960s)｜Coalescing与执行尾部

- Swizzling可重排共享内存来减少bank冲突；HBM coalescing则合并相邻地址访问，二者属于不同存储层的问题。
- 若工作块数与设备可同时处理的块数不匹配，末波会闲置部分SM；示例波次分析需结合每块资源占用。

关键词：HBM · SM

## 00:20:00–00:36:00｜Benchmark、Profiler与融合证据

建立可靠测量流程，再解释朴素、内置和编译GELU的差异。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=1200s)｜先量后改的优化流程

- 程序抽象可保持整洁，性能却依赖SM数、寄存器、共享内存和调度；先benchmark/profile，再决定是否写kernel。
- Benchmark给端到端耗时，可比较不同形状扩展趋势；测试应把输入准备等非目标工作与核心计算分开。

关键词：SM

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=1440s)｜可靠计时与Profiler

- 计时前warmup排除惰性编译和初始化；用CUDA events记录并同步，多次测量后看平均值或分布。
- PyTorch profiler揭示高层表达式调用的底层kernel；即使暂不优化，观察调用也能检查代码实际在做什么。

关键词：CUDA · PyTorch

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=1680s)｜内核名称与GELU三种写法

- 相同matmul表达式会随矩阵形状选择不同tile和kernel；名称可能暴露架构、数值类型与tile尺寸。
- GELU可直接展开公式、调用内置函数或torch.compile；先用相同近似设置验证输出，再比较速度。

关键词：GELU

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=1920s)｜为什么融合后的GELU快

- 朴素PyTorch公式拆成多个kernel，每步都可能读写HBM；内置GELU以专用kernel融合，减少中间结果搬运。
- torch.compile也能生成单个Triton kernel，但此设备上的实测仍略慢于内置版；编译并不保证超过专用实现。

关键词：GELU · Triton · HBM · PyTorch

## 00:36:00–00:56:00｜第一个Triton Kernel与PTX

用GELU走通grid、指针、mask、加载存储及编译后的线程行为。

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=2160s)｜CUDA与Triton抽象差异

- CUDA偏向描述每线程做什么，复杂合作需管理同步；Triton描述一块数据的加载、运算、存储，编译器分配线程。
- Triton适合常见Transformer计算，极新硬件特性可能需其他DSL或更低层手段；先从简单逐元素GELU开始。

关键词：Transformer · GELU · Triton · CUDA

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=2400s)｜分配输出与Grid定位

- Host侧先分配输出张量，kernel通过指针写入；向量按BLOCK_SIZE分成逻辑块，以向上取整确定grid大小。
- kernel用program_id识别当前块，start=pid×BLOCK_SIZE定位负责数据；这里的块大小表示逻辑元素数量。

关键词：Block

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=2640s)｜Offsets、Mask与Load/Store

- offsets=start+arange(0,BLOCK_SIZE)，mask限制offsets<num_elements；尾块不足整块时，必须屏蔽越界读写。
- tl.load取得输入，执行GELU后tl.store输出；这种块式表达不同于逐元素Python循环，底层分配由编译器完成。

关键词：GELU · Block

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=2880s)｜Triton如何下降到PTX

- Triton源码描述计算，不是在GPU上逐条调用Python库；编译后可检查PTX线程级中间表示了解实际展开。
- PTX中的ld.global、寄存器和store展示数据从全局存储进入计算再写回；局部变量不必固定落在共享内存。

关键词：Triton · PTX · GPU

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=3120s)｜线程粗化与调度细节

- 示例PTX让单线程处理8个元素，体现编译器采用线程粗化；同一段代码通过block/thread ID处理不同位置。
- PTX仍不决定全部SM和warp调度，底层硬件选择就绪工作；看汇编有助理解，通常无须从手写PTX开始。

关键词：PTX · SM · Warp · Block

## 00:56:00–01:12:00｜行级Softmax和长行归约

从一行装入单块扩展到逐tile循环，同时区分program与tile。

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=3360s)｜从逐元素转到行归约

- 等待load的warp可被其他就绪warp替换以隐藏延迟；接着研究一行数据共同参与的softmax，不能独立处理元素。
- 稳定softmax依次取行最大值、相减、指数、求和、相除；朴素实现多次启动kernel，产生重复HBM读写。

关键词：HBM · Warp · Softmax

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=3600s)｜一行装入一个Block的Softmax

- 令每个program负责一行，列数向上补到2的幂；传入行stride构造地址，载入整行后在块内完成归约。
- 越界列用负无穷填充，使其指数贡献为零；求最大值、指数和、除法后只写回有效列，避免中间矩阵落HBM。

关键词：HBM · Block · Softmax

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=3840s)｜行太长时先用Row Sum练习

- 若整行无法放入一个逻辑处理块，保留每行一个program，并把列切成多个tile逐个遍历。
- 课堂此时从softmax改为更简单的row sum；每个逻辑位置累加各tile对应元素，最后再对累加向量归约。

关键词：Softmax

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=4080s)｜Tile循环与Block区别

- 每轮计算新的列offsets、masked load并累加，循环结束tl.sum得到行标量；超出行末的元素应贡献零。
- GELU的不同片段是独立program，row sum的tile却由同一program顺序处理；tile数不等于grid块数。

关键词：GELU · Block

## 01:12:00–01:24:00｜分块Matmul与融合ReLU

用共享复用提高算术强度，并把stride和tile循环落实到代码结构。

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=4320s)｜朴素Matmul为何带宽效率低

- 逐输出元素遍历K虽正确，却反复从HBM读相同A行、B列，读取量与MKN同阶，算术强度难以增长。
- 理想方案把A、B全放快存储，仅各读一次，可提升强度；实际大矩阵装不下，因此需要部分复用。

关键词：HBM

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=4560s)｜分块Matmul与Stride

- 每个program负责C的一个输出tile，沿K维载入A/B子块并累加；不同输出tile由独立program计算。
- 张量地址由各维索引乘stride再相加，转置会改变stride；完成累加后可顺便施加ReLU再写回，减少一次读写。

关键词：ReLU

### [01:20:00–01:24:00](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=4800s)｜Triton Matmul实现与总结

- 按输出块ID构造A行、B列和K偏移，循环tl.load、tl.dot、更新指针；块内累计后融合激活并存输出。
- 真正性能仍受有限寄存器、bank、SM数约束；GELU、行归约、长行循环、matmul逐步建立写高效kernel的能力。

关键词：GELU · Triton · SM

## 01:24:00–01:26:41｜工具选择与多GPU入口

讨论替代DSL，强调按实际工作负载决定粒度。

### [01:24:00–01:26:41](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=5040s)｜替代DSL与下一步

- Triton外还有CUDA、CuTe、ThunderKittens及PTX等选择，各自对布局、特性和控制提供不同取舍。
- 高维张量该整体加载还是分块，取决于具体计算与容量；本讲结束单GPU编程，下一讲进入多GPU。

关键词：Triton · CUDA · PTX · GPU

## 复习问题

1. BLOCK_SIZE=1024是否代表1024个CUDA线程？如何从PTX或编译结果检查真实映射？
2. 为什么softmax尾部mask用−∞，row sum尾部mask却用0？
3. 矩阵乘kernel怎样沿K轴复用A/B tile，融合ReLU又节省哪一次中间访问？

## 易错点

- 把Triton局部张量都当共享内存，或把逻辑BLOCK_SIZE直接当线程数。
- 只测一次、未warmup或未同步，误把编译/启动时间或异步提交时间当执行时间。
- 看到视频标题含XLA便假定讲授XLA：本次公开录制主体是Triton与PyTorch测量，没有独立XLA教程。

## 核验说明

基于Young-Lord公开ASR镜像逐窗整理，官方源码校核，未直接验证音频。口述中BLOCK_SIZE与线程数、局部累加器与共享内存有简化，正文按编程语义区分；标题含XLA但录制无独立XLA讲解，未按标题补写内容。

[官方视频](https://www.youtube.com/watch?v=xnDHaNUvHBg&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/06-xnDHaNUvHBg.en-orig.vtt) · [官方可执行讲义](https://cs336.stanford.edu/lectures/?trace=lecture_06) · [官方讲义源码](https://github.com/stanford-cs336/lectures/blob/main/lecture_06.py) · [讲义引用：Triton融合Softmax教程](https://triton-lang.org/main/getting-started/tutorials/02-fused-softmax.html)
