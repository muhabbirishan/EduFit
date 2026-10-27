// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  Edit3,
  FileCheck2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const TP_CATALOG: Record<string, string> = {
  "X-1": "Komponen Kebugaran Jasmani",
  "X-2": "Tafsir IMT & Komposisi Tubuh",
  "X-3": "Analisis Bentuk Latihan",
  "X-4": "Refleksi Respons Tubuh",
  "XI-1": "Analisis Gerak & Kecepatan",
  "XI-2": "Daya Tahan Kardiorespirasi",
  "XI-3": "Kekuatan & Daya Tahan Otot",
  "XI-4": "Evaluasi Mandiri Kebugaran",
  "XII-1": "Evaluasi TKJI & Norma",
  "XII-2": "Perancangan Program FITT",
  "XII-3": "Periodisasi & Intensitas Latihan",
  "XII-4": "Pemeliharaan Kebugaran Jangka Panjang",
};

export default function EvaluasiPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [submissionStats, setSubmissionStats] = useState<
    Record<string, { count: number; avg: number }>
  >({});
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

  // Filter Daftar Evaluasi di Bento 1
  const [selectedGrade, setSelectedGrade] = useState<number | "all">("all");
  const [selectedType, setSelectedType] = useState<
    "all" | "pretest" | "posttest"
  >("all");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<"readiness" | "post" | "pre">(
    "readiness"
  );

  // State Bank Soal Aktif (View Detail)
  const [activeEval, setActiveEval] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedTpFilter, setSelectedTpFilter] = useState<string>("ALL");

  // State Modal Paket Evaluasi
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [evalFormData, setEvalFormData] = useState({
    grade_level: 10,
    type: "pretest",
    title: "",
  });

  // State Modal Butir Soal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    learning_objective_code: "X-1",
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
  });

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      const [evalRes, scoreRes] = await Promise.all([
        supabase
          .from("master_evaluations")
          .select("*, question_bank(count)")
          .order("grade_level", { ascending: true })
          .order("type", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("student_evaluation_scores")
          .select("evaluation_id, score"),
      ]);

      if (evalRes.error) throw evalRes.error;
      const evalList = evalRes.data || [];
      setEvaluations(evalList);

      if (activeEval?.id) {
        const updatedActive = evalList.find(
          (item) => item.id === activeEval.id
        );
        if (updatedActive) setActiveEval(updatedActive);
      }

      const statMap: Record<string, { sum: number; count: number }> = {};
      (scoreRes.data || []).forEach((s: any) => {
        const evId = s.evaluation_id;
        if (!evId) return;
        if (!statMap[evId]) statMap[evId] = { sum: 0, count: 0 };
        statMap[evId].sum += Number(s.score) || 0;
        statMap[evId].count += 1;
      });

      const finalStats: Record<string, { count: number; avg: number }> = {};
      Object.entries(statMap).forEach(([k, v]) => {
        finalStats[k] = {
          count: v.count,
          avg: v.count > 0 ? Math.round(v.sum / v.count) : 0,
        };
      });
      setSubmissionStats(finalStats);
    } catch (error: any) {
      toast.error(
        "Gagal menarik data evaluasi: " + (error?.message || "Periksa koneksi")
      );
      triggerDynamicIsland(
        "Gagal Memuat Evaluasi",
        error?.message || "Periksa sambungan database.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchQuestions = async (evalId: string) => {
    if (!evalId) return;
    setIsLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from("question_bank")
        .select("*")
        .eq("evaluation_id", evalId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });
      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast.error(
        "Gagal menarik daftar soal: " + (error?.message || "Periksa koneksi")
      );
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleOpenBank = (ev: any) => {
    setActiveEval(ev);
    setQuestionSearch("");
    setSelectedTpFilter("ALL");
    fetchQuestions(ev.id);
    triggerDynamicIsland(
      `Bank Soal Dibuka: Kelas ${ev.grade_level}`,
      `${ev.title} (${String(ev.type || "").toUpperCase()})`,
      "info"
    );
  };

  const handleCloseBank = () => {
    setActiveEval(null);
    setQuestions([]);
    fetchEvaluations();
  };

  // ==========================================================================
  // CRUD PAKET EVALUASI (MASTER_EVALUATIONS)
  // ==========================================================================
  const openCreateEvalModal = () => {
    setEditingEvalId(null);
    setEvalFormData({
      grade_level: selectedGrade === "all" ? 10 : Number(selectedGrade),
      type: selectedType === "all" ? "pretest" : selectedType,
      title: "",
    });
    setIsEvalModalOpen(true);
  };

  const openEditEvalModal = (ev: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvalId(ev.id);
    setEvalFormData({
      grade_level: Number(ev.grade_level) || 10,
      type:
        String(ev.type || "pretest")
          .trim()
          .toLowerCase() === "posttest"
          ? "posttest"
          : "pretest",
      title: ev.title || "",
    });
    setIsEvalModalOpen(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalFormData.title.trim()) {
      return toast.error("Judul program evaluasi wajib diisi");
    }
    setIsSubmittingEval(true);
    try {
      const normalizedType =
        String(evalFormData.type || "pretest")
          .trim()
          .toLowerCase() === "posttest"
          ? "posttest"
          : "pretest";

      const payload = {
        grade_level: Number(evalFormData.grade_level),
        type: normalizedType,
        title: evalFormData.title.trim(),
      };

      if (editingEvalId) {
        let { data, error } = await supabase
          .from("master_evaluations")
          .update(payload)
          .eq("id", editingEvalId)
          .select("*, question_bank(count)");

        if (error) throw error;

        if (!data || data.length === 0) {
          const upsertRes = await supabase
            .from("master_evaluations")
            .upsert([{ id: editingEvalId, ...payload }], { onConflict: "id" })
            .select("*, question_bank(count)");

          if (upsertRes.error) throw upsertRes.error;
          if (!upsertRes.data || upsertRes.data.length === 0) {
            throw new Error(
              "Perubahan diblokir oleh Row Level Security (RLS) Supabase pada tabel master_evaluations."
            );
          }
          data = upsertRes.data;
        }

        const updatedRow = data[0];
        setEvaluations((prev) =>
          prev.map((item) => (item.id === editingEvalId ? updatedRow : item))
        );
        if (activeEval?.id === editingEvalId) {
          setActiveEval(updatedRow);
        }

        triggerDynamicIsland(
          "Paket Evaluasi Diperbarui",
          `${payload.title} (Kelas ${payload.grade_level}) telah disimpan.`,
          "success"
        );
      } else {
        const { data, error } = await supabase
          .from("master_evaluations")
          .insert([payload])
          .select("*, question_bank(count)");

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(
            "Penambahan paket evaluasi diblokir oleh RLS Supabase."
          );
        }

        setEvaluations((prev) => [...prev, data[0]]);
        triggerDynamicIsland(
          "Paket Evaluasi Baru Dibuat",
          `${payload.title} siap diisi butir soal.`,
          "success"
        );
      }

      setIsEvalModalOpen(false);
      await fetchEvaluations();
    } catch (err: any) {
      toast.error(
        "Gagal menyimpan program evaluasi: " +
          (err?.message || "Periksa kebijakan RLS database")
      );
      triggerDynamicIsland(
        "Gagal Menyimpan Evaluasi",
        err?.message || "Periksa izin RLS database.",
        "error"
      );
    } finally {
      setIsSubmittingEval(false);
    }
  };

  const handleDeleteEvaluation = (ev: any, e: React.MouseEvent) => {
    e.stopPropagation();
    toast("Hapus Paket Evaluasi", {
      description: `Yakin ingin menghapus "${ev.title}" beserta seluruh soal di dalamnya?`,
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            const [qRes, scoreRes] = await Promise.all([
              supabase
                .from("question_bank")
                .select("id")
                .eq("evaluation_id", ev.id),
              supabase
                .from("student_evaluation_scores")
                .select("id")
                .eq("evaluation_id", ev.id),
            ]);

            const qIds = (qRes.data || []).map((q: any) => q.id);
            const scoreIds = (scoreRes.data || []).map((s: any) => s.id);

            if (qIds.length > 0) {
              await supabase
                .from("student_answers")
                .delete()
                .in("question_id", qIds);
            }
            if (scoreIds.length > 0) {
              await supabase
                .from("student_answers")
                .delete()
                .in("student_evaluation_id", scoreIds);
              await supabase
                .from("student_evaluation_scores")
                .delete()
                .in("id", scoreIds);
            }

            const { error: qDelErr } = await supabase
              .from("question_bank")
              .delete()
              .eq("evaluation_id", ev.id);
            if (qDelErr) throw qDelErr;

            const { error } = await supabase
              .from("master_evaluations")
              .delete()
              .eq("id", ev.id);

            if (error) throw error;

            setEvaluations((prev) => prev.filter((item) => item.id !== ev.id));
            triggerDynamicIsland(
              "Paket Evaluasi Dihapus",
              `${ev.title} beserta seluruh butir soalnya telah dihapus.`,
              "info"
            );
            fetchEvaluations();
          } catch (err: any) {
            toast.error(
              "Gagal menghapus paket evaluasi: " + (err?.message || "")
            );
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  // ==========================================================================
  // CRUD BUTIR SOAL (QUESTION_BANK)
  // ==========================================================================
  const getDefaultTpCode = (grade: number) => {
    if (grade === 11) return "XI-1";
    if (grade === 12) return "XII-1";
    return "X-1";
  };

  const openAddQuestionModal = () => {
    setEditingQuestionId(null);
    setFormData({
      learning_objective_code: getDefaultTpCode(
        Number(activeEval?.grade_level || 10)
      ),
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
    });
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: any) => {
    const cleanAns = String(q.correct_answer || "A")
      .trim()
      .toUpperCase();
    setEditingQuestionId(q.id);
    setFormData({
      learning_objective_code:
        String(q.learning_objective_code || "").trim() ||
        getDefaultTpCode(Number(activeEval?.grade_level || 10)),
      question_text: q.question_text || "",
      option_a: q.option_a || "",
      option_b: q.option_b || "",
      option_c: q.option_c || "",
      option_d: q.option_d || "",
      correct_answer: ["A", "B", "C", "D"].includes(cleanAns) ? cleanAns : "A",
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEval?.id) {
      return toast.error("Paket evaluasi tidak ditemukan.");
    }
    if (!formData.question_text.trim()) {
      return toast.error("Rumusan pertanyaan wajib diisi.");
    }

    setIsSubmittingQuestion(true);
    try {
      const cleanAnswer = String(formData.correct_answer || "A")
        .trim()
        .toUpperCase();
      const validAnswer = ["A", "B", "C", "D"].includes(cleanAnswer)
        ? cleanAnswer
        : "A";

      const payload = {
        evaluation_id: activeEval.id,
        learning_objective_code:
          String(formData.learning_objective_code || "")
            .trim()
            .toUpperCase() ||
          getDefaultTpCode(Number(activeEval?.grade_level || 10)),
        question_text: formData.question_text.trim(),
        option_a: formData.option_a.trim() || "Isi manual",
        option_b: formData.option_b.trim() || "Isi manual",
        option_c: formData.option_c.trim() || "Isi manual",
        option_d: formData.option_d.trim() || "Isi manual",
        correct_answer: validAnswer,
      };

      if (editingQuestionId) {
        let { data, error } = await supabase
          .from("question_bank")
          .update(payload)
          .eq("id", editingQuestionId)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          const upsertRes = await supabase
            .from("question_bank")
            .upsert([{ id: editingQuestionId, ...payload }], {
              onConflict: "id",
            })
            .select();

          if (upsertRes.error) throw upsertRes.error;
          if (!upsertRes.data || upsertRes.data.length === 0) {
            throw new Error(
              "Perubahan soal diblokir oleh Row Level Security (RLS) Supabase pada tabel question_bank."
            );
          }
          data = upsertRes.data;
        }

        const updatedQ = data[0];
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestionId ? updatedQ : q))
        );

        await supabase
          .from("student_answers")
          .update({ is_correct: true })
          .eq("question_id", editingQuestionId)
          .eq("selected_option", validAnswer);

        await supabase
          .from("student_answers")
          .update({ is_correct: false })
          .eq("question_id", editingQuestionId)
          .neq("selected_option", validAnswer);

        triggerDynamicIsland(
          "Butir Soal Diperbarui",
          `TP ${payload.learning_objective_code} · Kunci Jawaban: Opsi ${validAnswer}`,
          "success"
        );
      } else {
        const { data, error } = await supabase
          .from("question_bank")
          .insert([payload])
          .select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(
            "Penambahan soal diblokir oleh Row Level Security (RLS) Supabase."
          );
        }

        setQuestions((prev) => [...prev, data[0]]);
        triggerDynamicIsland(
          "Butir Soal Ditambahkan",
          `TP ${payload.learning_objective_code} berhasil masuk ke Bank Soal.`,
          "success"
        );
      }

      setIsQuestionModalOpen(false);
      await fetchQuestions(activeEval.id);
      fetchEvaluations();
    } catch (err: any) {
      toast.error(
        "Gagal menyimpan soal: " +
          (err?.message || "Periksa koneksi atau izin RLS database")
      );
      triggerDynamicIsland(
        "Gagal Menyimpan Soal",
        err?.message || "Periksa kebijakan RLS database.",
        "error"
      );
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    toast("Hapus Butir Soal", {
      description: "Yakin ingin menghapus soal ini dari bank soal?",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await supabase
              .from("student_answers")
              .delete()
              .eq("question_id", id);

            const { error } = await supabase
              .from("question_bank")
              .delete()
              .eq("id", id);

            if (error) throw error;

            setQuestions((prev) => prev.filter((q) => q.id !== id));
            triggerDynamicIsland(
              "Butir Soal Dihapus",
              "Soal beserta histori jawaban terkait telah dibersihkan.",
              "info"
            );
            await fetchQuestions(activeEval.id);
            fetchEvaluations();
          } catch (err: any) {
            toast.error("Gagal menghapus soal: " + (err?.message || ""));
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  // ==========================================================================
  // KALKULASI METRIK ANALITIK
  // ==========================================================================
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((ev) => {
      const matchGrade =
        selectedGrade === "all" ||
        Number(ev.grade_level) === Number(selectedGrade);
      const matchType =
        selectedType === "all" ||
        String(ev.type || "").toLowerCase() === selectedType;
      return matchGrade && matchType;
    });
  }, [evaluations, selectedGrade, selectedType]);

  const uniqueTpCodesInBank = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      const code = String(q.learning_objective_code || "").trim();
      if (code) set.add(code);
    });
    return Array.from(set);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const matchTp =
        selectedTpFilter === "ALL" ||
        String(item.learning_objective_code || "").trim() === selectedTpFilter;
      if (!matchTp) return false;
      if (!questionSearch.trim()) return true;
      const q = questionSearch.toLowerCase();
      return (
        String(item.question_text || "").toLowerCase().includes(q) ||
        String(item.learning_objective_code || "").toLowerCase().includes(q) ||
        String(item.option_a || "").toLowerCase().includes(q) ||
        String(item.option_b || "").toLowerCase().includes(q) ||
        String(item.option_c || "").toLowerCase().includes(q) ||
        String(item.option_d || "").toLowerCase().includes(q)
      );
    });
  }, [questions, selectedTpFilter, questionSearch]);

  const totalQuestionsAll = useMemo(() => {
    return evaluations.reduce(
      (acc, ev) => acc + (Number(ev.question_bank?.[0]?.count) || 0),
      0
    );
  }, [evaluations]);

  const totalSubmissionsAll = useMemo(() => {
    return Object.values(submissionStats).reduce((acc, s) => acc + s.count, 0);
  }, [submissionStats]);

  const { avgPretestGlobal, avgPosttestGlobal } = useMemo(() => {
    let preSum = 0,
      preCnt = 0,
      postSum = 0,
      postCnt = 0;
    evaluations.forEach((ev) => {
      const st = submissionStats[ev.id];
      if (st && st.count > 0) {
        if (ev.type === "pretest") {
          preSum += st.avg * st.count;
          preCnt += st.count;
        } else if (ev.type === "posttest") {
          postSum += st.avg * st.count;
          postCnt += st.count;
        }
      }
    });
    return {
      avgPretestGlobal: preCnt > 0 ? Math.round(preSum / preCnt) : 0,
      avgPosttestGlobal: postCnt > 0 ? Math.round(postSum / postCnt) : 0,
    };
  }, [evaluations, submissionStats]);

  const totalPretestCount = useMemo(
    () => evaluations.filter((e) => e.type === "pretest").length,
    [evaluations]
  );
  const totalPosttestCount = useMemo(
    () => evaluations.filter((e) => e.type === "posttest").length,
    [evaluations]
  );

  const bankReadinessPct = useMemo(() => {
    if (evaluations.length === 0) return 0;
    const idealTotal = evaluations.length * 25;
    return Math.min(100, Math.round((totalQuestionsAll / idealTotal) * 100));
  }, [evaluations.length, totalQuestionsAll]);

  const handleExportEvaluasiCSV = () => {
    if (activeEval) {
      const rows = [
        [
          "No",
          "Kode TP",
          "Pertanyaan",
          "Opsi A",
          "Opsi B",
          "Opsi C",
          "Opsi D",
          "Kunci Jawaban",
        ],
        ...questions.map((q, idx) => [
          idx + 1,
          `"${q.learning_objective_code || ""}"`,
          `"${String(q.question_text || "").replace(/"/g, '""')}"`,
          `"${String(q.option_a || "").replace(/"/g, '""')}"`,
          `"${String(q.option_b || "").replace(/"/g, '""')}"`,
          `"${String(q.option_c || "").replace(/"/g, '""')}"`,
          `"${String(q.option_d || "").replace(/"/g, '""')}"`,
          `"${String(q.correct_answer || "A").trim()}"`,
        ]),
      ];
      const csvContent =
        "data:text/csv;charset=utf-8," +
        rows.map((e) => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute(
        "download",
        `Bank_Soal_${activeEval.title.replace(/\s+/g, "_")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerDynamicIsland(
        "Bank Soal Diekspor ke CSV",
        `${questions.length} butir soal dari ${activeEval.title} telah diunduh.`,
        "success"
      );
      return;
    }

    const rows = [
      [
        "Judul Paket Evaluasi",
        "Jenjang Kelas",
        "Jenis Ujian",
        "Jumlah Soal",
        "Partisipasi Siswa",
        "Rata-rata Skor",
      ],
      ...evaluations.map((ev) => {
        const qCount = ev.question_bank?.[0]?.count || 0;
        const st = submissionStats[ev.id] || { count: 0, avg: 0 };
        return [
          `"${ev.title || ""}"`,
          `Kelas ${ev.grade_level}`,
          ev.type,
          qCount,
          st.count,
          `${st.avg}%`,
        ];
      }),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Rekap_Evaluasi_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Rekap Evaluasi Diunduh",
      `Laporan CSV untuk ${evaluations.length} paket evaluasi berhasil diekspor.`,
      "success"
    );
  };

  if (!mounted) return null;

  // Komponen Dynamic Island Reusable di dalam halaman
  const renderDynamicIsland = () => (
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
  );

  // ==========================================================================
  // VIEW 1: DETAIL MANAJEMEN BANK SOAL
  // ==========================================================================
  if (activeEval) {
    const tpSuggestions =
      Number(activeEval.grade_level) === 10
        ? ["X-1", "X-2", "X-3", "X-4"]
        : Number(activeEval.grade_level) === 11
        ? ["XI-1", "XI-2", "XI-3", "XI-4"]
        : ["XII-1", "XII-2", "XII-3", "XII-4"];

    const activeEvalStat = submissionStats[activeEval.id] || {
      count: 0,
      avg: 0,
    };

    return (
      <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
        {renderDynamicIsland()}

        {/* ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                type="button"
                onClick={handleCloseBank}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-card-primary"
              >
                <ArrowLeft size={15} /> Kembali ke Daftar Evaluasi
              </button>

              <button
                type="button"
                onClick={handleExportEvaluasiCSV}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-surface-subtle"
              >
                <Download size={14} /> Ekspor Soal CSV
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-3 opacity-60">
              <span className="font-mono text-gold-accent">
                00 / INSPEKSI BANK SOAL
              </span>
              <span>—</span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Database size={14} /> KELAS {activeEval.grade_level} ·{" "}
                {String(activeEval.type || "").toUpperCase()}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
              {activeEval.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
            <div>
              <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
                {isLoadingQuestions ? "—" : questions.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
                01 / Butir Soal
              </div>
            </div>

            <div>
              <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
                {uniqueTpCodesInBank.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
                02 / Kode TP Terpetakan
              </div>
            </div>

            <div>
              <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
                {activeEvalStat.avg}%
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
                03 / Rata-rata ({activeEvalStat.count} Siswa)
              </div>
            </div>
          </div>
        </div>

        {/* ZONA 2: TOOLBAR FILTER KODE TP, PENCARIAN & TAMBAH SOAL */}
        <div className="rounded-[2rem] p-6 md:p-8 mb-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 relative z-10 edufit-card-primary">
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
            <button
              type="button"
              onClick={() => setSelectedTpFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer ${
                selectedTpFilter === "ALL" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              SEMUA TP ({questions.length})
            </button>
            {uniqueTpCodesInBank.map((tp) => {
              const active = selectedTpFilter === tp;
              const cnt = questions.filter(
                (q) => String(q.learning_objective_code || "").trim() === tp
              ).length;
              return (
                <button
                  key={tp}
                  type="button"
                  onClick={() => {
                    setSelectedTpFilter(tp);
                    triggerDynamicIsland(
                      `Filter Kode TP: ${tp}`,
                      TP_CATALOG[tp] || `Menampilkan ${cnt} butir soal.`,
                      "info"
                    );
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer ${
                    active ? "seg-btn-active" : "seg-btn-idle"
                  }`}
                >
                  {tp} ({cnt})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Cari teks pertanyaan atau opsi..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold outline-none edufit-surface-subtle"
              />
            </div>

            <button
              type="button"
              onClick={openAddQuestionModal}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm btn-forest-emerald"
            >
              <Plus size={16} /> Tambah Butir Soal
            </button>
          </div>
        </div>

        {/* ZONA 3: GRID KARTU BUTIR SOAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {isLoadingQuestions ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 rounded-[2rem] animate-pulse edufit-surface-subtle"
              />
            ))
          ) : filteredQuestions.length === 0 ? (
            <div className="col-span-full p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xl font-light">
                Belum ada butir soal yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q, index) => {
              const normalizedCorrect = String(q.correct_answer || "A")
                .trim()
                .toUpperCase();
              const tpCode = String(
                q.learning_objective_code || "UMUM"
              ).trim();

              return (
                <div
                  key={q.id}
                  className="p-8 rounded-[2rem] flex flex-col justify-between gap-6 transition-transform hover:-translate-y-0.5 relative overflow-hidden group edufit-card-primary"
                >
                  <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl text-xs font-bold font-mono flex items-center justify-center telemetry-bar-forest text-gold-accent">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <span className="text-xs font-bold font-mono uppercase tracking-widest block">
                            TP {tpCode}
                          </span>
                          {TP_CATALOG[tpCode] && (
                            <span className="text-[11px] opacity-55 block">
                              {TP_CATALOG[tpCode]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditQuestionModal(q)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer edufit-surface-subtle hover:opacity-80"
                          title="Edit Soal"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
                          title="Hapus Soal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="text-lg font-medium leading-relaxed mb-6">
                      {q.question_text}
                    </p>

                    {/* 4 Opsi Jawaban A, B, C, D */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {["A", "B", "C", "D"].map((optKey) => {
                        const isCorrect = normalizedCorrect === optKey;
                        const optVal =
                          q[`option_${optKey.toLowerCase()}`] || "—";
                        return (
                          <div
                            key={optKey}
                            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                              isCorrect
                                ? "badge-tint-emerald font-semibold"
                                : "edufit-surface-subtle"
                            }`}
                          >
                            <span
                              className={`font-mono font-bold shrink-0 ${
                                isCorrect ? "text-emerald-accent" : "opacity-60"
                              }`}
                            >
                              {optKey}.
                            </span>
                            <span className="leading-relaxed break-words">
                              {optVal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-hairline flex items-center justify-between text-xs font-bold font-mono uppercase tracking-widest">
                    <span className="opacity-55">
                      KUNCI JAWABAN TERVERIFIKASI
                    </span>
                    <span className="text-emerald-accent flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> OPSI {normalizedCorrect}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL TAMBAH / EDIT BUTIR SOAL */}
        <AnimatePresence>
          {isQuestionModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                onClick={() => setIsQuestionModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
              >
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
                >
                  <X size={18} />
                </button>

                <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                  KONFIGURASI INSTRUMEN · KELAS {activeEval.grade_level}
                </span>
                <h2 className="text-3xl font-light tracking-tight mb-6">
                  {editingQuestionId ? "Edit" : "Tambah"}{" "}
                  <span className="font-semibold">Butir Soal</span>
                </h2>

                <form onSubmit={handleSaveQuestion} className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2.5">
                      Kode Tujuan Pembelajaran (TP)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {tpSuggestions.map((code) => {
                        const active =
                          formData.learning_objective_code
                            .trim()
                            .toUpperCase() === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                learning_objective_code: code,
                              })
                            }
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer ${
                              active
                                ? "seg-btn-active"
                                : "edufit-surface-subtle"
                            }`}
                          >
                            {code}
                          </button>
                        );
                      })}
                      <input
                        required
                        type="text"
                        value={formData.learning_objective_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            learning_objective_code: e.target.value,
                          })
                        }
                        placeholder="Kode TP..."
                        className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono w-32 focus:outline-none text-center edufit-surface-subtle"
                      />
                    </div>
                    {TP_CATALOG[
                      formData.learning_objective_code.trim().toUpperCase()
                    ] && (
                      <p className="text-xs opacity-60 mt-2 font-medium">
                        Fokus Materi:{" "}
                        {
                          TP_CATALOG[
                            formData.learning_objective_code
                              .trim()
                              .toUpperCase()
                          ]
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                      Rumusan Pertanyaan
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.question_text}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          question_text: e.target.value,
                        })
                      }
                      placeholder="Tuliskan pertanyaan evaluasi secara jelas..."
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-y edufit-surface-subtle"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["a", "b", "c", "d"].map((opt) => (
                      <div key={opt}>
                        <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                          Pilihan Opsi {opt.toUpperCase()}
                        </label>
                        <input
                          required
                          type="text"
                          value={(formData as any)[`option_${opt}`]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [`option_${opt}`]: e.target.value,
                            })
                          }
                          placeholder={`Jawaban opsi ${opt.toUpperCase()}...`}
                          className="w-full p-3.5 rounded-2xl text-sm focus:outline-none edufit-surface-subtle"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2.5">
                      Pilih Kunci Jawaban Benar
                    </label>
                    <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                      {["A", "B", "C", "D"].map((ans) => {
                        const active =
                          String(formData.correct_answer || "A")
                            .trim()
                            .toUpperCase() === ans;
                        return (
                          <button
                            key={ans}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, correct_answer: ans })
                            }
                            className={`py-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                              active ? "seg-btn-active" : "seg-btn-idle"
                            }`}
                          >
                            OPSI {ans}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingQuestion}
                    className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-emerald"
                  >
                    {isSubmittingQuestion
                      ? "Menyimpan..."
                      : "Simpan Soal ke Bank Soal"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: DAFTAR PROGRAM EVALUASI UTAMA
  // ==========================================================================
  const kognitifGain = avgPosttestGlobal - avgPretestGlobal;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {renderDynamicIsland()}

      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">
              00 / KURIKULUM KOGNITIF
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={15} />
              {selectedGrade === "all"
                ? "Manajemen Instrumen Kelas 10, 11 & 12"
                : `Fokus Instrumen Kognitif Kelas ${selectedGrade}`}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Evaluasi & <br />
            <span className="font-semibold">Bank Soal</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : evaluations.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              01 / Paket Evaluasi
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : totalQuestionsAll}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              02 / Total Butir Soal
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : totalSubmissionsAll}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              03 / Partisipasi Ujian
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI EVALUASI
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Rata-rata Pretest */}
        <button
          type="button"
          onClick={() => {
            const next = selectedType === "pretest" ? "all" : "pretest";
            setSelectedType(next);
            triggerDynamicIsland(
              next === "pretest"
                ? "Filter Aktif: Pretest"
                : "Filter Jenis Direset",
              `Rata-rata nasional Pretest: ${avgPretestGlobal}% (${totalPretestCount} paket).`,
              "info"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Pretest</span>
            <span className="font-mono">{totalPretestCount} PAKET</span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              selectedType === "pretest"
                ? "telemetry-bar-forest-active"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${avgPretestGlobal}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Tes Awal
            </span>
          </div>
        </button>

        {/* Bar 2: Rata-rata Posttest */}
        <button
          type="button"
          onClick={() => {
            const next = selectedType === "posttest" ? "all" : "posttest";
            setSelectedType(next);
            triggerDynamicIsland(
              next === "posttest"
                ? "Filter Aktif: Posttest"
                : "Filter Jenis Direset",
              `Rata-rata nasional Posttest: ${avgPosttestGlobal}% (${totalPosttestCount} paket).`,
              "success"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Posttest</span>
            <span className="font-mono">{totalPosttestCount} PAKET</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${avgPosttestGlobal}%`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {kognitifGain >= 0
                ? `+${kognitifGain} PT`
                : `${kognitifGain} PT`}
            </span>
          </div>
        </button>

        {/* Bar 3: Striped Track Murni */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kesiapan Bank Soal</span>
            <span className="font-mono">{totalQuestionsAll} BUTIR SOAL</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${bankReadinessPct}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              Kapasitas Aktif
            </span>
          </div>
        </div>

        {/* Bar 4: Total Sesi Pengerjaan */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Total Ujian</span>
            <span className="font-mono">TEREKAM</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${totalSubmissionsAll} Sesi`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (POLKADOT + GRID MILIMETER + DIAGONAL)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): KENDALI & FILTER PAKET EVALUASI */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55">
                <span className="font-mono">01 /</span>
                <SlidersHorizontal size={14} />
                <span>Filter Instrumen</span>
              </div>
              <button
                type="button"
                onClick={handleExportEvaluasiCSV}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Unduh Rekap Evaluasi CSV"
              >
                <Download size={15} />
              </button>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Filter Evaluasi
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih angkatan kelas dan jenis evaluasi (Pretest / Posttest).
            </p>

            {/* Segmented Filter Kelas */}
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[
                { val: "all", label: "Semua" },
                { val: 10, label: "Kelas 10" },
                { val: 11, label: "Kelas 11" },
                { val: 12, label: "Kelas 12" },
              ].map((g) => {
                const active = selectedGrade === g.val;
                return (
                  <button
                    key={String(g.val)}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(g.val as any);
                      triggerDynamicIsland(
                        g.val === "all"
                          ? "Filter Kelas: Semua Angkatan"
                          : `Filter Kelas ${g.val} Aktif`,
                        "Menyaring daftar paket evaluasi di bawah.",
                        "info"
                      );
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Bottom-Bordered Custom Dropdown Tipe Evaluasi */}
            <div className="relative w-full mb-6" ref={typeDropdownRef}>
              <div
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isTypeDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {selectedType === "all"
                    ? "Semua Jenis Evaluasi"
                    : selectedType === "pretest"
                    ? "Pretest (Tes Awal)"
                    : "Posttest (Tes Akhir)"}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isTypeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden edufit-dropdown-menu"
                  >
                    {[
                      { k: "all", l: "Semua Jenis Evaluasi" },
                      { k: "pretest", l: "Pretest (Evaluasi Awal)" },
                      { k: "posttest", l: "Posttest (Evaluasi Akhir)" },
                    ].map((opt) => (
                      <div
                        key={opt.k}
                        onClick={() => {
                          setSelectedType(opt.k as any);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                          selectedType === opt.k ? "text-gold-accent" : ""
                        }`}
                      >
                        {opt.l}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateEvalModal}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md relative z-10 btn-forest-emerald"
          >
            <Plus size={16} strokeWidth={2.5} /> Buat Paket Evaluasi Baru
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): GRAFIK BATANG VERTIKAL BERTITIK PER PAKET UJIAN */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">02 /</span>
              <BrainCircuit size={15} />
              <span>Distribusi Soal & Skor</span>
            </div>
            <span className="text-[11px] font-bold font-mono opacity-55">
              KLIK BATANG
            </span>
          </div>

          <div className="my-4 flex items-end justify-between gap-3 relative z-10">
            <div className="flex items-end gap-3">
              <div className="text-6xl font-light font-mono tracking-tighter leading-none">
                {isLoading ? "—" : `${avgPosttestGlobal}%`}
              </div>
              <div className="text-sm font-semibold opacity-55 mb-1">
                Rata-rata Posttest
              </div>
            </div>

            {kognitifGain !== 0 && (
              <div className="flex items-center gap-1 text-xs font-bold font-mono uppercase tracking-widest text-emerald-accent mb-1">
                <TrendingUp size={15} />
                {kognitifGain > 0 ? `+${kognitifGain}` : kognitifGain} PT
              </div>
            )}
          </div>

          {(() => {
            const bars = evaluations.slice(0, 6);
            const maxQ = Math.max(
              1,
              ...bars.map((e) => Number(e.question_bank?.[0]?.count) || 0)
            );

            return (
              <div
                className="grid gap-3 items-end pt-4 h-44 relative z-10"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    bars.length
                  )}, minmax(0, 1fr))`,
                }}
              >
                {bars.map((ev) => {
                  const qCnt = Number(ev.question_bank?.[0]?.count) || 0;
                  const st = submissionStats[ev.id] || { count: 0, avg: 0 };
                  const heightPct =
                    st.avg > 0 ? st.avg : Math.round((qCnt / maxQ) * 100);
                  const isPost = ev.type === "posttest";
                  const shortCode = `${ev.grade_level}${isPost ? "Po" : "Pr"}`;
                  const fillClass = isPost
                    ? "chart-fill-gold"
                    : "chart-fill-primary";

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => handleOpenBank(ev)}
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${ev.title}: ${qCnt} Soal · Rata-rata ${st.avg}%`}
                    >
                      <span className="text-[11px] font-bold font-mono opacity-80">
                        {st.avg > 0 ? `${st.avg}%` : `${qCnt}s`}
                      </span>
                      <div className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div
                          className={`w-full rounded-full transition-all duration-500 group-hover:scale-y-105 ${fillClass}`}
                          style={{
                            height: `${Math.max(
                              heightPct > 0 ? 18 : 8,
                              heightPct
                            )}%`,
                          }}
                        />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                      <span className="text-[10px] font-bold font-mono opacity-65 truncate max-w-full">
                        {shortCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): KESIAPAN BANK SOAL */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">03 /</span>
              <Activity size={15} />
              <span>Indeks Bank Soal</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "readiness", label: "Kapasitas" },
                { key: "post", label: "Posttest" },
                { key: "pre", label: "Pretest" },
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

          {(() => {
            const gaugeValue =
              gaugeMode === "readiness"
                ? `${bankReadinessPct}%`
                : gaugeMode === "post"
                ? `${avgPosttestGlobal}%`
                : `${avgPretestGlobal}%`;

            const gaugeLabel =
              gaugeMode === "readiness"
                ? "Kapasitas Bank Soal"
                : gaugeMode === "post"
                ? "Rata-rata Skor Posttest"
                : "Rata-rata Skor Pretest";

            const gaugePct =
              gaugeMode === "readiness"
                ? bankReadinessPct
                : gaugeMode === "post"
                ? avgPosttestGlobal
                : avgPretestGlobal;

            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset =
              circumference - (Math.max(10, gaugePct) / 100) * circumference;

            return (
              <div className="relative flex items-center justify-center my-2 z-10">
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
                      gaugeMode === "post"
                        ? "gauge-circle-emerald"
                        : "gauge-circle-gold"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                    {isLoading ? "—" : gaugeValue}
                  </span>
                  <span className="text-[11px] font-medium opacity-60 mt-1.5 leading-tight">
                    {gaugeLabel}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="relative z-10">
            <div className="h-2.5 w-full rounded-full flex overflow-hidden mb-3 chart-track-pill">
              {evaluations.length > 0 && (
                <>
                  <div
                    className="h-full chart-fill-emerald"
                    style={{
                      width: `${
                        (totalPretestCount / evaluations.length) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full chart-fill-gold"
                    style={{
                      width: `${
                        (totalPosttestCount / evaluations.length) * 100
                      }%`,
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-2 border-t border-hairline">
              <span>Pretest ({totalPretestCount})</span>
              <span>Posttest ({totalPosttestCount})</span>
              <span>{totalQuestionsAll} Soal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: GRID KARTU BESAR PAKET EVALUASI (PASTEL LIGHT / DEEP FOREST DARK)
         ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">
            04 / DIREKTORI INSTRUMEN UJIAN
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Daftar Paket Evaluasi ({filteredEvaluations.length})
          </h3>
          <p className="text-xs font-medium opacity-55 mt-1">
            Klik kartu paket evaluasi untuk membuka dan mengelola butir soal di
            dalam Bank Soal.
          </p>
        </div>

        {(selectedGrade !== "all" || selectedType !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSelectedGrade("all");
              setSelectedType("all");
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer btn-forest-gold"
          >
            Tampilkan Semua Paket
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[300px] rounded-[2rem] animate-pulse edufit-surface-subtle"
            />
          ))
        ) : filteredEvaluations.length === 0 ? (
          <div className="xl:col-span-3 p-14 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
            <p className="text-xl font-light">
              Tidak ada paket evaluasi pada filter ini.
            </p>
          </div>
        ) : (
          filteredEvaluations.map((ev, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const qCount = ev.question_bank?.[0]?.count || 0;
            const subStat = submissionStats[ev.id] || { count: 0, avg: 0 };

            return (
              <div
                key={ev.id}
                onClick={() => handleOpenBank(ev)}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[310px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass}`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                    KELAS {ev.grade_level} ·{" "}
                    {String(ev.type || "").toUpperCase()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditEvalModal(ev, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Edit Paket Evaluasi"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEvaluation(ev, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
                      title="Hapus Paket Evaluasi"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
                      <ArrowUpRight size={18} strokeWidth={1.75} />
                    </div>
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-2">
                    {ev.title}
                  </div>
                  <p className="text-xs font-medium opacity-65">
                    Dikerjakan oleh {subStat.count} siswa · Klik untuk buka Bank
                    Soal
                  </p>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Kapasitas Bank
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {qCount}{" "}
                      <span className="text-sm font-sans font-medium opacity-60">
                        Soal
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Skor Rata-rata
                    </div>
                    <div className="text-4xl font-light font-mono leading-none">
                      {subStat.avg}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL BUAT / EDIT PAKET EVALUASI */}
      <AnimatePresence>
        {isEvalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsEvalModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                MANAJEMEN PAKET UJIAN
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-8">
                {editingEvalId ? "Edit" : "Buat"}{" "}
                <span className="font-semibold">Paket Evaluasi</span>
              </h2>

              <form onSubmit={handleSaveEvaluation} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Jenjang Kelas
                  </label>
                  <div className="flex gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                    {[10, 11, 12].map((g) => {
                      const active = Number(evalFormData.grade_level) === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setEvalFormData({
                              ...evalFormData,
                              grade_level: g,
                            })
                          }
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active ? "seg-btn-active" : "seg-btn-idle"
                          }`}
                        >
                          Kelas {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Jenis Evaluasi
                  </label>
                  <div className="flex gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                    {[
                      { key: "pretest", label: "Pretest (Tes Awal)" },
                      { key: "posttest", label: "Posttest (Tes Akhir)" },
                    ].map((t) => {
                      const active = evalFormData.type === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() =>
                            setEvalFormData({ ...evalFormData, type: t.key })
                          }
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active ? "seg-btn-active" : "seg-btn-idle"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Judul Paket Evaluasi
                  </label>
                  <input
                    required
                    type="text"
                    value={evalFormData.title}
                    onChange={(e) =>
                      setEvalFormData({
                        ...evalFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Contoh: Evaluasi Kebugaran Jasmani Kelas X"
                    className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEval}
                  className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-emerald"
                >
                  {isSubmittingEval ? "Menyimpan..." : "Simpan Paket Evaluasi"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}