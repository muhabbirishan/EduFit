// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Archive,
    ArrowUpRight,
    Bell,
    BrainCircuit,
    CheckCircle2,
    ChevronDown,
    Download,
    FolderArchive,
    LayoutGrid,
    Pencil,
    Save,
    Search,
    SlidersHorizontal,
    Table2,
    Trash2,
    Users,
    UsersRound,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface HolisticStudentRow {
  studentId: string;
  fullName: string;
  email: string;
  gender: "L" | "P";
  birthDate: string;
  ageYears: number;
  classId: string;
  className: string;
  gradeLevel: number;
  joinedAt: string | null;
  tkjiScore: number | null;
  tkjiCategory: string | null;
  bmiScore: number | null;
  bmiCategory: string | null;
  weightKg: number | null;
  heightCm: number | null;
  run60mSec: number | null;
  pullUpOrHang: number | null;
  sitUpCount: number | null;
  verticalJumpCm: number | null;
  enduranceMinSec: string | null;
  pretestScore: number | null;
  posttestScore: number | null;
  cognitiveGain: number | null;
  completedModules: number;
  gradedReflections: number;
  avgMaterialScore: number;
  practiceNotesCount: number;
  fittAwalScore: number | null;
  fittAkhirScore: number | null;
  holisticIndex: number;
  archivesCount: number;
  latestArchiveYear: string | null;
}

