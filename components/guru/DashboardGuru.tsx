// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Database,
  Plus,
  Radio,
  School,
  SlidersHorizontal,
  Target,
  TrendingUp,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const ACADEMIC_YEAR_OPTIONS = [
  "2026/2027",
  "2025/2026",
  "2024/2025",
  "2023/2024",
  "2022/2023",
];

const SMK_KEYWORDS = [
  "tkj",
  "rpl",
  "tkr",
  "tkro",
  "tbsm",
  "akl",
  "otkp",
  "bdp",
  "dkv",
  "multimedia",
  "akuntansi",
  "perkantoran",
  "pemasaran",
  "perhotelan",
  "kuliner",
  "tata boga",
  "tataboga",
  "busana",
  "mesin",
  "pengelasan",
  "elektro",
  "listrik",
  "otomotif",
  "farmasi",
  "keperawatan",
  "jaringan",
  "rekayasa",
];

const DEFAULT_SMA_STREAMS = [
  { id: "sma-mipa-1", name: "MIPA 1" },
  { id: "sma-mipa-2", name: "MIPA 2" },
  { id: "sma-mipa-3", name: "MIPA 3" },
  { id: "sma-mipa-4", name: "MIPA 4" },
  { id: "sma-mipa-5", name: "MIPA 5" },
  { id: "sma-ips-1", name: "IPS 1" },
  { id: "sma-ips-2", name: "IPS 2" },
  { id: "sma-ips-3", name: "IPS 3" },
  { id: "sma-ips-4", name: "IPS 4" },
  { id: "sma-merdeka-1", name: "Merdeka 1" },
  { id: "sma-merdeka-2", name: "Merdeka 2" },
];

// Ekstrak Tahun Ajaran dari nama kelas (jika memakai format "X MIPA 5 [2026/2027]") atau dari created_at
function extractClassYearLabel(cls: any): string {
  const rawName = String(cls?.name || "");
  const bracketMatch = rawName.match(/\[(\d{4}\/\d{4})\]/);
  if (bracketMatch?.[1]) return bracketMatch[1];

  const yearMatch = rawName.match(/(20\d{2}\/20\d{2}|20\d{2})/);
  if (yearMatch?.[1]) {
    if (yearMatch[1].includes("/")) return yearMatch[1];
    const y = Number(yearMatch[1]);
    return `${y}/${y + 1}`;
  }

  if (cls?.created_at) {
    const d = new Date(cls.created_at);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      return `${y}/${y + 1}`;
    }
  }
  return "2026/2027";
}

function cleanDisplayClassName(name?: string): string {
  if (!name) return "Kelas";
  return name.replace(/\s*\[\d{4}\/\d{4}\]\s*/g, "").trim();
}

