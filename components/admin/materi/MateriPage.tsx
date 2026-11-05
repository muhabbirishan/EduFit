// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  ClipboardPaste,
  Columns,
  Compass,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  GitCompare,
  Heading,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutList,
  ListOrdered,
  Maximize2,
  MessageSquareText,
  MessageSquareWarning,
  Minimize2,
  Play,
  Plus,
  Search,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Table as TableIcon,
  Target,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type BlockType =
  | "cp_tp"
  | "section_container"
  | "topic_section"
  | "heading"
  | "paragraph"
  | "list"
  | "collapsible"
  | "figure"
  | "procedure"
  | "table"
  | "formula"
  | "case_study"
  | "learning_activity"
  | "fitt_simulator"
  | "tempo_simulator"
  | "video"
  | "callout"
  | "reflection"
  | "quiz"
  | "glossary";

export interface TableVariant {
  id: string;
  label: string;
  unitSubtitle?: string;
  headers: string[];
  rows: string[][];
  summaryText?: string;
  summaryBadge?: string;
}

export interface TempoStep {
  label: string;
  level: 1 | 2 | 3;
}

export interface TempoMethod {
  id: string;
  name: string;
  steps: TempoStep[];
}

export interface FormulaStep {
  label: string;
  expression: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface CaseStudyRow {
  aspect: string;
  subjectA: string;
  subjectB: string;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  value: string;
  headingLevel?: "section" | "sub" | "point";
  headingCode?: string;
  // Wadah Hirarki Bab Utama (Parent-Child Container)
  children?: ContentBlock[];
  sectionSummary?: string;
  cpMain?: string;
  cpSupport?: string;
  learningFocus?: string;
  objectivesList?: string[];
  operationalNote?: string;
  listStyle?: "bullet" | "number" | "alpha";
  items?: string[];
  collapsibleMode?: "text" | "steps";
  collapsibleItems?: { label: string; text: string }[];
  overline?: string;
  imageUrl?: string;
  caption?: string;
  conclusionText?: string;
  figureTheme?: "green" | "blue" | "neutral";
  procMode?: "tkji_test" | "exercise_tech";
  procCode?: string;
  procPurpose?: string;
  procTools?: string;
  procMuscles?: string;
  procSteps?: { label: string; text: string }[];
  procMistakes?: string;
  procBeginnerVariations?: string;
  procHighlightNote?: string;
  tableTitle?: string;
  tableDescription?: string;
  tableFootnote?: string;
  hasCategoryFilter?: boolean;
  tableVariants?: TableVariant[];
  formulaMode?: "fraction" | "linear";
  formulaLeft?: string;
  formulaNumerator?: string;
  formulaDenominator?: string;
  formulaLinearExpr?: string;
  formulaNote?: string;
  formulaCaseTitle?: string;
  formulaSteps?: FormulaStep[];
  formulaResult?: string;
  formulaCategoryBadge?: string;
  caseSubjectALabel?: string;
  caseSubjectBLabel?: string;
  caseRows?: CaseStudyRow[];
  caseAnalysisPoints?: string[];
  caseConclusions?: string[];
  caseKeyTakeaway?: string;
  activityOptionATitle?: string;
  activityOptionAText?: string;
  activityOptionBTitle?: string;
  activityOptionBText?: string;
  activityNote?: string;
  fittFrequencies?: number[];
  fittIntensities?: string[];
  fittDurations?: number[];
  fittTypes?: string[];
  fittDisclaimer?: string;
  reflectionPrompt?: string;
  reflectionGuide?: string;
  reflectionSampleAnswer?: string;
  reflectionNote?: string;
  simulatorTitle?: string;
  simulatorFootnote?: string;
  tempoMethods?: TempoMethod[];
  videoUrl?: string;
  videoButtonLabel?: string;
  videoSource?: string;
  observationPoints?: string[];
  calloutTone?: "amber" | "emerald" | "sky" | "rose";
  question?: string;
  options?: { key: string; text: string }[];
  correctOption?: string;
  explanation?: string;
  glossaryItems?: GlossaryItem[];
}

interface IslandNotification {
  id: number;
  message: string;
  subtitle?: string;
  type: "success" | "error" | "info";
}

type PreviewViewportSize = 320 | 375 | 425 | 768;

const BENTO_SHOWCASE_CLASSES = [
  "bento-showcase-0",
  "bento-showcase-1",
  "bento-showcase-2",
  "bento-showcase-3",
];

// 6 Komponen Inti yang dimasukkan ke dalam Wadah Bab (Menghilangkan kebingungan 19 blok lepas)
const SECTION_CHILD_COMPONENTS: {
  type: BlockType;
  label: string;
  shortDesc: string;
  icon: any;
}[] = [
  {
    type: "topic_section",
    label: "Sub-Topik Materi (Narasi + Infografis + Catatan)",
    shortDesc: "Kartu sub-bab lengkap berisi penjelasan, poster ilustrasi, dan kesimpulan/tips",
    icon: LayoutList,
  },
  {
    type: "procedure",
    label: "Prosedur Tes TKJI / Teknik Gerakan Latihan",
    shortDesc: "Tata cara gerakan olahraga (Unit 3) atau prosedur pengukuran TKJI (Unit 4)",
    icon: ClipboardCheck,
  },
  {
    type: "table",
    label: "Tabel Data / Norma Penilaian (Mendukung Paste Word)",
    shortDesc: "Tabel perbandingan aspek atau Tabel Norma Putra & Putri",
    icon: TableIcon,
  },
  {
    type: "formula",
    label: "Rumus & Simulasi Perhitungan Matematika",
    shortDesc: "Rumus Pecahan (IMT) atau Rumus Satu Baris (Denyut Nadi / Loncat Tegak)",
    icon: Calculator,
  },
  {
    type: "fitt_simulator",
    label: "Simulator Interaktif Strategi FITT",
    shortDesc: "Kalkulator interaktif frekuensi, intensitas, durasi & jenis latihan (Unit 6)",
    icon: Sliders,
  },
  {
    type: "tempo_simulator",
    label: "Grafik Progresi Mingguan (Minggu 1–4)",
    shortDesc: "Visualisasi grafik peningkatan durasi/intensitas bertahap",
    icon: Activity,
  },
  {
    type: "paragraph",
    label: "Paragraf Teks Tambahan",
    shortDesc: "Paragraf narasi lanjutan di dalam bab",
    icon: AlignLeft,
  },
  {
    type: "list",
    label: "Daftar Poin / Urutan",
    shortDesc: "Daftar butir bernomor atau poin (mendukung tempel sekaligus dari Word)",
    icon: ListOrdered,
  },
  {
    type: "callout",
    label: "Kotak Pertanyaan Pemantik / Peringatan Keselamatan",
    shortDesc: "Kotak sorotan khusus untuk pertanyaan pemantik atau perhatian medis",
    icon: MessageSquareWarning,
  },
  {
    type: "video",
    label: "Video Demonstrasi YouTube",
    shortDesc: "Sematkan pemutar video gerakan di dalam bab ini",
    icon: Video,
  },
];

// Katalog Komponen Level Unit (Zona Utama)
const BLOCK_CATALOG_GROUPS: {
  groupId: string;
  groupLabel: string;
  description: string;
  items: { type: BlockType; label: string; shortDesc: string; icon: any }[];
}[] = [
  {
    groupId: "wadah_bab",
    groupLabel: "1. Wadah Bab Utama & Identitas",
    description: "Buat Wadah Bab Utama (div induk) yang di dalamnya bisa diisi sub-materi, gambar, prosedur, tabel, dan rumus.",
    items: [
      {
        type: "section_container",
        label: "Wadah Bab Utama Baru (Container Bab & Sub-Bab)",
        shortDesc: "Wadah induk berhirarki yang membungkus seluruh sub-materi di dalam satu bab",
        icon: Layers,
      },
      {
        type: "cp_tp",
        label: "Zona 1: Identitas & Tujuan Pembelajaran (CP/TP)",
        shortDesc: "Elemen CP Utama, Pendukung, Fokus & Daftar Tujuan Pembelajaran",
        icon: Target,
      },
    ],
  },
  {
    groupId: "kasus_aktivitas",
    groupLabel: "2. Studi Kasus & Aktivitas",
    description: "Zona penerapan analisis perbandingan siswa (Andi vs Budi / Raka vs Dimas) dan Aktivitas Pilihan A & B.",
    items: [
      {
        type: "case_study",
        label: "Zona 4A: Studi Kasus Komparasi Siswa",
        shortDesc: "Tabel perbandingan 2 siswa, poin analisis, kesimpulan & pelajaran utama",
        icon: GitCompare,
      },
      {
        type: "learning_activity",
        label: "Zona 4B: Aktivitas Pembelajaran (Pilihan A & B)",
        shortDesc: "Pilihan A (Praktik Opsional) & Pilihan B (Analisis Kasus / Simulasi)",
        icon: Compass,
      },
    ],
  },
  {
    groupId: "evaluasi_penutup",
    groupLabel: "3. Refleksi, Formatif, Rangkuman & Glosarium",
    description: "Zona penutup unit pembelajaran yang terhubung ke penilaian Guru dan kamus istilah siswa.",
    items: [
      {
        type: "reflection",
        label: "Zona 5A: Refleksi Pemahaman Siswa (Wajib · Dinilai Guru)",
        shortDesc: "Pertanyaan refleksi wajib beserta panduan dan acuan jawaban guru",
        icon: MessageSquareText,
      },
      {
        type: "quiz",
        label: "Zona 5B: Soal Formatif Pilihan Ganda",
        shortDesc: "Checkpoint pemahaman 1 soal pilihan ganda + kunci pembahasan",
        icon: HelpCircle,
      },
      {
        type: "list",
        label: "Zona 5C: Rangkuman Unit Pembelajaran",
        shortDesc: "Mendukung Tempel Sekaligus (Bulk Paste) seluruh poin rangkuman dari Word",
        icon: ListOrdered,
      },
      {
        type: "glossary",
        label: "Zona 5D: Glosarium / Kamus Istilah Unit",
        shortDesc: "Mendukung Tempel Sekaligus (Bulk Paste) tabel Istilah | Pengertian dari Word",
        icon: BookMarked,
      },
    ],
  },
];

const EDUFIT_BLOCKS_MARKER_START = "<!--EDUFIT_SAAS_BLOCKS_START:";
const EDUFIT_BLOCKS_MARKER_END = ":EDUFIT_SAAS_BLOCKS_END-->";

function safeUtf8ToBase64(str: string): string {
  try {
    if (typeof window === "undefined") return "";
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return window.btoa(binary);
  } catch {
    try {
      return typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(str))) : "";
    } catch {
      return "";
    }
  }
}

function safeBase64ToUtf8(base64: string): string {
  try {
    if (typeof window === "undefined") return "";
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return decodeURIComponent(escape(window.atob(base64)));
  }
}

function encodeBlocksToMarker(blocks: ContentBlock[]): string {
  try {
    const base64 = safeUtf8ToBase64(JSON.stringify(blocks));
    return base64 ? `${EDUFIT_BLOCKS_MARKER_START}${base64}${EDUFIT_BLOCKS_MARKER_END}` : "";
  } catch {
    return "";
  }
}

function decodeBlocksFromMarker(htmlString: string): ContentBlock[] | null {
  if (!htmlString) return null;
  const startIdx = htmlString.indexOf(EDUFIT_BLOCKS_MARKER_START);
  const endIdx = htmlString.indexOf(EDUFIT_BLOCKS_MARKER_END);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const base64 = htmlString.substring(startIdx + EDUFIT_BLOCKS_MARKER_START.length, endIdx);
      const parsed = JSON.parse(safeBase64ToUtf8(base64));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function stripMarkerFromHtml(htmlString: string): string {
  if (!htmlString) return "";
  const startIdx = htmlString.indexOf(EDUFIT_BLOCKS_MARKER_START);
  return startIdx !== -1 ? htmlString.substring(0, startIdx).trim() : htmlString;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function extractYouTubeId(url?: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match && match[1] ? match[1] : null;
}

function compressImageToDataUrl(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context tidak tersedia"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = (err) => reject(err);
      img.src = String(ev.target?.result || "");
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function parseBulkListFromText(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^(\d+[\.\)]\s*|[a-zA-Z][\.\)]\s*|[-•*]\s*)/, "").trim())
    .filter(Boolean);
}

function parseBulkGlossaryFromText(rawText: string): GlossaryItem[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: GlossaryItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const low = line.toLowerCase();
    if (low === "istilah | pengertian" || low === "istilah\tpengertian" || low === "istilah" || low === "pengertian") continue;
    if (line.includes("\t")) {
      const parts = line.split("\t");
      const term = parts[0].trim();
      const def = parts.slice(1).join(" ").trim();
      if (term && def) items.push({ term, definition: def });
    } else if (line.includes("|")) {
      const parts = line.split("|");
      const term = parts[0].trim();
      const def = parts.slice(1).join(" ").trim();
      if (term && def) items.push({ term, definition: def });
    } else if (line.includes(" : ") || line.includes(" — ") || line.includes(" - ")) {
      const sep = line.includes(" : ") ? " : " : line.includes(" — ") ? " — " : " - ";
      const parts = line.split(sep);
      const term = parts[0].trim();
      const def = parts.slice(1).join(sep).trim();
      if (term && def) items.push({ term, definition: def });
    } else if (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
      const term = line;
      const def = lines[i + 1].replace(/^\|\s*/, "").trim();
      if (term && def) {
        items.push({ term, definition: def });
        i++;
      }
    }
  }
  return items;
}

function parseBulkTableFromText(rawText: string): { headers: string[]; rows: string[][] } | null {
  const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length < 2) return null;
  const parsedRows: string[][] = [];
  rawLines.forEach((line) => {
    if (line.includes("\t")) {
      parsedRows.push(line.split("\t").map((c) => c.trim()));
    } else if (line.includes("|")) {
      parsedRows.push(line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
    }
  });
  if (parsedRows.length < 2) return null;
  const maxCols = Math.max(...parsedRows.map((r) => r.length));
  const normalized = parsedRows.map((r) => {
    const copy = [...r];
    while (copy.length < maxCols) copy.push("");
    return copy;
  });
  return { headers: normalized[0], rows: normalized.slice(1) };
}

function getBlockTypeMeta(type: BlockType): { label: string; badge: string; zoneLabel: string } {
  switch (type) {
    case "cp_tp":
      return { label: "Identitas & Tujuan Pembelajaran (CP/TP)", badge: "ZONA 1 · IDENTITAS", zoneLabel: "Zona 1" };
    case "section_container":
      return { label: "Wadah Bab Utama (Membungkus Sub-Materi)", badge: "WADAH BAB (CONTAINER)", zoneLabel: "Bab Materi" };
    case "topic_section":
      return { label: "Sub-Topik Materi & Infografis", badge: "SUB-MATERI", zoneLabel: "Isi Bab" };
    case "heading":
      return { label: "Judul Sub-Bagian", badge: "SUB-JUDUL", zoneLabel: "Isi Bab" };
    case "paragraph":
      return { label: "Paragraf Penjelasan", badge: "PARAGRAF", zoneLabel: "Isi Bab" };
    case "list":
      return { label: "Daftar Poin / Rangkuman Unit", badge: "DAFTAR / RANGKUMAN", zoneLabel: "Penutup / Isi" };
    case "collapsible":
      return { label: "Kotak Lipat Rincian", badge: "KOTAK LIPAT", zoneLabel: "Isi Bab" };
    case "figure":
      return { label: "Gambar / Poster Ilustrasi", badge: "POSTER", zoneLabel: "Isi Bab" };
    case "procedure":
      return { label: "Prosedur Tes / Teknik Latihan", badge: "PROSEDUR & TEKNIK", zoneLabel: "Isi Bab" };
    case "table":
      return { label: "Tabel Data & Norma Penilaian", badge: "TABEL DATA", zoneLabel: "Isi Bab" };
    case "formula":
      return { label: "Rumus & Simulasi Perhitungan", badge: "RUMUS HITUNG", zoneLabel: "Isi Bab" };
    case "case_study":
      return { label: "Studi Kasus Komparasi Siswa", badge: "ZONA 4A · STUDI KASUS", zoneLabel: "Zona 4" };
    case "learning_activity":
      return { label: "Aktivitas Pembelajaran (Pilihan A & B)", badge: "ZONA 4B · AKTIVITAS", zoneLabel: "Zona 4" };
    case "fitt_simulator":
      return { label: "Simulator Interaktif Strategi FITT", badge: "SIMULATOR FITT", zoneLabel: "Interaktif" };
    case "tempo_simulator":
      return { label: "Grafik Progresi & Intensitas", badge: "GRAFIK PROGRESI", zoneLabel: "Interaktif" };
    case "video":
      return { label: "Video Demonstrasi YouTube", badge: "VIDEO", zoneLabel: "Media" };
    case "callout":
      return { label: "Kotak Pertanyaan Pemantik / Catatan", badge: "PEMANTIK / CATATAN", zoneLabel: "Sorotan" };
    case "reflection":
      return { label: "Refleksi Pemahaman Siswa (Wajib · Dinilai Guru)", badge: "ZONA 5A · REFLEKSI WAJIB", zoneLabel: "Zona 5" };
    case "quiz":
      return { label: "Soal Formatif Pilihan Ganda", badge: "ZONA 5B · FORMATIF", zoneLabel: "Zona 5" };
    case "glossary":
      return { label: "Glosarium / Kamus Istilah", badge: "ZONA 5D · GLOSARIUM", zoneLabel: "Zona 5" };
  }
}

function getBlockSummaryPreview(b: ContentBlock): string {
  switch (b.type) {
    case "cp_tp":
      return `${b.headingCode ? `${b.headingCode}. ` : ""}${b.title || "Identitas & Tujuan Pembelajaran"} (${(b.objectivesList || []).filter(Boolean).length} Tujuan)`;
    case "section_container":
      return `Bab ${b.headingCode || ""}: ${b.title || "Judul Bab Utama"} — Berisi ${(b.children || []).length} Sub-Bagian Materi`;
    case "topic_section":
      return `${b.headingCode ? `${b.headingCode}. ` : ""}${b.title || "Sub-Materi"} ${b.imageUrl ? "· [Poster Terpasang]" : ""}`;
    case "heading":
      return `${b.headingCode ? `[${b.headingCode}] ` : ""}${b.title || b.value || "Judul Bagian Belum Diisi"}`;
    case "paragraph":
      return b.value ? b.value.slice(0, 85) + (b.value.length > 85 ? "..." : "") : "Paragraf masih kosong...";
    case "list":
      return `${b.title || "Daftar Poin / Rangkuman"} (${(b.items || []).filter(Boolean).length} butir)`;
    case "procedure":
      return `${b.procCode ? `${b.procCode}. ` : ""}${b.title || "Prosedur / Teknik"} (${b.procMode === "exercise_tech" ? "Mode Teknik Latihan" : "Mode Prosedur Tes"})`;
    case "table":
      return `${b.tableTitle || "Tabel Data"} (${b.hasCategoryFilter ? "Tab Putra & Putri" : `${b.tableVariants?.[0]?.rows?.length || 0} baris`})`;
    case "formula":
      return `${b.title || "Rumus Perhitungan"} — ${b.formulaMode === "linear" ? b.formulaLinearExpr || "Rumus Satu Baris" : `${b.formulaLeft || "IMT"} = ${b.formulaNumerator || "..."} / ${b.formulaDenominator || "..."}`}`;
    case "case_study":
      return `${b.title || "Studi Kasus Komparasi"} (${b.caseSubjectALabel || "Siswa A"} vs ${b.caseSubjectBLabel || "Siswa B"})`;
    case "learning_activity":
      return `${b.title || "Aktivitas Pembelajaran"} (Pilihan A & Pilihan B)`;
    case "fitt_simulator":
      return `${b.title || "Simulasi Interaktif Menyusun Strategi FITT"}`;
    case "reflection":
      return `${b.reflectionPrompt || b.value || "Pertanyaan refleksi belum diisi..."}`;
    case "figure":
      return `${b.title || "Gambar Ilustrasi"} ${b.imageUrl ? "— Gambar Terpasang" : "— Belum Ada Gambar"}`;
    case "callout":
      return `${b.title || "Catatan"}: ${(b.value || "").slice(0, 65)}`;
    case "quiz":
      return `${b.question || "Pertanyaan formatif belum diisi"} (Kunci: ${b.correctOption || "A"})`;
    case "glossary":
      return `${b.title || "Glosarium"} (${(b.glossaryItems || []).length} istilah)`;
    default:
      return b.title || b.value || "Bagian Materi";
  }
}

// Menghitung total seluruh blok termasuk sub-blok di dalam Wadah Bab (section_container)
function countTotalBlocksRecursive(blocks: ContentBlock[]): number {
  let count = 0;
  blocks.forEach((b) => {
    count += 1;
    if (b.type === "section_container" && Array.isArray(b.children)) {
      count += b.children.length;
    }
  });
  return count;
}

