// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Building2,
  Check,
  ChevronDown,
  Download,
  Edit3,
  GraduationCap,
  MapPin,
  Plus,
  School,
  Search,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const BENTO_SHOWCASE_CLASSES = [
  "bento-showcase-0",
  "bento-showcase-1",
  "bento-showcase-2",
  "bento-showcase-3",
];

export default function InstitusiPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [schools, setSchools] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [schoolClassesMaster, setSchoolClassesMaster] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter Cakupan di Bento 1 & Tabel Guru
  const [filterType, setFilterType] = useState<"ALL" | "SMA" | "SMK">("ALL");
  const [filterSchoolId, setFilterSchoolId] = useState<string>("all");
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<"coverage" | "ratio" | "rombel">(
    "coverage"
  );

  // State Modal Tambah / Edit Sekolah
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolType, setSchoolType] = useState("SMA");
  const [isSubmittingSchool, setIsSubmittingSchool] = useState(false);

  // State Modal Registrasi Guru Baru
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

  // State Modal Kelola Profil & Penempatan Guru
  const [managingTeacher, setManagingTeacher] = useState<any | null>(null);
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherSchoolId, setEditTeacherSchoolId] = useState<string | null>(
    null
  );
  const [isEditSchoolDropdownOpen, setIsEditSchoolDropdownOpen] =
    useState(false);
  const [isUpdatingTeacher, setIsUpdatingTeacher] = useState(false);

  // State Modal Kelola Master Jurusan/Kelas Sekolah (school_classes)
  const [managingMasterSchool, setManagingMasterSchool] = useState<any | null>(
    null
  );
  const [masterGradeLevel, setMasterGradeLevel] = useState<number>(10);
  const [masterClassName, setMasterClassName] = useState<string>("");
  const [isSubmittingMasterClass, setIsSubmittingMasterClass] = useState(false);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [sRes, tRes, pRes, cRes, scMasterRes] = await Promise.all([
        supabase
          .from("schools")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_profiles")
          .select("*, schools(name)")
          .eq("role", "guru")
          .order("created_at", { ascending: false }),
        supabase.from("user_profiles").select("id, school_id, role"),
        supabase.from("classes").select("id, school_id, guru_id, grade_level"),
        supabase
          .from("school_classes")
          .select("*")
          .order("grade_level", { ascending: true })
          .order("name", { ascending: true }),
      ]);

      if (sRes.data) setSchools(sRes.data);
      if (tRes.data) setTeachers(tRes.data);
      if (pRes.data) setAllProfiles(pRes.data);
      if (cRes.data) setAllClasses(cRes.data);
      if (scMasterRes.data) setSchoolClassesMaster(scMasterRes.data);
    } catch (error) {
      toast.error("Gagal memuat data institusi dari database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Pemetaan Metrik Lengkap per Sekolah (Guru, Siswa, Rombel Aktif, Master Kelas)
  const schoolMetricsMap = useMemo(() => {
    const map: Record<
      string,
      { guru: number; siswa: number; classes: number; masterClasses: number }
    > = {};
    schools.forEach((s) => {
      map[s.id] = { guru: 0, siswa: 0, classes: 0, masterClasses: 0 };
    });
    allProfiles.forEach((p) => {
      if (p.school_id && map[p.school_id]) {
        if (String(p.role) === "guru") map[p.school_id].guru += 1;
        else if (String(p.role) === "siswa") map[p.school_id].siswa += 1;
      }
    });
    allClasses.forEach((c) => {
      if (c.school_id && map[c.school_id]) {
        map[c.school_id].classes += 1;
      }
    });
    schoolClassesMaster.forEach((scm) => {
      if (scm.school_id && map[scm.school_id]) {
        map[scm.school_id].masterClasses += 1;
      }
    });
    return map;
  }, [schools, allProfiles, allClasses, schoolClassesMaster]);

  // Hitung jumlah kelas aktif yang diampu per Guru
  const teacherClassCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allClasses.forEach((c) => {
      if (c.guru_id) {
        map[c.guru_id] = (map[c.guru_id] || 0) + 1;
      }
    });
    return map;
  }, [allClasses]);

  const totalSiswaCount = useMemo(
    () => allProfiles.filter((p) => String(p.role) === "siswa").length,
    [allProfiles]
  );

  const smaCount = useMemo(
    () =>
      schools.filter(
        (s) => String(s.school_type || "SMA").toUpperCase() === "SMA"
      ).length,
    [schools]
  );

  const smkCount = useMemo(
    () =>
      schools.filter(
        (s) => String(s.school_type || "").toUpperCase() === "SMK"
      ).length,
    [schools]
  );

  const schoolsWithTeacherCount = useMemo(() => {
    return schools.filter((s) => (schoolMetricsMap[s.id]?.guru || 0) > 0)
      .length;
  }, [schools, schoolMetricsMap]);

  const schoolReadinessPct = useMemo(() => {
    if (schools.length === 0) return 0;
    return Math.round((schoolsWithTeacherCount / schools.length) * 100);
  }, [schools.length, schoolsWithTeacherCount]);

  const visibleSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchType =
        filterType === "ALL" ||
        String(s.school_type || "SMA").toUpperCase() === filterType;
      const matchId = filterSchoolId === "all" || s.id === filterSchoolId;
      return matchType && matchId;
    });
  }, [schools, filterType, filterSchoolId]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSchool =
        filterSchoolId === "all" || t.school_id === filterSchoolId;
      if (!matchSchool) return false;

      if (filterType !== "ALL") {
        const sch = schools.find((s) => s.id === t.school_id);
        if (
          !sch ||
          String(sch.school_type || "SMA").toUpperCase() !== filterType
        ) {
          return false;
        }
      }

      if (!teacherSearch.trim()) return true;
      const q = teacherSearch.toLowerCase();
      return (
        String(t.full_name || "").toLowerCase().includes(q) ||
        String(t.email || "").toLowerCase().includes(q) ||
        String(t.schools?.name || "").toLowerCase().includes(q)
      );
    });
  }, [teachers, filterSchoolId, filterType, schools, teacherSearch]);

  // ==========================================================================
  // CRUD SEKOLAH (TAMBAH, EDIT, HAPUS)
  // ==========================================================================
  const openCreateSchoolModal = () => {
    setEditingSchoolId(null);
    setSchoolName("");
    setSchoolAddress("");
    setSchoolType("SMA");
    setIsSchoolModalOpen(true);
  };

  const openEditSchoolModal = (school: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchoolId(school.id);
    setSchoolName(school.name || "");
    setSchoolAddress(school.address || "");
    setSchoolType(school.school_type || "SMA");
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSchool(true);
    try {
      const payload = {
        name: schoolName.trim(),
        address: schoolAddress.trim(),
        school_type: schoolType,
      };
      if (editingSchoolId) {
        const { error } = await supabase
          .from("schools")
          .update(payload)
          .eq("id", editingSchoolId);
        if (error) throw error;
        toast.success(`Data ${schoolName} berhasil diperbarui!`);
      } else {
        const { error } = await supabase.from("schools").insert([payload]);
        if (error) throw error;
        toast.success(`${schoolName} berhasil ditambahkan!`);
      }
      fetchAllData();
      setIsSchoolModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan sekolah", { description: err.message });
    } finally {
      setIsSubmittingSchool(false);
    }
  };

  const handleDeleteSchool = (school: any, e: React.MouseEvent) => {
    e.stopPropagation();
    toast("Hapus Institusi Sekolah?", {
      description: `Data "${school.name}" akan dihapus permanen.`,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          const { error } = await supabase
            .from("schools")
            .delete()
            .eq("id", school.id);
          if (error) {
            toast.error(
              "Tidak dapat menghapus sekolah yang masih memiliki data kelas/pengguna aktif."
            );
          } else {
            toast.success("Sekolah berhasil dihapus");
            if (filterSchoolId === school.id) setFilterSchoolId("all");
            fetchAllData();
          }
        },
      },
      cancel: { label: "Batal" },
      actionButtonStyle: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        fontWeight: 700,
        borderRadius: "10px",
      },
    });
  };

  // ==========================================================================
  // CRUD MASTER JURUSAN/KELAS SEKOLAH (school_classes)
  // ==========================================================================
  const handleAddMasterClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingMasterSchool || !masterClassName.trim()) return;
    setIsSubmittingMasterClass(true);
    try {
      const { error } = await supabase.from("school_classes").insert([
        {
          school_id: managingMasterSchool.id,
          grade_level: masterGradeLevel,
          name: masterClassName.trim(),
        },
      ]);
      if (error) throw error;
      toast.success(
        `Master Kelas ${masterGradeLevel} ${masterClassName} ditambahkan ke ${managingMasterSchool.name}!`
      );
      setMasterClassName("");
      fetchAllData();
    } catch (err: any) {
      toast.error("Gagal menambah master kelas", { description: err.message });
    } finally {
      setIsSubmittingMasterClass(false);
    }
  };

  const handleDeleteMasterClass = async (id: string, name: string) => {
    const { error } = await supabase
      .from("school_classes")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Gagal menghapus master kelas");
    } else {
      toast.success(`Master kelas ${name} dihapus`);
      fetchAllData();
    }
  };

  // ==========================================================================
  // REGISTRASI & KELOLA AKUN GURU
  // ==========================================================================
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      return toast.error("Gagal", {
        description: "Pilih penempatan sekolah terlebih dahulu.",
      });
    }
    if (teacherPassword.length < 6) {
      return toast.error("Gagal", {
        description: "Password minimal 6 karakter.",
      });
    }

    setIsSubmittingTeacher(true);
    const promise = fetch("/api/create-teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: teacherEmail,
        password: teacherPassword,
        full_name: teacherName,
        school_id: selectedSchoolId,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    });

    toast.promise(promise, {
      loading: "Meregistrasi akun guru di server...",
      success: () => {
        fetchAllData();
        setIsTeacherModalOpen(false);
        setTeacherName("");
        setTeacherEmail("");
        setTeacherPassword("");
        setSelectedSchoolId(null);
        return `Akun Guru ${teacherName} berhasil dibuat!`;
      },
      error: (err) => `Gagal: ${err.message}`,
    });
    setIsSubmittingTeacher(false);
  };

  const openManageTeacherModal = (teacher: any) => {
    setManagingTeacher(teacher);
    setEditTeacherName(teacher.full_name || "");
    setEditTeacherSchoolId(teacher.school_id || null);
    setIsEditSchoolDropdownOpen(false);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTeacher) return;
    setIsUpdatingTeacher(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: editTeacherName.trim(),
          school_id: editTeacherSchoolId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", managingTeacher.id);

      if (error) throw error;
      toast.success("Data & penempatan guru berhasil diperbarui!");
      setManagingTeacher(null);
      fetchAllData();
    } catch (err: any) {
      toast.error("Gagal memperbarui profil guru");
    } finally {
      setIsUpdatingTeacher(false);
    }
  };

  const handleExportInstitusiCSV = () => {
    const rows = [
      [
        "Nama Sekolah",
        "Tipe",
        "Alamat",
        "Jumlah Guru PJOK",
        "Jumlah Siswa",
        "Rombel Aktif",
      ],
      ...schools.map((s) => {
        const m = schoolMetricsMap[s.id] || {
          guru: 0,
          siswa: 0,
          classes: 0,
        };
        return [
          `"${s.name || ""}"`,
          `"${s.school_type || "SMA"}"`,
          `"${String(s.address || "").replace(/"/g, '""')}"`,
          m.guru,
          m.siswa,
          m.classes,
        ];
      }),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Data_Institusi_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan Institusi & Pendidik berhasil diunduh!");
  };

  if (!mounted) return null;

  const activeSchoolObj =
    filterSchoolId === "all"
      ? null
      : schools.find((s) => s.id === filterSchoolId);

  return (
    <div className="edufit-admin-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* ====================================================================
          ZONA 1: HERO HEADER & 3 ANGKA UTAMA
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-65">
            <span className="text-gold-accent">MANAJEMEN ORGANISASI</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <School size={15} />
              {activeSchoolObj
                ? `Fokus Institusi: ${activeSchoolObj.name} (${activeSchoolObj.school_type})`
                : "Institusi Sekolah & Tenaga Pendidik"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Kelola <br />
            <span className="font-semibold">Institusi & Guru</span>
          </h1>
        </div>

        {/* 3 Angka Utama */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : schools.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Sekolah Mitra
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent">
              {isLoading ? "—" : teachers.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Guru PJOK
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : totalSiswaCount}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Total Siswa
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI ORGANISASI
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Proporsi SMA vs SMK */}
        <button
          type="button"
          onClick={() =>
            setFilterType(
              filterType === "ALL"
                ? "SMA"
                : filterType === "SMA"
                ? "SMK"
                : "ALL"
            )
          }
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Jenjang Institusi</span>
            <span className="font-mono">FILTER: {filterType}</span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              filterType !== "ALL"
                ? "telemetry-bar-forest-active"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-light font-mono tracking-tight">
              {smaCount} SMA · {smkCount} SMK
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-accent">
              Aktif
            </span>
          </div>
        </button>

        {/* Bar 2: Sekolah Terhubung Guru */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Penempatan Guru</span>
            <span className="font-mono">TERVERIFIKASI</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {schoolsWithTeacherCount}/{schools.length} Sekolah
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {teachers.length} Pendidik
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Kesiapan Institusi */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kesiapan Operasional Sekolah</span>
            <span className="font-mono">
              {schoolClassesMaster.length} MASTER KELAS
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${schoolReadinessPct}%`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              Terhubung Guru
            </span>
          </div>
        </div>

        {/* Bar 4: Total Rombel Kelas */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rombel Aktif</span>
            <span className="font-mono">10–12</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-gold-accent">
              {isLoading ? "—" : `${allClasses.length} Kelas`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1: FILTER SEKOLAH + TOMBOL REGISTRASI */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
                <SlidersHorizontal size={14} />
                <span>Filter Organisasi</span>
              </div>
              <button
                type="button"
                onClick={handleExportInstitusiCSV}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Unduh Data Institusi CSV"
              >
                <Download size={15} />
              </button>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Kendali Institusi
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Filter jenjang sekolah atau tambahkan institusi dan akun pendidik
              baru.
            </p>

            {/* Segmented Filter Tipe Institusi */}
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 edufit-surface-subtle">
              {(["ALL", "SMA", "SMK"] as const).map((type) => {
                const active = filterType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {type === "ALL" ? "Semua Tipe" : type}
                  </button>
                );
              })}
            </div>

            {/* Underline Custom Dropdown Sekolah */}
            <div className="relative w-full mb-6" ref={filterDropdownRef}>
              <div
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isFilterDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {activeSchoolObj
                    ? activeSchoolObj.name
                    : `Seluruh Sekolah (${schools.length})`}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isFilterDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    <div
                      onClick={() => {
                        setFilterSchoolId("all");
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        filterSchoolId === "all" ? "text-gold-accent" : ""
                      }`}
                    >
                      Seluruh Sekolah ({schools.length} Institusi)
                    </div>
                    {schools.map((sch) => {
                      const m = schoolMetricsMap[sch.id] || {
                        guru: 0,
                        siswa: 0,
                      };
                      return (
                        <div
                          key={sch.id}
                          onClick={() => {
                            setFilterSchoolId(sch.id);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`px-6 py-4 text-base font-light cursor-pointer transition-colors flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 ${
                            filterSchoolId === sch.id ? "text-gold-accent" : ""
                          }`}
                        >
                          <span className="truncate pr-2">{sch.name}</span>
                          <span className="font-mono text-xs opacity-60 shrink-0">
                            {m.guru} Guru · {m.siswa} Siswa
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 2 Tombol Aksi Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 pt-2">
            <button
              type="button"
              onClick={openCreateSchoolModal}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm telemetry-bar-forest"
            >
              <Plus size={15} strokeWidth={2.5} /> Tambah Sekolah
            </button>

            <button
              type="button"
              onClick={() => setIsTeacherModalOpen(true)}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm btn-forest-gold"
            >
              <GraduationCap size={16} /> Registrasi Guru
            </button>
          </div>
        </div>

        {/* BENTO 2: DISTRIBUSI POPULASI SEKOLAH */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Building2 size={15} />
              <span>Populasi per Sekolah Mitra</span>
            </div>
            <span className="text-xs font-bold font-mono text-gold-accent">
              {allClasses.length} ROMBEL
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : totalSiswaCount}
            </div>
            <div className="text-sm font-semibold opacity-60 mb-1">
              Siswa Aktif pada {schools.length} Institusi
            </div>
          </div>

          {/* Grafik Batang Proporsional */}
          {(() => {
            const topSchools = schools.slice(0, 6);
            const maxStudents = Math.max(
              1,
              ...topSchools.map((s) => schoolMetricsMap[s.id]?.siswa || 0)
            );

            return (
              <div className="pt-4 pb-1 relative z-10">
                <div
                  className="grid gap-2.5 items-end h-44 px-3 py-3 rounded-2xl edufit-card-primary"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(
                      1,
                      topSchools.length
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {topSchools.length === 0 ? (
                    <div className="col-span-full h-full flex items-center justify-center text-xs opacity-50">
                      Belum ada institusi terdaftar
                    </div>
                  ) : (
                    topSchools.map((sch, idx) => {
                      const sCount = schoolMetricsMap[sch.id]?.siswa || 0;
                      const gCount = schoolMetricsMap[sch.id]?.guru || 0;
                      const heightPct = Math.round(
                        (sCount / maxStudents) * 100
                      );
                      const isSelected = filterSchoolId === sch.id;
                      const shortCode = sch.name
                        .replace(/SMAN|SMKN|SMA|SMK/gi, "")
                        .trim()
                        .split(" ")[0];
                      const fillClass = isSelected
                        ? "chart-fill-emerald"
                        : idx === 0
                        ? "chart-fill-gold"
                        : "chart-fill-primary";

                      return (
                        <button
                          key={sch.id}
                          type="button"
                          onClick={() =>
                            setFilterSchoolId(isSelected ? "all" : sch.id)
                          }
                          className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                          title={`${sch.name}: ${sCount} Siswa · ${gCount} Guru`}
                        >
                          <span
                            className={`text-[10px] font-bold font-mono transition-opacity ${
                              isSelected || idx === 0
                                ? "opacity-100 text-gold-accent"
                                : "opacity-65 group-hover:opacity-100"
                            }`}
                          >
                            {sCount}
                          </span>
                          <div className="w-5 flex-1 rounded-xl flex items-end overflow-hidden p-0.5 chart-track-pill">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${Math.max(
                                  sCount > 0 ? 14 : 6,
                                  heightPct
                                )}%`,
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`w-full rounded-lg ${fillClass}`}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold font-mono tracking-tight truncate max-w-full ${
                              isSelected
                                ? "text-emerald-accent"
                                : idx === 0
                                ? "text-gold-accent"
                                : "opacity-70"
                            }`}
                          >
                            {shortCode || `S${idx + 1}`}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* BENTO 3: INDEKS ORGANISASI (TEKS LABEL DI LUAR LINGKARAN CHART) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} />
              <span>Indeks Organisasi</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              {[
                { key: "coverage", label: "Kesiapan" },
                { key: "ratio", label: "Guru" },
                { key: "rombel", label: "Kelas" },
              ].map((m) => {
                const active = gaugeMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setGaugeMode(m.key as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(() => {
            const gaugeValue =
              gaugeMode === "coverage"
                ? `${schoolReadinessPct}%`
                : gaugeMode === "ratio"
                ? `${teachers.length}`
                : `${schoolClassesMaster.length}`;

            const gaugeLabel =
              gaugeMode === "coverage"
                ? "Sekolah Mitra Memiliki Guru Aktif"
                : gaugeMode === "ratio"
                ? "Total Guru PJOK Terdaftar"
                : "Master Jurusan & Kelas Terpetakan";

            const gaugePct =
              gaugeMode === "coverage"
                ? schoolReadinessPct
                : gaugeMode === "ratio"
                ? Math.min(100, teachers.length * 20)
                : Math.min(100, schoolClassesMaster.length * 10);

            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset =
              circumference - (Math.max(10, gaugePct) / 100) * circumference;

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
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className={`transition-all duration-700 ${
                        gaugeMode === "ratio"
                          ? "gauge-circle-emerald"
                          : "gauge-circle-gold"
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-light font-mono tracking-tighter leading-none">
                      {isLoading ? "—" : gaugeValue}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold opacity-65 mt-3 text-center">
                  {gaugeLabel}
                </span>
              </div>
            );
          })()}

          <div className="relative z-10">
            <div className="h-2.5 w-full rounded-full flex overflow-hidden mb-3 chart-track-pill">
              {schools.length > 0 && (
                <>
                  <div
                    className="h-full chart-fill-gold"
                    style={{
                      width: `${(smaCount / schools.length) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full chart-fill-emerald"
                    style={{
                      width: `${(smkCount / schools.length) * 100}%`,
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-2 border-t border-hairline">
              <span>SMA ({smaCount})</span>
              <span>SMK ({smkCount})</span>
              <span>{allClasses.length} Rombel</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: GRID KARTU BESAR SEKOLAH MITRA
         ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent mb-1">
            JARINGAN INSTITUSI MITRA
          </div>
          <h3 className="text-3xl font-light tracking-tight">
            Daftar Institusi Sekolah Mitra ({visibleSchools.length})
          </h3>
          <p className="text-xs font-medium opacity-55 mt-1">
            Klik kartu sekolah untuk memfilter daftar guru di bawah, atau kelola
            master jurusan/kelas per sekolah.
          </p>
        </div>

        {filterSchoolId !== "all" && (
          <button
            type="button"
            onClick={() => setFilterSchoolId("all")}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer btn-forest-gold"
          >
            Tampilkan Semua Sekolah
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[300px] rounded-[2rem] animate-pulse edufit-surface-subtle"
            />
          ))
        ) : visibleSchools.length === 0 ? (
          <div className="xl:col-span-3 p-14 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
            <p className="text-xl font-light">
              Belum ada institusi sekolah pada filter ini.
            </p>
          </div>
        ) : (
          visibleSchools.map((school, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const m = schoolMetricsMap[school.id] || {
              guru: 0,
              siswa: 0,
              classes: 0,
              masterClasses: 0,
            };
            const isSelected = filterSchoolId === school.id;
            const isSmk =
              String(school.school_type || "").toUpperCase() === "SMK";

            return (
              <div
                key={school.id}
                onClick={() =>
                  setFilterSchoolId(isSelected ? "all" : school.id)
                }
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[310px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass} ${
                  isSelected ? "bento-showcase-selected" : ""
                }`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                {/* Baris Atas Kartu Sekolah */}
                <div className="flex justify-between items-start relative z-10 gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold font-mono tracking-widest uppercase ${
                      isSmk ? "badge-tint-sky" : "badge-tint-emerald"
                    }`}
                  >
                    {school.school_type || "SMA"} · {m.classes} Rombel
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingMasterSchool(school);
                      }}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Kelola Master Jurusan/Kelas (Agar Guru bisa membuka kelas)"
                    >
                      {m.masterClasses} Master Kelas
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openEditSchoolModal(school, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Edit Sekolah"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSchool(school, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
                      title="Hapus Sekolah"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Nama Sekolah */}
                <div className="my-6 relative z-10">
                  <div className="text-4xl font-light tracking-tighter leading-tight mb-3">
                    {school.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium opacity-65">
                    <MapPin size={13} className="shrink-0" />
                    <span className="truncate">
                      {school.address || "Alamat belum diatur"}
                    </span>
                  </div>
                </div>

                {/* Baris Bawah Angka Guru & Siswa */}
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Guru PJOK
                    </div>
                    <div className="text-3xl font-light font-mono leading-none">
                      {m.guru}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Siswa Terdaftar
                    </div>
                    <div className="text-4xl font-light font-mono leading-none text-gold-accent">
                      {m.siswa}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ====================================================================
          ZONA 5: DIREKTORI AKUN GURU PJOK (BENTO TABLE CONTAINER)
         ==================================================================== */}
      <div className="rounded-[2rem] p-8 md:p-10 relative z-10 overflow-hidden edufit-card-primary">
        <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-6 mb-8 pb-6 border-b border-hairline">
          <div>
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest mb-2">
              <UsersRound size={15} className="text-gold-accent" />
              <span>Direktori Tenaga Pendidik</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Daftar Guru PJOK Terdaftar ({filteredTeachers.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Cari nama, email, atau sekolah..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold outline-none transition-colors edufit-surface-subtle"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsTeacherModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm btn-forest-gold"
            >
              <Plus size={16} /> Registrasi Guru Baru
            </button>
          </div>
        </div>

        <div className="relative z-10 overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-hairline text-[10px] font-mono uppercase tracking-widest font-bold opacity-55">
                <th className="pb-4 px-4">Nama Lengkap Pendidik</th>
                <th className="pb-4 px-4">Email Login</th>
                <th className="pb-4 px-4">Penempatan Institusi</th>
                <th className="pb-4 px-4 text-center">Rombel Diampu</th>
                <th className="pb-4 px-4 text-right">Pengaturan</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center opacity-50 animate-pulse text-lg font-light"
                  >
                    Menarik direktori guru...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center opacity-50 font-light text-lg"
                  >
                    Tidak ada akun guru yang sesuai dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const classCnt = teacherClassCountMap[t.id] || 0;
                  const hasSchool = Boolean(t.schools?.name);
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.28,
                        delay: Math.min(idx * 0.03, 0.25),
                      }}
                      className="border-b border-hairline transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.025]"
                    >
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold font-mono text-sm shrink-0 telemetry-bar-forest text-gold-accent">
                            {(t.full_name || "G").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-base block">
                              {t.full_name}
                            </span>
                            <span className="text-xs opacity-55 font-mono">
                              Role: Guru PJOK
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4 font-mono text-xs opacity-75">
                        {t.email}
                      </td>
                      <td className="py-5 px-4">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-block ${
                            hasSchool
                              ? "badge-tint-emerald"
                              : "badge-tint-amber"
                          }`}
                        >
                          {t.schools?.name || "Belum Ditempatkan"}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold badge-tint-sky">
                          {classCnt} Kelas
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openManageTeacherModal(t)}
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                        >
                          <Edit3 size={13} /> Kelola
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: TAMBAH / EDIT SEKOLAH
         ==================================================================== */}
      <AnimatePresence>
        {isSchoolModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsSchoolModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsSchoolModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                KONFIGURASI INSTITUSI
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-8">
                {editingSchoolId ? "Edit" : "Tambah"}{" "}
                <span className="font-semibold">Sekolah Mitra</span>
              </h2>

              <form onSubmit={handleSaveSchool} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Jenis Institusi
                  </label>
                  <div className="flex gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                    {["SMA", "SMK"].map((type) => {
                      const active = schoolType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSchoolType(type)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active ? "seg-btn-active" : "seg-btn-idle"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Nama Resmi Sekolah
                  </label>
                  <input
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    type="text"
                    placeholder="Contoh: SMAN 8 Pekanbaru"
                    className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Alamat Lengkap
                  </label>
                  <textarea
                    required
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    placeholder="Alamat lengkap institusi sekolah..."
                    rows={3}
                    className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-none edufit-surface-subtle"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSchool}
                  className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-opacity hover:opacity-90 shadow-md cursor-pointer btn-forest-gold"
                >
                  {isSubmittingSchool ? "Menyimpan..." : "Simpan Data Sekolah"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 2: REGISTRASI AKUN GURU BARU
         ==================================================================== */}
      <AnimatePresence>
        {isTeacherModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsTeacherModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                AKUN PENDIDIK BARU
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-2">
                Registrasi <span className="font-semibold">Guru PJOK</span>
              </h2>
              <p className="text-sm opacity-55 mb-8 font-medium">
                Sistem akan otomatis mendaftarkan akun login sekaligus
                menghubungkan guru ke sekolah penempatan.
              </p>

              <form onSubmit={handleAddTeacher} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      required
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      type="text"
                      placeholder="Contoh: Budi Santoso, S.Pd"
                      className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Email Login
                    </label>
                    <input
                      required
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      type="email"
                      placeholder="budi@sekolah.edu"
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                      Password Akses
                    </label>
                    <input
                      required
                      minLength={6}
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      type="text"
                      placeholder="Minimal 6 karakter"
                      className="w-full p-4 rounded-2xl text-sm focus:outline-none edufit-surface-subtle"
                    />
                  </div>
                </div>

                <div className="relative pt-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Penempatan Institusi Sekolah
                  </label>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full bg-transparent py-3 text-xl font-light cursor-pointer flex items-center justify-between edufit-underline-select ${
                      isDropdownOpen ? "edufit-underline-select-active" : ""
                    }`}
                  >
                    <span>
                      {selectedSchoolId
                        ? schools.find((s) => s.id === selectedSchoolId)?.name
                        : "Pilih sekolah penempatan..."}
                    </span>
                    <ChevronDown size={22} className="opacity-50" />
                  </div>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl z-[150] max-h-56 overflow-y-auto no-scrollbar p-2 edufit-dropdown-menu"
                      >
                        {schools.map((school) => (
                          <li
                            key={school.id}
                            onClick={() => {
                              setSelectedSchoolId(school.id);
                              setIsDropdownOpen(false);
                            }}
                            className="px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <span>{school.name}</span>
                            {selectedSchoolId === school.id && (
                              <Check size={16} className="text-gold-accent" />
                            )}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTeacher}
                  className="w-full py-4 mt-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-opacity shadow-md disabled:opacity-50 hover:opacity-90 cursor-pointer btn-forest-gold"
                >
                  {isSubmittingTeacher
                    ? "Memproses ke Server..."
                    : "Buat Akun Guru"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 3: KELOLA PROFIL & PENEMPATAN GURU
         ==================================================================== */}
      <AnimatePresence>
        {managingTeacher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setManagingTeacher(null)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setManagingTeacher(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                PENGATURAN PENDIDIK
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                Kelola <span className="font-semibold">Profil Guru</span>
              </h2>

              <form onSubmit={handleUpdateTeacher} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Nama Lengkap Guru
                  </label>
                  <input
                    required
                    type="text"
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
                  />
                </div>

                <div className="relative">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">
                    Penempatan Sekolah
                  </label>
                  <div
                    onClick={() =>
                      setIsEditSchoolDropdownOpen(!isEditSchoolDropdownOpen)
                    }
                    className={`w-full bg-transparent py-3 text-xl font-light cursor-pointer flex items-center justify-between edufit-underline-select ${
                      isEditSchoolDropdownOpen
                        ? "edufit-underline-select-active"
                        : ""
                    }`}
                  >
                    <span>
                      {editTeacherSchoolId
                        ? schools.find((s) => s.id === editTeacherSchoolId)
                            ?.name
                        : "Pilih sekolah penempatan..."}
                    </span>
                    <ChevronDown size={20} className="opacity-50" />
                  </div>

                  <AnimatePresence>
                    {isEditSchoolDropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl z-[150] max-h-52 overflow-y-auto no-scrollbar p-2 edufit-dropdown-menu"
                      >
                        {schools.map((school) => (
                          <li
                            key={school.id}
                            onClick={() => {
                              setEditTeacherSchoolId(school.id);
                              setIsEditSchoolDropdownOpen(false);
                            }}
                            className="px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <span>{school.name}</span>
                            {editTeacherSchoolId === school.id && (
                              <Check size={16} className="text-gold-accent" />
                            )}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingTeacher}
                  className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-gold"
                >
                  {isUpdatingTeacher
                    ? "Menyimpan..."
                    : "Simpan Perubahan Guru"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 4: KELOLA MASTER JURUSAN / KELAS SEKOLAH (school_classes)
         ==================================================================== */}
      <AnimatePresence>
        {managingMasterSchool && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setManagingMasterSchool(null)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setManagingMasterSchool(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                PEMETAAN MASTER KELAS · {managingMasterSchool.name}
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                Daftar <span className="font-semibold">Jurusan & Kelas</span>
              </h2>

              <form onSubmit={handleAddMasterClass} className="space-y-4 mb-6">
                <div className="flex gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                  {[10, 11, 12].map((g) => {
                    const active = masterGradeLevel === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setMasterGradeLevel(g)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          active ? "seg-btn-active" : "seg-btn-idle"
                        }`}
                      >
                        Kelas {g}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <input
                    required
                    type="text"
                    value={masterClassName}
                    onChange={(e) => setMasterClassName(e.target.value)}
                    placeholder="Contoh: MIPA 1 / IPS 2 / TKJ 1"
                    className="flex-1 px-4 py-3.5 rounded-2xl text-sm font-semibold focus:outline-none edufit-surface-subtle"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingMasterClass}
                    className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer btn-forest-gold"
                  >
                    + Tambah
                  </button>
                </div>
              </form>

              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                {schoolClassesMaster
                  .filter(
                    (scm) =>
                      scm.school_id === managingMasterSchool.id &&
                      Number(scm.grade_level) === masterGradeLevel
                  )
                  .map((scm) => (
                    <div
                      key={scm.id}
                      className="px-4 py-3 rounded-2xl flex items-center justify-between edufit-surface-subtle"
                    >
                      <span className="font-bold text-sm font-mono">
                        Kelas {scm.grade_level} — {scm.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteMasterClass(scm.id, scm.name)
                        }
                        className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer badge-tint-rose hover:opacity-80"
                        title="Hapus Master Kelas"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}