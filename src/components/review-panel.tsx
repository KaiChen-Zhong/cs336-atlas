import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Eye, EyeOff } from "lucide-react";
import type { ReviewPack } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineMd } from "@/components/inline-md";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Props = { lectureId: string; pack: ReviewPack };

export function ReviewPanel({ lectureId, pack }: Props) {
  const [tab, setTab] = useState<"q" | "p">("q");
  const [mode, setMode] = useState<"list" | "drill">("list");
  const [topic, setTopic] = useState("all");
  const [onlyGap, setOnlyGap] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [revealAll, setRevealAll] = useState(false);
  const quiz = useProgress((s) => s.quiz);
  const toggleQuiz = useProgress((s) => s.toggleQuiz);

  useEffect(() => {
    setTab("q");
    setMode("list");
    setTopic("all");
    setOnlyGap(false);
    setCursor(0);
    setRevealAll(false);
  }, [lectureId]);

  const topics = useMemo(() => {
    const seen: string[] = [];
    for (const item of pack.questions) {
      if (!seen.includes(item.topic)) seen.push(item.topic);
    }
    return seen;
  }, [pack.questions]);

  const questions = pack.questions.filter((item) => topic === "all" || item.topic === topic);
  const pool = onlyGap ? questions.filter((item) => !quiz[item.id]) : questions;
  const mastered = questions.filter((item) => quiz[item.id]).length;
  const safeCursor = pool.length ? Math.min(cursor, pool.length - 1) : 0;
  const current = pool[safeCursor];

  return (
    <section id="review" className="mt-12 scroll-mt-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">课堂自测</p>
          <h2 className="mt-1 text-2xl">复习问题与易错点</h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">
            先自己答，再展开解答。逐题自测一次只看一题；全部题目可以按大段筛，会了就标记。
          </p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {pack.questions.length} 题 · {pack.pitfalls.length} 个易错点
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabChip
          active={tab === "q" && mode === "list"}
          onClick={() => {
            setTab("q");
            setMode("list");
          }}
        >
          全部题目 {pack.questions.length}
        </TabChip>
        <TabChip
          active={tab === "q" && mode === "drill"}
          onClick={() => {
            setTab("q");
            setMode("drill");
            setCursor(0);
          }}
        >
          逐题自测
        </TabChip>
        <TabChip active={tab === "p"} onClick={() => setTab("p")}>
          易错点 {pack.pitfalls.length}
        </TabChip>
      </div>

      {tab === "q" ? (
        <>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <TabChip active={topic === "all"} onClick={() => setTopic("all")}>
                全部大段
              </TabChip>
              {topics.map((t, i) => (
                <TabChip
                  key={t}
                  active={topic === t}
                  onClick={() => {
                    setTopic(t);
                    setCursor(0);
                  }}
                >
                  {i + 1}. {t}
                </TabChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <TabChip
                active={onlyGap}
                onClick={() => {
                  setOnlyGap((v) => !v);
                  setCursor(0);
                }}
              >
                只看未会
              </TabChip>
              {mode === "list" ? (
                <Button size="sm" variant="ghost" onClick={() => setRevealAll((v) => !v)}>
                  {revealAll ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {revealAll ? "收起解答" : "展开全部解答"}
                </Button>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-xs tabular-nums text-muted-foreground">
            {questions.length} 题 · 已会 {mastered}
            {mode === "drill" && pool.length ? ` · 第 ${safeCursor + 1} / ${pool.length}` : ""}
          </p>
          {mode === "drill" ? (
            pool.length && current ? (
              <div className="mt-4">
                <ol>
                  <QuestionCard
                    key={current.id}
                    index={safeCursor + 1}
                    item={current}
                    forceOpen={false}
                    mastered={Boolean(quiz[current.id])}
                    onMaster={() => {
                      const was = Boolean(quiz[current.id]);
                      toggleQuiz(current.id);
                      if (!was && !onlyGap && safeCursor < pool.length - 1) setCursor(safeCursor + 1);
                    }}
                  />
                </ol>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={safeCursor === 0}
                    onClick={() => setCursor(Math.max(0, safeCursor - 1))}
                  >
                    上一题
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={safeCursor >= pool.length - 1}
                    onClick={() => setCursor(Math.min(pool.length - 1, safeCursor + 1))}
                  >
                    下一题
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                这一组都标记会了。换一个大段，或关掉「只看未会」。
              </p>
            )
          ) : (
            <ol className="mt-4 space-y-3">
              {pool.map((item, i) => (
                <QuestionCard
                  key={item.id}
                  index={i + 1}
                  item={item}
                  forceOpen={revealAll}
                  mastered={Boolean(quiz[item.id])}
                  onMaster={() => toggleQuiz(item.id)}
                />
              ))}
            </ol>
          )}
        </>
      ) : (
        <ol className="mt-5 space-y-3">
          {pack.pitfalls.map((item, i) => (
            <PitfallCard key={item.id} index={i + 1} item={item} />
          ))}
        </ol>
      )}
      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        解答根据本讲笔记与字幕要点整理，用来自测，不是官方作业标准答案。公式以讲义与一手来源为准。
      </p>
      <span className="sr-only">{lectureId}</span>
    </section>
  );
}

function TabChip({
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

function QuestionCard({
  index,
  item,
  forceOpen,
  mastered,
  onMaster,
}: {
  index: number;
  item: ReviewPack["questions"][number];
  forceOpen: boolean;
  mastered: boolean;
  onMaster: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(forceOpen);
  }, [forceOpen]);
  const shown = open;
  return (
    <li className="rounded-xl bg-card hairline">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{String(index).padStart(2, "0")}</span>
          <Badge variant="outline">{item.topic}</Badge>
        </div>
        <p className="mt-2 text-[15px] leading-7">
          <InlineMd text={item.q} />
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {shown ? "收起解答" : "显示解答"}
            <ChevronDown className={cn("size-3.5 transition-transform", shown && "rotate-180")} />
          </Button>
          <Button size="sm" variant={mastered ? "default" : "ghost"} onClick={onMaster}>
            <Check className="size-3.5" />
            {mastered ? "已会" : "我会了"}
          </Button>
        </div>
      </div>
      {shown ? (
        <div className="border-t border-border bg-secondary/60 px-5 py-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase">解答</p>
          <p className="mt-2 text-sm leading-7">
            <InlineMd text={item.a} />
          </p>
        </div>
      ) : null}
    </li>
  );
}

function PitfallCard({ index, item }: { index: number; item: ReviewPack["pitfalls"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl bg-card hairline">
      <div className="px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">{String(index).padStart(2, "0")}</span>
          <p className="text-[11px] font-medium tracking-[0.14em] text-warn uppercase">易错</p>
        </div>
        <p className="mt-2 text-[15px] leading-7">
          <InlineMd text={item.trap} />
        </p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen((v) => !v)}>
          {open ? "收起纠正" : "正确理解"}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </Button>
      </div>
      {open ? (
        <div className="border-t border-border bg-secondary/60 px-5 py-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase">正确理解</p>
          <p className="mt-2 text-sm leading-7">
            <InlineMd text={item.correct} />
          </p>
        </div>
      ) : null}
    </li>
  );
}
