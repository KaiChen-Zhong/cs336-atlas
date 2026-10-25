import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  Home,
  Library,
  Map,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/progress";
import catalog from "@/data/catalog.json";

const NAV = [
  { href: "/", label: "首页", icon: Home },
  { href: "/guide", label: "学习路线", icon: Map },
  { href: "/notes", label: "视频笔记", icon: BookOpen },
  { href: "/resources", label: "资源索引", icon: Library },
  { href: "/references", label: "参考文献", icon: FileText },
  { href: "/coverage", label: "覆盖核验", icon: ShieldCheck },
] as const;

function pathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const lastLectureId = useProgress((s) => s.lastLectureId);
  const done = useProgress((s) => s.done);
  const last = catalog.find((l) => l.id === lastLectureId);
  const totalSeg = catalog.reduce((n, l) => n + l.segmentCount, 0);
  const doneCount = Object.keys(done).length;
  const pct = totalSeg ? Math.round((doneCount / totalSeg) * 100) : 0;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setCmd(true);
      }
      if (e.key === "Escape") setCmd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        跳到内容
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Link to="/" className="block px-6 pt-8 pb-6 no-underline">
          <p className="text-[11px] font-medium tracking-[0.18em] text-sidebar-muted uppercase">
            Stanford CS336
          </p>
          <p className="font-display mt-2 text-[28px] leading-none text-sidebar-foreground">Atlas</p>
          <p className="mt-2 text-xs text-sidebar-muted">从零构建语言模型</p>
        </Link>
        <nav className="flex-1 px-3" aria-label="主导航">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "mb-1 flex h-11 items-center gap-3 rounded-md px-3 text-sm no-underline transition-colors duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={() => setCmd(true)}
            className="mb-4 flex h-11 w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent px-3 text-left text-sm text-sidebar-muted"
          >
            <Search className="size-4" />
            搜索笔记
            <kbd className="ml-auto font-mono text-[10px] text-sidebar-muted">⌘K</kbd>
          </button>
          <div className="rounded-lg bg-sidebar-accent px-3 py-3">
            <div className="flex items-center justify-between text-[11px] text-sidebar-muted">
              <span>学习进度</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sidebar-border">
              <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            {last ? (
              <Link
                to="/notes/$lectureId"
                params={{ lectureId: last.id }}
                className="mt-3 block text-xs text-sidebar-foreground no-underline hover:underline"
              >
                继续 {last.number}
              </Link>
            ) : (
              <p className="mt-3 text-xs text-sidebar-muted">从 L01 开始第一讲</p>
            )}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur lg:hidden">
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="打开菜单">
          <Menu className="size-5" />
        </Button>
        <Link to="/" className="font-display text-lg text-foreground no-underline">
          CS336 Atlas
        </Link>
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={() => setCmd(true)} aria-label="搜索">
          <Search className="size-5" />
        </Button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <p className="font-display text-2xl">Atlas</p>
              <Button variant="sidebar" size="icon-sm" onClick={() => setOpen(false)} aria-label="关闭">
                <X className="size-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = pathActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "mb-1 flex h-12 items-center gap-3 rounded-md px-3 text-sm no-underline",
                      active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-muted",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[248px]">
        <main id="main" className="mx-auto min-h-dvh w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-8 lg:pb-16 lg:pt-10">
          {children}
          <p className="mt-16 border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
            资料核验 2026-09-08 · 摘要来自字幕镜像与讲义快照，不是人工逐帧听校。术语以官方讲义、题面和论文交叉核对。
          </p>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="底部导航"
      >
        {NAV.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = pathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 text-[11px] no-underline",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label.replace("视频", "").replace("学习", "")}
            </Link>
          );
        })}
        <Link
          to="/references"
          className={cn(
            "flex h-14 flex-col items-center justify-center gap-1 text-[11px] no-underline",
            pathActive(pathname, "/references") || pathActive(pathname, "/coverage")
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <FileText className="size-4" />
          文献
        </Link>
      </nav>

      <CommandPalette open={cmd} onOpenChange={setCmd} />
    </div>
  );
}
