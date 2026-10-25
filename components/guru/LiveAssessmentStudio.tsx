// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    ArrowUpRight,
    Award,
    Check,
    CheckCircle2,
    ChevronDown,
    Download,
    Hand,
    HeartPulse,
    Lock,
    Maximize2,
    Minimize2,
    Moon,
    Play,
    Radio,
    RefreshCw,
    RotateCcw,
    Save,
    Sparkles,
    Square,
    Sun,
    Timer,
    UserCheck,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type PosType =
    | "IMT"
    | "RUN_60M"
    | "PULL_UP"
    | "SIT_UP"
    | "VERTICAL_JUMP"
    | "ENDURANCE";

interface StudentRow {
    student_id: string;
    full_name: string;
    email: string;
    gender: string;
    hasCompletedPreTest: boolean;
    metrics?: any;
}

const POS_ITEMS: {
    code: PosType;
    step: string;
    shortLabel: string;
    title: string;
    subtitle: string;
    mode: "AUTO_HP" | "MANUAL_GURU";
}[] = [
    {
        code: "IMT",
        step: "POS 01",
        shortLabel: "IMT",
        title: "Komposisi Tubuh (IMT)",
        subtitle: "Berat (kg) & Tinggi (cm)",
        mode: "MANUAL_GURU",
    },
    {
        code: "RUN_60M",
        step: "POS 02",
        shortLabel: "Sprint 60m",
        title: "Lari Cepat 60 Meter",
        subtitle: "Otomatis Berhenti di 60m",
        mode: "AUTO_HP",
    },
    {
        code: "PULL_UP",
        step: "POS 03",
        shortLabel: "Gantung",
        title: "Gantung Angkat / Siku",
        subtitle: "Sinkron Timer 60 Detik",
        mode: "MANUAL_GURU",
    },
    {
        code: "SIT_UP",
        step: "POS 04",
        shortLabel: "Sit-Up",
        title: "Baring Duduk (Sit-Up)",
        subtitle: "Sinkron Timer 60 Detik",
        mode: "MANUAL_GURU",
    },
    {
        code: "VERTICAL_JUMP",
        step: "POS 05",
        shortLabel: "Loncat",
        title: "Loncat Tegak",
        subtitle: "Selisih Raihan Loncat (cm)",
        mode: "MANUAL_GURU",
    },
    {
        code: "ENDURANCE",
        step: "POS 06",
        shortLabel: "1200m / 1000m",
        title: "Lari 1.200m / 1.000m",
        subtitle: "Otomatis Berhenti di Target",
        mode: "AUTO_HP",
    },
];

