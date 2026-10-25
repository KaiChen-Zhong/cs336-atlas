import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import catalog from "@/data/catalog.json";
import resources from "@/data/resources.json";
import { PATHS, STAGES, STATS } from "@/data/guide";
import type { LectureCard, Resource } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/")({ component: Home });

const lectures = catalog as LectureCard[];
const p0 = (resources as Resource[]).filter((r) => r.priority === "P0" && r.category.includes("入口"));

function Home() {
  const lastId = useProgress((s) => s.lastLectureId);
  const lastSeg = useProgress((s) => s.lastSegmentId);
  const done = useProgress((s) => s.done);
  const last = lectures.find((l) => l.id === lastId) ?? lectures[0];
  const start = lectures[0];

  return (
    <div>
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
            Stanford CS336 · Spring 2026
          </p>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] text-foreground">
            从零构建
            <br />
            语言模型
          </h1>
          <p className="mt-5 max-w-[540px] text-base leading-7 text-muted-foreground">
            把官方课表、作业仓库和 371 个视频时间窗收成一套可检索的学习工作台。先看主线，再按分钟定位难点，把概念带回代码与实验。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/notes/$lectureId" params={{ lectureId: start.id }}>
                开始第一讲
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/guide">查看学习路线</Link>
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          {[
            [STATS.lectures, "公开课程视频"],
            [STATS.durationLabel, "视频总时长"],
            [STATS.segments, "连续时间窗"],
            [STATS.questions, "课堂复习题"],
          ].map(([n, label]) => (
            <div key={String(label)} className="rounded-xl bg-card px-5 py-4 hairline">
              <dt className="text-[11px] tracking-wide text-muted-foreground">{label}</dt>
              <dd className="font-display mt-1 text-[1.7rem] tabular-nums leading-none text-foreground">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      {last ? (
        <section className="mt-10 rounded-xl bg-card p-5 hairline sm:p-6">
          <p className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase">
            {lastId ? "继续学习" : "从这里开始"}
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl text-foreground">
                {last.number} · {last.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {last.duration} · {last.segmentCount} 个时间窗 · {last.assignment}
              </p>
            </div>
            <Button asChild>
              <Link
                to="/notes/$lectureId"
                params={{ lectureId: last.id }}
                hash={lastId && lastSeg ? lastSeg : undefined}
              >
                <Play className="size-4" />
                打开笔记
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <h2 className="text-2xl">三种进入方式</h2>
        <p className="mt-2 max-w-[640px] text-sm text-muted-foreground">
          不必从第一秒看到最后一秒。选一条动线，再用搜索补缺口。
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PATHS.map((p, i) => (
            <Link
              key={p.id}
              to={p.href as "/"}
              className="group flex flex-col rounded-xl bg-card p-5 no-underline text-foreground hairline transition-colors duration-150 hover:bg-secondary"
            >
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-xl">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{p.use}</p>
              <p className="mt-4 text-sm text-primary">
                {p.cta}
                <ArrowRight className="ml-1 inline size-3.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">六个学习阶段</h2>
        <ol className="mt-6 grid gap-3">
          {STAGES.map((st) => {
            const lec = lectures.filter((l) => (st.lectures as readonly string[]).includes(l.id));
            const segs = lec.reduce((n, l) => n + l.segmentCount, 0);
            const finished = lec.filter((l) => {
              const prefix = `${l.id}-s-`;
              const have = Object.keys(done).filter((k) => k.startsWith(prefix)).length;
              return have >= l.segmentCount && l.segmentCount > 0;
            }).length;
            return (
              <li
                key={st.id}
                className="rounded-xl bg-card px-5 py-4 hairline sm:flex sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">
                    阶段 {st.id} · {st.assignment}
                  </p>
                  <h3 className="mt-1 text-lg">{st.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{st.question}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {lec.map((l) => (
                      <Link
                        key={l.id}
                        to="/notes/$lectureId"
                        params={{ lectureId: l.id }}
                        className="text-xs no-underline"
                      >
                        <Badge variant="outline">{l.number}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs tabular-nums text-muted-foreground sm:mt-0 sm:text-right">
                  {finished}/{lec.length} 讲完成
                  <br />
                  {segs} 个时间窗
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl">先收藏这 6 个入口</h2>
          <Link to="/resources" className="text-sm">
            全部资源
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {p0.slice(0, 6).map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-card p-5 no-underline text-foreground hairline hover:bg-secondary"
            >
              <div className="flex items-center gap-2">
                <Badge variant="p0">P0</Badge>
                <span className="text-sm font-medium">{r.title}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.purpose}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
