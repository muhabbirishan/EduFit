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
  Cpu,
  Download,
  FileCheck2,
  Save,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function formatHumanLabel(raw?: string | null): string {
  if (!raw) return "-";
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRubricScoreBadge(scoreVal: number): string {
  if (scoreVal === 4) return "badge-tint-emerald shadow-sm";
  if (scoreVal === 3) return "badge-tint-sky shadow-sm";
  if (scoreVal === 2) return "badge-tint-amber shadow-sm";
  if (scoreVal === 1) return "badge-tint-rose shadow-sm";
  return "seg-btn-active";
}

interface ProgramRecord {
  id: string;
  student_id: string;
  type: string;
  status: string;
  prioritas?: string;
  tujuan?: string;
  frekuensi?: string;
  intensitas?: string;
  durasi?: string;
  jenis?: string;
  jeda?: string;
  progresi?: string;
  alasan?: string;
  score_analisis?: number;
  score_fitt?: number;
  score_pemulihan?: number;
  score_evaluasi?: number;
  feedback?: string;
  updated_at?: string;
}

interface AlgorithmPrescription {
  id: string;
  gender: string;
  component: string;
  tkji_category: string;
  bmi_category: string;
  phase: string;
  week: number;
  meeting: number;
  program_name: string;
  instruction_id: string;
  intensity: string;
  duration_min: number;
  rest_time_sec: number;
}

interface StudentRow {
  id: string;
  name: string;
  gender: string;
  status: "graded" | "submitted" | "belum_mengumpulkan";
  hasAwal: boolean;
  hasAkhir: boolean;
  progAwal: ProgramRecord | null;
  progAkhir: ProgramRecord | null;
  activeProg: ProgramRecord | null;
  totalRubricScore: number;
  convertedScore: number;
  tkjiScore: number | null;
  tkjiCategory: string | null;
  bmiScore: number | null;
  bmiCategory: string | null;
}

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

const FITT_COMPONENTS: {
  key: keyof ProgramRecord;
  label: string;
  badgeClass: string;
}[] = [
  {
    key: "prioritas",
    label: "Prioritas & Data Pendukung",
    badgeClass: "badge-tint-amber",
  },
  {
    key: "tujuan",
    label: "Tujuan Latihan",
    badgeClass: "badge-tint-emerald",
  },
  {
    key: "frekuensi",
    label: "Frekuensi & Jadwal Mingguan",
    badgeClass: "badge-tint-sky",
  },
  {
    key: "intensitas",
    label: "Intensitas & Pemantauan",
    badgeClass: "badge-tint-violet",
  },
  {
    key: "durasi",
    label: "Durasi Sesi",
    badgeClass: "badge-tint-amber",
  },
  {
    key: "jenis",
    label: "Jenis & Bentuk Latihan",
    badgeClass: "badge-tint-emerald",
  },
  {
    key: "jeda",
    label: "Jeda & Pemulihan",
    badgeClass: "badge-tint-sky",
  },
  {
    key: "progresi",
    label: "Rencana Progresi",
    badgeClass: "badge-tint-violet",
  },
  {
    key: "alasan",
    label: "Alasan & Evaluasi Keputusan",
    badgeClass: "badge-tint-amber",
  },
];

const RUBRIC_CRITERIA = [
  {
    key: "score_analisis" as const,
    code: "XII-1",
    badgeClass: "badge-tint-amber",
    label: "Analisis Hasil & Prioritas",
    options: [
      {
        val: 1,
        text: "Belum menghubungkan data awal dengan penentuan prioritas latihan.",
      },
      {
        val: 2,
        text: "Menyebutkan data awal namun prioritas yang ditentukan kurang sesuai.",
      },
      {
        val: 3,
        text: "Prioritas latihan tepat, alasan pendukung data belum komprehensif.",
      },
      {
        val: 4,
        text: "Prioritas latihan didukung interpretasi data fisik secara tepat dan akurat.",
      },
    ],
  },
  {
    key: "score_fitt" as const,
    code: "XII-2",
    badgeClass: "badge-tint-emerald",
    label: "Kesesuaian Prinsip FITT",
    options: [
      {
        val: 1,
        text: "Tujuan dan formula FITT belum dapat ditafsirkan dengan benar.",
      },
      {
        val: 2,
        text: "Beberapa komponen FITT belum selaras dengan tujuan peningkatan.",
      },
      {
        val: 3,
        text: "Komponen FITT selaras, terdapat satu variabel dosis yang belum terukur.",
      },
      {
        val: 4,
        text: "Tujuan dan seluruh variabel FITT terukur serta sesuai kondisi awal.",
      },
    ],
  },
  {
    key: "score_pemulihan" as const,
    code: "XII-3",
    badgeClass: "badge-tint-sky",
    label: "Pemulihan & Progresi",
    options: [
      {
        val: 1,
        text: "Belum merencanakan waktu pemulihan atau fase peningkatan beban.",
      },
      {
        val: 2,
        text: "Rencana pemulihan tercantum tanpa indikator kesiapan fisik yang jelas.",
      },
      {
        val: 3,
        text: "Pemulihan dan progresi memadai, kriteria adaptasi belum detail.",
      },
      {
        val: 4,
        text: "Pemulihan dan progresi terstruktur disertai kriteria adaptasi yang jelas.",
      },
    ],
  },
  {
    key: "score_evaluasi" as const,
    code: "XII-4",
    badgeClass: "badge-tint-violet",
    label: "Alasan & Evaluasi Keputusan",
    options: [
      {
        val: 1,
        text: "Belum mampu memberikan argumentasi logis atas rancangan latihan.",
      },
      {
        val: 2,
        text: "Argumentasi masih bersifat umum dan belum bertolak dari data tes.",
      },
      {
        val: 3,
        text: "Alasan berbasis data, evaluasi berkala belum terpetakan spesifik.",
      },
      {
        val: 4,
        text: "Argumentasi kokoh berbasis data disertai skema evaluasi berkala yang jelas.",
      },
    ],
  },
];

export default function RancanganGuruPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const [planType, setPlanType] = useState<"awal" | "akhir">("awal");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "submitted" | "graded" | "empty"
  >("all");
  const [gaugeMode, setGaugeMode] = useState<"koreksi" | "kualitas" | "fisik">(
    "koreksi"
  );
  const [selectedRubricBar, setSelectedRubricBar] = useState<string | null>(
    null
  );

  const [rawStudents, setRawStudents] = useState<any[]>([]);
  const [rawPrograms, setRawPrograms] = useState<ProgramRecord[]>([]);
  const [rawMetrics, setRawMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(
    null
  );
  const [studentProgram, setStudentProgram] = useState<ProgramRecord | null>(
    null
  );
  const [leftModalTab, setLeftModalTab] = useState<"fitt" | "algorithm">(
    "fitt"
  );
  const [matchedAlgorithms, setMatchedAlgorithms] = useState<
    AlgorithmPrescription[]
  >([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [evalForm, setEvalForm] = useState({
    score_analisis: 0,
    score_fitt: 0,
    score_pemulihan: 0,
    score_evaluasi: 0,
    feedback: "",
  });

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(e.target as Node)
      ) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    async function fetchClasses() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from("classes")
          .select("id, name, grade_level, class_code")
          .eq("guru_id", session.user.id)
          .order("grade_level", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setClasses(data);
          const firstGrade12 = data.find(
            (c: any) => Number(c.grade_level) === 12
          );
          setSelectedClass(firstGrade12 || data[0]);
        } else {
          setClasses([]);
        }
      } catch {
        toast.error("Gagal memuat daftar kelas");
      } finally {
        setIsLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const fetchClassEcosystem = async (targetClassId: string) => {
    if (!targetClassId) return;
    setIsLoading(true);
    try {
      const { data: stdClass, error: stdErr } = await supabase
        .from("student_classes")
        .select("student_id, user_profiles(full_name, gender)")
        .eq("class_id", targetClassId);

      if (stdErr) throw stdErr;

      const studentIds =
        stdClass?.map((sc: any) => sc.student_id).filter(Boolean) || [];

      if (studentIds.length === 0) {
        setRawStudents([]);
        setRawPrograms([]);
        setRawMetrics([]);
        return;
      }

      const [programsRes, metricsRes] = await Promise.all([
        supabase
          .from("student_programs")
          .select("*")
          .in("student_id", studentIds)
          .order("updated_at", { ascending: false }),
        supabase
          .from("student_physical_metrics")
          .select(
            "student_id, gender, calculated_bmi, total_tkji_score, tkji_category, bmi_category, created_at"
          )
          .in("student_id", studentIds)
          .order("created_at", { ascending: false }),
      ]);

      if (programsRes.error) throw programsRes.error;

      setRawStudents(stdClass || []);
      setRawPrograms(programsRes.data || []);
      setRawMetrics(metricsRes.data || []);
      setLastSyncTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error: any) {
      toast.error("Gagal memuat data rancangan siswa", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass?.id) {
      fetchClassEcosystem(selectedClass.id);
    }
  }, [selectedClass]);

  const studentsData: StudentRow[] = useMemo(() => {
    return rawStudents
      .map((sc: any) => {
        const progAwal =
          rawPrograms.find(
            (p) =>
              p.student_id === sc.student_id &&
              String(p.type || "awal").trim().toLowerCase() === "awal"
          ) || null;

        const progAkhir =
          rawPrograms.find(
            (p) =>
              p.student_id === sc.student_id &&
              String(p.type || "").trim().toLowerCase() === "akhir"
          ) || null;

        const activeProg = planType === "awal" ? progAwal : progAkhir;

        const s1 = Number(activeProg?.score_analisis) || 0;
        const s2 = Number(activeProg?.score_fitt) || 0;
        const s3 = Number(activeProg?.score_pemulihan) || 0;
        const s4 = Number(activeProg?.score_evaluasi) || 0;
        const totalRubric = s1 + s2 + s3 + s4;
        const converted =
          totalRubric > 0 ? Math.round((totalRubric / 16) * 100) : 0;

        const metric = rawMetrics.find(
          (m: any) => m.student_id === sc.student_id
        );

        const rawStatus = String(activeProg?.status || "belum_mengumpulkan")
          .trim()
          .toLowerCase();
        const isGradedStatus =
          rawStatus === "graded" ||
          rawStatus === "dinilai" ||
          rawStatus === "disetujui" ||
          rawStatus === "selesai" ||
          totalRubric > 0;

        const normalizedStatus: "graded" | "submitted" | "belum_mengumpulkan" =
          isGradedStatus
            ? "graded"
            : activeProg
            ? "submitted"
            : "belum_mengumpulkan";

        const resolvedGender = String(
          sc.user_profiles?.gender || metric?.gender || "L"
        )
          .trim()
          .toUpperCase();

        return {
          id: sc.student_id,
          name: sc.user_profiles?.full_name || "Siswa Tidak Diketahui",
          gender: resolvedGender.startsWith("P") ? "P" : "L",
          status: normalizedStatus,
          hasAwal: !!progAwal,
          hasAkhir: !!progAkhir,
          progAwal,
          progAkhir,
          activeProg,
          totalRubricScore: totalRubric,
          convertedScore: converted,
          tkjiScore:
            metric?.total_tkji_score !== undefined &&
            metric?.total_tkji_score !== null
              ? Number(metric.total_tkji_score)
              : null,
          tkjiCategory: metric?.tkji_category || null,
          bmiScore:
            metric?.calculated_bmi !== undefined &&
            metric?.calculated_bmi !== null
              ? Number(metric.calculated_bmi)
              : null,
          bmiCategory: metric?.bmi_category || null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawStudents, rawPrograms, rawMetrics, planType]);

  const stats = useMemo(() => {
    const totalSiswa = studentsData.length;
    const awalSubmitted = studentsData.filter((s) => s.hasAwal).length;
    const akhirSubmitted = studentsData.filter((s) => s.hasAkhir).length;

    const activeSubmittedList = studentsData.filter(
      (s) => s.status === "submitted" || s.status === "graded"
    );
    const activeGradedList = studentsData.filter((s) => s.status === "graded");
    const activePendingList = studentsData.filter(
      (s) => s.status === "submitted"
    );
    const activeEmptyList = studentsData.filter(
      (s) => s.status === "belum_mengumpulkan"
    );

    const awalPct =
      totalSiswa > 0 ? Math.round((awalSubmitted / totalSiswa) * 100) : 0;
    const akhirPct =
      totalSiswa > 0 ? Math.round((akhirSubmitted / totalSiswa) * 100) : 0;

    const gradedRatePct =
      activeSubmittedList.length > 0
        ? Math.round(
            (activeGradedList.length / activeSubmittedList.length) * 100
          )
        : 0;

    let sumConverted = 0;
    let sumAnalisis = 0;
    let sumFitt = 0;
    let sumPemulihan = 0;
    let sumEvaluasi = 0;

    activeGradedList.forEach((s) => {
      sumConverted += s.convertedScore;
      sumAnalisis += Number(s.activeProg?.score_analisis) || 0;
      sumFitt += Number(s.activeProg?.score_fitt) || 0;
      sumPemulihan += Number(s.activeProg?.score_pemulihan) || 0;
      sumEvaluasi += Number(s.activeProg?.score_evaluasi) || 0;
    });

    const gCount = activeGradedList.length;
    const avgScorePct = gCount > 0 ? Math.round(sumConverted / gCount) : 0;

    const rubricBars = [
      {
        code: "XII-1",
        title: "Analisis Hasil & Prioritas",
        avg4: gCount > 0 ? Number((sumAnalisis / gCount).toFixed(1)) : 0,
        pct: gCount > 0 ? Math.round((sumAnalisis / (gCount * 4)) * 100) : 0,
        fillClass: "chart-fill-gold",
        textClass: "text-gold-accent",
      },
      {
        code: "XII-2",
        title: "Kesesuaian Prinsip FITT",
        avg4: gCount > 0 ? Number((sumFitt / gCount).toFixed(1)) : 0,
        pct: gCount > 0 ? Math.round((sumFitt / (gCount * 4)) * 100) : 0,
        fillClass: "chart-fill-emerald",
        textClass: "text-emerald-accent",
      },
      {
        code: "XII-3",
        title: "Pemulihan & Progresi",
        avg4: gCount > 0 ? Number((sumPemulihan / gCount).toFixed(1)) : 0,
        pct: gCount > 0 ? Math.round((sumPemulihan / (gCount * 4)) * 100) : 0,
        fillClass: "chart-fill-sky",
        textClass: "text-sky-accent",
      },
      {
        code: "XII-4",
        title: "Alasan & Evaluasi Data",
        avg4: gCount > 0 ? Number((sumEvaluasi / gCount).toFixed(1)) : 0,
        pct: gCount > 0 ? Math.round((sumEvaluasi / (gCount * 4)) * 100) : 0,
        fillClass: "chart-fill-terra",
        textClass: "text-terra-accent",
      },
    ];

    const withPhysicalData = studentsData.filter(
      (s) => s.tkjiScore !== null || s.bmiCategory !== null
    ).length;
    const physicalReadyPct =
      totalSiswa > 0 ? Math.round((withPhysicalData / totalSiswa) * 100) : 0;

    return {
      totalSiswa,
      awalSubmitted,
      akhirSubmitted,
      awalPct,
      akhirPct,
      submittedCount: activeSubmittedList.length,
      gradedCount: activeGradedList.length,
      pendingCount: activePendingList.length,
      emptyCount: activeEmptyList.length,
      gradedRatePct,
      avgScorePct,
      rubricBars,
      physicalReadyPct,
    };
  }, [studentsData]);

  const fetchMatchingAlgorithmsForStudent = async (student: StudentRow) => {
    setLoadingAlgorithms(true);
    try {
      let query = supabase
        .from("fitness_algorithms")
        .select("*")
        .eq("gender", student.gender)
        .order("week", { ascending: true })
        .order("meeting", { ascending: true })
        .limit(12);

      if (student.tkjiCategory) {
        query = query.eq("tkji_category", student.tkjiCategory);
      }
      if (student.bmiCategory) {
        query = query.eq("bmi_category", student.bmiCategory);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setMatchedAlgorithms(data);
      } else {
        const { data: fallbackData } = await supabase
          .from("fitness_algorithms")
          .select("*")
          .eq("gender", student.gender)
          .order("week", { ascending: true })
          .limit(8);
        setMatchedAlgorithms(fallbackData || []);
      }
    } catch {
      setMatchedAlgorithms([]);
    } finally {
      setLoadingAlgorithms(false);
    }
  };

  const loadProgramForModal = async (
    studentId: string,
    targetType: "awal" | "akhir"
  ) => {
    try {
      const { data, error } = await supabase
        .from("student_programs")
        .select("*")
        .eq("student_id", studentId)
        .ilike("type", targetType)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setStudentProgram(data || null);
      if (data) {
        setEvalForm({
          score_analisis: Number(data.score_analisis) || 0,
          score_fitt: Number(data.score_fitt) || 0,
          score_pemulihan: Number(data.score_pemulihan) || 0,
          score_evaluasi: Number(data.score_evaluasi) || 0,
          feedback: data.feedback || "",
        });
      } else {
        setEvalForm({
          score_analisis: 0,
          score_fitt: 0,
          score_pemulihan: 0,
          score_evaluasi: 0,
          feedback: "",
        });
      }
    } catch {
      toast.error("Gagal memuat detail rancangan siswa");
    }
  };

  const openEvaluation = async (student: StudentRow) => {
    setSelectedStudent(student);
    setLeftModalTab("fitt");
    await Promise.all([
      loadProgramForModal(student.id, planType),
      fetchMatchingAlgorithmsForStudent(student),
    ]);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProgram || !selectedStudent) return;

    if (
      evalForm.score_analisis === 0 ||
      evalForm.score_fitt === 0 ||
      evalForm.score_pemulihan === 0 ||
      evalForm.score_evaluasi === 0
    ) {
      triggerDynamicIsland(
        "Rubrik Belum Lengkap",
        "Pilih skor 1–4 pada keempat aspek rubrik penilaian.",
        "error"
      );
      return;
    }

    setIsSaving(true);
    try {
      const updatedPayload = {
        score_analisis: evalForm.score_analisis,
        score_fitt: evalForm.score_fitt,
        score_pemulihan: evalForm.score_pemulihan,
        score_evaluasi: evalForm.score_evaluasi,
        feedback: evalForm.feedback,
        status: "Dinilai",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("student_programs")
        .update(updatedPayload)
        .eq("id", studentProgram.id);

      if (error) throw error;

      triggerDynamicIsland(
        `Rancangan ${planType.toUpperCase()} Dinilai`,
        `${selectedStudent.name} (${liveModalConverted} Poin) siap melanjutkan ke Sesi Latihan FITT.`,
        "success"
      );

      setRawPrograms((prev) =>
        prev.map((p) =>
          p.id === studentProgram.id ? { ...p, ...updatedPayload } : p
        )
      );
      setSelectedStudent(null);
    } catch (err: any) {
      toast.error("Gagal menyimpan evaluasi", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (studentsData.length === 0) {
      toast.error("Tidak ada data siswa untuk diekspor");
      return;
    }
    const headers = [
      "Nama Siswa",
      "L/P",
      "Kelas",
      "Fase",
      "Status",
      "Skor Analisis (1-4)",
      "Skor FITT (1-4)",
      "Skor Pemulihan (1-4)",
      "Skor Evaluasi (1-4)",
      "Total Skor (0-100)",
      "Skor TKJI",
      "Kategori TKJI",
      "Kategori IMT",
    ];
    const rows = studentsData.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      s.gender,
      `"${selectedClass?.name || "XII"}"`,
      planType.toUpperCase(),
      s.status === "graded"
        ? "Dinilai"
        : s.status === "submitted"
        ? "Menunggu Koreksi"
        : "Belum Kumpul",
      s.activeProg?.score_analisis || 0,
      s.activeProg?.score_fitt || 0,
      s.activeProg?.score_pemulihan || 0,
      s.activeProg?.score_evaluasi || 0,
      s.convertedScore,
      s.tkjiScore ?? "-",
      `"${s.tkjiCategory || "-"}"`,
      `"${s.bmiCategory || "-"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Rekap_Rancangan_${planType.toUpperCase()}_${
        selectedClass?.name || "XII"
      }_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Rekap Rancangan FITT Diunduh",
      `Berkas CSV fase ${planType.toUpperCase()} berhasil diekspor.`,
      "success"
    );
  };

  const filteredData = useMemo(() => {
    return studentsData.filter((row) => {
      const matchName = row.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchName) return false;
      if (statusFilter === "graded") return row.status === "graded";
      if (statusFilter === "submitted") return row.status === "submitted";
      if (statusFilter === "empty") return row.status === "belum_mengumpulkan";
      return true;
    });
  }, [studentsData, searchQuery, statusFilter]);

  if (!mounted) return null;

  const highestRubric = stats.rubricBars.reduce(
    (max, item) => (item.pct > max.pct ? item : max),
    stats.rubricBars[0] || { code: "XII-1", title: "", avg4: 0, pct: 0 }
  );

  const liveModalTotalRubric =
    (Number(evalForm.score_analisis) || 0) +
    (Number(evalForm.score_fitt) || 0) +
    (Number(evalForm.score_pemulihan) || 0) +
    (Number(evalForm.score_evaluasi) || 0);

  const liveModalConverted =
    liveModalTotalRubric > 0
      ? Math.round((liveModalTotalRubric / 16) * 100)
      : 0;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const activeGaugePct =
    gaugeMode === "koreksi"
      ? stats.gradedRatePct
      : gaugeMode === "kualitas"
      ? stats.avgScorePct
      : stats.physicalReadyPct;
  const dashOffset =
    activeGaugePct <= 0
      ? circumference
      : circumference - (activeGaugePct / 100) * circumference;

  const gaugeStrokeClass =
    gaugeMode === "koreksi"
      ? "gauge-circle-gold"
      : gaugeMode === "kualitas"
      ? "gauge-circle-emerald"
      : "gauge-circle-sky";

  return (
    <div className="edufit-guru-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
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

      {/* ZONA 1: HERO HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-65">
            <span className="text-gold-accent">
              Formulasi FITT & Rekomendasi Program Latihan
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={15} className="text-emerald-accent" />
              {selectedClass
                ? `${selectedClass.name} (Kelas ${
                    selectedClass.grade_level
                  }) · Sinkron ${lastSyncTime || "Aktif"}`
                : "Evaluasi Kurikulum FITT Kelas XII"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Rancangan <br />
            <span className="font-semibold">Program Mandiri</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-sky-accent">
              {isLoading ? "—" : stats.totalSiswa}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Siswa Rombel
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent">
              {isLoading ? "—" : stats.submittedCount}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Rancangan Masuk
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : `${stats.avgScorePct}%`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Skor Mutu Rata-Rata
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 2: 4 BAR TELEMETRI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <button
          type="button"
          onClick={() => {
            setPlanType("awal");
            triggerDynamicIsland(
              "Fase Rancangan Awal",
              `${stats.awalSubmitted} dari ${stats.totalSiswa} siswa telah mengumpulkan.`,
              "info"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rancangan Awal</span>
            <span className="font-mono text-sky-accent">FASE AWAL</span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              planType === "awal" ? "telemetry-bar-gold" : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${stats.awalPct}%`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {stats.awalSubmitted}/{stats.totalSiswa} SISWA
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPlanType("akhir");
            triggerDynamicIsland(
              "Fase Rancangan Akhir",
              `${stats.akhirSubmitted} dari ${stats.totalSiswa} siswa telah mengumpulkan.`,
              "info"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rancangan Akhir</span>
            <span className="font-mono text-emerald-accent">FASE AKHIR</span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              planType === "akhir"
                ? "telemetry-bar-gold"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${stats.akhirPct}%`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {stats.akhirSubmitted}/{stats.totalSiswa} SISWA
            </span>
          </div>
        </button>

        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Progres Penilaian</span>
            <span className="font-mono text-gold-accent">
              {stats.gradedCount} DARI {stats.submittedCount} DIPERIKSA
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${stats.gradedRatePct}%`}
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest relative z-10 ${
                stats.pendingCount > 0
                  ? "badge-tint-amber"
                  : "badge-tint-emerald"
              }`}
            >
              {stats.pendingCount > 0
                ? `${stats.pendingCount} Menunggu`
                : "Tuntas"}
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Basis TKJI/IMT</span>
            <span className="font-mono text-violet-accent">FISIK</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${stats.physicalReadyPct}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ZONA 3: TRIO BENTO UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* Bento 1: Kendali Rombel */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              <SlidersHorizontal size={14} className="text-gold-accent" />
              <span>Filter Rombel & Fase</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Kendali Rombel
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih rombel aktif dan fase rancangan mandiri yang sedang
              dievaluasi.
            </p>

            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {(["awal", "akhir"] as const).map((t) => {
                const active = planType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPlanType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active ? "seg-btn-active shadow-sm" : "seg-btn-idle"
                    }`}
                  >
                    Rancangan {t}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full mb-6" ref={classDropdownRef}>
              <div
                onClick={() =>
                  classes.length > 0 &&
                  setIsClassDropdownOpen(!isClassDropdownOpen)
                }
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isClassDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {selectedClass
                    ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                    : "Pilih Rombel..."}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isClassDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isClassDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`px-6 py-4 text-lg font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                          selectedClass?.id === cls.id
                            ? "text-gold-accent font-bold"
                            : ""
                        }`}
                      >
                        {cls.name} (Kelas {cls.grade_level})
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={studentsData.length === 0}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md disabled:opacity-30 disabled:cursor-not-allowed relative z-10 btn-forest-gold"
          >
            <Download size={16} strokeWidth={2.5} /> Ekspor Rekap Nilai CSV
          </button>
        </div>

        {/* Bento 2: Capaian Aspek Rubrik (4 Warna Berbeda) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={15} className="text-sky-accent" />
              <span>Capaian Aspek Rubrik</span>
            </div>
            <span className="px-3 py-1 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider badge-tint-amber">
              FASE {planType.toUpperCase()}
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading
                ? "—"
                : selectedRubricBar
                ? `${
                    stats.rubricBars.find((b) => b.code === selectedRubricBar)
                      ?.pct || 0
                  }%`
                : `${stats.avgScorePct}%`}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1 truncate">
              {selectedRubricBar
                ? stats.rubricBars.find((b) => b.code === selectedRubricBar)
                    ?.title
                : "Rata-Rata Mutu Kelas"}
            </div>
          </div>

          <div className="pt-4 pb-1 relative z-10">
            <div className="grid grid-cols-4 gap-3 items-end h-44 px-4 py-3.5 rounded-2xl edufit-card-primary">
              {stats.rubricBars.map((bar) => {
                const val = bar.pct;
                const heightPct = val <= 0 ? 6 : Math.max(14, val);
                const isSelected = selectedRubricBar === bar.code;

                return (
                  <button
                    key={bar.code}
                    type="button"
                    onClick={() =>
                      setSelectedRubricBar(isSelected ? null : bar.code)
                    }
                    className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                    title={`${bar.code} (${bar.title}): Rata-rata ${bar.avg4}/4 (${bar.pct}%)`}
                  >
                    <span
                      className={`text-[11px] font-bold font-mono ${bar.textClass}`}
                    >
                      {bar.pct}%
                    </span>
                    <div className="w-6 flex-1 rounded-xl flex items-end overflow-hidden p-0.5 chart-track-pill">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className={`w-full rounded-lg ${bar.fillClass} ${
                          isSelected ? "ring-2 ring-amber-400" : ""
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold font-mono ${
                        isSelected ? "text-gold-accent" : "opacity-70"
                      }`}
                    >
                      {bar.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bento 3: Telemetri Kinerja */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} className="text-emerald-accent" />
              <span>Telemetri Kinerja</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              {[
                { key: "koreksi", label: "Periksa" },
                { key: "kualitas", label: "Mutu" },
                { key: "fisik", label: "Data Fisik" },
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

          <div className="relative flex flex-col items-center justify-center my-2 z-10">
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
                {activeGaugePct > 0 && (
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
                  {isLoading ? "—" : `${activeGaugePct}%`}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold opacity-65 mt-3 text-center">
              {gaugeMode === "koreksi"
                ? `Rancangan ${planType.toUpperCase()} Telah Dinilai`
                : gaugeMode === "kualitas"
                ? "Rata-Rata Kualitas Formulasi FITT"
                : "Kesiapan Dasar TKJI & Profil IMT"}
            </span>
          </div>

          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold font-mono tracking-wider uppercase pt-3 border-t border-hairline text-center">
              <span className="py-1 rounded-lg badge-tint-amber">
                {stats.pendingCount} Masuk
              </span>
              <span className="py-1 rounded-lg badge-tint-emerald">
                {stats.gradedCount} Dinilai
              </span>
              <span className="py-1 rounded-lg badge-tint-sky">
                {stats.emptyCount} Kosong
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 4: DAFTAR RANCANGAN SISWA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-1">
            Portofolio Rancangan Mandiri
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Daftar Rancangan Siswa ({filteredData.length})
          </h3>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {[
              { key: "all", label: `Semua (${stats.totalSiswa})` },
              {
                key: "submitted",
                label: `Perlu Dinilai (${stats.pendingCount})`,
              },
              { key: "graded", label: `Selesai (${stats.gradedCount})` },
              { key: "empty", label: `Belum Kumpul (${stats.emptyCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as any)}
                className={`text-xs font-bold uppercase tracking-widest transition-opacity cursor-pointer ${
                  statusFilter === tab.key
                    ? "opacity-100 underline decoration-gold-accent decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-xs font-semibold outline-none transition-colors edufit-card-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
        {classes.length === 0 ? (
          <div className="xl:col-span-3 flex flex-col items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
            <Users className="w-10 h-10 mb-3" />
            <div className="text-xl font-light tracking-tight">
              Belum ada rombel kelas yang ditugaskan kepada Anda.
            </div>
          </div>
        ) : isLoading ? (
          <div className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55 animate-pulse">
            <div className="text-xl font-light tracking-tight">
              Menyiapkan basis data rancangan siswa...
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
            <div className="text-xl font-light tracking-tight">
              Tidak ada data siswa yang memenuhi filter pencarian.
            </div>
          </div>
        ) : (
          filteredData.map((row, index) => {
            const isGraded = row.status === "graded";
            const isSubmitted = row.status === "submitted";
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];

            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: Math.min(index * 0.04, 0.25),
                }}
                onClick={() => openEvaluation(row)}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform duration-300 hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass} ${
                  isSubmitted ? "bento-showcase-selected" : ""
                }`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono uppercase ${
                        row.gender === "L"
                          ? "badge-tint-sky"
                          : "badge-tint-rose"
                      }`}
                    >
                      {row.gender === "L" ? "PUTRA" : "PUTRI"}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono uppercase bg-black/10 dark:bg-white/10">
                      {row.tkjiScore !== null
                        ? `TKJI ${row.tkjiScore} (${
                            row.tkjiCategory || "TERCATAT"
                          })`
                        : "TKJI BELUM ADA"}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 bg-black/5 dark:bg-white/5 shrink-0">
                    <ArrowUpRight size={18} strokeWidth={1.75} />
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-3 line-clamp-2">
                    {row.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-3 py-1 rounded-xl font-bold ${
                        row.hasAwal
                          ? "badge-tint-emerald"
                          : "bg-black/10 dark:bg-white/10 opacity-70"
                      }`}
                    >
                      AWAL: {row.hasAwal ? "TERKUMPUL" : "—"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-xl font-bold ${
                        row.hasAkhir
                          ? "badge-tint-sky"
                          : "bg-black/10 dark:bg-white/10 opacity-70"
                      }`}
                    >
                      AKHIR: {row.hasAkhir ? "TERKUMPUL" : "—"}
                    </span>
                    {row.bmiCategory && (
                      <span className="px-3 py-1 rounded-xl font-bold badge-tint-violet">
                        IMT: {row.bmiCategory}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Nilai Rancangan
                    </div>
                    <div className="text-3xl font-light font-mono leading-none text-gold-accent">
                      {isGraded ? `${row.convertedScore} Poin` : "—"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Status Evaluasi
                    </div>
                    {isGraded ? (
                      <div className="text-xs font-bold px-3 py-1 rounded-xl badge-tint-emerald inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Dinilai (
                        {row.totalRubricScore}/16)
                      </div>
                    ) : isSubmitted ? (
                      <div className="text-xs font-bold px-3 py-1 rounded-xl badge-tint-amber">
                        Menunggu Koreksi
                      </div>
                    ) : (
                      <div className="text-sm font-bold opacity-50">
                        Belum Mengumpulkan
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL EVALUASI RANCANGAN FITT */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setSelectedStudent(null)}
            />

            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col rounded-[2rem] relative z-10 shadow-2xl edufit-card-primary"
            >
              <div className="p-6 sm:p-8 border-b border-hairline flex flex-wrap justify-between items-center gap-4 shrink-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gold-accent">
                      Evaluasi FITT · {selectedClass?.name}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider ${
                        selectedStudent.gender === "L"
                          ? "badge-tint-sky"
                          : "badge-tint-rose"
                      }`}
                    >
                      {selectedStudent.gender === "L"
                        ? "Putra (L)"
                        : "Putri (P)"}
                    </span>
                    {selectedStudent.tkjiScore !== null && (
                      <span className="px-3 py-1 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider badge-tint-emerald">
                        TKJI: {selectedStudent.tkjiScore}/25 (
                        {selectedStudent.tkjiCategory})
                      </span>
                    )}
                    {selectedStudent.bmiCategory && (
                      <span className="px-3 py-1 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider badge-tint-violet">
                        IMT: {selectedStudent.bmiScore ?? "-"} (
                        {selectedStudent.bmiCategory})
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                    Rancangan:{" "}
                    <span className="font-semibold">
                      {selectedStudent.name}
                    </span>
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex p-1.5 rounded-2xl edufit-surface-subtle">
                    {(["awal", "akhir"] as const).map((t) => {
                      const active = planType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setPlanType(t);
                            loadProgramForModal(selectedStudent.id, t);
                          }}
                          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            active ? "seg-btn-active" : "seg-btn-idle"
                          }`}
                        >
                          Rancangan {t}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hairline">
                    <div className="flex gap-1.5 p-1 rounded-xl edufit-surface-subtle">
                      <button
                        type="button"
                        onClick={() => setLeftModalTab("fitt")}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          leftModalTab === "fitt"
                            ? "seg-btn-active"
                            : "seg-btn-idle"
                        }`}
                      >
                        Isian Rancangan Siswa
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeftModalTab("algorithm")}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                          leftModalTab === "algorithm"
                            ? "seg-btn-active"
                            : "seg-btn-idle"
                        }`}
                      >
                        <Cpu size={13} /> Acuan Resep Sistem (
                        {matchedAlgorithms.length})
                      </button>
                    </div>
                  </div>

                  {leftModalTab === "fitt" ? (
                    !studentProgram ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-hairline edufit-surface-subtle">
                        <FileCheck2 className="w-10 h-10 mx-auto mb-3 opacity-35" />
                        <p className="text-xl font-light">
                          Siswa belum mengumpulkan rancangan{" "}
                          {planType.toUpperCase()}.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3.5">
                        {FITT_COMPONENTS.map((item, idx) => (
                          <div
                            key={item.key}
                            className="p-5 rounded-2xl edufit-surface-subtle"
                          >
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider inline-block mb-2 ${item.badgeClass}`}
                            >
                              0{idx + 1} · {item.label}
                            </span>
                            <p className="text-sm font-medium leading-relaxed">
                              {studentProgram[item.key] || (
                                <span className="italic opacity-40">
                                  Tidak diisi oleh siswa
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="space-y-3.5">
                      <div className="p-4 rounded-2xl badge-tint-emerald text-xs space-y-1">
                        <div className="font-bold uppercase tracking-wider">
                          Acuan Rekomendasi Program Latihan Sistem
                        </div>
                        <p className="opacity-85">
                          Menampilkan dosis latihan otomatis untuk profil{" "}
                          <strong>
                            {selectedStudent.gender === "L" ? "Putra" : "Putri"}{" "}
                            · TKJI {selectedStudent.tkjiCategory || "Umum"} ·
                            IMT {selectedStudent.bmiCategory || "Umum"}
                          </strong>{" "}
                          sebagai pembanding saat Anda menilai FITT siswa.
                        </p>
                      </div>

                      {loadingAlgorithms ? (
                        <div className="p-10 text-center text-xs opacity-55">
                          Mencocokkan rekomendasi program latihan...
                        </div>
                      ) : matchedAlgorithms.length === 0 ? (
                        <div className="p-10 text-center text-xs opacity-55 rounded-2xl edufit-surface-subtle">
                          Belum ada rekomendasi program latihan untuk kombinasi
                          profil ini.
                        </div>
                      ) : (
                        matchedAlgorithms.map((alg) => (
                          <div
                            key={alg.id}
                            className="p-5 rounded-2xl space-y-2.5 edufit-surface-subtle"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase telemetry-bar-forest text-gold-accent">
                                Minggu {alg.week} · Pertemuan {alg.meeting} ·{" "}
                                {formatHumanLabel(alg.phase || "Fase Inti")}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase badge-tint-sky">
                                Fokus: {formatHumanLabel(alg.component)}
                              </span>
                            </div>
                            <h4 className="text-base font-bold">
                              {alg.program_name}
                            </h4>
                            <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                              <div className="p-2.5 rounded-xl edufit-card-primary">
                                <span className="text-[9px] font-sans opacity-55 block">
                                  Intensitas
                                </span>
                                <strong className="text-gold-accent">
                                  {alg.intensity || "-"}
                                </strong>
                              </div>
                              <div className="p-2.5 rounded-xl edufit-card-primary">
                                <span className="text-[9px] font-sans opacity-55 block">
                                  Durasi Sesi
                                </span>
                                <strong className="text-emerald-accent">
                                  {alg.duration_min
                                    ? `${alg.duration_min} Menit`
                                    : "-"}
                                </strong>
                              </div>
                              <div className="p-2.5 rounded-xl edufit-card-primary">
                                <span className="text-[9px] font-sans opacity-55 block">
                                  Jeda Pulih
                                </span>
                                <strong className="text-sky-accent">
                                  {alg.rest_time_sec
                                    ? `${alg.rest_time_sec} Detik`
                                    : "-"}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSaveEvaluation}
                  className="lg:col-span-6 space-y-5"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-hairline">
                    <h3 className="text-2xl font-light tracking-tight">
                      Rubrik Penilaian{" "}
                      <span className="font-semibold">(Skala 1–4)</span>
                    </h3>
                    <div className="px-4 py-1.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest telemetry-bar-gold">
                      Skor: {liveModalTotalRubric}/16 ({liveModalConverted}{" "}
                      Poin)
                    </div>
                  </div>

                  <div className="space-y-4">
                    {RUBRIC_CRITERIA.map((criterion) => {
                      const currentValue = evalForm[criterion.key];

                      return (
                        <div
                          key={criterion.key}
                          className={`p-5 rounded-2xl space-y-3 edufit-surface-subtle ${
                            currentValue > 0 ? "bento-showcase-selected" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase ${criterion.badgeClass}`}
                              >
                                {criterion.code}
                              </span>
                              <span className="text-sm font-bold">
                                {criterion.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4].map((num) => {
                                const active = currentValue === num;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    disabled={!studentProgram}
                                    onClick={() =>
                                      setEvalForm({
                                        ...evalForm,
                                        [criterion.key]: num,
                                      })
                                    }
                                    className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer disabled:opacity-40 ${
                                      active
                                        ? getRubricScoreBadge(num)
                                        : "edufit-card-primary opacity-75 hover:opacity-100"
                                    }`}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {criterion.options.map((opt) => {
                              const isChosen = currentValue === opt.val;
                              return (
                                <button
                                  key={opt.val}
                                  type="button"
                                  disabled={!studentProgram}
                                  onClick={() =>
                                    setEvalForm({
                                      ...evalForm,
                                      [criterion.key]: opt.val,
                                    })
                                  }
                                  className={`p-3 rounded-xl text-left text-xs leading-relaxed transition-all cursor-pointer disabled:opacity-40 flex items-start gap-2 ${
                                    isChosen
                                      ? getRubricScoreBadge(opt.val)
                                      : "edufit-card-primary opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <span className="font-mono font-bold shrink-0">
                                    Skor {opt.val}:
                                  </span>
                                  <span>{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-2.5 block">
                        Umpan Balik Guru
                      </label>
                      <textarea
                        value={evalForm.feedback}
                        onChange={(e) =>
                          setEvalForm({ ...evalForm, feedback: e.target.value })
                        }
                        disabled={!studentProgram}
                        placeholder="Berikan umpan balik konstruktif terhadap formulasi FITT siswa..."
                        className="w-full p-5 rounded-2xl text-sm focus:outline-none resize-none h-32 disabled:opacity-50 edufit-surface-subtle"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || !studentProgram}
                    className="w-full py-4 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 cursor-pointer btn-forest-gold"
                  >
                    <Save size={17} />
                    {isSaving
                      ? "Menyimpan Nilai..."
                      : `Simpan Penilaian ${planType.toUpperCase()}`}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}