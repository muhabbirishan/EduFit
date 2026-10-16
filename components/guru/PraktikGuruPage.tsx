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
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Download,
    MessageSquare,
    Save,
    Search,
    Sparkles,
    Users,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const GRADE_OPTIONS = [
    { grade: "A", score: 100, label: "Sangat Baik" },
    { grade: "B", score: 75, label: "Baik" },
    { grade: "C", score: 50, label: "Cukup" },
    { grade: "D", score: 25, label: "Perlu Bimbingan" },
];

interface MaterialUnit {
    id: string;
    grade_level: number;
    unit_name: string;
    trigger_question: string;
    order_index: number;
}

interface UnitEvaluationState {
    materialId: string;
    unitName: string;
    answer: string;
    feedback: string;
    practiceNote: string;
    grade: string;
    score: number | null;
    hasStudentAnswer: boolean;
    isGraded: boolean;
}

interface StudentPracticeRow {
    id: string;
    name: string;
    answeredCount: number;
    gradedCount: number;
    practiceCount: number;
    avgScore: number;
    dominantGrade: string;
    status: "graded" | "submitted" | "empty";
    unitStates: Record<string, UnitEvaluationState>;
}

export default function PraktikGuruPage() {
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
        "all" | "submitted" | "graded" | "empty"
    >("all");
    const [gaugeMode, setGaugeMode] = useState<"koreksi" | "nilai" | "praktik">(
        "koreksi"
    );
    const [selectedUnitBar, setSelectedUnitBar] = useState<string | null>(null);

    const [materials, setMaterials] = useState<MaterialUnit[]>([]);
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
    const [savingUnit, setSavingUnit] = useState<string | null>(null);
    const [isSavingAll, setIsSavingAll] = useState(false);

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

    // Ambil daftar seluruh kelas yang diampu Guru
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

    // Filter daftar kelas di dropdown berdasarkan tab jenjang (Semua / 10 / 11 / 12)
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

    // Tarik ekosistem materi, jawaban refleksi, progres materi, & catatan praktik kelas aktif
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
                        "id, grade_level, unit_name, trigger_question, order_index"
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

            const studentIds = stdList
                .map((s: any) => s.student_id)
                .filter(Boolean);

            if (studentIds.length === 0) {
                setRawReflections([]);
                setRawProgress([]);
                setRawPractices([]);
                setIsLoading(false);
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
                    .select(
                        "id, student_id, unit_name, teacher_note, score, created_at"
                    )
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
            toast.error("Gagal memuat data evaluasi materi", {
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

    // Bangun matriks data per siswa x per unit materi (menggabungkan 3 tabel)
    const studentsData: StudentPracticeRow[] = useMemo(() => {
        return rawStudents
            .map((sc: any) => {
                const studentId = sc.student_id;
                const studentName =
                    sc.user_profiles?.full_name || "Siswa Tidak Diketahui";

                const myRefs = rawReflections.filter(
                    (r) => r.student_id === studentId
                );
                const myProgs = rawProgress.filter(
                    (p) => p.student_id === studentId
                );
                const myPracs = rawPractices.filter(
                    (p) => p.student_id === studentId
                );

                const unitStates: Record<string, UnitEvaluationState> = {};
                let answeredCount = 0;
                let gradedCount = 0;
                let practiceCount = 0;
                let scoreSum = 0;

                materials.forEach((mat) => {
                    // 1. Cari di student_reflections (berdasarkan material_id ATAU unit_name)
                    const refMatch = myRefs.find(
                        (r) =>
                            (r.material_id && r.material_id === mat.id) ||
                            (r.unit_name || "").trim().toLowerCase() ===
                                (mat.unit_name || "").trim().toLowerCase()
                    );

                    // 2. Cari di student_material_progress (berdasarkan material_id)
                    const progMatch = myProgs.find(
                        (p) => p.material_id === mat.id
                    );

                    // 3. Cari di optional_practices (berdasarkan unit_name)
                    const pracMatch = myPracs.find(
                        (p) =>
                            (p.unit_name || "").trim().toLowerCase() ===
                            (mat.unit_name || "").trim().toLowerCase()
                    );

                    const rawAnswer =
                        refMatch?.answer_text ||
                        progMatch?.student_reflection ||
                        "";
                    const isAutoPlaceholder =
                        rawAnswer === "Dinilai langsung oleh Guru";

                    const feedback =
                        refMatch?.feedback_text ||
                        progMatch?.teacher_feedback ||
                        "";
                    const practiceNote = pracMatch?.teacher_note || "";

                    const rawScore =
                        refMatch?.score !== null &&
                        refMatch?.score !== undefined
                            ? Number(refMatch.score)
                            : pracMatch?.score !== null &&
                              pracMatch?.score !== undefined
                            ? Number(pracMatch.score)
                            : null;

                    let grade = (refMatch?.grade || "").trim().toUpperCase();
                    if (!grade && rawScore !== null) {
                        if (rawScore >= 90) grade = "A";
                        else if (rawScore >= 75) grade = "B";
                        else if (rawScore >= 50) grade = "C";
                        else grade = "D";
                    }

                    const hasStudentAnswer =
                        Boolean(rawAnswer && rawAnswer.trim() !== "") &&
                        !isAutoPlaceholder;
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
                    gradedCount > 0 &&
                    gradedCount >= Math.max(1, answeredCount)
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
                    avgScore,
                    dominantGrade,
                    status,
                    unitStates,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rawStudents, rawReflections, rawProgress, rawPractices, materials]);

    // Kalkulasi Statistik & Telemetri Kelas
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
                      Math.round(
                          (totalGradedCells / activeSubmissionCells) * 100
                      )
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

        // Data Grafik Batang per Unit Materi (Bento 2)
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
                          (Math.max(unitAnswered, unitGraded) / totalSiswa) *
                              100
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
            totalUnits,
            totalAnsweredCells,
            totalGradedCells,
            totalPracticeNotes,
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

    // Buka Modal Evaluasi Siswa
    const openEvaluation = (student: StudentPracticeRow) => {
        setSelectedStudent(student);
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

    // Fungsi Simpan 1 Unit Materi (Sinkron ke student_reflections, student_material_progress, & optional_practices)
    const persistUnitEvaluation = async (
        studentId: string,
        mat: MaterialUnit,
        data: UnitEvaluationState
    ) => {
        const nowIso = new Date().toISOString();

        // 1. Simpan/Update ke student_reflections
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

        // 2. Sinkronkan juga ke student_material_progress jika barisnya ada
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
                })
                .eq("id", existingProg.id);
        }

        // 3. Simpan/Update ke optional_practices jika ada catatan praktik atau skor
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
            toast.success(
                `Evaluasi "${mat.unit_name}" (${
                    data.grade ? `Predikat ${data.grade}` : "Tersimpan"
                }) berhasil disimpan!`
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
            toast.success(
                `Seluruh evaluasi materi ${selectedStudent.name} berhasil disimpan!`
            );
            await fetchClassPracticeEcosystem(selectedClass);
            setSelectedStudent(null);
        } catch (err: any) {
            toast.error("Gagal menyimpan seluruh evaluasi", {
                description: err.message,
            });
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
        toast.success("Rekap evaluasi materi berhasil diunduh");
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

    const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

    return (
        <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* ====================================================================
                ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
               ==================================================================== */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <Activity size={16} />{" "}
                        {selectedClass
                            ? `Materi, Jurnal & Praktik • ${selectedClass.name} (Kelas ${selectedClass.grade_level}) • Sinkron ${lastSyncTime || "Live"}`
                            : "Evaluasi Pemantik Materi & Praktik Lapangan"}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Evaluasi <br />
                        <span className="font-semibold">Materi</span> 👋
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
                        onClick={() => setStatusFilter("submitted")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500 group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : stats.answeredStudentsCount}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Siswa Aktif
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter("graded")}
                        className="text-left cursor-pointer group"
                    >
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:opacity-80 transition-opacity">
                            {isLoading ? "—" : `${stats.avgClassScore}%`}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Rata-rata Nilai
                        </div>
                    </button>
                </div>
            </div>

            {/* ====================================================================
                ZONA 2: 4 BAR TELEMETRI RUANG GURU (MURNI GARIS TANPA PILL BORDER!)
               ==================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
                {/* Bar 1: Partisipasi Jawaban Pemantik */}
                <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Jawaban Pemantik</span>
                        <span>{stats.totalAnsweredCells} Jawaban</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between"
                        style={{
                            backgroundColor: "var(--ref-dark-panel)",
                            color: "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-light tracking-tight">
                            {isLoading ? "—" : `${stats.answerCoveragePct}%`}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                            Partisipasi
                        </span>
                    </div>
                </div>

                {/* Bar 2: Rata-rata Nilai Materi (#facc15 Tajam) */}
                <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Indeks Nilai Materi</span>
                        <span>Skala A–D</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between"
                        style={{
                            backgroundColor: "#facc15",
                            color: "#18181b",
                        }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {isLoading ? "—" : `${stats.avgClassScore}%`}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            {stats.totalGradedCells} Unit Dinilai
                        </span>
                    </div>
                </div>

                {/* Bar 3: Striped Track Murni (TANPA PILL BORDER ANGKA!) */}
                <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Progres Koreksi Guru</span>
                        <span>
                            {stats.gradedStudentsCount}/{stats.totalSiswa} Siswa
                            Tuntas
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
                            {stats.pendingStudentsCount > 0
                                ? `${stats.pendingStudentsCount} Perlu Koreksi`
                                : "Terkoreksi"}
                        </span>
                    </div>
                </div>

                {/* Bar 4: Unit Kurikulum Aktif */}
                <div className="sm:col-span-2 lg:col-span-2 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Modul Kelas {selectedClass?.grade_level || ""}</span>
                        <span>Kurikulum</span>
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
                            {isLoading ? "—" : `${materials.length} Unit`}
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
                            Pilih Ruang Kelas
                        </h2>
                        <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
                            Filter jenjang angkatan dan pilih rombel kelas untuk
                            menilai pemantik serta praktik siswa.
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
                        <Download size={16} strokeWidth={2.5} /> Ekspor Rekap
                        Materi CSV
                    </button>
                </div>

                {/* BENTO 2 (PATTERN GRID MILIMETER): CAPAIAN PER UNIT MATERI (VERTICAL PILL BARS + DOTS) */}
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
                            <BrainCircuit size={16} /> Capaian Unit Materi
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                            Kelas {selectedClass?.grade_level || "—"}
                        </span>
                    </div>

                    <div className="my-4 flex items-end gap-3 relative z-10">
                        <div className="text-6xl font-light tracking-tighter leading-none">
                            {isLoading
                                ? "—"
                                : activeUnitBarObj
                                ? `${activeUnitBarObj.displayPct}%`
                                : `${stats.avgClassScore || stats.answerCoveragePct}%`}
                        </div>
                        <div className="text-sm font-semibold opacity-50 mb-1 truncate max-w-[200px]">
                            {activeUnitBarObj
                                ? activeUnitBarObj.unitName
                                : stats.avgClassScore > 0
                                ? "Rata-rata Skor Unit"
                                : "Partisipasi Unit"}
                        </div>
                    </div>

                    {/* Grafik Batang Vertikal Bertitik per Unit */}
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
                            <div className="col-span-full text-center text-xs opacity-40 py-10">
                                Belum ada unit materi pada jenjang ini.
                            </div>
                        ) : (
                            stats.unitBars.map((bar) => {
                                const val = bar.displayPct;
                                const isHighest =
                                    bar.code === highestUnitBar.code && val > 0;
                                const isSelected = selectedUnitBar === bar.code;

                                return (
                                    <button
                                        key={bar.code}
                                        type="button"
                                        onClick={() =>
                                            setSelectedUnitBar(
                                                isSelected ? null : bar.code
                                            )
                                        }
                                        className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                                        title={`${bar.unitName}: Skor ${bar.avgScore}% • Dijawab ${bar.answered} Siswa`}
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
                            })
                        )}
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
                            <BookOpen size={16} /> Distribusi Predikat
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
                                : gaugeMode === "nilai"
                                ? `${stats.avgClassScore}%`
                                : `${stats.practiceCoveragePct}%`;

                        const gaugeLabel =
                            gaugeMode === "koreksi"
                                ? "Jawaban Materi Selesai Dinilai"
                                : gaugeMode === "nilai"
                                ? "Rata-rata Skor Materi (A/B/C/D)"
                                : "Catatan Praktik Lapangan Terisi";

                        const gaugePct =
                            gaugeMode === "koreksi"
                                ? stats.gradedRatePct
                                : gaugeMode === "nilai"
                                ? stats.avgClassScore
                                : stats.practiceCoveragePct;

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
                            <span>A: {stats.gradeCounts.A}</span>
                            <span>•</span>
                            <span>B: {stats.gradeCounts.B}</span>
                            <span>•</span>
                            <span>C: {stats.gradeCounts.C}</span>
                            <span>•</span>
                            <span>D: {stats.gradeCounts.D}</span>
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
                        Daftar Evaluasi Siswa ({filteredData.length})
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        {[
                            {
                                key: "all",
                                label: `Semua (${stats.totalSiswa})`,
                            },
                            {
                                key: "submitted",
                                label: `Perlu Koreksi (${stats.pendingStudentsCount})`,
                            },
                            {
                                key: "graded",
                                label: `Tuntas Dinilai (${stats.gradedStudentsCount})`,
                            },
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

            {/* DAFTAR SISWA GRID (PASTEL LIGHT / OBSIDIAN DARK) */}
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
                            Belum ada kelas yang dibuka. Buat kelas di Dashboard
                            terlebih dahulu.
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
                            Menarik jawaban pemantik & jurnal siswa...
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
                            Tidak ada siswa yang cocok dengan filter pencarian.
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
                                        KELAS {selectedClass?.grade_level} ·{" "}
                                        {row.answeredCount}/{materials.length}{" "}
                                        UNIT DIJAWAB
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
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {materials.map((mat, uIdx) => {
                                            const st =
                                                row.unitStates[mat.unit_name];
                                            return (
                                                <span
                                                    key={mat.id}
                                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold border"
                                                    style={{
                                                        backgroundColor:
                                                            st?.isGraded
                                                                ? "#facc15"
                                                                : isDark
                                                                ? "rgba(255,255,255,0.06)"
                                                                : "rgba(0,0,0,0.06)",
                                                        color: st?.isGraded
                                                            ? "#18181b"
                                                            : "inherit",
                                                        borderColor: isDark
                                                            ? "rgba(255,255,255,0.1)"
                                                            : "rgba(0,0,0,0.1)",
                                                    }}
                                                    title={mat.unit_name}
                                                >
                                                    U{uIdx + 1}:{" "}
                                                    {st?.isGraded
                                                        ? st.grade
                                                        : st?.hasStudentAnswer
                                                        ? "✓"
                                                        : "—"}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                            Rata-rata Nilai
                                        </div>
                                        <div className="text-3xl font-light leading-none">
                                            {row.gradedCount > 0
                                                ? `${row.avgScore} (${row.dominantGrade})`
                                                : "—"}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                            Status Koreksi
                                        </div>
                                        {isGraded ? (
                                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                Tuntas ({row.gradedCount}/
                                                {materials.length} Unit)
                                            </div>
                                        ) : isSubmitted ? (
                                            <div className="text-sm font-bold text-amber-700 dark:text-[#facc15]">
                                                Perlu Dinilai (
                                                {row.gradedCount}/
                                                {materials.length})
                                            </div>
                                        ) : (
                                            <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
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

            {/* ====================================================================
                MODAL EVALUASI MATERI, PEMANTIK & PRAKTIK SISWA
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
                            className="w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col rounded-[2.5rem] relative z-10 shadow-2xl border"
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
                                            {selectedClass?.name} • Kelas{" "}
                                            {selectedClass?.grade_level}
                                        </span>
                                        <span
                                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                            style={{
                                                backgroundColor: "#facc15",
                                                color: "#18181b",
                                            }}
                                        >
                                            {materials.length} Unit Kurikulum
                                        </span>
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
                                        className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-md flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                                        style={{ backgroundColor: "#10b981" }}
                                    >
                                        <Save size={15} />
                                        {isSavingAll
                                            ? "Menyimpan..."
                                            : "Simpan Semua Unit"}
                                    </button>

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

                            {/* DAFTAR UNIT MATERI DI DALAM MODAL */}
                            <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">
                                {materials.length === 0 ? (
                                    <div className="p-16 text-center opacity-50">
                                        <Sparkles className="w-10 h-10 mx-auto mb-3" />
                                        <p className="text-xl font-light">
                                            Belum ada modul materi untuk Kelas{" "}
                                            {selectedClass?.grade_level}.
                                        </p>
                                    </div>
                                ) : (
                                    materials.map((mat, idx) => {
                                        const unitState =
                                            evalData[mat.unit_name] || {};
                                        const currentGrade =
                                            unitState.grade || "";

                                        return (
                                            <div
                                                key={mat.id}
                                                className="rounded-[2rem] p-6 sm:p-8 border shadow-sm transition-colors"
                                                style={{
                                                    backgroundColor: isDark
                                                        ? "#111111"
                                                        : "#ffffff",
                                                    borderColor: currentGrade
                                                        ? "rgba(250, 204, 21, 0.45)"
                                                        : isDark
                                                        ? "rgba(255,255,255,0.06)"
                                                        : "rgba(0,0,0,0.06)",
                                                }}
                                            >
                                                {/* Header Unit & Pilihan Predikat A / B / C / D */}
                                                <div
                                                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-5 border-b"
                                                    style={{
                                                        borderColor: isDark
                                                            ? "rgba(255,255,255,0.06)"
                                                            : "rgba(0,0,0,0.06)",
                                                    }}
                                                >
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                                                            Unit 0{idx + 1} •
                                                            Kelas{" "}
                                                            {mat.grade_level}
                                                        </span>
                                                        <h3 className="text-2xl font-light tracking-tight">
                                                            {mat.unit_name}
                                                        </h3>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-widest opacity-50 mr-1">
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
                                                                        className="px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer"
                                                                        style={{
                                                                            backgroundColor:
                                                                                active
                                                                                    ? "#facc15"
                                                                                    : "transparent",
                                                                            color: active
                                                                                ? "#18181b"
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

                                                {/* Isi Evaluasi: Jawaban Pemantik Siswa vs Umpan Balik & Catatan Praktik Guru */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Kiri: Pertanyaan Pemantik & Jawaban Siswa */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                                                            <span className="flex items-center gap-2">
                                                                <MessageSquare
                                                                    size={15}
                                                                />{" "}
                                                                Jawaban Pemantik
                                                                Siswa
                                                            </span>
                                                            {unitState.hasStudentAnswer && (
                                                                <span className="text-emerald-500">
                                                                    ✓ Terisi
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div
                                                            className="p-5 rounded-3xl min-h-[180px] flex flex-col justify-between border"
                                                            style={{
                                                                backgroundColor:
                                                                    isDark
                                                                        ? "#181b24"
                                                                        : "#f6f4ee",
                                                                borderColor:
                                                                    isDark
                                                                        ? "rgba(255,255,255,0.06)"
                                                                        : "rgba(0,0,0,0.06)",
                                                            }}
                                                        >
                                                            <div>
                                                                <p className="text-xs font-semibold italic opacity-65 mb-3">
                                                                    &ldquo;
                                                                    {mat.trigger_question ||
                                                                        "Pertanyaan pemantik unit materi"}
                                                                    &rdquo;
                                                                </p>
                                                                <div className="w-full h-px bg-black/10 dark:bg-white/10 mb-3" />
                                                                {unitState.answer &&
                                                                unitState.answer !==
                                                                    "Dinilai langsung oleh Guru" ? (
                                                                    <p className="text-sm font-medium leading-relaxed">
                                                                        {
                                                                            unitState.answer
                                                                        }
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-sm italic opacity-40">
                                                                        Siswa
                                                                        belum
                                                                        mengirimkan
                                                                        jawaban
                                                                        pemantik
                                                                        pada
                                                                        unit
                                                                        ini.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Kanan: Umpan Balik Guru & Catatan Praktik Lapangan */}
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-emerald-500 mb-2">
                                                                <CheckCircle2
                                                                    size={15}
                                                                />{" "}
                                                                Umpan Balik
                                                                Pemantik &
                                                                Refleksi
                                                            </div>
                                                            <textarea
                                                                value={
                                                                    unitState.feedback ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleFeedbackChange(
                                                                        mat.unit_name,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Berikan koreksi atau apresiasi terhadap pemahaman materi siswa..."
                                                                className="w-full h-24 p-4 rounded-2xl text-sm focus:outline-none resize-none border"
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

                                                        <div>
                                                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-60 mb-2">
                                                                <ClipboardCheck
                                                                    size={15}
                                                                />{" "}
                                                                Catatan Praktik
                                                                Lapangan
                                                                (Opsional)
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    unitState.practiceNote ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePracticeNoteChange(
                                                                        mat.unit_name,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Catatan pengamatan teknik gerak di lapangan (tersimpan ke optional_practices)..."
                                                                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none border"
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
                                                </div>

                                                <div className="mt-6 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSaveSingleUnit(
                                                                mat
                                                            )
                                                        }
                                                        disabled={
                                                            savingUnit ===
                                                            mat.unit_name
                                                        }
                                                        className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                                                        style={{
                                                            backgroundColor:
                                                                "#facc15",
                                                            color: "#18181b",
                                                        }}
                                                    >
                                                        <Save size={16} />{" "}
                                                        {savingUnit ===
                                                        mat.unit_name
                                                            ? "Menyimpan..."
                                                            : "Simpan Evaluasi Unit Ini"}
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