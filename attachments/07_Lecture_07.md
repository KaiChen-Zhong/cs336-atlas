# L07｜并行基础：集体通信与三种并行训练

Spring 2026 · 01:21:03 · 21 个时间窗

[官方视频](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/07-SzpOcwdIL0Y.en-orig.vtt) · [官方交互讲义](https://cs336.stanford.edu/lectures/?trace=lecture_07) · [官方代码讲义（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_07.py)

> 整理依据：带时间戳的自动英文字幕镜像＋可取得的官方讲义。不是人工逐帧听校稿。4 分钟窗用于检索，可能横跨自然话题；最后一窗可能较短。

从GPU互连层级与collective原语出发，用最小MLP实现理解DDP、张量并行、流水线并行的切分和通信成本。

## 核心收获

- 掌握all-reduce = reduce-scatter + all-gather及各自输入输出分布。
- DDP按数据切、TP按层内维度切、PP按层切，通信位置与内存收益不同。
- 基准测试必须处理CUDA和多进程两层异步，硬件拓扑决定并行方案。

## 大段导航

| 时间 | 大段主题 | 主线 |
|---|---|---|
| [00:00:00–00:20:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=0s) | 动机与集体通信原语 | 把多卡训练转成数据放置问题，逐一建立八种通信模式。 |
| [00:20:00–00:36:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=1200s) | 互连、RDMA与通信软件栈 | 理解节点内与跨节点带宽差异，以及NCCL如何实现collective。 |
| [00:36:00–00:56:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=2160s) | PyTorch通信实作与基准测试 | 运行进程组和基础collective，正确同步并换算通信带宽。 |
| [00:56:00–01:08:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=3360s) | 数据并行与张量并行 | 对比复制全模型后平均梯度，以及切分权重后交换激活。 |
| [01:08:00–01:21:03](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=4080s) | 流水线、重叠与组合策略 | 用micro-batch减少流水线空闲，并将并行选择映射到硬件拓扑。 |

## 00:00:00–00:20:00｜动机与集体通信原语

把多卡训练转成数据放置问题，逐一建立八种通信模式。

### [00:00:00–00:04:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=0s)｜为何需要多GPU

- 多GPU解决两种需求：模型状态或激活超出单卡显存，以及模型虽能装下但希望缩短训练时间。
- 单卡访存层级扩展成跨卡通信层级；核心仍是安排计算与数据位置，避免搬运成为瓶颈。

关键词：并行

### [00:04:00–00:08:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=240s)｜分布式编程模型

- rank在本课对应一张GPU，world size表示设备数量；同一程序在不同rank上异步运行。
- collective用整体通信模式描述数据交换；本讲先学通信原语，再用MLP实现三种并行切法。

关键词：collective

### [00:08:00–00:12:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=480s)｜基础集体通信

- broadcast把根节点张量复制给各rank；scatter分发不同切片，gather把各rank切片汇总到指定节点。
- reduce用求和等归约运算合并各rank数据，只在目标rank保留结果；与gather的拼接操作区别明确。

关键词：broadcast

### [00:12:00–00:16:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=720s)｜All-gather与Reduce-scatter

- all-gather将分片拼接后的完整结果复制到所有rank，适用于分片参数在计算前临时恢复。
- reduce-scatter先对对应位置求和，再把结果分片分给各rank；随后all-gather即可得到all-reduce。

关键词：all-reduce

### [00:16:00–00:20:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=960s)｜All-to-all与专家路由

- all-reduce让所有rank得到相同归约结果；拆成reduce-scatter加all-gather，可插入分片状态更新。
- all-to-all按目标rank交换各自数据，均衡情形像矩阵转置；MoE通过它将token激活送往所在专家。

关键词：MoE

## 00:20:00–00:36:00｜互连、RDMA与通信软件栈

理解节点内与跨节点带宽差异，以及NCCL如何实现collective。

### [00:20:00–00:24:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=1200s)｜从原语转向互连硬件

- collective的根节点由调用参数指定，并非永远固定某张GPU；这些概念对应实际可调用接口。
- 普通PCIe、跨机以太网与数据中心NVLink/NVSwitch构成不同通信环境，拓扑会限制扩展效率。

关键词：互连

### [00:24:00–00:28:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=1440s)｜带宽层级与RDMA

- 以课件B200示例，HBM约8 TB/s、NVLink 5约1.8 TB/s；跨节点InfiniBand带宽进一步下降。
- 传统网络路径需CPU缓冲和封包；RDMA允许远端内存读写绕过CPU，减少数据复制与额外延迟。

关键词：RDMA

### [00:28:00–00:32:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=1680s)｜NVLink域与NCCL

- NVL72把72张GPU纳入同一NVLink域；RoCE将RDMA带到以太网，说明协议与物理互连需分开理解。
- NCCL发现硬件拓扑、选择GPU间路径，再启动通信kernel，将all-reduce等请求落实成底层传输。

关键词：NCCL

### [00:32:00–00:36:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=1920s)｜拓扑决定扩卡收益

- RDMA描述远端内存访问能力，NVLink、InfiniBand等提供相应实现路径，两者不是同一层概念。
- 第9张GPU若落在慢互连节点，可能增加通信负担却只增加少量算力；设备数量不能单独判断收益。

关键词：拓扑

## 00:36:00–00:56:00｜PyTorch通信实作与基准测试

运行进程组和基础collective，正确同步并换算通信带宽。

### [00:36:00–00:40:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=2160s)｜初始化PyTorch进程组

- torch.distributed提供统一接口，GPU常用NCCL、CPU可用Gloo；master地址和端口用于协调元数据。
- spawn启动world size个进程，barrier等待各rank到达；过多barrier会制造本可避免的等待。

关键词：torch.distributed

### [00:40:00–00:44:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=2400s)｜通信API的输入输出

- 示例all_reduce原地修改张量，将各rank的不同输入变成相同求和结果；打印顺序仍由进程调度决定。
- reduce_scatter_tensor显式接收输入与预分配输出，归约后的不同片段落到不同rank。

关键词：API

### [00:44:00–00:48:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=2640s)｜异步通信与计时准备

- async_op允许提交通信后处理独立工作，使用结果前仍须等待完成；这是通信与计算重叠的基础。
- all-gather实验证明两阶段组合等价all-reduce；基准测试先预热，并同步CUDA执行与各进程。

关键词：异步

### [00:48:00–00:52:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=2880s)｜测量有效通信带宽

- 以输入字节数S、设备数P、耗时t计算all-reduce带宽：2S(P−1)/(Pt)，而非直接用S/t。
- 大P时归一化系数趋近2；此指标便于比较通信效率，但实际耗时仍受硬件拓扑与实现影响。

关键词：带宽

### [00:52:00–00:56:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=3120s)｜同步边界与并行训练入口

- reduce-scatter约搬运all-reduce一半数据、耗时也约一半，因此换算后的有效带宽应相近。
- CUDA异步执行与多进程异步是两层问题；确认计时边界后，开始按数据、张量和层划分MLP。

关键词：基准测试

## 00:56:00–01:08:00｜数据并行与张量并行

对比复制全模型后平均梯度，以及切分权重后交换激活。

### [00:56:00–01:00:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=3360s)｜数据并行完整训练循环

- 将128条样本均分到4个rank，每卡处理32条；各卡持有完整模型参数及自身优化器状态。
- 各卡独立前反向，再对每个参数梯度all-reduce取平均，最后执行相同优化器更新。

关键词：DDP

### [01:00:00–01:04:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=3600s)｜DDP一致性与显存限制

- 局部数据不同导致loss、原始梯度不同；平均梯度配合同步初始化，让各rank参数保持一致。
- DDP对模型内部结构要求很少，但完整状态仍须装入每卡；随后引出FSDP/ZeRO及按列切权重。

关键词：DDP

### [01:04:00–01:08:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=3840s)｜列张量并行前向

- 每卡仅保存权重矩阵一组列，用完整输入算出局部输出；逐元素GELU可在局部直接完成。
- 每层all-gather局部激活并沿特征维拼接，恢复下一层所需完整输入；代价是逐层激活通信。

关键词：张量并行

## 01:08:00–01:21:03｜流水线、重叠与组合策略

用micro-batch减少流水线空闲，并将并行选择映射到硬件拓扑。

### [01:08:00–01:12:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=4080s)｜反向通信与流水线切层

- 此处手写collective不会自动完成分布式反向；前向all-gather对应的反向归约需显式处理。
- 流水线并行把整层分给不同rank；再把batch切成micro-batch，依次接收、计算本地层并发送。

关键词：流水线

### [01:12:00–01:16:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=4320s)｜气泡与通信计算重叠

- 流水线某阶段等前驱激活时会闲置，形成bubble；micro-batch让不同阶段更早开始并发工作。
- 示例未实现异步收发；DDP也能在反向中梯度一旦就绪即开始通信，而不必等全部反向结束。

关键词：通信重叠

### [01:16:00–01:20:00](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=4560s)｜如何组合并行策略

- 张量并行逐层交换较大激活，通常放在NVLink域内；流水线更能容忍慢互连，但要控制气泡。
- 增大数据并行会碰到临界batch收益递减；实际需结合张量、数据、流水线及序列或专家并行。

关键词：并行策略

### [01:20:00–01:21:03](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=4800s)｜统一的存储与通信权衡

- DDP重复保存参数并执行优化器更新，以避免搬运优化器状态；冗余计算有时能换取更少通信。
- 本讲收束到统一取舍：重算、本地存储和远端存储各有成本，模型继续增大时层级结构仍重要。

关键词：权衡

## 复习问题

1. 为什么all-reduce可分解为reduce-scatter和all-gather？每步张量在哪些rank上？
2. DDP怎样在局部loss不同的情况下保持参数相同？局部batch不等大时平均该如何解释？
3. 为什么张量并行更需要快互连，而流水线并行首先要处理bubble？

## 易错点

- all-reduce平均的是梯度，不是本讲DDP每步重新广播模型参数。
- barrier不应笼统当作所有CUDA工作的计时保障；按依赖确认设备工作完成。
- 示例省略张量/流水线反向及生产级通信重叠，不能原样视为完整训练框架。

## 核验说明

逐窗依据Young-Lord镜像ASR转录，与官方lecture_07.py校正NCCL、Gloo、FSDP及带宽单位；未独立逐秒听校音频。字幕/讲义中的NVL72托盘数量描述不作硬件规格依据，仅保留72卡NVLink域。

[官方视频](https://www.youtube.com/watch?v=SzpOcwdIL0Y&t=0s) · [字幕镜像](https://github.com/Young-Lord/cs336-2026-notes/blob/6acde390f44488492fae5bd359d9d8081c3b26ac/raw/transcripts/07-SzpOcwdIL0Y.en-orig.vtt) · [官方交互讲义](https://cs336.stanford.edu/lectures/?trace=lecture_07) · [官方代码讲义（固定版本）](https://github.com/stanford-cs336/lectures/blob/8b59b50730766695c2ffedd1a79c50cd09b9eb91/lecture_07.py)
