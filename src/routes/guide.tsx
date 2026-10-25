import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EXPERIMENT_FIELDS, PATHS, STAGES, STATS, STEPS, STUCK } from "@/data/guide";
import catalog from "@/data/catalog.json";
import type { LectureCard } from "@/data/types";

export const Route = createFileRoute("/guide")({ component: GuidePage });

const lectures = catalog as LectureCard[];

function GuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="学习路线"
        title="按问题进入，而不是按播放进度进入"
        description={`18 个公开视频合计 ${STATS.durationLabel}。纯播放 1.5 倍速约 16 小时，不含暂停、复习与作业。公式推导适合降速。不要用“看完”替代掌握。`}
      />

      <section>
        <h2 className="text-2xl">三种投入方式</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PATHS.map((p) => (
            <Link
              key={p.id}
              to={p.href as "/"}
              className="flex flex-col rounded-xl bg-card p-5 no-underline text-foreground hairline hover:bg-secondary"
            >
              <h3 className="text-xl">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.use}</p>
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">完成标准 · </span>
                {p.done}
              </p>
              <p className="mt-4 text-sm text-primary">
                {p.cta}
                <ArrowRight className="ml-1 inline size-3.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">六个学习阶段</h2>
        <div className="mt-5 grid gap-4">
          {STAGES.map((st) => {
            const lec = lectures.filter((l) => (st.lectures as readonly string[]).includes(l.id));
            return (
              <article key={st.id} className="rounded-xl bg-card p-5 hairline md:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl">
                    {st.id}. {st.title}
                  </h3>
                  <Badge variant="pine">{st.assignment}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6">
                  <span className="text-muted-foreground">先带着这个问题看 · </span>
                  {st.question}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{st.practice}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lec.map((l) => (
                    <Link
                      key={l.id}
                      to="/notes/$lectureId"
                      params={{ lectureId: l.id }}
                      className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm no-underline text-foreground hover:bg-muted"
                    >
                      {l.number} {l.title}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">每讲只做这四步</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl bg-card p-5 hairline">
              <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-lg">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">常见卡点</h2>
        <div className="mt-5 overflow-x-auto rounded-xl bg-card hairline">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">卡点</th>
                <th className="px-4 py-3 font-medium">首看</th>
              </tr>
            </thead>
            <tbody>
              {STUCK.map((row) => (
                <tr key={row.issue} className="border-t border-border">
                  <td className="px-4 py-3 align-top">{row.issue}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{row.look}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">每次实验最低记录项</h2>
        <p className="mt-2 text-sm text-muted-foreground">一次先改一个可解释的因素。</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {EXPERIMENT_FIELDS.map((f) => (
            <li key={f}>
              <Badge variant="outline">{f}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
