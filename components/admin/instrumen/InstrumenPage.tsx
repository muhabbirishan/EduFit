// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  Edit3,
  FileText,
  LayoutTemplate,
  Plus,
  SlidersHorizontal,
  Target,
  Trash2
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

const getRomanGrade = (grade: number) => {
  if (grade === 11) return "XI";
  if (grade === 12) return "XII";
  return "X";
};

export default function InstrumenPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [allInstruments, setAllInstruments] = useState<any[]>([]);
  const [gradeQuestions, setGradeQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"view" | "form">("view");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Island Alert State
  const [islandAlert, setIslandAlert] = useState<IslandNotification | null>(null);
  const islandTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDynamicIsland = useCallback(
    (
      message: string,
      subtitle?: string,
      type: "success" | "error" | "info" = "info"
    ) => {
      if (islandTimerRef.current) clearTimeout(islandTimerRef.current);
      setIslandAlert({
        id: Date.now(),
        message,
        subtitle,
        type,
      });
      islandTimerRef.current = setTimeout(() => {
        setIslandAlert(null);
      }, 3400);
    },
    []
  );

  // State Kontrol Visual
  const [gaugeMode, setGaugeMode] = useState<"completeness" | "tp" | "bank">(
    "completeness"
  );
  const [bottomGridTab, setBottomGridTab] = useState<"objectives" | "mappings">(
    "objectives"
  );
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  // State Form Editor
  const [formData, setFormData] = useState({
    id: "",
    fase: "E",
    focus_unit: "",
    base_rationale: "",
    instrument_description: "",
  });
  const [objectives, setObjectives] = useState<
    { code: string; text: string }[]
  >([]);
  const [mappings, setMappings] = useState<{ code: string; desc: string }[]>(
    []
  );

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        quickMenuRef.current &&
        !quickMenuRef.current.contains(e.target as Node)
      ) {
        setIsQuickMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchInstrumentData = async () => {
    setIsLoading(true);
    try {
      const [instRes, evalRes] = await Promise.all([
        supabase
          .from("master_instruments")
          .select("*")
          .order("grade_level", { ascending: true }),
        supabase
          .from("master_evaluations")
          .select(
            "id, grade_level, type, question_bank(id, learning_objective_code)"
          )
          .eq("grade_level", activeGrade),
      ]);

      if (instRes.error) throw instRes.error;
      setAllInstruments(instRes.data || []);

      const qList: any[] = [];
      (evalRes.data || []).forEach((ev: any) => {
        if (Array.isArray(ev.question_bank)) {
          ev.question_bank.forEach((q: any) => {
            qList.push({
              ...q,
              eval_type: ev.type,
            });
          });
        }
      });
      setGradeQuestions(qList);
    } catch (error: any) {
      toast.error("Gagal menarik data rancangan & instrumen");
      triggerDynamicIsland(
        "Gagal Memuat Rancangan",
        "Periksa sambungan ke tabel master_instruments.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "view") fetchInstrumentData();
  }, [activeGrade, viewMode]);

  const instrument = useMemo(() => {
    return (
      allInstruments.find(
        (inst) => Number(inst.grade_level) === Number(activeGrade)
      ) || null
    );
  }, [allInstruments, activeGrade]);

  const parsedObjectives = useMemo(() => {
    if (!instrument?.objectives) return [];
    if (Array.isArray(instrument.objectives)) return instrument.objectives;
    if (typeof instrument.objectives === "string") {
      try {
        return JSON.parse(instrument.objectives);
      } catch {
        return [];
      }
    }
    return [];
  }, [instrument]);

  const parsedMappings = useMemo(() => {
    if (!instrument?.mappings) return [];
    if (Array.isArray(instrument.mappings)) return instrument.mappings;
    if (typeof instrument.mappings === "string") {
      try {
        return JSON.parse(instrument.mappings);
      } catch {
        return [];
      }
    }
    return [];
  }, [instrument]);

  // Hitung jumlah butir soal di question_bank yang terhubung ke setiap kode TP
  const questionCountByTpCode = useMemo(() => {
    const map: Record<string, number> = {};
    gradeQuestions.forEach((q) => {
      const code = String(q.learning_objective_code || "")
        .trim()
        .toUpperCase();
      if (code) {
        map[code] = (map[code] || 0) + 1;
      }
    });
    return map;
  }, [gradeQuestions]);

  // Persentase kelengkapan atribut dokumen instrumen pada kelas aktif
  const documentCompletenessPct = useMemo(() => {
    if (!instrument) return 0;
    let score = 0;
    if (String(instrument.focus_unit || "").trim()) score += 25;
    if (String(instrument.base_rationale || "").trim()) score += 25;
    if (String(instrument.instrument_description || "").trim()) score += 25;
    if (parsedObjectives.length > 0 && parsedMappings.length > 0) score += 25;
    else if (parsedObjectives.length > 0 || parsedMappings.length > 0)
      score += 15;
    return score;
  }, [instrument, parsedObjectives.length, parsedMappings.length]);

  const openForm = () => {
    const roman = getRomanGrade(activeGrade);
    if (instrument) {
      setFormData({
        id: instrument.id,
        fase: instrument.fase || (activeGrade === 10 ? "E" : "F"),
        focus_unit: instrument.focus_unit || "",
        base_rationale: instrument.base_rationale || "",
        instrument_description: instrument.instrument_description || "",
      });
      setObjectives(
        parsedObjectives.length > 0
          ? parsedObjectives.map((o: any) => ({
              code: o.code || "",
              text: o.text || "",
            }))
          : [
              {
                code: `${roman}-1`,
                text: "",
              },
            ]
      );
      setMappings(
        parsedMappings.length > 0
          ? parsedMappings.map((m: any) => ({
              code: m.code || "",
              desc: m.desc || "",
            }))
          : [{ code: `IND-${activeGrade}.1`, desc: "" }]
      );
    } else {
      setFormData({
        id: "",
        fase: activeGrade === 10 ? "E" : "F",
        focus_unit: "",
        base_rationale: "",
        instrument_description: "",
      });
      setObjectives([
        {
          code: `${roman}-1`,
          text: "",
        },
      ]);
      setMappings([{ code: `IND-${activeGrade}.1`, desc: "" }]);
    }
    setViewMode("form");
    triggerDynamicIsland(
      `Editor Kurikulum Kelas ${activeGrade}`,
      `Fase ${activeGrade === 10 ? "E" : "F"} · Susun CP, TP, dan Kisi-kisi Indikator.`,
      "info"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const cleanObjectives = objectives.filter(
      (o) => o.code.trim() || o.text.trim()
    );
    const cleanMappings = mappings.filter(
      (m) => m.code.trim() || m.desc.trim()
    );

    const payload = {
      grade_level: activeGrade,
      fase: formData.fase.trim(),
      focus_unit: formData.focus_unit.trim(),
      base_rationale: formData.base_rationale.trim(),
      instrument_description: formData.instrument_description.trim(),
      objectives: cleanObjectives,
      mappings: cleanMappings,
      updated_at: new Date().toISOString(),
    };

    try {
      if (formData.id) {
        const { error } = await supabase
          .from("master_instruments")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("master_instruments")
          .insert([payload]);
        if (error) throw error;
      }
      toast.success(
        `Rancangan & Instrumen Kelas ${activeGrade} berhasil disimpan!`
      );
      triggerDynamicIsland(
        "Rancangan Kurikulum Tersimpan",
        `Kelas ${activeGrade} (Fase ${payload.fase}) · ${cleanObjectives.length} TP & ${cleanMappings.length} Indikator.`,
        "success"
      );
      setViewMode("view");
    } catch (err: any) {
      toast.error("Gagal menyimpan rancangan: " + (err?.message || ""));
      triggerDynamicIsland(
        "Gagal Menyimpan Rancangan",
        err?.message || "Periksa kebijakan RLS pada master_instruments.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportDocument = () => {
    if (!instrument) {
      triggerDynamicIsland(
        "Dokumen Belum Tersedia",
        `Belum ada rancangan kurikulum untuk Kelas ${activeGrade}.`,
        "error"
      );
      return;
    }
    const lines = [
      `RANCANGAN & INSTRUMEN KURIKULUM PJOK KELAS ${activeGrade} (FASE ${instrument.fase})`,
      `====================================================================`,
      `Fokus Unit: ${instrument.focus_unit || "-"}`,
      ``,
      `1. LANDASAN RASIONAL PEMBELAJARAN:`,
      `${instrument.base_rationale || "-"}`,
      ``,
      `2. DESKRIPSI INSTRUMEN & KISI-KISI:`,
      `${instrument.instrument_description || "-"}`,
      ``,
      `3. DAFTAR TUJUAN PEMBELAJARAN (TP):`,
      ...parsedObjectives.map(
        (o: any, idx: number) => `   ${idx + 1}. [${o.code}] ${o.text}`
      ),
      ``,
      `4. PEMETAAN INDIKATOR INSTRUMEN:`,
      ...parsedMappings.map(
        (m: any, idx: number) => `   ${idx + 1}. [${m.code}] ${m.desc}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Instrumen_Kurikulum_Kelas_${activeGrade}_Fase_${instrument.fase}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerDynamicIsland(
      "Dokumen Rancangan Diunduh",
      `Berkas Instrumen Kelas ${activeGrade} (Fase ${instrument.fase}) berhasil diekspor.`,
      "success"
    );
  };

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
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 26,
            }}
            onClick={() => setIslandAlert(null)}
            className={`pointer-events-auto cursor-pointer flex items-center gap-3 px-4 py-3 rounded-[28px] min-w-[220px] max-w-[420px] dynamic-island-shell ${
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

  // ==========================================================================
  // MODE FORM: FULL-WIDTH ARCHITECTURAL EDITOR
  // ==========================================================================
  if (viewMode === "form") {
    const roman = getRomanGrade(activeGrade);

    return (
      <div className="w-full pt-2 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
        {renderDynamicIsland()}

        {/* ARCHITECTURAL HEADER FOR EDITOR */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-10 mb-10 border-b border-hairline relative z-20">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setViewMode("view")}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-card-primary"
              >
                <ArrowLeft size={15} /> Kembali ke Tampilan Instrumen
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-3 opacity-60">
              <span className="font-mono text-gold-accent">
                00 / EDITOR ARSITEKTUR KURIKULUM
              </span>
              <span>—</span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <LayoutTemplate size={14} /> KELAS {activeGrade} (FASE{" "}
                {formData.fase})
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tighter leading-tight">
              {formData.id ? "Perbarui" : "Susun"}{" "}
              <span className="font-semibold">
                Rancangan & Instrumen Kelas {activeGrade}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-end gap-8 shrink-0">
            <div>
              <div className="text-5xl md:text-6xl font-light font-mono tracking-tighter leading-none">
                {objectives.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-55 mt-2">
                01 / Butir TP
              </div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
                {mappings.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-55 mt-2">
                02 / Indikator
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] btn-forest-emerald"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Rancangan"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. INFORMASI DASAR & LANDASAN KURIKULUM */}
          <div className="rounded-[2rem] p-8 md:p-10 space-y-8 relative overflow-hidden edufit-card-primary">
            <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

            <div className="flex items-center justify-between border-b border-hairline pb-4 relative z-10">
              <div>
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                  01 / FONDASI PEDAGOGIS
                </span>
                <h3 className="text-2xl font-light tracking-tight">
                  Identitas Fase &{" "}
                  <span className="font-semibold">Landasan Kurikulum</span>
                </h3>
              </div>
              <span className="text-xs font-bold font-mono uppercase tracking-widest opacity-60">
                KELAS {activeGrade}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
              <div className="md:col-span-3">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2.5">
                  Fase Kurikulum Merdeka
                </label>
                <div className="flex gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                  {["E", "F"].map((f) => {
                    const active = formData.fase === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormData({ ...formData, fase: f })}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          active ? "seg-btn-active" : "seg-btn-idle"
                        }`}
                      >
                        FASE {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-9">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                  Fokus Utama Unit Kelas {activeGrade}
                </label>
                <input
                  required
                  type="text"
                  value={formData.focus_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, focus_unit: e.target.value })
                  }
                  placeholder="Contoh: Menganalisis konsep kebugaran jasmani terkait kesehatan dan keterampilan..."
                  className="w-full bg-transparent py-3 text-2xl font-light tracking-tight outline-none edufit-underline-select"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                  Landasan Rasional Pembelajaran
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.base_rationale}
                  onChange={(e) =>
                    setFormData({ ...formData, base_rationale: e.target.value })
                  }
                  placeholder="Tuliskan rasional ilmiah dan pedagogis untuk jenjang ini..."
                  className="w-full p-5 rounded-2xl text-sm outline-none resize-y leading-relaxed edufit-surface-subtle"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                  Deskripsi Kisi-Kisi Instrumen
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.instrument_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      instrument_description: e.target.value,
                    })
                  }
                  placeholder="Tuliskan struktur kisi-kisi penilaian kognitif, refleksi, dan praktik..."
                  className="w-full p-5 rounded-2xl text-sm outline-none resize-y leading-relaxed edufit-surface-subtle"
                />
              </div>
            </div>
          </div>

          {/* 2. TUJUAN PEMBELAJARAN (OBJECTIVES) & PEMETAAN INDIKATOR (MAPPINGS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri: Tujuan Pembelajaran */}
            <div className="rounded-[2rem] p-8 md:p-10 space-y-6 edufit-card-primary">
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-55 block">
                    02 / KOMPONEN KOMPETENSI
                  </span>
                  <h3 className="text-2xl font-light tracking-tight">
                    Daftar <span className="font-semibold">Tujuan Belajar</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setObjectives([
                      ...objectives,
                      {
                        code: `${roman}-${objectives.length + 1}`,
                        text: "",
                      },
                    ])
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer btn-forest-emerald"
                >
                  + Tambah TP
                </button>
              </div>

              <div className="space-y-3">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <input
                      required
                      type="text"
                      value={obj.code}
                      onChange={(e) => {
                        const next = [...objectives];
                        next[i].code = e.target.value;
                        setObjectives(next);
                      }}
                      placeholder={`Kode (${roman}-1)`}
                      className="w-28 px-3.5 py-3.5 rounded-2xl text-xs font-bold font-mono text-center outline-none edufit-surface-subtle"
                    />
                    <input
                      required
                      type="text"
                      value={obj.text}
                      onChange={(e) => {
                        const next = [...objectives];
                        next[i].text = e.target.value;
                        setObjectives(next);
                      }}
                      placeholder="Rumusan Tujuan Pembelajaran..."
                      className="flex-1 px-4 py-3.5 rounded-2xl text-xs font-medium outline-none edufit-surface-subtle"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setObjectives(
                          objectives.filter((_, idx) => idx !== i)
                        )
                      }
                      className="p-3.5 rounded-2xl cursor-pointer badge-tint-rose hover:opacity-80"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Pemetaan Indikator (Mappings) */}
            <div className="rounded-[2rem] p-8 md:p-10 space-y-6 edufit-card-secondary">
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-55 block">
                    03 / MATRIKS EVALUASI
                  </span>
                  <h3 className="text-2xl font-light tracking-tight">
                    Pemetaan{" "}
                    <span className="font-semibold">Kisi-Kisi Indikator</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMappings([
                      ...mappings,
                      {
                        code: `IND-${activeGrade}.${mappings.length + 1}`,
                        desc: "",
                      },
                    ])
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer telemetry-bar-forest"
                >
                  + Tambah Indikator
                </button>
              </div>

              <div className="space-y-3">
                {mappings.map((mp, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <input
                      required
                      type="text"
                      value={mp.code}
                      onChange={(e) => {
                        const next = [...mappings];
                        next[i].code = e.target.value;
                        setMappings(next);
                      }}
                      placeholder="Label/No"
                      className="w-28 px-3.5 py-3.5 rounded-2xl text-xs font-bold font-mono text-center outline-none edufit-surface-subtle"
                    />
                    <input
                      required
                      type="text"
                      value={mp.desc}
                      onChange={(e) => {
                        const next = [...mappings];
                        next[i].desc = e.target.value;
                        setMappings(next);
                      }}
                      placeholder="Indikator pencapaian / pemetaan soal..."
                      className="flex-1 px-4 py-3.5 rounded-2xl text-xs font-medium outline-none edufit-surface-subtle"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMappings(mappings.filter((_, idx) => idx !== i))
                      }
                      className="p-3.5 rounded-2xl cursor-pointer badge-tint-rose hover:opacity-80"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================================================
  // MODE VIEW: TAMPILAN UTAMA RANCANGAN & INSTRUMEN
  // ==========================================================================
  const romanActive = getRomanGrade(activeGrade);

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {renderDynamicIsland()}

      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">
              00 / ARSITEKTUR KURIKULUM
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Target size={15} />
              Kurikulum Merdeka PJOK · Kelas {activeGrade} (Fase{" "}
              {instrument?.fase || (activeGrade === 10 ? "E" : "F")})
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Rancangan & <br />
            <span className="font-semibold">Instrumen</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : parsedObjectives.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              01 / Tujuan Belajar (TP)
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : parsedMappings.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              02 / Pemetaan Indikator
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : gradeQuestions.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              03 / Soal Kelas {activeGrade}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI INSTRUMEN
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Fase Kurikulum */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Fase Kurikulum</span>
            <span className="font-mono">KELAS {activeGrade}</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              Fase {instrument?.fase || (activeGrade === 10 ? "E" : "F")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              SMA / SMK
            </span>
          </div>
        </div>

        {/* Bar 2: Keterhubungan TP ke Bank Soal */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Sinkronisasi TP</span>
            <span className="font-mono">BANK EVALUASI</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {Object.keys(questionCountByTpCode).length}/
              {Math.max(1, parsedObjectives.length)} Kode TP
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Terpetakan
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Murni */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kelengkapan Dokumen Rancangan</span>
            <span className="font-mono">KELAS {activeGrade}</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${documentCompletenessPct}% Lengkap`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              {instrument ? "Dokumen Aktif" : "Belum Diisi"}
            </span>
          </div>
        </div>

        {/* Bar 4: Total Jenjang Terisi */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Cakupan Jenjang</span>
            <span className="font-mono">X–XII</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${allInstruments.length}/3 Kelas`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (POLKADOT + GRID MILIMETER + DIAGONAL)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): PILIH JENJANG KELAS & EKSPOR/EDIT */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55">
                <span className="font-mono">01 /</span>
                <SlidersHorizontal size={14} />
                <span>Filter Jenjang</span>
              </div>
              <button
                type="button"
                onClick={handleExportDocument}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Unduh Dokumen Instrumen (.TXT)"
              >
                <Download size={15} />
              </button>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Kendali Rancangan
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih angkatan kelas untuk meninjau atau menyunting CP, TP, dan
              kisi-kisi instrumen.
            </p>

            {/* Segmented Filter Kelas */}
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[10, 11, 12].map((g) => {
                const active = activeGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setActiveGrade(g);
                      triggerDynamicIsland(
                        `Fokus Kurikulum Kelas ${g}`,
                        `Menampilkan rancangan Fase ${
                          g === 10 ? "E" : "F"
                        } dan pemetaan soal ${getRomanGrade(g)}.`,
                        "info"
                      );
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    Kelas {g}
                  </button>
                );
              })}
            </div>

            {/* Bottom-Bordered Custom Dropdown Fokus Tampilan */}
            <div className="relative w-full mb-6" ref={quickMenuRef}>
              <div
                onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isQuickMenuOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {bottomGridTab === "objectives"
                    ? `Tujuan Pembelajaran (${parsedObjectives.length} TP)`
                    : `Pemetaan Indikator (${parsedMappings.length} Poin)`}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isQuickMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isQuickMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden edufit-dropdown-menu"
                  >
                    <div
                      onClick={() => {
                        setBottomGridTab("objectives");
                        setIsQuickMenuOpen(false);
                      }}
                      className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        bottomGridTab === "objectives" ? "text-gold-accent" : ""
                      }`}
                    >
                      Daftar Tujuan Pembelajaran ({parsedObjectives.length} TP)
                    </div>
                    <div
                      onClick={() => {
                        setBottomGridTab("mappings");
                        setIsQuickMenuOpen(false);
                      }}
                      className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        bottomGridTab === "mappings" ? "text-gold-accent" : ""
                      }`}
                    >
                      Pemetaan Indikator Kisi-Kisi ({parsedMappings.length}{" "}
                      Poin)
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 pt-2">
            <button
              type="button"
              onClick={handleExportDocument}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm telemetry-bar-forest"
            >
              <Download size={15} /> Unduh Dokumen
            </button>

            <button
              type="button"
              onClick={openForm}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm btn-forest-emerald"
            >
              <Edit3 size={15} />{" "}
              {instrument ? "Edit Rancangan" : "Buat Rancangan"}
            </button>
          </div>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): DISTRIBUSI BUTIR SOAL PER KODE TP */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">02 /</span>
              <Database size={15} />
              <span>Sebaran Soal per Kode TP</span>
            </div>
            <Link
              href="/admin/evaluasi"
              className="text-xs font-bold font-mono opacity-65 hover:opacity-100 flex items-center gap-1"
            >
              BANK SOAL <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : gradeQuestions.length}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Total Butir Soal Kelas {activeGrade}
            </div>
          </div>

          {(() => {
            // Menggunakan awalan Romawi (X-1, XI-1, XII-1) agar sinkron 100% dengan question_bank!
            const tpListForChart =
              parsedObjectives.length > 0
                ? parsedObjectives.slice(0, 6)
                : [
                    { code: `${romanActive}-1`, text: "" },
                    { code: `${romanActive}-2`, text: "" },
                    { code: `${romanActive}-3`, text: "" },
                    { code: `${romanActive}-4`, text: "" },
                  ];

            const maxQ = Math.max(
              1,
              ...tpListForChart.map(
                (o: any) =>
                  questionCountByTpCode[
                    String(o.code || "").trim().toUpperCase()
                  ] || 0
              )
            );

            return (
              <div
                className="grid gap-3 items-end pt-4 h-44 relative z-10"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    tpListForChart.length
                  )}, minmax(0, 1fr))`,
                }}
              >
                {tpListForChart.map((obj: any, idx: number) => {
                  const cleanCode = String(obj.code || "")
                    .trim()
                    .toUpperCase();
                  const qCnt = questionCountByTpCode[cleanCode] || 0;
                  const heightPct = Math.round((qCnt / maxQ) * 100);
                  const isHighest = qCnt === maxQ && qCnt > 0;
                  const fillClass = isHighest
                    ? "chart-fill-gold"
                    : "chart-fill-primary";

                  return (
                    <div
                      key={cleanCode || idx}
                      className="flex flex-col items-center justify-end h-full gap-2"
                      title={`${cleanCode}: ${qCnt} Butir Soal di Bank Evaluasi`}
                    >
                      <span className="text-[11px] font-bold font-mono opacity-80">
                        {qCnt}s
                      </span>
                      <div className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div
                          className={`w-full rounded-full transition-all duration-500 ${fillClass}`}
                          style={{
                            height: `${Math.max(
                              qCnt > 0 ? 18 : 10,
                              heightPct
                            )}%`,
                          }}
                        />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                      <span className="text-[10px] font-bold font-mono opacity-65 truncate max-w-full">
                        {cleanCode || `${romanActive}-${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS INSTRUMEN */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">03 /</span>
              <Activity size={15} />
              <span>Indeks Instrumen</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "completeness", label: "Dokumen" },
                { key: "tp", label: "TP" },
                { key: "bank", label: "Soal" },
              ].map((m) => {
                const active = gaugeMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setGaugeMode(m.key as any)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "edufit-surface-subtle"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(() => {
            const gaugeValue =
              gaugeMode === "completeness"
                ? `${documentCompletenessPct}%`
                : gaugeMode === "tp"
                ? `${parsedObjectives.length}`
                : `${gradeQuestions.length}`;

            const gaugeLabel =
              gaugeMode === "completeness"
                ? "Kelengkapan Rancangan"
                : gaugeMode === "tp"
                ? "Tujuan Pembelajaran (TP)"
                : `Butir Soal Kelas ${activeGrade}`;

            const gaugePct =
              gaugeMode === "completeness"
                ? documentCompletenessPct
                : gaugeMode === "tp"
                ? Math.min(100, parsedObjectives.length * 25)
                : Math.min(100, Math.round((gradeQuestions.length / 60) * 100));

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
                      gaugeMode === "tp"
                        ? "gauge-circle-emerald"
                        : "gauge-circle-gold"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl font-light font-mono tracking-tighter leading-none">
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
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-3 border-t border-hairline">
              <span>
                Fase {instrument?.fase || (activeGrade === 10 ? "E" : "F")}
              </span>
              <span>—</span>
              <span>{parsedObjectives.length} TP</span>
              <span>—</span>
              <span>{parsedMappings.length} Indikator</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: FOKUS UNIT & LANDASAN RASIONAL (KIRI col-span-7)
                  + PANEL DEEP FOREST DESKRIPSI KISI-KISI INSTRUMEN (KANAN col-span-5)
         ==================================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-7 h-72 rounded-[2rem] animate-pulse edufit-surface-subtle" />
          <div className="lg:col-span-5 h-72 rounded-[2rem] animate-pulse edufit-surface-subtle" />
        </div>
      ) : !instrument ? (
        <div className="p-16 text-center rounded-[2rem] border border-dashed border-hairline mb-10 opacity-75">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h3 className="text-2xl font-light mb-2">
            Belum Ada Rancangan untuk Kelas {activeGrade}
          </h3>
          <button
            type="button"
            onClick={openForm}
            className="mt-4 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer shadow-md btn-forest-emerald"
          >
            <Plus size={16} /> Buat Rancangan Kelas {activeGrade}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12 relative z-10">
            {/* KIRI (col-span-7): FOKUS PEMBELAJARAN & LANDASAN RASIONAL */}
            <div className="lg:col-span-7 p-8 md:p-10 rounded-[2rem] flex flex-col justify-between gap-6 edufit-card-primary">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-xs font-bold font-mono uppercase tracking-widest opacity-55">
                    04 / FOKUS UTAMA PEMBELAJARAN · KELAS {activeGrade} (FASE{" "}
                    {instrument.fase})
                  </span>
                  <button
                    type="button"
                    onClick={openForm}
                    className="px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer edufit-surface-subtle"
                  >
                    Sunting Teks
                  </button>
                </div>

                <h2 className="text-2xl md:text-3xl font-light tracking-tight leading-snug mb-6">
                  {instrument.focus_unit}
                </h2>

                {instrument.base_rationale && (
                  <div className="p-6 rounded-2xl edufit-surface-subtle">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-2">
                      LANDASAN RASIONAL ILMIAH & PEDAGOGIS
                    </span>
                    <p className="text-sm leading-relaxed whitespace-pre-line opacity-85">
                      {instrument.base_rationale}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs font-bold font-mono uppercase tracking-widest opacity-60">
                <span>TERSINKRON OTOMATIS KE APLIKASI SISWA</span>
                <span>
                  DIPERBARUI:{" "}
                  {instrument.updated_at
                    ? new Date(instrument.updated_at).toLocaleDateString(
                        "id-ID"
                      )
                    : "AKTIF"}
                </span>
              </div>
            </div>

            {/* KANAN (col-span-5): PANEL DEEP FOREST KISI-KISI & ACUAN INSTRUMEN */}
            <div className="lg:col-span-5 p-8 md:p-10 rounded-[2rem] flex flex-col justify-between gap-6 edufit-card-secondary">
              <div>
                <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">
                  05 / SPESIFIKASI PENILAIAN
                </div>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-3xl font-light tracking-tight">
                    Kisi-Kisi Instrumen
                  </h3>
                  <span className="text-4xl font-light font-mono tracking-tighter text-emerald-accent">
                    Fase {instrument.fase}
                  </span>
                </div>
                <p className="text-xs font-medium opacity-55">
                  Acuan penyusunan soal evaluasi kognitif, refleksi materi, dan
                  pengukuran fisik.
                </p>
              </div>

              <div className="flex-1 rounded-[1.75rem] p-6 md:p-7 flex flex-col justify-between edufit-panel-forest">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent">
                      STRUKTUR EVALUASI KELAS {activeGrade}
                    </span>
                    <FileText size={16} className="text-gold-accent" />
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">
                    {instrument.instrument_description ||
                      "Belum ada deskripsi kisi-kisi instrumen."}
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-white/60">
                    TOTAL INDIKATOR TERPETAKAN
                  </span>
                  <span className="font-bold text-gold-accent">
                    {parsedMappings.length} INDIKATOR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================
              ZONA 5: GRID KARTU BESAR PASTEL / DEEP FOREST (TUJUAN BELAJAR & INDIKATOR)
             ================================================================== */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setBottomGridTab("objectives")}
                className={`text-2xl font-light tracking-tight transition-opacity cursor-pointer ${
                  bottomGridTab === "objectives"
                    ? "opacity-100 font-semibold underline decoration-gold-accent decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                06 / Daftar Tujuan Pembelajaran ({parsedObjectives.length})
              </button>
              <button
                type="button"
                onClick={() => setBottomGridTab("mappings")}
                className={`text-2xl font-light tracking-tight transition-opacity cursor-pointer ${
                  bottomGridTab === "mappings"
                    ? "opacity-100 font-semibold underline decoration-gold-accent decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                07 / Pemetaan Indikator Kisi-Kisi ({parsedMappings.length})
              </button>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer btn-forest-emerald"
            >
              <Edit3 size={14} /> Kelola TP & Indikator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {bottomGridTab === "objectives"
              ? parsedObjectives.map((obj: any, index: number) => {
                  const showcaseClass =
                    BENTO_SHOWCASE_CLASSES[
                      index % BENTO_SHOWCASE_CLASSES.length
                    ];
                  const cleanCode = String(obj.code || "")
                    .trim()
                    .toUpperCase();
                  const linkedQCount = questionCountByTpCode[cleanCode] || 0;

                  return (
                    <div
                      key={index}
                      className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[290px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group ${showcaseClass}`}
                    >
                      <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                      <div className="flex justify-between items-start relative z-10">
                        <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                          TUJUAN PEMBELAJARAN · {obj.code}
                        </span>
                        <Link
                          href="/admin/evaluasi"
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                          title="Lihat Soal Terkait di Bank Evaluasi"
                        >
                          <ArrowUpRight size={18} strokeWidth={1.75} />
                        </Link>
                      </div>

                      <div className="my-6 relative z-10">
                        <div className="text-2xl md:text-3xl font-light tracking-tight leading-snug">
                          {obj.text}
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                            Kode Kompetensi
                          </div>
                          <div className="text-3xl font-light font-mono leading-none">
                            {obj.code}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                            Soal Terhubung
                          </div>
                          <div className="text-3xl font-light font-mono leading-none">
                            {linkedQCount}{" "}
                            <span className="text-xs font-sans font-medium opacity-60">
                              Soal
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : parsedMappings.map((mp: any, index: number) => {
                  const showcaseClass =
                    BENTO_SHOWCASE_CLASSES[
                      index % BENTO_SHOWCASE_CLASSES.length
                    ];
                  return (
                    <div
                      key={index}
                      className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[290px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group ${showcaseClass}`}
                    >
                      <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                      <div className="flex justify-between items-start relative z-10">
                        <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                          INDIKATOR KISI-KISI 0{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={openForm}
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>

                      <div className="my-6 relative z-10">
                        <div className="text-2xl md:text-3xl font-light tracking-tight leading-snug">
                          {mp.desc}
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                            Label Pemetaan
                          </div>
                          <div className="text-2xl font-light font-mono leading-none">
                            {mp.code}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                            Tingkat Kelas
                          </div>
                          <div className="text-3xl font-light font-mono leading-none">
                            Kelas {activeGrade}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </>
      )}
    </div>
  );
}