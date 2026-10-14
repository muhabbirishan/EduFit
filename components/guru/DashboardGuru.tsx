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
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardGuru() {
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Pastikan kolom gender pada user_profiles ikut ter-update meskipun API route lama belum menyertakannya
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

  const bentoColors = [
    "bg-[#fef08a] text-black dark:bg-[#111111] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#facc15]/50",
    "bg-[#bbf7d0] text-black dark:bg-[#161616] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#facc15]/50",
    "bg-[#fed7aa] text-black dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#facc15]/50",
    "bg-[#bae6fd] text-black dark:bg-[#0f0f0f] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#facc15]/50",
  ];

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

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-12 relative z-10">
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
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {stats.totalStudents}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Siswa Terdaftar
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 mb-6">
        {/* BENTO 1: FORM BUKA KELAS */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-visible flex flex-col justify-between min-h-[340px] border group"
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.1] rounded-[2.5rem] overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 2px, transparent 2px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl font-light tracking-tight mb-2">
              Buka Kelas
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Pilih daftar kelas SMA/SMK yang disediakan Admin.
            </p>

            <form onSubmit={handleCreateClass} className="space-y-6">
              <div
                className="flex gap-2 p-1.5 rounded-full"
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
                    className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all"
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

              <div className="relative w-full">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                  style={{
                    borderColor: isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.1)",
                  }}
                >
                  <span
                    className={
                      selectedSchoolClass
                        ? isDark
                          ? "text-white"
                          : "text-black"
                        : isDark
                        ? "text-white/30"
                        : "text-black/30"
                    }
                  >
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
                    className={`transition-transform duration-300 opacity-50 ${
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
                      className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-56 overflow-y-auto"
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

              <button
                type="submit"
                disabled={!selectedSchoolClass}
                className="w-full py-4 rounded-full font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity mt-2 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#facc15", color: "#000" }}
              >
                <Plus size={16} strokeWidth={3} /> Buka Sesi Kelas
              </button>
            </form>
          </div>
        </div>

        {/* BENTO 2: EVALUASI KOGNITIF */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[340px] border"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={16} /> Evaluasi Kognitif
            </div>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-center">
            <div className="flex items-end gap-3 mb-2">
              <div className="text-6xl font-light tracking-tighter leading-none">
                {stats.posttestAvg}
              </div>
              <div className="text-sm font-semibold opacity-50 mb-1">
                Rata-rata Posttest
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
                  <span>Pretest</span>
                  <span>{stats.pretestAvg}</span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, stats.pretestAvg))}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                  <span style={{ color: "#facc15" }}>Posttest</span>
                  <span style={{ color: "#facc15" }}>{stats.posttestAvg}</span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, stats.posttestAvg)
                      )}%`,
                      backgroundColor: "#facc15",
                    }}
                  />
                </div>
              </div>
            </div>
            {kognitifGain > 0 && (
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
                <TrendingUp size={16} /> +{kognitifGain} Poin Peningkatan
              </div>
            )}
          </div>
        </div>

        {/* BENTO 3: PROFIL FISIK (IMT) */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[340px] border"
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
              <Activity size={16} /> Profil Fisik (IMT)
            </div>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-center">
            <div className="flex items-end gap-3 mb-6">
              <div className="text-6xl font-light tracking-tighter leading-none">
                {bmiNormalPct}%
              </div>
              <div className="text-sm font-semibold opacity-50 mb-1">
                IMT Normal
              </div>
            </div>
            <div
              className="h-4 w-full rounded-full flex overflow-hidden mb-4"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {stats.bmiStats.total > 0 && (
                <>
                  <div
                    className="h-full bg-blue-400"
                    style={{
                      width: `${
                        (stats.bmiStats.kurang / stats.bmiStats.total) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${
                        (stats.bmiStats.normal / stats.bmiStats.total) * 100
                      }%`,
                      backgroundColor: "#facc15",
                    }}
                  />
                  <div
                    className="h-full bg-red-400"
                    style={{
                      width: `${
                        (stats.bmiStats.lebih / stats.bmiStats.total) * 100
                      }%`,
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-xs font-bold tracking-widest uppercase opacity-70">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" /> Kurus
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#facc15" }}
                />{" "}
                Normal
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" /> Gemuk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER RUANG KELAS & TOMBOL TAMBAH SISWA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-10 mb-6 gap-4">
        <h3 className="text-xl font-light tracking-tight opacity-50">
          Ruang Kelas Aktif
        </h3>
        <button
          onClick={() => setIsStudentModalOpen(true)}
          className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-80 shadow-md"
          style={{ backgroundColor: "#facc15", color: "#000" }}
        >
          <UsersRound size={16} strokeWidth={2.5} /> Registrasi Akun Siswa
        </button>
      </div>

      {/* DAFTAR KELAS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {classes.length === 0 ? (
          <div
            className="xl:col-span-3 flex items-center justify-center p-10 rounded-[2.5rem] border border-dashed opacity-50"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            }}
          >
            <div className="text-xl font-light tracking-tight">
              Belum ada kelas yang dibuat.
            </div>
          </div>
        ) : (
          classes.map((cls, index) => {
            const bgLight = bentoColors[index % bentoColors.length]
              .split(" ")[0]
              .replace("bg-[", "")
              .replace("]", "");
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
                  <span
                    className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  >
                    Kelas {cls.grade_level}
                  </span>
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <ArrowUpRight size={20} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="mt-8 relative z-10">
                  <div className="text-4xl font-light tracking-tighter mb-8 leading-none">
                    {cls.name}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">
                        Kode Join
                      </div>
                      <div
                        className="text-lg font-bold font-mono px-3 py-1.5 rounded-xl inline-flex items-center gap-3 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                        }}
                        onClick={() => copyCode(cls.class_code)}
                      >
                        {cls.class_code}{" "}
                        <Copy size={12} className="opacity-50" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-light leading-none">
                        {cls.student_classes?.length || 0}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-2">
                        Siswa
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL REGISTRASI AKUN SISWA (DILENGKAPI PILIHAN GENDER PUTRA L / PUTRI P) */}
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
              className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border max-h-[92vh] overflow-y-auto"
              style={{
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
                color: isDark ? "#fff" : "#000",
              }}
            >
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white"
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

                  {/* SELECTOR JENIS KELAMIN (PUTRA L / PUTRI P) */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                      Jenis Kelamin (Menentukan Norma TKJI & Algoritma)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setStudentGender("L")}
                        className="p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all"
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
                        className="p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all"
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
                      className="w-full p-4 rounded-xl text-sm focus:outline-none border"
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
                      className="w-full p-4 rounded-xl text-sm focus:outline-none border"
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

                {/* CUSTOM DROPDOWN PENEMPATAN KELAS */}
                <div className="pt-2 relative">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Penempatan Kelas
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
                    className="w-full p-4 rounded-xl text-sm font-bold border flex items-center justify-between"
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
                        className="absolute left-0 right-0 mt-2 rounded-2xl shadow-xl border z-50 max-h-48 overflow-y-auto p-1.5"
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
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
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
                  className="w-full py-4 mt-6 rounded-full font-bold text-xs uppercase tracking-widest transition-opacity shadow-md disabled:opacity-50 hover:opacity-80"
                  style={{ backgroundColor: "#facc15", color: "#000" }}
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