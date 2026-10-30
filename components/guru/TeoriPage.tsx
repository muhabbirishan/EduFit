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
  FileQuestion,
  LayoutGrid,
  MessageSquareText,
  Save,
  Search,
  SlidersHorizontal,
  Table2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface TpObjective {
  code: string;
  text: string;
  mappingDesc?: string;
}

interface StudentAnswerDetail {
  questionId: string;
  evalType: "pretest" | "posttest";
  tpCode: string;
  questionText: string;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  optionText: string;
  correctOptionText: string;
}

interface StudentReflectionItem {
  id: string;
  studentId: string;
  studentName: string;
  materialId: string | null;
  unitName: string;
  triggerQuestion: string;
  answerText: string;
  feedbackText: string;
  grade: string;
  score: number | null;
  updatedAt: string | null;
}

interface StudentTheoryRow {
  id: string;
  name: string;
  pretest: number | null;
  posttest: number | null;
  selisih: number | null;
  preDate: string | null;
  postDate: string | null;
  status: "complete" | "partial" | "empty";
  tpBreakdown: Record<
    string,
    {
      preCorrect: number;
      preTotal: number;
      postCorrect: number;
      postTotal: number;
    }
  >;
  answerSheet: StudentAnswerDetail[];
  reflections: StudentReflectionItem[];
  gradedReflectionsCount: number;
}

