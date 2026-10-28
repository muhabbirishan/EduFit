// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import {
    BookOpen,
    BrainCircuit,
    Cpu,
    Database,
    Film,
    Layers,
    Play,
    Search,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

  // Filter Simulator Algoritma Program Latihan
  const [simGender, setSimGender] = useState<"L" | "P">("L");
  const [simTkji, setSimTkji] = useState<string>("Sedang");
  const [simBmi, setSimBmi] = useState<string>("Normal");
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [totalAlgorithmCount, setTotalAlgorithmCount] = useState<number>(0);
  const [loadingAlg, setLoadingAlg] = useState(false);

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
  }, [simGender, simTkji, simBmi]);

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

  if (!mounted) return null;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* ZONA 1: HERO HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="text-gold-accent">Referensi Kurikulum PJOK</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Database size={15} />
              Materi Pembelajaran Kelas {gradeLevel} & Simulator Program Latihan
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Katalog <br />
            <span className="font-semibold">Kurikulum & Algoritma</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : materials.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Unit Materi
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
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {totalAlgorithmCount || "4.800"}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Resep Latihan FITT
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 2: KENDALI JENJANG KELAS & TAB MENU */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10 relative z-10">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl edufit-card-primary">
          {[
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
            {
              key: "algorithms",
              label: "Simulator Resep Latihan",
              icon: Cpu,
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  active ? "seg-btn-active" : "seg-btn-idle"
                }`}
              >
                <IconComp size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex p-1.5 rounded-2xl edufit-surface-subtle">
            {[10, 11, 12].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeLevel(g)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                  gradeLevel === g ? "seg-btn-active" : "seg-btn-idle"
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
        <div className="p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-55">
          Memuat kurikulum pembelajaran Kelas {gradeLevel}...
        </div>
      ) : activeTab === "materials" ? (
        <div className="space-y-10">
          {/* Alur Tahapan Pembelajaran Siswa */}
          {stageBanners.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest opacity-55">
                Alur Tahapan Pembelajaran Siswa (Kelas {gradeLevel})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageBanners.map((sb) => (
                  <div
                    key={sb.id}
                    className="p-6 rounded-3xl flex items-center justify-between gap-4 edufit-card-secondary"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-gold-accent block mb-1">
                        Tahap {sb.stage_number} · Kelas {sb.grade_level}
                      </span>
                      <h4 className="text-xl font-semibold tracking-tight">
                        {sb.stage_title}
                      </h4>
                    </div>
                    <Layers size={20} className="opacity-40 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daftar Unit Materi */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest opacity-55">
              Daftar Modul Bacaan & Pertanyaan Pemantik
            </div>
            {filteredMaterials.length === 0 ? (
              <div className="p-12 text-center rounded-[2rem] border border-dashed border-hairline opacity-55">
                Belum ada unit materi untuk Kelas {gradeLevel}.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMaterials.map((mat, idx) => (
                  <div
                    key={mat.id}
                    className="p-8 rounded-[2rem] flex flex-col justify-between gap-5 edufit-card-primary"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase telemetry-bar-forest text-gold-accent">
                          Unit {idx + 1} · Kelas {mat.grade_level}
                        </span>
                        <span className="text-[11px] font-mono opacity-55">
                          Urutan #{mat.order_index ?? idx + 1}
                        </span>
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight">
                        {mat.unit_name}
                      </h3>
                      <div className="p-4 rounded-2xl edufit-surface-subtle">
                        <span className="text-[10px] font-bold uppercase text-gold-accent block mb-1">
                          Pertanyaan Pemantik Diskusi:
                        </span>
                        <p className="text-xs font-medium italic">
                          &ldquo;{mat.trigger_question || "-"}&rdquo;
                        </p>
                      </div>
                      {mat.content_text && (
                        <p className="text-xs leading-relaxed opacity-80 line-clamp-5 whitespace-pre-line">
                          {mat.content_text}
                        </p>
                      )}
                    </div>

                    {Array.isArray(mat.content_blocks) &&
                      mat.content_blocks.length > 0 && (
                        <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono opacity-65">
                          <span>
                            {mat.content_blocks.length} Bagian Materi Bacaan
                          </span>
                          <span>Kelas {mat.grade_level}</span>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "instruments" ? (
        <div className="space-y-8">
          {/* Kisi-kisi Instrumen Evaluasi */}
          {instrument && (
            <div className="p-8 rounded-[2rem] space-y-5 edufit-card-secondary">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-gold-accent block mb-1">
                    Kisi-Kisi Kompetensi · Fase {instrument.fase} (Kelas{" "}
                    {instrument.grade_level})
                  </span>
                  <h3 className="text-3xl font-light tracking-tight">
                    {instrument.focus_unit || "Instrumen Evaluasi Kognitif"}
                  </h3>
                </div>
              </div>
              {instrument.base_rationale && (
                <p className="text-sm leading-relaxed opacity-80">
                  {instrument.base_rationale}
                </p>
              )}
              {Array.isArray(instrument.objectives) &&
                instrument.objectives.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {instrument.objectives.map((obj: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl edufit-card-primary text-xs space-y-1"
                      >
                        <span className="font-mono font-bold text-gold-accent">
                          Tujuan Pembelajaran {obj.code}
                        </span>
                        <p className="font-medium leading-relaxed">
                          {obj.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Bank Soal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-7 rounded-[2rem] space-y-4 edufit-card-primary"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase telemetry-bar-forest text-gold-accent">
                    Kode TP {q.learning_objective_code || "-"} ·{" "}
                    {q.master_evaluations?.type === "posttest"
                      ? "Posttest"
                      : "Pretest"}
                  </span>
                  <span className="text-xs font-mono font-bold text-gold-accent">
                    Kunci Jawaban: {q.correct_answer}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed">
                  {idx + 1}. {q.question_text}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {(["a", "b", "c", "d"] as const).map((k) => {
                    const upper = k.toUpperCase();
                    const isKey =
                      String(q.correct_answer || "").toUpperCase() === upper;
                    return (
                      <div
                        key={k}
                        className={`p-3 rounded-xl ${
                          isKey
                            ? "badge-tint-emerald font-bold"
                            : "edufit-surface-subtle"
                        }`}
                      >
                        {upper}. {q[`option_${k}`]}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "videos" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map((vid) => (
            <div
              key={vid.id}
              className="p-7 rounded-[2rem] flex flex-col justify-between gap-4 edufit-card-primary"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase telemetry-bar-forest text-gold-accent">
                    {formatHumanLabel(vid.category)}
                  </span>
                  <span className="text-xs font-mono opacity-60">
                    {vid.duration_label}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{vid.title}</h3>
                <div className="p-3.5 rounded-2xl text-xs edufit-surface-subtle space-y-1">
                  <span className="font-bold text-[10px] uppercase text-gold-accent block">
                    Tahapan Teknik Gerakan:
                  </span>
                  <p className="whitespace-pre-line leading-relaxed">
                    {vid.technique_steps}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl text-xs edufit-surface-subtle space-y-1">
                  <span className="font-bold text-[10px] uppercase opacity-70 block">
                    Kesalahan yang Sering Terjadi:
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
                  className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-forest-emerald"
                >
                  <Play size={14} /> Tonton Video Demonstrasi
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* TAB 4: SIMULATOR ALGORITMA LATIHAN MURNI (TANPA ONBOARDING & FEATURE TOURS) */
        <div className="p-8 rounded-[2rem] space-y-6 edufit-card-primary">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
            <div>
              <span className="text-xs font-bold uppercase text-gold-accent block mb-1">
                Simulator Resep Latihan Otomatis ({totalAlgorithmCount} Variasi
                Program)
              </span>
              <h3 className="text-3xl font-light tracking-tight">
                Pratinjau Dosis Latihan Berdasarkan Profil Fisik Siswa
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase opacity-55 block mb-2">
                Jenis Kelamin Siswa
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                {(["L", "P"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSimGender(g)}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                      simGender === g ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {g === "L" ? "Putra (L)" : "Putri (P)"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase opacity-55 block mb-2">
                Kategori Kebugaran (TKJI)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TKJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSimTkji(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      simTkji === cat
                        ? "seg-btn-active"
                        : "edufit-surface-subtle"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase opacity-55 block mb-2">
                Kategori Indeks Massa Tubuh (IMT)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BMI_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSimBmi(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      simBmi === cat
                        ? "seg-btn-active"
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
            <div className="py-12 text-center text-sm opacity-55">
              Memuat rekomendasi program latihan...
            </div>
          ) : algorithms.length === 0 ? (
            <div className="py-12 text-center text-sm opacity-55 rounded-2xl edufit-surface-subtle">
              Tidak ditemukan resep spesifik untuk kombinasi ({simGender} ·{" "}
              {simTkji} · {simBmi}).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
              {algorithms.map((alg) => (
                <div
                  key={alg.id}
                  className="p-5 rounded-2xl space-y-2.5 edufit-surface-subtle"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase telemetry-bar-forest text-gold-accent">
                      Minggu {alg.week} · Pertemuan {alg.meeting}
                    </span>
                    <span className="text-[10px] font-bold uppercase opacity-65">
                      {formatHumanLabel(alg.phase || "Fase Latihan")}
                    </span>
                  </div>
                  <h4 className="text-base font-bold">{alg.program_name}</h4>
                  <p className="text-xs opacity-70">
                    Fokus Komponen:{" "}
                    <strong>{formatHumanLabel(alg.component)}</strong>
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                    <div className="p-2 rounded-xl edufit-card-primary">
                      <span className="text-[9px] font-sans opacity-55 block">
                        Intensitas
                      </span>
                      <strong>{alg.intensity || "-"}</strong>
                    </div>
                    <div className="p-2 rounded-xl edufit-card-primary">
                      <span className="text-[9px] font-sans opacity-55 block">
                        Durasi
                      </span>
                      <strong>{alg.duration_min ?? "-"} Menit</strong>
                    </div>
                    <div className="p-2 rounded-xl edufit-card-primary">
                      <span className="text-[9px] font-sans opacity-55 block">
                        Istirahat
                      </span>
                      <strong>{alg.rest_time_sec ?? "-"} Detik</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}