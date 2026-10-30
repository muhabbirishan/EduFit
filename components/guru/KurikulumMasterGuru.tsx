// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  Film,
  Layers,
  Lock,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const BENTO_SHOWCASE_CLASSES = [
  "bento-showcase-0",
  "bento-showcase-1",
  "bento-showcase-2",
  "bento-showcase-3",
];

const TKJI_CATEGORIES = [
  "Baik Sekali",
  "Baik",
  "Sedang",
  "Kurang",
  "Kurang Sekali",
];

const BMI_CATEGORIES = [
  "Normal",
  "Kurus",
  "Sangat Kurus",
  "Overweight",
  "Obesitas",
];

function formatHumanLabel(raw?: string | null): string {
  if (!raw) return "-";
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function KurikulumMasterGuru() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [gradeLevel, setGradeLevel] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<
    "materials" | "instruments" | "videos" | "algorithms"
  >("materials");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [materials, setMaterials] = useState<any[]>([]);
  const [stageBanners, setStageBanners] = useState<any[]>([]);
  const [instrument, setInstrument] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  // Filter Simulator Algoritma Program Latihan (Khusus Kelas 12)
  const [simGender, setSimGender] = useState<"L" | "P">("L");
  const [simTkji, setSimTkji] = useState<string>("Sedang");
  const [simBmi, setSimBmi] = useState<string>("Normal");
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [totalAlgorithmCount, setTotalAlgorithmCount] = useState<number>(0);
  const [loadingAlg, setLoadingAlg] = useState(false);

  // Otomatis kembalikan tab ke "materials" jika Guru memilih Kelas 10 atau 11
  useEffect(() => {
    if (gradeLevel !== 12 && activeTab === "algorithms") {
      setActiveTab("materials");
    }
  }, [gradeLevel, activeTab]);

  const fetchCurriculumByGrade = async (targetGrade: number) => {
    setIsLoading(true);
    try {
      const [matRes, banRes, instRes, qRes, vidRes, algCountRes] =
        await Promise.all([
          supabase
            .from("master_materials")
            .select("*")
            .eq("grade_level", targetGrade)
            .order("order_index", { ascending: true }),
          supabase
            .from("stage_banners")
            .select("*")
            .eq("grade_level", targetGrade)
            .order("stage_number", { ascending: true }),
          supabase
            .from("master_instruments")
            .select("*")
            .eq("grade_level", targetGrade)
            .maybeSingle(),
          supabase
            .from("question_bank")
            .select(
              "*, master_evaluations!inner(id, grade_level, type, title)"
            )
            .eq("master_evaluations.grade_level", targetGrade)
            .order("created_at", { ascending: true }),
          supabase
            .from("master_practice_videos")
            .select("*")
            .order("category", { ascending: true }),
          supabase
            .from("fitness_algorithms")
            .select("id", { count: "exact", head: true }),
        ]);

      setMaterials(matRes.data || []);
      setStageBanners(banRes.data || []);
      setInstrument(instRes.data || null);
      setQuestions(qRes.data || []);
      setVideos(vidRes.data || []);
      setTotalAlgorithmCount(algCountRes.count || 0);
    } catch (err: any) {
      toast.error("Gagal memuat katalog kurikulum", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculumByGrade(gradeLevel);
  }, [gradeLevel]);

  useEffect(() => {
    if (gradeLevel !== 12) return;
    async function fetchSimulatedAlgorithms() {
      setLoadingAlg(true);
      try {
        const { data } = await supabase
          .from("fitness_algorithms")
          .select("*")
          .eq("gender", simGender)
          .eq("tkji_category", simTkji)
          .eq("bmi_category", simBmi)
          .order("week", { ascending: true })
          .order("meeting", { ascending: true })
          .limit(24);
        setAlgorithms(data || []);
      } catch {
        setAlgorithms([]);
      } finally {
        setLoadingAlg(false);
      }
    }
    fetchSimulatedAlgorithms();
  }, [gradeLevel, simGender, simTkji, simBmi]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(
      (m) =>
        (m.unit_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.content_text || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery) return questions;
    return questions.filter(
      (q) =>
        (q.question_text || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (q.learning_objective_code || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [questions, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery) return videos;
    return videos.filter(
      (v) =>
        (v.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const availableTabs = useMemo(() => {
    const baseTabs = [
      {
        key: "materials",
        label: `Modul & Tahapan (${materials.length})`,
        icon: BookOpen,
      },
      {
        key: "instruments",
        label: `Kisi-Kisi & Soal (${questions.length})`,
        icon: BrainCircuit,
      },
      {
        key: "videos",
        label: `Video Praktik (${videos.length})`,
        icon: Film,
      },
    ];
    if (gradeLevel === 12) {
      baseTabs.push({
        key: "algorithms",
        label: "Simulator Resep Latihan (Kelas 12)",
        icon: Cpu,
      });
    }
    return baseTabs;
  }, [gradeLevel, materials.length, questions.length, videos.length]);

  if (!mounted) return null;

  return (
    <div className="edufit-guru-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* ZONA 1: HERO HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-65">
            <span className="text-gold-accent">Referensi Kurikulum PJOK</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Database size={15} className="text-emerald-accent" />
              {gradeLevel === 12
                ? "Materi Kelas 12 & Simulator Program Latihan FITT"
                : `Materi Pembelajaran & Evaluasi Kognitif Kelas ${gradeLevel}`}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Katalog <br />
            <span className="font-semibold">
              {gradeLevel === 12
                ? "Kurikulum & Algoritma"
                : `Kurikulum Kelas ${gradeLevel}`}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-sky-accent">
              {isLoading ? "—" : materials.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Unit Materi Kelas {gradeLevel}
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent">
              {isLoading ? "—" : questions.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Butir Soal Evaluasi
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {gradeLevel === 12
                ? totalAlgorithmCount || "4.800"
                : videos.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              {gradeLevel === 12
                ? "Resep Latihan FITT (Kls 12)"
                : "Video Panduan Praktik"}
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 2: KENDALI JENJANG KELAS & TAB MENU */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10 relative z-10">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl edufit-card-primary">
          {availableTabs.map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  active ? "seg-btn-active shadow-sm" : "seg-btn-idle"
                }`}
              >
                <IconComp size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          {gradeLevel !== 12 && (
            <button
              type="button"
              onClick={() => {
                setGradeLevel(12);
                setActiveTab("algorithms");
              }}
              className="px-3.5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer badge-tint-violet"
              title="Simulator Resep Latihan FITT hanya tersedia untuk Kelas 12. Klik untuk beralih ke Kelas 12."
            >
              <Lock size={12} /> Simulator FITT (Khusus Kelas 12)
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex p-1.5 rounded-2xl edufit-surface-subtle">
            {[10, 11, 12].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeLevel(g)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  gradeLevel === g
                    ? "seg-btn-active shadow-sm"
                    : "seg-btn-idle"
                }`}
              >
                Kelas {g}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, soal, atau video..."
              className="w-full pl-11 pr-9 py-3 rounded-2xl text-xs font-semibold outline-none edufit-card-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ZONA 3: ISI TAB AKTIF */}
      {isLoading ? (
        <div className="p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-55 animate-pulse">
          Memuat kurikulum pembelajaran Kelas {gradeLevel}...
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "materials" ? (
            <motion.div
              key={`materials-${gradeLevel}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="space-y-10"
            >
              {/* Alur Tahapan Pembelajaran Siswa (Colorful Bento Showcase) */}
              {stageBanners.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-gold-accent">
                    Alur Tahapan Pembelajaran Siswa (Kelas {gradeLevel})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {stageBanners.map((sb, idx) => {
                      const showcaseClass =
                        BENTO_SHOWCASE_CLASSES[
                          idx % BENTO_SHOWCASE_CLASSES.length
                        ];
                      return (
                        <motion.div
                          key={sb.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: Math.min(idx * 0.05, 0.2),
                          }}
                          className={`p-6 rounded-3xl flex items-center justify-between gap-4 relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5 ${showcaseClass}`}
                        >
                          <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                          <div className="relative z-10">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-black/10 dark:bg-white/10 inline-block mb-2">
                              Tahap {sb.stage_number} · Kelas {sb.grade_level}
                            </span>
                            <h4 className="text-xl font-semibold tracking-tight">
                              {sb.stage_title}
                            </h4>
                          </div>
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-black/10 dark:bg-white/10 shrink-0 relative z-10">
                            <Layers size={19} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Daftar Unit Materi */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-accent">
                  Daftar Modul Bacaan & Pertanyaan Pemantik Kelas {gradeLevel}
                </div>
                {filteredMaterials.length === 0 ? (
                  <div className="p-12 text-center rounded-[2rem] border border-dashed border-hairline opacity-55">
                    Belum ada unit materi untuk Kelas {gradeLevel}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredMaterials.map((mat, idx) => {
                      const badgeColors = [
                        "badge-tint-amber",
                        "badge-tint-emerald",
                        "badge-tint-sky",
                        "badge-tint-violet",
                      ];
                      const activeBadge =
                        badgeColors[idx % badgeColors.length];

                      return (
                        <motion.div
                          key={mat.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: Math.min(idx * 0.05, 0.25),
                          }}
                          className="p-8 rounded-[2rem] flex flex-col justify-between gap-5 edufit-card-primary relative overflow-hidden transition-transform hover:-translate-y-0.5"
                        >
                          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />
                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase ${activeBadge}`}
                              >
                                Unit {idx + 1} · Kelas {mat.grade_level}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold edufit-surface-subtle">
                                Urutan #{mat.order_index ?? idx + 1}
                              </span>
                            </div>
                            <h3 className="text-2xl font-semibold tracking-tight">
                              {mat.unit_name}
                            </h3>
                            <div className="p-4 rounded-2xl badge-tint-amber">
                              <span className="text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Sparkles size={12} /> Pertanyaan Pemantik
                                Diskusi & Refleksi:
                              </span>
                              <p className="text-xs font-semibold italic leading-relaxed">
                                &ldquo;{mat.trigger_question || "-"}&rdquo;
                              </p>
                            </div>
                            {mat.content_text && (
                              <p className="text-xs leading-relaxed opacity-80 line-clamp-4 whitespace-pre-line">
                                {String(mat.content_text).replace(
                                  /<[^>]*>?/gm,
                                  ""
                                )}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono relative z-10">
                            <span className="px-3 py-1 rounded-lg font-bold badge-tint-emerald">
                              {Array.isArray(mat.content_blocks) &&
                              mat.content_blocks.length > 0
                                ? `${mat.content_blocks.length} Blok Konten Interaktif`
                                : "Modul Bacaan Terpadu"}
                            </span>
                            <span className="opacity-65 font-bold">
                              Kurikulum Kelas {mat.grade_level}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === "instruments" ? (
            <motion.div
              key={`instruments-${gradeLevel}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="space-y-8"
            >
              {/* Kisi-kisi Instrumen Evaluasi */}
              {instrument && (
                <div className="p-8 rounded-[2rem] space-y-5 edufit-card-secondary relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4 relative z-10">
                    <div>
                      <span className="text-xs font-bold uppercase text-gold-accent block mb-1">
                        Kisi-Kisi Kompetensi · Fase {instrument.fase} (Kelas{" "}
                        {instrument.grade_level})
                      </span>
                      <h3 className="text-3xl font-light tracking-tight">
                        {instrument.focus_unit || "Instrumen Evaluasi Kognitif"}
                      </h3>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold badge-tint-amber">
                      Fase {instrument.fase}
                    </span>
                  </div>
                  {instrument.base_rationale && (
                    <p className="text-sm leading-relaxed opacity-85 relative z-10">
                      {instrument.base_rationale}
                    </p>
                  )}
                  {Array.isArray(instrument.objectives) &&
                    instrument.objectives.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {instrument.objectives.map((obj: any, i: number) => {
                          const showcaseClass =
                            BENTO_SHOWCASE_CLASSES[
                              i % BENTO_SHOWCASE_CLASSES.length
                            ];
                          return (
                            <div
                              key={i}
                              className={`p-5 rounded-2xl text-xs space-y-1.5 relative overflow-hidden ${showcaseClass}`}
                            >
                              <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                              <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-black/10 dark:bg-white/10 inline-block relative z-10">
                                Tujuan Pembelajaran {obj.code}
                              </span>
                              <p className="font-semibold text-sm leading-relaxed relative z-10">
                                {obj.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}

              {/* Bank Soal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredQuestions.map((q, idx) => {
                  const isPosttest =
                    q.master_evaluations?.type === "posttest";
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: Math.min(idx * 0.03, 0.25),
                      }}
                      className="p-7 rounded-[2rem] space-y-4 edufit-card-primary relative overflow-hidden"
                    >
                      <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                      <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase badge-tint-amber">
                            TP {q.learning_objective_code || "-"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase ${
                              isPosttest
                                ? "badge-tint-emerald"
                                : "badge-tint-sky"
                            }`}
                          >
                            {isPosttest ? "Posttest" : "Pretest"}
                          </span>
                        </div>
                        <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold badge-tint-emerald flex items-center gap-1">
                          <CheckCircle2 size={13} /> Kunci: {q.correct_answer}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-relaxed relative z-10">
                        {idx + 1}. {q.question_text}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono relative z-10">
                        {(["a", "b", "c", "d"] as const).map((k) => {
                          const upper = k.toUpperCase();
                          const isKey =
                            String(q.correct_answer || "").toUpperCase() ===
                            upper;
                          return (
                            <div
                              key={k}
                              className={`p-3.5 rounded-xl transition-colors ${
                                isKey
                                  ? "badge-tint-emerald font-bold shadow-sm"
                                  : "edufit-surface-subtle"
                              }`}
                            >
                              <strong className="mr-1">{upper}.</strong>{" "}
                              {q[`option_${k}`]}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : activeTab === "videos" ? (
            <motion.div
              key="videos-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredVideos.map((vid, idx) => {
                const catBadges = [
                  "badge-tint-amber",
                  "badge-tint-emerald",
                  "badge-tint-sky",
                  "badge-tint-violet",
                ];
                const catBadge = catBadges[idx % catBadges.length];

                return (
                  <motion.div
                    key={vid.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(idx * 0.04, 0.25),
                    }}
                    className="p-7 rounded-[2rem] flex flex-col justify-between gap-4 edufit-card-primary relative overflow-hidden transition-transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                    <div className="space-y-3.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase ${catBadge}`}
                        >
                          {formatHumanLabel(vid.category)}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold edufit-surface-subtle">
                          {vid.duration_label}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight">
                        {vid.title}
                      </h3>
                      <div className="p-3.5 rounded-2xl text-xs badge-tint-emerald space-y-1">
                        <span className="font-bold text-[10px] font-mono uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Tahapan Teknik Gerakan:
                        </span>
                        <p className="whitespace-pre-line leading-relaxed">
                          {vid.technique_steps}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl text-xs badge-tint-rose space-y-1">
                        <span className="font-bold text-[10px] font-mono uppercase flex items-center gap-1">
                          <AlertTriangle size={12} /> Kesalahan yang Sering
                          Terjadi:
                        </span>
                        <p className="whitespace-pre-line leading-relaxed">
                          {vid.common_mistakes}
                        </p>
                      </div>
                    </div>
                    {vid.video_url && (
                      <a
                        href={vid.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-sm relative z-10 btn-forest-gold"
                      >
                        <Play size={14} /> Tonton Video Demonstrasi
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* TAB 4: SIMULATOR ALGORITMA LATIHAN KHUSUS KELAS 12 */
            <motion.div
              key="algorithms-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="p-8 rounded-[2rem] space-y-6 edufit-card-primary relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5 relative z-10">
                <div>
                  <span className="text-xs font-bold uppercase text-gold-accent block mb-1">
                    Simulator Resep Latihan Otomatis Kelas 12 (
                    {totalAlgorithmCount} Variasi Program FITT)
                  </span>
                  <h3 className="text-3xl font-light tracking-tight">
                    Pratinjau Dosis Latihan Berdasarkan Profil Fisik Siswa Kelas
                    12
                  </h3>
                </div>
                <span className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase badge-tint-emerald">
                  Khusus Kelas 12
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-60 block mb-2">
                    Jenis Kelamin Siswa
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                    {(["L", "P"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSimGender(g)}
                        className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          simGender === g
                            ? g === "L"
                              ? "badge-tint-sky shadow-sm"
                              : "badge-tint-rose shadow-sm"
                            : "seg-btn-idle"
                        }`}
                      >
                        {g === "L" ? "Putra (L)" : "Putri (P)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-60 block mb-2">
                    Kategori Kebugaran (TKJI)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TKJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSimTkji(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          simTkji === cat
                            ? "badge-tint-emerald shadow-sm"
                            : "edufit-surface-subtle"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-60 block mb-2">
                    Kategori Indeks Massa Tubuh (IMT)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BMI_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSimBmi(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          simBmi === cat
                            ? "badge-tint-violet shadow-sm"
                            : "edufit-surface-subtle"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingAlg ? (
                <div className="py-12 text-center text-sm opacity-55 relative z-10">
                  Memuat rekomendasi program latihan Kelas 12...
                </div>
              ) : algorithms.length === 0 ? (
                <div className="py-12 text-center text-sm opacity-55 rounded-2xl edufit-surface-subtle relative z-10">
                  Tidak ditemukan resep spesifik untuk kombinasi ({simGender} ·{" "}
                  {simTkji} · {simBmi}).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2 relative z-10">
                  {algorithms.map((alg, idx) => {
                    const showcaseClass =
                      BENTO_SHOWCASE_CLASSES[
                        idx % BENTO_SHOWCASE_CLASSES.length
                      ];
                    return (
                      <motion.div
                        key={alg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.25,
                          delay: Math.min(idx * 0.03, 0.2),
                        }}
                        className={`p-6 rounded-3xl space-y-3 relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5 ${showcaseClass}`}
                      >
                        <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                        <div className="flex items-center justify-between relative z-10">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase telemetry-bar-forest text-gold-accent">
                            Minggu {alg.week} · Pertemuan {alg.meeting}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-black/10 dark:bg-white/10">
                            {formatHumanLabel(alg.phase || "Fase Latihan")}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold tracking-tight relative z-10">
                          {alg.program_name}
                        </h4>
                        <p className="text-xs opacity-80 relative z-10">
                          Fokus Komponen:{" "}
                          <strong>{formatHumanLabel(alg.component)}</strong>
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono relative z-10">
                          <div className="p-2.5 rounded-xl edufit-card-primary">
                            <span className="text-[9px] font-sans opacity-60 block">
                              Intensitas
                            </span>
                            <strong className="text-gold-accent">
                              {alg.intensity || "-"}
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl edufit-card-primary">
                            <span className="text-[9px] font-sans opacity-60 block">
                              Durasi
                            </span>
                            <strong className="text-emerald-accent">
                              {alg.duration_min ?? "-"} Menit
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl edufit-card-primary">
                            <span className="text-[9px] font-sans opacity-60 block">
                              Istirahat
                            </span>
                            <strong className="text-sky-accent">
                              {alg.rest_time_sec ?? "-"} Detik
                            </strong>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}