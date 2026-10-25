import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink, Play } from "lucide-react";
import lecturesData from "@/data/lectures.json";
import catalog from "@/data/catalog.json";
import reviewsData from "@/data/reviews.json";
import type { Lecture, LectureCard, ReviewPack } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineMd } from "@/components/inline-md";
import { ReviewPanel } from "@/components/review-panel";
import { countDone, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notes/$lectureId")({ component: LecturePage });

const lectures = lecturesData as Lecture[];
const cards = catalog as LectureCard[];
const reviews = reviewsData as Record<string, ReviewPack>;

function LecturePage() {
  const { lectureId } = Route.useParams();
  const lecture = lectures.find((l) => l.id === lectureId);
  if (!lecture) throw notFound();

  const [q, setQ] = useState("");
  const [expand, setExpand] = useState<"default" | "all" | "none">("default");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const visit = useProgress((s) => s.visit);
  const toggleSegment = useProgress((s) => s.toggleSegment);
  const markMany = useProgress((s) => s.markMany);
  const done = useProgress((s) => s.done);

  useEffect(() => {
    visit(lecture.id);
    document.title = `${lecture.number} · ${lecture.title} · CS336 Atlas`;
  }, [lecture.id, lecture.number, lecture.title, visit]);

  const allSegIds = lecture.macros.flatMap((m) => m.segments.map((s) => s.id));
  const finished = countDone(allSegIds, done);
  const query = q.trim().toLocaleLowerCase();

  useEffect(() => {
    if (query) setExpand("all");
  }, [query]);

  useEffect(() => {
    setOpenMap({});
  }, [expand, query, lecture.id]);

  useEffect(() => {
    const applyHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!hash) return;
      const macro = lecture.macros.find((m) => m.segments.some((s) => s.id === hash));
      if (macro) {
        setOpenMap((m) => (m[macro.id] ? m : { ...m, [macro.id]: true }));
      }
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ block: "start" });
      }, 80);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [lecture.id, lecture.macros]);

  const filtered = useMemo(() => {
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) return lecture.macros;
    return lecture.macros
      .map((m) => ({
        ...m,
        segments: m.segments.filter((s) => terms.every((t) => s.searchText.includes(t))),
      }))
      .filter((m) => m.segments.length);
  }, [lecture, query]);

  const idx = cards.findIndex((c) => c.id === lecture.id);
  const prev = idx > 0 ? cards[idx - 1] : null;
  const next = idx >= 0 && idx < cards.length - 1 ? cards[idx + 1] : null;
  const pack = reviews[lecture.id];

  return (
    <article>
      <Link to="/notes" className="inline-flex h-11 items-center gap-2 text-sm text-muted-foreground no-underline hover:text-foreground">
        <ArrowLeft className="size-4" />
        全部讲次
      </Link>

      <header className="mt-4">
        <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
          {lecture.number} · {lecture.duration} · {lecture.segmentCount} 窗 · {lecture.assignment}
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.15]">{lecture.title}</h1>
        <p className="mt-3 max-w-[68ch] text-[15px] leading-7 text-muted-foreground">{lecture.intro}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <a href={lecture.youtubeUrl} target="_blank" rel="noreferrer">
              <Play className="size-4" />
              观看录像
            </a>
          </Button>
          {lecture.materials.slice(1, 4).map((m) => (
            <Button key={m.href} variant="outline" asChild>
              <a href={m.href} target="_blank" rel="noreferrer">
                {m.label.replace(/官方/, "")}
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ))}
          {pack ? (
            <Button variant="outline" asChild>
              <a href="#review">本讲自测</a>
            </Button>
          ) : null}
        </div>
      </header>

      <section className="mt-8 rounded-xl bg-secondary/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg">核心收获</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {finished}/{lecture.segmentCount} 窗已读
          </span>
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {lecture.takeaways.map((t) => (
            <li key={t}>
              <InlineMd text={t} />
            </li>
          ))}
        </ul>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-card">
          <div
            className="h-full bg-primary"
            style={{ width: `${lecture.segmentCount ? (finished / lecture.segmentCount) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => markMany(allSegIds, true)}>
            标记本讲已读
          </Button>
          <Button size="sm" variant="ghost" onClick={() => markMany(allSegIds, false)}>
            清除本讲
          </Button>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="筛选本讲时间窗…"
          aria-label="筛选时间窗"
          className="sm:max-w-xs"
        />
        <Button size="sm" variant="ghost" onClick={() => setExpand((v) => (v === "all" ? "none" : "all"))}>
          {expand === "all" ? "收起大段" : "展开全部大段"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {filtered.reduce((n, m) => n + m.segments.length, 0)} 个时间窗
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((macro, i) => {
          const shouldOpen =
            macro.id in openMap
              ? openMap[macro.id]
              : expand === "all" || Boolean(query) || (expand === "default" && i === 0);
          return (
            <details
              key={macro.id}
              className="group rounded-xl bg-card hairline"
              open={shouldOpen}
              onToggle={(e) => {
                const next = e.currentTarget.open;
                setOpenMap((m) => (m[macro.id] === next ? m : { ...m, [macro.id]: next }));
              }}
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {macro.start}–{macro.end}
                    </span>
                    <h3 className="text-lg">{macro.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{macro.summary}</p>
                </div>
                <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div>
                {macro.segments.map((seg) => {
                  const checked = Boolean(done[seg.id]);
                  return (
                    <section key={seg.id} id={seg.id} className="border-t border-border px-5 py-5 scroll-mt-20">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <a
                            href={seg.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs font-medium"
                          >
                            {seg.start}–{seg.end}
                          </a>
                          <h4 className="mt-1 text-base font-medium">{seg.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            toggleSegment(seg.id);
                            visit(lecture.id, seg.id);
                          }}
                          className={cn(
                            "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs",
                            checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Check className="size-3.5" />
                          {checked ? "已读" : "标记"}
                        </button>
                      </div>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                        {seg.bullets.map((b) => (
                          <li key={b}>
                            <InlineMd text={b} />
                          </li>
                        ))}
                      </ul>
                      {seg.keywords.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {seg.keywords.map((k) => (
                            <Badge key={k} variant="outline">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          本讲没有匹配的时间窗。
        </p>
      ) : null}

      {pack ? <ReviewPanel lectureId={lecture.id} pack={pack} /> : null}

      {lecture.verification ? (
        <p className="mt-6 text-xs leading-5 text-muted-foreground">{lecture.verification}</p>
      ) : null}

      <nav className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <Button variant="outline" asChild>
            <Link to="/notes/$lectureId" params={{ lectureId: prev.id }}>
              <ArrowLeft className="size-4" />
              {prev.number} {prev.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button variant="outline" asChild>
            <Link to="/notes/$lectureId" params={{ lectureId: next.id }}>
              {next.number} {next.title}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </nav>
    </article>
  );
}