interface ArchiveRecord {
  id: string;
  student_id: string;
  studentName: string;
  academic_year: string;
  summary_data: any;
  archived_at: string;
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

function computeAge(birthDateStr?: string | null): number {
  if (!birthDateStr) return 16;
  const d = new Date(birthDateStr);
  if (isNaN(d.getTime())) return 16;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(10, Math.min(22, age));
}

export default function DirektoriSiswaGuru() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const [classes, setClasses] = useState<any[]>([]);
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<"bento" | "table" | "archives">(
    "bento"
  );
  const [genderFilter, setGenderFilter] = useState<"all" | "L" | "P">("all");
  const [gaugeMode, setGaugeMode] = useState<"holistik" | "fisik" | "kognitif">(
    "holistik"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [studentsList, setStudentsList] = useState<HolisticStudentRow[]>([]);
  const [archivesList, setArchivesList] = useState<ArchiveRecord[]>([]);
  const [academicYearInput, setAcademicYearInput] = useState("2026/2027 Ganjil");
  const [isArchivingClass, setIsArchivingClass] = useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState<HolisticStudentRow | null>(null);
  const [modalMode, setModalMode] = useState<"rapor" | "edit">("rapor");
  const [editFullName, setEditFullName] = useState("");
  const [editGender, setEditGender] = useState<"L" | "P">("L");
  const [editBirthDate, setEditBirthDate] = useState("2009-05-15");
  const [editTargetClassId, setEditTargetClassId] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
    async function initTeacherClasses() {
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
          let initial = data[0];
          if (typeof window !== "undefined") {
            const qClassId = new URLSearchParams(window.location.search).get(
              "classId"
            );
            if (qClassId) {
              const found = data.find((c: any) => c.id === qClassId);
              if (found) initial = found;
            }
          }
          setSelectedClass(initial);
        } else {
          setClasses([]);
          setIsLoading(false);
        }
      } catch {
        toast.error("Gagal memuat daftar kelas");
        setIsLoading(false);
      }
    }
    initTeacherClasses();
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

  const fetchClassHolisticDirectory = useCallback(async (cls: any) => {
    if (!cls?.id) return;
    setIsLoading(true);
    try {
      const { data: scRows, error: scErr } = await supabase
        .from("student_classes")
        .select(
          "student_id, class_id, joined_at, user_profiles(id, full_name, email, gender, birth_date)"
        )
        .eq("class_id", cls.id);

      if (scErr) throw scErr;

      const list = scRows || [];
      const studentIds = list.map((r: any) => r.student_id).filter(Boolean);

      if (studentIds.length === 0) {
        setStudentsList([]);
        setArchivesList([]);
        setIsLoading(false);
        return;
      }

      const [
        metRes,
        evalRes,
        refRes,
        progMatRes,
        pracRes,
        fittRes,
        archRes,
      ] = await Promise.all([
        supabase
          .from("student_physical_metrics")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_evaluation_scores")
          .select("student_id, score, master_evaluations(type, grade_level)")
          .in("student_id", studentIds),
        supabase
          .from("student_reflections")
          .select("student_id, grade, score")
          .in("student_id", studentIds),
        supabase
          .from("student_material_progress")
          .select("student_id, status")
          .in("student_id", studentIds),
        supabase
          .from("optional_practices")
          .select("student_id, teacher_note, score")
          .in("student_id", studentIds),
        supabase
          .from("student_programs")
          .select(
            "student_id, type, score_analisis, score_fitt, score_pemulihan, score_evaluasi"
          )
          .in("student_id", studentIds),
        supabase
          .from("legacy_archives")
          .select("*")
          .in("student_id", studentIds)
          .order("archived_at", { ascending: false }),
      ]);

      const latestMetByStudent: Record<string, any> = {};
      (metRes.data || []).forEach((m: any) => {
        if (!latestMetByStudent[m.student_id]) {
          latestMetByStudent[m.student_id] = m;
        }
      });

      const nameMap: Record<string, string> = {};
      list.forEach((r: any) => {
        nameMap[r.student_id] = r.user_profiles?.full_name || "Siswa";
      });

      const formattedArchives: ArchiveRecord[] = (archRes.data || []).map(
        (a: any) => ({
          id: a.id,
          student_id: a.student_id,
          studentName: nameMap[a.student_id] || "Siswa",
          academic_year: a.academic_year,
          summary_data: a.summary_data || {},
          archived_at: a.archived_at,
        })
      );
      setArchivesList(formattedArchives);

      const rows: HolisticStudentRow[] = list
        .map((r: any) => {
          const sId = r.student_id;
          const prof = r.user_profiles || {};
          const m = latestMetByStudent[sId] || {};

          const rawGender = String(prof.gender || m.gender || "L")
            .trim()
            .toUpperCase();
          const gender: "L" | "P" = rawGender.startsWith("P") ? "P" : "L";
          const birthDate = prof.birth_date || m.birth_date || "2009-05-15";

          const myEvals = (evalRes.data || []).filter(
            (e: any) => e.student_id === sId
          );
          let pre: number | null = null;
          let post: number | null = null;
          myEvals.forEach((ev: any) => {
            if (
              ev.master_evaluations?.type === "pretest" &&
              ev.score !== null
            ) {
              pre = Math.round(Number(ev.score));
            }
            if (
              ev.master_evaluations?.type === "posttest" &&
              ev.score !== null
            ) {
              post = Math.round(Number(ev.score));
            }
          });
          const gain = pre !== null && post !== null ? post - pre : null;

          const myRefs = (refRes.data || []).filter(
            (rf: any) => rf.student_id === sId && (rf.grade || rf.score !== null)
          );
          const myProg = (progMatRes.data || []).filter(
            (pm: any) =>
              pm.student_id === sId &&
              String(pm.status || "").toLowerCase() === "selesai"
          );
          const myPracs = (pracRes.data || []).filter(
            (pr: any) =>
              pr.student_id === sId &&
              pr.teacher_note &&
              pr.teacher_note.trim() !== ""
          );

          let refSum = 0;
          myRefs.forEach((rf: any) => {
            refSum +=
              rf.score !== null && rf.score !== undefined
                ? Number(rf.score)
                : rf.grade === "A"
                ? 100
                : rf.grade === "B"
                ? 75
                : rf.grade === "C"
                ? 50
                : 25;
          });
          const avgMaterialScore =
            myRefs.length > 0 ? Math.round(refSum / myRefs.length) : 0;

          const myFitts = (fittRes.data || []).filter(
            (fp: any) => fp.student_id === sId
          );
          const fAwal = myFitts.find(
            (fp: any) => String(fp.type || "awal").toLowerCase() === "awal"
          );
          const fAkhir = myFitts.find(
            (fp: any) => String(fp.type || "").toLowerCase() === "akhir"
          );

          const calcFittPct = (rec: any) => {
            if (!rec) return null;
            const tot =
              (Number(rec.score_analisis) || 0) +
              (Number(rec.score_fitt) || 0) +
              (Number(rec.score_pemulihan) || 0) +
              (Number(rec.score_evaluasi) || 0);
            return tot > 0 ? Math.round((tot / 16) * 100) : null;
          };

          const fittAwalScore = calcFittPct(fAwal);
          const fittAkhirScore = calcFittPct(fAkhir);

          const tkjiScore =
            m.total_tkji_score && Number(m.total_tkji_score) > 0
              ? Number(m.total_tkji_score)
              : null;
          const tkjiPct = tkjiScore ? Math.round((tkjiScore / 25) * 100) : 0;

          const activeComponents: number[] = [];
          if (tkjiPct > 0) activeComponents.push(tkjiPct);
          if (post !== null) activeComponents.push(post);
          else if (pre !== null) activeComponents.push(pre);
          if (avgMaterialScore > 0) activeComponents.push(avgMaterialScore);
          if (fittAkhirScore !== null) activeComponents.push(fittAkhirScore);
          else if (fittAwalScore !== null) activeComponents.push(fittAwalScore);

          const holisticIndex =
            activeComponents.length > 0
              ? Math.round(
                  activeComponents.reduce((a, b) => a + b, 0) /
                    activeComponents.length
                )
              : 0;

          const myArchives = formattedArchives.filter(
            (ar) => ar.student_id === sId
          );

          return {
            studentId: sId,
            fullName: prof.full_name || "Siswa",
            email: prof.email || "-",
            gender,
            birthDate,
            ageYears: computeAge(birthDate),
            classId: cls.id,
            className: cls.name,
            gradeLevel: Number(cls.grade_level) || 10,
            joinedAt: r.joined_at || null,
            tkjiScore,
            tkjiCategory: m.tkji_category || null,
            bmiScore:
              m.calculated_bmi && Number(m.calculated_bmi) > 0
                ? Number(m.calculated_bmi)
                : null,
            bmiCategory: m.bmi_category || null,
            weightKg:
              m.weight_kg && Number(m.weight_kg) > 0
                ? Number(m.weight_kg)
                : null,
            heightCm:
              m.height_cm && Number(m.height_cm) > 0
                ? Number(m.height_cm)
                : null,
            run60mSec: m.run_60m_sec ? Number(m.run_60m_sec) : null,
            pullUpOrHang:
              gender === "L"
                ? m.pull_up_count ?? null
                : m.bent_arm_hang_sec ?? null,
            sitUpCount: m.sit_up_count ?? null,
            verticalJumpCm: m.vertical_jump_cm ?? null,
            enduranceMinSec: m.endurance_run_min_sec || null,
            pretestScore: pre,
            posttestScore: post,
            cognitiveGain: gain,
            completedModules: myProg.length,
            gradedReflections: myRefs.length,
            avgMaterialScore,
            practiceNotesCount: myPracs.length,
            fittAwalScore,
            fittAkhirScore,
            holisticIndex,
            archivesCount: myArchives.length,
            latestArchiveYear: myArchives[0]?.academic_year || null,
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      setStudentsList(rows);
    } catch (err: any) {
      toast.error("Gagal memuat direktori siswa", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClass?.id) {
      fetchClassHolisticDirectory(selectedClass);
    }
  }, [selectedClass, fetchClassHolisticDirectory]);

  const openStudentModal = (
    st: HolisticStudentRow,
    mode: "rapor" | "edit" = "rapor"
  ) => {
    setSelectedStudent(st);
    setModalMode(mode);
    setEditFullName(st.fullName);
    setEditGender(st.gender);
    setEditBirthDate(st.birthDate || "2009-05-15");
    setEditTargetClassId(st.classId);
  };

  const handleSaveStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSavingProfile(true);
    try {
      const { error: profErr } = await supabase
        .from("user_profiles")
        .update({
          full_name: editFullName.trim(),
          gender: editGender,
          birth_date: editBirthDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedStudent.studentId);

      if (profErr) throw profErr;

      await supabase
        .from("student_physical_metrics")
        .update({
          gender: editGender,
          birth_date: editBirthDate,
        })
        .eq("student_id", selectedStudent.studentId);

      if (editTargetClassId && editTargetClassId !== selectedStudent.classId) {
        const { error: moveErr } = await supabase
          .from("student_classes")
          .update({ class_id: editTargetClassId })
          .eq("student_id", selectedStudent.studentId);
        if (moveErr) throw moveErr;
      }

      triggerDynamicIsland(
        "Biodata & Rombel Diperbarui",
        `Profil ${editFullName} berhasil disimpan.`,
        "success"
      );
      await fetchClassHolisticDirectory(selectedClass);
      setSelectedStudent(null);
    } catch (err: any) {
      toast.error("Gagal memperbarui profil siswa", {
        description: err.message,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveFromClass = async (st: HolisticStudentRow) => {
    try {
      const { error } = await supabase
        .from("student_classes")
        .delete()
        .eq("student_id", st.studentId)
        .eq("class_id", st.classId);

      if (error) throw error;

      triggerDynamicIsland(
        "Siswa Dikeluarkan dari Rombel",
        `${st.fullName} telah dilepas dari kelas ${st.className}.`,
        "info"
      );
      setSelectedStudent(null);
      await fetchClassHolisticDirectory(selectedClass);
    } catch (err: any) {
      toast.error("Gagal mengeluarkan siswa", { description: err.message });
    }
  };

  const handleArchiveSingleStudent = async (st: HolisticStudentRow) => {
    try {
      const summaryPayload = {
        class_name: st.className,
        grade_level: st.gradeLevel,
        gender: st.gender,
        tkji_score: st.tkjiScore,
        tkji_category: st.tkjiCategory,
        bmi_score: st.bmiScore,
        bmi_category: st.bmiCategory,
        pretest_score: st.pretestScore,
        posttest_score: st.posttestScore,
        cognitive_gain: st.cognitiveGain,
        completed_modules: st.completedModules,
        avg_material_score: st.avgMaterialScore,
        fitt_awal_score: st.fittAwalScore,
        fitt_akhir_score: st.fittAkhirScore,
        holistic_index: st.holisticIndex,
      };

      const { error } = await supabase.from("legacy_archives").insert({
        student_id: st.studentId,
        academic_year: academicYearInput.trim() || "2026/2027",
        summary_data: summaryPayload,
      });

      if (error) throw error;

      triggerDynamicIsland(
        `Rapor Diarsipkan (${academicYearInput})`,
        `Rekam jejak ${st.fullName} berhasil dibekukan ke arsip tahunan.`,
        "success"
      );
      await fetchClassHolisticDirectory(selectedClass);
    } catch (err: any) {
      toast.error("Gagal mengarsipkan rapor", { description: err.message });
    }
  };

  const handleArchiveEntireClass = async () => {
    if (studentsList.length === 0) return;
    setIsArchivingClass(true);
    try {
      const yearLabel = academicYearInput.trim() || "2026/2027";
      const rowsToInsert = studentsList.map((st) => ({
        student_id: st.studentId,
        academic_year: yearLabel,
        summary_data: {
          class_name: st.className,
          grade_level: st.gradeLevel,
          gender: st.gender,
          tkji_score: st.tkjiScore,
          tkji_category: st.tkjiCategory,
          bmi_score: st.bmiScore,
          bmi_category: st.bmiCategory,
          pretest_score: st.pretestScore,
          posttest_score: st.posttestScore,
          cognitive_gain: st.cognitiveGain,
          completed_modules: st.completedModules,
          avg_material_score: st.avgMaterialScore,
          fitt_awal_score: st.fittAwalScore,
          fitt_akhir_score: st.fittAkhirScore,
          holistic_index: st.holisticIndex,
        },
      }));

      const { error } = await supabase
        .from("legacy_archives")
        .insert(rowsToInsert);
      if (error) throw error;

      triggerDynamicIsland(
        `Arsip Kelas ${selectedClass?.name} Selesai`,
        `${rowsToInsert.length} rapor siswa berhasil dibekukan (${yearLabel}).`,
        "success"
      );
      await fetchClassHolisticDirectory(selectedClass);
    } catch (err: any) {
      toast.error("Gagal membekukan arsip kelas", {
        description: err.message,
      });
    } finally {
      setIsArchivingClass(false);
    }
  };

  const stats = useMemo(() => {
    const total = studentsList.length;
    const male = studentsList.filter((s) => s.gender === "L").length;
    const female = studentsList.filter((s) => s.gender === "P").length;

    const withTkji = studentsList.filter((s) => s.tkjiScore !== null);
    const avgTkjiPct = withTkji.length
      ? Math.round(
          withTkji.reduce(
            (acc, curr) =>
              acc + Math.round(((curr.tkjiScore || 0) / 25) * 100),
            0
          ) / withTkji.length
        )
      : 0;

    const withPost = studentsList.filter((s) => s.posttestScore !== null);
    const avgCognitive = withPost.length
      ? Math.round(
          withPost.reduce((acc, curr) => acc + (curr.posttestScore || 0), 0) /
            withPost.length
        )
      : 0;

    const avgHolistic = total
      ? Math.round(
          studentsList.reduce((acc, curr) => acc + curr.holisticIndex, 0) /
            total
        )
      : 0;

    const avgMaterial = total
      ? Math.round(
          studentsList.reduce((acc, curr) => acc + curr.avgMaterialScore, 0) /
            total
        )
      : 0;

    const withFitt = studentsList.filter(
      (s) => s.fittAkhirScore !== null || s.fittAwalScore !== null
    );
    const avgFitt = withFitt.length
      ? Math.round(
          withFitt.reduce(
            (acc, curr) =>
              acc + (curr.fittAkhirScore ?? curr.fittAwalScore ?? 0),
            0
          ) / withFitt.length
        )
      : 0;

    return {
      total,
      male,
      female,
      tkjiCount: withTkji.length,
      avgTkjiPct,
      avgCognitive,
      avgMaterial,
      avgFitt,
      avgHolistic,
    };
  }, [studentsList]);

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      if (genderFilter !== "all" && s.gender !== genderFilter) return false;
      if (
        searchQuery &&
        !s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [studentsList, genderFilter, searchQuery]);

  const handleExportHolisticCSV = () => {
    if (studentsList.length === 0) {
      toast.error("Tidak ada data siswa untuk diekspor");
      return;
    }
    const headers = [
      "Nama Lengkap",
      "Email",
      "L/P",
      "Tanggal Lahir",
      "Usia",
      "Kelas",
      "Skor TKJI (/25)",
      "Kategori TKJI",
      "IMT",
      "Kategori IMT",
      "Pretest",
      "Posttest",
      "Gain Kognitif",
      "Modul Selesai",
      "Rata-rata Materi",
      "FITT Awal",
      "FITT Akhir",
      "Indeks Rapor 360",
    ];
    const rows = studentsList.map((s) => [
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      s.gender,
      s.birthDate,
      s.ageYears,
      `"${s.className}"`,
      s.tkjiScore ?? "-",
      `"${s.tkjiCategory || "-"}"`,
      s.bmiScore ?? "-",
      `"${s.bmiCategory || "-"}"`,
      s.pretestScore ?? "-",
      s.posttestScore ?? "-",
      s.cognitiveGain ?? "-",
      s.completedModules,
      s.avgMaterialScore,
      s.fittAwalScore ?? "-",
      s.fittAkhirScore ?? "-",
      s.holisticIndex,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Rapor_Holistik_360_${selectedClass?.name || "Rombel"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Rapor Holistik 360° Diunduh",
      `Rekap kelas ${selectedClass?.name || "Rombel"} berhasil diekspor.`,
      "success"
    );
  };

  if (!mounted) return null;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const activeGaugePct =
    gaugeMode === "holistik"
      ? stats.avgHolistic
      : gaugeMode === "fisik"
      ? stats.avgTkjiPct
      : stats.avgCognitive;
  const dashOffset =
    activeGaugePct <= 0
      ? circumference
      : circumference - (activeGaugePct / 100) * circumference;

  const pillarBars = [
    { label: "FISIK", pct: stats.avgTkjiPct },
    { label: "TEORI", pct: stats.avgCognitive },
    { label: "MATERI", pct: stats.avgMaterial },
    { label: "FITT", pct: stats.avgFitt },
  ];

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* DYNAMIC ISLAND OVERLAY */}
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

      {/* ZONA 1: HERO HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="text-gold-accent">
              Direktori Peserta Didik & Rapor Terpadu
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound size={15} />
              {selectedClass
                ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                : "Manajemen Biodata & Rekam Jejak Komprehensif Siswa"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Direktori <br />
            <span className="font-semibold">Siswa & Rapor 360°</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : stats.total}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Total Murid ({stats.male}L · {stats.female}P)
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent">
              {isLoading ? "—" : `${stats.avgHolistic}%`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Indeks Rapor Kelas
            </div>
          </div>
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : archivesList.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Arsip Semester
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 2: 4 BAR TELEMETRI LINTAS PILAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Indeks Fisik (TKJI)</span>
            <span className="font-mono">{stats.tkjiCount} TERUJI</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${stats.avgTkjiPct}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Kebugaran
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Capaian Kognitif</span>
            <span className="font-mono">POSTTEST</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${stats.avgCognitive}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Teori Kelas
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Refleksi Materi & Program</span>
            <span className="font-mono">PORTOFOLIO</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${stats.avgMaterial}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              Rancangan FITT: {stats.avgFitt}%
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setViewMode("archives")}
          className="sm:col-span-2 lg:col-span-2 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Arsip Rapor</span>
            <span className="font-mono">TAHUNAN</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-between transition-transform group-hover:scale-[1.02] edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-gold-accent">
              {archivesList.length}
            </span>
            <FolderArchive size={16} className="opacity-60" />
          </div>
        </button>
      </div>

      {/* ZONA 3: TRIO BENTO UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* Bento 1: Filter Kelas & Ekspor Rapor 360 */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              <SlidersHorizontal size={14} />
              <span>Kendali Rombel</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Pilih Ruang Kelas
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Kelola daftar siswa, perbarui biodata tanggal lahir, atau bekukan
              rapor semester ke arsip.
            </p>

            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {[
                { val: "all", label: "Semua" },
                { val: 10, label: "Kelas 10" },
                { val: 11, label: "Kelas 11" },
                { val: 12, label: "Kelas 12" },
              ].map((g) => {
                const active = gradeFilter === g.val;
                return (
                  <button
                    key={String(g.val)}
                    type="button"
                    onClick={() => handleGradeFilterChange(g.val as any)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full mb-6" ref={classDropdownRef}>
              <div
                onClick={() =>
                  filteredClassesList.length > 0 &&
                  setIsClassDropdownOpen(!isClassDropdownOpen)
                }
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isClassDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {selectedClass
                    ? `${selectedClass.name} (Kelas ${selectedClass.grade_level})`
                    : "Pilih Rombel..."}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isClassDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isClassDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    {filteredClassesList.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`px-6 py-4 text-lg font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                          selectedClass?.id === cls.id ? "text-gold-accent" : ""
                        }`}
                      >
                        {cls.name} (Kelas {cls.grade_level})
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportHolisticCSV}
            disabled={studentsList.length === 0}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md disabled:opacity-30 relative z-10 btn-forest-emerald"
          >
            <Download size={16} strokeWidth={2.5} /> Ekspor Rapor 360° CSV
          </button>
        </div>

        {/* Bento 2: Keseimbangan 4 Pilar Kurikulum */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={15} />
              <span>Komposisi 4 Pilar Kelas</span>
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-gold-accent">
              RAPOR 360°
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {stats.avgHolistic}%
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Indeks Gabungan Rombel
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 items-end pt-4 h-44 relative z-10">
            {pillarBars.map((bar, idx) => {
              const heightPct = bar.pct <= 0 ? 4 : Math.max(12, bar.pct);
              const fillClass =
                idx === 0 || idx === 1
                  ? "chart-fill-gold"
                  : "chart-fill-primary";
              return (
                <div
                  key={bar.label}
                  className="flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-xs font-bold font-mono opacity-80">
                    {bar.pct}%
                  </span>
                  <div className="w-4 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                    <div
                      className={`w-full rounded-full transition-all duration-500 ${fillClass}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                  <span className="text-[11px] font-bold font-mono opacity-65">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento 3: Pembekuan Rapor Semester */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Archive size={15} />
              <span>Arsip Semester Tahunan</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "holistik", label: "360°" },
                { key: "fisik", label: "Fisik" },
                { key: "kognitif", label: "Teori" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setGaugeMode(m.key as any)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                    gaugeMode === m.key
                      ? "seg-btn-active"
                      : "edufit-surface-subtle"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-2 relative z-10">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="6"
                  strokeDasharray="2 5"
                  className="gauge-circle-track"
                />
                {activeGaugePct > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700 gauge-circle-gold"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-light font-mono tracking-tighter">
                  {activeGaugePct}%
                </span>
              </div>
            </div>
            <p className="text-xs font-semibold opacity-65 mt-2 text-center">
              {gaugeMode === "holistik"
                ? "Rata-Rata Capaian Rapor 360° Kelas"
                : gaugeMode === "fisik"
                ? "Rata-Rata Skor Kebugaran TKJI"
                : "Rata-Rata Evaluasi Teori Posttest"}
            </p>
          </div>

          <div className="space-y-2.5 relative z-10">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={academicYearInput}
                onChange={(e) => setAcademicYearInput(e.target.value)}
                placeholder="Tahun Akademik (2026/2027)"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none edufit-surface-subtle"
              />
              <button
                type="button"
                onClick={handleArchiveEntireClass}
                disabled={isArchivingClass || studentsList.length === 0}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 btn-forest-gold shrink-0"
                title="Bekukan seluruh rapor siswa di kelas ini ke arsip tahunan"
              >
                {isArchivingClass ? "Menyimpan..." : "Arsipkan Kelas"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ZONA 4: FILTER GENDER, MODE SWITCHER & DAFTAR SISWA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mt-12 mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">
            Daftar Peserta Didik & Rekam Jejak
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            {viewMode === "archives"
              ? `Riwayat Arsip Rapor (${archivesList.length})`
              : `Anggota Kelas (${filteredStudents.length})`}
          </h3>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {[
              { key: "all", label: `Semua (${stats.total})` },
              { key: "L", label: `Putra / L (${stats.male})` },
              { key: "P", label: `Putri / P (${stats.female})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setGenderFilter(tab.key as any)}
                className={`text-xs font-bold uppercase tracking-widest transition-opacity cursor-pointer ${
                  genderFilter === tab.key
                    ? "opacity-100 underline decoration-gold-accent decoration-2 underline-offset-8"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex p-1.5 rounded-2xl edufit-surface-subtle">
            <button
              type="button"
              onClick={() => setViewMode("bento")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                viewMode === "bento" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <LayoutGrid size={14} /> Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <Table2 size={14} /> Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode("archives")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                viewMode === "archives" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              <FolderArchive size={14} /> Arsip ({archivesList.length})
            </button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-xs font-semibold outline-none edufit-card-primary"
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

      {/* ISI ZONA 4 */}
      {isLoading ? (
        <div className="flex items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55 animate-pulse">
          <div className="text-xl font-light tracking-tight">
            Menyusun rapor holistik 360° siswa...
          </div>
        </div>
      ) : viewMode === "archives" ? (
        archivesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
            <FolderArchive className="w-10 h-10 mb-3" />
            <div className="text-xl font-light tracking-tight">
              Belum ada arsip rapor semester yang disimpan pada kelas ini.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
            {archivesList.map((ar) => {
              const sd = ar.summary_data || {};
              return (
                <div
                  key={ar.id}
                  className="p-7 rounded-[2rem] flex flex-col justify-between gap-4 edufit-card-primary"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase telemetry-bar-forest text-gold-accent">
                        Periode {ar.academic_year}
                      </span>
                      <span className="text-[11px] font-mono opacity-55">
                        {ar.archived_at
                          ? new Date(ar.archived_at).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                    </div>
                    <h4 className="text-2xl font-semibold tracking-tight">
                      {ar.studentName}
                    </h4>
                    <p className="text-xs font-mono opacity-60 mt-0.5">
                      {sd.class_name || selectedClass?.name} · Indeks 360°:{" "}
                      {sd.holistic_index ?? 0}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                    <div className="p-3 rounded-xl edufit-surface-subtle">
                      <span className="text-[10px] font-sans opacity-55 block">
                        TKJI & IMT
                      </span>
                      <strong>
                        {sd.tkji_score ?? "-"}/25 · IMT {sd.bmi_score ?? "-"}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl edufit-surface-subtle">
                      <span className="text-[10px] font-sans opacity-55 block">
                        Pretest / Posttest
                      </span>
                      <strong>
                        {sd.pretest_score ?? "-"} → {sd.posttest_score ?? "-"}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 rounded-[2rem] border border-dashed border-hairline opacity-55">
          <Users className="w-10 h-10 mb-3" />
          <div className="text-xl font-light tracking-tight">
            Tidak ada siswa yang cocok dengan filter pencarian.
          </div>
        </div>
      ) : viewMode === "bento" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mb-12">
          {filteredStudents.map((st, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            return (
              <div
                key={st.studentId}
                onClick={() => openStudentModal(st, "rapor")}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[320px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass}`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase opacity-70">
                    {st.gender === "L" ? "PUTRA (L)" : "PUTRI (P)"} ·{" "}
                    {st.ageYears} THN ({st.birthDate})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudentModal(st, "edit");
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/15"
                      title="Edit Biodata & Kelas Siswa"
                    >
                      <Pencil size={14} />
                    </button>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
                      <ArrowUpRight size={17} />
                    </div>
                  </div>
                </div>

                <div className="my-5 relative z-10">
                  <div className="text-3xl font-light tracking-tighter leading-tight mb-1 line-clamp-2">
                    {st.fullName}
                  </div>
                  <p className="text-xs font-mono opacity-60 mb-4 truncate">
                    {st.email}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-2.5 py-1 rounded-xl font-bold bg-black/10 dark:bg-white/10">
                      TKJI: {st.tkjiScore !== null ? `${st.tkjiScore}/25` : "—"}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl font-bold bg-black/10 dark:bg-white/10">
                      IMT: {st.bmiScore ?? "—"}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl font-bold bg-black/10 dark:bg-white/10">
                      POST: {st.posttestScore ?? "—"}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl font-bold bg-black/10 dark:bg-white/10">
                      MATERI: {st.avgMaterialScore}%
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-4 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Indeks Rapor 360°
                    </div>
                    <div className="text-3xl font-light font-mono leading-none text-gold-accent">
                      {st.holisticIndex}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Status Arsip
                    </div>
                    <div className="text-xs font-bold font-mono">
                      {st.archivesCount > 0
                        ? `${st.archivesCount}x (${st.latestArchiveYear})`
                        : "Belum Diarsip"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABEL DIREKTORI LENGKAP */
        <div className="rounded-[2rem] p-8 overflow-hidden relative z-10 mb-12 edufit-card-primary">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest font-bold border-b border-hairline opacity-55">
                  <th className="py-4 px-5">Nama Siswa</th>
                  <th className="py-4 px-5 text-center">L/P · Usia</th>
                  <th className="py-4 px-5 text-center">TKJI & IMT</th>
                  <th className="py-4 px-5 text-center">Pre / Post</th>
                  <th className="py-4 px-5 text-center">Materi & Praktik</th>
                  <th className="py-4 px-5 text-center">Program FITT</th>
                  <th className="py-4 px-5 text-right">Indeks 360°</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.studentId}
                    onClick={() => openStudentModal(st, "rapor")}
                    className="border-b border-hairline hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <div className="font-bold">{st.fullName}</div>
                      <div className="text-xs font-mono opacity-55">
                        {st.email}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-xs">
                      {st.gender} · {st.ageYears} Thn
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-xs">
                      {st.tkjiScore !== null ? `${st.tkjiScore}/25` : "—"} · IMT{" "}
                      {st.bmiScore ?? "—"}
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-xs">
                      {st.pretestScore ?? "—"} → {st.posttestScore ?? "—"}
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-xs">
                      {st.avgMaterialScore}% ({st.completedModules} Modul)
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-xs">
                      {st.fittAkhirScore ?? st.fittAwalScore ?? "—"}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-gold-accent">
                      {st.holisticIndex}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL RAPOR HOLISTIK 360° & EDIT BIODATA SISWA */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setSelectedStudent(null)}
            />

            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col rounded-[2rem] relative z-10 shadow-2xl edufit-card-primary"
            >
              <div className="p-6 sm:p-8 border-b border-hairline flex flex-wrap justify-between items-center gap-4 shrink-0">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gold-accent block mb-1">
                    {selectedStudent.className} · Rapor Holistik 360° Peserta
                    Didik
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                    {selectedStudent.fullName}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex p-1.5 rounded-2xl edufit-surface-subtle">
                    <button
                      type="button"
                      onClick={() => setModalMode("rapor")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
                        modalMode === "rapor"
                          ? "seg-btn-active"
                          : "seg-btn-idle"
                      }`}
                    >
                      Rapor 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode("edit")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
                        modalMode === "edit" ? "seg-btn-active" : "seg-btn-idle"
                      }`}
                    >
                      Edit Biodata & Kelas
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer badge-tint-rose"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1">
                {modalMode === "rapor" ? (
                  <div className="space-y-6">
                    {/* Ringkasan 4 Pilar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 rounded-2xl edufit-surface-subtle">
                        <span className="text-[10px] font-bold uppercase opacity-55 block mb-1">
                          Skor TKJI & IMT
                        </span>
                        <span className="text-3xl font-mono font-semibold text-gold-accent">
                          {selectedStudent.tkjiScore !== null
                            ? `${selectedStudent.tkjiScore}/25`
                            : "—"}
                        </span>
                        <span className="text-xs font-mono opacity-65 block mt-1">
                          {selectedStudent.tkjiCategory || "Belum Uji"} · IMT{" "}
                          {selectedStudent.bmiScore ?? "-"} (
                          {selectedStudent.bmiCategory || "-"})
                        </span>
                      </div>

                      <div className="p-5 rounded-2xl edufit-surface-subtle">
                        <span className="text-[10px] font-bold uppercase opacity-55 block mb-1">
                          Kognitif (Pre → Post)
                        </span>
                        <span className="text-3xl font-mono font-semibold">
                          {selectedStudent.pretestScore ?? "—"} →{" "}
                          {selectedStudent.posttestScore ?? "—"}
                        </span>
                        <span className="text-xs font-mono opacity-65 block mt-1">
                          Selisih:{" "}
                          {selectedStudent.cognitiveGain !== null
                            ? selectedStudent.cognitiveGain > 0
                              ? `+${selectedStudent.cognitiveGain} Poin`
                              : `${selectedStudent.cognitiveGain} Poin`
                            : "Menunggu"}
                        </span>
                      </div>

                      <div className="p-5 rounded-2xl edufit-surface-subtle">
                        <span className="text-[10px] font-bold uppercase opacity-55 block mb-1">
                          Materi & Praktik
                        </span>
                        <span className="text-3xl font-mono font-semibold">
                          {selectedStudent.avgMaterialScore}%
                        </span>
                        <span className="text-xs font-mono opacity-65 block mt-1">
                          {selectedStudent.completedModules} Modul Selesai ·{" "}
                          {selectedStudent.practiceNotesCount} Catatan Gerak
                        </span>
                      </div>

                      <div className="p-5 rounded-2xl telemetry-bar-gold">
                        <span className="text-[10px] font-bold uppercase opacity-75 block mb-1">
                          Indeks Rapor 360°
                        </span>
                        <span className="text-4xl font-mono font-bold">
                          {selectedStudent.holisticIndex}%
                        </span>
                        <span className="text-xs font-mono block mt-1">
                          FITT Awal: {selectedStudent.fittAwalScore ?? "-"} ·
                          Akhir: {selectedStudent.fittAkhirScore ?? "-"}
                        </span>
                      </div>
                    </div>

                    {/* Rincian 6 Pos Fisik */}
                    <div className="p-6 rounded-3xl space-y-4 edufit-card-secondary">
                      <div className="flex items-center justify-between border-b border-hairline pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Rincian Pengukuran Fisik (TKJI & Antropometri)
                        </span>
                        <span className="text-xs font-mono opacity-65">
                          {selectedStudent.gender === "L" ? "Putra" : "Putri"} ·{" "}
                          {selectedStudent.ageYears} Tahun
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                        <div className="p-3.5 rounded-2xl edufit-card-primary">
                          <span className="text-[10px] font-sans opacity-55 block">
                            Lari Cepat 60m
                          </span>
                          <strong className="text-base">
                            {selectedStudent.run60mSec
                              ? `${selectedStudent.run60mSec} dtk`
                              : "—"}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-2xl edufit-card-primary">
                          <span className="text-[10px] font-sans opacity-55 block">
                            Gantung Angkat/Siku
                          </span>
                          <strong className="text-base">
                            {selectedStudent.pullUpOrHang ?? "—"}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-2xl edufit-card-primary">
                          <span className="text-[10px] font-sans opacity-55 block">
                            Baring Duduk (Sit-Up)
                          </span>
                          <strong className="text-base">
                            {selectedStudent.sitUpCount ?? "—"}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-2xl edufit-card-primary">
                          <span className="text-[10px] font-sans opacity-55 block">
                            Loncat Tegak
                          </span>
                          <strong className="text-base">
                            {selectedStudent.verticalJumpCm
                              ? `${selectedStudent.verticalJumpCm} cm`
                              : "—"}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-2xl edufit-card-primary">
                          <span className="text-[10px] font-sans opacity-55 block">
                            Lari Jauh 1000/1200m
                          </span>
                          <strong className="text-base">
                            {selectedStudent.enduranceMinSec || "—"}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-2xl edufit-card-primary">
                          <span className="text-[10px] font-sans opacity-55 block">
                            Berat & Tinggi
                          </span>
                          <strong className="text-base">
                            {selectedStudent.weightKg ?? "-"}kg /{" "}
                            {selectedStudent.heightCm ?? "-"}cm
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Pembekuan ke Arsip */}
                    <div className="p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 edufit-surface-subtle">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider block">
                          Simpan Rapor Siswa ke Arsip Semester
                        </span>
                        <p className="text-xs opacity-60">
                          Membekukan salinan nilai siswa ini pada periode{" "}
                          <strong>{academicYearInput}</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleArchiveSingleStudent(selectedStudent)
                        }
                        className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer btn-forest-emerald"
                      >
                        <Archive size={15} /> Simpan Arsip Rapor
                      </button>
                    </div>
                  </div>
                ) : (
                  /* FORM EDIT PROFIL SISWA & PEMINDAHAN KELAS (TANPA NAMA KOLOM TABEL) */
                  <form
                    onSubmit={handleSaveStudentProfile}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                          Nama Lengkap Siswa
                        </label>
                        <input
                          required
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full p-4 rounded-2xl text-base font-semibold focus:outline-none edufit-surface-subtle"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                          Jenis Kelamin
                        </label>
                        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl edufit-surface-subtle">
                          {(["L", "P"] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setEditGender(g)}
                              className={`py-3 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                                editGender === g
                                  ? "seg-btn-active"
                                  : "seg-btn-idle"
                              }`}
                            >
                              {g === "L" ? "Putra (L)" : "Putri (P)"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                          Tanggal Lahir Siswa
                        </label>
                        <input
                          required
                          type="date"
                          value={editBirthDate}
                          onChange={(e) => setEditBirthDate(e.target.value)}
                          className="w-full p-4 rounded-2xl text-sm font-mono focus:outline-none edufit-surface-subtle"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                          Penempatan Ruang Kelas
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {classes.map((c) => {
                            const active = editTargetClassId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setEditTargetClassId(c.id)}
                                className={`p-3.5 rounded-xl text-left text-xs font-bold cursor-pointer ${
                                  active
                                    ? "seg-btn-active"
                                    : "edufit-surface-subtle"
                                }`}
                              >
                                {c.name} (Kelas {c.grade_level})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-hairline">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromClass(selectedStudent)}
                        className="px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer badge-tint-rose"
                      >
                        <Trash2 size={15} /> Keluarkan dari Kelas Ini
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-7 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer btn-forest-emerald"
                      >
                        <Save size={15} />
                        {isSavingProfile
                          ? "Menyimpan..."
                          : "Simpan Perubahan Biodata"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}