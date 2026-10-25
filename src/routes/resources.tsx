import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABEL } from "@/data/guide";
import resourcesData from "@/data/resources.json";
import type { Priority, Resource } from "@/data/types";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/resources")({ component: ResourcesPage });

const all = resourcesData as Resource[];
const categories = [...new Set(all.map((r) => r.category))];

function ResourcesPage() {
  const [q, setQ] = useState("");
  const [pri, setPri] = useState<Priority | "all">("all");
  const [cat, setCat] = useState<string>("all");
  const saved = useProgress((s) => s.saved);
  const toggleSaved = useProgress((s) => s.toggleSaved);
  const query = q.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  const visible = useMemo(() => {
    return all.filter((r) => {
      if (pri !== "all" && r.priority !== pri) return false;
      if (cat !== "all" && r.category !== cat) return false;
      if (terms.length) {
        const hay = (r.title + " " + r.purpose + " " + r.extra + " " + r.category).toLocaleLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [pri, cat, terms]);

  const grouped = categories
    .map((c) => ({ c, items: visible.filter((r) => r.category === c) }))
    .filter((g) => g.items.length);

  return (
    <div>
      <PageHeader
        eyebrow="资源索引"
        title="先用 P0，再按缺口补 P1"
        description="优先级是这份整理的学习建议，不是课程硬性要求。P0 支撑主线，P1 补知识缺口，P2 提供第二种解释。"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索资源…" className="sm:max-w-sm" />
        <p className="self-center text-sm text-muted-foreground">{visible.length} 条</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(["all", "P0", "P1", "P2"] as const).map((p) => (
          <Chip key={p} active={pri === p} onClick={() => setPri(p)}>
            {p === "all" ? "全部优先级" : p}
          </Chip>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          全部分类
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABEL[c] || c}
          </Chip>
        ))}
      </div>

      {grouped.map((g) => (
        <section key={g.c} className="mb-10">
          <h2 className="text-xl">{CATEGORY_LABEL[g.c] || g.c}</h2>
          <div className="mt-4 grid gap-3">
            {g.items.map((r) => (
              <article key={r.id} className="rounded-xl bg-card p-5 hairline">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.priority ? (
                        <Badge variant={r.priority === "P0" ? "p0" : r.priority === "P1" ? "p1" : "p2"}>
                          {r.priority}
                        </Badge>
                      ) : null}
                      {r.section ? <Badge variant="outline">{r.section}</Badge> : null}
                    </div>
                    <h3 className="mt-2 text-base font-medium">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-foreground no-underline hover:underline">
                          {r.title}
                          <ExternalLink className="ml-1 inline size-3.5 text-muted-foreground" />
                        </a>
                      ) : (
                        r.title
                      )}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.purpose}</p>
                    {r.extra ? <p className="mt-1 text-xs text-muted-foreground">{r.extra}</p> : null}
                    {r.links.length > 1 ? (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {r.links.slice(1).map((l) => (
                          <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-xs">
                            {l.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSaved(r.id)}
                    className={cn(
                      "size-11 shrink-0 rounded-md text-muted-foreground hover:bg-muted",
                      saved[r.id] && "text-primary",
                    )}
                    aria-label={saved[r.id] ? "取消收藏" : "收藏"}
                  >
                    <Bookmark className="mx-auto size-4" fill={saved[r.id] ? "currentColor" : "none"} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          没有匹配资源。
        </p>
      ) : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
