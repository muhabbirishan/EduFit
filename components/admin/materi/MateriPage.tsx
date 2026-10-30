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
  ClipboardCheck,
  Columns,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Heading,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  Maximize2,
  MessageSquareWarning,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
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
  | "heading"
  | "paragraph"
  | "list"
  | "collapsible"
  | "figure"
  | "procedure"
  | "table"
  | "formula"
  | "tempo_simulator"
  | "video"
  | "callout"
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

export interface ContentBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  value: string;
  headingLevel?: "section" | "sub" | "point";
  headingCode?: string;
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
  figureTheme?: "green" | "blue" | "neutral";
  procCode?: string;
  procPurpose?: string;
  procTools?: string;
  procSteps?: { label: string; text: string }[];
  procMistakes?: string;
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

const EDUFIT_BLOCKS_MARKER_START = "<!--EDUFIT_SAAS_BLOCKS_START:";
const EDUFIT_BLOCKS_MARKER_END = ":EDUFIT_SAAS_BLOCKS_END-->";

function safeUtf8ToBase64(str: string): string {
  try {
    if (typeof window === "undefined") return "";
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkSize))
      );
    }
    return window.btoa(binary);
  } catch {
    try {
      return typeof window !== "undefined"
        ? window.btoa(unescape(encodeURIComponent(str)))
        : "";
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
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return decodeURIComponent(escape(window.atob(base64)));
  }
}