export default function DashboardGuru() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [islandAlert, setIslandAlert] = useState<IslandNotification | null>(
    null
  );
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

  const [gaugeMode, setGaugeMode] = useState<"normal" | "kurang" | "lebih">(
    "normal"
  );

  // State Form Buka Kelas (Dilengkapi Tahun Ajaran & Filter SMA/SMK)
  const [gradeLevel, setGradeLevel] = useState<number>(10);
  const [academicYear, setAcademicYear] = useState<string>("2026/2027");
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedSchoolClass, setSelectedSchoolClass] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter Tahun Ajaran pada Direktori Rombel Aktif
  const [activeYearFilter, setActiveYearFilter] = useState<string>("all");

  // State Form Registrasi Siswa
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGender, setStudentGender] = useState<"L" | "P">("L");
  const [studentBirthDate, setStudentBirthDate] =
    useState<string>("2009-05-15");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  const [stats, setStats] = useState({
    totalStudents: 0,
    maleCount: 0,
    femaleCount: 0,
    pretestAvg: 0,
    posttestAvg: 0,
    avgTkjiScore: 0,
    tkjiTestedCount: 0,
    pendingReflectionsCount: 0,
    gradedReflectionsCount: 0,
    pendingProgramsCount: 0,
    completedMaterialsCount: 0,
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
        .select("*, schools(name, school_type)")
        .eq("id", session.user.id)
        .single();
      setProfile(prof);

      const { data: clsData } = await supabase
        .from("classes")
        .select(`*, student_classes(student_id)`)
        .eq("guru_id", session.user.id)
        .order("grade_level", { ascending: true })
        .order("created_at", { ascending: false });
      setClasses(clsData || []);

      const studentIds =
        clsData?.flatMap((c) =>
          (c.student_classes || []).map((sc: any) => sc.student_id)
        ) || [];
      const uniqueStudentIds = [...new Set(studentIds)].filter(Boolean);

      let preAvg = 0,
        postAvg = 0,
        maleCount = 0,
        femaleCount = 0,
        avgTkjiScore = 0,
        tkjiTestedCount = 0,
        pendingReflectionsCount = 0,
        gradedReflectionsCount = 0,
        pendingProgramsCount = 0,
        completedMaterialsCount = 0,
        bmiData = { normal: 0, kurang: 0, lebih: 0, total: 0 };

      if (uniqueStudentIds.length > 0) {
        const [
          stuProfRes,
          evalsRes,
          metricsRes,
          refRes,
          progRes,
          matProgRes,
        ] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("id, gender")
            .in("id", uniqueStudentIds),
          supabase
            .from("student_evaluation_scores")
            .select("score, master_evaluations(type)")
            .in("student_id", uniqueStudentIds),
          supabase
            .from("student_physical_metrics")
            .select(
              "student_id, calculated_bmi, bmi_category, total_tkji_score, created_at"
            )
            .in("student_id", uniqueStudentIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("student_reflections")
            .select("id, answer_text, grade, score")
            .in("student_id", uniqueStudentIds),
          supabase
            .from("student_programs")
            .select("id, status, score_analisis")
            .in("student_id", uniqueStudentIds),
          supabase
            .from("student_material_progress")
            .select("id, status")
            .in("student_id", uniqueStudentIds),
        ]);

        (stuProfRes.data || []).forEach((sp: any) => {
          const g = String(sp.gender || "L").toUpperCase();
          if (g === "P" || g.includes("PUTRI") || g.includes("PEREMPUAN")) {
            femaleCount++;
          } else {
            maleCount++;
          }
        });

        const evals = evalsRes.data || [];
        const pretests = evals.filter(
          (e: any) =>
            e.master_evaluations?.type === "pretest" &&
            e.score !== null &&
            e.score !== undefined
        );
        const posttests = evals.filter(
          (e: any) =>
            e.master_evaluations?.type === "posttest" &&
            e.score !== null &&
            e.score !== undefined
        );
        if (pretests.length) {
          preAvg = Math.round(
            pretests.reduce((acc, curr) => acc + Number(curr.score || 0), 0) /
              pretests.length
          );
        }
        if (posttests.length) {
          postAvg = Math.round(
            posttests.reduce((acc, curr) => acc + Number(curr.score || 0), 0) /
              posttests.length
          );
        }

        const latestMetricByStudent: Record<string, any> = {};
        (metricsRes.data || []).forEach((m: any) => {
          if (!latestMetricByStudent[m.student_id]) {
            latestMetricByStudent[m.student_id] = m;
          }
        });

        let tkjiSum = 0;
        Object.values(latestMetricByStudent).forEach((m: any) => {
          if (m.total_tkji_score && Number(m.total_tkji_score) > 0) {
            tkjiTestedCount++;
            tkjiSum += Number(m.total_tkji_score);
          }

          const cat = String(m.bmi_category || "")
            .trim()
            .toLowerCase();
          const hasValidBmi =
            (m.calculated_bmi && Number(m.calculated_bmi) > 0) ||
            cat.length > 0;

          if (hasValidBmi) {
            if (cat.includes("normal")) {
              bmiData.normal++;
              bmiData.total++;
            } else if (cat.includes("kurus") || cat.includes("sangat kurus")) {
              bmiData.kurang++;
              bmiData.total++;
            } else if (
              cat.includes("gemuk") ||
              cat.includes("obesitas") ||
              cat.includes("berlebih") ||
              cat.includes("overweight")
            ) {
              bmiData.lebih++;
              bmiData.total++;
            }
          }
        });

        if (tkjiTestedCount > 0) {
          avgTkjiScore = Number((tkjiSum / tkjiTestedCount).toFixed(1));
        }

        (refRes.data || []).forEach((r: any) => {
          const isGraded = Boolean(
            r.grade || (r.score !== null && r.score !== undefined)
          );
          const hasAns = Boolean(
            r.answer_text &&
              r.answer_text.trim() !== "" &&
              r.answer_text !== "Dinilai langsung oleh Guru"
          );
          if (isGraded) gradedReflectionsCount++;
          else if (hasAns) pendingReflectionsCount++;
        });

        (progRes.data || []).forEach((p: any) => {
          const st = String(p.status || "").toLowerCase();
          const isGraded =
            st === "dinilai" ||
            st === "graded" ||
            (p.score_analisis && Number(p.score_analisis) > 0);
          if (!isGraded) pendingProgramsCount++;
        });

        (matProgRes.data || []).forEach((mp: any) => {
          if (String(mp.status || "").toLowerCase() === "selesai") {
            completedMaterialsCount++;
          }
        });
      }

      setStats({
        totalStudents: uniqueStudentIds.length,
        maleCount,
        femaleCount,
        pretestAvg: preAvg,
        posttestAvg: postAvg,
        avgTkjiScore,
        tkjiTestedCount,
        pendingReflectionsCount,
        gradedReflectionsCount,
        pendingProgramsCount,
        completedMaterialsCount,
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

  // Filter otomatis daftar kelas sesuai status sekolah (SMA vs SMK)
  const schoolType = useMemo(() => {
    const rawType = String(profile?.schools?.school_type || "").toUpperCase();
    const rawName = String(profile?.schools?.name || "").toUpperCase();
    if (rawType === "SMK" || rawName.includes("SMK")) return "SMK";
    return "SMA";
  }, [profile]);

  useEffect(() => {
    if (!profile?.school_id) return;
    const fetchSchoolClasses = async () => {
      const { data } = await supabase
        .from("school_classes")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("grade_level", gradeLevel)
        .order("name");

      const rawList = data || [];

      if (schoolType === "SMA") {
        // Saring keluar jurusan-jurusan kejuruan SMK jika sekolah ini berstatus SMA
        const smaFiltered = rawList.filter((item: any) => {
          const lower = String(item.name || "").toLowerCase();
          return !SMK_KEYWORDS.some((kw) => lower.includes(kw));
        });

        setAvailableClasses(
          smaFiltered.length > 0 ? smaFiltered : DEFAULT_SMA_STREAMS
        );
      } else {
        setAvailableClasses(rawList);
      }
      setSelectedSchoolClass(null);
    };
    fetchSchoolClasses();
  }, [gradeLevel, profile, schoolType]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolClass) {
      triggerDynamicIsland(
        "Pilih Kelas Terlebih Dahulu",
        `Tentukan rombel ${schoolType} yang ingin dibuka.`,
        "error"
      );
      return;
    }

    const prefix = gradeLevel === 10 ? "X" : gradeLevel === 11 ? "XI" : "XII";
    const cleanedMasterName = String(selectedSchoolClass.name || "")
      .trim()
      .replace(/^(XII|XI|X|12|11|10)\s*[-·]?\s+/i, "")
      .trim();

    // Sematkan Tahun Ajaran pada nama kelas agar X MIPA 5 [2024/2025] dan X MIPA 5 [2026/2027] terbedakan dengan jelas
    const finalClassName = `${prefix} ${
      cleanedMasterName || selectedSchoolClass.name
    } [${academicYear}]`;

    // Cek apakah kelas dengan nama dan tahun ajaran yang sama persis sudah pernah dibuka
    const isDuplicate = classes.some(
      (c) =>
        String(c.name || "").toLowerCase() === finalClassName.toLowerCase() &&
        Number(c.grade_level) === gradeLevel
    );

    if (isDuplicate) {
      triggerDynamicIsland(
        "Kelas Sudah Terdaftar",
        `${finalClassName} sudah ada di daftar ruang kelas aktif Anda.`,
        "error"
      );
      return;
    }

    const internalCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { error } = await supabase.from("classes").insert([
      {
        guru_id: profile.id,
        school_id: profile.school_id,
        name: finalClassName,
        grade_level: gradeLevel,
        class_code: internalCode,
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

    toast.success(`Kelas ${finalClassName} berhasil dibuka!`);
    triggerDynamicIsland(
      `Sesi Kelas Dibuka`,
      `${finalClassName} siap menerima penempatan siswa.`,
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
        birth_date: studentBirthDate,
        school_id: profile.school_id,
        class_id: selectedClassId,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await supabase
        .from("user_profiles")
        .update({
          gender: studentGender,
          birth_date: studentBirthDate || "2009-05-15",
        })
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
        setStudentBirthDate("2009-05-15");
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

  // Daftar Tahun Ajaran unik yang dimiliki kelas-kelas Guru
  const availableYearTabs = useMemo(() => {
    const years = new Set<string>();
    classes.forEach((c) => years.add(extractClassYearLabel(c)));
    return Array.from(years).sort().reverse();
  }, [classes]);

  const filteredClassesByYear = useMemo(() => {
    if (activeYearFilter === "all") return classes;
    return classes.filter(
      (c) => extractClassYearLabel(c) === activeYearFilter
    );
  }, [classes, activeYearFilter]);

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

  const gaugePct =
    gaugeMode === "normal"
      ? bmiNormalPct
      : gaugeMode === "kurang"
      ? bmiKurangPct
      : bmiLebihPct;

  const gaugeStrokeClass =
    gaugeMode === "normal"
      ? "gauge-circle-emerald"
      : gaugeMode === "kurang"
      ? "gauge-circle-sky"
      : "gauge-circle-terra";

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    gaugePct <= 0
      ? circumference
      : circumference - (gaugePct / 100) * circumference;

  return (
    <div className="edufit-guru-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* DYNAMIC ISLAND OVERLAY */}
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

      {/* ZONA 1: HERO HEADER & 3 ANGKA UTAMA */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-65">
            <span className="text-gold-accent">Portal Pendidik PJOK</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <School size={15} className="text-emerald-accent" />
              {profile?.schools?.name || "Institusi Sekolah Mitra"} (Jenjang{" "}
              {schoolType})
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Halo, <br />
            <span className="font-semibold">
              {profile?.full_name || "Guru"}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {classes.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Ruang Kelas Aktif
            </div>
          </div>
          <Link href="/guru/siswa" className="group block">
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent group-hover:scale-[1.02] transition-transform">
              {stats.totalStudents}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-65 mt-4 flex items-center gap-1.5">
              <span>Total Siswa</span>
              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] badge-tint-sky">
                {stats.maleCount}L
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] badge-tint-rose">
                {stats.femaleCount}P
              </span>
            </div>
          </Link>
          <Link href="/guru/teori" className="group block">
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent group-hover:scale-[1.02] transition-transform">
              {stats.posttestAvg}%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Rata-Rata Posttest
            </div>
          </Link>
        </div>
      </div>

      {/* ZONA 2: 4 BAR TELEMETRI RUANG GURU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <Link
          href="/guru/teori"
          className="lg:col-span-3 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-Rata Pretest</span>
            <span className="font-mono text-sky-accent">TES AWAL</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${stats.pretestAvg}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-accent">
              Kognitif
            </span>
          </div>
        </Link>

        <Link
          href="/guru/teori"
          className="lg:col-span-3 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-Rata Posttest</span>
            <span className="font-mono text-emerald-accent">
              {kognitifGain >= 0
                ? `+${kognitifGain} Poin`
                : `${kognitifGain} Poin`}
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

        <Link
          href={
            stats.pendingReflectionsCount > 0
              ? "/guru/praktik"
              : "/guru/rancangan"
          }
          className="sm:col-span-2 lg:col-span-4 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Tugas & Rancangan Masuk</span>
            <span className="font-mono text-emerald-accent">
              {stats.completedMaterialsCount} MODUL SELESAI
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {stats.pendingReflectionsCount + stats.pendingProgramsCount}{" "}
              Antrean
            </span>
            <div className="flex items-center gap-1.5 relative z-10">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold badge-tint-amber">
                {stats.pendingReflectionsCount} Materi
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold badge-tint-violet">
                {stats.pendingProgramsCount} Program
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/guru/live-asesmen"
          className="sm:col-span-2 lg:col-span-2 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Skor TKJI</span>
            <span className="font-mono">{stats.tkjiTestedCount} SISWA</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-between transition-transform group-hover:scale-[1.02] edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {stats.avgTkjiScore}/25
            </span>
            <ArrowUpRight size={16} className="text-gold-accent" />
          </div>
        </Link>
      </div>

      {/* ZONA 3: TRIO KARTU BENTO LEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1: FORM BUKA KELAS BARU */}
        <div
          className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary"
          ref={dropdownRef}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-gold-accent" />
                <span>Manajemen Rombel {schoolType}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg font-mono badge-tint-amber">
                {academicYear}
              </span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Buka Sesi Kelas
            </h2>
            <p className="text-sm mb-5 leading-relaxed font-medium opacity-55">
              Pilih angkatan, tahun ajaran, dan rombel {schoolType} untuk
              memisahkan kelas antar angkatan.
            </p>

            <form onSubmit={handleCreateClass} className="space-y-4">
              {/* Pilihan Jenjang Kelas 10 / 11 / 12 */}
              <div className="flex gap-1.5 p-1.5 rounded-2xl edufit-surface-subtle">
                {[10, 11, 12].map((g) => {
                  const active = gradeLevel === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGradeLevel(g)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        active ? "seg-btn-active shadow-sm" : "seg-btn-idle"
                      }`}
                    >
                      Kelas {g}
                    </button>
                  );
                })}
              </div>

              {/* Pilihan Tahun Ajaran */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-55 block mb-1.5">
                  Tahun Ajaran Rombel
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ACADEMIC_YEAR_OPTIONS.slice(0, 3).map((yr) => {
                    const active = academicYear === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setAcademicYear(yr)}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          active ? "badge-tint-emerald" : "edufit-surface-subtle"
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dropdown Pilihan Rombel SMA */}
              <div className="relative w-full pt-1">
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
                      : `Pilih Rombel ${schoolType}...`}
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
                          Belum ada daftar kelas untuk angkatan ini.
                        </div>
                      ) : (
                        availableClasses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedSchoolClass(c);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-6 py-3.5 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between ${
                              selectedSchoolClass?.id === c.id
                                ? "text-gold-accent font-bold"
                                : ""
                            }`}
                          >
                            <span>
                              {gradeLevel === 10
                                ? "X"
                                : gradeLevel === 11
                                ? "XI"
                                : "XII"}{" "}
                              {c.name}
                            </span>
                            <span className="text-xs font-mono opacity-55">
                              {academicYear}
                            </span>
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
            className="w-full py-4 mt-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md disabled:opacity-30 disabled:cursor-not-allowed relative z-10 btn-forest-gold"
          >
            <Plus size={16} strokeWidth={2.5} /> Buka Kelas ({academicYear})
          </button>
        </div>

        {/* BENTO 2: EVALUASI KOGNITIF */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={15} className="text-sky-accent" />
              <span>Evaluasi Kognitif Siswa</span>
            </div>
            {kognitifGain !== 0 && (
              <span
                className={`px-3 py-1 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                  kognitifGain > 0 ? "badge-tint-emerald" : "badge-tint-rose"
                }`}
              >
                <TrendingUp size={13} />
                {kognitifGain > 0 ? `+${kognitifGain} Poin` : `${kognitifGain} Poin`}
              </span>
            )}
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {stats.posttestAvg}%
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Rata-Rata Skor Posttest
            </div>
          </div>

          <div className="pt-4 pb-1 relative z-10">
            <div className="grid grid-cols-2 gap-6 items-end h-44 px-6 py-4 rounded-2xl edufit-card-primary">
              {[
                {
                  label: "PRETEST AWAL",
                  score: stats.pretestAvg,
                  fillClass: "chart-fill-sky",
                  textClass: "text-sky-accent",
                },
                {
                  label: "POSTTEST AKHIR",
                  score: stats.posttestAvg,
                  fillClass: "chart-fill-gold",
                  textClass: "text-gold-accent",
                },
              ].map((bar) => {
                const heightPct = bar.score <= 0 ? 6 : Math.max(14, bar.score);
                return (
                  <div
                    key={bar.label}
                    className="flex flex-col items-center justify-end h-full gap-2"
                  >
                    <span
                      className={`text-xs font-bold font-mono ${bar.textClass}`}
                    >
                      {bar.score}%
                    </span>
                    <div className="w-8 flex-1 rounded-xl flex items-end overflow-hidden p-1 chart-track-pill">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`w-full rounded-lg ${bar.fillClass}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold font-mono tracking-wider opacity-70">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BENTO 3: PROFIL FISIK IMT */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} className="text-emerald-accent" />
              <span>Komposisi Fisik (IMT)</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
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
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-3 relative z-10">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="6"
                  strokeDasharray="2 5"
                  className="gauge-circle-track"
                />
                {gaugePct > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className={`transition-all duration-700 ${gaugeStrokeClass}`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                  {gaugePct}%
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold opacity-70 mt-3 text-center">
              {stats.bmiStats.total === 0
                ? "Belum ada siswa yang diukur IMT"
                : gaugeMode === "normal"
                ? `${stats.bmiStats.normal} dari ${stats.bmiStats.total} Siswa Berstatus IMT Normal`
                : gaugeMode === "kurang"
                ? `${stats.bmiStats.kurang} dari ${stats.bmiStats.total} Siswa Berstatus IMT Kurus`
                : `${stats.bmiStats.lebih} dari ${stats.bmiStats.total} Siswa Berstatus IMT Berlebih`}
            </p>
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
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase pt-2 border-t border-hairline">
              <span className="text-sky-accent">
                {stats.bmiStats.kurang} Kurus
              </span>
              <span className="text-emerald-accent">
                {stats.bmiStats.normal} Normal
              </span>
              <span className="text-terra-accent">
                {stats.bmiStats.lebih} Gemuk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 3.5: PINTASAN MENU UTAMA GURU (4 WARNA KATEGORI BERBEDA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12 relative z-10">
        <Link
          href="/guru/siswa"
          className="p-6 rounded-3xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 edufit-card-primary group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-accent block">
              Direktori & Arsip
            </span>
            <div className="text-xl font-semibold tracking-tight">
              Data Murid & Rapor
            </div>
            <p className="text-xs opacity-60">
              Kelola {stats.totalStudents} profil siswa & arsip tahunan
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center badge-tint-amber group-hover:scale-110 transition-transform shrink-0">
            <UsersRound size={18} />
          </div>
        </Link>

        <Link
          href="/guru/praktik"
          className="p-6 rounded-3xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 edufit-card-primary group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-accent block">
              Pemantik & Jurnal
            </span>
            <div className="text-xl font-semibold tracking-tight">
              Koreksi Materi Siswa
            </div>
            <p className="text-xs opacity-60">
              {stats.pendingReflectionsCount} menunggu ·{" "}
              {stats.gradedReflectionsCount} selesai dinilai
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center badge-tint-emerald group-hover:scale-110 transition-transform shrink-0">
            <BookOpen size={18} />
          </div>
        </Link>

        <Link
          href="/guru/rancangan"
          className="p-6 rounded-3xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 edufit-card-primary group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-accent block">
              Program Latihan Kelas XII
            </span>
            <div className="text-xl font-semibold tracking-tight">
              Evaluasi Rancangan
            </div>
            <p className="text-xs opacity-60">
              {stats.pendingProgramsCount} rancangan perlu koreksi rubrik
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center badge-tint-violet group-hover:scale-110 transition-transform shrink-0">
            <Target size={18} />
          </div>
        </Link>

        <Link
          href="/guru/kurikulum"
          className="p-6 rounded-3xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 edufit-card-primary group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-accent block">
              Referensi Materi
            </span>
            <div className="text-xl font-semibold tracking-tight">
              Kurikulum & Algoritma
            </div>
            <p className="text-xs opacity-60">
              Lihat modul bacaan, video praktik & matriks latihan
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center badge-tint-sky group-hover:scale-110 transition-transform shrink-0">
            <Database size={18} />
          </div>
        </Link>
      </div>

      {/* ZONA 4: DIREKTORI RUANG KELAS AKTIF */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-1">
            Direktori Rombel Aktif
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Ruang Kelas Anda ({filteredClassesByYear.length})
          </h3>
          {availableYearTabs.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mt-2.5">
              <button
                type="button"
                onClick={() => setActiveYearFilter("all")}
                className={`text-xs font-bold uppercase tracking-widest transition-opacity cursor-pointer ${
                  activeYearFilter === "all"
                    ? "opacity-100 underline decoration-gold-accent decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                Semua Tahun ({classes.length})
              </button>
              {availableYearTabs.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setActiveYearFilter(yr)}
                  className={`text-xs font-bold font-mono uppercase tracking-widest transition-opacity cursor-pointer ${
                    activeYearFilter === yr
                      ? "opacity-100 underline decoration-gold-accent decoration-2 underline-offset-8"
                      : "opacity-45 hover:opacity-80"
                  }`}
                >
                  TA {yr} (
                  {
                    classes.filter((c) => extractClassYearLabel(c) === yr)
                      .length
                  }
                  )
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsStudentModalOpen(true)}
          className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[1.02] flex items-center gap-2 shadow-md cursor-pointer btn-forest-gold"
        >
          <UsersRound size={16} strokeWidth={2.5} /> Registrasi Akun Siswa
        </button>
      </div>

      {/* DAFTAR KELAS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
        {filteredClassesByYear.length === 0 ? (
          <div className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-60">
            <div className="text-xl font-light tracking-tight">
              Belum ada kelas yang dibuka pada tahun ajaran ini.
            </div>
          </div>
        ) : (
          filteredClassesByYear.map((cls, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const yearLabel = extractClassYearLabel(cls);
            const cleanName = cleanDisplayClassName(cls.name);
            const isGrade12 = Number(cls.grade_level) === 12;

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.05, 0.25),
                }}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[290px] shadow-sm transition-transform duration-300 hover:-translate-y-1 relative overflow-hidden group ${showcaseClass}`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-80">
                    KELAS {cls.grade_level} · TA {yearLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/guru/siswa?classId=${cls.id}`}
                      className="px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-colors bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15"
                      title="Kelola Daftar Murid & Rapor Kelas Ini"
                    >
                      Data Murid
                    </Link>
                    {isGrade12 && (
                      <Link
                        href={`/guru/live-asesmen?classId=${cls.id}`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 badge-tint-rose"
                        title="Buka Studio Live Asesmen untuk Kelas 12 Ini"
                      >
                        <Radio size={17} strokeWidth={2} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-2">
                    {cleanName}
                  </div>
                  <span className="inline-block px-3 py-1 rounded-xl text-xs font-mono font-bold bg-black/10 dark:bg-white/10">
                    Tahun Ajaran {yearLabel}
                  </span>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Jumlah Peserta Didik
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {cls.student_classes?.length || 0}{" "}
                      <span className="text-sm font-sans font-medium opacity-65">
                        Siswa
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/guru/siswa?classId=${cls.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider underline underline-offset-4 opacity-80 hover:opacity-100"
                  >
                    <span>Lihat Anggota</span>
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL REGISTRASI AKUN SISWA */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
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

              <span className="text-xs font-bold uppercase tracking-widest text-gold-accent block mb-1">
                Pendaftaran Peserta Didik
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-2">
                Registrasi <span className="font-semibold">Siswa Baru</span>
              </h2>
              <p className="text-sm opacity-55 mb-8 font-medium">
                Siswa yang didaftarkan akan langsung masuk ke kelas yang Anda
                pilih tanpa perlu memasukkan kode kelas.
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
                      placeholder="Masukkan nama lengkap siswa..."
                      className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-4 p-1.5 rounded-2xl edufit-surface-subtle">
                      <button
                        type="button"
                        onClick={() => setStudentGender("L")}
                        className={`p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                          studentGender === "L"
                            ? "badge-tint-sky shadow-sm"
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
                            ? "badge-tint-rose shadow-sm"
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
                      Tanggal Lahir Siswa
                    </label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
                      />
                      <input
                        required
                        type="date"
                        value={studentBirthDate}
                        onChange={(e) => setStudentBirthDate(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm font-mono focus:outline-none edufit-surface-subtle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Penempatan Kelas
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
                        className="w-full p-4 rounded-2xl text-sm font-bold flex items-center justify-between cursor-pointer edufit-surface-subtle"
                      >
                        <span className="truncate pr-2">
                          {selectedClassObj
                            ? `${cleanDisplayClassName(
                                selectedClassObj.name
                              )} (${extractClassYearLabel(selectedClassObj)})`
                            : "-- Pilih Rombel --"}
                        </span>
                        <ChevronDown size={18} className="shrink-0" />
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
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between ${
                                  selectedClassId === c.id
                                    ? "text-gold-accent"
                                    : ""
                                }`}
                              >
                                <span>{cleanDisplayClassName(c.name)}</span>
                                <span className="text-xs font-mono opacity-60">
                                  TA {extractClassYearLabel(c)}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
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

                <button
                  type="submit"
                  disabled={isSubmittingStudent}
                  className="w-full py-4 mt-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-opacity shadow-md disabled:opacity-50 hover:opacity-90 cursor-pointer btn-forest-gold"
                >
                  {isSubmittingStudent
                    ? "Memproses ke Server..."
                    : "Buat Akun & Masukkan ke Kelas"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}