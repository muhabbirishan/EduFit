// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Database,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  Layers,
  LayoutTemplate,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function InstrumenPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [allInstruments, setAllInstruments] = useState<any[]>([]);
  const [gradeQuestions, setGradeQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"view" | "form">("view");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Kontrol Visual Masterpiece
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
          .select("id, grade_level, type, question_bank(id, learning_objective_code)")
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
                code:
                  activeGrade === 10
                    ? "X-1"
                    : activeGrade === 11
                    ? "XI-1"
                    : "XII-1",
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
          code:
            activeGrade === 10 ? "X-1" : activeGrade === 11 ? "XI-1" : "XII-1",
          text: "",
        },
      ]);
      setMappings([{ code: "Indikator 1", desc: "" }]);
    }
    setViewMode("form");
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
      setViewMode("view");
    } catch (err: any) {
      toast.error("Gagal menyimpan rancangan: " + (err?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportDocument = () => {
    if (!instrument)
      return toast.error("Belum ada data rancangan untuk diunduh");
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
    toast.success(`Dokumen Instrumen Kelas ${activeGrade} berhasil diunduh!`);
  };

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

  if (!mounted) return null;

  // ==========================================================================
  // MODE FORM: FULL-WIDTH ARCHITECTURAL EDITOR ("THE MASTERPIECE ADMINISTRATOR")
  // ==========================================================================
  if (viewMode === "form") {
    return (
      <div className="w-full pt-2 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* ARCHITECTURAL HEADER FOR EDITOR */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-10 relative z-20">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setViewMode("view")}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: isDark ? "#111111" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                <ArrowLeft size={15} /> Kembali ke Tampilan Instrumen
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-2 opacity-50">
              <LayoutTemplate size={16} /> Editor Arsitektur Kurikulum • Kelas{" "}
              {activeGrade}
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
              <div className="text-5xl md:text-6xl font-light tracking-tighter leading-none">
                {objectives.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-50 mt-2">
                Butir TP
              </div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-light tracking-tighter leading-none">
                {mappings.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-50 mt-2">
                Indikator
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] text-white"
              style={{ backgroundColor: "#10b981" }}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Rancangan"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. INFORMASI DASAR & LANDASAN KURIKULUM */}
          <div
            className="rounded-[2.5rem] p-8 md:p-10 border space-y-8 relative overflow-hidden shadow-sm"
            style={{
              backgroundColor: isDark ? "#111111" : "#ffffff",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(currentColor 2px, transparent 2px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div
              className="flex items-center justify-between border-b pb-4 relative z-10"
              style={{ borderColor: "var(--ref-card-border)" }}
            >
              <h3 className="text-2xl font-light tracking-tight">
                1. Identitas Fase &{" "}
                <span className="font-semibold">Landasan Kurikulum</span>
              </h3>
              <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                Kelas {activeGrade}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
              <div className="md:col-span-3">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2.5">
                  Fase Kurikulum Merdeka
                </label>
                <div
                  className="flex gap-2 p-1.5 rounded-full"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  {["E", "F"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormData({ ...formData, fase: f })}
                      className="flex-1 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
                      style={{
                        backgroundColor:
                          formData.fase === f ? "#facc15" : "transparent",
                        color: formData.fase === f ? "#000" : "inherit",
                        opacity: formData.fase === f ? 1 : 0.5,
                      }}
                    >
                      Fase {f}
                    </button>
                  ))}
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
                  className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight outline-none"
                  style={{
                    borderColor: isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.15)",
                  }}
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
                  className="w-full p-5 rounded-3xl text-sm border outline-none resize-y leading-relaxed"
                  style={{
                    backgroundColor: "var(--ref-card-subtle)",
                    borderColor: "var(--ref-card-border)",
                    color: "var(--ref-text-primary)",
                  }}
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
                  className="w-full p-5 rounded-3xl text-sm border outline-none resize-y leading-relaxed"
                  style={{
                    backgroundColor: "var(--ref-card-subtle)",
                    borderColor: "var(--ref-card-border)",
                    color: "var(--ref-text-primary)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 2. TUJUAN PEMBELAJARAN (OBJECTIVES) & PEMETAAN INDIKATOR (MAPPINGS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri: Tujuan Pembelajaran */}
            <div
              className="rounded-[2.5rem] p-8 md:p-10 border space-y-6"
              style={{
                backgroundColor: isDark ? "#111111" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: "var(--ref-card-border)" }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block">
                    Komponen Kompetensi
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
                        code: `${
                          activeGrade === 10
                            ? "X"
                            : activeGrade === 11
                            ? "XI"
                            : "XII"
                        }-${objectives.length + 1}`,
                        text: "",
                      },
                    ])
                  }
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer text-white"
                  style={{ backgroundColor: "#10b981" }}
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
                      placeholder="Kode (X-1)"
                      className="w-28 px-3.5 py-3.5 rounded-2xl text-xs font-bold text-center border outline-none"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                        color: "var(--ref-text-primary)",
                      }}
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
                      className="flex-1 px-4 py-3.5 rounded-2xl text-xs font-medium border outline-none"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                        color: "var(--ref-text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setObjectives(
                          objectives.filter((_, idx) => idx !== i)
                        )
                      }
                      className="p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Pemetaan Indikator (Mappings) */}
            <div
              className="rounded-[2.5rem] p-8 md:p-10 border space-y-6"
              style={{
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: "var(--ref-card-border)" }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block">
                    Matriks Evaluasi
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
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  style={{
                    backgroundColor: isDark ? "#ffffff" : "#18181b",
                    color: isDark ? "#18181b" : "#ffffff",
                  }}
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
                      className="w-28 px-3.5 py-3.5 rounded-2xl text-xs font-bold text-center border outline-none"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                        color: "var(--ref-text-primary)",
                      }}
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
                      className="flex-1 px-4 py-3.5 rounded-2xl text-xs font-medium border outline-none"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                        color: "var(--ref-text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMappings(mappings.filter((_, idx) => idx !== i))
                      }
                      className="p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 cursor-pointer"
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
  // MODE VIEW: TAMPILAN UTAMA RANCANGAN & INSTRUMEN ("THE MASTERPIECE ADMINISTRATOR")
  // ==========================================================================
  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <Target size={16} /> Arsitektur Kurikulum Merdeka PJOK • Kelas{" "}
            {activeGrade} (Fase{" "}
            {instrument?.fase || (activeGrade === 10 ? "E" : "F")})
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Rancangan & <br />
            <span className="font-semibold">Instrumen</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : parsedObjectives.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Tujuan Belajar (TP)
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {isLoading ? "—" : parsedMappings.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Pemetaan Indikator
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : gradeQuestions.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Soal Kelas {activeGrade}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI INSTRUMEN (MURNI GARIS-GARIS TANPA PILL BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Fase Kurikulum */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Fase Kurikulum</span>
            <span>Kelas {activeGrade}</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              Fase {instrument?.fase || (activeGrade === 10 ? "E" : "F")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
              SMA / SMK
            </span>
          </div>
        </div>

        {/* Bar 2: Keterhubungan TP ke Bank Soal */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Sinkronisasi TP</span>
            <span>Bank Evaluasi</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {Object.keys(questionCountByTpCode).length}/
              {Math.max(1, parsedObjectives.length)} Kode TP
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Terpetakan
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kelengkapan Dokumen Rancangan</span>
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
              {isLoading ? "—" : `${documentCompletenessPct}% Lengkap`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              {instrument ? "Aktif" : "Kosong"}
            </span>
          </div>
        </div>

        {/* Bar 4: Total Jenjang Terisi */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Cakupan Jenjang</span>
            <span>10, 11 & 12</span>
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
              {isLoading ? "—" : `${allInstruments.length}/3 Kelas`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): PILIH JENJANG KELAS & EKSPOR/EDIT */}
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
                Kendali Rancangan
              </h2>
              <button
                type="button"
                onClick={handleExportDocument}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: "var(--ref-card-subtle)",
                  borderColor: "var(--ref-card-border)",
                }}
                title="Unduh Dokumen Instrumen (.TXT)"
              >
                <Download size={16} />
              </button>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Pilih angkatan kelas untuk meninjau atau menyunting CP, TP, dan
              kisi-kisi instrumen.
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

            {/* Bottom-Bordered Custom Dropdown Fokus Tampilan */}
            <div className="relative w-full mb-6" ref={quickMenuRef}>
              <div
                onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  {bottomGridTab === "objectives"
                    ? `Tujuan Pembelajaran (${parsedObjectives.length} TP)`
                    : `Pemetaan Indikator (${parsedMappings.length} Poin)`}
                </span>
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
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
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      onClick={() => {
                        setBottomGridTab("objectives");
                        setIsQuickMenuOpen(false);
                      }}
                      className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${
                        isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                      style={{
                        color:
                          bottomGridTab === "objectives"
                            ? "#facc15"
                            : isDark
                            ? "#fff"
                            : "#000",
                      }}
                    >
                      Daftar Tujuan Pembelajaran ({parsedObjectives.length} TP)
                    </div>
                    <div
                      onClick={() => {
                        setBottomGridTab("mappings");
                        setIsQuickMenuOpen(false);
                      }}
                      className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${
                        isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                      style={{
                        color:
                          bottomGridTab === "mappings"
                            ? "#facc15"
                            : isDark
                            ? "#fff"
                            : "#000",
                      }}
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
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm"
              style={{
                backgroundColor: isDark ? "#ffffff" : "#18181b",
                color: isDark ? "#18181b" : "#ffffff",
              }}
            >
              <Download size={15} /> Unduh Dokumen
            </button>

            <button
              type="button"
              onClick={openForm}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm text-white"
              style={{ backgroundColor: "#10b981" }}
            >
              <Edit3 size={15} />{" "}
              {instrument ? "Edit Rancangan" : "Buat Rancangan"}
            </button>
          </div>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): DISTRIBUSI BUTIR SOAL PER KODE TP (VERTICAL PILL BARS + DOTS) */}
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
              <Database size={16} /> Sebaran Soal per Kode TP
            </div>
            <Link
              href="/admin/evaluasi"
              className="text-xs font-bold opacity-60 hover:opacity-100 flex items-center gap-1"
            >
              Bank Soal <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : gradeQuestions.length}
            </div>
            <div className="text-sm font-semibold opacity-50 mb-1">
              Total Butir Soal Kelas {activeGrade}
            </div>
          </div>

          {(() => {
            const tpListForChart =
              parsedObjectives.length > 0
                ? parsedObjectives.slice(0, 6)
                : [
                    { code: `${activeGrade}-1`, text: "" },
                    { code: `${activeGrade}-2`, text: "" },
                    { code: `${activeGrade}-3`, text: "" },
                    { code: `${activeGrade}-4`, text: "" },
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

                  return (
                    <div
                      key={cleanCode || idx}
                      className="flex flex-col items-center justify-end h-full gap-2"
                      title={`${cleanCode}: ${qCnt} Butir Soal di Bank Evaluasi`}
                    >
                      <span className="text-[11px] font-bold opacity-75">
                        {qCnt}s
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
                          className="w-full rounded-full transition-all duration-500"
                          style={{
                            height: `${Math.max(
                              qCnt > 0 ? 18 : 10,
                              heightPct
                            )}%`,
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
                        {cleanCode || `TP${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS INSTRUMEN */}
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
              <Activity size={16} /> Indeks Instrumen
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
            <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-3 border-t border-black/10 dark:border-white/10">
              <span>Fase {instrument?.fase || (activeGrade === 10 ? "E" : "F")}</span>
              <span>•</span>
              <span>{parsedObjectives.length} TP</span>
              <span>•</span>
              <span>{parsedMappings.length} Indikator</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: FOKUS UNIT & LANDASAN RASIONAL (KIRI col-span-7)
                  + PANEL GELAP DESKRIPSI KISI-KISI INSTRUMEN (KANAN col-span-5)
         ==================================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div
            className="lg:col-span-7 h-72 rounded-[2.5rem] animate-pulse"
            style={{ backgroundColor: "var(--ref-card-subtle)" }}
          />
          <div
            className="lg:col-span-5 h-72 rounded-[2.5rem] animate-pulse"
            style={{ backgroundColor: "var(--ref-card-subtle)" }}
          />
        </div>
      ) : !instrument ? (
        <div
          className="p-16 text-center rounded-[2.5rem] border border-dashed mb-10"
          style={{
            borderColor: "var(--ref-card-border)",
            color: "var(--ref-text-secondary)",
          }}
        >
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h3
            className="text-2xl font-light mb-2"
            style={{ color: "var(--ref-text-primary)" }}
          >
            Belum Ada Rancangan untuk Kelas {activeGrade}
          </h3>
          <button
            type="button"
            onClick={openForm}
            className="mt-4 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer text-white shadow-md"
            style={{ backgroundColor: "#10b981" }}
          >
            <Plus size={16} /> Buat Rancangan Kelas {activeGrade}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12 relative z-10">
            {/* KIRI (col-span-7): FOKUS PEMBELAJARAN & LANDASAN RASIONAL */}
            <div
              className="lg:col-span-7 p-8 md:p-10 rounded-[2.5rem] border flex flex-col justify-between gap-6 shadow-sm"
              style={{
                backgroundColor: isDark ? "#111111" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                    01 — Fokus Utama Pembelajaran • Kelas {activeGrade} (Fase{" "}
                    {instrument.fase})
                  </span>
                  <button
                    type="button"
                    onClick={openForm}
                    className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border cursor-pointer"
                    style={{
                      backgroundColor: "var(--ref-card-subtle)",
                      borderColor: "var(--ref-card-border)",
                    }}
                  >
                    Sunting Teks
                  </button>
                </div>

                <h2 className="text-2xl md:text-3xl font-light tracking-tight leading-snug mb-6">
                  {instrument.focus_unit}
                </h2>

                {instrument.base_rationale && (
                  <div
                    className="p-6 rounded-3xl border"
                    style={{
                      backgroundColor: "var(--ref-card-subtle)",
                      borderColor: "var(--ref-card-border)",
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-2">
                      Landasan Rasional Ilmiah & Pedagogis
                    </span>
                    <p className="text-sm leading-relaxed whitespace-pre-line opacity-85">
                      {instrument.base_rationale}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest opacity-60"
                style={{ borderColor: "var(--ref-card-border)" }}
              >
                <span>Tersinkron Otomatis ke Aplikasi Siswa</span>
                <span>
                  Diperbarui:{" "}
                  {instrument.updated_at
                    ? new Date(instrument.updated_at).toLocaleDateString(
                        "id-ID"
                      )
                    : "Aktif"}
                </span>
              </div>
            </div>

            {/* KANAN (col-span-5): PANEL GELAP KISI-KISI & ACUAN INSTRUMEN */}
            <div
              className="lg:col-span-5 p-8 md:p-10 rounded-[2.5rem] border flex flex-col justify-between gap-6 shadow-sm"
              style={{
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-3xl font-light tracking-tight">
                    Kisi-Kisi Instrumen
                  </h3>
                  <span className="text-4xl font-light tracking-tighter">
                    Fase {instrument.fase}
                  </span>
                </div>
                <p className="text-xs font-medium opacity-50 mb-6">
                  Acuan penyusunan soal evaluasi kognitif, refleksi materi, dan
                  pengukuran fisik.
                </p>
              </div>

              <div
                className="flex-1 rounded-[2rem] p-6 md:p-7 flex flex-col justify-between"
                style={{
                  backgroundColor: "var(--ref-dark-panel)",
                  color: "var(--ref-dark-panel-text)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#facc15]">
                      Struktur Evaluasi Kelas {activeGrade}
                    </span>
                    <FileText size={16} className="text-[#facc15]" />
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">
                    {instrument.instrument_description ||
                      "Belum ada deskripsi kisi-kisi instrumen."}
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    Total Indikator Terpetakan
                  </span>
                  <span className="font-bold text-[#facc15]">
                    {parsedMappings.length} Indikator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================
              ZONA 5: GRID KARTU BESAR PASTEL / DARK (TUJUAN BELAJAR & INDIKATOR)
             ================================================================== */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setBottomGridTab("objectives")}
                className={`text-xl font-light tracking-tight transition-opacity cursor-pointer ${
                  bottomGridTab === "objectives"
                    ? "opacity-100 font-semibold underline decoration-[#facc15] decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                Daftar Tujuan Pembelajaran ({parsedObjectives.length})
              </button>
              <button
                type="button"
                onClick={() => setBottomGridTab("mappings")}
                className={`text-xl font-light tracking-tight transition-opacity cursor-pointer ${
                  bottomGridTab === "mappings"
                    ? "opacity-100 font-semibold underline decoration-[#facc15] decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                Pemetaan Indikator Kisi-Kisi ({parsedMappings.length})
              </button>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md text-white cursor-pointer"
              style={{ backgroundColor: "#10b981" }}
            >
              <Edit3 size={14} /> Kelola TP & Indikator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {bottomGridTab === "objectives"
              ? parsedObjectives.map((obj: any, index: number) => {
                  const bgLight = bentoColors[index % bentoColors.length];
                  const cleanCode = String(obj.code || "")
                    .trim()
                    .toUpperCase();
                  const linkedQCount = questionCountByTpCode[cleanCode] || 0;

                  return (
                    <div
                      key={index}
                      className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[290px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border"
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

                      <div className="flex justify-between items-start relative z-10">
                        <span className="text-xs font-bold tracking-widest uppercase opacity-65">
                          TUJUAN PEMBELAJARAN • {obj.code}
                        </span>
                        <Link
                          href="/admin/evaluasi"
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.06)",
                          }}
                          title="Lihat Soal Terkait di Bank Evaluasi"
                        >
                          <ArrowUpRight size={18} strokeWidth={1.5} />
                        </Link>
                      </div>

                      <div className="my-6 relative z-10">
                        <div className="text-2xl md:text-3xl font-light tracking-tight leading-snug">
                          {obj.text}
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                            Kode Kompetensi
                          </div>
                          <div className="text-3xl font-light leading-none">
                            {obj.code}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                            Soal Terhubung
                          </div>
                          <div className="text-3xl font-light leading-none">
                            {linkedQCount}{" "}
                            <span className="text-xs font-medium opacity-60">
                              Soal
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : parsedMappings.map((mp: any, index: number) => {
                  const bgLight = bentoColors[index % bentoColors.length];
                  return (
                    <div
                      key={index}
                      className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[290px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border"
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

                      <div className="flex justify-between items-start relative z-10">
                        <span className="text-xs font-bold tracking-widest uppercase opacity-65">
                          INDIKATOR KISI-KISI 0{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={openForm}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.06)",
                          }}
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
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                            Label Pemetaan
                          </div>
                          <div className="text-2xl font-light leading-none">
                            {mp.code}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                            Tingkat Kelas
                          </div>
                          <div className="text-3xl font-light leading-none">
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