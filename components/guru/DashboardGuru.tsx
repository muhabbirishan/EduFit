// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Copy,
  Plus,
  School,
  ArrowUpRight,
  BrainCircuit,
  Activity,
  TrendingUp,
  ChevronDown,
  X,
  UsersRound,
  UserCheck,
  Sparkles,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardGuru() {
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<"kognitif" | "imt" | "partisipasi">("kognitif");

  // State Form Buka Kelas
  const [gradeLevel, setGradeLevel] = useState<number>(10);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedSchoolClass, setSelectedSchoolClass] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State Form Registrasi Siswa (DILENGKAPI GENDER L / P)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGender, setStudentGender] = useState<"L" | "P">("L");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  const [stats, setStats] = useState({
    totalStudents: 0,
    pretestAvg: 0,
    posttestAvg: 0,
    bmiStats: { normal: 0, kurang: 0, lebih: 0, total: 0 },
  });

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: prof } = await supabase
        .from("user_profiles")
        .select("*, schools(name)")
        .eq("id", session.user.id)
        .single();
      setProfile(prof);

      const { data: clsData } = await supabase
        .from("classes")
        .select(`*, student_classes(student_id)`)
        .eq("guru_id", session.user.id)
        .order("created_at", { ascending: false });
      setClasses(clsData || []);

      const studentIds =
        clsData?.flatMap((c) =>
          c.student_classes.map((sc: any) => sc.student_id)
        ) || [];
      const uniqueStudentIds = [...new Set(studentIds)];

      let preAvg = 0,
        postAvg = 0,
        bmiData = { normal: 0, kurang: 0, lebih: 0, total: 0 };

      if (uniqueStudentIds.length > 0) {
        const { data: evals } = await supabase
          .from("student_evaluation_scores")
          .select("score, master_evaluations(type)")
          .in("student_id", uniqueStudentIds);
        if (evals) {
          const pretests = evals.filter(
            (e: any) => e.master_evaluations?.type === "pretest"
          );
          const posttests = evals.filter(
            (e: any) => e.master_evaluations?.type === "posttest"
          );
          if (pretests.length)
            preAvg = Math.round(
              pretests.reduce((acc, curr) => acc + Number(curr.score || 0), 0) /
                pretests.length
            );
          if (posttests.length)
            postAvg = Math.round(
              posttests.reduce(
                (acc, curr) => acc + Number(curr.score || 0),
                0
              ) / posttests.length
            );
        }
        const { data: metrics } = await supabase
          .from("student_physical_metrics")
          .select("bmi_category")
          .in("student_id", uniqueStudentIds);
        if (metrics) {
          metrics.forEach((m) => {
            const cat = m.bmi_category?.toLowerCase() || "";
            if (cat.includes("normal")) bmiData.normal++;
            else if (cat.includes("kurus") || cat.includes("sangat kurus"))
              bmiData.kurang++;
            else if (
              cat.includes("gemuk") ||
              cat.includes("obesitas") ||
              cat.includes("berlebih") ||
              cat.includes("overweight")
            )
              bmiData.lebih++;
          });
          bmiData.total = metrics.length;
        }
      }

      setStats({
        totalStudents: uniqueStudentIds.length,
        pretestAvg: preAvg,
        posttestAvg: postAvg,
        bmiStats: bmiData,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!profile?.school_id) return;
    const fetchSchoolClasses = async () => {
      const { data } = await supabase
        .from("school_classes")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("grade_level", gradeLevel)
        .order("name");
      setAvailableClasses(data || []);
      setSelectedSchoolClass(null);
    };
    fetchSchoolClasses();
  }, [gradeLevel, profile]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolClass)
      return toast.error("Silakan pilih kelas terlebih dahulu!");
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix =
      gradeLevel === 10 ? "X" : gradeLevel === 11 ? "XI" : "XII";
    const finalClassName = `${prefix} ${selectedSchoolClass.name}`;

    const { error } = await supabase.from("classes").insert([
      {
        guru_id: profile.id,
        school_id: profile.school_id,
        name: finalClassName,
        grade_level: gradeLevel,
        class_code: newCode,
      },
    ]);
    if (error) return toast.error("Gagal membuat kelas");
    toast.success(`Kelas ${finalClassName} berhasil dibuka! Kode: ${newCode}`);
    setSelectedSchoolClass(null);
    fetchDashboardData();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId)
      return toast.error("Gagal", {
        description: "Pilih Kelas Penempatan terlebih dahulu.",
      });
    if (studentPassword.length < 6)
      return toast.error("Gagal", {
        description: "Password minimal 6 karakter.",
      });

    setIsSubmittingStudent(true);

    const promise = fetch("/api/create-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentEmail.trim(),
        password: studentPassword,
        full_name: studentName.trim(),
        gender: studentGender,
        school_id: profile.school_id,
        class_id: selectedClassId,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await supabase
        .from("user_profiles")
        .update({ gender: studentGender })
        .eq("email", studentEmail.trim());

      return data;
    });

    toast.promise(promise, {
      loading: "Meregistrasi akun siswa ke sistem...",
      success: () => {
        fetchDashboardData();
        setIsStudentModalOpen(false);
        setStudentName("");
        setStudentEmail("");
        setStudentPassword("");
        setStudentGender("L");
        setSelectedClassId("");
        return `Akun Siswa ${studentName} (${
          studentGender === "L" ? "Putra" : "Putri"
        }) berhasil dibuat!`;
      },
      error: (err) => `Gagal: ${err.message}`,
    });

    setIsSubmittingStudent(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin");
  };

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

  if (isLoading)
    return (
      <div className="h-[60vh] flex items-center justify-center font-light text-2xl tracking-tight opacity-50">
        Menyiapkan Ruang Guru...
      </div>
    );

  const bmiNormalPct = stats.bmiStats.total
    ? Math.round((stats.bmiStats.normal / stats.bmiStats.total) * 100)
    : 0;
  const kognitifGain = stats.posttestAvg - stats.pretestAvg;
  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  // Kalkulasi gauge persentase untuk Bento 3
  const gaugePct =
    gaugeMode === "kognitif"
      ? Math.max(0, Math.min(100, stats.posttestAvg))
      : gaugeMode === "imt"
      ? bmiNormalPct
      : Math.min(100, Math.round((stats.totalStudents / 40) * 100));

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (Math.max(10, gaugePct) / 100) * circumference;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <School size={16} />{" "}
            {profile?.schools?.name || "Memuat Sekolah..."}
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Halo, <br />
            <span className="font-semibold">
              {profile?.full_name || "Guru"}
            </span>{" "}
            👋
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {classes.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Ruang Kelas
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {stats.totalStudents}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Siswa Terdaftar
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {stats.posttestAvg}%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Skor Posttest
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI RUANG GURU (MURNI GARIS-GARIS TANPA PILL BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Rata-rata Pretest */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Pretest</span>
            <span>Tes Awal</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading ? "—" : `${stats.pretestAvg}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
              Kognitif
            </span>
          </div>
        </div>

        {/* Bar 2: Rata-rata Posttest */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Posttest</span>
            <span>{kognitifGain >= 0 ? `+${kognitifGain} Pt` : `${kognitifGain} Pt`}</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : `${stats.posttestAvg}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pencapaian
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Partisipasi Kelas</span>
            <span>{classes.length} Rombel Aktif</span>
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
              {isLoading ? "—" : `${stats.totalStudents} Siswa`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              Terdaftar
            </span>
          </div>
        </div>

        {/* Bar 4: IMT Normal */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>IMT Normal</span>
            <span>Komposisi</span>
          </div>
          <div
            className="h-14 rounded-2xl px-5 flex items-center justify-center border"
            style={{
              backgroundColor: "var(--ref-card-solid)",
              borderColor: "var(--ref-card-border)",
              color: "var(--ref-text-primary)",
            }}
          >
            <span className="text-2xl font-light tracking-tight text-emerald-500">
              {bmiNormalPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): FORM BUKA KELAS BARU */}
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
            <h2 className="text-3xl font-light tracking-tight mb-2">
              Buka Sesi Kelas
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Pilih daftar kelas SMA/SMK yang telah disediakan Admin untuk mulai
              mengajar.
            </p>

            <form onSubmit={handleCreateClass} className="space-y-6">
              <div
                className="flex gap-1.5 p-1.5 rounded-full mb-4"
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
                    onClick={() => setGradeLevel(g)}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                    style={{
                      backgroundColor:
                        gradeLevel === g ? "#facc15" : "transparent",
                      color: gradeLevel === g ? "#000" : "inherit",
                      opacity: gradeLevel === g ? 1 : 0.5,
                    }}
                  >
                    Kelas {g}
                  </button>
                ))}
              </div>

              <div className="relative w-full mb-6">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                  style={{
                    borderColor: isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.12)",
                  }}
                >
                  <span className="truncate pr-3">
                    {selectedSchoolClass
                      ? `${
                          gradeLevel === 10
                            ? "X"
                            : gradeLevel === 11
                            ? "XI"
                            : "XII"
                        } ${selectedSchoolClass.name}`
                      : "Pilih Jurusan / Kelas..."}
                  </span>
                  <ChevronDown
                    size={24}
                    className={`transition-transform duration-300 opacity-50 shrink-0 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-56 overflow-y-auto no-scrollbar"
                      style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    >
                      {availableClasses.length === 0 ? (
                        <div className="p-6 text-sm font-medium opacity-50 text-center">
                          Admin belum memetakan kelas untuk angkatan ini.
                        </div>
                      ) : (
                        availableClasses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedSchoolClass(c);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-6 py-4 text-xl font-light cursor-pointer transition-colors ${
                              isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                            }`}
                            style={{
                              color:
                                selectedSchoolClass?.id === c.id
                                  ? "#facc15"
                                  : isDark
                                  ? "#fff"
                                  : "#000",
                            }}
                          >
                            {c.name}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>

          <button
            type="button"
            onClick={handleCreateClass}
            disabled={!selectedSchoolClass}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white disabled:opacity-30 disabled:cursor-not-allowed relative z-10"
            style={{ backgroundColor: "#10b981" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Buka Sesi Kelas Baru
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): EVALUASI KOGNITIF (VERTICAL PILL BARS + DOTS) */}
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
              <BrainCircuit size={16} /> Evaluasi Kognitif Siswa
            </div>
            {kognitifGain !== 0 && (
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                {kognitifGain > 0 ? `+${kognitifGain} Pt` : `${kognitifGain} Pt`}
              </span>
            )}
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light tracking-tighter leading-none">
              {stats.posttestAvg}%
            </div>
            <div className="text-sm font-semibold opacity-50 mb-1">
              Rata-rata Skor Posttest
            </div>
          </div>

          {/* Grafik Batang Vertikal Bertitik (Pretest vs Posttest) */}
          <div className="grid grid-cols-2 gap-6 items-end pt-4 h-44 relative z-10">
            {[
              { label: "Pretest Awal", score: stats.pretestAvg, isHighlight: false },
              { label: "Posttest Akhir", score: stats.posttestAvg, isHighlight: true },
            ].map((bar) => {
              const heightPct = Math.max(15, bar.score);
              return (
                <div
                  key={bar.label}
                  className="flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-xs font-bold opacity-75">
                    {bar.score}%
                  </span>
                  <div
                    className="w-4 flex-1 rounded-full flex items-end overflow-hidden p-[1px]"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(24,24,27,0.07)",
                    }}
                  >
                    <div
                      className="w-full rounded-full transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: bar.isHighlight
                          ? "#facc15"
                          : "var(--ref-text-primary)",
                      }}
                    />
                  </div>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: bar.isHighlight
                        ? "#facc15"
                        : "var(--ref-text-primary)",
                    }}
                  />
                  <span className="text-[11px] font-bold opacity-60">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): PROFIL FISIK IMT */}
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
              <Activity size={16} /> Komposisi Fisik (IMT)
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "kognitif", label: "Normal" },
                { key: "imt", label: "Kurus" },
                { key: "partisipasi", label: "Gemuk" },
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

          {/* Svg Tick-Mark Gauge dengan Teks di Bawah (Aman dari Terpotong) */}
          <div className="relative flex flex-col items-center justify-center my-2 z-10">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={
                  isDark ? "rgba(255,255,255,0.16)" : "rgba(24,24,27,0.16)"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-2">
              <span className="text-3xl font-light tracking-tighter leading-none">
                {isLoading
                  ? "—"
                  : gaugeMode === "kognitif"
                  ? `${bmiNormalPct}%`
                  : gaugeMode === "imt"
                  ? `${stats.bmiStats.kurang}`
                  : `${stats.bmiStats.lebih}`}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">
                {gaugeMode === "kognitif"
                  ? "Normal"
                  : gaugeMode === "imt"
                  ? "Kurus"
                  : "Berlebih"}
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-3 border-t border-black/10 dark:border-white/10">
              <span>{stats.bmiStats.kurang} Kurus</span>
              <span>•</span>
              <span>{stats.bmiStats.normal} Normal</span>
              <span>•</span>
              <span>{stats.bmiStats.lebih} Gemuk</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER RUANG KELAS & TOMBOL REGISTRASI SISWA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <h3 className="text-3xl font-light tracking-tight">
            Ruang Kelas Aktif ({classes.length})
          </h3>
          <p className="text-xs font-medium opacity-50 mt-1">
            Daftar kelas yang sedang Anda ampu pada semester berjalan.
          </p>
        </div>

        <button
          onClick={() => setIsStudentModalOpen(true)}
          className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md text-white cursor-pointer"
          style={{ backgroundColor: "#10b981" }}
        >
          <UsersRound size={16} strokeWidth={2.5} /> Registrasi Akun Siswa
        </button>
      </div>

      {/* DAFTAR KELAS GRID (PASTEL LIGHT / OBSIDIAN DARK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
        {classes.length === 0 ? (
          <div
            className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            }}
          >
            <div className="text-xl font-light tracking-tight">
              Belum ada kelas yang dibuka. Silakan buat sesi kelas di atas.
            </div>
          </div>
        ) : (
          classes.map((cls, index) => {
            const bgLight = bentoColors[index % bentoColors.length];
            return (
              <div
                key={cls.id}
                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border"
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
                    KELAS {cls.grade_level} · SEMESTER AKTIF
                  </span>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
                    }}
                  >
                    <ArrowUpRight size={18} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-2">
                    {cls.name}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                      Kode Bergabung:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(cls.class_code)}
                      className="px-3 py-1 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 border cursor-pointer"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                      title="Salin Kode Kelas"
                    >
                      {cls.class_code} <Copy size={11} className="opacity-60" />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Partisipasi Siswa
                    </div>
                    <div className="text-3xl font-light leading-none">
                      {cls.student_classes?.length || 0} Siswa
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Status Ruang
                    </div>
                    <div className="text-sm font-bold text-emerald-500">
                      Aktif Mengajar
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL REGISTRASI AKUN SISWA */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsStudentModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border max-h-[92vh] overflow-y-auto no-scrollbar"
              style={{
                backgroundColor: isDark ? "#141414" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
                color: isDark ? "#fff" : "#000",
              }}
            >
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <X size={20} />
              </button>

              <h2 className="text-3xl font-light tracking-tight mb-2">
                Registrasi <span className="font-semibold">Siswa Baru</span>
              </h2>
              <p className="text-sm opacity-50 mb-8 font-medium">
                Buat akun siswa beserta jenis kelaminnya agar norma TKJI dan
                4.800 algoritma latihan sesuai sasaran.
              </p>

              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      type="text"
                      placeholder="Masukkan nama asli siswa..."
                      className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none transition-colors"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                      Jenis Kelamin (Menentukan Norma TKJI & Algoritma)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setStudentGender("L")}
                        className="p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                        style={{
                          backgroundColor:
                            studentGender === "L"
                              ? "#facc15"
                              : isDark
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.02)",
                          color:
                            studentGender === "L"
                              ? "#000"
                              : isDark
                              ? "#fff"
                              : "#000",
                          borderColor:
                            studentGender === "L"
                              ? "#facc15"
                              : isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)",
                        }}
                      >
                        <UserCheck size={18} />
                        Laki-laki / Putra (L)
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentGender("P")}
                        className="p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                        style={{
                          backgroundColor:
                            studentGender === "P"
                              ? "#facc15"
                              : isDark
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.02)",
                          color:
                            studentGender === "P"
                              ? "#000"
                              : isDark
                              ? "#fff"
                              : "#000",
                          borderColor:
                            studentGender === "P"
                              ? "#facc15"
                              : isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)",
                        }}
                      >
                        <UserCheck size={18} />
                        Perempuan / Putri (P)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Email Siswa
                    </label>
                    <input
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      type="email"
                      placeholder="siswa@edufit.com"
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none border"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.02)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Password Awal
                    </label>
                    <input
                      required
                      minLength={6}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      type="text"
                      placeholder="Minimal 6 karakter"
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none border"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.02)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 relative">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Penempatan Kelas
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
                    className="w-full p-4 rounded-xl text-sm font-bold border flex items-center justify-between cursor-pointer"
                    style={{
                      backgroundColor: isDark ? "#222" : "#f8fafc",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <span>
                      {selectedClassObj
                        ? `${selectedClassObj.name} (Kelas ${selectedClassObj.grade_level})`
                        : "-- Pilih kelas yang Anda ampu --"}
                    </span>
                    <ChevronDown size={18} />
                  </button>
                  <AnimatePresence>
                    {isClassSelectOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute left-0 right-0 mt-2 rounded-2xl shadow-xl border z-50 max-h-48 overflow-y-auto p-1.5 no-scrollbar"
                        style={{
                          backgroundColor: isDark ? "#222" : "#ffffff",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(0,0,0,0.1)",
                        }}
                      >
                        {classes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClassId(c.id);
                              setIsClassSelectOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                            style={{
                              color:
                                selectedClassId === c.id
                                  ? "#facc15"
                                  : isDark
                                  ? "#fff"
                                  : "#000",
                            }}
                          >
                            {c.name} (Kelas {c.grade_level})
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingStudent}
                  className="w-full py-4 mt-6 rounded-full font-bold text-xs uppercase tracking-widest transition-opacity shadow-md disabled:opacity-50 hover:opacity-80 cursor-pointer text-white"
                  style={{ backgroundColor: "#10b981" }}
                >
                  {isSubmittingStudent
                    ? "Memproses ke Server..."
                    : "Buat Akun Siswa"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}