// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Archive,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileCheck2,
  Filter,
  History,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function ArsipPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [archives, setArchives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<"retention" | "students" | "years">(
    "retention"
  );

  // Custom Dropdown State (Pengganti <select> bawaan browser)
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // State Modal Detail Arsip
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null);

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

  const fetchArchives = async () => {
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
    } catch (error: any) {
      toast.error("Gagal menarik data arsip");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

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
      const matchYear =
        filterYear === "all" || a.academic_year === filterYear;
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

  // Distribusi Arsip per Tahun Ajaran untuk Grafik Batang Bento 2
  const yearDistribution = useMemo(() => {
    return uniqueYears.map((yr) => {
      const cnt = archives.filter((a) => a.academic_year === yr).length;
      return { year: yr, count: cnt };
    });
  }, [archives, uniqueYears]);

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
          } else {
            toast.success("Data arsip berhasil dihapus");
            if (selectedArchive?.id === row.id) setSelectedArchive(null);
            fetchArchives();
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const handleExportCSV = () => {
    if (filteredArchives.length === 0) {
      return toast.error("Tidak ada data arsip untuk diekspor");
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
    toast.success("Data arsip berhasil diekspor ke CSV");
  };

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];

  if (!mounted) return null;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <Archive size={16} /> Penyimpanan Jangka Panjang • Brankas Legacy
            Akademik
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Arsip Akademik & <br />
            <span className="font-semibold">Fisik Siswa</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : archives.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Total Rekaman
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {isLoading ? "—" : uniqueStudentsCount}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Siswa Terarsip
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : uniqueYears.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Tahun Ajaran
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI ARSIP (MURNI GARIS-GARIS TANPA PILL BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Periode Terakhir */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Periode Terakhir</span>
            <span>Aktif</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight">
              {isLoading ? "—" : latestAcademicYear}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
              Legacy
            </span>
          </div>
        </div>

        {/* Bar 2: Hasil Filter Aktif */}
        <button
          type="button"
          onClick={() => setFilterYear("all")}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Tahun Filter</span>
            <span>{filterYear === "all" ? "Semua" : filterYear}</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : `${filteredArchives.length} Data`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Tampil
            </span>
          </div>
        </button>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kapasitas Brankas Arsip</span>
            <span>Penyimpanan Jangka Panjang</span>
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
              {isLoading ? "—" : `${archives.length} Rekaman Utuh`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              Aman
            </span>
          </div>
        </div>

        {/* Bar 4: Total Angkatan */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Angkatan</span>
            <span>Tahun</span>
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
              {isLoading ? "—" : `${uniqueYears.length} Angkatan`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
         ==================================================================== */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10"
        ref={yearDropdownRef}
      >
        {/* BENTO 1 (PATTERN POLKADOT HALUS): KENDALI & FILTER TAHUN AJARAN */}
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

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-light tracking-tight">
                Filter Brankas
              </h2>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: "var(--ref-card-subtle)",
                  borderColor: "var(--ref-card-border)",
                }}
                title="Unduh Rekap Arsip CSV"
              >
                <Download size={16} />
              </button>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Pilih tahun ajaran akademik untuk meninjau rekam jejak kelulusan
              siswa.
            </p>

            {/* Bottom-Bordered Custom Dropdown Tahun (DNA Masterpiece) */}
            <div className="relative w-full mb-6">
              <div
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  {filterYear === "all"
                    ? `Semua Tahun Ajaran (${archives.length})`
                    : `Tahun Ajaran ${filterYear}`}
                </span>
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
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
                        setFilterYear("all");
                        setIsYearDropdownOpen(false);
                      }}
                      className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${
                        isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                      style={{
                        color:
                          filterYear === "all"
                            ? "#facc15"
                            : isDark
                            ? "#fff"
                            : "#000",
                      }}
                    >
                      Semua Tahun Ajaran ({archives.length} Rekaman)
                    </div>
                    {uniqueYears.map((yr) => (
                      <div
                        key={yr}
                        onClick={() => {
                          setFilterYear(yr);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors ${
                          isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                        }`}
                        style={{
                          color:
                            filterYear === yr
                              ? "#facc15"
                              : isDark
                              ? "#fff"
                              : "#000",
                        }}
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
              onClick={fetchArchives}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 border transition-transform hover:scale-[1.01] cursor-pointer shadow-sm"
              style={{
                backgroundColor: isDark ? "#ffffff" : "#18181b",
                color: isDark ? "#18181b" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.2)",
              }}
            >
              <RotateCcw size={15} className={isLoading ? "animate-spin" : ""} />{" "}
              Muat Ulang
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="py-4 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm text-white"
              style={{ backgroundColor: "#10b981" }}
            >
              <Download size={15} /> Ekspor CSV
            </button>
          </div>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): GRAFIK BATANG VERTIKAL BERTITIK ARSIP PER TAHUN */}
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
              <History size={16} /> Distribusi Rekaman per Tahun
            </div>
            <span className="text-xs font-bold opacity-50">
              {uniqueYears.length} Periode
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : archives.length}
            </div>
            <div className="text-sm font-semibold opacity-50 mb-1">
              Total Arsip Tersimpan
            </div>
          </div>

          {(() => {
            const bars = yearDistribution.slice(0, 6);
            const maxCnt = Math.max(1, ...bars.map((b) => b.count));

            return (
              <div
                className="grid gap-3 items-end pt-4 h-44 relative z-10"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    bars.length
                  )}, minmax(0, 1fr))`,
                }}
              >
                {bars.map((bar, idx) => {
                  const heightPct = Math.round((bar.count / maxCnt) * 100);
                  const isSelected = filterYear === bar.year;

                  return (
                    <button
                      key={bar.year}
                      type="button"
                      onClick={() =>
                        setFilterYear(isSelected ? "all" : bar.year)
                      }
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`Tahun ${bar.year}: ${bar.count} Arsip`}
                    >
                      <span className="text-[11px] font-bold opacity-75">
                        {bar.count}
                      </span>
                      <div
                        className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px]"
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
                              bar.count > 0 ? 18 : 8,
                              heightPct
                            )}%`,
                            backgroundColor:
                              isSelected || idx === 0
                                ? "#facc15"
                                : "var(--ref-text-primary)",
                          }}
                        />
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            isSelected || idx === 0
                              ? "#facc15"
                              : "var(--ref-text-primary)",
                        }}
                      />
                      <span className="text-[10px] font-bold opacity-60 truncate max-w-full">
                        {bar.year.split("/")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS RETENSI ARSIP */}
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
              <Activity size={16} /> Indeks Retensi Arsip
            </div>
            <div className="flex items-center gap-1">
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
              gaugeMode === "retention"
                ? `${archives.length}`
                : gaugeMode === "students"
                ? `${uniqueStudentsCount}`
                : `${uniqueYears.length}`;

            const gaugeLabel =
              gaugeMode === "retention"
                ? "Total Rekaman Brankas"
                : gaugeMode === "students"
                ? "Total Siswa Terarsip"
                : "Periode Tahun Ajaran";

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
              <span>{uniqueStudentsCount} Siswa Unik</span>
              <span>•</span>
              <span>{latestAcademicYear} Terbaru</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: TABEL DIREKTORI ARSIP JANGKA PANJANG (BENTO TABLE)
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
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 16px)",
          }}
        />

        <div
          className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-6 mb-8 pb-6 border-b"
          style={{
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest mb-2">
              <Archive size={16} /> Direktori Brankas Legacy
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
              className="w-full pl-11 pr-9 py-3 rounded-2xl text-xs font-semibold outline-none border transition-colors"
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
        </div>

        <div className="relative z-10 overflow-x-auto no-scrollbar">
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
                filteredArchives.map((row) => {
                  const parsed = parseSummaryObject(row.summary_data);
                  const preAvg = parsed.pretest_avg ?? parsed.pretest ?? "—";
                  const postAvg = parsed.posttest_avg ?? parsed.posttest ?? "—";
                  const tkjiCat = parsed.tkji_category ?? parsed.tkji ?? "—";

                  return (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      style={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <td className="py-5 px-4 font-bold">
                        {row.academic_year || "—"}
                      </td>
                      <td className="py-5 px-4">
                        <div className="font-bold text-base">
                          {row.user_profiles?.full_name || "Siswa Terarsip"}
                        </div>
                        {row.user_profiles?.email && (
                          <span className="text-xs opacity-50">
                            {row.user_profiles.email}
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className="px-3 py-1.5 rounded-xl font-semibold border"
                            style={{
                              backgroundColor: "var(--ref-card-subtle)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          >
                            Pretest: <strong>{preAvg}</strong>
                          </span>
                          <span
                            className="px-3 py-1.5 rounded-xl font-semibold border"
                            style={{
                              backgroundColor: "var(--ref-card-subtle)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          >
                            Posttest: <strong>{postAvg}</strong>
                          </span>
                          <span className="px-3 py-1.5 rounded-xl font-bold bg-emerald-500/12 text-emerald-500">
                            TKJI: {tkjiCat}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-xs opacity-70">
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedArchive(row)}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                            style={{
                              backgroundColor: "var(--ref-card-subtle)",
                              borderColor: "var(--ref-card-border)",
                            }}
                          >
                            <Eye size={13} /> Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArchive(row)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                            title="Hapus Rekaman Arsip"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedArchive(null)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
              style={{
                backgroundColor: isDark ? "#141414" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedArchive(null)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <span className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-1">
                Tahun Ajaran {selectedArchive.academic_year}
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                {selectedArchive.user_profiles?.full_name ||
                  "Detail Arsip Siswa"}
              </h2>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar mb-6">
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
                      className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                      style={{
                        backgroundColor: "var(--ref-card-subtle)",
                        borderColor: "var(--ref-card-border)",
                      }}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-semibold text-right">
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
                  className="py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 cursor-pointer"
                >
                  Hapus Rekaman Ini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArchive(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-white cursor-pointer shadow-md"
                  style={{ backgroundColor: "#10b981" }}
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