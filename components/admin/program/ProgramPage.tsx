// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Download,
  Dumbbell,
  Edit3,
  Filter,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProgramPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [totalDbCount, setTotalDbCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] =
    useState<string>("Memuat matriks...");

  // Filter State (Tanpa <select> default browser)
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterTkji, setFilterTkji] = useState<string>("all");
  const [filterBmi, setFilterBmi] = useState<string>("all");
  const [filterWeek, setFilterWeek] = useState<number | "all">("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<"filter" | "duration" | "rest">(
    "filter"
  );

  // Custom Dropdown States
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Modal Create / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ==========================================================================
  // MESIN PENARIK 4.800+ ALGORITMA ANTI-TERPOTONG 1.000 BARIS
  // Menggabungkan Parallel Range Batching + Loop Pengaman hingga baris terakhir
  // ==========================================================================
  const fetchAllAlgorithms = async () => {
    setIsLoading(true);
    setLoadingProgress("Menghitung total matriks algoritma...");
    try {
      const { count, error: countErr } = await supabase
        .from("fitness_algorithms")
        .select("*", { count: "exact", head: true });

      if (countErr) throw countErr;
      const batchSize = 1000;
      let combined: any[] = [];

      if (count && count > 0) {
        // Jika jumlah baris terdeteksi dari header database (berapapun jumlahnya: 5.000, 15.000, dst.)
        const totalBatches = Math.ceil(count / batchSize);
        const batchPromises = [];

        for (let i = 0; i < totalBatches; i++) {
          const from = i * batchSize;
          const to = from + batchSize - 1;
          batchPromises.push(
            supabase
              .from("fitness_algorithms")
              .select("*")
              .order("week", { ascending: true })
              .order("meeting", { ascending: true })
              .order("id", { ascending: true })
              .range(from, to)
          );
        }

        setLoadingProgress(
          `Menarik ${count.toLocaleString("id-ID")} program (${totalBatches} kloter paralel)...`
        );
        const results = await Promise.all(batchPromises);
        results.forEach((res) => {
          if (res.data && res.data.length > 0) {
            combined = combined.concat(res.data);
          }
        });
      } else {
        // Jika header count tidak terbaca, tarik bertahap per 1.000 baris sampai data benar-benar habis
        let offset = 0;
        while (true) {
          const { data: chunk, error: chunkErr } = await supabase
            .from("fitness_algorithms")
            .select("*")
            .order("week", { ascending: true })
            .order("meeting", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + batchSize - 1);

          if (chunkErr) throw chunkErr;
          if (!chunk || chunk.length === 0) break;
          combined = combined.concat(chunk);
          if (chunk.length < batchSize) break;
          offset += batchSize;
        }
      }

      setAlgorithms(combined);
      setTotalDbCount(combined.length);
      setCurrentPage(1);
    } catch (error: any) {
      toast.error("Gagal memuat matriks program: " + (error?.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAlgorithms();
  }, []);

  // Daftar kategori unik dari 4.800 data asli
  const uniqueGenders = useMemo(() => {
    return Array.from(
      new Set(algorithms.map((a) => String(a.gender || "").trim()).filter(Boolean))
    );
  }, [algorithms]);

  const uniqueTkjiList = useMemo(() => {
    return Array.from(
      new Set(algorithms.map((a) => a.tkji_category).filter(Boolean))
    );
  }, [algorithms]);

  const uniqueBmiList = useMemo(() => {
    return Array.from(
      new Set(algorithms.map((a) => a.bmi_category).filter(Boolean))
    );
  }, [algorithms]);

  const uniquePhasesSummary = useMemo(() => {
    const map: Record<string, { count: number; avgMin: number; sumMin: number }> =
      {};
    algorithms.forEach((a) => {
      const ph = String(a.phase || "Fase Umum").trim();
      if (!map[ph]) map[ph] = { count: 0, avgMin: 0, sumMin: 0 };
      map[ph].count += 1;
      map[ph].sumMin += Number(a.duration_min) || 0;
    });
    return Object.entries(map).map(([name, st]) => ({
      name,
      count: st.count,
      avgMin: st.count > 0 ? Math.round(st.sumMin / st.count) : 0,
    }));
  }, [algorithms]);

  // Filter Reaktif di Memori untuk 4.800+ Baris (Instan 0ms)
  const filteredAlgorithms = useMemo(() => {
    return algorithms.filter((item) => {
      if (filterGender !== "all" && String(item.gender) !== filterGender)
        return false;
      if (filterTkji !== "all" && String(item.tkji_category) !== filterTkji)
        return false;
      if (filterBmi !== "all" && String(item.bmi_category) !== filterBmi)
        return false;
      if (filterWeek !== "all" && Number(item.week) !== filterWeek)
        return false;
      if (filterPhase !== "all" && String(item.phase) !== filterPhase)
        return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.program_name || "").toLowerCase().includes(q) ||
        String(item.phase || "").toLowerCase().includes(q) ||
        String(item.component || "").toLowerCase().includes(q) ||
        String(item.instruction_id || "").toLowerCase().includes(q) ||
        String(item.intensity || "").toLowerCase().includes(q)
      );
    });
  }, [
    algorithms,
    filterGender,
    filterTkji,
    filterBmi,
    filterWeek,
    filterPhase,
    searchQuery,
  ]);

  // Distribusi per Minggu (W1 - W8) untuk Grafik Batang Vertikal Bertitik di Bento 2
  const weekDistribution = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
      const count = algorithms.filter((item) => {
        if (filterGender !== "all" && String(item.gender) !== filterGender)
          return false;
        if (filterTkji !== "all" && String(item.tkji_category) !== filterTkji)
          return false;
        if (filterBmi !== "all" && String(item.bmi_category) !== filterBmi)
          return false;
        return Number(item.week) === w;
      }).length;
      return { week: w, count };
    });
  }, [algorithms, filterGender, filterTkji, filterBmi]);

  // Reset ke halaman 1 setiap filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterGender,
    filterTkji,
    filterBmi,
    filterWeek,
    filterPhase,
    searchQuery,
    itemsPerPage,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAlgorithms.length / itemsPerPage)
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAlgorithms.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Statistik Rata-rata Durasi & Istirahat
  const { avgDuration, avgRestSec } = useMemo(() => {
    if (filteredAlgorithms.length === 0)
      return { avgDuration: 0, avgRestSec: 0 };
    const sumDur = filteredAlgorithms.reduce(
      (acc, r) => acc + (Number(r.duration_min) || 0),
      0
    );
    const sumRest = filteredAlgorithms.reduce(
      (acc, r) => acc + (Number(r.rest_time_sec) || 0),
      0
    );
    return {
      avgDuration: Math.round(sumDur / filteredAlgorithms.length),
      avgRestSec: Math.round(sumRest / filteredAlgorithms.length),
    };
  }, [filteredAlgorithms]);

  const filterCoveragePct = useMemo(() => {
    if (algorithms.length === 0) return 0;
    return Math.round((filteredAlgorithms.length / algorithms.length) * 100);
  }, [filteredAlgorithms.length, algorithms.length]);

  const resetAllFilters = () => {
    setFilterGender("all");
    setFilterTkji("all");
    setFilterBmi("all");
    setFilterWeek("all");
    setFilterPhase("all");
    setSearchQuery("");
  };

  // ==========================================================================
  // CRUD OPERASI ALGORITMA
  // ==========================================================================
  const openCreateModal = () => {
    setIsCreating(true);
    setEditData({
      gender: uniqueGenders[0] || "L",
      component: "Daya Tahan Jantung-Paru",
      tkji_category: uniqueTkjiList[0] || "Sedang",
      bmi_category: uniqueBmiList[0] || "Normal",
      phase: uniquePhasesSummary[0]?.name || "Fase Adaptasi",
      week: 1,
      meeting: 1,
      program_name: "",
      instruction_id: "",
      intensity: "Sedang (RPE 5-6)",
      duration_min: 30,
      rest_time_sec: 60,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setIsCreating(false);
    setEditData({ ...row });
    setIsModalOpen(true);
  };

  const handleSaveAlgorithm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        gender: editData.gender,
        component: editData.component || "",
        tkji_category: editData.tkji_category,
        bmi_category: editData.bmi_category,
        phase: editData.phase,
        week: Number(editData.week) || 1,
        meeting: Number(editData.meeting) || 1,
        program_name: editData.program_name,
        instruction_id: editData.instruction_id || "",
        intensity: editData.intensity || "",
        duration_min: Number(editData.duration_min) || 25,
        rest_time_sec: Number(editData.rest_time_sec) || 60,
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from("fitness_algorithms")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setAlgorithms((prev) => [data, ...prev]);
        setTotalDbCount((prev) => prev + 1);
        toast.success("Algoritma program baru berhasil ditambahkan!");
      } else {
        const { error } = await supabase
          .from("fitness_algorithms")
          .update(payload)
          .eq("id", editData.id);
        if (error) throw error;
        setAlgorithms((prev) =>
          prev.map((alg) =>
            alg.id === editData.id ? { ...alg, ...payload } : alg
          )
        );
        toast.success("Algoritma berhasil diperbarui!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan algoritma: " + (err?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    toast("Hapus Algoritma Program", {
      description:
        "Yakin ingin menghapus baris kombinasi algoritma ini dari database?",
      action: {
        label: "Hapus",
        onClick: async () => {
          const { error } = await supabase
            .from("fitness_algorithms")
            .delete()
            .eq("id", id);
          if (error) return toast.error("Gagal menghapus data");
          setAlgorithms((prev) => prev.filter((a) => a.id !== id));
          setTotalDbCount((prev) => Math.max(0, prev - 1));
          toast.success("Baris algoritma dihapus!");
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const handleExportCSV = () => {
    if (filteredAlgorithms.length === 0)
      return toast.error("Tidak ada data untuk diekspor");
    const headers = [
      "Minggu",
      "Pertemuan",
      "Gender",
      "Kategori IMT",
      "Kategori TKJI",
      "Fase",
      "Komponen",
      "Nama Program",
      "Intensitas",
      "Durasi (Menit)",
      "Istirahat (Detik)",
    ];
    const rows = filteredAlgorithms.map((r) => [
      r.week,
      r.meeting,
      `"${r.gender || ""}"`,
      `"${r.bmi_category || ""}"`,
      `"${r.tkji_category || ""}"`,
      `"${r.phase || ""}"`,
      `"${r.component || ""}"`,
      `"${String(r.program_name || "").replace(/"/g, '""')}"`,
      `"${r.intensity || ""}"`,
      r.duration_min || 0,
      r.rest_time_sec || 0,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Matriks_Program_EduFit_${filteredAlgorithms.length}_Baris.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      `Berhasil mengekspor ${filteredAlgorithms.length.toLocaleString(
        "id-ID"
      )} baris program ke CSV!`
    );
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput("");
    } else {
      toast.error(`Masukkan nomor halaman antara 1 sampai ${totalPages}`);
    }
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

  if (!mounted) return null;

  const hasActiveFilter =
    filterGender !== "all" ||
    filterTkji !== "all" ||
    filterBmi !== "all" ||
    filterWeek !== "all" ||
    filterPhase !== "all" ||
    searchQuery.trim() !== "";

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <Dumbbell size={16} /> Mesin Rekomendasi Kebugaran FITT Kelas XII •{" "}
            {isLoading
              ? loadingProgress
              : `${totalDbCount.toLocaleString("id-ID")} Baris Tersinkron`}
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Matriks Program <br />
            <span className="font-semibold">8 Minggu</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : algorithms.length.toLocaleString("id-ID")}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Database Master
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {isLoading
                ? "—"
                : filteredAlgorithms.length.toLocaleString("id-ID")}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Hasil Filter Aktif
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : `${avgDuration}m`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Rata-rata Durasi
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI ALGORITMA (MURNI GARIS-GARIS TANPA PILL BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Siklus Kurikulum */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Siklus Kurikulum</span>
            <span>Kelas XII</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              8 Minggu · {uniquePhasesSummary.length || 4} Fase
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
              FITT
            </span>
          </div>
        </div>

        {/* Bar 2: Cakupan Filter Aktif */}
        <button
          type="button"
          onClick={resetAllFilters}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Rasio Filter Aktif</span>
            <span>{hasActiveFilter ? "Klik Reset" : "Seluruh Data"}</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : `${filterCoveragePct}% Tampil`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {filteredAlgorithms.length.toLocaleString("id-ID")} Baris
            </span>
          </div>
        </button>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kapasitas Mesin Rekomendasi</span>
            <span>Multi-Batch Range Sync</span>
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
              {isLoading
                ? loadingProgress
                : `${algorithms.length.toLocaleString("id-ID")} Algoritma Utuh`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              100% Sinkron
            </span>
          </div>
        </div>

        {/* Bar 4: Rata-rata Istirahat */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Jeda Pemulihan</span>
            <span>Rata-rata</span>
          </div>
          <div
            className="h-14 rounded-2xl px-5 flex items-center justify-center border"
            style={{
              backgroundColor: "var(--ref-card-solid)",
              borderColor: "var(--ref-card-border)",
              color: "var(--ref-text-primary)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading ? "—" : `${avgRestSec} dtk`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[400px])
         ==================================================================== */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10"
        ref={filterContainerRef}
      >
        {/* BENTO 1 (PATTERN POLKADOT HALUS): FILTER KOMBINASI GENDER, TKJI & IMT */}
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
            className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.08] rounded-[2.5rem] overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 2px, transparent 2px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-light tracking-tight">
                Filter Matriks
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={fetchAllAlgorithms}
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: "var(--ref-card-subtle)",
                    borderColor: "var(--ref-card-border)",
                  }}
                  title="Sinkron Ulang 4.800 Algoritma"
                >
                  <RotateCcw
                    size={15}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: "var(--ref-card-subtle)",
                    borderColor: "var(--ref-card-border)",
                  }}
                  title="Ekspor Hasil Filter ke CSV"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>
            <p className="text-sm mb-5 leading-relaxed font-medium opacity-50">
              Saring kombinasi berdasarkan profil jenis kelamin, predikat TKJI,
              dan indeks massa tubuh.
            </p>

            {/* Segmented Filter Gender (Kuning Emas = Gender Aktif) */}
            <div
              className="flex gap-1.5 p-1.5 rounded-full mb-5"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {["all", ...uniqueGenders].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGender(g)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      filterGender === g ? "#facc15" : "transparent",
                    color: filterGender === g ? "#000" : "inherit",
                    opacity: filterGender === g ? 1 : 0.5,
                  }}
                >
                  {g === "all"
                    ? "Semua"
                    : g === "L"
                    ? "Putra (L)"
                    : g === "P"
                    ? "Putri (P)"
                    : g}
                </button>
              ))}
            </div>

            {/* Bottom-Bordered Custom Dropdown TKJI */}
            <div className="relative w-full mb-4">
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "tkji" ? null : "tkji")
                }
                className="w-full bg-transparent border-b-2 py-2.5 text-xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  TKJI: {filterTkji === "all" ? "Semua Predikat" : filterTkji}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
                    openDropdown === "tkji" ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {openDropdown === "tkji" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-56 overflow-y-auto no-scrollbar"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  >
                    {["all", ...uniqueTkjiList].map((tk) => (
                      <div
                        key={tk}
                        onClick={() => {
                          setFilterTkji(tk);
                          setOpenDropdown(null);
                        }}
                        className={`px-5 py-3.5 text-base font-light cursor-pointer transition-colors ${
                          isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                        }`}
                        style={{
                          color:
                            filterTkji === tk
                              ? "#facc15"
                              : isDark
                              ? "#fff"
                              : "#000",
                        }}
                      >
                        {tk === "all" ? "Semua Predikat TKJI" : tk}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom-Bordered Custom Dropdown IMT */}
            <div className="relative w-full mb-5">
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "bmi" ? null : "bmi")
                }
                className="w-full bg-transparent border-b-2 py-2.5 text-xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  IMT: {filterBmi === "all" ? "Semua Kategori IMT" : filterBmi}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
                    openDropdown === "bmi" ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {openDropdown === "bmi" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden border max-h-56 overflow-y-auto no-scrollbar"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  >
                    {["all", ...uniqueBmiList].map((bm) => (
                      <div
                        key={bm}
                        onClick={() => {
                          setFilterBmi(bm);
                          setOpenDropdown(null);
                        }}
                        className={`px-5 py-3.5 text-base font-light cursor-pointer transition-colors ${
                          isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                        }`}
                        style={{
                          color:
                            filterBmi === bm
                              ? "#facc15"
                              : isDark
                              ? "#fff"
                              : "#000",
                        }}
                      >
                        {bm === "all" ? "Semua Kategori IMT" : bm}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white relative z-10"
            style={{ backgroundColor: "#10b981" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Baris Algoritma
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): DISTRIBUSI 8 MINGGU (VERTICAL PILL BARS + DOTS) */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[400px] border"
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
              <Calendar size={16} /> Distribusi Minggu W1 – W8
            </div>
            {filterWeek !== "all" && (
              <button
                type="button"
                onClick={() => setFilterWeek("all")}
                className="text-xs font-bold text-[#facc15] cursor-pointer"
              >
                Reset Minggu
              </button>
            )}
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light tracking-tighter leading-none">
              {filterWeek === "all" ? "8" : `W${filterWeek}`}
            </div>
            <div className="text-sm font-semibold opacity-50 mb-1">
              {filterWeek === "all"
                ? "Minggu Siklus Latihan"
                : "Minggu Sedang Difilter"}
            </div>
          </div>

          {(() => {
            const maxW = Math.max(1, ...weekDistribution.map((d) => d.count));

            return (
              <div className="grid grid-cols-8 gap-2.5 items-end pt-4 h-44 relative z-10">
                {weekDistribution.map((d) => {
                  const heightPct = Math.round((d.count / maxW) * 100);
                  const isSelected = filterWeek === d.week;

                  return (
                    <button
                      key={d.week}
                      type="button"
                      onClick={() =>
                        setFilterWeek(isSelected ? "all" : d.week)
                      }
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`Minggu ${d.week}: ${d.count.toLocaleString(
                        "id-ID"
                      )} Program`}
                    >
                      <span className="text-[10px] font-bold opacity-75">
                        {d.count}
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
                          className="w-full rounded-full transition-all duration-500 group-hover:scale-y-105"
                          style={{
                            height: `${Math.max(
                              d.count > 0 ? 18 : 8,
                              heightPct
                            )}%`,
                            backgroundColor:
                              isSelected || filterWeek === "all"
                                ? isSelected
                                  ? "#facc15"
                                  : "var(--ref-text-primary)"
                                : "var(--ref-text-muted)",
                          }}
                        />
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? "#facc15"
                            : "var(--ref-text-primary)",
                        }}
                      />
                      <span className="text-[10px] font-bold opacity-60">
                        W{d.week}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS ALGORITMA */}
        <div
          className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[400px] border"
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
              <Activity size={16} /> Indeks Dosis Latihan
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "filter", label: "Cakupan" },
                { key: "duration", label: "Durasi" },
                { key: "rest", label: "Jeda" },
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
              gaugeMode === "filter"
                ? `${filterCoveragePct}%`
                : gaugeMode === "duration"
                ? `${avgDuration}m`
                : `${avgRestSec}s`;

            const gaugeLabel =
              gaugeMode === "filter"
                ? `${filteredAlgorithms.length.toLocaleString(
                    "id-ID"
                  )} dari ${algorithms.length.toLocaleString("id-ID")}`
                : gaugeMode === "duration"
                ? "Rata-rata Durasi Sesi"
                : "Rata-rata Jeda Pemulihan";

            const gaugePct =
              gaugeMode === "filter"
                ? filterCoveragePct
                : gaugeMode === "duration"
                ? Math.min(100, Math.round((avgDuration / 45) * 100))
                : Math.min(100, Math.round((avgRestSec / 90) * 100));

            const radius = 58;
            const circumference = 2 * Math.PI * radius;
            const dashOffset =
              circumference - (Math.max(10, gaugePct) / 100) * circumference;

            return (
              <div className="relative flex items-center justify-center my-2 z-10">
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

          <div className="relative z-10">
            <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-3 border-t border-black/10 dark:border-white/10">
              <span>{uniqueTkjiList.length} Kategori TKJI</span>
              <span>•</span>
              <span>{uniqueBmiList.length} Kategori IMT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: GRID KARTU FASE LATIHAN (PASTEL LIGHT / OBSIDIAN DARK)
         ==================================================================== */}
      {uniquePhasesSummary.length > 0 && (
        <div className="mb-10 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-light tracking-tight">
              Fase Periodisasi Latihan ({uniquePhasesSummary.length} Fase)
            </h3>
            {filterPhase !== "all" && (
              <button
                type="button"
                onClick={() => setFilterPhase("all")}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#facc15] text-black cursor-pointer"
              >
                Tampilkan Semua Fase
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {uniquePhasesSummary.slice(0, 4).map((ph, index) => {
              const bgLight = bentoColors[index % bentoColors.length];
              const isSelected = filterPhase === ph.name;

              return (
                <div
                  key={ph.name}
                  onClick={() =>
                    setFilterPhase(isSelected ? "all" : ph.name)
                  }
                  className="p-7 rounded-[2.2rem] flex flex-col justify-between min-h-[210px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
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
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-65">
                      FASE 0{index + 1} • ~{ph.avgMin} MENIT
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <ArrowUpRight size={16} />
                    </div>
                  </div>

                  <div className="my-4 relative z-10">
                    <div className="text-2xl md:text-3xl font-light tracking-tight leading-tight">
                      {ph.name}
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-3 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-55">
                      Kombinasi Resep
                    </span>
                    <span className="text-2xl font-light leading-none">
                      {ph.count.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          ZONA 5: TABEL DIREKTORI 4.800 ALGORITMA & SMART PAGINATION
         ==================================================================== */}
      <div
        className="rounded-[2.5rem] p-8 md:p-10 border relative z-10 overflow-hidden shadow-sm"
        style={{
          backgroundColor: isDark ? "#111111" : "#ffffff",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.05)",
        }}
      >
        {/* Toolbar Minggu, Pencarian, & Jumlah Baris per Halaman */}
        <div
          className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 pb-6 mb-6 border-b"
          style={{
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterWeek("all")}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              style={{
                backgroundColor:
                  filterWeek === "all" ? "#facc15" : "transparent",
                color: filterWeek === "all" ? "#000" : "inherit",
                opacity: filterWeek === "all" ? 1 : 0.55,
              }}
            >
              Semua Minggu
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setFilterWeek(filterWeek === w ? "all" : w)}
                className="px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                style={{
                  backgroundColor: filterWeek === w ? "#facc15" : "transparent",
                  color: filterWeek === w ? "#000" : "inherit",
                  opacity: filterWeek === w ? 1 : 0.55,
                }}
              >
                W{w}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama latihan, komponen, atau intensitas..."
                className="w-full pl-11 pr-8 py-3 rounded-2xl text-xs font-semibold outline-none border"
                style={{
                  backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider opacity-50 mr-1">
                Baris:
              </span>
              {[25, 50, 100, 250].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setItemsPerPage(sz)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer"
                  style={{
                    backgroundColor:
                      itemsPerPage === sz
                        ? "var(--ref-dark-panel)"
                        : "transparent",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.1)",
                    color: itemsPerPage === sz ? "#fff" : "inherit",
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabel Utama */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr
                className="border-b text-[10px] uppercase tracking-widest font-bold opacity-50"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                <th className="pb-4 px-4">Sesi</th>
                <th className="pb-4 px-4">Profil (Gender · IMT · TKJI)</th>
                <th className="pb-4 px-4">Nama Program & Komponen</th>
                <th className="pb-4 px-4">Fase Latihan</th>
                <th className="pb-4 px-4 text-center">Dosis & Istirahat</th>
                <th className="pb-4 px-4 text-right">Pengaturan</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center animate-pulse font-light text-xl opacity-60"
                  >
                    {loadingProgress}
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center font-light text-lg opacity-50"
                  >
                    Tidak ada baris algoritma yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <td className="py-4 px-4">
                      <span
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold inline-block"
                        style={{
                          backgroundColor: "var(--ref-dark-panel)",
                          color: "#facc15",
                        }}
                      >
                        W{row.week} · M{row.meeting}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{row.gender}</span>
                        <span className="opacity-40">•</span>
                        <span className="font-semibold">
                          {row.bmi_category}
                        </span>
                        <span className="opacity-40">•</span>
                        <span className="text-emerald-500 font-bold">
                          {row.tkji_category}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-[340px]">
                      <p
                        className="font-bold truncate text-base"
                        title={row.program_name}
                      >
                        {row.program_name}
                      </p>
                      <p className="text-xs opacity-60 truncate">
                        {row.component || "Komponen Umum"}{" "}
                        {row.intensity ? `· ${row.intensity}` : ""}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                        {row.phase || "Umum"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-lg font-light">
                        {row.duration_min || 0} mnt
                      </span>
                      {row.rest_time_sec ? (
                        <span className="block text-[11px] opacity-50">
                          Jeda {row.rest_time_sec} dtk
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.05)",
                          }}
                          title="Edit Baris Algoritma"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                          title="Hapus Baris"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SMART PAGINATION FOOTER UNTUK 4.800+ DATA */}
        {!isLoading && filteredAlgorithms.length > 0 && (
          <div
            className="pt-6 mt-4 border-t flex flex-col lg:flex-row items-center justify-between gap-4"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            }}
          >
            <div className="text-xs font-bold uppercase tracking-widest opacity-60">
              Menampilkan{" "}
              <strong className="opacity-100">
                {(indexOfFirstItem + 1).toLocaleString("id-ID")} –{" "}
                {Math.min(
                  indexOfLastItem,
                  filteredAlgorithms.length
                ).toLocaleString("id-ID")}
              </strong>{" "}
              dari{" "}
              <strong className="opacity-100">
                {filteredAlgorithms.length.toLocaleString("id-ID")}
              </strong>{" "}
              Program (Database Utuh: {totalDbCount.toLocaleString("id-ID")})
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border disabled:opacity-30 cursor-pointer"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.1)",
                }}
                title="Halaman Pertama"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border disabled:opacity-30 cursor-pointer"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.1)",
                }}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className="min-w-[38px] h-9 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor:
                      currentPage === num ? "#facc15" : "transparent",
                    borderColor:
                      currentPage === num
                        ? "#facc15"
                        : isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(0,0,0,0.1)",
                    color: currentPage === num ? "#000" : "inherit",
                  }}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border disabled:opacity-30 cursor-pointer"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.1)",
                }}
                title="Halaman Berikutnya"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border disabled:opacity-30 cursor-pointer"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.1)",
                }}
                title="Halaman Terakhir"
              >
                <ChevronsRight size={15} />
              </button>

              <form
                onSubmit={handleJumpPage}
                className="flex items-center gap-1.5 ml-2"
              >
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder={`Hal (1-${totalPages})`}
                  className="w-28 px-3 py-2 rounded-xl text-xs font-bold border outline-none bg-transparent"
                  style={{
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.15)",
                  }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  style={{
                    backgroundColor: isDark ? "#ffffff" : "#18181b",
                    color: isDark ? "#18181b" : "#ffffff",
                  }}
                >
                  Lompat
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL TAMBAH / EDIT ALGORITMA (GAYA MASTERPIECE)
         ==================================================================== */}
      <AnimatePresence>
        {isModalOpen && editData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
              style={{
                backgroundColor: isDark ? "#141414" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <span className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-1">
                Matriks Kebugaran Kelas XII
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                {isCreating ? "Tambah" : "Edit"}{" "}
                <span className="font-semibold">Baris Algoritma</span>
              </h2>

              <form onSubmit={handleSaveAlgorithm} className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Minggu (1-8)
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={8}
                      value={editData.week}
                      onChange={(e) =>
                        setEditData({ ...editData, week: e.target.value })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Pertemuan
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={7}
                      value={editData.meeting}
                      onChange={(e) =>
                        setEditData({ ...editData, meeting: e.target.value })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Gender
                    </label>
                    <input
                      required
                      type="text"
                      value={editData.gender}
                      onChange={(e) =>
                        setEditData({ ...editData, gender: e.target.value })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Fase Latihan
                    </label>
                    <input
                      required
                      type="text"
                      value={editData.phase || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, phase: e.target.value })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Kategori IMT
                    </label>
                    <input
                      required
                      type="text"
                      value={editData.bmi_category || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          bmi_category: e.target.value,
                        })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Kategori TKJI
                    </label>
                    <input
                      required
                      type="text"
                      value={editData.tkji_category || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          tkji_category: e.target.value,
                        })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                    Nama Program Utama & Instruksi Latihan
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editData.program_name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, program_name: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl text-sm font-medium border resize-y outline-none bg-transparent"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Durasi (Menit)
                    </label>
                    <input
                      required
                      type="number"
                      value={editData.duration_min || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          duration_min: e.target.value,
                        })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Istirahat (Detik)
                    </label>
                    <input
                      type="number"
                      value={editData.rest_time_sec || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          rest_time_sec: e.target.value,
                        })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      Intensitas
                    </label>
                    <input
                      type="text"
                      value={editData.intensity || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, intensity: e.target.value })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                      ID Instruksi
                    </label>
                    <input
                      type="text"
                      value={editData.instruction_id || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          instruction_id: e.target.value,
                        })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md text-white"
                  style={{ backgroundColor: "#10b981" }}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : "Simpan Algoritma Program"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}