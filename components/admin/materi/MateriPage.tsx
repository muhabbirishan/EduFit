// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Columns,
  Copy,
  Download,
  Edit3,
  Eye,
  FolderOpen,
  Heading,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  MessageSquareWarning,
  Play,
  Plus,
  Smartphone,
  Table as TableIcon,
  Tablet,
  Trash2,
  UploadCloud,
  Video,
  X
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ============================================================================
// TIPE DATA SAAS DYNAMIC BLOCK BUILDER
// ============================================================================
export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "collapsible"
  | "figure"
  | "table"
  | "tempo_simulator"
  | "video"
  | "callout"
  | "quiz";

export interface TableVariant {
  id: string;
  label: string;
  unitSubtitle?: string;
  headers: string[];
  rows: string[][];
}

export interface TempoStep {
  label: string;
  level: 1 | 2 | 3; // 1 = Rendah, 2 = Sedang, 3 = Cepat/Tinggi
}

export interface TempoMethod {
  id: string;
  name: string;
  steps: TempoStep[];
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  value: string;
  listStyle?: "bullet" | "number" | "alpha";
  items?: string[];
  collapsibleMode?: "text" | "steps";
  collapsibleItems?: { label: string; text: string }[];
  overline?: string;
  imageUrl?: string;
  caption?: string;
  figureTheme?: "green" | "blue" | "neutral";
  tableTitle?: string;
  tableDescription?: string;
  tableFootnote?: string;
  hasCategoryFilter?: boolean;
  tableVariants?: TableVariant[];
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
}

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
  return startIdx !== -1
    ? htmlString.substring(0, startIdx).trim()
    : htmlString;
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

