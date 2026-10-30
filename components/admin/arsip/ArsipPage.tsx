// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Archive,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  History,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface IslandNotification {
  id: number;
  message: string;
  subtitle?: string;
  type: "success" | "error" | "info";
}

export default function ArsipPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [archives, setArchives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<"retention" | "students" | "years">(
    "retention"
  );

  // Custom Dropdown State
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // State Modal Detail Arsip
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null);

  // Dynamic Island Alert State
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

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target as Node)
      ) {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchArchives = useCallback(
    async (showNotification = false) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("legacy_archives")
          .select("*, user_profiles(full_name, email, gender)")
          .order("archived_at", { ascending: false });
        if (error) throw error;
        const list = data || [];
        setArchives(list);
        const years = Array.from(
          new Set(list.map((item: any) => item.academic_year).filter(Boolean))
        ) as string[];
        setUniqueYears(years);

        if (showNotification) {
          triggerDynamicIsland(
            "Brankas Legacy Disinkronkan",
            `Berhasil memuat ${list.length} rekaman arsip dari ${years.length} periode tahun ajaran.`,
            "success"
          );
        }
      } catch (error: any) {
        toast.error("Gagal menarik data arsip");
        triggerDynamicIsland(
          "Gagal Memuat Brankas Arsip",
          "Periksa koneksi server atau izin tabel legacy_archives.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [triggerDynamicIsland]
  );

  useEffect(() => {
    fetchArchives(false);
  }, [fetchArchives]);

  const parseSummaryObject = (raw: any): Record<string, any> => {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return { Catatan: String(raw) };
    }
  };

  const filteredArchives = useMemo(() => {
    return archives.filter((a) => {
      const matchYear = filterYear === "all" || a.academic_year === filterYear;
      if (!matchYear) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const studentName = String(
        a.user_profiles?.full_name || ""
      ).toLowerCase();
      const yearStr = String(a.academic_year || "").toLowerCase();
      const summaryObj = parseSummaryObject(a.summary_data);
      const summaryText = JSON.stringify(summaryObj).toLowerCase();

      return (
        studentName.includes(q) ||
        yearStr.includes(q) ||
        summaryText.includes(q)
      );
    });
  }, [archives, filterYear, searchQuery]);

  const latestAcademicYear = useMemo(() => {
    if (uniqueYears.length === 0) return "—";
    const parsedNums = uniqueYears
      .map((y) => parseInt(String(y).split("/")[0], 10))
      .filter((n) => !isNaN(n));
    if (parsedNums.length === 0) return uniqueYears[0];
    const maxStart = Math.max(...parsedNums);
    return `${maxStart}/${maxStart + 1}`;
  }, [uniqueYears]);

  const uniqueStudentsCount = useMemo(() => {
    return new Set(archives.map((a) => a.student_id).filter(Boolean)).size;
  }, [archives]);

  const yearDistribution = useMemo(() => {
    return uniqueYears.map((yr) => {
      const cnt = archives.filter((a) => a.academic_year === yr).length;
      return { year: yr, count: cnt };
    });
  }, [archives, uniqueYears]);

  const getTkjiBadgeClass = (categoryStr: string) => {
    const lower = String(categoryStr || "").toLowerCase();
    if (lower.includes("baik")) return "badge-tint-emerald";
    if (lower.includes("sedang")) return "badge-tint-sky";
    if (lower.includes("kurang")) return "badge-tint-rose";
    return "edufit-surface-subtle";
  };

  const handleDeleteArchive = (row: any) => {
    const studentName = row.user_profiles?.full_name || "Siswa";
    toast("Hapus Rekaman Arsip", {
      description: `Yakin ingin menghapus arsip tahun ${row.academic_year} milik ${studentName}?`,
      action: {
        label: "Hapus",
        onClick: async () => {
          const { error } = await supabase
            .from("legacy_archives")
            .delete()
            .eq("id", row.id);
          if (error) {
            toast.error("Gagal menghapus arsip");
            triggerDynamicIsland(
              "Penghapusan Gagal",
              "Rekaman arsip tidak dapat dihapus dari sistem.",
              "error"
            );
          } else {
            triggerDynamicIsland(
              "Rekaman Arsip Dihapus",
              `Arsip tahun ${row.academic_year} milik ${studentName} telah dihapus.`,
              "info"
            );
            if (selectedArchive?.id === row.id) setSelectedArchive(null);
            fetchArchives(false);
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const handleExportCSV = () => {
    if (filteredArchives.length === 0) {
      triggerDynamicIsland(
        "Brankas Kosong pada Filter Ini",
        "Tidak ada baris data arsip untuk diekspor ke CSV.",
        "error"
      );
      return;
    }
    const headers = [
      "Tahun Ajaran",
      "Nama Siswa",
      "Rata-rata Pretest",
      "Rata-rata Posttest",
      "Kategori TKJI",
      "Tanggal Arsip",
    ];
    const rows = filteredArchives.map((row) => {
      const parsed = parseSummaryObject(row.summary_data);
      return [
        `"${row.academic_year || "-"}"`,
        `"${row.user_profiles?.full_name || "Tanpa Nama"}"`,
        `"${parsed.pretest_avg ?? "-"}"`,
        `"${parsed.posttest_avg ?? "-"}"`,
        `"${parsed.tkji_category ?? "-"}"`,
        `"${new Date(row.archived_at).toLocaleDateString("id-ID")}"`,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Arsip_EduFit_${
        filterYear === "all" ? "Semua" : filterYear.replace("/", "-")
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerDynamicIsland(
      "Ekspor CSV Brankas Berhasil",
      `${filteredArchives.length} rekaman arsip (${
        filterYear === "all" ? "Semua Tahun" : filterYear
      }) telah diunduh.`,
      "success"
    );
  };

  if (!mounted) return null;

  return (
    <div className="edufit-admin-theme w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* ====================================================================
          DYNAMIC ISLAND OVERLAY
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
          ZONA 1: HERO HEADER & 3 ANGKA UTAMA
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 mb-10 border-b border-hairline relative z-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-65">
            <span className="text-gold-accent">BRANKAS LEGACY</span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Archive size={15} />
              Penyimpanan Jangka Panjang Akademik & Fisik
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Arsip Akademik & <br />
            <span className="font-semibold">Fisik Siswa</span>
          </h1>
        </div>

        {/* 3 Angka Utama */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : archives.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Total Rekaman
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-gold-accent">
              {isLoading ? "—" : uniqueStudentsCount}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Siswa Terarsip
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : uniqueYears.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Tahun Ajaran
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI ARSIP
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Periode Terakhir */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Periode Terakhir</span>
            <span className="font-mono">AKTIF</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : latestAcademicYear}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-accent">
              Legacy
            </span>
          </div>
        </div>

        {/* Bar 2: Hasil Filter Aktif */}
        <button
          type="button"
          onClick={() => {
            setFilterYear("all");
            triggerDynamicIsland(
              "Filter Tahun Direset",
              `Menampilkan seluruh ${archives.length} rekaman arsip.`,
              "info"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Tahun Filter</span>
            <span className="font-mono">
              {filterYear === "all" ? "SEMUA" : filterYear}
            </span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${filteredArchives.length} Data`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Tampil
            </span>
          </div>
        </button>

        {/* Bar 3: Striped Track */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kapasitas Brankas Arsip</span>
            <span className="font-mono">RETENSI PERMANEN</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${archives.length} Rekaman`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-65 relative z-10">
              Aman Terenkripsi
            </span>
          </div>
        </div>

        {/* Bar 4: Total Angkatan */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Angkatan</span>
            <span className="font-mono">PERIODE</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-gold-accent">
              {isLoading ? "—" : `${uniqueYears.length} Tahun`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR
         ==================================================================== */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10"
        ref={yearDropdownRef}
      >
        {/* BENTO 1: KENDALI & FILTER TAHUN AJARAN */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
                <SlidersHorizontal size={14} />
                <span>Kendali Periode</span>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Unduh Rekap Arsip CSV"
              >
                <Download size={15} />
              </button>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Filter Brankas
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Pilih tahun ajaran akademik untuk meninjau rekam jejak kelulusan
              dan kebugaran siswa.
            </p>

            {/* Underline Dropdown Tahun */}
            <div className="relative w-full mb-6">
              <div
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isYearDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {filterYear === "all"
                    ? `Semua Tahun Ajaran (${archives.length})`
                    : `Tahun Ajaran ${filterYear}`}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isYearDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isYearDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu"
                  >
                    <div
                      onClick={() => {
                        setFilterYear("all");
                        setIsYearDropdownOpen(false);
                        triggerDynamicIsland(
                          "Menampilkan Seluruh Periode",
                          `${archives.length} rekaman arsip dari seluruh angkatan.`,
                          "info"
                        );
                      }}
                      className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        filterYear === "all" ? "text-gold-accent" : ""
                      }`}
                    >
                      Semua Tahun Ajaran ({archives.length} Rekaman)
                    </div>
                    {uniqueYears.map((yr) => (
                      <div
                        key={yr}
                        onClick={() => {
                          setFilterYear(yr);
                          setIsYearDropdownOpen(false);
                          triggerDynamicIsland(
                            `Filter Periode: ${yr}`,
                            "Menyaring tabel direktori berdasarkan tahun ajaran terpilih.",
                            "success"
                          );
                        }}
                        className={`px-6 py-4 text-base font-mono cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                          filterYear === yr ? "text-gold-accent" : ""
                        }`}
                      >
                        Tahun Ajaran {yr}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10 pt-2">
            <button
              type="button"
              onClick={() => fetchArchives(true)}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm telemetry-bar-forest"
            >
              <RotateCcw
                size={15}
                className={isLoading ? "animate-spin" : ""}
              />{" "}
              Muat Ulang
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm btn-forest-gold"
            >
              <Download size={15} /> Ekspor CSV
            </button>
          </div>
        </div>

        {/* BENTO 2: GRAFIK BATANG DISTRIBUSI PER TAHUN */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <History size={15} />
              <span>Distribusi per Tahun</span>
            </div>
            <span className="text-xs font-bold font-mono text-gold-accent">
              {uniqueYears.length} PERIODE
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : archives.length}
            </div>
            <div className="text-sm font-semibold opacity-60 mb-1">
              Total Arsip Tersimpan
            </div>
          </div>

          {(() => {
            const bars = yearDistribution.slice(0, 6);
            const maxCnt = Math.max(1, ...bars.map((b) => b.count));

            return (
              <div className="pt-4 pb-1 relative z-10">
                <div
                  className="grid gap-2.5 items-end h-44 px-3 py-3 rounded-2xl edufit-card-primary"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(
                      1,
                      bars.length
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {bars.length === 0 ? (
                    <div className="col-span-full h-full flex items-center justify-center text-xs opacity-50">
                      Belum ada distribusi tahun ajaran
                    </div>
                  ) : (
                    bars.map((bar, idx) => {
                      const heightPct = Math.round((bar.count / maxCnt) * 100);
                      const isSelected = filterYear === bar.year;
                      const fillClass = isSelected
                        ? "chart-fill-emerald"
                        : idx === 0
                        ? "chart-fill-gold"
                        : "chart-fill-primary";

                      return (
                        <button
                          key={bar.year}
                          type="button"
                          onClick={() => {
                            const nextYr = isSelected ? "all" : bar.year;
                            setFilterYear(nextYr);
                            triggerDynamicIsland(
                              nextYr === "all"
                                ? "Filter Tahun Direset"
                                : `Fokus Tahun Ajaran ${bar.year}`,
                              `${bar.count} rekaman siswa tersimpan pada periode ini.`,
                              "info"
                            );
                          }}
                          className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                          title={`Tahun ${bar.year}: ${bar.count} Arsip`}
                        >
                          <span
                            className={`text-[10px] font-bold font-mono transition-opacity ${
                              isSelected || idx === 0
                                ? "opacity-100 text-gold-accent"
                                : "opacity-65 group-hover:opacity-100"
                            }`}
                          >
                            {bar.count}
                          </span>
                          <div className="w-5 flex-1 rounded-xl flex items-end overflow-hidden p-0.5 chart-track-pill">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${Math.max(
                                  bar.count > 0 ? 14 : 4,
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
                            {bar.year.split("/")[0]}
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

        {/* BENTO 3: INDEKS RETENSI ARSIP (TEKS LABEL DI LUAR LINGKARAN CHART) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[410px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} />
              <span>Indeks Retensi Arsip</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
              {[
                { key: "retention", label: "Arsip" },
                { key: "students", label: "Siswa" },
                { key: "years", label: "Tahun" },
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
              gaugeMode === "retention"
                ? `${archives.length}`
                : gaugeMode === "students"
                ? `${uniqueStudentsCount}`
                : `${uniqueYears.length}`;

            const gaugeLabel =
              gaugeMode === "retention"
                ? "Total Rekaman Brankas Tersimpan"
                : gaugeMode === "students"
                ? "Total Siswa Unik Terarsip"
                : "Periode Tahun Ajaran Tersimpan";

            const gaugePct =
              gaugeMode === "retention"
                ? Math.min(100, archives.length * 2)
                : gaugeMode === "students"
                ? Math.min(100, uniqueStudentsCount * 5)
                : Math.min(100, uniqueYears.length * 25);

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
                        gaugeMode === "students"
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
            <div className="flex justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-3 border-t border-hairline">
              <span>{uniqueStudentsCount} Siswa Unik</span>
              <span>—</span>
              <span>{latestAcademicYear} Terbaru</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: TABEL DIREKTORI ARSIP JANGKA PANJANG
         ==================================================================== */}
      <div className="rounded-[2rem] p-8 md:p-10 relative z-10 overflow-hidden edufit-card-primary">
        <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-6 mb-8 pb-6 border-b border-hairline">
          <div>
            <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest mb-2">
              <Archive size={15} className="text-gold-accent" />
              <span>Direktori Brankas Legacy</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Rekaman Arsip Siswa ({filteredArchives.length})
            </h2>
          </div>

          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, tahun, atau ringkasan..."
              className="w-full pl-11 pr-9 py-3.5 rounded-2xl text-xs font-semibold outline-none transition-colors edufit-surface-subtle"
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
        </div>

        <div className="relative z-10 overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-hairline text-[10px] font-mono uppercase tracking-widest font-bold opacity-55">
                <th className="pb-4 px-4">Tahun Ajaran</th>
                <th className="pb-4 px-4">Nama Siswa</th>
                <th className="pb-4 px-4">Ringkasan Evaluasi & Kebugaran</th>
                <th className="pb-4 px-4">Tanggal Diarsipkan</th>
                <th className="pb-4 px-4 text-right">Inspeksi</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center opacity-50 animate-pulse text-lg font-light"
                  >
                    Membuka brankas arsip sistem...
                  </td>
                </tr>
              ) : filteredArchives.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center opacity-50 font-light text-lg"
                  >
                    Tidak ada data arsip yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredArchives.map((row, idx) => {
                  const parsed = parseSummaryObject(row.summary_data);
                  const preAvg = parsed.pretest_avg ?? parsed.pretest ?? "—";
                  const postAvg = parsed.posttest_avg ?? parsed.posttest ?? "—";
                  const tkjiCat = parsed.tkji_category ?? parsed.tkji ?? "—";

                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.28,
                        delay: Math.min(idx * 0.03, 0.25),
                      }}
                      className="border-b border-hairline transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.025]"
                    >
                      <td className="py-5 px-4 font-bold font-mono text-gold-accent">
                        {row.academic_year || "—"}
                      </td>
                      <td className="py-5 px-4">
                        <div className="font-bold text-base">
                          {row.user_profiles?.full_name || "Siswa Terarsip"}
                        </div>
                        {row.user_profiles?.email && (
                          <span className="text-xs opacity-55 font-mono">
                            {row.user_profiles.email}
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className="px-3 py-1.5 rounded-xl font-semibold badge-tint-sky">
                            PRE: <strong>{preAvg}</strong>
                          </span>
                          <span className="px-3 py-1.5 rounded-xl font-semibold badge-tint-amber">
                            POST: <strong>{postAvg}</strong>
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded-xl font-bold ${getTkjiBadgeClass(
                              tkjiCat
                            )}`}
                          >
                            TKJI: {tkjiCat}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-xs font-mono opacity-70">
                        {row.archived_at
                          ? new Date(row.archived_at).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "—"}
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedArchive(row)}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                          >
                            <Eye size={13} /> Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArchive(row)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
                            title="Hapus Rekaman Arsip"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
          MODAL: INSPEKSI RINCIAN ARSIP JSON SUMMARY
         ==================================================================== */}
      <AnimatePresence>
        {selectedArchive && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setSelectedArchive(null)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setSelectedArchive(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                INSPEKSI BRANKAS · TAHUN AJARAN {selectedArchive.academic_year}
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                {selectedArchive.user_profiles?.full_name ||
                  "Detail Arsip Siswa"}
              </h2>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar mb-6">
                {Object.entries(
                  parseSummaryObject(selectedArchive.summary_data)
                ).length === 0 ? (
                  <p className="text-xs py-8 text-center opacity-50">
                    Tidak ada rincian objek tambahan pada rekaman arsip ini.
                  </p>
                ) : (
                  Object.entries(
                    parseSummaryObject(selectedArchive.summary_data)
                  ).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-4 rounded-2xl flex items-center justify-between gap-4 edufit-surface-subtle"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-semibold font-mono text-right">
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteArchive(selectedArchive)}
                  className="py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-85 badge-tint-rose"
                >
                  Hapus Rekaman Ini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArchive(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md transition-opacity hover:opacity-90 btn-forest-gold"
                >
                  Tutup Inspeksi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}