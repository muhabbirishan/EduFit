"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileCheck2, Save, Search, Users, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RancanganGuruPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [planType, setPlanType] = useState<"awal" | "akhir">("awal");
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentProgram, setStudentProgram] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [evalForm, setEvalForm] = useState({
        score_analisis: 0,
        score_fitt: 0,
        score_pemulihan: 0,
        score_evaluasi: 0,
        feedback: "",
    });

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";

    useEffect(() => {
        async function fetchClasses() {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return;
            const { data } = await supabase
                .from("classes")
                .select("id, name, grade_level")
                .eq("guru_id", session.user.id)
                .eq("grade_level", 12)
                .order("created_at", { ascending: false });
            if (data && data.length > 0) {
                setClasses(data);
                setSelectedClass(data[0]);
            }
        }
        fetchClasses();
    }, []);

    useEffect(() => {
        async function fetchStudents() {
            if (!selectedClass) return;
            setIsLoading(true);
            try {
                const { data: stdClass } = await supabase
                    .from("student_classes")
                    .select("student_id, user_profiles(full_name)")
                    .eq("class_id", selectedClass.id);

                const studentIds =
                    stdClass?.map((sc: any) => sc.student_id) || [];

                const { data: programs } = await supabase
                    .from("student_programs")
                    .select("student_id, status, type")
                    .in("student_id", studentIds);

                const formattedData = (stdClass || [])
                    .map((sc: any) => {
                        const progAwal = programs?.find(
                            (p: any) =>
                                p.student_id === sc.student_id &&
                                (p.type || "awal").toLowerCase() === "awal"
                        );
                        const progAkhir = programs?.find(
                            (p: any) =>
                                p.student_id === sc.student_id &&
                                (p.type || "").toLowerCase() === "akhir"
                        );
                        const activeProg =
                            planType === "awal" ? progAwal : progAkhir;

                        return {
                            id: sc.student_id,
                            name:
                                sc.user_profiles?.full_name ||
                                "Siswa Tidak Diketahui",
                            status: activeProg?.status || "belum_mengumpulkan",
                            hasAwal: !!progAwal,
                            hasAkhir: !!progAkhir,
                        };
                    })
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));

                setStudentsData(formattedData);
            } catch (error: any) {
                toast.error("Gagal memuat data", {
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchStudents();
    }, [selectedClass, planType]);

    const loadProgramForModal = async (
        studentId: string,
        targetType: "awal" | "akhir"
    ) => {
        const toastId = toast.loading(
            `Memuat Rancangan ${targetType.toUpperCase()}...`
        );
        try {
            const { data } = await supabase
                .from("student_programs")
                .select("*")
                .eq("student_id", studentId)
                .eq("type", targetType)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            setStudentProgram(data || null);
            if (data) {
                setEvalForm({
                    score_analisis: data.score_analisis || 0,
                    score_fitt: data.score_fitt || 0,
                    score_pemulihan: data.score_pemulihan || 0,
                    score_evaluasi: data.score_evaluasi || 0,
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
        } catch (err) {
            toast.error("Gagal memuat program", { id: toastId });
        }
    };

    const openEvaluation = async (student: any) => {
        setSelectedStudent(student);
        await loadProgramForModal(student.id, planType);
    };

    const handleSaveEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentProgram) return;
        setIsSaving(true);
        try {
            await supabase
                .from("student_programs")
                .update({
                    score_analisis: evalForm.score_analisis,
                    score_fitt: evalForm.score_fitt,
                    score_pemulihan: evalForm.score_pemulihan,
                    score_evaluasi: evalForm.score_evaluasi,
                    feedback: evalForm.feedback,
                    status: "graded",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", studentProgram.id);

            toast.success(
                `Penilaian Rancangan ${planType.toUpperCase()} berhasil disimpan!`
            );
            setStudentsData((prev) =>
                prev.map((s) =>
                    s.id === selectedStudent.id ? { ...s, status: "graded" } : s
                )
            );
            setSelectedStudent(null);
        } catch (err: any) {
            toast.error("Gagal menyimpan penilaian");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredData = studentsData.filter((row) =>
        row.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* HEADER SECTION */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-12 relative z-10">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <FileCheck2 size={16} /> Khusus Kelas 12
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Rancangan <span className="font-semibold">Program</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto shrink-0">
                    {/* TOGGLE RANCANGAN AWAL VS RANCANGAN AKHIR */}
                    <div
                        className="flex p-1.5 rounded-full border"
                        style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.05)",
                        }}
                    >
                        {(["awal", "akhir"] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setPlanType(t)}
                                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                                style={{
                                    backgroundColor:
                                        planType === t
                                            ? "#facc15"
                                            : "transparent",
                                    color:
                                        planType === t
                                            ? "#000"
                                            : isDark
                                            ? "#fff"
                                            : "#000",
                                    opacity: planType === t ? 1 : 0.5,
                                }}
                            >
                                Rancangan {t}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <select
                            value={selectedClass?.id || ""}
                            onChange={(e) =>
                                setSelectedClass(
                                    classes.find((c) => c.id === e.target.value)
                                )
                            }
                            className="w-full sm:w-64 appearance-none px-6 py-4 rounded-full font-bold text-sm outline-none transition-colors cursor-pointer border"
                            style={{
                                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                                color: isDark ? "#ffffff" : "#000000",
                            }}
                        >
                            {classes.length === 0 ? (
                                <option value="">Tidak ada kelas XII</option>
                            ) : (
                                classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} (Kelas {cls.grade_level})
                                    </option>
                                ))
                            )}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none w-5 h-5" />
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama siswa..."
                            className="w-full pl-12 pr-5 py-4 rounded-full text-sm outline-none transition-colors border"
                            style={{
                                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                                color: isDark ? "#ffffff" : "#000000",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* DAFTAR SISWA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
                {classes.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-50">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-bold text-lg mb-1">
                            Menu Khusus Kelas XII
                        </p>
                        <p className="text-sm font-normal">
                            Anda belum mengampu kelas tingkat akhir.
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="col-span-full py-16 text-center opacity-50 animate-pulse text-lg font-light">
                        Menarik data dari server...
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="col-span-full py-16 text-center opacity-50 font-light text-lg">
                        Tidak ada siswa yang cocok.
                    </div>
                ) : (
                    filteredData.map((row) => (
                        <button
                            key={row.id}
                            onClick={() => openEvaluation(row)}
                            className="flex flex-col p-6 rounded-[2rem] border text-left transition-all hover:-translate-y-1 group relative overflow-hidden"
                            style={{
                                backgroundColor: isDark ? "#111111" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <div className="flex items-center gap-4 mb-5">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-colors"
                                    style={{
                                        backgroundColor: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.05)",
                                        color: isDark ? "#fff" : "#000",
                                    }}
                                >
                                    {row.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight truncate max-w-[160px] group-hover:text-[#facc15] transition-colors">
                                        {row.name}
                                    </p>
                                    <p className="text-[11px] opacity-50 mt-1">
                                        Awal: {row.hasAwal ? "✓" : "—"} • Akhir:{" "}
                                        {row.hasAkhir ? "✓" : "—"}
                                    </p>
                                </div>
                            </div>

                            {row.status === "graded" ? (
                                <span
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg w-fit"
                                    style={{
                                        backgroundColor: isDark
                                            ? "rgba(34,197,94,0.1)"
                                            : "#dcfce7",
                                        color: isDark ? "#4ade80" : "#166534",
                                    }}
                                >
                                    Rancangan {planType.toUpperCase()} Dinilai
                                </span>
                            ) : row.status === "submitted" ? (
                                <span
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg w-fit"
                                    style={{
                                        backgroundColor: isDark
                                            ? "rgba(234,179,8,0.1)"
                                            : "#fef9c3",
                                        color: isDark ? "#facc15" : "#854d0e",
                                    }}
                                >
                                    Rancangan {planType.toUpperCase()} Masuk
                                </span>
                            ) : (
                                <span
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg w-fit"
                                    style={{
                                        backgroundColor: isDark
                                            ? "rgba(244,63,94,0.1)"
                                            : "#ffe4e6",
                                        color: isDark ? "#fb7185" : "#e11d48",
                                    }}
                                >
                                    Belum Mengumpulkan ({planType.toUpperCase()})
                                </span>
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* MODAL EVALUASI SISWA */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedStudent(null)}
                        />

                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col rounded-[2.5rem] relative z-10 shadow-2xl border"
                            style={{
                                backgroundColor: isDark ? "#0a0a0a" : "#f8fafc",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <div
                                className="p-8 border-b flex flex-wrap justify-between items-center gap-4 shrink-0"
                                style={{
                                    backgroundColor: isDark
                                        ? "#111111"
                                        : "#ffffff",
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.05)",
                                }}
                            >
                                <div>
                                    <h2 className="text-3xl font-light tracking-tight mb-1">
                                        Rancangan:{" "}
                                        <span className="font-semibold">
                                            {selectedStudent.name}
                                        </span>
                                    </h2>
                                    <p className="text-sm font-medium opacity-50">
                                        Pilih tab Rancangan Awal atau Akhir
                                        untuk membandingkan dan menilai (skala
                                        1-4).
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {(["awal", "akhir"] as const).map((t) => (
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
                                            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border"
                                            style={{
                                                backgroundColor:
                                                    planType === t
                                                        ? "#facc15"
                                                        : "transparent",
                                                color:
                                                    planType === t
                                                        ? "#000"
                                                        : isDark
                                                        ? "#fff"
                                                        : "#000",
                                                borderColor:
                                                    planType === t
                                                        ? "#facc15"
                                                        : isDark
                                                        ? "rgba(255,255,255,0.15)"
                                                        : "rgba(0,0,0,0.15)",
                                            }}
                                        >
                                            Rancangan {t}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="p-3 rounded-full transition-colors hover:bg-red-500 hover:text-white"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-10">
                                {/* KOLOM KIRI: 9 JAWABAN SISWA */}
                                <div className="w-full lg:w-1/2 space-y-6">
                                    <h3
                                        className="font-semibold text-xl border-b pb-4 opacity-80"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.1)"
                                                : "rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        Tugas Rancangan{" "}
                                        {planType.toUpperCase()} Siswa
                                    </h3>

                                    {!studentProgram ? (
                                        <div
                                            className="p-10 text-center border-2 border-dashed rounded-3xl"
                                            style={{
                                                borderColor: isDark
                                                    ? "rgba(255,255,255,0.1)"
                                                    : "rgba(0,0,0,0.1)",
                                            }}
                                        >
                                            <p className="opacity-50 text-lg font-light">
                                                Siswa belum mengumpulkan
                                                Rancangan{" "}
                                                {planType.toUpperCase()}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="1. Prioritas & Data Pendukung"
                                                answer={
                                                    studentProgram.prioritas
                                                }
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="2. Tujuan Latihan"
                                                answer={studentProgram.tujuan}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="3. Frekuensi & Jadwal"
                                                answer={
                                                    studentProgram.frekuensi
                                                }
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="4. Intensitas & Cara Memantau"
                                                answer={
                                                    studentProgram.intensitas
                                                }
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="5. Durasi Sesi"
                                                answer={studentProgram.durasi}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="6. Jenis Latihan"
                                                answer={studentProgram.jenis}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="7. Jeda & Pemulihan Antar Sesi"
                                                answer={studentProgram.jeda}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="8. Progresi"
                                                answer={studentProgram.progresi}
                                            />
                                            <StudentAnswer
                                                isDark={isDark}
                                                label="9. Alasan Keputusan"
                                                answer={studentProgram.alasan}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* KOLOM KANAN: FORM EVALUASI GURU */}
                                <form
                                    onSubmit={handleSaveEvaluation}
                                    className="w-full lg:w-1/2 space-y-6"
                                >
                                    <h3
                                        className="font-semibold text-xl border-b pb-4 opacity-80"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.1)"
                                                : "rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        Penilaian Guru (Skala 1-4)
                                    </h3>

                                    <div className="space-y-4">
                                        <RubricSelect
                                            isDark={isDark}
                                            label="Analisis Hasil"
                                            value={evalForm.score_analisis}
                                            onChange={(v: any) =>
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
                                            label="Kesesuaian FITT"
                                            value={evalForm.score_fitt}
                                            onChange={(v: any) =>
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
                                            label="Pemulihan & Progresi"
                                            value={evalForm.score_pemulihan}
                                            onChange={(v: any) =>
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
                                            label="Alasan & Evaluasi"
                                            value={evalForm.score_evaluasi}
                                            onChange={(v: any) =>
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

                                        <div className="pt-4">
                                            <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 block">
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
                                                className="w-full p-5 rounded-2xl text-sm focus:outline-none resize-none h-40 disabled:opacity-50 border"
                                                style={{
                                                    backgroundColor: isDark
                                                        ? "#111111"
                                                        : "#ffffff",
                                                    color: isDark
                                                        ? "#fff"
                                                        : "#000",
                                                    borderColor: isDark
                                                        ? "rgba(255,255,255,0.05)"
                                                        : "rgba(0,0,0,0.05)",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={
                                                isSaving || !studentProgram
                                            }
                                            className="w-full py-4 text-sm font-bold uppercase tracking-widest rounded-full transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-80"
                                            style={{
                                                backgroundColor: "#facc15",
                                                color: "#000",
                                            }}
                                        >
                                            <Save size={18} />{" "}
                                            {isSaving
                                                ? "Menyimpan..."
                                                : `Simpan Penilaian Rancangan ${planType.toUpperCase()}`}
                                        </button>
                                    </div>
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
        className="p-5 rounded-2xl border"
        style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
        }}
    >
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">
            {label}
        </p>
        <p className="text-sm font-medium leading-relaxed">
            {answer || <span className="italic opacity-30">Kosong</span>}
        </p>
    </div>
);

const RubricSelect = ({
    label,
    value,
    onChange,
    options,
    disabled,
    isDark,
}: any) => (
    <div
        className="p-5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4"
        style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
        }}
    >
        <label className="text-sm font-bold opacity-80 shrink-0">{label}</label>
        <select
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full sm:w-2/3 text-sm px-4 py-2.5 rounded-xl outline-none disabled:opacity-50 cursor-pointer border"
            style={{
                backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
                color: isDark ? "#fff" : "#000",
                borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
            }}
        >
            <option value={0}>Belum Dinilai</option>
            {options.map((opt: any) => (
                <option key={opt.val} value={opt.val}>
                    Skor {opt.val}: {opt.text}
                </option>
            ))}
        </select>
    </div>
);