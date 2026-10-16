// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  Edit3,
  FileCheck2,
  Layers,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function EvaluasiPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [submissionStats, setSubmissionStats] = useState<
    Record<string, { count: number; avg: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);

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
          .order("type", { ascending: false }),
        supabase
          .from("student_evaluation_scores")
          .select("evaluation_id, score"),
      ]);

      if (evalRes.error) throw evalRes.error;
      setEvaluations(evalRes.data || []);

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
      toast.error("Gagal menarik data evaluasi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchQuestions = async (evalId: string) => {
    setIsLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from("question_bank")
        .select("*")
        .eq("evaluation_id", evalId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast.error("Gagal menarik daftar soal");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleOpenBank = (ev: any) => {
    setActiveEval(ev);
    setQuestionSearch("");
    setSelectedTpFilter("ALL");
    fetchQuestions(ev.id);
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
      grade_level: selectedGrade === "all" ? 10 : selectedGrade,
      type: "pretest",
      title: "",
    });
    setIsEvalModalOpen(true);
  };

  const openEditEvalModal = (ev: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvalId(ev.id);
    setEvalFormData({
      grade_level: Number(ev.grade_level) || 10,
      type: ev.type || "pretest",
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
      const payload = {
        grade_level: Number(evalFormData.grade_level),
        type: evalFormData.type,
        title: evalFormData.title.trim(),
      };
      if (editingEvalId) {
        const { error } = await supabase
          .from("master_evaluations")
          .update(payload)
          .eq("id", editingEvalId);
        if (error) throw error;
        toast.success("Program evaluasi berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("master_evaluations")
          .insert([payload]);
        if (error) throw error;
        toast.success("Program evaluasi baru berhasil dibuat!");
      }
      setIsEvalModalOpen(false);
      fetchEvaluations();
    } catch (err: any) {
      toast.error("Gagal menyimpan program evaluasi");
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
          await supabase
            .from("question_bank")
            .delete()
            .eq("evaluation_id", ev.id);
          const { error } = await supabase
            .from("master_evaluations")
            .delete()
            .eq("id", ev.id);
          if (error) {
            toast.error("Gagal menghapus paket evaluasi");
          } else {
            toast.success("Paket evaluasi dihapus");
            fetchEvaluations();
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
    setEditingQuestionId(q.id);
    setFormData({
      learning_objective_code: q.learning_objective_code || "X-1",
      question_text: q.question_text || "",
      option_a: q.option_a || "",
      option_b: q.option_b || "",
      option_c: q.option_c || "",
      option_d: q.option_d || "",
      correct_answer: q.correct_answer || "A",
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuestion(true);
    try {
      const payload = {
        ...formData,
        learning_objective_code: formData.learning_objective_code
          .trim()
          .toUpperCase(),
        evaluation_id: activeEval.id,
      };
      if (editingQuestionId) {
        const { error } = await supabase
          .from("question_bank")
          .update(payload)
          .eq("id", editingQuestionId);
        if (error) throw error;
        toast.success("Butir soal berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("question_bank")
          .insert([payload]);
        if (error) throw error;
        toast.success("Butir soal baru berhasil ditambahkan!");
      }
      fetchQuestions(activeEval.id);
      setIsQuestionModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan soal");
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
          await supabase.from("question_bank").delete().eq("id", id);
          toast.success("Soal berhasil dihapus");
          fetchQuestions(activeEval.id);
        },
      },
      cancel: { label: "Batal" },
    });
  };

  // ==========================================================================
  // KALKULASI METRIK ANALITIK MASTERPIECE
  // ==========================================================================
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((ev) => {
      const matchGrade =
        selectedGrade === "all" || Number(ev.grade_level) === selectedGrade;
      const matchType = selectedType === "all" || ev.type === selectedType;
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
        String(item.option_b || "").toLowerCase().includes(q)
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

  // Target ideal: 30 soal per paket evaluasi
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
          `"${q.correct_answer || "A"}"`,
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
      toast.success("Daftar soal berhasil diekspor ke CSV!");
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
    toast.success("Rekapitulasi evaluasi berhasil diunduh!");
  };

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

  if (!mounted) return null;

  // ==========================================================================
  // VIEW 1: DETAIL MANAJEMEN BANK SOAL (THE MASTERPIECE ADMINISTRATOR)
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
      <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                type="button"
                onClick={handleCloseBank}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: isDark ? "#111111" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                <ArrowLeft size={15} /> Kembali ke Daftar Evaluasi
              </button>

              <button
                type="button"
                onClick={handleExportEvaluasiCSV}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: isDark ? "#111111" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                <Download size={14} /> Ekspor Soal CSV
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-3 opacity-50">
              <Database size={16} /> Bank Soal Kelas {activeEval.grade_level} •{" "}
              {activeEval.type.toUpperCase()}
            </div>

            <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
              {activeEval.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
            <div>
              <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
                {isLoadingQuestions ? "—" : questions.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                Butir Soal
              </div>
            </div>

            <div>
              <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
                {uniqueTpCodesInBank.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                Kode TP Terpetakan
              </div>
            </div>

            <div>
              <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
                {activeEvalStat.avg}%
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                Rata-rata ({activeEvalStat.count} Siswa)
              </div>
            </div>
          </div>
        </div>

        {/* ZONA 2: TOOLBAR FILTER KODE TP, PENCARIAN & TAMBAH SOAL */}
        <div
          className="rounded-[2.5rem] p-6 md:p-8 border mb-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 relative z-10 shadow-sm"
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTpFilter("ALL")}
              className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
              style={{
                backgroundColor:
                  selectedTpFilter === "ALL" ? "#facc15" : "transparent",
                color: selectedTpFilter === "ALL" ? "#000" : "inherit",
                opacity: selectedTpFilter === "ALL" ? 1 : 0.55,
              }}
            >
              Semua TP ({questions.length})
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
                  onClick={() => setSelectedTpFilter(tp)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                  style={{
                    backgroundColor: active ? "#facc15" : "transparent",
                    color: active ? "#000" : "inherit",
                    opacity: active ? 1 : 0.55,
                  }}
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
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold outline-none border"
                style={{
                  backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              />
            </div>

            <button
              type="button"
              onClick={openAddQuestionModal}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer text-white shadow-sm"
              style={{ backgroundColor: "#10b981" }}
            >
              <Plus size={16} /> Tambah Butir Soal
            </button>
          </div>
        </div>

        {/* ZONA 3: GRID KARTU BUTIR SOAL (BENTO MASTERPIECE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {isLoadingQuestions ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 rounded-[2.5rem] animate-pulse"
                style={{ backgroundColor: "var(--ref-card-subtle)" }}
              />
            ))
          ) : filteredQuestions.length === 0 ? (
            <div
              className="col-span-full p-16 text-center rounded-[2.5rem] border border-dashed opacity-50"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.2)",
              }}
            >
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xl font-light">
                Belum ada butir soal yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q, index) => (
              <div
                key={q.id}
                className="p-8 rounded-[2.5rem] border flex flex-col justify-between gap-6 transition-transform hover:-translate-y-0.5 relative overflow-hidden group shadow-sm"
                style={{
                  backgroundColor: isDark ? "#111111" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "radial-gradient(currentColor 2px, transparent 2px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-2xl text-xs font-bold flex items-center justify-center"
                        style={{
                          backgroundColor: "var(--ref-dark-panel)",
                          color: "#facc15",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                        Kode TP: {q.learning_objective_code || "UMUM"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditQuestionModal(q)}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.05)",
                        }}
                        title="Edit Soal"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
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
                      const isCorrect =
                        String(q.correct_answer || "A").toUpperCase() ===
                        optKey;
                      const optVal =
                        q[`option_${optKey.toLowerCase()}`] || "—";
                      return (
                        <div
                          key={optKey}
                          className="p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border"
                          style={{
                            backgroundColor: isCorrect
                              ? "rgba(16, 185, 129, 0.12)"
                              : isDark
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.02)",
                            borderColor: isCorrect
                              ? "rgba(16, 185, 129, 0.4)"
                              : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.06)",
                          }}
                        >
                          <span
                            className={`font-extrabold shrink-0 ${
                              isCorrect ? "text-emerald-500" : "opacity-60"
                            }`}
                          >
                            {optKey}.
                          </span>
                          <span className="font-medium leading-relaxed break-words">
                            {optVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="relative z-10 pt-4 border-t flex items-center justify-between text-xs font-bold uppercase tracking-widest"
                  style={{
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                  }}
                >
                  <span className="opacity-50">Kunci Jawaban Terverifikasi</span>
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Opsi {q.correct_answer}
                  </span>
                </div>
              </div>
            ))
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsQuestionModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                style={{
                  backgroundColor: isDark ? "#141414" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X size={20} />
                </button>

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
                          formData.learning_objective_code.toUpperCase() ===
                          code;
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
                            className="px-4 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active
                                ? "#facc15"
                                : isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                              color: active ? "#000" : "inherit",
                            }}
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
                        className="px-4 py-2.5 rounded-full text-xs font-bold border w-32 focus:outline-none bg-transparent text-center"
                        style={{
                          borderColor: isDark
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(0,0,0,0.15)",
                        }}
                      />
                    </div>
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
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-y border"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["a", "b", "c", "d"].map((opt) => (
                      <div key={opt}>
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
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
                          className="w-full p-3.5 rounded-2xl text-sm focus:outline-none border"
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
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2.5">
                      Pilih Kunci Jawaban Benar
                    </label>
                    <div
                      className="grid grid-cols-4 gap-2 p-1.5 rounded-full"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      {["A", "B", "C", "D"].map((ans) => {
                        const active = formData.correct_answer === ans;
                        return (
                          <button
                            key={ans}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, correct_answer: ans })
                            }
                            className="py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
                            style={{
                              backgroundColor: active
                                ? "#facc15"
                                : "transparent",
                              color: active ? "#000" : "inherit",
                            }}
                          >
                            Opsi {ans}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingQuestion}
                    className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer text-white shadow-md"
                    style={{ backgroundColor: "#10b981" }}
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
  // VIEW 2: DAFTAR PROGRAM EVALUASI UTAMA (THE MASTERPIECE ADMINISTRATOR)
  // ==========================================================================
  const kognitifGain = avgPosttestGlobal - avgPretestGlobal;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <FileCheck2 size={16} />{" "}
            {selectedGrade === "all"
              ? "Manajemen Instrumen Kognitif Kelas 10, 11 & 12"
              : `Fokus Instrumen Kognitif Kelas ${selectedGrade}`}
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Evaluasi & <br />
            <span className="font-semibold">Bank Soal</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : evaluations.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Paket Evaluasi
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {isLoading ? "—" : totalQuestionsAll}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Total Butir Soal
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : totalSubmissionsAll}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Partisipasi Ujian
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI EVALUASI (BEBAS PILL BORDER BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Rata-rata Pretest */}
        <button
          type="button"
          onClick={() =>
            setSelectedType(selectedType === "pretest" ? "all" : "pretest")
          }
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Pretest</span>
            <span>{totalPretestCount} Paket</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading ? "—" : `${avgPretestGlobal}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
              Tes Awal
            </span>
          </div>
        </button>

        {/* Bar 2: Rata-rata Posttest */}
        <button
          type="button"
          onClick={() =>
            setSelectedType(selectedType === "posttest" ? "all" : "posttest")
          }
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-rata Posttest</span>
            <span>{totalPosttestCount} Paket</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : `${avgPosttestGlobal}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {kognitifGain >= 0
                ? `+${kognitifGain} Poin`
                : `${kognitifGain} Poin`}
            </span>
          </div>
        </button>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kesiapan Bank Soal</span>
            <span>{totalQuestionsAll} Butir Soal</span>
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
              {isLoading ? "—" : `${bankReadinessPct}%`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              Kapasitas Aktif
            </span>
          </div>
        </div>

        {/* Bar 4: Total Sesi Pengerjaan */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Total Ujian</span>
            <span>Terekam</span>
          </div>
          <div
            className="h-14 rounded-2xl px-5 flex items-center justify-center border"
            style={{
              backgroundColor: "var(--ref-card-solid)",
              borderColor: "var(--ref-card-border)",
              color: "var(--ref-text-primary)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading ? "—" : `${totalSubmissionsAll} Sesi`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): KENDALI & FILTER PAKET EVALUASI */}
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-light tracking-tight">
                Filter Evaluasi
              </h2>
              <button
                type="button"
                onClick={handleExportEvaluasiCSV}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: "var(--ref-card-subtle)",
                  borderColor: "var(--ref-card-border)",
                }}
                title="Unduh Rekap Evaluasi CSV"
              >
                <Download size={16} />
              </button>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Pilih angkatan kelas dan jenis evaluasi (Pretest / Posttest).
            </p>

            {/* Segmented Filter Kelas */}
            <div
              className="flex gap-1.5 p-1.5 rounded-full mb-6"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {[
                { val: "all", label: "Semua" },
                { val: 10, label: "Kelas 10" },
                { val: 11, label: "Kelas 11" },
                { val: 12, label: "Kelas 12" },
              ].map((g) => (
                <button
                  key={String(g.val)}
                  type="button"
                  onClick={() => setSelectedGrade(g.val as any)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      selectedGrade === g.val ? "#facc15" : "transparent",
                    color: selectedGrade === g.val ? "#000" : "inherit",
                    opacity: selectedGrade === g.val ? 1 : 0.5,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Bottom-Bordered Custom Dropdown Tipe Evaluasi (DNA Masterpiece) */}
            <div className="relative w-full mb-6" ref={typeDropdownRef}>
              <div
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  {selectedType === "all"
                    ? "Semua Jenis Evaluasi"
                    : selectedType === "pretest"
                    ? "Pretest (Tes Awal)"
                    : "Posttest (Tes Akhir)"}
                </span>
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
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
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
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
                        className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${
                          isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                        }`}
                        style={{
                          color:
                            selectedType === opt.k
                              ? "#facc15"
                              : isDark
                              ? "#fff"
                              : "#000",
                        }}
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
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white relative z-10"
            style={{ backgroundColor: "#10b981" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Buat Paket Evaluasi Baru
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): GRAFIK BATANG VERTIKAL BERTITIK PER PAKET UJIAN */}
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
              <BrainCircuit size={16} /> Distribusi Soal & Skor Paket
            </div>
            <span className="text-xs font-bold opacity-50">
              Klik batang untuk buka
            </span>
          </div>

          <div className="my-4 flex items-end justify-between gap-3 relative z-10">
            <div className="flex items-end gap-3">
              <div className="text-6xl font-light tracking-tighter leading-none">
                {isLoading ? "—" : `${avgPosttestGlobal}%`}
              </div>
              <div className="text-sm font-semibold opacity-50 mb-1">
                Rata-rata Posttest
              </div>
            </div>

            {kognitifGain !== 0 && (
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">
                <TrendingUp size={15} />{" "}
                {kognitifGain > 0 ? `+${kognitifGain}` : kognitifGain} pt
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
                  const shortCode = `${ev.grade_level}${
                    isPost ? "Po" : "Pr"
                  }`;

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => handleOpenBank(ev)}
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${ev.title}: ${qCnt} Soal · Rata-rata ${st.avg}%`}
                    >
                      <span className="text-[11px] font-bold opacity-75">
                        {st.avg > 0 ? `${st.avg}%` : `${qCnt}s`}
                      </span>
                      <div
                        className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px]"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(24,24,27,0.07)",
                        }}
                      >
                        <div
                          className="w-full rounded-full transition-all duration-500 group-hover:scale-y-105"
                          style={{
                            height: `${Math.max(heightPct > 0 ? 18 : 8, heightPct)}%`,
                            backgroundColor: isPost
                              ? "#facc15"
                              : "var(--ref-text-primary)",
                          }}
                        />
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: isPost
                            ? "#facc15"
                            : "var(--ref-text-primary)",
                        }}
                      />
                      <span className="text-[10px] font-bold opacity-60 truncate max-w-full">
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
              <Activity size={16} /> Indeks Bank Soal
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
                    stroke={
                      isDark
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(24,24,27,0.16)"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl font-light tracking-tighter leading-none">
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
            <div
              className="h-3 w-full rounded-full flex overflow-hidden mb-3"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {evaluations.length > 0 && (
                <>
                  <div
                    className="h-full bg-blue-400"
                    style={{
                      width: `${
                        (totalPretestCount / evaluations.length) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${
                        (totalPosttestCount / evaluations.length) * 100
                      }%`,
                      backgroundColor: "#facc15",
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" /> Pretest (
                {totalPretestCount})
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#facc15" }}
                />{" "}
                Posttest ({totalPosttestCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span>{totalQuestionsAll} Soal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: GRID KARTU BESAR PAKET EVALUASI (min-h-[300px] • PASTEL/DARK)
          100% Mengikuti Gaya Kartu Bawah "THE MASTERPIECE ADMINISTRATOR"
         ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <h3 className="text-2xl font-light tracking-tight">
            Daftar Paket Evaluasi ({filteredEvaluations.length})
          </h3>
          <p className="text-xs font-medium opacity-50 mt-1">
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
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#facc15] text-black cursor-pointer"
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
              className="h-[300px] rounded-[2.5rem] animate-pulse"
              style={{ backgroundColor: "var(--ref-card-subtle)" }}
            />
          ))
        ) : filteredEvaluations.length === 0 ? (
          <div
            className="xl:col-span-3 p-14 text-center rounded-[2.5rem] border border-dashed opacity-50"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            }}
          >
            <p className="text-xl font-light">
              Tidak ada paket evaluasi pada filter ini.
            </p>
          </div>
        ) : (
          filteredEvaluations.map((ev, index) => {
            const bgLight = bentoColors[index % bentoColors.length];
            const qCount = ev.question_bank?.[0]?.count || 0;
            const subStat = submissionStats[ev.id] || { count: 0, avg: 0 };

            return (
              <div
                key={ev.id}
                onClick={() => handleOpenBank(ev)}
                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[310px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
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
                    Kelas {ev.grade_level} • {ev.type.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditEvalModal(ev, e)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                      title="Edit Paket Evaluasi"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEvaluation(ev, e)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                      title="Hapus Paket Evaluasi"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <ArrowUpRight size={18} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-2">
                    {ev.title}
                  </div>
                  <p className="text-xs font-medium opacity-60">
                    Dikerjakan oleh {subStat.count} siswa • Klik untuk buka Bank
                    Soal
                  </p>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Kapasitas Bank
                    </div>
                    <div className="text-3xl font-light leading-none">
                      {qCount}{" "}
                      <span className="text-sm font-medium opacity-60">
                        Soal
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Skor Rata-rata
                    </div>
                    <div className="text-4xl font-light leading-none">
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEvalModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
              style={{
                backgroundColor: isDark ? "#141414" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <h2 className="text-3xl font-light tracking-tight mb-8">
                {editingEvalId ? "Edit" : "Buat"}{" "}
                <span className="font-semibold">Paket Evaluasi</span>
              </h2>

              <form onSubmit={handleSaveEvaluation} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Jenjang Kelas
                  </label>
                  <div
                    className="flex gap-2 p-1.5 rounded-full"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
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
                          className="flex-1 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
                          style={{
                            backgroundColor: active ? "#facc15" : "transparent",
                            color: active ? "#000" : "inherit",
                            opacity: active ? 1 : 0.5,
                          }}
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
                  <div
                    className="flex gap-2 p-1.5 rounded-full"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
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
                          className="flex-1 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
                          style={{
                            backgroundColor: active ? "#facc15" : "transparent",
                            color: active ? "#000" : "inherit",
                            opacity: active ? 1 : 0.5,
                          }}
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
                    className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEval}
                  className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer text-white shadow-md"
                  style={{ backgroundColor: "#10b981" }}
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