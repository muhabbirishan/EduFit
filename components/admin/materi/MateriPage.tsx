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
  Bell,
  BookOpen,
  CheckCircle2,
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
  SlidersHorizontal,
  Smartphone,
  Table as TableIcon,
  Tablet,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
  level: 1 | 2 | 3;
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

interface IslandNotification {
  id: number;
  message: string;
  subtitle?: string;
  type: "success" | "error" | "info";
}

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
      const base64 = htmlString.substring(startIdx + EDUFIT_BLOCKS_MARKER_START.length, endIdx);
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

export default function MateriPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [allReflections, setAllReflections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [gaugeMode, setGaugeMode] = useState<"graded" | "blocks" | "units">("graded");

  const [islandAlert, setIslandAlert] = useState<IslandNotification | null>(null);
  const islandTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDynamicIsland = useCallback((message: string, subtitle?: string, type: "success" | "error" | "info" = "info") => {
    if (islandTimerRef.current) clearTimeout(islandTimerRef.current);
    setIslandAlert({ id: Date.now(), message, subtitle, type });
    islandTimerRef.current = setTimeout(() => setIslandAlert(null), 3400);
  }, []);

  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const quickJumpRef = useRef<HTMLDivElement>(null);

  const [workspaceLayout, setWorkspaceLayout] = useState<"split" | "editor" | "preview">("split");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet">("mobile");

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
        supabase.from("master_materials").select("*").order("grade_level", { ascending: true }).order("order_index", { ascending: true }).order("created_at", { ascending: true }),
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
      case "heading": return { id, type: "heading", title: "", value: "" };
      case "paragraph": return { id, type: "paragraph", value: "" };
      case "list": return { id, type: "list", title: "", listStyle: "number", value: "", items: ["", ""] };
      case "collapsible": return { id, type: "collapsible", title: "Panduan Rincian", collapsibleMode: "text", value: "Tuliskan penjelasan rincian...", collapsibleItems: [{ label: "Persiapan", text: "Periksa lintasan." }] };
      case "figure": return { id, type: "figure", overline: "ILUSTRASI", title: "", imageUrl: "", caption: "", figureTheme: "green", value: "" };
      case "table": return { id, type: "table", tableTitle: "Tabel Data", tableDescription: "", tableFootnote: "", hasCategoryFilter: false, value: "", tableVariants: [{ id: generateId(), label: "Umum", headers: ["Metode", "Fokus"], rows: [["Continous", "Irama napas"]] }] };
      case "tempo_simulator": return { id, type: "tempo_simulator", simulatorTitle: "Simulasi Visual", simulatorFootnote: "", value: "", tempoMethods: [{ id: generateId(), name: "Interval", steps: [{ label: "Lari Cepat", level: 3 }, { label: "Jalan Pulih", level: 1 }] }] };
      case "video": return { id, type: "video", title: "Video Demonstrasi", value: "Simak video berikut.", videoButtonLabel: "Putar Video", videoUrl: "", observationPoints: ["Perhatikan sikap awal."] };
      case "callout": return { id, type: "callout", title: "Catatan Keselamatan", calloutTone: "amber", value: "Lakukan pemanasan dinamis sebelum latihan." };
      case "quiz": return { id, type: "quiz", title: "Kuis Cek Pemahaman", question: "", options: [{ key: "A", text: "" }, { key: "B", text: "" }], correctOption: "A", explanation: "", value: "" };
    }
  };

  const parseMaterialToBlocks = (mat: any): ContentBlock[] => {
    if (mat?.content_blocks) {
      if (Array.isArray(mat.content_blocks) && mat.content_blocks.length > 0) {
        return mat.content_blocks.map((b: any) => ({ ...b, id: b?.id || generateId(), value: b?.value ?? "" }));
      }
      if (typeof mat.content_blocks === "string") {
        try {
          const parsedJson = JSON.parse(mat.content_blocks);
          if (Array.isArray(parsedJson) && parsedJson.length > 0) {
            return parsedJson.map((b: any) => ({ ...b, id: b?.id || generateId(), value: b?.value ?? "" }));
          }
        } catch {}
      }
    }
    const htmlString = mat?.content_text || "";
    const fromMarker = decodeBlocksFromMarker(htmlString);
    if (fromMarker && fromMarker.length > 0) {
      return fromMarker.map((b: any) => ({ ...b, id: b?.id || generateId(), value: b?.value ?? "" }));
    }
    if (!htmlString.trim()) return [createDefaultBlock("heading"), createDefaultBlock("paragraph")];
    if (typeof window === "undefined") return [createDefaultBlock("paragraph")];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(stripMarkerFromHtml(htmlString), "text/html");
    const blocks: ContentBlock[] = [];
    doc.body.childNodes.forEach((node) => {
      if (node.nodeName === "P") {
        const el = node as HTMLElement;
        const strong = el.querySelector("strong");
        const isOnlyStrong = strong !== null && (el.textContent || "").trim() === (strong.textContent || "").trim();
        if (isOnlyStrong) {
          blocks.push({ id: generateId(), type: "heading", title: strong.textContent || "", value: "" });
        } else {
          blocks.push({ id: generateId(), type: "paragraph", value: el.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?strong>/gi, "") });
        }
      } else if (node.nodeName === "UL" || node.nodeName === "OL") {
        const el = node as HTMLElement;
        const items = Array.from(el.querySelectorAll("li")).map((li) => li.textContent || "");
        blocks.push({ id: generateId(), type: "list", title: "", listStyle: node.nodeName === "OL" ? "number" : "bullet", value: "", items: items.length > 0 ? items : [""] });
      } else if (node.nodeName === "BLOCKQUOTE") {
        blocks.push({ id: generateId(), type: "callout", title: "Catatan Penting", calloutTone: "amber", value: (node.textContent || "").trim() });
      }
    });
    if (blocks.length === 0 && stripMarkerFromHtml(htmlString).trim()) {
      blocks.push({ id: generateId(), type: "paragraph", value: stripMarkerFromHtml(htmlString).trim() });
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
        const tag = b.listStyle === "number" || b.listStyle === "alpha" ? "ol" : "ul";
        const listItems = b.items.filter((i) => String(i || "").trim() !== "").map((i) => `<li>${i}</li>`).join("");
        if (listItems) html += `<${tag}>${listItems}</${tag}>`;
      } else if (b.type === "collapsible") {
        if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
        if (b.collapsibleMode === "text") {
          if (val.trim()) html += `<p>${val.replace(/\n/g, "<br/>")}</p>`;
        } else {
          (b.collapsibleItems || []).forEach((ci) => { html += `<p><strong>${ci.label}:</strong> ${ci.text}</p>`; });
        }
      } else if (b.type === "figure") {
        if (b.title?.trim()) html += `<p><strong>${b.title}</strong></p>`;
        if (b.imageUrl) {
          if (b.imageUrl.startsWith("data:image")) {
            html += `<p><em>[Ilustrasi Gambar Tersimpan Secara Internal]</em></p>`;
          } else {
            html += `<p><img src="${b.imageUrl}" alt="${b.title || "Ilustrasi"}" /></p>`;
          }
        }
        if (b.caption?.trim()) html += `<p><em>${b.caption}</em></p>`;
      } else if (b.type === "table") {
        if (b.tableTitle?.trim()) html += `<p><strong>${b.tableTitle}</strong></p>`;
        const firstVar = b.tableVariants?.[0];
        if (firstVar) {
          const ths = (firstVar.headers || []).map((h) => `<th>${h}</th>`).join("");
          const trs = (firstVar.rows || []).map((r) => `<tr>${(r || []).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
          html += `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
        }
      } else if (b.type === "callout") {
        html += `<blockquote><strong>${b.title || "Catatan"}:</strong> ${val}</blockquote>`;
      } else if (b.type === "video") {
        html += `<p><strong>${b.title || "Video Rujukan"}</strong>: ${val}</p>`;
      } else if (b.type === "quiz") {
        html += `<p><strong>Cek Pemahaman Unit:</strong> ${b.question || ""}</p>`;
      }
    });

    const lightweightBlocks = blocks.map(b => {
      if (b.type === 'figure' && b.imageUrl?.startsWith('data:image')) {
        return { ...b, imageUrl: '' };
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
      { id: generateId(), type: "heading", title: "Memahami Konsep Dasar", value: "" },
      { id: generateId(), type: "paragraph", value: "" },
    ]);
    setViewMode("form");
    triggerDynamicIsland("SaaS Builder Modul", "Susun blok konten interaktif dengan Live Preview.", "info");
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

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    const toastId = toast.loading("Mengunggah gambar ke edufit_media...");
    try {
      const cleanExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const filePath = `materi/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
      const { error: uploadError } = await supabase.storage.from("edufit_media").upload(filePath, file, { cacheControl: "3600", upsert: true, contentType: file.type || "image/jpeg" });

      if (uploadError) {
        const compressedDataUrl = await compressImageToDataUrl(file);
        toast.success("Gambar diterapkan! (Mode kompresi aktif)", { id: toastId, duration: 3500 });
        return compressedDataUrl;
      }
      const { data } = supabase.storage.from("edufit_media").getPublicUrl(filePath);
      toast.success("Gambar berhasil diunggah!", { id: toastId });
      return data.publicUrl;
    } catch (err: any) {
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
      triggerDynamicIsland("Sampul Unit Diperbarui", "Gambar sampul langsung tampil pada Live Preview.", "success");
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
      triggerDynamicIsland("Ilustrasi Blok Terpasang", "Gambar berhasil dioptimalkan.", "success");
    }
    setUploadingBlockId(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!unitName.trim()) return toast.error("Judul Unit Materi wajib diisi.");
    setIsSubmitting(true);

    try {
      const sanitizedBlocks: ContentBlock[] = JSON.parse(JSON.stringify(contentBlocks.map((b) => ({ ...b, id: b.id || generateId(), value: b.value ?? "" }))));
      const compiledHtml = compileBlocksToHTML(sanitizedBlocks);
      const nowIso = new Date().toISOString();
      const currentOrder = editingId 
        ? (allMaterials.find(m => m.id === editingId)?.order_index || 0) 
        : (allMaterials.filter(m => Number(m.grade_level) === Number(activeGrade)).length + 1);

      const fullPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: triggerQuestion.trim() || null,
        content_text: compiledHtml,
        content_blocks: sanitizedBlocks,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        order_index: currentOrder,
        updated_at: nowIso,
      };

      const legacyPayload: Record<string, any> = {
        grade_level: Number(activeGrade),
        unit_name: unitName.trim(),
        trigger_question: triggerQuestion.trim() || null,
        content_text: compiledHtml,
        media_url: mediaUrl.trim() || null,
        image_url: imageUrl.trim() || null,
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
          const byName = await supabase.from("master_materials").update(fullPayload).eq("grade_level", Number(activeGrade)).eq("unit_name", originalUnitName).select();
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

        const lowerTitle = unitName.trim().toLowerCase();
        const lowerOrig = originalUnitName.trim().toLowerCase();
        if (lowerTitle.includes("pretest") || lowerTitle.includes("pre test") || lowerOrig.includes("pretest") || lowerOrig.includes("pre test")) {
          await supabase.from("master_evaluations").update({ title: unitName.trim() }).eq("grade_level", Number(activeGrade)).eq("type", "pretest");
        } else if (lowerTitle.includes("posttest") || lowerTitle.includes("post test") || lowerOrig.includes("posttest") || lowerOrig.includes("post test")) {
          await supabase.from("master_evaluations").update({ title: unitName.trim() }).eq("grade_level", Number(activeGrade)).eq("type", "posttest");
        }
      } else {
        let { data, error } = await supabase.from("master_materials").insert([fullPayload]).select();
        if (error) {
          const retry = await supabase.from("master_materials").insert([legacyPayload]).select();
          if (retry.error) throw retry.error;
          data = retry.data;
        }
        savedRecord = data[0];
      }

      if (savedRecord) {
        setAllMaterials((prev) => {
          const exists = prev.some((item) => item.id === savedRecord.id);
          if (exists) return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item));
          return [...prev, savedRecord];
        });
      }

      toast.success("Modul materi berhasil disimpan!");
      triggerDynamicIsland("Modul Materi Tersimpan", `${unitName.trim()} telah aktif.`, "success");
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

  const addBlock = (type: BlockType) => setContentBlocks((prev) => [...prev, createDefaultBlock(type)]);
  const updateBlock = (id: string, patch: Partial<ContentBlock>) => setContentBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
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
    const cloned: ContentBlock = JSON.parse(JSON.stringify(contentBlocks[index]));
    cloned.id = generateId();
    const copy = [...contentBlocks];
    copy.splice(index + 1, 0, cloned);
    setContentBlocks(copy);
  };
  const removeBlock = (id: string) => {
    if (contentBlocks.length === 1) return toast.error("Modul minimal harus memiliki 1 bagian konten.");
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const totalBlocksActiveGrade = useMemo(() => materials.reduce((acc, m) => acc + parseMaterialToBlocks(m).length, 0), [materials]);
  const reflectionStats = useMemo(() => {
    const valid = allReflections.filter((r) => String(r.unit_name || "").toLowerCase() !== "cp_tp_read" && String(r.unit_name || "").toLowerCase() !== "akhir");
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
    const textCombined = contentBlocks.map((b) => `${b.title || ""} ${b.value || ""} ${(b.items || []).join(" ")}`).join(" ");
    const words = textCombined.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.ceil(words / 130));
  }, [contentBlocks]);


  const handleExportMateriCSV = () => {
    const rows = [
      ["Jenjang Kelas", "Judul Unit Materi", "Jumlah Blok SaaS", "Pertanyaan Pemantik", "Jawaban Refleksi Siswa"],
      ...allMaterials.map((m) => {
        const bLen = parseMaterialToBlocks(m).length;
        const rStat = reflectionsByUnitMap[m.unit_name] || { total: 0, graded: 0 };
        return [`Kelas ${m.grade_level}`, `"${String(m.unit_name || "").replace(/"/g, '""')}"`, bLen, `"${String(m.trigger_question || "").replace(/"/g, '""')}"`, `${rStat.graded}/${rStat.total} Dinilai`];
      }),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Kurikulum_Materi_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland("Kurikulum Materi Diunduh", `Laporan CSV berhasil diekspor.`, "success");
  };

  if (!mounted) return null;
  
  if (!mounted) return null;

  const renderDynamicIsland = () => (
    <AnimatePresence>
      {islandAlert && (
        <div className="fixed top-5 left-0 right-0 z-[120] flex justify-center pointer-events-none px-4">
          <motion.div
            key={islandAlert.id}
            initial={{ opacity: 0, scale: 0.86, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -12 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[28px] dynamic-island-shell ${islandAlert.type === "success" ? "dynamic-island-success" : islandAlert.type === "error" ? "dynamic-island-error" : "dynamic-island-info"}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${islandAlert.type === "success" ? "dynamic-island-icon-success" : islandAlert.type === "error" ? "dynamic-island-icon-error" : "dynamic-island-icon-info"}`}>
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

  // ==========================================================================
  // RENDERER STUDIO LIVE PREVIEW (CERAH DAN BERSIH SEPERTI APLIKASI MOBILE)
  // ==========================================================================
  const renderStudioLivePreview = () => (
    <div className="w-full rounded-[2rem] overflow-hidden transition-all duration-300 edufit-card-primary">
      <div className="px-7 py-5 flex items-center justify-between border-b border-hairline edufit-card-secondary">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold font-mono text-gold-accent">LIVE /</span>
          <span className="text-xs font-bold uppercase tracking-widest">Pratinjau Aplikasi Siswa · Kelas {activeGrade}</span>
        </div>
        <span className="text-xs font-bold font-mono uppercase tracking-wider opacity-60">
          {previewDevice === "mobile" ? "VIEWPORT MOBILE" : "VIEWPORT TABLET"}
        </span>
      </div>

      <div className="p-5 sm:p-7 transition-all duration-300 edufit-surface-subtle">
        <div className={`mx-auto transition-all duration-300 rounded-[1.5rem] overflow-hidden shadow-xl bg-white border border-hairline ${previewDevice === "mobile" ? "w-full max-w-[420px]" : "w-full"}`}>
          
          {/* HEADER GAMBAR / WARNA POLOS */}
          {imageUrl ? (
            <div className="relative h-48 w-full overflow-hidden">
              <img src={imageUrl} alt="Sampul" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-32 w-full telemetry-bar-forest rounded-t-[1.5rem] flex items-end p-5">
               <BookOpen size={30} className="text-white/20" />
            </div>
          )}

          {/* BADAN KONTEN UTAMA */}
          <div className="p-6 space-y-5 max-h-[720px] overflow-y-auto no-scrollbar relative bg-white">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
              {unitName || "Judul Unit Pembelajaran"}
            </h2>
            
            <div className="flex flex-wrap gap-2">
               <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-700">
                 <Clock size={10} className="inline mr-1 text-amber-600"/> ~{estimatedReadMinutes} MNT BACA
               </span>
               <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-700">
                 <Layers size={10} className="inline mr-1 text-emerald-700"/> {contentBlocks.length} BLOK
               </span>
            </div>

            {mediaUrl && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                <div className="flex items-start gap-3">
                  <Video size={16} className="text-sky-700 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-sky-900">Video Pengantar Unit</p>
                    <p className="text-[10px] opacity-80 font-mono truncate max-w-[210px] text-sky-700 mt-0.5">
                      {mediaUrl}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full h-px bg-gray-200 my-4"></div>

            {contentBlocks.map((b, idx) => (
              <div key={b.id} className={idx > 0 && b.type === "heading" ? "pt-4" : ""}>
                {b.type === "heading" && (
                  <h3 className="font-bold text-base sm:text-lg tracking-tight text-gray-900 leading-snug mb-2">
                    {b.title || b.value || "Sub-Judul Pembahasan"}
                  </h3>
                )}

                {b.type === "paragraph" && (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-gray-800">
                    {b.value || "Teks penjelasan paragraf akan tampil di sini..."}
                  </p>
                )}

                {b.type === "list" && (
                  <div className="space-y-2">
                    {b.title && <p className="text-xs sm:text-sm font-bold text-gray-900">{b.title}</p>}
                    <div className="space-y-2 pl-1">
                      {(b.items || []).map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-800">
                          <span className="w-5 h-5 rounded-md text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 bg-emerald-800 text-amber-400">
                            {b.listStyle === "number" ? `${i + 1}` : b.listStyle === "alpha" ? `${String.fromCharCode(97 + i)}` : "-"}
                          </span>
                          <span className="leading-relaxed">{item || "Butir penjelasan..."}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {b.type === "collapsible" && (
                  <details open className="rounded-2xl p-4 group bg-emerald-50 border border-emerald-200">
                    <summary className="font-bold text-xs sm:text-sm cursor-pointer list-none flex items-center justify-between gap-2 text-emerald-800">
                      <span>{b.title || "Judul Kotak Lipat (Accordion)"}</span>
                      <ChevronDown size={16} className="shrink-0" />
                    </summary>
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2.5 text-xs sm:text-sm">
                      {b.collapsibleMode === "text" ? (
                        <p className="leading-relaxed whitespace-pre-line text-emerald-900">
                          {b.value || "Isi penjelasan di dalam kotak lipat..."}
                        </p>
                      ) : (
                        (b.collapsibleItems || []).map((ci, cIdx) => (
                          <div key={cIdx} className="p-3 rounded-xl bg-white shadow-sm border border-emerald-100">
                            <span className="font-bold block text-xs text-gray-900">{ci.label}</span>
                            <span className="text-xs leading-relaxed text-gray-600 mt-1">{ci.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                )}

                {b.type === "figure" && (() => {
                    const theme = b.figureTheme || 'green';
                    let bgClass = "bg-emerald-50 border-emerald-200"; 
                    if(theme === 'blue') bgClass = "bg-sky-50 border-sky-200";
                    if(theme === 'neutral') bgClass = "bg-gray-50 border-gray-200";
                    return (
                      <div className="space-y-2">
                        <div className={`rounded-2xl p-4 space-y-2.5 border ${bgClass}`}>
                          {b.overline && <span className="text-[10px] font-bold font-mono uppercase tracking-widest block text-gray-500">{b.overline}</span>}
                          {b.title && <h4 className="font-bold text-sm text-gray-900">{b.title}</h4>}
                          {b.imageUrl ? (
                            <img src={b.imageUrl} alt={b.title || "Ilustrasi"} className="w-full rounded-xl object-contain max-h-64 bg-white/50" />
                          ) : (
                            <div className="py-10 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                              Gambar ilustrasi akan tampil di sini
                            </div>
                          )}
                        </div>
                        {b.caption && <p className="text-[11px] italic leading-relaxed px-1 text-gray-500">{b.caption}</p>}
                      </div>
                    );
                })()}

                {b.type === "table" && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {b.tableTitle && <h4 className="font-bold text-sm text-gray-900">{b.tableTitle}</h4>}
                      {b.hasCategoryFilter && (b.tableVariants?.length || 0) > 1 && (
                          <div className="flex items-center gap-1">
                            {b.tableVariants?.map((v, vIdx) => {
                              const active = (previewSelectedVariant[b.id] || 0) === vIdx;
                              return (
                                <button key={v.id} type="button" onClick={() => setPreviewSelectedVariant({ ...previewSelectedVariant, [b.id]: vIdx })}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${active ? "bg-amber-500 text-white shadow-sm" : "bg-gray-100 text-gray-600"}`}>
                                  {v.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                    </div>
                    {b.tableDescription && <p className="text-xs leading-relaxed text-gray-600">{b.tableDescription}</p>}
                    {(() => {
                      const activeVar = b.tableVariants?.[previewSelectedVariant[b.id] || 0] || b.tableVariants?.[0];
                      if (!activeVar) return null;
                      return (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                {activeVar.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-3 font-bold border-b border-gray-200 text-gray-900">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activeVar.rows.map((r, rIdx) => (
                                <tr key={rIdx} className="border-b border-gray-100 last:border-b-0 bg-white">
                                  {r.map((c, cIdx) => (
                                    <td key={cIdx} className={`p-3 align-top leading-relaxed text-gray-800 ${cIdx === 0 ? "font-bold" : ""}`}>{c}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                    {b.tableFootnote && <p className="text-[11px] text-gray-500">{b.tableFootnote}</p>}
                  </div>
                )}

                {b.type === "tempo_simulator" && (
                  <div className="rounded-2xl p-4 space-y-4 bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">{b.simulatorTitle || "Simulasi Pola Tempo & Intensitas"}</h4>
                    </div>
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
                                <button key={m.id} type="button" onClick={() => { setPreviewTempoTab({ ...previewTempoTab, [b.id]: idx }); setPreviewTempoStep({ ...previewTempoStep, [b.id]: 0 }); }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${idx === mIdx ? "bg-emerald-800 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700"}`}>
                                  {m.name}
                                </button>
                            ))}
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-gray-200">
                            <div className="grid gap-2 items-end h-24 pt-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, currentMethod.steps.length)}, minmax(0, 1fr))` }}>
                              {currentMethod.steps.map((st, stepI) => {
                                const isCurrent = stepI === sIdx;
                                const heightPct = st.level === 3 ? 100 : st.level === 2 ? 62 : 32;
                                return (
                                  <button key={stepI} type="button" onClick={() => setPreviewTempoStep({ ...previewTempoStep, [b.id]: stepI })} className="flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer group focus:outline-none">
                                    <div className="w-full max-w-[36px] flex-1 rounded-lg flex items-end p-0.5 bg-gray-100">
                                      <div className={`w-full rounded-md transition-all duration-300 ${isCurrent ? "bg-amber-500" : "bg-emerald-800"}`} style={{ height: `${heightPct}%` }} />
                                    </div>
                                    <span className={`text-[9px] font-bold text-center leading-tight break-words w-full ${isCurrent ? "text-gray-900" : "text-gray-500"}`}>{st.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-gray-800">Tahap {sIdx + 1}: <span className="underline">{currentStep?.label || "-"}</span></span>
                              <button type="button" onClick={() => setPreviewTempoStep({ ...previewTempoStep, [b.id]: (sIdx + 1) % Math.max(1, currentMethod.steps.length) })}
                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer bg-amber-500 text-white shadow-sm">Lanjut</button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                    {b.simulatorFootnote && <p className="text-[11px] text-gray-500">{b.simulatorFootnote}</p>}
                  </div>
                )}

                {b.type === "video" && (
                  <div className="p-4 rounded-2xl space-y-2.5 bg-sky-50 border border-sky-200">
                    <h4 className="font-bold text-xs sm:text-sm text-sky-900">{b.title || "Video Rujukan Pembelajaran"}</h4>
                    {b.value && <p className="text-xs leading-relaxed text-sky-800">{b.value}</p>}
                    
                    {b.observationPoints && b.observationPoints.length > 0 && (
                        <div className="mt-2 mb-2">
                            <span className="text-[10px] font-bold text-sky-700">Fokus Pengamatan:</span>
                            <ul className="pl-1 mt-1 space-y-1">
                                {b.observationPoints.map((pt, i) => (
                                    <li key={i} className="text-[11px] text-sky-800 flex"><span className="mr-2">•</span><span>{pt}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <button type="button" onClick={() => setPreviewVideoLoaded({ ...previewVideoLoaded, [b.id]: !previewVideoLoaded[b.id] })}
                      className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer bg-emerald-800 text-white shadow-sm mt-1">
                      <Play size={13} className="text-amber-400" />
                      <span>{b.videoButtonLabel || "Putar Video"}</span>
                    </button>
                    {previewVideoLoaded[b.id] && b.videoUrl && (
                      <div className="p-3 rounded-xl text-xs font-mono break-all bg-white border border-gray-200 mt-2 text-gray-700">
                        Tautan: {b.videoUrl}
                      </div>
                    )}
                  </div>
                )}

                {b.type === "callout" && (() => {
                    const tone = b.calloutTone || 'amber';
                    let bg = "bg-amber-50", border = "border-amber-200", textH = "text-amber-900";
                    if (tone === 'emerald') { bg = "bg-emerald-50"; border = "border-emerald-200"; textH = "text-emerald-900"; }
                    else if (tone === 'rose') { bg = "bg-rose-50"; border = "border-rose-200"; textH = "text-rose-900"; }
                    else if (tone === 'sky') { bg = "bg-sky-50"; border = "border-sky-200"; textH = "text-sky-900"; }
                    return (
                      <div className={`p-4 rounded-2xl border ${bg} ${border} space-y-1.5`}>
                        <h4 className={`font-bold text-xs sm:text-sm ${textH}`}>{b.title || "Catatan Penting"}</h4>
                        <p className="text-xs leading-relaxed text-gray-800">{b.value}</p>
                      </div>
                    );
                })()}

                {b.type === "quiz" && (
                  <div className="p-4 rounded-2xl space-y-3 bg-gray-50 border border-gray-200">
                    <h4 className="font-bold text-[10px] uppercase text-gray-500 tracking-wider">{b.title || "Kuis Cek Pemahaman"}</h4>
                    <p className="text-xs font-semibold text-gray-900">{b.question || "Pertanyaan latihan..."}</p>
                    <div className="space-y-2">
                      {(b.options || []).map((opt) => {
                        const chosen = previewQuizSelected[b.id] === opt.key;
                        const isCorrect = opt.key === b.correctOption;
                        return (
                          <button key={opt.key} type="button" onClick={() => setPreviewQuizSelected({ ...previewQuizSelected, [b.id]: opt.key })}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${chosen ? (isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-rose-50 border-rose-300 text-rose-900") : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                            <strong className="font-mono text-gray-900">{opt.key}.</strong> {opt.text || `Opsi ${opt.key}`}
                          </button>
                        );
                      })}
                    </div>
                    {previewQuizSelected[b.id] && b.explanation && (
                      <div className="p-3 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 mt-2">
                        <strong>Kunci ({b.correctOption}):</strong> {b.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="p-5 rounded-2xl space-y-3 bg-emerald-900 text-white shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-400">Tugas Refleksi</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {triggerQuestion || "Pertanyaan pemantik yang Anda ketik di kiri akan muncul di sini untuk dijawab siswa..."}
                </p>
                <div className="p-3.5 rounded-xl text-[11px] bg-white/10 border border-white/20 mt-3 text-white/70">
                  Kolom jawaban siswa di aplikasi mobile...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (viewMode === "form") {
    return (
      <div className="w-full pt-2 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
        {renderDynamicIsland()}

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 mb-8 border-b border-hairline relative z-20">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button type="button" onClick={() => setViewMode("list")} className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-card-primary">
                <ArrowLeft size={15} /> Kembali ke Daftar Materi
              </button>
              <div className="flex items-center p-1 rounded-2xl edufit-surface-subtle">
                {[{ key: "editor", icon: Edit3, label: "Editor" }, { key: "split", icon: Columns, label: "Split Preview" }, { key: "preview", icon: Eye, label: "Pratinjau" }].map((m) => {
                  const IconC = m.icon;
                  const active = workspaceLayout === m.key;
                  return (
                    <button key={m.key} type="button" onClick={() => setWorkspaceLayout(m.key as any)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${active ? "seg-btn-active" : "seg-btn-idle"}`}>
                      <IconC size={13} /> {m.label}
                    </button>
                  );
                })}
              </div>
              {workspaceLayout !== "editor" && (
                <div className="flex items-center p-1 rounded-2xl edufit-surface-subtle">
                  <button type="button" onClick={() => setPreviewDevice("mobile")} className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${previewDevice === "mobile" ? "telemetry-bar-forest" : "seg-btn-idle"}`}><Smartphone size={13} /> Mobile</button>
                  <button type="button" onClick={() => setPreviewDevice("tablet")} className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${previewDevice === "tablet" ? "telemetry-bar-forest" : "seg-btn-idle"}`}><Tablet size={13} /> Tablet</button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
              <span className="font-mono text-gold-accent">SAAS CONTENT BUILDER</span><span>—</span>
              <span className="inline-flex items-center gap-1.5 font-mono"><BookOpen size={14} /> KURIKULUM KELAS {activeGrade}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tighter leading-tight">
              {editingId ? "Edit" : "Susun"} <span className="font-semibold">{unitName || "Modul Pembelajaran"}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-end gap-8 shrink-0">
            <div>
              <div className="text-5xl md:text-6xl font-light font-mono tracking-tighter leading-none">{contentBlocks.length}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-55 mt-2">Blok Konten</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-light font-mono tracking-tighter leading-none text-emerald-accent">~{estimatedReadMinutes}m</div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-55 mt-2">Waktu Baca</div>
            </div>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] btn-forest-emerald">
              {isSubmitting ? "Menyimpan..." : "Simpan Modul"}
            </button>
          </div>
        </div>

        <div className={`grid gap-6 items-start ${workspaceLayout === "split" ? "grid-cols-1 xl:grid-cols-12" : "grid-cols-1"}`}>
          {workspaceLayout !== "preview" && (
            <form onSubmit={handleSubmit} className={`${workspaceLayout === "split" ? "xl:col-span-7" : "w-full"} rounded-[2rem] p-8 md:p-10 space-y-8 relative overflow-hidden edufit-card-primary`}>
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <h3 className="text-2xl font-light tracking-tight">Identitas & <span className="font-semibold">Sampul Unit</span></h3>
                  <span className="text-xs font-bold font-mono uppercase tracking-widest opacity-60">KELAS {activeGrade}</span>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">Judul Unit Materi</label>
                  <input required value={unitName} onChange={(e) => setUnitName(e.target.value)} type="text" placeholder="Contoh: Daya Tahan Jantung Paru..." className="w-full bg-transparent py-3 text-2xl font-light tracking-tight outline-none edufit-underline-select" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">Pertanyaan Pemantik & Refleksi Siswa</label>
                  <textarea value={triggerQuestion} onChange={(e) => setTriggerQuestion(e.target.value)} rows={2} placeholder="Contoh: Mengapa pemula lebih sesuai memulai latihan berselang?" className="w-full p-4 rounded-2xl text-sm font-medium outline-none resize-y edufit-surface-subtle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">Gambar Sampul Unit</label>
                    <input type="file" accept="image/*" ref={heroFileInputRef} onChange={handleHeroImageUpload} className="hidden" />
                    {imageUrl ? (
                      <div className="relative w-full h-36 rounded-2xl border border-hairline overflow-hidden group">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => heroFileInputRef.current?.click()} className="px-3.5 py-2 bg-white text-black rounded-xl text-xs font-bold cursor-pointer">Ganti</button>
                          <button type="button" onClick={() => setImageUrl("")} className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer badge-tint-rose">Hapus</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => heroFileInputRef.current?.click()} disabled={isUploadingHero} className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed border-hairline rounded-2xl cursor-pointer transition-colors hover:opacity-80 edufit-surface-subtle">
                        <UploadCloud className="w-7 h-7 mb-1.5 opacity-60" />
                        <span className="text-xs font-bold">{isUploadingHero ? "Mengunggah..." : "Pilih File Gambar Sampul"}</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">Tautan Video Pengantar (Opsional)</label>
                    <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} type="url" placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 rounded-2xl text-xs font-mono outline-none edufit-surface-subtle" />
                    <p className="text-[11px] mt-3 p-3.5 rounded-2xl leading-relaxed opacity-75 edufit-surface-subtle">Gunakan bagian <strong>Susunan Isi Materi</strong> di bawah untuk menyisipkan sub-judul, tabel, atau grafik latihan.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div>
                    <h3 className="text-2xl font-light tracking-tight">Susunan <span className="font-semibold">Isi Materi ({contentBlocks.length} Bagian)</span></h3>
                    <p className="text-xs mt-1 opacity-60">Atur urutan bagian materi menggunakan tombol panah atas/bawah pada setiap kartu.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <div key={block.id} className="rounded-2xl p-5 space-y-4 edufit-surface-subtle">
                      <div className="flex items-center justify-between pb-3 border-b border-hairline">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl text-xs font-bold font-mono flex items-center justify-center telemetry-bar-forest text-gold-accent">{String(index + 1).padStart(2, "0")}</span>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {block.type === "heading" && "Sub-Judul Bab"}
                            {block.type === "paragraph" && "Paragraf Penjelasan"}
                            {block.type === "list" && "Daftar Poin / Langkah Urutan"}
                            {block.type === "collapsible" && "Kotak Lipat (Accordion)"}
                            {block.type === "figure" && "Gambar / Diagram + Nama"}
                            {block.type === "table" && "Tabel Data + Nama"}
                            {block.type === "tempo_simulator" && "Grafik Simulasi Tempo & Intensitas"}
                            {block.type === "video" && "Video Demonstrasi"}
                            {block.type === "callout" && "Kotak Catatan Penting"}
                            {block.type === "quiz" && "Kuis Cek Pemahaman"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveBlock(index, "up")} disabled={index === 0} className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"><ArrowUp size={14} /></button>
                          <button type="button" onClick={() => moveBlock(index, "down")} disabled={index === contentBlocks.length - 1} className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"><ArrowDown size={14} /></button>
                          <button type="button" onClick={() => duplicateBlock(index)} className="p-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"><Copy size={14} /></button>
                          <button type="button" onClick={() => removeBlock(block.id)} className="p-1.5 rounded-lg cursor-pointer badge-tint-rose"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      {block.type === "heading" && (
                        <input type="text" value={block.title ?? block.value} onChange={(e) => updateBlock(block.id, { title: e.target.value, value: e.target.value }) } placeholder="Ketik sub-judul pembahasan (Cth: 1. Konsep Daya Tahan)..." className="w-full px-4 py-3 rounded-2xl text-sm font-bold outline-none edufit-card-primary" />
                      )}

                      {block.type === "paragraph" && (
                        <textarea value={block.value} onChange={(e) => updateBlock(block.id, { value: e.target.value }) } rows={4} placeholder="Ketik penjelasan materi di sini..." className="w-full p-4 rounded-2xl text-xs sm:text-sm leading-relaxed outline-none resize-y edufit-card-primary" />
                      )}

                      {block.type === "list" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <input type="text" value={block.title || ""} onChange={(e) => updateBlock(block.id, { title: e.target.value }) } placeholder="Judul pengantar daftar (Opsional)" className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                            {["number", "bullet", "alpha"].map((st) => {
                              const active = (block.listStyle || "bullet") === st;
                              return (
                                <button key={st} type="button" onClick={() => updateBlock(block.id, { listStyle: st as any }) } className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${active ? "seg-btn-active" : "edufit-card-primary"}`}>
                                  {st === "number" ? "1. Angka" : st === "bullet" ? "Poin" : "a. Abjad"}
                                </button>
                              );
                            })}
                          </div>
                          {(block.items || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono w-5 text-center">
                                {block.listStyle === "number" ? `${i + 1}.` : block.listStyle === "alpha" ? `${String.fromCharCode(97 + i)}.` : "-"}
                              </span>
                              <input type="text" value={item} onChange={(e) => { const next = [...(block.items || [])]; next[i] = e.target.value; updateBlock(block.id, { items: next }); }} placeholder={`Isi butir ke-${i + 1}...`} className="w-full px-3.5 py-2 rounded-xl text-xs outline-none edufit-card-primary" />
                              <button type="button" onClick={() => { const next = (block.items || []).filter((_, idx) => idx !== i); updateBlock(block.id, { items: next.length ? next : [""] }); }} className="p-1.5 rounded-lg badge-tint-rose cursor-pointer"><X size={14} /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => updateBlock(block.id, { items: [...(block.items || []), ""] }) } className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"><Plus size={13} /> Tambah Baris Poin</button>
                        </div>
                      )}

                      {block.type === "collapsible" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <input type="text" value={block.title || ""} onChange={(e) => updateBlock(block.id, { title: e.target.value }) } placeholder="Judul Kotak Lipat (Accordion)..." className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                            <div className="flex items-center gap-1">
                              {[{ k: "text", l: "Teks Paragraf Bebas" }, { k: "steps", l: "Daftar Tahapan" }].map((m) => {
                                const active = (block.collapsibleMode || "steps") === m.k;
                                return (
                                  <button key={m.k} type="button" onClick={() => updateBlock(block.id, { collapsibleMode: m.k as any }) } className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${active ? "seg-btn-active" : "edufit-card-primary"}`}>{m.l}</button>
                                );
                              })}
                            </div>
                          </div>
                          {block.collapsibleMode === "text" ? (
                            <textarea rows={3} value={block.value || ""} onChange={(e) => updateBlock(block.id, { value: e.target.value }) } placeholder="Tuliskan isi penjelasan lengkap..." className="w-full p-3.5 rounded-xl text-xs leading-relaxed outline-none resize-y edufit-card-primary" />
                          ) : (
                            <div className="space-y-2">
                              {(block.collapsibleItems || []).map((ci, cIdx) => (
                                <div key={cIdx} className="flex gap-2">
                                  <input type="text" value={ci.label} onChange={(e) => { const next = [...(block.collapsibleItems || [])]; next[cIdx].label = e.target.value; updateBlock(block.id, { collapsibleItems: next }); }} placeholder="Tahap" className="w-28 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                                  <input type="text" value={ci.text} onChange={(e) => { const next = [...(block.collapsibleItems || [])]; next[cIdx].text = e.target.value; updateBlock(block.id, { collapsibleItems: next }); }} placeholder="Penjelasan tahap..." className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary" />
                                  <button type="button" onClick={() => updateBlock(block.id, { collapsibleItems: (block.collapsibleItems || []).filter((_, idx) => idx !== cIdx) }) } className="p-2 rounded-lg badge-tint-rose cursor-pointer"><X size={14} /></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => updateBlock(block.id, { collapsibleItems: [...(block.collapsibleItems || []), { label: "Tahap", text: "" }] }) } className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"><Plus size={13} /> Tambah Tahap</button>
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === "figure" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] font-bold uppercase opacity-60">Tema Warna Bingkai:</span>
                             {['green', 'blue', 'neutral'].map(t => (
                                 <button key={t} type="button" onClick={() => updateBlock(block.id, { figureTheme: t as any })}
                                   className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${block.figureTheme === t || (!block.figureTheme && t === 'green') ? 'seg-btn-active' : 'edufit-surface-subtle'}`}>
                                   {t}
                                 </button>
                             ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input type="text" value={block.overline || ""} onChange={(e) => updateBlock(block.id, { overline: e.target.value }) } placeholder="Nomor/Label (Cth: GAMBAR 1.1)" className="px-3 py-2 rounded-xl text-xs font-bold font-mono outline-none edufit-card-primary" />
                            <input type="text" value={block.title || ""} onChange={(e) => updateBlock(block.id, { title: e.target.value }) } placeholder="Judul / Nama Gambar" className="px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 btn-forest-emerald">
                              <UploadCloud size={15} /><span>{uploadingBlockId === block.id ? "Mengunggah..." : "Pilih Gambar"}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleBlockFigureUpload(block.id, e.target.files?.[0]); e.target.value = ""; }} />
                            </label>
                            <input type="text" value={block.imageUrl || ""} onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value }) } placeholder="Atau tempel URL gambar..." className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary" />
                          </div>
                          <input type="text" value={block.caption || ""} onChange={(e) => updateBlock(block.id, { caption: e.target.value }) } placeholder="Keterangan bawah / Caption sumber gambar..." className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary" />
                        </div>
                      )}

                      {block.type === "table" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <input type="text" value={block.tableTitle || ""} onChange={(e) => updateBlock(block.id, { tableTitle: e.target.value }) } placeholder="Nama / Judul Tabel..." className="flex-1 px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                              <input type="checkbox" checked={Boolean(block.hasCategoryFilter)} onChange={(e) => { const checked = e.target.checked; const variants = [...(block.tableVariants || [])]; if (checked && variants.length === 1) { variants[0].label = "Putra"; variants.push({ id: generateId(), label: "Putri", unitSubtitle: "", headers: [...variants[0].headers], rows: variants[0].rows.map((r) => [...r]) }); } updateBlock(block.id, { hasCategoryFilter: checked, tableVariants: variants }); }} />
                              Tab Putra & Putri
                            </label>
                          </div>
                          {(block.tableVariants || []).map((variant, vIdx) => (
                            <div key={variant.id} className="p-3 rounded-xl space-y-2 edufit-card-primary">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold">{block.hasCategoryFilter ? `Tabel ${variant.label}` : "Isi Tabel"}</span>
                                <div className="flex gap-1.5">
                                  <button type="button" onClick={() => { const next = [...(block.tableVariants || [])]; next[vIdx].headers.push(`Kolom ${next[vIdx].headers.length + 1}`); next[vIdx].rows = next[vIdx].rows.map((r) => [...r, ""]); updateBlock(block.id, { tableVariants: next }); }} className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer badge-tint-emerald">+ Kolom</button>
                                  <button type="button" onClick={() => { const next = [...(block.tableVariants || [])]; next[vIdx].rows.push(new Array(next[vIdx].headers.length).fill("")); updateBlock(block.id, { tableVariants: next }); }} className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer badge-tint-sky">+ Baris</button>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr>
                                      {variant.headers.map((h, hIdx) => (
                                        <th key={hIdx} className="p-1.5 border border-hairline">
                                          <input type="text" value={h} onChange={(e) => { const next = [...(block.tableVariants || [])]; next[vIdx].headers[hIdx] = e.target.value; updateBlock(block.id, { tableVariants: next }); }} className="w-full font-bold bg-transparent outline-none" />
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variant.rows.map((row, rIdx) => (
                                      <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="p-1.5 border border-hairline">
                                            <input type="text" value={cell} onChange={(e) => { const next = [...(block.tableVariants || [])]; next[vIdx].rows[rIdx][cIdx] = e.target.value; updateBlock(block.id, { tableVariants: next }); }} className="w-full bg-transparent outline-none" />
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                          <input type="text" value={block.tableFootnote || ""} onChange={(e) => updateBlock(block.id, { tableFootnote: e.target.value }) } placeholder="Catatan kaki tabel (Opsional)..." className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary" />
                        </div>
                      )}

                      {block.type === "tempo_simulator" && (
                        <div className="space-y-3">
                          <input type="text" value={block.simulatorTitle || ""} onChange={(e) => updateBlock(block.id, { simulatorTitle: e.target.value }) } placeholder="Judul Grafik Simulasi..." className="w-full px-3.5 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                          {(() => {
                            const methods = block.tempoMethods || [];
                            const activeMIdx = editorTempoTab[block.id] || 0;
                            const activeMethod = methods[activeMIdx] || methods[0];
                            return (
                              <div className="p-3.5 rounded-xl space-y-3 edufit-card-primary">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {methods.map((m, mIdx) => (
                                      <button key={m.id} type="button" onClick={() => setEditorTempoTab({ ...editorTempoTab, [block.id]: mIdx }) } className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeMIdx === mIdx ? "seg-btn-active" : "edufit-surface-subtle"}`}>{m.name}</button>
                                    ))}
                                  </div>
                                  <button type="button" onClick={() => { const next = [...methods, { id: generateId(), name: `Metode ${methods.length + 1}`, steps: [{ label: "Tahap 1", level: 2 }, { label: "Tahap 2", level: 3 }] }]; updateBlock(block.id, { tempoMethods: next }); setEditorTempoTab({ ...editorTempoTab, [block.id]: next.length - 1 }); }} className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer badge-tint-emerald">+ Metode Baru</button>
                                </div>
                                {activeMethod && (
                                  <div className="space-y-2.5 pt-2 border-t border-hairline">
                                    <div className="flex items-center justify-between gap-2">
                                      <input type="text" value={activeMethod.name} onChange={(e) => { const next = [...methods]; next[activeMIdx].name = e.target.value; updateBlock(block.id, { tempoMethods: next }); }} placeholder="Nama Metode..." className="px-3 py-1.5 rounded-lg text-xs font-bold outline-none edufit-surface-subtle" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {activeMethod.steps.map((st, sIdx) => (
                                        <div key={sIdx} className="p-2.5 rounded-xl space-y-2 edufit-surface-subtle">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold font-mono opacity-60">TAHAP {sIdx + 1}</span>
                                            {activeMethod.steps.length > 2 && (
                                              <button type="button" onClick={() => { const next = [...methods]; next[activeMIdx].steps = next[activeMIdx].steps.filter((_, i) => i !== sIdx); updateBlock(block.id, { tempoMethods: next }); }} className="text-red-500 cursor-pointer"><X size={12} /></button>
                                            )}
                                          </div>
                                          <input type="text" value={st.label} onChange={(e) => { const next = [...methods]; next[activeMIdx].steps[sIdx].label = e.target.value; updateBlock(block.id, { tempoMethods: next }); }} className="w-full px-2.5 py-1 rounded-lg text-xs font-bold outline-none edufit-card-primary" />
                                          <div className="grid grid-cols-3 gap-1">
                                            {[{ lv: 1, t: "Rendah" }, { lv: 2, t: "Sedang" }, { lv: 3, t: "Tinggi" }].map((opt) => (
                                              <button key={opt.lv} type="button" onClick={() => { const next = [...methods]; next[activeMIdx].steps[sIdx].level = opt.lv as any; updateBlock(block.id, { tempoMethods: next }); }} className={`py-1 rounded-md text-[10px] font-bold cursor-pointer ${st.level === opt.lv ? "telemetry-bar-forest" : "edufit-card-primary opacity-70"}`}>{opt.t}</button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <button type="button" onClick={() => { const next = [...methods]; next[activeMIdx].steps.push({ label: "Tahap Baru", level: 2 }); updateBlock(block.id, { tempoMethods: next }); }} className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent"><Plus size={13} /> Tambah Batang</button>
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
                            <input type="text" value={block.title || ""} onChange={(e) => updateBlock(block.id, { title: e.target.value }) } placeholder="Judul Video Rujukan" className="px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                            <input type="text" value={block.videoUrl || ""} onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value }) } placeholder="URL YouTube (https://...)" className="px-3 py-2 rounded-xl text-xs font-mono outline-none edufit-card-primary" />
                          </div>
                          <textarea rows={2} value={block.value || ""} onChange={(e) => updateBlock(block.id, { value: e.target.value }) } placeholder="Deskripsi/pengantar video..." className="w-full p-3 rounded-xl text-xs outline-none edufit-card-primary" />
                          
                          <div className="space-y-2 pt-2 border-t border-hairline">
                             <span className="text-[10px] font-bold uppercase opacity-60">Fokus Pengamatan Video (Opsional):</span>
                             {(block.observationPoints || []).map((pt, pIdx) => (
                                 <div key={pIdx} className="flex gap-2">
                                     <input type="text" value={pt} onChange={e => {
                                         const next = [...(block.observationPoints || [])];
                                         next[pIdx] = e.target.value;
                                         updateBlock(block.id, { observationPoints: next });
                                     }} className="flex-1 px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary" placeholder={`Poin pengamatan ${pIdx + 1}...`} />
                                     <button type="button" onClick={() => {
                                         const next = [...(block.observationPoints || [])];
                                         next.splice(pIdx, 1);
                                         updateBlock(block.id, { observationPoints: next });
                                     }} className="p-1.5 rounded-lg badge-tint-rose cursor-pointer"> <X size={14}/> </button>
                                 </div>
                             ))}
                             <button type="button" onClick={() => updateBlock(block.id, { observationPoints: [...(block.observationPoints || []), ""] })} className="text-xs font-bold flex items-center gap-1 cursor-pointer text-emerald-accent">
                                 <Plus size={13}/> Tambah Poin Pengamatan
                             </button>
                          </div>
                        </div>
                      )}

                      {block.type === "callout" && (
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase opacity-60">Warna Aksen:</span>
                              {['amber', 'emerald', 'sky', 'rose'].map(t => (
                                  <button key={t} type="button" onClick={() => updateBlock(block.id, { calloutTone: t as any })}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${block.calloutTone === t || (!block.calloutTone && t === 'amber') ? 'seg-btn-active' : 'edufit-surface-subtle'}`}>
                                    {t}
                                  </button>
                              ))}
                           </div>
                          <input type="text" value={block.title || ""} onChange={(e) => updateBlock(block.id, { title: e.target.value }) } placeholder="Judul Kotak Catatan (Cth: Tips Keselamatan)" className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                          <textarea rows={2} value={block.value || ""} onChange={(e) => updateBlock(block.id, { value: e.target.value }) } placeholder="Isi catatan penting..." className="w-full p-3 rounded-xl text-xs outline-none edufit-card-primary" />
                        </div>
                      )}

                      {block.type === "quiz" && (
                        <div className="space-y-2.5">
                          <input type="text" value={block.question || ""} onChange={(e) => updateBlock(block.id, { question: e.target.value }) } placeholder="Pertanyaan Kuis..." className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none edufit-card-primary" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(block.options || []).map((opt, oIdx) => (
                              <div key={opt.key} className="flex items-center gap-1.5">
                                <button type="button" onClick={() => updateBlock(block.id, { correctOption: opt.key }) } className={`w-7 h-7 rounded-lg text-xs font-bold font-mono shrink-0 cursor-pointer ${block.correctOption === opt.key ? "seg-btn-active" : "edufit-card-primary opacity-70"}`} title="Klik untuk jadikan Kunci Jawaban">{opt.key}</button>
                                <input type="text" value={opt.text} onChange={(e) => { const next = [...(block.options || [])]; next[oIdx].text = e.target.value; updateBlock(block.id, { options: next }); }} placeholder={`Jawaban ${opt.key}...`} className="w-full px-3 py-1.5 rounded-xl text-xs outline-none edufit-card-primary" />
                              </div>
                            ))}
                          </div>
                          <input type="text" value={block.explanation || ""} onChange={(e) => updateBlock(block.id, { explanation: e.target.value }) } placeholder="Penjelasan pembahasan kunci jawaban..." className="w-full px-3 py-2 rounded-xl text-xs outline-none edufit-card-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl space-y-3 edufit-surface-subtle">
                  <span className="text-xs font-bold font-mono uppercase tracking-widest block opacity-70">TAMBAHKAN KOMPONEN BARU KE DALAM MATERI:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { t: "heading", icon: Heading, l: "Sub-Judul" },
                      { t: "paragraph", icon: AlignLeft, l: "Paragraf" },
                      { t: "list", icon: ListOrdered, l: "Daftar" },
                      { t: "collapsible", icon: FolderOpen, l: "Kotak Lipat" },
                      { t: "figure", icon: ImageIcon, l: "Gambar" },
                      { t: "table", icon: TableIcon, l: "Tabel" },
                      { t: "tempo_simulator", icon: Activity, l: "Grafik" },
                      { t: "video", icon: Video, l: "Video" },
                      { t: "callout", icon: MessageSquareWarning, l: "Catatan" },
                      { t: "quiz", icon: HelpCircle, l: "Kuis" },
                    ].map((btn) => {
                      const IconB = btn.icon;
                      return (
                        <button key={btn.t} type="button" onClick={() => addBlock(btn.t as BlockType)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 edufit-card-primary">
                          <IconB size={13} /> {btn.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </form>
          )}

          {workspaceLayout !== "editor" && (
            <div className={workspaceLayout === "split" ? "xl:col-span-5 xl:sticky xl:top-28 w-full" : "w-full"}>
              {renderStudioLivePreview()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {renderDynamicIsland()}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">SAAS CONTENT MANAGEMENT</span><span>—</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={15} /> Kurikulum Kelas {activeGrade}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">Materi & <br /><span className="font-semibold">Refleksi Siswa</span></h1>
        </div>
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div><div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">{isLoading ? "—" : materials.length}</div><div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">Unit Kelas {activeGrade}</div></div>
          <div><div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">{isLoading ? "—" : totalBlocksActiveGrade}</div><div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">Blok Konten SaaS</div></div>
          <div><div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">{isLoading ? "—" : reflectionStats.total}</div><div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">Jawaban Refleksi</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <div className="lg:col-span-3 space-y-2"><div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1"><span>Total Kurikulum</span><span className="font-mono">KELAS 10–12</span></div><div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest"><span className="text-2xl font-light font-mono tracking-tight">{isLoading ? "—" : `${allMaterials.length} Modul`}</span><span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Fase E & F</span></div></div>
        <div className="lg:col-span-3 space-y-2"><div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1"><span>Penilaian Guru</span><span className="font-mono">GRADE A–D</span></div><div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold"><span className="text-2xl font-semibold font-mono tracking-tight">{isLoading ? "—" : `${reflectionStats.graded} Dinilai`}</span><span className="text-[11px] font-bold font-mono uppercase tracking-wider">{reflectionStats.pct}% TUNTAS</span></div></div>
        <div className="sm:col-span-2 lg:col-span-4 space-y-2"><div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1"><span>Kepadatan Komponen SaaS</span><span className="font-mono">KELAS {activeGrade}</span></div><div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped"><span className="text-2xl font-light font-mono tracking-tight relative z-10">{isLoading ? "—" : `${totalBlocksActiveGrade} Blok Aktif`}</span><span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">Sinkron Mobile</span></div></div>
        <div className="sm:col-span-2 lg:col-span-2 space-y-2"><div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1"><span>Pemantik</span><span className="font-mono">REFLEKSI</span></div><div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary"><span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">{isLoading ? "—" : `${materials.filter((m) => String(m.trigger_question || "").trim()).length}/${materials.length}`}</span></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55"><SlidersHorizontal size={14} /><span>Filter Modul</span></div>
              <button type="button" onClick={handleExportMateriCSV} className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle" title="Unduh Data Kurikulum CSV"><Download size={15} /></button>
            </div>
            <h2 className="text-3xl font-light tracking-tight mb-2">Kendali Materi</h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">Pilih tingkatan kelas atau lompat cepat ke editor unit materi.</p>
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[10, 11, 12].map((g) => (
                <button key={g} type="button" onClick={() => { setActiveGrade(g); triggerDynamicIsland(`Filter Modul Kelas ${g}`, `Menampilkan daftar unit pembelajaran Kelas ${g}.`, "info"); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeGrade === g ? "seg-btn-active" : "seg-btn-idle"}`}>Kelas {g}</button>
              ))}
            </div>
            <div className="relative w-full mb-6" ref={quickJumpRef}>
              <div onClick={() => setIsQuickJumpOpen(!isQuickJumpOpen)} className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${isQuickJumpOpen ? "edufit-underline-select-active" : ""}`}>
                <span className="truncate pr-3">Buka Cepat ({materials.length} Unit Kelas {activeGrade})</span><ChevronDown size={22} className={`transition-transform duration-300 opacity-60 shrink-0 ${isQuickJumpOpen ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {isQuickJumpOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu">
                    {materials.length === 0 ? (
                      <div className="p-5 text-sm opacity-50 text-center">Belum ada unit materi di Kelas {activeGrade}.</div>
                    ) : (
                      materials.map((m, idx) => (
                        <div key={m.id} onClick={() => { setIsQuickJumpOpen(false); openEditForm(m); }} className="px-6 py-4 text-base font-medium cursor-pointer transition-colors flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5">
                          <span className="truncate pr-3"><span className="font-mono text-gold-accent mr-2">U{idx + 1}</span>{m.unit_name}</span><ArrowUpRight size={16} className="opacity-50" />
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button type="button" onClick={openAddForm} className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md relative z-10 btn-forest-emerald">
            <Plus size={16} strokeWidth={2.5} /> Tambah Modul Materi Baru
          </button>
        </div>

        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest"><Layers size={15} /><span>Kepadatan Blok per Unit</span></div>
            <span className="text-[11px] font-bold font-mono opacity-55">KLIK BATANG</span>
          </div>
          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">{isLoading ? "—" : totalBlocksActiveGrade}</div>
            <div className="text-sm font-semibold opacity-55 mb-1">Total Blok SaaS Kelas {activeGrade}</div>
          </div>
          {(() => {
            const bars = materials.slice(0, 6);
            const maxBlocks = Math.max(1, ...bars.map((m) => parseMaterialToBlocks(m).length));
            return (
              <div className="grid gap-3 items-end pt-4 h-44 relative z-10" style={{ gridTemplateColumns: `repeat(${Math.max(1, bars.length)}, minmax(0, 1fr))` }}>
                {bars.map((mat, idx) => {
                  const bCount = parseMaterialToBlocks(mat).length;
                  const heightPct = Math.round((bCount / maxBlocks) * 100);
                  const isHighest = bCount === maxBlocks && bCount > 0;
                  const fillClass = isHighest ? "chart-fill-gold" : "chart-fill-primary";
                  return (
                    <button key={mat.id} type="button" onClick={() => openEditForm(mat)} className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none" title={`${mat.unit_name}: ${bCount} Blok Konten`}>
                      <span className="text-[11px] font-bold font-mono opacity-80">{bCount}b</span>
                      <div className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div className={`w-full rounded-full transition-all duration-500 group-hover:scale-y-105 ${fillClass}`} style={{ height: `${Math.max(bCount > 0 ? 18 : 8, heightPct)}%` }} />
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
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest"><Activity size={15} /><span>Indeks Kurikulum</span></div>
            <div className="flex items-center gap-1">
              {[{ key: "graded", label: "Refleksi" }, { key: "blocks", label: "Blok" }, { key: "units", label: "Unit" }].map((m) => (
                  <button key={m.key} type="button" onClick={() => setGaugeMode(m.key as any)} className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${gaugeMode === m.key ? "seg-btn-active" : "edufit-surface-subtle"}`}>{m.label}</button>
              ))}
            </div>
          </div>
          {(() => {
            const gaugeValue = gaugeMode === "graded" ? `${reflectionStats.pct}%` : gaugeMode === "blocks" ? `${totalBlocksActiveGrade}` : `${allMaterials.length}`;
            const gaugeLabel = gaugeMode === "graded" ? "Refleksi Dinilai Guru" : gaugeMode === "blocks" ? `Blok SaaS Kelas ${activeGrade}` : "Total Unit Kelas 10–12";
            const gaugePct = gaugeMode === "graded" ? reflectionStats.pct : gaugeMode === "blocks" ? Math.min(100, totalBlocksActiveGrade * 5) : Math.min(100, allMaterials.length * 8);
            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (Math.max(10, gaugePct) / 100) * circumference;
            return (
              <div className="relative flex items-center justify-center my-2 z-10">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="6" strokeDasharray="2 5" className="gauge-circle-track" />
                  <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className={`transition-all duration-700 ${gaugeMode === "graded" ? "gauge-circle-emerald" : "gauge-circle-gold"}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl font-light font-mono tracking-tighter leading-none">{isLoading ? "—" : gaugeValue}</span>
                  <span className="text-[11px] font-medium opacity-60 mt-1.5 leading-tight">{gaugeLabel}</span>
                </div>
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
              <span>Kls 10 ({gradeCountBreakdown.g10})</span><span>Kls 11 ({gradeCountBreakdown.g11})</span><span>Kls 12 ({gradeCountBreakdown.g12})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">MODUL PEMBELAJARAN INTERAKTIF</div>
          <h3 className="text-3xl font-light tracking-tight">Daftar Unit Materi Kelas {activeGrade} ({materials.length})</h3>
          <p className="text-xs font-medium opacity-55 mt-1">Klik kartu unit materi untuk membuka SaaS Content Builder dan Live Preview Aplikasi Siswa.</p>
        </div>
        <button type="button" onClick={openAddForm} className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer btn-forest-emerald">
          <Plus size={15} strokeWidth={2.5} /> Tambah Modul Kelas {activeGrade}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-[320px] rounded-[2rem] animate-pulse edufit-surface-subtle" />)
        ) : materials.length === 0 ? (
          <div className="xl:col-span-3 p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-xl font-light">Belum ada unit materi untuk Kelas {activeGrade}.</h3>
          </div>
        ) : (
          materials.map((mat, index) => {
            const showcaseClass = BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const blocks = parseMaterialToBlocks(mat);
            const tableCount = blocks.filter((b) => b.type === "table").length;
            const figCount = blocks.filter((b) => b.type === "figure").length;
            const unitRefStat = reflectionsByUnitMap[mat.unit_name] || { total: 0, graded: 0 };

            return (
              <div key={mat.id} onClick={() => openEditForm(mat)} className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[320px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass}`}>
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">UNIT {index + 1} · KELAS {mat.grade_level}</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); openEditForm(mat); }} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10" title="Edit Modul"><Edit3 size={15} /></button>
                    <button type="button" onClick={(e) => handleDelete(mat.id, mat.unit_name, e)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80" title="Hapus Modul"><Trash2 size={15} /></button>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5"><ArrowUpRight size={18} strokeWidth={1.75} /></div>
                  </div>
                </div>
                <div className="my-6 relative z-10">
                  <div className="text-3xl md:text-4xl font-light tracking-tighter leading-tight mb-3">{mat.unit_name}</div>
                  <p className="text-xs font-medium opacity-65 line-clamp-2 italic leading-relaxed">&ldquo;{mat.trigger_question || "Klik kartu untuk mengatur isi materi dan pertanyaan pemantik refleksi."}&rdquo;</p>
                </div>
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">Komponen SaaS ({tableCount} Tabel · {figCount} Gambar)</div>
                    <div className="text-3xl font-light font-mono leading-none">{blocks.length} <span className="text-sm font-sans font-medium opacity-60">Blok</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">Refleksi Siswa</div>
                    <div className="text-4xl font-light font-mono leading-none">{unitRefStat.graded}/{unitRefStat.total}</div>
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