// ============================================================================
// HELPER KOMPRESI GAMBAR LOKAL (FALLBACK ANTI-GAGAL JIKA BUCKET BELUM SIAP)
// ============================================================================
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
        const dataUrl = canvas.toDataURL("image/webp", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = String(ev.target?.result || "");
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function MateriPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [allReflections, setAllReflections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [gaugeMode, setGaugeMode] = useState<"graded" | "blocks" | "units">(
    "graded"
  );

  // Dropdown Lompat Cepat ke Unit Materi di Bento 1
  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const quickJumpRef = useRef<HTMLDivElement>(null);

  const [workspaceLayout, setWorkspaceLayout] = useState<
    "split" | "editor" | "preview"
  >("split");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet">(
    "mobile"
  );

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

  // State untuk Editor & Pratinjau Interaktif
  const [editorTempoTab, setEditorTempoTab] = useState<Record<string, number>>(
    {}
  );
  const [previewSelectedVariant, setPreviewSelectedVariant] = useState<
    Record<string, number>
  >({});
  const [previewTempoTab, setPreviewTempoTab] = useState<
    Record<string, number>
  >({});
  const [previewTempoStep, setPreviewTempoStep] = useState<
    Record<string, number>
  >({});
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "list") fetchMaterials();
  }, [viewMode]);

  const materials = useMemo(
    () =>
      allMaterials.filter((m) => Number(m.grade_level) === Number(activeGrade)),
    [allMaterials, activeGrade]
  );

  // ==========================================================================
  // PEMBUAT BLOK DEFAULT YANG BERSIH & MUDAH DIPAHAMI ADMIN
  // ==========================================================================
  const createDefaultBlock = (type: BlockType): ContentBlock => {
    const id = generateId();
    switch (type) {
      case "heading":
        return { id, type: "heading", title: "", value: "" };
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
          title: "Panduan Persiapan, Pelaksanaan & Akhir Latihan",
          collapsibleMode: "text",
          value:
            "Tuliskan penjelasan rincian yang ingin disembunyikan di dalam kotak lipat (accordion) ini agar tampilan modul tetap ringkas...",
          collapsibleItems: [
            {
              label: "Persiapan",
              text: "Periksa lintasan dan penanda, pahami pola kerja-pemulihan, lalu lakukan pemanasan.",
            },
            {
              label: "Pelaksanaan",
              text: "Pilih tempo yang dapat dikontrol, jaga tubuh rileks, dan ikuti perubahan tempo.",
            },
            {
              label: "Akhir",
              text: "Kurangi tempo, lakukan pendinginan, lalu catat hasil dan RPE.",
            },
          ],
        };
      case "figure":
        return {
          id,
          type: "figure",
          overline: "GAMBAR 1.1 · ILUSTRASI GERAK",
          title: "",
          imageUrl: "",
          caption: "",
          figureTheme: "green",
          value: "",
        };
      case "table":
        return {
          id,
          type: "table",
          tableTitle: "Tabel 1. Perbandingan Metode Latihan",
          tableDescription: "",
          tableFootnote: "",
          hasCategoryFilter: false,
          value: "",
          tableVariants: [
            {
              id: generateId(),
              label: "Umum",
              unitSubtitle: "",
              headers: [
                "Metode",
                "Pola Kerja",
                "Lintasan",
                "Fokus Pengamatan",
              ],
              rows: [
                [
                  "Continuous Run",
                  "Tempo stabil tanpa jeda istirahat",
                  "Lintasan datar",
                  "Irama napas dan langkah konsisten",
                ],
                [
                  "Interval Training",
                  "Pergantian kerja dan istirahat terencana",
                  "Lintasan berpenanda",
                  "Kepatuhan waktu kerja dan pemulihan",
                ],
              ],
            },
          ],
        };
      case "tempo_simulator":
        return {
          id,
          type: "tempo_simulator",
          simulatorTitle: "Simulasi Visual Pola Tempo & Intensitas Latihan",
          simulatorFootnote:
            "Tinggi grafik menunjukkan perbandingan tingkat usaha/intensitas pada setiap tahap latihan.",
          value: "",
          tempoMethods: [
            {
              id: generateId(),
              name: "Continuous Run",
              steps: [
                { label: "Jogging", level: 2 },
                { label: "Jogging", level: 2 },
                { label: "Jogging", level: 2 },
                { label: "Jogging", level: 2 },
                { label: "Jogging", level: 2 },
                { label: "Pendinginan", level: 1 },
              ],
            },
            {
              id: generateId(),
              name: "Interval",
              steps: [
                { label: "Lari Cepat", level: 3 },
                { label: "Jalan Pulih", level: 1 },
                { label: "Lari Cepat", level: 3 },
                { label: "Jalan Pulih", level: 1 },
                { label: "Lari Cepat", level: 3 },
                { label: "Pendinginan", level: 1 },
              ],
            },
            {
              id: generateId(),
              name: "Fartlek",
              steps: [
                { label: "Jogging", level: 1 },
                { label: "Sprint", level: 3 },
                { label: "Jalan", level: 1 },
                { label: "Tempo Sedang", level: 2 },
                { label: "Sprint", level: 3 },
                { label: "Jalan Santai", level: 1 },
              ],
            },
          ],
        };
      case "video":
        return {
          id,
          type: "video",
          title: "Video Demonstrasi Teknik",
          value:
            "Simak video berikut dan amati posisi tubuh serta tahapan gerakannya.",
          videoButtonLabel: "Putar Video Demonstrasi",
          videoUrl: "",
          videoSource: "",
          observationPoints: [
            "Perhatikan sikap awal dan posisi tumpuan kaki.",
            "Catat kesalahan umum yang perlu dihindari saat praktik.",
          ],
        };
      case "callout":
        return {
          id,
          type: "callout",
          title: "Catatan Penting & Keselamatan",
          calloutTone: "amber",
          value:
            "Pastikan melakukan pemanasan dinamis sebelum latihan inti dan segera hentikan gerakan apabila muncul rasa nyeri tajam pada sendi.",
        };
      case "quiz":
        return {
          id,
          type: "quiz",
          title: "Kuis Cek Pemahaman",
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
    }
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
        } catch {
          // Lanjut ke fallback HTML
        }
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

    if (!htmlString.trim()) {
      return [createDefaultBlock("heading"), createDefaultBlock("paragraph")];
    }

    if (typeof window === "undefined") {
      return [createDefaultBlock("paragraph")];
    }

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
        const el = node as HTMLElement;
        blocks.push({
          id: generateId(),
          type: "callout",
          title: "Catatan Penting",
          calloutTone: "amber",
          value: (el.textContent || "").trim(),
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
      if (b.type === "heading" && (b.title || val).trim()) {
        html += `<p><strong>${b.title || val}</strong></p>`;
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
      } else if (b.type === "figure") {
        if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
        if (b.imageUrl) {
          html += `<p><img src="${b.imageUrl}" alt="${
            b.title || "Ilustrasi"
          }" /></p>`;
        }
        if (b.caption?.trim()) html += `<p><em>${b.caption}</em></p>`;
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
      } else if (b.type === "callout") {
        html += `<blockquote><strong>${b.title || "Catatan"}:</strong> ${val}</blockquote>`;
      } else if (b.type === "video") {
        html += `<p><strong>${b.title || "Video Rujukan"}</strong>: ${val}</p>`;
      } else if (b.type === "quiz") {
        html += `<p><strong>Cek Pemahaman Unit:</strong> ${
          b.question || ""
        }</p>`;
      }
    });
    return html + encodeBlocksToMarker(blocks);
  };

  const openAddForm = () => {
    setEditingId(null);
    setOriginalUnitName("");
    setUnitName("");
    setTriggerQuestion("");
    setMediaUrl("");
    setImageUrl("");
    setContentBlocks([
      {
        id: generateId(),
        type: "heading",
        title: "1. Memahami Konsep Dasar",
        value: "",
      },
      {
        id: generateId(),
        type: "paragraph",
        value: "",
      },
    ]);
    setViewMode("form");
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
    setViewMode("form");
  };

  // ==========================================================================
  // UNGGAH GAMBAR KE SUPABASE STORAGE `edufit_media` + AUTO-FALLBACK KOMPRESI
  // ==========================================================================
  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    const toastId = toast.loading("Mengunggah gambar ke edufit_media...");
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
        toast.success(
          "Gambar berhasil diterapkan! (Mode kompresi cepat aktif)",
          { id: toastId, duration: 3500 }
        );
        return compressedDataUrl;
      }

      const { data } = supabase.storage
        .from("edufit_media")
        .getPublicUrl(filePath);
      toast.success("Gambar berhasil diunggah ke bucket edufit_media!", {
        id: toastId,
      });
      return data.publicUrl;
    } catch (err: any) {
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
    if (url) setImageUrl(url);
    setIsUploadingHero(false);
    e.target.value = "";
  };

  const handleBlockFigureUpload = async (blockId: string, file?: File) => {
    if (!file) return;
    setUploadingBlockId(blockId);
    const url = await uploadFileToSupabase(file);
    if (url) updateBlock(blockId, { imageUrl: url });
    setUploadingBlockId(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!unitName.trim()) {
      return toast.error("Judul Unit Materi wajib diisi.");
    }

    setIsSubmitting(true);

    try {
      // Sanitasi blok agar bebas dari properti undefined saat dikirim ke kolom JSONB Supabase
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

      const fullPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: triggerQuestion.trim() || null,
        content_text: compiledHtml,
        content_blocks: sanitizedBlocks,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        updated_at: nowIso,
      };

      const legacyPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: triggerQuestion.trim() || null,
        content_text: compiledHtml,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        updated_at: nowIso,
      };

      let savedRecord: any = null;

      if (editingId) {
        // 1. Update utama berdasarkan ID
        let { data, error } = await supabase
          .from("master_materials")
          .update(fullPayload)
          .eq("id", editingId)
          .select();

        // Fallback jika skema kolom content_blocks bermasalah
        if (error) {
          const retry = await supabase
            .from("master_materials")
            .update(legacyPayload)
            .eq("id", editingId)
            .select();
          if (retry.error) throw retry.error;
          data = retry.data;
        }

        // 2. Fallback pencarian berdasarkan grade_level & originalUnitName jika ID tidak cocok
        if ((!data || data.length === 0) && originalUnitName) {
          const byName = await supabase
            .from("master_materials")
            .update(fullPayload)
            .eq("grade_level", Number(activeGrade))
            .eq("unit_name", originalUnitName)
            .select();

          if (!byName.error && byName.data && byName.data.length > 0) {
            data = byName.data;
          }
        }

        // 3. Fallback Upsert jika baris belum ada atau tertahan namun memiliki ID valid
        if (!data || data.length === 0) {
          const upsertAttempt = await supabase
            .from("master_materials")
            .upsert([{ id: editingId, ...fullPayload }], { onConflict: "id" })
            .select();

          if (upsertAttempt.error) {
            throw new Error(
              `Database menolak perubahan (${upsertAttempt.error.message}). Pastikan Policy RLS UPDATE pada tabel master_materials sudah diaktifkan.`
            );
          }
          if (!upsertAttempt.data || upsertAttempt.data.length === 0) {
            throw new Error(
              "Perubahan diblokir oleh Row Level Security (RLS) Supabase pada tabel master_materials. Jalankan policy akses penuh pada SQL Editor Supabase."
            );
          }
          data = upsertAttempt.data;
        }

        savedRecord = data[0];

        // Sinkronisasi nama unit pada student_reflections jika nama unit diubah
        if (
          originalUnitName &&
          originalUnitName.trim() !== unitName.trim()
        ) {
          await supabase
            .from("student_reflections")
            .update({ unit_name: unitName.trim(), updated_at: nowIso })
            .eq("unit_name", originalUnitName.trim());
        }

        // Jika materi ini merupakan evaluasi Pre-Test / Post-Test, sinkronkan judulnya di master_evaluations
        const lowerTitle = unitName.trim().toLowerCase();
        const lowerOrig = originalUnitName.trim().toLowerCase();
        if (
          lowerTitle.includes("pretest") ||
          lowerTitle.includes("pre-test") ||
          lowerTitle.includes("pre test") ||
          lowerOrig.includes("pretest") ||
          lowerOrig.includes("pre-test") ||
          lowerOrig.includes("pre test")
        ) {
          await supabase
            .from("master_evaluations")
            .update({ title: unitName.trim() })
            .eq("grade_level", Number(activeGrade))
            .eq("type", "pretest");
        } else if (
          lowerTitle.includes("posttest") ||
          lowerTitle.includes("post-test") ||
          lowerTitle.includes("post test") ||
          lowerOrig.includes("posttest") ||
          lowerOrig.includes("post-test") ||
          lowerOrig.includes("post test")
        ) {
          await supabase
            .from("master_evaluations")
            .update({ title: unitName.trim() })
            .eq("grade_level", Number(activeGrade))
            .eq("type", "posttest");
        }
      } else {
        // Mode Tambah Materi Baru
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

        if (!data || data.length === 0) {
          throw new Error(
            "Gagal menambahkan materi karena diblokir oleh Row Level Security (RLS) Supabase."
          );
        }

        savedRecord = data[0];
      }

      // Perbarui state lokal secara instan agar UI langsung menampilkan perubahan terbaru
      if (savedRecord) {
        setAllMaterials((prev) => {
          const exists = prev.some((item) => item.id === savedRecord.id);
          if (exists) {
            return prev.map((item) =>
              item.id === savedRecord.id ? savedRecord : item
            );
          }
          return [...prev, savedRecord];
        });
      }

      toast.success(
        "Modul materi berhasil disimpan & langsung aktif di aplikasi siswa!"
      );
      await fetchMaterials();
      setViewMode("list");
    } catch (err: any) {
      toast.error(
        "Gagal menyimpan materi: " +
          (err?.message || "Periksa koneksi atau izin RLS database.")
      );
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
            toast.success("Materi dihapus");
            fetchMaterials();
          } catch (err: any) {
            toast.error("Gagal menghapus materi: " + (err?.message || ""));
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const addBlock = (type: BlockType) => {
    setContentBlocks((prev) => [...prev, createDefaultBlock(type)]);
  };

  const updateBlock = (id: string, patch: Partial<ContentBlock>) => {
    setContentBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

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
    toast.success("Blok berhasil diduplikasi");
  };

  const removeBlock = (id: string) => {
    if (contentBlocks.length === 1) {
      return toast.error("Modul minimal harus memiliki 1 bagian konten.");
    }
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Statistik Analitik Materi untuk Header & Bento
  const totalBlocksActiveGrade = useMemo(() => {
    return materials.reduce(
      (acc, m) => acc + parseMaterialToBlocks(m).length,
      0
    );
  }, [materials]);

  const reflectionStats = useMemo(() => {
    const valid = allReflections.filter(
      (r) =>
        String(r.unit_name || "").toLowerCase() !== "cp_tp_read" &&
        String(r.unit_name || "").toLowerCase() !== "akhir"
    );
    const graded = valid.filter(
      (r) =>
        r.score !== null || (r.grade && String(r.grade).trim() !== "")
    ).length;
    const pct =
      valid.length > 0 ? Math.round((graded / valid.length) * 100) : 0;
    return { total: valid.length, graded, pct };
  }, [allReflections]);

  const reflectionsByUnitMap = useMemo(() => {
    const map: Record<string, { total: number; graded: number }> = {};
    allReflections.forEach((r) => {
      const uName = String(r.unit_name || "").trim();
      if (!uName) return;
      if (!map[uName]) map[uName] = { total: 0, graded: 0 };
      map[uName].total += 1;
      if (r.score !== null || (r.grade && String(r.grade).trim() !== "")) {
        map[uName].graded += 1;
      }
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
        (b) => `${b.title || ""} ${b.value || ""} ${(b.items || []).join(" ")}`
      )
      .join(" ");
    const words = textCombined.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.ceil(words / 130));
  }, [contentBlocks]);

  const handleExportMateriCSV = () => {
    const rows = [
      [
        "Jenjang Kelas",
        "Judul Unit Materi",
        "Jumlah Blok SaaS",
        "Pertanyaan Pemantik",
        "Jawaban Refleksi Siswa",
      ],
      ...allMaterials.map((m) => {
        const bLen = parseMaterialToBlocks(m).length;
        const rStat = reflectionsByUnitMap[m.unit_name] || {
          total: 0,
          graded: 0,
        };
        return [
          `Kelas ${m.grade_level}`,
          `"${String(m.unit_name || "").replace(/"/g, '""')}"`,
          bLen,
          `"${String(m.trigger_question || "").replace(/"/g, '""')}"`,
          `${rStat.graded}/${rStat.total} Dinilai`,
        ];
      }),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Kurikulum_Materi_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data Kurikulum & Modul berhasil diunduh!");
  };

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

  if (!mounted) return null;

  // ==========================================================================
  // RENDERER STUDIO LIVE PREVIEW (100% SEJAJAR DENGAN EDITOR)
  // ==========================================================================
  const renderStudioLivePreview = () => (
    <div
      className="w-full rounded-[2.5rem] border overflow-hidden transition-all duration-300 shadow-sm"
      style={{
        backgroundColor: isDark ? "#111111" : "#ffffff",
        borderColor: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="px-7 py-5 flex items-center justify-between border-b"
        style={{
          backgroundColor: isDark ? "#161616" : "#ffffff",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Live Preview Aplikasi Siswa · Kelas {activeGrade}
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-50">
          {previewDevice === "mobile" ? "Layar Mobile" : "Layar Tablet"}
        </span>
      </div>

      <div
        className="p-5 sm:p-7 transition-all duration-300"
        style={{ backgroundColor: "var(--ref-card-subtle)" }}
      >
        <div
          className={`mx-auto transition-all duration-300 rounded-[2rem] border overflow-hidden shadow-xl ${
            previewDevice === "mobile" ? "w-full max-w-[420px]" : "w-full"
          }`}
          style={{
            backgroundColor: "var(--ref-card-solid)",
            borderColor: "var(--ref-card-border)",
          }}
        >
          {imageUrl ? (
            <div className="relative h-52 w-full overflow-hidden">
              <img
                src={imageUrl}
                alt="Sampul"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#facc15]">
                    Kurikulum Kelas {activeGrade}
                  </span>
                  <span className="text-[11px] font-medium text-white/80 flex items-center gap-1">
                    · <Clock size={11} /> ~{estimatedReadMinutes} mnt baca
                  </span>
                </div>
                <h2 className="text-2xl font-light tracking-tight text-white leading-snug">
                  {unitName || "Judul Unit Pembelajaran"}
                </h2>
              </div>
            </div>
          ) : (
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: "var(--ref-dark-panel)",
                borderColor: "var(--ref-card-border)",
                color: "#ffffff",
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#facc15]">
                  Kurikulum PJOK Kelas {activeGrade}
                </span>
                <span className="text-[11px] font-medium text-white/70 flex items-center gap-1">
                  <Clock size={12} className="text-[#facc15]" /> ~
                  {estimatedReadMinutes} mnt baca
                </span>
              </div>
              <h2 className="text-2xl font-light tracking-tight leading-snug text-white">
                {unitName || "Judul Unit Pembelajaran"}
              </h2>
            </div>
          )}

          <div className="p-6 space-y-5 max-h-[720px] overflow-y-auto no-scrollbar">
            {mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl border transition-transform hover:scale-[1.01]"
                style={{
                  backgroundColor: "var(--ref-tint-sky-bg)",
                  borderColor: "var(--ref-tint-sky-border)",
                  color: "var(--ref-tint-sky-text)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-black/30">
                    <Play size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">
                      Video Pengantar Unit Tersedia
                    </p>
                    <p className="text-[11px] opacity-80 truncate max-w-[210px]">
                      {mediaUrl}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} />
              </a>
            )}

            {contentBlocks.map((b, idx) => (
              <div
                key={b.id}
                className={
                  idx > 0 && b.type === "heading" ? "pt-4 border-t" : ""
                }
                style={{ borderColor: "var(--ref-card-border)" }}
              >
                {b.type === "heading" && (
                  <h3
                    className="font-bold text-base sm:text-lg tracking-tight leading-snug"
                    style={{ color: "var(--ref-text-primary)" }}
                  >
                    {b.title || b.value || "Sub-Judul Pembahasan"}
                  </h3>
                )}

                {b.type === "paragraph" && (
                  <p
                    className="text-xs sm:text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: "var(--ref-text-secondary)" }}
                  >
                    {b.value ||
                      "Teks penjelasan paragraf akan tampil di sini..."}
                  </p>
                )}

                {b.type === "list" && (
                  <div className="space-y-2">
                    {b.title && (
                      <p
                        className="text-xs sm:text-sm font-bold"
                        style={{ color: "var(--ref-text-primary)" }}
                      >
                        {b.title}
                      </p>
                    )}
                    <div className="space-y-2 pl-1">
                      {(b.items || []).map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 text-xs sm:text-sm"
                          style={{ color: "var(--ref-text-secondary)" }}
                        >
                          <span
                            className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              backgroundColor: "var(--ref-dark-panel)",
                              color: "#facc15",
                            }}
                          >
                            {b.listStyle === "number"
                              ? `${i + 1}`
                              : b.listStyle === "alpha"
                              ? `${String.fromCharCode(97 + i)}`
                              : "•"}
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
                    className="rounded-2xl p-4 border group"
                    style={{
                      backgroundColor: "var(--ref-tint-emerald-bg)",
                      borderColor: "var(--ref-tint-emerald-border)",
                    }}
                  >
                    <summary
                      className="font-bold text-xs sm:text-sm cursor-pointer list-none flex items-center justify-between gap-2"
                      style={{ color: "var(--ref-tint-emerald-text)" }}
                    >
                      <span>{b.title || "Judul Kotak Lipat (Accordion)"}</span>
                      <ChevronDown size={16} className="shrink-0" />
                    </summary>
                    <div
                      className="mt-3 pt-3 border-t space-y-2.5 text-xs sm:text-sm"
                      style={{ borderColor: "var(--ref-tint-emerald-border)" }}
                    >
                      {b.collapsibleMode === "text" ? (
                        <p
                          className="leading-relaxed whitespace-pre-line"
                          style={{ color: "var(--ref-text-primary)" }}
                        >
                          {b.value || "Isi penjelasan di dalam kotak lipat..."}
                        </p>
                      ) : (
                        (b.collapsibleItems || []).map((ci, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-2.5 rounded-xl"
                            style={{ backgroundColor: "var(--ref-card-solid)" }}
                          >
                            <span
                              className="font-bold block text-xs"
                              style={{ color: "var(--ref-text-primary)" }}
                            >
                              {ci.label}
                            </span>
                            <span
                              className="text-xs leading-relaxed"
                              style={{ color: "var(--ref-text-secondary)" }}
                            >
                              {ci.text}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                )}

                {b.type === "figure" && (
                  <div className="space-y-2">
                    <div
                      className="rounded-2xl p-4 border space-y-2.5"
                      style={{
                        backgroundColor:
                          b.figureTheme === "blue"
                            ? "var(--ref-tint-sky-bg)"
                            : b.figureTheme === "neutral"
                            ? "var(--ref-card-subtle)"
                            : "var(--ref-tint-emerald-bg)",
                        borderColor: "var(--ref-card-border)",
                      }}
                    >
                      {b.overline && (
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-widest block"
                          style={{ color: "var(--ref-text-secondary)" }}
                        >
                          {b.overline}
                        </span>
                      )}
                      {b.title && (
                        <h4
                          className="font-bold text-sm"
                          style={{ color: "var(--ref-text-primary)" }}
                        >
                          {b.title}
                        </h4>
                      )}
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.title || "Ilustrasi"}
                          className="w-full rounded-xl object-contain max-h-64 bg-white/70 dark:bg-black/30"
                        />
                      ) : (
                        <div
                          className="py-10 text-center text-xs border border-dashed rounded-xl"
                          style={{
                            borderColor: "var(--ref-card-border)",
                            color: "var(--ref-text-secondary)",
                          }}
                        >
                          Unggah gambar pada blok #{idx + 1} di sebelah kiri
                        </div>
                      )}
                    </div>
                    {b.caption && (
                      <p
                        className="text-[11px] italic leading-relaxed px-1"
                        style={{ color: "var(--ref-text-secondary)" }}
                      >
                        {b.caption}
                      </p>
                    )}
                  </div>
                )}

                {b.type === "table" && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {b.tableTitle && (
                        <h4
                          className="font-bold text-sm"
                          style={{ color: "var(--ref-text-primary)" }}
                        >
                          {b.tableTitle}
                        </h4>
                      )}
                      {b.hasCategoryFilter &&
                        (b.tableVariants?.length || 0) > 1 && (
                          <div className="flex items-center gap-1">
                            {b.tableVariants?.map((v, vIdx) => {
                              const active =
                                (previewSelectedVariant[b.id] || 0) === vIdx;
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
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer"
                                  style={{
                                    backgroundColor: active
                                      ? "#facc15"
                                      : "var(--ref-card-subtle)",
                                    borderColor: "var(--ref-card-border)",
                                    color: active
                                      ? "#18181b"
                                      : "var(--ref-text-primary)",
                                  }}
                                >
                                  {v.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                    </div>

                    {b.tableDescription && (
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--ref-text-secondary)" }}
                      >
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
                        <div
                          className="overflow-x-auto rounded-xl border"
                          style={{ borderColor: "var(--ref-card-border)" }}
                        >
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr
                                style={{
                                  backgroundColor: "var(--ref-card-subtle)",
                                }}
                              >
                                {activeVar.headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="p-2.5 font-bold border-b"
                                    style={{
                                      borderColor: "var(--ref-card-border)",
                                      color: "var(--ref-text-primary)",
                                    }}
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
                                  className="border-b last:border-b-0"
                                  style={{
                                    borderColor: "var(--ref-card-border)",
                                  }}
                                >
                                  {r.map((c, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className={`p-2.5 align-top leading-relaxed ${
                                        cIdx === 0 ? "font-bold" : ""
                                      }`}
                                      style={{
                                        color:
                                          cIdx === 0
                                            ? "var(--ref-text-primary)"
                                            : "var(--ref-text-secondary)",
                                      }}
                                    >
                                      {c}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {b.tableFootnote && (
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--ref-text-secondary)" }}
                      >
                        {b.tableFootnote}
                      </p>
                    )}
                  </div>
                )}

                {b.type === "tempo_simulator" && (
                  <div
                    className="rounded-2xl p-4 border space-y-4"
                    style={{
                      backgroundColor: "var(--ref-card-subtle)",
                      borderColor: "var(--ref-card-border)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className="font-bold text-xs sm:text-sm"
                        style={{ color: "var(--ref-text-primary)" }}
                      >
                        {b.simulatorTitle ||
                          "Simulasi Pola Tempo & Intensitas"}
                      </h4>
                      <Activity size={15} className="text-[#ca8a04]" />
                    </div>

                    {(() => {
                      const methods = b.tempoMethods || [];
                      const mIdx = previewTempoTab[b.id] || 0;
                      const currentMethod = methods[mIdx] || methods[0];
                      const sIdx = previewTempoStep[b.id] || 0;
                      if (!currentMethod) return null;
                      const currentStep =
                        currentMethod.steps[sIdx] || currentMethod.steps[0];

                      return (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {methods.map((m, idx) => {
                              const active = idx === mIdx;
                              return (
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
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                                  style={{
                                    backgroundColor: active
                                      ? "var(--ref-dark-panel)"
                                      : "var(--ref-card-solid)",
                                    borderColor: "var(--ref-card-border)",
                                    color: active
                                      ? "#ffffff"
                                      : "var(--ref-text-primary)",
                                  }}
                                >
                                  {m.name}
                                </button>
                              );
                            })}
                          </div>

                          <div
                            className="p-3.5 rounded-xl border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          >
                            <div
                              className="grid gap-2 items-end h-28 pt-2"
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
                                const levelTag =
                                  st.level === 3
                                    ? "Tinggi"
                                    : st.level === 2
                                    ? "Sedang"
                                    : "Ringan";

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
                                    className="flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer group focus:outline-none"
                                  >
                                    <span
                                      className="text-[9px] font-bold opacity-75"
                                      style={{
                                        color: "var(--ref-text-secondary)",
                                      }}
                                    >
                                      {levelTag}
                                    </span>
                                    <div
                                      className="w-full max-w-[36px] flex-1 rounded-lg flex items-end p-0.5"
                                      style={{
                                        backgroundColor:
                                          "var(--ref-card-subtle)",
                                      }}
                                    >
                                      <div
                                        className="w-full rounded-md transition-all duration-300"
                                        style={{
                                          height: `${heightPct}%`,
                                          backgroundColor: isCurrent
                                            ? "#facc15"
                                            : "var(--ref-dark-panel)",
                                        }}
                                      />
                                    </div>
                                    <span
                                      className="text-[10px] font-bold text-center leading-tight break-words w-full"
                                      style={{
                                        color: isCurrent
                                          ? "var(--ref-text-primary)"
                                          : "var(--ref-text-secondary)",
                                      }}
                                    >
                                      {st.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <div
                              className="mt-3 pt-3 border-t flex items-center justify-between gap-2"
                              style={{
                                borderColor: "var(--ref-card-border)",
                              }}
                            >
                              <span
                                className="text-xs font-bold"
                                style={{ color: "var(--ref-text-primary)" }}
                              >
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
                                      Math.max(1, currentMethod.steps.length),
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                                style={{
                                  backgroundColor: "#facc15",
                                  color: "#18181b",
                                }}
                              >
                                Tahap Berikutnya →
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {b.simulatorFootnote && (
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--ref-text-secondary)" }}
                      >
                        {b.simulatorFootnote}
                      </p>
                    )}
                  </div>
                )}

                {b.type === "video" && (
                  <div
                    className="p-4 rounded-2xl border space-y-2.5"
                    style={{
                      backgroundColor: "var(--ref-tint-sky-bg)",
                      borderColor: "var(--ref-tint-sky-border)",
                    }}
                  >
                    <h4
                      className="font-bold text-xs sm:text-sm"
                      style={{ color: "var(--ref-tint-sky-text)" }}
                    >
                      {b.title || "Video Rujukan Pembelajaran"}
                    </h4>
                    {b.value && (
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--ref-text-primary)" }}
                      >
                        {b.value}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewVideoLoaded({
                          ...previewVideoLoaded,
                          [b.id]: !previewVideoLoaded[b.id],
                        })
                      }
                      className="px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: "var(--ref-dark-panel)",
                        color: "#ffffff",
                      }}
                    >
                      <Play size={13} className="text-[#facc15]" />
                      <span>{b.videoButtonLabel || "Putar Video"}</span>
                    </button>
                    {previewVideoLoaded[b.id] && b.videoUrl && (
                      <div
                        className="p-2.5 rounded-xl text-xs font-medium break-all"
                        style={{ backgroundColor: "var(--ref-card-solid)" }}
                      >
                        Tautan Video: {b.videoUrl}
                      </div>
                    )}
                  </div>
                )}

                {b.type === "callout" && (
                  <div
                    className="p-4 rounded-2xl border-l-4 space-y-1"
                    style={{
                      backgroundColor: "var(--ref-tint-amber-bg)",
                      borderLeftColor: "#facc15",
                    }}
                  >
                    <h4
                      className="font-bold text-xs sm:text-sm"
                      style={{ color: "var(--ref-tint-amber-text)" }}
                    >
                      {b.title || "Catatan Penting"}
                    </h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--ref-text-primary)" }}
                    >
                      {b.value}
                    </p>
                  </div>
                )}

                {b.type === "quiz" && (
                  <div
                    className="p-4 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: "var(--ref-card-subtle)",
                      borderColor: "var(--ref-card-border)",
                    }}
                  >
                    <h4
                      className="font-bold text-xs sm:text-sm"
                      style={{ color: "var(--ref-text-primary)" }}
                    >
                      {b.title || "Kuis Cek Pemahaman"}
                    </h4>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--ref-text-primary)" }}
                    >
                      {b.question || "Pertanyaan latihan..."}
                    </p>
                    <div className="space-y-1.5">
                      {(b.options || []).map((opt) => {
                        const chosen = previewQuizSelected[b.id] === opt.key;
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
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: chosen
                                ? isCorrect
                                  ? "var(--ref-tint-emerald-bg)"
                                  : "var(--ref-tint-rose-bg)"
                                : "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                              color: "var(--ref-text-primary)",
                            }}
                          >
                            <strong>{opt.key}.</strong>{" "}
                            {opt.text || `Opsi ${opt.key}`}
                          </button>
                        );
                      })}
                    </div>
                    {previewQuizSelected[b.id] && b.explanation && (
                      <div
                        className="p-2.5 rounded-xl text-xs"
                        style={{
                          backgroundColor: "var(--ref-tint-emerald-bg)",
                          color: "var(--ref-tint-emerald-text)",
                        }}
                      >
                        <strong>Kunci ({b.correctOption}):</strong>{" "}
                        {b.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div
              className="mt-6 pt-5 border-t space-y-3"
              style={{ borderColor: "var(--ref-card-border)" }}
            >
              <div
                className="p-4 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: "var(--ref-tint-amber-bg)",
                  borderColor: "var(--ref-tint-amber-border)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--ref-tint-amber-text)" }}
                  >
                    Tugas Analisis & Refleksi Siswa
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Dinilai Guru (A–D)
                  </span>
                </div>
                <p
                  className="text-xs font-semibold leading-relaxed"
                  style={{ color: "var(--ref-text-primary)" }}
                >
                  {triggerQuestion ||
                    "Pertanyaan pemantik yang Anda ketik di kiri akan muncul di sini untuk dijawab siswa..."}
                </p>
                <div
                  className="p-3 rounded-xl border text-[11px] opacity-75"
                  style={{
                    backgroundColor: "var(--ref-card-solid)",
                    borderColor: "var(--ref-card-border)",
                    color: "var(--ref-text-secondary)",
                  }}
                >
                  Kolom jawaban siswa di aplikasi mobile...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // VIEW MODE: FORM (FULL-WIDTH SAAS BUILDER + LIVE STUDIO PREVIEW)
  // ==========================================================================
  if (viewMode === "form") {
    return (
      <div className="w-full pt-2 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* ARCHITECTURAL HEADER FOR SAAS BUILDER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-8 relative z-20">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: isDark ? "#111111" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                <ArrowLeft size={15} /> Kembali ke Daftar Materi
              </button>

              <div
                className="flex items-center p-1 rounded-2xl border"
                style={{
                  backgroundColor: isDark ? "#111111" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                {[
                  { key: "editor", icon: Edit3, label: "Editor" },
                  { key: "split", icon: Columns, label: "Split Preview" },
                  { key: "preview", icon: Eye, label: "Pratinjau" },
                ].map((m) => {
                  const IconC = m.icon;
                  const active = workspaceLayout === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setWorkspaceLayout(m.key as any)}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      style={{
                        backgroundColor: active ? "#facc15" : "transparent",
                        color: active ? "#000000" : "inherit",
                      }}
                    >
                      <IconC size={13} /> {m.label}
                    </button>
                  );
                })}
              </div>

              {workspaceLayout !== "editor" && (
                <div
                  className="flex items-center p-1 rounded-2xl border"
                  style={{
                    backgroundColor: isDark ? "#111111" : "#ffffff",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor:
                        previewDevice === "mobile"
                          ? "var(--ref-dark-panel)"
                          : "transparent",
                      color:
                        previewDevice === "mobile" ? "#ffffff" : "inherit",
                    }}
                  >
                    <Smartphone size={13} /> Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("tablet")}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor:
                        previewDevice === "tablet"
                          ? "var(--ref-dark-panel)"
                          : "transparent",
                      color:
                        previewDevice === "tablet" ? "#ffffff" : "inherit",
                    }}
                  >
                    <Tablet size={13} /> Tablet
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-2 opacity-50">
              <BookOpen size={16} /> SaaS Content Builder · Kurikulum Kelas{" "}
              {activeGrade}
            </div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tighter leading-tight">
              {editingId ? "Edit" : "Susun"}{" "}
              <span className="font-semibold">
                {unitName || "Modul Pembelajaran"}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-end gap-8 shrink-0">
            <div>
              <div className="text-5xl md:text-6xl font-light tracking-tighter leading-none">
                {contentBlocks.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-50 mt-2">
                Blok Konten
              </div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-light tracking-tighter leading-none">
                ~{estimatedReadMinutes}m
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-50 mt-2">
                Waktu Baca
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] text-white"
              style={{ backgroundColor: "#10b981" }}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Modul"}
            </button>
          </div>
        </div>

        {/* GRID UTAMA (SEJAJAR LURUS KIRI & KANAN) */}
        <div
          className={`grid gap-6 items-start ${
            workspaceLayout === "split"
              ? "grid-cols-1 xl:grid-cols-12"
              : "grid-cols-1"
          }`}
        >
          {/* SISI KIRI: FORM EDITOR MODUL */}
          {workspaceLayout !== "preview" && (
            <form
              onSubmit={handleSubmit}
              className={`${
                workspaceLayout === "split" ? "xl:col-span-7" : "w-full"
              } rounded-[2.5rem] p-8 md:p-10 border space-y-8 relative overflow-hidden shadow-sm`}
              style={{
                backgroundColor: isDark ? "#111111" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {/* BAGIAN 1: IDENTITAS & SAMPUL MODUL */}
              <div className="space-y-5 relative z-10">
                <div
                  className="flex items-center justify-between border-b pb-4"
                  style={{ borderColor: "var(--ref-card-border)" }}
                >
                  <h3 className="text-2xl font-light tracking-tight">
                    1. Identitas &{" "}
                    <span className="font-semibold">Sampul Unit</span>
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                    Kelas {activeGrade}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Judul Unit Materi
                  </label>
                  <input
                    required
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    type="text"
                    placeholder="Contoh: Daya Tahan Jantung Paru dan Peredaran Darah"
                    className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight outline-none"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Pertanyaan Pemantik & Refleksi Siswa (Tampil di Akhir Modul)
                  </label>
                  <textarea
                    value={triggerQuestion}
                    onChange={(e) => setTriggerQuestion(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Mengapa pemula yang cepat lelah lebih sesuai memulai latihan berselang daripada langsung berlari cepat terus-menerus?"
                    className="w-full p-4 rounded-2xl text-sm font-medium border outline-none resize-y"
                    style={{
                      backgroundColor: "var(--ref-card-subtle)",
                      borderColor: "var(--ref-card-border)",
                      color: "var(--ref-text-primary)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                      Gambar Sampul Unit (edufit_media)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={heroFileInputRef}
                      onChange={handleHeroImageUpload}
                      className="hidden"
                    />
                    {imageUrl ? (
                      <div
                        className="relative w-full h-36 rounded-2xl border overflow-hidden group"
                        style={{ borderColor: "var(--ref-card-border)" }}
                      >
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => heroFileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-white text-black rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Ganti Sampul
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="px-3.5 py-2 bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
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
                        className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-colors hover:opacity-80"
                        style={{
                          borderColor: "var(--ref-card-border)",
                          backgroundColor: "var(--ref-card-subtle)",
                        }}
                      >
                        <UploadCloud className="w-7 h-7 mb-1.5 opacity-60" />
                        <span className="text-xs font-bold">
                          {isUploadingHero
                            ? "Mengunggah..."
                            : "Pilih File Gambar Sampul"}
                        </span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                      Tautan Video Pengantar (Opsional)
                    </label>
                    <input
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 rounded-2xl text-xs border outline-none"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                      }}
                    />
                    <p
                      className="text-[11px] mt-3 p-3.5 rounded-2xl leading-relaxed"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        color: "var(--ref-text-secondary)",
                      }}
                    >
                      Gunakan bagian <strong>2. Susunan Isi Materi</strong> di
                      bawah untuk menyisipkan sub-judul, paragraf, gambar
                      ber-caption, tabel, atau grafik latihan.
                    </p>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: SUSUNAN BLOK ISI MATERI */}
              <div className="space-y-5 relative z-10">
                <div
                  className="flex items-center justify-between border-b pb-4"
                  style={{ borderColor: "var(--ref-card-border)" }}
                >
                  <div>
                    <h3 className="text-2xl font-light tracking-tight">
                      2. Susunan{" "}
                      <span className="font-semibold">
                        Isi Materi ({contentBlocks.length} Bagian)
                      </span>
                    </h3>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--ref-text-secondary)" }}
                    >
                      Atur urutan bagian materi menggunakan tombol panah
                      atas/bawah pada setiap kartu.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="rounded-3xl p-5 border space-y-4"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between pb-3 border-b"
                        style={{ borderColor: "var(--ref-card-border)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center"
                            style={{
                              backgroundColor: "var(--ref-dark-panel)",
                              color: "#facc15",
                            }}
                          >
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {block.type === "heading" && "Sub-Judul Bab"}
                            {block.type === "paragraph" &&
                              "Paragraf Penjelasan"}
                            {block.type === "list" &&
                              "Daftar Poin / Langkah Urutan"}
                            {block.type === "collapsible" &&
                              "Kotak Lipat (Accordion)"}
                            {block.type === "figure" &&
                              "Gambar / Diagram + Nama"}
                            {block.type === "table" && "Tabel Data + Nama"}
                            {block.type === "tempo_simulator" &&
                              "Grafik Simulasi Tempo & Intensitas"}
                            {block.type === "video" && "Video Demonstrasi"}
                            {block.type === "callout" &&
                              "Kotak Catatan Penting"}
                            {block.type === "quiz" && "Kuis Cek Pemahaman"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "up")}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
                            title="Geser ke Atas"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "down")}
                            disabled={index === contentBlocks.length - 1}
                            className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
                            title="Geser ke Bawah"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateBlock(index)}
                            className="p-1.5 rounded-lg cursor-pointer"
                            title="Duplikat Bagian"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1.5 rounded-lg text-red-500 cursor-pointer"
                            title="Hapus Bagian"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.title ?? block.value}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              title: e.target.value,
                              value: e.target.value,
                            })
                          }
                          placeholder="Ketik sub-judul pembahasan (Cth: 1. Konsep Daya Tahan Jantung-Paru)..."
                          className="w-full px-4 py-3 rounded-2xl text-sm font-bold border outline-none"
                          style={{
                            backgroundColor: "var(--ref-card-solid)",
                            borderColor: "var(--ref-card-border)",
                          }}
                        />
                      )}

                      {block.type === "paragraph" && (
                        <textarea
                          value={block.value}
                          onChange={(e) =>
                            updateBlock(block.id, { value: e.target.value })
                          }
                          rows={4}
                          placeholder="Ketik penjelasan materi di sini..."
                          className="w-full p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border outline-none resize-y"
                          style={{
                            backgroundColor: "var(--ref-card-solid)",
                            borderColor: "var(--ref-card-border)",
                          }}
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
                              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                            {["number", "bullet", "alpha"].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    listStyle: st as any,
                                  })
                                }
                                className="px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer"
                                style={{
                                  backgroundColor:
                                    (block.listStyle || "bullet") === st
                                      ? "#facc15"
                                      : "var(--ref-card-solid)",
                                  color:
                                    (block.listStyle || "bullet") === st
                                      ? "#18181b"
                                      : "var(--ref-text-primary)",
                                  borderColor: "var(--ref-card-border)",
                                }}
                              >
                                {st === "number"
                                  ? "1. Angka"
                                  : st === "bullet"
                                  ? "• Poin"
                                  : "a. Abjad"}
                              </button>
                            ))}
                          </div>
                          {(block.items || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold w-5 text-center">
                                {block.listStyle === "number"
                                  ? `${i + 1}.`
                                  : block.listStyle === "alpha"
                                  ? `${String.fromCharCode(97 + i)}.`
                                  : "•"}
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
                                className="w-full px-3.5 py-2 rounded-xl text-xs border"
                                style={{
                                  backgroundColor: "var(--ref-card-solid)",
                                  borderColor: "var(--ref-card-border)",
                                }}
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
                                className="p-1.5 text-red-500 cursor-pointer"
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
                            className="text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                              placeholder="Judul Kotak Lipat (Accordion)..."
                              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                            <div className="flex items-center gap-1">
                              {[
                                { k: "text", l: "Teks Paragraf Bebas" },
                                { k: "steps", l: "Daftar Tahapan" },
                              ].map((m) => (
                                <button
                                  key={m.k}
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      collapsibleMode: m.k as any,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer"
                                  style={{
                                    backgroundColor:
                                      (block.collapsibleMode || "steps") === m.k
                                        ? "#facc15"
                                        : "var(--ref-card-solid)",
                                    color:
                                      (block.collapsibleMode || "steps") === m.k
                                        ? "#18181b"
                                        : "var(--ref-text-primary)",
                                    borderColor: "var(--ref-card-border)",
                                  }}
                                >
                                  {m.l}
                                </button>
                              ))}
                            </div>
                          </div>

                          {block.collapsibleMode === "text" ? (
                            <textarea
                              rows={3}
                              value={block.value || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { value: e.target.value })
                              }
                              placeholder="Tuliskan isi penjelasan lengkap di dalam kotak lipat ini..."
                              className="w-full p-3.5 rounded-xl text-xs leading-relaxed border outline-none resize-y"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                          ) : (
                            <div className="space-y-2">
                              {(block.collapsibleItems || []).map(
                                (ci, cIdx) => (
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
                                      className="w-28 px-3 py-2 rounded-xl text-xs font-bold border"
                                      style={{
                                        backgroundColor:
                                          "var(--ref-card-solid)",
                                        borderColor: "var(--ref-card-border)",
                                      }}
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
                                      className="flex-1 px-3 py-2 rounded-xl text-xs border"
                                      style={{
                                        backgroundColor:
                                          "var(--ref-card-solid)",
                                        borderColor: "var(--ref-card-border)",
                                      }}
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
                                      className="p-2 text-red-500 cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                )
                              )}
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
                                className="text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={13} /> Tambah Tahap
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === "figure" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={block.overline || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  overline: e.target.value,
                                })
                              }
                              placeholder="Nomor/Label (Cth: GAMBAR 1.1)"
                              className="px-3 py-2 rounded-xl text-xs font-bold border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) =>
                                updateBlock(block.id, { title: e.target.value })
                              }
                              placeholder="Judul / Nama Gambar"
                              className="px-3 py-2 rounded-xl text-xs font-bold border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <label
                              className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 text-white"
                              style={{ backgroundColor: "#10b981" }}
                            >
                              <UploadCloud size={15} />
                              <span>
                                {uploadingBlockId === block.id
                                  ? "Mengunggah..."
                                  : "Pilih File Gambar"}
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
                              placeholder="Atau tempel URL gambar..."
                              className="w-full px-3 py-2 rounded-xl text-xs border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                          </div>
                          <input
                            type="text"
                            value={block.caption || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { caption: e.target.value })
                            }
                            placeholder="Keterangan bawah / Caption sumber gambar..."
                            className="w-full px-3 py-2 rounded-xl text-xs border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
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
                              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
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

                          {(block.tableVariants || []).map((variant, vIdx) => (
                            <div
                              key={variant.id}
                              className="p-3 rounded-xl border space-y-2"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
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
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                    style={{
                                      backgroundColor:
                                        "var(--ref-tint-emerald-bg)",
                                      color: "var(--ref-tint-emerald-text)",
                                    }}
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
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                    style={{
                                      backgroundColor: "var(--ref-tint-sky-bg)",
                                      color: "var(--ref-tint-sky-text)",
                                    }}
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
                                          className="p-1.5 border"
                                          style={{
                                            borderColor:
                                              "var(--ref-card-border)",
                                          }}
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
                                            className="p-1.5 border"
                                            style={{
                                              borderColor:
                                                "var(--ref-card-border)",
                                            }}
                                          >
                                            <input
                                              type="text"
                                              value={cell}
                                              onChange={(e) => {
                                                const next = [
                                                  ...(block.tableVariants ||
                                                    []),
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
                            placeholder="Catatan kaki tabel (Opsional)..."
                            className="w-full px-3 py-2 rounded-xl text-xs border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
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
                            className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />

                          {(() => {
                            const methods = block.tempoMethods || [];
                            const activeMIdx = editorTempoTab[block.id] || 0;
                            const activeMethod =
                              methods[activeMIdx] || methods[0];

                            return (
                              <div
                                className="p-3.5 rounded-xl border space-y-3"
                                style={{
                                  backgroundColor: "var(--ref-card-solid)",
                                  borderColor: "var(--ref-card-border)",
                                }}
                              >
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
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer"
                                        style={{
                                          backgroundColor:
                                            activeMIdx === mIdx
                                              ? "#facc15"
                                              : "var(--ref-card-subtle)",
                                          color:
                                            activeMIdx === mIdx
                                              ? "#18181b"
                                              : "var(--ref-text-primary)",
                                          borderColor: "var(--ref-card-border)",
                                        }}
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
                                            { label: "Pemulihan", level: 1 },
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
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                    style={{
                                      backgroundColor:
                                        "var(--ref-tint-emerald-bg)",
                                      color: "var(--ref-tint-emerald-text)",
                                    }}
                                  >
                                    + Metode Baru
                                  </button>
                                </div>

                                {activeMethod && (
                                  <div
                                    className="space-y-2.5 pt-2 border-t"
                                    style={{
                                      borderColor: "var(--ref-card-border)",
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        type="text"
                                        value={activeMethod.name}
                                        onChange={(e) => {
                                          const next = [...methods];
                                          next[activeMIdx].name =
                                            e.target.value;
                                          updateBlock(block.id, {
                                            tempoMethods: next,
                                          });
                                        }}
                                        placeholder="Nama Metode..."
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                                        style={{
                                          backgroundColor:
                                            "var(--ref-card-subtle)",
                                          borderColor: "var(--ref-card-border)",
                                        }}
                                      />
                                      <span className="text-[11px] opacity-70">
                                        Atur label & tinggi batang grafik:
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {activeMethod.steps.map((st, sIdx) => (
                                        <div
                                          key={sIdx}
                                            className="p-2.5 rounded-xl border space-y-2"
                                          style={{
                                            backgroundColor:
                                              "var(--ref-card-subtle)",
                                            borderColor:
                                              "var(--ref-card-border)",
                                          }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold opacity-60">
                                              Tahap {sIdx + 1}
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
                                                className="text-red-500"
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
                                            className="w-full px-2.5 py-1 rounded-lg text-xs font-bold border"
                                            style={{
                                              backgroundColor:
                                                "var(--ref-card-solid)",
                                              borderColor:
                                                "var(--ref-card-border)",
                                            }}
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
                                                className="py-1 rounded-md text-[10px] font-bold cursor-pointer"
                                                style={{
                                                  backgroundColor:
                                                    st.level === opt.lv
                                                      ? "var(--ref-dark-panel)"
                                                      : "var(--ref-card-solid)",
                                                  color:
                                                    st.level === opt.lv
                                                      ? "#fff"
                                                      : "var(--ref-text-secondary)",
                                                }}
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
                                      className="text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={13} /> Tambah Batang Tahap
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
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
                              className="px-3 py-2 rounded-xl text-xs font-bold border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                            <input
                              type="text"
                              value={block.videoUrl || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  videoUrl: e.target.value,
                                })
                              }
                              placeholder="URL YouTube (https://...)"
                              className="px-3 py-2 rounded-xl text-xs border"
                              style={{
                                backgroundColor: "var(--ref-card-solid)",
                                borderColor: "var(--ref-card-border)",
                              }}
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={block.value || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { value: e.target.value })
                            }
                            placeholder="Panduan pengamatan video untuk siswa..."
                            className="w-full p-3 rounded-xl text-xs border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
                        </div>
                      )}

                      {block.type === "callout" && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={block.title || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { title: e.target.value })
                            }
                            placeholder="Judul Kotak Catatan (Cth: Tips Keselamatan / Catatan Praktik)"
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
                          <textarea
                            rows={2}
                            value={block.value || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { value: e.target.value })
                            }
                            placeholder="Isi catatan penting..."
                            className="w-full p-3 rounded-xl text-xs border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
                        </div>
                      )}

                      {block.type === "quiz" && (
                        <div className="space-y-2.5">
                          <input
                            type="text"
                            value={block.question || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                question: e.target.value,
                              })
                            }
                            placeholder="Pertanyaan Kuis Cek Pemahaman..."
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
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
                                  className="w-7 h-7 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                                  style={{
                                    backgroundColor:
                                      block.correctOption === opt.key
                                        ? "#facc15"
                                        : "var(--ref-card-solid)",
                                    color:
                                      block.correctOption === opt.key
                                        ? "#18181b"
                                        : "var(--ref-text-secondary)",
                                  }}
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
                                  placeholder={`Jawaban ${opt.key}...`}
                                  className="w-full px-3 py-1.5 rounded-xl text-xs border"
                                  style={{
                                    backgroundColor: "var(--ref-card-solid)",
                                    borderColor: "var(--ref-card-border)",
                                  }}
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
                            placeholder="Penjelasan pembahasan kunci jawaban..."
                            className="w-full px-3 py-2 rounded-xl text-xs border"
                            style={{
                              backgroundColor: "var(--ref-card-solid)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* PALET TOMBOL TAMBAH BAGIAN MATERI */}
                <div
                  className="p-5 rounded-3xl border space-y-3"
                  style={{
                    backgroundColor: "var(--ref-card-subtle)",
                    borderColor: "var(--ref-card-border)",
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-widest block"
                    style={{ color: "var(--ref-text-secondary)" }}
                  >
                    + Tambahkan Komponen Baru ke Dalam Materi:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { t: "heading", icon: Heading, l: "Sub-Judul Bab" },
                      { t: "paragraph", icon: AlignLeft, l: "Paragraf" },
                      { t: "list", icon: ListOrdered, l: "Daftar / Urutan" },
                      {
                        t: "collapsible",
                        icon: FolderOpen,
                        l: "Kotak Lipat (Accordion)",
                      },
                      {
                        t: "figure",
                        icon: ImageIcon,
                        l: "Gambar + Caption",
                      },
                      { t: "table", icon: TableIcon, l: "Tabel Data" },
                      {
                        t: "tempo_simulator",
                        icon: Activity,
                        l: "Grafik Tempo Latihan",
                      },
                      { t: "video", icon: Video, l: "Video Demonstrasi" },
                      {
                        t: "callout",
                        icon: MessageSquareWarning,
                        l: "Catatan Penting",
                      },
                      { t: "quiz", icon: HelpCircle, l: "Kuis Pemahaman" },
                    ].map((btn) => {
                      const IconB = btn.icon;
                      return (
                        <button
                          key={btn.t}
                          type="button"
                          onClick={() => addBlock(btn.t as BlockType)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
                          style={{
                            backgroundColor: "var(--ref-card-solid)",
                            borderColor: "var(--ref-card-border)",
                            color: "var(--ref-text-primary)",
                          }}
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

          {/* SISI KANAN: STUDIO LIVE PREVIEW */}
          {workspaceLayout !== "editor" && (
            <div
              className={
                workspaceLayout === "split"
                  ? "xl:col-span-5 xl:sticky xl:top-28 w-full"
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
  // VIEW MODE: LIST MATERI ("THE MASTERPIECE ADMINISTRATOR")
  // ==========================================================================
  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <BookOpen size={16} /> SaaS Content Management System • Kurikulum
            Kelas {activeGrade}
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Materi & <br />
            <span className="font-semibold">Refleksi Siswa</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : materials.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Unit Kelas {activeGrade}
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {isLoading ? "—" : totalBlocksActiveGrade}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Blok Konten SaaS
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : reflectionStats.total}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Jawaban Refleksi
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI MATERI (MURNI GARIS-GARIS TANPA PILL BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Cakupan Seluruh Jenjang */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Total Kurikulum</span>
            <span>Kelas 10–12</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading ? "—" : `${allMaterials.length} Modul`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
              Fase E & F
            </span>
          </div>
        </div>

        {/* Bar 2: Refleksi Dinilai Guru */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Penilaian Guru</span>
            <span>Grade A–D</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : `${reflectionStats.graded} Dinilai`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {reflectionStats.pct}% Tuntas
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kepadatan Komponen SaaS</span>
            <span>Kelas {activeGrade}</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 border relative overflow-hidden flex items-center justify-between"
            style={{
              backgroundColor: "var(--ref-card-solid)",
              borderColor: "var(--ref-card-border)",
              backgroundImage: "var(--ref-stripe-pattern)",
            }}
          >
            <span
              className="text-2xl font-light tracking-tight relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              {isLoading ? "—" : `${totalBlocksActiveGrade} Blok Aktif`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              Sinkron Mobile
            </span>
          </div>
        </div>

        {/* Bar 4: Soal Pemantik Aktif */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Pemantik</span>
            <span>Refleksi</span>
          </div>
          <div
            className="h-14 rounded-2xl px-5 flex items-center justify-center border"
            style={{
              backgroundColor: "var(--ref-card-solid)",
              borderColor: "var(--ref-card-border)",
              color: "var(--ref-text-primary)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading
                ? "—"
                : `${
                    materials.filter((m) =>
                      String(m.trigger_question || "").trim()
                    ).length
                  }/${materials.length}`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): PILIH JENJANG KELAS & LOMPAT CEPAT EDITOR */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-visible flex flex-col justify-between min-h-[390px] border group"
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.08] rounded-[2.5rem] overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 2px, transparent 2px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-light tracking-tight">
                Kendali Materi
              </h2>
              <button
                type="button"
                onClick={handleExportMateriCSV}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: "var(--ref-card-subtle)",
                  borderColor: "var(--ref-card-border)",
                }}
                title="Unduh Data Kurikulum CSV"
              >
                <Download size={16} />
              </button>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Pilih tingkatan kelas atau lompat cepat ke editor unit materi.
            </p>

            {/* Segmented Filter Kelas (Kuning Emas = Kelas Aktif) */}
            <div
              className="flex gap-1.5 p-1.5 rounded-full mb-6"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {[10, 11, 12].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGrade(g)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      activeGrade === g ? "#facc15" : "transparent",
                    color: activeGrade === g ? "#000" : "inherit",
                    opacity: activeGrade === g ? 1 : 0.5,
                  }}
                >
                  Kelas {g}
                </button>
              ))}
            </div>

            {/* Bottom-Bordered Custom Dropdown Lompat Cepat Unit Materi */}
            <div className="relative w-full mb-6" ref={quickJumpRef}>
              <div
                onClick={() => setIsQuickJumpOpen(!isQuickJumpOpen)}
                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  Buka Cepat ({materials.length} Unit Kelas {activeGrade})
                </span>
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
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
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-60 overflow-y-auto no-scrollbar"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
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
                          className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors flex items-center justify-between ${
                            isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                          }`}
                        >
                          <span className="truncate pr-3">
                            0{idx + 1}. {m.unit_name}
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
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white relative z-10"
            style={{ backgroundColor: "#10b981" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Modul Materi Baru
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): GRAFIK BATANG VERTIKAL BERTITIK KOMPONEN PER UNIT */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[390px] border"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
              <Layers size={16} /> Kepadatan Blok Konten per Unit
            </div>
            <span className="text-xs font-bold opacity-50">
              Klik batang untuk edit
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : totalBlocksActiveGrade}
            </div>
            <div className="text-sm font-semibold opacity-50 mb-1">
              Total Blok SaaS Kelas {activeGrade}
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

                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => openEditForm(mat)}
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${mat.unit_name}: ${bCount} Blok Konten`}
                    >
                      <span className="text-[11px] font-bold opacity-75">
                        {bCount}b
                      </span>
                      <div
                        className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px]"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(24,24,27,0.07)",
                        }}
                      >
                        <div
                          className="w-full rounded-full transition-all duration-500 group-hover:scale-y-105"
                          style={{
                            height: `${Math.max(bCount > 0 ? 18 : 8, heightPct)}%`,
                            backgroundColor: isHighest
                              ? "#facc15"
                              : "var(--ref-text-primary)",
                          }}
                        />
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: isHighest
                            ? "#facc15"
                            : "var(--ref-text-primary)",
                        }}
                      />
                      <span className="text-[10px] font-bold opacity-60 truncate max-w-full">
                        U{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS REFLEKSI & KURIKULUM */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[390px] border"
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.02] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 16px)",
            }}
          />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
              <Activity size={16} /> Indeks Kurikulum
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "graded", label: "Refleksi" },
                { key: "blocks", label: "Blok" },
                { key: "units", label: "Unit" },
              ].map((m) => {
                const active = gaugeMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setGaugeMode(m.key as any)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    style={{
                      backgroundColor: active
                        ? "#facc15"
                        : "var(--ref-card-subtle)",
                      color: active ? "#000" : "var(--ref-text-secondary)",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
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
                ? `Blok SaaS Kelas ${activeGrade}`
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
              <div className="relative flex items-center justify-center my-2 z-10">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={
                      isDark
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(24,24,27,0.16)"
                    }
                    strokeWidth="6"
                    strokeDasharray="2 5"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl font-light tracking-tighter leading-none">
                    {isLoading ? "—" : gaugeValue}
                  </span>
                  <span className="text-[11px] font-medium opacity-60 mt-1.5 leading-tight">
                    {gaugeLabel}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="relative z-10">
            <div
              className="h-3 w-full rounded-full flex overflow-hidden mb-3"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="h-full bg-blue-400"
                style={{
                  width: `${
                    (gradeCountBreakdown.g10 / gradeCountBreakdown.total) * 100
                  }%`,
                }}
              />
              <div
                className="h-full"
                style={{
                  width: `${
                    (gradeCountBreakdown.g11 / gradeCountBreakdown.total) * 100
                  }%`,
                  backgroundColor: "#facc15",
                }}
              />
              <div
                className="h-full bg-emerald-400"
                style={{
                  width: `${
                    (gradeCountBreakdown.g12 / gradeCountBreakdown.total) * 100
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" /> Kls 10 (
                {gradeCountBreakdown.g10})
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#facc15" }}
                />{" "}
                Kls 11 ({gradeCountBreakdown.g11})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> Kls 12 (
                {gradeCountBreakdown.g12})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: GRID KARTU BESAR UNIT MATERI (min-h-[320px] • PASTEL/DARK)
          100% Mengikuti Gaya Kartu Bawah "THE MASTERPIECE ADMINISTRATOR"
         ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <h3 className="text-2xl font-light tracking-tight">
            Daftar Unit Materi Kelas {activeGrade} ({materials.length})
          </h3>
          <p className="text-xs font-medium opacity-50 mt-1">
            Klik kartu unit materi untuk membuka SaaS Content Builder dan Live
            Preview Aplikasi Siswa.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md text-white cursor-pointer"
          style={{ backgroundColor: "#10b981" }}
        >
          <Plus size={15} strokeWidth={2.5} /> Tambah Modul Kelas {activeGrade}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[320px] rounded-[2.5rem] animate-pulse"
              style={{ backgroundColor: "var(--ref-card-subtle)" }}
            />
          ))
        ) : materials.length === 0 ? (
          <div
            className="xl:col-span-3 p-16 text-center rounded-[2.5rem] border border-dashed opacity-50"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            }}
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-xl font-light">
              Belum ada unit materi untuk Kelas {activeGrade}.
            </h3>
          </div>
        ) : (
          materials.map((mat, index) => {
            const bgLight = bentoColors[index % bentoColors.length];
            const blocks = parseMaterialToBlocks(mat);
            const tableCount = blocks.filter((b) => b.type === "table").length;
            const figCount = blocks.filter((b) => b.type === "figure").length;
            const unitRefStat = reflectionsByUnitMap[mat.unit_name] || {
              total: 0,
              graded: 0,
            };

            return (
              <div
                key={mat.id}
                onClick={() => openEditForm(mat)}
                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[320px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
                style={{
                  backgroundColor: isDark ? "#111111" : bgLight,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "radial-gradient(currentColor 2px, transparent 2px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Baris Atas Kartu Unit */}
                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold tracking-widest uppercase opacity-65">
                    UNIT 0{index + 1} • KELAS {mat.grade_level}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(mat);
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                      title="Edit Modul"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(mat.id, mat.unit_name, e)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                      title="Hapus Modul"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <ArrowUpRight size={18} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                {/* Judul Unit & Kutipan Pertanyaan Pemantik */}
                <div className="my-6 relative z-10">
                  <div className="text-3xl md:text-4xl font-light tracking-tighter leading-tight mb-3">
                    {mat.unit_name}
                  </div>
                  <p className="text-xs font-medium opacity-65 line-clamp-2 italic leading-relaxed">
                    &ldquo;
                    {mat.trigger_question ||
                      "Klik kartu untuk mengatur isi materi dan pertanyaan pemantik refleksi."}
                    &rdquo;
                  </p>
                </div>

                {/* Baris Bawah Metrik Blok & Jawaban Refleksi */}
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Komponen SaaS ({tableCount} Tabel · {figCount} Gambar)
                    </div>
                    <div className="text-3xl font-light leading-none">
                      {blocks.length}{" "}
                      <span className="text-sm font-medium opacity-60">
                        Blok
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Refleksi Siswa
                    </div>
                    <div className="text-4xl font-light leading-none">
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