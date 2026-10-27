// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Copy,
  Plus,
  School,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

export default function DashboardGuru() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Mode Circular Gauge di Bento 3 (Diperbaiki agar konsisten dengan data IMT)
  const [gaugeMode, setGaugeMode] = useState<"normal" | "kurang" | "lebih">(
    "normal"
  );

  // State Form Buka Kelas
  const [gradeLevel, setGradeLevel] = useState<number>(10);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedSchoolClass, setSelectedSchoolClass] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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
    if (!selectedSchoolClass) {
      triggerDynamicIsland(
        "Pilih Kelas Terlebih Dahulu",
        "Tentukan jurusan/rombel dari daftar yang dipetakan Admin.",
        "error"
      );
      return;
    }
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = gradeLevel === 10 ? "X" : gradeLevel === 11 ? "XI" : "XII";
    const cleanedMasterName = String(selectedSchoolClass.name || "")
      .trim()
      .replace(/^(XII|XI|X|12|11|10)\s*[-·]?\s+/i, "")
      .trim();
    const finalClassName = `${prefix} ${cleanedMasterName || selectedSchoolClass.name}`;

    const { error } = await supabase.from("classes").insert([
      {
        guru_id: profile.id,
        school_id: profile.school_id,
        name: finalClassName,
        grade_level: gradeLevel,
        class_code: newCode,
      },
    ]);
    if (error) {
      toast.error("Gagal membuat kelas");
      triggerDynamicIsland(
        "Gagal Membuka Kelas",
        error.message || "Periksa koneksi database.",
        "error"
      );
      return;
    }
    toast.success(`Kelas ${finalClassName} berhasil dibuka! Kode: ${newCode}`);
    triggerDynamicIsland(
      `Sesi Kelas ${finalClassName} Dibuka`,
      `Kode Bergabung Siswa: ${newCode}`,
      "success"
    );
    setSelectedSchoolClass(null);
    fetchDashboardData();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      triggerDynamicIsland(
        "Kelas Penempatan Kosong",
        "Pilih ruang kelas yang Anda ampu terlebih dahulu.",
        "error"
      );
      return;
    }
    if (studentPassword.length < 6) {
      triggerDynamicIsland(
        "Password Terlalu Pendek",
        "Gunakan minimal 6 karakter untuk akun siswa.",
        "error"
      );
      return;
    }

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
        const registeredName = studentName;
        const registeredGender = studentGender;
        fetchDashboardData();
        setIsStudentModalOpen(false);
        setStudentName("");
        setStudentEmail("");
        setStudentPassword("");
        setStudentGender("L");
        setSelectedClassId("");
        triggerDynamicIsland(
          "Akun Siswa Berhasil Dibuat",
          `${registeredName} (${
            registeredGender === "L" ? "Putra" : "Putri"
          }) telah masuk ke kelas.`,
          "success"
        );
        return `Akun Siswa ${registeredName} (${
          registeredGender === "L" ? "Putra" : "Putri"
        }) berhasil dibuat!`;
      },
      error: (err) => `Gagal: ${err.message}`,
    });

    setIsSubmittingStudent(false);
  };

  const copyCode = (code: string, className?: string) => {
    navigator.clipboard.writeText(code);
    triggerDynamicIsland(
      `Kode Kelas Disalin: ${code}`,
      className
        ? `Bagikan kode ini kepada siswa kelas ${className}.`
        : "Kode kelas berhasil disalin ke papan klip.",
      "info"
    );
  };

  if (!mounted) return null;

  if (isLoading)
    return (
      <div className="h-[60vh] flex items-center justify-center font-light text-2xl tracking-tight opacity-55">
        Menyiapkan Ruang Guru...
      </div>
    );

  const bmiTotal = Math.max(1, stats.bmiStats.total);
  const bmiNormalPct = stats.bmiStats.total
    ? Math.round((stats.bmiStats.normal / bmiTotal) * 100)
    : 0;
  const bmiKurangPct = stats.bmiStats.total
    ? Math.round((stats.bmiStats.kurang / bmiTotal) * 100)
    : 0;
  const bmiLebihPct = stats.bmiStats.total
    ? Math.round((stats.bmiStats.lebih / bmiTotal) * 100)
    : 0;

  const kognitifGain = stats.posttestAvg - stats.pretestAvg;
  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  // Kalkulasi gauge persentase yang kini sinkron 100% dengan tab IMT di Bento 3
  const gaugePct =
    gaugeMode === "normal"
      ? bmiNormalPct
      : gaugeMode === "kurang"
      ? bmiKurangPct
      : bmiLebihPct;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (Math.max(10, gaugePct) / 100) * circumference;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* ====================================================================
          DYNAMIC ISLAND OVERLAY (MURNI MENGGUNAKAN CLASS GLOBALS.CSS)
         ==================================================================== */}
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

      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">
              00 / PORTAL PENDIDIK PJOK
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <School size={15} />
              {profile?.schools?.name || "Institusi Sekolah Mitra"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Halo, <br />
            <span className="font-semibold">
              {profile?.full_name || "Guru"}
            </span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {classes.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              01 / Ruang Kelas
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {stats.totalStudents}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              02 / Siswa Terdaftar
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {stats.posttestAvg}%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              03 / Skor Posttest
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI RUANG GURU
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Rata-rata Pretest */}
        <Link
          href="/guru/teori"
          className="lg:col-span-3 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Pretest</span>
            <span className="font-mono">TES AWAL</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${stats.pretestAvg}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Kognitif
            </span>
          </div>
        </Link>

        {/* Bar 2: Rata-rata Posttest */}
        <Link
          href="/guru/teori"
          className="lg:col-span-3 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Posttest</span>
            <span className="font-mono">
              {kognitifGain >= 0 ? `+${kognitifGain} PT` : `${kognitifGain} PT`}
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${stats.posttestAvg}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pencapaian
            </span>
          </div>
        </Link>

        {/* Bar 3: Striped Track Murni */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Partisipasi Kelas</span>
            <span className="font-mono">{classes.length} ROMBEL AKTIF</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${stats.totalStudents} Siswa`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              Terdaftar
            </span>
          </div>
        </div>

        {/* Bar 4: IMT Normal */}
        <Link
          href="/guru/live-asesmen"
          className="sm:col-span-2 lg:col-span-2 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>IMT Normal</span>
            <span className="font-mono">FISIK</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-between transition-transform group-hover:scale-[1.02] edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {bmiNormalPct}%
            </span>
            <ArrowUpRight size={16} className="opacity-50" />
          </div>
        </Link>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (POLKADOT + GRID MILIMETER + DIAGONAL)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): FORM BUKA KELAS BARU */}
        <div
          className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary"
          ref={dropdownRef}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55 mb-3">
              <span className="font-mono">01 /</span>
              <SlidersHorizontal size={14} />
              <span>Manajemen Rombel</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Buka Sesi Kelas
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih daftar kelas SMA/SMK yang telah disediakan Admin untuk mulai
              mengajar.
            </p>

            <form onSubmit={handleCreateClass} className="space-y-6">
              <div className="flex gap-1.5 p-1.5 rounded-2xl mb-4 edufit-surface-subtle">
                {[10, 11, 12].map((g) => {
                  const active = gradeLevel === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGradeLevel(g)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        active ? "seg-btn-active" : "seg-btn-idle"
                      }`}
                    >
                      Kelas {g}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full mb-6">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                    isDropdownOpen ? "edufit-underline-select-active" : ""
                  }`}
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
                    size={22}
                    className={`transition-transform duration-300 opacity-60 shrink-0 ${
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
                      className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                    >
                      {availableClasses.length === 0 ? (
                        <div className="p-6 text-sm font-medium opacity-55 text-center">
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
                            className={`px-6 py-4 text-lg font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                              selectedSchoolClass?.id === c.id
                                ? "text-gold-accent"
                                : ""
                            }`}
                          >
                            {gradeLevel === 10
                              ? "X"
                              : gradeLevel === 11
                              ? "XI"
                              : "XII"}{" "}
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
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md disabled:opacity-30 disabled:cursor-not-allowed relative z-10 btn-forest-emerald"
          >
            <Plus size={16} strokeWidth={2.5} /> Buka Sesi Kelas Baru
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): EVALUASI KOGNITIF */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">02 /</span>
              <BrainCircuit size={15} />
              <span>Evaluasi Kognitif Siswa</span>
            </div>
            {kognitifGain !== 0 && (
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-accent flex items-center gap-1">
                <TrendingUp size={14} />
                {kognitifGain > 0 ? `+${kognitifGain} PT` : `${kognitifGain} PT`}
              </span>
            )}
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {stats.posttestAvg}%
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Rata-rata Skor Posttest
            </div>
          </div>

          {/* Grafik Batang Vertikal Bertitik (Pretest vs Posttest) */}
          <div className="grid grid-cols-2 gap-6 items-end pt-4 h-44 relative z-10">
            {[
              {
                label: "PRETEST AWAL",
                score: stats.pretestAvg,
                isHighlight: false,
              },
              {
                label: "POSTTEST AKHIR",
                score: stats.posttestAvg,
                isHighlight: true,
              },
            ].map((bar) => {
              const heightPct = Math.max(15, bar.score);
              const fillClass = bar.isHighlight
                ? "chart-fill-gold"
                : "chart-fill-primary";
              return (
                <div
                  key={bar.label}
                  className="flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-xs font-bold font-mono opacity-80">
                    {bar.score}%
                  </span>
                  <div className="w-4 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                    <div
                      className={`w-full rounded-full transition-all duration-500 ${fillClass}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                  <span className="text-[11px] font-bold font-mono opacity-65">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): PROFIL FISIK IMT */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">03 /</span>
              <Activity size={15} />
              <span>Komposisi Fisik (IMT)</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "normal", label: "Normal" },
                { key: "kurang", label: "Kurus" },
                { key: "lebih", label: "Gemuk" },
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

          <div className="relative flex flex-col items-center justify-center my-2 z-10">
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
                  gaugeMode === "normal"
                    ? "gauge-circle-emerald"
                    : "gauge-circle-gold"
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                {gaugeMode === "normal"
                  ? `${bmiNormalPct}%`
                  : gaugeMode === "kurang"
                  ? `${stats.bmiStats.kurang}`
                  : `${stats.bmiStats.lebih}`}
              </span>
              <span className="text-[11px] font-medium opacity-60 mt-1.5 leading-tight">
                {gaugeMode === "normal"
                  ? `${stats.bmiStats.normal} Siswa IMT Normal`
                  : gaugeMode === "kurang"
                  ? `Siswa IMT Kurus (${bmiKurangPct}%)`
                  : `Siswa IMT Berlebih (${bmiLebihPct}%)`}
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <div className="h-2.5 w-full rounded-full flex overflow-hidden mb-3 chart-track-pill">
              {stats.bmiStats.total > 0 && (
                <>
                  <div
                    className="h-full chart-fill-sky"
                    style={{ width: `${bmiKurangPct}%` }}
                  />
                  <div
                    className="h-full chart-fill-emerald"
                    style={{ width: `${bmiNormalPct}%` }}
                  />
                  <div
                    className="h-full chart-fill-terra"
                    style={{ width: `${bmiLebihPct}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-2 border-t border-hairline">
              <span>{stats.bmiStats.kurang} Kurus</span>
              <span>{stats.bmiStats.normal} Normal</span>
              <span>{stats.bmiStats.lebih} Gemuk</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER RUANG KELAS & TOMBOL REGISTRASI SISWA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">
            04 / DIREKTORI ROMBEL AKTIF
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Ruang Kelas Aktif ({classes.length})
          </h3>
          <p className="text-xs font-medium opacity-55 mt-1">
            Daftar kelas yang sedang Anda ampu pada semester berjalan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsStudentModalOpen(true)}
          className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer btn-forest-emerald"
        >
          <UsersRound size={16} strokeWidth={2.5} /> Registrasi Akun Siswa
        </button>
      </div>

      {/* DAFTAR KELAS GRID (PASTEL LIGHT / DEEP FOREST DARK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
        {classes.length === 0 ? (
          <div className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-60">
            <div className="text-xl font-light tracking-tight">
              Belum ada kelas yang dibuka. Silakan buat sesi kelas di atas.
            </div>
          </div>
        ) : (
          classes.map((cls, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            return (
              <div
                key={cls.id}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group ${showcaseClass}`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                    KELAS {cls.grade_level} · SEMESTER AKTIF
                  </span>
                  <Link
                    href="/guru/live-asesmen"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    title="Buka Studio Live Asesmen"
                  >
                    <ArrowUpRight size={18} strokeWidth={1.75} />
                  </Link>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-3">
                    {cls.name}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                      Kode Bergabung:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(cls.class_code, cls.name)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 cursor-pointer bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
                      title="Salin Kode Kelas"
                    >
                      {cls.class_code} <Copy size={12} className="opacity-70" />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Partisipasi Siswa
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {cls.student_classes?.length || 0}{" "}
                      <span className="text-sm font-sans font-medium opacity-65">
                        Siswa
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Status Ruang
                    </div>
                    <div className="text-sm font-bold text-emerald-accent">
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
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsStudentModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                OTORISASI PESERTA DIDIK
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-2">
                Registrasi <span className="font-semibold">Siswa Baru</span>
              </h2>
              <p className="text-sm opacity-55 mb-8 font-medium">
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
                      className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                      Jenis Kelamin (Menentukan Norma TKJI & Algoritma)
                    </label>
                    <div className="grid grid-cols-2 gap-4 p-1.5 rounded-2xl edufit-surface-subtle">
                      <button
                        type="button"
                        onClick={() => setStudentGender("L")}
                        className={`p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                          studentGender === "L"
                            ? "seg-btn-active"
                            : "seg-btn-idle"
                        }`}
                      >
                        <UserCheck size={18} />
                        Laki-laki / Putra (L)
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentGender("P")}
                        className={`p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                          studentGender === "P"
                            ? "seg-btn-active"
                            : "seg-btn-idle"
                        }`}
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
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none edufit-surface-subtle"
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
                      className="w-full p-4 rounded-2xl text-sm font-mono focus:outline-none edufit-surface-subtle"
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
                    className="w-full p-4 rounded-2xl text-sm font-bold flex items-center justify-between cursor-pointer edufit-surface-subtle"
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
                        className="absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2 no-scrollbar edufit-dropdown-menu"
                      >
                        {classes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClassId(c.id);
                              setIsClassSelectOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                              selectedClassId === c.id ? "text-gold-accent" : ""
                            }`}
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
                  className="w-full py-4 mt-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-opacity shadow-md disabled:opacity-50 hover:opacity-90 cursor-pointer btn-forest-emerald"
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