export default function LiveAssessmentStudio() {
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [guruId, setGuruId] = useState<string | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const classDropdownRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [students, setStudents] = useState<StudentRow[]>([]);
    const [activePos, setActivePos] = useState<PosType>("RUN_60M");
    const [command, setCommand] = useState<string>("STANDBY");
    const [calledIds, setCalledIds] = useState<string[]>([]);
    const [readyIds, setReadyIds] = useState<string[]>([]);
    const [liveFinishFeed, setLiveFinishFeed] = useState<
        { id: string; text: string; time: string }[]
    >([]);
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [dirtyStudentIds, setDirtyStudentIds] = useState<Set<string>>(
        new Set()
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [celebrationBanner, setCelebrationBanner] = useState<string | null>(
        null
    );

    const [remedialModalStudent, setRemedialModalStudent] =
        useState<StudentRow | null>(null);

    const [countdown, setCountdown] = useState<number>(60);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [runElapsedMs, setRunElapsedMs] = useState<number>(0);
    const [runStartedAtIso, setRunStartedAtIso] = useState<string | null>(null);
    const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setMounted(true);
        const onFsChange = () =>
            setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onFsChange);
        return () =>
            document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

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
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (_) {}
    };

    useEffect(() => {
        async function fetchTeacherClasses() {
            setIsLoading(true);
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                setIsLoading(false);
                return;
            }

            setGuruId(session.user.id);

            const { data } = await supabase
                .from("classes")
                .select(
                    "id, name, grade_level, class_code, student_classes(count)"
                )
                .eq("guru_id", session.user.id)
                .order("grade_level", { ascending: false })
                .order("created_at", { ascending: false });

            if (data && data.length > 0) {
                const grade12Classes = data.filter(
                    (c: any) => Number(c.grade_level) === 12
                );
                const listToUse =
                    grade12Classes.length > 0 ? grade12Classes : data;
                setClasses(data);
                setSelectedClass(listToUse[0]);
            } else {
                setIsLoading(false);
            }
        }
        fetchTeacherClasses();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (runTimerRef.current) clearInterval(runTimerRef.current);
        };
    }, []);

    const isRunPos = activePos === "RUN_60M" || activePos === "ENDURANCE";
    const isTimedManualPos = activePos === "PULL_UP" || activePos === "SIT_UP";

    useEffect(() => {
        if (command === "START" && runStartedAtIso && isRunPos) {
            const startMs = new Date(runStartedAtIso).getTime();
            if (runTimerRef.current) clearInterval(runTimerRef.current);
            runTimerRef.current = setInterval(() => {
                const diff = Math.max(0, Date.now() - startMs);
                setRunElapsedMs(diff);
            }, 100);
        } else {
            if (runTimerRef.current) clearInterval(runTimerRef.current);
            if (command === "STANDBY" || command === "READY")
                setRunElapsedMs(0);
        }
        return () => {
            if (runTimerRef.current) clearInterval(runTimerRef.current);
        };
    }, [command, runStartedAtIso, isRunPos]);

    useEffect(() => {
        if (!selectedClass?.id) return;
        loadStudioData(selectedClass.id, true);

        const channel = supabase
            .channel(`guru_live_${selectedClass.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "student_physical_metrics",
                },
                () => {
                    loadStudioData(selectedClass.id, false);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "live_sessions",
                    filter: `class_id=eq.${selectedClass.id}`,
                },
                (payload: any) => {
                    const rec = payload.new;
                    if (rec) {
                        setActivePos((rec.active_pos as PosType) || "RUN_60M");
                        setCommand(rec.command || "STANDBY");
                        setRunStartedAtIso(rec.started_at || null);
                        setCalledIds(
                            Array.isArray(rec.active_student_ids)
                                ? rec.active_student_ids
                                : []
                        );
                    }
                }
            )
            .on(
                "broadcast",
                { event: "student_hand_raise" },
                (payload: {
                    payload?: { student_id?: string; student_name?: string };
                }) => {
                    const sId = payload?.payload?.student_id;
                    const sName = payload?.payload?.student_name || "Siswa";
                    if (sId) {
                        setReadyIds((prev) =>
                            prev.includes(sId) ? prev : [...prev, sId]
                        );
                        toast.success(
                            `${sName} sudah angkat tangan dan siap di garis start.`
                        );
                    }
                }
            )
            .on(
                "broadcast",
                { event: "student_run_finished" },
                (payload: {
                    payload?: {
                        student_id?: string;
                        student_name?: string;
                        pos?: string;
                        time_label?: string;
                        score?: number;
                    };
                }) => {
                    const info = payload?.payload;
                    if (info) {
                        const posName =
                            info.pos === "RUN_60M"
                                ? "Lari Cepat 60m"
                                : "Lari Daya Tahan";
                        const msg = `${
                            info.student_name || "Siswa"
                        } selesai ${posName} dengan waktu ${
                            info.time_label
                        } (Skor ${info.score}/5)`;
                        toast.success(`FINIS OTOMATIS: ${msg}`, {
                            duration: 6000,
                        });
                        setLiveFinishFeed((prev) => [
                            {
                                id: `${Date.now()}-${Math.random()}`,
                                text: msg,
                                time: new Date().toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                }),
                            },
                            ...prev.slice(0, 4),
                        ]);
                        loadStudioData(selectedClass.id, false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedClass?.id]);

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setCountdown((prev: number) => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        if (timerRef.current) clearInterval(timerRef.current);
                        broadcastSession(
                            activePos,
                            "STOP",
                            calledIds,
                            "Waktu 60 Detik Selesai! Silakan simpan repetisi siswa yang sedang diuji."
                        );
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, activePos, calledIds]);

    function isPosDone(m: any, pos: PosType): boolean {
        if (!m) return false;
        if (pos === "IMT") return m.calculated_bmi != null;
        if (pos === "RUN_60M") return m.run_60m_score != null;
        if (pos === "PULL_UP") return m.pull_up_hang_score != null;
        if (pos === "SIT_UP") return m.sit_up_score != null;
        if (pos === "VERTICAL_JUMP") return m.vertical_jump_score != null;
        if (pos === "ENDURANCE") return m.endurance_run_score != null;
        return false;
    }

    function isStudentAllComplete(m: any): boolean {
        if (!m) return false;
        return Boolean(
            m.calculated_bmi != null &&
                m.run_60m_score != null &&
                m.pull_up_hang_score != null &&
                m.sit_up_score != null &&
                m.vertical_jump_score != null &&
                m.endurance_run_score != null
        );
    }

    function countCompletedPos(m: any): number {
        if (!m) return 0;
        let c = 0;
        if (m.calculated_bmi != null) c++;
        if (m.run_60m_score != null) c++;
        if (m.pull_up_hang_score != null) c++;
        if (m.sit_up_score != null) c++;
        if (m.vertical_jump_score != null) c++;
        if (m.endurance_run_score != null) c++;
        return c;
    }

    async function loadStudioData(classId: string, showSpinner: boolean) {
        if (showSpinner) setIsLoading(true);
        try {
            const { data: sessionRow } = await supabase
                .from("live_sessions")
                .select("*")
                .eq("class_id", classId)
                .maybeSingle();

            if (sessionRow) {
                setActivePos((sessionRow.active_pos as PosType) || "RUN_60M");
                setCommand(sessionRow.command || "STANDBY");
                setRunStartedAtIso(sessionRow.started_at || null);
                setCalledIds(
                    Array.isArray(sessionRow.active_student_ids)
                        ? sessionRow.active_student_ids
                        : []
                );
            } else {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                await supabase.from("live_sessions").insert({
                    class_id: classId,
                    guru_id: session?.user?.id || guruId || null,
                    active_pos: "RUN_60M",
                    command: "STANDBY",
                    active_student_ids: [],
                });
            }

            const { data: scRows } = await supabase
                .from("student_classes")
                .select("student_id")
                .eq("class_id", classId);

            const studentIds: string[] = (scRows || []).map(
                (r: any) => r.student_id as string
            );
            if (studentIds.length === 0) {
                setStudents([]);
                setIsLoading(false);
                return;
            }

            const [profRes, metRes, evalScoreRes, masterEvalRes] =
                await Promise.all([
                    supabase
                        .from("user_profiles")
                        .select("id, full_name, email, gender")
                        .in("id", studentIds),
                    supabase
                        .from("student_physical_metrics")
                        .select("*")
                        .in("student_id", studentIds)
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("student_evaluation_scores")
                        .select(
                            "student_id, evaluation_id, score, status, master_evaluations(type, title)"
                        )
                        .in("student_id", studentIds),
                    supabase
                        .from("master_evaluations")
                        .select("id, type, title"),
                ]);

            const preEvalIdSet = new Set<string>();
            (masterEvalRes.data || []).forEach((ev: any) => {
                const t = String(ev.type || "").trim().toLowerCase();
                const ttl = String(ev.title || "").trim().toLowerCase();
                if (t.includes("pre") || ttl.includes("pre")) {
                    preEvalIdSet.add(ev.id);
                }
            });

            // Kumpulkan ID siswa yang sudah menyelesaikan Tahap 01 (Pre-Test)
            const preTestDoneStudentIds = new Set<string>();
            (evalScoreRes.data || []).forEach((row: any) => {
                const evType = String(row.master_evaluations?.type || "")
                    .trim()
                    .toLowerCase();
                const evTitle = String(row.master_evaluations?.title || "")
                    .trim()
                    .toLowerCase();
                const isPre =
                    preEvalIdSet.has(row.evaluation_id) ||
                    evType.includes("pre") ||
                    evTitle.includes("pre");

                if (isPre && row.score !== null && row.score !== undefined) {
                    preTestDoneStudentIds.add(row.student_id);
                }
            });

            const latestMetrics: Record<string, any> = {};
            const detectedReadyIds: string[] = [];

            (metRes.data || []).forEach((m: any) => {
                if (!latestMetrics[m.student_id]) {
                    latestMetrics[m.student_id] = m;
                    if (String(m.field_status || "").startsWith("SIAP")) {
                        detectedReadyIds.push(m.student_id);
                    }
                }
            });

            setReadyIds((prev) =>
                Array.from(new Set([...prev, ...detectedReadyIds]))
            );

            const mappedInputs: Record<string, any> = {};
            const mergedStudents: StudentRow[] = (profRes.data || []).map(
                (p: any) => {
                    const m = latestMetrics[p.id];
                    mappedInputs[p.id] = {
                        weight_kg:
                            m?.weight_kg && Number(m.weight_kg) > 0
                                ? m.weight_kg
                                : "",
                        height_cm:
                            m?.height_cm && Number(m.height_cm) > 0
                                ? m.height_cm
                                : "",
                        run_60m_sec: m?.run_60m_sec ?? "",
                        pull_up_count: m?.pull_up_count ?? "",
                        bent_arm_hang_sec: m?.bent_arm_hang_sec ?? "",
                        sit_up_count: m?.sit_up_count ?? "",
                        vertical_jump_cm: m?.vertical_jump_cm ?? "",
                        endurance_run_min_sec: m?.endurance_run_min_sec ?? "",
                    };
                    return {
                        student_id: p.id,
                        full_name: p.full_name || "Siswa",
                        email: p.email || "",
                        gender: (p.gender || m?.gender || "L")
                            .toString()
                            .toUpperCase(),
                        hasCompletedPreTest: preTestDoneStudentIds.has(p.id),
                        metrics: m,
                    };
                }
            );

            mergedStudents.sort((a: StudentRow, b: StudentRow) =>
                a.full_name.localeCompare(b.full_name)
            );
            setStudents(mergedStudents);

            setInputs((prevInputs) => {
                const nextInputs = { ...mappedInputs };
                dirtyStudentIds.forEach((dirtyId) => {
                    if (prevInputs[dirtyId]) {
                        nextInputs[dirtyId] = prevInputs[dirtyId];
                    }
                });
                return nextInputs;
            });
        } catch (_) {
            toast.error("Gagal memuat studio live asesmen");
        } finally {
            setIsLoading(false);
        }
    }

    function updateStudentInputField(
        studentId: string,
        field: string,
        value: string
    ) {
        setDirtyStudentIds((prev) => new Set(prev).add(studentId));
        setInputs((prev) => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [field]: value,
            },
        }));
    }

    async function broadcastSession(
        nextPos: PosType,
        nextCmd: string,
        nextStudentIds: string[],
        notifText?: string
    ) {
        if (!selectedClass?.id) return;
        const nowIso = new Date().toISOString();
        const nextStartedAt =
            nextCmd === "START"
                ? nowIso
                : nextCmd === "STANDBY" || nextCmd === "READY"
                ? null
                : runStartedAtIso;

        setActivePos(nextPos);
        setCommand(nextCmd);
        setCalledIds(nextStudentIds);
        setRunStartedAtIso(nextStartedAt);

        if (nextCmd === "STANDBY" && nextStudentIds.length === 0) {
            setReadyIds([]);
        }

        const { error } = await supabase.from("live_sessions").upsert(
            {
                class_id: selectedClass.id,
                guru_id: guruId,
                active_pos: nextPos,
                command: nextCmd,
                active_student_ids: nextStudentIds,
                started_at: nextStartedAt,
                updated_at: nowIso,
            },
            { onConflict: "class_id" }
        );

        if (error) {
            toast.error("Gagal menyinkronkan sesi live ke HP siswa.");
        } else if (notifText) {
            toast.success(notifText);
        }
    }

    function handleRequestToggleWave(st: StudentRow) {
        const exists = calledIds.includes(st.student_id);
        if (exists) {
            const nextList = calledIds.filter((id) => id !== st.student_id);
            setReadyIds((prev) => prev.filter((id) => id !== st.student_id));
            broadcastSession(
                activePos,
                nextList.length === 0
                    ? "STANDBY"
                    : command === "START"
                    ? "START"
                    : "READY",
                nextList,
                `${st.full_name} dikeluarkan dari gelombang aktif.`
            );
            return;
        }

        // Sesuai Alur Kelas 12: Siswa wajib menyelesaikan Tahap 01 (Pre-Test) sebelum mengikuti ujian fisik TKJI (Tahap 02)
        if (!st.hasCompletedPreTest) {
            toast.error(
                `${st.full_name} belum menyelesaikan Tahap 01 (Evaluasi Awal / Pre-Test). Siswa wajib menyelesaikan Pre-Test sebelum mengikuti ujian fisik TKJI.`
            );
            return;
        }

        if (
            isPosDone(st.metrics, activePos) ||
            isStudentAllComplete(st.metrics)
        ) {
            setRemedialModalStudent(st);
            return;
        }

        const nextList = [...calledIds, st.student_id];
        broadcastSession(
            activePos,
            "READY",
            nextList,
            `Undangan dikirim ke HP ${st.full_name}! Menunggu siswa angkat tangan.`
        );
    }

    async function toggleManualHandRaise(st: StudentRow) {
        const isAlreadyReady = readyIds.includes(st.student_id);
        if (isAlreadyReady) {
            setReadyIds((prev) => prev.filter((id) => id !== st.student_id));
            return;
        }
        setReadyIds((prev) => [...prev, st.student_id]);
        toast.success(`${st.full_name} ditandai HADIR & SIAP di garis start.`);
    }

    async function confirmActivateRemedial(st: StudentRow) {
        setRemedialModalStudent(null);
        if (st.metrics?.id) {
            const currentOriginal =
                st.metrics.original_tkji_score ??
                st.metrics.total_tkji_score ??
                null;
            const nextAttempt = (Number(st.metrics.attempt_count) || 1) + 1;
            await supabase
                .from("student_physical_metrics")
                .update({
                    is_remedial: true,
                    attempt_count: nextAttempt,
                    original_tkji_score: currentOriginal,
                    field_status: "REMEDIAL",
                })
                .eq("id", st.metrics.id);
        }
        const nextList = [...new Set([...calledIds, st.student_id])];
        await broadcastSession(
            activePos,
            "READY",
            nextList,
            `Mode REMEDIAL dibuka untuk ${st.full_name}! Skor awal tetap tersimpan.`
        );
        if (selectedClass?.id) loadStudioData(selectedClass.id, false);
    }

    async function handleFalseStartReset() {
        setRunElapsedMs(0);
        await broadcastSession(
            activePos,
            "READY",
            calledIds,
            "FALSE START! Stopwatch seluruh siswa di gelombang ini di-reset ke 00.0!"
        );
    }

    async function handleMarkMedicalSuspend(st: StudentRow) {
        const nextCalled = calledIds.filter((id) => id !== st.student_id);
        setReadyIds((prev) => prev.filter((id) => id !== st.student_id));
        await broadcastSession(
            activePos,
            nextCalled.length === 0 ? "STANDBY" : command,
            nextCalled
        );

        const isMale = st.gender === "L" || st.gender.includes("PUTRA");
        if (st.metrics?.id) {
            await supabase
                .from("student_physical_metrics")
                .update({ field_status: "MEDIS_TUNDA" })
                .eq("id", st.metrics.id);
        } else {
            await supabase.from("student_physical_metrics").insert({
                student_id: st.student_id,
                gender: isMale ? "L" : "P",
                birth_date: "2009-01-01",
                weight_kg: 0,
                height_cm: 0,
                field_status: "MEDIS_TUNDA",
            });
        }
        toast.success(
            `Status ${st.full_name} diubah ke TUNDA MEDIS. Nilai pos yang sudah dikerjakan tetap aman.`
        );
        if (selectedClass?.id) loadStudioData(selectedClass.id, false);
    }

    function callNextWaveOfFive() {
        const unfinishedOnCurrentPos = students.filter(
            (st: StudentRow) =>
                st.hasCompletedPreTest &&
                !isPosDone(st.metrics, activePos) &&
                st.metrics?.field_status !== "MEDIS_TUNDA"
        );

        const nextFiveIds = unfinishedOnCurrentPos
            .slice(0, 5)
            .map((s: StudentRow) => s.student_id);
        if (nextFiveIds.length === 0) {
            toast.warning(
                `Tidak ada siswa di antrean yang sudah menyelesaikan Pre-Test untuk dinilai pada ${activePos}!`
            );
            return;
        }

        setReadyIds([]);
        broadcastSession(
            activePos,
            "READY",
            nextFiveIds,
            `Undangan sistem dikirim ke ${nextFiveIds.length} siswa yang telah tuntas Pre-Test!`
        );
    }

    function callAllUnfinishedOnCurrentPos() {
        const unfinishedIds = students
            .filter(
                (st: StudentRow) =>
                    st.hasCompletedPreTest &&
                    !isPosDone(st.metrics, activePos) &&
                    st.metrics?.field_status !== "MEDIS_TUNDA"
            )
            .map((s) => s.student_id);

        if (unfinishedIds.length === 0) {
            toast.warning(
                `Tidak ada siswa yang memenuhi syarat (Selesai Pre-Test) untuk dipanggil pada ${activePos}!`
            );
            return;
        }

        setReadyIds([]);
        broadcastSession(
            activePos,
            "READY",
            unfinishedIds,
            `Memanggil ${unfinishedIds.length} siswa yang siap diuji pada ${activePos}!`
        );
    }

    function formatRunMasterDisplay(): string {
        if (activePos === "RUN_60M") {
            const sec = (runElapsedMs / 1000).toFixed(1);
            return `${sec}s`;
        }
        const totalSec = Math.floor(runElapsedMs / 1000);
        const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
        const ss = String(totalSec % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    function computeTkjiAndBmi(st: StudentRow, rawInput: any) {
        const isMale = st.gender === "L" || st.gender.includes("PUTRA");
        const m = st.metrics || {};

        const weight = parseFloat(rawInput.weight_kg ?? m.weight_kg ?? 0);
        const height = parseFloat(rawInput.height_cm ?? m.height_cm ?? 0);
        let bmi = m.calculated_bmi ?? null;
        let bmiCategory = m.bmi_category ?? null;

        if (weight > 0 && height > 0) {
            const hm = height / 100.0;
            bmi = parseFloat((weight / (hm * hm)).toFixed(2));
            if (bmi < 17.0) bmiCategory = "Sangat Kurus";
            else if (bmi < 18.5) bmiCategory = "Kurus";
            else if (bmi <= 24.9) bmiCategory = "Normal";
            else if (bmi <= 29.9) bmiCategory = "Overweight";
            else bmiCategory = "Obesitas";
        }

        const run60 = parseFloat(rawInput.run_60m_sec ?? m.run_60m_sec ?? 0);
        let s1 = m.run_60m_score || 0;
        if (run60 > 0) {
            if (isMale) {
                s1 =
                    run60 <= 7.2
                        ? 5
                        : run60 <= 8.3
                        ? 4
                        : run60 <= 9.6
                        ? 3
                        : run60 <= 11.0
                        ? 2
                        : 1;
            } else {
                s1 =
                    run60 <= 8.4
                        ? 5
                        : run60 <= 9.8
                        ? 4
                        : run60 <= 11.4
                        ? 3
                        : run60 <= 13.4
                        ? 2
                        : 1;
            }
        }

        let s2 = m.pull_up_hang_score || 0;
        if (
            isMale &&
            rawInput.pull_up_count !== "" &&
            rawInput.pull_up_count !== undefined
        ) {
            const pu = parseInt(rawInput.pull_up_count, 10);
            if (!isNaN(pu)) {
                s2 =
                    pu >= 19
                        ? 5
                        : pu >= 14
                        ? 4
                        : pu >= 9
                        ? 3
                        : pu >= 5
                        ? 2
                        : 1;
            }
        } else if (
            !isMale &&
            rawInput.bent_arm_hang_sec !== "" &&
            rawInput.bent_arm_hang_sec !== undefined
        ) {
            const bah = parseInt(rawInput.bent_arm_hang_sec, 10);
            if (!isNaN(bah)) {
                s2 =
                    bah >= 41
                        ? 5
                        : bah >= 22
                        ? 4
                        : bah >= 10
                        ? 3
                        : bah >= 3
                        ? 2
                        : 1;
            }
        }

        let s3 = m.sit_up_score || 0;
        if (
            rawInput.sit_up_count !== "" &&
            rawInput.sit_up_count !== undefined
        ) {
            const su = parseInt(rawInput.sit_up_count, 10);
            if (!isNaN(su)) {
                if (isMale) {
                    s3 =
                        su >= 41
                            ? 5
                            : su >= 30
                            ? 4
                            : su >= 21
                            ? 3
                            : su >= 10
                            ? 2
                            : 1;
                } else {
                    s3 =
                        su >= 28
                            ? 5
                            : su >= 20
                            ? 4
                            : su >= 10
                            ? 3
                            : su >= 3
                            ? 2
                            : 1;
                }
            }
        }

        let s4 = m.vertical_jump_score || 0;
        if (
            rawInput.vertical_jump_cm !== "" &&
            rawInput.vertical_jump_cm !== undefined
        ) {
            const vj = parseInt(rawInput.vertical_jump_cm, 10);
            if (!isNaN(vj)) {
                if (isMale) {
                    s4 =
                        vj >= 73
                            ? 5
                            : vj >= 60
                            ? 4
                            : vj >= 50
                            ? 3
                            : vj >= 39
                            ? 2
                            : 1;
                } else {
                    s4 =
                        vj >= 50
                            ? 5
                            : vj >= 39
                            ? 4
                            : vj >= 31
                            ? 3
                            : vj >= 23
                            ? 2
                            : 1;
                }
            }
        }

        let s5 = m.endurance_run_score || 0;
        const rawEndStr = (
            rawInput.endurance_run_min_sec ||
            m.endurance_run_min_sec ||
            ""
        )
            .toString()
            .trim();
        const normalizedEndStr = rawEndStr.replace(".", ":");
        if (normalizedEndStr.includes(":")) {
            const parts = normalizedEndStr.split(":");
            const totalSec =
                (parseInt(parts[0], 10) || 0) * 60 +
                (parseInt(parts[1], 10) || 0);
            if (totalSec > 0) {
                if (isMale) {
                    s5 =
                        totalSec <= 194
                            ? 5
                            : totalSec <= 265
                            ? 4
                            : totalSec <= 312
                            ? 3
                            : totalSec <= 393
                            ? 2
                            : 1;
                } else {
                    s5 =
                        totalSec <= 232
                            ? 5
                            : totalSec <= 296
                            ? 4
                            : totalSec <= 358
                            ? 3
                            : totalSec <= 443
                            ? 2
                            : 1;
                }
            }
        }

        const totalTkji = s1 + s2 + s3 + s4 + s5;
        const hasAnyTkjiPos = totalTkji > 0;
        const tkjiCategory = !hasAnyTkjiPos
            ? null
            : totalTkji >= 22
            ? "Baik Sekali"
            : totalTkji >= 18
            ? "Baik"
            : totalTkji >= 14
            ? "Sedang"
            : totalTkji >= 10
            ? "Kurang"
            : "Kurang Sekali";

        const allSixComplete = Boolean(
            bmi != null && s1 > 0 && s2 > 0 && s3 > 0 && s4 > 0 && s5 > 0
        );

        return {
            weight: weight || m.weight_kg || 0,
            height: height || m.height_cm || 0,
            bmi,
            bmiCategory,
            s1,
            s2,
            s3,
            s4,
            s5,
            endStr: normalizedEndStr || null,
            totalTkji: hasAnyTkjiPos ? totalTkji : null,
            tkjiCategory,
            allSixComplete,
        };
    }

    async function handleSaveStudent(st: StudentRow, overrideInput?: any) {
        setSavingId(st.student_id);
        const raw = overrideInput || inputs[st.student_id] || {};
        const calc = computeTkjiAndBmi(st, raw);
        const isMale = st.gender === "L" || st.gender.includes("PUTRA");

        const payload: any = {
            student_id: st.student_id,
            gender: isMale ? "L" : "P",
            birth_date: st.metrics?.birth_date || "2009-01-01",
            weight_kg: calc.weight,
            height_cm: calc.height,
            calculated_bmi: calc.bmi,
            bmi_category: calc.bmiCategory,
            run_60m_sec:
                raw.run_60m_sec !== ""
                    ? parseFloat(raw.run_60m_sec)
                    : st.metrics?.run_60m_sec ?? null,
            run_60m_score: calc.s1 || null,
            pull_up_count:
                isMale && raw.pull_up_count !== ""
                    ? parseInt(raw.pull_up_count, 10)
                    : st.metrics?.pull_up_count ?? null,
            bent_arm_hang_sec:
                !isMale && raw.bent_arm_hang_sec !== ""
                    ? parseInt(raw.bent_arm_hang_sec, 10)
                    : st.metrics?.bent_arm_hang_sec ?? null,
            pull_up_hang_score: calc.s2 || null,
            sit_up_count:
                raw.sit_up_count !== ""
                    ? parseInt(raw.sit_up_count, 10)
                    : st.metrics?.sit_up_count ?? null,
            sit_up_score: calc.s3 || null,
            vertical_jump_cm:
                raw.vertical_jump_cm !== ""
                    ? parseInt(raw.vertical_jump_cm, 10)
                    : st.metrics?.vertical_jump_cm ?? null,
            vertical_jump_score: calc.s4 || null,
            endurance_run_min_sec: calc.endStr,
            endurance_run_score: calc.s5 || null,
            total_tkji_score: calc.totalTkji,
            tkji_category: calc.tkjiCategory,
            field_status: calc.allSixComplete
                ? "NORMAL"
                : st.metrics?.is_remedial
                ? "REMEDIAL"
                : "NORMAL",
        };

        const { error } = st.metrics?.id
            ? await supabase
                  .from("student_physical_metrics")
                  .update(payload)
                  .eq("id", st.metrics.id)
            : await supabase.from("student_physical_metrics").insert(payload);

        if (error) {
            toast.error(`Gagal menyimpan nilai ${st.full_name}`, {
                description: error.message,
            });
        } else {
            setDirtyStudentIds((prev) => {
                const next = new Set(prev);
                next.delete(st.student_id);
                return next;
            });
            setReadyIds((prev) => prev.filter((id) => id !== st.student_id));

            const remainingWave = calledIds.filter(
                (id) => id !== st.student_id
            );
            await broadcastSession(
                activePos,
                remainingWave.length === 0 ? "STANDBY" : command,
                remainingWave
            );

            if (calc.allSixComplete) {
                const statusLabel = st.metrics?.is_remedial
                    ? `REMEDIAL #${
                          st.metrics?.attempt_count || 2
                      } (Skor Awal: ${st.metrics?.original_tkji_score ?? "-"})`
                    : "MURNI • ASLI";
                const msg = `Seluruh 6 Pos ${st.full_name} Selesai! Total TKJI: ${calc.totalTkji}/25 [${calc.tkjiCategory} • ${statusLabel}] & IMT: ${calc.bmi} (${calc.bmiCategory}) telah tampil di HP siswa!`;
                setCelebrationBanner(msg);
                toast.success(msg, { duration: 6000 });
            } else {
                toast.success(
                    `Nilai ${st.full_name} pada ${activePos} tersimpan! Siswa otomatis dipindahkan dari gelombang aktif.`
                );
            }
            if (selectedClass?.id) {
                await loadStudioData(selectedClass.id, false);
            }
        }
        setSavingId(null);
    }

    const handleExportCSV = () => {
        if (students.length === 0) {
            toast.error("Tidak ada data siswa untuk diekspor");
            return;
        }
        const headers = [
            "Nama Siswa",
            "L/P",
            "Berat (kg)",
            "Tinggi (cm)",
            "IMT",
            "Kategori IMT",
            "Lari 60m (dtk)",
            "Skor Lari 60m",
            "Gantung (rep/dtk)",
            "Skor Gantung",
            "Sit-Up (rep)",
            "Skor Sit-Up",
            "Loncat Tegak (cm)",
            "Skor Loncat",
            "Lari Jauh (mm:ss)",
            "Skor Lari Jauh",
            "Total Skor TKJI",
            "Kategori TKJI",
            "Status Lapangan",
        ];
        const rows = students.map((st) => {
            const m = st.metrics || {};
            const isMale = st.gender === "L" || st.gender.includes("PUTRA");
            return [
                `"${st.full_name.replace(/"/g, '""')}"`,
                isMale ? "L" : "P",
                m.weight_kg ?? "-",
                m.height_cm ?? "-",
                m.calculated_bmi ?? "-",
                `"${m.bmi_category || "-"}"`,
                m.run_60m_sec ?? "-",
                m.run_60m_score ?? "-",
                isMale ? m.pull_up_count ?? "-" : m.bent_arm_hang_sec ?? "-",
                m.pull_up_hang_score ?? "-",
                m.sit_up_count ?? "-",
                m.sit_up_score ?? "-",
                m.vertical_jump_cm ?? "-",
                m.vertical_jump_score ?? "-",
                `"${m.endurance_run_min_sec || "-"}"`,
                m.endurance_run_score ?? "-",
                m.total_tkji_score ?? "-",
                `"${m.tkji_category || "-"}"`,
                `"${m.field_status || "NORMAL"}"`,
            ];
        });

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute(
            "download",
            `Rekap_TKJI_${selectedClass?.name || "Kelas"}_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Rekap pengukuran TKJI & IMT berhasil diunduh!");
    };

    const classAvgTkji = useMemo(() => {
        const scored = students.filter(
            (s) => (Number(s.metrics?.total_tkji_score) || 0) > 0
        );
        if (scored.length === 0) return 0;
        const sum = scored.reduce(
            (acc, s) => acc + (Number(s.metrics?.total_tkji_score) || 0),
            0
        );
        return Number((sum / scored.length).toFixed(1));
    }, [students]);

    const currentPosDoneCount = useMemo(() => {
        return students.filter((s) => isPosDone(s.metrics, activePos)).length;
    }, [students, activePos]);

    const currentPosCompletionPct = useMemo(() => {
        if (students.length === 0) return 0;
        return Math.round((currentPosDoneCount / students.length) * 100);
    }, [currentPosDoneCount, students.length]);

    if (!mounted) return null;

    const hasActiveWave = calledIds.length > 0;
    const calledReadyIds = calledIds.filter((id) => readyIds.includes(id));
    const calledReadyCount = calledReadyIds.length;
    const unfinishedCurrentPosCount = students.filter(
        (s) =>
            !isPosDone(s.metrics, activePos) &&
            s.metrics?.field_status !== "MEDIS_TUNDA"
    ).length;

    const calledStudentsList = students.filter((s) =>
        calledIds.includes(s.student_id)
    );
    const queueStudentsList = students.filter(
        (s) =>
            !calledIds.includes(s.student_id) &&
            !isStudentAllComplete(s.metrics)
    );
    const completedStudentsList = students.filter(
        (s) =>
            !calledIds.includes(s.student_id) &&
            isStudentAllComplete(s.metrics)
    );

    const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

    const renderStudentRow = (
        st: StudentRow,
        idx: number,
        zone: "CALLED" | "QUEUE" | "COMPLETED"
    ) => {
        const isCalled = zone === "CALLED";
        const isReadyHandRaised = readyIds.includes(st.student_id);
        const isLockedByActiveWave = hasActiveWave && !isCalled;
        const isMale = st.gender === "L" || st.gender.includes("PUTRA");
        const inp = inputs[st.student_id] || {};
        const m = st.metrics || {};
        const doneCount = countCompletedPos(m);
        const allComplete = isStudentAllComplete(m);
        const isRemedial = Boolean(m.is_remedial);
        const isMedis = m.field_status === "MEDIS_TUNDA";

        return (
            <div
                key={st.student_id}
                className={`p-6 md:p-8 transition-all ${
                    isLockedByActiveWave ? "opacity-45" : ""
                }`}
                style={{
                    backgroundColor: isCalled
                        ? isDark
                            ? "rgba(250,204,21,0.06)"
                            : "rgba(250,204,21,0.10)"
                        : "transparent",
                }}
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button
                            type="button"
                            onClick={() => handleRequestToggleWave(st)}
                            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all shrink-0 w-fit cursor-pointer ${
                                !st.hasCompletedPreTest
                                    ? "opacity-50"
                                    : "hover:scale-[1.02]"
                            }`}
                            style={{
                                backgroundColor: !st.hasCompletedPreTest
                                    ? "transparent"
                                    : isCalled
                                    ? "rgba(239, 68, 68, 0.12)"
                                    : allComplete
                                    ? "transparent"
                                    : isDark
                                    ? "#1e2028"
                                    : "#18181b",
                                color: !st.hasCompletedPreTest
                                    ? isDark
                                        ? "#94a3b8"
                                        : "#71717a"
                                    : isCalled
                                    ? "#ef4444"
                                    : allComplete
                                    ? isDark
                                        ? "#94a3b8"
                                        : "#52525b"
                                    : "#ffffff",
                                borderColor: isCalled
                                    ? "rgba(239, 68, 68, 0.35)"
                                    : isDark
                                    ? "rgba(255,255,255,0.14)"
                                    : "rgba(0,0,0,0.12)",
                            }}
                        >
                            {!st.hasCompletedPreTest ? (
                                <>
                                    <Lock size={14} /> Belum Pre-Test
                                </>
                            ) : (
                                <>
                                    <UserCheck size={15} />
                                    {isCalled
                                        ? "Keluarkan"
                                        : allComplete
                                        ? "Uji Remedial?"
                                        : `Panggil #${idx + 1}`}
                                </>
                            )}
                        </button>

                        <div className="space-y-2">
                            <div className="text-2xl font-light tracking-tight flex flex-wrap items-center gap-3">
                                <span className="font-semibold">
                                    {st.full_name}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                                    • {isMale ? "Putra (L)" : "Putri (P)"}
                                </span>

                                {isCalled && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleManualHandRaise(st)
                                        }
                                        className="px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all"
                                        style={{
                                            backgroundColor: isReadyHandRaised
                                                ? "rgba(16, 185, 129, 0.18)"
                                                : "rgba(245, 158, 11, 0.16)",
                                            color: isReadyHandRaised
                                                ? "#10b981"
                                                : "#f59e0b",
                                        }}
                                        title="Klik untuk menandai siswa sudah siap di garis start secara manual"
                                    >
                                        <Hand size={13} />
                                        {isReadyHandRaised
                                            ? "Sudah Angkat Tangan (Siap)"
                                            : "Menunggu Angkat Tangan (Klik Jika Hadir)"}
                                    </button>
                                )}

                                {isMedis ? (
                                    <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                                        • Tunda Medis ({doneCount}/6 Pos)
                                    </span>
                                ) : allComplete ? (
                                    isRemedial ? (
                                        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                                            • Remedial #{m.attempt_count || 2}{" "}
                                            (Awal:{" "}
                                            {m.original_tkji_score ?? "-"})
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                            • <CheckCircle2 size={14} /> Tuntas
                                            Murni
                                        </span>
                                    )
                                ) : (
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                                        • Progres {doneCount}/6 Pos
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {POS_ITEMS.map((p) => {
                                    const done = isPosDone(m, p.code);
                                    const isCurrentActivePos =
                                        p.code === activePos;
                                    return (
                                        <span
                                            key={p.code}
                                            className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider"
                                            style={{
                                                backgroundColor: done
                                                    ? "rgba(16, 185, 129, 0.16)"
                                                    : isCurrentActivePos
                                                    ? "rgba(250, 204, 21, 0.22)"
                                                    : isDark
                                                    ? "rgba(255,255,255,0.05)"
                                                    : "rgba(0,0,0,0.05)",
                                                color: done
                                                    ? "#10b981"
                                                    : isCurrentActivePos
                                                    ? isDark
                                                        ? "#facc15"
                                                        : "#854d0e"
                                                    : isDark
                                                    ? "rgba(255,255,255,0.4)"
                                                    : "rgba(0,0,0,0.4)",
                                            }}
                                        >
                                            {p.shortLabel}: {done ? "✓" : "—"}
                                        </span>
                                    );
                                })}
                                <span className="text-xs font-semibold opacity-70 ml-1">
                                    • Total TKJI:{" "}
                                    <strong className="text-emerald-500">
                                        {m.total_tkji_score ?? 0}/25 (
                                        {m.tkji_category ?? "Belum"})
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {isLockedByActiveWave ? (
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50 px-5 py-3 rounded-2xl border border-dashed">
                            <Lock size={14} /> Terkunci Selama Gelombang Aktif
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            {activePos === "IMT" && (
                                <>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Berat (kg)"
                                        value={inp.weight_kg}
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                "weight_kg",
                                                e.target.value
                                            )
                                        }
                                        className="w-28 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Tinggi (cm)"
                                        value={inp.height_cm}
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                "height_cm",
                                                e.target.value
                                            )
                                        }
                                        className="w-28 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                    />
                                </>
                            )}

                            {activePos === "RUN_60M" && (
                                <>
                                    <span className="text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-2xl bg-emerald-500/12 text-emerald-500">
                                        Otomatis HP:{" "}
                                        {m.run_60m_sec
                                            ? `${m.run_60m_sec} dtk`
                                            : "Menunggu Finis"}{" "}
                                        (Skor {m.run_60m_score ?? "—"}/5)
                                    </span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Cadangan (d)"
                                        value={inp.run_60m_sec}
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                "run_60m_sec",
                                                e.target.value
                                            )
                                        }
                                        className="w-32 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                        title="Isi hanya jika siswa tidak membawa HP"
                                    />
                                </>
                            )}

                            {activePos === "PULL_UP" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder={
                                            isMale ? "Repetisi" : "Detik Siku"
                                        }
                                        value={
                                            isMale
                                                ? inp.pull_up_count
                                                : inp.bent_arm_hang_sec
                                        }
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                isMale
                                                    ? "pull_up_count"
                                                    : "bent_arm_hang_sec",
                                                e.target.value
                                            )
                                        }
                                        className="w-32 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-emerald-500/12 text-emerald-500">
                                        Skor: {m.pull_up_hang_score ?? "—"}/5
                                    </span>
                                </>
                            )}

                            {activePos === "SIT_UP" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Repetisi"
                                        value={inp.sit_up_count}
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                "sit_up_count",
                                                e.target.value
                                            )
                                        }
                                        className="w-32 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-emerald-500/12 text-emerald-500">
                                        Skor: {m.sit_up_score ?? "—"}/5
                                    </span>
                                </>
                            )}

                            {activePos === "VERTICAL_JUMP" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Selisih (cm)"
                                        value={inp.vertical_jump_cm}
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                "vertical_jump_cm",
                                                e.target.value
                                            )
                                        }
                                        className="w-32 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-emerald-500/12 text-emerald-500">
                                        Skor: {m.vertical_jump_score ?? "—"}/5
                                    </span>
                                </>
                            )}

                            {activePos === "ENDURANCE" && (
                                <>
                                    <span className="text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-2xl bg-emerald-500/12 text-emerald-500">
                                        Otomatis HP:{" "}
                                        {m.endurance_run_min_sec ??
                                            "Menunggu Finis"}{" "}
                                        (Skor {m.endurance_run_score ?? "—"}/5)
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="mm:ss (04:15)"
                                        value={inp.endurance_run_min_sec}
                                        onChange={(e) =>
                                            updateStudentInputField(
                                                st.student_id,
                                                "endurance_run_min_sec",
                                                e.target.value
                                            )
                                        }
                                        className="w-32 px-4 py-3 rounded-2xl text-sm font-bold border bg-transparent text-center focus:outline-none"
                                        style={{
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.15)",
                                        }}
                                        title="Isi hanya jika siswa tidak membawa HP"
                                    />
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => handleSaveStudent(st)}
                                disabled={savingId === st.student_id}
                                className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm"
                                style={{
                                    backgroundColor: "#10b981",
                                    color: "#ffffff",
                                }}
                            >
                                <Save size={14} />
                                {savingId === st.student_id
                                    ? "Menyimpan..."
                                    : "Simpan Nilai"}
                            </button>

                            {isCalled && (
                                <button
                                    type="button"
                                    onClick={() => handleMarkMedicalSuspend(st)}
                                    className="p-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                                    title="Tandai Siswa Kram / Medis / Tunda Ujian"
                                >
                                    <HeartPulse size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* ZONA 1: ARCHITECTURAL HERO HEADER, TOP UTILITY BAR, & 3 GIANT NAKED NUMBERS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-30">
                <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5 mb-6">
                        <button
                            type="button"
                            onClick={() => router.push("/guru")}
                            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                            style={{
                                backgroundColor: isDark ? "#111111" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                        >
                            <ArrowLeft size={15} /> Ruang Guru
                        </button>

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                            style={{
                                backgroundColor: isDark ? "#111111" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                        >
                            {isFullscreen ? (
                                <>
                                    <Minimize2 size={14} /> Normal
                                </>
                            ) : (
                                <>
                                    <Maximize2 size={14} /> Layar Penuh
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setTheme(isDark ? "light" : "dark")}
                            className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                            style={{
                                backgroundColor: isDark ? "#111111" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                            title="Ganti Mode Terang / Gelap"
                        >
                            {isDark ? (
                                <>
                                    <Sun
                                        size={15}
                                        className="text-[#facc15]"
                                    />{" "}
                                    Mode Gelap
                                </>
                            ) : (
                                <>
                                    <Moon size={15} /> Mode Terang
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:scale-[1.02] cursor-pointer"
                            style={{
                                backgroundColor: isDark ? "#111111" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                            title="Unduh Rekap TKJI & IMT CSV"
                        >
                            <Download size={14} /> Ekspor CSV
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                selectedClass &&
                                loadStudioData(selectedClass.id, true)
                            }
                            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 cursor-pointer"
                            style={{
                                backgroundColor: isDark ? "#111111" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                            title="Muat Ulang Data Kelas"
                        >
                            <RefreshCw
                                size={15}
                                className={isLoading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-3 opacity-50">
                        <Radio
                            size={16}
                            className="text-emerald-500 animate-pulse"
                        />{" "}
                        {selectedClass
                            ? `${selectedClass.name} (Kelas ${
                                  selectedClass.grade_level
                              }) • Kode ${selectedClass.class_code || "-"}`
                            : "Studio Pengujian Fisik Real-Time"}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Studio Live <br />
                        <span className="font-semibold">
                            {POS_ITEMS.find((p) => p.code === activePos)?.title}
                        </span>
                    </h1>
                </div>

                <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
                    <div>
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
                            {calledIds.length}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Dipanggil
                        </div>
                    </div>
                    <div>
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
                            {calledReadyCount}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Angkat Tangan
                        </div>
                    </div>
                    <div>
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
                            {completedStudentsList.length}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Tuntas 6/6 Pos
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA 2: 4 BAR TELEMETRI LAPANGAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-20">
                <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Status Sesi</span>
                        <span>{activePos}</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between"
                        style={{
                            backgroundColor: "var(--ref-dark-panel)",
                            color: "var(--ref-dark-panel-text)",
                        }}
                    >
                        <span className="text-2xl font-light tracking-tight">
                            {command}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            Live Sync
                        </span>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Kesiapan Gelombang</span>
                        <span>Check-In HP</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between"
                        style={{
                            backgroundColor: "#facc15",
                            color: "#18181b",
                        }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {calledReadyCount}/{calledIds.length} Siap
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            Angkat Tangan
                        </span>
                    </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Ketuntasan {activePos}</span>
                        <span>
                            {currentPosDoneCount} dari {students.length} Siswa
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
                            {currentPosCompletionPct}%
                        </span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
                            style={{ color: "var(--ref-text-primary)" }}
                        >
                            {unfinishedCurrentPosCount > 0
                                ? `${unfinishedCurrentPosCount} Belum Uji`
                                : "Tuntas Pos"}
                        </span>
                    </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-2 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Rata-rata TKJI</span>
                        <span>Skala 25</span>
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
                            {classAvgTkji}/25
                        </span>
                    </div>
                </div>
            </div>

            {/* BANNER NOTIFIKASI FINIS OTOMATIS DARI HP SISWA */}
            <AnimatePresence>
                {(liveFinishFeed.length > 0 || celebrationBanner) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-8 p-6 rounded-[2.5rem] border relative overflow-hidden"
                        style={{
                            backgroundColor: isDark ? "#0d1914" : "#ecfdf5",
                            borderColor: isDark
                                ? "rgba(16,185,129,0.3)"
                                : "#a7f3d0",
                            color: isDark ? "#6ee7b7" : "#065f46",
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Award size={16} /> Telemetry Feed • Finis
                                    Otomatis dari Perangkat Siswa
                                </div>
                                {celebrationBanner && (
                                    <p className="text-sm font-bold">
                                        {celebrationBanner}
                                    </p>
                                )}
                                {liveFinishFeed.map((item) => (
                                    <p
                                        key={item.id}
                                        className="text-sm font-medium"
                                    >
                                        <span className="font-mono opacity-70 mr-2">
                                            [{item.time}]
                                        </span>
                                        {item.text}
                                    </p>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setLiveFinishFeed([]);
                                    setCelebrationBanner(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-black/10 dark:bg-white/10 shrink-0 cursor-pointer"
                            >
                                Bersihkan
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ZONA 3: TRIO KARTU BENTO LEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
                <div
                    className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-visible flex flex-col justify-between min-h-[400px] border group"
                    style={{
                        backgroundColor: isDark ? "#111111" : "#ffffff",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.04] dark:opacity-[0.08] rounded-[2.5rem] overflow-hidden"
                        style={{
                            backgroundImage:
                                "radial-gradient(currentColor 2px, transparent 2px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    <div className="relative z-30">
                        <h2 className="text-3xl font-light tracking-tight mb-2">
                            Manajemen Gelombang
                        </h2>
                        <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
                            Pilih kelas dan panggil gelombang siswa yang sudah
                            lulus Pre-Test ke lapangan.
                        </p>

                        <div
                            className="relative w-full mb-8"
                            ref={classDropdownRef}
                        >
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                                Kelas yang Sedang Diuji
                            </label>
                            <button
                                type="button"
                                onClick={() =>
                                    setIsClassDropdownOpen(!isClassDropdownOpen)
                                }
                                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none text-left"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.2)"
                                        : "rgba(0,0,0,0.15)",
                                }}
                            >
                                <span className="truncate pr-3">
                                    {selectedClass
                                        ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                                        : "Pilih Kelas..."}
                                </span>
                                <ChevronDown
                                    size={24}
                                    className={`transition-transform duration-300 opacity-60 shrink-0 ${
                                        isClassDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

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
                                        transition={{ duration: 0.18 }}
                                        className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-60 overflow-y-auto no-scrollbar"
                                        style={{
                                            backgroundColor: isDark
                                                ? "#1a1a1a"
                                                : "#ffffff",
                                            borderColor: isDark
                                                ? "rgba(255,255,255,0.15)"
                                                : "rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        {classes.length === 0 ? (
                                            <div className="p-5 text-sm opacity-50 text-center">
                                                Belum ada kelas terdaftar pada
                                                akun Guru ini.
                                            </div>
                                        ) : (
                                            classes.map((cls: any) => {
                                                const isSelected =
                                                    selectedClass?.id ===
                                                    cls.id;
                                                return (
                                                    <button
                                                        key={cls.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedClass(
                                                                cls
                                                            );
                                                            setIsClassDropdownOpen(
                                                                false
                                                            );
                                                        }}
                                                        className={`w-full text-left px-6 py-4 text-lg font-light cursor-pointer flex items-center justify-between transition-colors ${
                                                            isDark
                                                                ? "hover:bg-white/5"
                                                                : "hover:bg-black/5"
                                                        }`}
                                                        style={{
                                                            backgroundColor:
                                                                isDark
                                                                    ? "#1a1a1a"
                                                                    : "#ffffff",
                                                            color: isSelected
                                                                ? "#facc15"
                                                                : isDark
                                                                ? "#fff"
                                                                : "#000",
                                                        }}
                                                    >
                                                        <div>
                                                            <span className="font-semibold block">
                                                                {cls.name}
                                                            </span>
                                                            <span className="text-xs opacity-60">
                                                                Tingkat Kelas{" "}
                                                                {
                                                                    cls.grade_level
                                                                }{" "}
                                                                • Kode:{" "}
                                                                {cls.class_code ||
                                                                    "-"}
                                                            </span>
                                                        </div>
                                                        {isSelected && (
                                                            <Check
                                                                size={18}
                                                                className="text-[#facc15]"
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <button
                            type="button"
                            onClick={callNextWaveOfFive}
                            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md text-white"
                            style={{
                                backgroundColor: "#10b981",
                            }}
                        >
                            <Sparkles size={16} /> Panggil 5 Siswa Berikutnya
                        </button>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={callAllUnfinishedOnCurrentPos}
                                className="py-3.5 px-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest border text-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.15)"
                                        : "rgba(0,0,0,0.15)",
                                }}
                            >
                                Panggil Belum ({unfinishedCurrentPosCount})
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    broadcastSession(
                                        activePos,
                                        "STANDBY",
                                        [],
                                        "Gelombang dikosongkan."
                                    )
                                }
                                className="py-3.5 px-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest border text-center opacity-70 hover:opacity-100 cursor-pointer"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.15)"
                                        : "rgba(0,0,0,0.15)",
                                }}
                            >
                                Kosongkan ({calledIds.length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* BENTO 2: PILIH POS PENGUKURAN AKTIF */}
                <div
                    className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[400px] border group"
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

                    <div className="flex justify-between items-start relative z-10 mb-4">
                        <div>
                            <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest">
                                <Activity size={16} /> Pilih Pos Pengukuran
                                Aktif
                            </div>
                            <p className="text-xs opacity-50 mt-1">
                                Warna kuning menandakan pos ujian yang sedang
                                dijalankan.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-auto relative z-10">
                        {POS_ITEMS.map((pos) => {
                            const active = activePos === pos.code;
                            const doneInThisPos = students.filter((s) =>
                                isPosDone(s.metrics, pos.code)
                            ).length;

                            return (
                                <button
                                    key={pos.code}
                                    type="button"
                                    onClick={() => {
                                        setIsTimerRunning(false);
                                        setCountdown(60);
                                        broadcastSession(
                                            pos.code,
                                            "STANDBY",
                                            calledIds,
                                            `Berpindah ke ${pos.title}`
                                        );
                                    }}
                                    className="p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px]"
                                    style={{
                                        backgroundColor: active
                                            ? "#facc15"
                                            : isDark
                                            ? "rgba(255,255,255,0.03)"
                                            : "rgba(0,0,0,0.02)",
                                        color: active
                                            ? "#18181b"
                                            : isDark
                                            ? "#ffffff"
                                            : "#000000",
                                        borderColor: active
                                            ? "#facc15"
                                            : isDark
                                            ? "rgba(255,255,255,0.08)"
                                            : "rgba(0,0,0,0.08)",
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-65">
                                            {pos.step}
                                        </span>
                                        <span className="text-[10px] font-bold opacity-75">
                                            {doneInThisPos}/{students.length}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-base font-bold leading-tight">
                                            {pos.shortLabel}
                                        </div>
                                        <div className="text-[10px] opacity-65 mt-0.5 truncate">
                                            {pos.mode === "AUTO_HP"
                                                ? "Otomatis GPS HP"
                                                : "Input Guru"}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* BENTO 3: CIRCULAR GAUGE */}
                <div
                    className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[400px] border group"
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
                            <Timer size={16} />{" "}
                            {isRunPos
                                ? "Master Telemetry Stopwatch"
                                : isTimedManualPos
                                ? "Timer Pos 60 Detik"
                                : "Status Pos Input"}
                        </div>
                        <span className="text-xs font-bold text-emerald-500">
                            {calledReadyCount}/{calledIds.length} Siap
                        </span>
                    </div>

                    {(() => {
                        const radius = 58;
                        const circumference = 2 * Math.PI * radius;
                        let progressPct = 0;
                        if (isRunPos) {
                            const targetSec =
                                activePos === "RUN_60M" ? 12 : 300;
                            progressPct = Math.min(
                                100,
                                (runElapsedMs / 1000 / targetSec) * 100
                            );
                        } else if (isTimedManualPos) {
                            progressPct = ((60 - countdown) / 60) * 100;
                        } else {
                            progressPct = currentPosCompletionPct;
                        }
                        const dashOffset =
                            circumference -
                            (Math.max(8, progressPct) / 100) * circumference;

                        const bottomLabelText = isRunPos
                            ? command === "START"
                                ? "Sedang Berlari (Sinkron HP Siswa)"
                                : "Siap di Garis Start"
                            : isTimedManualPos
                            ? isTimerRunning
                                ? "Hitung Mundur 60 Detik Berjalan"
                                : "Timer Siap Dijalankan"
                            : `Ketuntasan Pengukuran ${activePos}`;

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
                                            className="transition-all duration-300"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl font-light tracking-tighter leading-none">
                                            {isRunPos
                                                ? formatRunMasterDisplay()
                                                : isTimedManualPos
                                                ? `${countdown}s`
                                                : `${currentPosCompletionPct}%`}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold opacity-60 mt-3 text-center">
                                    {bottomLabelText}
                                </span>
                            </div>
                        );
                    })()}

                    <div className="relative z-10">
                        {isRunPos ? (
                            <div className="grid grid-cols-3 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const targetRunners =
                                            calledReadyIds.length > 0
                                                ? calledReadyIds
                                                : calledIds;
                                        broadcastSession(
                                            activePos,
                                            "START",
                                            targetRunners,
                                            `START! Stopwatch berdetak khusus untuk ${targetRunners.length} siswa yang siap!`
                                        );
                                    }}
                                    disabled={calledIds.length === 0}
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest bg-[#10b981] text-white disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <Play size={14} /> START
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFalseStartReset}
                                    disabled={calledIds.length === 0}
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1.5"
                                    style={{
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.2)"
                                            : "rgba(0,0,0,0.2)",
                                    }}
                                >
                                    <RotateCcw size={14} /> ULANG
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        broadcastSession(
                                            activePos,
                                            "STOP",
                                            calledIds,
                                            "Stopwatch dihentikan."
                                        )
                                    }
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest bg-red-500 text-white cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Square size={14} /> STOP
                                </button>
                            </div>
                        ) : isTimedManualPos ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextState = !isTimerRunning;
                                        setIsTimerRunning(nextState);
                                        broadcastSession(
                                            activePos,
                                            nextState ? "START" : "STOP",
                                            calledIds,
                                            nextState
                                                ? "Timer 60 detik dimulai & tampil di HP siswa!"
                                                : "Timer 60 detik dijeda."
                                        );
                                    }}
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer text-white"
                                    style={{
                                        backgroundColor: isTimerRunning
                                            ? "#ef4444"
                                            : "#10b981",
                                    }}
                                >
                                    {isTimerRunning
                                        ? "Jeda Timer"
                                        : "Mulai 60 Detik"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTimerRunning(false);
                                        setCountdown(60);
                                        broadcastSession(
                                            activePos,
                                            "READY",
                                            calledIds,
                                            "Timer 60 detik di-reset."
                                        );
                                    }}
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border cursor-pointer"
                                    style={{
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.15)"
                                            : "rgba(0,0,0,0.15)",
                                    }}
                                >
                                    Reset 60s
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-3 border-t border-black/10 dark:border-white/10">
                                <span>{currentPosDoneCount} Selesai</span>
                                <span>•</span>
                                <span>{unfinishedCurrentPosCount} Antrean</span>
                                <span>•</span>
                                <span>{completedStudentsList.length} Tuntas</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ZONA 4: PANGGUNG GELOMBANG AKTIF & ANTREAN SISWA */}
            {calledStudentsList.length > 0 && (
                <div
                    className="rounded-[2.5rem] border-2 mb-8 overflow-hidden shadow-lg relative z-10"
                    style={{
                        backgroundColor: isDark ? "#141414" : "#ffffff",
                        borderColor: "#facc15",
                    }}
                >
                    <div
                        className="px-8 py-4 flex flex-wrap items-center justify-between gap-2"
                        style={{ backgroundColor: "#facc15", color: "#000" }}
                    >
                        <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Radio size={15} className="animate-pulse" />
                            Zona 1 • Sedang Diuji di Gelombang Aktif (
                            {calledStudentsList.length} Siswa •{" "}
                            {calledReadyCount} Sudah Angkat Tangan)
                        </div>
                        <span className="text-xs font-bold">
                            Pada pos lari, waktu berhenti & tersimpan otomatis
                            dari HP siswa
                        </span>
                    </div>
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                        {calledStudentsList.map((st, idx) =>
                            renderStudentRow(st, idx, "CALLED")
                        )}
                    </div>
                </div>
            )}

            <div
                className="rounded-[2.5rem] border mb-10 overflow-hidden relative z-10 shadow-sm"
                style={{
                    backgroundColor: isDark ? "#111111" : "#ffffff",
                    borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                }}
            >
                <div
                    className="px-8 py-6 border-b flex items-center justify-between"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <h3 className="text-3xl font-light tracking-tight">
                        Antrean Siswa ({queueStudentsList.length})
                    </h3>
                    {hasActiveWave && (
                        <span className="text-xs font-bold opacity-50 flex items-center gap-1.5">
                            <Lock size={13} /> Input dikunci selama gelombang
                            aktif berjalan
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="py-16 text-center opacity-50 text-xl font-light">
                        Menyiapkan daftar siswa...
                    </div>
                ) : queueStudentsList.length === 0 ? (
                    <div className="py-12 text-center opacity-50 text-base font-light">
                        Tidak ada siswa di antrean tunggu.
                    </div>
                ) : (
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                        {queueStudentsList.map((st, idx) =>
                            renderStudentRow(st, idx, "QUEUE")
                        )}
                    </div>
                )}
            </div>

            {/* ZONA 5: GRID KARTU BESAR PASTEL / DARK UNTUK SISWA TUNTAS 6/6 POS */}
            {completedStudentsList.length > 0 && (
                <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-light tracking-tight">
                            Siswa Tuntas Seluruh 6 Pos (
                            {completedStudentsList.length})
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                            Klik kartu untuk membuka opsi Remedial
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {completedStudentsList.map((st, index) => {
                            const bgLight =
                                bentoColors[index % bentoColors.length];
                            const m = st.metrics || {};
                            return (
                                <div
                                    key={st.student_id}
                                    onClick={() => handleRequestToggleWave(st)}
                                    className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[280px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
                                    style={{
                                        backgroundColor: isDark
                                            ? "#111111"
                                            : bgLight,
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.1)"
                                            : "transparent",
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.04] dark:opacity-[0.06]"
                                        style={{
                                            backgroundImage:
                                                "radial-gradient(currentColor 2px, transparent 2px)",
                                            backgroundSize: "24px 24px",
                                        }}
                                    />

                                    <div className="flex justify-between items-start relative z-10">
                                        <span className="text-xs font-bold tracking-widest uppercase opacity-65">
                                            {m.is_remedial
                                                ? `Remedial #${
                                                      m.attempt_count || 2
                                                  }`
                                                : "Tuntas Murni • 6/6 Pos"}
                                        </span>
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: isDark
                                                    ? "rgba(255,255,255,0.05)"
                                                    : "rgba(0,0,0,0.05)",
                                            }}
                                        >
                                            <ArrowUpRight
                                                size={20}
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 relative z-10">
                                        <div className="text-4xl font-light tracking-tighter mb-6 leading-tight">
                                            {st.full_name}
                                        </div>

                                        <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-4">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                                    IMT ({m.bmi_category || "-"}
                                                    )
                                                </div>
                                                <div className="text-3xl font-light leading-none">
                                                    {m.calculated_bmi ?? "-"}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                                                    Skor TKJI (
                                                    {m.tkji_category || "-"})
                                                </div>
                                                <div className="text-4xl font-light leading-none">
                                                    {m.total_tkji_score ?? 0}/25
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI PROTEKSI SALAH KLIK vs BUKA SESI REMEDIAL */}
            <AnimatePresence>
                {remedialModalStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setRemedialModalStudent(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 border shadow-2xl space-y-6"
                            style={{
                                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                                    <AlertTriangle size={24} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRemedialModalStudent(null)
                                    }
                                    className="p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div>
                                <h3 className="text-3xl font-light tracking-tight">
                                    Proteksi Nilai:{" "}
                                    <span className="font-semibold">
                                        {remedialModalStudent.full_name}
                                    </span>
                                </h3>
                                <p className="text-sm opacity-65 mt-2 leading-relaxed">
                                    Siswa ini sudah memiliki nilai pada pos ini
                                    (Total TKJI:{" "}
                                    <strong>
                                        {remedialModalStudent.metrics
                                            ?.total_tkji_score ?? 0}
                                        /25
                                    </strong>
                                    ). Apakah Anda tidak sengaja menekan, atau
                                    ingin membuka <strong>Sesi Remedial</strong>
                                    ?
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRemedialModalStudent(null)
                                    }
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border cursor-pointer"
                                    style={{
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.15)"
                                            : "rgba(0,0,0,0.15)",
                                    }}
                                >
                                    Batal (Salah Klik)
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        confirmActivateRemedial(
                                            remedialModalStudent
                                        )
                                    }
                                    className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer text-white"
                                    style={{ backgroundColor: "#10b981" }}
                                >
                                    Ya, Buka Remedial
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}