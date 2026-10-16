// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    ArrowUpRight,
    BookOpen,
    BrainCircuit,
    Building2,
    Check,
    ChevronDown,
    Download,
    FileCheck2,
    Play,
    School,
    TrendingUp,
    Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

export default function AdminDashboard() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";

    const [isLoading, setIsLoading] = useState(true);
    const [adminProfile, setAdminProfile] = useState({
        full_name: "Administrator",
        email: "",
        role: "Pemilik Sistem & Kurikulum",
    });

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
            } finally {
                setIsLoading(false);
            }
        }

        fetchHybridEcosystemData();
    }, [selectedSchoolId, selectedGradeFilter]);

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
        return Math.round(
            (counts.bmiStats.normal / counts.bmiStats.total) * 100
        );
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

    const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

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
        toast.success("Laporan CSV berhasil diunduh");
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
        <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* ZONA 1: ARCHITECTURAL HERO HEADER & GIANT NAKED STATS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <School size={16} />{" "}
                        {activeSchoolObj
                            ? `${activeSchoolObj.name} (${activeSchoolObj.school_type})`
                            : `Pusat Kendali Ekosistem EduFit • Sinkron ${lastSyncTime || "Live"}`}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Halo, <br />
                        <span className="font-semibold">
                            {adminProfile.full_name.split(" ")[0]}
                        </span>{" "}
                        👋
                    </h1>
                </div>

                <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
                    <Link href="/admin/institusi" className="group">
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:text-[#f5c84c] transition-colors">
                            {isLoading ? "—" : counts.totalSchools}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4 flex items-center gap-1.5">
                            Sekolah Mitra <ArrowUpRight size={13} />
                        </div>
                    </Link>

                    <Link href="/admin/institusi" className="group">
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:text-[#f5c84c] transition-colors">
                            {isLoading ? "—" : counts.totalGuru}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4 flex items-center gap-1.5">
                            Guru PJOK <ArrowUpRight size={13} />
                        </div>
                    </Link>

                    <Link href="/admin/institusi" className="group">
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none group-hover:text-[#f5c84c] transition-colors">
                            {isLoading ? "—" : counts.totalSiswa}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4 flex items-center gap-1.5">
                            Siswa Aktif <ArrowUpRight size={13} />
                        </div>
                    </Link>
                </div>
            </div>

            {/* ZONA 2: 4 BAR TELEMETRI EKOSISTEM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
                <button
                    type="button"
                    onClick={() => setCognitiveViewMode("pre")}
                    className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rata-rata Pretest</span>
                        <span>Awal</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor: "var(--ref-dark-panel)",
                            color: "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-light tracking-tight">
                            {isLoading ? "—" : `${counts.avgPretest}%`}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                            {counts.totalEvaluations} Paket
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setCognitiveViewMode("post")}
                    className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rata-rata Posttest</span>
                        <span>Akhir</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor: "var(--ref-accent-gold)",
                            color: "#18181b",
                        }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {isLoading ? "—" : `${counts.avgPosttest}%`}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            {kognitifGain >= 0 ? `+${kognitifGain} Poin` : `${kognitifGain} Poin`}
                        </span>
                    </div>
                </button>

                <Link
                    href="/admin/materi"
                    className="sm:col-span-2 lg:col-span-4 space-y-2 block group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Partisipasi Materi & Refleksi</span>
                        <span>{counts.totalReflections} Jawaban</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl p-1.5 border relative overflow-hidden flex items-center transition-transform group-hover:scale-[1.01]"
                        style={{
                            backgroundColor: "var(--ref-card-solid)",
                            borderColor: "var(--ref-card-border)",
                            backgroundImage: "var(--ref-stripe-pattern)",
                        }}
                    >
                        <div
                            className="h-full rounded-xl transition-all duration-500"
                            style={{
                                width: `${Math.max(20, reflectionRate)}%`,
                                backgroundColor: "var(--ref-tint-emerald-bg)",
                            }}
                        />
                        <span
                            className="absolute left-6 text-2xl font-light tracking-tight"
                            style={{ color: "var(--ref-text-primary)" }}
                        >
                            {isLoading ? "—" : `${reflectionRate}%`}
                        </span>
                    </div>
                </Link>

                <Link
                    href="/admin/program"
                    className="sm:col-span-2 lg:col-span-2 space-y-2 block group"
                >
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Data TKJI</span>
                        <span>{counts.totalMetrics} Siswa</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-5 flex items-center justify-center border transition-transform group-hover:scale-[1.02]"
                        style={{
                            backgroundColor: "var(--ref-tint-sky-bg)",
                            borderColor: "var(--ref-tint-sky-border)",
                            color: "var(--ref-tint-sky-text)",
                        }}
                    >
                        <span className="text-2xl font-light tracking-tight">
                            {isLoading ? "—" : `${physicalCoverageRate}%`}
                        </span>
                    </div>
                </Link>
            </div>

            {/* ZONA 3: TRIO KARTU ANALITIK LEBAR (3 KOLOM x col-span-4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-8">
                <div
                    className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-visible flex flex-col justify-between min-h-[390px] border"
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

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-3xl font-light tracking-tight">
                                Cakupan Sistem
                            </h2>
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                                style={{
                                    backgroundColor: "var(--ref-card-subtle)",
                                    borderColor: "var(--ref-card-border)",
                                }}
                                title="Ekspor Laporan CSV"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                        <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
                            Pilih angkatan kelas dan sekolah mitra untuk memfilter seluruh
                            grafik.
                        </p>

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
                                    onClick={() => setSelectedGradeFilter(g.val as any)}
                                    className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                                    style={{
                                        backgroundColor:
                                            selectedGradeFilter === g.val ? "#facc15" : "transparent",
                                        color: selectedGradeFilter === g.val ? "#000" : "inherit",
                                        opacity: selectedGradeFilter === g.val ? 1 : 0.5,
                                    }}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full mb-6" ref={schoolDropdownRef}>
                            <div
                                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.2)"
                                        : "rgba(0,0,0,0.12)",
                                }}
                            >
                                <span className="truncate pr-3">
                                    {activeSchoolObj
                                        ? activeSchoolObj.name
                                        : `Seluruh Sekolah (${counts.totalSchools})`}
                                </span>
                                <ChevronDown
                                    size={24}
                                    className={`transition-transform duration-300 opacity-50 shrink-0 ${isSchoolDropdownOpen ? "rotate-180" : ""
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
                                        className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-60 overflow-y-auto no-scrollbar"
                                        style={{
                                            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.1)"
                                                : "rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        <div
                                            onClick={() => {
                                                setSelectedSchoolId("all");
                                                setIsSchoolDropdownOpen(false);
                                            }}
                                            className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                                                }`}
                                            style={{
                                                color:
                                                    selectedSchoolId === "all"
                                                        ? "#facc15"
                                                        : isDark
                                                            ? "#fff"
                                                            : "#000",
                                            }}
                                        >
                                            Seluruh Sekolah ({counts.totalSchools} Institusi)
                                        </div>
                                        {schoolsList.map((sch) => (
                                            <div
                                                key={sch.id}
                                                onClick={() => {
                                                    setSelectedSchoolId(sch.id);
                                                    setIsSchoolDropdownOpen(false);
                                                }}
                                                className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                                                    }`}
                                                style={{
                                                    color:
                                                        selectedSchoolId === sch.id
                                                            ? "#facc15"
                                                            : isDark
                                                                ? "#fff"
                                                                : "#000",
                                                }}
                                            >
                                                {sch.name} ({sch.siswaCount} Siswa)
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
                                    className="p-3 rounded-2xl border text-left transition-all cursor-pointer"
                                    style={{
                                        backgroundColor: active
                                            ? "rgba(250, 204, 21, 0.16)"
                                            : isDark
                                                ? "rgba(255,255,255,0.03)"
                                                : "rgba(0,0,0,0.02)",
                                        borderColor: active
                                            ? "#facc15"
                                            : isDark
                                                ? "rgba(255,255,255,0.08)"
                                                : "rgba(0,0,0,0.06)",
                                    }}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                                        Kelas {g.grade}
                                    </div>
                                    <div className="text-xl font-light tracking-tight mt-0.5">
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

                {/* KARTU 2: CAPAIAN KOGNITIF + GRAFIK BATANG VERTIKAL BERTITIK */}
                <div
                    className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[390px] border"
                    style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
                            <BrainCircuit size={16} /> Capaian Kognitif & TP
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setCognitiveViewMode(
                                    cognitiveViewMode === "post" ? "pre" : "post"
                                )
                            }
                            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border cursor-pointer transition-colors"
                            style={{
                                backgroundColor: "var(--ref-card-subtle)",
                                borderColor: "var(--ref-card-border)",
                            }}
                        >
                            {cognitiveViewMode === "post" ? "Mode Posttest" : "Mode Pretest"}
                        </button>
                    </div>

                    <div className="my-4 flex items-end justify-between gap-3">
                        <div className="flex items-end gap-3">
                            <div className="text-6xl font-light tracking-tighter leading-none">
                                {isLoading
                                    ? "—"
                                    : cognitiveViewMode === "post"
                                        ? `${counts.avgPosttest}%`
                                        : `${counts.avgPretest}%`}
                            </div>
                            <div className="text-sm font-semibold opacity-50 mb-1">
                                {selectedTpCode
                                    ? `Fokus TP ${selectedTpCode}`
                                    : cognitiveViewMode === "post"
                                        ? "Rata-rata Posttest"
                                        : "Rata-rata Pretest"}
                            </div>
                        </div>

                        {kognitifGain !== 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">
                                <TrendingUp size={15} />{" "}
                                {kognitifGain > 0 ? `+${kognitifGain}` : kognitifGain} pt
                            </div>
                        )}
                    </div>

                    <div
                        className="grid gap-3 items-end pt-4 h-44"
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

                            return (
                                <button
                                    key={bar.code}
                                    type="button"
                                    onClick={() =>
                                        setSelectedTpCode(
                                            selectedTpCode === bar.code ? null : bar.code
                                        )
                                    }
                                    className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                                    title={`${bar.code} (${bar.title}): Pretest ${bar.pre}% → Posttest ${bar.post}%`}
                                >
                                    <span className="text-[11px] font-bold opacity-75">
                                        {val}%
                                    </span>
                                    <div
                                        className="w-3 flex-1 rounded-full flex items-end overflow-hidden p-[1px]"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(255,255,255,0.08)"
                                                : "rgba(24,24,27,0.07)",
                                        }}
                                    >
                                        <div
                                            className="w-full rounded-full transition-all duration-500"
                                            style={{
                                                height: `${Math.max(val > 0 ? 14 : 0, val)}%`,
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
                                                val > 0
                                                    ? isSelected || isHighest
                                                        ? "#facc15"
                                                        : "var(--ref-text-primary)"
                                                    : "var(--ref-text-muted)",
                                        }}
                                    />
                                    <span className="text-[11px] font-bold opacity-60 truncate max-w-full">
                                        {bar.code}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* KARTU 3: CIRCULAR TICK-MARK GAUGE + BAR IMT */}
                <div
                    className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[390px] border"
                    style={{
                        backgroundColor: isDark ? "#111111" : "#ffffff",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
                            <Activity size={16} /> Indeks Fisik, TKJI & IMT
                        </div>
                        <div className="flex items-center gap-1">
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
                            <div className="relative flex items-center justify-center my-2">
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

                    <div>
                        <div
                            className="h-3 w-full rounded-full flex overflow-hidden mb-3"
                            style={{
                                backgroundColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            {counts.bmiStats.total > 0 && (
                                <>
                                    <div
                                        className="h-full bg-blue-400"
                                        style={{
                                            width: `${(counts.bmiStats.kurang / counts.bmiStats.total) * 100
                                                }%`,
                                        }}
                                    />
                                    <div
                                        className="h-full"
                                        style={{
                                            width: `${(counts.bmiStats.normal / counts.bmiStats.total) * 100
                                                }%`,
                                            backgroundColor: "#facc15",
                                        }}
                                    />
                                    <div
                                        className="h-full bg-red-400"
                                        style={{
                                            width: `${(counts.bmiStats.lebih / counts.bmiStats.total) * 100
                                                }%`,
                                        }}
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-400" /> Kurus (
                                {counts.bmiStats.kurang})
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: "#facc15" }}
                                />{" "}
                                Normal ({counts.bmiStats.normal})
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-400" /> Gemuk (
                                {counts.bmiStats.lebih})
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA 4: MATRIKS KURIKULUM (RATA ATAS + DETAIL KETIKA DIFILTER) & PANEL KESIAPAN SISTEM (TANPA SCROLLBAR) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12 relative z-10">
                {/* KIRI (col-span-7): MATRIKS KURIKULUM (TIDAK LAGI MENGAMBANG DI TENGAH SAAT FILTER 1 KELAS!) */}
                <div
                    className="lg:col-span-7 p-8 md:p-10 rounded-[2.5rem] border flex flex-col justify-between gap-6 shadow-sm"
                    style={{
                        backgroundColor: isDark ? "#111111" : "#ffffff",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-3xl font-light tracking-tight">
                                    Matriks Kurikulum & Aktivitas Kelas
                                </h3>
                                <p className="text-sm font-medium opacity-50 mt-1">
                                    Perbandingan modul materi, rombel, capaian ujian, dan koreksi
                                    refleksi per jenjang
                                </p>
                            </div>
                            {selectedGradeFilter !== "all" && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedGradeFilter("all")}
                                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#facc15] text-black cursor-pointer"
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
                                        <div
                                            className="p-5 rounded-3xl border grid grid-cols-1 sm:grid-cols-12 gap-4 items-center transition-colors"
                                            style={{
                                                backgroundColor: "var(--ref-card-subtle)",
                                                borderColor: "var(--ref-card-border)",
                                            }}
                                        >
                                            <div className="sm:col-span-4 flex items-center gap-3.5">
                                                <div
                                                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0"
                                                    style={{
                                                        backgroundColor: "var(--ref-dark-panel)",
                                                        color: "#facc15",
                                                    }}
                                                >
                                                    <span className="text-[9px] uppercase leading-none opacity-75">
                                                        Kelas
                                                    </span>
                                                    <span className="text-base leading-tight">
                                                        {row.grade}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold">
                                                        {row.materialCount} Unit Materi
                                                    </p>
                                                    <p className="text-xs opacity-60">
                                                        {row.classCount} Rombel · {row.evalCount} Ujian
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="sm:col-span-5 space-y-2">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="opacity-70">
                                                        Pre {row.avgPretest}% → Post {row.avgPosttest}%
                                                    </span>
                                                    <span className="text-emerald-500">
                                                        {gradeGain >= 0
                                                            ? `+${gradeGain}%`
                                                            : `${gradeGain}%`}
                                                    </span>
                                                </div>
                                                <div
                                                    className="h-2.5 w-full rounded-full overflow-hidden flex"
                                                    style={{
                                                        backgroundColor: isDark
                                                            ? "rgba(255,255,255,0.08)"
                                                            : "rgba(24,24,27,0.08)",
                                                    }}
                                                >
                                                    <div
                                                        className="h-full bg-blue-400 transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(100, row.avgPretest)}%`,
                                                        }}
                                                    />
                                                    <div
                                                        className="h-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.max(
                                                                0,
                                                                Math.min(
                                                                    100 - row.avgPretest,
                                                                    row.avgPosttest - row.avgPretest
                                                                )
                                                            )}%`,
                                                            backgroundColor: "#facc15",
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-sm font-bold">
                                                        {row.gradedReflectionCount}/{row.reflectionCount}{" "}
                                                        Tugas
                                                    </p>
                                                    <p className="text-[11px] opacity-60">
                                                        Dinilai: {refPct}%
                                                    </p>
                                                </div>
                                                <Link
                                                    href="/admin/materi"
                                                    className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-transform hover:scale-105"
                                                    style={{
                                                        backgroundColor: "var(--ref-card-solid)",
                                                        borderColor: "var(--ref-card-border)",
                                                    }}
                                                >
                                                    <ArrowUpRight size={16} />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Jika sedang difilter 1 kelas, tampilkan daftar unit materi kelas tersebut agar kartu penuh & informatif! */}
                                        {selectedGradeFilter !== "all" &&
                                            gradeMaterials.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                    {gradeMaterials.map((gm, gIdx) => (
                                                        <Link
                                                            key={gm.id}
                                                            href="/admin/materi"
                                                            className="p-4 rounded-2xl border flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
                                                            style={{
                                                                backgroundColor: "var(--ref-card-solid)",
                                                                borderColor: "var(--ref-card-border)",
                                                            }}
                                                        >
                                                            <div className="min-w-0">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block">
                                                                    Unit 0{gIdx + 1} · Kelas {row.grade}
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

                    <div
                        className="pt-4 border-t flex flex-wrap items-center justify-between gap-3"
                        style={{ borderColor: "var(--ref-card-border)" }}
                    >
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                            Rekap Nilai Refleksi Guru ({counts.gradedReflections}/
                            {counts.totalReflections}):
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                {
                                    label: "A (100)",
                                    val: counts.gradeACount,
                                    bg: "var(--ref-tint-emerald-bg)",
                                    text: "var(--ref-tint-emerald-text)",
                                },
                                {
                                    label: "B (75)",
                                    val: counts.gradeBCount,
                                    bg: "var(--ref-tint-sky-bg)",
                                    text: "var(--ref-tint-sky-text)",
                                },
                                {
                                    label: "C (50)",
                                    val: counts.gradeCCount,
                                    bg: "var(--ref-tint-amber-bg)",
                                    text: "var(--ref-tint-amber-text)",
                                },
                                {
                                    label: "D (25)",
                                    val: counts.gradeDCount,
                                    bg: "var(--ref-tint-rose-bg)",
                                    text: "var(--ref-tint-rose-text)",
                                },
                            ].map((g) => (
                                <span
                                    key={g.label}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold"
                                    style={{ backgroundColor: g.bg, color: g.text }}
                                >
                                    {g.label}: {g.val}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KANAN (col-span-5): KESIAPAN SISTEM (BEBAS SCROLLBAR PUTIH KASAR!) */}
                <div
                    className="lg:col-span-5 p-8 md:p-10 rounded-[2.5rem] border flex flex-col justify-between gap-6 shadow-sm"
                    style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div>
                        <div className="flex items-baseline justify-between mb-4">
                            <button
                                type="button"
                                onClick={() => setRightPanelTab("checklist")}
                                className="text-3xl font-light tracking-tight text-left cursor-pointer hover:opacity-80"
                            >
                                Kesiapan Sistem
                            </button>
                            <span className="text-5xl font-light tracking-tighter">
                                {isLoading ? "—" : `${ecosystemReadinessPct}%`}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
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
                                style={{
                                    width: `${materiFlex}%`,
                                    backgroundColor: "#facc15",
                                    color: "#18181b",
                                }}
                                className="h-full rounded-xl flex items-center justify-center px-3 text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer"
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
                                style={{
                                    width: `${ujianFlex}%`,
                                    backgroundColor: "var(--ref-dark-panel)",
                                    color: "#ffffff",
                                }}
                                className="h-full rounded-xl flex items-center justify-center px-3 text-xs font-semibold transition-transform hover:scale-[1.02] cursor-pointer"
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
                                style={{
                                    width: `${mediaFlex}%`,
                                    backgroundColor: isDark
                                        ? "rgba(255,255,255,0.18)"
                                        : "#8e8e96",
                                    color: "#ffffff",
                                }}
                                className="h-full rounded-xl flex items-center justify-center px-3 text-xs font-semibold transition-transform hover:scale-[1.02] cursor-pointer"
                            >
                                Media
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 rounded-[2rem] p-6 flex flex-col justify-between"
                        style={{
                            backgroundColor: "var(--ref-dark-panel)",
                            color: "var(--ref-dark-panel-text)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-medium">
                                {rightPanelTab === "checklist" && "Status Modul Utama"}
                                {rightPanelTab === "materi" && "Daftar Unit Materi"}
                                {rightPanelTab === "ujian" && "Paket Pretest & Posttest"}
                                {rightPanelTab === "media" && "Video Demonstrasi Praktik"}
                            </h4>
                            {rightPanelTab === "checklist" ? (
                                <span className="text-xl font-light text-[#facc15]">
                                    {completedTaskCount}/{ecosystemTasks.length}
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setRightPanelTab("checklist")}
                                    className="text-xs font-bold text-[#facc15] hover:underline cursor-pointer"
                                >
                                    Kembali
                                </button>
                            )}
                        </div>

                        {/* MENGGUNAKAN no-scrollbar AGAR SCROLLBAR PUTIH HILANG TOTAL */}
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
                                                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                                    style={{
                                                        backgroundColor: task.done
                                                            ? "var(--ref-dark-panel-sub)"
                                                            : "#ffffff",
                                                        color: task.done ? "#ffffff" : "#18181b",
                                                    }}
                                                >
                                                    <TaskIcon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate text-white group-hover:text-[#facc15] transition-colors">
                                                        {task.title}
                                                    </p>
                                                    <p
                                                        className="text-xs truncate"
                                                        style={{ color: "var(--ref-dark-panel-muted)" }}
                                                    >
                                                        {task.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                            {task.done ? (
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                                    style={{
                                                        backgroundColor: "#facc15",
                                                        color: "#18181b",
                                                    }}
                                                >
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
                                            <p className="text-xs text-white/60">
                                                Kurikulum Kelas {mat.grade_level}
                                            </p>
                                        </div>
                                        <ArrowUpRight
                                            size={15}
                                            className="text-[#facc15] shrink-0"
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
                                            <p className="text-xs text-white/60 uppercase">
                                                Kelas {ev.grade_level} · {ev.type}
                                            </p>
                                        </div>
                                        <ArrowUpRight
                                            size={15}
                                            className="text-[#facc15] shrink-0"
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
                                            <p className="text-xs text-white/60">
                                                {vid.category} · {vid.duration_label}
                                            </p>
                                        </div>
                                        <Play size={14} className="text-[#facc15] shrink-0" />
                                    </Link>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA 5: GRID KARTU BESAR PASTEL / DARK */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-6">
                    <button
                        type="button"
                        onClick={() => setBottomShowcaseTab("schools")}
                        className={`text-xl font-light tracking-tight transition-opacity cursor-pointer ${bottomShowcaseTab === "schools"
                                ? "opacity-100 font-semibold underline decoration-[#facc15] decoration-2 underline-offset-8"
                                : "opacity-45 hover:opacity-80"
                            }`}
                    >
                        Daftar Sekolah Mitra ({schoolsList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setBottomShowcaseTab("tp")}
                        className={`text-xl font-light tracking-tight transition-opacity cursor-pointer ${bottomShowcaseTab === "tp"
                                ? "opacity-100 font-semibold underline decoration-[#facc15] decoration-2 underline-offset-8"
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
                    className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-80 shadow-md"
                    style={{ backgroundColor: "#facc15", color: "#000" }}
                >
                    <ArrowUpRight size={16} strokeWidth={2.5} />
                    {bottomShowcaseTab === "schools"
                        ? "Kelola Institusi & Guru"
                        : "Kelola Bank Soal"}
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                {bottomShowcaseTab === "schools"
                    ? schoolsList.map((sch, index) => {
                        const bgLight = bentoColors[index % bentoColors.length];
                        const isSelected = selectedSchoolId === sch.id;

                        return (
                            <div
                                key={sch.id}
                                onClick={() =>
                                    setSelectedSchoolId(isSelected ? "all" : sch.id)
                                }
                                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
                                style={{
                                    backgroundColor: isDark ? "#111111" : bgLight,
                                    borderColor: isSelected
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
                                    <span className="text-xs font-bold tracking-widest uppercase opacity-60">
                                        {sch.school_type} • {sch.classCount} Rombel Kelas
                                    </span>
                                    <Link
                                        href="/admin/institusi"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <ArrowUpRight size={20} strokeWidth={1.5} />
                                    </Link>
                                </div>

                                <div className="mt-8 relative z-10">
                                    <div className="text-4xl font-light tracking-tighter mb-8 leading-none">
                                        {sch.name}
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                                Guru PJOK
                                            </div>
                                            <div className="text-3xl font-light leading-none">
                                                {sch.guruCount}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-4xl font-light leading-none">
                                                {sch.siswaCount}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-2">
                                                Siswa
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                    : tpBars.map((tp, index) => {
                        const bgLight = bentoColors[index % bentoColors.length];
                        return (
                            <div
                                key={tp.code}
                                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border"
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
                                    <span className="text-xs font-bold tracking-widest uppercase opacity-60">
                                        Tujuan Pembelajaran • {tp.code}
                                    </span>
                                    <Link
                                        href="/admin/evaluasi"
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <ArrowUpRight size={20} strokeWidth={1.5} />
                                    </Link>
                                </div>

                                <div className="mt-8 relative z-10">
                                    <div className="text-3xl md:text-4xl font-light tracking-tighter mb-8 leading-tight">
                                        {tp.title}
                                    </div>

                                    <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                                Pretest
                                            </div>
                                            <div className="text-3xl font-light leading-none">
                                                {tp.pre}%
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                                Posttest
                                            </div>
                                            <div className="text-4xl font-light leading-none">
                                                {tp.post}%
                                            </div>
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