import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/workspace/attachments";
const OUT = "/workspace/src/data";

function timeToSec(t) {
  const p = t.trim().split(":").map((n) => parseInt(n, 10));
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

function parseLinks(line) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(line))) out.push({ label: m[1], href: m[2] });
  return out;
}

function youtubeId(url) {
  const m = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/);
  return m ? m[1] : "";
}

function splitBlocks(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  return lines;
}

function parseList(lines, start, numbered) {
  const items = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    if (!line.trim()) {
      if (items.length) {
        // allow blank inside list? stop after first blank after items unless continuation
        const next = lines[i + 1] ?? "";
        if (!next.startsWith("  ") && !next.startsWith("- ") && !/^\d+\.\s/.test(next)) {
          i++;
          break;
        }
      }
      i++;
      continue;
    }
    if (numbered && /^\d+\.\s/.test(line)) {
      items.push(line.replace(/^\d+\.\s/, "").trim());
      i++;
      continue;
    }
    if (!numbered && line.startsWith("- ")) {
      items.push(line.slice(2).trim());
      i++;
      continue;
    }
    if (items.length && (line.startsWith("  ") || line.startsWith("\t"))) {
      items[items.length - 1] += " " + line.trim();
      i++;
      continue;
    }
    break;
  }
  return { items, next: i };
}

const STAGE = {
  l01: 1, l02: 1, l03: 1,
  l04: 2,
  l05: 3, l06: 3, l07: 3, l08: 3,
  l09: 4, l10: 4, l11: 4,
  l12: 5, l13: 5, l14: 5,
  l15: 6, l16: 6, l17: 6, "dan-fu": 6,
};

const ASSIGN = {
  l01: "A1", l02: "A1", l03: "A1", l04: "A1",
  l05: "A2", l06: "A2", l07: "A2", l08: "A2",
  l09: "A3", l10: "A2 / A3", l11: "A3",
  l12: "A4", l13: "A4", l14: "A4",
  l15: "A5", l16: "A5", l17: "A5", "dan-fu": "A5",
};

const FILE_IDS = [
  ["01_Lecture_01.md", "l01"],
  ["02_Lecture_02.md", "l02"],
  ["03_Lecture_03.md", "l03"],
  ["04_Lecture_04.md", "l04"],
  ["05_Lecture_05.md", "l05"],
  ["06_Lecture_06.md", "l06"],
  ["07_Lecture_07.md", "l07"],
  ["08_Lecture_08.md", "l08"],
  ["09_Lecture_09.md", "l09"],
  ["10_Lecture_10.md", "l10"],
  ["11_Lecture_11.md", "l11"],
  ["12_Lecture_12.md", "l12"],
  ["13_Lecture_13.md", "l13"],
  ["14_Lecture_14.md", "l14"],
  ["15_Lecture_15.md", "l15"],
  ["16_Lecture_16.md", "l16"],
  ["17_Lecture_17.md", "l17"],
  ["18_Dan_Fu_嘉宾课.md", "dan-fu"],
];

