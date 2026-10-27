// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Dumbbell,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

export default function ProgramPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [totalDbCount, setTotalDbCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] =
    useState<string>("Memuat matriks...");

  // Dynamic Island Alert State
  const [islandAlert, setIslandAlert] = useState<IslandNotification | null>(null);
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

  // Filter State
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
  // ==========================================================================
  const fetchAllAlgorithms = useCallback(
    async (notifySuccess = false) => {
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

        if (notifySuccess) {
          triggerDynamicIsland(
            "Matriks FITT Disinkronkan",
            `${combined.length.toLocaleString("id-ID")} baris resep algoritma berhasil dimuat.`,
            "success"
          );
        }
      } catch (error: any) {
        toast.error("Gagal memuat matriks program: " + (error?.message || ""));
        triggerDynamicIsland(
          "Gagal Memuat Matriks FITT",
          error?.message || "Periksa koneksi ke tabel fitness_algorithms.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [triggerDynamicIsland]
  );

  useEffect(() => {
    fetchAllAlgorithms(false);
  }, [fetchAllAlgorithms]);

  // Daftar kategori unik dari 4.800 data asli
  const uniqueGenders = useMemo(() => {
    return Array.from(
      new Set(
        algorithms.map((a) => String(a.gender || "").trim()).filter(Boolean)
      )
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
    const map: Record<
      string,
      { count: number; avgMin: number; sumMin: number }
    > = {};
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
    triggerDynamicIsland(
      "Seluruh Filter Direset",
      `Menampilkan utuh ${algorithms.length.toLocaleString("id-ID")} baris matriks algoritma.`,
      "info"
    );
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
        gender: String(editData.gender || "L").trim(),
        component: String(editData.component || "").trim(),
        tkji_category: String(editData.tkji_category || "").trim(),
        bmi_category: String(editData.bmi_category || "").trim(),
        phase: String(editData.phase || "").trim(),
        week: Number(editData.week) || 1,
        meeting: Number(editData.meeting) || 1,
        program_name: String(editData.program_name || "").trim(),
        instruction_id: String(editData.instruction_id || "").trim(),
        intensity: String(editData.intensity || "").trim(),
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
        triggerDynamicIsland(
          "Baris Algoritma Ditambahkan",
          `W${payload.week}·M${payload.meeting} (${payload.gender} · ${payload.bmi_category} · ${payload.tkji_category})`,
          "success"
        );
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
        triggerDynamicIsland(
          "Baris Algoritma Diperbarui",
          `Resep W${payload.week}·M${payload.meeting} (${payload.program_name}) telah disimpan.`,
          "success"
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan algoritma: " + (err?.message || ""));
      triggerDynamicIsland(
        "Gagal Menyimpan Algoritma",
        err?.message || "Periksa kebijakan RLS pada fitness_algorithms.",
        "error"
      );
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
          triggerDynamicIsland(
            "Baris Algoritma Dihapus",
            "Kombinasi resep latihan telah dihapus dari matriks.",
            "info"
          );
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
    triggerDynamicIsland(
      "Matriks FITT Diekspor ke CSV",
      `${filteredAlgorithms.length.toLocaleString("id-ID")} baris program latihan berhasil diunduh.`,
      "success"
    );
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput("");
      triggerDynamicIsland(
        `Lompat ke Halaman ${p}`,
        `Menampilkan baris ke-${((p - 1) * itemsPerPage + 1).toLocaleString(
          "id-ID"
        )}.`,
        "info"
      );
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

  if (!mounted) return null;

  const hasActiveFilter =
    filterGender !== "all" ||
    filterTkji !== "all" ||
    filterBmi !== "all" ||
    filterWeek !== "all" ||
    filterPhase !== "all" ||
    searchQuery.trim() !== "";

  const genderChoicesForModal =
    uniqueGenders.length > 0 ? uniqueGenders : ["L", "P"];

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* ====================================================================
          DYNAMIC ISLAND OVERLAY (MURNI MENGGUNAKAN CLASS GLOBALS.CSS)
         ==================================================================== */}
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

      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">
              00 / MESIN ALGORITMA FITT
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell size={15} />
              Rekomendasi Kebugaran Kelas XII
            </span>
            <span>—</span>
            <span className="font-mono">
              {isLoading
                ? loadingProgress
                : `${totalDbCount.toLocaleString("id-ID")} BARIS TERSINKRON`}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Matriks Program <br />
            <span className="font-semibold">8 Minggu</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : algorithms.length.toLocaleString("id-ID")}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              01 / Database Master
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading
                ? "—"
                : filteredAlgorithms.length.toLocaleString("id-ID")}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              02 / Hasil Filter Aktif
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : `${avgDuration}m`}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              03 / Rata-rata Durasi
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI ALGORITMA
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Siklus Kurikulum */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Siklus Kurikulum</span>
            <span className="font-mono">KELAS XII</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              8 Minggu · {uniquePhasesSummary.length || 4} Fase
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider opacity-70">
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
            <span className="font-mono">
              {hasActiveFilter ? "KLIK RESET" : "SELURUH DATA"}
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${filterCoveragePct}% Tampil`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider">
              {filteredAlgorithms.length.toLocaleString("id-ID")} BARIS
            </span>
          </div>
        </button>

        {/* Bar 3: Striped Track Murni */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kapasitas Mesin Rekomendasi</span>
            <span className="font-mono">MULTI-BATCH SYNC</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10 truncate pr-2">
              {isLoading
                ? loadingProgress
                : `${algorithms.length.toLocaleString("id-ID")} Algoritma`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-widest opacity-65 relative z-10 shrink-0">
              100% SINKRON
            </span>
          </div>
        </div>

        {/* Bar 4: Rata-rata Istirahat */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Jeda Pemulihan</span>
            <span className="font-mono">RATA-RATA</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${avgRestSec} dtk`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (POLKADOT + GRID MILIMETER + DIAGONAL)
         ==================================================================== */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10"
        ref={filterContainerRef}
      >
        {/* BENTO 1 (PATTERN POLKADOT HALUS): FILTER KOMBINASI GENDER, TKJI & IMT */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[400px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55">
                <span className="font-mono">01 /</span>
                <SlidersHorizontal size={14} />
                <span>Parameter Profil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchAllAlgorithms(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                  title="Ekspor Hasil Filter ke CSV"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Filter Matriks
            </h2>
            <p className="text-sm mb-5 leading-relaxed font-medium opacity-55">
              Saring kombinasi berdasarkan profil jenis kelamin, predikat TKJI,
              dan indeks massa tubuh.
            </p>

            {/* Segmented Filter Gender */}
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-5 edufit-surface-subtle">
              {["all", ...uniqueGenders].map((g) => {
                const active = filterGender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFilterGender(g)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {g === "all"
                      ? "Semua"
                      : g === "L"
                      ? "Putra (L)"
                      : g === "P"
                      ? "Putri (P)"
                      : g}
                  </button>
                );
              })}
            </div>

            {/* Bottom-Bordered Custom Dropdown TKJI */}
            <div className="relative w-full mb-4">
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "tkji" ? null : "tkji")
                }
                className={`w-full bg-transparent py-2.5 text-xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  openDropdown === "tkji" ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  TKJI: {filterTkji === "all" ? "Semua Predikat" : filterTkji}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
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
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    {["all", ...uniqueTkjiList].map((tk) => (
                      <div
                        key={tk}
                        onClick={() => {
                          setFilterTkji(tk);
                          setOpenDropdown(null);
                        }}
                        className={`px-5 py-3.5 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                          filterTkji === tk ? "text-gold-accent" : ""
                        }`}
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
                className={`w-full bg-transparent py-2.5 text-xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  openDropdown === "bmi" ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  IMT: {filterBmi === "all" ? "Semua Kategori IMT" : filterBmi}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
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
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    {["all", ...uniqueBmiList].map((bm) => (
                      <div
                        key={bm}
                        onClick={() => {
                          setFilterBmi(bm);
                          setOpenDropdown(null);
                        }}
                        className={`px-5 py-3.5 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                          filterBmi === bm ? "text-gold-accent" : ""
                        }`}
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
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md relative z-10 btn-forest-emerald"
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Baris Algoritma
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): DISTRIBUSI 8 MINGGU */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[400px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">02 /</span>
              <Calendar size={15} />
              <span>Distribusi Minggu W1 – W8</span>
            </div>
            {filterWeek !== "all" && (
              <button
                type="button"
                onClick={() => setFilterWeek("all")}
                className="text-xs font-bold font-mono text-gold-accent cursor-pointer hover:underline"
              >
                RESET MINGGU
              </button>
            )}
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {filterWeek === "all" ? "8" : `W${filterWeek}`}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
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
                  const fillClass = isSelected
                    ? "chart-fill-gold"
                    : filterWeek === "all"
                    ? "chart-fill-primary"
                    : "opacity-35 chart-fill-primary";

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
                      <span className="text-[10px] font-bold font-mono opacity-80">
                        {d.count}
                      </span>
                      <div className="w-3 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div
                          className={`w-full rounded-full transition-all duration-500 group-hover:scale-y-105 ${fillClass}`}
                          style={{
                            height: `${Math.max(
                              d.count > 0 ? 18 : 8,
                              heightPct
                            )}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? "chart-fill-gold" : "chart-fill-primary"
                        }`}
                      />
                      <span className="text-[10px] font-bold font-mono opacity-65">
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
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[400px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">03 /</span>
              <Activity size={15} />
              <span>Indeks Dosis Latihan</span>
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
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "edufit-surface-subtle"
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
                      gaugeMode === "duration"
                        ? "gauge-circle-emerald"
                        : "gauge-circle-gold"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl font-light font-mono tracking-tighter leading-none">
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
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-3 border-t border-hairline">
              <span>{uniqueTkjiList.length} Kategori TKJI</span>
              <span>—</span>
              <span>{uniqueBmiList.length} Kategori IMT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: GRID KARTU FASE LATIHAN (PASTEL LIGHT / DEEP FOREST DARK)
         ==================================================================== */}
      {uniquePhasesSummary.length > 0 && (
        <div className="mb-10 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-50 mb-1">
                04 / TAHAPAN PERIODISASI
              </div>
              <h3 className="text-2xl font-light tracking-tight">
                Fase Periodisasi Latihan ({uniquePhasesSummary.length} Fase)
              </h3>
            </div>
            {filterPhase !== "all" && (
              <button
                type="button"
                onClick={() => setFilterPhase("all")}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer btn-forest-gold"
              >
                Tampilkan Semua Fase
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {uniquePhasesSummary.slice(0, 4).map((ph, index) => {
              const showcaseClass =
                BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
              const isSelected = filterPhase === ph.name;

              return (
                <div
                  key={ph.name}
                  onClick={() => setFilterPhase(isSelected ? "all" : ph.name)}
                  className={`p-7 rounded-[2rem] flex flex-col justify-between min-h-[210px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass} ${
                    isSelected ? "bento-showcase-selected" : ""
                  }`}
                >
                  <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-[10px] font-bold font-mono tracking-widest uppercase opacity-70">
                      FASE 0{index + 1} · ~{ph.avgMin} MENIT
                    </span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
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
                    <span className="text-2xl font-light font-mono leading-none">
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
      <div className="rounded-[2rem] p-8 md:p-10 relative z-10 overflow-hidden edufit-card-primary">
        <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

        {/* Toolbar Minggu, Pencarian, & Jumlah Baris per Halaman */}
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 pb-6 mb-6 border-b border-hairline">
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl edufit-surface-subtle">
            <button
              type="button"
              onClick={() => setFilterWeek("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterWeek === "all" ? "seg-btn-active" : "seg-btn-idle"
              }`}
            >
              Semua Minggu
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
              const active = filterWeek === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setFilterWeek(active ? "all" : w)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    active ? "seg-btn-active" : "seg-btn-idle"
                  }`}
                >
                  W{w}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama latihan, komponen, atau intensitas..."
                className="w-full pl-11 pr-8 py-3.5 rounded-2xl text-xs font-semibold outline-none edufit-surface-subtle"
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

            <div className="flex items-center gap-1.5 p-1 rounded-2xl edufit-surface-subtle">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider opacity-60 px-2">
                BARIS:
              </span>
              {[25, 50, 100, 250].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setItemsPerPage(sz)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer ${
                    itemsPerPage === sz
                      ? "telemetry-bar-forest"
                      : "seg-btn-idle"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabel Utama */}
        <div className="relative z-10 overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-hairline text-[10px] font-mono uppercase tracking-widest font-bold opacity-55">
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
                    className="border-b border-hairline transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    <td className="py-4 px-4">
                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono inline-block telemetry-bar-forest text-gold-accent">
                        W{row.week} · M{row.meeting}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold px-2 py-0.5 rounded-md edufit-surface-subtle">
                          {row.gender}
                        </span>
                        <span className="opacity-40">—</span>
                        <span className="font-semibold">
                          {row.bmi_category}
                        </span>
                        <span className="opacity-40">—</span>
                        <span className="text-emerald-accent font-bold">
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
                    <td className="py-4 px-4 text-center font-mono">
                      <span className="text-lg font-light">
                        {row.duration_min || 0} mnt
                      </span>
                      {row.rest_time_sec ? (
                        <span className="block text-[11px] opacity-55">
                          Jeda {row.rest_time_sec} dtk
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer edufit-surface-subtle hover:opacity-80"
                          title="Edit Baris Algoritma"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
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
          <div className="relative z-10 pt-6 mt-4 border-t border-hairline flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold font-mono uppercase tracking-widest opacity-65">
              MENAMPILKAN{" "}
              <strong className="opacity-100 text-emerald-accent">
                {(indexOfFirstItem + 1).toLocaleString("id-ID")} –{" "}
                {Math.min(
                  indexOfLastItem,
                  filteredAlgorithms.length
                ).toLocaleString("id-ID")}
              </strong>{" "}
              DARI{" "}
              <strong className="opacity-100">
                {filteredAlgorithms.length.toLocaleString("id-ID")}
              </strong>{" "}
              PROGRAM (MASTER: {totalDbCount.toLocaleString("id-ID")})
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl disabled:opacity-30 cursor-pointer edufit-surface-subtle"
                title="Halaman Pertama"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl disabled:opacity-30 cursor-pointer edufit-surface-subtle"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`min-w-[38px] h-9 px-3 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer ${
                    currentPage === num
                      ? "seg-btn-active"
                      : "edufit-surface-subtle"
                  }`}
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
                className="p-2.5 rounded-xl disabled:opacity-30 cursor-pointer edufit-surface-subtle"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl disabled:opacity-30 cursor-pointer edufit-surface-subtle"
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
                  className="w-28 px-3 py-2 rounded-xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer telemetry-bar-forest"
                >
                  Lompat
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL TAMBAH / EDIT ALGORITMA (DILENGKAPI FIELD KOMPONEN & PEMILIH GENDER)
         ==================================================================== */}
      <AnimatePresence>
        {isModalOpen && editData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                KONFIGURASI RESEP FITT · KELAS XII
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                {isCreating ? "Tambah" : "Edit"}{" "}
                <span className="font-semibold">Baris Algoritma</span>
              </h2>

              <form onSubmit={handleSaveAlgorithm} className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                      Gender (Sinkron Akun Siswa)
                    </label>
                    <div className="flex gap-1.5 p-1 rounded-2xl edufit-surface-subtle">
                      {genderChoicesForModal.map((gChoice) => {
                        const active = String(editData.gender) === gChoice;
                        return (
                          <button
                            key={gChoice}
                            type="button"
                            onClick={() =>
                              setEditData({ ...editData, gender: gChoice })
                            }
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                              active ? "seg-btn-active" : "seg-btn-idle"
                            }`}
                          >
                            {gChoice === "L"
                              ? "Putra (L)"
                              : gChoice === "P"
                              ? "Putri (P)"
                              : gChoice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                      Fase Periodisasi Latihan
                    </label>
                    <input
                      required
                      type="text"
                      value={editData.phase || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, phase: e.target.value })
                      }
                      placeholder="Contoh: Fase Adaptasi"
                      className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                      Komponen Kebugaran Jasmani
                    </label>
                    <input
                      required
                      type="text"
                      value={editData.component || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, component: e.target.value })
                      }
                      placeholder="Contoh: Daya Tahan Jantung-Paru"
                      className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none edufit-surface-subtle"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none edufit-surface-subtle"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Nama Program Utama & Instruksi Latihan
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editData.program_name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, program_name: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl text-sm font-medium resize-y outline-none edufit-surface-subtle"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                      Intensitas
                    </label>
                    <input
                      type="text"
                      value={editData.intensity || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, intensity: e.target.value })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
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
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-emerald"
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