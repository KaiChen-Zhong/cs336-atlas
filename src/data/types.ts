export type Priority = "P0" | "P1" | "P2" | "";

export type Material = { label: string; href: string };

export type Segment = {
  id: string;
  start: string;
  end: string;
  startSeconds: number;
  title: string;
  bullets: string[];
  keywords: string[];
  youtubeUrl: string;
  searchText: string;
};

export type Macro = {
  id: string;
  start: string;
  end: string;
  startSeconds: number;
  title: string;
  summary: string;
  youtubeUrl: string;
  segments: Segment[];
};

export type Lecture = {
  id: string;
  number: string;
  title: string;
  intro: string;
  duration: string;
  durationSeconds: number;
  segmentCount: number;
  youtubeId: string;
  youtubeUrl: string;
  materials: Material[];
  takeaways: string[];
  reviewQuestions: string[];
  pitfalls: string[];
  verification: string;
  keywords: string[];
  assignment: string;
  stage: number;
  macros: Macro[];
};

export type LectureCard = Omit<
  Lecture,
  "macros" | "reviewQuestions" | "pitfalls" | "verification"
>;

export type Resource = {
  id: string;
  priority: Priority;
  title: string;
  url: string;
  links: Material[];
  purpose: string;
  extra: string;
  category: string;
  section: string;
};

export type Reference = {
  id: string;
  title: string;
  url: string;
  code: string;
  lectures: string;
  meta: string;
};

export type SearchHit = {
  kind: "lecture" | "segment";
  id: string;
  lectureId: string;
  number: string;
  title: string;
  hint: string;
  youtubeUrl: string;
  keywords: string[];
  search: string;
};

export type ReviewQuestion = {
  id: string;
  topic: string;
  q: string;
  a: string;
};

export type ReviewPitfall = {
  id: string;
  trap: string;
  correct: string;
};

export type ReviewPack = {
  questions: ReviewQuestion[];
  pitfalls: ReviewPitfall[];
};
