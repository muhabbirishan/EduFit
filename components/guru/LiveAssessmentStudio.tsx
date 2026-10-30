// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Award,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  Flag,
  Hand,
  HeartPulse,
  Lock,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  Navigation,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Square,
  Sun,
  Timer,
  UserCheck,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type PosType =
  | "RUN_60M"
  | "PULL_UP"
  | "SIT_UP"
  | "VERTICAL_JUMP"
  | "ENDURANCE"
  | "IMT";

interface StudentRow {
  student_id: string;
  full_name: string;
  email: string;
  gender: string;
  birth_date: string;
  ageYears: number;
  hasCompletedPreTest: boolean;
  metrics?: any;
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

const POS_ITEMS: {
  code: PosType;
  step: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  mode: "AUTO_HP" | "MANUAL_GURU";
}[] = [
  {
    code: "RUN_60M",
    step: "Pos 1",
    shortLabel: "Sprint 60m",
    title: "Lari Cepat 60 Meter",
    subtitle: "Otomatis GPS Berhenti di 60m",
    mode: "AUTO_HP",
  },
  {
    code: "PULL_UP",
    step: "Pos 2",
    shortLabel: "Gantung",
    title: "Gantung Angkat / Siku",
    subtitle: "Sinkron Timer 60 Detik",
    mode: "MANUAL_GURU",
  },
  {
    code: "SIT_UP",
    step: "Pos 3",
    shortLabel: "Sit-Up",
    title: "Baring Duduk (Sit-Up)",
    subtitle: "Sinkron Timer 60 Detik",
    mode: "MANUAL_GURU",
  },
  {
    code: "VERTICAL_JUMP",
    step: "Pos 4",
    shortLabel: "Loncat Tegak",
    title: "Loncat Tegak",
    subtitle: "Selisih Raihan Loncat (cm)",
    mode: "MANUAL_GURU",
  },
  {
    code: "ENDURANCE",
    step: "Pos 5",
    shortLabel: "Lari Jauh",
    title: "Lari 1.200m / 1.000m",
    subtitle: "Otomatis GPS Berhenti di Target",
    mode: "AUTO_HP",
  },
  {
    code: "IMT",
    step: "Pos Akhir",
    shortLabel: "IMT (Akhir)",
    title: "Komposisi Tubuh (IMT)",
    subtitle: "Wajib Selesai 5 Pos TKJI Dahulu",
    mode: "MANUAL_GURU",
  },
];

function getPosHumanTitle(pos: PosType): string {
  return POS_ITEMS.find((p) => p.code === pos)?.shortLabel || "Pos Uji";
}

function getCommandHumanLabel(cmd: string): string {
  if (cmd === "START") return "Sedang Berlangsung";
  if (cmd === "READY") return "Panggilan Siap";
  if (cmd === "STOP") return "Dihentikan";
  return "Siaga";
}

function calculateAgeYears(birthDateStr?: string | null): number {
  if (!birthDateStr) return 16;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 16;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(10, Math.min(22, age));
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LiveAssessmentStudio() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
  const [routeInspectStudent, setRouteInspectStudent] =
    useState<StudentRow | null>(null);

  const [countdown, setCountdown] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [runElapsedMs, setRunElapsedMs] = useState<number>(0);
  const [runStartedAtIso, setRunStartedAtIso] = useState<string | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceReloadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const studentsRef = useRef<StudentRow[]>([]);
  const calledIdsRef = useRef<string[]>([]);
  const activePosRef = useRef<PosType>("RUN_60M");
  const commandRef = useRef<string>("STANDBY");
  const dirtyIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    calledIdsRef.current = calledIds;
  }, [calledIds]);

  useEffect(() => {
    activePosRef.current = activePos;
  }, [activePos]);

  useEffect(() => {
    commandRef.current = command;
  }, [command]);

  useEffect(() => {
    dirtyIdsRef.current = dirtyStudentIds;
  }, [dirtyStudentIds]);

  useEffect(() => {
    setMounted(true);
    const onFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
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
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!selectedClass?.id) return;
    const targetClassId = selectedClass.id;

    const sendHeartbeat = async () => {
      const currentCmd =
        commandRef.current === "OFFLINE" ? "STANDBY" : commandRef.current;
      await supabase
        .from("live_sessions")
        .update({
          command: currentCmd,
          updated_at: new Date().toISOString(),
        })
        .eq("class_id", targetClassId);
    };

    const heartbeatInterval = setInterval(sendHeartbeat, 8000);

    return () => {
      clearInterval(heartbeatInterval);
      if (commandRef.current !== "START") {
        supabase
          .from("live_sessions")
          .update({
            command: "OFFLINE",
            active_student_ids: [],
            updated_at: new Date().toISOString(),
          })
          .eq("class_id", targetClassId)
          .then(() => {});
      }
    };
  }, [selectedClass?.id]);

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

  const isFieldStatusReadyForPos = useCallback(
    (fieldStatus: any, targetPos: PosType) => {
      const st = String(fieldStatus || "")
        .trim()
        .toUpperCase();
      return st === `SIAP_${targetPos}` || st === "SIAP_START";
    },
    []
  );

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

      // Hanya mengambil kelas 12 untuk fitur Live Assessment
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade_level, created_at, student_classes(count)")
        .eq("guru_id", session.user.id)
        .eq("grade_level", "12")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setClasses(data);

        let initialClass = data[0];
        if (typeof window !== "undefined") {
          const urlClassId = new URLSearchParams(window.location.search).get(
            "classId"
          );
          if (urlClassId) {
            const matched = data.find((c: any) => c.id === urlClassId);
            if (matched) initialClass = matched;
          }
        }
        setSelectedClass(initialClass);
      } else {
        setIsLoading(false);
      }
    }
    fetchTeacherClasses();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (runTimerRef.current) clearInterval(runTimerRef.current);
      if (debounceReloadRef.current) clearTimeout(debounceReloadRef.current);
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
      if (command === "STANDBY" || command === "READY") setRunElapsedMs(0);
    }
    return () => {
      if (runTimerRef.current) clearInterval(runTimerRef.current);
    };
  }, [command, runStartedAtIso, isRunPos]);

  const patchLocalStudentMetrics = useCallback(
    (newMetricRow: any) => {
      if (!newMetricRow?.student_id) return;
      const targetId = String(newMetricRow.student_id);

      const isClassMember = studentsRef.current.some(
        (s) => s.student_id === targetId
      );
      if (!isClassMember) return;

      if (
        isFieldStatusReadyForPos(
          newMetricRow.field_status,
          activePosRef.current
        )
      ) {
        setReadyIds((prev) =>
          prev.includes(targetId) ? prev : [...prev, targetId]
        );
      } else if (
        String(newMetricRow.field_status || "").toUpperCase() === "NORMAL"
      ) {
        setReadyIds((prev) => prev.filter((id) => id !== targetId));
      }

      setStudents((prevStudents) =>
        prevStudents.map((st) =>
          st.student_id === targetId
            ? {
                ...st,
                metrics: { ...(st.metrics || {}), ...newMetricRow },
              }
            : st
        )
      );

      if (!dirtyIdsRef.current.has(targetId)) {
        setInputs((prev) => ({
          ...prev,
          [targetId]: {
            weight_kg:
              newMetricRow.weight_kg && Number(newMetricRow.weight_kg) > 0
                ? newMetricRow.weight_kg
                : prev[targetId]?.weight_kg ?? "",
            height_cm:
              newMetricRow.height_cm && Number(newMetricRow.height_cm) > 0
                ? newMetricRow.height_cm
                : prev[targetId]?.height_cm ?? "",
            run_60m_sec:
              newMetricRow.run_60m_sec ?? prev[targetId]?.run_60m_sec ?? "",
            pull_up_count:
              newMetricRow.pull_up_count ?? prev[targetId]?.pull_up_count ?? "",
            bent_arm_hang_sec:
              newMetricRow.bent_arm_hang_sec ??
              prev[targetId]?.bent_arm_hang_sec ??
              "",
            sit_up_count:
              newMetricRow.sit_up_count ?? prev[targetId]?.sit_up_count ?? "",
            vertical_jump_cm:
              newMetricRow.vertical_jump_cm ??
              prev[targetId]?.vertical_jump_cm ??
              "",
            endurance_run_min_sec:
              newMetricRow.endurance_run_min_sec ??
              prev[targetId]?.endurance_run_min_sec ??
              "",
          },
        }));
      }
    },
    [isFieldStatusReadyForPos]
  );

  const scheduleDebouncedReload = useCallback((classId: string) => {
    if (debounceReloadRef.current) {
      clearTimeout(debounceReloadRef.current);
    }
    debounceReloadRef.current = setTimeout(() => {
      loadStudioData(classId, false);
    }, 450);
  }, []);

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
        (payload: any) => {
          if (payload?.new) {
            patchLocalStudentMetrics(payload.new);
          } else {
            scheduleDebouncedReload(selectedClass.id);
          }
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
            const nextPos = (rec.active_pos as PosType) || "RUN_60M";
            if (nextPos !== activePosRef.current) {
              setReadyIds([]);
            }
            setActivePos(nextPos);
            setCommand(
              rec.command === "OFFLINE" ? "STANDBY" : rec.command || "STANDBY"
            );
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
          payload?: {
            student_id?: string;
            student_name?: string;
            pos?: string;
            gps_ready?: boolean;
          };
        }) => {
          const sId = payload?.payload?.student_id;
          if (!sId) return;

          const validStudent = studentsRef.current.find(
            (s) => s.student_id === sId
          );
          if (!validStudent || !calledIdsRef.current.includes(sId)) {
            return;
          }

          setReadyIds((prev) => (prev.includes(sId) ? prev : [...prev, sId]));
          const gpsNote = payload?.payload?.gps_ready
            ? "Izin GPS & Satelit HP terkunci siap lari."
            : "Akses penilaian pos telah terbuka.";
          triggerDynamicIsland(
            `${validStudent.full_name} Angkat Tangan (Siap)`,
            gpsNote,
            "success"
          );
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
            distance_m?: number;
          };
        }) => {
          const info = payload?.payload;
          if (!info?.student_id) return;

          const validStudent = studentsRef.current.find(
            (s) => s.student_id === info.student_id
          );
          if (!validStudent) return;

          const posName =
            info.pos === "RUN_60M" ? "Lari Cepat 60m" : "Lari Daya Tahan";
          const distLabel = info.distance_m
            ? ` · Jarak GPS ${Number(info.distance_m).toFixed(0)}m`
            : "";
          const msg = `${validStudent.full_name} selesai ${posName} dengan waktu ${info.time_label}${distLabel} (Skor ${info.score}/5)`;

          triggerDynamicIsland(
            `Finis Otomatis GPS: ${validStudent.full_name}`,
            `${posName} — Waktu ${info.time_label} (Skor ${info.score}/5)`,
            "success"
          );
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
            ...prev.slice(0, 5),
          ]);

          scheduleDebouncedReload(selectedClass.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    selectedClass?.id,
    patchLocalStudentMetrics,
    scheduleDebouncedReload,
    triggerDynamicIsland,
  ]);

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
              "Waktu 60 Detik Selesai! Silakan simpan repetisi siswa yang sudah angkat tangan."
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
    if (pos === "RUN_60M") return m.run_60m_score != null && m.run_60m_score > 0;
    if (pos === "PULL_UP")
      return m.pull_up_hang_score != null && m.pull_up_hang_score > 0;
    if (pos === "SIT_UP") return m.sit_up_score != null && m.sit_up_score > 0;
    if (pos === "VERTICAL_JUMP")
      return m.vertical_jump_score != null && m.vertical_jump_score > 0;
    if (pos === "ENDURANCE")
      return m.endurance_run_score != null && m.endurance_run_score > 0;
    if (pos === "IMT") return m.calculated_bmi != null && m.calculated_bmi > 0;
    return false;
  }

  function isAllFiveTkjiDone(m: any): boolean {
    if (!m) return false;
    return Boolean(
      isPosDone(m, "RUN_60M") &&
        isPosDone(m, "PULL_UP") &&
        isPosDone(m, "SIT_UP") &&
        isPosDone(m, "VERTICAL_JUMP") &&
        isPosDone(m, "ENDURANCE")
    );
  }

  function isStudentAllComplete(m: any): boolean {
    if (!m) return false;
    return Boolean(isAllFiveTkjiDone(m) && isPosDone(m, "IMT"));
  }

  function countCompletedPos(m: any): number {
    if (!m) return 0;
    let c = 0;
    if (isPosDone(m, "RUN_60M")) c++;
    if (isPosDone(m, "PULL_UP")) c++;
    if (isPosDone(m, "SIT_UP")) c++;
    if (isPosDone(m, "VERTICAL_JUMP")) c++;
    if (isPosDone(m, "ENDURANCE")) c++;
    if (isPosDone(m, "IMT")) c++;
    return c;
  }

  function hasGpsRouteData(m: any): boolean {
    if (!m?.run_route_json) return false;
    if (Array.isArray(m.run_route_json)) return m.run_route_json.length > 0;
    if (typeof m.run_route_json === "object") {
      const s = m.run_route_json.sprint_60m;
      const e = m.run_route_json.endurance_run;
      return (
        (Array.isArray(s) && s.length > 0) || (Array.isArray(e) && e.length > 0)
      );
    }
    if (typeof m.run_route_json === "string") {
      try {
        const parsed = JSON.parse(m.run_route_json);
        if (Array.isArray(parsed)) return parsed.length > 0;
        if (parsed && typeof parsed === "object") {
          return (
            (Array.isArray(parsed.sprint_60m) &&
              parsed.sprint_60m.length > 0) ||
            (Array.isArray(parsed.endurance_run) &&
              parsed.endurance_run.length > 0)
          );
        }
        return false;
      } catch {
        return false;
      }
    }
    return false;
  }

  async function loadStudioData(classId: string, showSpinner: boolean) {
    if (showSpinner) setIsLoading(true);
    try {
      const { data: sessionRow } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("class_id", classId)
        .maybeSingle();

      let currentDetectedPos: PosType = activePosRef.current;
      const nowIso = new Date().toISOString();

      if (sessionRow) {
        currentDetectedPos = (sessionRow.active_pos as PosType) || "RUN_60M";
        const restoredCommand =
          sessionRow.command === "OFFLINE"
            ? "STANDBY"
            : sessionRow.command || "STANDBY";
        setActivePos(currentDetectedPos);
        setCommand(restoredCommand);
        setRunStartedAtIso(sessionRow.started_at || null);
        setCalledIds(
          Array.isArray(sessionRow.active_student_ids)
            ? sessionRow.active_student_ids
            : []
        );

        await supabase
          .from("live_sessions")
          .update({
            command: restoredCommand,
            updated_at: nowIso,
          })
          .eq("class_id", classId);
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
          updated_at: nowIso,
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

      const [profRes, metRes, evalScoreRes, masterEvalRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("id, full_name, email, gender, birth_date")
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
        supabase.from("master_evaluations").select("id, type, title"),
      ]);

      const preEvalIdSet = new Set<string>();
      (masterEvalRes.data || []).forEach((ev: any) => {
        const t = String(ev.type || "")
          .trim()
          .toLowerCase();
        const ttl = String(ev.title || "")
          .trim()
          .toLowerCase();
        if (t.includes("pre") || ttl.includes("pre")) {
          preEvalIdSet.add(ev.id);
        }
      });

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
          if (isFieldStatusReadyForPos(m.field_status, currentDetectedPos)) {
            detectedReadyIds.push(m.student_id);
          }
        }
      });

      setReadyIds(Array.from(new Set(detectedReadyIds)));

      const mappedInputs: Record<string, any> = {};
      const mergedStudents: StudentRow[] = (profRes.data || []).map(
        (p: any) => {
          const m = latestMetrics[p.id];
          const resolvedBirthDate =
            p.birth_date || m?.birth_date || "2009-05-15";
          mappedInputs[p.id] = {
            weight_kg:
              m?.weight_kg && Number(m.weight_kg) > 0 ? m.weight_kg : "",
            height_cm:
              m?.height_cm && Number(m.height_cm) > 0 ? m.height_cm : "",
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
            gender: (p.gender || m?.gender || "L").toString().toUpperCase(),
            birth_date: resolvedBirthDate,
            ageYears: calculateAgeYears(resolvedBirthDate),
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
        dirtyIdsRef.current.forEach((dirtyId) => {
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
    notifText?: string,
    forceResetStartTimer: boolean = false
  ) {
    if (!selectedClass?.id) return;
    const nowIso = new Date().toISOString();

    const isStartingFresh =
      nextCmd === "START" &&
      (command !== "START" || !runStartedAtIso || forceResetStartTimer);

    const nextStartedAt =
      nextCmd === "START"
        ? isStartingFresh
          ? nowIso
          : runStartedAtIso
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
      triggerDynamicIsland(
        "Gangguan Sinkronisasi Live",
        "Periksa koneksi jaringan lapangan.",
        "error"
      );
    } else if (notifText) {
      triggerDynamicIsland(
        `${getPosHumanTitle(nextPos)} · ${getCommandHumanLabel(nextCmd)}`,
        notifText,
        "info"
      );
    }
  }

  async function handleExitLiveStudio() {
    if (selectedClass?.id && commandRef.current !== "START") {
      try {
        await supabase
          .from("live_sessions")
          .update({
            command: "OFFLINE",
            active_student_ids: [],
            updated_at: new Date().toISOString(),
          })
          .eq("class_id", selectedClass.id);
      } catch (_) {}
    }
    router.push("/guru");
  }

  function canStudentEnterPos(
    st: StudentRow,
    targetPos: PosType
  ): {
    allowed: boolean;
    reason?: string;
  } {
    if (!st.hasCompletedPreTest) {
      return {
        allowed: false,
        reason: `${st.full_name} belum menyelesaikan ujian Pre-Test.`,
      };
    }
    if (targetPos === "IMT" && !isAllFiveTkjiDone(st.metrics)) {
      return {
        allowed: false,
        reason: `${st.full_name} wajib menyelesaikan seluruh 5 Pos TKJI terlebih dahulu sebelum melakukan pengukuran IMT.`,
      };
    }
    return { allowed: true };
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

    const check = canStudentEnterPos(st, activePos);
    if (!check.allowed) {
      triggerDynamicIsland("Akses Pos Terkunci", check.reason, "error");
      return;
    }

    if (isPosDone(st.metrics, activePos) || isStudentAllComplete(st.metrics)) {
      setRemedialModalStudent(st);
      return;
    }

    const nextList = [...calledIds, st.student_id];
    broadcastSession(
      activePos,
      command === "START" ? "START" : "READY",
      nextList,
      `Undangan dikirim ke HP ${st.full_name}! Menunggu siswa Angkat Tangan.`
    );
  }

  async function toggleManualHandRaise(st: StudentRow) {
    const isAlreadyReady = readyIds.includes(st.student_id);
    const targetFieldStatus = isAlreadyReady ? "NORMAL" : `SIAP_${activePos}`;

    if (isAlreadyReady) {
      setReadyIds((prev) => prev.filter((id) => id !== st.student_id));
    } else {
      setReadyIds((prev) => [...prev, st.student_id]);
    }

    const isMale = st.gender === "L" || st.gender.includes("PUTRA");
    try {
      if (st.metrics?.id) {
        await supabase
          .from("student_physical_metrics")
          .update({ field_status: targetFieldStatus })
          .eq("id", st.metrics.id);
      } else {
        await supabase.from("student_physical_metrics").insert({
          student_id: st.student_id,
          gender: isMale ? "L" : "P",
          birth_date: st.birth_date || "2009-05-15",
          weight_kg: 0,
          height_cm: 0,
          field_status: targetFieldStatus,
        });
      }
      if (!isAlreadyReady) {
        triggerDynamicIsland(
          `${st.full_name} Dikonfirmasi Siap`,
          `Kunci penilaian ${getPosHumanTitle(activePos)} telah dibuka oleh Guru.`,
          "success"
        );
      }
    } catch (_) {}
  }

  async function confirmActivateRemedial(st: StudentRow) {
    setRemedialModalStudent(null);
    if (st.metrics?.id) {
      const currentOriginal =
        st.metrics.original_tkji_score ?? st.metrics.total_tkji_score ?? null;
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
    setReadyIds((prev) => prev.filter((id) => id !== st.student_id));
    const nextList = [...new Set([...calledIds, st.student_id])];
    await broadcastSession(
      activePos,
      "READY",
      nextList,
      `Mode Remedial dibuka untuk ${st.full_name}! Siswa wajib Angkat Tangan kembali.`
    );
    if (selectedClass?.id) loadStudioData(selectedClass.id, false);
  }

  async function handleFalseStartReset() {
    setRunElapsedMs(0);
    await broadcastSession(
      activePos,
      "READY",
      calledIds,
      "Stopwatch seluruh siswa di gelombang ini di-reset ke 00.0!",
      true
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
        birth_date: st.birth_date || "2009-05-15",
        weight_kg: 0,
        height_cm: 0,
        field_status: "MEDIS_TUNDA",
      });
    }
    triggerDynamicIsland(
      `Tunda Medis: ${st.full_name}`,
      "Nilai pos yang sudah dikerjakan tetap tersimpan dengan aman.",
      "info"
    );
    if (selectedClass?.id) loadStudioData(selectedClass.id, false);
  }

  function getEligibleQueueForActivePos(): StudentRow[] {
    return students.filter((st: StudentRow) => {
      if (!st.hasCompletedPreTest) return false;
      if (st.metrics?.field_status === "MEDIS_TUNDA") return false;
      if (isPosDone(st.metrics, activePos)) return false;
      if (activePos === "IMT" && !isAllFiveTkjiDone(st.metrics)) {
        return false;
      }
      return true;
    });
  }

  function callNextWaveOfFive() {
    const eligibleList = getEligibleQueueForActivePos();
    const nextFiveIds = eligibleList
      .slice(0, 5)
      .map((s: StudentRow) => s.student_id);

    if (nextFiveIds.length === 0) {
      const msg =
        activePos === "IMT"
          ? "Belum ada siswa yang menuntaskan seluruh 5 Pos TKJI untuk diukur IMT!"
          : `Tidak ada siswa di antrean yang memenuhi syarat pada ${getPosHumanTitle(
              activePos
            )}!`;
      triggerDynamicIsland("Antrean Pos Kosong", msg, "error");
      return;
    }

    setReadyIds([]);
    broadcastSession(
      activePos,
      "READY",
      nextFiveIds,
      `Panggilan dikirim ke ${nextFiveIds.length} siswa untuk ${getPosHumanTitle(
        activePos
      )}! Menunggu siswa Angkat Tangan.`
    );
  }

  function callAllUnfinishedOnCurrentPos() {
    const eligibleIds = getEligibleQueueForActivePos().map((s) => s.student_id);

    if (eligibleIds.length === 0) {
      const msg =
        activePos === "IMT"
          ? "Belum ada siswa yang menyelesaikan 5 Pos TKJI untuk dipanggil ke Pos IMT!"
          : `Tidak ada siswa yang memenuhi syarat pada ${getPosHumanTitle(
              activePos
            )}!`;
      triggerDynamicIsland("Antrean Pos Kosong", msg, "error");
      return;
    }

    setReadyIds([]);
    broadcastSession(
      activePos,
      "READY",
      eligibleIds,
      `Memanggil ${eligibleIds.length} siswa sekaligus pada ${getPosHumanTitle(
        activePos
      )}! Menunggu siswa Angkat Tangan.`
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

  async function handleCaptureRunnerFinishNow(st: StudentRow) {
    if (runElapsedMs <= 0) {
      toast.error("Stopwatch belum berjalan.");
      return;
    }
    const currentInput = inputs[st.student_id] || {};
    if (activePos === "RUN_60M") {
      const capturedSec = Math.max(
        5.0,
        Number((runElapsedMs / 1000).toFixed(1))
      );
      const override = {
        ...currentInput,
        run_60m_sec: String(capturedSec),
      };
      updateStudentInputField(
        st.student_id,
        "run_60m_sec",
        String(capturedSec)
      );
      await handleSaveStudent(st, override);
    } else if (activePos === "ENDURANCE") {
      const totalSec = Math.max(60, Math.floor(runElapsedMs / 1000));
      const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const ss = String(totalSec % 60).padStart(2, "0");
      const formatted = `${mm}:${ss}`;
      const override = {
        ...currentInput,
        endurance_run_min_sec: formatted,
      };
      updateStudentInputField(
        st.student_id,
        "endurance_run_min_sec",
        formatted
      );
      await handleSaveStudent(st, override);
    }
  }

  function computeTkjiAndBmi(st: StudentRow, rawInput: any) {
    const isMale = st.gender === "L" || st.gender.includes("PUTRA");
    const isYoungerGroup = st.ageYears <= 15;
    const m = st.metrics || {};

    const weight = Math.max(
      0,
      parseFloat(rawInput.weight_kg ?? m.weight_kg ?? 0) || 0
    );
    const height = Math.max(
      0,
      parseFloat(rawInput.height_cm ?? m.height_cm ?? 0) || 0
    );
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

    const run60 = Math.max(
      0,
      parseFloat(rawInput.run_60m_sec ?? m.run_60m_sec ?? 0) || 0
    );
    let s1 = m.run_60m_score || 0;
    if (run60 > 0) {
      if (isMale) {
        s1 = isYoungerGroup
          ? run60 <= 7.7
            ? 5
            : run60 <= 8.7
            ? 4
            : run60 <= 9.9
            ? 3
            : run60 <= 11.1
            ? 2
            : 1
          : run60 <= 7.2
          ? 5
          : run60 <= 8.3
          ? 4
          : run60 <= 9.6
          ? 3
          : run60 <= 11.0
          ? 2
          : 1;
      } else {
        s1 = isYoungerGroup
          ? run60 <= 8.6
            ? 5
            : run60 <= 9.8
            ? 4
            : run60 <= 11.5
            ? 3
            : run60 <= 13.4
            ? 2
            : 1
          : run60 <= 8.4
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
      const pu = Math.max(0, parseInt(rawInput.pull_up_count, 10));
      if (!isNaN(pu)) {
        s2 = isYoungerGroup
          ? pu >= 16
            ? 5
            : pu >= 11
            ? 4
            : pu >= 6
            ? 3
            : pu >= 2
            ? 2
            : 1
          : pu >= 19
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
      const bah = Math.max(0, parseInt(rawInput.bent_arm_hang_sec, 10));
      if (!isNaN(bah)) {
        s2 = bah >= 41 ? 5 : bah >= 22 ? 4 : bah >= 10 ? 3 : bah >= 3 ? 2 : 1;
      }
    }

    let s3 = m.sit_up_score || 0;
    if (rawInput.sit_up_count !== "" && rawInput.sit_up_count !== undefined) {
      const su = Math.max(0, parseInt(rawInput.sit_up_count, 10));
      if (!isNaN(su)) {
        if (isMale) {
          s3 = isYoungerGroup
            ? su >= 38
              ? 5
              : su >= 28
              ? 4
              : su >= 19
              ? 3
              : su >= 8
              ? 2
              : 1
            : su >= 41
            ? 5
            : su >= 30
            ? 4
            : su >= 21
            ? 3
            : su >= 10
            ? 2
            : 1;
        } else {
          s3 = su >= 28 ? 5 : su >= 20 ? 4 : su >= 10 ? 3 : su >= 3 ? 2 : 1;
        }
      }
    }

    let s4 = m.vertical_jump_score || 0;
    if (
      rawInput.vertical_jump_cm !== "" &&
      rawInput.vertical_jump_cm !== undefined
    ) {
      const vj = Math.max(0, parseInt(rawInput.vertical_jump_cm, 10));
      if (!isNaN(vj)) {
        if (isMale) {
          s4 = isYoungerGroup
            ? vj >= 66
              ? 5
              : vj >= 53
              ? 4
              : vj >= 42
              ? 3
              : vj >= 31
              ? 2
              : 1
            : vj >= 73
            ? 5
            : vj >= 60
            ? 4
            : vj >= 50
            ? 3
            : vj >= 39
            ? 2
            : 1;
        } else {
          s4 = vj >= 50 ? 5 : vj >= 39 ? 4 : vj >= 31 ? 3 : vj >= 23 ? 2 : 1;
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
        (Math.max(0, parseInt(parts[0], 10)) || 0) * 60 +
        (Math.max(0, parseInt(parts[1], 10)) || 0);
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
    const allFiveTkjiComplete = Boolean(
      s1 > 0 && s2 > 0 && s3 > 0 && s4 > 0 && s5 > 0
    );
    const tkjiCategory = !allFiveTkjiComplete
      ? m.tkji_category ?? null
      : totalTkji >= 22
      ? "Baik Sekali"
      : totalTkji >= 18
      ? "Baik"
      : totalTkji >= 14
      ? "Sedang"
      : totalTkji >= 10
      ? "Kurang"
      : "Kurang Sekali";

    const allSixComplete = Boolean(allFiveTkjiComplete && bmi != null);

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
      totalTkji: totalTkji > 0 ? totalTkji : null,
      tkjiCategory,
      allFiveTkjiComplete,
      allSixComplete,
    };
  }

  async function handleSaveStudent(st: StudentRow, overrideInput?: any) {
    if (calledIds.includes(st.student_id) && !readyIds.includes(st.student_id)) {
      triggerDynamicIsland(
        "Siswa Belum Angkat Tangan",
        `${st.full_name} wajib menekan Angkat Tangan di HP (atau klik Konfirmasi Hadir Manual).`,
        "error"
      );
      return;
    }

    if (activePos === "IMT" && !isAllFiveTkjiDone(st.metrics)) {
      triggerDynamicIsland(
        "Pos IMT Terkunci",
        `${st.full_name} wajib menyelesaikan 5 Pos TKJI terlebih dahulu.`,
        "error"
      );
      return;
    }

    setSavingId(st.student_id);
    const raw = overrideInput || inputs[st.student_id] || {};
    const calc = computeTkjiAndBmi(st, raw);
    const isMale = st.gender === "L" || st.gender.includes("PUTRA");

    const payload: any = {
      student_id: st.student_id,
      gender: isMale ? "L" : "P",
      birth_date: st.birth_date || st.metrics?.birth_date || "2009-05-15",
      weight_kg: calc.weight,
      height_cm: calc.height,
      calculated_bmi: calc.bmi,
      bmi_category: calc.bmiCategory,
      run_60m_sec:
        raw.run_60m_sec !== "" && raw.run_60m_sec !== undefined
          ? parseFloat(raw.run_60m_sec)
          : st.metrics?.run_60m_sec ?? null,
      run_60m_score: calc.s1 || null,
      pull_up_count:
        isMale && raw.pull_up_count !== "" && raw.pull_up_count !== undefined
          ? parseInt(raw.pull_up_count, 10)
          : st.metrics?.pull_up_count ?? null,
      bent_arm_hang_sec:
        !isMale &&
        raw.bent_arm_hang_sec !== "" &&
        raw.bent_arm_hang_sec !== undefined
          ? parseInt(raw.bent_arm_hang_sec, 10)
          : st.metrics?.bent_arm_hang_sec ?? null,
      pull_up_hang_score: calc.s2 || null,
      sit_up_count:
        raw.sit_up_count !== "" && raw.sit_up_count !== undefined
          ? parseInt(raw.sit_up_count, 10)
          : st.metrics?.sit_up_count ?? null,
      sit_up_score: calc.s3 || null,
      vertical_jump_cm:
        raw.vertical_jump_cm !== "" && raw.vertical_jump_cm !== undefined
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

    const { data: savedRow, error } = st.metrics?.id
      ? await supabase
          .from("student_physical_metrics")
          .update(payload)
          .eq("id", st.metrics.id)
          .select("*")
          .limit(1)
          .maybeSingle()
      : await supabase
          .from("student_physical_metrics")
          .insert(payload)
          .select("*")
          .maybeSingle();

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

      if (savedRow) {
        patchLocalStudentMetrics(savedRow);
      }

      const remainingWave = calledIds.filter((id) => id !== st.student_id);
      await broadcastSession(
        activePos,
        remainingWave.length === 0 ? "STANDBY" : command,
        remainingWave
      );

      if (calc.allSixComplete) {
        const statusLabel = st.metrics?.is_remedial
          ? `Remedial #${st.metrics?.attempt_count || 2} (Skor Awal: ${
              st.metrics?.original_tkji_score ?? "-"
            })`
          : "Tuntas Murni";
        const msg = `Seluruh 6 Pos ${st.full_name} Selesai! Total TKJI: ${calc.totalTkji}/25 [${calc.tkjiCategory} · ${statusLabel}] & IMT: ${calc.bmi} (${calc.bmiCategory}) telah tampil di HP siswa!`;
        setCelebrationBanner(msg);
        triggerDynamicIsland(
          `Tuntas 6 Pos: ${st.full_name}`,
          `TKJI ${calc.totalTkji}/25 (${calc.tkjiCategory}) · IMT ${calc.bmi}`,
          "success"
        );
      } else {
        triggerDynamicIsland(
          `Nilai ${getPosHumanTitle(activePos)} Tersimpan`,
          `${st.full_name} telah dipindahkan dari gelombang aktif.`,
          "success"
        );
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
      "Usia (Thn)",
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
      "Berat (kg)",
      "Tinggi (cm)",
      "IMT",
      "Kategori IMT",
      "Titik GPS",
      "Status Lapangan",
    ];
    const rows = students.map((st) => {
      const m = st.metrics || {};
      const isMale = st.gender === "L" || st.gender.includes("PUTRA");
      const gpsPoints = Array.isArray(m.run_route_json)
        ? m.run_route_json.length
        : 0;
      return [
        `"${st.full_name.replace(/"/g, '""')}"`,
        isMale ? "L" : "P",
        st.ageYears,
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
        m.weight_kg ?? "-",
        m.height_cm ?? "-",
        m.calculated_bmi ?? "-",
        `"${m.bmi_category || "-"}"`,
        gpsPoints,
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
    triggerDynamicIsland(
      "Rekap TKJI & IMT Diunduh",
      `Berkas CSV kelas ${selectedClass?.name || ""} berhasil diekspor.`,
      "success"
    );
  };

  const inspectedRouteTelemetry = useMemo(() => {
    if (!routeInspectStudent) return null;
    let raw = routeInspectStudent.metrics?.run_route_json;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = [];
      }
    }

    let sourceList: any[] = [];
    if (Array.isArray(raw)) {
      sourceList = raw;
    } else if (raw && typeof raw === "object") {
      if (
        Array.isArray(raw.endurance_run) &&
        raw.endurance_run.length > 0
      ) {
        sourceList = raw.endurance_run;
      } else if (
        Array.isArray(raw.sprint_60m) &&
        raw.sprint_60m.length > 0
      ) {
        sourceList = raw.sprint_60m;
      }
    }

    let pts: { lat: number; lng: number; timestamp?: number; speed?: number }[] =
      sourceList
        .map((item: any) => {
          if (Array.isArray(item) && item.length >= 2) {
            return { lat: Number(item[0]), lng: Number(item[1]) };
          }
          return {
            lat: Number(item?.lat ?? item?.latitude ?? 0),
            lng: Number(item?.lng ?? item?.lon ?? item?.longitude ?? 0),
            timestamp: item?.timestamp ? Number(item.timestamp) : undefined,
            speed: item?.speed ? Number(item.speed) : undefined,
          };
        })
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0);

    let totalDistanceM = 0;
    for (let i = 1; i < pts.length; i++) {
      totalDistanceM += haversineMeters(
        pts[i - 1].lat,
        pts[i - 1].lng,
        pts[i].lat,
        pts[i].lng
      );
    }

    let svgPath = "";
    let svgCircles: { x: number; y: number; idx: number }[] = [];

    if (pts.length >= 2) {
      const lats = pts.map((p) => p.lat);
      const lngs = pts.map((p) => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const latSpan = Math.max(0.00005, maxLat - minLat);
      const lngSpan = Math.max(0.00005, maxLng - minLng);

      svgCircles = pts.map((p, idx) => {
        const x = 28 + ((p.lng - minLng) / lngSpan) * 304;
        const y = 172 - ((p.lat - minLat) / latSpan) * 144;
        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), idx };
      });

      svgPath = svgCircles
        .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`)
        .join(" ");
    }

    return {
      pointCount: pts.length,
      totalDistanceM: Number(totalDistanceM.toFixed(1)),
      svgPath,
      svgCircles,
      rawPoints: pts,
    };
  }, [routeInspectStudent]);

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
  const eligibleUnfinishedCount = getEligibleQueueForActivePos().length;

  const calledStudentsList = students.filter((s) =>
    calledIds.includes(s.student_id)
  );
  const queueStudentsList = students.filter(
    (s) =>
      !calledIds.includes(s.student_id) && !isStudentAllComplete(s.metrics)
  );
  const completedStudentsList = students.filter(
    (s) =>
      !calledIds.includes(s.student_id) && isStudentAllComplete(s.metrics)
  );

  const renderStudentRow = (
    st: StudentRow,
    idx: number,
    zone: "CALLED" | "QUEUE" | "COMPLETED"
  ) => {
    const isCalled = zone === "CALLED";
    const isReadyHandRaised = readyIds.includes(st.student_id);
    const isLockedByActiveWave = hasActiveWave && !isCalled;
    const isLockedByUnraisedHand = isCalled && !isReadyHandRaised;
    const isMale = st.gender === "L" || st.gender.includes("PUTRA");
    const inp = inputs[st.student_id] || {};
    const m = st.metrics || {};
    const doneCount = countCompletedPos(m);
    const allFiveTkji = isAllFiveTkjiDone(m);
    const allComplete = isStudentAllComplete(m);
    const isRemedial = Boolean(m.is_remedial);
    const isMedis = m.field_status === "MEDIS_TUNDA";
    const isImtLockedForStudent = activePos === "IMT" && !allFiveTkji;
    const hasRoute = hasGpsRouteData(m);

    const isCurrentPosDone = isPosDone(m, activePos) || allComplete;
    const statusClass = isCalled
      ? "edufit-status-active animate-border-pulse"
      : isCurrentPosDone
      ? "edufit-status-completed"
      : doneCount > 0
      ? "edufit-status-partial"
      : "edufit-status-queue";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        key={st.student_id}
        className={`p-6 md:p-8 transition-colors duration-300 ${
          isLockedByActiveWave ? "opacity-45 grayscale-[25%]" : ""
        } ${statusClass}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="button"
              onClick={() => handleRequestToggleWave(st)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 w-fit cursor-pointer ${
                !st.hasCompletedPreTest || isImtLockedForStudent
                  ? "edufit-surface-subtle opacity-50"
                  : isCalled
                  ? "badge-tint-rose hover:opacity-85"
                  : isCurrentPosDone
                  ? "badge-tint-emerald hover:scale-[1.02]"
                  : "telemetry-bar-forest hover:scale-[1.02]"
              }`}
            >
              {!st.hasCompletedPreTest ? (
                <>
                  <Lock size={14} /> Belum Pre-Test
                </>
              ) : isImtLockedForStudent ? (
                <>
                  <Lock size={14} /> Wajib 5 Pos TKJI
                </>
              ) : (
                <>
                  <UserCheck size={15} />
                  {isCalled
                    ? "Keluarkan"
                    : isCurrentPosDone
                    ? "Uji Remedial?"
                    : `Panggil #${idx + 1}`}
                </>
              )}
            </button>

            <div className="space-y-2.5">
              <div className="text-2xl font-light tracking-tight flex flex-wrap items-center gap-2.5">
                <span className="font-semibold">{st.full_name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider ${
                    isMale ? "badge-tint-sky" : "badge-tint-rose"
                  }`}
                >
                  {isMale ? "Putra (L)" : "Putri (P)"} · {st.ageYears} Thn
                </span>

                {isCalled && (
                  <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest badge-tint-amber">
                    Sedang Ujian
                  </span>
                )}

                {!isCalled && isCurrentPosDone && (
                  <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest badge-tint-emerald flex items-center gap-1">
                    <CheckCircle2 size={12} /> Selesai{" "}
                    {getPosHumanTitle(activePos)}
                  </span>
                )}

                {isCalled && (
                  <button
                    type="button"
                    onClick={() => toggleManualHandRaise(st)}
                    className={`px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all ${
                      isReadyHandRaised
                        ? "badge-tint-emerald"
                        : "badge-tint-amber"
                    }`}
                    title="Klik jika siswa hadir tanpa HP untuk membuka kunci penilaian secara manual"
                  >
                    <Hand size={13} />
                    {isReadyHandRaised
                      ? isRunPos
                        ? "Angkat Tangan & GPS Terkunci"
                        : "Sudah Angkat Tangan (Terbuka)"
                      : "Belum Angkat Tangan (Klik Konfirmasi Manual)"}
                  </button>
                )}

                {isMedis ? (
                  <span className="text-xs font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-md badge-tint-rose">
                    Tunda Medis ({doneCount}/6 Pos)
                  </span>
                ) : allComplete ? (
                  isRemedial ? (
                    <span className="text-xs font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-md badge-tint-amber">
                      Remedial #{m.attempt_count || 2} (Awal:{" "}
                      {m.original_tkji_score ?? "-"})
                    </span>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-accent flex items-center gap-1">
                      · <CheckCircle2 size={14} /> Tuntas 6 Pos
                    </span>
                  )
                ) : (
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-widest ${
                      doneCount > 0
                        ? "badge-tint-violet"
                        : "edufit-surface-subtle opacity-65"
                    }`}
                  >
                    Progres {doneCount}/6 Pos
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {POS_ITEMS.map((p) => {
                  const done = isPosDone(m, p.code);
                  const isCurrentActivePos = p.code === activePos;
                  return (
                    <span
                      key={p.code}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition-colors ${
                        done
                          ? "badge-tint-emerald"
                          : isCurrentActivePos
                          ? "badge-tint-amber"
                          : "edufit-surface-subtle opacity-60"
                      }`}
                    >
                      {p.shortLabel}:{" "}
                      {done
                        ? "Selesai"
                        : isCurrentActivePos
                        ? "Pos Aktif"
                        : "—"}
                    </span>
                  );
                })}
                <span className="text-xs font-semibold opacity-80 ml-1">
                  · Total TKJI:{" "}
                  <strong className="text-gold-accent font-mono">
                    {m.total_tkji_score ?? 0}/25 ({m.tkji_category ?? "Belum"})
                  </strong>
                </span>
                {(hasRoute || m.run_60m_sec || m.endurance_run_min_sec) && (
                  <button
                    type="button"
                    onClick={() => setRouteInspectStudent(st)}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer badge-tint-sky hover:scale-105 transition-transform"
                    title="Lihat Peta Lintasan GPS Lari Siswa"
                  >
                    <Navigation size={11} />
                    {hasRoute ? "Jejak GPS" : "Catatan Lari"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {isLockedByActiveWave ? (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55 px-5 py-3 rounded-2xl border border-dashed border-hairline">
              <Lock size={14} /> Panggil ke Gelombang Dahulu Untuk Menguji
            </div>
          ) : isImtLockedForStudent ? (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-2xl badge-tint-amber">
              <Lock size={14} /> Selesaikan 5 Pos TKJI Sebelum Mengukur IMT
            </div>
          ) : isLockedByUnraisedHand ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-2xl badge-tint-amber">
                <Lock size={14} /> Terkunci · Menunggu Siswa Angkat Tangan di HP
              </div>
              <button
                type="button"
                onClick={() => toggleManualHandRaise(st)}
                className="px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer edufit-card-primary hover:scale-[1.02] transition-transform"
              >
                Buka Manual (Tanpa HP)
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {activePos === "IMT" && (
                <>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="250"
                    placeholder="Berat (kg)"
                    value={inp.weight_kg}
                    onChange={(e) =>
                      updateStudentInputField(
                        st.student_id,
                        "weight_kg",
                        e.target.value
                      )
                    }
                    className="w-28 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="250"
                    placeholder="Tinggi (cm)"
                    value={inp.height_cm}
                    onChange={(e) =>
                      updateStudentInputField(
                        st.student_id,
                        "height_cm",
                        e.target.value
                      )
                    }
                    className="w-28 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                  />
                </>
              )}

              {activePos === "RUN_60M" && (
                <>
                  <span className="text-xs font-bold font-mono uppercase tracking-wider px-4 py-3 rounded-2xl badge-tint-emerald">
                    GPS HP:{" "}
                    {m.run_60m_sec ? `${m.run_60m_sec} dtk` : "Siap 60m"} (Skor{" "}
                    {m.run_60m_score ?? "—"}/5)
                  </span>
                  {isCalled && command === "START" && (
                    <button
                      type="button"
                      onClick={() => handleCaptureRunnerFinishNow(st)}
                      className="px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:opacity-90 btn-forest-gold"
                      title="Tangkap waktu dari stopwatch guru jika GPS HP siswa terkendala"
                    >
                      <Flag size={13} /> Tangkap ({formatRunMasterDisplay()})
                    </button>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    min="4"
                    max="60"
                    placeholder="Manual (dtk)"
                    value={inp.run_60m_sec}
                    onChange={(e) =>
                      updateStudentInputField(
                        st.student_id,
                        "run_60m_sec",
                        e.target.value
                      )
                    }
                    className="w-32 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                    title="Isi manual jika siswa tidak membawa HP"
                  />
                </>
              )}

              {activePos === "PULL_UP" && (
                <>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    placeholder={isMale ? "Repetisi" : "Detik Siku"}
                    value={isMale ? inp.pull_up_count : inp.bent_arm_hang_sec}
                    onChange={(e) =>
                      updateStudentInputField(
                        st.student_id,
                        isMale ? "pull_up_count" : "bent_arm_hang_sec",
                        e.target.value
                      )
                    }
                    className="w-32 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl badge-tint-emerald">
                    Skor: {m.pull_up_hang_score ?? "—"}/5
                  </span>
                </>
              )}

              {activePos === "SIT_UP" && (
                <>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    placeholder="Repetisi"
                    value={inp.sit_up_count}
                    onChange={(e) =>
                      updateStudentInputField(
                        st.student_id,
                        "sit_up_count",
                        e.target.value
                      )
                    }
                    className="w-32 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl badge-tint-emerald">
                    Skor: {m.sit_up_score ?? "—"}/5
                  </span>
                </>
              )}

              {activePos === "VERTICAL_JUMP" && (
                <>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    placeholder="Selisih (cm)"
                    value={inp.vertical_jump_cm}
                    onChange={(e) =>
                      updateStudentInputField(
                        st.student_id,
                        "vertical_jump_cm",
                        e.target.value
                      )
                    }
                    className="w-32 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl badge-tint-emerald">
                    Skor: {m.vertical_jump_score ?? "—"}/5
                  </span>
                </>
              )}

              {activePos === "ENDURANCE" && (
                <>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-3 rounded-2xl badge-tint-emerald">
                    GPS HP: {m.endurance_run_min_sec ?? "Siap Lari"} (Skor{" "}
                    {m.endurance_run_score ?? "—"}/5)
                  </span>
                  {isCalled && command === "START" && (
                    <button
                      type="button"
                      onClick={() => handleCaptureRunnerFinishNow(st)}
                      className="px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:opacity-90 btn-forest-gold"
                      title="Tangkap waktu dari stopwatch guru jika GPS HP siswa terkendala"
                    >
                      <Flag size={13} /> Tangkap ({formatRunMasterDisplay()})
                    </button>
                  )}
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
                    className="w-32 px-4 py-3 rounded-2xl text-sm font-mono font-bold text-center focus:outline-none edufit-card-primary"
                    title="Isi manual jika siswa tidak membawa HP"
                  />
                </>
              )}

              <button
                type="button"
                onClick={() => handleSaveStudent(st)}
                disabled={savingId === st.student_id}
                className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm btn-forest-gold"
              >
                <Save size={14} />
                {savingId === st.student_id ? "Menyimpan..." : "Simpan Nilai"}
              </button>

              {isCalled && (
                <button
                  type="button"
                  onClick={() => handleMarkMedicalSuspend(st)}
                  className="p-3 rounded-2xl cursor-pointer badge-tint-rose hover:opacity-80"
                  title="Tandai Siswa Kram / Medis / Tunda Ujian"
                >
                  <HeartPulse size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="edufit-guru-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* INJEKSI CSS STATUS LANGSUNG AGAR WARNA POS & BARIS SISWA PASTI MUNCUL */}
      <style jsx global>{`
        .edufit-status-active {
          background-color: rgba(245, 158, 11, 0.14) !important;
          border-left: 5px solid #f59e0b !important;
        }
        .dark .edufit-status-active {
          background-color: rgba(250, 204, 21, 0.14) !important;
          border-left: 5px solid #facc15 !important;
        }
        .edufit-status-completed {
          background-color: rgba(16, 185, 129, 0.14) !important;
          border-left: 5px solid #10b981 !important;
        }
        .dark .edufit-status-completed {
          background-color: rgba(16, 185, 129, 0.18) !important;
          border-left: 5px solid #34d399 !important;
        }
        .edufit-status-partial {
          background-color: rgba(14, 165, 233, 0.1) !important;
          border-left: 5px solid #0ea5e9 !important;
        }
        .dark .edufit-status-partial {
          background-color: rgba(14, 165, 233, 0.14) !important;
          border-left: 5px solid #38bdf8 !important;
        }
        .edufit-status-queue {
          border-left: 5px solid transparent !important;
        }
      `}</style>

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

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-30">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <button
              type="button"
              onClick={handleExitLiveStudio}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-card-primary"
            >
              <ArrowLeft size={15} /> Ruang Guru
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-surface-subtle"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={14} /> Layar Normal
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
              className="px-4 py-2.5 rounded-2xl text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-surface-subtle"
              title="Ganti Mode Terang / Gelap"
            >
              {isDark ? (
                <>
                  <Sun size={15} className="text-gold-accent" /> DARK
                </>
              ) : (
                <>
                  <Moon size={15} /> LIGHT
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer edufit-surface-subtle"
              title="Unduh Rekap TKJI & IMT CSV"
            >
              <Download size={14} /> Ekspor CSV
            </button>

            <button
              type="button"
              onClick={() =>
                selectedClass && loadStudioData(selectedClass.id, true)
              }
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer edufit-surface-subtle"
              title="Muat Ulang Data Kelas"
            >
              <RefreshCw
                size={15}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-3 opacity-65">
            <span className="text-gold-accent">
              Studio Pengukuran Kebugaran Jasmani (TKJI)
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Radio size={15} className="text-emerald-accent animate-pulse" />
              {selectedClass
                ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                : "Pengujian Fisik Real-Time"}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Studio Live <br />
            <span className="font-semibold">
              {POS_ITEMS.find((p) => p.code === activePos)?.title}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-mono font-light tracking-tighter leading-none text-sky-accent">
              {calledIds.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Siswa Dipanggil
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-mono font-light tracking-tighter leading-none text-gold-accent">
              {calledReadyCount}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Sudah Angkat Tangan
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-mono font-light tracking-tighter leading-none text-emerald-accent">
              {completedStudentsList.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Tuntas 6 Pos
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-20">
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Status Sesi</span>
            <span className="font-mono text-gold-accent">
              {getPosHumanTitle(activePos)}
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-xl font-mono font-light tracking-tight">
              {getCommandHumanLabel(command)}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-gold-accent">
              SINKRON HP
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Konfirmasi Kehadiran</span>
            <span className="font-mono">ANGKAT TANGAN</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-mono font-semibold tracking-tight">
              {calledReadyCount}/{calledIds.length} Siap
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {calledReadyCount > 0 ? "Siap Uji" : "Terkunci"}
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Ketuntasan {getPosHumanTitle(activePos)}</span>
            <span className="font-mono text-emerald-accent">
              {currentPosDoneCount} DARI {students.length} SISWA
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-mono font-light tracking-tight relative z-10">
              {currentPosCompletionPct}%
            </span>
            <span className="px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest relative z-10 badge-tint-emerald">
              {eligibleUnfinishedCount > 0
                ? `${eligibleUnfinishedCount} Siap Dipanggil`
                : "Antrean Kosong"}
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rata-Rata TKJI</span>
            <span className="font-mono">SKALA 25</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-mono font-light tracking-tight text-emerald-accent">
              {classAvgTkji}/25
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(liveFinishFeed.length > 0 || celebrationBanner) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-6 rounded-2xl relative overflow-hidden badge-tint-emerald"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Award size={16} /> Laporan Finis Otomatis dari HP Siswa
                </div>
                {celebrationBanner && (
                  <p className="text-sm font-bold">{celebrationBanner}</p>
                )}
                {liveFinishFeed.map((item) => (
                  <p key={item.id} className="text-sm font-medium">
                    <span className="font-mono opacity-75 mr-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1: MANAJEMEN GELOMBANG */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              <SlidersHorizontal size={14} className="text-gold-accent" />
              <span>Kontrol Antrean Lapangan</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Manajemen Gelombang
            </h2>
            <p className="text-sm mb-4 leading-relaxed font-medium opacity-55">
              Pilih kelas 12 dan panggil gelombang siswa yang sudah menyelesaikan
              Pre-Test ke lapangan.
            </p>

            <div className="relative w-full mb-6" ref={classDropdownRef}>
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-55 block mb-1">
                Kelas yang Sedang Diuji ({classes.length} Rombel Kelas 12)
              </label>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none text-left edufit-underline-select ${
                  isClassDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {selectedClass
                    ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                    : "Pilih Kelas..."}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isClassDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isClassDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    {classes.length === 0 ? (
                      <div className="p-5 text-sm opacity-55 text-center">
                        Belum ada kelas pada jenjang ini.
                      </div>
                    ) : (
                      classes.map((cls: any) => {
                        const isSelected = selectedClass?.id === cls.id;
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              setSelectedClass(cls);
                              setIsClassDropdownOpen(false);
                            }}
                            className={`w-full text-left px-6 py-4 text-base font-medium cursor-pointer flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                              isSelected ? "text-gold-accent" : ""
                            }`}
                          >
                            <div>
                              <span className="font-bold block">
                                {cls.name}
                              </span>
                              <span className="text-xs font-mono opacity-60">
                                Kelas {cls.grade_level}
                              </span>
                            </div>
                            {isSelected && (
                              <Check size={18} className="text-gold-accent" />
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
              className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md btn-forest-gold"
            >
              <UserCheck size={16} /> Panggil 5 Siswa Berikutnya
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={callAllUnfinishedOnCurrentPos}
                className="py-3.5 px-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-center transition-colors cursor-pointer badge-tint-sky hover:opacity-85"
              >
                Panggil Siap ({eligibleUnfinishedCount})
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
                className="py-3.5 px-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-center cursor-pointer badge-tint-rose opacity-85 hover:opacity-100"
              >
                Kosongkan ({calledIds.length})
              </button>
            </div>
          </div>
        </div>

        {/* BENTO 2: POS PENGUKURAN DENGAN WARNA STATUS (AKTIF = KUNING, SELESAI = HIJAU, PROGRES = BIRU) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10 mb-4">
            <div>
              <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
                <Activity size={15} className="text-emerald-accent" />
                <span>Daftar Pos Pengukuran TKJI & IMT</span>
              </div>
              <p className="text-xs opacity-55 mt-1">
                Kuning = Sedang Diuji · Hijau = Tuntas · Biru = Berjalan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 my-auto relative z-10">
            {POS_ITEMS.map((pos) => {
              const active = activePos === pos.code;
              const doneInThisPos = students.filter((s) =>
                isPosDone(s.metrics, pos.code)
              ).length;
              const isAllPosDone =
                students.length > 0 && doneInThisPos === students.length;
              const isPartialPosDone =
                doneInThisPos > 0 && doneInThisPos < students.length;

              const posColorClass = active
                ? "seg-btn-active shadow-md ring-2 ring-amber-400/50"
                : isAllPosDone
                ? "badge-tint-emerald"
                : isPartialPosDone
                ? "badge-tint-sky"
                : "edufit-card-primary";

              return (
                <button
                  key={pos.code}
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setCountdown(60);
                    setReadyIds([]);
                    broadcastSession(
                      pos.code,
                      "STANDBY",
                      [],
                      `Berpindah ke ${pos.title}. Gelombang disiapkan untuk pos baru.`
                    );
                  }}
                  className={`p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[96px] ${posColorClass}`}
                >
                  <div className="flex items-center justify-between w-full font-mono">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {pos.step}
                    </span>
                    <span className="text-[10px] font-bold">
                      {doneInThisPos}/{students.length}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-base font-bold leading-tight">
                      {pos.shortLabel}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5 truncate font-semibold">
                      {active
                        ? "Sedang Diuji"
                        : isAllPosDone
                        ? "Selesai 100%"
                        : pos.mode === "AUTO_HP"
                        ? "Otomatis GPS HP"
                        : pos.code === "IMT"
                        ? "Tahap Akhir"
                        : "Input Guru"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BENTO 3: STOPWATCH & TIMER */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Timer size={15} className="text-gold-accent" />
              <span>
                {isRunPos
                  ? "Stopwatch Utama Lari"
                  : isTimedManualPos
                  ? "Timer Pos 60 Detik"
                  : "Progres Pengukuran Pos"}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold badge-tint-amber">
              {calledReadyCount}/{calledIds.length} Siap
            </span>
          </div>

          {(() => {
            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            let progressPct = 0;
            if (isRunPos) {
              const targetSec = activePos === "RUN_60M" ? 12 : 300;
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
              progressPct <= 0
                ? circumference
                : circumference - (progressPct / 100) * circumference;

            const bottomLabelText = isRunPos
              ? command === "START"
                ? "Sedang Berlari (Pelacakan Jarak GPS HP Siswa)"
                : calledReadyCount === 0
                ? "Tombol Mulai Terkunci · Tunggu Siswa Angkat Tangan"
                : `${calledReadyCount} Siswa Sudah Kunci GPS & Siap Mulai`
              : isTimedManualPos
              ? isTimerRunning
                ? "Hitung Mundur 60 Detik Berjalan"
                : calledReadyCount === 0
                ? "Timer Terkunci · Tunggu Siswa Angkat Tangan"
                : `${calledReadyCount} Siswa Siap Mulai 60 Detik`
              : `Ketuntasan Pengukuran ${getPosHumanTitle(activePos)}`;

            return (
              <div className="relative flex flex-col items-center justify-center my-2 z-10">
                <div className="relative flex items-center justify-center">
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
                    {progressPct > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-300 gauge-circle-gold"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-mono font-light tracking-tighter leading-none">
                      {isRunPos
                        ? formatRunMasterDisplay()
                        : isTimedManualPos
                        ? `${countdown}s`
                        : `${currentPosCompletionPct}%`}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold opacity-65 mt-3 text-center">
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
                    if (calledReadyIds.length === 0) {
                      triggerDynamicIsland(
                        "Belum Ada Siswa Siap",
                        "Minimal 1 siswa di gelombang aktif wajib Angkat Tangan terlebih dahulu.",
                        "error"
                      );
                      return;
                    }
                    broadcastSession(
                      activePos,
                      "START",
                      calledReadyIds,
                      `Pelacakan GPS & Stopwatch dimulai untuk ${calledReadyIds.length} siswa yang siap!`,
                      true
                    );
                  }}
                  disabled={calledReadyCount === 0}
                  className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm btn-forest-gold"
                >
                  <Play size={14} /> Mulai ({calledReadyCount})
                </button>
                <button
                  type="button"
                  onClick={handleFalseStartReset}
                  disabled={calledIds.length === 0}
                  className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1.5 badge-tint-sky"
                >
                  <RotateCcw size={14} /> Ulang
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
                  className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 badge-tint-rose"
                >
                  <Square size={14} /> Stop
                </button>
              </div>
            ) : isTimedManualPos ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!isTimerRunning && calledReadyCount === 0}
                  onClick={() => {
                    const nextState = !isTimerRunning;
                    const activeTargetIds = nextState
                      ? calledReadyIds
                      : calledIds;
                    setIsTimerRunning(nextState);
                    broadcastSession(
                      activePos,
                      nextState ? "START" : "STOP",
                      activeTargetIds,
                      nextState
                        ? `Timer 60 detik dimulai untuk ${activeTargetIds.length} siswa yang siap!`
                        : "Timer 60 detik dijeda.",
                      nextState
                    );
                  }}
                  className={`py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer disabled:opacity-30 ${
                    isTimerRunning ? "badge-tint-rose" : "btn-forest-gold"
                  }`}
                >
                  {isTimerRunning
                    ? "Jeda Timer"
                    : `Mulai 60s (${calledReadyCount} Siap)`}
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
                  className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer badge-tint-sky"
                >
                  Reset 60s
                </button>
              </div>
            ) : (
              <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase pt-3 border-t border-hairline">
                <span className="text-emerald-accent">
                  {currentPosDoneCount} Selesai
                </span>
                <span>—</span>
                <span className="text-gold-accent">
                  {eligibleUnfinishedCount} Siap Uji
                </span>
                <span>—</span>
                <span className="text-sky-accent">
                  {completedStudentsList.length} Tuntas
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONA 4: PANGGUNG GELOMBANG AKTIF & ANTREAN SISWA */}
      {calledStudentsList.length > 0 && (
        <div className="rounded-[2rem] mb-8 overflow-hidden shadow-lg relative z-10 edufit-card-primary bento-showcase-selected">
          <div className="px-8 py-4 flex flex-wrap items-center justify-between gap-2 telemetry-bar-gold">
            <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Radio size={15} className="animate-pulse" />
              Gelombang Aktif — Sedang Diuji ({calledStudentsList.length}{" "}
              Dipanggil · {calledReadyCount} Sudah Angkat Tangan)
            </div>
            <span className="text-xs font-bold">
              Siswa wajib menekan Angkat Tangan di HP agar GPS terkunci & kolom
              input nilai terbuka
            </span>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {calledStudentsList.map((st, idx) =>
                renderStudentRow(st, idx, "CALLED")
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] mb-10 overflow-hidden relative z-10 edufit-card-primary">
        <div className="px-8 py-6 border-b border-hairline flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-accent block mb-1">
              Daftar Tunggu Pos Pengukuran
            </span>
            <h3 className="text-3xl font-light tracking-tight">
              Antrean Siswa ({queueStudentsList.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span className="px-3 py-1 rounded-lg badge-tint-amber">
              Kuning: Sedang Ujian
            </span>
            <span className="px-3 py-1 rounded-lg badge-tint-emerald">
              Hijau: Selesai Pos Ini
            </span>
            <span className="px-3 py-1 rounded-lg badge-tint-sky">
              Biru: Progres Pos Lain
            </span>
            {hasActiveWave && (
              <span className="px-3 py-1 rounded-lg badge-tint-rose flex items-center gap-1">
                <Lock size={11} /> Antrean Dikunci Selama Gelombang Berjalan
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center opacity-55 text-xl font-light">
            Menyiapkan daftar siswa...
          </div>
        ) : queueStudentsList.length === 0 ? (
          <div className="py-12 text-center opacity-55 text-base font-light">
            Tidak ada siswa di antrean tunggu.
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {queueStudentsList.map((st, idx) =>
                renderStudentRow(st, idx, "QUEUE")
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ZONA 5: GRID KARTU SISWA TUNTAS SELURUH 6 POS */}
      {completedStudentsList.length > 0 && (
        <div className="space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-accent block mb-1">
                Rekapitulasi Ketuntasan Fisik
              </span>
              <h3 className="text-3xl font-light tracking-tight">
                Siswa Tuntas Seluruh 6 Pos ({completedStudentsList.length})
              </h3>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-55">
              Klik kartu siswa untuk membuka sesi remedial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {completedStudentsList.map((st, index) => {
              const showcaseClass =
                BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
              const m = st.metrics || {};
              return (
                <div
                  key={st.student_id}
                  onClick={() => handleRequestToggleWave(st)}
                  className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[280px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass}`}
                >
                  <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                  <div className="flex justify-between items-start relative z-10">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-bold font-mono tracking-widest uppercase bg-black/10 dark:bg-white/10">
                      {m.is_remedial
                        ? `Remedial #${m.attempt_count || 2}`
                        : "Tuntas Murni · 6/6 Pos"}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasGpsRouteData(m) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRouteInspectStudent(st);
                          }}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center gap-1"
                        >
                          <Navigation size={11} /> Rute GPS
                        </button>
                      )}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
                        <ArrowUpRight size={18} strokeWidth={1.75} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 relative z-10">
                    <div className="text-4xl font-light tracking-tighter mb-6 leading-tight">
                      {st.full_name}
                    </div>

                    <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                          IMT ({m.bmi_category || "-"})
                        </div>
                        <div className="text-3xl font-mono font-light leading-none">
                          {m.calculated_bmi ?? "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                          Skor TKJI ({m.tkji_category || "-"})
                        </div>
                        <div className="text-4xl font-mono font-light leading-none text-gold-accent">
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

      {/* MODAL INSPEKSI LINTASAN GPS LARI SISWA */}
      <AnimatePresence>
        {routeInspectStudent && inspectedRouteTelemetry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setRouteInspectStudent(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl space-y-6 edufit-card-primary"
            >
              <div className="flex items-start justify-between gap-4 border-b border-hairline pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gold-accent block mb-1">
                    Verifikasi Lintasan GPS Lapangan
                  </span>
                  <h3 className="text-3xl font-light tracking-tight">
                    Jejak Lari:{" "}
                    <span className="font-semibold">
                      {routeInspectStudent.full_name}
                    </span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRouteInspectStudent(null)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer badge-tint-rose"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl badge-tint-emerald">
                  <span className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                    Sprint 60m
                  </span>
                  <span className="text-2xl font-mono font-semibold">
                    {routeInspectStudent.metrics?.run_60m_sec
                      ? `${routeInspectStudent.metrics.run_60m_sec}s`
                      : "—"}
                  </span>
                </div>
                <div className="p-4 rounded-2xl badge-tint-sky">
                  <span className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                    Lari Jauh
                  </span>
                  <span className="text-2xl font-mono font-semibold">
                    {routeInspectStudent.metrics?.endurance_run_min_sec || "—"}
                  </span>
                </div>
                <div className="p-4 rounded-2xl badge-tint-amber">
                  <span className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                    Titik Satelit
                  </span>
                  <span className="text-2xl font-mono font-semibold">
                    {inspectedRouteTelemetry.pointCount} Titik
                  </span>
                </div>
                <div className="p-4 rounded-2xl badge-tint-violet">
                  <span className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                    Jarak Tempuh
                  </span>
                  <span className="text-2xl font-mono font-semibold">
                    {inspectedRouteTelemetry.totalDistanceM}m
                  </span>
                </div>
              </div>

              <div className="rounded-3xl p-6 relative overflow-hidden edufit-card-secondary">
                <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-65 flex items-center gap-1.5">
                    <Compass size={14} className="text-gold-accent" />
                    Proyeksi Lintasan Lari Siswa
                  </span>
                  <span className="text-[11px] font-mono opacity-60">
                    Usia {routeInspectStudent.ageYears} Thn ·{" "}
                    {routeInspectStudent.gender === "L" ? "Putra" : "Putri"}
                  </span>
                </div>

                {inspectedRouteTelemetry.pointCount >= 2 ? (
                  <div className="w-full h-52 flex items-center justify-center relative z-10">
                    <svg
                      viewBox="0 0 360 200"
                      className="w-full h-full overflow-visible"
                    >
                      <path
                        d={inspectedRouteTelemetry.svgPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gold-accent"
                      />
                      {inspectedRouteTelemetry.svgCircles.map((c, idx) => {
                        const isStart = idx === 0;
                        const isEnd =
                          idx ===
                          inspectedRouteTelemetry.svgCircles.length - 1;
                        return (
                          <circle
                            key={c.idx}
                            cx={c.x}
                            cy={c.y}
                            r={isStart || isEnd ? 6 : 2.5}
                            className={
                              isStart
                                ? "fill-amber-400"
                                : isEnd
                                ? "fill-emerald-500"
                                : "fill-current opacity-55"
                            }
                          />
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <div className="py-12 text-center relative z-10 space-y-2">
                    <MapPin size={24} className="mx-auto opacity-40" />
                    <p className="text-sm font-medium opacity-70">
                      Belum ada rekaman jejak koordinat GPS (nilai diinput
                      melalui stopwatch manual Guru).
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI PROTEKSI SALAH KLIK vs BUKA SESI REMEDIAL */}
      <AnimatePresence>
        {remedialModalStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setRemedialModalStudent(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl space-y-6 edufit-card-primary"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center badge-tint-amber">
                  <AlertTriangle size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => setRemedialModalStudent(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-accent block mb-1">
                  Konfirmasi Pengujian Ulang
                </span>
                <h3 className="text-3xl font-light tracking-tight">
                  Proteksi Nilai:{" "}
                  <span className="font-semibold">
                    {remedialModalStudent.full_name}
                  </span>
                </h3>
                <p className="text-sm opacity-65 mt-2 leading-relaxed">
                  Siswa ini sudah memiliki nilai pada pos ini (Total TKJI:{" "}
                  <strong className="font-mono">
                    {remedialModalStudent.metrics?.total_tkji_score ?? 0}/25
                  </strong>
                  ). Apakah Anda tidak sengaja menekan, atau ingin membuka{" "}
                  <strong>Sesi Remedial</strong>?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setRemedialModalStudent(null)}
                  className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer edufit-surface-subtle"
                >
                  Batal (Salah Klik)
                </button>
                <button
                  type="button"
                  onClick={() => confirmActivateRemedial(remedialModalStudent)}
                  className="py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer btn-forest-gold"
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