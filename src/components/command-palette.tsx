import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Clock, Library, Search } from "lucide-react";
import searchIndex from "@/data/search-index.json";
import resources from "@/data/resources.json";
import type { Resource, SearchHit } from "@/data/types";
import { cn } from "@/lib/utils";

const PAGES = [
  { href: "/", title: "首页", hint: "总览、三种路线、继续学习" },
  { href: "/guide", title: "学习路线", hint: "六个阶段与卡点对照" },
  { href: "/notes", title: "视频笔记", hint: "18 讲 · 371 个时间窗" },
  { href: "/resources", title: "资源索引", hint: "作业、数据、工具、中文辅助" },
  { href: "/references", title: "参考文献", hint: "114 条官方登记入口" },
  { href: "/coverage", title: "覆盖核验", hint: "来源版本与完整性边界" },
] as const;

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function CommandPalette({ open, onOpenChange }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const query = q.trim().toLocaleLowerCase();

  useEffect(() => {
    if (open) {
      setQ("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const hits = useMemo(() => {
    if (!query) return { pages: [...PAGES], lectures: [], segments: [], resources: [] as Resource[] };
    const terms = query.split(/\s+/).filter(Boolean);
    const match = (text: string) => terms.every((t) => text.includes(t));
    const pages = PAGES.filter((p) => match((p.title + " " + p.hint).toLocaleLowerCase()));
    const idx = searchIndex as SearchHit[];
    const lectures = idx.filter((x) => x.kind === "lecture" && match(x.search)).slice(0, 8);
    const segments = idx.filter((x) => x.kind === "segment" && match(x.search)).slice(0, 12);
    const res = (resources as Resource[])
      .filter((r) => match((r.title + " " + r.purpose + " " + r.category).toLocaleLowerCase()))
      .slice(0, 8);
    return { pages, lectures, segments, resources: res };
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/35"
        aria-label="关闭搜索"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(92vw,640px)] overflow-hidden rounded-xl bg-card shadow-soft hairline">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const first = e.currentTarget
                  .closest("[data-cmd]")
                  ?.querySelector<HTMLButtonElement>("[data-cmd-row]");
                first?.click();
              }
            }}
            placeholder="搜索讲次、时间窗、资源…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div data-cmd className="max-h-[min(62vh,480px)] overflow-y-auto p-2">
          {!query ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">输入关键词，或从页面跳转。</p>
          ) : null}
          <Group title="页面" hidden={!hits.pages.length}>
            {hits.pages.map((p) => (
              <Row
                key={p.href}
                icon={Search}
                title={p.title}
                hint={p.hint}
                onClick={() => {
                  onOpenChange(false);
                  void navigate({ to: p.href });
                }}
              />
            ))}
          </Group>
          <Group title="讲次" hidden={!hits.lectures.length}>
            {hits.lectures.map((l) => (
              <Row
                key={l.id}
                icon={BookOpen}
                title={`${l.number}  ${l.title}`}
                hint={l.hint}
                onClick={() => {
                  onOpenChange(false);
                  void navigate({ to: "/notes/$lectureId", params: { lectureId: l.lectureId } });
                }}
              />
            ))}
          </Group>
          <Group title="时间窗" hidden={!hits.segments.length}>
            {hits.segments.map((s) => (
              <Row
                key={s.id}
                icon={Clock}
                title={s.title}
                hint={`${s.number} · ${s.hint}`}
                onClick={() => {
                  onOpenChange(false);
                  void navigate({
                    to: "/notes/$lectureId",
                    params: { lectureId: s.lectureId },
                    hash: s.id,
                  });
                }}
              />
            ))}
          </Group>
          <Group title="资源" hidden={!hits.resources.length}>
            {hits.resources.map((r) => (
              <Row
                key={r.id}
                icon={Library}
                title={r.title}
                hint={r.purpose}
                onClick={() => {
                  onOpenChange(false);
                  if (r.url) window.open(r.url, "_blank", "noreferrer");
                  else void navigate({ to: "/resources" });
                }}
              />
            ))}
          </Group>
          {query &&
          !hits.pages.length &&
          !hits.lectures.length &&
          !hits.segments.length &&
          !hits.resources.length ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">没有匹配结果</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Group({ title, hidden, children }: { title: string; hidden?: boolean; children: React.ReactNode }) {
  if (hidden) return null;
  return (
    <div className="mb-2">
      <p className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  icon: typeof Search;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-cmd-row
      onClick={onClick}
      className={cn("flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted")}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
