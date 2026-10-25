import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import coverage from "@/data/coverage.json";
import catalog from "@/data/catalog.json";
import type { LectureCard } from "@/data/types";

export const Route = createFileRoute("/coverage")({ component: CoveragePage });

const videos = coverage.videos as {
  label: string;
  url: string;
  officialTitle: string;
  duration: string;
  segments: number;
  lastCaption: string;
}[];
const lectures = catalog as LectureCard[];

function CoveragePage() {
  return (
    <div>
      <PageHeader
        eyebrow="覆盖与核验"
        title="主线固定为 Spring 2026"
        description="核验日期 2026-09-08。18 个公开视频：17 讲正课加 Dan Fu 嘉宾课。官网日程列 19 次课，Daniel Selsam 当前播放列表未发现对应录像。"
      />

      <section>
        <h2 className="text-2xl">视频覆盖</h2>
        <p className="mt-2 max-w-[68ch] text-sm leading-6 text-muted-foreground">
          总时长 24:09:56；按固定 4 分钟窗划分，共 371 个小段。未用 2025 视频补成 2026 视频。
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl bg-card hairline">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">视频</th>
                <th className="px-4 py-3 font-medium">官方标题</th>
                <th className="px-4 py-3 font-medium">时长</th>
                <th className="px-4 py-3 font-medium">小段</th>
                <th className="px-4 py-3 font-medium">字幕结束</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => {
                const lec = lectures.find((l) => l.youtubeUrl && v.url.includes(l.youtubeId));
                return (
                  <tr key={v.label} className="border-t border-border">
                    <td className="px-4 py-3">
                      {lec ? (
                        <Link to="/notes/$lectureId" params={{ lectureId: lec.id }}>
                          {v.label}
                        </Link>
                      ) : (
                        <a href={v.url} target="_blank" rel="noreferrer">
                          {v.label}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.officialTitle}</td>
                    <td className="px-4 py-3 tabular-nums">{v.duration}</td>
                    <td className="px-4 py-3 tabular-nums">{v.segments}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{v.lastCaption}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-card p-5 hairline">
          <h2 className="text-lg">内容依据</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>视频身份与时长来自 Stanford Online 官方播放列表。</li>
            <li>时间轴使用 Young-Lord 公开 VTT 字幕镜像，按绝对时间分窗。</li>
            <li>术语与公式对照官方讲义快照 8b59b50730766695c2ffedd1a79c50cd09b9eb91。</li>
            <li>摘要是逐窗概括，不是字幕全文翻译；时间窗不是官方章节边界。</li>
          </ul>
        </article>
        <article className="rounded-xl bg-card p-5 hairline">
          <h2 className="text-lg">完整性边界</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>覆盖官方主链路与精选辅助，不声称穷尽互联网。</li>
            <li>371 个时间窗全部有摘要，不等于 19 次课录像均已公开。</li>
            <li>复习问题用于自测，未代做官方作业。</li>
            <li>原视频、课件及论文归各自权利人所有；本站只提供原创概括与来源链接。</li>
          </ul>
        </article>
      </section>

      <section className="mt-8 rounded-xl bg-muted px-5 py-4">
        <h2 className="text-lg">固定版本</h2>
        <p className="mt-2 font-mono text-xs leading-6 text-muted-foreground">
          官方讲义 8b59b50730766695c2ffedd1a79c50cd09b9eb91
          <br />
          字幕镜像 6acde390f44488492fae5bd359d9d8081c3b26ac
        </p>
      </section>
    </div>
  );
}
