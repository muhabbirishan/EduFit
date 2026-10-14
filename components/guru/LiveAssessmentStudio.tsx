"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronDown,
  Flag,
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
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
    shortLabel: "60m",
    title: "Lari Cepat 60 Meter",
    subtitle: "GPS Auto / Override Guru",
    mode: "AUTO_HP",
  },
  {
    code: "PULL_UP",
    step: "POS 03",
    shortLabel: "Gantung",
    title: "Gantung Angkat / Siku",
    subtitle: "Gelombang 3-5 Siswa (60d)",
    mode: "MANUAL_GURU",
  },
  {
    code: "SIT_UP",
    step: "POS 04",
    shortLabel: "Sit-Up",
    title: "Baring Duduk (Sit-Up)",
    subtitle: "Gelombang 3-5 Siswa (60d)",
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
    shortLabel: "1200m",
    title: "Lari 1.200m / 1.000m",
    subtitle: "GPS Auto / Override Guru",
    mode: "AUTO_HP",
  },
];

export default function LiveAssessmentStudio() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [activePos, setActivePos] = useState<PosType>("RUN_60M");
  const [command, setCommand] = useState<string>("STANDBY");
  const [calledIds, setCalledIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(
    null
  );

  // Modal Konfirmasi Proteksi Salah Klik / Remedial
  const [remedialModalStudent, setRemedialModalStudent] =
    useState<StudentRow | null>(null);

  // Timer 60 Detik untuk Sit-Up / Pull-Up
  const [countdown, setCountdown] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Master Stopwatch Lari Guru
  const [runElapsedMs, setRunElapsedMs] = useState<number>(0);
  const [runStartedAtIso, setRunStartedAtIso] = useState<string | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    const onFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
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
    async function fetchGrade12Classes() {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("classes")
        .select("id, name, grade_level, class_code")
        .eq("guru_id", session.user.id)
        .eq("grade_level", 12)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setClasses(data);
        setSelectedClass(data[0]);
      } else {
        setIsLoading(false);
      }
    }
    fetchGrade12Classes();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (runTimerRef.current) clearInterval(runTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (command === "START" && runStartedAtIso) {
      const startMs = new Date(runStartedAtIso).getTime();
      if (runTimerRef.current) clearInterval(runTimerRef.current);
      runTimerRef.current = setInterval(() => {
        const diff = Math.max(0, Date.now() - startMs);
        setRunElapsedMs(diff);
      }, 100);
    } else {
      if (runTimerRef.current) clearInterval(runTimerRef.current);
      if (command === "STANDBY") setRunElapsedMs(0);
    }
    return () => {
      if (runTimerRef.current) clearInterval(runTimerRef.current);
    };
  }, [command, runStartedAtIso]);

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
            toast.success(
              "⏱️ Waktu 60 Detik Selesai! Silakan simpan repetisi siswa yang sedang diuji."
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
  }, [isTimerRunning]);

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
        await supabase.from("live_sessions").insert({
          class_id: classId,
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

      const [profRes, metRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("id, full_name, email, gender")
          .in("id", studentIds),
        supabase
          .from("student_physical_metrics")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false }),
      ]);

      const latestMetrics: Record<string, any> = {};
      (metRes.data || []).forEach((m: any) => {
        if (!latestMetrics[m.student_id]) {
          latestMetrics[m.student_id] = m;
        }
      });

      const mappedInputs: Record<string, any> = {};
      const mergedStudents: StudentRow[] = (profRes.data || []).map(
        (p: any) => {
          const m = latestMetrics[p.id];
          mappedInputs[p.id] = {
            weight_kg: m?.weight_kg ?? "",
            height_cm: m?.height_cm ?? "",
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
            metrics: m,
          };
        }
      );

      mergedStudents.sort((a: StudentRow, b: StudentRow) =>
        a.full_name.localeCompare(b.full_name)
      );
      setStudents(mergedStudents);
      setInputs(mappedInputs);
    } catch (_) {
      toast.error("Gagal memuat studio live asesmen");
    } finally {
      setIsLoading(false);
    }
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
        : nextCmd === "STANDBY"
        ? null
        : runStartedAtIso;

    setActivePos(nextPos);
    setCommand(nextCmd);
    setCalledIds(nextStudentIds);
    setRunStartedAtIso(nextStartedAt);

    const { error } = await supabase.from("live_sessions").upsert(
      {
        class_id: selectedClass.id,
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

  // PROTEKSI SALAH KLIK: Cek apakah siswa sudah punya nilai di Pos ini / sudah selesai 6/6
  function handleRequestToggleWave(st: StudentRow) {
    const exists = calledIds.includes(st.student_id);
    if (exists) {
      const nextList = calledIds.filter((id) => id !== st.student_id);
      broadcastSession(
        activePos,
        command === "START" ? "START" : "READY",
        nextList,
        `${st.full_name} dikeluarkan dari gelombang aktif.`
      );
      return;
    }

    // Jika siswa sudah selesai di pos ini atau selesai 6/6, tampilkan modal proteksi salah klik!
    if (isPosDone(st.metrics, activePos) || isStudentAllComplete(st.metrics)) {
      setRemedialModalStudent(st);
      return;
    }

    const nextList = [...calledIds, st.student_id];
    broadcastSession(
      activePos,
      "READY",
      nextList,
      `${st.full_name} dipanggil ke Gelombang Aktif!`
    );
  }

  // Konfirmasi Buka Sesi Remedial untuk siswa yang sudah selesai
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
    const nextList = [...new Set([...calledIds, st.student_id])];
    await broadcastSession(
      activePos,
      "READY",
      nextList,
      `Mode REMEDIAL dibuka untuk ${st.full_name}! Skor awal tetap tersimpan.`
    );
    if (selectedClass?.id) loadStudioData(selectedClass.id, false);
  }

  // SITUASI LAPANGAN 1: Tombol False Start (Ulang Stopwatch 0.0d Tanpa Simpan Data Cacat)
  async function handleFalseStartReset() {
    setRunElapsedMs(0);
    await broadcastSession(
      activePos,
      "READY",
      calledIds,
      "⚠️ FALSE START! Stopwatch seluruh siswa di gelombang ini telah di-reset ke 00.0!"
    );
  }

  // SITUASI LAPANGAN 2: Siswa Kram / Medis / Tunda di Tengah Ujian (Simpan Progres Parsial)
  async function handleMarkMedicalSuspend(st: StudentRow) {
    const nextCalled = calledIds.filter((id) => id !== st.student_id);
    await broadcastSession(activePos, command, nextCalled);

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
      `Status ${st.full_name} diubah ke TUNDA MEDIS. Nilai pos yang sudah dikerjakan tetap tersimpan aman.`
    );
    if (selectedClass?.id) loadStudioData(selectedClass.id, false);
  }

  function callNextWaveOfFive() {
    const unfinished = students.filter(
      (st: StudentRow) =>
        !isPosDone(st.metrics, activePos) &&
        st.metrics?.field_status !== "MEDIS_TUNDA"
    );

    const nextFiveIds = unfinished
      .slice(0, 5)
      .map((s: StudentRow) => s.student_id);
    if (nextFiveIds.length === 0) {
      toast.success(
        "Seluruh siswa aktif di kelas ini sudah dinilai pada pos ini!"
      );
      return;
    }

    broadcastSession(
      activePos,
      "READY",
      nextFiveIds,
      `Memanggil gelombang ${nextFiveIds.length} siswa ke panggung ujian!`
    );
  }

  function formatRunMasterDisplay(): string {
    if (activePos === "RUN_60M") {
      const sec = (runElapsedMs / 1000).toFixed(1);
      return `${sec} dtk`;
    }
    const totalSec = Math.floor(runElapsedMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  // SITUASI LAPANGAN 3: Override Stopwatch Guru (Untuk Simulasi / Saat HP Siswa Mati)
  async function captureRunTimeFromTeacher(st: StudentRow) {
    const currentInput = inputs[st.student_id] || {};
    const updatedInput = { ...currentInput };

    if (activePos === "RUN_60M") {
      const capturedSec =
        runElapsedMs > 500
          ? (runElapsedMs / 1000).toFixed(1)
          : currentInput.run_60m_sec || "7.9";
      updatedInput.run_60m_sec = capturedSec;
    } else if (activePos === "ENDURANCE") {
      if (runElapsedMs > 1000) {
        const totalSec = Math.floor(runElapsedMs / 1000);
        const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
        const ss = String(totalSec % 60).padStart(2, "0");
        updatedInput.endurance_run_min_sec = `${mm}:${ss}`;
      } else if (!updatedInput.endurance_run_min_sec) {
        updatedInput.endurance_run_min_sec = "04:12";
      }
    }

    setInputs((prev) => ({ ...prev, [st.student_id]: updatedInput }));
    await handleSaveStudent(st, updatedInput);
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
      if (bmi < 17.0) bmiCategory = "Kurus";
      else if (bmi <= 24.4) bmiCategory = "Normal";
      else if (bmi <= 28.8) bmiCategory = "Overweight";
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
    if (isMale && rawInput.pull_up_count !== "") {
      const pu = parseInt(rawInput.pull_up_count, 10);
      if (!isNaN(pu)) {
        s2 = pu >= 19 ? 5 : pu >= 14 ? 4 : pu >= 9 ? 3 : pu >= 5 ? 2 : 1;
      }
    } else if (!isMale && rawInput.bent_arm_hang_sec !== "") {
      const bah = parseInt(rawInput.bent_arm_hang_sec, 10);
      if (!isNaN(bah)) {
        s2 =
          bah >= 41 ? 5 : bah >= 22 ? 4 : bah >= 10 ? 3 : bah >= 3 ? 2 : 1;
      }
    }

    let s3 = m.sit_up_score || 0;
    if (rawInput.sit_up_count !== "") {
      const su = parseInt(rawInput.sit_up_count, 10);
      if (!isNaN(su)) {
        if (isMale) {
          s3 =
            su >= 41 ? 5 : su >= 30 ? 4 : su >= 21 ? 3 : su >= 10 ? 2 : 1;
        } else {
          s3 =
            su >= 28 ? 5 : su >= 20 ? 4 : su >= 10 ? 3 : su >= 3 ? 2 : 1;
        }
      }
    }

    let s4 = m.vertical_jump_score || 0;
    if (rawInput.vertical_jump_cm !== "") {
      const vj = parseInt(rawInput.vertical_jump_cm, 10);
      if (!isNaN(vj)) {
        if (isMale) {
          s4 =
            vj >= 73 ? 5 : vj >= 60 ? 4 : vj >= 50 ? 3 : vj >= 39 ? 2 : 1;
        } else {
          s4 =
            vj >= 50 ? 5 : vj >= 39 ? 4 : vj >= 31 ? 3 : vj >= 23 ? 2 : 1;
        }
      }
    }

    let s5 = m.endurance_run_score || 0;
    const endStr = (
      rawInput.endurance_run_min_sec ||
      m.endurance_run_min_sec ||
      ""
    ).toString();
    if (endStr.includes(":")) {
      const parts = endStr.split(":");
      const totalSec =
        (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
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
    const tkjiCategory =
      totalTkji >= 22
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
      endStr: endStr || null,
      totalTkji,
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
      field_status: st.metrics?.is_remedial ? "REMEDIAL" : "NORMAL",
    };

    const { error } = st.metrics?.id
      ? await supabase
          .from("student_physical_metrics")
          .update(payload)
          .eq("id", st.metrics.id)
      : await supabase.from("student_physical_metrics").insert(payload);

    if (error) {
      toast.error(`Gagal menyimpan nilai ${st.full_name}`);
    } else {
      // Otomatis keluarkan siswa dari gelombang aktif jika pos ini sudah tersimpan
      const remainingWave = calledIds.filter((id) => id !== st.student_id);
      await broadcastSession(activePos, command, remainingWave);

      if (calc.allSixComplete) {
        const statusLabel = st.metrics?.is_remedial
          ? `REMEDIAL #${st.metrics?.attempt_count || 2} (Skor Awal: ${
              st.metrics?.original_tkji_score ?? "-"
            })`
          : "MURNI • ASLI";
        const msg = `🎉 Seluruh 6 Latihan ${st.full_name} Selesai! Total TKJI: ${calc.totalTkji}/25 [${calc.tkjiCategory} • ${statusLabel}] & IMT: ${calc.bmi} (${calc.bmiCategory}) telah tampil di HP siswa!`;
        setCelebrationBanner(msg);
        toast.success(msg, { duration: 6000 });
      } else {
        toast.success(
          `Nilai ${st.full_name} pada ${activePos} tersimpan! Siswa otomatis dipindahkan dari panggung aktif.`
        );
      }
      if (selectedClass?.id) {
        await loadStudioData(selectedClass.id, false);
      }
    }
    setSavingId(null);
  }

  if (!mounted) return null;

  const isRunPos = activePos === "RUN_60M" || activePos === "ENDURANCE";
  const isTimedManualPos = activePos === "PULL_UP" || activePos === "SIT_UP";
  const hasActiveWave = calledIds.length > 0;

  // PEMISAHAN 3 ZONA TABEL SISWA:
  // 1. ZONA GELOMBANG AKTIF (Dipanggil Guru -> Pinned Paling Atas!)
  const calledStudentsList = students.filter((s) =>
    calledIds.includes(s.student_id)
  );
  // 2. ZONA ANTREAN BELUM / SETENGAH UJIAN (0/6 s.d. 5/6 Pos & Tidak Sedang Dipanggil)
  const queueStudentsList = students.filter(
    (s) =>
      !calledIds.includes(s.student_id) && !isStudentAllComplete(s.metrics)
  );
  // 3. ZONA TABEL SELESAI PENUH (6/6 Pos Tuntas & Tidak Sedang Diremedial)
  const completedStudentsList = students.filter(
    (s) =>
      !calledIds.includes(s.student_id) && isStudentAllComplete(s.metrics)
  );

  // Komponen Baris Siswa yang Responsif untuk Tablet, Mobile, & Desktop
  const renderStudentRow = (
    st: StudentRow,
    idx: number,
    zone: "CALLED" | "QUEUE" | "COMPLETED"
  ) => {
    const isCalled = zone === "CALLED";
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
        className={`p-4 sm:p-6 transition-all ${
          isLockedByActiveWave ? "opacity-45" : ""
        }`}
        style={{
          backgroundColor: isCalled
            ? isDark
              ? "rgba(250,204,21,0.09)"
              : "rgba(250,204,21,0.14)"
            : "transparent",
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* BARIS KIRI / ATAS (TABLET): TOMBOL PANGGIL + NAMA + LENCANA STATUS + 6 TITIK POS */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <button
              type="button"
              onClick={() => handleRequestToggleWave(st)}
              className="px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all shrink-0 w-fit"
              style={{
                backgroundColor: isCalled
                  ? "#facc15"
                  : allComplete
                  ? isDark
                    ? "rgba(137,249,181,0.12)"
                    : "#dcfce7"
                  : "transparent",
                color: isCalled
                  ? "#000"
                  : allComplete
                  ? isDark
                    ? "#89f9b5"
                    : "#166534"
                  : isDark
                  ? "#fff"
                  : "#000",
                borderColor: isCalled
                  ? "#facc15"
                  : isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.2)",
              }}
            >
              <UserCheck size={15} />
              {isCalled
                ? "SEDANG DIUJI"
                : allComplete
                ? "Uji Remedial?"
                : `Panggil #${idx + 1}`}
            </button>

            <div className="space-y-1.5">
              <div className="font-bold text-base md:text-lg flex flex-wrap items-center gap-2">
                <span>{st.full_name}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full border opacity-75">
                  {isMale ? "Putra (L)" : "Putri (P)"}
                </span>

                {/* LENCANA MURNI vs REMEDIAL vs PARSIAL */}
                {isMedis ? (
                  <span className="text-[10px] px-3 py-0.5 rounded-full bg-red-500/20 text-red-400 font-extrabold">
                    ⚕️ TUNDA MEDIS ({doneCount}/6 Pos Aman)
                  </span>
                ) : allComplete ? (
                  isRemedial ? (
                    <span className="text-[10px] px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-extrabold">
                      REMEDIAL #{m.attempt_count || 2} (Skor Awal:{" "}
                      {m.original_tkji_score ?? "-"})
                    </span>
                  ) : (
                    <span className="text-[10px] px-3 py-0.5 rounded-full bg-[#89f9b5] text-black font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={12} /> TUNTAS MURNI (ASLI)
                    </span>
                  )
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold">
                    Progres: {doneCount}/6 Pos
                  </span>
                )}
              </div>

              {/* INDIKATOR 6 POS INDIVIDUAL (MEMUDAHKAN GURU MELIHAT SISWA YANG BARU SETENGAH UJIAN) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {POS_ITEMS.map((p) => {
                  const done = isPosDone(m, p.code);
                  return (
                    <span
                      key={p.code}
                      className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                      style={{
                        backgroundColor: done
                          ? "rgba(137,249,181,0.18)"
                          : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                        color: done
                          ? isDark
                            ? "#89f9b5"
                            : "#15803d"
                          : isDark
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(0,0,0,0.4)",
                      }}
                    >
                      {p.shortLabel}: {done ? "✓" : "—"}
                    </span>
                  );
                })}
                <span className="text-xs opacity-70 ml-1">
                  • Total TKJI:{" "}
                  <strong style={{ color: "#facc15" }}>
                    {m.total_tkji_score ?? 0}/25 ({m.tkji_category ?? "Belum"})
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* BARIS KANAN / BAWAH (TABLET): KONTROL INPUT (DIKUNCI JIKA TIDAK DIPANGGIL SAAT GELOMBANG AKTIF) */}
          {isLockedByActiveWave ? (
            <div className="flex items-center gap-2 text-xs font-bold opacity-60 px-4 py-2 rounded-xl border border-dashed">
              <Lock size={14} /> Terkunci selama gelombang aktif berlangsung
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              {activePos === "IMT" && (
                <>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Berat (kg)"
                    value={inp.weight_kg}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          weight_kg: e.target.value,
                        },
                      })
                    }
                    className="w-28 px-3.5 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
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
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          height_cm: e.target.value,
                        },
                      })
                    }
                    className="w-28 px-3.5 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
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
                  <button
                    type="button"
                    onClick={() => captureRunTimeFromTeacher(st)}
                    className="px-3.5 py-2.5 rounded-2xl text-xs font-extrabold bg-[#89f9b5] text-black flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  >
                    <Flag size={14} />
                    Catat Waktu (
                    {runElapsedMs > 500
                      ? `${(runElapsedMs / 1000).toFixed(1)}d`
                      : "Override"}
                    )
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Detik 60m"
                    value={inp.run_60m_sec}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          run_60m_sec: e.target.value,
                        },
                      })
                    }
                    className="w-24 px-3 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                    Skor: {m.run_60m_score ?? "-"}/5
                  </span>
                </>
              )}

              {activePos === "PULL_UP" && (
                <>
                  <input
                    type="number"
                    placeholder={isMale ? "Repetisi" : "Detik Siku"}
                    value={isMale ? inp.pull_up_count : inp.bent_arm_hang_sec}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          [isMale ? "pull_up_count" : "bent_arm_hang_sec"]:
                            e.target.value,
                        },
                      })
                    }
                    className="w-32 px-3.5 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                    Skor: {m.pull_up_hang_score ?? "-"}/5
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
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          sit_up_count: e.target.value,
                        },
                      })
                    }
                    className="w-28 px-3.5 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                    Skor: {m.sit_up_score ?? "-"}/5
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
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          vertical_jump_cm: e.target.value,
                        },
                      })
                    }
                    className="w-32 px-3.5 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                    Skor: {m.vertical_jump_score ?? "-"}/5
                  </span>
                </>
              )}

              {activePos === "ENDURANCE" && (
                <>
                  <button
                    type="button"
                    onClick={() => captureRunTimeFromTeacher(st)}
                    className="px-3.5 py-2.5 rounded-2xl text-xs font-extrabold bg-[#89f9b5] text-black flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  >
                    <Flag size={14} />
                    Catat (
                    {runElapsedMs > 1000
                      ? formatRunMasterDisplay()
                      : "Override"}
                    )
                  </button>
                  <input
                    type="text"
                    placeholder="mm:ss (04:15)"
                    value={inp.endurance_run_min_sec}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [st.student_id]: {
                          ...inp,
                          endurance_run_min_sec: e.target.value,
                        },
                      })
                    }
                    className="w-28 px-3 py-2.5 rounded-2xl text-sm font-bold border bg-transparent"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                    Skor: {m.endurance_run_score ?? "-"}/5
                  </span>
                </>
              )}

              <button
                type="button"
                onClick={() => handleSaveStudent(st)}
                disabled={savingId === st.student_id}
                className="px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#facc15", color: "#000" }}
              >
                <Save size={14} />
                {savingId === st.student_id ? "..." : "Simpan"}
              </button>

              {isCalled && (
                <button
                  type="button"
                  onClick={() => handleMarkMedicalSuspend(st)}
                  className="p-2.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  title="Tandai Siswa Kram / Medis / Tunda Ujian (Simpan Progres Parsial)"
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
    /* FIX JARAK ATAS (-mt-20 lg:-mt-24) KARENA NAVBAR SUDAH TIDAK ADA DI STUDIO INI */
    <div className="min-h-screen w-full -mt-20 lg:-mt-24 pt-2 pb-16 animate-in fade-in duration-500">
      {/* TOP STUDIO CONTROL BAR */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-4 md:px-6 md:py-4 rounded-[2rem] border mb-5 shadow-sm relative z-30"
        style={{
          backgroundColor: isDark ? "#111111" : "#ffffff",
          borderColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/guru")}
            className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-all hover:border-[#facc15]"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.1)",
            }}
          >
            <ArrowLeft size={15} /> Keluar Studio
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#facc15]/15 text-[#ca8a04] dark:text-[#facc15] text-[11px] font-extrabold tracking-widest uppercase">
            <Radio size={14} className="animate-pulse" />
            STUDIO LAPANGAN TABLET & DESKTOP
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-2.5 border transition-all"
              style={{
                backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
                borderColor: isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#facc15]" />
              <span>
                {selectedClass
                  ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                  : "Pilih Kelas XII"}
              </span>
              <ChevronDown
                size={15}
                className={`opacity-60 transition-transform ${
                  isClassDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isClassDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl z-50 overflow-hidden border p-2 max-h-72 overflow-y-auto"
                  style={{
                    backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.1)",
                  }}
                >
                  {classes.map((cls: any) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setIsClassDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        color:
                          selectedClass?.id === cls.id
                            ? "#facc15"
                            : isDark
                            ? "#fff"
                            : "#000",
                      }}
                    >
                      {cls.name} (Kelas {cls.grade_level})
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3.5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all hover:border-[#facc15]"
            style={{
              backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.1)",
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
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:border-[#facc15]"
            style={{
              backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.1)",
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            onClick={() =>
              selectedClass && loadStudioData(selectedClass.id, true)
            }
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:border-[#facc15]"
            style={{
              backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.1)",
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* BANNER SELEBRASI */}
      <AnimatePresence>
        {celebrationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 p-4 md:p-5 rounded-[1.75rem] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{
              backgroundColor: isDark
                ? "rgba(137,249,181,0.12)"
                : "#dcfce7",
              borderColor: "#89f9b5",
              color: isDark ? "#89f9b5" : "#14532d",
            }}
          >
            <div className="flex items-center gap-3">
              <Award size={24} className="shrink-0" />
              <p className="text-xs md:text-sm font-bold leading-relaxed">
                {celebrationBanner}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationBanner(null)}
              className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-black/10 dark:bg-white/10 shrink-0"
            >
              Tutup Info
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6 POS PENGUKURAN (RESPONSIF TABLET 3 KOLOM, DESKTOP 6 KOLOM) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5 relative z-10">
        {POS_ITEMS.map((pos) => {
          const active = activePos === pos.code;
          return (
            <button
              key={pos.code}
              type="button"
              onClick={() =>
                broadcastSession(
                  pos.code,
                  "STANDBY",
                  calledIds,
                  `Berpindah ke ${pos.title}`
                )
              }
              className="p-4 md:p-5 rounded-[1.75rem] border text-left transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[118px] relative overflow-hidden"
              style={{
                backgroundColor: active
                  ? "#facc15"
                  : isDark
                  ? "#111111"
                  : "#ffffff",
                color: active ? "#000000" : isDark ? "#ffffff" : "#000000",
                borderColor: active
                  ? "#facc15"
                  : isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.1]"
                style={{
                  backgroundImage:
                    "radial-gradient(currentColor 1.75px, transparent 1.75px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                  {pos.step}
                </span>
                <span
                  className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor: active
                      ? "rgba(0,0,0,0.12)"
                      : isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  }}
                >
                  {pos.mode === "AUTO_HP" ? "GPS+GURU" : "MANUAL"}
                </span>
              </div>
              <div className="relative z-10 mt-2">
                <div className="font-bold text-sm leading-snug">
                  {pos.title}
                </div>
                <div className="text-[11px] opacity-65 mt-0.5 line-clamp-1">
                  {pos.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* PANEL KONTROL GELOMBANG & TIMER (OPTIMAL DI TABLET & LAPTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 relative z-10">
        <div
          className="lg:col-span-7 p-5 md:p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between gap-4"
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-50">
              Manajemen Gelombang Antrean
            </div>
            <h2 className="text-xl md:text-2xl font-light tracking-tight mt-0.5">
              Dipanggil ke Lapangan:{" "}
              <span className="font-semibold" style={{ color: "#facc15" }}>
                {calledIds.length} Siswa Aktif
              </span>{" "}
              <span className="text-sm opacity-60">
                (Antrean: {queueStudentsList.length} • Tuntas:{" "}
                {completedStudentsList.length})
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={callNextWaveOfFive}
              className="py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#facc15", color: "#000" }}
            >
              <Sparkles size={15} /> Panggil 5 Berikutnya
            </button>

            <button
              type="button"
              onClick={() =>
                broadcastSession(
                  activePos,
                  "READY",
                  students
                    .filter((s) => !isStudentAllComplete(s.metrics))
                    .map((s) => s.student_id),
                  "Seluruh siswa yang belum selesai dipanggil!"
                )
              }
              className="py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border text-center hover:border-[#facc15]"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
              }}
            >
              Panggil Semua Belum ({queueStudentsList.length})
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
              className="py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border text-center opacity-75 hover:opacity-100"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
              }}
            >
              Kosongkan Panggung
            </button>
          </div>
        </div>

        <div
          className="lg:col-span-5 p-5 md:p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between gap-3"
          style={{
            backgroundColor: isDark ? "#161616" : "#f8fafc",
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
          }}
        >
          {isRunPos ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                  Master Stopwatch Lari
                </span>
                <span className="text-2xl md:text-3xl font-mono font-extrabold">
                  {formatRunMasterDisplay()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    broadcastSession(
                      activePos,
                      "START",
                      calledIds,
                      "START! Stopwatch lari berdetak!"
                    )
                  }
                  disabled={calledIds.length === 0}
                  className="py-3 px-3 rounded-2xl text-xs font-extrabold uppercase flex items-center justify-center gap-1.5 bg-[#89f9b5] text-black disabled:opacity-40"
                >
                  <Play size={14} /> START
                </button>

                <button
                  type="button"
                  onClick={handleFalseStartReset}
                  disabled={calledIds.length === 0}
                  className="py-3 px-3 rounded-2xl text-xs font-extrabold uppercase flex items-center justify-center gap-1.5 bg-amber-400 text-black disabled:opacity-40"
                  title="Reset stopwatch ke 0.0 detik jika ada siswa mencuri start / terjatuh"
                >
                  <RotateCcw size={14} /> FALSE START
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
                  className="py-3 px-3 rounded-2xl text-xs font-extrabold uppercase flex items-center justify-center gap-1.5 bg-red-500 text-white"
                >
                  <Square size={14} /> STOP
                </button>
              </div>
            </>
          ) : isTimedManualPos ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                  Timer Pos 60 Detik
                </span>
                <span className="text-2xl md:text-3xl font-mono font-extrabold">
                  {countdown} Detik
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="py-3 px-4 rounded-2xl text-xs font-extrabold uppercase"
                  style={{ backgroundColor: "#facc15", color: "#000" }}
                >
                  {isTimerRunning ? "Jeda Timer" : "Mulai 60 Detik"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setCountdown(60);
                  }}
                  className="py-3 px-4 rounded-2xl text-xs font-bold uppercase border flex items-center justify-center gap-1.5"
                  style={{
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.15)",
                  }}
                >
                  <RotateCcw size={14} /> Reset 60d
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center h-full">
              <div className="text-xs font-bold uppercase tracking-widest opacity-50">
                Pos Input Langsung Guru
              </div>
              <div className="text-base font-bold mt-1">
                {POS_ITEMS.find((x) => x.code === activePos)?.title}
              </div>
              <p className="text-xs opacity-60 mt-1">
                Panggil siswa ke gelombang aktif agar naik ke tabel paling atas,
                lalu simpan nilainya.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          ZONA 1: PANGGUNG GELOMBANG AKTIF (SELALU NAIK KE PALING ATAS!)
         ===================================================================== */}
      {calledStudentsList.length > 0 && (
        <div
          className="rounded-[2rem] border-2 mb-6 overflow-hidden shadow-lg relative z-10"
          style={{
            backgroundColor: isDark ? "#141414" : "#ffffff",
            borderColor: "#facc15",
          }}
        >
          <div
            className="px-6 py-3.5 flex items-center justify-between"
            style={{ backgroundColor: "#facc15", color: "#000" }}
          >
            <div className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
              <Radio size={15} className="animate-pulse" />
              ZONA 1 • SEDANG DIUJI DI GELOMBANG AKTIF (
              {calledStudentsList.length} SISWA)
            </div>
            <span className="text-[11px] font-bold">
              Siswa di luar daftar ini dikunci sementara
            </span>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {calledStudentsList.map((st, idx) =>
              renderStudentRow(st, idx, "CALLED")
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ZONA 2: TABEL ANTREAN BELUM & BARU SETENGAH UJIAN (PARSIAL 0/6 - 5/6)
         ===================================================================== */}
      <div
        className="rounded-[2rem] border mb-6 overflow-hidden relative z-10 shadow-sm"
        style={{
          backgroundColor: isDark ? "#111111" : "#ffffff",
          borderColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="text-xs font-extrabold uppercase tracking-widest opacity-70">
            ZONA 2 • ANTREAN BELUM & SETENGAH UJIAN ({queueStudentsList.length}{" "}
            SISWA)
          </div>
          {hasActiveWave && (
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Lock size={13} /> Input dikunci saat gelombang aktif berjalan
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center opacity-50 text-base font-light">
            Menarik data kelas dari server...
          </div>
        ) : queueStudentsList.length === 0 ? (
          <div className="py-12 text-center opacity-50 text-sm">
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

      {/* =====================================================================
          ZONA 3: TABEL TERPISAH SISWA SELESAI PENUH (6/6 POS TUNTAS & REMEDIAL)
         ===================================================================== */}
      {completedStudentsList.length > 0 && (
        <div
          className="rounded-[2rem] border overflow-hidden relative z-10 shadow-sm"
          style={{
            backgroundColor: isDark ? "#0d1310" : "#f0fdf4",
            borderColor: isDark
              ? "rgba(137,249,181,0.25)"
              : "rgba(22,101,52,0.2)",
          }}
        >
          <div
            className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-2"
            style={{
              borderColor: isDark
                ? "rgba(137,249,181,0.15)"
                : "rgba(22,101,52,0.1)",
            }}
          >
            <div className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-emerald-500">
              <CheckCircle2 size={16} />
              ZONA 3 • TABEL SISWA TUNTAS 6/6 POS (
              {completedStudentsList.length} SISWA)
            </div>
            <span className="text-[11px] opacity-70">
              Terpisah otomatis agar tidak ter-klik. Klik &ldquo;Uji
              Remedial?&rdquo; jika siswa ingin mengulang.
            </span>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {completedStudentsList.map((st, idx) =>
              renderStudentRow(st, idx, "COMPLETED")
            )}
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
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setRemedialModalStudent(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] p-7 relative z-10 border shadow-2xl space-y-5"
              style={{
                backgroundColor: isDark ? "#161616" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => setRemedialModalStudent(null)}
                  className="p-2 rounded-full opacity-60 hover:opacity-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  Proteksi Nilai: {remedialModalStudent.full_name}
                </h3>
                <p className="text-xs opacity-70 mt-2 leading-relaxed">
                  Siswa ini <strong>sudah memiliki nilai</strong> pada pos ini
                  (Total TKJI saat ini:{" "}
                  <strong>
                    {remedialModalStudent.metrics?.total_tkji_score ?? 0}/25
                  </strong>
                  ). Apakah Anda tidak sengaja menekan, atau ingin membuka{" "}
                  <strong>Sesi Remedial</strong>?
                </p>
                <p className="text-[11px] text-amber-400 mt-2 font-semibold">
                  *Jika Remedial dibuka, skor asli akan diarsipkan dan status
                  nilai siswa akan ditandai sebagai REMEDIAL (bukan Murni).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRemedialModalStudent(null)}
                  className="py-3 rounded-xl text-xs font-bold uppercase border"
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
                    confirmActivateRemedial(remedialModalStudent)
                  }
                  className="py-3 rounded-xl text-xs font-extrabold uppercase bg-[#facc15] text-black"
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