export default function MateriPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [allReflections, setAllReflections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [gaugeMode, setGaugeMode] = useState<"graded" | "blocks" | "units">("graded");

  const [islandAlert, setIslandAlert] = useState<IslandNotification | null>(null);
  const islandTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDynamicIsland = useCallback(
    (message: string, subtitle?: string, type: "success" | "error" | "info" = "info") => {
      if (islandTimerRef.current) clearTimeout(islandTimerRef.current);
      setIslandAlert({ id: Date.now(), message, subtitle, type });
      islandTimerRef.current = setTimeout(() => setIslandAlert(null), 3400);
    },
    []
  );

  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const quickJumpRef = useRef<HTMLDivElement>(null);

  const [workspaceLayout, setWorkspaceLayout] = useState<"split" | "editor" | "preview">("split");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewportSize>(375);
  const [previewStage, setPreviewStage] = useState<"detail" | "overview">("detail");
  const [previewSectionFilter, setPreviewSectionFilter] = useState<"all" | "materi" | "media" | "interaktif">("all");
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState<Record<string, string>>({});

  // State Sync Scroll Otomatis Editor -> Layar HP Preview
  const [activeFocusedBlockId, setActiveFocusedBlockId] = useState<string | null>(null);
  const [autoSyncPreviewScroll, setAutoSyncPreviewScroll] = useState<boolean>(true);
  const previewScrollContainerRef = useRef<HTMLDivElement>(null);

  // State Importer Dokumen Word Utuh
  const [isWordImporterOpen, setIsWordImporterOpen] = useState(false);
  const [rawWordDocumentText, setRawWordDocumentText] = useState("");

  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const [singleFocusMode, setSingleFocusMode] = useState<boolean>(false);
  const [insertMenuAtIndex, setInsertMenuAtIndex] = useState<number | null>(null);
  const [insertChildMenuForContainer, setInsertChildMenuForContainer] = useState<string | null>(null);
  const [activePickerGroup, setActivePickerGroup] = useState<string>("wadah_bab");
  const [bulkPasteBuffer, setBulkPasteBuffer] = useState<Record<string, string>>({});

  const [previewFittSelection, setPreviewFittSelection] = useState<
    Record<string, { freq: number; intensity: string; duration: number; type: string }>
  >({});

  const identitasCardRef = useRef<HTMLDivElement>(null);
  const previewColumnSlotRef = useRef<HTMLDivElement>(null);
  const [floatingPreview, setFloatingPreview] = useState<{
    isFloating: boolean;
    top: number;
    left: number;
    width: number;
    height: number;
  }>({ isFloating: false, top: 14, left: 0, width: 0, height: 700 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalUnitName, setOriginalUnitName] = useState<string>("");
  const [unitName, setUnitName] = useState("");
  const [triggerQuestion, setTriggerQuestion] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  const [editorTempoTab, setEditorTempoTab] = useState<Record<string, number>>({});
  const [previewSelectedVariant, setPreviewSelectedVariant] = useState<Record<string, number>>({});
  const [previewTempoTab, setPreviewTempoTab] = useState<Record<string, number>>({});
  const [previewTempoStep, setPreviewTempoStep] = useState<Record<string, number>>({});
  const [previewVideoLoaded, setPreviewVideoLoaded] = useState<Record<string, boolean>>({});
  const [previewQuizSelected, setPreviewQuizSelected] = useState<Record<string, string>>({});

  // Fungsi Sinkronisasi Scroll Otomatis pada Layar HP Preview saat Admin Mengisi/Mengedit Blok
  const scrollPreviewToBlock = useCallback(
    (blockId: string) => {
      setActiveFocusedBlockId(blockId);
      if (!autoSyncPreviewScroll) return;
      if (previewStage !== "detail") setPreviewStage("detail");
      if (previewSectionFilter !== "all") setPreviewSectionFilter("all");

      requestAnimationFrame(() => {
        const container = previewScrollContainerRef.current;
        const targetEl = document.getElementById(`preview-node-${blockId}`);
        if (container && targetEl) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          const currentScrollTop = container.scrollTop;
          const offsetInsideContainer = targetRect.top - containerRect.top;
          const desiredScrollTop = Math.max(0, currentScrollTop + offsetInsideContainer - 72);
          container.scrollTo({
            top: desiredScrollTop,
            behavior: "smooth",
          });
        }
      });
    },
    [autoSyncPreviewScroll, previewStage, previewSectionFilter]
  );

  useEffect(() => {
    if (viewMode !== "form" || workspaceLayout !== "split") {
      setFloatingPreview((prev) => (prev.isFloating ? { ...prev, isFloating: false } : prev));
      return;
    }
    const updateFloatingPosition = () => {
      if (typeof window === "undefined" || window.innerWidth < 1024) {
        setFloatingPreview((prev) => (prev.isFloating ? { ...prev, isFloating: false } : prev));
        return;
      }
      const triggerEl = identitasCardRef.current;
      const slotEl = previewColumnSlotRef.current;
      if (!triggerEl || !slotEl) return;

      const navEl = document.getElementById("edufit-top-navbar");
      const navBottom = navEl ? Math.max(0, navEl.getBoundingClientRect().bottom) : 0;
      const safeTop = Math.max(12, Math.min(84, navBottom + 10));
      const availableHeight = Math.max(540, window.innerHeight - safeTop - 14);

      const triggerRect = triggerEl.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      const shouldFloat = triggerRect.top <= safeTop + 12;

      setFloatingPreview({
        isFloating: shouldFloat,
        top: safeTop,
        left: slotRect.left,
        width: slotRect.width,
        height: availableHeight,
      });
    };

    updateFloatingPosition();
    window.addEventListener("scroll", updateFloatingPosition, { capture: true, passive: true });
    window.addEventListener("resize", updateFloatingPosition, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateFloatingPosition, { capture: true });
      window.removeEventListener("resize", updateFloatingPosition);
    };
  }, [viewMode, workspaceLayout, contentBlocks.length]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (quickJumpRef.current && !quickJumpRef.current.contains(e.target as Node)) {
        setIsQuickJumpOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const [matRes, refRes] = await Promise.all([
        supabase
          .from("master_materials")
          .select("*")
          .order("grade_level", { ascending: true })
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.from("student_reflections").select("id, unit_name, score, grade, material_id"),
      ]);
      if (matRes.error) throw matRes.error;
      setAllMaterials(matRes.data || []);
      setAllReflections(refRes.data || []);
    } catch (error: any) {
      toast.error("Gagal menarik data materi: " + (error?.message || ""));
      triggerDynamicIsland("Gagal Memuat Modul Materi", error?.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "list") fetchMaterials();
  }, [viewMode]);

  const materials = useMemo(() => {
    const arr = allMaterials.filter((m) => Number(m.grade_level) === Number(activeGrade));
    return arr.sort((a, b) => {
      const orderA = a.order_index || 0;
      const orderB = b.order_index || 0;
      if (orderA !== orderB && orderA > 0 && orderB > 0) return orderA - orderB;
      const nA = a.unit_name?.toLowerCase() || "";
      const nB = b.unit_name?.toLowerCase() || "";
      const numA = parseInt(nA.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(nB.match(/\d+/)?.[0] || "0", 10);
      if (numA !== numB) return numA - numB;
      return nA.localeCompare(nB);
    });
  }, [allMaterials, activeGrade]);

  const createDefaultBlock = (type: BlockType): ContentBlock => {
    const id = generateId();
    switch (type) {
      case "cp_tp":
        return {
          id,
          type: "cp_tp",
          headingCode: "A",
          title: "Identitas dan Tujuan Pembelajaran",
          cpMain: "Bergaya Hidup Aktif",
          cpSupport: "Terampil Bergerak dan Memilih Hidup yang Menyehatkan",
          learningFocus: "",
          objectivesList: ["", ""],
          operationalNote: "Tujuan tersebut merupakan rumusan operasional EduFit.",
          value: "",
        };
      case "section_container":
        return {
          id,
          type: "section_container",
          headingCode: "B",
          title: "",
          subtitle: "",
          value: "",
          sectionSummary: "",
          children: [
            {
              id: generateId(),
              type: "topic_section",
              headingCode: "1",
              title: "",
              value: "",
              imageUrl: "",
              caption: "Sumber: EduFit Pembelajaran PJOK & Kesehatan",
              conclusionText: "",
              figureTheme: "green",
            },
          ],
        };
      case "topic_section":
        return {
          id,
          type: "topic_section",
          headingCode: "1",
          title: "",
          value: "",
          imageUrl: "",
          caption: "Sumber: EduFit Pembelajaran PJOK & Kesehatan",
          conclusionText: "",
          figureTheme: "green",
        };
      case "heading":
        return { id, type: "heading", headingLevel: "sub", headingCode: "1", title: "", value: "" };
      case "paragraph":
        return { id, type: "paragraph", value: "" };
      case "list":
        return { id, type: "list", title: "K. Rangkuman Unit Pembelajaran", listStyle: "number", value: "", items: ["", ""] };
      case "collapsible":
        return { id, type: "collapsible", title: "", collapsibleMode: "steps", value: "", collapsibleItems: [{ label: "Tahap 1", text: "" }] };
      case "figure":
        return { id, type: "figure", overline: "INFOGRAFIS MATERI", title: "", imageUrl: "", caption: "", figureTheme: "green", value: "" };
      case "procedure":
        return {
          id,
          type: "procedure",
          procMode: "tkji_test",
          procCode: "1",
          title: "",
          imageUrl: "",
          caption: "Sumber: Pedoman Resmi Pembelajaran PJOK EduFit",
          procPurpose: "",
          procTools: "",
          procMuscles: "",
          procSteps: [
            { label: "1. Persiapan", text: "" },
            { label: "2. Pelaksanaan", text: "" },
          ],
          procMistakes: "",
          procBeginnerVariations: "",
          procHighlightNote: "",
          value: "",
        };
      case "table":
        return {
          id,
          type: "table",
          tableTitle: "",
          tableDescription: "",
          tableFootnote: "",
          hasCategoryFilter: false,
          value: "",
          tableVariants: [
            {
              id: generateId(),
              label: "Umum",
              headers: ["Istilah / Aspek", "Pengertian", "Contoh"],
              rows: [["", "", ""]],
              summaryText: "",
              summaryBadge: "",
            },
          ],
        };
      case "formula":
        return {
          id,
          type: "formula",
          title: "Panduan Menghitung Indeks Massa Tubuh (IMT)",
          formulaMode: "fraction",
          formulaLeft: "IMT",
          formulaNumerator: "Berat Badan (kg)",
          formulaDenominator: "Tinggi Badan (m) × Tinggi Badan (m)",
          formulaLinearExpr: "HRmaks = 220 − Usia",
          formulaNote: "Tinggi badan harus diubah ke satuan meter (m) terlebih dahulu (dibagi 100).",
          formulaCaseTitle: "Contoh Perhitungan:",
          formulaSteps: [
            { label: "Langkah 1", expression: "170 cm / 100 = 1,70 m" },
            { label: "Langkah 2", expression: "1,70 m × 1,70 m = 2,89 m²" },
          ],
          formulaResult: "IMT = 23,5 kg/m²",
          formulaCategoryBadge: "KATEGORI: NORMAL",
          value: "",
        };
      case "case_study":
        return {
          id,
          type: "case_study",
          headingCode: "G",
          title: "Studi Kasus Komparasi Siswa",
          subtitle: "Perhatikan data perbandingan dua siswa berikut.",
          caseSubjectALabel: "Siswa A",
          caseSubjectBLabel: "Siswa B",
          caseRows: [
            { aspect: "Aspek 1", subjectA: "", subjectB: "" },
            { aspect: "Aspek 2", subjectA: "", subjectB: "" },
          ],
          caseAnalysisPoints: [""],
          caseConclusions: [""],
          caseKeyTakeaway: "",
          value: "",
        };
      case "learning_activity":
        return {
          id,
          type: "learning_activity",
          headingCode: "H",
          title: "Aktivitas Pembelajaran EduFit",
          activityOptionATitle: "Pilihan A — Praktik Opsional",
          activityOptionAText: "Dengan pengawasan yang sesuai, siswa mempraktikkan aktivitas sesuai kemampuan masing-masing dan mencatat hasilnya.",
          activityOptionBTitle: "Pilihan B — Analisis Kasus / Data Simulasi",
          activityOptionBText: "Siswa menganalisis data kasus perbandingan siswa dan menentukan komponen yang perlu ditingkatkan beserta alasannya.",
          activityNote: "Praktik bersifat opsional dan mengutamakan keselamatan serta kesiapan individu.",
          value: "",
        };
      case "fitt_simulator":
        return {
          id,
          type: "fitt_simulator",
          headingCode: "F",
          title: "Simulasi Interaktif Menyusun Strategi FITT",
          subtitle: "Pilih unsur latihan berikut untuk membuat contoh strategi aktivitas fisik sederhana.",
          fittFrequencies: [2, 3, 4],
          fittIntensities: ["Ringan", "Sedang", "Berat"],
          fittDurations: [10, 15, 20],
          fittTypes: ["Jalan cepat", "Jogging ringan", "Bersepeda"],
          fittDisclaimer: "Rancangan masih perlu dilengkapi pemanasan, pendinginan, pemulihan, dan penyesuaian terhadap kondisi individu.",
          value: "",
        };
      case "reflection":
        return {
          id,
          type: "reflection",
          headingCode: "I",
          title: "Refleksi Pemahaman Siswa (Dinilai Guru)",
          reflectionPrompt: triggerQuestion || "Renungkan dan jelaskan pemahaman inti Anda setelah mempelajari unit ini:",
          reflectionGuide: "Jawaban yang baik menghubungkan konsep utama pada unit ini dengan penerapan aktivitas fisik yang aman sesuai kemampuan individu.",
          reflectionSampleAnswer: "",
          reflectionNote: "Jawaban refleksi siswa akan tampil pada Dashboard Guru untuk diberikan umpan balik dan penilaian.",
          value: "",
        };
      case "tempo_simulator":
        return {
          id,
          type: "tempo_simulator",
          simulatorTitle: "Contoh Grafik Progresi Durasi Aktivitas (Minggu 1–4)",
          simulatorFootnote: "Data simulasi untuk menjelaskan progresi bertahap. Peningkatan durasi tidak wajib dilakukan setiap minggu.",
          value: "",
          tempoMethods: [
            {
              id: generateId(),
              name: "Progresi Durasi",
              steps: [
                { label: "Minggu 1 (10m)", level: 1 },
                { label: "Minggu 2 (12m)", level: 2 },
                { label: "Minggu 3 (15m)", level: 2 },
                { label: "Minggu 4 (18m)", level: 3 },
              ],
            },
          ],
        };
      case "video":
        return { id, type: "video", title: "", value: "", videoButtonLabel: "Putar Video", videoUrl: "", observationPoints: [""] };
      case "callout":
        return { id, type: "callout", title: "Pertanyaan Pemantik", calloutTone: "amber", value: "" };
      case "quiz":
        return {
          id,
          type: "quiz",
          title: "J. Soal Formatif Cek Pemahaman",
          question: "",
          options: [
            { key: "A", text: "" },
            { key: "B", text: "" },
            { key: "C", text: "" },
            { key: "D", text: "" },
          ],
          correctOption: "C",
          explanation: "",
          value: "",
        };
      case "glossary":
        return { id, type: "glossary", headingCode: "L", title: "Glosarium Unit Pembelajaran", value: "", glossaryItems: [{ term: "", definition: "" }] };
    }
  };

  // Konversi otomatis blok datar versi lama menjadi Wadah Bab Berhirarki (Section Container)
  const autoMigrateFlatToHierarchy = (rawBlocks: ContentBlock[]): ContentBlock[] => {
    if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return [];
    const alreadyHasContainer = rawBlocks.some((b) => b.type === "section_container");
    if (alreadyHasContainer) return rawBlocks;

    const topLevelStandaloneTypes: BlockType[] = [
      "cp_tp",
      "case_study",
      "learning_activity",
      "reflection",
      "quiz",
      "glossary",
    ];

    const result: ContentBlock[] = [];
    let currentContainer: ContentBlock | null = null;
    let sectionCounter = 0;
    const sectionLetters = ["B", "C", "D", "E", "F", "G"];

    rawBlocks.forEach((b) => {
      const isRangkumanList =
        b.type === "list" &&
        String(b.title || "")
          .toLowerCase()
          .includes("rangkuman");

      if (topLevelStandaloneTypes.includes(b.type) || isRangkumanList) {
        if (currentContainer) {
          result.push(currentContainer);
          currentContainer = null;
        }
        result.push(b);
        return;
      }

      if (b.type === "heading" && (b.headingLevel === "section" || !b.headingLevel)) {
        if (currentContainer) result.push(currentContainer);
        const code = b.headingCode || sectionLetters[sectionCounter] || `${sectionCounter + 1}`;
        sectionCounter++;
        currentContainer = {
          id: generateId(),
          type: "section_container",
          headingCode: code,
          title: b.title || b.value || "Bab Pembahasan",
          value: "",
          children: [],
        };
        return;
      }

      if (b.type === "topic_section" && !currentContainer) {
        const code = b.headingCode || sectionLetters[sectionCounter] || `${sectionCounter + 1}`;
        sectionCounter++;
        currentContainer = {
          id: generateId(),
          type: "section_container",
          headingCode: code,
          title: b.title || "Bab Materi Pembelajaran",
          value: "",
          children: [{ ...b, headingCode: "1" }],
        };
        return;
      }

      if (!currentContainer) {
        const code = sectionLetters[sectionCounter] || "B";
        sectionCounter++;
        currentContainer = {
          id: generateId(),
          type: "section_container",
          headingCode: code,
          title: "Pembahasan Materi Inti",
          value: "",
          children: [b],
        };
      } else {
        currentContainer.children = [...(currentContainer.children || []), b];
      }
    });

    if (currentContainer) result.push(currentContainer);
    return result;
  };

  // Smart Word Document Importer: Memecah naskah Word utuh menjadi Wadah Bab & Zona secara otomatis
  const handleSmartWordDocumentImport = () => {
    const raw = rawWordDocumentText.trim();
    if (!raw) {
      return toast.error("Tempelkan teks naskah dari Microsoft Word terlebih dahulu.");
    }

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let detectedUnitTitle = unitName;
    const cpTpBlock = createDefaultBlock("cp_tp");
    cpTpBlock.objectivesList = [];

    const generatedContainers: ContentBlock[] = [];
    let currentContainer: ContentBlock | null = null;
    let currentSubTopic: ContentBlock | null = null;

    let reflectionBlock = createDefaultBlock("reflection");
    let quizBlock = createDefaultBlock("quiz");
    let rangkumanBlock = { ...createDefaultBlock("list"), title: "K. Rangkuman Unit Pembelajaran", listStyle: "number" as const, items: [] as string[] };
    let glossaryBlock = { ...createDefaultBlock("glossary"), items: [] as string[], glossaryItems: [] as GlossaryItem[] };

    let parseMode: "header" | "objectives" | "body" | "rangkuman" | "glosarium" = "header";
    const sectionLetters = ["B", "C", "D", "E", "F", "G", "H"];
    let secIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const low = line.toLowerCase();

      if ( i < 3 && (low.startsWith("unit ") || low.includes("kelas x"))) {
        if (low.startsWith("unit ") && lines[i + 1] && !lines[i + 1].toLowerCase().includes("identitas")) {
          detectedUnitTitle = `${line}: ${lines[i + 1]}`;
        } else if (low.startsWith("unit ")) {
          detectedUnitTitle = line;
        }
        continue;
      }

      if (low.startsWith("elemen cp utama")) {
        cpTpBlock.cpMain = line.split(":")[1]?.trim() || line;
        continue;
      }
      if (low.startsWith("elemen pendukung")) {
        cpTpBlock.cpSupport = line.split(":")[1]?.trim() || line;
        continue;
      }
      if (low.startsWith("fokus pembelajaran")) {
        cpTpBlock.learningFocus = line.split(":")[1]?.trim() || line;
        continue;
      }
      if (low === "tujuan pembelajaran" || low.startsWith("setelah mempelajari unit")) {
        parseMode = "objectives";
        continue;
      }
      if (low.startsWith("pengantar:") || low.startsWith("pengertian ") || (parseMode === "objectives" && line.endsWith("?"))) {
        parseMode = "body";
      }
      if (low === "rangkuman" || low.startsWith("rangkuman unit")) {
        parseMode = "rangkuman";
        continue;
      }
      if (low === "glosarium" || low.startsWith("glosarium unit")) {
        parseMode = "glosarium";
        continue;
      }

      if (parseMode === "objectives") {
        if (low.startsWith("tujuan tersebut merupakan")) {
          cpTpBlock.operationalNote = line;
          parseMode = "body";
        } else {
          cpTpBlock.objectivesList?.push(line.replace(/^(\d+[\.\)]\s*|[-•]\s*)/, ""));
        }
        continue;
      }

      if (parseMode === "rangkuman") {
        rangkumanBlock.items.push(line.replace(/^(\d+[\.\)]\s*|[-•]\s*)/, ""));
        continue;
      }

      if (parseMode === "glosarium") {
        const chunk = lines.slice(i).join("\n");
        const parsedGloss = parseBulkGlossaryFromText(chunk);
        if (parsedGloss.length > 0) {
          glossaryBlock.glossaryItems = parsedGloss;
        }
        break;
      }

      if (parseMode === "body") {
        if (low.startsWith("pertanyaan pemantik")) {
          const promptVal = line.replace(/^pertanyaan pemantik\s*[:\-]?\s*/i, "").trim() || lines[i + 1] || "";
          if (currentSubTopic) {
            currentSubTopic.conclusionText = `Pertanyaan Pemantik: ${promptVal}`;
          }
          continue;
        }

        if (low.startsWith("refleksi")) {
          const nextLine = lines[i + 1] || "";
          if (nextLine) {
            reflectionBlock.reflectionPrompt = nextLine;
            setTriggerQuestion(nextLine);
            i++;
          }
          continue;
        }

        const isShortHeading =
          line.length < 78 &&
          !line.endsWith(".") &&
          !line.endsWith(",") &&
          !low.startsWith("sumber:") &&
          !low.startsWith("contoh:") &&
          !low.startsWith("kesimpulan:");

        if (isShortHeading) {
          if (!currentContainer || (currentContainer.children && currentContainer.children.length >= 3)) {
            if (currentContainer) generatedContainers.push(currentContainer);
            const code = sectionLetters[secIdx] || `${secIdx + 2}`;
            secIdx++;
            currentSubTopic = {
              ...createDefaultBlock("topic_section"),
              headingCode: `${code}.1`,
              title: line,
              value: "",
            };
            currentContainer = {
              id: generateId(),
              type: "section_container",
              headingCode: code,
              title: line,
              value: "",
              children: [currentSubTopic],
            };
          } else {
            const subNum = (currentContainer.children?.length || 0) + 1;
            currentSubTopic = {
              ...createDefaultBlock("topic_section"),
              headingCode: `${currentContainer.headingCode}.${subNum}`,
              title: line,
              value: "",
            };
            currentContainer.children = [...(currentContainer.children || []), currentSubTopic];
          }
        } else {
          if (!currentContainer) {
            const code = sectionLetters[secIdx] || "B";
            secIdx++;
            currentSubTopic = {
              ...createDefaultBlock("topic_section"),
              headingCode: `${code}.1`,
              title: "Pengantar & Konsep Utama",
              value: line,
            };
            currentContainer = {
              id: generateId(),
              type: "section_container",
              headingCode: code,
              title: "Pengantar & Konsep Utama",
              value: "",
              children: [currentSubTopic],
            };
          } else if (currentSubTopic) {
            currentSubTopic.value = currentSubTopic.value ? `${currentSubTopic.value}\n\n${line}` : line;
          }
        }
      }
    }

    if (currentContainer) generatedContainers.push(currentContainer);
    if (!cpTpBlock.objectivesList || cpTpBlock.objectivesList.length === 0) {
      cpTpBlock.objectivesList = [""];
    }
    if (rangkumanBlock.items.length === 0) rangkumanBlock.items = [""];
    if (glossaryBlock.glossaryItems.length === 0) glossaryBlock.glossaryItems = [{ term: "", definition: "" }];

    const assembledBlocks: ContentBlock[] = [
      cpTpBlock,
      ...generatedContainers,
      createDefaultBlock("learning_activity"),
      reflectionBlock,
      quizBlock,
      rangkumanBlock,
      glossaryBlock,
    ];

    if (detectedUnitTitle) setUnitName(detectedUnitTitle);
    setContentBlocks(assembledBlocks);
    setIsWordImporterOpen(false);
    setRawWordDocumentText("");
    triggerDynamicIsland(
      "Naskah Word Berhasil Diimpor!",
      `Otomatis terstruktur menjadi ${generatedContainers.length} Wadah Bab Utama beserta CP/TP, Rangkuman & Glosarium.`,
      "success"
    );
  };

  // Preset Kerangka Unit 1–6 Kelas X menggunakan arsitektur Wadah Bab (Section Container)
  const applyUnitStructuralPreset = (unitNumber: 1 | 2 | 3 | 4 | 5 | 6) => {
    let presetTitle = "";
    let presetReflection = "";
    let presetGuide = "";
    let presetSample = "";
    let blocks: ContentBlock[] = [];

    if (unitNumber === 1) {
      presetTitle = "Unit 1: Konsep Dasar Kebugaran Jasmani dan Keselamatan Aktivitas Fisik";
      presetReflection = "Mengapa dua siswa dengan jumlah nilai TKJI yang sama belum tentu membutuhkan prioritas latihan yang sama?";
      presetGuide = "Hubungkan perbedaan antara total nilai kategori TKJI dengan profil kekuatan/kelemahan tiap butir komponen kebugaran.";
      blocks = [
        {
          ...createDefaultBlock("cp_tp"),
          learningFocus:
            "Memahami konsep dasar kebugaran jasmani, mengenali komponen kebugaran terkait kesehatan dan keterampilan, mengidentifikasi faktor yang memengaruhi kebugaran, serta mengevaluasi prinsip keselamatan aktivitas fisik.",
          objectivesList: [
            "Menjelaskan pengertian kebugaran jasmani dan manfaatnya bagi kesehatan serta kehidupan sehari-hari.",
            "Membedakan komponen kebugaran terkait kesehatan dan keterampilan.",
            "Mengidentifikasi faktor-faktor yang memengaruhi kebugaran jasmani.",
            "Menjelaskan prinsip keselamatan sebelum, selama, dan setelah aktivitas fisik.",
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "B",
          title: "Pengantar, Pengertian & Manfaat Kebugaran Jasmani",
          sectionSummary: "Perbedaan aktivitas fisik, latihan fisik, dan kebugaran jasmani beserta 4 manfaat utamanya.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "B.1",
              title: "Pengantar: Mengapa Setiap Orang Memiliki Kebugaran Berbeda?",
              value:
                "Bayangkan tiga siswa kelas X (Andi, Budi, dan Citra) mengikuti olahraga. Andi cepat tetapi mudah lelah saat jogging lama. Budi kuat jogging lama tetapi kesulitan latihan otot atas. Kebugaran jasmani ditentukan oleh beberapa komponen yang saling mendukung.",
              conclusionText:
                "Pertanyaan Pemantik: Mengapa seorang siswa yang mampu melakukan banyak push-up belum tentu mampu berlari dalam waktu lama?",
            },
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "B.2",
              title: "Perbedaan Aktivitas Fisik, Latihan Fisik, dan Kebugaran Jasmani",
              value:
                "Aktivitas fisik adalah setiap gerakan tubuh yang membutuhkan pengeluaran energi. Latihan fisik adalah aktivitas yang direncanakan dan terstruktur, sedangkan kebugaran jasmani adalah kemampuan tubuh memenuhi tuntutan aktivitas.",
            },
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "C",
          title: "Komponen Kebugaran Jasmani & Hubungannya dengan Keseharian",
          sectionSummary: "5 Komponen terkait kesehatan, 6 komponen terkait keterampilan, dan penerapannya di sekolah.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "C.1",
              title: "Kebugaran Terkait Kesehatan vs Keterampilan",
              value:
                "Kebugaran terkait kesehatan mencakup daya tahan kardiorespirasi, kekuatan otot, daya tahan otot, kelenturan, dan komposisi tubuh. Kebugaran terkait keterampilan mencakup kecepatan, kelincahan, keseimbangan, koordinasi, daya ledak, dan waktu reaksi.",
            },
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "D",
          title: "Faktor-Faktor yang Memengaruhi Kebugaran & Prinsip Keselamatan",
          sectionSummary: "6 Faktor penentu kebugaran remaja serta prosedur keselamatan sebelum, selama, dan setelah aktivitas.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "D.1",
              title: "6 Faktor yang Memengaruhi Kebugaran Jasmani",
              value:
                "Kebugaran dipengaruhi oleh kebiasaan aktivitas fisik, usia & perkembangan biologis, pola makan, tidur & pemulihan (8–10 jam bagi remaja), kondisi kesehatan, serta lingkungan dan fasilitas.",
            },
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "D.2",
              title: "Prinsip Keselamatan dalam Aktivitas Fisik",
              value:
                "Memastikan kesiapan tubuh, keamanan lapangan, pemanasan dinamis, teknik gerakan yang benar, serta mengenali tanda bahaya seperti nyeri dada atau pusing berat.",
            },
          ],
        },
        createDefaultBlock("learning_activity"),
      ];
    } else if (unitNumber === 2) {
      presetTitle = "Unit 2: Latihan Daya Tahan dan Pengaturan Intensitas";
      presetReflection =
        "Jika temanmu mampu jogging selama 20 menit dengan nyaman, sedangkan kamu sangat lelah setelah 10 menit, apakah kamu harus mengikuti kecepatan dan durasi yang sama? Jelaskan berdasarkan konsep intensitas dan individualisasi.";
      presetGuide = "Gunakan konsep intensitas relatif dan prinsip individualisasi dalam menyesuaikan kecepatan serta durasi latihan.";
      presetSample =
        "Tidak harus, karena kemampuan setiap orang berbeda. Berdasarkan prinsip individualisasi, saya perlu menyesuaikan kecepatan dan durasi jogging dengan kemampuan sendiri serta meningkatkan latihan secara bertahap.";
      blocks = [
        {
          ...createDefaultBlock("cp_tp"),
          learningFocus:
            "Memahami konsep daya tahan kardiorespirasi, sistem energi aerobik dan anaerobik, serta menganalisis intensitas aktivitas melalui tes bicara, denyut nadi, dan RPE.",
          objectivesList: [
            "Menjelaskan pengertian daya tahan kardiorespirasi dan manfaatnya.",
            "Membedakan karakteristik sistem energi aerobik dan anaerobik.",
            "Menghitung frekuensi denyut nadi (bpm) dan perkiraan HRmaks (220 − usia).",
            "Menggunakan tes bicara (talk test) dan skala RPE (0–10) untuk memperkirakan intensitas.",
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "B",
          title: "Daya Tahan Kardiorespirasi & Sistem Energi Aerobik-Anaerobik",
          sectionSummary: "Cara kerja jantung-paru menyuplai oksigen serta kontribusi jalur energi aerobik dan anaerobik.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "B.1",
              title: "Pengertian Daya Tahan Kardiorespirasi & Sistem Energi",
              value:
                "Daya tahan kardiorespirasi adalah kemampuan sistem jantung, paru-paru, pembuluh darah, dan otot mendukung aktivitas berkelanjutan. Sistem aerobik dan anaerobik bekerja bersamaan sesuai intensitas dan durasi.",
            },
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "C",
          title: "Pengukuran Intensitas: Tes Bicara, Denyut Nadi & Skala RPE",
          sectionSummary: "Tiga metode praktis yang saling melengkapi untuk memantau intensitas latihan.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "C.1",
              title: "Tes Bicara (Talk Test) & Skala RPE (0–10)",
              value:
                "Pada intensitas ringan seseorang masih bisa bernyanyi, intensitas sedang masih bisa berbicara tetapi sulit bernyanyi, dan intensitas berat sulit berbicara tanpa jeda.",
            },
            {
              ...createDefaultBlock("formula"),
              title: "Menghitung Denyut Nadi (BPM) & Perkiraan HRmaks",
              formulaMode: "linear",
              formulaLinearExpr: "HRmaks = 220 − Usia (Denyut Nadi = Hitungan 15 detik × 4)",
              formulaCaseTitle: "Contoh Siswa Berusia 17 Tahun:",
              formulaSteps: [
                { label: "Denyut 15 Detik = 28 kali", expression: "28 × 4 = 112 bpm" },
                { label: "Perkiraan HRmaks", expression: "220 − 17 = 203 bpm" },
              ],
              formulaResult: "Perkiraan HRmaks = 203 bpm",
              formulaCategoryBadge: "ILUSTRASI MATEMATIS",
            },
          ],
        },
        {
          ...createDefaultBlock("case_study"),
          title: "Studi Kasus: Perbandingan Respons Tubuh Saat Jogging 20 Menit",
          caseRows: [
            { aspect: "Denyut Nadi", subjectA: "128 bpm", subjectB: "168 bpm" },
            { aspect: "Tes Bicara", subjectA: "Masih bisa berbicara", subjectB: "Sulit berbicara" },
            { aspect: "RPE (0–10)", subjectA: "5 (Sedang)", subjectB: "8 (Sangat berat)" },
            { aspect: "Perkiraan Intensitas", subjectA: "Sedang", subjectB: "Berat" },
          ],
          caseKeyTakeaway: "Aktivitas dan durasi yang sama tidak berarti intensitas relatifnya sama bagi setiap siswa.",
        },
        createDefaultBlock("learning_activity"),
      ];
    } else if (unitNumber === 3) {
      presetTitle = "Unit 3: Latihan Kekuatan dan Kelenturan";
      presetReflection =
        "Mengapa seseorang yang mampu melakukan banyak push-up belum tentu mempunyai kelenturan yang baik? Jelaskan hubungan antara kekuatan, daya tahan otot, dan kelenturan.";
      presetGuide = "Bedakan fokus antara kekuatan otot (gaya), daya tahan otot (kontraksi berulang), dan kelenturan (rentang gerak sendi / ROM).";
      presetSample =
        "Karena kekuatan otot, daya tahan otot, dan kelenturan merupakan kemampuan yang berbeda. Kekuatan berkaitan dengan menghasilkan gaya, daya tahan otot dengan gerakan berulang, sedangkan kelenturan dengan rentang gerak sendi (ROM).";
      blocks = [
        {
          ...createDefaultBlock("cp_tp"),
          learningFocus:
            "Memahami konsep kekuatan otot, daya tahan otot, dan kelenturan; mengidentifikasi kelompok otot utama dan teknik dasar latihan bodyweight; serta membedakan peregangan statis dan dinamis.",
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "B",
          title: "Kelompok Otot Utama & 5 Bentuk Latihan Kekuatan Dasar",
          sectionSummary: "Teknik gerakan Push-up, Crunch, Squat, Plank, dan Step-up beserta modifikasi pemula.",
          value: "",
          children: [
            {
              ...createDefaultBlock("procedure"),
              procMode: "exercise_tech",
              procCode: "B.1",
              title: "Teknik Dasar Latihan Kekuatan: Push-up, Squat & Plank",
              procMuscles: "Otot dada (pectoralis), trisep, bahu (deltoids), otot inti (core), kuadrisep, dan gluteus.",
              procSteps: [
                { label: "1. Posisi Awal", text: "Jaga garis tubuh tetap lurus dan terkontrol sesuai variasi tumpuan yang dipilih." },
                { label: "2. Fase Gerakan & Napas", text: "Turunkan tubuh secara terkendali lalu dorong kembali ke posisi awal tanpa menahan napas." },
              ],
              procMistakes:
                "Pinggul turun berlebihan, kepala mendongak, lutut masuk ke dalam saat squat, atau memaksakan repetisi saat teknik memburuk.",
              procBeginnerVariations: "Push-up dinding, push-up bangku/lutut, chair squat, atau knee plank.",
            },
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "C",
          title: "Latihan Kelenturan: Peregangan Dinamis vs Peregangan Statis",
          sectionSummary: "Perbedaan karakteristik, tujuan ROM, serta waktu penggunaan peregangan dinamis dan statis.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "C.1",
              title: "Peregangan Dinamis (Pemanasan) & Peregangan Statis (Pendinginan)",
              value:
                "Peregangan dinamis dilakukan melalui gerakan terkendali saat pemanasan, sedangkan peregangan statis mempertahankan posisi regang 10–30 detik saat latihan kelenturan atau pendinginan.",
            },
          ],
        },
        {
          ...createDefaultBlock("case_study"),
          title: "Studi Kasus: Kekuatan dan Kelenturan yang Berbeda",
          caseRows: [
            { aspect: "Push-up Teknik Baik", subjectA: "20 repetisi", subjectB: "8 repetisi" },
            { aspect: "Plank", subjectA: "40 detik", subjectB: "20 detik" },
            { aspect: "Rentang Gerak Membungkuk", subjectA: "Terbatas", subjectB: "Lebih luas" },
          ],
          caseKeyTakeaway: "Kekuatan, daya tahan otot, dan kelenturan merupakan komponen berbeda yang saling melengkapi.",
        },
        createDefaultBlock("learning_activity"),
      ];
    } else if (unitNumber === 4) {
      presetTitle = "Unit 4: Pengukuran Kebugaran dan Interpretasi Kondisi Tubuh";
      presetReflection = "Mengapa dua siswa yang mempunyai berat badan, tinggi badan, dan IMT yang sama belum tentu mempunyai kebugaran jasmani yang sama?";
      presetGuide = "Jelaskan perbedaan antara indikator antropometri (IMT) dan pengukuran performa kebugaran jasmani (TKJI).";
      blocks = [
        {
          ...createDefaultBlock("cp_tp"),
          learningFocus: "Memahami prosedur pengukuran 5 butir TKJI dan antropometri, menghitung IMT, serta menafsirkan hasil secara tepat.",
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "B",
          title: "Prosedur 5 Butir Pengukuran TKJI & Konversi Tabel Norma",
          sectionSummary: "Tata cara Lari 60m, Gantung, Baring Duduk, Loncat Tegak, Lari Jauh & Tabel Norma Usia 16–19 Tahun.",
          value: "",
          children: [
            {
              ...createDefaultBlock("procedure"),
              procMode: "tkji_test",
              procCode: "B.1",
              title: "Prosedur 5 Butir Pengukuran TKJI (Usia 16–19 Tahun)",
              procPurpose:
                "Mengukur kecepatan (Lari 60m), kekuatan/ketahanan lengan (Gantung), ketahanan perut (Baring duduk 60 dtk), daya ledak (Loncat tegak), dan daya tahan (Lari 1.200m/1.000m).",
              procTools: "Lintasan datar, stopwatch, palang tunggal, matras, papan skala loncat tegak, dan petugas pencatat.",
              procMistakes:
                "Mencuri start, dagu tidak melewati palang, mengayun tubuh, atau mencatat raihan tertinggi loncat tegak tanpa dikurangi raihan awal.",
            },
            createDefaultBlock("table"),
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "C",
          title: "Pengukuran Antropometri & Perhitungan Indeks Massa Tubuh (IMT)",
          sectionSummary: "Prosedur timbang berat & ukur tinggi badan, rumus pecahan IMT, dan keterbatasan IMT.",
          value: "",
          children: [createDefaultBlock("formula")],
        },
        createDefaultBlock("case_study"),
        createDefaultBlock("learning_activity"),
      ];
    } else if (unitNumber === 5) {
      presetTitle = "Unit 5: Pola Makan Sehat dan Hidrasi untuk Aktivitas Fisik";
      presetReflection =
        "Seorang siswa rutin berolahraga, tetapi sering melewatkan waktu makan, kurang tidur, dan jarang membawa air minum. Mengapa kebiasaan tersebut perlu diperbaiki meskipun ia aktif secara fisik?";
      presetGuide = "Jawaban yang baik menghubungkan aktivitas fisik dengan kebutuhan energi, zat gizi (Isi Piringku), hidrasi, serta pemulihan.";
      presetSample =
        "Aktivitas fisik merupakan satu bagian dari gaya hidup sehat, tetapi tubuh juga membutuhkan makanan beragam, cairan memadai, serta tidur untuk mendukung pertumbuhan, fungsi tubuh, dan pemulihan.";
      blocks = [
        {
          ...createDefaultBlock("cp_tp"),
          cpMain: "Memilih Hidup yang Menyehatkan",
          cpSupport: "Bergaya Hidup Aktif",
          learningFocus:
            "Memahami prinsip gizi seimbang, Isi Piringku, evaluasi pilihan makanan dan minuman, serta hubungan pola makan dan hidrasi dengan aktivitas fisik.",
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "B",
          title: "Zat Gizi Makro, Mikro, Air & Pedoman Isi Piringku",
          sectionSummary: "Fungsi Karbohidrat, Protein, Lemak, Vitamin, Mineral, Air serta komposisi piring makan remaja.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "B.1",
              title: "Mengenal Zat Gizi & Pedoman Isi Piringku",
              value:
                "Karbohidrat menyediakan energi utama, protein mendukung pertumbuhan dan perbaikan jaringan, lemak mendukung fungsi sel dan penyerapan vitamin A, D, E, K, sedangkan Isi Piringku membagi piring menjadi setengah sayur-buah dan setengah makanan pokok-lauk.",
            },
          ],
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "C",
          title: "Hidrasi & Pemilihan Minuman untuk Aktivitas Fisik",
          sectionSummary: "Perbandingan Air Putih, Minuman Olahraga (Sports Drink), dan Minuman Berenergi (Energy Drink).",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "C.1",
              title: "Air Putih, Sports Drink, dan Bahaya Energy Drink bagi Remaja",
              value:
                "Untuk kegiatan PJOK biasa, air putih adalah pilihan utama. Minuman berenergi yang mengandung kafein dan stimulan tidak dianjurkan bagi remaja.",
            },
          ],
        },
        {
          ...createDefaultBlock("case_study"),
          title: "Studi Kasus Terpadu: Adu Gaya Hidup Andi vs Budi di Kelas PJOK",
          caseSubjectALabel: "Andi",
          caseSubjectBLabel: "Budi",
          caseRows: [
            { aspect: "Sarapan", subjectA: "Nasi, telur, sayur", subjectB: "Tidak sarapan" },
            { aspect: "Bekal Minum", subjectA: "Membawa botol air putih", subjectB: "Tidak membawa air" },
            { aspect: "Tidur Malam", subjectA: "Sekitar 8 jam", subjectB: "Sekitar 5 jam" },
            { aspect: "Respons PJOK 40 Menit", subjectA: "Bugar & nyaman", subjectB: "Cepat lemas & lelah" },
          ],
          caseKeyTakeaway: "Pola makan, hidrasi, tidur, dan kebugaran merupakan faktor yang saling mendukung kesiapan beraktivitas fisik.",
        },
      ];
    } else {
      presetTitle = "Unit 6: Strategi Peningkatan Kebugaran dan Refleksi";
      presetReflection =
        "Mengapa strategi peningkatan kebugaran yang disesuaikan dengan kemampuan awal dan ditingkatkan secara bertahap lebih tepat daripada langsung melakukan aktivitas sangat berat tanpa perencanaan?";
      presetGuide = "Jawaban siswa diharapkan menghubungkan konsep individualisasi, FITT, progresi, dan pemulihan.";
      presetSample =
        "Strategi latihan perlu disesuaikan dengan kemampuan agar aktivitas dapat dilakukan secara aman dan berkelanjutan. Prinsip FITT membantu mengatur latihan, sedangkan progresi dan pemulihan memungkinkan tubuh beradaptasi secara bertahap.";
      blocks = [
        {
          ...createDefaultBlock("cp_tp"),
          learningFocus:
            "Mengintegrasikan pemahaman kebugaran, hasil pengukuran, prinsip latihan (FITT, SMART, progresi), gizi, hidrasi, dan keselamatan untuk menentukan strategi aktivitas fisik.",
        },
        {
          id: generateId(),
          type: "section_container",
          headingCode: "B",
          title: "Perumusan Tujuan SMART, Prinsip FITT & Simulasi Strategi",
          sectionSummary: "Kerangka Frequency, Intensity, Time, Type serta progresi latihan bertahap.",
          value: "",
          children: [
            {
              ...createDefaultBlock("topic_section"),
              headingCode: "B.1",
              title: "Menentukan Tujuan SMART & Prinsip FITT",
              value:
                "Tujuan peningkatan kebugaran perlu dirumuskan secara Spesifik, Terukur, Dapat Dicapai, Relevan, dan Berbatas Waktu (SMART), lalu diatur melalui Frequency, Intensity, Time, dan Type (FITT).",
            },
            createDefaultBlock("tempo_simulator"),
            createDefaultBlock("fitt_simulator"),
          ],
        },
        {
          ...createDefaultBlock("case_study"),
          title: "Studi Kasus: Strategi Latihan Raka vs Dimas",
          caseSubjectALabel: "Strategi Raka",
          caseSubjectBLabel: "Strategi Dimas",
          caseRows: [
            { aspect: "Aktivitas", subjectA: "Sprint maksimal", subjectB: "Jalan cepat & jogging" },
            { aspect: "Frekuensi", subjectA: "Setiap hari", subjectB: "3 kali per minggu" },
            { aspect: "Intensitas", subjectA: "Sangat berat", subjectB: "Ringan – sedang" },
            { aspect: "Pemulihan", subjectA: "Tidak ada", subjectB: "Ada waktu pemulihan" },
          ],
          caseKeyTakeaway: "Strategi latihan yang tepat bukanlah yang paling berat, melainkan yang sesuai kemampuan awal, aman, dan berkelanjutan.",
        },
        createDefaultBlock("learning_activity"),
      ];
    }

    blocks.push(
      {
        ...createDefaultBlock("reflection"),
        headingCode: "I",
        reflectionPrompt: presetReflection,
        reflectionGuide: presetGuide,
        reflectionSampleAnswer: presetSample,
      },
      { ...createDefaultBlock("quiz"), title: `J. Formatif Unit ${unitNumber}` },
      { ...createDefaultBlock("list"), title: `K. Rangkuman Unit ${unitNumber}`, listStyle: "number", items: ["", ""] },
      { ...createDefaultBlock("glossary"), headingCode: "L", title: `L. Glosarium Unit ${unitNumber}` }
    );

    setUnitName(presetTitle);
    setTriggerQuestion(presetReflection);
    setContentBlocks(blocks);

    const nextCollapsed: Record<string, boolean> = {};
    blocks.forEach((b, idx) => {
      if (idx > 1 && b.type !== "reflection") nextCollapsed[b.id] = true;
    });
    setCollapsedBlocks(nextCollapsed);

    triggerDynamicIsland(
      `Kerangka Berhirarki Unit ${unitNumber} Dimuat`,
      "Setiap Bab Utama kini memiliki Wadah Induk (Container) tersendiri.",
      "success"
    );
  };

  const ensureMandatoryReflectionBlock = (blocks: ContentBlock[], fallbackPrompt: string): ContentBlock[] => {
    const hasReflection = blocks.some((b) => b.type === "reflection");
    if (hasReflection) {
      return blocks.map((b) => {
        if (b.type === "reflection" && !String(b.reflectionPrompt || b.value || "").trim() && fallbackPrompt.trim()) {
          return { ...b, reflectionPrompt: fallbackPrompt.trim() };
        }
        return b;
      });
    }
    const reflectionBlock: ContentBlock = {
      ...createDefaultBlock("reflection"),
      reflectionPrompt: fallbackPrompt.trim() || "Tuliskan analisis dan refleksi pemahaman Anda setelah mempelajari unit ini:",
    };
    const copy = [...blocks];
    const evalIdx = copy.findIndex((b) => ["quiz", "glossary"].includes(b.type));
    if (evalIdx !== -1) copy.splice(evalIdx, 0, reflectionBlock);
    else copy.push(reflectionBlock);
    return copy;
  };

  // Update Block yang mendukung baik Blok Induk maupun Child Block di dalam Wadah Bab (section_container)
  const updateBlock = (id: string, patch: Partial<ContentBlock>) => {
    setContentBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id) return { ...b, ...patch };
        if (b.type === "section_container" && Array.isArray(b.children)) {
          const hasChild = b.children.some((c) => c.id === id);
          if (hasChild) {
            return {
              ...b,
              children: b.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
            };
          }
        }
        return b;
      })
    );
    scrollPreviewToBlock(id);
  };

  // Fungsi khusus manipulasi Sub-Blok (Children) di dalam Wadah Bab (section_container)
  const addChildToContainer = (containerId: string, childType: BlockType, insertAtIdx?: number) => {
    const newChild = createDefaultBlock(childType);
    setContentBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== containerId) return b;
        const currentChildren = [...(b.children || [])];
        const nextNum = currentChildren.length + 1;
        if (newChild.type === "topic_section" || newChild.type === "heading") {
          newChild.headingCode = `${b.headingCode || "B"}.${nextNum}`;
        } else if (newChild.type === "procedure") {
          newChild.procCode = `${b.headingCode || "B"}.${nextNum}`;
        }
        if (typeof insertAtIdx === "number" && insertAtIdx >= 0 && insertAtIdx <= currentChildren.length) {
          currentChildren.splice(insertAtIdx, 0, newChild);
        } else {
          currentChildren.push(newChild);
        }
        return { ...b, children: currentChildren };
      })
    );
    setInsertChildMenuForContainer(null);
    setTimeout(() => scrollPreviewToBlock(newChild.id), 80);
    triggerDynamicIsland("Sub-Bagian Ditambahkan ke Bab", `${getBlockTypeMeta(childType).label} masuk ke dalam wadah bab.`, "info");
  };

  const moveChildInContainer = (containerId: string, childIdx: number, direction: "up" | "down") => {
    setContentBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== containerId || !Array.isArray(b.children)) return b;
        const targetIdx = direction === "up" ? childIdx - 1 : childIdx + 1;
        if (targetIdx < 0 || targetIdx >= b.children.length) return b;
        const copy = [...b.children];
        const temp = copy[childIdx];
        copy[childIdx] = copy[targetIdx];
        copy[targetIdx] = temp;
        return { ...b, children: copy };
      })
    );
  };

  const duplicateChildInContainer = (containerId: string, childIdx: number) => {
    let duplicatedId = "";
    setContentBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== containerId || !Array.isArray(b.children)) return b;
        const cloned: ContentBlock = JSON.parse(JSON.stringify(b.children[childIdx]));
        cloned.id = generateId();
        duplicatedId = cloned.id;
        const copy = [...b.children];
        copy.splice(childIdx + 1, 0, cloned);
        return { ...b, children: copy };
      })
    );
    if (duplicatedId) setTimeout(() => scrollPreviewToBlock(duplicatedId), 80);
  };

  const removeChildFromContainer = (containerId: string, childId: string) => {
    setContentBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== containerId || !Array.isArray(b.children)) return b;
        if (b.children.length <= 1) {
          toast.error("Wadah Bab minimal memiliki 1 sub-bagian. Hapus Wadah Bab jika ingin menghapus seluruh bab.");
          return b;
        }
        return { ...b, children: b.children.filter((c) => c.id !== childId) };
      })
    );
  };

  const applyBlockQuickPreset = (blockId: string, presetKey: string) => {
    if (presetKey === "table_tkji_norma") {
      updateBlock(blockId, {
        tableTitle: "Tabel Nilai Norma TKJI (Usia 16–19 Tahun)",
        tableDescription: "Konversikan setiap hasil data mentah ke dalam nilai 1–5 sesuai kelompok Putra atau Putri.",
        hasCategoryFilter: true,
        tableVariants: [
          {
            id: generateId(),
            label: "Putra",
            headers: ["Nilai", "Lari 60 m", "Gantung Angkat", "Baring Duduk", "Loncat Tegak", "Lari 1.200 m"],
            rows: [
              ["5", "≤ 7,2 dtk", "≥ 19 kali", "≥ 41 kali", "≥ 73 cm", "≤ 3:14 mnt"],
              ["4", "7,3–8,3 dtk", "14–18 kali", "30–40 kali", "60–72 cm", "3:15–4:25 mnt"],
              ["3", "8,4–9,6 dtk", "9–13 kali", "21–29 kali", "50–59 cm", "4:26–5:12 mnt"],
              ["2", "9,7–11,0 dtk", "5–8 kali", "10–20 kali", "39–49 cm", "5:13–6:33 mnt"],
              ["1", "≥ 11,1 dtk", "0–4 kali", "0–9 kali", "≤ 38 cm", "≥ 6:34 mnt"],
            ],
            summaryText: "Rentang Nilai 1–5 per Butir Tes",
            summaryBadge: "NORMA PUTRA",
          },
          {
            id: generateId(),
            label: "Putri",
            headers: ["Nilai", "Lari 60 m", "Gantung Siku", "Baring Duduk", "Loncat Tegak", "Lari 1.000 m"],
            rows: [
              ["5", "≤ 8,4 dtk", "≥ 40 dtk", "≥ 29 kali", "≥ 50 cm", "≤ 3:52 mnt"],
              ["4", "8,5–9,8 dtk", "20–39 dtk", "20–28 kali", "39–49 cm", "3:53–4:56 mnt"],
              ["3", "9,9–11,4 dtk", "8–19 dtk", "10–19 kali", "31–38 cm", "4:57–5:58 mnt"],
              ["2", "11,5–13,4 dtk", "2–7 dtk", "3–9 kali", "23–30 cm", "5:59–7:23 mnt"],
              ["1", "≥ 13,5 dtk", "0–1 dtk", "0–2 kali", "≤ 22 cm", "≥ 7:24 mnt"],
            ],
            summaryText: "Rentang Nilai 1–5 per Butir Tes",
            summaryBadge: "NORMA PUTRI",
          },
        ],
      });
    } else if (presetKey === "table_tkji_simulasi") {
      updateBlock(blockId, {
        tableTitle: "Contoh Perhitungan Skor TKJI Siswa",
        tableDescription: "Simulasi konversi data mentah menjadi nilai akhir dan kategori kebugaran.",
        hasCategoryFilter: true,
        tableVariants: [
          {
            id: generateId(),
            label: "Contoh Putra",
            headers: ["Butir Tes", "Data Mentah", "Rentang Norma", "Nilai Akhir"],
            rows: [
              ["Lari 60 m", "8,8 detik", "8,4–9,6 detik", "3"],
              ["Gantung Angkat Tubuh", "12 kali", "9–13 kali", "3"],
              ["Baring Duduk 60 Detik", "26 kali", "21–29 kali", "3"],
              ["Loncat Tegak", "55 cm", "50–59 cm", "3"],
              ["Lari 1.200 m", "4:50 menit", "4:26–5:12 menit", "3"],
            ],
            summaryText: "TOTAL JUMLAH NILAI: 3 + 3 + 3 + 3 + 3 = 15",
            summaryBadge: "KATEGORI: SEDANG (S)",
          },
          {
            id: generateId(),
            label: "Contoh Putri",
            headers: ["Butir Tes", "Data Mentah", "Rentang Norma", "Nilai Akhir"],
            rows: [
              ["Lari 60 m", "9,5 detik", "8,5–9,8 detik", "4"],
              ["Gantung Siku Tekuk", "25 detik", "20–39 detik", "4"],
              ["Baring Duduk 60 Detik", "22 kali", "20–28 kali", "4"],
              ["Loncat Tegak", "42 cm", "39–49 cm", "4"],
              ["Lari 1.000 m", "5:10 menit", "4:57–5:58 menit", "3"],
            ],
            summaryText: "TOTAL JUMLAH NILAI: 4 + 4 + 4 + 4 + 3 = 19",
            summaryBadge: "KATEGORI: BAIK (B)",
          },
        ],
      });
    } else if (presetKey === "table_klasifikasi_tkji") {
      updateBlock(blockId, {
        tableTitle: "Tabel Klasifikasi Jumlah Nilai TKJI",
        tableDescription: "Setelah seluruh hasil mentah dikonversi, kelima nilai dijumlahkan untuk mendapatkan klasifikasi akhir.",
        hasCategoryFilter: false,
        tableVariants: [
          {
            id: generateId(),
            label: "Klasifikasi",
            headers: ["Jumlah Nilai", "Kategori Kebugaran", "Singkatan"],
            rows: [
              ["22–25", "Baik Sekali", "BS"],
              ["18–21", "Baik", "B"],
              ["14–17", "Sedang", "S"],
              ["10–13", "Kurang", "K"],
              ["5–9", "Kurang Sekali", "KS"],
            ],
            summaryText: "Berlaku untuk total 5 butir tes TKJI",
            summaryBadge: "SKALA 5–25",
          },
        ],
      });
    } else if (presetKey === "formula_imt") {
      updateBlock(blockId, {
        title: "Simulasi Menghitung Indeks Massa Tubuh (IMT)",
        formulaMode: "fraction",
        formulaLeft: "IMT",
        formulaNumerator: "Berat Badan (kg)",
        formulaDenominator: "Tinggi Badan (m) × Tinggi Badan (m)",
        formulaNote: "Pastikan satuan Tinggi Badan telah diubah dari sentimeter (cm) ke meter (m) dengan dibagi 100.",
        formulaCaseTitle: "Contoh Kasus: BB = 68 kg dan TB = 170 cm",
        formulaSteps: [
          { label: "1. Ubah TB ke Meter", expression: "170 cm / 100 = 1,70 m" },
          { label: "2. Kalikan Tinggi (m²)", expression: "1,70 m × 1,70 m = 2,89 m²" },
          { label: "3. Bagi BB dengan TB²", expression: "68 kg / 2,89 = 23,52 kg/m²" },
        ],
        formulaResult: "IMT = 23,52 (Dibulatkan 23,5)",
        formulaCategoryBadge: "KATEGORI: NORMAL / IDEAL",
      });
    } else if (presetKey === "formula_loncat") {
      updateBlock(blockId, {
        title: "Rumus Perhitungan Hasil Loncat Tegak (Vertical Jump)",
        formulaMode: "linear",
        formulaLinearExpr: "Tinggi Loncatan = Raihan Tertinggi − Raihan Awal",
        formulaNote: "Jangan mencatat raihan tertinggi secara langsung tanpa dikurangi tinggi raihan awal saat berdiri.",
        formulaCaseTitle: "Contoh Kasus Pengukuran Siswa:",
        formulaSteps: [
          { label: "Tahap 1: Raihan Awal", expression: "210 cm (berdiri menapak)" },
          { label: "Tahap 2: Raihan Loncatan", expression: "255 cm (titik tertinggi)" },
          { label: "Selisih Raihan", expression: "255 cm − 210 cm = 45 cm" },
        ],
        formulaResult: "Hasil Loncat Tegak = 45 cm",
        formulaCategoryBadge: "BUKAN 255 CM",
      });
    }
    triggerDynamicIsland("Format Cepat Diterapkan", "Data contoh telah dimuat ke dalam blok dan siap disesuaikan.", "info");
  };

  const parseMaterialToBlocks = (mat: any): ContentBlock[] => {
    let rawParsed: ContentBlock[] | null = null;

    if (mat?.content_blocks) {
      if (Array.isArray(mat.content_blocks) && mat.content_blocks.length > 0) {
        rawParsed = mat.content_blocks.map((b: any) => ({
          ...b,
          id: b?.id || generateId(),
          value: b?.value ?? "",
          children: Array.isArray(b?.children)
            ? b.children.map((c: any) => ({ ...c, id: c?.id || generateId(), value: c?.value ?? "" }))
            : undefined,
        }));
      } else if (typeof mat.content_blocks === "string") {
        try {
          const parsedJson = JSON.parse(mat.content_blocks);
          if (Array.isArray(parsedJson) && parsedJson.length > 0) {
            rawParsed = parsedJson.map((b: any) => ({
              ...b,
              id: b?.id || generateId(),
              value: b?.value ?? "",
              children: Array.isArray(b?.children)
                ? b.children.map((c: any) => ({ ...c, id: c?.id || generateId(), value: c?.value ?? "" }))
                : undefined,
            }));
          }
        } catch {}
      }
    }

    if (!rawParsed) {
      const htmlString = mat?.content_text || "";
      const fromMarker = decodeBlocksFromMarker(htmlString);
      if (fromMarker && fromMarker.length > 0) {
        rawParsed = fromMarker.map((b: any) => ({
          ...b,
          id: b?.id || generateId(),
          value: b?.value ?? "",
          children: Array.isArray(b?.children)
            ? b.children.map((c: any) => ({ ...c, id: c?.id || generateId(), value: c?.value ?? "" }))
            : undefined,
        }));
      } else if (!htmlString.trim()) {
        return [
          createDefaultBlock("cp_tp"),
          createDefaultBlock("section_container"),
          createDefaultBlock("reflection"),
        ];
      } else if (typeof window !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(stripMarkerFromHtml(htmlString), "text/html");
        const blocks: ContentBlock[] = [];
        doc.body.childNodes.forEach((node) => {
          if (node.nodeName === "P") {
            const el = node as HTMLElement;
            const strong = el.querySelector("strong");
            const isOnlyStrong = strong !== null && (el.textContent || "").trim() === (strong.textContent || "").trim();
            if (isOnlyStrong) {
              blocks.push({ id: generateId(), type: "heading", headingLevel: "section", title: strong.textContent || "", value: "" });
            } else {
              blocks.push({
                id: generateId(),
                type: "paragraph",
                value: el.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?strong>/gi, ""),
              });
            }
          } else if (node.nodeName === "UL" || node.nodeName === "OL") {
            const el = node as HTMLElement;
            const items = Array.from(el.querySelectorAll("li")).map((li) => li.textContent || "");
            blocks.push({
              id: generateId(),
              type: "list",
              title: "",
              listStyle: node.nodeName === "OL" ? "number" : "bullet",
              value: "",
              items: items.length > 0 ? items : [""],
            });
          } else if (node.nodeName === "BLOCKQUOTE") {
            blocks.push({ id: generateId(), type: "callout", title: "Catatan Penting", calloutTone: "amber", value: (node.textContent || "").trim() });
          }
        });
        rawParsed = blocks.length > 0 ? blocks : [createDefaultBlock("section_container")];
      } else {
        rawParsed = [createDefaultBlock("section_container")];
      }
    }

    return autoMigrateFlatToHierarchy(rawParsed);
  };

  const compileSingleBlockToHTML = (b: ContentBlock): string => {
    let html = "";
    const val = b.value || "";
    if (b.type === "cp_tp") {
      html += `<p><strong>${b.headingCode ? `${b.headingCode}. ` : ""}${b.title || "Identitas dan Tujuan Pembelajaran"}</strong></p>`;
      if (b.cpMain) html += `<p><strong>Elemen CP Utama:</strong> ${b.cpMain}</p>`;
      if (b.learningFocus) html += `<p><strong>Fokus Pembelajaran:</strong> ${b.learningFocus}</p>`;
      const objs = (b.objectivesList || []).filter((o) => String(o || "").trim() !== "").map((o) => `<li>${o}</li>`).join("");
      if (objs) html += `<ol>${objs}</ol>`;
    } else if (b.type === "section_container") {
      html += `<section data-section-code="${b.headingCode || ""}">`;
      if (b.title?.trim()) html += `<h2><strong>${b.headingCode ? `${b.headingCode}. ` : ""}${b.title}</strong></h2>`;
      if (b.sectionSummary?.trim()) html += `<p><em>${b.sectionSummary}</em></p>`;
      (b.children || []).forEach((child) => {
        html += compileSingleBlockToHTML(child);
      });
      html += `</section>`;
    } else if (b.type === "topic_section") {
      if (b.title?.trim()) html += `<p><strong>${b.headingCode ? `${b.headingCode}. ` : ""}${b.title}</strong></p>`;
      if (val.trim()) html += `<p>${val.replace(/\n/g, "<br/>")}</p>`;
      if (b.imageUrl && !b.imageUrl.startsWith("data:image")) html += `<p><img src="${b.imageUrl}" alt="${b.title || "Infografis"}" /></p>`;
      if (b.conclusionText?.trim()) html += `<blockquote>${b.conclusionText}</blockquote>`;
    } else if (b.type === "heading" && (b.title || val).trim()) {
      const prefix = b.headingCode ? `${b.headingCode}. ` : "";
      html += `<p><strong>${prefix}${b.title || val}</strong></p>`;
    } else if (b.type === "paragraph" && val.trim()) {
      html += `<p>${val.replace(/\n/g, "<br/>")}</p>`;
    } else if (b.type === "list" && b.items && b.items.length > 0) {
      if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
      const tag = b.listStyle === "number" || b.listStyle === "alpha" ? "ol" : "ul";
      const listItems = b.items.filter((i) => String(i || "").trim() !== "").map((i) => `<li>${i}</li>`).join("");
      if (listItems) html += `<${tag}>${listItems}</${tag}>`;
    } else if (b.type === "figure" || b.type === "procedure") {
      if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
      if (b.imageUrl && !b.imageUrl.startsWith("data:image")) html += `<p><img src="${b.imageUrl}" alt="${b.title || "Ilustrasi"}" /></p>`;
      if (b.procPurpose) html += `<p><strong>Tujuan:</strong> ${b.procPurpose}</p>`;
      if (b.procTools) html += `<p><strong>Alat & Petugas:</strong> ${b.procTools}</p>`;
      if (b.procMuscles) html += `<p><strong>Kelompok Otot:</strong> ${b.procMuscles}</p>`;
      if (b.procMistakes) html += `<blockquote><strong>Kesalahan yang Dihindari:</strong> ${b.procMistakes}</blockquote>`;
    } else if (b.type === "table") {
      if (b.tableTitle?.trim()) html += `<p><strong>${b.tableTitle}</strong></p>`;
      const firstVar = b.tableVariants?.[0];
      if (firstVar) {
        const ths = (firstVar.headers || []).map((h) => `<th>${h}</th>`).join("");
        const trs = (firstVar.rows || []).map((r) => `<tr>${(r || []).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
        html += `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
      }
    } else if (b.type === "formula") {
      html += `<p><strong>${b.title || "Rumus Perhitungan"}:</strong> ${
        b.formulaMode === "fraction" ? `${b.formulaLeft || "IMT"} = (${b.formulaNumerator || ""}) / (${b.formulaDenominator || ""})` : b.formulaLinearExpr || ""
      }</p>`;
      if (b.formulaResult) html += `<p><strong>Hasil:</strong> ${b.formulaResult}</p>`;
    } else if (b.type === "case_study") {
      html += `<p><strong>${b.headingCode ? `${b.headingCode}. ` : ""}${b.title || "Studi Kasus"}</strong></p>`;
      if (b.caseKeyTakeaway) html += `<blockquote>${b.caseKeyTakeaway}</blockquote>`;
    } else if (b.type === "learning_activity") {
      html += `<p><strong>${b.headingCode ? `${b.headingCode}. ` : ""}${b.title || "Aktivitas Pembelajaran"}</strong></p>`;
      if (b.activityOptionAText) html += `<p><strong>${b.activityOptionATitle || "Pilihan A"}:</strong> ${b.activityOptionAText}</p>`;
      if (b.activityOptionBText) html += `<p><strong>${b.activityOptionBTitle || "Pilihan B"}:</strong> ${b.activityOptionBText}</p>`;
    } else if (b.type === "fitt_simulator") {
      html += `<p><strong>${b.title || "Simulasi Strategi FITT"}</strong></p>`;
    } else if (b.type === "reflection") {
      html += `<blockquote><strong>Refleksi Pemahaman:</strong> ${b.reflectionPrompt || val}</blockquote>`;
    } else if (b.type === "callout") {
      html += `<blockquote><strong>${b.title || "Catatan"}:</strong> ${val}</blockquote>`;
    } else if (b.type === "video") {
      html += `<p><strong>${b.title || "Video Rujukan"}</strong>: ${val}</p>`;
    } else if (b.type === "quiz") {
      html += `<p><strong>Soal Formatif:</strong> ${b.question || ""}</p>`;
    } else if (b.type === "glossary") {
      html += `<p><strong>${b.title || "Glosarium"}</strong></p>`;
      (b.glossaryItems || []).forEach((gi) => {
        html += `<p><strong>${gi.term}:</strong> ${gi.definition}</p>`;
      });
    }
    return html;
  };

  const compileBlocksToHTML = (blocks: ContentBlock[]): string => {
    let html = "";
    blocks.forEach((b) => {
      html += compileSingleBlockToHTML(b);
    });

    const sanitizeImageInBlock = (blk: ContentBlock): ContentBlock => {
      const copy = { ...blk };
      if ((copy.type === "figure" || copy.type === "procedure" || copy.type === "topic_section") && copy.imageUrl?.startsWith("data:image")) {
        copy.imageUrl = "";
      }
      if (copy.type === "section_container" && Array.isArray(copy.children)) {
        copy.children = copy.children.map(sanitizeImageInBlock);
      }
      return copy;
    };

    const lightweightBlocks = blocks.map(sanitizeImageInBlock);
    return html + encodeBlocksToMarker(lightweightBlocks);
  };

  const openAddForm = () => {
    setEditingId(null);
    setOriginalUnitName("");
    setUnitName("");
    setTriggerQuestion("");
    setMediaUrl("");
    setImageUrl("");
    const initialBlocks: ContentBlock[] = [
      createDefaultBlock("cp_tp"),
      {
        ...createDefaultBlock("section_container"),
        headingCode: "B",
        title: "Pengantar & Konsep Dasar Materi",
        sectionSummary: "Ringkasan singkat mengenai bab pembahasan ini",
      },
      createDefaultBlock("case_study"),
      createDefaultBlock("learning_activity"),
      createDefaultBlock("reflection"),
      createDefaultBlock("quiz"),
      createDefaultBlock("list"),
      createDefaultBlock("glossary"),
    ];
    setContentBlocks(initialBlocks);
    setCollapsedBlocks({});
    setInsertMenuAtIndex(null);
    setPreviewStage("detail");
    setPreviewSectionFilter("all");
    setViewMode("form");
    triggerDynamicIsland(
      "Arsitektur Wadah Bab Siap",
      "Gunakan 'Kerangka Cepat Unit 1–6' atau 'Impor Naskah Word' di bagian atas.",
      "info"
    );
  };

  const openEditForm = (mat: any) => {
    setEditingId(mat.id);
    setOriginalUnitName(mat.unit_name || "");
    setActiveGrade(Number(mat.grade_level) || 10);
    setUnitName(mat.unit_name || "");
    const existingTrigger = mat.trigger_question || "";
    setTriggerQuestion(existingTrigger);
    setMediaUrl(mat.media_url || "");
    setImageUrl(mat.image_url || "");
    const parsed = ensureMandatoryReflectionBlock(parseMaterialToBlocks(mat), existingTrigger);
    setContentBlocks(parsed);
    const nextCollapsed: Record<string, boolean> = {};
    if (parsed.length > 4) {
      parsed.forEach((b, i) => {
        if (i > 1) nextCollapsed[b.id] = true;
      });
    }
    setCollapsedBlocks(nextCollapsed);
    setInsertMenuAtIndex(null);
    setPreviewStage("detail");
    setPreviewSectionFilter("all");
    setViewMode("form");
  };

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    const toastId = toast.loading("Mengunggah gambar ke penyimpanan...");
    try {
      const cleanExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const filePath = `materi/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
      const { error: uploadError } = await supabase.storage.from("edufit_media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (uploadError) {
        const compressedDataUrl = await compressImageToDataUrl(file);
        toast.success("Gambar berhasil diterapkan!", { id: toastId, duration: 3500 });
        return compressedDataUrl;
      }
      const { data } = supabase.storage.from("edufit_media").getPublicUrl(filePath);
      toast.success("Gambar berhasil diunggah!", { id: toastId });
      return data.publicUrl;
    } catch {
      try {
        const compressedDataUrl = await compressImageToDataUrl(file);
        toast.success("Gambar berhasil dioptimalkan dan dipasang!", { id: toastId });
        return compressedDataUrl;
      } catch {
        toast.error("Gagal memproses file gambar", { id: toastId });
        return null;
      }
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    const url = await uploadFileToSupabase(file);
    if (url) {
      setImageUrl(url);
      triggerDynamicIsland("Sampul Unit Diperbarui", "Gambar sampul langsung tampil pada pratinjau aplikasi siswa.", "success");
    }
    setIsUploadingHero(false);
    e.target.value = "";
  };

  const handleBlockFigureUpload = async (blockId: string, file?: File) => {
    if (!file) return;
    setUploadingBlockId(blockId);
    const url = await uploadFileToSupabase(file);
    if (url) {
      updateBlock(blockId, { imageUrl: url });
      triggerDynamicIsland("Ilustrasi Materi Terpasang", "Gambar berhasil disesuaikan ke dalam bagian materi.", "success");
    }
    setUploadingBlockId(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!unitName.trim()) {
      triggerDynamicIsland("Judul Unit Wajib Diisi", "Masukkan nama unit pembelajaran terlebih dahulu.", "error");
      return toast.error("Judul Unit Materi wajib diisi.");
    }
    if (!imageUrl.trim()) {
      triggerDynamicIsland("Gambar Sampul Wajib Diisi", "Unggah gambar sampul agar kartu unit tampil selaras di aplikasi siswa.", "error");
      return toast.error("Gambar Sampul Unit wajib diisi sebelum menyimpan modul!");
    }

    const reflectionBlock = contentBlocks.find((b) => b.type === "reflection");
    const effectiveReflectionQuestion = (reflectionBlock?.reflectionPrompt || triggerQuestion || "").trim();

    if (!effectiveReflectionQuestion) {
      triggerDynamicIsland("Pertanyaan Refleksi Wajib Diisi", "Diperlukan untuk penugasan refleksi siswa yang dinilai oleh Guru.", "error");
      return toast.error("Pertanyaan Pemantik & Refleksi Siswa wajib diisi.");
    }

    setIsSubmitting(true);

    try {
      const blocksWithReflection = ensureMandatoryReflectionBlock(contentBlocks, effectiveReflectionQuestion);
      const sanitizedBlocks: ContentBlock[] = JSON.parse(
        JSON.stringify(
          blocksWithReflection.map((b) => ({
            ...b,
            id: b.id || generateId(),
            value: b.value ?? "",
            children: Array.isArray(b.children)
              ? b.children.map((c) => ({ ...c, id: c.id || generateId(), value: c.value ?? "" }))
              : undefined,
          }))
        )
      );
      const compiledHtml = compileBlocksToHTML(sanitizedBlocks);
      const nowIso = new Date().toISOString();
      const currentOrder = editingId
        ? allMaterials.find((m) => m.id === editingId)?.order_index || 0
        : allMaterials.filter((m) => Number(m.grade_level) === Number(activeGrade)).length + 1;

      const fullPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: effectiveReflectionQuestion,
        content_text: compiledHtml,
        content_blocks: sanitizedBlocks,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim(),
        order_index: currentOrder,
        updated_at: nowIso,
      };

      const legacyPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: effectiveReflectionQuestion,
        content_text: compiledHtml,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim(),
        order_index: currentOrder,
        updated_at: nowIso,
      };

      let savedRecord: any = null;

      if (editingId) {
        let { data, error } = await supabase.from("master_materials").update(fullPayload).eq("id", editingId).select();
        if (error) {
          const retry = await supabase.from("master_materials").update(legacyPayload).eq("id", editingId).select();
          if (retry.error) throw retry.error;
          data = retry.data;
        }
        if ((!data || data.length === 0) && originalUnitName) {
          const byName = await supabase
            .from("master_materials")
            .update(fullPayload)
            .eq("grade_level", Number(activeGrade))
            .eq("unit_name", originalUnitName)
            .select();
          if (!byName.error && byName.data && byName.data.length > 0) data = byName.data;
        }
        if (!data || data.length === 0) {
          const upsertAttempt = await supabase.from("master_materials").upsert([{ id: editingId, ...fullPayload }], { onConflict: "id" }).select();
          if (upsertAttempt.error) throw new Error(upsertAttempt.error.message);
          data = upsertAttempt.data;
        }
        savedRecord = data[0];

        if (originalUnitName && originalUnitName.trim() !== unitName.trim()) {
          await supabase.from("student_reflections").update({ unit_name: unitName.trim(), updated_at: nowIso }).eq("unit_name", originalUnitName.trim());
        }
      } else {
        let { data, error } = await supabase.from("master_materials").insert([fullPayload]).select();
        if (error) {
          const retry = await supabase.from("master_materials").insert([legacyPayload]).select();
          if (retry.error) throw retry.error;
          data = retry.data;
        }
        savedRecord = data?.[0];
      }

      if (savedRecord) {
        setAllMaterials((prev) => {
          const exists = prev.some((item) => item.id === savedRecord.id);
          if (exists) return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item));
          return [...prev, savedRecord];
        });
      }

      toast.success("Modul materi pembelajaran berhasil disimpan!");
      triggerDynamicIsland("Modul Materi Tersimpan", `${unitName.trim()} telah aktif di Aplikasi Siswa.`, "success");
      await fetchMaterials();
      setViewMode("list");
    } catch (err: any) {
      toast.error("Gagal menyimpan materi: " + (err?.message || ""));
      triggerDynamicIsland("Gagal Menyimpan Modul", err?.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast("Hapus Materi", {
      description: `Yakin hapus materi "${name}"?`,
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            const { error } = await supabase.from("master_materials").delete().eq("id", id);
            if (error) throw error;
            setAllMaterials((prev) => prev.filter((m) => m.id !== id));
            fetchMaterials();
          } catch (err: any) {
            toast.error("Gagal menghapus materi: " + (err?.message || ""));
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const addBlock = (type: BlockType, insertAtIndex?: number) => {
    const newBlock = createDefaultBlock(type);
    setContentBlocks((prev) => {
      if (typeof insertAtIndex === "number" && insertAtIndex >= 0 && insertAtIndex <= prev.length) {
        const copy = [...prev];
        copy.splice(insertAtIndex, 0, newBlock);
        return copy;
      }
      return [...prev, newBlock];
    });
    setCollapsedBlocks((prev) => ({ ...prev, [newBlock.id]: false }));
    setInsertMenuAtIndex(null);
    setTimeout(() => scrollPreviewToBlock(newBlock.id), 90);
    triggerDynamicIsland("Bagian Materi Ditambahkan", `${getBlockTypeMeta(type).label} siap diisi.`, "info");
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= contentBlocks.length) return;
    const copy = [...contentBlocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setContentBlocks(copy);
    setTimeout(() => scrollPreviewToBlock(copy[targetIdx].id), 80);
  };

  const duplicateBlock = (index: number) => {
    const cloned: ContentBlock = JSON.parse(JSON.stringify(contentBlocks[index]));
    cloned.id = generateId();
    if (Array.isArray(cloned.children)) {
      cloned.children = cloned.children.map((c) => ({ ...c, id: generateId() }));
    }
    const copy = [...contentBlocks];
    copy.splice(index + 1, 0, cloned);
    setContentBlocks(copy);
    setCollapsedBlocks((prev) => ({ ...prev, [cloned.id]: false }));
    setTimeout(() => scrollPreviewToBlock(cloned.id), 80);
  };

  const removeBlock = (id: string) => {
    const target = contentBlocks.find((b) => b.id === id);
    if (target?.type === "reflection" && contentBlocks.filter((b) => b.type === "reflection").length <= 1) {
      return toast.error("Blok Refleksi Pemahaman bersifat wajib (minimal 1 per unit). Anda dapat menggeser urutannya.");
    }
    if (contentBlocks.length === 1) return toast.error("Modul minimal harus memiliki 1 bagian materi.");
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleCollapseAllBlocks = (collapse: boolean) => {
    const map: Record<string, boolean> = {};
    contentBlocks.forEach((b) => {
      map[b.id] = collapse;
    });
    setCollapsedBlocks(map);
  };

  const totalBlocksActiveGrade = useMemo(
    () => materials.reduce((acc, m) => acc + countTotalBlocksRecursive(parseMaterialToBlocks(m)), 0),
    [materials]
  );

  const reflectionStats = useMemo(() => {
    const valid = allReflections.filter(
      (r) => String(r.unit_name || "").toLowerCase() !== "cp_tp_read" && String(r.unit_name || "").toLowerCase() !== "akhir"
    );
    const graded = valid.filter((r) => r.score !== null || (r.grade && String(r.grade).trim() !== "")).length;
    const pct = valid.length > 0 ? Math.round((graded / valid.length) * 100) : 0;
    return { total: valid.length, graded, pct };
  }, [allReflections]);

  const reflectionsByUnitMap = useMemo(() => {
    const map: Record<string, { total: number; graded: number }> = {};
    allReflections.forEach((r) => {
      const uName = String(r.unit_name || "").trim();
      if (!uName) return;
      if (!map[uName]) map[uName] = { total: 0, graded: 0 };
      map[uName].total += 1;
      if (r.score !== null || (r.grade && String(r.grade).trim() !== "")) map[uName].graded += 1;
    });
    return map;
  }, [allReflections]);

  const gradeCountBreakdown = useMemo(() => {
    const g10 = allMaterials.filter((m) => Number(m.grade_level) === 10).length;
    const g11 = allMaterials.filter((m) => Number(m.grade_level) === 11).length;
    const g12 = allMaterials.filter((m) => Number(m.grade_level) === 12).length;
    return { g10, g11, g12, total: Math.max(1, g10 + g11 + g12) };
  }, [allMaterials]);

  const estimatedReadMinutes = useMemo(() => {
    const extractTextRecursive = (b: ContentBlock): string => {
      const selfText = `${b.title || ""} ${b.value || ""} ${b.sectionSummary || ""} ${b.conclusionText || ""} ${(b.items || []).join(" ")} ${(b.objectivesList || []).join(" ")} ${b.procPurpose || ""} ${b.procTools || ""} ${b.procMuscles || ""}`;
      const childText = Array.isArray(b.children) ? b.children.map(extractTextRecursive).join(" ") : "";
      return `${selfText} ${childText}`;
    };
    const textCombined = contentBlocks.map(extractTextRecursive).join(" ");
    const words = textCombined.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.ceil(words / 130));
  }, [contentBlocks]);

  const filteredPreviewBlocks = useMemo(() => {
    if (previewSectionFilter === "all") return contentBlocks;
    if (previewSectionFilter === "materi") {
      return contentBlocks.filter((b) =>
        ["cp_tp", "section_container", "topic_section", "heading", "paragraph", "list", "collapsible", "callout", "glossary"].includes(b.type)
      );
    }
    if (previewSectionFilter === "media") {
      return contentBlocks.filter(
        (b) =>
          ["figure", "procedure", "table", "video"].includes(b.type) ||
          (b.type === "section_container" && (b.children || []).some((c) => ["figure", "procedure", "table", "video", "topic_section"].includes(c.type)))
      );
    }
    return contentBlocks.filter(
      (b) =>
        ["formula", "case_study", "learning_activity", "fitt_simulator", "tempo_simulator", "reflection", "quiz"].includes(b.type) ||
        (b.type === "section_container" && (b.children || []).some((c) => ["formula", "fitt_simulator", "tempo_simulator"].includes(c.type)))
    );
  }, [contentBlocks, previewSectionFilter]);

  const handleExportMateriCSV = () => {
    const rows = [
      ["Jenjang Kelas", "Judul Unit Materi", "Gambar Sampul", "Jumlah Bagian Materi", "Pertanyaan Pemantik", "Jawaban Refleksi Siswa"],
      ...allMaterials.map((m) => {
        const bLen = countTotalBlocksRecursive(parseMaterialToBlocks(m));
        const rStat = reflectionsByUnitMap[m.unit_name] || { total: 0, graded: 0 };
        const hasThumb = m.image_url ? "Lengkap" : "Kosong";
        return [
          `Kelas ${m.grade_level}`,
          `"${String(m.unit_name || "").replace(/"/g, '""')}"`,
          hasThumb,
          bLen,
          `"${String(m.trigger_question || "").replace(/"/g, '""')}"`,
          `${rStat.graded}/${rStat.total} Dinilai`,
        ];
      }),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Kurikulum_Materi_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland("Kurikulum Materi Diunduh", "Laporan CSV berhasil diekspor.", "success");
  };

  if (!mounted) return null;

  const isCompact320 = previewViewport === 320;
  const isTablet768 = previewViewport === 768;

  const renderDynamicIsland = () => (
    <AnimatePresence>
      {islandAlert && (
        <div className="fixed top-5 left-0 right-0 z-[120] flex justify-center pointer-events-none px-4">
          <motion.div
            key={islandAlert.id}
            initial={{ opacity: 0, scale: 0.86, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -12 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[28px] dynamic-island-shell ${
              islandAlert.type === "success"
                ? "dynamic-island-success"
                : islandAlert.type === "error"
                ? "dynamic-island-error"
                : "dynamic-island-info"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                islandAlert.type === "success"
                  ? "dynamic-island-icon-success"
                  : islandAlert.type === "error"
                  ? "dynamic-island-icon-error"
                  : "dynamic-island-icon-info"
              }`}
            >
              {islandAlert.type === "success" ? <CheckCircle2 size={16} /> : islandAlert.type === "error" ? <AlertCircle size={16} /> : <Bell size={16} />}
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-white leading-tight truncate">{islandAlert.message}</p>
              {islandAlert.subtitle && <p className="text-[11px] font-medium text-white/70 truncate mt-0.5">{islandAlert.subtitle}</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderYouTubeAttachmentPreview = (rawUrl: string, labelTitle: string, subText?: string, blockKey?: string) => {
    const ytId = extractYouTubeId(rawUrl);
    const isPlaying = blockKey ? previewVideoLoaded[blockKey] : false;
    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "";

    return (
      <div className="rounded-2xl overflow-hidden border border-[#7dd3fc] bg-[#e0f2fe]/70 shadow-sm">
        {ytId ? (
          isPlaying ? (
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                title={labelTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              onClick={() => blockKey && setPreviewVideoLoaded({ ...previewVideoLoaded, [blockKey]: true })}
              className="relative w-full h-40 bg-[#0c1713] overflow-hidden cursor-pointer group"
            >
              <img src={thumbUrl} alt={labelTitle} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-between p-3.5">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider bg-black/65 text-white border border-white/15">
                    VIDEO PEMBELAJARAN
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-[#ea580c] text-white">PUTAR</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#ea580c] text-white flex items-center justify-center shadow-lg shrink-0">
                    <Play size={15} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{labelTitle}</p>
                    <p className="text-[10px] text-white/80 truncate">{subText || "Ketuk untuk memutar video di aplikasi siswa"}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="p-3.5 flex items-center justify-between gap-2 bg-[#e0f2fe]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                <Video size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#075985] truncate">{labelTitle}</p>
                <p className="text-[10px] font-mono text-[#0284c7] truncate">{rawUrl}</p>
              </div>
            </div>
            <a href={rawUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white text-[#075985] hover:opacity-80 shrink-0">
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    );
  };

  // Fungsi Render Tiap Item Materi di Dalam Layar HP Siswa (Dilengkapi ID `preview-node-${b.id}` untuk Auto-Scroll Sync)
  const renderPreviewBlockNode = (b: ContentBlock, idx: number, isInsideContainer = false) => {
    const isActivelyFocused = activeFocusedBlockId === b.id;
    const focusRingClass = isActivelyFocused ? "ring-2 ring-[#1f7a5c] ring-offset-2 rounded-2xl transition-all duration-300" : "";

    return (
      <div
        key={b.id}
        id={`preview-node-${b.id}`}
        className={`${
          !isInsideContainer && idx > 0 && ["section_container", "cp_tp", "case_study", "learning_activity", "reflection", "glossary"].includes(b.type)
            ? "pt-4 border-t border-[#12201a]/10"
            : ""
        } ${focusRingClass}`}
      >
        {/* WADAH BAB UTAMA (SECTION CONTAINER) DI LAYAR HP */}
        {b.type === "section_container" && (
          <div className="rounded-2xl overflow-hidden border border-[#12201a]/15 bg-[#f8faf9] shadow-sm">
            <div className="p-3.5 bg-[#13211c] text-white flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-[#facc15] text-[#14120e] font-mono text-xs font-extrabold shrink-0 mt-0.5">
                  {b.headingCode || `BAB ${idx}`}
                </span>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-white leading-snug">{b.title || "Judul Bab Utama"}</h3>
                  {b.sectionSummary && <p className="text-[11px] text-white/75 leading-relaxed mt-0.5">{b.sectionSummary}</p>}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/15 text-white/90 shrink-0">
                {(b.children || []).length} Sub
              </span>
            </div>
            <div className="p-3 space-y-3.5 bg-white">
              {(b.children || []).map((child, cIdx) => renderPreviewBlockNode(child, cIdx, true))}
            </div>
          </div>
        )}

        {b.type === "cp_tp" && (
          <div className="rounded-2xl p-3.5 space-y-3 materi-block-cptp">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-extrabold font-mono bg-[#1f7a5c] text-white">{b.headingCode || "A"}</span>
              <h3 className="font-extrabold text-sm text-[#065f46]">{b.title || "Identitas dan Tujuan Pembelajaran"}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {b.cpMain && (
                <div className="p-2.5 rounded-xl bg-white/90 border border-[#a7f3d0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f7a5c] block">Elemen CP Utama</span>
                  <p className="font-bold text-[#14120e] mt-0.5">{b.cpMain}</p>
                </div>
              )}
              {b.cpSupport && (
                <div className="p-2.5 rounded-xl bg-white/90 border border-[#a7f3d0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f7a5c] block">Elemen Pendukung</span>
                  <p className="font-semibold text-[#14120e] mt-0.5">{b.cpSupport}</p>
                </div>
              )}
              {b.learningFocus && (
                <div className="p-2.5 rounded-xl bg-white/90 border border-[#a7f3d0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f7a5c] block">Fokus Pembelajaran</span>
                  <p className="text-[#44403c] leading-relaxed mt-0.5">{b.learningFocus}</p>
                </div>
              )}
            </div>
            {(b.objectivesList || []).some((o) => String(o || "").trim()) && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-extrabold text-[#065f46]">Setelah mempelajari unit ini, peserta didik diharapkan mampu:</p>
                {(b.objectivesList || []).map((obj, oIdx) => (
                  <div key={oIdx} className="flex items-start gap-2 text-xs text-[#14120e]">
                    <span className="w-5 h-5 rounded-md bg-[#13211c] text-[#facc15] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {oIdx + 1}
                    </span>
                    <span className="leading-relaxed">{obj || "Tujuan pembelajaran..."}</span>
                  </div>
                ))}
              </div>
            )}
            {b.operationalNote && <p className="text-[11px] italic text-[#52635b] pt-1 border-t border-[#a7f3d0]">{b.operationalNote}</p>}
          </div>
        )}

        {b.type === "topic_section" && (
          <div className="rounded-2xl p-3.5 space-y-3 bg-[#f8faf9] border border-[#12201a]/12">
            <div className="flex items-start gap-2">
              {b.headingCode && (
                <span className="px-2 py-0.5 rounded bg-[#1f7a5c] text-white font-mono text-[11px] font-extrabold shrink-0 mt-0.5">
                  {b.headingCode}
                </span>
              )}
              <h4 className="font-extrabold text-sm text-[#14120e] leading-snug">{b.title || "Sub-Topik Materi Pembelajaran"}</h4>
            </div>
            {b.value && <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-[#44403c]">{b.value}</p>}
            {b.imageUrl && (
              <div className="space-y-1">
                <div
                  onClick={() => setZoomedImageUrl(b.imageUrl || null)}
                  className="relative cursor-zoom-in rounded-xl overflow-hidden bg-white border border-[#12201a]/10 p-1.5"
                >
                  <img src={b.imageUrl} alt={b.title || "Infografis"} className="w-full max-h-64 object-contain rounded-lg mx-auto" />
                  <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/75 text-white text-[10px] font-bold flex items-center gap-1">
                    <Maximize2 size={10} /> Perbesar Infografis
                  </span>
                </div>
                {b.caption && <p className="text-[10px] italic text-[#52635b] px-1">{b.caption}</p>}
              </div>
            )}
            {b.conclusionText && (
              <div className="p-3 rounded-xl bg-[#fef3c7] border border-[#fde047] text-xs text-[#78350f] font-semibold leading-relaxed">
                {b.conclusionText}
              </div>
            )}
          </div>
        )}

        {b.type === "heading" && (
          <div className="flex items-start gap-2">
            <span
              className={`font-extrabold font-mono px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                b.headingLevel === "sub"
                  ? "bg-[#fef3c7] text-[#78350f] text-xs"
                  : b.headingLevel === "point"
                  ? "bg-[#e0f2fe] text-[#075985] text-xs"
                  : "bg-[#13211c] text-[#facc15] text-xs"
              }`}
            >
              {b.headingCode || `${idx + 1}`}
            </span>
            <h3
              className={`font-extrabold tracking-tight text-[#14120e] leading-snug ${
                b.headingLevel === "sub" ? "text-sm" : b.headingLevel === "point" ? "text-xs" : "text-base"
              }`}
            >
              {b.title || b.value || "Judul Bagian Pembahasan"}
            </h3>
          </div>
        )}

        {b.type === "paragraph" && (
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-[#44403c]">
            {b.value || "Teks penjelasan paragraf akan tampil di sini..."}
          </p>
        )}

        {b.type === "list" && (
          <div className="space-y-2">
            {b.title && <p className="text-xs sm:text-sm font-bold text-[#14120e]">{b.title}</p>}
            <div className="space-y-2 pl-0.5">
              {(b.items || []).map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#14120e]">
                  <span className="w-5 h-5 rounded-md text-[10px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 bg-[#13211c] text-[#facc15]">
                    {b.listStyle === "number" ? `${i + 1}` : b.listStyle === "alpha" ? `${String.fromCharCode(97 + i)}` : "-"}
                  </span>
                  <span className="leading-relaxed">{item || "Butir penjelasan..."}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {b.type === "collapsible" && (
          <details open className="rounded-2xl p-3.5 group bg-[#e6f5ed] border border-[#a7f3d0]">
            <summary className="font-bold text-xs sm:text-sm cursor-pointer list-none flex items-center justify-between gap-2 text-[#065f46]">
              <span>{b.title || "Panduan Rincian"}</span>
              <ChevronDown size={15} className="shrink-0" />
            </summary>
            <div className="mt-3 pt-3 border-t border-[#a7f3d0] space-y-2 text-xs">
              {b.collapsibleMode === "text" ? (
                <p className="leading-relaxed whitespace-pre-line text-[#14120e]">{b.value || "Isi penjelasan..."}</p>
              ) : (
                (b.collapsibleItems || []).map((ci, cIdx) => (
                  <div key={cIdx} className="p-2.5 rounded-xl bg-white shadow-sm border border-[#a7f3d0]">
                    <span className="font-bold block text-xs text-[#14120e]">{ci.label}</span>
                    <span className="text-xs leading-relaxed text-[#52635b] mt-0.5 block">{ci.text}</span>
                  </div>
                ))
              )}
            </div>
          </details>
        )}

        {b.type === "figure" &&
          (() => {
            const theme = b.figureTheme || "green";
            let bgClass = "bg-[#e6f5ed] border-[#a7f3d0]";
            if (theme === "blue") bgClass = "bg-[#e0f2fe] border-[#7dd3fc]";
            if (theme === "neutral") bgClass = "bg-[#f3f6f4] border-[#cbd5d0]";
            return (
              <div className="space-y-1.5">
                <div className={`rounded-2xl p-3.5 space-y-2 border ${bgClass}`}>
                  {b.overline && <span className="text-[10px] font-bold font-mono uppercase tracking-widest block text-[#52635b]">{b.overline}</span>}
                  {b.title && <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e]">{b.title}</h4>}
                  {b.imageUrl ? (
                    <div
                      onClick={() => setZoomedImageUrl(b.imageUrl || null)}
                      className="relative group cursor-zoom-in rounded-xl overflow-hidden bg-white/80 p-1"
                    >
                      <img src={b.imageUrl} alt={b.title || "Ilustrasi"} className="w-full rounded-lg object-contain max-h-64 mx-auto" />
                      <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold flex items-center gap-1">
                        <Maximize2 size={10} /> Perbesar Gambar
                      </span>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                      Gambar ilustrasi tampil di sini
                    </div>
                  )}
                </div>
                {b.caption && <p className="text-[11px] italic leading-relaxed px-1 text-[#52635b]">{b.caption}</p>}
              </div>
            );
          })()}

        {b.type === "procedure" && (
          <div className="rounded-2xl p-3.5 space-y-3 bg-[#f3f6f4] border border-[#12201a]/15">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md text-xs font-extrabold font-mono bg-[#13211c] text-[#facc15] shrink-0">
                  {b.procCode || "PROSEDUR"}
                </span>
                <h4 className="font-extrabold text-sm text-[#14120e] truncate">{b.title || "Prosedur / Teknik Gerakan"}</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white border border-[#12201a]/10 text-[#52635b] shrink-0">
                {b.procMode === "exercise_tech" ? "Teknik Latihan" : "Prosedur Tes"}
              </span>
            </div>

            {b.imageUrl && (
              <div
                onClick={() => setZoomedImageUrl(b.imageUrl || null)}
                className="relative cursor-zoom-in rounded-xl overflow-hidden bg-white border border-[#12201a]/10 p-1.5"
              >
                <img src={b.imageUrl} alt={b.title || "Poster Prosedur"} className="w-full max-h-64 object-contain rounded-lg mx-auto" />
                <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/75 text-white text-[10px] font-bold flex items-center gap-1">
                  <Maximize2 size={10} /> Perbesar Infografis
                </span>
              </div>
            )}

            {(b.procMode || "tkji_test") === "tkji_test" ? (
              <div className="grid grid-cols-1 gap-2 text-xs">
                {b.procPurpose && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#12201a]/10">
                    <span className="text-[10px] font-extrabold uppercase text-[#1f7a5c] block">a. Tujuan Pengukuran</span>
                    <p className="text-[#14120e] mt-0.5 leading-relaxed">{b.procPurpose}</p>
                  </div>
                )}
                {b.procTools && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#12201a]/10">
                    <span className="text-[10px] font-extrabold uppercase text-[#0284c7] block">b. Alat & Petugas</span>
                    <p className="text-[#14120e] mt-0.5 leading-relaxed">{b.procTools}</p>
                  </div>
                )}
              </div>
            ) : (
              b.procMuscles && (
                <div className="p-2.5 rounded-xl bg-[#e6f5ed] border border-[#a7f3d0] text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#065f46] block">Kelompok Otot Utama yang Bekerja</span>
                  <p className="text-[#14120e] font-semibold mt-0.5 leading-relaxed">{b.procMuscles}</p>
                </div>
              )
            )}

            {(b.procSteps || []).some((s) => String(s.text || "").trim()) && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[#52635b] block">Tahapan Pelaksanaan:</span>
                {(b.procSteps || []).map((st, sIdx) => (
                  <div key={sIdx} className="p-2.5 rounded-xl bg-white border border-[#12201a]/10 text-xs">
                    <span className="font-extrabold text-[#14120e] block">{st.label}</span>
                    <span className="text-[#44403c] leading-relaxed mt-0.5 block">{st.text}</span>
                  </div>
                ))}
              </div>
            )}

            {b.procMistakes && (
              <div className="p-3 rounded-xl materi-procedure-invalid-box text-xs space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider block">Kesalahan yang Perlu Dihindari:</span>
                <p className="leading-relaxed font-medium">{b.procMistakes}</p>
              </div>
            )}

            {b.procMode === "exercise_tech" && b.procBeginnerVariations && (
              <div className="p-2.5 rounded-xl bg-[#e0f2fe] border border-[#7dd3fc] text-[#075985] text-xs">
                <span className="text-[10px] font-extrabold uppercase block">Variasi untuk Pemula:</span>
                <p className="mt-0.5 font-medium leading-relaxed">{b.procBeginnerVariations}</p>
              </div>
            )}

            {b.procHighlightNote && (
              <div className="p-2.5 rounded-xl bg-[#fef3c7] border border-[#fde047] text-[#78350f] text-xs font-semibold">
                <strong>Catatan Penting:</strong> {b.procHighlightNote}
              </div>
            )}

            {b.caption && <p className="text-[11px] italic text-[#52635b]">{b.caption}</p>}
          </div>
        )}

        {b.type === "table" && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {b.tableTitle && <h4 className="font-extrabold text-sm text-[#14120e]">{b.tableTitle}</h4>}
              {b.hasCategoryFilter && (b.tableVariants?.length || 0) > 1 && (
                <div className="flex items-center gap-1">
                  {b.tableVariants?.map((v, vIdx) => {
                    const active = (previewSelectedVariant[b.id] || 0) === vIdx;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setPreviewSelectedVariant({ ...previewSelectedVariant, [b.id]: vIdx })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                          active ? "bg-[#ea580c] text-white shadow-sm" : "bg-[#f3f6f4] text-[#52635b]"
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {b.tableDescription && <p className="text-xs leading-relaxed text-[#52635b]">{b.tableDescription}</p>}
            {(() => {
              const activeVar = b.tableVariants?.[previewSelectedVariant[b.id] || 0] || b.tableVariants?.[0];
              if (!activeVar) return null;
              return (
                <div className="rounded-xl border border-[#12201a]/15 overflow-hidden">
                  <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#ebf0ed]">
                          {activeVar.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5 font-extrabold border-b border-[#12201a]/10 text-[#14120e] whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeVar.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="border-b border-[#12201a]/5 last:border-b-0 bg-white">
                            {r.map((c, cIdx) => (
                              <td
                                key={cIdx}
                                className={`p-2.5 align-top leading-relaxed text-[#14120e] ${cIdx === 0 ? "font-extrabold font-mono" : ""}`}
                              >
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(activeVar.summaryText || activeVar.summaryBadge) && (
                    <div className="p-3 materi-table-summary-bar flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-white">{activeVar.summaryText}</span>
                      {activeVar.summaryBadge && (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#facc15] text-[#14120e] font-mono text-[10px] font-extrabold">
                          {activeVar.summaryBadge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {b.tableFootnote && <p className="text-[11px] text-[#52635b] leading-relaxed">{b.tableFootnote}</p>}
          </div>
        )}

        {b.type === "formula" && (
          <div className="rounded-2xl p-3.5 space-y-3 materi-block-formula">
            <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-[#1f7a5c] block">
              RUMUS & SIMULASI PERHITUNGAN
            </span>
            {b.title && <h4 className="font-extrabold text-sm text-[#14120e]">{b.title}</h4>}
            <div className="p-3 rounded-xl bg-white border border-[#12201a]/10 flex items-center justify-center text-center overflow-x-auto">
              {b.formulaMode === "linear" ? (
                <span className="font-mono font-extrabold text-xs sm:text-sm text-[#14120e]">
                  {b.formulaLinearExpr || "Tinggi Loncatan = Raihan Tertinggi − Raihan Awal"}
                </span>
              ) : (
                <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-[#14120e]">
                  <span className="font-extrabold">{b.formulaLeft || "IMT"} =</span>
                  <div className="materi-formula-fraction">
                    <span className="materi-formula-numerator">{b.formulaNumerator || "Berat Badan (kg)"}</span>
                    <span className="materi-formula-denominator">{b.formulaDenominator || "Tinggi Badan (m) × Tinggi Badan (m)"}</span>
                  </div>
                </div>
              )}
            </div>
            {b.formulaNote && <p className="text-xs text-[#52635b] leading-relaxed">{b.formulaNote}</p>}
            {b.formulaCaseTitle && (
              <div className="pt-1 space-y-1.5">
                <p className="text-xs font-extrabold text-[#14120e]">{b.formulaCaseTitle}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {(b.formulaSteps || []).map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl bg-white border border-[#12201a]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                    >
                      <span className="font-bold text-[#52635b]">{st.label}</span>
                      <span className="font-mono font-extrabold text-[#14120e]">{st.expression}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(b.formulaResult || b.formulaCategoryBadge) && (
              <div className="p-3 rounded-xl bg-[#13211c] text-white flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-[#facc15]">{b.formulaResult}</span>
                {b.formulaCategoryBadge && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1f7a5c] text-white font-mono text-[10px] font-bold">
                    {b.formulaCategoryBadge}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {b.type === "case_study" && (
          <div className="rounded-2xl p-3.5 space-y-3 bg-[#f3f6f4] border border-[#12201a]/15">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-extrabold font-mono bg-[#13211c] text-[#facc15]">{b.headingCode || "G"}</span>
              <h4 className="font-extrabold text-sm text-[#14120e]">{b.title || "Studi Kasus Komparasi"}</h4>
            </div>
            {b.subtitle && <p className="text-xs text-[#52635b] leading-relaxed">{b.subtitle}</p>}
            <div className="rounded-xl border border-[#12201a]/15 overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#13211c] text-white">
                    <th className="p-2.5 font-extrabold">Aspek</th>
                    <th className="p-2.5 font-extrabold text-[#a7f3d0]">{b.caseSubjectALabel || "Siswa A"}</th>
                    <th className="p-2.5 font-extrabold text-[#fde047]">{b.caseSubjectBLabel || "Siswa B"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(b.caseRows || []).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-[#12201a]/5 last:border-b-0">
                      <td className="p-2.5 font-bold text-[#14120e]">{row.aspect}</td>
                      <td className="p-2.5 font-mono text-[#065f46] bg-[#e6f5ed]/40">{row.subjectA}</td>
                      <td className="p-2.5 font-mono text-[#78350f] bg-[#fef3c7]/40">{row.subjectB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(b.caseAnalysisPoints || []).some(Boolean) && (
              <div className="p-3 rounded-xl bg-white border border-[#12201a]/10 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f7a5c] block">1. Analisis Data</span>
                {(b.caseAnalysisPoints || []).map((pt, aIdx) => (
                  <p key={aIdx} className="text-xs text-[#44403c] leading-relaxed">
                    • {pt}
                  </p>
                ))}
              </div>
            )}
            {(b.caseConclusions || []).some(Boolean) && (
              <div className="p-3 rounded-xl bg-white border border-[#12201a]/10 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0284c7] block">2. Kesimpulan</span>
                {(b.caseConclusions || []).map((pt, cIdx) => (
                  <p key={cIdx} className="text-xs text-[#44403c] leading-relaxed">
                    • {pt}
                  </p>
                ))}
              </div>
            )}
            {b.caseKeyTakeaway && (
              <div className="p-3 rounded-xl bg-[#e6f5ed] border border-[#a7f3d0] text-xs text-[#065f46] font-semibold">
                <strong>3. Pelajaran Utama:</strong> {b.caseKeyTakeaway}
              </div>
            )}
          </div>
        )}

        {b.type === "learning_activity" && (
          <div className="rounded-2xl p-4 space-y-3 bg-[#f3f6f4] border border-[#12201a]/15">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-extrabold font-mono bg-[#1f7a5c] text-white">{b.headingCode || "H"}</span>
              <h4 className="font-extrabold text-sm text-[#14120e]">{b.title || "Aktivitas Pembelajaran EduFit"}</h4>
            </div>
            {b.activityOptionAText && (
              <div className="p-3 rounded-xl bg-[#e6f5ed] border border-[#a7f3d0] space-y-1">
                <span className="text-xs font-extrabold text-[#065f46] block">{b.activityOptionATitle || "Pilihan A — Praktik Opsional"}</span>
                <p className="text-xs text-[#14120e] leading-relaxed">{b.activityOptionAText}</p>
              </div>
            )}
            {b.activityOptionBText && (
              <div className="p-3 rounded-xl bg-[#e0f2fe] border border-[#7dd3fc] space-y-1">
                <span className="text-xs font-extrabold text-[#075985] block">
                  {b.activityOptionBTitle || "Pilihan B — Analisis Kasus / Data Simulasi"}
                </span>
                <p className="text-xs text-[#14120e] leading-relaxed">{b.activityOptionBText}</p>
              </div>
            )}
            {b.activityNote && <p className="text-[11px] italic text-[#52635b]">{b.activityNote}</p>}
          </div>
        )}

        {b.type === "fitt_simulator" &&
          (() => {
            const freqs = b.fittFrequencies || [2, 3, 4];
            const intensities = b.fittIntensities || ["Ringan", "Sedang", "Berat"];
            const durations = b.fittDurations || [10, 15, 20];
            const types = b.fittTypes || ["Jalan cepat", "Jogging ringan", "Bersepeda"];
            const currentSel = previewFittSelection[b.id] || {
              freq: freqs[1] || 3,
              intensity: intensities[1] || "Sedang",
              duration: durations[1] || 15,
              type: types[0] || "Jalan cepat",
            };
            const totalMinutes = currentSel.freq * currentSel.duration;

            return (
              <div className="rounded-2xl p-4 space-y-3.5 bg-[#13211c] text-white shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#facc15] block">
                    SIMULASI INTERAKTIF PRINSIP FITT
                  </span>
                  <h4 className="font-extrabold text-sm">{b.title || "Simulasi Menyusun Strategi FITT"}</h4>
                  {b.subtitle && <p className="text-xs text-white/75 leading-relaxed">{b.subtitle}</p>}
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-white/80 block mb-1.5">Frekuensi latihan per minggu</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {freqs.map((fVal) => (
                        <button
                          key={fVal}
                          type="button"
                          onClick={() => setPreviewFittSelection({ ...previewFittSelection, [b.id]: { ...currentSel, freq: fVal } })}
                          className={`py-1.5 rounded-xl font-bold cursor-pointer border ${
                            currentSel.freq === fVal ? "bg-[#1f7a5c] border-[#a7f3d0] text-white" : "bg-white/5 border-white/15 text-white/75"
                          }`}
                        >
                          {fVal} kali
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white/80 block mb-1.5">Intensitas aktivitas</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {intensities.map((iVal) => (
                        <button
                          key={iVal}
                          type="button"
                          onClick={() => setPreviewFittSelection({ ...previewFittSelection, [b.id]: { ...currentSel, intensity: iVal } })}
                          className={`py-1.5 rounded-xl font-bold cursor-pointer border ${
                            currentSel.intensity === iVal ? "bg-[#1f7a5c] border-[#a7f3d0] text-white" : "bg-white/5 border-white/15 text-white/75"
                          }`}
                        >
                          {iVal}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white/80 block mb-1.5">Durasi aktivitas inti</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {durations.map((dVal) => (
                        <button
                          key={dVal}
                          type="button"
                          onClick={() => setPreviewFittSelection({ ...previewFittSelection, [b.id]: { ...currentSel, duration: dVal } })}
                          className={`py-1.5 rounded-xl font-bold cursor-pointer border ${
                            currentSel.duration === dVal ? "bg-[#1f7a5c] border-[#a7f3d0] text-white" : "bg-white/5 border-white/15 text-white/75"
                          }`}
                        >
                          {dVal} menit
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white/80 block mb-1.5">Jenis aktivitas</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {types.map((tVal) => (
                        <button
                          key={tVal}
                          type="button"
                          onClick={() => setPreviewFittSelection({ ...previewFittSelection, [b.id]: { ...currentSel, type: tVal } })}
                          className={`py-2 px-3 rounded-xl font-bold text-left cursor-pointer border ${
                            currentSel.type === tVal ? "bg-[#1f7a5c] border-[#a7f3d0] text-white" : "bg-white/5 border-white/15 text-white/75"
                          }`}
                        >
                          {tVal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/70 block">Hasil Rancangan FITT</span>
                  <p className="text-sm font-extrabold text-[#facc15]">{currentSel.freq} sesi per minggu</p>
                  <p className="text-xs text-white/90">
                    Aktivitas <strong>{currentSel.type.toLowerCase()}</strong>, intensitas <strong>{currentSel.intensity.toLowerCase()}</strong>, selama{" "}
                    <strong>{currentSel.duration} menit</strong> per sesi.
                  </p>
                  <p className="text-base font-mono font-extrabold text-white pt-1">
                    {totalMinutes} <span className="text-xs font-sans font-normal text-white/75">menit aktivitas inti per minggu</span>
                  </p>
                  {b.fittDisclaimer && <p className="text-[10px] text-white/65 leading-relaxed pt-1">{b.fittDisclaimer}</p>}
                </div>
              </div>
            );
          })()}

        {b.type === "reflection" && (
          <div className="p-4 rounded-2xl space-y-2.5 bg-[#13211c] text-white shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#facc15]">
                {b.headingCode ? `${b.headingCode}. ` : "I. "}
                {b.title || "REFLEKSI PEMAHAMAN SISWA (DINILAI GURU)"}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
              {b.reflectionPrompt || triggerQuestion || "Pertanyaan refleksi pemahaman akan tampil di sini..."}
            </p>
            {b.reflectionGuide && (
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-[11px] text-[#a7f3d0] leading-relaxed">
                <strong>Panduan Refleksi:</strong> {b.reflectionGuide}
              </div>
            )}
            <div className="p-3 rounded-xl text-xs bg-white/10 border border-white/20 text-white/70">
              Ketik analisis dan refleksi pemahaman Anda di sini...
            </div>
          </div>
        )}

        {b.type === "tempo_simulator" && (
          <div className="rounded-2xl p-3.5 space-y-3 bg-[#f3f6f4] border border-[#12201a]/10">
            <h4 className="font-extrabold text-sm text-[#14120e]">{b.simulatorTitle || "Simulasi Pola Tempo & Intensitas"}</h4>
            {(() => {
              const methods = b.tempoMethods || [];
              const mIdx = previewTempoTab[b.id] || 0;
              const currentMethod = methods[mIdx] || methods[0];
              const sIdx = previewTempoStep[b.id] || 0;
              if (!currentMethod) return null;
              const currentStep = currentMethod.steps[sIdx] || currentMethod.steps[0];
              return (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {methods.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPreviewTempoTab({ ...previewTempoTab, [b.id]: idx });
                          setPreviewTempoStep({ ...previewTempoStep, [b.id]: 0 });
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          idx === mIdx ? "bg-[#13211c] text-white shadow-sm" : "bg-white border border-[#12201a]/10 text-[#14120e]"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#12201a]/10">
                    <div
                      className="grid gap-2 items-end h-24 pt-2"
                      style={{ gridTemplateColumns: `repeat(${Math.max(1, currentMethod.steps.length)}, minmax(0, 1fr))` }}
                    >
                      {currentMethod.steps.map((st, stepI) => {
                        const isCurrent = stepI === sIdx;
                        const heightPct = st.level === 3 ? 100 : st.level === 2 ? 62 : 32;
                        return (
                          <button
                            key={stepI}
                            type="button"
                            onClick={() => setPreviewTempoStep({ ...previewTempoStep, [b.id]: stepI })}
                            className="flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer"
                          >
                            <div className="w-full max-w-[32px] flex-1 rounded-lg flex items-end p-0.5 bg-[#ebf0ed]">
                              <div
                                className={`w-full rounded-md transition-all duration-300 ${isCurrent ? "bg-[#ea580c]" : "bg-[#1f7a5c]"}`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#12201a]/10 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#14120e]">
                        Tahap {sIdx + 1}: <span className="underline">{currentStep?.label || "-"}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewTempoStep({ ...previewTempoStep, [b.id]: (sIdx + 1) % Math.max(1, currentMethod.steps.length) })
                        }
                        className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer bg-[#ea580c] text-white"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {b.type === "video" && (
          <div className="p-3.5 rounded-2xl space-y-2.5 bg-[#e0f2fe] border border-[#7dd3fc]">
            <div>
              <h4 className="font-extrabold text-sm text-[#075985]">{b.title || "Video Rujukan Pembelajaran"}</h4>
              {b.value && <p className="text-xs leading-relaxed text-[#075985]/90 mt-0.5">{b.value}</p>}
            </div>
            {b.videoUrl ? (
              renderYouTubeAttachmentPreview(b.videoUrl, b.title || "Video Demonstrasi", b.videoButtonLabel || "Putar Video di Aplikasi", b.id)
            ) : (
              <div className="p-3 rounded-xl bg-white/70 text-xs text-[#075985] font-medium">
                Tempel tautan YouTube pada bagian video untuk menampilkan pemutar.
              </div>
            )}
          </div>
        )}

        {b.type === "callout" &&
          (() => {
            const tone = b.calloutTone || "amber";
            let bg = "bg-[#fef3c7]",
              border = "border-[#fde047]",
              textH = "text-[#78350f]";
            if (tone === "emerald") {
              bg = "bg-[#dcfce7]";
              border = "border-[#86efac]";
              textH = "text-[#065f46]";
            } else if (tone === "rose") {
              bg = "bg-[#ffe4e6]";
              border = "border-[#fda4af]";
              textH = "text-[#9f1239]";
            } else if (tone === "sky") {
              bg = "bg-[#e0f2fe]";
              border = "border-[#7dd3fc]";
              textH = "text-[#075985]";
            }
            return (
              <div className={`p-3.5 rounded-2xl border ${bg} ${border} space-y-1`}>
                <h4 className={`font-extrabold text-xs ${textH}`}>{b.title || "Catatan Penting"}</h4>
                <p className="text-xs leading-relaxed text-[#14120e]">{b.value}</p>
              </div>
            );
          })()}

        {b.type === "quiz" && (
          <div className="p-3.5 rounded-2xl space-y-3 bg-[#f3f6f4] border border-[#12201a]/10">
            <h4 className="font-extrabold text-xs uppercase text-[#1f7a5c] tracking-wider">{b.title || "Soal Formatif Cek Pemahaman"}</h4>
            <p className="text-xs font-bold text-[#14120e] leading-relaxed">{b.question || "Pertanyaan latihan..."}</p>
            <div className="space-y-1.5">
              {(b.options || []).map((opt) => {
                const chosen = previewQuizSelected[b.id] === opt.key;
                const isCorrect = opt.key === b.correctOption;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPreviewQuizSelected({ ...previewQuizSelected, [b.id]: opt.key })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                      chosen
                        ? isCorrect
                          ? "bg-[#dcfce7] border-[#86efac] text-[#065f46] font-bold"
                          : "bg-[#ffe4e6] border-[#fda4af] text-[#9f1239] font-bold"
                        : "bg-white border-[#12201a]/10 text-[#14120e]"
                    }`}
                  >
                    <strong className="font-mono">{opt.key}.</strong> {opt.text || `Pilihan ${opt.key}`}
                  </button>
                );
              })}
            </div>
            {previewQuizSelected[b.id] && b.explanation && (
              <div className="p-3 rounded-xl text-xs bg-[#dcfce7] border border-[#86efac] text-[#065f46]">
                <strong>Kunci ({b.correctOption}):</strong> {b.explanation}
              </div>
            )}
          </div>
        )}

        {b.type === "glossary" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#13211c] text-[#facc15] font-mono text-xs font-extrabold">{b.headingCode || "L"}</span>
                <h4 className="font-extrabold text-sm text-[#14120e]">{b.title || "Glosarium Unit"}</h4>
              </div>
              <span className="text-xs font-mono font-bold text-[#52635b]">{(b.glossaryItems || []).length} Istilah</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52635b]" />
              <input
                type="text"
                value={glossarySearch[b.id] || ""}
                onChange={(e) => setGlossarySearch({ ...glossarySearch, [b.id]: e.target.value })}
                placeholder="Cari istilah di glosarium..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f3f6f4] border border-[#12201a]/10 text-xs outline-none"
              />
            </div>
            <div className={`grid gap-2 ${isTablet768 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(b.glossaryItems || [])
                .filter((gi) => {
                  const q = (glossarySearch[b.id] || "").toLowerCase();
                  if (!q) return true;
                  return gi.term.toLowerCase().includes(q) || gi.definition.toLowerCase().includes(q);
                })
                .map((gi, gIdx) => (
                  <div key={gIdx} className="p-3 rounded-xl materi-block-glossary-card space-y-0.5">
                    <span className="text-xs font-extrabold text-[#1f7a5c] block">{gi.term || "Istilah"}</span>
                    <p className="text-xs text-[#44403c] leading-relaxed">{gi.definition || "Pengertian istilah..."}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // RENDER STUDIO LIVE PREVIEW (FLOATING + ZERO SCROLLBAR + AUTO-SCROLL SYNC + MANUAL SCROLL TETAP AKTIF)
  const renderStudioLivePreview = () => {
    const viewportClass =
      previewViewport === 320
        ? "materi-viewport-320"
        : previewViewport === 375
        ? "materi-viewport-375"
        : previewViewport === 425
        ? "materi-viewport-425"
        : "materi-viewport-768";

    const totalAllCount = countTotalBlocksRecursive(contentBlocks);

    return (
      <div className="w-full h-full flex flex-col rounded-[2rem] overflow-hidden edufit-card-primary shadow-xl border border-hairline">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-hairline edufit-card-secondary shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPreviewStage("overview")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                previewStage === "overview" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              1. Menu
            </button>
            <button
              type="button"
              onClick={() => setPreviewStage("detail")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                previewStage === "detail" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              2. Isi Materi
            </button>
            <button
              type="button"
              onClick={() => setAutoSyncPreviewScroll(!autoSyncPreviewScroll)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all ${
                autoSyncPreviewScroll ? "badge-tint-emerald" : "edufit-surface-subtle opacity-60"
              }`}
              title="Jika aktif, layar HP akan otomatis mengikuti posisi blok yang sedang Anda ketik/sunting, namun tetap bisa di-scroll manual"
            >
              {autoSyncPreviewScroll ? "Auto-Ikut: ON" : "Auto-Ikut: OFF"}
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
            {(
              [
                { w: 320, label: "Kecil" },
                { w: 375, label: "Standar" },
                { w: 425, label: "Lebar" },
                { w: 768, label: "Penuh" },
              ] as const
            ).map((bp) => (
              <button
                key={bp.w}
                type="button"
                onClick={() => setPreviewViewport(bp.w)}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  previewViewport === bp.w ? "telemetry-bar-forest" : "seg-btn-idle"
                }`}
              >
                {bp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-3 materi-device-stage">
          <div className={`materi-device-viewport ${viewportClass} h-full max-h-full flex flex-col overflow-hidden`}>
            {previewStage === "overview" ? (
              <div className="materi-phone-screen flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-8 bg-[#f3f6f4] text-[#14120e]">
                <div className={`relative w-full overflow-hidden bg-[#13211c] ${isTablet768 ? "h-60" : isCompact320 ? "h-44" : "h-52"}`}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="Sampul Kurikulum" className="w-full h-full object-cover opacity-85" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#13211c] via-[#1f7a5c] to-[#0c1713]" />
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-[#13211c]/95 via-[#13211c]/35 to-black/30 flex flex-col justify-between ${
                      isCompact320 ? "p-3.5" : "p-5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          S
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-white/80 leading-none truncate">Kurikulum PJOK Kelas {activeGrade}</p>
                          <p className="text-xs sm:text-sm font-extrabold text-white leading-tight mt-0.5 truncate">Siswa EduFit</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white text-[#14120e] flex items-center justify-center shadow-md shrink-0">
                        <Bell size={14} />
                      </div>
                    </div>
                    <div className="pb-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-widest bg-[#1f7a5c] text-white">
                        KURIKULUM KELAS {activeGrade}
                      </span>
                      <h2
                        className={`font-extrabold text-white tracking-tight mt-1.5 leading-snug line-clamp-2 ${
                          isCompact320 ? "text-base" : isTablet768 ? "text-xl" : "text-lg"
                        }`}
                      >
                        {unitName || "Eksplorasi Modul & Pengukuran Kebugaran"}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-2 -mt-7 relative z-10 ${isCompact320 ? "gap-2 px-2.5" : "gap-3 px-4"}`}>
                  <div
                    className={`rounded-2xl bg-[#e6f5ed] border border-[#a7f3d0] shadow-sm flex items-center ${
                      isCompact320 ? "p-2.5 gap-2" : "p-3.5 gap-3"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#1f7a5c] text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-[#52635b] truncate">Status Materi</p>
                      <p className="font-extrabold text-[#14120e] text-xs truncate">{materials.length || 1} Unit Aktif</p>
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl bg-[#fef9c3] border border-[#fde047] shadow-sm flex items-center ${
                      isCompact320 ? "p-2.5 gap-2" : "p-3.5 gap-3"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#d99b26] text-white flex items-center justify-center shrink-0">
                      <Activity size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-[#78350f] truncate">Bagian Materi</p>
                      <p className="font-extrabold text-[#14120e] text-xs truncate">{totalAllCount} Bagian</p>
                    </div>
                  </div>
                </div>

                <div className={`${isCompact320 ? "px-2.5" : "px-4"} mt-5`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-extrabold tracking-tight text-[#14120e]">Pilih Unit Materi</h3>
                    <span className="text-[10px] font-bold font-mono text-[#1f7a5c]">KELAS {activeGrade}</span>
                  </div>
                  <div className={`grid gap-2.5 ${isTablet768 ? "grid-cols-3" : "grid-cols-2"}`}>
                    <div
                      onClick={() => setPreviewStage("detail")}
                      className="rounded-2xl overflow-hidden bg-white border-2 border-[#1f7a5c] shadow-md cursor-pointer group"
                    >
                      <div className="relative aspect-[4/3] w-full bg-[#13211c] overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={unitName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-300 bg-rose-950/60 p-2 text-center">
                            Sampul Wajib Diunggah
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-white/95 text-[#14120e] shadow">
                          {totalAllCount} Bagian
                        </span>
                      </div>
                      <div className="p-2.5">
                        <span className="text-[9px] font-bold font-mono uppercase text-[#1f7a5c]">SEDANG DISUSUN</span>
                        <p className="text-xs font-extrabold text-[#14120e] line-clamp-2 mt-0.5 leading-snug">
                          {unitName || "Judul Unit Pembelajaran"}
                        </p>
                      </div>
                    </div>

                    {materials
                      .filter((m) => m.id !== editingId)
                      .slice(0, isTablet768 ? 2 : 1)
                      .map((m, idx) => (
                        <div
                          key={m.id}
                          onClick={() => setPreviewStage("detail")}
                          className="rounded-2xl overflow-hidden bg-white border border-[#12201a]/10 shadow-sm cursor-pointer opacity-90 hover:opacity-100"
                        >
                          <div className="relative aspect-[4/3] w-full bg-[#1b2e27] overflow-hidden">
                            {m.image_url ? (
                              <img src={m.image_url} alt={m.unit_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30">
                                <BookOpen size={22} />
                              </div>
                            )}
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-white/95 text-[#14120e] shadow">
                              Unit {idx + 2}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <span className="text-[9px] font-bold font-mono uppercase text-[#52635b]">TERSEDIA</span>
                            <p className="text-xs font-extrabold text-[#14120e] line-clamp-2 mt-0.5 leading-snug">{m.unit_name}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={previewScrollContainerRef}
                className="materi-phone-screen flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-8 bg-[#f3f6f4] text-[#14120e]"
              >
                <div className={`relative w-full overflow-hidden bg-[#13211c] ${isTablet768 ? "h-56" : isCompact320 ? "h-44" : "h-48"}`}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="Sampul" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-950 via-[#13211c] to-[#0c1713] flex flex-col items-center justify-center p-6 text-center">
                      <AlertCircle size={24} className="text-rose-400 mb-1.5" />
                      <p className="text-xs font-bold text-white">Gambar Sampul Unit Wajib Diisi</p>
                      <p className="text-[10px] text-white/70 mt-0.5">Unggah gambar di panel kiri agar tampil di bagian ini</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/65 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewStage("overview")}
                        className="w-8 h-8 rounded-full bg-white text-[#14120e] flex items-center justify-center shadow-md cursor-pointer shrink-0"
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <span className="text-xs font-extrabold text-white drop-shadow truncate">{unitName || "Detail Unit Materi"}</span>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                        K{activeGrade}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${isCompact320 ? "px-2.5" : "px-4"} -mt-10 relative z-10`}>
                  <div className={`rounded-3xl materi-floating-card space-y-2.5 ${isCompact320 ? "p-3" : "p-4"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-[#fef3c7] border border-[#fde047] text-[#d97706] flex items-center justify-center shrink-0">
                          <Award size={12} />
                        </span>
                        <span className="text-xs font-extrabold text-[#14120e] truncate">Modul Kelas {activeGrade}</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#ea580c] underline shrink-0">~{estimatedReadMinutes} mnt baca &gt;</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="font-extrabold font-mono tracking-tight text-[#14120e] text-xl">{totalAllCount}</span>
                        <span className="text-xs font-bold text-[#52635b] ml-1.5">bagian materi</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#52635b] truncate">
                        Target: <strong className="text-[#14120e]">Refleksi Tuntas</strong>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#ebf0ed] overflow-hidden">
                      <div className="h-full rounded-full bg-[#ea580c] transition-all duration-500" style={{ width: "82%" }} />
                    </div>
                  </div>
                </div>

                <div className={`${isCompact320 ? "px-2.5" : "px-4"} mt-3.5`}>
                  <h3 className="text-sm font-extrabold tracking-tight text-[#14120e] mb-2 line-clamp-2">
                    {unitName || "Susunan Materi Pembelajaran"}
                  </h3>
                  <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
                    {[
                      { k: "all", l: `Semua (${contentBlocks.length} Zona)` },
                      { k: "materi", l: "Bab & Konsep" },
                      { k: "media", l: "Prosedur & Tabel" },
                      { k: "interaktif", l: "Rumus, Kasus & Evaluasi" },
                    ].map((tab) => (
                      <button
                        key={tab.k}
                        type="button"
                        onClick={() => setPreviewSectionFilter(tab.k as any)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                          previewSectionFilter === tab.k ? "materi-pill-orange-active" : "materi-pill-idle"
                        }`}
                      >
                        {tab.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`${isCompact320 ? "px-2.5" : "px-4"} mt-3 space-y-3.5`}>
                  {mediaUrl && (
                    <div>
                      {renderYouTubeAttachmentPreview(
                        mediaUrl,
                        "Video Pengantar Unit Pembelajaran",
                        "Tautan video pengantar untuk siswa",
                        "intro_hero_video"
                      )}
                    </div>
                  )}

                  <div className={`rounded-3xl bg-white border border-[#12201a]/10 shadow-sm space-y-5 ${isCompact320 ? "p-3.5" : "p-4"}`}>
                    {filteredPreviewBlocks.map((b, idx) => renderPreviewBlockNode(b, idx, false))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {zoomedImageUrl && (
            <div
              onClick={() => setZoomedImageUrl(null)}
              className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            >
              <div className="relative max-w-3xl w-full">
                <button
                  type="button"
                  onClick={() => setZoomedImageUrl(null)}
                  className="absolute -top-11 right-0 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} /> Tutup Gambar
                </button>
                <img src={zoomedImageUrl} alt="Perbesar Gambar" className="w-full max-h-[82vh] object-contain rounded-2xl bg-white p-2" />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // RENDER FORMULIR FIELD UNTUK ITEM BLOK (BAIK BLOK BIASA MAUPUN SUB-BLOK DI DALAM WADAH BAB)
  const renderBlockFieldsEditor = (block: ContentBlock) => (
    <div
      onFocusCapture={() => scrollPreviewToBlock(block.id)}
      onClick={() => scrollPreviewToBlock(block.id)}
      className="space-y-4"
    >
      {block.type === "cp_tp" && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Kode Zona</label>
              <input
                type="text"
                value={block.headingCode || "A"}
                onChange={(e) => updateBlock(block.id, { headingCode: e.target.value })}
                placeholder="A"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono outline-none edufit-card-primary"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Judul Bagian Identitas</label>
              <input
                type="text"
                value={block.title || ""}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Identitas dan tujuan pembelajaran"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Elemen CP Utama</label>
              <input
                type="text"
                value={block.cpMain || ""}
                onChange={(e) => updateBlock(block.id, { cpMain: e.target.value })}
                placeholder="Contoh: Bergaya Hidup Aktif"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Elemen Pendukung</label>
              <input
                type="text"
                value={block.cpSupport || ""}
                onChange={(e) => updateBlock(block.id, { cpSupport: e.target.value })}
                placeholder="Contoh: Terampil Bergerak..."
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Fokus Pembelajaran</label>
            <textarea
              rows={2}
              value={block.learningFocus || ""}
              onChange={(e) => updateBlock(block.id, { learningFocus: e.target.value })}
              placeholder="Uraikan fokus pembelajaran unit ini..."
              className="w-full p-3.5 rounded-xl text-sm leading-relaxed outline-none edufit-card-primary"
            />
          </div>

          <div className="p-3 rounded-xl edufit-card-primary space-y-2 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase text-emerald-accent flex items-center gap-1.5">
                <ClipboardPaste size={13} /> Tempel Daftar Tujuan dari Word
              </span>
              <button
                type="button"
                onClick={() => {
                  const raw = bulkPasteBuffer[block.id] || "";
                  const parsed = parseBulkListFromText(raw);
                  if (parsed.length > 0) {
                    updateBlock(block.id, {
                      objectivesList: [...(block.objectivesList || []).filter(Boolean), ...parsed],
                    });
                    setBulkPasteBuffer((prev) => ({ ...prev, [block.id]: "" }));
                    toast.success(`Berhasil memuat ${parsed.length} tujuan pembelajaran!`);
                  }
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer btn-forest-emerald"
              >
                Impor Tujuan
              </button>
            </div>
            <textarea
              rows={2}
              value={bulkPasteBuffer[block.id] || ""}
              onChange={(e) => setBulkPasteBuffer({ ...bulkPasteBuffer, [block.id]: e.target.value })}
              placeholder="Salin beberapa baris tujuan pembelajaran dari Word lalu tempel di sini..."
              className="w-full p-2.5 rounded-lg text-xs outline-none edufit-surface-subtle resize-y"
            />
          </div>

          <div className="space-y-2">
            {(block.objectivesList || []).map((obj, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2.5">
                <span className="text-sm font-mono font-bold w-6">{oIdx + 1}.</span>
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => {
                    const next = [...(block.objectivesList || [])];
                    next[oIdx] = e.target.value;
                    updateBlock(block.id, { objectivesList: next });
                  }}
                  placeholder={`Tujuan pembelajaran ke-${oIdx + 1}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (block.objectivesList || []).filter((_, i) => i !== oIdx);
                    updateBlock(block.id, { objectivesList: next.length ? next : [""] });
                  }}
                  className="p-2 rounded-xl badge-tint-rose cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateBlock(block.id, { objectivesList: [...(block.objectivesList || []), ""] })}
              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-accent pt-1"
            >
              <Plus size={14} /> Tambah Baris Tujuan
            </button>
          </div>
        </div>
      )}

      {block.type === "topic_section" && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Kode Sub-Bab</label>
              <input
                type="text"
                value={block.headingCode || ""}
                onChange={(e) => updateBlock(block.id, { headingCode: e.target.value })}
                placeholder="Cth: B.1"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono outline-none edufit-card-primary"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Judul Sub-Topik Materi *</label>
              <input
                type="text"
                value={block.title || ""}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Cth: Perbedaan Aktivitas Fisik, Latihan Fisik, dan Kebugaran Jasmani"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Paragraf Penjelasan Materi</label>
            <textarea
              rows={4}
              value={block.value || ""}
              onChange={(e) => updateBlock(block.id, { value: e.target.value })}
              placeholder="Tuliskan teks narasi penjelasan sub-bab di sini..."
              className="w-full p-4 rounded-2xl text-sm leading-relaxed outline-none resize-y edufit-card-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-forest-emerald">
                <UploadCloud size={16} />
                <span>{uploadingBlockId === block.id ? "Mengunggah..." : "Unggah Poster Infografis Sub-Bab"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleBlockFigureUpload(block.id, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                type="text"
                value={block.imageUrl || ""}
                onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                placeholder="Atau tempel URL gambar..."
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={block.caption || ""}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                placeholder="Sumber gambar (Cth: Sumber: EduFit Pembelajaran PJOK)"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none edufit-card-primary"
              />
              <input
                type="text"
                value={block.conclusionText || ""}
                onChange={(e) => updateBlock(block.id, { conclusionText: e.target.value })}
                placeholder="Kotak Catatan / Pertanyaan Pemantik / Kesimpulan Bawah (Opsional)..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none edufit-card-primary"
              />
            </div>
          </div>
        </div>
      )}

      {block.type === "heading" && (
        <div className="flex gap-2.5">
          <input
            type="text"
            value={block.headingCode || ""}
            onChange={(e) => updateBlock(block.id, { headingCode: e.target.value })}
            placeholder="Kode (1 / a)"
            className="w-28 px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono outline-none edufit-card-primary"
          />
          <input
            type="text"
            value={block.title ?? block.value}
            onChange={(e) => updateBlock(block.id, { title: e.target.value, value: e.target.value })}
            placeholder="Ketik sub-judul pembahasan..."
            className="flex-1 px-4 py-2.5 rounded-xl text-base font-bold outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "paragraph" && (
        <textarea
          value={block.value}
          onChange={(e) => updateBlock(block.id, { value: e.target.value })}
          rows={4}
          placeholder="Ketik paragraf penjelasan materi di sini..."
          className="w-full p-4 rounded-2xl text-sm sm:text-base leading-relaxed outline-none resize-y edufit-card-primary"
        />
      )}

      {block.type === "list" && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl edufit-card-primary space-y-2 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-accent flex items-center gap-1.5">
                <ClipboardPaste size={14} /> Tempel Sekaligus dari Word (Rangkuman / Daftar)
              </span>
              <button
                type="button"
                onClick={() => {
                  const raw = bulkPasteBuffer[block.id] || "";
                  const parsed = parseBulkListFromText(raw);
                  if (parsed.length > 0) {
                    updateBlock(block.id, { items: [...(block.items || []).filter(Boolean), ...parsed] });
                    setBulkPasteBuffer((prev) => ({ ...prev, [block.id]: "" }));
                    toast.success(`Berhasil memuat ${parsed.length} butir poin!`);
                  } else {
                    toast.error("Tempelkan teks daftar terlebih dahulu.");
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer btn-forest-emerald"
              >
                Impor ke Daftar
              </button>
            </div>
            <textarea
              rows={3}
              value={bulkPasteBuffer[block.id] || ""}
              onChange={(e) => setBulkPasteBuffer({ ...bulkPasteBuffer, [block.id]: e.target.value })}
              placeholder="Salin seluruh poin rangkuman dari Word lalu tempel di sini..."
              className="w-full p-3 rounded-xl text-xs outline-none edufit-surface-subtle resize-y"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Judul pengantar daftar / rangkuman"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
            {["number", "bullet", "alpha"].map((st) => {
              const active = (block.listStyle || "bullet") === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => updateBlock(block.id, { listStyle: st as any })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${active ? "seg-btn-active" : "edufit-card-primary"}`}
                >
                  {st === "number" ? "1. Angka" : st === "bullet" ? "Poin" : "a. Abjad"}
                </button>
              );
            })}
          </div>
          {(block.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-sm font-bold font-mono w-6 text-center">
                {block.listStyle === "number" ? `${i + 1}.` : block.listStyle === "alpha" ? `${String.fromCharCode(97 + i)}.` : "-"}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...(block.items || [])];
                  next[i] = e.target.value;
                  updateBlock(block.id, { items: next });
                }}
                placeholder={`Isi butir ke-${i + 1}...`}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
              />
              <button
                type="button"
                onClick={() => {
                  const next = (block.items || []).filter((_, idx) => idx !== i);
                  updateBlock(block.id, { items: next.length ? next : [""] });
                }}
                className="p-2 rounded-xl badge-tint-rose cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateBlock(block.id, { items: [...(block.items || []), ""] })}
            className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-accent"
          >
            <Plus size={14} /> Tambah Baris Poin
          </button>
        </div>
      )}

      {block.type === "procedure" && (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl edufit-card-primary">
            <span className="text-xs font-bold font-mono uppercase opacity-65">Mode Prosedur:</span>
            <div className="flex gap-1">
              {[
                { k: "tkji_test", l: "Mode Tes TKJI (Unit 4)" },
                { k: "exercise_tech", l: "Mode Teknik Latihan (Unit 3)" },
              ].map((m) => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => updateBlock(block.id, { procMode: m.k as any })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    (block.procMode || "tkji_test") === m.k ? "seg-btn-active" : "edufit-surface-subtle"
                  }`}
                >
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5">
            <input
              type="text"
              value={block.procCode || ""}
              onChange={(e) => updateBlock(block.id, { procCode: e.target.value })}
              placeholder="Kode (B.1)"
              className="w-28 px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono outline-none edufit-card-primary"
            />
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Nama Gerakan / Butir Tes (Cth: Push-up atau Lari 60 Meter)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 btn-forest-emerald">
              <UploadCloud size={16} />
              <span>{uploadingBlockId === block.id ? "Mengunggah..." : "Unggah Poster Tata Cara"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleBlockFigureUpload(block.id, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <input
              type="text"
              value={block.imageUrl || ""}
              onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
              placeholder="Tautan Poster Infografis (Opsional)..."
              className="w-full px-4 py-2.5 rounded-xl text-sm font-mono outline-none edufit-card-primary"
            />
          </div>

          {(block.procMode || "tkji_test") === "tkji_test" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">a. Tujuan Pengukuran</label>
                <input
                  type="text"
                  value={block.procPurpose || ""}
                  onChange={(e) => updateBlock(block.id, { procPurpose: e.target.value })}
                  placeholder="Mengukur kemampuan..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">b. Alat & Petugas</label>
                <input
                  type="text"
                  value={block.procTools || ""}
                  onChange={(e) => updateBlock(block.id, { procTools: e.target.value })}
                  placeholder="Stopwatch, matras, petugas..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">Kelompok Otot Utama yang Bekerja (Unit 3)</label>
              <input
                type="text"
                value={block.procMuscles || ""}
                onChange={(e) => updateBlock(block.id, { procMuscles: e.target.value })}
                placeholder="Cth: Otot dada (pectoralis), trisep, bahu, dan core."
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none edufit-card-primary"
              />
            </div>
          )}

          <div className="space-y-2.5">
            <span className="text-xs font-bold opacity-75 block">Langkah / Tahapan Pelaksanaan:</span>
            {(block.procSteps || []).map((st, sIdx) => (
              <div key={sIdx} className="flex gap-2.5">
                <input
                  type="text"
                  value={st.label}
                  onChange={(e) => {
                    const next = [...(block.procSteps || [])];
                    next[sIdx].label = e.target.value;
                    updateBlock(block.id, { procSteps: next });
                  }}
                  placeholder="Tahap (Cth: 1. Posisi Turun)"
                  className="w-40 px-3.5 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
                />
                <input
                  type="text"
                  value={st.text}
                  onChange={(e) => {
                    const next = [...(block.procSteps || [])];
                    next[sIdx].text = e.target.value;
                    updateBlock(block.id, { procSteps: next });
                  }}
                  placeholder="Rincian pelaksanaan gerakan..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
                />
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { procSteps: (block.procSteps || []).filter((_, i) => i !== sIdx) })}
                  className="p-2 rounded-xl badge-tint-rose cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateBlock(block.id, { procSteps: [...(block.procSteps || []), { label: "Tahap Baru", text: "" }] })}
              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-accent"
            >
              <Plus size={14} /> Tambah Tahap Gerakan
            </button>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-rose-500 block mb-1.5">Kesalahan Umum yang Perlu Dihindari</label>
            <input
              type="text"
              value={block.procMistakes || ""}
              onChange={(e) => updateBlock(block.id, { procMistakes: e.target.value })}
              placeholder="Contoh: Pinggul turun berlebihan atau menahan napas..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
            />
          </div>

          {block.procMode === "exercise_tech" && (
            <div>
              <label className="text-xs font-bold uppercase text-sky-accent block mb-1.5">Variasi untuk Pemula (Modifikasi Latihan)</label>
              <input
                type="text"
                value={block.procBeginnerVariations || ""}
                onChange={(e) => updateBlock(block.id, { procBeginnerVariations: e.target.value })}
                placeholder="Contoh: Push-up lutut (knee push-up) atau push-up dinding."
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
              />
            </div>
          )}
        </div>
      )}

      {block.type === "table" && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl edufit-card-primary space-y-2 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-accent flex items-center gap-1.5">
                <ClipboardPaste size={14} /> Tempel Sekaligus Tabel dari Word (Tab / |)
              </span>
              <button
                type="button"
                onClick={() => {
                  const raw = bulkPasteBuffer[block.id] || "";
                  const parsed = parseBulkTableFromText(raw);
                  if (parsed && parsed.headers.length > 0) {
                    const variants = [...(block.tableVariants || [])];
                    variants[0].headers = parsed.headers;
                    variants[0].rows = parsed.rows;
                    updateBlock(block.id, { tableVariants: variants });
                    setBulkPasteBuffer((prev) => ({ ...prev, [block.id]: "" }));
                    toast.success(`Tabel berhasil dimuat (${parsed.rows.length} baris)`);
                  } else {
                    toast.error("Format tabel tidak valid. Pastikan menyalin tabel dari Word.");
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer btn-forest-emerald"
              >
                Impor Tabel
              </button>
            </div>
            <textarea
              rows={2}
              value={bulkPasteBuffer[block.id] || ""}
              onChange={(e) => setBulkPasteBuffer({ ...bulkPasteBuffer, [block.id]: e.target.value })}
              placeholder="Salin tabel dari Word lalu tempel di sini..."
              className="w-full p-2.5 rounded-xl text-xs outline-none edufit-surface-subtle resize-y font-mono"
            />
          </div>

          <div className="p-3 rounded-xl edufit-card-primary flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase opacity-65 mr-1">Isi Format Cepat:</span>
            <button
              type="button"
              onClick={() => applyBlockQuickPreset(block.id, "table_tkji_norma")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer badge-tint-emerald"
            >
              Norma TKJI (Putra & Putri)
            </button>
            <button
              type="button"
              onClick={() => applyBlockQuickPreset(block.id, "table_tkji_simulasi")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer badge-tint-sky"
            >
              Contoh Hitung Skor TKJI
            </button>
            <button
              type="button"
              onClick={() => applyBlockQuickPreset(block.id, "table_klasifikasi_tkji")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer badge-tint-amber"
            >
              Klasifikasi Nilai (BS–KS)
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={block.tableTitle || ""}
              onChange={(e) => updateBlock(block.id, { tableTitle: e.target.value })}
              placeholder="Nama / Judul Tabel..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer px-3.5 py-2.5 rounded-xl edufit-card-primary">
              <input
                type="checkbox"
                checked={Boolean(block.hasCategoryFilter)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const variants = [...(block.tableVariants || [])];
                  if (checked && variants.length === 1) {
                    variants[0].label = "Putra";
                    variants.push({
                      id: generateId(),
                      label: "Putri",
                      unitSubtitle: "",
                      headers: [...variants[0].headers],
                      rows: variants[0].rows.map((r) => [...r]),
                      summaryText: "",
                      summaryBadge: "",
                    });
                  }
                  updateBlock(block.id, { hasCategoryFilter: checked, tableVariants: variants });
                }}
              />
              Pisahkan Tab Putra & Putri
            </label>
          </div>

          {(block.tableVariants || []).map((variant, vIdx) => (
            <div key={variant.id} className="p-4 rounded-xl space-y-3 edufit-card-primary">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{block.hasCategoryFilter ? `Tab ${variant.label}:` : "Isi Tabel:"}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(block.tableVariants || [])];
                      next[vIdx].headers.push(`Kolom ${next[vIdx].headers.length + 1}`);
                      next[vIdx].rows = next[vIdx].rows.map((r) => [...r, ""]);
                      updateBlock(block.id, { tableVariants: next });
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer badge-tint-emerald"
                  >
                    + Kolom
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(block.tableVariants || [])];
                      next[vIdx].rows.push(new Array(next[vIdx].headers.length).fill(""));
                      updateBlock(block.id, { tableVariants: next });
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer badge-tint-sky"
                  >
                    + Baris
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {variant.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-2 border border-hairline bg-black/5 dark:bg-white/5">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => {
                              const next = [...(block.tableVariants || [])];
                              next[vIdx].headers[hIdx] = e.target.value;
                              updateBlock(block.id, { tableVariants: next });
                            }}
                            className="w-full font-bold bg-transparent outline-none"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variant.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border border-hairline">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => {
                                const next = [...(block.tableVariants || [])];
                                next[vIdx].rows[rIdx][cIdx] = e.target.value;
                                updateBlock(block.id, { tableVariants: next });
                              }}
                              className="w-full bg-transparent outline-none"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {block.type === "formula" && (
        <div className="space-y-3.5">
          <div className="p-3 rounded-xl edufit-card-primary flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase opacity-65 mr-1">Isi Rumus Cepat:</span>
            <button
              type="button"
              onClick={() => applyBlockQuickPreset(block.id, "formula_imt")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer badge-tint-emerald"
            >
              Rumus & Simulasi IMT (Pecahan)
            </button>
            <button
              type="button"
              onClick={() => applyBlockQuickPreset(block.id, "formula_loncat")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer badge-tint-sky"
            >
              Rumus Selisih Loncat Tegak (Satu Baris)
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Judul Rumus (Cth: Panduan Menghitung IMT)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
            <div className="flex gap-1.5">
              {[
                { k: "fraction", l: "Rumus Pecahan (IMT)" },
                { k: "linear", l: "Rumus Satu Baris" },
              ].map((m) => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => updateBlock(block.id, { formulaMode: m.k as any })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    (block.formulaMode || "fraction") === m.k ? "seg-btn-active" : "edufit-card-primary"
                  }`}
                >
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          {(block.formulaMode || "fraction") === "fraction" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={block.formulaLeft || "IMT"}
                onChange={(e) => updateBlock(block.id, { formulaLeft: e.target.value })}
                placeholder="Sisi Kiri (IMT)"
                className="px-4 py-2.5 rounded-xl text-sm font-mono font-bold outline-none edufit-card-primary"
              />
              <input
                type="text"
                value={block.formulaNumerator || ""}
                onChange={(e) => updateBlock(block.id, { formulaNumerator: e.target.value })}
                placeholder="Pembilang Atas (Berat Badan kg)"
                className="px-4 py-2.5 rounded-xl text-sm font-mono outline-none edufit-card-primary"
              />
              <input
                type="text"
                value={block.formulaDenominator || ""}
                onChange={(e) => updateBlock(block.id, { formulaDenominator: e.target.value })}
                placeholder="Penyebut Bawah (Tinggi m × Tinggi m)"
                className="px-4 py-2.5 rounded-xl text-sm font-mono outline-none edufit-card-primary"
              />
            </div>
          ) : (
            <input
              type="text"
              value={block.formulaLinearExpr || ""}
              onChange={(e) => updateBlock(block.id, { formulaLinearExpr: e.target.value })}
              placeholder="Tulis rumus (Cth: HRmaks = 220 - Usia)"
              className="w-full px-4 py-2.5 rounded-xl text-sm font-mono font-bold outline-none edufit-card-primary"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={block.formulaResult || ""}
              onChange={(e) => updateBlock(block.id, { formulaResult: e.target.value })}
              placeholder="Hasil Akhir (Cth: IMT = 23,5 kg/m²)"
              className="px-4 py-2.5 rounded-xl text-sm font-mono font-bold outline-none edufit-card-primary"
            />
            <input
              type="text"
              value={block.formulaCategoryBadge || ""}
              onChange={(e) => updateBlock(block.id, { formulaCategoryBadge: e.target.value })}
              placeholder="Label Kategori (Cth: KATEGORI: NORMAL)"
              className="px-4 py-2.5 rounded-xl text-sm font-mono font-bold outline-none edufit-card-primary"
            />
          </div>
        </div>
      )}

      {block.type === "case_study" && (
        <div className="space-y-3.5">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={block.headingCode || "G"}
              onChange={(e) => updateBlock(block.id, { headingCode: e.target.value })}
              placeholder="Kode (G)"
              className="w-24 px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono outline-none edufit-card-primary"
            />
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Judul Studi Kasus (Cth: Studi kasus: IMT sama, kebugaran berbeda)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={block.subtitle || ""}
              onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
              placeholder="Kalimat pengantar..."
              className="px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
            />
            <input
              type="text"
              value={block.caseSubjectALabel || "Siswa A"}
              onChange={(e) => updateBlock(block.id, { caseSubjectALabel: e.target.value })}
              placeholder="Subjek 1 (Siswa A)"
              className="px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
            <input
              type="text"
              value={block.caseSubjectBLabel || "Siswa B"}
              onChange={(e) => updateBlock(block.id, { caseSubjectBLabel: e.target.value })}
              placeholder="Subjek 2 (Siswa B)"
              className="px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
            />
          </div>

          <div className="space-y-2">
            {(block.caseRows || []).map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={row.aspect}
                  onChange={(e) => {
                    const next = [...(block.caseRows || [])];
                    next[rIdx].aspect = e.target.value;
                    updateBlock(block.id, { caseRows: next });
                  }}
                  placeholder="Aspek"
                  className="col-span-4 px-3.5 py-2 rounded-xl text-sm font-bold outline-none edufit-card-primary"
                />
                <input
                  type="text"
                  value={row.subjectA}
                  onChange={(e) => {
                    const next = [...(block.caseRows || [])];
                    next[rIdx].subjectA = e.target.value;
                    updateBlock(block.id, { caseRows: next });
                  }}
                  placeholder="Data Subjek A"
                  className="col-span-3 px-3.5 py-2 rounded-xl text-sm font-mono outline-none edufit-card-primary"
                />
                <input
                  type="text"
                  value={row.subjectB}
                  onChange={(e) => {
                    const next = [...(block.caseRows || [])];
                    next[rIdx].subjectB = e.target.value;
                    updateBlock(block.id, { caseRows: next });
                  }}
                  placeholder="Data Subjek B"
                  className="col-span-4 px-3.5 py-2 rounded-xl text-sm font-mono outline-none edufit-card-primary"
                />
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { caseRows: (block.caseRows || []).filter((_, i) => i !== rIdx) })}
                  className="col-span-1 p-2 rounded-xl badge-tint-rose flex justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateBlock(block.id, { caseRows: [...(block.caseRows || []), { aspect: "", subjectA: "", subjectB: "" }] })}
              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-accent"
            >
              <Plus size={14} /> Tambah Baris Perbandingan
            </button>
          </div>

          <input
            type="text"
            value={block.caseKeyTakeaway || ""}
            onChange={(e) => updateBlock(block.id, { caseKeyTakeaway: e.target.value })}
            placeholder="Kesimpulan / Pelajaran utama dari studi kasus ini..."
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "learning_activity" && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-xl edufit-card-primary space-y-2.5 border border-emerald-500/30">
            <input
              type="text"
              value={block.activityOptionATitle || "Pilihan A — Praktik Opsional"}
              onChange={(e) => updateBlock(block.id, { activityOptionATitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-surface-subtle"
            />
            <textarea
              rows={2}
              value={block.activityOptionAText || ""}
              onChange={(e) => updateBlock(block.id, { activityOptionAText: e.target.value })}
              placeholder="Deskripsi Pilihan A..."
              className="w-full p-3 rounded-xl text-xs outline-none edufit-surface-subtle"
            />
          </div>

          <div className="p-4 rounded-xl edufit-card-primary space-y-2.5 border border-sky-500/30">
            <input
              type="text"
              value={block.activityOptionBTitle || "Pilihan B — Analisis Kasus / Simulasi"}
              onChange={(e) => updateBlock(block.id, { activityOptionBTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-surface-subtle"
            />
            <textarea
              rows={2}
              value={block.activityOptionBText || ""}
              onChange={(e) => updateBlock(block.id, { activityOptionBText: e.target.value })}
              placeholder="Deskripsi Pilihan B..."
              className="w-full p-3 rounded-xl text-xs outline-none edufit-surface-subtle"
            />
          </div>
        </div>
      )}

      {block.type === "fitt_simulator" && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.title || ""}
            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            placeholder="Judul Simulator FITT"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
          />
          <input
            type="text"
            value={block.fittDisclaimer || ""}
            onChange={(e) => updateBlock(block.id, { fittDisclaimer: e.target.value })}
            placeholder="Catatan disclaimer simulator..."
            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "tempo_simulator" && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.simulatorTitle || ""}
            onChange={(e) => updateBlock(block.id, { simulatorTitle: e.target.value })}
            placeholder="Judul Grafik Progresi..."
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
          />
          <input
            type="text"
            value={block.simulatorFootnote || ""}
            onChange={(e) => updateBlock(block.id, { simulatorFootnote: e.target.value })}
            placeholder="Catatan kaki grafik..."
            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "reflection" && (
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold uppercase opacity-65 block mb-1.5">
              Pertanyaan Refleksi (Wajib Dijawab Siswa & Tersinkronisasi Otomatis)
            </label>
            <textarea
              rows={3}
              value={block.reflectionPrompt || ""}
              onChange={(e) => {
                const text = e.target.value;
                updateBlock(block.id, { reflectionPrompt: text, value: text });
                setTriggerQuestion(text);
              }}
              placeholder="Tuliskan pertanyaan refleksi pemahaman unit ini..."
              className="w-full p-4 rounded-2xl text-sm sm:text-base font-semibold leading-relaxed outline-none resize-y edufit-card-primary border border-rose-500/30"
            />
          </div>
          <input
            type="text"
            value={block.reflectionGuide || ""}
            onChange={(e) => updateBlock(block.id, { reflectionGuide: e.target.value })}
            placeholder="Panduan Refleksi untuk Siswa & Guru..."
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
          />
          <textarea
            rows={2}
            value={block.reflectionSampleAnswer || ""}
            onChange={(e) => updateBlock(block.id, { reflectionSampleAnswer: e.target.value })}
            placeholder="Contoh jawaban ideal siswa (acuan penilaian guru)..."
            className="w-full p-3.5 rounded-xl text-xs outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "video" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={block.title || ""}
            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            placeholder="Judul Video Demonstrasi"
            className="px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
          />
          <input
            type="text"
            value={block.videoUrl || ""}
            onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
            placeholder="Tautan YouTube (https://www.youtube.com/watch?v=...)"
            className="px-4 py-2.5 rounded-xl text-sm font-mono outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.title || ""}
            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            placeholder="Judul Kotak Catatan (Cth: Pertanyaan Pemantik / Perhatian)..."
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
          />
          <textarea
            rows={2}
            value={block.value || ""}
            onChange={(e) => updateBlock(block.id, { value: e.target.value })}
            placeholder="Isi catatan penting..."
            className="w-full p-3.5 rounded-xl text-sm outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "quiz" && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.question || ""}
            onChange={(e) => updateBlock(block.id, { question: e.target.value })}
            placeholder="Pertanyaan Kuis Formatif..."
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(block.options || []).map((opt, oIdx) => (
              <div key={opt.key} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { correctOption: opt.key })}
                  className={`w-9 h-9 rounded-xl text-xs font-bold font-mono shrink-0 cursor-pointer ${
                    block.correctOption === opt.key ? "seg-btn-active" : "edufit-card-primary opacity-70"
                  }`}
                >
                  {opt.key}
                </button>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => {
                    const next = [...(block.options || [])];
                    next[oIdx].text = e.target.value;
                    updateBlock(block.id, { options: next });
                  }}
                  placeholder={`Pilihan ${opt.key}...`}
                  className="w-full px-3.5 py-2 rounded-xl text-sm outline-none edufit-card-primary"
                />
              </div>
            ))}
          </div>
          <input
            type="text"
            value={block.explanation || ""}
            onChange={(e) => updateBlock(block.id, { explanation: e.target.value })}
            placeholder="Penjelasan kunci jawaban saat siswa memilih..."
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
          />
        </div>
      )}

      {block.type === "glossary" && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl edufit-card-primary space-y-2 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-accent flex items-center gap-1.5">
                <ClipboardPaste size={14} /> Tempel Sekaligus dari Word (Glosarium)
              </span>
              <button
                type="button"
                onClick={() => {
                  const raw = bulkPasteBuffer[block.id] || "";
                  const parsed = parseBulkGlossaryFromText(raw);
                  if (parsed.length > 0) {
                    updateBlock(block.id, {
                      glossaryItems: [...(block.glossaryItems || []).filter((g) => g.term.trim()), ...parsed],
                    });
                    setBulkPasteBuffer((prev) => ({ ...prev, [block.id]: "" }));
                    toast.success(`Berhasil memuat ${parsed.length} istilah glosarium!`);
                  } else {
                    toast.error("Format teks glosarium tidak dikenali. Gunakan Tab, garis (|), atau titik dua (:).");
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer btn-forest-emerald"
              >
                Impor Glosarium
              </button>
            </div>
            <textarea
              rows={3}
              value={bulkPasteBuffer[block.id] || ""}
              onChange={(e) => setBulkPasteBuffer({ ...bulkPasteBuffer, [block.id]: e.target.value })}
              placeholder="Salin daftar istilah & pengertian dari Word lalu tempel di sini..."
              className="w-full p-3 rounded-xl text-xs outline-none edufit-surface-subtle resize-y font-mono"
            />
          </div>

          <div className="space-y-2.5">
            {(block.glossaryItems || []).map((gi, gIdx) => (
              <div key={gIdx} className="flex gap-2.5">
                <input
                  type="text"
                  value={gi.term}
                  onChange={(e) => {
                    const next = [...(block.glossaryItems || [])];
                    next[gIdx].term = e.target.value;
                    updateBlock(block.id, { glossaryItems: next });
                  }}
                  placeholder="Istilah..."
                  className="w-44 px-3.5 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
                />
                <input
                  type="text"
                  value={gi.definition}
                  onChange={(e) => {
                    const next = [...(block.glossaryItems || [])];
                    next[gIdx].definition = e.target.value;
                    updateBlock(block.id, { glossaryItems: next });
                  }}
                  placeholder="Pengertian istilah..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none edufit-card-primary"
                />
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { glossaryItems: (block.glossaryItems || []).filter((_, i) => i !== gIdx) })}
                  className="p-2 rounded-xl badge-tint-rose cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateBlock(block.id, { glossaryItems: [...(block.glossaryItems || []), { term: "", definition: "" }] })}
              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-accent"
            >
              <Plus size={14} /> Tambah Istilah Glosarium
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (viewMode === "form") {
    const allCollapsed = contentBlocks.length > 0 && contentBlocks.every((b) => Boolean(collapsedBlocks[b.id]));
    const totalAllBlocks = countTotalBlocksRecursive(contentBlocks);

    return (
      <div className="edufit-admin-theme w-full pt-2 pb-20 relative">
        {renderDynamicIsland()}

        {/* HEADER ATAS PENYUSUN MATERI */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 pb-5 mb-6 border-b border-hairline relative z-20">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-card-primary"
              >
                <ArrowLeft size={15} /> Daftar Materi
              </button>

              <div className="flex items-center p-1 rounded-2xl edufit-surface-subtle">
                {[
                  { key: "editor", icon: Edit3, label: "Penyusun" },
                  { key: "split", icon: Columns, label: "Layar Terbagi" },
                  { key: "preview", icon: Eye, label: "Pratinjau" },
                ].map((m) => {
                  const IconC = m.icon;
                  const active = workspaceLayout === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setWorkspaceLayout(m.key as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        active ? "seg-btn-active" : "seg-btn-idle"
                      }`}
                    >
                      <IconC size={13} /> {m.label}
                    </button>
                  );
                })}
              </div>

              {/* TOMBOL GENERATOR KERANGKA UNIT 1 SAMPAI UNIT 6 */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl edufit-surface-subtle">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-emerald-accent flex items-center gap-1">
                  <Sparkles size={12} /> Kerangka Cepat:
                </span>
                {([1, 2, 3, 4, 5, 6] as const).map((uNum) => (
                  <button
                    key={uNum}
                    type="button"
                    onClick={() => applyUnitStructuralPreset(uNum)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all edufit-card-primary hover:scale-105"
                    title={`Muat struktur Wadah Bab otomatis sesuai Unit ${uNum} Kelas X`}
                  >
                    Unit {uNum}
                  </button>
                ))}
              </div>

              {/* TOMBOL SMART WORD DOCUMENT IMPORTER */}
              <button
                type="button"
                onClick={() => setIsWordImporterOpen(!isWordImporterOpen)}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer badge-tint-emerald"
              >
                <FileText size={14} /> Impor Naskah Word Utuh
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-light tracking-tight leading-tight">
              {editingId ? "Edit" : "Susun"} <span className="font-semibold">{unitName || "Modul Pembelajaran"}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6 shrink-0">
            <div className="flex items-center gap-5">
              <div>
                <div className="text-3xl sm:text-4xl font-light font-mono tracking-tighter leading-none">{totalAllBlocks}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Bagian</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
                  ~{estimatedReadMinutes}m
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Estimasi Baca</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-7 py-3.5 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] btn-forest-emerald"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Modul"}
            </button>
          </div>
        </div>

        {/* PANEL SMART WORD DOCUMENT IMPORTER */}
        <AnimatePresence>
          {isWordImporterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-6 rounded-[2rem] edufit-card-secondary border border-emerald-500/40 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-emerald-accent block">
                    SMART WORD DOCUMENT PARSER
                  </span>
                  <h3 className="text-lg font-bold">
                    Tempel Seluruh Isi File Word Unit Pembelajaran Sekaligus
                  </h3>
                  <p className="text-xs opacity-70">
                    Salin (Ctrl+A lalu Ctrl+C) isi dokumen Word Unit Anda dan tempel di bawah. Sistem otomatis memisahkan CP/TP, membuat Wadah Bab (`section_container`), Rangkuman, dan Glosarium.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWordImporterOpen(false)}
                  className="p-2 rounded-xl edufit-card-primary cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={6}
                value={rawWordDocumentText}
                onChange={(e) => setRawWordDocumentText(e.target.value)}
                placeholder="Tempel seluruh isi teks dari dokumen Microsoft Word di sini..."
                className="w-full p-4 rounded-2xl text-xs font-mono outline-none edufit-card-primary resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWordImporterOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold edufit-card-primary cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSmartWordDocumentImport}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold btn-forest-emerald cursor-pointer"
                >
                  Proses & Susun Wadah Bab Otomatis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSPACE SPLIT-SCREEN */}
        <div className={`grid gap-6 items-start relative ${workspaceLayout === "split" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
          {workspaceLayout !== "preview" && (
            <form
              onSubmit={handleSubmit}
              className={`${workspaceLayout === "split" ? "lg:col-span-7" : "w-full"} rounded-[2rem] p-5 sm:p-8 space-y-8 edufit-card-primary`}
            >
              {/* BAGIAN IDENTITAS UTAMA (DENGAN SENSOR SCROLL NGAMBANG) */}
              <div ref={identitasCardRef} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
                  <h3 className="text-xl sm:text-2xl font-light tracking-tight">
                    Judul Unit, Sampul & <span className="font-semibold">Pertanyaan Refleksi</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {[10, 11, 12].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setActiveGrade(g)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer ${
                          activeGrade === g ? "seg-btn-active" : "edufit-surface-subtle"
                        }`}
                      >
                        Kelas {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-65 block mb-2">Judul Unit Materi *</label>
                  <input
                    required
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    type="text"
                    placeholder="Contoh: Unit 1: Konsep Dasar Kebugaran Jasmani dan Keselamatan Aktivitas Fisik"
                    className="w-full bg-transparent py-3 text-lg sm:text-2xl font-medium tracking-tight outline-none edufit-underline-select"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-80">Gambar Sampul Unit (Format 4:3) *</label>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono uppercase ${
                          imageUrl.trim() ? "badge-tint-emerald" : "badge-tint-rose"
                        }`}
                      >
                        {imageUrl.trim() ? "TERPASANG" : "WAJIB DIISI"}
                      </span>
                    </div>
                    <input type="file" accept="image/*" ref={heroFileInputRef} onChange={handleHeroImageUpload} className="hidden" />
                    {imageUrl ? (
                      <div className="relative w-full aspect-[4/3] rounded-2xl border border-hairline overflow-hidden group">
                        <img src={imageUrl} alt="Sampul Unit" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => heroFileInputRef.current?.click()}
                            className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Ganti Gambar
                          </button>
                          <button type="button" onClick={() => setImageUrl("")} className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer badge-tint-rose">
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => heroFileInputRef.current?.click()}
                        disabled={isUploadingHero}
                        className="w-full aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/50 rounded-2xl cursor-pointer transition-colors hover:opacity-80 edufit-surface-subtle"
                      >
                        <UploadCloud className="w-8 h-8 mb-2 text-emerald-accent" />
                        <span className="text-sm font-bold">{isUploadingHero ? "Mengunggah..." : "Klik untuk Unggah Sampul Unit"}</span>
                        <span className="text-xs opacity-60 mt-1">Tampil langsung pada kartu & header aplikasi siswa</span>
                      </button>
                    )}
                    <input
                      type="url"
                      value={imageUrl.startsWith("data:image") ? "" : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Atau tempel URL gambar sampul (https://...)"
                      className="w-full mt-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono outline-none edufit-surface-subtle"
                    />
                  </div>

                  <div className="flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-80">Pertanyaan Refleksi Wajib *</label>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            triggerQuestion.trim() ? "badge-tint-emerald" : "badge-tint-amber"
                          }`}
                        >
                          {triggerQuestion.trim() ? "TERISI" : "WAJIB"}
                        </span>
                      </div>
                      <textarea
                        value={triggerQuestion}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTriggerQuestion(val);
                          setContentBlocks((prev) =>
                            prev.map((b) => {
                              if (b.type === "reflection") {
                                scrollPreviewToBlock(b.id);
                                return { ...b, reflectionPrompt: val, value: val };
                              }
                              return b;
                            })
                          );
                        }}
                        rows={3}
                        placeholder="Pertanyaan refleksi pemahaman untuk dijawab siswa..."
                        className="w-full p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed outline-none resize-y edufit-surface-subtle"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest opacity-65 block mb-1.5">
                        Video YouTube Pengantar (Opsional)
                      </label>
                      <input
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none edufit-surface-subtle"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SUSUNAN ZONA & WADAH BAB MATERI */}
              <div className="space-y-5 pt-4">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-accent block">
                      ARSITEKTUR WADAH BERHIRARKI (PARENT-CHILD CONTAINER)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-light tracking-tight">
                      Susunan <span className="font-semibold">Zona & Bab Materi ({contentBlocks.length} Wadah Utama)</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleFocusMode(!singleFocusMode)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        singleFocusMode ? "seg-btn-active" : "edufit-surface-subtle"
                      }`}
                    >
                      {singleFocusMode ? "Mode Fokus 1 Bab: ON" : "Mode Fokus: Bebas"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCollapseAllBlocks(!allCollapsed)}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer edufit-surface-subtle hover:opacity-85"
                    >
                      {allCollapsed ? (
                        <>
                          <Maximize2 size={14} /> Buka Semua Bab
                        </>
                      ) : (
                        <>
                          <Minimize2 size={14} /> Lipat Semua Bab
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* PETA NAVIGASI BAB & ZONA (KLIK LANGSUNG SCROLL EDITOR & HP PREVIEW SEKALIGUS) */}
                <div className="p-4 rounded-2xl edufit-surface-subtle space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-65">
                    <span>Peta Hirarki Bab (Klik untuk melompat di Editor & Layar HP)</span>
                    <span className="font-mono">{contentBlocks.length} WADAH UTAMA</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {contentBlocks.map((b, i) => {
                      const isCollapsed = Boolean(collapsedBlocks[b.id]);
                      const codeLabel = b.headingCode || b.procCode || `${i + 1}`;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            if (singleFocusMode) {
                              const map: Record<string, boolean> = {};
                              contentBlocks.forEach((item) => {
                                map[item.id] = item.id !== b.id;
                              });
                              setCollapsedBlocks(map);
                            } else {
                              setCollapsedBlocks((prev) => ({ ...prev, [b.id]: false }));
                            }
                            document.getElementById(`editor-block-${b.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                            scrollPreviewToBlock(b.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                            !isCollapsed ? "telemetry-bar-forest text-gold-accent" : "edufit-card-primary opacity-75 hover:opacity-100"
                          }`}
                        >
                          <span className="font-mono">{codeLabel}</span>
                          <span className="max-w-[140px] truncate">{b.title || getBlockTypeMeta(b.type).badge}</span>
                          {b.type === "section_container" && (
                            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">
                              {(b.children || []).length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DAFTAR WADAH BAB & ZONA UTAMA */}
                <div className="space-y-5">
                  {contentBlocks.map((block, index) => {
                    const isCollapsed = Boolean(collapsedBlocks[block.id]);
                    const meta = getBlockTypeMeta(block.type);
                    const summaryText = getBlockSummaryPreview(block);

                    const toggleThisBlock = () => {
                      if (singleFocusMode) {
                        const map: Record<string, boolean> = {};
                        contentBlocks.forEach((item) => {
                          map[item.id] = item.id === block.id ? !collapsedBlocks[block.id] : true;
                        });
                        setCollapsedBlocks(map);
                      } else {
                        setCollapsedBlocks((prev) => ({ ...prev, [block.id]: !prev[block.id] }));
                      }
                      scrollPreviewToBlock(block.id);
                    };

                    return (
                      <React.Fragment key={block.id}>
                        <div
                          id={`editor-block-${block.id}`}
                          onFocusCapture={() => scrollPreviewToBlock(block.id)}
                          className={`rounded-3xl p-4 sm:p-6 space-y-4 transition-all ${
                            block.type === "section_container"
                              ? "edufit-card-secondary border-2 border-emerald-500/35 shadow-sm"
                              : "edufit-surface-subtle border border-hairline"
                          }`}
                        >
                          {/* HEADER WADAH / ZONA */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-hairline">
                            <div onClick={toggleThisBlock} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none">
                              <span className="w-9 h-9 rounded-xl text-xs font-bold font-mono flex items-center justify-center shrink-0 telemetry-bar-forest text-gold-accent">
                                {block.headingCode || index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      block.type === "reflection"
                                        ? "badge-tint-rose"
                                        : block.type === "section_container"
                                        ? "badge-tint-amber"
                                        : "badge-tint-emerald"
                                    }`}
                                  >
                                    {meta.badge}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider truncate">{meta.label}</span>
                                </div>
                                <p className="text-xs sm:text-sm opacity-70 truncate mt-0.5">{summaryText}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={toggleThisBlock}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer edufit-card-primary"
                              >
                                {isCollapsed ? "Buka Wadah" : "Lipat Wadah"}
                              </button>
                              <button
                                type="button"
                                onClick={() => moveBlock(index, "up")}
                                disabled={index === 0}
                                className="p-2 rounded-xl disabled:opacity-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                title="Geser Wadah Naik"
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveBlock(index, "down")}
                                disabled={index === contentBlocks.length - 1}
                                className="p-2 rounded-xl disabled:opacity-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                title="Geser Wadah Turun"
                              >
                                <ArrowDown size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateBlock(index)}
                                className="p-2 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                title="Duplikat Wadah"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                className="p-2 rounded-xl cursor-pointer badge-tint-rose"
                                title="Hapus Wadah"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* ISI WADAH BAB UTAMA (SECTION CONTAINER DENGAN SUB-BLOK DI DALAMNYA) */}
                          {!isCollapsed && block.type === "section_container" && (
                            <div className="space-y-5 pt-1">
                              {/* IDENTITAS WADAH BAB INDUK */}
                              <div className="p-4 rounded-2xl edufit-card-primary space-y-3 border border-hairline">
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                  <div>
                                    <label className="text-xs font-bold uppercase opacity-65 block mb-1">Kode Bab</label>
                                    <input
                                      type="text"
                                      value={block.headingCode || ""}
                                      onChange={(e) => updateBlock(block.id, { headingCode: e.target.value })}
                                      placeholder="B / C / D"
                                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono outline-none edufit-surface-subtle"
                                    />
                                  </div>
                                  <div className="sm:col-span-4">
                                    <label className="text-xs font-bold uppercase opacity-65 block mb-1">
                                      Judul Bab Utama (Wadah Induk) *
                                    </label>
                                    <input
                                      type="text"
                                      value={block.title || ""}
                                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                      placeholder="Contoh: Faktor-Faktor yang Memengaruhi Kebugaran Jasmani"
                                      className="w-full px-4 py-2.5 rounded-xl text-base font-bold outline-none edufit-surface-subtle"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-65 block mb-1">
                                    Ringkasan / Pengantar Singkat Bab Ini (Opsional)
                                  </label>
                                  <input
                                    type="text"
                                    value={block.sectionSummary || ""}
                                    onChange={(e) => updateBlock(block.id, { sectionSummary: e.target.value })}
                                    placeholder="Kalimat pengantar singkat yang tampil di header kartu bab..."
                                    className="w-full px-4 py-2 rounded-xl text-xs outline-none edufit-surface-subtle"
                                  />
                                </div>
                              </div>

                              {/* DAFTAR SUB-BAGIAN (CHILDREN) DI DALAM WADAH BAB INI */}
                              <div className="pl-3 sm:pl-5 border-l-2 border-emerald-500/40 space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-accent">
                                    ISI SUB-MATERI DI DALAM BAB {block.headingCode || index + 1} ({(block.children || []).length} ITEM)
                                  </span>
                                </div>

                                {(block.children || []).map((child, cIdx) => {
                                  const childMeta = getBlockTypeMeta(child.type);
                                  return (
                                    <div
                                      key={child.id}
                                      id={`editor-block-${child.id}`}
                                      onFocusCapture={(e) => {
                                        e.stopPropagation();
                                        scrollPreviewToBlock(child.id);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        scrollPreviewToBlock(child.id);
                                      }}
                                      className="p-4 rounded-2xl edufit-surface-subtle border border-hairline space-y-3.5"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-hairline">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold telemetry-bar-forest text-gold-accent">
                                            {block.headingCode || "B"}.{cIdx + 1}
                                          </span>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold badge-tint-emerald">
                                            {childMeta.badge}
                                          </span>
                                          <span className="text-xs font-bold truncate">
                                            {child.title || child.tableTitle || childMeta.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => moveChildInContainer(block.id, cIdx, "up")}
                                            disabled={cIdx === 0}
                                            className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-black/5"
                                            title="Geser Sub-Materi Naik"
                                          >
                                            <ArrowUp size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => moveChildInContainer(block.id, cIdx, "down")}
                                            disabled={cIdx === (block.children?.length || 1) - 1}
                                            className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-black/5"
                                            title="Geser Sub-Materi Turun"
                                          >
                                            <ArrowDown size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => duplicateChildInContainer(block.id, cIdx)}
                                            className="p-1.5 rounded-lg cursor-pointer hover:bg-black/5"
                                            title="Duplikat Sub-Materi"
                                          >
                                            <Copy size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeChildFromContainer(block.id, child.id)}
                                            className="p-1.5 rounded-lg badge-tint-rose cursor-pointer"
                                            title="Hapus Sub-Materi"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      {renderBlockFieldsEditor(child)}
                                    </div>
                                  );
                                })}

                                {/* TOMBOL TAMBAH SUB-MATERI DI DALAM WADAH BAB INI */}
                                <div className="pt-1">
                                  {insertChildMenuForContainer === block.id ? (
                                    <div className="p-4 rounded-2xl edufit-card-primary border border-emerald-500/40 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold uppercase text-emerald-accent">
                                          Pilih Komponen untuk Ditambahkan ke Dalam Bab {block.headingCode || ""}:
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setInsertChildMenuForContainer(null)}
                                          className="text-xs font-bold opacity-65 hover:opacity-100 cursor-pointer flex items-center gap-1"
                                        >
                                          <X size={14} /> Tutup
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {SECTION_CHILD_COMPONENTS.map((comp) => {
                                          const IconSub = comp.icon;
                                          return (
                                            <button
                                              key={comp.type}
                                              type="button"
                                              onClick={() => addChildToContainer(block.id, comp.type)}
                                              className="p-3 rounded-xl text-left flex items-start gap-2.5 cursor-pointer edufit-surface-subtle hover:scale-[1.01] transition-all border border-hairline"
                                            >
                                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 telemetry-bar-forest text-gold-accent">
                                                <IconSub size={15} />
                                              </div>
                                              <div className="min-w-0">
                                                <div className="text-xs font-bold leading-snug">+ {comp.label}</div>
                                                <div className="text-[11px] opacity-60 leading-tight mt-0.5">{comp.shortDesc}</div>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setInsertChildMenuForContainer(block.id)}
                                      className="w-full py-3 px-4 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-emerald-500/40 text-emerald-accent hover:bg-emerald-500/5 transition-colors"
                                    >
                                      <Plus size={15} /> Tambah Sub-Materi / Tabel / Prosedur / Rumus di Dalam Bab {block.headingCode || ""} Ini
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ISI UNTUK ZONA STANDALONE (CP/TP, STUDI KASUS, AKTIVITAS, REFLEKSI, KUIS, GLOSARIUM) */}
                          {!isCollapsed && block.type !== "section_container" && renderBlockFieldsEditor(block)}

                          {!isCollapsed && (
                            <div className="pt-3 border-t border-hairline flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  toggleThisBlock();
                                  document.getElementById(`editor-block-${block.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer edufit-card-primary flex items-center gap-1.5"
                              >
                                <ChevronUp size={14} /> Lipat Wadah Ini
                              </button>
                            </div>
                          )}
                        </div>

                        {/* TOMBOL SISIPKAN WADAH BAB BARU DI ANTARA URUTAN */}
                        <div className="relative flex items-center justify-center py-0.5">
                          {insertMenuAtIndex === index + 1 ? (
                            <div className="w-full p-4 rounded-2xl border border-hairline edufit-card-secondary space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-accent">
                                  SISIPKAN WADAH BAB / ZONA BARU DI URUTAN #{index + 2}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setInsertMenuAtIndex(null)}
                                  className="text-xs font-bold opacity-65 hover:opacity-100 cursor-pointer flex items-center gap-1"
                                >
                                  <X size={14} /> Tutup
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {BLOCK_CATALOG_GROUPS.flatMap((g) => g.items).map((item) => {
                                  const IconI = item.icon;
                                  return (
                                    <button
                                      key={item.type}
                                      type="button"
                                      onClick={() => addBlock(item.type, index + 1)}
                                      className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer edufit-card-primary hover:scale-[1.02] transition-transform"
                                    >
                                      <IconI size={13} /> {item.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setInsertMenuAtIndex(index + 1)}
                              className="px-3.5 py-1 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider opacity-45 hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer edufit-surface-subtle"
                            >
                              <Plus size={12} /> Sisipkan Wadah Bab / Zona di Sini
                            </button>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* KATALOG TAMBAH WADAH BAB & ZONA UTAMA */}
                <div className="p-6 rounded-3xl space-y-4 edufit-surface-subtle border border-hairline">
                  <div>
                    <span className="text-xs font-bold font-mono uppercase tracking-widest text-emerald-accent block">
                      TAMBAH WADAH BAB ATAU ZONA EVALUASI
                    </span>
                    <h4 className="text-lg font-bold tracking-tight">Pilih Wadah Utama untuk Ditambahkan ke Unit Ini</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl edufit-card-primary">
                    {BLOCK_CATALOG_GROUPS.map((grp) => {
                      const active = activePickerGroup === grp.groupId;
                      return (
                        <button
                          key={grp.groupId}
                          type="button"
                          onClick={() => setActivePickerGroup(grp.groupId)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold text-left cursor-pointer transition-all truncate ${
                            active ? "seg-btn-active" : "seg-btn-idle"
                          }`}
                        >
                          {grp.groupLabel}
                        </button>
                      );
                    })}
                  </div>

                  {BLOCK_CATALOG_GROUPS.filter((g) => g.groupId === activePickerGroup).map((grp) => (
                    <div key={grp.groupId} className="space-y-3">
                      <p className="text-xs sm:text-sm opacity-65">{grp.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {grp.items.map((item) => {
                          const IconB = item.icon;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => addBlock(item.type)}
                              className="p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer transition-all hover:scale-[1.01] edufit-card-primary border border-hairline"
                            >
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 telemetry-bar-forest text-gold-accent">
                                <IconB size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold leading-snug">+ {item.label}</div>
                                <div className="text-xs opacity-60 leading-snug mt-0.5">{item.shortDesc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* WADAH PRATINJAU KANAN (NGAMBANG OTOMATIS SAAT DI-SCROLL KE IDENTITAS) */}
          {workspaceLayout !== "editor" && (
            <div
              ref={previewColumnSlotRef}
              className={workspaceLayout === "split" ? "lg:col-span-5 w-full relative" : "w-full"}
              style={{
                minHeight: workspaceLayout === "split" ? `${floatingPreview.height}px` : "720px",
              }}
            >
              <div
                style={
                  workspaceLayout === "split" && floatingPreview.isFloating && floatingPreview.width > 0
                    ? {
                        position: "fixed",
                        top: `${floatingPreview.top}px`,
                        left: `${floatingPreview.left}px`,
                        width: `${floatingPreview.width}px`,
                        height: `${floatingPreview.height}px`,
                        zIndex: 40,
                      }
                    : {
                        width: "100%",
                        height: workspaceLayout === "split" ? `${floatingPreview.height}px` : "760px",
                      }
                }
              >
                {renderStudioLivePreview()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // HALAMAN UTAMA DAFTAR MODUL MATERI
  // ==========================================================================
  return (
    <div className="edufit-admin-theme w-full pt-2 pb-16 relative">
      {renderDynamicIsland()}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">MANAJEMEN KURIKULUM PJOK</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={15} /> Kurikulum Kelas {activeGrade}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Materi & <br />
            <span className="font-semibold">Refleksi Siswa</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : materials.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">Unit Kelas {activeGrade}</div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : totalBlocksActiveGrade}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">Bagian Materi</div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : reflectionStats.total}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">Jawaban Refleksi</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Total Kurikulum</span>
            <span className="font-mono">KELAS 10–12</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">{isLoading ? "—" : `${allMaterials.length} Modul`}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Fase E & F</span>
          </div>
        </div>
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Penilaian Guru</span>
            <span className="font-mono">GRADE A–D</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">{isLoading ? "—" : `${reflectionStats.graded} Dinilai`}</span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">{reflectionStats.pct}% TUNTAS</span>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kelengkapan Materi</span>
            <span className="font-mono">KELAS {activeGrade}</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${totalBlocksActiveGrade} Bagian Aktif`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">Siap Tayang</span>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Gambar Sampul</span>
            <span className="font-mono">WAJIB</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${materials.filter((m) => String(m.image_url || "").trim()).length}/${materials.length}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55">
                <SlidersHorizontal size={14} />
                <span>Filter Modul</span>
              </div>
              <button
                type="button"
                onClick={handleExportMateriCSV}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Unduh Data Kurikulum CSV"
              >
                <Download size={15} />
              </button>
            </div>
            <h2 className="text-3xl font-light tracking-tight mb-2">Kendali Materi</h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih tingkatan kelas atau lompat cepat ke penyusun unit materi.
            </p>
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[10, 11, 12].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setActiveGrade(g);
                    triggerDynamicIsland(`Filter Modul Kelas ${g}`, `Menampilkan daftar unit pembelajaran Kelas ${g}.`, "info");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeGrade === g ? "seg-btn-active" : "seg-btn-idle"
                  }`}
                >
                  Kelas {g}
                </button>
              ))}
            </div>
            <div className="relative w-full mb-6" ref={quickJumpRef}>
              <div
                onClick={() => setIsQuickJumpOpen(!isQuickJumpOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isQuickJumpOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  Buka Cepat ({materials.length} Unit Kelas {activeGrade})
                </span>
                <ChevronDown size={22} className={`transition-transform duration-300 opacity-60 shrink-0 ${isQuickJumpOpen ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {isQuickJumpOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    {materials.length === 0 ? (
                      <div className="p-5 text-sm opacity-50 text-center">Belum ada unit materi di Kelas {activeGrade}.</div>
                    ) : (
                      materials.map((m, idx) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setIsQuickJumpOpen(false);
                            openEditForm(m);
                          }}
                          className="px-6 py-4 text-base font-medium cursor-pointer transition-colors flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <span className="truncate pr-3">
                            <span className="font-mono text-gold-accent mr-2">U{idx + 1}</span>
                            {m.unit_name}
                          </span>
                          <ArrowUpRight size={16} className="opacity-50" />
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md relative z-10 btn-forest-emerald"
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Modul Materi Baru
          </button>
        </div>

        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <Layers size={15} />
              <span>Rincian Bagian per Unit</span>
            </div>
            <span className="text-[11px] font-bold font-mono opacity-55">KLIK BATANG</span>
          </div>
          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">{isLoading ? "—" : totalBlocksActiveGrade}</div>
            <div className="text-sm font-semibold opacity-55 mb-1">Total Bagian Materi Kelas {activeGrade}</div>
          </div>
          {(() => {
            const bars = materials.slice(0, 6);
            const maxBlocks = Math.max(1, ...bars.map((m) => countTotalBlocksRecursive(parseMaterialToBlocks(m))));
            return (
              <div
                className="grid gap-3 items-end pt-4 h-44 relative z-10"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, bars.length)}, minmax(0, 1fr))` }}
              >
                {bars.map((mat, idx) => {
                  const bCount = countTotalBlocksRecursive(parseMaterialToBlocks(mat));
                  const heightPct = Math.round((bCount / maxBlocks) * 100);
                  const isHighest = bCount === maxBlocks && bCount > 0;
                  const fillClass = isHighest ? "chart-fill-gold" : "chart-fill-primary";
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => openEditForm(mat)}
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${mat.unit_name}: ${bCount} Bagian Materi`}
                    >
                      <span className="text-[11px] font-bold font-mono opacity-80">{bCount}</span>
                      <div className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div
                          className={`w-full rounded-full transition-all duration-500 group-hover:scale-y-105 ${fillClass}`}
                          style={{ height: `${Math.max(bCount > 0 ? 18 : 8, heightPct)}%` }}
                        />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                      <span className="text-[10px] font-bold font-mono opacity-65 truncate max-w-full">U{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} />
              <span>Indeks Kurikulum</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              {[
                { key: "graded", label: "Refleksi" },
                { key: "blocks", label: "Bagian" },
                { key: "units", label: "Unit" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setGaugeMode(m.key as any)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    gaugeMode === m.key ? "seg-btn-active" : "seg-btn-idle"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {(() => {
            const gaugeValue =
              gaugeMode === "graded" ? `${reflectionStats.pct}%` : gaugeMode === "blocks" ? `${totalBlocksActiveGrade}` : `${allMaterials.length}`;
            const gaugeLabel =
              gaugeMode === "graded"
                ? "Refleksi Dinilai Guru"
                : gaugeMode === "blocks"
                ? `Bagian Materi Kelas ${activeGrade}`
                : "Total Unit Kelas 10–12";
            const gaugePct =
              gaugeMode === "graded"
                ? reflectionStats.pct
                : gaugeMode === "blocks"
                ? Math.min(100, totalBlocksActiveGrade * 5)
                : Math.min(100, allMaterials.length * 8);
            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (Math.max(10, gaugePct) / 100) * circumference;
            return (
              <div className="relative flex flex-col items-center justify-center my-2 z-10">
                <div className="relative flex items-center justify-center">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="6" strokeDasharray="2 5" className="gauge-circle-track" />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className={`transition-all duration-700 ${gaugeMode === "graded" ? "gauge-circle-emerald" : "gauge-circle-gold"}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-light font-mono tracking-tighter leading-none">{isLoading ? "—" : gaugeValue}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold opacity-65 mt-3 text-center">{gaugeLabel}</span>
              </div>
            );
          })()}
          <div className="relative z-10">
            <div className="h-2.5 w-full rounded-full flex overflow-hidden mb-3 chart-track-pill">
              <div className="h-full chart-fill-sky" style={{ width: `${(gradeCountBreakdown.g10 / gradeCountBreakdown.total) * 100}%` }} />
              <div className="h-full chart-fill-gold" style={{ width: `${(gradeCountBreakdown.g11 / gradeCountBreakdown.total) * 100}%` }} />
              <div className="h-full chart-fill-emerald" style={{ width: `${(gradeCountBreakdown.g12 / gradeCountBreakdown.total) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-2 border-t border-hairline">
              <span>Kls 10 ({gradeCountBreakdown.g10})</span>
              <span>Kls 11 ({gradeCountBreakdown.g11})</span>
              <span>Kls 12 ({gradeCountBreakdown.g12})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent mb-1">MODUL PEMBELAJARAN INTERAKTIF</div>
          <h3 className="text-3xl font-light tracking-tight">
            Daftar Unit Materi Kelas {activeGrade} ({materials.length})
          </h3>
          <p className="text-xs font-medium opacity-55 mt-1">
            Klik kartu unit materi untuk menyusun isi pembelajaran berhirarki dan melihat tampilan langsung di aplikasi siswa.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer btn-forest-emerald"
        >
          <Plus size={15} strokeWidth={2.5} /> Tambah Modul Kelas {activeGrade}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-[380px] rounded-[2rem] animate-pulse edufit-surface-subtle" />)
        ) : materials.length === 0 ? (
          <div className="xl:col-span-3 p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-xl font-light">Belum ada unit materi untuk Kelas {activeGrade}.</h3>
          </div>
        ) : (
          materials.map((mat, index) => {
            const showcaseClass = BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const blocks = parseMaterialToBlocks(mat);
            const totalItemsCount = countTotalBlocksRecursive(blocks);
            const chapterCount = blocks.filter((b) => b.type === "section_container").length;
            const unitRefStat = reflectionsByUnitMap[mat.unit_name] || { total: 0, graded: 0 };
            const hasThumbnail = Boolean(mat.image_url && String(mat.image_url).trim());

            return (
              <div
                key={mat.id}
                onClick={() => openEditForm(mat)}
                className={`p-7 sm:p-8 rounded-[2rem] flex flex-col justify-between min-h-[380px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass}`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                      UNIT {index + 1} · KELAS {mat.grade_level}
                    </span>
                    {!hasThumbnail && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase badge-tint-rose">BELUM ADA SAMPUL</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(mat);
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Edit Modul"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(mat.id, mat.unit_name, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
                      title="Hapus Modul"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
                      <ArrowUpRight size={18} strokeWidth={1.75} />
                    </div>
                  </div>
                </div>

                {hasThumbnail && (
                  <div className="relative z-10 mt-4 aspect-[4/3] w-full rounded-2xl overflow-hidden border border-black/10 bg-black/5">
                    <img
                      src={mat.image_url}
                      alt={mat.unit_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="my-5 relative z-10">
                  <div className="text-2xl md:text-3xl font-light tracking-tighter leading-tight mb-2">{mat.unit_name}</div>
                  <p className="text-xs font-medium opacity-65 line-clamp-2 italic leading-relaxed">
                    &ldquo;{mat.trigger_question || "Klik kartu untuk mengatur isi materi dan pertanyaan pemantik refleksi."}&rdquo;
                  </p>
                </div>
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-4 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Struktur ({chapterCount} Wadah Bab)
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {totalItemsCount} <span className="text-sm font-sans font-medium opacity-60">Bagian</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">Refleksi Siswa</div>
                    <div className="text-4xl font-light font-mono leading-none text-gold-accent">
                      {unitRefStat.graded}/{unitRefStat.total}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}