function parseLecture(md, id) {
  const lines = splitBlocks(md);
  const titleLine = lines.find((l) => l.startsWith("# ")) || "";
  const [codePart, ...restTitle] = titleLine.replace(/^#\s+/, "").split("｜");
  const number = codePart.replace(/｜.*/, "").trim();
  const title = restTitle.join("｜").trim() || number;

  const metaLine = lines.find((l) => l.includes("时间窗")) || "";
  const metaParts = metaLine.split("·").map((s) => s.trim());
  const duration = metaParts[1] || "";
  const segmentCount = parseInt((metaParts[2] || "").replace(/[^\d]/g, ""), 10) || 0;

  const linkLine = lines.find((l) => l.includes("youtube.com/watch")) || "";
  const materials = parseLinks(linkLine);
  const yt = materials.find((x) => x.href.includes("youtube.com"))?.href || "";
  const vid = youtubeId(yt);

  let intro = "";
  let takeaways = [];
  let reviewQuestions = [];
  let pitfalls = [];
  let verification = "";

  const macros = [];
  let currentMacro = null;
  let currentSeg = null;

  const pushSeg = () => {
    if (currentMacro && currentSeg) {
      currentSeg.searchText = [
        currentSeg.title,
        ...currentSeg.bullets,
        ...currentSeg.keywords,
        currentMacro.title,
      ]
        .join(" ")
        .toLocaleLowerCase();
      currentMacro.segments.push(currentSeg);
      currentSeg = null;
    }
  };
  const pushMacro = () => {
    pushSeg();
    if (currentMacro) macros.push(currentMacro);
    currentMacro = null;
  };

  let mode = "head";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## 核心收获")) {
      const r = parseList(lines, i + 1, false);
      takeaways = r.items;
      i = r.next - 1;
      continue;
    }
    if (line.startsWith("## 大段导航")) {
      mode = "skip-nav";
      continue;
    }
    if (line.startsWith("## 复习问题")) {
      pushMacro();
      mode = "review";
      const r = parseList(lines, i + 1, true);
      reviewQuestions = r.items;
      i = r.next - 1;
      continue;
    }
    if (line.startsWith("## 易错点")) {
      const r = parseList(lines, i + 1, false);
      pitfalls = r.items;
      i = r.next - 1;
      continue;
    }
    if (line.startsWith("## 核验说明")) {
      const paras = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("## ")) {
        if (lines[j].trim() && !lines[j].startsWith("[")) paras.push(lines[j].trim());
        j++;
      }
      verification = paras.join("\n");
      i = j - 1;
      continue;
    }

    const macroM = line.match(/^##\s+(\d{2}:\d{2}:\d{2})[–-](\d{2}:\d{2}:\d{2})｜(.+)$/);
    if (macroM) {
      pushMacro();
      mode = "macro";
      const start = macroM[1];
      const end = macroM[2];
      currentMacro = {
        id: `${id}-m-${start.replace(/:/g, "")}`,
        start,
        end,
        startSeconds: timeToSec(start),
        title: macroM[3].trim(),
        summary: "",
        youtubeUrl: `https://www.youtube.com/watch?v=${vid}&t=${timeToSec(start)}s`,
        segments: [],
      };
      continue;
    }

    const segM = line.match(
      /^###\s+\[(\d{2}:\d{2}:\d{2})[–-](\d{2}:\d{2}:\d{2})\]\(([^)]+)\)｜(.+)$/,
    );
    if (segM && currentMacro) {
      pushSeg();
      currentSeg = {
        id: `${id}-s-${segM[1].replace(/:/g, "")}`,
        start: segM[1],
        end: segM[2],
        startSeconds: timeToSec(segM[1]),
        title: segM[4].trim(),
        bullets: [],
        keywords: [],
        youtubeUrl: segM[3],
        searchText: "",
      };
      continue;
    }

    if (mode === "skip-nav") {
      if (line.startsWith("|") || line.trim() === "") continue;
      if (line.startsWith("## ")) {
        i--;
        mode = "body";
      }
      continue;
    }

    if (currentSeg) {
      if (line.startsWith("- ")) {
        currentSeg.bullets.push(line.slice(2).trim());
        continue;
      }
      if (line.startsWith("关键词：") || line.startsWith("关键词:")) {
        currentSeg.keywords = line
          .replace(/^关键词[：:]/, "")
          .split(/[·,，、]/)
          .map((s) => s.trim())
          .filter(Boolean);
        continue;
      }
    } else if (currentMacro && !currentMacro.summary && line.trim() && !line.startsWith("#") && !line.startsWith(">")) {
      currentMacro.summary = line.trim();
      continue;
    }

    if (mode === "head" && line.trim() && !line.startsWith("#") && !line.startsWith(">") && !line.startsWith("[") && !line.includes("时间窗") && !line.startsWith("Spring")) {
      if (!intro) intro = line.trim();
    }
  }
  pushMacro();

  const keywords = [...new Set(macros.flatMap((m) => m.segments.flatMap((s) => s.keywords)))];
  const actualSegments = macros.reduce((n, m) => n + m.segments.length, 0);

  return {
    id,
    number: number.replace(/\s+/g, " "),
    title,
    intro,
    duration,
    durationSeconds: timeToSec(duration),
    segmentCount: actualSegments || segmentCount,
    youtubeId: vid,
    youtubeUrl: vid ? `https://www.youtube.com/watch?v=${vid}` : yt,
    materials,
    takeaways,
    reviewQuestions,
    pitfalls,
    verification,
    keywords,
    assignment: ASSIGN[id] || "",
    stage: STAGE[id] || 1,
    macros,
  };
}

function parseMdTables(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let heading = "总览";
  let sub = "";
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const rows = [];
    let headers = [];
    for (const line of buf) {
      if (!line.startsWith("|")) continue;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c.replace(/\s/g, "")))) continue;
      if (!headers.length) {
        headers = cells;
        continue;
      }
      const row = {};
      headers.forEach((h, i) => {
        row[h] = cells[i] || "";
      });
      rows.push(row);
    }
    if (rows.length) sections.push({ heading, sub, headers, rows });
    buf = [];
  };
  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      heading = line.replace(/^##\s+/, "").trim();
      sub = "";
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      sub = line.replace(/^###\s+/, "").trim();
      continue;
    }
    if (line.startsWith("|")) buf.push(line);
    else if (buf.length && line.trim() === "") flush();
  }
  flush();
  return sections;
}

