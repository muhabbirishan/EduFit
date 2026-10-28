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
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Eye,
  Film,
  MessageSquare,
  Play,
  Save,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const GRADE_OPTIONS = [
  { grade: "A", score: 100, label: "Sangat Baik" },
  { grade: "B", score: 75, label: "Baik" },
  { grade: "C", score: 50, label: "Cukup" },
  { grade: "D", score: 25, label: "Perlu Bimbingan" },
];

const BENTO_SHOWCASE_CLASSES = [
  "bento-showcase-0",
  "bento-showcase-1",
  "bento-showcase-2",
  "bento-showcase-3",
];

function formatHumanLabel(raw?: string | null): string {
  if (!raw) return "-";
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface MaterialUnit {
  id: string;
  grade_level: number;
  unit_name: string;
  trigger_question: string;
  content_text?: string;
  media_url?: string;
  image_url?: string;
  content_blocks?: any[];
  order_index: number;
}

interface PracticeVideoItem {
  id: string;
  category: string;
  title: string;
  video_url: string;
  duration_label: string;
  technique_steps: string;
  common_mistakes: string;
}

interface UnitEvaluationState {
  materialId: string;
  unitName: string;
  answer: string;
  feedback: string;
  practiceNote: string;
  grade: string;
  score: number | null;
  progressStatus: string;
  completedAt: string | null;
  hasStudentAnswer: boolean;
  isGraded: boolean;
}

interface StudentPracticeRow {
  id: string;
  name: string;
  answeredCount: number;
  gradedCount: number;
  practiceCount: number;
  completedModuleCount: number;
  avgScore: number;
  dominantGrade: string;
  status: "graded" | "submitted" | "empty";
  unitStates: Record<string, UnitEvaluationState>;
}

interface IslandNotification {
  id: number;
  message: string;
  subtitle?: string;
  type: "success" | "error" | "info";
}

export default function PraktikGuruPage() {
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
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "submitted" | "graded" | "empty"
  >("all");
  const [gaugeMode, setGaugeMode] = useState<"koreksi" | "nilai" | "praktik">(
    "koreksi"
  );
  const [selectedUnitBar, setSelectedUnitBar] = useState<string | null>(null);

  const [materials, setMaterials] = useState<MaterialUnit[]>([]);
  const [practiceVideos, setPracticeVideos] = useState<PracticeVideoItem[]>([]);
  const [rawStudents, setRawStudents] = useState<any[]>([]);
  const [rawReflections, setRawReflections] = useState<any[]>([]);
  const [rawProgress, setRawProgress] = useState<any[]>([]);
  const [rawPractices, setRawPractices] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const [selectedStudent, setSelectedStudent] =
    useState<StudentPracticeRow | null>(null);
  const [evalData, setEvalData] = useState<
    Record<string, UnitEvaluationState>
  >({});
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(
    null
  );
  const [isVideoGuideModalOpen, setIsVideoGuideModalOpen] = useState(false);
  const [savingUnit, setSavingUnit] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

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
    async function fetchClassesAndVideos() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const [clsRes, vidRes] = await Promise.all([
          supabase
            .from("classes")
            .select("id, name, grade_level, class_code")
            .eq("guru_id", session.user.id)
            .order("grade_level", { ascending: true })
            .order("created_at", { ascending: false }),
          supabase
            .from("master_practice_videos")
            .select("*")
            .order("category", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);

        if (clsRes.error) throw clsRes.error;

        setPracticeVideos(vidRes.data || []);

        if (clsRes.data && clsRes.data.length > 0) {
          setClasses(clsRes.data);
          setSelectedClass(clsRes.data[0]);
        } else {
          setClasses([]);
        }
      } catch {
        toast.error("Gagal memuat daftar kelas");
      } finally {
        setIsLoading(false);
      }
    }
    fetchClassesAndVideos();
  }, []);

  const filteredClassesList = useMemo(() => {
    if (gradeFilter === "all") return classes;
    return classes.filter((c) => Number(c.grade_level) === gradeFilter);
  }, [classes, gradeFilter]);

  const handleGradeFilterChange = (g: number | "all") => {
    setGradeFilter(g);
    const nextList =
      g === "all"
        ? classes
        : classes.filter((c) => Number(c.grade_level) === g);
    if (
      nextList.length > 0 &&
      (!selectedClass ||
        (g !== "all" && Number(selectedClass.grade_level) !== g))
    ) {
      setSelectedClass(nextList[0]);
    }
  };

  const fetchClassPracticeEcosystem = async (cls: any) => {
    if (!cls?.id) return;
    setIsLoading(true);
    try {
      const [stdRes, matRes] = await Promise.all([
        supabase
          .from("student_classes")
          .select("student_id, user_profiles(full_name)")
          .eq("class_id", cls.id),
        supabase
          .from("master_materials")
          .select(
            "id, grade_level, unit_name, trigger_question, content_text, media_url, image_url, content_blocks, order_index"
          )
          .eq("grade_level", cls.grade_level)
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (stdRes.error) throw stdRes.error;
      if (matRes.error) throw matRes.error;

      const stdList = stdRes.data || [];
      const matList = matRes.data || [];
      setRawStudents(stdList);
      setMaterials(matList);

      const studentIds = stdList.map((s: any) => s.student_id).filter(Boolean);

      if (studentIds.length === 0) {
        setRawReflections([]);
        setRawProgress([]);
        setRawPractices([]);
        return;
      }

      const [refRes, progRes, pracRes] = await Promise.all([
        supabase
          .from("student_reflections")
          .select(
            "id, student_id, material_id, unit_name, answer_text, feedback_text, grade, score, updated_at"
          )
          .in("student_id", studentIds)
          .order("updated_at", { ascending: false }),
        supabase
          .from("student_material_progress")
          .select(
            "id, student_id, material_id, status, student_reflection, teacher_feedback, completed_at"
          )
          .in("student_id", studentIds),
        supabase
          .from("optional_practices")
          .select("id, student_id, unit_name, teacher_note, score, created_at")
          .in("student_id", studentIds),
      ]);

      setRawReflections(refRes.data || []);
      setRawProgress(progRes.data || []);
      setRawPractices(pracRes.data || []);
      setSelectedUnitBar(null);
      setLastSyncTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error: any) {
      toast.error("Gagal memuat ekosistem materi", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass?.id) {
      fetchClassPracticeEcosystem(selectedClass);
    }
  }, [selectedClass]);

  const studentsData: StudentPracticeRow[] = useMemo(() => {
    return rawStudents
      .map((sc: any) => {
        const studentId = sc.student_id;
        const studentName =
          sc.user_profiles?.full_name || "Siswa Tidak Diketahui";

        const myRefs = rawReflections.filter((r) => r.student_id === studentId);
        const myProgs = rawProgress.filter((p) => p.student_id === studentId);
        const myPracs = rawPractices.filter((p) => p.student_id === studentId);

        const unitStates: Record<string, UnitEvaluationState> = {};
        let answeredCount = 0;
        let gradedCount = 0;
        let practiceCount = 0;
        let completedModuleCount = 0;
        let scoreSum = 0;

        materials.forEach((mat) => {
          const refMatch = myRefs.find(
            (r) =>
              (r.material_id && r.material_id === mat.id) ||
              (r.unit_name || "").trim().toLowerCase() ===
                (mat.unit_name || "").trim().toLowerCase()
          );

          const progMatch = myProgs.find((p) => p.material_id === mat.id);
          const pracMatch = myPracs.find(
            (p) =>
              (p.unit_name || "").trim().toLowerCase() ===
              (mat.unit_name || "").trim().toLowerCase()
          );

          const rawAnswer =
            refMatch?.answer_text || progMatch?.student_reflection || "";
          const isAutoPlaceholder = rawAnswer === "Dinilai langsung oleh Guru";

          const feedback =
            refMatch?.feedback_text || progMatch?.teacher_feedback || "";
          const practiceNote = pracMatch?.teacher_note || "";

          const rawScore =
            refMatch?.score !== null && refMatch?.score !== undefined
              ? Number(refMatch.score)
              : pracMatch?.score !== null && pracMatch?.score !== undefined
              ? Number(pracMatch.score)
              : null;

          let grade = (refMatch?.grade || "").trim().toUpperCase();
          if (!grade && rawScore !== null) {
            if (rawScore >= 90) grade = "A";
            else if (rawScore >= 75) grade = "B";
            else if (rawScore >= 50) grade = "C";
            else grade = "D";
          }

          const progressStatus = String(
            progMatch?.status || "Belum Dimulai"
          ).trim();
          if (progressStatus.toLowerCase() === "selesai") {
            completedModuleCount++;
          }

          const hasStudentAnswer =
            Boolean(rawAnswer && rawAnswer.trim() !== "") && !isAutoPlaceholder;
          const isGraded = Boolean(grade || rawScore !== null);

          if (hasStudentAnswer) answeredCount++;
          if (isGraded) {
            gradedCount++;
            scoreSum +=
              rawScore !== null
                ? rawScore
                : grade === "A"
                ? 100
                : grade === "B"
                ? 75
                : grade === "C"
                ? 50
                : 25;
          }
          if (practiceNote.trim() !== "") practiceCount++;

          unitStates[mat.unit_name] = {
            materialId: mat.id,
            unitName: mat.unit_name,
            answer: rawAnswer,
            feedback,
            practiceNote,
            grade,
            score: rawScore,
            progressStatus,
            completedAt: progMatch?.completed_at || null,
            hasStudentAnswer,
            isGraded,
          };
        });

        const avgScore =
          gradedCount > 0 ? Math.round(scoreSum / gradedCount) : 0;
        const dominantGrade =
          gradedCount === 0
            ? "—"
            : avgScore >= 88
            ? "A"
            : avgScore >= 70
            ? "B"
            : avgScore >= 50
            ? "C"
            : "D";

        const status: "graded" | "submitted" | "empty" =
          gradedCount > 0 && gradedCount >= Math.max(1, answeredCount)
            ? "graded"
            : answeredCount > 0 || gradedCount > 0
            ? "submitted"
            : "empty";

        return {
          id: studentId,
          name: studentName,
          answeredCount,
          gradedCount,
          practiceCount,
          completedModuleCount,
          avgScore,
          dominantGrade,
          status,
          unitStates,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawStudents, rawReflections, rawProgress, rawPractices, materials]);

  const stats = useMemo(() => {
    const totalSiswa = studentsData.length;
    const totalUnits = materials.length;
    const totalTargetCells = Math.max(1, totalSiswa * totalUnits);

    let totalAnsweredCells = 0;
    let totalGradedCells = 0;
    let totalPracticeNotes = 0;
    let sumAllGradedScores = 0;

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };

    studentsData.forEach((s) => {
      totalAnsweredCells += s.answeredCount;
      totalGradedCells += s.gradedCount;
      totalPracticeNotes += s.practiceCount;

      Object.values(s.unitStates).forEach((u) => {
        if (u.isGraded) {
          const sc =
            u.score !== null
              ? u.score
              : u.grade === "A"
              ? 100
              : u.grade === "B"
              ? 75
              : u.grade === "C"
              ? 50
              : 25;
          sumAllGradedScores += sc;
          if (u.grade === "A") gradeCounts.A++;
          else if (u.grade === "B") gradeCounts.B++;
          else if (u.grade === "C") gradeCounts.C++;
          else if (u.grade === "D") gradeCounts.D++;
        }
      });
    });

    const answeredStudentsCount = studentsData.filter(
      (s) => s.answeredCount > 0 || s.gradedCount > 0
    ).length;
    const pendingStudentsCount = studentsData.filter(
      (s) => s.status === "submitted"
    ).length;
    const gradedStudentsCount = studentsData.filter(
      (s) => s.status === "graded"
    ).length;
    const emptyStudentsCount = studentsData.filter(
      (s) => s.status === "empty"
    ).length;

    const answerCoveragePct =
      totalSiswa > 0 && totalUnits > 0
        ? Math.min(
            100,
            Math.round((totalAnsweredCells / totalTargetCells) * 100)
          )
        : 0;

    const activeSubmissionCells = Math.max(
      totalAnsweredCells,
      totalGradedCells
    );
    const gradedRatePct =
      activeSubmissionCells > 0
        ? Math.min(
            100,
            Math.round((totalGradedCells / activeSubmissionCells) * 100)
          )
        : 0;

    const avgClassScore =
      totalGradedCells > 0
        ? Math.round(sumAllGradedScores / totalGradedCells)
        : 0;

    const practiceCoveragePct =
      totalSiswa > 0 && totalUnits > 0
        ? Math.min(
            100,
            Math.round((totalPracticeNotes / totalTargetCells) * 100)
          )
        : 0;

    const unitBars = materials.map((mat, idx) => {
      let unitGraded = 0;
      let unitAnswered = 0;
      let unitScoreSum = 0;

      studentsData.forEach((s) => {
        const st = s.unitStates[mat.unit_name];
        if (st?.hasStudentAnswer) unitAnswered++;
        if (st?.isGraded) {
          unitGraded++;
          unitScoreSum +=
            st.score !== null
              ? st.score
              : st.grade === "A"
              ? 100
              : st.grade === "B"
              ? 75
              : st.grade === "C"
              ? 50
              : 25;
        }
      });

      const avgUnitScore =
        unitGraded > 0 ? Math.round(unitScoreSum / unitGraded) : 0;
      const participationPct =
        totalSiswa > 0
          ? Math.round(
              (Math.max(unitAnswered, unitGraded) / totalSiswa) * 100
            )
          : 0;

      return {
        code: `U-${idx + 1}`,
        unitName: mat.unit_name,
        avgScore: avgUnitScore,
        participationPct,
        displayPct: avgUnitScore > 0 ? avgUnitScore : participationPct,
        answered: unitAnswered,
        graded: unitGraded,
      };
    });

    return {
      totalSiswa,
      totalAnsweredCells,
      totalGradedCells,
      answeredStudentsCount,
      pendingStudentsCount,
      gradedStudentsCount,
      emptyStudentsCount,
      answerCoveragePct,
      gradedRatePct,
      avgClassScore,
      practiceCoveragePct,
      gradeCounts,
      unitBars,
    };
  }, [studentsData, materials]);

  const openEvaluation = (student: StudentPracticeRow) => {
    setSelectedStudent(student);
    setExpandedMaterialId(null);
    const clonedStates: Record<string, UnitEvaluationState> = {};
    materials.forEach((mat) => {
      const existing = student.unitStates[mat.unit_name];
      clonedStates[mat.unit_name] = existing
        ? { ...existing }
        : {
            materialId: mat.id,
            unitName: mat.unit_name,
            answer: "",
            feedback: "",
            practiceNote: "",
            grade: "",
            score: null,
            progressStatus: "Belum Dimulai",
            completedAt: null,
            hasStudentAnswer: false,
            isGraded: false,
          };
    });
    setEvalData(clonedStates);
  };

  const handleGradeSelect = (
    unitName: string,
    grade: string,
    score: number
  ) => {
    setEvalData((prev) => ({
      ...prev,
      [unitName]: {
        ...prev[unitName],
        grade,
        score,
        isGraded: true,
      },
    }));
  };

  const handleFeedbackChange = (unitName: string, text: string) => {
    setEvalData((prev) => ({
      ...prev,
      [unitName]: { ...prev[unitName], feedback: text },
    }));
  };

  const handlePracticeNoteChange = (unitName: string, text: string) => {
    setEvalData((prev) => ({
      ...prev,
      [unitName]: { ...prev[unitName], practiceNote: text },
    }));
  };

  const persistUnitEvaluation = async (
    studentId: string,
    mat: MaterialUnit,
    data: UnitEvaluationState
  ) => {
    const nowIso = new Date().toISOString();

    const { data: existingRef, error: findRefErr } = await supabase
      .from("student_reflections")
      .select("id")
      .eq("student_id", studentId)
      .or(`material_id.eq.${mat.id},unit_name.eq."${mat.unit_name}"`)
      .limit(1)
      .maybeSingle();

    if (findRefErr) throw findRefErr;

    if (existingRef?.id) {
      const { error: updErr } = await supabase
        .from("student_reflections")
        .update({
          material_id: mat.id,
          unit_name: mat.unit_name,
          feedback_text: data.feedback,
          grade: data.grade || null,
          score: data.score,
          updated_at: nowIso,
        })
        .eq("id", existingRef.id);
      if (updErr) throw updErr;
    } else if (data.grade || data.score !== null || data.feedback.trim()) {
      const { error: insErr } = await supabase
        .from("student_reflections")
        .insert({
          student_id: studentId,
          material_id: mat.id,
          unit_name: mat.unit_name,
          answer_text: data.answer || "Dinilai langsung oleh Guru",
          feedback_text: data.feedback,
          grade: data.grade || null,
          score: data.score,
        });
      if (insErr) throw insErr;
    }

    const { data: existingProg } = await supabase
      .from("student_material_progress")
      .select("id")
      .eq("student_id", studentId)
      .eq("material_id", mat.id)
      .limit(1)
      .maybeSingle();

    if (existingProg?.id) {
      await supabase
        .from("student_material_progress")
        .update({
          teacher_feedback: data.feedback,
          status: "Selesai",
          completed_at: data.completedAt || nowIso,
        })
        .eq("id", existingProg.id);
    } else if (data.grade || data.score !== null || data.feedback.trim()) {
      await supabase.from("student_material_progress").insert({
        student_id: studentId,
        material_id: mat.id,
        status: "Selesai",
        student_reflection: data.answer || "Dinilai langsung oleh Guru",
        teacher_feedback: data.feedback,
        completed_at: nowIso,
      });
    }

    const { data: existingPrac } = await supabase
      .from("optional_practices")
      .select("id")
      .eq("student_id", studentId)
      .eq("unit_name", mat.unit_name)
      .limit(1)
      .maybeSingle();

    if (existingPrac?.id) {
      await supabase
        .from("optional_practices")
        .update({
          teacher_note: data.practiceNote,
          score: data.score,
        })
        .eq("id", existingPrac.id);
    } else if (data.practiceNote && data.practiceNote.trim() !== "") {
      await supabase.from("optional_practices").insert({
        student_id: studentId,
        unit_name: mat.unit_name,
        teacher_note: data.practiceNote,
        score: data.score,
      });
    }
  };

  const handleSaveSingleUnit = async (mat: MaterialUnit) => {
    if (!selectedStudent) return;
    const data = evalData[mat.unit_name];
    if (!data) return;

    setSavingUnit(mat.unit_name);
    try {
      await persistUnitEvaluation(selectedStudent.id, mat, data);
      triggerDynamicIsland(
        `Evaluasi Unit Tersimpan`,
        `${mat.unit_name} (${
          data.grade ? `Predikat ${data.grade}` : "Tersimpan"
        }) — ${selectedStudent.name}`,
        "success"
      );
      await fetchClassPracticeEcosystem(selectedClass);
    } catch (err: any) {
      toast.error("Gagal menyimpan evaluasi unit", {
        description: err.message,
      });
    } finally {
      setSavingUnit(null);
    }
  };

  const handleSaveAllUnits = async () => {
    if (!selectedStudent) return;
    setIsSavingAll(true);
    try {
      for (const mat of materials) {
        const data = evalData[mat.unit_name];
        if (
          data &&
          (data.grade ||
            data.score !== null ||
            data.feedback.trim() !== "" ||
            data.practiceNote.trim() !== "")
        ) {
          await persistUnitEvaluation(selectedStudent.id, mat, data);
        }
      }
      triggerDynamicIsland(
        `Seluruh Unit Tersimpan`,
        `Evaluasi materi & praktik untuk ${selectedStudent.name} selesai diperbarui.`,
        "success"
      );
      await fetchClassPracticeEcosystem(selectedClass);
      setSelectedStudent(null);
    } catch (err: any) {
      toast.error("Gagal menyimpan evaluasi", { description: err.message });
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleExportCSV = () => {
    if (studentsData.length === 0) {
      toast.error("Tidak ada data siswa untuk diekspor");
      return;
    }
    const unitHeaders = materials.map(
      (m, i) => `Unit ${i + 1} (${m.unit_name})`
    );
    const headers = [
      "Nama Siswa",
      "Kelas",
      "Unit Dijawab",
      "Unit Dinilai",
      "Progres Modul Selesai",
      "Rata-rata Skor",
      "Predikat Dominan",
      ...unitHeaders,
    ];

    const rows = studentsData.map((s) => {
      const unitCols = materials.map((m) => {
        const st = s.unitStates[m.unit_name];
        return st?.isGraded
          ? `${st.grade} (${st.score ?? 0})`
          : st?.hasStudentAnswer
          ? "Menunggu Koreksi"
          : "Belum Menjawab";
      });
      return [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${selectedClass?.name || "-"}"`,
        `${s.answeredCount}/${materials.length}`,
        `${s.gradedCount}/${materials.length}`,
        `${s.completedModuleCount}/${materials.length}`,
        s.avgScore,
        s.dominantGrade,
        ...unitCols.map((c) => `"${c}"`),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Evaluasi_Materi_${selectedClass?.name || "Kelas"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Rekap Evaluasi Materi Diunduh",
      `Laporan CSV kelas ${selectedClass?.name || ""} berhasil diekspor.`,
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
      if (statusFilter === "empty") return row.status === "empty";
      return true;
    });
  }, [studentsData, searchQuery, statusFilter]);

  if (!mounted) return null;

  const highestUnitBar = stats.unitBars.reduce(
    (max, item) => (item.displayPct > max.displayPct ? item : max),
    stats.unitBars[0] || {
      code: "U-1",
      unitName: "",
      avgScore: 0,
      participationPct: 0,
      displayPct: 0,
    }
  );

  const activeUnitBarObj = selectedUnitBar
    ? stats.unitBars.find((u) => u.code === selectedUnitBar)
    : null;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const activeGaugePct =
    gaugeMode === "koreksi"
      ? stats.gradedRatePct
      : gaugeMode === "nilai"
      ? stats.avgClassScore
      : stats.practiceCoveragePct;
  const dashOffset =
    activeGaugePct <= 0
      ? circumference
      : circumference - (activeGaugePct / 100) * circumference;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
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

      {/* ZONA 1: HERO HEADER & 3 ANGKA UTAMA (BEBAS 01/ 02/) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="text-gold-accent">
              Koreksi Pemantik & Jurnal Praktik
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Activity size={15} />
              {selectedClass
                ? `${selectedClass.name} (Kelas ${
                    selectedClass.grade_level
                  }) · Sinkron ${lastSyncTime || "Aktif"}`
                : "Evaluasi Pemantik Materi & Praktik Lapangan"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Evaluasi <br />
            <span className="font-semibold">Materi & Praktik</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : stats.totalSiswa}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Siswa Terdaftar
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent">
              {isLoading ? "—" : stats.answeredStudentsCount}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Siswa Mengumpulkan
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : `${stats.avgClassScore}%`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Rata-Rata Nilai
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 2: TELEMETRI 4 BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Partisipasi Pemantik</span>
            <span className="font-mono">
              {stats.totalAnsweredCells} TERKUMPUL
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${stats.answerCoveragePct}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Cakupan
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Indeks Nilai Modul</span>
            <span className="font-mono">SKALA A–D</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${stats.avgClassScore}%`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {stats.totalGradedCells} UNIT SELESAI
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Progres Koreksi Guru</span>
            <span className="font-mono">
              {stats.gradedStudentsCount}/{stats.totalSiswa} SISWA TUNTAS
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${stats.gradedRatePct}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              {stats.pendingStudentsCount > 0
                ? `${stats.pendingStudentsCount} Perlu Koreksi`
                : "Terkoreksi"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsVideoGuideModalOpen(true)}
          className="sm:col-span-2 lg:col-span-2 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Video Praktik</span>
            <span className="font-mono">ACUAN</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-between transition-transform group-hover:scale-[1.02] edufit-card-primary">
            <span className="text-xl font-light font-mono tracking-tight text-gold-accent">
              {practiceVideos.length} Video
            </span>
            <Film size={16} className="opacity-60" />
          </div>
        </button>
      </div>

      {/* ZONA 3: TRIO BENTO UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* Bento 1: Kendali Rombel & Filter Angkatan */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              <SlidersHorizontal size={14} />
              <span>Filter Kelas</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Pilih Ruang Kelas
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Filter jenjang angkatan dan tentukan rombel yang akan dinilai.
            </p>

            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[
                { val: "all", label: "Semua" },
                { val: 10, label: "Kelas 10" },
                { val: 11, label: "Kelas 11" },
                { val: 12, label: "Kelas 12" },
              ].map((g) => {
                const active = gradeFilter === g.val;
                return (
                  <button
                    key={String(g.val)}
                    type="button"
                    onClick={() => handleGradeFilterChange(g.val as any)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full mb-6" ref={classDropdownRef}>
              <div
                onClick={() =>
                  filteredClassesList.length > 0 &&
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
                    {filteredClassesList.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsClassDropdownOpen(false);
                          triggerDynamicIsland(
                            `Kelas Aktif: ${cls.name}`,
                            `Memuat jawaban pemantik & jurnal praktik Kelas ${cls.grade_level}.`,
                            "info"
                          );
                        }}
                        className={`px-6 py-4 text-lg font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                          selectedClass?.id === cls.id ? "text-gold-accent" : ""
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
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md disabled:opacity-30 disabled:cursor-not-allowed relative z-10 btn-forest-emerald"
          >
            <Download size={16} strokeWidth={2.5} /> Ekspor Rekap Materi CSV
          </button>
        </div>

        {/* Bento 2: Capaian Unit Materi */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={15} />
              <span>Capaian Unit Materi</span>
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-gold-accent">
              KELAS {selectedClass?.grade_level || "—"}
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading
                ? "—"
                : activeUnitBarObj
                ? `${activeUnitBarObj.displayPct}%`
                : `${stats.avgClassScore || stats.answerCoveragePct}%`}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1 truncate max-w-[200px]">
              {activeUnitBarObj
                ? activeUnitBarObj.unitName
                : stats.avgClassScore > 0
                ? "Rata-Rata Nilai Unit"
                : "Partisipasi Modul"}
            </div>
          </div>

          <div
            className="grid gap-3 items-end pt-4 h-44 relative z-10"
            style={{
              gridTemplateColumns: `repeat(${Math.max(
                1,
                stats.unitBars.length
              )}, minmax(0, 1fr))`,
            }}
          >
            {stats.unitBars.length === 0 ? (
              <div className="col-span-full text-center text-xs opacity-50 py-10">
                Belum ada modul unit pada jenjang ini.
              </div>
            ) : (
              stats.unitBars.map((bar) => {
                const val = bar.displayPct;
                const heightPct = val <= 0 ? 4 : Math.max(12, val);
                const isHighest = bar.code === highestUnitBar.code && val > 0;
                const isSelected = selectedUnitBar === bar.code;
                const fillClass =
                  isSelected || isHighest
                    ? "chart-fill-gold"
                    : "chart-fill-primary";

                return (
                  <button
                    key={bar.code}
                    type="button"
                    onClick={() =>
                      setSelectedUnitBar(isSelected ? null : bar.code)
                    }
                    className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                    title={`${bar.unitName}: Nilai ${bar.avgScore}% · Diisi ${bar.answered} Siswa`}
                  >
                    <span className="text-xs font-bold font-mono opacity-80">
                      {val}%
                    </span>
                    <div className="w-4 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${fillClass}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                    <span className="text-[11px] font-bold font-mono opacity-65">
                      {bar.code}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bento 3: Distribusi Capaian (0% Murni & Teks di Bawah Lingkaran) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BookOpen size={15} />
              <span>Distribusi Capaian</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "koreksi", label: "Koreksi" },
                { key: "nilai", label: "Nilai" },
                { key: "praktik", label: "Praktik" },
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
                    className="transition-all duration-700 gauge-circle-gold"
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
                ? "Jawaban Pemantik Selesai Dinilai"
                : gaugeMode === "nilai"
                ? "Rata-Rata Skor Modul (A/B/C/D)"
                : "Catatan Praktik Lapangan Terisi"}
            </span>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-3 border-t border-hairline">
              <span>A: {stats.gradeCounts.A}</span>
              <span>—</span>
              <span>B: {stats.gradeCounts.B}</span>
              <span>—</span>
              <span>C: {stats.gradeCounts.C}</span>
              <span>—</span>
              <span>D: {stats.gradeCounts.D}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 4: TAB FILTER, SEARCH, & BENTO GRID SISWA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">
            Lembar Evaluasi Respon Siswa
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Daftar Evaluasi Siswa ({filteredData.length})
          </h3>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {[
              { key: "all", label: `Semua (${stats.totalSiswa})` },
              {
                key: "submitted",
                label: `Perlu Koreksi (${stats.pendingStudentsCount})`,
              },
              { key: "graded", label: `Tuntas (${stats.gradedStudentsCount})` },
              {
                key: "empty",
                label: `Belum Menjawab (${stats.emptyStudentsCount})`,
              },
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
              Belum ada kelas yang dibuka pada sistem.
            </div>
          </div>
        ) : isLoading ? (
          <div className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55 animate-pulse">
            <div className="text-xl font-light tracking-tight">
              Menarik jawaban pemantik & jurnal siswa...
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
            <div className="text-xl font-light tracking-tight">
              Tidak ada data siswa yang cocok dengan filter pencarian.
            </div>
          </div>
        ) : (
          filteredData.map((row, index) => {
            const isGraded = row.status === "graded";
            const isSubmitted = row.status === "submitted";
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];

            return (
              <div
                key={row.id}
                onClick={() => openEvaluation(row)}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass} ${
                  isSubmitted ? "bento-showcase-selected" : ""
                }`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                    KELAS {selectedClass?.grade_level} · {row.answeredCount}/
                    {materials.length} UNIT DIJAWAB
                  </span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 bg-black/5 dark:bg-white/5">
                    <ArrowUpRight size={18} strokeWidth={1.75} />
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-3 line-clamp-2">
                    {row.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {materials.map((mat, uIdx) => {
                      const st = row.unitStates[mat.unit_name];
                      return (
                        <span
                          key={mat.id}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono ${
                            st?.isGraded
                              ? "seg-btn-active"
                              : "bg-black/10 dark:bg-white/10"
                          }`}
                          title={mat.unit_name}
                        >
                          U{uIdx + 1}:{" "}
                          {st?.isGraded
                            ? st.grade
                            : st?.hasStudentAnswer
                            ? "ISI"
                            : "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Rata-Rata Nilai
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {row.gradedCount > 0
                        ? `${row.avgScore} (${row.dominantGrade})`
                        : "—"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Status Koreksi
                    </div>
                    {isGraded ? (
                      <div className="text-sm font-bold text-gold-accent">
                        Tuntas ({row.gradedCount}/{materials.length} Unit)
                      </div>
                    ) : isSubmitted ? (
                      <div className="text-sm font-bold px-2.5 py-0.5 rounded-md badge-tint-amber">
                        Perlu Dinilai ({row.gradedCount}/{materials.length})
                      </div>
                    ) : (
                      <div className="text-sm font-bold opacity-50">
                        Belum Menjawab
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL EVALUASI & PENILAIAN PER UNIT */}
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
              className="w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col rounded-[2rem] relative z-10 shadow-2xl edufit-card-primary"
            >
              <div className="p-6 sm:p-8 border-b border-hairline flex flex-wrap justify-between items-center gap-4 shrink-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gold-accent">
                      {selectedClass?.name} · Kelas {selectedClass?.grade_level}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider edufit-surface-subtle">
                      {materials.length} Unit Materi
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsVideoGuideModalOpen(true)}
                      className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer badge-tint-emerald"
                    >
                      <Film size={12} /> Panduan Video Teknik (
                      {practiceVideos.length})
                    </button>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                    Evaluasi:{" "}
                    <span className="font-semibold">
                      {selectedStudent.name}
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAllUnits}
                    disabled={isSavingAll}
                    className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer btn-forest-emerald"
                  >
                    <Save size={15} />
                    {isSavingAll ? "Menyimpan..." : "Simpan Semua Unit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">
                {materials.length === 0 ? (
                  <div className="p-16 text-center opacity-55">
                    <BookOpen className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-xl font-light">
                      Belum ada modul materi untuk Kelas{" "}
                      {selectedClass?.grade_level}.
                    </p>
                  </div>
                ) : (
                  materials.map((mat, idx) => {
                    const unitState = evalData[mat.unit_name] || {};
                    const currentGrade = unitState.grade || "";
                    const isContentOpen = expandedMaterialId === mat.id;

                    return (
                      <div
                        key={mat.id}
                        className={`rounded-[1.75rem] p-6 sm:p-8 transition-colors edufit-surface-subtle ${
                          currentGrade ? "bento-showcase-selected" : ""
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-5 border-b border-hairline">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-55">
                                Unit {idx + 1} · Kelas {mat.grade_level}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase edufit-card-primary">
                                Status Modul:{" "}
                                {unitState.progressStatus || "Belum Dimulai"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMaterialId(
                                    isContentOpen ? null : mat.id
                                  )
                                }
                                className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer badge-tint-amber"
                              >
                                <Eye size={11} />
                                {isContentOpen
                                  ? "Tutup Bacaan Materi"
                                  : "Lihat Bacaan Materi"}
                              </button>
                            </div>
                            <h3 className="text-2xl font-light tracking-tight">
                              {mat.unit_name}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-55 mr-1">
                              Predikat:
                            </span>
                            {GRADE_OPTIONS.map((opt) => {
                              const active = currentGrade === opt.grade;
                              return (
                                <button
                                  key={opt.grade}
                                  type="button"
                                  onClick={() =>
                                    handleGradeSelect(
                                      mat.unit_name,
                                      opt.grade,
                                      opt.score
                                    )
                                  }
                                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                                    active
                                      ? "seg-btn-active"
                                      : "edufit-card-primary"
                                  }`}
                                >
                                  {opt.grade} ({opt.score})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isContentOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-6 overflow-hidden"
                            >
                              <div className="p-5 rounded-2xl space-y-3 edufit-card-primary border border-hairline">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold-accent">
                                    Pratinjau Materi Bacaan Siswa
                                  </span>
                                  {mat.media_url && (
                                    <a
                                      href={mat.media_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] font-bold underline text-gold-accent"
                                    >
                                      Buka Tautan Media
                                    </a>
                                  )}
                                </div>
                                {mat.content_text && (
                                  <p className="text-xs leading-relaxed opacity-85 whitespace-pre-line">
                                    {mat.content_text}
                                  </p>
                                )}
                                {Array.isArray(mat.content_blocks) &&
                                  mat.content_blocks.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                      {mat.content_blocks.map(
                                        (blk: any, bIdx: number) => (
                                          <div
                                            key={bIdx}
                                            className="p-3 rounded-xl text-xs edufit-surface-subtle"
                                          >
                                            <span className="font-bold text-[10px] uppercase opacity-60 block mb-1">
                                              Bagian {bIdx + 1} ·{" "}
                                              {blk.title ||
                                                blk.type ||
                                                "Materi"}
                                            </span>
                                            <p className="leading-relaxed">
                                              {blk.content ||
                                                blk.text ||
                                                JSON.stringify(blk)}
                                            </p>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest opacity-65">
                              <span className="flex items-center gap-2">
                                <MessageSquare size={15} /> Pertanyaan & Jawaban
                                Pemantik
                              </span>
                              {unitState.hasStudentAnswer && (
                                <span className="text-gold-accent">Terisi</span>
                              )}
                            </div>

                            <div className="p-5 rounded-2xl min-h-[180px] flex flex-col justify-between edufit-card-primary">
                              <div>
                                <p className="text-xs font-semibold italic opacity-65 mb-3">
                                  &ldquo;
                                  {mat.trigger_question ||
                                    "Pertanyaan pemantik unit materi"}
                                  &rdquo;
                                </p>
                                <div className="w-full h-px border-b border-hairline mb-3" />
                                {unitState.answer &&
                                unitState.answer !==
                                  "Dinilai langsung oleh Guru" ? (
                                  <p className="text-sm font-medium leading-relaxed">
                                    {unitState.answer}
                                  </p>
                                ) : (
                                  <p className="text-sm italic opacity-45">
                                    Siswa belum mengirimkan jawaban pemantik
                                    pada unit ini.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-gold-accent mb-2">
                                <CheckCircle2 size={15} /> Umpan Balik Refleksi
                                Pemantik
                              </div>
                              <textarea
                                value={unitState.feedback || ""}
                                onChange={(e) =>
                                  handleFeedbackChange(
                                    mat.unit_name,
                                    e.target.value
                                  )
                                }
                                placeholder="Berikan koreksi atau catatan perkembangan materi siswa..."
                                className="w-full h-24 p-4 rounded-2xl text-sm focus:outline-none resize-none edufit-card-primary"
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-65 mb-2">
                                <ClipboardCheck size={15} /> Catatan Observasi
                                Praktik Lapangan
                              </div>
                              <input
                                type="text"
                                value={unitState.practiceNote || ""}
                                onChange={(e) =>
                                  handlePracticeNoteChange(
                                    mat.unit_name,
                                    e.target.value
                                  )
                                }
                                placeholder="Catatan pengamatan keterampilan gerak siswa di lapangan..."
                                className="w-full px-4 py-3.5 rounded-2xl text-sm focus:outline-none edufit-card-primary"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveSingleUnit(mat)}
                            disabled={savingUnit === mat.unit_name}
                            className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-90 cursor-pointer btn-forest-gold"
                          >
                            <Save size={16} />
                            {savingUnit === mat.unit_name
                              ? "Menyimpan..."
                              : "Simpan Unit Ini"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PANDUAN VIDEO TEKNIK PRAKTIK */}
      <AnimatePresence>
        {isVideoGuideModalOpen && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsVideoGuideModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.96, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 20, opacity: 0 }}
              className="w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col rounded-[2rem] relative z-10 shadow-2xl edufit-card-primary"
            >
              <div className="p-6 sm:p-8 border-b border-hairline flex items-center justify-between gap-4 shrink-0">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gold-accent block mb-1">
                    Standar Observasi Keterampilan Gerak
                  </span>
                  <h3 className="text-3xl font-light tracking-tight">
                    Panduan Teknik & Kesalahan Umum ({practiceVideos.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVideoGuideModalOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer badge-tint-rose"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                {practiceVideos.length === 0 ? (
                  <div className="col-span-full py-12 text-center opacity-55">
                    Belum ada video panduan praktik yang ditambahkan.
                  </div>
                ) : (
                  practiceVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-6 rounded-3xl flex flex-col justify-between gap-4 edufit-surface-subtle"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase telemetry-bar-forest text-gold-accent">
                            {formatHumanLabel(vid.category)}
                          </span>
                          <span className="text-xs font-mono opacity-65">
                            {vid.duration_label}
                          </span>
                        </div>
                        <h4 className="text-xl font-semibold tracking-tight">
                          {vid.title}
                        </h4>

                        <div className="p-3.5 rounded-2xl text-xs space-y-1 edufit-card-primary">
                          <span className="font-bold text-[10px] uppercase text-gold-accent block">
                            Tahapan Teknik Benar:
                          </span>
                          <p className="leading-relaxed whitespace-pre-line">
                            {vid.technique_steps}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl text-xs space-y-1 edufit-card-primary">
                          <span className="font-bold text-[10px] uppercase opacity-70 block">
                            Kesalahan Umum Siswa:
                          </span>
                          <p className="leading-relaxed whitespace-pre-line">
                            {vid.common_mistakes}
                          </p>
                        </div>
                      </div>

                      {vid.video_url && (
                        <a
                          href={vid.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-forest-emerald"
                        >
                          <Play size={13} /> Tonton Video Demonstrasi
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}