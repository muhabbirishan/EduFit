"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    CheckCircle2,
    ChevronDown,
    MessageSquare,
    Save,
    Search,
    Users,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const GRADE_OPTIONS = [
    { grade: "A", score: 100 },
    { grade: "B", score: 75 },
    { grade: "C", score: 50 },
    { grade: "D", score: 25 },
];

export default function PraktikGuruPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [evalData, setEvalData] = useState<
        Record<
            string,
            {
                practiceNote: string;
                feedback: string;
                answer: string;
                grade: string;
                score: number | null;
            }
        >
    >({});
    const [isSaving, setIsSaving] = useState(false);

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
                const formattedData = (stdClass || [])
                    .map((sc: any) => ({
                        id: sc.student_id,
                        name:
                            sc.user_profiles?.full_name ||
                            "Siswa Tidak Diketahui",
                    }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));

                setStudentsData(formattedData);

                const { data: mats } = await supabase
                    .from("master_materials")
                    .select("unit_name, trigger_question")
                    .eq("grade_level", selectedClass.grade_level);
                setMaterials(mats || []);
            } catch (error: any) {
                toast.error("Gagal memuat siswa", {
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchStudents();
    }, [selectedClass]);

    const openEvaluation = async (student: any) => {
        setSelectedStudent(student);
        const toastId = toast.loading("Memuat jawaban materi & jurnal siswa...");
        try {
            const { data: pracs } = await supabase
                .from("optional_practices")
                .select("unit_name, teacher_note, score")
                .eq("student_id", student.id);
            const { data: refs } = await supabase
                .from("student_reflections")
                .select("unit_name, answer_text, feedback_text, grade, score")
                .eq("student_id", student.id);

            const combinedData: any = {};
            materials.forEach((mat: any) => {
                const p = pracs?.find(
                    (x: any) => x.unit_name === mat.unit_name
                );
                const r = refs?.find((x: any) => x.unit_name === mat.unit_name);
                combinedData[mat.unit_name] = {
                    practiceNote: p?.teacher_note || "",
                    answer: r?.answer_text || "",
                    feedback: r?.feedback_text || "",
                    grade: r?.grade || "",
                    score: r?.score != null ? Number(r.score) : null,
                };
            });
            setEvalData(combinedData);
            toast.dismiss(toastId);
        } catch (err) {
            toast.error("Gagal memuat data evaluasi", { id: toastId });
        }
    };

    const handleSaveEvaluation = async (unitName: string) => {
        setIsSaving(true);
        const data = evalData[unitName];
        try {
            const { data: existingRef } = await supabase
                .from("student_reflections")
                .select("id")
                .eq("student_id", selectedStudent.id)
                .eq("unit_name", unitName)
                .maybeSingle();

            if (existingRef?.id) {
                await supabase
                    .from("student_reflections")
                    .update({
                        feedback_text: data.feedback,
                        grade: data.grade || null,
                        score: data.score,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingRef.id);
            } else {
                await supabase.from("student_reflections").insert({
                    student_id: selectedStudent.id,
                    unit_name: unitName,
                    answer_text: data.answer || "Dinilai langsung oleh Guru",
                    feedback_text: data.feedback,
                    grade: data.grade || null,
                    score: data.score,
                });
            }

            toast.success(
                `Nilai ${data.grade ? `${data.grade} (${data.score})` : ""} & Umpan Balik "${unitName}" berhasil disimpan!`
            );
        } catch (err: any) {
            toast.error("Gagal menyimpan evaluasi");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGradeSelect = (
        unitName: string,
        grade: string,
        score: number
    ) => {
        setEvalData((prev) => ({
            ...prev,
            [unitName]: { ...prev[unitName], grade, score },
        }));
    };

    const handleFeedbackChange = (unitName: string, text: string) =>
        setEvalData((prev) => ({
            ...prev,
            [unitName]: { ...prev[unitName], feedback: text },
        }));

    const filteredData = studentsData.filter((row) =>
        row.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <Activity size={16} /> Materi, Jurnal & Praktik
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Evaluasi <span className="font-semibold">Materi</span>
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={selectedClass?.id || ""}
                            onChange={(e) =>
                                setSelectedClass(
                                    classes.find((c) => c.id === e.target.value)
                                )
                            }
                            className="w-full sm:w-72 appearance-none px-6 py-4 rounded-full font-bold text-sm outline-none transition-colors cursor-pointer border"
                            style={{
                                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                                color: isDark ? "#ffffff" : "#000000",
                            }}
                        >
                            {classes.length === 0 ? (
                                <option value="">Belum ada kelas</option>
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

                    <div className="relative w-full sm:w-80">
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
                        <p className="font-bold text-lg mb-1">Belum Ada Kelas</p>
                        <p className="text-sm font-normal">
                            Buat kelas di Dashboard terlebih dahulu.
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
                            <div className="flex items-center gap-4 mb-4">
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
                                    <p className="text-xs opacity-50 mt-1">
                                        Klik untuk beri nilai materi (A/B/C/D)
                                    </p>
                                </div>
                            </div>
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
                            className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] relative z-10 shadow-2xl border"
                            style={{
                                backgroundColor: isDark ? "#0a0a0a" : "#f8fafc",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <div
                                className="p-8 border-b flex justify-between items-center shrink-0"
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
                                        Evaluasi:{" "}
                                        <span className="font-semibold">
                                            {selectedStudent.name}
                                        </span>
                                    </h2>
                                    <p className="text-sm font-medium opacity-50">
                                        {selectedClass?.name} • Kelas{" "}
                                        {selectedClass?.grade_level}
                                    </p>
                                </div>
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

                            <div className="p-8 overflow-y-auto flex-1 space-y-6">
                                {materials.length === 0 ? (
                                    <p className="text-center opacity-50 text-lg font-light py-10">
                                        Belum ada modul materi untuk kelas ini.
                                    </p>
                                ) : (
                                    materials.map((mat, idx) => {
                                        const currentGrade =
                                            evalData[mat.unit_name]?.grade ||
                                            "";
                                        return (
                                            <div
                                                key={idx}
                                                className="rounded-3xl p-8 border shadow-sm"
                                                style={{
                                                    backgroundColor: isDark
                                                        ? "#111111"
                                                        : "#ffffff",
                                                    borderColor: isDark
                                                        ? "rgba(255,255,255,0.05)"
                                                        : "rgba(0,0,0,0.05)",
                                                }}
                                            >
                                                <div
                                                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b"
                                                    style={{
                                                        borderColor: isDark
                                                            ? "rgba(255,255,255,0.05)"
                                                            : "rgba(0,0,0,0.05)",
                                                    }}
                                                >
                                                    <h3 className="font-semibold text-xl">
                                                        {mat.unit_name}
                                                    </h3>

                                                    {/* PILIHAN NILAI MATERI A (100), B (75), C (50), D (25) */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-widest opacity-50 mr-2">
                                                            Nilai Materi:
                                                        </span>
                                                        {GRADE_OPTIONS.map(
                                                            (opt) => {
                                                                const active =
                                                                    currentGrade ===
                                                                    opt.grade;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            opt.grade
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleGradeSelect(
                                                                                mat.unit_name,
                                                                                opt.grade,
                                                                                opt.score
                                                                            )
                                                                        }
                                                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                                                                        style={{
                                                                            backgroundColor:
                                                                                active
                                                                                    ? "#facc15"
                                                                                    : "transparent",
                                                                            color: active
                                                                                ? "#000"
                                                                                : isDark
                                                                                ? "#fff"
                                                                                : "#000",
                                                                            borderColor:
                                                                                active
                                                                                    ? "#facc15"
                                                                                    : isDark
                                                                                    ? "rgba(255,255,255,0.15)"
                                                                                    : "rgba(0,0,0,0.15)",
                                                                        }}
                                                                    >
                                                                        {
                                                                            opt.grade
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                            opt.score
                                                                        }
                                                                        )
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-60">
                                                            <MessageSquare
                                                                size={16}
                                                            />{" "}
                                                            Jawaban Pemantik
                                                            Siswa
                                                        </div>
                                                        <div
                                                            className="p-5 rounded-2xl h-40 overflow-y-auto"
                                                            style={{
                                                                backgroundColor:
                                                                    isDark
                                                                        ? "rgba(255,255,255,0.02)"
                                                                        : "rgba(0,0,0,0.02)",
                                                            }}
                                                        >
                                                            <p className="text-xs font-semibold mb-3 italic opacity-70">
                                                                &ldquo;
                                                                {
                                                                    mat.trigger_question
                                                                }
                                                                &rdquo;
                                                            </p>
                                                            <div
                                                                className="w-full h-px mb-3 opacity-20"
                                                                style={{
                                                                    backgroundColor:
                                                                        isDark
                                                                            ? "#fff"
                                                                            : "#000",
                                                                }}
                                                            />
                                                            {evalData[
                                                                mat.unit_name
                                                            ]?.answer ? (
                                                                <p className="text-sm leading-relaxed opacity-80">
                                                                    {
                                                                        evalData[
                                                                            mat
                                                                                .unit_name
                                                                        ].answer
                                                                    }
                                                                </p>
                                                            ) : (
                                                                <p className="text-sm italic opacity-40">
                                                                    Siswa belum
                                                                    menjawab
                                                                    soal
                                                                    pemantik
                                                                    ini.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[#ca8a04]">
                                                            <CheckCircle2
                                                                size={16}
                                                            />{" "}
                                                            Umpan Balik Guru
                                                        </div>
                                                        <textarea
                                                            value={
                                                                evalData[
                                                                    mat
                                                                        .unit_name
                                                                ]?.feedback ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleFeedbackChange(
                                                                    mat.unit_name,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Berikan koreksi atau apresiasi di sini..."
                                                            className="w-full h-40 p-5 rounded-2xl text-sm focus:outline-none resize-none border"
                                                            style={{
                                                                backgroundColor:
                                                                    isDark
                                                                        ? "#1a1a1a"
                                                                        : "#f8fafc",
                                                                color: isDark
                                                                    ? "#fff"
                                                                    : "#000",
                                                                borderColor:
                                                                    isDark
                                                                        ? "rgba(255,255,255,0.1)"
                                                                        : "rgba(0,0,0,0.1)",
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-8 flex justify-end">
                                                    <button
                                                        onClick={() =>
                                                            handleSaveEvaluation(
                                                                mat.unit_name
                                                            )
                                                        }
                                                        disabled={isSaving}
                                                        className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-80"
                                                        style={{
                                                            backgroundColor:
                                                                "#facc15",
                                                            color: "#000",
                                                        }}
                                                    >
                                                        <Save size={18} />{" "}
                                                        Simpan Nilai & Evaluasi
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
        </div>
    );
}