function parseResources(md) {
  const sections = parseMdTables(md);
  const items = [];
  let n = 0;
  for (const sec of sections) {
    for (const row of sec.rows) {
      const pri = (row["优先级"] || "").match(/P[012]/)?.[0] || "";
      const resCell = row["资源"] || row["模块"] || row["官方资源"] || Object.values(row)[1] || "";
      const links = parseLinks(resCell);
      const purpose =
        row["用途与版本"] ||
        row["用途与边界"] ||
        row["应得到的成果"] ||
        row["什么时候打开"] ||
        row["先解决的问题"] ||
        row["版本与用途"] ||
        row["使用方式"] ||
        row["快速学习用途"] ||
        row["自学切入点"] ||
        Object.values(row).slice(2).join(" · ");
      const title =
        links[0]?.label ||
        resCell.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/<br>`[^`]+`/g, "").trim() ||
        `条目 ${++n}`;
      items.push({
        id: `r${String(++n).padStart(3, "0")}`,
        priority: pri,
        title,
        url: links[0]?.href || "",
        links,
        purpose: purpose.replace(/<br>/g, " ").trim(),
        extra: row["讲次"] || row["主题"] || row["对应模块"] || row["先读范围"] || "",
        category: sec.heading,
        section: sec.sub,
        raw: row,
      });
    }
  }
  return items;
}

function parseRefs(md) {
  const sections = parseMdTables(md);
  const items = [];
  let n = 0;
  for (const sec of sections) {
    for (const row of sec.rows) {
      const cell = row["定位码／标题"] || Object.values(row)[0] || "";
      const links = parseLinks(cell);
      const codeM = cell.match(/`([^`]+)`/);
      items.push({
        id: `ref-${++n}`,
        title: (links[0]?.label || cell.split("<br>")[0] || cell).replace(/<br>.*/s, "").trim(),
        url: links[0]?.href || "",
        code: codeM ? codeM[1] : "",
        lectures: (row["讲义定位"] || "").replace(/—/g, "").trim(),
        meta: (row["登记日期／机构"] || "").trim(),
      });
    }
  }
  return items;
}

function parseCoverage(md) {
  const sections = parseMdTables(md);
  const videos = [];
  for (const sec of sections) {
    if (!sec.heading.includes("视频覆盖") && !sec.headers.includes("视频")) continue;
    for (const row of sec.rows) {
      const cell = row["视频"] || "";
      const links = parseLinks(cell);
      videos.push({
        label: links[0]?.label || cell,
        url: links[0]?.href || "",
        officialTitle: row["官方标题"] || "",
        duration: row["时长"] || "",
        segments: parseInt(row["小段数"] || "0", 10),
        lastCaption: row["最后一条字幕结束"] || "",
      });
    }
  }
  return { videos, sourceMd: md };
}

mkdirSync(OUT, { recursive: true });

const lectures = FILE_IDS.map(([file, id]) => {
  const md = readFileSync(join(ROOT, file), "utf8");
  return parseLecture(md, id);
});

const resources = parseResources(readFileSync(join(ROOT, "01_资源索引.md"), "utf8"));
const references = parseRefs(readFileSync(join(ROOT, "03_官方参考文献索引.md"), "utf8"));
const coverage = parseCoverage(readFileSync(join(ROOT, "04_覆盖与核验.md"), "utf8"));

const catalog = lectures.map((l) => ({
  id: l.id,
  number: l.number,
  title: l.title,
  intro: l.intro,
  duration: l.duration,
  durationSeconds: l.durationSeconds,
  segmentCount: l.segmentCount,
  youtubeId: l.youtubeId,
  youtubeUrl: l.youtubeUrl,
  assignment: l.assignment,
  stage: l.stage,
  takeaways: l.takeaways,
  keywords: l.keywords,
  materials: l.materials,
}));

writeFileSync(join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2));
writeFileSync(join(OUT, "lectures.json"), JSON.stringify(lectures));
writeFileSync(join(OUT, "resources.json"), JSON.stringify(resources, null, 2));
writeFileSync(join(OUT, "references.json"), JSON.stringify(references, null, 2));
writeFileSync(join(OUT, "coverage.json"), JSON.stringify({ videos: coverage.videos }, null, 2));

const stats = {
  lectures: lectures.length,
  segments: lectures.reduce((n, l) => n + l.segmentCount, 0),
  durationSeconds: lectures.reduce((n, l) => n + l.durationSeconds, 0),
  references: references.length,
  resources: resources.length,
};
console.log(JSON.stringify(stats, null, 2));
console.log(
  lectures
    .map((l) => `${l.id} macros=${l.macros.length} segs=${l.segmentCount} take=${l.takeaways.length} q=${l.reviewQuestions.length}`)
    .join("\n"),
);
console.log("resources", resources.length, "refs", references.length, "coverage videos", coverage.videos.length);
