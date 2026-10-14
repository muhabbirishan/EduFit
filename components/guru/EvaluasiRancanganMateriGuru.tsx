"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  ClipboardCheck,
  BookOpenCheck,
  CheckCircle2,
  Save,
  RefreshCw,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GRADE_RUBRIC = [
  { grade: "A", score: 100, label: "A (100) • Sangat Paham" },
  { grade: "B", score: 75, label: "B (75) • Paham" },
  { grade: "C", score: 50, label: "C (50) • Cukup" },
  { grade: "D", score: 25, label: "D (25) • Perlu Bimbingan" },
];

export default function EvaluasiRancanganMateriGuru() {
  const [activeTab, setActiveTab] = useState<"RANCANGAN" | "MATERI">("RANCANGAN");
  const [planFilter, setPlanFilter] = useState<"ALL" | "awal" | "akhir">("ALL");

  const [programs, setPrograms] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  async function fetchAllSubmissions() {
    setLoading(true);
    const [profRes, progRes, refRes] = await Promise.all([
      supabase.from("user_profiles").select("id, full_name, email, gender"),
      supabase
        .from("student_programs")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("student_reflections")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const pMap: Record<string, any> = {};
    (profRes.data || []).forEach((p) => {
      pMap[p.id] = p;
    });

    setProfilesMap(pMap);
    setPrograms(progRes.data || []);
    setReflections(refRes.data || []);
    setLoading(false);
  }

  async function saveProgramScore(prog: any) {
    const { error } = await supabase
      .from("student_programs")
      .update({
        score_analisis: prog.score_analisis || 4,
        score_fitt: prog.score_fitt || 4,
        score_pemulihan: prog.score_pemulihan || 4,
        score_evaluasi: prog.score_evaluasi || 4,
        feedback: prog.feedback || "Rancangan telah dievaluasi guru.",
        status: "graded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prog.id);

    if (error) {
      toast.error("Gagal menyimpan nilai rancangan.");
    } else {
      toast.success("Penilaian rancangan berhasil disimpan!");
      fetchAllSubmissions();
    }
  }

  async function gradeMaterialReflection(
    refItem: any,
    gradeLetter: string,
    scoreNum: number
  ) {
    const { error } = await supabase
      .from("student_reflections")
      .update({
        grade: gradeLetter,
        score: scoreNum,
        feedback_text: refItem.feedback_text || `Dinilai ${gradeLetter} (${scoreNum} poin) oleh Guru.`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", refItem.id);

    if (error) {
      toast.error("Gagal menyimpan nilai materi.");
    } else {
      toast.success(
        `Nilai ${gradeLetter} (${scoreNum}) tersimpan & tampil di grafik Dasbor Siswa!`
      );
      fetchAllSubmissions();
    }
  }

  const filteredPrograms =
    planFilter === "ALL"
      ? programs
      : programs.filter(
          (p) => (p.type || "awal").toString().toLowerCase() === planFilter
        );

  return (
    <div className="space-y-6">
      {/* HEADER SWITCHER */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("RANCANGAN")}
            className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === "RANCANGAN"
                ? "bg-[#FACC15] text-black"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Rancangan Awal & Akhir Kelas XII ({programs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("MATERI")}
            className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === "MATERI"
                ? "bg-[#FACC15] text-black"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60"
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            Penilaian Materi A/B/C/D ({reflections.length})
          </button>
        </div>

        <button
          type="button"
          onClick={fetchAllSubmissions}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">
          Memuat kiriman tugas siswa...
        </div>
      ) : activeTab === "RANCANGAN" ? (
        <div className="space-y-4">
          {/* FILTER RANCANGAN AWAL / AKHIR */}
          <div className="flex items-center gap-2">
            {(["ALL", "awal", "akhir"] as const).map((flt) => (
              <button
                key={flt}
                type="button"
                onClick={() => setPlanFilter(flt)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase ${
                  planFilter === flt
                    ? "bg-[#89F9B5] text-black"
                    : "bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10"
                }`}
              >
                {flt === "ALL" ? "Semua Rancangan" : `Rancangan ${flt}`}
              </button>
            ))}
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-3xl p-10 text-center text-sm text-slate-500">
              Belum ada tugas rancangan pada kategori ini.
            </div>
          ) : (
            filteredPrograms.map((prog, index) => {
              const student = profilesMap[prog.student_id];
              const isAkhir =
                (prog.type || "").toString().toLowerCase() === "akhir";

              return (
                <div
                  key={prog.id}
                  className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                          isAkhir
                            ? "bg-[#89F9B5]/20 text-emerald-500"
                            : "bg-[#FACC15]/20 text-[#CA8A04] dark:text-[#FACC15]"
                        }`}
                      >
                        RANCANGAN {prog.type?.toUpperCase() || "AWAL"}
                      </span>
                      <h3 className="text-lg font-extrabold mt-2">
                        {student?.full_name || "Siswa"} ({student?.email || "-"})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => saveProgramScore(prog)}
                      className="px-5 py-2.5 rounded-xl bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Nilai Rancangan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">1. Prioritas</div>
                      <div className="mt-1">{prog.prioritas || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">2. Tujuan</div>
                      <div className="mt-1">{prog.tujuan || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">3. Frekuensi</div>
                      <div className="mt-1">{prog.frekuensi || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">4. Intensitas</div>
                      <div className="mt-1">{prog.intensitas || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">5. Durasi</div>
                      <div className="mt-1">{prog.durasi || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">6. Jenis Latihan</div>
                      <div className="mt-1">{prog.jenis || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">7. Pemulihan</div>
                      <div className="mt-1">{prog.jeda || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">8. Progresi</div>
                      <div className="mt-1">{prog.progresi || "-"}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5">
                      <div className="font-bold text-slate-400">9. Alasan & Evaluasi</div>
                      <div className="mt-1">{prog.alasan || "-"}</div>
                    </div>
                  </div>

                  {/* RUBRIK SKOR 1-4 & FEEDBACK GURU */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                    {(
                      [
                        ["score_analisis", "Skor Analisis (1-4)"],
                        ["score_fitt", "Skor FITT (1-4)"],
                        ["score_pemulihan", "Skor Pemulihan (1-4)"],
                        ["score_evaluasi", "Skor Evaluasi (1-4)"],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label className="text-[10px] font-bold text-slate-400">
                          {label}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={prog[field] ?? 4}
                          onChange={(e) => {
                            const updated = [...programs];
                            const idx = updated.findIndex(
                              (x) => x.id === prog.id
                            );
                            if (idx > -1) {
                              updated[idx][field] = parseInt(
                                e.target.value,
                                10
                              );
                              setPrograms(updated);
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold"
                        />
                      </div>
                    ))}
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        Catatan Guru
                      </label>
                      <input
                        type="text"
                        placeholder="Umpan balik..."
                        value={prog.feedback ?? ""}
                        onChange={(e) => {
                          const updated = [...programs];
                          const idx = updated.findIndex(
                            (x) => x.id === prog.id
                          );
                          if (idx > -1) {
                            updated[idx].feedback = e.target.value;
                            setPrograms(updated);
                          }
                        }}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TAB PENILAIAN MATERI A (100), B (75), C (50), D (25) */
        <div className="space-y-4">
          {reflections.map((refItem) => {
            const student = profilesMap[refItem.student_id];
            return (
              <div
                key={refItem.id}
                className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15]">
                      {refItem.unit_name}
                    </span>
                    {refItem.score != null ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-500">
                        Sudah Dinilai: {refItem.grade} ({refItem.score} Poin)
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-400">
                        Menunggu Nilai Guru
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-sm">
                    {student?.full_name || "Siswa"} ({student?.email || "-"})
                  </div>
                  <p className="text-xs text-slate-600 dark:text-white/75 bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl">
                    &ldquo;{refItem.answer_text}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {GRADE_RUBRIC.map((r) => {
                    const active = refItem.grade === r.grade;
                    return (
                      <button
                        key={r.grade}
                        type="button"
                        onClick={() =>
                          gradeMaterialReflection(refItem, r.grade, r.score)
                        }
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                          active
                            ? "bg-[#89F9B5] text-black border-[#89F9B5]"
                            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-[#FACC15]"
                        }`}
                      >
                        {r.grade} ({r.score})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}