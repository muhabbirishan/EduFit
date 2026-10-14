"use client";

import { createClient } from "@supabase/supabase-js";
import {
    ClipboardCheck,
    RefreshCw,
    Save
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RancanganGuruView() {
  const [filterType, setFilterType] = useState<"ALL" | "awal" | "akhir">("ALL");
  const [programs, setPrograms] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [metricsMap, setMetricsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRancanganData();
  }, []);

  async function fetchRancanganData() {
    setLoading(true);
    try {
      const [progRes, profRes, metRes] = await Promise.all([
        supabase
          .from("student_programs")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("user_profiles")
          .select("id, full_name, email, gender"),
        supabase
          .from("student_physical_metrics")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      const sMap: Record<string, any> = {};
      (profRes.data || []).forEach((p) => {
        sMap[p.id] = p;
      });

      const mMap: Record<string, any> = {};
      (metRes.data || []).forEach((m) => {
        if (!mMap[m.student_id]) {
          mMap[m.student_id] = m;
        }
      });

      setStudentsMap(sMap);
      setMetricsMap(mMap);
      setPrograms(progRes.data || []);
    } catch (_) {
      toast.error("Gagal memuat data rancangan siswa.");
    } finally {
      setLoading(false);
    }
  }

  function updateLocalField(progId: string, field: string, value: any) {
    setPrograms((prev) =>
      prev.map((item) =>
        item.id === progId ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSaveEvaluation(prog: any) {
    setSavingId(prog.id);
    const s1 = Number(prog.score_analisis ?? 4);
    const s2 = Number(prog.score_fitt ?? 4);
    const s3 = Number(prog.score_pemulihan ?? 4);
    const s4 = Number(prog.score_evaluasi ?? 4);

    const { error } = await supabase
      .from("student_programs")
      .update({
        score_analisis: s1,
        score_fitt: s2,
        score_pemulihan: s3,
        score_evaluasi: s4,
        feedback: prog.feedback || "Rancangan telah diperiksa dan dinilai oleh Guru.",
        status: "graded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prog.id);

    if (error) {
      toast.error("Gagal menyimpan penilaian rancangan.");
    } else {
      toast.success(
        `Nilai Rancangan ${prog.type?.toUpperCase()} berhasil disimpan!`
      );
      await fetchRancanganData();
    }
    setSavingId(null);
  }

  const filteredList =
    filterType === "ALL"
      ? programs
      : programs.filter(
          (p) => (p.type || "awal").toString().trim().toLowerCase() === filterType
        );

  const countAwal = programs.filter(
    (p) => (p.type || "awal").toString().trim().toLowerCase() === "awal"
  ).length;
  const countAkhir = programs.filter(
    (p) => (p.type || "").toString().trim().toLowerCase() === "akhir"
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER RANCANGAN */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200/80 dark:border-white/10 rounded-[28px] p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#CA8A04] dark:text-[#FACC15] text-[11px] font-extrabold tracking-widest uppercase">
            <ClipboardCheck className="w-3.5 h-3.5" />
            STUDIO EVALUASI PROGRAM FITT • KELAS XII
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rancangan Program Awal & Akhir
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-white/60 max-w-2xl">
            Bandingkan perkembangan cara berpikir siswa dalam menyusun program
            latihan pribadi sebelum membaca materi (Rancangan Awal) dan sesudah
            menyelesaikan materi (Rancangan Akhir).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              filterType === "ALL"
                ? "bg-[#FACC15] text-black border-[#FACC15]"
                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70"
            }`}
          >
            Semua ({programs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("awal")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              filterType === "awal"
                ? "bg-[#FACC15] text-black border-[#FACC15]"
                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70"
            }`}
          >
            Rancangan Awal ({countAwal})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("akhir")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              filterType === "akhir"
                ? "bg-[#89F9B5] text-black border-[#89F9B5]"
                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70"
            }`}
          >
            Rancangan Akhir ({countAkhir})
          </button>
          <button
            type="button"
            onClick={fetchRancanganData}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#FACC15]"
            title="Segarkan Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DAFTAR KIRIMAN RANCANGAN SISWA */}
      {loading ? (
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] p-12 text-center text-sm text-slate-500">
          Memuat daftar rancangan awal & akhir siswa...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] p-12 text-center text-sm text-slate-500">
          Belum ada kiriman tugas rancangan pada filter ini.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredList.map((prog) => {
            const student = studentsMap[prog.student_id];
            const metric = metricsMap[prog.student_id];
            const isAkhir =
              (prog.type || "").toString().trim().toLowerCase() === "akhir";
            const isGraded = prog.score_analisis != null;

            return (
              <div
                key={prog.id}
                className="bg-white dark:bg-[#111111] border border-slate-200/80 dark:border-white/10 rounded-[28px] p-6 md:p-8 space-y-6 shadow-sm"
              >
                {/* BARIS ATAS: IDENTITAS SISWA & BADGE TIPE RANCANGAN */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-white/10">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isAkhir
                            ? "bg-[#89F9B5]/20 text-emerald-600 dark:text-[#89F9B5] border border-[#89F9B5]/40"
                            : "bg-[#FACC15]/20 text-[#CA8A04] dark:text-[#FACC15] border border-[#FACC15]/40"
                        }`}
                      >
                        TUGAS RANCANGAN {isAkhir ? "AKHIR" : "AWAL"}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          isGraded
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        {isGraded ? "Sudah Dinilai ✓" : "Menunggu Penilaian"}
                      </span>
                    </div>

                    <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                      {student?.full_name || "Siswa Kelas XII"}{" "}
                      <span className="text-xs font-normal text-slate-500 dark:text-white/50">
                        ({student?.email || "-"})
                      </span>
                    </h2>

                    <div className="text-xs text-slate-500 dark:text-white/60">
                      Profil Awal Siswa: IMT{" "}
                      <strong>
                        {metric?.calculated_bmi ?? "-"} (
                        {metric?.bmi_category ?? "Belum Tes"})
                      </strong>{" "}
                      • Skor TKJI{" "}
                      <strong className="text-[#CA8A04] dark:text-[#FACC15]">
                        {metric?.total_tkji_score ?? "-"}/25 (
                        {metric?.tkji_category ?? "Belum Tes"})
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation(prog)}
                    disabled={savingId === prog.id}
                    className="px-5 py-3 rounded-2xl bg-[#FACC15] hover:bg-[#FACC15]/90 text-black text-xs font-extrabold flex items-center gap-2 self-start md:self-auto shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {savingId === prog.id
                      ? "Menyimpan..."
                      : "Simpan Penilaian Rancangan"}
                  </button>
                </div>

                {/* 9 KOTAK JAWABAN RANCANGAN SISWA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {[
                    ["1. Prioritas & Data Pendukung", prog.prioritas],
                    ["2. Tujuan Latihan", prog.tujuan],
                    ["3. Frekuensi & Jadwal 1 Minggu", prog.frekuensi],
                    ["4. Intensitas & Pemantauan (RPE)", prog.intensitas],
                    ["5. Durasi Sesi (Inti & Pemanasan)", prog.durasi],
                    ["6. Jenis Latihan & Alternatif", prog.jenis],
                    ["7. Jeda & Pemulihan Antar Sesi", prog.jeda],
                    ["8. Progresi & Kriteria Kesiapan", prog.progresi],
                    ["9. Alasan Keputusan & Evaluasi", prog.alasan],
                  ].map(([title, content]) => (
                    <div
                      key={title}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 space-y-1.5"
                    >
                      <div className="text-[11px] font-extrabold text-slate-400 dark:text-white/45">
                        {title}
                      </div>
                      <div className="text-slate-800 dark:text-white/90 leading-relaxed whitespace-pre-wrap">
                        {content || "-"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* RUBRIK PENILAIAN GURU (SKALA 1-4) & FEEDBACK */}
                <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 grid grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  {(
                    [
                      ["score_analisis", "Skor Analisis (1-4)"],
                      ["score_fitt", "Ketepatan FITT (1-4)"],
                      ["score_pemulihan", "Pemulihan (1-4)"],
                      ["score_evaluasi", "Progresi & Alasan (1-4)"],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-white/60">
                        {label}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={prog[field] ?? 4}
                        onChange={(e) =>
                          updateLocalField(prog.id, field, e.target.value)
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/15 text-sm font-extrabold"
                      />
                    </div>
                  ))}

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-white/60">
                      Umpan Balik Guru untuk Siswa
                    </label>
                    <input
                      type="text"
                      placeholder="Berikan catatan evaluasi rancangan..."
                      value={prog.feedback ?? ""}
                      onChange={(e) =>
                        updateLocalField(prog.id, "feedback", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/15 text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}