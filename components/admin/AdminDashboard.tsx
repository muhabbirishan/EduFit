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
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  Layers,
  Play,
  School,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface SchoolSummary {
  id: string;
  name: string;
  school_type: string;
  address: string;
  guruCount: number;
  siswaCount: number;
  classCount: number;
}

interface GradeSummary {
  grade: number;
  materialCount: number;
  evalCount: number;
  classCount: number;
  studentCount: number;
  reflectionCount: number;
  gradedReflectionCount: number;
  avgPretest: number;
  avgPosttest: number;
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

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState({
    full_name: "Administrator",
    email: "",
    role: "Pemilik Sistem & Kurikulum",
  });

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

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedGradeFilter, setSelectedGradeFilter] = useState<
    number | "all"
  >("all");
  const [cognitiveViewMode, setCognitiveViewMode] = useState<"post" | "pre">(
    "post"
  );
  const [selectedTpCode, setSelectedTpCode] = useState<string | null>(null);
  const [gaugeMode, setGaugeMode] = useState<"tkji" | "bmi" | "program">(
    "tkji"
  );
  const [rightPanelTab, setRightPanelTab] = useState<
    "checklist" | "materi" | "ujian" | "media"
  >("checklist");
  const [bottomShowcaseTab, setBottomShowcaseTab] = useState<"schools" | "tp">(
    "schools"
  );

  const [schoolsList, setSchoolsList] = useState<SchoolSummary[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [videosList, setVideosList] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const [counts, setCounts] = useState({
    totalSchools: 0,
    totalGuru: 0,
    totalSiswa: 0,
    totalClasses: 0,
    totalMaterials: 0,
    totalVideos: 0,
    totalEvaluations: 0,
    totalQuestions: 0,
    totalReflections: 0,
    gradedReflections: 0,
    gradeACount: 0,
    gradeBCount: 0,
    gradeCCount: 0,
    gradeDCount: 0,
    totalMetrics: 0,
    avgTkjiScore: 0,
    totalPrograms: 0,
    avgPretest: 0,
    avgPosttest: 0,
    bmiStats: { normal: 0, kurang: 0, lebih: 0, total: 0 },
  });

  const [gradeSummaries, setGradeSummaries] = useState<GradeSummary[]>([
    {
      grade: 10,
      materialCount: 0,
      evalCount: 0,
      classCount: 0,
      studentCount: 0,
      reflectionCount: 0,
      gradedReflectionCount: 0,
      avgPretest: 0,
      avgPosttest: 0,
    },
    {
      grade: 11,
      materialCount: 0,
      evalCount: 0,
      classCount: 0,
      studentCount: 0,
      reflectionCount: 0,
      gradedReflectionCount: 0,
      avgPretest: 0,
      avgPosttest: 0,
    },
    {
      grade: 12,
      materialCount: 0,
      evalCount: 0,
      classCount: 0,
      studentCount: 0,
      reflectionCount: 0,
      gradedReflectionCount: 0,
      avgPretest: 0,
      avgPosttest: 0,
    },
  ]);

  const [tpBars, setTpBars] = useState<
    { code: string; title: string; pre: number; post: number }[]
  >([]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        schoolDropdownRef.current &&
        !schoolDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    async function fetchHybridEcosystemData() {
      setIsLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: myProfile } = await supabase
            .from("user_profiles")
            .select("full_name, email, role")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (myProfile) {
            setAdminProfile({
              full_name: myProfile.full_name || "Administrator",
              email: myProfile.email || authData.user.email || "",
              role: "Pemilik Sistem & Kurikulum",
            });
          }
        }

        const [
          schoolsRes,
          profilesRes,
          classesRes,
          studentClassesRes,
          materialsRes,
          videosRes,
          evalsRes,
          questionsRes,
          evalScoresRes,
          answersRes,
          reflectionsRes,
          metricsRes,
          programsRes,
        ] = await Promise.all([
          supabase
            .from("schools")
            .select("id, name, school_type, address, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("user_profiles")
            .select("id, school_id, role, full_name"),
          supabase.from("classes").select("id, school_id, grade_level, name"),
          supabase.from("student_classes").select("student_id, class_id"),
          supabase
            .from("master_materials")
            .select("id, grade_level, unit_name")
            .order("grade_level", { ascending: true }),
          supabase
            .from("master_practice_videos")
            .select("id, title, category, duration_label"),
          supabase
            .from("master_evaluations")
            .select("id, grade_level, type, title")
            .order("grade_level", { ascending: true }),
          supabase
            .from("question_bank")
            .select("id, learning_objective_code"),
          supabase
            .from("student_evaluation_scores")
            .select(
              "student_id, score, submitted_at, master_evaluations(type, grade_level)"
            ),
          supabase
            .from("student_answers")
            .select(
              "is_correct, question_bank!inner(learning_objective_code), student_evaluation_scores!inner(student_id, master_evaluations!inner(type))"
            ),
          supabase
            .from("student_reflections")
            .select("id, student_id, unit_name, score, grade"),
          supabase
            .from("student_physical_metrics")
            .select("id, student_id, total_tkji_score, bmi_category"),
          supabase.from("student_programs").select("id, student_id, status"),
        ]);

        const allSchools = schoolsRes.data || [];
        const allProfiles = profilesRes.data || [];
        const allClasses = classesRes.data || [];
        const allStudentClasses = studentClassesRes.data || [];
        const allMaterials = materialsRes.data || [];
        const allVideos = videosRes.data || [];
        const allEvals = evalsRes.data || [];
        const allQuestions = questionsRes.data || [];
        const allEvalScores = evalScoresRes.data || [];
        const allAnswers = answersRes.data || [];
        const allReflections = reflectionsRes.data || [];
        const allMetrics = metricsRes.data || [];
        const allPrograms = programsRes.data || [];

        setMaterialsList(allMaterials);
        setEvaluationsList(allEvals);
        setVideosList(allVideos);

        const computedSchools: SchoolSummary[] = allSchools.map((sch: any) => {
          const gurus = allProfiles.filter(
            (p: any) => p.school_id === sch.id && String(p.role) === "guru"
          ).length;
          const siswas = allProfiles.filter(
            (p: any) => p.school_id === sch.id && String(p.role) === "siswa"
          ).length;
          const cls = allClasses.filter(
            (c: any) => c.school_id === sch.id
          ).length;
          return {
            id: sch.id,
            name: sch.name,
            school_type: sch.school_type || "SMA",
            address: sch.address || "Indonesia",
            guruCount: gurus,
            siswaCount: siswas,
            classCount: cls,
          };
        });
        setSchoolsList(computedSchools);

        const filteredProfiles =
          selectedSchoolId === "all"
            ? allProfiles
            : allProfiles.filter((p: any) => p.school_id === selectedSchoolId);

        const allowedStudentIds = new Set(
          filteredProfiles
            .filter((p: any) => String(p.role) === "siswa")
            .map((p: any) => p.id)
        );

        const totalGuru = filteredProfiles.filter(
          (p: any) => String(p.role) === "guru"
        ).length;
        const totalSiswa = allowedStudentIds.size;
        const filteredClasses =
          selectedSchoolId === "all"
            ? allClasses
            : allClasses.filter((c: any) => c.school_id === selectedSchoolId);

        const classGradeMap: Record<string, number> = {};
        filteredClasses.forEach((c: any) => {
          classGradeMap[c.id] = Number(c.grade_level) || 10;
        });

        const studentGradeMap: Record<string, number> = {};
        allStudentClasses.forEach((sc: any) => {
          if (classGradeMap[sc.class_id]) {
            studentGradeMap[sc.student_id] = classGradeMap[sc.class_id];
          }
        });

        const filteredEvalScores =
          selectedSchoolId === "all"
            ? allEvalScores
            : allEvalScores.filter((es: any) =>
                allowedStudentIds.has(es.student_id)
              );

        const filteredReflections =
          selectedSchoolId === "all"
            ? allReflections
            : allReflections.filter((r: any) =>
                allowedStudentIds.has(r.student_id)
              );

        const filteredMetrics =
          selectedSchoolId === "all"
            ? allMetrics
            : allMetrics.filter((m: any) =>
                allowedStudentIds.has(m.student_id)
              );

        const filteredPrograms =
          selectedSchoolId === "all"
            ? allPrograms
            : allPrograms.filter((pr: any) =>
                allowedStudentIds.has(pr.student_id)
              );

        const gradeFilteredEvals =
          selectedGradeFilter === "all"
            ? filteredEvalScores
            : filteredEvalScores.filter(
                (ev: any) =>
                  Number(ev.master_evaluations?.grade_level) ===
                  selectedGradeFilter
              );

        let sumPre = 0,
          cntPre = 0,
          sumPost = 0,
          cntPost = 0;

        gradeFilteredEvals.forEach((ev: any) => {
          const type = ev.master_evaluations?.type;
          const s = Number(ev.score) || 0;
          if (type === "pretest") {
            sumPre += s;
            cntPre++;
          } else if (type === "posttest") {
            sumPost += s;
            cntPost++;
          }
        });

        const avgPre = cntPre > 0 ? Math.round(sumPre / cntPre) : 0;
        const avgPost = cntPost > 0 ? Math.round(sumPost / cntPost) : 0;

        let tkjiSum = 0,
          tkjiCnt = 0;
        const bmiData = { normal: 0, kurang: 0, lebih: 0, total: 0 };

        filteredMetrics.forEach((m: any) => {
          const tScore = Number(m.total_tkji_score) || 0;
          if (tScore > 0) {
            tkjiSum += tScore;
            tkjiCnt++;
          }
          const bmiCat = String(m.bmi_category || "").toLowerCase();
          if (bmiCat.includes("normal")) bmiData.normal++;
          else if (bmiCat.includes("kurus") || bmiCat.includes("under"))
            bmiData.kurang++;
          else if (
            bmiCat.includes("lebih") ||
            bmiCat.includes("over") ||
            bmiCat.includes("obes") ||
            bmiCat.includes("gemuk")
          )
            bmiData.lebih++;
        });
        bmiData.total = filteredMetrics.length;

        let gA = 0,
          gB = 0,
          gC = 0,
          gD = 0,
          gradedTotal = 0;

        filteredReflections.forEach((r: any) => {
          const gr = String(r.grade || "").trim().toUpperCase();
          const sc =
            r.score !== null && r.score !== undefined ? Number(r.score) : null;
          if (gr || sc !== null) {
            gradedTotal++;
            if (gr === "A" || sc === 100) gA++;
            else if (gr === "B" || (sc !== null && sc >= 75 && sc < 100)) gB++;
            else if (gr === "C" || (sc !== null && sc >= 50 && sc < 75)) gC++;
            else if (gr === "D" || (sc !== null && sc < 50)) gD++;
          }
        });

        const tpDefaultTitles: Record<string, string> = {
          "X-1": "Komponen Kebugaran Jasmani",
          "X-2": "Tafsir IMT & Komposisi Tubuh",
          "X-3": "Analisis Bentuk Latihan",
          "X-4": "Refleksi Respons Tubuh",
          "XI-1": "Analisis Gerak & Kecepatan",
          "XII-1": "Evaluasi TKJI & Program FITT",
        };

        const tpMap: Record<
          string,
          { preT: number; preC: number; postT: number; postC: number }
        > = {
          "X-1": { preT: 0, preC: 0, postT: 0, postC: 0 },
          "X-2": { preT: 0, preC: 0, postT: 0, postC: 0 },
          "X-3": { preT: 0, preC: 0, postT: 0, postC: 0 },
          "X-4": { preT: 0, preC: 0, postT: 0, postC: 0 },
        };

        allQuestions.forEach((q: any) => {
          const code = (q.learning_objective_code || "").trim();
          if (code && !tpMap[code]) {
            tpMap[code] = { preT: 0, preC: 0, postT: 0, postC: 0 };
          }
        });

        allAnswers.forEach((ans: any) => {
          if (
            selectedSchoolId !== "all" &&
            !allowedStudentIds.has(ans.student_evaluation_scores?.student_id)
          ) {
            return;
          }
          const code = (
            ans.question_bank?.learning_objective_code || ""
          ).trim();
          const type = ans.student_evaluation_scores?.master_evaluations?.type;
          if (!code) return;
          if (!tpMap[code]) {
            tpMap[code] = { preT: 0, preC: 0, postT: 0, postC: 0 };
          }
          if (type === "pretest") {
            tpMap[code].preT++;
            if (ans.is_correct) tpMap[code].preC++;
          } else if (type === "posttest") {
            tpMap[code].postT++;
            if (ans.is_correct) tpMap[code].postC++;
          }
        });

        const sortedCodes = Object.keys(tpMap).sort();
        const computedBars = sortedCodes.slice(0, 7).map((code) => {
          const item = tpMap[code];
          const prePct =
            item.preT > 0 ? Math.round((item.preC / item.preT) * 100) : 0;
          const postPct =
            item.postT > 0 ? Math.round((item.postC / item.postT) * 100) : 0;
          return {
            code,
            title: tpDefaultTitles[code] || `Capaian Pembelajaran ${code}`,
            pre: prePct,
            post: postPct,
          };
        });
        setTpBars(computedBars);

        const unitGradeMap: Record<string, number> = {};
        allMaterials.forEach((m: any) => {
          if (m.unit_name)
            unitGradeMap[m.unit_name] = Number(m.grade_level) || 10;
        });

        const grades: GradeSummary[] = [10, 11, 12].map((g) => {
          const matCnt = allMaterials.filter(
            (m: any) => Number(m.grade_level) === g
          ).length;
          const evCnt = allEvals.filter(
            (e: any) => Number(e.grade_level) === g
          ).length;
          const clsCnt = filteredClasses.filter(
            (c: any) => Number(c.grade_level) === g
          ).length;
          const stuCnt = Object.entries(studentGradeMap).filter(
            ([sId, grd]) => grd === g && allowedStudentIds.has(sId)
          ).length;

          const gRefs = filteredReflections.filter(
            (r: any) => (unitGradeMap[r.unit_name] || 10) === g
          );
          const gGradedRefs = gRefs.filter(
            (r: any) =>
              r.score !== null || (r.grade && String(r.grade).trim() !== "")
          ).length;

          let gPreSum = 0,
            gPreCnt = 0,
            gPostSum = 0,
            gPostCnt = 0;

          filteredEvalScores.forEach((ev: any) => {
            const evGrade = Number(ev.master_evaluations?.grade_level) || 10;
            if (evGrade === g) {
              const s = Number(ev.score) || 0;
              if (ev.master_evaluations?.type === "pretest") {
                gPreSum += s;
                gPreCnt++;
              } else if (ev.master_evaluations?.type === "posttest") {
                gPostSum += s;
                gPostCnt++;
              }
            }
          });

          return {
            grade: g,
            materialCount: matCnt,
            evalCount: evCnt,
            classCount: clsCnt,
            studentCount: stuCnt,
            reflectionCount: gRefs.length,
            gradedReflectionCount: gGradedRefs,
            avgPretest: gPreCnt > 0 ? Math.round(gPreSum / gPreCnt) : 0,
            avgPosttest: gPostCnt > 0 ? Math.round(gPostSum / gPostCnt) : 0,
          };
        });
        setGradeSummaries(grades);

        setCounts({
          totalSchools: allSchools.length,
          totalGuru,
          totalSiswa,
          totalClasses: filteredClasses.length,
          totalMaterials: allMaterials.length,
          totalVideos: allVideos.length,
          totalEvaluations: allEvals.length,
          totalQuestions: allQuestions.length,
          totalReflections: filteredReflections.length,
          gradedReflections: gradedTotal,
          gradeACount: gA,
          gradeBCount: gB,
          gradeCCount: gC,
          gradeDCount: gD,
          totalMetrics: filteredMetrics.length,
          avgTkjiScore:
            tkjiCnt > 0 ? Number((tkjiSum / tkjiCnt).toFixed(1)) : 0,
          totalPrograms: filteredPrograms.length,
          avgPretest: avgPre,
          avgPosttest: avgPost,
          bmiStats: bmiData,
        });

        setLastSyncTime(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (err: any) {
        toast.error("Gagal memuat data ekosistem");
        triggerDynamicIsland(
          "Gangguan Sinkronisasi Data",
          "Tidak dapat memuat telemetri terbaru dari server.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchHybridEcosystemData();
  }, [selectedSchoolId, selectedGradeFilter, triggerDynamicIsland]);

  const kognitifGain = counts.avgPosttest - counts.avgPretest;

  const reflectionRate = useMemo(() => {
    if (counts.totalSiswa === 0 || counts.totalMaterials === 0) return 0;
    const target =
      counts.totalSiswa * Math.max(1, Math.min(3, counts.totalMaterials));
    return Math.min(100, Math.round((counts.totalReflections / target) * 100));
  }, [counts.totalReflections, counts.totalSiswa, counts.totalMaterials]);

  const physicalCoverageRate = useMemo(() => {
    if (counts.totalSiswa === 0) return 0;
    return Math.min(
      100,
      Math.round((counts.totalMetrics / counts.totalSiswa) * 100)
    );
  }, [counts.totalMetrics, counts.totalSiswa]);

  const bmiNormalPct = useMemo(() => {
    if (counts.bmiStats.total === 0) return 0;
    return Math.round((counts.bmiStats.normal / counts.bmiStats.total) * 100);
  }, [counts.bmiStats]);

  const ecosystemTasks = useMemo(() => {
    return [
      {
        id: "schools",
        title: "Institusi Sekolah Terdaftar",
        subtitle: `${counts.totalSchools} Sekolah · ${counts.totalClasses} Rombel Kelas`,
        done: counts.totalSchools > 0,
        href: "/admin/institusi",
      },
      {
        id: "teachers",
        title: "Akun Guru PJOK Aktif",
        subtitle: `${counts.totalGuru} Guru terhubung ke sekolah`,
        done: counts.totalGuru > 0,
        href: "/admin/institusi",
      },
      {
        id: "materials",
        title: "Modul Materi Kelas 10, 11, 12",
        subtitle: `${counts.totalMaterials} Unit Materi & Pemantik`,
        done:
          gradeSummaries.every((g) => g.materialCount > 0) &&
          counts.totalMaterials > 0,
        href: "/admin/materi",
      },
      {
        id: "evaluations",
        title: "Instrumen Pretest & Posttest",
        subtitle: `${counts.totalEvaluations} Ujian · ${counts.totalQuestions} Butir Soal`,
        done: counts.totalEvaluations > 0 && counts.totalQuestions > 0,
        href: "/admin/evaluasi",
      },
      {
        id: "metrics",
        title: "Data TKJI & Refleksi Siswa",
        subtitle: `${counts.totalMetrics} Data Fisik · ${counts.totalReflections} Refleksi`,
        done: counts.totalMetrics > 0 || counts.totalReflections > 0,
        href: "/admin/program",
      },
    ];
  }, [counts, gradeSummaries]);

  const completedTaskCount = ecosystemTasks.filter((t) => t.done).length;
  const ecosystemReadinessPct = Math.round(
    (completedTaskCount / ecosystemTasks.length) * 100
  );

  const totalContentAssets = Math.max(
    1,
    counts.totalMaterials + counts.totalEvaluations + counts.totalVideos
  );
  const materiFlex = Math.max(
    25,
    Math.round((counts.totalMaterials / totalContentAssets) * 100)
  );
  const ujianFlex = Math.max(
    22,
    Math.round((counts.totalEvaluations / totalContentAssets) * 100)
  );
  const mediaFlex = Math.max(22, 100 - materiFlex - ujianFlex);

  const handleExportCSV = () => {
    const rows = [
      ["Metrik Ekosistem EduFit", "Nilai"],
      ["Total Sekolah Mitra", counts.totalSchools],
      ["Total Guru PJOK", counts.totalGuru],
      ["Total Siswa Aktif", counts.totalSiswa],
      ["Total Rombel Kelas", counts.totalClasses],
      ["Total Unit Materi", counts.totalMaterials],
      ["Rata-rata Pretest (%)", counts.avgPretest],
      ["Rata-rata Posttest (%)", counts.avgPosttest],
      ["Peningkatan Kognitif (Gain)", kognitifGain],
      ["Total Pengukuran TKJI", counts.totalMetrics],
      ["Rata-rata Skor TKJI", counts.avgTkjiScore],
      ["Total Refleksi Siswa", counts.totalReflections],
      ["Refleksi Dinilai Guru", counts.gradedReflections],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `EduFit_Insight_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerDynamicIsland(
      "Laporan Ekosistem Diunduh",
      `Berkas CSV (${counts.totalSchools} Sekolah, ${counts.totalSiswa} Siswa) berhasil diekspor.`,
      "success"
    );
  };

  if (!mounted) return null;

  const activeSchoolObj =
    selectedSchoolId === "all"
      ? null
      : schoolsList.find((s) => s.id === selectedSchoolId);

  const visibleGradeRows =
    selectedGradeFilter === "all"
      ? gradeSummaries
      : gradeSummaries.filter((g) => g.grade === selectedGradeFilter);

  const highestPostTp = tpBars.reduce(
    (max, item) => (item.post > max.post ? item : max),
    tpBars[0] || { code: "-", title: "", pre: 0, post: 0 }
  );

  return (
    <div className="edufit-admin-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
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
            <span className="text-gold-accent">KENDALI PUSAT</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <School size={15} />
              {activeSchoolObj
                ? `${activeSchoolObj.name} (${activeSchoolObj.school_type})`
                : "Ekosistem Nasional EduFit"}
            </span>
            <span>—</span>
            <button
              type="button"
              onClick={() =>
                triggerDynamicIsland(
                  "Status Telemetri Aktif",
                  `Sinkronisasi terakhir pukul ${lastSyncTime || "Live"} WIB`,
                  "success"
                )
              }
              className="font-mono underline decoration-dotted underline-offset-4 hover:opacity-100 cursor-pointer text-gold-accent"
            >
              SYNC {lastSyncTime || "LIVE"}
            </button>
          </div>

          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Halo, <br />
            <span className="font-semibold">
              {adminProfile.full_name.split(" ")[0]}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <Link href="/admin/institusi" className="group">
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none group-hover:text-gold-accent transition-colors">
              {isLoading ? "—" : counts.totalSchools}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4 flex items-center gap-1.5">
              <span>Sekolah Mitra</span>
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </Link>

          <Link href="/admin/institusi" className="group">
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent transition-colors">
              {isLoading ? "—" : counts.totalGuru}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4 flex items-center gap-1.5">
              <span>Guru PJOK</span>
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </Link>

          <Link href="/admin/institusi" className="group">
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none group-hover:text-gold-accent transition-colors">
              {isLoading ? "—" : counts.totalSiswa}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4 flex items-center gap-1.5">
              <span>Siswa Aktif</span>
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </Link>
        </div>
      </div>

      {/* ZONA 2: 4 BAR TELEMETRI EKOSISTEM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <button
          type="button"
          onClick={() => {
            setCognitiveViewMode("pre");
            triggerDynamicIsland(
              "Mode Evaluasi Pretest Aktif",
              `Menampilkan rata-rata awal ${counts.avgPretest}% dari ${counts.totalEvaluations} paket ujian.`,
              "info"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Pretest</span>
            <span className="font-mono">TES AWAL</span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              cognitiveViewMode === "pre"
                ? "telemetry-bar-forest-active"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${counts.avgPretest}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              {counts.totalEvaluations} Paket
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setCognitiveViewMode("post");
            triggerDynamicIsland(
              "Mode Evaluasi Posttest Aktif",
              `Capaian akhir ${counts.avgPosttest}% (${
                kognitifGain >= 0 ? `+${kognitifGain}` : kognitifGain
              } poin peningkatan).`,
              "success"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Posttest</span>
            <span className="font-mono">
              {kognitifGain >= 0 ? `+${kognitifGain} PT` : `${kognitifGain} PT`}
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${counts.avgPosttest}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pencapaian
            </span>
          </div>
        </button>

        <Link
          href="/admin/materi"
          className="sm:col-span-2 lg:col-span-4 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Partisipasi Materi & Refleksi</span>
            <span className="font-mono">{counts.totalReflections} JAWABAN</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${reflectionRate}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              {counts.gradedReflections} Dinilai Guru
            </span>
          </div>
        </Link>

        <Link
          href="/admin/program"
          className="sm:col-span-2 lg:col-span-2 space-y-2 block group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Data TKJI</span>
            <span className="font-mono">{counts.totalMetrics} SISWA</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-between transition-transform group-hover:scale-[1.02] edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-gold-accent">
              {isLoading ? "—" : `${physicalCoverageRate}%`}
            </span>
            <ArrowUpRight size={16} className="opacity-50" />
          </div>
        </Link>
      </div>

      {/* ZONA 3: TRIO KARTU BENTO LEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1: CAKUPAN SISTEM & FILTER */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
                <SlidersHorizontal size={14} />
                <span>Filter Ekosistem</span>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Ekspor Laporan CSV"
              >
                <Download size={15} />
              </button>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Cakupan Sistem
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih angkatan kelas dan sekolah mitra untuk mengkalibrasi seluruh
              metrik di layar.
            </p>

            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[
                { val: "all", label: "Semua" },
                { val: 10, label: "Kelas 10" },
                { val: 11, label: "Kelas 11" },
                { val: 12, label: "Kelas 12" },
              ].map((g) => {
                const isActive = selectedGradeFilter === g.val;
                return (
                  <button
                    key={String(g.val)}
                    type="button"
                    onClick={() => {
                      setSelectedGradeFilter(g.val as any);
                      triggerDynamicIsland(
                        g.val === "all"
                          ? "Filter Jenjang: Semua Kelas"
                          : `Filter Jenjang: Kelas ${g.val}`,
                        "Menyesuaikan data evaluasi dan matriks kurikulum.",
                        "info"
                      );
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full mb-6" ref={schoolDropdownRef}>
              <div
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isSchoolDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {activeSchoolObj
                    ? activeSchoolObj.name
                    : `Seluruh Sekolah (${counts.totalSchools})`}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isSchoolDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isSchoolDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    <div
                      onClick={() => {
                        setSelectedSchoolId("all");
                        setIsSchoolDropdownOpen(false);
                        triggerDynamicIsland(
                          "Cakupan Nasional Diaktifkan",
                          `Menampilkan gabungan ${counts.totalSchools} institusi sekolah.`,
                          "success"
                        );
                      }}
                      className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        selectedSchoolId === "all" ? "text-gold-accent" : ""
                      }`}
                    >
                      Seluruh Sekolah ({counts.totalSchools} Institusi)
                    </div>
                    {schoolsList.map((sch) => (
                      <div
                        key={sch.id}
                        onClick={() => {
                          setSelectedSchoolId(sch.id);
                          setIsSchoolDropdownOpen(false);
                          triggerDynamicIsland(
                            `Fokus Institusi: ${sch.name}`,
                            `${sch.guruCount} Guru PJOK · ${sch.siswaCount} Siswa · ${sch.classCount} Rombel`,
                            "success"
                          );
                        }}
                        className={`px-6 py-4 text-base font-light cursor-pointer transition-colors flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 ${
                          selectedSchoolId === sch.id ? "text-gold-accent" : ""
                        }`}
                      >
                        <span className="truncate pr-2">{sch.name}</span>
                        <span className="font-mono text-xs opacity-60 shrink-0">
                          {sch.siswaCount} Siswa
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 relative z-10 pt-2">
            {gradeSummaries.map((g) => {
              const active = selectedGradeFilter === g.grade;
              return (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() =>
                    setSelectedGradeFilter(active ? "all" : g.grade)
                  }
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                    active ? "grade-card-active" : "edufit-surface-subtle"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-55">
                    Kelas {g.grade}
                  </div>
                  <div className="text-xl font-light font-mono tracking-tight mt-0.5">
                    {g.materialCount} Unit
                  </div>
                  <div className="text-[10px] font-semibold opacity-60">
                    {g.classCount} Rombel
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BENTO 2: CAPAIAN KOGNITIF & GRAFIK TP */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={15} />
              <span>Capaian Kognitif & TP</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setCognitiveViewMode(
                  cognitiveViewMode === "post" ? "pre" : "post"
                )
              }
              className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-transform hover:scale-105 edufit-card-primary"
            >
              {cognitiveViewMode === "post" ? "Mode Posttest" : "Mode Pretest"}
            </button>
          </div>

          <div className="my-4 flex items-end justify-between gap-3 relative z-10">
            <div className="flex items-end gap-3">
              <div className="text-6xl font-light font-mono tracking-tighter leading-none">
                {isLoading
                  ? "—"
                  : cognitiveViewMode === "post"
                  ? `${counts.avgPosttest}%`
                  : `${counts.avgPretest}%`}
              </div>
              <div className="text-sm font-semibold opacity-60 mb-1">
                {selectedTpCode
                  ? `Fokus TP ${selectedTpCode}`
                  : cognitiveViewMode === "post"
                  ? "Rata-rata Posttest"
                  : "Rata-rata Pretest"}
              </div>
            </div>

            {kognitifGain !== 0 && (
              <div className="flex items-center gap-1 text-xs font-bold font-mono uppercase tracking-widest mb-1 text-gold-accent">
                <TrendingUp size={15} />
                {kognitifGain > 0 ? `+${kognitifGain}` : kognitifGain} PT
              </div>
            )}
          </div>

          {/* Grafik Batang Proporsional & Rapi */}
          <div className="pt-4 pb-1 relative z-10">
            <div
              className="grid gap-2.5 items-end h-44 px-2 py-3 rounded-2xl edufit-card-primary"
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  1,
                  tpBars.length
                )}, minmax(0, 1fr))`,
              }}
            >
              {tpBars.map((bar) => {
                const val = cognitiveViewMode === "post" ? bar.post : bar.pre;
                const isHighest = bar.code === highestPostTp.code && val > 0;
                const isSelected = selectedTpCode === bar.code;

                const fillClass = isSelected
                  ? "chart-fill-emerald"
                  : isHighest
                  ? "chart-fill-gold"
                  : "chart-fill-primary";

                return (
                  <button
                    key={bar.code}
                    type="button"
                    onClick={() => {
                      const nextTp =
                        selectedTpCode === bar.code ? null : bar.code;
                      setSelectedTpCode(nextTp);
                      if (nextTp) {
                        triggerDynamicIsland(
                          `Tujuan Pembelajaran ${bar.code}`,
                          `${bar.title} — Pretest ${bar.pre}% → Posttest ${bar.post}%`,
                          "info"
                        );
                      }
                    }}
                    className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                    title={`${bar.code} (${bar.title}): Pretest ${bar.pre}% → Posttest ${bar.post}%`}
                  >
                    <span
                      className={`text-[10px] font-bold font-mono transition-opacity ${
                        isSelected || isHighest
                          ? "opacity-100 text-gold-accent"
                          : "opacity-65 group-hover:opacity-100"
                      }`}
                    >
                      {val}%
                    </span>
                    <div className="w-5 flex-1 rounded-xl flex items-end overflow-hidden p-0.5 chart-track-pill">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{
                          height: `${Math.max(val > 0 ? 12 : 4, val)}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`w-full rounded-lg ${fillClass}`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold font-mono tracking-tight truncate max-w-full ${
                        isSelected
                          ? "text-emerald-accent"
                          : isHighest
                          ? "text-gold-accent"
                          : "opacity-70"
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

        {/* BENTO 3: INDEKS FISIK, TKJI & IMT (TEKS LABEL DI LUAR LINGKARAN CHART) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} />
              <span>Fisik, TKJI & IMT</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              {[
                { key: "tkji", label: "TKJI" },
                { key: "bmi", label: "IMT" },
                { key: "program", label: "FITT" },
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

          {(() => {
            const gaugeValue =
              gaugeMode === "tkji"
                ? counts.avgTkjiScore > 0
                  ? `${counts.avgTkjiScore}`
                  : `${counts.totalMetrics}`
                : gaugeMode === "bmi"
                ? `${bmiNormalPct}%`
                : `${counts.totalPrograms}`;

            const gaugeLabel =
              gaugeMode === "tkji"
                ? counts.avgTkjiScore > 0
                  ? "Skor Rata-rata TKJI"
                  : "Tes TKJI Tercatat"
                : gaugeMode === "bmi"
                ? "Siswa IMT Normal"
                : "Program FITT Kelas XII";

            const gaugePct =
              gaugeMode === "tkji"
                ? counts.avgTkjiScore > 0
                  ? Math.min(100, Math.round((counts.avgTkjiScore / 25) * 100))
                  : physicalCoverageRate
                : gaugeMode === "bmi"
                ? bmiNormalPct
                : counts.totalSiswa > 0
                ? Math.min(
                    100,
                    Math.round(
                      (counts.totalPrograms / counts.totalSiswa) * 100
                    )
                  )
                : 0;

            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset =
              circumference - (Math.max(10, gaugePct) / 100) * circumference;

            return (
              <div className="relative flex flex-col items-center justify-center my-2 z-10">
                <div className="relative flex items-center justify-center">
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
                        gaugeMode === "bmi"
                          ? "gauge-circle-emerald"
                          : "gauge-circle-gold"
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                      {isLoading ? "—" : gaugeValue}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold opacity-65 mt-3 text-center">
                  {gaugeLabel}
                </span>
              </div>
            );
          })()}

          <div className="relative z-10">
            <div className="h-2.5 w-full rounded-full flex overflow-hidden mb-3 chart-track-pill">
              {counts.bmiStats.total > 0 && (
                <>
                  <div
                    className="h-full chart-fill-sky"
                    style={{
                      width: `${
                        (counts.bmiStats.kurang / counts.bmiStats.total) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full chart-fill-gold"
                    style={{
                      width: `${
                        (counts.bmiStats.normal / counts.bmiStats.total) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full chart-fill-terra"
                    style={{
                      width: `${
                        (counts.bmiStats.lebih / counts.bmiStats.total) * 100
                      }%`,
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-wider uppercase opacity-75 pt-2 border-t border-hairline">
              <span>{counts.bmiStats.kurang} Kurus</span>
              <span>{counts.bmiStats.normal} Normal</span>
              <span>{counts.bmiStats.lebih} Gemuk</span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 4: MATRIKS KURIKULUM (KIRI) & KESIAPAN SISTEM (KANAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12 relative z-10">
        <div className="lg:col-span-7 p-8 md:p-10 rounded-[2rem] flex flex-col justify-between gap-6 edufit-card-primary">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">
                  DISTRIBUSI JENJANG
                </div>
                <h3 className="text-3xl font-light tracking-tight">
                  Matriks Kurikulum & Aktivitas Kelas
                </h3>
                <p className="text-sm font-medium opacity-55 mt-1">
                  Perbandingan modul materi, rombel, capaian ujian, dan koreksi
                  refleksi per jenjang.
                </p>
              </div>
              {selectedGradeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter("all")}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer btn-forest-gold"
                >
                  Tampilkan Semua Kelas
                </button>
              )}
            </div>

            <div className="space-y-4">
              {visibleGradeRows.map((row) => {
                const gradeGain = row.avgPosttest - row.avgPretest;
                const refPct =
                  row.reflectionCount > 0
                    ? Math.round(
                        (row.gradedReflectionCount / row.reflectionCount) * 100
                      )
                    : 0;
                const gradeMaterials = materialsList.filter(
                  (m) => Number(m.grade_level) === row.grade
                );

                return (
                  <div key={row.grade} className="space-y-3">
                    <div className="p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-4 items-center transition-colors edufit-surface-subtle">
                      <div className="sm:col-span-4 flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 telemetry-bar-forest">
                          <span className="text-[9px] uppercase leading-none opacity-75">
                            Kelas
                          </span>
                          <span className="text-base font-mono leading-tight text-gold-accent">
                            {row.grade}
                          </span>
                        </div>
                        <div>
                          <p className="text-base font-bold">
                            {row.materialCount} Unit Materi
                          </p>
                          <p className="text-xs opacity-60 font-mono">
                            {row.classCount} Rombel · {row.evalCount} Ujian
                          </p>
                        </div>
                      </div>

                      <div className="sm:col-span-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold font-mono">
                          <span className="opacity-75">
                            PRE {row.avgPretest}% → POST {row.avgPosttest}%
                          </span>
                          <span className="text-gold-accent">
                            {gradeGain >= 0 ? `+${gradeGain}%` : `${gradeGain}%`}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full overflow-hidden flex chart-track-pill">
                          <div
                            className="h-full transition-all duration-500 chart-fill-emerald"
                            style={{
                              width: `${Math.min(100, row.avgPretest)}%`,
                            }}
                          />
                          <div
                            className="h-full transition-all duration-500 chart-fill-gold"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100 - row.avgPretest,
                                  row.avgPosttest - row.avgPretest
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold font-mono">
                            {row.gradedReflectionCount}/{row.reflectionCount}{" "}
                            Tugas
                          </p>
                          <p className="text-[11px] opacity-60">
                            Dinilai: {refPct}%
                          </p>
                        </div>
                        <Link
                          href="/admin/materi"
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-105 edufit-card-primary"
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </div>

                    {selectedGradeFilter !== "all" &&
                      gradeMaterials.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {gradeMaterials.map((gm, gIdx) => (
                            <Link
                              key={gm.id}
                              href="/admin/materi"
                              className="p-4 rounded-2xl flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5 edufit-card-primary"
                            >
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-50 block">
                                  UNIT {gIdx + 1} · KELAS {row.grade}
                                </span>
                                <p className="text-sm font-bold truncate mt-0.5">
                                  {gm.unit_name}
                                </p>
                              </div>
                              <ArrowUpRight
                                size={16}
                                className="opacity-50 shrink-0"
                              />
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-widest opacity-55">
              Distribusi Nilai Refleksi ({counts.gradedReflections}/
              {counts.totalReflections}):
            </span>
            <div className="flex flex-wrap items-center gap-2 font-mono">
              {[
                {
                  label: "A (100)",
                  val: counts.gradeACount,
                  cls: "badge-tint-emerald",
                },
                {
                  label: "B (75)",
                  val: counts.gradeBCount,
                  cls: "badge-tint-sky",
                },
                {
                  label: "C (50)",
                  val: counts.gradeCCount,
                  cls: "badge-tint-amber",
                },
                {
                  label: "D (25)",
                  val: counts.gradeDCount,
                  cls: "badge-tint-rose",
                },
              ].map((g) => (
                <span
                  key={g.label}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${g.cls}`}
                >
                  {g.label}: {g.val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* KANAN: KESIAPAN SISTEM */}
        <div className="lg:col-span-5 p-8 md:p-10 rounded-[2rem] flex flex-col justify-between gap-6 edufit-card-secondary">
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">
              KELENGKAPAN MODUL
            </div>
            <div className="flex items-baseline justify-between mb-4">
              <button
                type="button"
                onClick={() => setRightPanelTab("checklist")}
                className="text-3xl font-light tracking-tight text-left cursor-pointer hover:opacity-80"
              >
                Kesiapan Sistem
              </button>
              <span className="text-5xl font-light font-mono tracking-tighter text-gold-accent">
                {isLoading ? "—" : `${ecosystemReadinessPct}%`}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold font-mono uppercase tracking-widest opacity-60 mb-2">
              <span>{counts.totalMaterials} Materi</span>
              <span>{counts.totalEvaluations} Ujian</span>
              <span>{counts.totalVideos} Video</span>
            </div>

            <div className="flex items-center gap-2 h-11">
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab(
                    rightPanelTab === "materi" ? "checklist" : "materi"
                  )
                }
                style={{ width: `${materiFlex}%` }}
                className="h-full rounded-xl flex items-center justify-center px-3 text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer btn-forest-gold"
              >
                Materi
              </button>
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab(
                    rightPanelTab === "ujian" ? "checklist" : "ujian"
                  )
                }
                style={{ width: `${ujianFlex}%` }}
                className="h-full rounded-xl flex items-center justify-center px-3 text-xs font-semibold transition-transform hover:scale-[1.02] cursor-pointer telemetry-bar-forest"
              >
                Ujian
              </button>
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab(
                    rightPanelTab === "media" ? "checklist" : "media"
                  )
                }
                style={{ width: `${mediaFlex}%` }}
                className="h-full rounded-xl flex items-center justify-center px-3 text-xs font-semibold transition-transform hover:scale-[1.02] cursor-pointer btn-forest-emerald"
              >
                Media
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-[1.75rem] p-6 flex flex-col justify-between edufit-panel-forest">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium">
                {rightPanelTab === "checklist" && "Status Modul Utama"}
                {rightPanelTab === "materi" && "Daftar Unit Materi"}
                {rightPanelTab === "ujian" && "Paket Pretest & Posttest"}
                {rightPanelTab === "media" && "Video Demonstrasi Praktik"}
              </h4>
              {rightPanelTab === "checklist" ? (
                <span className="text-xl font-light font-mono text-gold-accent">
                  {completedTaskCount}/{ecosystemTasks.length}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setRightPanelTab("checklist")}
                  className="text-xs font-bold hover:underline cursor-pointer text-gold-accent"
                >
                  Kembali
                </button>
              )}
            </div>

            <div className="space-y-3 my-auto max-h-[260px] overflow-y-auto no-scrollbar">
              {rightPanelTab === "checklist" &&
                ecosystemTasks.map((task, idx) => {
                  const IconList = [
                    Building2,
                    Users,
                    BookOpen,
                    FileCheck2,
                    Activity,
                  ];
                  const TaskIcon = IconList[idx % IconList.length];
                  return (
                    <Link
                      key={task.id}
                      href={task.href}
                      className="flex items-center justify-between gap-3 group py-1"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            task.done
                              ? "bg-white/10 text-gold-accent"
                              : "bg-white text-ink-dark"
                          }`}
                        >
                          <TaskIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-white group-hover:text-gold-accent transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs truncate text-white/60">
                            {task.subtitle}
                          </p>
                        </div>
                      </div>
                      {task.done ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 btn-forest-gold">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/20 shrink-0" />
                      )}
                    </Link>
                  );
                })}

              {rightPanelTab === "materi" &&
                materialsList.map((mat) => (
                  <Link
                    key={mat.id}
                    href="/admin/materi"
                    className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {mat.unit_name}
                      </p>
                      <p className="text-xs text-white/60 font-mono">
                        Kurikulum Kelas {mat.grade_level}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={15}
                      className="text-gold-accent shrink-0"
                    />
                  </Link>
                ))}

              {rightPanelTab === "ujian" &&
                evaluationsList.map((ev) => (
                  <Link
                    key={ev.id}
                    href="/admin/evaluasi"
                    className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {ev.title}
                      </p>
                      <p className="text-xs text-white/60 uppercase font-mono">
                        Kelas {ev.grade_level} · {ev.type}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={15}
                      className="text-gold-accent shrink-0"
                    />
                  </Link>
                ))}

              {rightPanelTab === "media" &&
                videosList.map((vid) => (
                  <Link
                    key={vid.id}
                    href="/admin/praktik"
                    className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {vid.title}
                      </p>
                      <p className="text-xs text-white/60 font-mono">
                        {vid.category} · {vid.duration_label}
                      </p>
                    </div>
                    <Play size={14} className="text-gold-accent shrink-0" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 5: GRID KARTU SEKOLAH MITRA & TUJUAN PEMBELAJARAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => setBottomShowcaseTab("schools")}
            className={`text-2xl font-light tracking-tight transition-opacity cursor-pointer ${
              bottomShowcaseTab === "schools"
                ? "opacity-100 font-semibold underline decoration-gold-accent decoration-2 underline-offset-8"
                : "opacity-45 hover:opacity-80"
            }`}
          >
            Daftar Sekolah Mitra ({schoolsList.length})
          </button>
          <button
            type="button"
            onClick={() => setBottomShowcaseTab("tp")}
            className={`text-2xl font-light tracking-tight transition-opacity cursor-pointer ${
              bottomShowcaseTab === "tp"
                ? "opacity-100 font-semibold underline decoration-gold-accent decoration-2 underline-offset-8"
                : "opacity-45 hover:opacity-80"
            }`}
          >
            Capaian Tujuan Pembelajaran ({tpBars.length})
          </button>
        </div>

        <Link
          href={
            bottomShowcaseTab === "schools"
              ? "/admin/institusi"
              : "/admin/evaluasi"
          }
          className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md btn-forest-gold"
        >
          <Layers size={15} strokeWidth={2.2} />
          {bottomShowcaseTab === "schools"
            ? "Kelola Institusi & Guru"
            : "Kelola Bank Soal"}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {bottomShowcaseTab === "schools"
          ? schoolsList.map((sch, index) => {
              const showcaseClass =
                BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
              const isSelected = selectedSchoolId === sch.id;

              return (
                <div
                  key={sch.id}
                  onClick={() => {
                    const nextId = isSelected ? "all" : sch.id;
                    setSelectedSchoolId(nextId);
                    triggerDynamicIsland(
                      nextId === "all"
                        ? "Filter Sekolah Direset"
                        : `Filter Aktif: ${sch.name}`,
                      nextId === "all"
                        ? "Menampilkan seluruh institusi mitra."
                        : `${sch.classCount} Rombel · ${sch.guruCount} Guru · ${sch.siswaCount} Siswa`,
                      "info"
                    );
                  }}
                  className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass} ${
                    isSelected ? "bento-showcase-selected" : ""
                  }`}
                >
                  <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-75">
                      {sch.school_type} · {sch.classCount} ROMBEL KELAS
                    </span>
                    <Link
                      href="/admin/institusi"
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <ArrowUpRight size={18} strokeWidth={1.75} />
                    </Link>
                  </div>

                  <div className="my-6 relative z-10">
                    <div className="text-4xl font-light tracking-tighter leading-tight mb-2">
                      {sch.name}
                    </div>
                    <p className="text-xs font-medium opacity-65 truncate">
                      {sch.address}
                    </p>
                  </div>

                  <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                        Guru PJOK
                      </div>
                      <div className="text-3xl font-light font-mono leading-none">
                        {sch.guruCount}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                        Partisipasi Siswa
                      </div>
                      <div className="text-3xl font-light font-mono leading-none">
                        {sch.siswaCount} Siswa
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          : tpBars.map((tp, index) => {
              const showcaseClass =
                BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
              return (
                <div
                  key={tp.code}
                  className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group ${showcaseClass}`}
                >
                  <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-75">
                      TUJUAN PEMBELAJARAN · {tp.code}
                    </span>
                    <Link
                      href="/admin/evaluasi"
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <ArrowUpRight size={18} strokeWidth={1.75} />
                    </Link>
                  </div>

                  <div className="my-6 relative z-10">
                    <div className="text-3xl md:text-4xl font-light tracking-tighter leading-tight">
                      {tp.title}
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                        Pretest Awal
                      </div>
                      <div className="text-3xl font-light font-mono leading-none">
                        {tp.pre}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                        Posttest Akhir
                      </div>
                      <div className="text-4xl font-light font-mono leading-none text-gold-accent">
                        {tp.post}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}