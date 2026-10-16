// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    ArrowUpRight,
    BookOpen,
    BrainCircuit,
    Check,
    ChevronDown,
    Download,
    LayoutGrid,
    ListFilter,
    Search,
    Sparkles,
    Table2,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface TpObjective {
    code: string;
    text: string;
    mappingDesc?: string;
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
}

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

export default function TeoriPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";

    const [classes, setClasses] = useState<any[]>([]);
    const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const classDropdownRef = useRef<HTMLDivElement>(null);

    const [statusFilter, setStatusFilter] = useState<
        "all" | "complete" | "partial" | "empty"
    >("all");
    const [viewMode, setViewMode] = useState<"bento" | "table">("bento");
    const [chartMode, setChartMode] = useState<"post" | "pre">("post");
    const [gaugeMode, setGaugeMode] = useState<
        "posttest" | "ketuntasan" | "partisipasi"
    >("posttest");
    const [selectedTpCode, setSelectedTpCode] = useState<string | null>(null);

    const [rawStudents, setRawStudents] = useState<any[]>([]);
    const [rawScores, setRawScores] = useState<any[]>([]);
    const [rawAnswers, setRawAnswers] = useState<any[]>([]);
    const [instrumentData, setInstrumentData] = useState<any>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [lastSyncTime, setLastSyncTime] = useState<string>("");

    const [selectedStudent, setSelectedStudent] =
        useState<StudentTheoryRow | null>(null);

    // Tutup dropdown saat klik di luar
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

    // 1. Ambil daftar kelas yang diampu guru
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
            } catch (err: any) {
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

    // 2. Ambil data siswa, nilai Pretest/Posttest, kisi-kisi instrumen, dan detail jawaban per TP
    const fetchTheoryEcosystem = async (cls: any) => {
        if (!cls?.id) return;
        setIsLoading(true);
        try {
            const [stdRes, instRes] = await Promise.all([
                supabase
                    .from("student_classes")
                    .select("student_id, user_profiles(full_name)")
                    .eq("class_id", cls.id),
                supabase
                    .from("master_instruments")
                    .select("*")
                    .eq("grade_level", cls.grade_level)
                    .maybeSingle(),
            ]);

            if (stdRes.error) throw stdRes.error;

            const stdList = stdRes.data || [];
            setRawStudents(stdList);
            setInstrumentData(instRes.data || null);

            const studentIds = stdList
                .map((sc: any) => sc.student_id)
                .filter(Boolean);

            if (studentIds.length === 0) {
                setRawScores([]);
                setRawAnswers([]);
                setIsLoading(false);
                return;
            }

            const [scoresRes, answersRes] = await Promise.all([
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
                        "is_correct, question_bank!inner(learning_objective_code), student_evaluation_scores!inner(student_id, master_evaluations!inner(type, grade_level))"
                    )
                    .in("student_evaluation_scores.student_id", studentIds),
            ]);

            if (scoresRes.error) throw scoresRes.error;

            setRawScores(scoresRes.data || []);
            setRawAnswers(answersRes.data || []);
            setSelectedTpCode(null);
            setLastSyncTime(
                new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } catch (error: any) {
            toast.error("Gagal memuat data nilai teori", {
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

    // Daftar TP sesuai jenjang kelas aktif (dari master_instruments atau fallback)
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

    // Olah data siswa (Konversi Number(score) agar bebas dari bug penggabungan string numeric!)
    const studentsData: StudentTheoryRow[] = useMemo(() => {
        const currentGrade = Number(selectedClass?.grade_level) || 10;

        return rawStudents
            .map((sc: any) => {
                const sId = sc.student_id;
                const studentScores = rawScores.filter(
                    (s: any) =>
                        s.student_id === sId &&
                        (!s.master_evaluations?.grade_level ||
                            Number(s.master_evaluations?.grade_level) ===
                                currentGrade)
                );

                // Jika siswa punya skor lintas kelas (misal data lama), fallback ke semua skor miliknya
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
                    if (
                        s.master_evaluations?.type === "pretest" &&
                        numScore !== null
                    ) {
                        pre = numScore;
                        preDate = s.submitted_at || null;
                    }
                    if (
                        s.master_evaluations?.type === "posttest" &&
                        numScore !== null
                    ) {
                        post = numScore;
                        postDate = s.submitted_at || null;
                    }
                });

                const selisih =
                    pre !== null && post !== null ? post - pre : null;

                const status: "complete" | "partial" | "empty" =
                    pre !== null && post !== null
                        ? "complete"
                        : pre !== null || post !== null
                        ? "partial"
                        : "empty";

                // Breakdown jawaban per TP untuk siswa ini
                const tpBreakdown: StudentTheoryRow["tpBreakdown"] = {};
                activeTpList.forEach((tp) => {
                    tpBreakdown[tp.code] = {
                        preCorrect: 0,
                        preTotal: 0,
                        postCorrect: 0,
                        postTotal: 0,
                    };
                });

                rawAnswers.forEach((ans: any) => {
                    if (ans.student_evaluation_scores?.student_id !== sId)
                        return;
                    const code = (
                        ans.question_bank?.learning_objective_code || ""
                    ).trim();
                    const type =
                        ans.student_evaluation_scores?.master_evaluations?.type;
                    if (!code) return;
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
                });

                return {
                    id: sId,
                    name:
                        sc.user_profiles?.full_name || "Siswa Tidak Diketahui",
                    pretest: pre,
                    posttest: post,
                    selisih,
                    preDate,
                    postDate,
                    status,
                    tpBreakdown,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rawStudents, rawScores, rawAnswers, selectedClass, activeTpList]);

    // Statistik & Telemetri Kelas Aktif
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
                  validPost.reduce((a, b) => a + Number(b), 0) /
                      validPost.length
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
        const emptyCount = studentsData.filter(
            (s) => s.status === "empty"
        ).length;
        const activeParticipants = completeCount + partialCount;

        const participationPct =
            totalSiswa > 0
                ? Math.round((activeParticipants / totalSiswa) * 100)
                : 0;

        const kkmPassedCount = validPost.filter((sc) => sc >= 75).length;
        const ketuntasanPct =
            validPost.length > 0
                ? Math.round((kkmPassedCount / validPost.length) * 100)
                : 0;

        // Kalkulasi Bar TP untuk Bento 2
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

            const prePct =
                preT > 0 ? Math.round((preC / preT) * 100) : avgPre;
            const postPct =
                postT > 0 ? Math.round((postC / postT) * 100) : avgPost;

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
            tpBars,
        };
    }, [studentsData, activeTpList]);

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
            `Rekap_Teori_${activeClassName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Rekapitulasi Teori ${activeClassName} berhasil diunduh!`);
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

    const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

    return (
        <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* ====================================================================
                ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
               ==================================================================== */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <BrainCircuit size={16} />{" "}
                        {selectedClass
                            ? `Evaluasi Kognitif • ${activeClassName} • Sinkron ${lastSyncTime || "Live"}`
                            : "Evaluasi Pretest & Posttest Kurikulum PJOK"}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Pantau <br />
                        <span className="font-semibold">Teori Siswa</span> 👋
                    </h1>
                </div>

                {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
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
                            Siswa Kelas
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChartMode("pre")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : `${stats.avgPre}%`}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Rata-rata Pretest
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChartMode("post")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500 group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : `${stats.avgPost}%`}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Rata-rata Posttest
                        </div>
                    </button>
                </div>
            </div>

            {/* ====================================================================
                ZONA 2: 4 BAR TELEMETRI KOGNITIF (MURNI GARIS TANPA PILL BORDER!)
               ==================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
                {/* Bar 1: Rata-rata Pretest */}
                <button
                    type="button"
                    onClick={() => setChartMode("pre")}
                    className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rata-rata Pretest</span>
                        <span>{stats.preCount} Siswa</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor:
                                chartMode === "pre"
                                    ? "#facc15"
                                    : "var(--ref-dark-panel)",
                            color:
                                chartMode === "pre"
                                    ? "#18181b"
                                    : "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-light tracking-tight">
                            {isLoading ? "—" : `${stats.avgPre}%`}
                        </span>
                        <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                                chartMode === "pre" ? "" : "opacity-60"
                            }`}
                        >
                            Tes Awal
                        </span>
                    </div>
                </button>

                {/* Bar 2: Rata-rata Posttest & Gain Score (#facc15 Tajam) */}
                <button
                    type="button"
                    onClick={() => setChartMode("post")}
                    className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rata-rata Posttest</span>
                        <span>
                            {stats.classGain >= 0
                                ? `+${stats.classGain} Pt`
                                : `${stats.classGain} Pt`}
                        </span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor:
                                chartMode === "post"
                                    ? "#facc15"
                                    : "var(--ref-dark-panel)",
                            color:
                                chartMode === "post"
                                    ? "#18181b"
                                    : "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {isLoading ? "—" : `${stats.avgPost}%`}
                        </span>
                        <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                                chartMode === "post" ? "" : "opacity-60"
                            }`}
                        >
                            {stats.postCount} Selesai
                        </span>
                    </div>
                </button>

                {/* Bar 3: Striped Track Murni (TANPA PILL BORDER ANGKA!) */}
                <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Partisipasi Ujian Teori</span>
                        <span>
                            {stats.activeParticipants}/{stats.totalSiswa} Siswa
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
                            {isLoading ? "—" : `${stats.participationPct}%`}
                        </span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
                            style={{ color: "var(--ref-text-primary)" }}
                        >
                            {stats.completeCount} Lengkap Pre & Post
                        </span>
                    </div>
                </div>

                {/* Bar 4: Ketuntasan Kognitif (>= 75) */}
                <div className="sm:col-span-2 lg:col-span-2 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Ketuntasan</span>
                        <span>Skor ≥ 75</span>
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
                            {isLoading ? "—" : `${stats.ketuntasanPct}%`}
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

                    {/* Z-30 AGAR DROPDOWN SELALU DI ATAS TOMBOL BAWAH */}
                    <div className="relative z-30">
                        <h2 className="text-3xl font-light tracking-tight mb-2">
                            Kendali Rombel
                        </h2>
                        <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
                            Pilih jenjang angkatan dan rombel kelas untuk
                            menganalisis hasil Pretest serta Posttest siswa.
                        </p>

                        {/* Filter Jenjang Kelas (Semua / 10 / 11 / 12) */}
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
                                    onClick={() =>
                                        handleGradeFilterChange(g.val as any)
                                    }
                                    className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                                    style={{
                                        backgroundColor:
                                            gradeFilter === g.val
                                                ? "#facc15"
                                                : "transparent",
                                        color:
                                            gradeFilter === g.val
                                                ? "#000"
                                                : "inherit",
                                        opacity:
                                            gradeFilter === g.val ? 1 : 0.5,
                                    }}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>

                        {/* Dropdown Rombel Kelas Solid */}
                        <div
                            className="relative w-full mb-6"
                            ref={classDropdownRef}
                        >
                            <div
                                onClick={() =>
                                    filteredClassesList.length > 0 &&
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
                                        : "Belum Ada Kelas..."}
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
                                        {filteredClassesList.map((cls) => (
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

                    {/* TOMBOL AKSI HIJAU EMERALD #10b981 */}
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={studentsData.length === 0}
                        className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white disabled:opacity-30 disabled:cursor-not-allowed relative z-10"
                        style={{ backgroundColor: "#10b981" }}
                    >
                        <Download size={16} strokeWidth={2.5} /> Ekspor
                        Rekapitulasi CSV
                    </button>
                </div>

                {/* BENTO 2 (PATTERN GRID MILIMETER): CAPAIAN PER TUJUAN PEMBELAJARAN (TP) */}
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
                            <BrainCircuit size={16} /> Capaian Kisi-Kisi TP
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setChartMode(
                                    chartMode === "post" ? "pre" : "post"
                                )
                            }
                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                            style={{
                                backgroundColor: "#facc15",
                                color: "#18181b",
                            }}
                        >
                            Mode {chartMode === "post" ? "Posttest" : "Pretest"}
                        </button>
                    </div>

                    <div className="my-4 flex items-end justify-between gap-3 relative z-10">
                        <div className="flex items-end gap-3 min-w-0">
                            <div className="text-6xl font-light tracking-tighter leading-none shrink-0">
                                {isLoading
                                    ? "—"
                                    : activeTpObj
                                    ? `${
                                          chartMode === "post"
                                              ? activeTpObj.post
                                              : activeTpObj.pre
                                      }%`
                                    : chartMode === "post"
                                    ? `${stats.avgPost}%`
                                    : `${stats.avgPre}%`}
                            </div>
                            <div className="text-xs font-semibold opacity-60 mb-1 line-clamp-2">
                                {activeTpObj
                                    ? `${activeTpObj.code}: ${activeTpObj.title}`
                                    : chartMode === "post"
                                    ? "Rata-rata Posttest Kelas"
                                    : "Rata-rata Pretest Kelas"}
                            </div>
                        </div>
                    </div>

                    {/* Grafik Batang Vertikal Bertitik per Kode TP */}
                    <div
                        className="grid gap-4 items-end pt-4 h-44 relative z-10"
                        style={{
                            gridTemplateColumns: `repeat(${Math.max(
                                1,
                                stats.tpBars.length
                            )}, minmax(0, 1fr))`,
                        }}
                    >
                        {stats.tpBars.map((bar) => {
                            const val =
                                chartMode === "post" ? bar.post : bar.pre;
                            const isHighest =
                                bar.code === highestTpBar.code && val > 0;
                            const isSelected = selectedTpCode === bar.code;

                            return (
                                <button
                                    key={bar.code}
                                    type="button"
                                    onClick={() =>
                                        setSelectedTpCode(
                                            isSelected ? null : bar.code
                                        )
                                    }
                                    className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                                    title={`${bar.code} (${bar.title}): Pretest ${bar.pre}% → Posttest ${bar.post}%`}
                                >
                                    <span className="text-xs font-bold opacity-75">
                                        {val}%
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
                            <Activity size={16} /> Indeks Kognitif Kelas
                        </div>
                        <div className="flex items-center gap-1">
                            {[
                                { key: "posttest", label: "Posttest" },
                                { key: "ketuntasan", label: "Tuntas" },
                                { key: "partisipasi", label: "Aktif" },
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
                            gaugeMode === "posttest"
                                ? `${stats.avgPost}%`
                                : gaugeMode === "ketuntasan"
                                ? `${stats.ketuntasanPct}%`
                                : `${stats.participationPct}%`;

                        const gaugeLabel =
                            gaugeMode === "posttest"
                                ? "Rata-rata Skor Posttest Akhir"
                                : gaugeMode === "ketuntasan"
                                ? "Siswa Mencapai Skor ≥ 75"
                                : "Partisipasi Ujian Kognitif Kelas";

                        const gaugePct =
                            gaugeMode === "posttest"
                                ? stats.avgPost
                                : gaugeMode === "ketuntasan"
                                ? stats.ketuntasanPct
                                : stats.participationPct;

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
                                {/* TEKS LABEL WAJIB BERADA DI BAWAH CHART */}
                                <span className="text-xs font-semibold opacity-60 mt-3 text-center">
                                    {gaugeLabel}
                                </span>
                            </div>
                        );
                    })()}

                    <div className="relative z-10">
                        <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-3 border-t border-black/10 dark:border-white/10">
                            <span>{stats.completeCount} Lengkap</span>
                            <span>•</span>
                            <span>{stats.partialCount} Sebagian</span>
                            <span>•</span>
                            <span>{stats.emptyCount} Kosong</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================================================
                ZONA 4: HEADER FILTER, MODE SWITCHER (BENTO VS TABEL), & PENCARIAN
               ==================================================================== */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mt-12 mb-6 gap-4 relative z-10">
                <div>
                    <h3 className="text-3xl font-light tracking-tight">
                        Rekapitulasi Nilai Teori ({filteredData.length})
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        {[
                            {
                                key: "all",
                                label: `Semua (${stats.totalSiswa})`,
                            },
                            {
                                key: "complete",
                                label: `Lengkap Pre & Post (${stats.completeCount})`,
                            },
                            {
                                key: "partial",
                                label: `Baru 1 Tes (${stats.partialCount})`,
                            },
                            {
                                key: "empty",
                                label: `Belum Ujian (${stats.emptyCount})`,
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

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Switcher Mode Kartu Bento vs Tabel Rekapitulasi */}
                    <div
                        className="flex p-1 rounded-full border"
                        style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.08)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setViewMode("bento")}
                            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            style={{
                                backgroundColor:
                                    viewMode === "bento"
                                        ? "#facc15"
                                        : "transparent",
                                color:
                                    viewMode === "bento" ? "#18181b" : "inherit",
                                opacity: viewMode === "bento" ? 1 : 0.55,
                            }}
                        >
                            <LayoutGrid size={14} /> Kartu Bento
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            style={{
                                backgroundColor:
                                    viewMode === "table"
                                        ? "#facc15"
                                        : "transparent",
                                color:
                                    viewMode === "table" ? "#18181b" : "inherit",
                                opacity: viewMode === "table" ? 1 : 0.55,
                            }}
                        >
                            <Table2 size={14} /> Tabel Lengkap
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-72">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama siswa..."
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
            </div>

            {/* ====================================================================
                ISI ZONA 4: MODE BENTO PASTEL / OBSIDIAN ATAU MODE TABEL LENGKAP
               ==================================================================== */}
            {classes.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                    }}
                >
                    <Users className="w-10 h-10 mb-3" />
                    <div className="text-xl font-light tracking-tight">
                        Belum ada kelas yang dibuka. Buat sesi kelas di
                        Dashboard Guru terlebih dahulu.
                    </div>
                </div>
            ) : isLoading ? (
                <div
                    className="flex items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50 animate-pulse"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                    }}
                >
                    <div className="text-xl font-light tracking-tight">
                        Menarik data evaluasi kognitif siswa...
                    </div>
                </div>
            ) : filteredData.length === 0 ? (
                <div
                    className="flex items-center justify-center p-14 rounded-[2.5rem] border border-dashed opacity-50"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                    }}
                >
                    <div className="text-xl font-light tracking-tight">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                    </div>
                </div>
            ) : viewMode === "bento" ? (
                /* MODE 1: BENTO KARTU PASTEL LIGHT / OBSIDIAN DARK */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
                    {filteredData.map((row, index) => {
                        const bgLight = bentoColors[index % bentoColors.length];
                        const isComplete = row.status === "complete";
                        const isPartial = row.status === "partial";

                        return (
                            <div
                                key={row.id}
                                onClick={() => setSelectedStudent(row)}
                                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
                                style={{
                                    backgroundColor: isDark
                                        ? "#111111"
                                        : bgLight,
                                    borderColor: isComplete
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
                                        KELAS {selectedClass?.grade_level} ·{" "}
                                        {isComplete
                                            ? "PRE & POST SELESAI"
                                            : isPartial
                                            ? "BARU 1 TES"
                                            : "BELUM UJIAN"}
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
                                    <div className="text-4xl font-light tracking-tighter leading-tight mb-3 line-clamp-2">
                                        {row.name}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {row.selisih !== null ? (
                                            <span
                                                className="px-3.5 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    backgroundColor:
                                                        row.selisih >= 0
                                                            ? "#facc15"
                                                            : "var(--ref-tint-rose-bg)",
                                                    color:
                                                        row.selisih >= 0
                                                            ? "#18181b"
                                                            : "var(--ref-tint-rose-text)",
                                                }}
                                            >
                                                Gain:{" "}
                                                {row.selisih > 0
                                                    ? `+${row.selisih}`
                                                    : row.selisih}{" "}
                                                Poin
                                            </span>
                                        ) : (
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
                                                Gain: Menunggu Tes Lengkap
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                            Pretest Awal
                                        </div>
                                        <div className="text-3xl font-light leading-none">
                                            {row.pretest !== null
                                                ? `${row.pretest}`
                                                : "—"}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                            Posttest Akhir
                                        </div>
                                        <div className="text-4xl font-light leading-none text-emerald-600 dark:text-emerald-400">
                                            {row.posttest !== null
                                                ? `${row.posttest}`
                                                : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* MODE 2: TABEL REKAPITULASI LENGKAP */
                <div
                    className="rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col relative z-10 mb-12"
                    style={{
                        backgroundColor: isDark ? "#111111" : "#ffffff",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr
                                    className="text-[10px] uppercase tracking-widest font-bold border-b opacity-50"
                                    style={{
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.08)"
                                            : "rgba(0,0,0,0.08)",
                                    }}
                                >
                                    <th
                                        className="py-5 px-8 sticky left-0 z-10 border-r"
                                        style={{
                                            backgroundColor: isDark
                                                ? "#111111"
                                                : "#ffffff",
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.08)"
                                                : "rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        Nama Siswa
                                    </th>
                                    <th className="py-5 px-8 text-center">
                                        Pretest (Tes Awal)
                                    </th>
                                    <th className="py-5 px-8 text-center">
                                        Posttest (Tes Akhir)
                                    </th>
                                    <th className="py-5 px-8 text-center">
                                        Progres Kognitif (Selisih)
                                    </th>
                                    <th className="py-5 px-8 text-right">
                                        Detail TP
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {filteredData.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => setSelectedStudent(row)}
                                        className="border-b transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <td
                                            className="py-5 px-8 font-bold text-base sticky left-0 z-10 border-r transition-colors"
                                            style={{
                                                backgroundColor: isDark
                                                    ? "#111111"
                                                    : "#ffffff",
                                                borderColor: isDark
                                                    ? "rgba(255,255,255,0.08)"
                                                    : "rgba(0,0,0,0.08)",
                                            }}
                                        >
                                            {row.name}
                                        </td>

                                        <td className="py-5 px-8 text-center">
                                            {row.pretest === null ? (
                                                <span className="opacity-30">
                                                    —
                                                </span>
                                            ) : (
                                                <span
                                                    className="px-4 py-1.5 rounded-xl font-bold text-base inline-block min-w-[64px]"
                                                    style={{
                                                        backgroundColor:
                                                            "var(--ref-tint-rose-bg)",
                                                        color: "var(--ref-tint-rose-text)",
                                                    }}
                                                >
                                                    {row.pretest}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-5 px-8 text-center">
                                            {row.posttest === null ? (
                                                <span className="opacity-30">
                                                    —
                                                </span>
                                            ) : (
                                                <span
                                                    className="px-4 py-1.5 rounded-xl font-bold text-base inline-block min-w-[64px]"
                                                    style={{
                                                        backgroundColor:
                                                            "var(--ref-tint-sky-bg)",
                                                        color: "var(--ref-tint-sky-text)",
                                                    }}
                                                >
                                                    {row.posttest}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-5 px-8 text-center">
                                            {row.selisih === null ? (
                                                <span className="opacity-30">
                                                    —
                                                </span>
                                            ) : (
                                                <span
                                                    className="font-bold text-sm px-5 py-1.5 rounded-full shadow-sm inline-block"
                                                    style={
                                                        row.selisih > 0
                                                            ? {
                                                                  backgroundColor:
                                                                      "#facc15",
                                                                  color: "#18181b",
                                                              }
                                                            : row.selisih < 0
                                                            ? {
                                                                  backgroundColor:
                                                                      "var(--ref-tint-rose-bg)",
                                                                  color: "var(--ref-tint-rose-text)",
                                                              }
                                                            : {
                                                                  backgroundColor:
                                                                      "var(--ref-card-subtle)",
                                                                  color: "var(--ref-text-primary)",
                                                              }
                                                    }
                                                >
                                                    {row.selisih > 0
                                                        ? `+${row.selisih}`
                                                        : row.selisih}{" "}
                                                    Poin
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-5 px-8 text-right">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
                                                Analisis <ArrowUpRight size={14} />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ====================================================================
                MODAL DETAIL KOGNITIF & CAPAIAN TP SISWA
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
                            className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] relative z-10 shadow-2xl border"
                            style={{
                                backgroundColor: isDark ? "#141414" : "#f4f1ea",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(24,24,27,0.08)",
                            }}
                        >
                            {/* HEADER MODAL */}
                            <div
                                className="p-6 sm:p-8 border-b flex justify-between items-center gap-4 shrink-0"
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
                                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                                        Profil Kognitif Siswa •{" "}
                                        {activeClassName}
                                    </span>
                                    <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                                        {selectedStudent.name}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedStudent(null)}
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

                            {/* ISI MODAL */}
                            <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">
                                {/* Ringkasan 3 Kartu Angka */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div
                                        className="p-6 rounded-3xl border"
                                        style={{
                                            backgroundColor: isDark
                                                ? "#111111"
                                                : "#ffffff",
                                            borderColor:
                                                "var(--ref-card-border)",
                                        }}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">
                                            Skor Pretest Awal
                                        </span>
                                        <span className="text-5xl font-light tracking-tighter">
                                            {selectedStudent.pretest !== null
                                                ? selectedStudent.pretest
                                                : "—"}
                                        </span>
                                    </div>

                                    <div
                                        className="p-6 rounded-3xl border"
                                        style={{
                                            backgroundColor: isDark
                                                ? "#111111"
                                                : "#ffffff",
                                            borderColor:
                                                "var(--ref-card-border)",
                                        }}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">
                                            Skor Posttest Akhir
                                        </span>
                                        <span className="text-5xl font-light tracking-tighter text-emerald-500">
                                            {selectedStudent.posttest !== null
                                                ? selectedStudent.posttest
                                                : "—"}
                                        </span>
                                    </div>

                                    <div
                                        className="p-6 rounded-3xl border"
                                        style={{
                                            backgroundColor: "#facc15",
                                            borderColor: "#facc15",
                                            color: "#18181b",
                                        }}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 block mb-2">
                                            Peningkatan (Gain)
                                        </span>
                                        <span className="text-5xl font-semibold tracking-tighter">
                                            {selectedStudent.selisih !== null
                                                ? selectedStudent.selisih > 0
                                                    ? `+${selectedStudent.selisih}`
                                                    : selectedStudent.selisih
                                                : "—"}
                                        </span>
                                    </div>
                                </div>

                                {/* Rincian Capaian Tujuan Pembelajaran (TP) */}
                                <div
                                    className="p-6 sm:p-8 rounded-[2rem] border space-y-4"
                                    style={{
                                        backgroundColor: isDark
                                            ? "#111111"
                                            : "#ffffff",
                                        borderColor: "var(--ref-card-border)",
                                    }}
                                >
                                    <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-2xl font-light tracking-tight">
                                                Rincian Capaian Tujuan
                                                Pembelajaran
                                            </h3>
                                            <p className="text-xs opacity-50 mt-0.5">
                                                Kisi-kisi Instrumen Kognitif
                                                Kelas{" "}
                                                {selectedClass?.grade_level}
                                            </p>
                                        </div>
                                        <BookOpen
                                            size={20}
                                            className="opacity-40"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        {activeTpList.map((tp) => {
                                            const b =
                                                selectedStudent.tpBreakdown[
                                                    tp.code
                                                ];
                                            const hasAnswerDetail =
                                                b &&
                                                (b.preTotal > 0 ||
                                                    b.postTotal > 0);
                                            const prePct =
                                                b && b.preTotal > 0
                                                    ? Math.round(
                                                          (b.preCorrect /
                                                              b.preTotal) *
                                                              100
                                                      )
                                                    : null;
                                            const postPct =
                                                b && b.postTotal > 0
                                                    ? Math.round(
                                                          (b.postCorrect /
                                                              b.postTotal) *
                                                              100
                                                      )
                                                    : null;

                                            return (
                                                <div
                                                    key={tp.code}
                                                    className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                    style={{
                                                        backgroundColor:
                                                            "var(--ref-card-subtle)",
                                                        borderColor:
                                                            "var(--ref-card-border)",
                                                    }}
                                                >
                                                    <div className="space-y-1 max-w-xl">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase"
                                                                style={{
                                                                    backgroundColor:
                                                                        "var(--ref-dark-panel)",
                                                                    color: "#facc15",
                                                                }}
                                                            >
                                                                {tp.code}
                                                            </span>
                                                            {tp.mappingDesc && (
                                                                <span className="text-[11px] font-semibold opacity-50">
                                                                    {
                                                                        tp.mappingDesc
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium leading-snug">
                                                            {tp.text}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {hasAnswerDetail ? (
                                                            <>
                                                                <div className="text-right">
                                                                    <span className="text-[10px] font-bold uppercase opacity-50 block">
                                                                        Pretest
                                                                    </span>
                                                                    <span className="text-sm font-bold">
                                                                        {prePct !==
                                                                        null
                                                                            ? `${prePct}%`
                                                                            : "—"}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[10px] font-bold uppercase opacity-50 block">
                                                                        Posttest
                                                                    </span>
                                                                    <span className="text-sm font-bold text-emerald-500">
                                                                        {postPct !==
                                                                        null
                                                                            ? `${postPct}%`
                                                                            : "—"}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs font-semibold opacity-50">
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
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}