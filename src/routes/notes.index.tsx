import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { STAGES } from "@/data/guide";
import catalog from "@/data/catalog.json";
import searchIndex from "@/data/search-index.json";
import reviewCounts from "@/data/review-counts.json";
import type { LectureCard, SearchHit } from "@/data/types";
import { countDone, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notes/")({ component: NotesIndex });

const lectures = catalog as LectureCard[];
const index = searchIndex as SearchHit[];
const counts = reviewCounts as Record<string, { q: number; p: number }>;

function NotesIndex() {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<number | "all">("all");
  const done = useProgress((s) => s.done);
  const quiz = useProgress((s) => s.quiz);
  const query = q.trim().toLocaleLowerCase();

  const matchIds = useMemo(() => {
    if (!query) return null;
    const terms = query.split(/\s+/).filter(Boolean);
    const ids = new Set<string>();
    for (const hit of index) {
      if (terms.every((t) => hit.search.includes(t))) ids.add(hit.lectureId);
    }
    return ids;
  }, [query]);

  const visible = lectures.filter((l) => {
    if (stage !== "all" && l.stage !== stage) return false;
    if (matchIds && !matchIds.has(l.id)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="视频逐段笔记"
        title="18 讲，按 4 分钟窗检索"
        description="先读大段主线，再点开不熟的时间窗回放官方录像。每讲底部有课堂复习题和解答：先自测，再对照。"
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题、要点、关键词…"
          aria-label="搜索笔记"
          className="sm:max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          {visible.length} 讲
          {query ? "匹配" : ""}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip active={stage === "all"} onClick={() => setStage("all")}>
          全部
        </FilterChip>
        {STAGES.map((s) => (
          <FilterChip key={s.id} active={stage === s.id} onClick={() => setStage(s.id)}>
            {s.id}. {s.title}
          </FilterChip>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((l) => {
          const ids = index.filter((h) => h.kind === "segment" && h.lectureId === l.id).map((h) => h.id);
          const n = countDone(ids, done);
          const pct = l.segmentCount ? Math.round((n / l.segmentCount) * 100) : 0;
          const qn = counts[l.id]?.q ?? 0;
          const prefix = `${l.id}-q`;
          let got = 0;
          for (const id of Object.keys(quiz)) if (id.startsWith(prefix) && quiz[id]) got += 1;
          return (
            <Link
              key={l.id}
              to="/notes/$lectureId"
              params={{ lectureId: l.id }}
              className="group flex flex-col rounded-xl bg-card p-5 no-underline text-foreground hairline hover:bg-secondary"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase">{l.number}</p>
                <Badge variant="outline">{l.assignment}</Badge>
              </div>
              <h2 className="mt-2 text-xl leading-snug">{l.title}</h2>
              <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{l.intro}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {l.duration} · {l.segmentCount} 窗 · 已会 {got}/{qn}
                </span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          没有匹配的讲次。试试更短的关键词，或清空筛选。
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hairline",
      )}
    >
      {children}
    </button>
  );
}