interface QuestionAnalyticsItem {
  id: string;
  evalType: "pretest" | "posttest";
  evalTitle: string;
  tpCode: string;
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  totalAttempts: number;
  correctCount: number;
  accuracyPct: number;
  optionCounts: { A: number; B: number; C: number; D: number };
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

const DEFAULT_TP_BY_GRADE: Record<number, TpObjective[]> = {
  10: [
    {
      code: "X-1",
      text: "Menjelaskan dan membedakan komponen kebugaran terkait kesehatan.",
    },
    {
      code: "X-2",
      text: "Menafsirkan informasi pengukuran kebugaran dan IMT remaja.",
    },
    {
      code: "X-3",
      text: "Menganalisis bentuk latihan, teknik, keselamatan dan prosedur pengukuran.",
    },
    {
      code: "X-4",
      text: "Merefleksikan respons tubuh dan menentukan perbaikan aktivitas.",
    },
  ],
  11: [
    {
      code: "XI-1",
      text: "Membedakan kecepatan, kelincahan, keseimbangan, koordinasi, dan daya ledak.",
    },
    {
      code: "XI-2",
      text: "Menafsirkan hasil dan kesalahan gerak untuk memilih perbaikan.",
    },
    {
      code: "XI-3",
      text: "Menjelaskan teknik dan memilih koreksi gerak kebugaran terkait keterampilan.",
    },
    {
      code: "XI-4",
      text: "Mengevaluasi aktivitas berdasarkan ketepatan, kontrol, dan hasil.",
    },
  ],
  12: [
    {
      code: "XII-1",
      text: "Menafsirkan hasil awal TKJI dan IMT untuk menjelaskan profil komponen serta prioritas.",
    },
    {
      code: "XII-2",
      text: "Menjelaskan FITT, progresi, pemulihan, individualisasi dan keselamatan.",
    },
    {
      code: "XII-3",
      text: "Menyusun rancangan program pribadi dari data awal serta alasan dosisnya.",
    },
    {
      code: "XII-4",
      text: "Menganalisis contoh jurnal dan perubahan hasil untuk mengevaluasi program.",
    },
  ],
};

function deriveGradeFromScore(scoreVal: number): string {
  if (scoreVal >= 85) return "A";
  if (scoreVal >= 75) return "B";
  if (scoreVal >= 65) return "C";
  return "D";
}

export default function TeoriPage() {
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
    "all" | "complete" | "partial" | "empty"
  >("all");
  const [viewMode, setViewMode] = useState<
    "bento" | "table" | "questions" | "reflections"
  >("bento");
  const [questionTypeFilter, setQuestionTypeFilter] = useState<
    "all" | "pretest" | "posttest"
  >("all");
  const [reflectionStatusFilter, setReflectionStatusFilter] = useState<
    "all" | "ungraded" | "graded"
  >("all");
  const [selectedMaterialUnit, setSelectedMaterialUnit] =
    useState<string>("all");

  const [chartMode, setChartMode] = useState<"post" | "pre">("post");
  const [gaugeMode, setGaugeMode] = useState<
    "posttest" | "ketuntasan" | "refleksi"
  >("posttest");
  const [selectedTpCode, setSelectedTpCode] = useState<string | null>(null);

  const [rawStudents, setRawStudents] = useState<any[]>([]);
  const [rawScores, setRawScores] = useState<any[]>([]);
  const [rawAnswers, setRawAnswers] = useState<any[]>([]);
  const [rawQuestions, setRawQuestions] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [rawReflections, setRawReflections] = useState<any[]>([]);
  const [instrumentData, setInstrumentData] = useState<any>(null);

  const [gradingDrafts, setGradingDrafts] = useState<
    Record<string, { score: string; grade: string; feedback: string }>
  >({});
  const [savingReflectionId, setSavingReflectionId] = useState<string | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const [selectedStudent, setSelectedStudent] =
    useState<StudentTheoryRow | null>(null);
  const [modalTab, setModalTab] = useState<"tp" | "answers" | "reflections">(
    "tp"
  );
  const [modalAnswerFilter, setModalAnswerFilter] = useState<
    "posttest" | "pretest"
  >("posttest");

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(e.target as Node)
      ) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
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
          .order("grade_level", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setClasses(data);
          setSelectedClass(data[0]);
        } else {
          setClasses([]);
          setIsLoading(false);
        }
      } catch {
        toast.error("Gagal memuat daftar kelas");
        setIsLoading(false);
      }
    }
    fetchClasses();
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

  const fetchTheoryEcosystem = async (cls: any) => {
    if (!cls?.id) return;
    setIsLoading(true);
    try {
      const [stdRes, instRes, qBankRes, matRes] = await Promise.all([
        supabase
          .from("student_classes")
          .select("student_id, user_profiles(full_name)")
          .eq("class_id", cls.id),
        supabase
          .from("master_instruments")
          .select("*")
          .eq("grade_level", cls.grade_level)
          .maybeSingle(),
        supabase
          .from("question_bank")
          .select(
            "id, evaluation_id, learning_objective_code, question_text, option_a, option_b, option_c, option_d, correct_answer, master_evaluations!inner(id, grade_level, type, title)"
          )
          .eq("master_evaluations.grade_level", cls.grade_level)
          .order("created_at", { ascending: true }),
        supabase
          .from("master_materials")
          .select(
            "id, grade_level, unit_name, trigger_question, order_index, created_at"
          )
          .eq("grade_level", cls.grade_level)
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (stdRes.error) throw stdRes.error;

      const stdList = stdRes.data || [];
      setRawStudents(stdList);
      setInstrumentData(instRes.data || null);
      setRawQuestions(qBankRes.data || []);
      setRawMaterials(matRes.data || []);
      setSelectedMaterialUnit("all");

      const studentIds = stdList
        .map((sc: any) => sc.student_id)
        .filter(Boolean);

      if (studentIds.length === 0) {
        setRawScores([]);
        setRawAnswers([]);
        setRawReflections([]);
        setIsLoading(false);
        return;
      }

      const [scoresRes, answersRes, reflectionsRes] = await Promise.all([
        supabase
          .from("student_evaluation_scores")
          .select(
            "id, student_id, score, status, submitted_at, master_evaluations(type, grade_level, title)"
          )
          .in("student_id", studentIds)
          .order("submitted_at", { ascending: true }),
        supabase
          .from("student_answers")
          .select(
            "id, question_id, selected_option, is_correct, question_bank!inner(id, learning_objective_code, question_text, option_a, option_b, option_c, option_d, correct_answer), student_evaluation_scores!inner(student_id, master_evaluations!inner(type, grade_level))"
          )
          .in("student_evaluation_scores.student_id", studentIds),
        supabase
          .from("student_reflections")
          .select(
            "id, student_id, material_id, unit_name, answer_text, feedback_text, grade, score, updated_at, created_at"
          )
          .in("student_id", studentIds)
          .order("updated_at", { ascending: false }),
      ]);

      if (scoresRes.error) throw scoresRes.error;

      const validReflections = (reflectionsRes.data || []).filter((r: any) => {
        const uName = String(r.unit_name || "")
          .trim()
          .toLowerCase();
        return uName !== "cp_tp_read" && uName !== "akhir" && uName !== "";
      });

      const initialDrafts: Record<
        string,
        { score: string; grade: string; feedback: string }
      > = {};
      validReflections.forEach((r: any) => {
        initialDrafts[r.id] = {
          score:
            r.score !== null && r.score !== undefined ? String(r.score) : "",
          grade: r.grade ? String(r.grade).trim().toUpperCase() : "",
          feedback: r.feedback_text ? String(r.feedback_text) : "",
        };
      });

      setGradingDrafts(initialDrafts);
      setRawScores(scoresRes.data || []);
      setRawAnswers(answersRes.data || []);
      setRawReflections(validReflections);
      setSelectedTpCode(null);
      setLastSyncTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error: any) {
      toast.error("Gagal memuat data nilai teori & refleksi", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass?.id) {
      fetchTheoryEcosystem(selectedClass);
    }
  }, [selectedClass]);

  const updateDraftField = (
    reflectionId: string,
    field: "score" | "grade" | "feedback",
    value: string
  ) => {
    setGradingDrafts((prev) => {
      const current = prev[reflectionId] || {
        score: "",
        grade: "",
        feedback: "",
      };
      if (field === "score") {
        const num = Number(value);
        const autoGrade =
          value.trim() !== "" && !isNaN(num)
            ? deriveGradeFromScore(Math.min(100, Math.max(0, num)))
            : current.grade;
        return {
          ...prev,
          [reflectionId]: {
            ...current,
            score: value,
            grade: autoGrade,
          },
        };
      }
      return {
        ...prev,
        [reflectionId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveReflectionGrade = async (refItem: StudentReflectionItem) => {
    const draft = gradingDrafts[refItem.id] || {
      score: "",
      grade: "",
      feedback: "",
    };
    const rawScoreStr = draft.score.trim();
    const numericScore =
      rawScoreStr !== "" ? Math.min(100, Math.max(0, Number(rawScoreStr))) : null;

    if (rawScoreStr !== "" && isNaN(Number(rawScoreStr))) {
      toast.error("Masukkan angka skor yang valid (0–100).");
      return;
    }

    const finalGrade =
      draft.grade.trim() ||
      (numericScore !== null ? deriveGradeFromScore(numericScore) : "");

    if (numericScore === null && !finalGrade) {
      toast.error("Isi skor atau pilih Grade (A–D) terlebih dahulu.");
      return;
    }

    setSavingReflectionId(refItem.id);
    try {
      const nowIso = new Date().toISOString();
      const payload = {
        score: numericScore,
        grade: finalGrade || null,
        feedback_text: draft.feedback.trim() || null,
        updated_at: nowIso,
      };

      const { error } = await supabase
        .from("student_reflections")
        .update(payload)
        .eq("id", refItem.id);

      if (error) throw error;

      if (refItem.materialId && refItem.studentId) {
        await supabase
          .from("student_material_progress")
          .update({
            teacher_feedback: draft.feedback.trim() || null,
          })
          .eq("student_id", refItem.studentId)
          .eq("material_id", refItem.materialId);
      }

      setRawReflections((prev) =>
        prev.map((r) => (r.id === refItem.id ? { ...r, ...payload } : r))
      );

      setGradingDrafts((prev) => ({
        ...prev,
        [refItem.id]: {
          score: numericScore !== null ? String(numericScore) : "",
          grade: finalGrade,
          feedback: draft.feedback.trim(),
        },
      }));

      toast.success(`Penilaian refleksi ${refItem.studentName} tersimpan!`);
      triggerDynamicIsland(
        "Nilai Refleksi Tersimpan",
        `${refItem.studentName} · ${refItem.unitName} (${finalGrade}${
          numericScore !== null ? ` / ${numericScore}` : ""
        })`,
        "success"
      );
    } catch (err: any) {
      toast.error("Gagal menyimpan nilai refleksi: " + (err?.message || ""));
      triggerDynamicIsland("Gagal Menyimpan Nilai", err?.message, "error");
    } finally {
      setSavingReflectionId(null);
    }
  };

  const activeTpList: TpObjective[] = useMemo(() => {
    const currentGrade = Number(selectedClass?.grade_level) || 10;
    const rawObjectives = instrumentData?.objectives;
    const rawMappings = instrumentData?.mappings;

    if (Array.isArray(rawObjectives) && rawObjectives.length > 0) {
      return rawObjectives.map((obj: any) => {
        const mapMatch = Array.isArray(rawMappings)
          ? rawMappings.find((m: any) => m.code === obj.code)
          : null;
        return {
          code: obj.code,
          text: obj.text,
          mappingDesc: mapMatch?.desc || "",
        };
      });
    }
    return DEFAULT_TP_BY_GRADE[currentGrade] || DEFAULT_TP_BY_GRADE[10];
  }, [instrumentData, selectedClass]);

  const materialTriggerMap = useMemo(() => {
    const map: Record<string, { id: string; trigger: string }> = {};
    rawMaterials.forEach((m: any) => {
      const key = String(m.unit_name || "")
        .trim()
        .toLowerCase();
      if (key) {
        map[key] = {
          id: m.id,
          trigger:
            m.trigger_question ||
            "Pertanyaan analisis & refleksi pemahaman unit materi.",
        };
      }
      if (m.id) {
        map[m.id] = {
          id: m.id,
          trigger:
            m.trigger_question ||
            "Pertanyaan analisis & refleksi pemahaman unit materi.",
        };
      }
    });
    return map;
  }, [rawMaterials]);

  const studentsData: StudentTheoryRow[] = useMemo(() => {
    const currentGrade = Number(selectedClass?.grade_level) || 10;

    return rawStudents
      .map((sc: any) => {
        const sId = sc.student_id;
        const sName = sc.user_profiles?.full_name || "Siswa Tidak Diketahui";
        const studentScores = rawScores.filter(
          (s: any) =>
            s.student_id === sId &&
            (!s.master_evaluations?.grade_level ||
              Number(s.master_evaluations?.grade_level) === currentGrade)
        );

        const effectiveScores =
          studentScores.length > 0
            ? studentScores
            : rawScores.filter((s: any) => s.student_id === sId);

        let pre: number | null = null;
        let post: number | null = null;
        let preDate: string | null = null;
        let postDate: string | null = null;

        effectiveScores.forEach((s: any) => {
          const numScore =
            s.score !== null && s.score !== undefined
              ? Math.round(Number(s.score))
              : null;
          if (s.master_evaluations?.type === "pretest" && numScore !== null) {
            pre = numScore;
            preDate = s.submitted_at || null;
          }
          if (s.master_evaluations?.type === "posttest" && numScore !== null) {
            post = numScore;
            postDate = s.submitted_at || null;
          }
        });

        const selisih = pre !== null && post !== null ? post - pre : null;

        const status: "complete" | "partial" | "empty" =
          pre !== null && post !== null
            ? "complete"
            : pre !== null || post !== null
            ? "partial"
            : "empty";

        const tpBreakdown: StudentTheoryRow["tpBreakdown"] = {};
        activeTpList.forEach((tp) => {
          tpBreakdown[tp.code] = {
            preCorrect: 0,
            preTotal: 0,
            postCorrect: 0,
            postTotal: 0,
          };
        });

        const answerSheet: StudentAnswerDetail[] = [];

        rawAnswers.forEach((ans: any) => {
          if (ans.student_evaluation_scores?.student_id !== sId) return;
          const qb = ans.question_bank || {};
          const code = (qb.learning_objective_code || "").trim();
          const type = ans.student_evaluation_scores?.master_evaluations
            ?.type as "pretest" | "posttest";

          if (code) {
            if (!tpBreakdown[code]) {
              tpBreakdown[code] = {
                preCorrect: 0,
                preTotal: 0,
                postCorrect: 0,
                postTotal: 0,
              };
            }
            if (type === "pretest") {
              tpBreakdown[code].preTotal++;
              if (ans.is_correct) tpBreakdown[code].preCorrect++;
            } else if (type === "posttest") {
              tpBreakdown[code].postTotal++;
              if (ans.is_correct) tpBreakdown[code].postCorrect++;
            }
          }

          const selOpt = String(ans.selected_option || "")
            .trim()
            .toUpperCase();
          const corrOpt = String(qb.correct_answer || "")
            .trim()
            .toUpperCase();
          const optMap: Record<string, string> = {
            A: qb.option_a || "-",
            B: qb.option_b || "-",
            C: qb.option_c || "-",
            D: qb.option_d || "-",
          };

          answerSheet.push({
            questionId: ans.question_id || qb.id,
            evalType: type || "pretest",
            tpCode: code || "TP",
            questionText: qb.question_text || "Butir soal",
            selectedOption: selOpt || "-",
            correctAnswer: corrOpt || "-",
            isCorrect: Boolean(ans.is_correct),
            optionText: optMap[selOpt] || "-",
            correctOptionText: optMap[corrOpt] || "-",
          });
        });

        const studentRefs: StudentReflectionItem[] = rawReflections
          .filter((r: any) => r.student_id === sId)
          .map((r: any) => {
            const uKey = String(r.unit_name || "")
              .trim()
              .toLowerCase();
            const matInfo =
              (r.material_id && materialTriggerMap[r.material_id]) ||
              materialTriggerMap[uKey];
            return {
              id: r.id,
              studentId: sId,
              studentName: sName,
              materialId: r.material_id || matInfo?.id || null,
              unitName: r.unit_name || "Unit Materi",
              triggerQuestion:
                matInfo?.trigger ||
                "Pertanyaan analisis & refleksi pemahaman unit materi.",
              answerText: r.answer_text || "",
              feedbackText: r.feedback_text || "",
              grade: r.grade ? String(r.grade).trim() : "",
              score:
                r.score !== null && r.score !== undefined
                  ? Number(r.score)
                  : null,
              updatedAt: r.updated_at || r.created_at || null,
            };
          });

        const gradedCount = studentRefs.filter(
          (r) => r.score !== null || r.grade !== ""
        ).length;

        return {
          id: sId,
          name: sName,
          pretest: pre,
          posttest: post,
          selisih,
          preDate,
          postDate,
          status,
          tpBreakdown,
          answerSheet,
          reflections: studentRefs,
          gradedReflectionsCount: gradedCount,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    rawStudents,
    rawScores,
    rawAnswers,
    rawReflections,
    selectedClass,
    activeTpList,
    materialTriggerMap,
  ]);

  useEffect(() => {
    if (selectedStudent) {
      const updated = studentsData.find((s) => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  }, [studentsData]);

  const allClassReflections: StudentReflectionItem[] = useMemo(() => {
    const list: StudentReflectionItem[] = [];
    studentsData.forEach((s) => {
      s.reflections.forEach((r) => list.push(r));
    });
    return list;
  }, [studentsData]);

  const filteredReflections = useMemo(() => {
    return allClassReflections.filter((r) => {
      if (selectedMaterialUnit !== "all") {
        const matchUnit =
          r.materialId === selectedMaterialUnit ||
          r.unitName.trim().toLowerCase() ===
            selectedMaterialUnit.trim().toLowerCase();
        if (!matchUnit) return false;
      }
      const isGraded = r.score !== null || r.grade !== "";
      if (reflectionStatusFilter === "graded" && !isGraded) return false;
      if (reflectionStatusFilter === "ungraded" && isGraded) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchStudent = r.studentName.toLowerCase().includes(q);
        const matchUnit = r.unitName.toLowerCase().includes(q);
        const matchAnswer = r.answerText.toLowerCase().includes(q);
        if (!matchStudent && !matchUnit && !matchAnswer) return false;
      }
      return true;
    });
  }, [
    allClassReflections,
    selectedMaterialUnit,
    reflectionStatusFilter,
    searchQuery,
  ]);

  const questionAnalytics: QuestionAnalyticsItem[] = useMemo(() => {
    const mapByQuestionId: Record<string, QuestionAnalyticsItem> = {};

    rawQuestions.forEach((q: any) => {
      mapByQuestionId[q.id] = {
        id: q.id,
        evalType: (q.master_evaluations?.type || "pretest") as
          | "pretest"
          | "posttest",
        evalTitle: q.master_evaluations?.title || "Evaluasi Teori",
        tpCode: q.learning_objective_code || "TP",
        questionText: q.question_text || "",
        options: {
          A: q.option_a || "-",
          B: q.option_b || "-",
          C: q.option_c || "-",
          D: q.option_d || "-",
        },
        correctAnswer: String(q.correct_answer || "A")
          .trim()
          .toUpperCase(),
        totalAttempts: 0,
        correctCount: 0,
        accuracyPct: 0,
        optionCounts: { A: 0, B: 0, C: 0, D: 0 },
      };
    });

    rawAnswers.forEach((ans: any) => {
      const qId = ans.question_id || ans.question_bank?.id;
      if (!qId) return;

      if (!mapByQuestionId[qId] && ans.question_bank) {
        const qb = ans.question_bank;
        mapByQuestionId[qId] = {
          id: qId,
          evalType: (ans.student_evaluation_scores?.master_evaluations?.type ||
            "pretest") as "pretest" | "posttest",
          evalTitle: "Evaluasi Teori",
          tpCode: qb.learning_objective_code || "TP",
          questionText: qb.question_text || "",
          options: {
            A: qb.option_a || "-",
            B: qb.option_b || "-",
            C: qb.option_c || "-",
            D: qb.option_d || "-",
          },
          correctAnswer: String(qb.correct_answer || "A")
            .trim()
            .toUpperCase(),
          totalAttempts: 0,
          correctCount: 0,
          accuracyPct: 0,
          optionCounts: { A: 0, B: 0, C: 0, D: 0 },
        };
      }

      const item = mapByQuestionId[qId];
      if (!item) return;

      item.totalAttempts++;
      if (ans.is_correct) item.correctCount++;
      const opt = String(ans.selected_option || "")
        .trim()
        .toUpperCase();
      if (opt === "A" || opt === "B" || opt === "C" || opt === "D") {
        item.optionCounts[opt]++;
      }
    });

    return Object.values(mapByQuestionId)
      .map((item) => ({
        ...item,
        accuracyPct:
          item.totalAttempts > 0
            ? Math.round((item.correctCount / item.totalAttempts) * 100)
            : 0,
      }))
      .sort((a, b) => a.accuracyPct - b.accuracyPct);
  }, [rawQuestions, rawAnswers]);

  const filteredQuestions = useMemo(() => {
    return questionAnalytics.filter((q) => {
      if (questionTypeFilter !== "all" && q.evalType !== questionTypeFilter)
        return false;
      if (selectedTpCode && q.tpCode !== selectedTpCode) return false;
      if (
        searchQuery &&
        !q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !q.tpCode.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [questionAnalytics, questionTypeFilter, selectedTpCode, searchQuery]);

  const stats = useMemo(() => {
    const totalSiswa = studentsData.length;
    const validPre = studentsData
      .map((s) => s.pretest)
      .filter((n): n is number => n !== null);
    const validPost = studentsData
      .map((s) => s.posttest)
      .filter((n): n is number => n !== null);

    const avgPre = validPre.length
      ? Math.round(
          validPre.reduce((a, b) => a + Number(b), 0) / validPre.length
        )
      : 0;
    const avgPost = validPost.length
      ? Math.round(
          validPost.reduce((a, b) => a + Number(b), 0) / validPost.length
        )
      : 0;
    const classGain =
      validPre.length > 0 && validPost.length > 0
        ? avgPost - avgPre
        : validPost.length > 0
        ? avgPost
        : 0;

    const completeCount = studentsData.filter(
      (s) => s.status === "complete"
    ).length;
    const partialCount = studentsData.filter(
      (s) => s.status === "partial"
    ).length;
    const emptyCount = studentsData.filter((s) => s.status === "empty").length;
    const activeParticipants = completeCount + partialCount;

    const participationPct =
      totalSiswa > 0 ? Math.round((activeParticipants / totalSiswa) * 100) : 0;

    const kkmPassedCount = validPost.filter((sc) => sc >= 75).length;
    const ketuntasanPct =
      validPost.length > 0
        ? Math.round((kkmPassedCount / validPost.length) * 100)
        : 0;

    const totalReflections = allClassReflections.length;
    const gradedReflections = allClassReflections.filter(
      (r) => r.score !== null || r.grade !== ""
    ).length;
    const ungradedReflections = totalReflections - gradedReflections;
    const reflectionGradedPct =
      totalReflections > 0
        ? Math.round((gradedReflections / totalReflections) * 100)
        : 0;

    const tpBars = activeTpList.map((tp) => {
      let preC = 0,
        preT = 0,
        postC = 0,
        postT = 0;

      studentsData.forEach((s) => {
        const b = s.tpBreakdown[tp.code];
        if (b) {
          preC += b.preCorrect;
          preT += b.preTotal;
          postC += b.postCorrect;
          postT += b.postTotal;
        }
      });

      const prePct = preT > 0 ? Math.round((preC / preT) * 100) : avgPre;
      const postPct = postT > 0 ? Math.round((postC / postT) * 100) : avgPost;

      return {
        code: tp.code,
        title: tp.text,
        mappingDesc: tp.mappingDesc,
        pre: prePct,
        post: postPct,
      };
    });

    return {
      totalSiswa,
      preCount: validPre.length,
      postCount: validPost.length,
      avgPre,
      avgPost,
      classGain,
      completeCount,
      partialCount,
      emptyCount,
      activeParticipants,
      participationPct,
      kkmPassedCount,
      ketuntasanPct,
      totalReflections,
      gradedReflections,
      ungradedReflections,
      reflectionGradedPct,
      tpBars,
    };
  }, [studentsData, activeTpList, allClassReflections]);

  const filteredData = useMemo(() => {
    return studentsData.filter((row) => {
      const matchName = row.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchName) return false;
      if (statusFilter === "complete") return row.status === "complete";
      if (statusFilter === "partial") return row.status === "partial";
      if (statusFilter === "empty") return row.status === "empty";
      return true;
    });
  }, [studentsData, searchQuery, statusFilter]);

  const activeClassName = useMemo(() => {
    return selectedClass
      ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
      : "Pilih Kelas";
  }, [selectedClass]);

  const handleExportCSV = () => {
    if (studentsData.length === 0)
      return toast.error("Tidak ada data rekapitulasi untuk diekspor");

    const headers = [
      "Nama Siswa",
      "Kelas",
      "Skor Pretest",
      "Skor Posttest",
      "Progres (Gain)",
      "Refleksi Materi Dinilai",
      "Status Ketuntasan",
    ];
    const rows = studentsData.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${selectedClass?.name || "-"}"`,
      r.pretest !== null ? r.pretest : "Belum Ujian",
      r.posttest !== null ? r.posttest : "Belum Ujian",
      r.selisih !== null
        ? r.selisih > 0
          ? `+${r.selisih}`
          : r.selisih
        : "-",
      `${r.gradedReflectionsCount}/${r.reflections.length} Unit`,
      r.posttest !== null
        ? r.posttest >= 75
          ? "Tuntas (>=75)"
          : "Perlu Penguatan"
        : "Belum Selesai",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Rekap_Teori_Refleksi_${activeClassName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Rekap Nilai Teori & Refleksi Diunduh",
      `Berkas CSV untuk ${activeClassName} berhasil diekspor.`,
      "success"
    );
  };

  const renderReflectionGradingCard = (
    refItem: StudentReflectionItem,
    showStudentHeader = true
  ) => {
    const draft = gradingDrafts[refItem.id] || {
      score: refItem.score !== null ? String(refItem.score) : "",
      grade: refItem.grade || "",
      feedback: refItem.feedbackText || "",
    };
    const isGraded = refItem.score !== null || refItem.grade !== "";
    const isSaving = savingReflectionId === refItem.id;

    return (
      <div
        key={refItem.id}
        className="p-6 sm:p-7 rounded-[2rem] flex flex-col justify-between gap-5 edufit-card-primary relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

        <div className="space-y-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hairline">
            <div>
              {showStudentHeader && (
                <div className="text-xl font-bold tracking-tight">
                  {refItem.studentName}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase badge-tint-amber">
                  {refItem.unitName}
                </span>
                {refItem.updatedAt && (
                  <span className="text-[11px] font-mono opacity-55">
                    Dikirim:{" "}
                    {new Date(refItem.updatedAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase ${
                isGraded ? "badge-tint-emerald" : "badge-tint-rose"
              }`}
            >
              {isGraded
                ? `Dinilai: ${refItem.grade || "-"} (${
                    refItem.score !== null ? refItem.score : "-"
                  })`
                : "Menunggu Penilaian Guru"}
            </span>
          </div>

          <div className="p-4 rounded-2xl edufit-surface-subtle space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block">
              Pertanyaan Pemantik Unit Materi:
            </span>
            <p className="text-xs font-semibold leading-relaxed">
              {refItem.triggerQuestion}
            </p>
          </div>

          <div className="p-4 rounded-2xl edufit-card-secondary space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-accent block">
              Jawaban Analisis & Refleksi Siswa:
            </span>
            <p className="text-sm leading-relaxed whitespace-pre-line font-medium">
              {refItem.answerText || "Tidak ada teks jawaban."}
            </p>
          </div>
        </div>

        {/* FORM PENILAIAN GURU (SKOR, GRADE A-D, FEEDBACK) */}
        <div className="pt-4 border-t border-hairline space-y-3 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-4">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-65 block mb-1">
                Skor Angka (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.score}
                onChange={(e) =>
                  updateDraftField(refItem.id, "score", e.target.value)
                }
                placeholder="Cth: 88"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold outline-none edufit-surface-subtle"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-65 block mb-1">
                Predikat Nilai (Grade)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["A", "B", "C", "D"] as const).map((gOpt) => {
                  const active = draft.grade === gOpt;
                  return (
                    <button
                      key={gOpt}
                      type="button"
                      onClick={() => updateDraftField(refItem.id, "grade", gOpt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                        active
                          ? "seg-btn-active shadow-sm"
                          : "edufit-surface-subtle opacity-75 hover:opacity-100"
                      }`}
                    >
                      Grade {gOpt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-65 block mb-1">
              Umpan Balik Guru PJOK (Tampil di Aplikasi Siswa)
            </label>
            <textarea
              rows={2}
              value={draft.feedback}
              onChange={(e) =>
                updateDraftField(refItem.id, "feedback", e.target.value)
              }
              placeholder="Tuliskan apresiasi atau catatan koreksi pemahaman untuk siswa..."
              className="w-full p-3.5 rounded-xl text-xs leading-relaxed outline-none resize-y edufit-surface-subtle"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveReflectionGrade(refItem)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] disabled:opacity-50 btn-forest-gold"
            >
              <Save size={14} />
              {isSaving ? "Menyimpan..." : "Simpan Penilaian Refleksi"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  const highestTpBar = stats.tpBars.reduce(
    (max, item) => {
      const val = chartMode === "post" ? item.post : item.pre;
      const maxVal = chartMode === "post" ? max.post : max.pre;
      return val > maxVal ? item : max;
    },
    stats.tpBars[0] || { code: "-", title: "", pre: 0, post: 0 }
  );

  const activeTpObj = selectedTpCode
    ? stats.tpBars.find((t) => t.code === selectedTpCode)
    : null;

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

      {/* ZONA 1: HERO HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-65">
            <span className="text-gold-accent">
              Analitik Kognitif & Penilaian Refleksi Materi
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <BrainCircuit size={15} className="text-emerald-accent" />
              {selectedClass
                ? `${activeClassName} · ${rawMaterials.length} Unit Materi · Sinkron ${
                    lastSyncTime || "Live"
                  }`
                : "Evaluasi Pretest, Posttest & Refleksi Materi PJOK"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Pantau <br />
            <span className="font-semibold">Teori & Refleksi</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-10 md:gap-14 items-baseline shrink-0">
          <button
            type="button"
            onClick={() => {
              setViewMode("bento");
              setStatusFilter("all");
            }}
            className="text-left cursor-pointer group"
          >
            <div className="text-6xl md:text-7xl font-light font-mono tracking-tighter leading-none text-sky-accent group-hover:scale-[1.02] transition-transform">
              {isLoading ? "—" : stats.totalSiswa}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-3">
              Total Siswa
            </div>
          </button>

          <button
            type="button"
            onClick={() => setChartMode("post")}
            className="text-left cursor-pointer group"
          >
            <div className="text-6xl md:text-7xl font-light font-mono tracking-tighter leading-none text-emerald-accent group-hover:scale-[1.02] transition-transform">
              {isLoading ? "—" : `${stats.avgPost}%`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-3">
              Rata-Rata Posttest
            </div>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("reflections")}
            className="text-left cursor-pointer group"
          >
            <div className="text-6xl md:text-7xl font-light font-mono tracking-tighter leading-none text-gold-accent group-hover:scale-[1.02] transition-transform">
              {isLoading
                ? "—"
                : `${stats.gradedReflections}/${stats.totalReflections}`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-3">
              Refleksi Dinilai
            </div>
          </button>
        </div>
      </div>

      {/* ZONA 2: 4 BAR TELEMETRI KOGNITIF & REFLEKSI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <button
          type="button"
          onClick={() => setChartMode("pre")}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-Rata Pretest</span>
            <span className="font-mono text-sky-accent">
              {stats.preCount} SISWA
            </span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              chartMode === "pre"
                ? "telemetry-bar-gold"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${stats.avgPre}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              Tes Awal
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setChartMode("post")}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-Rata Posttest</span>
            <span className="font-mono text-emerald-accent">
              {stats.classGain >= 0
                ? `+${stats.classGain} Poin`
                : `${stats.classGain} Poin`}
            </span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              chartMode === "post"
                ? "telemetry-bar-gold"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${stats.avgPost}%`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {stats.postCount} SELESAI
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("reflections")}
          className="sm:col-span-2 lg:col-span-4 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Penilaian Refleksi Unit Materi</span>
            <span className="font-mono text-gold-accent">
              {stats.ungradedReflections} BELUM DINILAI
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped group-hover:scale-[1.01] transition-transform">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading
                ? "—"
                : `${stats.gradedReflections}/${stats.totalReflections} Jawaban`}
            </span>
            <span className="px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest relative z-10 badge-tint-emerald">
              {stats.reflectionGradedPct}% Dinilai
            </span>
          </div>
        </button>

        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Ketuntasan</span>
            <span className="font-mono text-emerald-accent">SKOR &ge; 75</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${stats.ketuntasanPct}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ZONA 3: TRIO KARTU BENTO LEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1: KENDALI ROMBEL */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              <SlidersHorizontal size={14} className="text-gold-accent" />
              <span>Filter Angkatan & Rombel</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Kendali Rombel
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih jenjang angkatan dan rombel kelas untuk memeriksa hasil
              ujian teori serta menilai jawaban refleksi materi siswa.
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
                      active ? "seg-btn-active shadow-sm" : "seg-btn-idle"
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
                    : "Belum Ada Kelas..."}
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
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
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
                            `Memuat rekap Pretest, Posttest, dan jawaban refleksi Kelas ${cls.grade_level}.`,
                            "info"
                          );
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
            <Download size={16} strokeWidth={2.5} /> Ekspor Rekapitulasi CSV
          </button>
        </div>

        {/* BENTO 2: CAPAIAN PER TUJUAN PEMBELAJARAN (TP) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={15} className="text-sky-accent" />
              <span>Capaian Kisi-Kisi TP</span>
            </div>
            <button
              type="button"
              onClick={() => setChartMode(chartMode === "post" ? "pre" : "post")}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                chartMode === "post" ? "badge-tint-emerald" : "badge-tint-sky"
              }`}
            >
              Mode {chartMode === "post" ? "Posttest" : "Pretest"}
            </button>
          </div>

          <div className="my-4 flex items-end justify-between gap-3 relative z-10">
            <div className="flex items-end gap-3 min-w-0">
              <div className="text-6xl font-light font-mono tracking-tighter leading-none shrink-0">
                {isLoading
                  ? "—"
                  : activeTpObj
                  ? `${
                      chartMode === "post" ? activeTpObj.post : activeTpObj.pre
                    }%`
                  : chartMode === "post"
                  ? `${stats.avgPost}%`
                  : `${stats.avgPre}%`}
              </div>
              <div className="text-xs font-semibold opacity-60 mb-1 line-clamp-2">
                {activeTpObj
                  ? `${activeTpObj.code}: ${activeTpObj.title}`
                  : chartMode === "post"
                  ? "Rata-Rata Posttest Kelas"
                  : "Rata-Rata Pretest Kelas"}
              </div>
            </div>
          </div>

          <div className="pt-4 pb-1 relative z-10">
            <div
              className="grid gap-3 items-end h-44 px-3.5 py-3.5 rounded-2xl edufit-card-primary"
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  1,
                  stats.tpBars.length
                )}, minmax(0, 1fr))`,
              }}
            >
              {stats.tpBars.map((bar, bIdx) => {
                const val = chartMode === "post" ? bar.post : bar.pre;
                const heightPct = val <= 0 ? 6 : Math.max(14, val);
                const isHighest = bar.code === highestTpBar.code && val > 0;
                const isSelected = selectedTpCode === bar.code;
                const cycleColors = [
                  "chart-fill-gold",
                  "chart-fill-emerald",
                  "chart-fill-sky",
                  "chart-fill-terra",
                ];
                const fillClass = isSelected
                  ? "chart-fill-emerald"
                  : isHighest
                  ? "chart-fill-gold"
                  : cycleColors[bIdx % cycleColors.length];

                return (
                  <button
                    key={bar.code}
                    type="button"
                    onClick={() =>
                      setSelectedTpCode(isSelected ? null : bar.code)
                    }
                    className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                    title={`${bar.code} (${bar.title}): Pretest ${bar.pre}% → Posttest ${bar.post}%`}
                  >
                    <span
                      className={`text-[11px] font-bold font-mono ${
                        isSelected || isHighest
                          ? "text-gold-accent"
                          : "opacity-80"
                      }`}
                    >
                      {val}%
                    </span>
                    <div className="w-6 flex-1 rounded-xl flex items-end overflow-hidden p-0.5 chart-track-pill">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`w-full rounded-lg ${fillClass}`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold font-mono ${
                        isSelected ? "text-emerald-accent" : "opacity-70"
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

        {/* BENTO 3: INDEKS KOGNITIF & REFLEKSI KELAS */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} className="text-emerald-accent" />
              <span>Indeks Kelas</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              {[
                { key: "posttest", label: "Posttest" },
                { key: "ketuntasan", label: "Tuntas" },
                { key: "refleksi", label: "Refleksi" },
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
            const gaugePct =
              gaugeMode === "posttest"
                ? stats.avgPost
                : gaugeMode === "ketuntasan"
                ? stats.ketuntasanPct
                : stats.reflectionGradedPct;

            const gaugeLabel =
              gaugeMode === "posttest"
                ? "Rata-Rata Skor Posttest Akhir"
                : gaugeMode === "ketuntasan"
                ? "Proporsi Siswa Mencapai Skor >= 75"
                : `Jawaban Refleksi Dinilai Guru (${stats.gradedReflections}/${stats.totalReflections})`;

            const strokeCls =
              gaugeMode === "posttest"
                ? "gauge-circle-gold"
                : gaugeMode === "ketuntasan"
                ? "gauge-circle-emerald"
                : "gauge-circle-sky";

            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset =
              gaugePct <= 0
                ? circumference
                : circumference - (gaugePct / 100) * circumference;

            return (
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
                        className={`transition-all duration-700 ${strokeCls}`}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                      {isLoading ? "—" : `${gaugePct}%`}
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
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold font-mono tracking-wider uppercase pt-3 border-t border-hairline text-center">
              <span className="py-1 rounded-lg badge-tint-emerald">
                {stats.completeCount} Lengkap Tes
              </span>
              <span className="py-1 rounded-lg badge-tint-amber">
                {stats.gradedReflections} Refleksi Nilai
              </span>
              <span className="py-1 rounded-lg badge-tint-rose">
                {stats.ungradedReflections} Antrean Nilai
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 4: HEADER FILTER & SWITCHER MODE (KARTU, TABEL, REFLEKSI MATERI, BEDAH SOAL) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-1">
            Evaluasi Kognitif & Penilaian Refleksi Materi
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            {viewMode === "questions"
              ? `Analisis Butir Soal (${filteredQuestions.length})`
              : viewMode === "reflections"
              ? `Penilaian Jawaban Refleksi Materi (${filteredReflections.length})`
              : `Rekapitulasi Nilai Teori (${filteredData.length})`}
          </h3>

          {viewMode === "questions" ? (
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {[
                { key: "all", label: `Semua Soal (${questionAnalytics.length})` },
                {
                  key: "pretest",
                  label: `Pretest (${
                    questionAnalytics.filter((q) => q.evalType === "pretest")
                      .length
                  })`,
                },
                {
                  key: "posttest",
                  label: `Posttest (${
                    questionAnalytics.filter((q) => q.evalType === "posttest")
                      .length
                  })`,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setQuestionTypeFilter(tab.key as any)}
                  className={`text-xs font-bold uppercase tracking-widest transition-opacity cursor-pointer ${
                    questionTypeFilter === tab.key
                      ? "opacity-100 underline decoration-gold-accent decoration-2 underline-offset-8"
                      : "opacity-45 hover:opacity-80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {selectedTpCode && (
                <button
                  type="button"
                  onClick={() => setSelectedTpCode(null)}
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg badge-tint-amber cursor-pointer"
                >
                  Filter TP: {selectedTpCode} ×
                </button>
              )}
            </div>
          ) : viewMode === "reflections" ? (
            <div className="space-y-2.5 mt-3">
              <div className="flex flex-wrap items-center gap-4">
                {[
                  {
                    key: "all",
                    label: `Semua Jawaban (${stats.totalReflections})`,
                  },
                  {
                    key: "ungraded",
                    label: `Belum Dinilai (${stats.ungradedReflections})`,
                  },
                  {
                    key: "graded",
                    label: `Sudah Dinilai (${stats.gradedReflections})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setReflectionStatusFilter(tab.key as any)}
                    className={`text-xs font-bold uppercase tracking-widest transition-opacity cursor-pointer ${
                      reflectionStatusFilter === tab.key
                        ? "opacity-100 underline decoration-gold-accent decoration-2 underline-offset-8"
                        : "opacity-45 hover:opacity-80"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {rawMaterials.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMaterialUnit("all")}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                      selectedMaterialUnit === "all"
                        ? "seg-btn-active"
                        : "edufit-surface-subtle opacity-75"
                    }`}
                  >
                    Semua Unit ({rawMaterials.length})
                  </button>
                  {rawMaterials.map((mat, mIdx) => {
                    const active =
                      selectedMaterialUnit === mat.id ||
                      selectedMaterialUnit === mat.unit_name;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => setSelectedMaterialUnit(mat.unit_name)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                          active
                            ? "seg-btn-active"
                            : "edufit-surface-subtle opacity-75"
                        }`}
                      >
                        U{mIdx + 1}: {mat.unit_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {[
                { key: "all", label: `Semua (${stats.totalSiswa})` },
                {
                  key: "complete",
                  label: `Lengkap Pre & Post (${stats.completeCount})`,
                },
                { key: "partial", label: `Baru 1 Tes (${stats.partialCount})` },
                { key: "empty", label: `Belum Ujian (${stats.emptyCount})` },
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
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-wrap p-1.5 rounded-2xl edufit-surface-subtle">
            <button
              type="button"
              onClick={() => setViewMode("bento")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "bento" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <LayoutGrid size={14} /> Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <Table2 size={14} /> Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode("reflections")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "reflections" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <ClipboardCheck size={14} /> Refleksi Materi (
              {stats.totalReflections})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("questions")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "questions" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <FileQuestion size={14} /> Bedah Soal
            </button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === "questions"
                  ? "Cari teks soal / TP..."
                  : viewMode === "reflections"
                  ? "Cari siswa / unit / jawaban..."
                  : "Cari nama siswa..."
              }
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
      </div>

      {/* ISI ZONA 4 */}
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
          <Users className="w-10 h-10 mb-3" />
          <div className="text-xl font-light tracking-tight">
            Belum ada kelas yang dibuka. Buat sesi kelas di Dashboard Guru
            terlebih dahulu.
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55 animate-pulse">
          <div className="text-xl font-light tracking-tight">
            Menarik data evaluasi kognitif & jawaban refleksi materi siswa...
          </div>
        </div>
      ) : viewMode === "reflections" ? (
        filteredReflections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55 text-center">
            <MessageSquareText className="w-10 h-10 mb-3 opacity-60" />
            <div className="text-xl font-light tracking-tight">
              Belum ada jawaban refleksi materi siswa pada filter ini.
            </div>
            <p className="text-xs mt-1 max-w-md">
              Jawaban akan otomatis muncul di sini segera setelah siswa membaca
              modul materi di aplikasi mobile dan menekan tombol Simpan Refleksi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 mb-12">
            {filteredReflections.map((refItem) =>
              renderReflectionGradingCard(refItem, true)
            )}
          </div>
        )
      ) : viewMode === "questions" ? (
        filteredQuestions.length === 0 ? (
          <div className="flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
            <div className="text-xl font-light tracking-tight">
              Belum ada butir soal pada bank soal jenjang ini.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 mb-12">
            {filteredQuestions.map((q, idx) => {
              const isHardQuestion =
                q.totalAttempts > 0 && q.accuracyPct < 55;
              const isPost = q.evalType === "posttest";
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    delay: Math.min(idx * 0.03, 0.25),
                  }}
                  className={`p-7 sm:p-8 rounded-[2rem] flex flex-col justify-between gap-5 edufit-card-primary relative overflow-hidden ${
                    isHardQuestion ? "bento-showcase-selected" : ""
                  }`}
                >
                  <div className="absolute inset-0 pointer-events-none pattern-polkadot" />
                  <div className="space-y-3 relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase badge-tint-amber">
                          {q.tpCode}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase ${
                            isPost ? "badge-tint-emerald" : "badge-tint-sky"
                          }`}
                        >
                          {isPost ? "Posttest" : "Pretest"} · Soal #{idx + 1}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                          q.totalAttempts === 0
                            ? "edufit-surface-subtle opacity-60"
                            : q.accuracyPct >= 75
                            ? "badge-tint-emerald"
                            : q.accuracyPct >= 55
                            ? "badge-tint-amber"
                            : "badge-tint-rose"
                        }`}
                      >
                        {q.totalAttempts > 0
                          ? `Akurasi Kelas: ${q.accuracyPct}% (${q.correctCount}/${q.totalAttempts})`
                          : "Belum Dijawab Siswa"}
                      </span>
                    </div>

                    <p className="text-base font-medium leading-relaxed">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 relative z-10">
                    {(["A", "B", "C", "D"] as const).map((optKey) => {
                      const isCorrectKey = q.correctAnswer === optKey;
                      const pickedCount = q.optionCounts[optKey] || 0;
                      const pickedPct =
                        q.totalAttempts > 0
                          ? Math.round((pickedCount / q.totalAttempts) * 100)
                          : 0;

                      return (
                        <div
                          key={optKey}
                          className={`p-3.5 rounded-2xl text-xs flex flex-col justify-between gap-2 ${
                            isCorrectKey
                              ? "badge-tint-emerald font-semibold shadow-sm"
                              : "edufit-surface-subtle"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono font-bold">
                              {optKey}. {q.options[optKey]}
                            </span>
                            {isCorrectKey && (
                              <span className="text-[10px] font-mono font-bold uppercase shrink-0">
                                Kunci
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono opacity-75 pt-1 border-t border-black/10 dark:border-white/10">
                            <span>Dipilih {pickedCount} Siswa</span>
                            <span>{pickedPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : filteredData.length === 0 ? (
        <div className="flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
          <div className="text-xl font-light tracking-tight">
            Tidak ada siswa yang sesuai dengan filter pencarian.
          </div>
        </div>
      ) : viewMode === "bento" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
          {filteredData.map((row, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const isComplete = row.status === "complete";
            const isPartial = row.status === "partial";

            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: Math.min(index * 0.04, 0.25),
                }}
                onClick={() => {
                  setSelectedStudent(row);
                  setModalTab(row.reflections.length > 0 ? "reflections" : "tp");
                }}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform duration-300 hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass} ${
                  isComplete ? "bento-showcase-selected" : ""
                }`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10">
                  <span
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold font-mono tracking-widest uppercase ${
                      isComplete
                        ? "badge-tint-emerald"
                        : isPartial
                        ? "badge-tint-amber"
                        : "bg-black/10 dark:bg-white/10"
                    }`}
                  >
                    KELAS {selectedClass?.grade_level} ·{" "}
                    {isComplete
                      ? "PRE & POST SELESAI"
                      : isPartial
                      ? "BARU 1 TES"
                      : "BELUM UJIAN"}
                  </span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 bg-black/5 dark:bg-white/5">
                    <ArrowUpRight size={18} strokeWidth={1.75} />
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-3 line-clamp-2">
                    {row.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {row.selisih !== null ? (
                      <span
                        className={`px-3.5 py-1 rounded-xl text-xs font-bold font-mono ${
                          row.selisih >= 0
                            ? "badge-tint-emerald"
                            : "badge-tint-rose"
                        }`}
                      >
                        Selisih:{" "}
                        {row.selisih > 0 ? `+${row.selisih}` : row.selisih} Poin
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-black/10 dark:bg-white/10">
                        Menunggu Tes Lengkap
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                        row.reflections.length > 0
                          ? "badge-tint-amber"
                          : "bg-black/10 dark:bg-white/10"
                      }`}
                    >
                      Refleksi: {row.gradedReflectionsCount}/
                      {row.reflections.length} Dinilai
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Pretest Awal
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {row.pretest !== null ? `${row.pretest}` : "—"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Posttest Akhir
                    </div>
                    <div className="text-4xl font-light font-mono leading-none text-gold-accent">
                      {row.posttest !== null ? `${row.posttest}` : "—"}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] p-8 md:p-10 overflow-hidden flex flex-col relative z-10 mb-12 edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="relative z-10 overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest font-bold border-b border-hairline opacity-55">
                  <th className="py-4 px-6">Nama Siswa</th>
                  <th className="py-4 px-6 text-center">Pretest (Tes Awal)</th>
                  <th className="py-4 px-6 text-center">
                    Posttest (Tes Akhir)
                  </th>
                  <th className="py-4 px-6 text-center">
                    Progres Kognitif (Selisih)
                  </th>
                  <th className="py-4 px-6 text-center">
                    Refleksi Unit Materi
                  </th>
                  <th className="py-4 px-6 text-right">
                    Rincian & Penilaian
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredData.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(idx * 0.025, 0.2),
                    }}
                    onClick={() => {
                      setSelectedStudent(row);
                      setModalTab(
                        row.reflections.length > 0 ? "reflections" : "tp"
                      );
                    }}
                    className="border-b border-hairline transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.025] cursor-pointer"
                  >
                    <td className="py-5 px-6 font-bold text-base">
                      {row.name}
                    </td>

                    <td className="py-5 px-6 text-center font-mono">
                      {row.pretest === null ? (
                        <span className="opacity-35">—</span>
                      ) : (
                        <span className="px-4 py-1.5 rounded-xl font-bold text-base inline-block min-w-[64px] badge-tint-sky">
                          {row.pretest}
                        </span>
                      )}
                    </td>

                    <td className="py-5 px-6 text-center font-mono">
                      {row.posttest === null ? (
                        <span className="opacity-35">—</span>
                      ) : (
                        <span className="px-4 py-1.5 rounded-xl font-bold text-base inline-block min-w-[64px] badge-tint-emerald">
                          {row.posttest}
                        </span>
                      )}
                    </td>

                    <td className="py-5 px-6 text-center font-mono">
                      {row.selisih === null ? (
                        <span className="opacity-35">—</span>
                      ) : (
                        <span
                          className={`font-bold text-xs px-4 py-1.5 rounded-xl inline-block ${
                            row.selisih > 0
                              ? "badge-tint-amber"
                              : row.selisih < 0
                              ? "badge-tint-rose"
                              : "edufit-surface-subtle"
                          }`}
                        >
                          {row.selisih > 0 ? `+${row.selisih}` : row.selisih}{" "}
                          Poin
                        </span>
                      )}
                    </td>

                    <td className="py-5 px-6 text-center font-mono">
                      <span
                        className={`font-bold text-xs px-3.5 py-1.5 rounded-xl inline-block ${
                          row.reflections.length === 0
                            ? "edufit-surface-subtle opacity-60"
                            : row.gradedReflectionsCount ===
                              row.reflections.length
                            ? "badge-tint-emerald"
                            : "badge-tint-amber"
                        }`}
                      >
                        {row.gradedReflectionsCount}/{row.reflections.length}{" "}
                        Dinilai
                      </span>
                    </td>

                    <td className="py-5 px-6 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-gold-accent hover:opacity-100">
                        Buka & Nilai <ArrowUpRight size={14} />
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KOGNITIF, CAPAIAN TP, LEMBAR JAWABAN & PENILAIAN REFLEKSI SISWA */}
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
              initial={{ scale: 0.96, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 20, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] relative z-10 shadow-2xl edufit-card-primary"
            >
              <div className="p-6 sm:p-8 border-b border-hairline flex flex-wrap justify-between items-center gap-4 shrink-0">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gold-accent block mb-1">
                    Profil Kognitif & Refleksi Siswa · {activeClassName}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                    {selectedStudent.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap p-1.5 rounded-2xl edufit-surface-subtle">
                    <button
                      type="button"
                      onClick={() => setModalTab("tp")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        modalTab === "tp" ? "seg-btn-active" : "seg-btn-idle"
                      }`}
                    >
                      Capaian TP
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("reflections")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        modalTab === "reflections"
                          ? "seg-btn-active"
                          : "seg-btn-idle"
                      }`}
                    >
                      Refleksi Materi ({selectedStudent.reflections.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("answers")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        modalTab === "answers"
                          ? "seg-btn-active"
                          : "seg-btn-idle"
                      }`}
                    >
                      Lembar Jawaban ({selectedStudent.answerSheet.length})
                    </button>
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

              <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-2xl badge-tint-sky">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-75 block mb-2">
                      Skor Pretest Awal
                    </span>
                    <span className="text-5xl font-light font-mono tracking-tighter">
                      {selectedStudent.pretest !== null
                        ? selectedStudent.pretest
                        : "—"}
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl badge-tint-emerald">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-75 block mb-2">
                      Skor Posttest Akhir
                    </span>
                    <span className="text-5xl font-light font-mono tracking-tighter">
                      {selectedStudent.posttest !== null
                        ? selectedStudent.posttest
                        : "—"}
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl telemetry-bar-gold">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-75 block mb-2">
                      Refleksi Materi Dinilai
                    </span>
                    <span className="text-5xl font-semibold font-mono tracking-tighter">
                      {selectedStudent.gradedReflectionsCount}/
                      {selectedStudent.reflections.length}
                    </span>
                  </div>
                </div>

                {modalTab === "tp" ? (
                  <div className="p-6 sm:p-8 rounded-[1.75rem] space-y-4 edufit-card-secondary">
                    <div className="flex items-center justify-between border-b border-hairline pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gold-accent block mb-1">
                          Diagnostik Kompetensi
                        </span>
                        <h3 className="text-2xl font-light tracking-tight">
                          Rincian Capaian Tujuan Pembelajaran
                        </h3>
                        <p className="text-xs opacity-55 mt-0.5">
                          Kisi-Kisi Instrumen Kognitif Kelas{" "}
                          {selectedClass?.grade_level}
                        </p>
                      </div>
                      <BookOpen size={20} className="text-gold-accent" />
                    </div>

                    <div className="space-y-3">
                      {activeTpList.map((tp, idx) => {
                        const b = selectedStudent.tpBreakdown[tp.code];
                        const hasAnswerDetail =
                          b && (b.preTotal > 0 || b.postTotal > 0);
                        const prePct =
                          b && b.preTotal > 0
                            ? Math.round((b.preCorrect / b.preTotal) * 100)
                            : null;
                        const postPct =
                          b && b.postTotal > 0
                            ? Math.round((b.postCorrect / b.postTotal) * 100)
                            : null;
                        const tpBadges = [
                          "badge-tint-amber",
                          "badge-tint-emerald",
                          "badge-tint-sky",
                          "badge-tint-violet",
                        ];

                        return (
                          <div
                            key={tp.code}
                            className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 edufit-card-primary"
                          >
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                                    tpBadges[idx % tpBadges.length]
                                  }`}
                                >
                                  {tp.code}
                                </span>
                                {tp.mappingDesc && (
                                  <span className="text-[11px] font-semibold opacity-60">
                                    {tp.mappingDesc}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium leading-snug">
                                {tp.text}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 font-mono">
                              {hasAnswerDetail ? (
                                <>
                                  <div className="px-3 py-1.5 rounded-xl badge-tint-sky text-right">
                                    <span className="text-[9px] font-bold uppercase opacity-75 block">
                                      Pretest
                                    </span>
                                    <span className="text-sm font-bold">
                                      {prePct !== null ? `${prePct}%` : "—"}
                                    </span>
                                  </div>
                                  <div className="px-3 py-1.5 rounded-xl badge-tint-emerald text-right">
                                    <span className="text-[9px] font-bold uppercase opacity-75 block">
                                      Posttest
                                    </span>
                                    <span className="text-sm font-bold">
                                      {postPct !== null ? `${postPct}%` : "—"}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold badge-tint-amber">
                                  Skor Paket:{" "}
                                  {selectedStudent.posttest ??
                                    selectedStudent.pretest ??
                                    "—"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : modalTab === "reflections" ? (
                  <div className="space-y-4">
                    {selectedStudent.reflections.length === 0 ? (
                      <div className="p-12 rounded-[1.75rem] text-center opacity-60 edufit-card-secondary">
                        Siswa ini belum mengirimkan jawaban refleksi pada unit
                        materi mana pun.
                      </div>
                    ) : (
                      selectedStudent.reflections.map((refItem) =>
                        renderReflectionGradingCard(refItem, false)
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 rounded-[1.75rem] space-y-4 edufit-card-secondary">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gold-accent block mb-1">
                          Evaluasi Pilihan Ganda
                        </span>
                        <h3 className="text-2xl font-light tracking-tight">
                          Rincian Jawaban per Butir Soal
                        </h3>
                      </div>

                      <div className="flex gap-1.5 p-1 rounded-xl edufit-card-primary">
                        {(["posttest", "pretest"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setModalAnswerFilter(t)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                              modalAnswerFilter === t
                                ? "seg-btn-active"
                                : "seg-btn-idle"
                            }`}
                          >
                            {t === "posttest" ? "Posttest" : "Pretest"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(() => {
                      const list = selectedStudent.answerSheet.filter(
                        (a) => a.evalType === modalAnswerFilter
                      );
                      if (list.length === 0) {
                        return (
                          <div className="py-12 text-center opacity-55 text-sm">
                            Belum ada rincian lembar jawaban pada sesi{" "}
                            {modalAnswerFilter.toUpperCase()}.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {list.map((ans, idx) => (
                            <div
                              key={`${ans.questionId}-${idx}`}
                              className="p-5 rounded-2xl space-y-2.5 edufit-card-primary"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase badge-tint-amber">
                                  Soal #{idx + 1} · {ans.tpCode}
                                </span>
                                <span
                                  className={`px-3 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                                    ans.isCorrect
                                      ? "badge-tint-emerald"
                                      : "badge-tint-rose"
                                  }`}
                                >
                                  {ans.isCorrect ? "Benar" : "Salah"}
                                </span>
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {ans.questionText}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
                                <div
                                  className={`p-3 rounded-xl ${
                                    ans.isCorrect
                                      ? "badge-tint-emerald"
                                      : "badge-tint-rose"
                                  }`}
                                >
                                  <span className="font-sans opacity-75 block text-[10px]">
                                    Jawaban Siswa:
                                  </span>
                                  <strong>
                                    {ans.selectedOption}. {ans.optionText}
                                  </strong>
                                </div>
                                <div className="p-3 rounded-xl badge-tint-emerald">
                                  <span className="font-sans opacity-75 block text-[10px]">
                                    Kunci Jawaban:
                                  </span>
                                  <strong>
                                    {ans.correctAnswer}. {ans.correctOptionText}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}