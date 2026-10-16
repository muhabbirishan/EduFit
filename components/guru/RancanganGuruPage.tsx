// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    ArrowUpRight,
    BrainCircuit,
    Check,
    ChevronDown,
    Download,
    FileCheck2,
    Save,
    Search,
    Sparkles,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

interface StudentRow {
    id: string;
    name: string;
    status: "graded" | "submitted" | "belum_mengumpulkan";
    hasAwal: boolean;
    hasAkhir: boolean;
    progAwal: ProgramRecord | null;
    progAkhir: ProgramRecord | null;
    activeProg: ProgramRecord | null;
    totalRubricScore: number; // Skala 0 - 16
    convertedScore: number; // Skala 0 - 100
    tkjiScore: number | null;
    tkjiCategory: string | null;
    bmiCategory: string | null;
}

export default function RancanganGuruPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";

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
    const [isSaving, setIsSaving] = useState(false);

    const [evalForm, setEvalForm] = useState({
        score_analisis: 0,
        score_fitt: 0,
        score_pemulihan: 0,
        score_evaluasi: 0,
        feedback: "",
    });

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
                    .eq("grade_level", 12)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setClasses(data);
                    setSelectedClass(data[0]);
                } else {
                    setClasses([]);
                    setIsLoading(false);
                }
            } catch (err: any) {
                toast.error("Gagal memuat daftar kelas XII");
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
                .select("student_id, user_profiles(full_name)")
                .eq("class_id", targetClassId);

            if (stdErr) throw stdErr;

            const studentIds =
                stdClass?.map((sc: any) => sc.student_id).filter(Boolean) || [];

            if (studentIds.length === 0) {
                setRawStudents([]);
                setRawPrograms([]);
                setRawMetrics([]);
                setIsLoading(false);
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
                        "student_id, total_tkji_score, tkji_category, bmi_category, created_at"
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
                            (p.type || "awal").toLowerCase() === "awal"
                    ) || null;

                const progAkhir =
                    rawPrograms.find(
                        (p) =>
                            p.student_id === sc.student_id &&
                            (p.type || "").toLowerCase() === "akhir"
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

                const rawStatus = activeProg?.status || "belum_mengumpulkan";
                const normalizedStatus:
                    | "graded"
                    | "submitted"
                    | "belum_mengumpulkan" =
                    rawStatus === "graded"
                        ? "graded"
                        : activeProg
                        ? "submitted"
                        : "belum_mengumpulkan";

                return {
                    id: sc.student_id,
                    name:
                        sc.user_profiles?.full_name || "Siswa Tidak Diketahui",
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
        const activeGradedList = studentsData.filter(
            (s) => s.status === "graded"
        );
        const activePendingList = studentsData.filter(
            (s) => s.status === "submitted"
        );
        const activeEmptyList = studentsData.filter(
            (s) => s.status === "belum_mengumpulkan"
        );

        const awalPct =
            totalSiswa > 0 ? Math.round((awalSubmitted / totalSiswa) * 100) : 0;
        const akhirPct =
            totalSiswa > 0
                ? Math.round((akhirSubmitted / totalSiswa) * 100)
                : 0;

        const gradedRatePct =
            activeSubmittedList.length > 0
                ? Math.round(
                      (activeGradedList.length / activeSubmittedList.length) *
                          100
                  )
                : 0;

        let sumConverted = 0;
        let sumAnalisis = 0,
            sumFitt = 0,
            sumPemulihan = 0,
            sumEvaluasi = 0;

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
                pct:
                    gCount > 0
                        ? Math.round((sumAnalisis / (gCount * 4)) * 100)
                        : 0,
            },
            {
                code: "XII-2",
                title: "Kesesuaian Prinsip FITT",
                avg4: gCount > 0 ? Number((sumFitt / gCount).toFixed(1)) : 0,
                pct:
                    gCount > 0
                        ? Math.round((sumFitt / (gCount * 4)) * 100)
                        : 0,
            },
            {
                code: "XII-3",
                title: "Pemulihan & Progresi",
                avg4:
                    gCount > 0 ? Number((sumPemulihan / gCount).toFixed(1)) : 0,
                pct:
                    gCount > 0
                        ? Math.round((sumPemulihan / (gCount * 4)) * 100)
                        : 0,
            },
            {
                code: "XII-4",
                title: "Alasan & Evaluasi Data",
                avg4:
                    gCount > 0 ? Number((sumEvaluasi / gCount).toFixed(1)) : 0,
                pct:
                    gCount > 0
                        ? Math.round((sumEvaluasi / (gCount * 4)) * 100)
                        : 0,
            },
        ];

        const withPhysicalData = studentsData.filter(
            (s) => s.tkjiScore !== null || s.bmiCategory !== null
        ).length;
        const physicalReadyPct =
            totalSiswa > 0
                ? Math.round((withPhysicalData / totalSiswa) * 100)
                : 0;

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
            withPhysicalData,
            physicalReadyPct,
        };
    }, [studentsData]);

    const loadProgramForModal = async (
        studentId: string,
        targetType: "awal" | "akhir"
    ) => {
        const toastId = toast.loading(
            `Memuat Rancangan ${targetType.toUpperCase()}...`
        );
        try {
            const { data, error } = await supabase
                .from("student_programs")
                .select("*")
                .eq("student_id", studentId)
                .eq("type", targetType)
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
            toast.dismiss(toastId);
        } catch (err: any) {
            toast.error("Gagal memuat program siswa", { id: toastId });
        }
    };

    const openEvaluation = async (student: StudentRow) => {
        setSelectedStudent(student);
        await loadProgramForModal(student.id, planType);
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
            toast.warning("Mohon lengkapi keempat skor rubrik (Skala 1–4)");
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
                status: "graded",
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from("student_programs")
                .update(updatedPayload)
                .eq("id", studentProgram.id);

            if (error) throw error;

            toast.success(
                `Penilaian Rancangan ${planType.toUpperCase()} ${selectedStudent.name} berhasil disimpan!`
            );

            setRawPrograms((prev) =>
                prev.map((p) =>
                    p.id === studentProgram.id ? { ...p, ...updatedPayload } : p
                )
            );
            setSelectedStudent(null);
        } catch (err: any) {
            toast.error("Gagal menyimpan penilaian", {
                description: err.message,
            });
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
            "Kelas",
            "Fase Rancangan",
            "Status",
            "Skor Analisis (1-4)",
            "Skor FITT (1-4)",
            "Skor Pemulihan (1-4)",
            "Skor Evaluasi (1-4)",
            "Total Skor (0-100)",
            "Skor TKJI",
            "Kategori IMT",
        ];
        const rows = studentsData.map((s) => [
            `"${s.name.replace(/"/g, '""')}"`,
            `"${selectedClass?.name || "XII"}"`,
            planType.toUpperCase(),
            s.status === "graded"
                ? "Sudah Dinilai"
                : s.status === "submitted"
                ? "Menunggu Dinilai"
                : "Belum Mengumpulkan",
            s.activeProg?.score_analisis || 0,
            s.activeProg?.score_fitt || 0,
            s.activeProg?.score_pemulihan || 0,
            s.activeProg?.score_evaluasi || 0,
            s.convertedScore,
            s.tkjiScore ?? "-",
            `"${s.bmiCategory || "-"}"`,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute(
            "download",
            `Rancangan_${planType.toUpperCase()}_${selectedClass?.name || "Kelas12"}_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Rekap nilai rancangan berhasil diunduh");
    };

    const filteredData = useMemo(() => {
        return studentsData.filter((row) => {
            const matchName = row.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            if (!matchName) return false;
            if (statusFilter === "graded") return row.status === "graded";
            if (statusFilter === "submitted") return row.status === "submitted";
            if (statusFilter === "empty")
                return row.status === "belum_mengumpulkan";
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

    // Warna Bento Pastel Khas DashboardGuru & AdminDashboard
    const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

    return (
        <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* ====================================================================
                ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
               ==================================================================== */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <FileCheck2 size={16} />{" "}
                        {selectedClass
                            ? `Khusus Kelas 12 • ${selectedClass.name} • Sinkron ${lastSyncTime || "Live"}`
                            : "Evaluasi Kurikulum Kelas 12 • Program Latihan FITT"}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Rancangan <br />
                        <span className="font-semibold">Program</span> 👋
                    </h1>
                </div>

                {/* 3 Angka Raksasa Terbuka (Persis DashboardGuru) */}
                <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
                    <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : stats.totalSiswa}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Siswa Kelas XII
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter("submitted")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500 group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : stats.submittedCount}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Rancangan Masuk
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter("graded")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : `${stats.avgScorePct}%`}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Skor Rata-rata
                        </div>
                    </button>
                </div>
            </div>

            {/* ====================================================================
                ZONA 2: 4 BAR TELEMETRI RUANG GURU (WARNA TAJAM #facc15 & TANPA PILL BORDER!)
               ==================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
                {/* Bar 1: Rancangan Awal */}
                <button
                    type="button"
                    onClick={() => setPlanType("awal")}
                    className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rancangan Awal</span>
                        <span>Fase 1</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor:
                                planType === "awal"
                                    ? "#facc15"
                                    : "var(--ref-dark-panel)",
                            color:
                                planType === "awal"
                                    ? "#18181b"
                                    : "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {isLoading ? "—" : `${stats.awalPct}%`}
                        </span>
                        <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                                planType === "awal" ? "" : "opacity-60"
                            }`}
                        >
                            {stats.awalSubmitted}/{stats.totalSiswa} Siswa
                        </span>
                    </div>
                </button>

                {/* Bar 2: Rancangan Akhir */}
                <button
                    type="button"
                    onClick={() => setPlanType("akhir")}
                    className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rancangan Akhir</span>
                        <span>Fase 2</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor:
                                planType === "akhir"
                                    ? "#facc15"
                                    : "var(--ref-dark-panel)",
                            color:
                                planType === "akhir"
                                    ? "#18181b"
                                    : "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {isLoading ? "—" : `${stats.akhirPct}%`}
                        </span>
                        <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                                planType === "akhir" ? "" : "opacity-60"
                            }`}
                        >
                            {stats.akhirSubmitted}/{stats.totalSiswa} Siswa
                        </span>
                    </div>
                </button>

                {/* Bar 3: Striped Track Murni (TANPA PILL BORDER ANGKA!) */}
                <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Progres Penilaian Guru</span>
                        <span>
                            {stats.gradedCount}/{stats.submittedCount} Dinilai
                        </span>
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
                            {isLoading ? "—" : `${stats.gradedRatePct}%`}
                        </span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
                            style={{ color: "var(--ref-text-primary)" }}
                        >
                            {stats.pendingCount > 0
                                ? `${stats.pendingCount} Menunggu`
                                : "Terkoreksi"}
                        </span>
                    </div>
                </div>

                {/* Bar 4: Kesiapan Data TKJI & IMT (Emerald Accent seperti DashboardGuru) */}
                <div className="sm:col-span-2 lg:col-span-2 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Data TKJI</span>
                        <span>Profil Awal</span>
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
                            {isLoading ? "—" : `${stats.physicalReadyPct}%`}
                        </span>
                    </div>
                </div>
            </div>

            {/* ====================================================================
                ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
               ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
                {/* BENTO 1 (PATTERN POLKADOT HALUS + DROPDOWN SOLID z-30 ANTI TEMBUS) */}
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

                    {/* Z-30 AGAR DROPDOWN SELALU DI ATAS TOMBOL/ELEMEN BAWAH! */}
                    <div className="relative z-30">
                        <h2 className="text-3xl font-light tracking-tight mb-2">
                            Kendali Rombel
                        </h2>
                        <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
                            Pilih fase rancangan dan kelas XII untuk memfilter
                            daftar evaluasi siswa.
                        </p>

                        <div
                            className="flex gap-1.5 p-1.5 rounded-full mb-6"
                            style={{
                                backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            {(
                                [
                                    { val: "awal", label: "Rancangan Awal" },
                                    { val: "akhir", label: "Rancangan Akhir" },
                                ] as const
                            ).map((t) => (
                                <button
                                    key={t.val}
                                    type="button"
                                    onClick={() => setPlanType(t.val)}
                                    className="flex-1 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    style={{
                                        backgroundColor:
                                            planType === t.val
                                                ? "#facc15"
                                                : "transparent",
                                        color:
                                            planType === t.val
                                                ? "#000"
                                                : "inherit",
                                        opacity: planType === t.val ? 1 : 0.5,
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div
                            className="relative w-full mb-6"
                            ref={classDropdownRef}
                        >
                            <div
                                onClick={() =>
                                    classes.length > 0 &&
                                    setIsClassDropdownOpen(!isClassDropdownOpen)
                                }
                                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.2)"
                                        : "rgba(0,0,0,0.12)",
                                }}
                            >
                                <span className="truncate pr-3">
                                    {selectedClass
                                        ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                                        : "Pilih Kelas XII..."}
                                </span>
                                <ChevronDown
                                    size={24}
                                    className={`transition-transform duration-300 opacity-50 shrink-0 ${
                                        isClassDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </div>

                            <AnimatePresence>
                                {isClassDropdownOpen && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.98,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.98,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-56 overflow-y-auto no-scrollbar"
                                        style={{
                                            backgroundColor: isDark
                                                ? "#1a1a1a"
                                                : "#ffffff",
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        {classes.map((cls) => (
                                            <div
                                                key={cls.id}
                                                onClick={() => {
                                                    setSelectedClass(cls);
                                                    setIsClassDropdownOpen(
                                                        false
                                                    );
                                                }}
                                                className={`px-6 py-4 text-xl font-light cursor-pointer transition-colors ${
                                                    isDark
                                                        ? "hover:bg-white/5"
                                                        : "hover:bg-black/5"
                                                }`}
                                                style={{
                                                    backgroundColor: isDark
                                                        ? "#1a1a1a"
                                                        : "#ffffff",
                                                    color:
                                                        selectedClass?.id ===
                                                        cls.id
                                                            ? "#facc15"
                                                            : isDark
                                                            ? "#fff"
                                                            : "#000",
                                                }}
                                            >
                                                {cls.name} (Kelas{" "}
                                                {cls.grade_level})
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* TOMBOL AKSI HIJAU EMERALD #10b981 IDENTIK DENGAN DASHBOARDGURU */}
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={studentsData.length === 0}
                        className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white disabled:opacity-30 disabled:cursor-not-allowed relative z-10"
                        style={{ backgroundColor: "#10b981" }}
                    >
                        <Download size={16} strokeWidth={2.5} /> Ekspor Rekap
                        Nilai CSV
                    </button>
                </div>

                {/* BENTO 2 (PATTERN GRID MILIMETER): CAPAIAN 4 DIMENSI RUBRIK (TP XII-1 s/d XII-4) */}
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
                            <BrainCircuit size={16} /> Capaian Rubrik FITT
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                            Fase {planType.toUpperCase()}
                        </span>
                    </div>

                    <div className="my-4 flex items-end gap-3 relative z-10">
                        <div className="text-6xl font-light tracking-tighter leading-none">
                            {isLoading
                                ? "—"
                                : selectedRubricBar
                                ? `${
                                      stats.rubricBars.find(
                                          (b) => b.code === selectedRubricBar
                                      )?.pct || 0
                                  }%`
                                : `${stats.avgScorePct}%`}
                        </div>
                        <div className="text-sm font-semibold opacity-50 mb-1">
                            {selectedRubricBar
                                ? stats.rubricBars.find(
                                      (b) => b.code === selectedRubricBar
                                  )?.title
                                : "Rata-rata Skor Kelas"}
                        </div>
                    </div>

                    {/* Grafik Batang Vertikal Bertitik */}
                    <div className="grid grid-cols-4 gap-4 items-end pt-4 h-44 relative z-10">
                        {stats.rubricBars.map((bar) => {
                            const val = bar.pct;
                            const isHighest =
                                bar.code === highestRubric.code && val > 0;
                            const isSelected = selectedRubricBar === bar.code;

                            return (
                                <button
                                    key={bar.code}
                                    type="button"
                                    onClick={() =>
                                        setSelectedRubricBar(
                                            isSelected ? null : bar.code
                                        )
                                    }
                                    className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                                    title={`${bar.code} (${bar.title}): Rata-rata ${bar.avg4}/4 (${bar.pct}%)`}
                                >
                                    <span className="text-xs font-bold opacity-75">
                                        {bar.pct}%
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
                                                height: `${Math.max(
                                                    15,
                                                    val
                                                )}%`,
                                                backgroundColor:
                                                    isSelected || isHighest
                                                        ? "#facc15"
                                                        : "var(--ref-text-primary)",
                                            }}
                                        />
                                    </div>
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                isSelected || isHighest
                                                    ? "#facc15"
                                                    : "var(--ref-text-primary)",
                                        }}
                                    />
                                    <span className="text-[11px] font-bold opacity-60">
                                        {bar.code}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR GAUGE DENGAN TEKS DI BAWAH CHART!) */}
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
                            <Activity size={16} /> Indeks Evaluasi Kelas
                        </div>
                        <div className="flex items-center gap-1">
                            {[
                                { key: "koreksi", label: "Koreksi" },
                                { key: "kualitas", label: "Skor" },
                                { key: "fisik", label: "TKJI" },
                            ].map((m) => {
                                const active = gaugeMode === m.key;
                                return (
                                    <button
                                        key={m.key}
                                        type="button"
                                        onClick={() =>
                                            setGaugeMode(m.key as any)
                                        }
                                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        style={{
                                            backgroundColor: active
                                                ? "#facc15"
                                                : "var(--ref-card-subtle)",
                                            color: active
                                                ? "#000"
                                                : "var(--ref-text-secondary)",
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
                            gaugeMode === "koreksi"
                                ? `${stats.gradedRatePct}%`
                                : gaugeMode === "kualitas"
                                ? `${stats.avgScorePct}%`
                                : `${stats.physicalReadyPct}%`;

                        const gaugeLabel =
                            gaugeMode === "koreksi"
                                ? `Rancangan ${planType.toUpperCase()} Selesai Dinilai`
                                : gaugeMode === "kualitas"
                                ? "Rata-rata Kualitas Rubrik FITT"
                                : "Siswa Memiliki Data TKJI & IMT";

                        const gaugePct =
                            gaugeMode === "koreksi"
                                ? stats.gradedRatePct
                                : gaugeMode === "kualitas"
                                ? stats.avgScorePct
                                : stats.physicalReadyPct;

                        const radius = 58;
                        const circumference = 2 * Math.PI * radius;
                        const dashOffset =
                            circumference -
                            (Math.max(10, gaugePct) / 100) * circumference;

                        return (
                            <div className="relative flex flex-col items-center justify-center my-2 z-10">
                                <div className="relative flex items-center justify-center">
                                    <svg
                                        className="w-36 h-36 -rotate-90"
                                        viewBox="0 0 140 140"
                                    >
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
                                    {/* HANYA ANGKA DI DALAM LINGKARAN CHART */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl font-light tracking-tighter leading-none">
                                            {isLoading ? "—" : gaugeValue}
                                        </span>
                                    </div>
                                </div>
                                {/* TEKS LABEL BERADA DI BAWAH CHART */}
                                <span className="text-xs font-semibold opacity-60 mt-3 text-center">
                                    {gaugeLabel}
                                </span>
                            </div>
                        );
                    })()}

                    <div className="relative z-10">
                        <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-3 border-t border-black/10 dark:border-white/10">
                            <span>{stats.pendingCount} Masuk</span>
                            <span>•</span>
                            <span>{stats.gradedCount} Dinilai</span>
                            <span>•</span>
                            <span>{stats.emptyCount} Kosong</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================================================
                ZONA 4: HEADER FILTER & PENCARIAN + BENTO GRID WARNA PASTEL/OBSIDIAN
               ==================================================================== */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 mb-6 gap-4 relative z-10">
                <div>
                    <h3 className="text-3xl font-light tracking-tight">
                        Daftar Rancangan Siswa ({filteredData.length})
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        {[
                            {
                                key: "all",
                                label: `Semua (${stats.totalSiswa})`,
                            },
                            {
                                key: "submitted",
                                label: `Perlu Dinilai (${stats.pendingCount})`,
                            },
                            {
                                key: "graded",
                                label: `Selesai (${stats.gradedCount})`,
                            },
                            {
                                key: "empty",
                                label: `Belum Kumpul (${stats.emptyCount})`,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStatusFilter(tab.key as any)}
                                className={`text-xs font-bold uppercase tracking-widest transition-opacity cursor-pointer ${
                                    statusFilter === tab.key
                                        ? "opacity-100 underline decoration-[#facc15] decoration-2 underline-offset-8"
                                        : "opacity-45 hover:opacity-80"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full md:w-80 shrink-0">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama siswa kelas XII..."
                        className="w-full pl-12 pr-10 py-3.5 rounded-full text-sm outline-none transition-colors border"
                        style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                            color: isDark ? "#ffffff" : "#000000",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.08)",
                        }}
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

            {/* DAFTAR SISWA GRID (COLORFUL PASTEL DI LIGHT MODE & OBSIDIAN DI DARK MODE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
                {classes.length === 0 ? (
                    <div
                        className="xl:col-span-3 flex flex-col items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.2)"
                                : "rgba(0,0,0,0.2)",
                        }}
                    >
                        <Users className="w-10 h-10 mb-3" />
                        <div className="text-xl font-light tracking-tight">
                            Anda belum mengampu kelas tingkat akhir (Kelas XII).
                        </div>
                    </div>
                ) : isLoading ? (
                    <div
                        className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50 animate-pulse"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.2)"
                                : "rgba(0,0,0,0.2)",
                        }}
                    >
                        <div className="text-xl font-light tracking-tight">
                            Menyiapkan data rancangan siswa...
                        </div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div
                        className="xl:col-span-3 flex items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.2)"
                                : "rgba(0,0,0,0.2)",
                        }}
                    >
                        <div className="text-xl font-light tracking-tight">
                            Tidak ada siswa yang cocok dengan filter saat ini.
                        </div>
                    </div>
                ) : (
                    filteredData.map((row, index) => {
                        const bgLight = bentoColors[index % bentoColors.length];
                        const isGraded = row.status === "graded";
                        const isSubmitted = row.status === "submitted";

                        return (
                            <div
                                key={row.id}
                                onClick={() => openEvaluation(row)}
                                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
                                style={{
                                    backgroundColor: isDark
                                        ? "#111111"
                                        : bgLight,
                                    borderColor: isSubmitted
                                        ? "#facc15"
                                        : isDark
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
                                        FASE {planType.toUpperCase()} ·{" "}
                                        {row.tkjiScore !== null
                                            ? `TKJI ${row.tkjiScore} (${row.tkjiCategory || "Tercatat"})`
                                            : "TKJI BELUM ADA"}
                                    </span>
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(255,255,255,0.06)"
                                                : "rgba(0,0,0,0.06)",
                                        }}
                                    >
                                        <ArrowUpRight
                                            size={18}
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                </div>

                                <div className="my-6 relative z-10">
                                    <div className="text-4xl font-light tracking-tighter leading-tight mb-2 line-clamp-2">
                                        {row.name}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className="px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border"
                                            style={{
                                                backgroundColor: isDark
                                                    ? "rgba(255,255,255,0.06)"
                                                    : "rgba(0,0,0,0.06)",
                                                borderColor: isDark
                                                    ? "rgba(255,255,255,0.1)"
                                                    : "rgba(0,0,0,0.1)",
                                            }}
                                        >
                                            Awal: {row.hasAwal ? "✓" : "—"} •
                                            Akhir: {row.hasAkhir ? "✓" : "—"}
                                        </span>
                                        {row.bmiCategory && (
                                            <span
                                                className="px-3 py-1 rounded-xl text-xs font-bold border"
                                                style={{
                                                    backgroundColor: isDark
                                                        ? "rgba(255,255,255,0.06)"
                                                        : "rgba(0,0,0,0.06)",
                                                    borderColor: isDark
                                                        ? "rgba(255,255,255,0.1)"
                                                        : "rgba(0,0,0,0.1)",
                                                }}
                                            >
                                                IMT: {row.bmiCategory}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                            Nilai Rancangan
                                        </div>
                                        <div className="text-3xl font-light leading-none">
                                            {isGraded
                                                ? `${row.convertedScore} Poin`
                                                : "—"}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                            Status Evaluasi
                                        </div>
                                        {isGraded ? (
                                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                Selesai Dinilai ({row.totalRubricScore}/16)
                                            </div>
                                        ) : isSubmitted ? (
                                            <div className="text-sm font-bold text-amber-700 dark:text-[#facc15]">
                                                Menunggu Koreksi
                                            </div>
                                        ) : (
                                            <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                                Belum Mengumpulkan
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ====================================================================
                MODAL EVALUASI & RUBRIK RANCANGAN SISWA
               ==================================================================== */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/65 backdrop-blur-md"
                            onClick={() => setSelectedStudent(null)}
                        />

                        <motion.div
                            initial={{ scale: 0.96, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.96, y: 20, opacity: 0 }}
                            className="w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col rounded-[2.5rem] relative z-10 shadow-2xl border"
                            style={{
                                backgroundColor: isDark ? "#141414" : "#f4f1ea",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(24,24,27,0.08)",
                            }}
                        >
                            {/* HEADER MODAL */}
                            <div
                                className="p-6 sm:p-8 border-b flex flex-wrap justify-between items-center gap-4 shrink-0"
                                style={{
                                    backgroundColor: isDark
                                        ? "#111111"
                                        : "#ffffff",
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.06)",
                                }}
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-widest opacity-50">
                                            Evaluasi Program FITT •{" "}
                                            {selectedClass?.name}
                                        </span>
                                        {selectedStudent.tkjiScore !== null && (
                                            <span
                                                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor:
                                                        "var(--ref-tint-emerald-bg)",
                                                    color: "var(--ref-tint-emerald-text)",
                                                }}
                                            >
                                                TKJI: {selectedStudent.tkjiScore}{" "}
                                                ({selectedStudent.tkjiCategory})
                                            </span>
                                        )}
                                        {selectedStudent.bmiCategory && (
                                            <span
                                                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor:
                                                        "var(--ref-tint-sky-bg)",
                                                    color: "var(--ref-tint-sky-text)",
                                                }}
                                            >
                                                IMT:{" "}
                                                {selectedStudent.bmiCategory}
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
                                    <div
                                        className="flex p-1 rounded-full border"
                                        style={{
                                            backgroundColor:
                                                "var(--ref-card-subtle)",
                                            borderColor:
                                                "var(--ref-card-border)",
                                        }}
                                    >
                                        {(["awal", "akhir"] as const).map(
                                            (t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => {
                                                        setPlanType(t);
                                                        loadProgramForModal(
                                                            selectedStudent.id,
                                                            t
                                                        );
                                                    }}
                                                    className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                                                    style={{
                                                        backgroundColor:
                                                            planType === t
                                                                ? "#facc15"
                                                                : "transparent",
                                                        color:
                                                            planType === t
                                                                ? "#000"
                                                                : "inherit",
                                                        opacity:
                                                            planType === t
                                                                ? 1
                                                                : 0.55,
                                                    }}
                                                >
                                                    Rancangan {t}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                                    onClick={() =>
                                                        setSelectedStudent(null)
                                                    }
                                        className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-red-500 hover:text-white cursor-pointer"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(255,255,255,0.06)"
                                                : "rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* ISI MODAL (2 KOLOM) */}
                            <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* KOLOM KIRI: 9 JAWABAN RANCANGAN SISWA */}
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                                        <h3 className="text-2xl font-light tracking-tight">
                                            Tugas Rancangan{" "}
                                            <span className="font-semibold uppercase">
                                                {planType}
                                            </span>
                                        </h3>
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                                            9 Komponen FITT
                                        </span>
                                    </div>

                                    {!studentProgram ? (
                                        <div
                                            className="p-12 text-center rounded-[2rem] border border-dashed"
                                            style={{
                                                backgroundColor: isDark
                                                    ? "#111111"
                                                    : "#ffffff",
                                                borderColor: isDark
                                                    ? "rgba(255,255,255,0.12)"
                                                    : "rgba(0,0,0,0.12)",
                                            }}
                                        >
                                            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            <p className="text-xl font-light">
                                                Siswa belum mengumpulkan
                                                Rancangan{" "}
                                                {planType.toUpperCase()}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3.5">
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="01 • Prioritas & Data Pendukung"
                                                answer={
                                                    studentProgram.prioritas
                                                }
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="02 • Tujuan Latihan"
                                                answer={studentProgram.tujuan}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="03 • Frekuensi & Jadwal Mingguan"
                                                answer={
                                                    studentProgram.frekuensi
                                                }
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="04 • Intensitas & Cara Memantau"
                                                answer={
                                                    studentProgram.intensitas
                                                }
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="05 • Durasi Sesi Latihan"
                                                answer={studentProgram.durasi}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="06 • Jenis Bentuk Latihan"
                                                answer={studentProgram.jenis}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="07 • Jeda & Pemulihan Antar Sesi"
                                                answer={studentProgram.jeda}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="08 • Rencana Progresi"
                                                answer={studentProgram.progresi}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="09 • Alasan & Evaluasi Keputusan"
                                                answer={studentProgram.alasan}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* KOLOM KANAN: RUBRIK PENILAIAN GURU */}
                                <form
                                    onSubmit={handleSaveEvaluation}
                                    className="lg:col-span-6 space-y-5"
                                >
                                    <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                                        <h3 className="text-2xl font-light tracking-tight">
                                            Penilaian{" "}
                                            <span className="font-semibold">
                                                Guru (Skala 1-4)
                                            </span>
                                        </h3>
                                        <div
                                            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                                            style={{
                                                backgroundColor:
                                                    "var(--ref-dark-panel)",
                                                color: "#facc15",
                                            }}
                                        >
                                            Skor: {liveModalTotalRubric}/16 (
                                            {liveModalConverted} Poin)
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <RubricSelect
                                            isDark={isDark}
                                            code="XII-1"
                                            label="Analisis Hasil"
                                            value={evalForm.score_analisis}
                                            onChange={(v: number) =>
                                                setEvalForm({
                                                    ...evalForm,
                                                    score_analisis: v,
                                                })
                                            }
                                            disabled={!studentProgram}
                                            options={[
                                                {
                                                    val: 1,
                                                    text: "Belum menghubungkan data dengan prioritas.",
                                                },
                                                {
                                                    val: 2,
                                                    text: "Menyebut data tetapi prioritas kurang sesuai.",
                                                },
                                                {
                                                    val: 3,
                                                    text: "Prioritas sesuai, alasan belum lengkap.",
                                                },
                                                {
                                                    val: 4,
                                                    text: "Prioritas didukung data per item tepat.",
                                                },
                                            ]}
                                        />

                                        <RubricSelect
                                            isDark={isDark}
                                            code="XII-2"
                                            label="Kesesuaian FITT"
                                            value={evalForm.score_fitt}
                                            onChange={(v: number) =>
                                                setEvalForm({
                                                    ...evalForm,
                                                    score_fitt: v,
                                                })
                                            }
                                            disabled={!studentProgram}
                                            options={[
                                                {
                                                    val: 1,
                                                    text: "Tujuan dan FITT belum dapat ditafsirkan.",
                                                },
                                                {
                                                    val: 2,
                                                    text: "Beberapa unsur FITT belum sesuai tujuan.",
                                                },
                                                {
                                                    val: 3,
                                                    text: "FITT sesuai, satu unsur belum jelas.",
                                                },
                                                {
                                                    val: 4,
                                                    text: "Tujuan dan seluruh FITT sesuai kondisi awal.",
                                                },
                                            ]}
                                        />

                                        <RubricSelect
                                            isDark={isDark}
                                            code="XII-3"
                                            label="Pemulihan & Progresi"
                                            value={evalForm.score_pemulihan}
                                            onChange={(v: number) =>
                                                setEvalForm({
                                                    ...evalForm,
                                                    score_pemulihan: v,
                                                })
                                            }
                                            disabled={!studentProgram}
                                            options={[
                                                {
                                                    val: 1,
                                                    text: "Belum merencanakan pemulihan.",
                                                },
                                                {
                                                    val: 2,
                                                    text: "Ada rencana tetapi tanpa alasan kesiapan.",
                                                },
                                                {
                                                    val: 3,
                                                    text: "Rencana sesuai, kriteria belum lengkap.",
                                                },
                                                {
                                                    val: 4,
                                                    text: "Pemulihan dan progresi disertai kriteria jelas.",
                                                },
                                            ]}
                                        />

                                        <RubricSelect
                                            isDark={isDark}
                                            code="XII-4"
                                            label="Alasan & Evaluasi"
                                            value={evalForm.score_evaluasi}
                                            onChange={(v: number) =>
                                                setEvalForm({
                                                    ...evalForm,
                                                    score_evaluasi: v,
                                                })
                                            }
                                            disabled={!studentProgram}
                                            options={[
                                                {
                                                    val: 1,
                                                    text: "Belum menjelaskan keputusan.",
                                                },
                                                {
                                                    val: 2,
                                                    text: "Alasan umum belum terkait data.",
                                                },
                                                {
                                                    val: 3,
                                                    text: "Alasan terkait data, evaluasi belum spesifik.",
                                                },
                                                {
                                                    val: 4,
                                                    text: "Alasan berbasis data dan usulan spesifik.",
                                                },
                                            ]}
                                        />

                                        <div className="pt-2">
                                            <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2.5 block">
                                                Umpan Balik (Feedback)
                                            </label>
                                            <textarea
                                                value={evalForm.feedback}
                                                onChange={(e) =>
                                                    setEvalForm({
                                                        ...evalForm,
                                                        feedback:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={!studentProgram}
                                                placeholder="Berikan saran membangun untuk rancangan siswa..."
                                                className="w-full p-5 rounded-3xl text-sm focus:outline-none resize-none h-32 disabled:opacity-50 border"
                                                style={{
                                                    backgroundColor: isDark
                                                        ? "#111111"
                                                        : "#ffffff",
                                                    color: isDark
                                                        ? "#fff"
                                                        : "#000",
                                                    borderColor: isDark
                                                        ? "rgba(255,255,255,0.08)"
                                                        : "rgba(0,0,0,0.08)",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSaving || !studentProgram}
                                        className="w-full py-4 text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 cursor-pointer text-white"
                                        style={{
                                            backgroundColor: "#10b981",
                                        }}
                                    >
                                        <Save size={17} />
                                        {isSaving
                                            ? "Menyimpan Nilai..."
                                            : `Simpan Penilaian Rancangan ${planType.toUpperCase()}`}
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

const StudentAnswer = ({ label, answer, isDark }: any) => (
    <div
        className="p-5 rounded-3xl border"
        style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.06)",
        }}
    >
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1.5">
            {label}
        </p>
        <p className="text-sm font-medium leading-relaxed">
            {answer || <span className="italic opacity-35">Kosong</span>}
        </p>
    </div>
);

const RubricSelect = ({
    code,
    label,
    value,
    onChange,
    options,
    disabled,
    isDark,
}: any) => {
    const activeOption = options.find((o: any) => o.val === value);

    return (
        <div
            className="p-5 rounded-3xl border space-y-3"
            style={{
                backgroundColor: isDark ? "#111111" : "#ffffff",
                borderColor:
                    value > 0
                        ? "rgba(250, 204, 21, 0.45)"
                        : isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
            }}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                        style={{
                            backgroundColor: "var(--ref-dark-panel)",
                            color: "#facc15",
                        }}
                    >
                        {code}
                    </span>
                    <span className="text-sm font-bold">{label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                        <button
                            key={num}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(num)}
                            className="w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                            style={{
                                backgroundColor:
                                    value === num
                                        ? "#facc15"
                                        : isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.05)",
                                color:
                                    value === num
                                        ? "#18181b"
                                        : "var(--ref-text-primary)",
                            }}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            <select
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full text-xs px-4 py-2.5 rounded-2xl outline-none disabled:opacity-50 cursor-pointer border"
                style={{
                    backgroundColor: isDark ? "#1a1a1a" : "#f6f4ee",
                    color: isDark ? "#fff" : "#18181b",
                    borderColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                }}
            >
                <option value={0}>Belum Dinilai (Pilih Skor 1–4)</option>
                {options.map((opt: any) => (
                    <option key={opt.val} value={opt.val}>
                        Skor {opt.val}: {opt.text}
                    </option>
                ))}
            </select>

            {activeOption && (
                <p className="text-xs opacity-65 pl-1">
                    ✓ {activeOption.text}
                </p>
            )}
        </div>
    );
};