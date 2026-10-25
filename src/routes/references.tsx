import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import referencesData from "@/data/references.json";
import catalog from "@/data/catalog.json";
import type { LectureCard, Reference } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/references")({ component: ReferencesPage });

const refs = referencesData as Reference[];
const lectures = catalog as LectureCard[];

function hasLecture(r: Reference) {
  return Boolean(r.lectures && r.lectures !== "—");
}

function ReferencesPage() {
  const [q, setQ] = useState("");
  const [lec, setLec] = useState("all");
  const query = q.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  const visible = useMemo(() => {
    return refs.filter((r) => {
      if (lec === "none") {
        if (hasLecture(r)) return false;
      } else if (lec !== "all") {
        const code = lectures.find((l) => l.id === lec)?.number ?? "";
        if (!code || !r.lectures.includes(code)) return false;
      }
      if (terms.length) {
        const hay = (r.title + " " + r.code + " " + r.lectures + " " + r.meta).toLocaleLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [lec, terms]);

  return (
    <div>
      <PageHeader
        eyebrow="官方参考文献"
        title="114 条登记入口，按需查阅"
        description="从 2026 官方 references.py 提取。这里是来源索引，不是逐篇综述。不要求先通读。"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题、定位码、机构…"
          className="sm:max-w-sm"
        />
        <p className="self-center text-sm text-muted-foreground">
          {visible.length} / {refs.length}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={lec === "all"} onClick={() => setLec("all")}>
          全部讲次
        </Chip>
        <Chip active={lec === "none"} onClick={() => setLec("none")}>
          未定位
        </Chip>
        {lectures
          .filter((l) => l.id !== "dan-fu")
          .map((l) => (
            <Chip key={l.id} active={lec === l.id} onClick={() => setLec(l.id)}>
              {l.number}
            </Chip>
          ))}
      </div>
      <div className="overflow-x-auto rounded-xl bg-card hairline">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">标题 / 定位码</th>
              <th className="px-4 py-3 font-medium">讲义定位</th>
              <th className="px-4 py-3 font-medium">日期 / 机构</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 align-top">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.title}
                    </a>
                  ) : (
                    r.title
                  )}
                  {r.code ? <div className="mt-1 font-mono text-[11px] text-muted-foreground">{r.code}</div> : null}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{r.lectures || "—"}</td>
                <td className="px-4 py-3 align-top text-muted-foreground">{r.meta || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