function encodeBlocksToMarker(blocks: ContentBlock[]): string {
  try {
    const json = JSON.stringify(blocks);
    const base64 = safeUtf8ToBase64(json);
    if (!base64) return "";
    return `${EDUFIT_BLOCKS_MARKER_START}${base64}${EDUFIT_BLOCKS_MARKER_END}`;
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
      const base64 = htmlString.substring(
        startIdx + EDUFIT_BLOCKS_MARKER_START.length,
        endIdx
      );
      const json = safeBase64ToUtf8(base64);
      const parsed = JSON.parse(json);
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
  const trimmed = url.trim();
  if (!trimmed) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

function compressImageToDataUrl(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
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
    (
      message: string,
      subtitle?: string,
      type: "success" | "error" | "info" = "info"
    ) => {
      if (islandTimerRef.current) clearTimeout(islandTimerRef.current);
      setIslandAlert({ id: Date.now(), message, subtitle, type });
      islandTimerRef.current = setTimeout(() => setIslandAlert(null), 3400);
    },
    []
  );

  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const quickJumpRef = useRef<HTMLDivElement>(null);

  const [workspaceLayout, setWorkspaceLayout] = useState<
    "split" | "editor" | "preview"
  >("split");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewportSize>(375);
  const [previewStage, setPreviewStage] = useState<"detail" | "overview">("detail");
  const [previewSectionFilter, setPreviewSectionFilter] = useState<
    "all" | "materi" | "media" | "interaktif"
  >("all");
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState<Record<string, string>>({});

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
  const [previewSelectedVariant, setPreviewSelectedVariant] = useState<
    Record<string, number>
  >({});
  const [previewTempoTab, setPreviewTempoTab] = useState<Record<string, number>>({});
  const [previewTempoStep, setPreviewTempoStep] = useState<Record<string, number>>(
    {}
  );
  const [previewVideoLoaded, setPreviewVideoLoaded] = useState<
    Record<string, boolean>
  >({});
  const [previewQuizSelected, setPreviewQuizSelected] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        quickJumpRef.current &&
        !quickJumpRef.current.contains(e.target as Node)
      ) {
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
        supabase
          .from("student_reflections")
          .select("id, unit_name, score, grade, material_id"),
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
    const arr = allMaterials.filter(
      (m) => Number(m.grade_level) === Number(activeGrade)
    );
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
          cpMain: "",
          cpSupport: "",
          learningFocus: "",
          objectivesList: [""],
          operationalNote: "",
          value: "",
        };
      case "heading":
        return {
          id,
          type: "heading",
          headingLevel: "section",
          headingCode: "B",
          title: "",
          value: "",
        };
      case "paragraph":
        return { id, type: "paragraph", value: "" };
      case "list":
        return {
          id,
          type: "list",
          title: "",
          listStyle: "number",
          value: "",
          items: ["", ""],
        };
      case "collapsible":
        return {
          id,
          type: "collapsible",
          title: "",
          collapsibleMode: "steps",
          value: "",
          collapsibleItems: [{ label: "Tahap 1", text: "" }],
        };
      case "figure":
        return {
          id,
          type: "figure",
          overline: "ILUSTRASI",
          title: "",
          imageUrl: "",
          caption: "",
          figureTheme: "green",
          value: "",
        };
      case "procedure":
        return {
          id,
          type: "procedure",
          procCode: "1",
          title: "",
          imageUrl: "",
          caption: "",
          procPurpose: "",
          procTools: "",
          procSteps: [{ label: "1. Persiapan", text: "" }],
          procMistakes: "",
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
              headers: ["Kolom 1", "Kolom 2", "Kolom 3"],
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
          title: "",
          formulaMode: "fraction",
          formulaLeft: "IMT",
          formulaNumerator: "Berat Badan (kg)",
          formulaDenominator: "Tinggi Badan (m) × Tinggi Badan (m)",
          formulaLinearExpr: "",
          formulaNote: "",
          formulaCaseTitle: "",
          formulaSteps: [{ label: "Langkah 1", expression: "" }],
          formulaResult: "",
          formulaCategoryBadge: "",
          value: "",
        };
      case "tempo_simulator":
        return {
          id,
          type: "tempo_simulator",
          simulatorTitle: "",
          simulatorFootnote: "",
          value: "",
          tempoMethods: [
            {
              id: generateId(),
              name: "Metode 1",
              steps: [
                { label: "Tahap 1", level: 2 },
                { label: "Tahap 2", level: 3 },
              ],
            },
          ],
        };
      case "video":
        return {
          id,
          type: "video",
          title: "",
          value: "",
          videoButtonLabel: "Putar Video",
          videoUrl: "",
          observationPoints: [""],
        };
      case "callout":
        return {
          id,
          type: "callout",
          title: "",
          calloutTone: "amber",
          value: "",
        };
      case "quiz":
        return {
          id,
          type: "quiz",
          title: "Soal Formatif Cek Pemahaman",
          question: "",
          options: [
            { key: "A", text: "" },
            { key: "B", text: "" },
            { key: "C", text: "" },
            { key: "D", text: "" },
          ],
          correctOption: "A",
          explanation: "",
          value: "",
        };
      case "glossary":
        return {
          id,
          type: "glossary",
          headingCode: "L",
          title: "Glosarium Unit Pembelajaran",
          value: "",
          glossaryItems: [{ term: "", definition: "" }],
        };
    }
  };

  const applyStandardTemplate = () => {
    setContentBlocks([
      createDefaultBlock("cp_tp"),
      {
        id: generateId(),
        type: "heading",
        headingLevel: "section",
        headingCode: "B",
        title: "Pengantar Pembelajaran",
        value: "",
      },
      createDefaultBlock("paragraph"),
      createDefaultBlock("table"),
      {
        id: generateId(),
        type: "heading",
        headingLevel: "section",
        headingCode: "C",
        title: "Prosedur & Tata Cara Pelaksanaan",
        value: "",
      },
      createDefaultBlock("procedure"),
      createDefaultBlock("formula"),
      createDefaultBlock("quiz"),
      createDefaultBlock("glossary"),
    ]);
    triggerDynamicIsland(
      "Kerangka Kurikulum Diterapkan",
      "Susunan bagian A sampai Glosarium siap diisi.",
      "success"
    );
  };

  const parseMaterialToBlocks = (mat: any): ContentBlock[] => {
    if (mat?.content_blocks) {
      if (Array.isArray(mat.content_blocks) && mat.content_blocks.length > 0) {
        return mat.content_blocks.map((b: any) => ({
          ...b,
          id: b?.id || generateId(),
          value: b?.value ?? "",
        }));
      }
      if (typeof mat.content_blocks === "string") {
        try {
          const parsedJson = JSON.parse(mat.content_blocks);
          if (Array.isArray(parsedJson) && parsedJson.length > 0) {
            return parsedJson.map((b: any) => ({
              ...b,
              id: b?.id || generateId(),
              value: b?.value ?? "",
            }));
          }
        } catch {}
      }
    }
    const htmlString = mat?.content_text || "";
    const fromMarker = decodeBlocksFromMarker(htmlString);
    if (fromMarker && fromMarker.length > 0) {
      return fromMarker.map((b: any) => ({
        ...b,
        id: b?.id || generateId(),
        value: b?.value ?? "",
      }));
    }
    if (!htmlString.trim())
      return [createDefaultBlock("heading"), createDefaultBlock("paragraph")];
    if (typeof window === "undefined") return [createDefaultBlock("paragraph")];

    const parser = new DOMParser();
    const doc = parser.parseFromString(
      stripMarkerFromHtml(htmlString),
      "text/html"
    );
    const blocks: ContentBlock[] = [];
    doc.body.childNodes.forEach((node) => {
      if (node.nodeName === "P") {
        const el = node as HTMLElement;
        const strong = el.querySelector("strong");
        const isOnlyStrong =
          strong !== null &&
          (el.textContent || "").trim() === (strong.textContent || "").trim();
        if (isOnlyStrong) {
          blocks.push({
            id: generateId(),
            type: "heading",
            headingLevel: "section",
            title: strong.textContent || "",
            value: "",
          });
        } else {
          blocks.push({
            id: generateId(),
            type: "paragraph",
            value: el.innerHTML
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/?strong>/gi, ""),
          });
        }
      } else if (node.nodeName === "UL" || node.nodeName === "OL") {
        const el = node as HTMLElement;
        const items = Array.from(el.querySelectorAll("li")).map(
          (li) => li.textContent || ""
        );
        blocks.push({
          id: generateId(),
          type: "list",
          title: "",
          listStyle: node.nodeName === "OL" ? "number" : "bullet",
          value: "",
          items: items.length > 0 ? items : [""],
        });
      } else if (node.nodeName === "BLOCKQUOTE") {
        blocks.push({
          id: generateId(),
          type: "callout",
          title: "Catatan Penting",
          calloutTone: "amber",
          value: (node.textContent || "").trim(),
        });
      }
    });
    if (blocks.length === 0 && stripMarkerFromHtml(htmlString).trim()) {
      blocks.push({
        id: generateId(),
        type: "paragraph",
        value: stripMarkerFromHtml(htmlString).trim(),
      });
    }
    return blocks.length > 0 ? blocks : [createDefaultBlock("paragraph")];
  };

  const compileBlocksToHTML = (blocks: ContentBlock[]): string => {
    let html = "";
    blocks.forEach((b) => {
      const val = b.value || "";
      if (b.type === "cp_tp") {
        html += `<p><strong>${b.headingCode ? `${b.headingCode}. ` : ""}${
          b.title || "Identitas dan Tujuan Pembelajaran"
        }</strong></p>`;
        if (b.cpMain) html += `<p><strong>Elemen CP Utama:</strong> ${b.cpMain}</p>`;
        if (b.learningFocus)
          html += `<p><strong>Fokus Pembelajaran:</strong> ${b.learningFocus}</p>`;
        const objs = (b.objectivesList || [])
          .filter((o) => String(o || "").trim() !== "")
          .map((o) => `<li>${o}</li>`)
          .join("");
        if (objs) html += `<ol>${objs}</ol>`;
      } else if (b.type === "heading" && (b.title || val).trim()) {
        const prefix = b.headingCode ? `${b.headingCode}. ` : "";
        html += `<p><strong>${prefix}${b.title || val}</strong></p>`;
      } else if (b.type === "paragraph" && val.trim()) {
        html += `<p>${val.replace(/\n/g, "<br/>")}</p>`;
      } else if (b.type === "list" && b.items && b.items.length > 0) {
        if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
        const tag =
          b.listStyle === "number" || b.listStyle === "alpha" ? "ol" : "ul";
        const listItems = b.items
          .filter((i) => String(i || "").trim() !== "")
          .map((i) => `<li>${i}</li>`)
          .join("");
        if (listItems) html += `<${tag}>${listItems}</${tag}>`;
      } else if (b.type === "collapsible") {
        if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
        if (b.collapsibleMode === "text") {
          if (val.trim()) html += `<p>${val.replace(/\n/g, "<br/>")}</p>`;
        } else {
          (b.collapsibleItems || []).forEach((ci) => {
            html += `<p><strong>${ci.label}:</strong> ${ci.text}</p>`;
          });
        }
      } else if (b.type === "figure" || b.type === "procedure") {
        if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
        if (b.imageUrl && !b.imageUrl.startsWith("data:image")) {
          html += `<p><img src="${b.imageUrl}" alt="${
            b.title || "Ilustrasi"
          }" /></p>`;
        }
        if (b.procPurpose)
          html += `<p><strong>Tujuan:</strong> ${b.procPurpose}</p>`;
        if (b.procTools)
          html += `<p><strong>Alat & Petugas:</strong> ${b.procTools}</p>`;
        if (b.procMistakes)
          html += `<blockquote><strong>Kesalahan yang Dihindari:</strong> ${b.procMistakes}</blockquote>`;
      } else if (b.type === "table") {
        if (b.tableTitle?.trim())
          html += `<p><strong>${b.tableTitle}</strong></p>`;
        const firstVar = b.tableVariants?.[0];
        if (firstVar) {
          const ths = (firstVar.headers || [])
            .map((h) => `<th>${h}</th>`)
            .join("");
          const trs = (firstVar.rows || [])
            .map(
              (r) =>
                `<tr>${(r || []).map((c) => `<td>${c}</td>`).join("")}</tr>`
            )
            .join("");
          html += `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
        }
      } else if (b.type === "formula") {
        html += `<p><strong>${b.title || "Rumus Perhitungan"}:</strong> ${
          b.formulaMode === "fraction"
            ? `${b.formulaLeft || "IMT"} = (${b.formulaNumerator || ""}) / (${
                b.formulaDenominator || ""
              })`
            : b.formulaLinearExpr || ""
        }</p>`;
        if (b.formulaResult)
          html += `<p><strong>Hasil:</strong> ${b.formulaResult}</p>`;
      } else if (b.type === "callout") {
        html += `<blockquote><strong>${
          b.title || "Catatan"
        }:</strong> ${val}</blockquote>`;
      } else if (b.type === "video") {
        html += `<p><strong>${
          b.title || "Video Rujukan"
        }</strong>: ${val}</p>`;
      } else if (b.type === "quiz") {
        html += `<p><strong>Soal Formatif:</strong> ${b.question || ""}</p>`;
      } else if (b.type === "glossary") {
        html += `<p><strong>${b.title || "Glosarium"}</strong></p>`;
        (b.glossaryItems || []).forEach((gi) => {
          html += `<p><strong>${gi.term}:</strong> ${gi.definition}</p>`;
        });
      }
    });

    const lightweightBlocks = blocks.map((b) => {
      if (
        (b.type === "figure" || b.type === "procedure") &&
        b.imageUrl?.startsWith("data:image")
      ) {
        return { ...b, imageUrl: "" };
      }
      return b;
    });

    return html + encodeBlocksToMarker(lightweightBlocks);
  };

  const openAddForm = () => {
    setEditingId(null);
    setOriginalUnitName("");
    setUnitName("");
    setTriggerQuestion("");
    setMediaUrl("");
    setImageUrl("");
    setContentBlocks([
      createDefaultBlock("cp_tp"),
      {
        id: generateId(),
        type: "heading",
        headingLevel: "section",
        headingCode: "B",
        title: "Pengantar Materi Pembelajaran",
        value: "",
      },
      { id: generateId(), type: "paragraph", value: "" },
    ]);
    setPreviewStage("detail");
    setPreviewSectionFilter("all");
    setViewMode("form");
    triggerDynamicIsland(
      "Penyusun Materi Siap",
      "Lengkapi identitas unit, gambar sampul, dan susunan materi.",
      "info"
    );
  };

  const openEditForm = (mat: any) => {
    setEditingId(mat.id);
    setOriginalUnitName(mat.unit_name || "");
    setActiveGrade(Number(mat.grade_level) || 10);
    setUnitName(mat.unit_name || "");
    setTriggerQuestion(mat.trigger_question || "");
    setMediaUrl(mat.media_url || "");
    setImageUrl(mat.image_url || "");
    setContentBlocks(parseMaterialToBlocks(mat));
    setPreviewStage("detail");
    setPreviewSectionFilter("all");
    setViewMode("form");
  };

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    const toastId = toast.loading("Mengunggah gambar ke penyimpanan...");
    try {
      const cleanExt = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const filePath = `materi/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${cleanExt}`;
      const { error: uploadError } = await supabase.storage
        .from("edufit_media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        const compressedDataUrl = await compressImageToDataUrl(file);
        toast.success("Gambar berhasil diterapkan!", {
          id: toastId,
          duration: 3500,
        });
        return compressedDataUrl;
      }
      const { data } = supabase.storage
        .from("edufit_media")
        .getPublicUrl(filePath);
      toast.success("Gambar berhasil diunggah!", { id: toastId });
      return data.publicUrl;
    } catch {
      try {
        const compressedDataUrl = await compressImageToDataUrl(file);
        toast.success("Gambar berhasil dioptimalkan dan dipasang!", {
          id: toastId,
        });
        return compressedDataUrl;
      } catch {
        toast.error("Gagal memproses file gambar", { id: toastId });
        return null;
      }
    }
  };

  const handleHeroImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    const url = await uploadFileToSupabase(file);
    if (url) {
      setImageUrl(url);
      triggerDynamicIsland(
        "Sampul Unit Diperbarui",
        "Gambar sampul langsung tampil pada pratinjau aplikasi siswa.",
        "success"
      );
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
      triggerDynamicIsland(
        "Ilustrasi Materi Terpasang",
        "Gambar berhasil disesuaikan ke dalam bagian materi.",
        "success"
      );
    }
    setUploadingBlockId(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!unitName.trim()) {
      triggerDynamicIsland(
        "Judul Unit Wajib Diisi",
        "Masukkan nama unit pembelajaran terlebih dahulu.",
        "error"
      );
      return toast.error("Judul Unit Materi wajib diisi.");
    }
    if (!imageUrl.trim()) {
      triggerDynamicIsland(
        "Gambar Sampul Wajib Diisi",
        "Unggah gambar sampul agar kartu unit tampil selaras di aplikasi siswa.",
        "error"
      );
      return toast.error(
        "Gambar Sampul Unit wajib diisi sebelum menyimpan modul!"
      );
    }
    if (!triggerQuestion.trim()) {
      triggerDynamicIsland(
        "Pertanyaan Pemantik Wajib Diisi",
        "Diperlukan untuk penugasan refleksi siswa yang dinilai oleh Guru.",
        "error"
      );
      return toast.error("Pertanyaan Pemantik & Refleksi Siswa wajib diisi.");
    }

    setIsSubmitting(true);

    try {
      const sanitizedBlocks: ContentBlock[] = JSON.parse(
        JSON.stringify(
          contentBlocks.map((b) => ({
            ...b,
            id: b.id || generateId(),
            value: b.value ?? "",
          }))
        )
      );
      const compiledHtml = compileBlocksToHTML(sanitizedBlocks);
      const nowIso = new Date().toISOString();
      const currentOrder = editingId
        ? allMaterials.find((m) => m.id === editingId)?.order_index || 0
        : allMaterials.filter(
            (m) => Number(m.grade_level) === Number(activeGrade)
          ).length + 1;

      const fullPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: triggerQuestion.trim() || null,
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
        trigger_question: triggerQuestion.trim() || null,
        content_text: compiledHtml,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim(),
        order_index: currentOrder,
        updated_at: nowIso,
      };

      let savedRecord: any = null;

      if (editingId) {
        let { data, error } = await supabase
          .from("master_materials")
          .update(fullPayload)
          .eq("id", editingId)
          .select();
        if (error) {
          const retry = await supabase
            .from("master_materials")
            .update(legacyPayload)
            .eq("id", editingId)
            .select();
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
          if (!byName.error && byName.data && byName.data.length > 0)
            data = byName.data;
        }
        if (!data || data.length === 0) {
          const upsertAttempt = await supabase
            .from("master_materials")
            .upsert([{ id: editingId, ...fullPayload }], { onConflict: "id" })
            .select();
          if (upsertAttempt.error) throw new Error(upsertAttempt.error.message);
          data = upsertAttempt.data;
        }
        savedRecord = data[0];

        if (originalUnitName && originalUnitName.trim() !== unitName.trim()) {
          await supabase
            .from("student_reflections")
            .update({ unit_name: unitName.trim(), updated_at: nowIso })
            .eq("unit_name", originalUnitName.trim());
        }
      } else {
        let { data, error } = await supabase
          .from("master_materials")
          .insert([fullPayload])
          .select();
        if (error) {
          const retry = await supabase
            .from("master_materials")
            .insert([legacyPayload])
            .select();
          if (retry.error) throw retry.error;
          data = retry.data;
        }
        savedRecord = data[0];
      }

      if (savedRecord) {
        setAllMaterials((prev) => {
          const exists = prev.some((item) => item.id === savedRecord.id);
          if (exists)
            return prev.map((item) =>
              item.id === savedRecord.id ? savedRecord : item
            );
          return [...prev, savedRecord];
        });
      }

      toast.success("Modul materi pembelajaran berhasil disimpan!");
      triggerDynamicIsland(
        "Modul Materi Tersimpan",
        `${unitName.trim()} telah aktif di Aplikasi Siswa.`,
        "success"
      );
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
            const { error } = await supabase
              .from("master_materials")
              .delete()
              .eq("id", id);
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

  const addBlock = (type: BlockType) =>
    setContentBlocks((prev) => [...prev, createDefaultBlock(type)]);
  const updateBlock = (id: string, patch: Partial<ContentBlock>) =>
    setContentBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= contentBlocks.length) return;
    const copy = [...contentBlocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setContentBlocks(copy);
  };
  const duplicateBlock = (index: number) => {
    const cloned: ContentBlock = JSON.parse(
      JSON.stringify(contentBlocks[index])
    );
    cloned.id = generateId();
    const copy = [...contentBlocks];
    copy.splice(index + 1, 0, cloned);
    setContentBlocks(copy);
  };
  const removeBlock = (id: string) => {
    if (contentBlocks.length === 1)
      return toast.error("Modul minimal harus memiliki 1 bagian materi.");
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const totalBlocksActiveGrade = useMemo(
    () =>
      materials.reduce((acc, m) => acc + parseMaterialToBlocks(m).length, 0),
    [materials]
  );

  const reflectionStats = useMemo(() => {
    const valid = allReflections.filter(
      (r) =>
        String(r.unit_name || "").toLowerCase() !== "cp_tp_read" &&
        String(r.unit_name || "").toLowerCase() !== "akhir"
    );
    const graded = valid.filter(
      (r) => r.score !== null || (r.grade && String(r.grade).trim() !== "")
    ).length;
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
      if (r.score !== null || (r.grade && String(r.grade).trim() !== ""))
        map[uName].graded += 1;
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
    const textCombined = contentBlocks
      .map(
        (b) =>
          `${b.title || ""} ${b.value || ""} ${(b.items || []).join(" ")} ${(
            b.objectivesList || []
          ).join(" ")} ${b.procPurpose || ""} ${b.procTools || ""}`
      )
      .join(" ");
    const words = textCombined.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.ceil(words / 130));
  }, [contentBlocks]);

  const filteredPreviewBlocks = useMemo(() => {
    if (previewSectionFilter === "all") return contentBlocks;
    if (previewSectionFilter === "materi") {
      return contentBlocks.filter((b) =>
        [
          "cp_tp",
          "heading",
          "paragraph",
          "list",
          "collapsible",
          "callout",
          "glossary",
        ].includes(b.type)
      );
    }
    if (previewSectionFilter === "media") {
      return contentBlocks.filter((b) =>
        ["figure", "procedure", "table", "video"].includes(b.type)
      );
    }
    return contentBlocks.filter((b) =>
      ["formula", "tempo_simulator", "quiz"].includes(b.type)
    );
  }, [contentBlocks, previewSectionFilter]);

  const handleExportMateriCSV = () => {
    const rows = [
      [
        "Jenjang Kelas",
        "Judul Unit Materi",
        "Gambar Sampul",
        "Jumlah Bagian Materi",
        "Pertanyaan Pemantik",
        "Jawaban Refleksi Siswa",
      ],
      ...allMaterials.map((m) => {
        const bLen = parseMaterialToBlocks(m).length;
        const rStat = reflectionsByUnitMap[m.unit_name] || {
          total: 0,
          graded: 0,
        };
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
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Kurikulum_Materi_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Kurikulum Materi Diunduh",
      "Laporan CSV berhasil diekspor.",
      "success"
    );
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
              {islandAlert.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : islandAlert.type === "error" ? (
                <AlertCircle size={16} />
              ) : (
                <Bell size={16} />
              )}
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {islandAlert.message}
              </p>
              {islandAlert.subtitle && (
                <p className="text-[11px] font-medium text-white/70 truncate mt-0.5">
                  {islandAlert.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderYouTubeAttachmentPreview = (
    rawUrl: string,
    labelTitle: string,
    subText?: string,
    blockKey?: string
  ) => {
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
              onClick={() =>
                blockKey &&
                setPreviewVideoLoaded({ ...previewVideoLoaded, [blockKey]: true })
              }
              className="relative w-full h-40 bg-[#0c1713] overflow-hidden cursor-pointer group"
            >
              <img
                src={thumbUrl}
                alt={labelTitle}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-between p-3.5">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider bg-black/65 text-white border border-white/15">
                    VIDEO PEMBELAJARAN
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-[#ea580c] text-white">
                    PUTAR
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#ea580c] text-white flex items-center justify-center shadow-lg shrink-0">
                    <Play size={15} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {labelTitle}
                    </p>
                    <p className="text-[10px] text-white/80 truncate">
                      {subText || "Ketuk untuk memutar video di aplikasi siswa"}
                    </p>
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
                <p className="text-xs font-bold text-[#075985] truncate">
                  {labelTitle}
                </p>
                <p className="text-[10px] font-mono text-[#0284c7] truncate">
                  {rawUrl}
                </p>
              </div>
            </div>
            <a
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white text-[#075985] hover:opacity-80 shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // PRATINJAU APLIKASI SISWA (TERKUNCI STABIL & TIDAK IKUT TERGULUNG)
  // ==========================================================================
  const renderStudioLivePreview = () => {
    const viewportClass =
      previewViewport === 320
        ? "materi-viewport-320"
        : previewViewport === 375
        ? "materi-viewport-375"
        : previewViewport === 425
        ? "materi-viewport-425"
        : "materi-viewport-768";

    return (
      <div className="w-full h-full flex flex-col rounded-[2rem] overflow-hidden transition-all duration-300 edufit-card-primary">
        {/* HEADER PRATINJAU (TERKUNCI DI ATAS PANEL KANAN) */}
        <div className="px-5 py-3.5 flex flex-col gap-2.5 border-b border-hairline edufit-card-secondary shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-emerald-accent">
                PRATINJAU /
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Tampilan Aplikasi Siswa · Kelas {activeGrade}
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              <button
                type="button"
                onClick={() => setPreviewStage("overview")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  previewStage === "overview" ? "seg-btn-active" : "seg-btn-idle"
                }`}
              >
                1. Menu Materi
              </button>
              <button
                type="button"
                onClick={() => setPreviewStage("detail")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  previewStage === "detail" ? "seg-btn-active" : "seg-btn-idle"
                }`}
              >
                2. Isi Materi
              </button>
            </div>
          </div>

          {/* PILIHAN UKURAN LAYAR SISWA (BAHASA NATURAL TANPA PX TEKNIS) */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl edufit-surface-subtle">
            {(
              [
                { w: 320, label: "Layar Kecil", desc: "Ringkas" },
                { w: 375, label: "Layar Standar", desc: "Umum" },
                { w: 425, label: "Layar Lebar", desc: "Penuh" },
                { w: 768, label: "Mode Tablet", desc: "Lega" },
              ] as const
            ).map((bp) => {
              const active = previewViewport === bp.w;
              return (
                <button
                  key={bp.w}
                  type="button"
                  onClick={() => setPreviewViewport(bp.w)}
                  className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all ${
                    active ? "telemetry-bar-forest" : "seg-btn-idle"
                  }`}
                >
                  <div className="text-[10px] sm:text-[11px] font-bold leading-none truncate">
                    {bp.label}
                  </div>
                  <div className="text-[9px] opacity-75 mt-0.5 truncate">
                    {bp.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AREA LAYAR HP/TABLET (SCROLL MANDIRI DI DALAM LAYAR SIMULASI) */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto no-scrollbar materi-device-stage">
          <div className={`materi-device-viewport ${viewportClass}`}>
            {previewStage === "overview" ? (
              /* ==============================================================
                 LAYAR 1: MENU UTAMA MATERI SISWA
                 ============================================================== */
              <div className="max-h-[700px] overflow-y-auto no-scrollbar pb-8 bg-[#f3f6f4] text-[#14120e]">
                <div
                  className={`relative w-full overflow-hidden bg-[#13211c] ${
                    isTablet768 ? "h-68" : isCompact320 ? "h-52" : "h-60"
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Sampul Kurikulum"
                      className="w-full h-full object-cover opacity-85"
                    />
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
                          <p className="text-[10px] font-medium text-white/80 leading-none truncate">
                            Kurikulum PJOK Kelas {activeGrade}
                          </p>
                          <p className="text-xs sm:text-sm font-extrabold text-white leading-tight mt-0.5 truncate">
                            Siswa EduFit
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white text-[#14120e] flex items-center justify-center shadow-md shrink-0">
                        <Bell size={14} />
                      </div>
                    </div>
                    <div className="pb-6">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-widest bg-[#1f7a5c] text-white">
                        KURIKULUM KELAS {activeGrade}
                      </span>
                      <h2
                        className={`font-extrabold text-white tracking-tight mt-1.5 leading-snug line-clamp-2 ${
                          isCompact320
                            ? "text-base"
                            : isTablet768
                            ? "text-2xl"
                            : "text-lg"
                        }`}
                      >
                        {unitName || "Eksplorasi Modul & Pengukuran Kebugaran"}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* 2 KARTU STATUS MENGAMBANG */}
                <div
                  className={`grid grid-cols-2 -mt-7 relative z-10 ${
                    isCompact320 ? "gap-2 px-2.5" : "gap-3 px-4"
                  }`}
                >
                  <div
                    className={`rounded-2xl bg-[#e6f5ed] border border-[#a7f3d0] shadow-sm flex items-center ${
                      isCompact320 ? "p-2.5 gap-2" : "p-3.5 gap-3"
                    }`}
                  >
                    <div
                      className={`rounded-xl bg-[#1f7a5c] text-white flex items-center justify-center shrink-0 ${
                        isCompact320 ? "w-7 h-7" : "w-9 h-9"
                      }`}
                    >
                      <CheckCircle2 size={isCompact320 ? 14 : 16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-[#52635b] truncate">
                        Status Materi
                      </p>
                      <p
                        className={`font-extrabold text-[#14120e] truncate ${
                          isCompact320 ? "text-[11px]" : "text-xs"
                        }`}
                      >
                        {materials.length || 1} Unit Aktif
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl bg-[#fef9c3] border border-[#fde047] shadow-sm flex items-center ${
                      isCompact320 ? "p-2.5 gap-2" : "p-3.5 gap-3"
                    }`}
                  >
                    <div
                      className={`rounded-xl bg-[#d99b26] text-white flex items-center justify-center shrink-0 ${
                        isCompact320 ? "w-7 h-7" : "w-9 h-9"
                      }`}
                    >
                      <Activity size={isCompact320 ? 14 : 16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-[#78350f] truncate">
                        Bagian Materi
                      </p>
                      <p
                        className={`font-extrabold text-[#14120e] truncate ${
                          isCompact320 ? "text-[11px]" : "text-xs"
                        }`}
                      >
                        {contentBlocks.length} Bagian
                      </p>
                    </div>
                  </div>
                </div>

                {/* AKSES CEPAT PEMBELAJARAN */}
                <div className={`${isCompact320 ? "px-2.5" : "px-4"} mt-5`}>
                  <h3 className="text-xs font-extrabold tracking-tight text-[#14120e] mb-2">
                    Akses Cepat Pembelajaran
                  </h3>
                  <div className="rounded-2xl bg-white border border-[#12201a]/10 p-2.5 space-y-2 shadow-sm">
                    <div
                      onClick={() => setPreviewStage("detail")}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[#f3f6f4] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#e6f5ed] border border-[#a7f3d0] text-[#1f7a5c] flex items-center justify-center shrink-0">
                          <BookOpen size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#14120e] truncate">
                            {unitName || "Unit Sedang Disusun"}
                          </p>
                          <p className="text-[10px] text-[#52635b] truncate">
                            Buka rincian materi, rumus & refleksi
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-[9px] font-bold font-mono bg-[#fef3c7] text-[#78350f] border border-[#fde047] shrink-0">
                        {contentBlocks.length} Bagian
                      </span>
                    </div>

                    <div className="h-px bg-[#12201a]/5" />

                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#e0f2fe] border border-[#7dd3fc] text-[#0284c7] flex items-center justify-center shrink-0">
                          <Video size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#14120e] truncate">
                            Katalog Video & Praktik
                          </p>
                          <p className="text-[10px] text-[#52635b] truncate">
                            Panduan gerakan & jurnal latihan mandiri
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-[9px] font-bold font-mono bg-[#e0f2fe] text-[#075985] border border-[#7dd3fc] shrink-0">
                        Praktik
                      </span>
                    </div>
                  </div>
                </div>

                {/* PILIH UNIT MATERI (GAMBAR FORMAT 4:3 LANDSCAPE) */}
                <div className={`${isCompact320 ? "px-2.5" : "px-4"} mt-5`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-extrabold tracking-tight text-[#14120e]">
                      Pilih Unit Materi
                    </h3>
                    <span className="text-[10px] font-bold font-mono text-[#1f7a5c]">
                      KELAS {activeGrade}
                    </span>
                  </div>
                  <div
                    className={`grid gap-2.5 ${
                      isTablet768 ? "grid-cols-3" : "grid-cols-2"
                    }`}
                  >
                    <div
                      onClick={() => setPreviewStage("detail")}
                      className="rounded-2xl overflow-hidden bg-white border-2 border-[#1f7a5c] shadow-md cursor-pointer group"
                    >
                      <div className="relative aspect-[4/3] w-full bg-[#13211c] overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={unitName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-300 bg-rose-950/60 p-2 text-center">
                            Sampul Wajib Diunggah
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-white/95 text-[#14120e] shadow">
                          {contentBlocks.length} Bagian
                        </span>
                      </div>
                      <div className="p-2.5">
                        <span className="text-[9px] font-bold font-mono uppercase text-[#1f7a5c]">
                          SEDANG DISUSUN
                        </span>
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
                              <img
                                src={m.image_url}
                                alt={m.unit_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30">
                                <BookOpen size={22} />
                              </div>
                            )}
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-white/95 text-[#14120e] shadow">
                              Unit 0{idx + 2}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <span className="text-[9px] font-bold font-mono uppercase text-[#52635b]">
                              TERSEDIA
                            </span>
                            <p className="text-xs font-extrabold text-[#14120e] line-clamp-2 mt-0.5 leading-snug">
                              {m.unit_name}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ==============================================================
                 LAYAR 2: DETAIL ISI MATERI SISWA
                 ============================================================== */
              <div className="max-h-[700px] overflow-y-auto no-scrollbar pb-8 bg-[#f3f6f4] text-[#14120e]">
                <div
                  className={`relative w-full overflow-hidden bg-[#13211c] ${
                    isTablet768 ? "h-68" : isCompact320 ? "h-52" : "h-60"
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Sampul"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-950 via-[#13211c] to-[#0c1713] flex flex-col items-center justify-center p-6 text-center">
                      <AlertCircle size={26} className="text-rose-400 mb-1.5" />
                      <p className="text-xs font-bold text-white">
                        Gambar Sampul Unit Wajib Diisi
                      </p>
                      <p className="text-[10px] text-white/70 mt-0.5">
                        Unggah gambar di panel kiri agar tampil di bagian ini
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/65 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewStage("overview")}
                        className="w-9 h-9 rounded-full bg-white text-[#14120e] flex items-center justify-center shadow-md cursor-pointer shrink-0"
                        title="Kembali ke Menu Materi"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-xs font-extrabold text-white drop-shadow truncate">
                        {unitName || "Detail Unit Materi"}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                        K{activeGrade}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KARTU RINGKASAN MENGAMBANG */}
                <div
                  className={`${
                    isCompact320 ? "px-2.5" : "px-4"
                  } -mt-12 relative z-10`}
                >
                  <div
                    className={`rounded-3xl materi-floating-card space-y-3 ${
                      isCompact320 ? "p-3.5" : "p-5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-[#fef3c7] border border-[#fde047] text-[#d97706] flex items-center justify-center shrink-0">
                          <Award size={12} />
                        </span>
                        <span className="text-[11px] font-extrabold text-[#14120e] truncate">
                          Modul Kelas {activeGrade}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#ea580c] underline shrink-0">
                        ~{estimatedReadMinutes} mnt baca &gt;
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span
                          className={`font-extrabold font-mono tracking-tight text-[#14120e] ${
                            isCompact320 ? "text-xl" : "text-2xl"
                          }`}
                        >
                          {contentBlocks.length}
                        </span>
                        <span className="text-[11px] font-bold text-[#52635b] ml-1">
                          bagian materi
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#52635b] truncate">
                        Target: <strong className="text-[#14120e]">Refleksi Tuntas</strong>
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#ebf0ed] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ea580c] transition-all duration-500"
                        style={{ width: "82%" }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setPreviewStage("overview")}
                        className="py-2 px-2.5 rounded-full border border-[#12201a]/15 bg-white text-[#14120e] text-[10px] sm:text-[11px] font-extrabold cursor-pointer hover:bg-[#f3f6f4] truncate"
                      >
                        Semua Unit
                      </button>
                      <button
                        type="button"
                        className="py-2 px-2.5 rounded-full bg-[#ea580c] text-white text-[10px] sm:text-[11px] font-extrabold shadow-sm cursor-pointer truncate"
                      >
                        Isi Refleksi
                      </button>
                    </div>
                  </div>
                </div>

                {/* TAB KATEGORI MATERI */}
                <div className={`${isCompact320 ? "px-2.5" : "px-4"} mt-4`}>
                  <h3 className="text-sm font-extrabold tracking-tight text-[#14120e] mb-2 line-clamp-2">
                    {unitName || "Susunan Materi Pembelajaran"}
                  </h3>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { k: "all", l: `Semua (${contentBlocks.length})` },
                      { k: "materi", l: "Konsep & Tujuan" },
                      { k: "media", l: "Prosedur & Tabel" },
                      { k: "interaktif", l: "Rumus & Latihan" },
                    ].map((tab) => {
                      const active = previewSectionFilter === tab.k;
                      return (
                        <button
                          key={tab.k}
                          type="button"
                          onClick={() => setPreviewSectionFilter(tab.k as any)}
                          className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                            active ? "materi-pill-orange-active" : "materi-pill-idle"
                          }`}
                        >
                          {tab.l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ISI KONTEN UNIT */}
                <div
                  className={`${
                    isCompact320 ? "px-2.5" : "px-4"
                  } mt-3.5 space-y-3.5`}
                >
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

                  <div
                    className={`rounded-3xl bg-white border border-[#12201a]/10 shadow-sm space-y-5 ${
                      isCompact320 ? "p-3.5" : "p-5"
                    }`}
                  >
                    {filteredPreviewBlocks.map((b, idx) => (
                      <div
                        key={b.id}
                        className={
                          idx > 0 &&
                          (b.type === "heading" ||
                            b.type === "cp_tp" ||
                            b.type === "glossary")
                            ? "pt-4 border-t border-[#12201a]/10"
                            : ""
                        }
                      >
                        {b.type === "cp_tp" && (
                          <div className="rounded-2xl p-4 space-y-3 materi-block-cptp">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono bg-[#1f7a5c] text-white">
                                {b.headingCode || "A"}
                              </span>
                              <h3 className="font-extrabold text-sm text-[#065f46]">
                                {b.title || "Identitas dan Tujuan Pembelajaran"}
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-xs">
                              {b.cpMain && (
                                <div className="p-2.5 rounded-xl bg-white/90 border border-[#a7f3d0]">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f7a5c] block">
                                    Elemen CP Utama
                                  </span>
                                  <p className="font-bold text-[#14120e] mt-0.5">
                                    {b.cpMain}
                                  </p>
                                </div>
                              )}
                              {b.cpSupport && (
                                <div className="p-2.5 rounded-xl bg-white/90 border border-[#a7f3d0]">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f7a5c] block">
                                    Elemen Pendukung
                                  </span>
                                  <p className="font-semibold text-[#14120e] mt-0.5">
                                    {b.cpSupport}
                                  </p>
                                </div>
                              )}
                              {b.learningFocus && (
                                <div className="p-2.5 rounded-xl bg-white/90 border border-[#a7f3d0]">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f7a5c] block">
                                    Fokus Pembelajaran
                                  </span>
                                  <p className="text-[#44403c] leading-relaxed mt-0.5">
                                    {b.learningFocus}
                                  </p>
                                </div>
                              )}
                            </div>

                            {(b.objectivesList || []).some((o) =>
                              String(o || "").trim()
                            ) && (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-[11px] font-extrabold text-[#065f46]">
                                  Tujuan Pembelajaran:
                                </p>
                                {(b.objectivesList || []).map((obj, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className="flex items-start gap-2 text-xs text-[#14120e]"
                                  >
                                    <span className="w-5 h-5 rounded-md bg-[#13211c] text-[#facc15] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {oIdx + 1}
                                    </span>
                                    <span className="leading-relaxed">
                                      {obj || "Tujuan pembelajaran..."}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {b.operationalNote && (
                              <p className="text-[10px] italic text-[#52635b] pt-1 border-t border-[#a7f3d0]">
                                {b.operationalNote}
                              </p>
                            )}
                          </div>
                        )}

                        {b.type === "heading" && (
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`font-extrabold font-mono px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                                b.headingLevel === "sub"
                                  ? "bg-[#fef3c7] text-[#78350f] text-[10px]"
                                  : b.headingLevel === "point"
                                  ? "bg-[#e0f2fe] text-[#075985] text-[10px]"
                                  : "bg-[#13211c] text-[#facc15] text-[11px]"
                              }`}
                            >
                              {b.headingCode || `0${idx + 1}`}
                            </span>
                            <h3
                              className={`font-extrabold tracking-tight text-[#14120e] leading-snug ${
                                b.headingLevel === "sub"
                                  ? "text-sm"
                                  : b.headingLevel === "point"
                                  ? "text-xs"
                                  : "text-base"
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
                            {b.title && (
                              <p className="text-xs sm:text-sm font-bold text-[#14120e]">
                                {b.title}
                              </p>
                            )}
                            <div className="space-y-2 pl-0.5">
                              {(b.items || []).map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-[#14120e]"
                                >
                                  <span className="w-5 h-5 rounded-md text-[10px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 bg-[#13211c] text-[#facc15]">
                                    {b.listStyle === "number"
                                      ? `${i + 1}`
                                      : b.listStyle === "alpha"
                                      ? `${String.fromCharCode(97 + i)}`
                                      : "-"}
                                  </span>
                                  <span className="leading-relaxed">
                                    {item || "Butir penjelasan..."}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {b.type === "collapsible" && (
                          <details
                            open
                            className="rounded-2xl p-3.5 group bg-[#e6f5ed] border border-[#a7f3d0]"
                          >
                            <summary className="font-bold text-xs sm:text-sm cursor-pointer list-none flex items-center justify-between gap-2 text-[#065f46]">
                              <span>{b.title || "Panduan Rincian"}</span>
                              <ChevronDown size={15} className="shrink-0" />
                            </summary>
                            <div className="mt-3 pt-3 border-t border-[#a7f3d0] space-y-2 text-xs">
                              {b.collapsibleMode === "text" ? (
                                <p className="leading-relaxed whitespace-pre-line text-[#14120e]">
                                  {b.value || "Isi penjelasan..."}
                                </p>
                              ) : (
                                (b.collapsibleItems || []).map((ci, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-2.5 rounded-xl bg-white shadow-sm border border-[#a7f3d0]"
                                  >
                                    <span className="font-bold block text-xs text-[#14120e]">
                                      {ci.label}
                                    </span>
                                    <span className="text-xs leading-relaxed text-[#52635b] mt-0.5 block">
                                      {ci.text}
                                    </span>
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
                            if (theme === "blue")
                              bgClass = "bg-[#e0f2fe] border-[#7dd3fc]";
                            if (theme === "neutral")
                              bgClass = "bg-[#f3f6f4] border-[#cbd5d0]";
                            return (
                              <div className="space-y-1.5">
                                <div
                                  className={`rounded-2xl p-3.5 space-y-2 border ${bgClass}`}
                                >
                                  {b.overline && (
                                    <span className="text-[10px] font-bold font-mono uppercase tracking-widest block text-[#52635b]">
                                      {b.overline}
                                    </span>
                                  )}
                                  {b.title && (
                                    <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e]">
                                      {b.title}
                                    </h4>
                                  )}
                                  {b.imageUrl ? (
                                    <div
                                      onClick={() =>
                                        setZoomedImageUrl(b.imageUrl || null)
                                      }
                                      className="relative group cursor-zoom-in rounded-xl overflow-hidden bg-white/80 p-1"
                                    >
                                      <img
                                        src={b.imageUrl}
                                        alt={b.title || "Ilustrasi"}
                                        className="w-full rounded-lg object-contain max-h-64 mx-auto"
                                      />
                                      <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-[9px] font-bold flex items-center gap-1">
                                        <Maximize2 size={10} /> Perbesar Gambar
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="py-8 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                                      Gambar ilustrasi tampil di sini
                                    </div>
                                  )}
                                </div>
                                {b.caption && (
                                  <p className="text-[10px] italic leading-relaxed px-1 text-[#52635b]">
                                    {b.caption}
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                        {b.type === "procedure" && (
                          <div className="rounded-2xl p-4 space-y-3 bg-[#f3f6f4] border border-[#12201a]/15">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono bg-[#13211c] text-[#facc15] shrink-0">
                                {b.procCode || "PROSEDUR"}
                              </span>
                              <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e] truncate">
                                {b.title || "Prosedur Pelaksanaan Tes"}
                              </h4>
                            </div>

                            {b.imageUrl && (
                              <div
                                onClick={() =>
                                  setZoomedImageUrl(b.imageUrl || null)
                                }
                                className="relative cursor-zoom-in rounded-xl overflow-hidden bg-white border border-[#12201a]/10 p-1.5"
                              >
                                <img
                                  src={b.imageUrl}
                                  alt={b.title || "Poster Prosedur"}
                                  className="w-full max-h-64 object-contain rounded-lg mx-auto"
                                />
                                <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/75 text-white text-[9px] font-bold flex items-center gap-1">
                                  <Maximize2 size={10} /> Perbesar Infografis
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-2 text-xs">
                              {b.procPurpose && (
                                <div className="p-2.5 rounded-xl bg-white border border-[#12201a]/10">
                                  <span className="text-[10px] font-extrabold uppercase text-[#1f7a5c] block">
                                    a. Tujuan Pengukuran
                                  </span>
                                  <p className="text-[#14120e] mt-0.5 leading-relaxed">
                                    {b.procPurpose}
                                  </p>
                                </div>
                              )}
                              {b.procTools && (
                                <div className="p-2.5 rounded-xl bg-white border border-[#12201a]/10">
                                  <span className="text-[10px] font-extrabold uppercase text-[#0284c7] block">
                                    b. Alat & Petugas
                                  </span>
                                  <p className="text-[#14120e] mt-0.5 leading-relaxed">
                                    {b.procTools}
                                  </p>
                                </div>
                              )}
                            </div>

                            {(b.procSteps || []).some((s) =>
                              String(s.text || "").trim()
                            ) && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-[#52635b] block">
                                  Tahapan Pelaksanaan:
                                </span>
                                {(b.procSteps || []).map((st, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 rounded-xl bg-white border border-[#12201a]/10 text-xs"
                                  >
                                    <span className="font-extrabold text-[#14120e] block">
                                      {st.label}
                                    </span>
                                    <span className="text-[#44403c] leading-relaxed mt-0.5 block">
                                      {st.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {b.procMistakes && (
                              <div className="p-3 rounded-xl materi-procedure-invalid-box text-xs space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                                  Kesalahan yang Perlu Dihindari:
                                </span>
                                <p className="leading-relaxed font-medium">
                                  {b.procMistakes}
                                </p>
                              </div>
                            )}

                            {b.procHighlightNote && (
                              <div className="p-2.5 rounded-xl bg-[#fef3c7] border border-[#fde047] text-[#78350f] text-[11px] font-semibold">
                                <strong>Catatan Penting:</strong> {b.procHighlightNote}
                              </div>
                            )}

                            {b.caption && (
                              <p className="text-[10px] italic text-[#52635b]">
                                {b.caption}
                              </p>
                            )}
                          </div>
                        )}

                        {b.type === "table" && (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {b.tableTitle && (
                                <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e]">
                                  {b.tableTitle}
                                </h4>
                              )}
                              {b.hasCategoryFilter &&
                                (b.tableVariants?.length || 0) > 1 && (
                                  <div className="flex items-center gap-1">
                                    {b.tableVariants?.map((v, vIdx) => {
                                      const active =
                                        (previewSelectedVariant[b.id] || 0) ===
                                        vIdx;
                                      return (
                                        <button
                                          key={v.id}
                                          type="button"
                                          onClick={() =>
                                            setPreviewSelectedVariant({
                                              ...previewSelectedVariant,
                                              [b.id]: vIdx,
                                            })
                                          }
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                                            active
                                              ? "bg-[#ea580c] text-white shadow-sm"
                                              : "bg-[#f3f6f4] text-[#52635b]"
                                          }`}
                                        >
                                          {v.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>
                            {b.tableDescription && (
                              <p className="text-xs leading-relaxed text-[#52635b]">
                                {b.tableDescription}
                              </p>
                            )}
                            {(() => {
                              const activeVar =
                                b.tableVariants?.[
                                  previewSelectedVariant[b.id] || 0
                                ] || b.tableVariants?.[0];
                              if (!activeVar) return null;
                              return (
                                <div className="rounded-xl border border-[#12201a]/15 overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                                      <thead>
                                        <tr className="bg-[#ebf0ed]">
                                          {activeVar.headers.map((h, hIdx) => (
                                            <th
                                              key={hIdx}
                                              className="p-2.5 font-extrabold border-b border-[#12201a]/10 text-[#14120e] whitespace-nowrap"
                                            >
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {activeVar.rows.map((r, rIdx) => (
                                          <tr
                                            key={rIdx}
                                            className="border-b border-[#12201a]/5 last:border-b-0 bg-white"
                                          >
                                            {r.map((c, cIdx) => (
                                              <td
                                                key={cIdx}
                                                className={`p-2.5 align-top leading-relaxed text-[#14120e] ${
                                                  cIdx === 0 ? "font-extrabold" : ""
                                                }`}
                                              >
                                                {c}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  {(activeVar.summaryText ||
                                    activeVar.summaryBadge) && (
                                    <div className="p-3 materi-table-summary-bar flex flex-wrap items-center justify-between gap-2 text-xs">
                                      <span className="font-mono font-bold text-white">
                                        {activeVar.summaryText}
                                      </span>
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
                            {b.tableFootnote && (
                              <p className="text-[10px] text-[#52635b] leading-relaxed">
                                {b.tableFootnote}
                              </p>
                            )}
                          </div>
                        )}

                        {b.type === "formula" && (
                          <div className="rounded-2xl p-4 space-y-3 materi-block-formula">
                            <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-[#1f7a5c] block">
                              RUMUS & SIMULASI PERHITUNGAN
                            </span>
                            {b.title && (
                              <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e]">
                                {b.title}
                              </h4>
                            )}

                            <div className="p-3.5 rounded-xl bg-white border border-[#12201a]/10 flex items-center justify-center text-center overflow-x-auto">
                              {b.formulaMode === "linear" ? (
                                <span className="font-mono font-extrabold text-xs sm:text-sm text-[#14120e]">
                                  {b.formulaLinearExpr ||
                                    "Tinggi Loncatan = Raihan Tertinggi − Raihan Awal"}
                                </span>
                              ) : (
                                <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-[#14120e]">
                                  <span className="font-extrabold">
                                    {b.formulaLeft || "IMT"} =
                                  </span>
                                  <div className="materi-formula-fraction">
                                    <span className="materi-formula-numerator">
                                      {b.formulaNumerator || "Berat Badan (kg)"}
                                    </span>
                                    <span className="materi-formula-denominator">
                                      {b.formulaDenominator ||
                                        "Tinggi Badan (m) × Tinggi Badan (m)"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {b.formulaNote && (
                              <p className="text-[11px] text-[#52635b] leading-relaxed">
                                {b.formulaNote}
                              </p>
                            )}

                            {b.formulaCaseTitle && (
                              <div className="pt-1 space-y-2">
                                <p className="text-xs font-extrabold text-[#14120e]">
                                  {b.formulaCaseTitle}
                                </p>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {(b.formulaSteps || []).map((st, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="p-2.5 rounded-xl bg-white border border-[#12201a]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                                    >
                                      <span className="font-bold text-[#52635b]">
                                        {st.label}
                                      </span>
                                      <span className="font-mono font-extrabold text-[#14120e]">
                                        {st.expression}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(b.formulaResult || b.formulaCategoryBadge) && (
                              <div className="p-3 rounded-xl bg-[#13211c] text-white flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-mono font-extrabold text-[#facc15]">
                                  {b.formulaResult}
                                </span>
                                {b.formulaCategoryBadge && (
                                  <span className="px-2.5 py-0.5 rounded-md bg-[#1f7a5c] text-white font-mono text-[10px] font-bold">
                                    {b.formulaCategoryBadge}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {b.type === "tempo_simulator" && (
                          <div className="rounded-2xl p-4 space-y-3 bg-[#f3f6f4] border border-[#12201a]/10">
                            <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e]">
                              {b.simulatorTitle ||
                                "Simulasi Pola Tempo & Intensitas"}
                            </h4>
                            {(() => {
                              const methods = b.tempoMethods || [];
                              const mIdx = previewTempoTab[b.id] || 0;
                              const currentMethod = methods[mIdx] || methods[0];
                              const sIdx = previewTempoStep[b.id] || 0;
                              if (!currentMethod) return null;
                              const currentStep =
                                currentMethod.steps[sIdx] ||
                                currentMethod.steps[0];
                              return (
                                <>
                                  <div className="flex flex-wrap gap-1.5">
                                    {methods.map((m, idx) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                          setPreviewTempoTab({
                                            ...previewTempoTab,
                                            [b.id]: idx,
                                          });
                                          setPreviewTempoStep({
                                            ...previewTempoStep,
                                            [b.id]: 0,
                                          });
                                        }}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                          idx === mIdx
                                            ? "bg-[#13211c] text-white shadow-sm"
                                            : "bg-white border border-[#12201a]/10 text-[#14120e]"
                                        }`}
                                      >
                                        {m.name}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="p-3.5 rounded-xl bg-white border border-[#12201a]/10">
                                    <div
                                      className="grid gap-2 items-end h-24 pt-2"
                                      style={{
                                        gridTemplateColumns: `repeat(${Math.max(
                                          1,
                                          currentMethod.steps.length
                                        )}, minmax(0, 1fr))`,
                                      }}
                                    >
                                      {currentMethod.steps.map((st, stepI) => {
                                        const isCurrent = stepI === sIdx;
                                        const heightPct =
                                          st.level === 3
                                            ? 100
                                            : st.level === 2
                                            ? 62
                                            : 32;
                                        return (
                                          <button
                                            key={stepI}
                                            type="button"
                                            onClick={() =>
                                              setPreviewTempoStep({
                                                ...previewTempoStep,
                                                [b.id]: stepI,
                                              })
                                            }
                                            className="flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer"
                                          >
                                            <div className="w-full max-w-[32px] flex-1 rounded-lg flex items-end p-0.5 bg-[#ebf0ed]">
                                              <div
                                                className={`w-full rounded-md transition-all duration-300 ${
                                                  isCurrent
                                                    ? "bg-[#ea580c]"
                                                    : "bg-[#1f7a5c]"
                                                }`}
                                                style={{
                                                  height: `${heightPct}%`,
                                                }}
                                              />
                                            </div>
                                            <span className="text-[9px] font-bold text-center leading-tight truncate w-full">
                                              {st.label}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-3 pt-2.5 border-t border-[#12201a]/10 flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-bold text-[#14120e]">
                                        Tahap {sIdx + 1}:{" "}
                                        <span className="underline">
                                          {currentStep?.label || "-"}
                                        </span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewTempoStep({
                                            ...previewTempoStep,
                                            [b.id]:
                                              (sIdx + 1) %
                                              Math.max(
                                                1,
                                                currentMethod.steps.length
                                              ),
                                          })
                                        }
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer bg-[#ea580c] text-white"
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
                              <h4 className="font-extrabold text-xs sm:text-sm text-[#075985]">
                                {b.title || "Video Rujukan Pembelajaran"}
                              </h4>
                              {b.value && (
                                <p className="text-xs leading-relaxed text-[#075985]/90 mt-0.5">
                                  {b.value}
                                </p>
                              )}
                            </div>
                            {b.videoUrl ? (
                              renderYouTubeAttachmentPreview(
                                b.videoUrl,
                                b.title || "Video Demonstrasi",
                                b.videoButtonLabel || "Putar Video di Aplikasi",
                                b.id
                              )
                            ) : (
                              <div className="p-3 rounded-xl bg-white/70 text-[11px] text-[#075985] font-medium">
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
                              <div
                                className={`p-3.5 rounded-2xl border ${bg} ${border} space-y-1`}
                              >
                                <h4 className={`font-extrabold text-xs ${textH}`}>
                                  {b.title || "Catatan Penting"}
                                </h4>
                                <p className="text-xs leading-relaxed text-[#14120e]">
                                  {b.value}
                                </p>
                              </div>
                            );
                          })()}

                        {b.type === "quiz" && (
                          <div className="p-4 rounded-2xl space-y-3 bg-[#f3f6f4] border border-[#12201a]/10">
                            <h4 className="font-extrabold text-[10px] uppercase text-[#1f7a5c] tracking-wider">
                              {b.title || "Soal Formatif Cek Pemahaman"}
                            </h4>
                            <p className="text-xs font-bold text-[#14120e] leading-relaxed">
                              {b.question || "Pertanyaan latihan..."}
                            </p>
                            <div className="space-y-1.5">
                              {(b.options || []).map((opt) => {
                                const chosen =
                                  previewQuizSelected[b.id] === opt.key;
                                const isCorrect = opt.key === b.correctOption;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() =>
                                      setPreviewQuizSelected({
                                        ...previewQuizSelected,
                                        [b.id]: opt.key,
                                      })
                                    }
                                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                                      chosen
                                        ? isCorrect
                                          ? "bg-[#dcfce7] border-[#86efac] text-[#065f46] font-bold"
                                          : "bg-[#ffe4e6] border-[#fda4af] text-[#9f1239] font-bold"
                                        : "bg-white border-[#12201a]/10 text-[#14120e]"
                                    }`}
                                  >
                                    <strong className="font-mono">
                                      {opt.key}.
                                    </strong>{" "}
                                    {opt.text || `Pilihan ${opt.key}`}
                                  </button>
                                );
                              })}
                            </div>
                            {previewQuizSelected[b.id] && b.explanation && (
                              <div className="p-3 rounded-xl text-xs bg-[#dcfce7] border border-[#86efac] text-[#065f46]">
                                <strong>Kunci ({b.correctOption}):</strong>{" "}
                                {b.explanation}
                              </div>
                            )}
                          </div>
                        )}

                        {b.type === "glossary" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-[#13211c] text-[#facc15] font-mono text-[10px] font-extrabold">
                                  {b.headingCode || "L"}
                                </span>
                                <h4 className="font-extrabold text-xs sm:text-sm text-[#14120e]">
                                  {b.title || "Glosarium Unit"}
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-[#52635b]">
                                {(b.glossaryItems || []).length} Istilah
                              </span>
                            </div>

                            <div className="relative">
                              <Search
                                size={13}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52635b]"
                              />
                              <input
                                type="text"
                                value={glossarySearch[b.id] || ""}
                                onChange={(e) =>
                                  setGlossarySearch({
                                    ...glossarySearch,
                                    [b.id]: e.target.value,
                                  })
                                }
                                placeholder="Cari istilah di glosarium..."
                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#f3f6f4] border border-[#12201a]/10 text-xs outline-none"
                              />
                            </div>

                            <div
                              className={`grid gap-2 ${
                                isTablet768 ? "grid-cols-2" : "grid-cols-1"
                              }`}
                            >
                              {(b.glossaryItems || [])
                                .filter((gi) => {
                                  const q = (
                                    glossarySearch[b.id] || ""
                                  ).toLowerCase();
                                  if (!q) return true;
                                  return (
                                    gi.term.toLowerCase().includes(q) ||
                                    gi.definition.toLowerCase().includes(q)
                                  );
                                })
                                .map((gi, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="p-3 rounded-xl materi-block-glossary-card space-y-0.5"
                                  >
                                    <span className="text-xs font-extrabold text-[#1f7a5c] block">
                                      {gi.term || "Istilah"}
                                    </span>
                                    <p className="text-[11px] text-[#44403c] leading-relaxed">
                                      {gi.definition || "Pengertian istilah..."}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* KOTAK REFLEKSI PEMAHAMAN SISWA */}
                  <div className="p-4 sm:p-5 rounded-3xl space-y-2.5 bg-[#13211c] text-white shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#facc15]">
                        REFLEKSI PEMAHAMAN SISWA (DINILAI GURU)
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed">
                      {triggerQuestion ||
                        "Pertanyaan pemantik refleksi akan tampil di sini untuk dijawab siswa..."}
                    </p>
                    <div className="p-3 rounded-2xl text-[11px] bg-white/10 border border-white/20 text-white/70">
                      Ketik analisis dan refleksi pemahaman Anda di sini...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL PERBESAR POSTER / GAMBAR */}
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
                <img
                  src={zoomedImageUrl}
                  alt="Perbesar Gambar"
                  className="w-full max-h-[82vh] object-contain rounded-2xl bg-white p-2"
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (viewMode === "form") {
    return (
      <div className="edufit-admin-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
        {renderDynamicIsland()}

        {/* HEADER ATAS PENYUSUN MATERI */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pb-6 mb-6 border-b border-hairline relative z-20">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
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
                  { key: "split", icon: Columns, label: "Penyusun & Pratinjau" },
                  { key: "preview", icon: Eye, label: "Pratinjau Penuh" },
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

              <button
                type="button"
                onClick={applyStandardTemplate}
                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer edufit-surface-subtle hover:opacity-85"
                title="Gunakan kerangka standar bagian A sampai Glosarium"
              >
                <FileText size={13} /> Susun Kerangka Standar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-1.5 opacity-60">
              <span className="font-mono text-emerald-accent">
                STUDIO PENYUSUN MATERI
              </span>
              <span>—</span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <BookOpen size={14} /> KURIKULUM KELAS {activeGrade}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-light tracking-tighter leading-tight">
              {editingId ? "Edit" : "Susun"}{" "}
              <span className="font-semibold">
                {unitName || "Modul Pembelajaran"}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-end gap-8 shrink-0">
            <div>
              <div className="text-4xl md:text-5xl font-light font-mono tracking-tighter leading-none">
                {contentBlocks.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-55 mt-1.5">
                Bagian Materi
              </div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
                ~{estimatedReadMinutes}m
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-55 mt-1.5">
                Estimasi Baca
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

        {/* AREA KERJA UTAMA: PANEL KIRI & KANAN MEMILIKI SCROLL MANDIRI AGAR PRATINJAU STAY 100% */}
        <div
          className={`grid gap-6 items-start ${
            workspaceLayout === "split"
              ? "grid-cols-1 xl:grid-cols-12 xl:h-[calc(100vh-2.5rem)] xl:overflow-hidden"
              : "grid-cols-1"
          }`}
        >
          {workspaceLayout !== "preview" && (
            <form
              onSubmit={handleSubmit}
              className={`${
                workspaceLayout === "split"
                  ? "xl:col-span-7 xl:h-full xl:overflow-y-auto no-scrollbar"
                  : "w-full"
              } rounded-[2rem] p-6 sm:p-8 space-y-8 relative edufit-card-primary`}
            >
              {/* IDENTITAS & SAMPUL WAJIB */}
              <div className="space-y-5 relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
                  <h3 className="text-2xl font-light tracking-tight">
                    Identitas, Sampul &{" "}
                    <span className="font-semibold">Pertanyaan Refleksi</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {[10, 11, 12].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setActiveGrade(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer ${
                          activeGrade === g
                            ? "seg-btn-active"
                            : "edufit-surface-subtle"
                        }`}
                      >
                        Kelas {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Judul Unit Materi *
                  </label>
                  <input
                    required
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    type="text"
                    placeholder="Contoh: Unit 4: Pengukuran Kebugaran dan Interpretasi Kondisi Tubuh"
                    className="w-full bg-transparent py-3 text-xl sm:text-2xl font-light tracking-tight outline-none edufit-underline-select"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80">
                      Pertanyaan Pemantik & Refleksi Siswa (Dinilai Guru) *
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        triggerQuestion.trim()
                          ? "badge-tint-emerald"
                          : "badge-tint-amber"
                      }`}
                    >
                      {triggerQuestion.trim() ? "TERISI" : "WAJIB DIISI"}
                    </span>
                  </div>
                  <textarea
                    value={triggerQuestion}
                    onChange={(e) => setTriggerQuestion(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan pertanyaan refleksi untuk dijawab siswa di akhir unit..."
                    className="w-full p-4 rounded-2xl text-sm font-medium outline-none resize-y edufit-surface-subtle"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-80">
                        Gambar Sampul Unit (Format 4:3) *
                      </label>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          imageUrl.trim() ? "badge-tint-emerald" : "badge-tint-rose"
                        }`}
                      >
                        {imageUrl.trim() ? "TERPASANG" : "WAJIB DIISI"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={heroFileInputRef}
                      onChange={handleHeroImageUpload}
                      className="hidden"
                    />
                    {imageUrl ? (
                      <div className="relative w-full aspect-[4/3] rounded-2xl border border-hairline overflow-hidden group">
                        <img
                          src={imageUrl}
                          alt="Sampul Unit"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => heroFileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-white text-black rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Ganti Gambar
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer badge-tint-rose"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => heroFileInputRef.current?.click()}
                        disabled={isUploadingHero}
                        className="w-full aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-rose-400/70 rounded-2xl cursor-pointer transition-colors hover:opacity-80 edufit-surface-subtle"
                      >
                        <UploadCloud className="w-7 h-7 mb-1.5 text-rose-500" />
                        <span className="text-xs font-bold">
                          {isUploadingHero
                            ? "Mengunggah..."
                            : "Unggah Gambar Sampul (Wajib)"}
                        </span>
                        <span className="text-[10px] opacity-60 mt-0.5">
                          Ditampilkan pada kartu & header aplikasi siswa
                        </span>
                      </button>
                    )}
                    <input
                      type="url"
                      value={imageUrl.startsWith("data:image") ? "" : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Atau tempel tautan gambar sampul (https://...)"
                      className="w-full mt-2 px-3.5 py-2 rounded-xl text-xs font-mono outline-none edufit-surface-subtle"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                      Tautan Video YouTube Pengantar (Opsional)
                    </label>
                    <input
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 rounded-2xl text-xs font-mono outline-none edufit-surface-subtle"
                    />
                    <p className="text-[11px] mt-3 p-3.5 rounded-2xl leading-relaxed opacity-75 edufit-surface-subtle">
                      Jika diisi, aplikasi siswa akan menampilkan{" "}
                      <strong>Pemutar Video Pengantar</strong> tepat di bagian atas
                      materi pembelajaran.
                    </p>
                  </div>
                </div>
              </div>

              {/* SUSUNAN BAGIAN MATERI */}
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div>
                    <h3 className="text-2xl font-light tracking-tight">
                      Susunan{" "}
                      <span className="font-semibold">
                        Isi Materi ({contentBlocks.length} Bagian)
                      </span>
                    </h3>
                    <p className="text-xs mt-1 opacity-60">
                      Tambah atau atur urutan bagian materi. Panel pratinjau di sebelah kanan akan tetap diam saat Anda menggulir halaman ini.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="rounded-2xl p-5 space-y-4 edufit-surface-subtle"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-hairline">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl text-xs font-bold font-mono flex items-center justify-center telemetry-bar-forest text-gold-accent">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {block.type === "cp_tp" &&
                              "Identitas & Tujuan Pembelajaran"}
                            {block.type === "heading" &&
                              "Judul Bagian / Sub-Bab"}
                            {block.type === "paragraph" && "Paragraf Penjelasan"}
                            {block.type === "list" && "Daftar Poin / Langkah"}
                            {block.type === "collapsible" &&
                              "Kotak Lipat Rincian"}
                            {block.type === "figure" &&
                              "Gambar / Poster Ilustrasi"}
                            {block.type === "procedure" &&
                              "Kartu Prosedur Tes & Kesalahan Gerak"}
                            {block.type === "table" &&
                              "Tabel Data & Norma Penilaian"}
                            {block.type === "formula" &&
                              "Rumus & Simulasi Perhitungan"}
                            {block.type === "tempo_simulator" &&
                              "Grafik Simulasi Tempo & Intensitas"}
                            {block.type === "video" &&
                              "Video Demonstrasi (YouTube)"}
                            {block.type === "callout" && "Kotak Catatan Penting"}
                            {block.type === "quiz" && "Soal Formatif Pilihan Ganda"}
                            {block.type === "glossary" &&
                              "Glosarium / Kamus Istilah"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "up")}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "down")}
                            disabled={index === contentBlocks.length - 1}
                            className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateBlock(index)}
                            className="p-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1.5 rounded-lg cursor-pointer badge-tint-rose"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {block.type === "cp_tp" && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={block.headingCode || "A"}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  headingCode: e.target.value,
                                })
                              }
                              placeholder="Kode (A)"
                              className="w-20 px-3 py-2 rounded-xl text-xs font-bold font-mono outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul Bagian (Cth: Identitas dan tujuan pembelajaran)"
                              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.cpMain || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { cpMain: e.target.value })
                              }
                              placeholder="Elemen CP Utama..."
                              className="px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.cpSupport || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  cpSupport: e.target.value,
                                })
                              }
                              placeholder="Elemen Pendukung..."
                              className="px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={block.learningFocus || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                learningFocus: e.target.value,
                              })
                            }
                            placeholder="Fokus Pembelajaran..."
                            className="w-full p-3 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold opacity-75 block">
                              Daftar Tujuan Pembelajaran:
                            </span>
                            {(block.objectivesList || []).map((obj, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold w-5">
                                  {oIdx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={obj}
                                  onChange={(e) => {
                                    const next = [
                                      ...(block.objectivesList || []),
                                    ];
                                    next[oIdx] = e.target.value;
                                    updateBlock(block.id, {
                                      objectivesList: next,
                                    });
                                  }}
                                  placeholder={`Tujuan pembelajaran ke-${oIdx + 1}...`}
                                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (
                                      block.objectivesList || []
                                    ).filter((_, i) => i !== oIdx);
                                    updateBlock(block.id, {
                                      objectivesList: next.length ? next : [""],
                                    });
                                  }}
                                  className="p-1.5 rounded-lg badge-tint-rose cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  objectivesList: [
                                    ...(block.objectivesList || []),
                                    "",
                                  ],
                                })
                              }
                              className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                            >
                              <Plus size={13} /> Tambah Tujuan Pembelajaran
                            </button>
                          </div>
                          <input
                            type="text"
                            value={block.operationalNote || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                operationalNote: e.target.value,
                              })
                            }
                            placeholder="Catatan tambahan (Opsional)..."
                            className="w-full px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                        </div>
                      )}

                      {block.type === "heading" && (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase opacity-60">
                              Tingkatan Judul:
                            </span>
                            {[
                              { k: "section", l: "Bagian Besar (A, B, C)" },
                              { k: "sub", l: "Sub-Bab (1, 2, 3)" },
                              { k: "point", l: "Sub-Poin (a, b, c)" },
                            ].map((lv) => (
                              <button
                                key={lv.k}
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    headingLevel: lv.k as any,
                                  })
                                }
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                  (block.headingLevel || "section") === lv.k
                                    ? "seg-btn-active"
                                    : "edufit-card-primary"
                                }`}
                              >
                                {lv.l}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={block.headingCode || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  headingCode: e.target.value,
                                })
                              }
                              placeholder="Kode (B / 1 / a)"
                              className="w-28 px-3 py-2.5 rounded-xl text-xs font-bold font-mono outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.title ?? block.value}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  title: e.target.value,
                                  value: e.target.value,
                                })
                              }
                              placeholder="Ketik judul bagian / sub-bab pembahasan..."
                              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none edufit-card-primary"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === "paragraph" && (
                        <textarea
                          value={block.value}
                          onChange={(e) =>
                            updateBlock(block.id, { value: e.target.value })
                          }
                          rows={4}
                          placeholder="Ketik penjelasan materi di sini..."
                          className="w-full p-4 rounded-2xl text-xs sm:text-sm leading-relaxed outline-none resize-y edufit-card-primary"
                        />
                      )}

                      {block.type === "list" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul pengantar daftar (Opsional)"
                              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                            {["number", "bullet", "alpha"].map((st) => {
                              const active =
                                (block.listStyle || "bullet") === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      listStyle: st as any,
                                    })
                                  }
                                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                                    active
                                      ? "seg-btn-active"
                                      : "edufit-card-primary"
                                  }`}
                                >
                                  {st === "number"
                                    ? "1. Angka"
                                    : st === "bullet"
                                    ? "Poin"
                                    : "a. Abjad"}
                                </button>
                              );
                            })}
                          </div>
                          {(block.items || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono w-5 text-center">
                                {block.listStyle === "number"
                                  ? `${i + 1}.`
                                  : block.listStyle === "alpha"
                                  ? `${String.fromCharCode(97 + i)}.`
                                  : "-"}
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
                                className="w-full px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (block.items || []).filter(
                                    (_, idx) => idx !== i
                                  );
                                  updateBlock(block.id, {
                                    items: next.length ? next : [""],
                                  });
                                }}
                                className="p-1.5 rounded-lg badge-tint-rose cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                items: [...(block.items || []), ""],
                              })
                            }
                            className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                          >
                            <Plus size={13} /> Tambah Baris Poin
                          </button>
                        </div>
                      )}

                      {block.type === "collapsible" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul Kotak Lipat..."
                              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                            <div className="flex items-center gap-1">
                              {[
                                { k: "text", l: "Teks Paragraf" },
                                { k: "steps", l: "Daftar Tahapan" },
                              ].map((m) => {
                                const active =
                                  (block.collapsibleMode || "steps") === m.k;
                                return (
                                  <button
                                    key={m.k}
                                    type="button"
                                    onClick={() =>
                                      updateBlock(block.id, {
                                        collapsibleMode: m.k as any,
                                      })
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                                      active
                                        ? "seg-btn-active"
                                        : "edufit-card-primary"
                                    }`}
                                  >
                                    {m.l}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {block.collapsibleMode === "text" ? (
                            <textarea
                              rows={3}
                              value={block.value || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { value: e.target.value })
                              }
                              placeholder="Tuliskan isi penjelasan lengkap..."
                              className="w-full p-3.5 rounded-xl text-xs leading-relaxed outline-none resize-y edufit-card-primary"
                            />
                          ) : (
                            <div className="space-y-2">
                              {(block.collapsibleItems || []).map((ci, cIdx) => (
                                <div key={cIdx} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={ci.label}
                                    onChange={(e) => {
                                      const next = [
                                        ...(block.collapsibleItems || []),
                                      ];
                                      next[cIdx].label = e.target.value;
                                      updateBlock(block.id, {
                                        collapsibleItems: next,
                                      });
                                    }}
                                    placeholder="Tahap"
                                    className="w-28 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                                  />
                                  <input
                                    type="text"
                                    value={ci.text}
                                    onChange={(e) => {
                                      const next = [
                                        ...(block.collapsibleItems || []),
                                      ];
                                      next[cIdx].text = e.target.value;
                                      updateBlock(block.id, {
                                        collapsibleItems: next,
                                      });
                                    }}
                                    placeholder="Penjelasan tahap..."
                                    className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBlock(block.id, {
                                        collapsibleItems: (
                                          block.collapsibleItems || []
                                        ).filter((_, idx) => idx !== cIdx),
                                      })
                                    }
                                    className="p-2 rounded-lg badge-tint-rose cursor-pointer"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    collapsibleItems: [
                                      ...(block.collapsibleItems || []),
                                      { label: "Tahap", text: "" },
                                    ],
                                  })
                                }
                                className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                              >
                                <Plus size={13} /> Tambah Tahap
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === "figure" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase opacity-60">
                              Tema Bingkai:
                            </span>
                            {["green", "blue", "neutral"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    figureTheme: t as any,
                                  })
                                }
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                                  block.figureTheme === t ||
                                  (!block.figureTheme && t === "green")
                                    ? "seg-btn-active"
                                    : "edufit-card-primary"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.overline || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  overline: e.target.value,
                                })
                              }
                              placeholder="Label Atas (Cth: GAMBAR 1.1)"
                              className="px-3 py-2 rounded-xl text-xs font-bold font-mono outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul / Nama Gambar"
                              className="px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 btn-forest-emerald">
                              <UploadCloud size={15} />
                              <span>
                                {uploadingBlockId === block.id
                                  ? "Mengunggah..."
                                  : "Unggah Poster / Gambar"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  handleBlockFigureUpload(
                                    block.id,
                                    e.target.files?.[0]
                                  );
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <input
                              type="text"
                              value={block.imageUrl || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  imageUrl: e.target.value,
                                })
                              }
                              placeholder="Atau tempel tautan gambar..."
                              className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
                            />
                          </div>
                          <input
                            type="text"
                            value={block.caption || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { caption: e.target.value })
                            }
                            placeholder="Sumber / Keterangan gambar..."
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                        </div>
                      )}

                      {block.type === "procedure" && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={block.procCode || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  procCode: e.target.value,
                                })
                              }
                              placeholder="Kode (D.1)"
                              className="w-24 px-3 py-2 rounded-xl text-xs font-bold font-mono outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Nama Butir Tes / Pengukuran (Cth: 1. Lari 60 Meter)"
                              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 btn-forest-emerald">
                              <UploadCloud size={15} />
                              <span>
                                {uploadingBlockId === block.id
                                  ? "Mengunggah..."
                                  : "Unggah Poster Tata Cara"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  handleBlockFigureUpload(
                                    block.id,
                                    e.target.files?.[0]
                                  );
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <input
                              type="text"
                              value={block.imageUrl || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  imageUrl: e.target.value,
                                })
                              }
                              placeholder="Tautan Poster Infografis (Opsional)..."
                              className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.procPurpose || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  procPurpose: e.target.value,
                                })
                              }
                              placeholder="a. Tujuan Pengukuran..."
                              className="px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.procTools || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  procTools: e.target.value,
                                })
                              }
                              placeholder="b. Alat & Petugas..."
                              className="px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[11px] font-bold opacity-75 block">
                              Langkah / Tahapan Pelaksanaan:
                            </span>
                            {(block.procSteps || []).map((st, sIdx) => (
                              <div key={sIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={st.label}
                                  onChange={(e) => {
                                    const next = [...(block.procSteps || [])];
                                    next[sIdx].label = e.target.value;
                                    updateBlock(block.id, { procSteps: next });
                                  }}
                                  placeholder="Tahap (Cth: 1. Start)"
                                  className="w-36 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                                />
                                <input
                                  type="text"
                                  value={st.text}
                                  onChange={(e) => {
                                    const next = [...(block.procSteps || [])];
                                    next[sIdx].text = e.target.value;
                                    updateBlock(block.id, { procSteps: next });
                                  }}
                                  placeholder="Rincian pelaksanaan..."
                                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      procSteps: (block.procSteps || []).filter(
                                        (_, i) => i !== sIdx
                                      ),
                                    })
                                  }
                                  className="p-2 rounded-lg badge-tint-rose cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  procSteps: [
                                    ...(block.procSteps || []),
                                    { label: "Tahap Baru", text: "" },
                                  ],
                                })
                              }
                              className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                            >
                              <Plus size={13} /> Tambah Tahap Prosedur
                            </button>
                          </div>

                          <input
                            type="text"
                            value={block.procMistakes || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                procMistakes: e.target.value,
                              })
                            }
                            placeholder="c. Kesalahan yang perlu dihindari (Gerakan tidak sah)..."
                            className="w-full px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.procHighlightNote || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  procHighlightNote: e.target.value,
                                })
                              }
                              placeholder="d. Perbedaan penting / Interpretasi..."
                              className="px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.caption || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  caption: e.target.value,
                                })
                              }
                              placeholder="Sumber pedoman..."
                              className="px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === "table" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <input
                              type="text"
                              value={block.tableTitle || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  tableTitle: e.target.value,
                                })
                              }
                              placeholder="Nama / Judul Tabel..."
                              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(block.hasCategoryFilter)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const variants = [
                                    ...(block.tableVariants || []),
                                  ];
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
                                  updateBlock(block.id, {
                                    hasCategoryFilter: checked,
                                    tableVariants: variants,
                                  });
                                }}
                              />
                              Tab Putra & Putri
                            </label>
                          </div>
                          <input
                            type="text"
                            value={block.tableDescription || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                tableDescription: e.target.value,
                              })
                            }
                            placeholder="Deskripsi pengantar tabel (Opsional)..."
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                          {(block.tableVariants || []).map((variant, vIdx) => (
                            <div
                              key={variant.id}
                              className="p-3 rounded-xl space-y-2.5 edufit-card-primary"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold">
                                  {block.hasCategoryFilter
                                    ? `Tabel ${variant.label}`
                                    : "Isi Tabel"}
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [
                                        ...(block.tableVariants || []),
                                      ];
                                      next[vIdx].headers.push(
                                        `Kolom ${next[vIdx].headers.length + 1}`
                                      );
                                      next[vIdx].rows = next[vIdx].rows.map(
                                        (r) => [...r, ""]
                                      );
                                      updateBlock(block.id, {
                                        tableVariants: next,
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer badge-tint-emerald"
                                  >
                                    + Kolom
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [
                                        ...(block.tableVariants || []),
                                      ];
                                      next[vIdx].rows.push(
                                        new Array(
                                          next[vIdx].headers.length
                                        ).fill("")
                                      );
                                      updateBlock(block.id, {
                                        tableVariants: next,
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer badge-tint-sky"
                                  >
                                    + Baris
                                  </button>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr>
                                      {variant.headers.map((h, hIdx) => (
                                        <th
                                          key={hIdx}
                                          className="p-1.5 border border-hairline"
                                        >
                                          <input
                                            type="text"
                                            value={h}
                                            onChange={(e) => {
                                              const next = [
                                                ...(block.tableVariants || []),
                                              ];
                                              next[vIdx].headers[hIdx] =
                                                e.target.value;
                                              updateBlock(block.id, {
                                                tableVariants: next,
                                              });
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
                                          <td
                                            key={cIdx}
                                            className="p-1.5 border border-hairline"
                                          >
                                            <input
                                              type="text"
                                              value={cell}
                                              onChange={(e) => {
                                                const next = [
                                                  ...(block.tableVariants || []),
                                                ];
                                                next[vIdx].rows[rIdx][cIdx] =
                                                  e.target.value;
                                                updateBlock(block.id, {
                                                  tableVariants: next,
                                                });
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                <input
                                  type="text"
                                  value={variant.summaryText || ""}
                                  onChange={(e) => {
                                    const next = [
                                      ...(block.tableVariants || []),
                                    ];
                                    next[vIdx].summaryText = e.target.value;
                                    updateBlock(block.id, {
                                      tableVariants: next,
                                    });
                                  }}
                                  placeholder="Baris Total Skor (Cth: TOTAL NILAI: 3+3+3+3+3 = 15)"
                                  className="px-3 py-1.5 rounded-lg text-xs font-mono outline-none edufit-surface-subtle"
                                />
                                <input
                                  type="text"
                                  value={variant.summaryBadge || ""}
                                  onChange={(e) => {
                                    const next = [
                                      ...(block.tableVariants || []),
                                    ];
                                    next[vIdx].summaryBadge = e.target.value;
                                    updateBlock(block.id, {
                                      tableVariants: next,
                                    });
                                  }}
                                  placeholder="Label Kategori (Cth: KATEGORI: SEDANG)"
                                  className="px-3 py-1.5 rounded-lg text-xs font-mono outline-none edufit-surface-subtle"
                                />
                              </div>
                            </div>
                          ))}
                          <input
                            type="text"
                            value={block.tableFootnote || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                tableFootnote: e.target.value,
                              })
                            }
                            placeholder="Catatan kaki / Cara membaca tabel..."
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                        </div>
                      )}

                      {block.type === "formula" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul Rumus (Cth: Panduan Menghitung IMT)"
                              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                            <div className="flex gap-1">
                              {[
                                { k: "fraction", l: "Rumus Pecahan (IMT)" },
                                { k: "linear", l: "Rumus Satu Baris" },
                              ].map((m) => (
                                <button
                                  key={m.k}
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      formulaMode: m.k as any,
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer ${
                                    (block.formulaMode || "fraction") === m.k
                                      ? "seg-btn-active"
                                      : "edufit-card-primary"
                                  }`}
                                >
                                  {m.l}
                                </button>
                              ))}
                            </div>
                          </div>

                          {(block.formulaMode || "fraction") === "fraction" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={block.formulaLeft || "IMT"}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    formulaLeft: e.target.value,
                                  })
                                }
                                placeholder="Sisi Kiri (IMT)"
                                className="px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none edufit-card-primary"
                              />
                              <input
                                type="text"
                                value={block.formulaNumerator || ""}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    formulaNumerator: e.target.value,
                                  })
                                }
                                placeholder="Pembilang Atas (Berat Badan kg)"
                                className="px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
                              />
                              <input
                                type="text"
                                value={block.formulaDenominator || ""}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    formulaDenominator: e.target.value,
                                  })
                                }
                                placeholder="Penyebut Bawah (Tinggi m × Tinggi m)"
                                className="px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={block.formulaLinearExpr || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  formulaLinearExpr: e.target.value,
                                })
                              }
                              placeholder="Tulis rumus (Cth: Tinggi Loncatan = Raihan Tertinggi - Raihan Awal)"
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold outline-none edufit-card-primary"
                            />
                          )}

                          <input
                            type="text"
                            value={block.formulaNote || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                formulaNote: e.target.value,
                              })
                            }
                            placeholder="Catatan satuan rumus..."
                            className="w-full px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />

                          <input
                            type="text"
                            value={block.formulaCaseTitle || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                formulaCaseTitle: e.target.value,
                              })
                            }
                            placeholder="Judul Contoh Kasus (Cth: Jika BB = 68 kg dan TB = 170 cm)"
                            className="w-full px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                          />

                          <div className="space-y-2">
                            {(block.formulaSteps || []).map((st, sIdx) => (
                              <div key={sIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={st.label}
                                  onChange={(e) => {
                                    const next = [...(block.formulaSteps || [])];
                                    next[sIdx].label = e.target.value;
                                    updateBlock(block.id, {
                                      formulaSteps: next,
                                    });
                                  }}
                                  placeholder="Langkah (1. Ubah TB)"
                                  className="w-40 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                                />
                                <input
                                  type="text"
                                  value={st.expression}
                                  onChange={(e) => {
                                    const next = [...(block.formulaSteps || [])];
                                    next[sIdx].expression = e.target.value;
                                    updateBlock(block.id, {
                                      formulaSteps: next,
                                    });
                                  }}
                                  placeholder="Perhitungan (170 / 100 = 1,70 m)"
                                  className="flex-1 px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      formulaSteps: (
                                        block.formulaSteps || []
                                      ).filter((_, i) => i !== sIdx),
                                    })
                                  }
                                  className="p-2 rounded-lg badge-tint-rose cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  formulaSteps: [
                                    ...(block.formulaSteps || []),
                                    { label: "Langkah Baru", expression: "" },
                                  ],
                                })
                              }
                              className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                            >
                              <Plus size={13} /> Tambah Langkah Perhitungan
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.formulaResult || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  formulaResult: e.target.value,
                                })
                              }
                              placeholder="Hasil Akhir (Cth: IMT = 23,5 kg/m²)"
                              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.formulaCategoryBadge || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  formulaCategoryBadge: e.target.value,
                                })
                              }
                              placeholder="Label Kategori (Cth: KATEGORI: NORMAL)"
                              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold outline-none edufit-card-primary"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === "tempo_simulator" && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={block.simulatorTitle || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                simulatorTitle: e.target.value,
                              })
                            }
                            placeholder="Judul Grafik Simulasi..."
                            className="w-full px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                          />
                          {(() => {
                            const methods = block.tempoMethods || [];
                            const activeMIdx = editorTempoTab[block.id] || 0;
                            const activeMethod =
                              methods[activeMIdx] || methods[0];
                            return (
                              <div className="p-3.5 rounded-xl space-y-3 edufit-card-primary">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {methods.map((m, mIdx) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() =>
                                          setEditorTempoTab({
                                            ...editorTempoTab,
                                            [block.id]: mIdx,
                                          })
                                        }
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                                          activeMIdx === mIdx
                                            ? "seg-btn-active"
                                            : "edufit-surface-subtle"
                                        }`}
                                      >
                                        {m.name}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [
                                        ...methods,
                                        {
                                          id: generateId(),
                                          name: `Metode ${methods.length + 1}`,
                                          steps: [
                                            { label: "Tahap 1", level: 2 },
                                            { label: "Tahap 2", level: 3 },
                                          ],
                                        },
                                      ];
                                      updateBlock(block.id, {
                                        tempoMethods: next,
                                      });
                                      setEditorTempoTab({
                                        ...editorTempoTab,
                                        [block.id]: next.length - 1,
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer badge-tint-emerald"
                                  >
                                    + Metode Baru
                                  </button>
                                </div>
                                {activeMethod && (
                                  <div className="space-y-2.5 pt-2 border-t border-hairline">
                                    <input
                                      type="text"
                                      value={activeMethod.name}
                                      onChange={(e) => {
                                        const next = [...methods];
                                        next[activeMIdx].name = e.target.value;
                                        updateBlock(block.id, {
                                          tempoMethods: next,
                                        });
                                      }}
                                      placeholder="Nama Metode..."
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold outline-none edufit-surface-subtle"
                                    />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {activeMethod.steps.map((st, sIdx) => (
                                        <div
                                          key={sIdx}
                                          className="p-2.5 rounded-xl space-y-2 edufit-surface-subtle"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold font-mono opacity-60">
                                              TAHAP {sIdx + 1}
                                            </span>
                                            {activeMethod.steps.length > 2 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const next = [...methods];
                                                  next[activeMIdx].steps = next[
                                                    activeMIdx
                                                  ].steps.filter(
                                                    (_, i) => i !== sIdx
                                                  );
                                                  updateBlock(block.id, {
                                                    tempoMethods: next,
                                                  });
                                                }}
                                                className="text-red-500 cursor-pointer"
                                              >
                                                <X size={12} />
                                              </button>
                                            )}
                                          </div>
                                          <input
                                            type="text"
                                            value={st.label}
                                            onChange={(e) => {
                                              const next = [...methods];
                                              next[activeMIdx].steps[
                                                sIdx
                                              ].label = e.target.value;
                                              updateBlock(block.id, {
                                                tempoMethods: next,
                                              });
                                            }}
                                            className="w-full px-2.5 py-1 rounded-lg text-xs font-bold outline-none edufit-card-primary"
                                          />
                                          <div className="grid grid-cols-3 gap-1">
                                            {[
                                              { lv: 1, t: "Rendah" },
                                              { lv: 2, t: "Sedang" },
                                              { lv: 3, t: "Tinggi" },
                                            ].map((opt) => (
                                              <button
                                                key={opt.lv}
                                                type="button"
                                                onClick={() => {
                                                  const next = [...methods];
                                                  next[activeMIdx].steps[
                                                    sIdx
                                                  ].level = opt.lv as any;
                                                  updateBlock(block.id, {
                                                    tempoMethods: next,
                                                  });
                                                }}
                                                className={`py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                                                  st.level === opt.lv
                                                    ? "telemetry-bar-forest text-gold-accent"
                                                    : "edufit-card-primary opacity-70"
                                                }`}
                                              >
                                                {opt.t}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...methods];
                                        next[activeMIdx].steps.push({
                                          label: "Tahap Baru",
                                          level: 2,
                                        });
                                        updateBlock(block.id, {
                                          tempoMethods: next,
                                        });
                                      }}
                                      className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                                    >
                                      <Plus size={13} /> Tambah Batang
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          <input
                            type="text"
                            value={block.simulatorFootnote || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                simulatorFootnote: e.target.value,
                              })
                            }
                            placeholder="Catatan bawah grafik simulasi (Opsional)..."
                            className="w-full px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                        </div>
                      )}

                      {block.type === "video" && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul Video Rujukan"
                              className="px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.videoUrl || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  videoUrl: e.target.value,
                                })
                              }
                              placeholder="Tautan YouTube (https://www.youtube.com/watch?v=...)"
                              className="px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={block.value || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { value: e.target.value })
                            }
                            placeholder="Deskripsi/pengantar video..."
                            className="w-full p-3 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                          <div className="space-y-2 pt-2 border-t border-hairline">
                            <span className="text-[10px] font-bold uppercase opacity-60">
                              Fokus Pengamatan Video (Opsional):
                            </span>
                            {(block.observationPoints || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={pt}
                                  onChange={(e) => {
                                    const next = [
                                      ...(block.observationPoints || []),
                                    ];
                                    next[pIdx] = e.target.value;
                                    updateBlock(block.id, {
                                      observationPoints: next,
                                    });
                                  }}
                                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                                  placeholder={`Poin pengamatan ${pIdx + 1}...`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [
                                      ...(block.observationPoints || []),
                                    ];
                                    next.splice(pIdx, 1);
                                    updateBlock(block.id, {
                                      observationPoints: next,
                                    });
                                  }}
                                  className="p-1.5 rounded-lg badge-tint-rose cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  observationPoints: [
                                    ...(block.observationPoints || []),
                                    "",
                                  ],
                                })
                              }
                              className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                            >
                              <Plus size={13} /> Tambah Poin Pengamatan
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === "callout" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase opacity-60">
                              Warna Aksen:
                            </span>
                            {["amber", "emerald", "sky", "rose"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    calloutTone: t as any,
                                  })
                                }
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                                  block.calloutTone === t ||
                                  (!block.calloutTone && t === "amber")
                                    ? "seg-btn-active"
                                    : "edufit-card-primary"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={block.title || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { title: e.target.value })
                            }
                            placeholder="Judul Kotak Catatan..."
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                          />
                          <textarea
                            rows={2}
                            value={block.value || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { value: e.target.value })
                            }
                            placeholder="Isi catatan penting..."
                            className="w-full p-3 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                        </div>
                      )}

                      {block.type === "quiz" && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul Soal Formatif"
                              className="px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.question || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  question: e.target.value,
                                })
                              }
                              placeholder="Pertanyaan Kuis Formatif..."
                              className="px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(block.options || []).map((opt, oIdx) => (
                              <div
                                key={opt.key}
                                className="flex items-center gap-1.5"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      correctOption: opt.key,
                                    })
                                  }
                                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono shrink-0 cursor-pointer ${
                                    block.correctOption === opt.key
                                      ? "seg-btn-active"
                                      : "edufit-card-primary opacity-70"
                                  }`}
                                  title="Klik untuk jadikan Kunci Jawaban"
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
                                  className="w-full px-3 py-1.5 rounded-xl text-xs outline-none edufit-card-primary"
                                />
                              </div>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={block.explanation || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                explanation: e.target.value,
                              })
                            }
                            placeholder="Penjelasan kunci jawaban..."
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                          />
                        </div>
                      )}

                      {block.type === "glossary" && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={block.headingCode || "L"}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  headingCode: e.target.value,
                                })
                              }
                              placeholder="Kode (L)"
                              className="w-20 px-3 py-2 rounded-xl text-xs font-bold font-mono outline-none edufit-card-primary"
                            />
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul Glosarium"
                              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            {(block.glossaryItems || []).map((gi, gIdx) => (
                              <div key={gIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={gi.term}
                                  onChange={(e) => {
                                    const next = [
                                      ...(block.glossaryItems || []),
                                    ];
                                    next[gIdx].term = e.target.value;
                                    updateBlock(block.id, {
                                      glossaryItems: next,
                                    });
                                  }}
                                  placeholder="Istilah..."
                                  className="w-40 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary"
                                />
                                <input
                                  type="text"
                                  value={gi.definition}
                                  onChange={(e) => {
                                    const next = [
                                      ...(block.glossaryItems || []),
                                    ];
                                    next[gIdx].definition = e.target.value;
                                    updateBlock(block.id, {
                                      glossaryItems: next,
                                    });
                                  }}
                                  placeholder="Pengertian istilah..."
                                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      glossaryItems: (
                                        block.glossaryItems || []
                                      ).filter((_, i) => i !== gIdx),
                                    })
                                  }
                                  className="p-2 rounded-lg badge-tint-rose cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  glossaryItems: [
                                    ...(block.glossaryItems || []),
                                    { term: "", definition: "" },
                                  ],
                                })
                              }
                              className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"
                            >
                              <Plus size={13} /> Tambah Istilah Glosarium
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* TOMBOL TAMBAH BAGIAN MATERI */}
                <div className="p-5 rounded-2xl space-y-3 edufit-surface-subtle">
                  <span className="text-xs font-bold font-mono uppercase tracking-widest block opacity-70">
                    TAMBAHKAN BAGIAN BARU KE DALAM MATERI:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { t: "cp_tp", icon: Target, l: "Identitas CP/TP" },
                      { t: "heading", icon: Heading, l: "Judul Bab (A/1/a)" },
                      { t: "paragraph", icon: AlignLeft, l: "Paragraf" },
                      { t: "list", icon: ListOrdered, l: "Daftar Poin" },
                      { t: "procedure", icon: ClipboardCheck, l: "Kartu Prosedur Tes" },
                      { t: "table", icon: TableIcon, l: "Tabel & Norma" },
                      { t: "formula", icon: Calculator, l: "Rumus & Hitungan" },
                      { t: "figure", icon: ImageIcon, l: "Gambar / Poster" },
                      { t: "collapsible", icon: FolderOpen, l: "Kotak Lipat" },
                      { t: "tempo_simulator", icon: Activity, l: "Grafik Tempo" },
                      { t: "video", icon: Video, l: "Video YouTube" },
                      { t: "callout", icon: MessageSquareWarning, l: "Catatan" },
                      { t: "quiz", icon: HelpCircle, l: "Soal Formatif" },
                      { t: "glossary", icon: BookMarked, l: "Glosarium" },
                    ].map((btn) => {
                      const IconB = btn.icon;
                      return (
                        <button
                          key={btn.t}
                          type="button"
                          onClick={() => addBlock(btn.t as BlockType)}
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 edufit-card-primary"
                        >
                          <IconB size={13} /> {btn.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* PANEL PRATINJAU KANAN (TERKUNCI PENUH DAN TIDAK IKUT TERGULUNG) */}
          {workspaceLayout !== "editor" && (
            <div
              className={
                workspaceLayout === "split"
                  ? "xl:col-span-5 xl:h-full xl:overflow-hidden w-full"
                  : "w-full"
              }
            >
              {renderStudioLivePreview()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // HALAMAN UTAMA DAFTAR MODUL MATERI (BEBAS ISTILAH TEKNIS & GAMBAR 4:3)
  // ==========================================================================
  return (
    <div className="edufit-admin-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {renderDynamicIsland()}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">
              MANAJEMEN KURIKULUM PJOK
            </span>
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
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Unit Kelas {activeGrade}
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : totalBlocksActiveGrade}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Bagian Materi
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : reflectionStats.total}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Jawaban Refleksi
            </div>
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
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${allMaterials.length} Modul`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Fase E & F
            </span>
          </div>
        </div>
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Penilaian Guru</span>
            <span className="font-mono">GRADE A–D</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${reflectionStats.graded} Dinilai`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {reflectionStats.pct}% TUNTAS
            </span>
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
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              Siap Tayang
            </span>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Gambar Sampul</span>
            <span className="font-mono">WAJIB</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading
                ? "—"
                : `${
                    materials.filter((m) => String(m.image_url || "").trim())
                      .length
                  }/${materials.length}`}
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
            <h2 className="text-3xl font-light tracking-tight mb-2">
              Kendali Materi
            </h2>
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
                    triggerDynamicIsland(
                      `Filter Modul Kelas ${g}`,
                      `Menampilkan daftar unit pembelajaran Kelas ${g}.`,
                      "info"
                    );
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
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isQuickJumpOpen ? "rotate-180" : ""
                  }`}
                />
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
                      <div className="p-5 text-sm opacity-50 text-center">
                        Belum ada unit materi di Kelas {activeGrade}.
                      </div>
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
                            <span className="font-mono text-gold-accent mr-2">
                              U{idx + 1}
                            </span>
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
            <span className="text-[11px] font-bold font-mono opacity-55">
              KLIK BATANG
            </span>
          </div>
          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : totalBlocksActiveGrade}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Total Bagian Materi Kelas {activeGrade}
            </div>
          </div>
          {(() => {
            const bars = materials.slice(0, 6);
            const maxBlocks = Math.max(
              1,
              ...bars.map((m) => parseMaterialToBlocks(m).length)
            );
            return (
              <div
                className="grid gap-3 items-end pt-4 h-44 relative z-10"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    bars.length
                  )}, minmax(0, 1fr))`,
                }}
              >
                {bars.map((mat, idx) => {
                  const bCount = parseMaterialToBlocks(mat).length;
                  const heightPct = Math.round((bCount / maxBlocks) * 100);
                  const isHighest = bCount === maxBlocks && bCount > 0;
                  const fillClass = isHighest
                    ? "chart-fill-gold"
                    : "chart-fill-primary";
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => openEditForm(mat)}
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${mat.unit_name}: ${bCount} Bagian Materi`}
                    >
                      <span className="text-[11px] font-bold font-mono opacity-80">
                        {bCount}
                      </span>
                      <div className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div
                          className={`w-full rounded-full transition-all duration-500 group-hover:scale-y-105 ${fillClass}`}
                          style={{
                            height: `${Math.max(
                              bCount > 0 ? 18 : 8,
                              heightPct
                            )}%`,
                          }}
                        />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                      <span className="text-[10px] font-bold font-mono opacity-65 truncate max-w-full">
                        U{idx + 1}
                      </span>
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
              gaugeMode === "graded"
                ? `${reflectionStats.pct}%`
                : gaugeMode === "blocks"
                ? `${totalBlocksActiveGrade}`
                : `${allMaterials.length}`;
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
            const dashOffset =
              circumference - (Math.max(10, gaugePct) / 100) * circumference;
            return (
              <div className="relative flex flex-col items-center justify-center my-2 z-10">
                <div className="relative flex items-center justify-center">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      strokeWidth="6"
                      strokeDasharray="2 5"
                      className="gauge-circle-track"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className={`transition-all duration-700 ${
                        gaugeMode === "graded"
                          ? "gauge-circle-emerald"
                          : "gauge-circle-gold"
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                      {isLoading ? "—" : gaugeValue}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold opacity-65 mt-3 text-center">
                  {gaugeLabel}
                </span>
              </div>
            );
          })()}
          <div className="relative z-10">
            <div className="h-2.5 w-full rounded-full flex overflow-hidden mb-3 chart-track-pill">
              <div
                className="h-full chart-fill-sky"
                style={{
                  width: `${
                    (gradeCountBreakdown.g10 / gradeCountBreakdown.total) * 100
                  }%`,
                }}
              />
              <div
                className="h-full chart-fill-gold"
                style={{
                  width: `${
                    (gradeCountBreakdown.g11 / gradeCountBreakdown.total) * 100
                  }%`,
                }}
              />
              <div
                className="h-full chart-fill-emerald"
                style={{
                  width: `${
                    (gradeCountBreakdown.g12 / gradeCountBreakdown.total) * 100
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-2 border-t border-hairline">
              <span>Kls 10 ({gradeCountBreakdown.g10})</span>
              <span>Kls 11 ({gradeCountBreakdown.g11})</span>
              <span>Kls 12 ({gradeCountBreakdown.g12})</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER DAFTAR UNIT MATERI (BEBAS KATA TEKNIS SAAS / PX) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent mb-1">
            MODUL PEMBELAJARAN INTERAKTIF
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Daftar Unit Materi Kelas {activeGrade} ({materials.length})
          </h3>
          <p className="text-xs font-medium opacity-55 mt-1">
            Klik kartu unit materi untuk menyusun isi pembelajaran dan melihat
            tampilan langsung di aplikasi siswa.
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

      {/* GRID KARTU UNIT MATERI DENGAN GAMBAR SAMPUL FORMAT 4:3 LANDSCAPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[380px] rounded-[2rem] animate-pulse edufit-surface-subtle"
            />
          ))
        ) : materials.length === 0 ? (
          <div className="xl:col-span-3 p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-xl font-light">
              Belum ada unit materi untuk Kelas {activeGrade}.
            </h3>
          </div>
        ) : (
          materials.map((mat, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const blocks = parseMaterialToBlocks(mat);
            const tableCount = blocks.filter((b) => b.type === "table").length;
            const figCount = blocks.filter(
              (b) => b.type === "figure" || b.type === "procedure"
            ).length;
            const unitRefStat = reflectionsByUnitMap[mat.unit_name] || {
              total: 0,
              graded: 0,
            };
            const hasThumbnail = Boolean(
              mat.image_url && String(mat.image_url).trim()
            );

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
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase badge-tint-rose">
                        BELUM ADA SAMPUL
                      </span>
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

                {/* GAMBAR KARTU FORMAT 4:3 LANDSCAPE */}
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
                  <div className="text-2xl md:text-3xl font-light tracking-tighter leading-tight mb-2">
                    {mat.unit_name}
                  </div>
                  <p className="text-xs font-medium opacity-65 line-clamp-2 italic leading-relaxed">
                    &ldquo;
                    {mat.trigger_question ||
                      "Klik kartu untuk mengatur isi materi dan pertanyaan pemantik refleksi."}
                    &rdquo;
                  </p>
                </div>
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-4 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Isi Materi ({tableCount} Tabel · {figCount} Visual)
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {blocks.length}{" "}
                      <span className="text-sm font-sans font-medium opacity-60">
                        Bagian
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Refleksi Siswa
                    </div>
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