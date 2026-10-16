// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    ArrowUpRight,
    ChevronDown,
    Download,
    Edit3,
    Layers,
    Play,
    Plus,
    Search,
    Trash2,
    Video,
    X
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function PraktikPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<any[]>([]);

  // Filter & Pencarian Katalog Video (Murni dari Database, 0% Hardcode!)
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Mode Circular Gauge di Bento 3
  const [gaugeMode, setGaugeMode] = useState<
    "coverage" | "engagement" | "categories"
  >("coverage");

  // Modal Pratinjau Detail Video & Panduan Teknik
  const [previewVideo, setPreviewVideo] = useState<any | null>(null);

  // Modal Tambah / Edit Video Praktik (master_practice_videos)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState({
    category: "Daya Tahan",
    title: "",
    video_url: "",
    duration_label: "3-5 Menit",
    technique_steps: "",
    common_mistakes: "",
  });
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchAllPraktikCatalog = async () => {
    setIsLoading(true);
    try {
      const [videosRes, practicesRes] = await Promise.all([
        supabase
          .from("master_practice_videos")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("optional_practices")
          .select("id, student_id, unit_name, teacher_note, created_at"),
      ]);

      if (videosRes.error) throw videosRes.error;
      setVideos(videosRes.data || []);
      setPracticeLogs(practicesRes.data || []);
    } catch (error: any) {
      toast.error("Gagal memuat katalog video panduan praktik");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPraktikCatalog();
  }, []);

  // Ekstraksi daftar kategori dinamis murni dari tabel master_practice_videos
  const categories = useMemo(() => {
    const set = new Set<string>(["Semua"]);
    videos.forEach((v) => {
      const cat = String(v.category || "").trim();
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [videos]);

  // Hitung statistik penggunaan jurnal mandiri siswa per judul video (Read-Only Telemetry)
  const logsCountByVideoTitle = useMemo(() => {
    const map: Record<string, number> = {};
    practiceLogs.forEach((log) => {
      const uName = String(log.unit_name || "").trim().toLowerCase();
      if (!uName) return;
      map[uName] = (map[uName] || 0) + 1;
    });
    return map;
  }, [practiceLogs]);

  const getVideoEngagementCount = (title: string) => {
    const clean = String(title || "").trim().toLowerCase();
    if (!clean) return 0;
    if (logsCountByVideoTitle[clean]) return logsCountByVideoTitle[clean];
    // Fallback kecocokan kata kunci jika judul pernah diedit sedikit
    let sum = 0;
    Object.entries(logsCountByVideoTitle).forEach(([k, cnt]) => {
      if (k.includes(clean) || clean.includes(k)) sum += cnt;
    });
    return sum;
  };

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { videos: number; logs: number }> = {};
    videos.forEach((v) => {
      const cat = String(v.category || "Umum").trim();
      if (!map[cat]) map[cat] = { videos: 0, logs: 0 };
      map[cat].videos += 1;
      map[cat].logs += getVideoEngagementCount(v.title);
    });
    return Object.entries(map).map(([name, stat]) => ({
      name,
      videos: stat.videos,
      logs: stat.logs,
    }));
  }, [videos, logsCountByVideoTitle]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchCat =
        selectedCategory === "Semua" ||
        String(v.category || "").trim() === selectedCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(v.title || "").toLowerCase().includes(q) ||
        String(v.category || "").toLowerCase().includes(q) ||
        String(v.technique_steps || "").toLowerCase().includes(q) ||
        String(v.common_mistakes || "").toLowerCase().includes(q)
      );
    });
  }, [videos, selectedCategory, searchQuery]);

  // Persentase kelengkapan atribut panduan pada katalog video (URL, Langkah Teknik, Kesalahan Umum)
  const catalogCompletenessPct = useMemo(() => {
    if (videos.length === 0) return 0;
    const completeCount = videos.filter(
      (v) =>
        String(v.video_url || "").trim() !== "" &&
        String(v.technique_steps || "").trim() !== "" &&
        String(v.common_mistakes || "").trim() !== ""
    ).length;
    return Math.round((completeCount / videos.length) * 100);
  }, [videos]);

  const activeVideosWithLogsPct = useMemo(() => {
    if (videos.length === 0) return 0;
    const practicedVideos = videos.filter(
      (v) => getVideoEngagementCount(v.title) > 0
    ).length;
    return Math.round((practicedVideos / videos.length) * 100);
  }, [videos, logsCountByVideoTitle]);

  // ==========================================================================
  // CRUD KATALOG VIDEO PANDUAN PRAKTIK (MASTER_PRACTICE_VIDEOS)
  // ==========================================================================
  const openAddVideoModal = () => {
    setEditingVideoId(null);
    setVideoForm({
      category:
        selectedCategory !== "Semua" ? selectedCategory : "Daya Tahan",
      title: "",
      video_url: "",
      duration_label: "3-5 Menit",
      technique_steps: "",
      common_mistakes: "",
    });
    setIsVideoModalOpen(true);
  };

  const openEditVideoModal = (v: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingVideoId(v.id);
    setVideoForm({
      category: v.category || "Daya Tahan",
      title: v.title || "",
      video_url: v.video_url || "",
      duration_label: v.duration_label || "3-5 Menit",
      technique_steps: v.technique_steps || "",
      common_mistakes: v.common_mistakes || "",
    });
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title.trim()) {
      return toast.error("Judul video demonstrasi wajib diisi.");
    }
    setIsSavingVideo(true);
    try {
      const payload = {
        category: videoForm.category.trim(),
        title: videoForm.title.trim(),
        video_url: videoForm.video_url.trim(),
        duration_label: videoForm.duration_label.trim(),
        technique_steps: videoForm.technique_steps.trim(),
        common_mistakes: videoForm.common_mistakes.trim(),
      };
      if (editingVideoId) {
        const { error } = await supabase
          .from("master_practice_videos")
          .update(payload)
          .eq("id", editingVideoId);
        if (error) throw error;
        toast.success("Video panduan berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("master_practice_videos")
          .insert([payload]);
        if (error) throw error;
        toast.success("Video panduan baru berhasil ditambahkan!");
      }
      setIsVideoModalOpen(false);
      fetchAllPraktikCatalog();
    } catch (err: any) {
      toast.error("Gagal menyimpan video panduan");
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleDeleteVideo = (v: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast("Hapus Video Praktik", {
      description: `Yakin ingin menghapus "${v.title}" dari katalog praktik siswa?`,
      action: {
        label: "Hapus",
        onClick: async () => {
          const { error } = await supabase
            .from("master_practice_videos")
            .delete()
            .eq("id", v.id);
          if (error) {
            toast.error("Gagal menghapus video");
          } else {
            toast.success("Video panduan berhasil dihapus");
            if (previewVideo?.id === v.id) setPreviewVideo(null);
            fetchAllPraktikCatalog();
          }
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const handleExportCatalogCSV = () => {
    const rows = [
      [
        "No",
        "Kategori Kebugaran",
        "Judul Video Panduan",
        "Estimasi Durasi",
        "Tautan Video",
        "Jumlah Jurnal Mandiri Siswa",
      ],
      ...videos.map((v, idx) => [
        idx + 1,
        `"${String(v.category || "").replace(/"/g, '""')}"`,
        `"${String(v.title || "").replace(/"/g, '""')}"`,
        `"${String(v.duration_label || "").replace(/"/g, '""')}"`,
        `"${String(v.video_url || "").replace(/"/g, '""')}"`,
        getVideoEngagementCount(v.title),
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Katalog_Video_Praktik_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Katalog Video Panduan berhasil diekspor ke CSV!");
  };

  const bentoColors = ["#fef08a", "#bbf7d0", "#fed7aa", "#bae6fd"];
  const presetCategories = [
    "Daya Tahan",
    "Kekuatan",
    "Kelincahan",
    "Kelenturan",
    "Kecepatan",
    "Koordinasi",
  ];

  if (!mounted) return null;

  return (
    <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ====================================================================
          ZONA 1: ARCHITECTURAL HERO HEADER & 3 GIANT NAKED NUMBERS
         ==================================================================== */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
            <Video size={16} />{" "}
            {selectedCategory === "Semua"
              ? "Manajemen Pustaka Video Demonstrasi & Biomekanika Gerak"
              : `Fokus Kategori Gerak: ${selectedCategory}`}
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
            Katalog Video & <br />
            <span className="font-semibold">Panduan Praktik</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka (Naked Giant Numbers) */}
        <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : videos.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Video Demonstrasi
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
              {isLoading ? "—" : Math.max(0, categories.length - 1)}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Kategori Gerak
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : practiceLogs.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
              Jurnal Mandiri Siswa
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI MEDIA PRAKTIK (TANPA PILL BORDER BIRU/HIJAU!)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-8 relative z-10">
        {/* Bar 1: Filter Kategori Aktif */}
        <button
          type="button"
          onClick={() => setSelectedCategory("Semua")}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Cakupan Katalog</span>
            <span>Klik Reset</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01]"
            style={{
              backgroundColor: "var(--ref-dark-panel)",
              color: "var(--ref-dark-panel-text)",
            }}
          >
            <span className="text-2xl font-light tracking-tight truncate pr-2">
              {selectedCategory}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 shrink-0">
              {filteredVideos.length} Video
            </span>
          </div>
        </button>

        {/* Bar 2: Kelengkapan Panduan Teknik & Kesalahan Umum */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Standar Instruksi</span>
            <span>Prosedur & Koreksi</span>
          </div>
          <div
            className="h-14 rounded-2xl px-6 flex items-center justify-between"
            style={{
              backgroundColor: "#facc15",
              color: "#18181b",
            }}
          >
            <span className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : `${catalogCompletenessPct}% Lengkap`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Terverifikasi
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Murni (TANPA PILL BORDER BIRU/HIJAU DI DALAMNYA!) */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Eksplorasi Mandiri Siswa</span>
            <span>Read-Only Telemetry</span>
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
              {isLoading ? "—" : `${activeVideosWithLogsPct}% Video Dicoba`}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10"
              style={{ color: "var(--ref-text-primary)" }}
            >
              {practiceLogs.length} Catatan
            </span>
          </div>
        </div>

        {/* Bar 4: Status Sinkronisasi Mobile */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Status Aplikasi</span>
            <span>Mobile Sync</span>
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
              Live Aktif
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (3 KOLOM x col-span-4 • min-h-[390px])
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT HALUS): FILTER KATEGORI & TAMBAH VIDEO BARU */}
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
                Kendali Katalog
              </h2>
              <button
                type="button"
                onClick={handleExportCatalogCSV}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: "var(--ref-card-subtle)",
                  borderColor: "var(--ref-card-border)",
                }}
                title="Ekspor Katalog Video CSV"
              >
                <Download size={16} />
              </button>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-50">
              Sediakan materi video gerakan, tahapan teknik, dan koreksi
              kesalahan untuk dipelajari siswa secara mandiri.
            </p>

            {/* Bottom-Bordered Custom Dropdown Kategori Gerak (DNA Masterpiece) */}
            <div className="relative w-full mb-6" ref={categoryDropdownRef}>
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                Filter Kategori Kebugaran
              </label>
              <div
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center transition-colors select-none"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <span className="truncate pr-3">
                  {selectedCategory === "Semua"
                    ? `Semua Kategori (${videos.length} Video)`
                    : selectedCategory}
                </span>
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-300 opacity-50 shrink-0 ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
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
                    {categories.map((cat) => {
                      const cnt =
                        cat === "Semua"
                          ? videos.length
                          : videos.filter(
                              (v) => String(v.category || "").trim() === cat
                            ).length;
                      return (
                        <div
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`px-6 py-4 text-lg font-light cursor-pointer transition-colors flex items-center justify-between ${
                            isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                          }`}
                          style={{
                            color:
                              selectedCategory === cat
                                ? "#facc15"
                                : isDark
                                ? "#fff"
                                : "#000",
                          }}
                        >
                          <span>{cat}</span>
                          <span className="text-xs font-bold opacity-50">
                            {cnt} Video
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pencarian Cepat */}
            <div className="relative w-full mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul gerakan atau teknik..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold outline-none border"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openAddVideoModal}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md text-white relative z-10"
            style={{ backgroundColor: "#10b981" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Video Demonstrasi
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): DISTRIBUSI VIDEO & JURNAL MANDIRI PER KATEGORI */}
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
              <Layers size={16} /> Distribusi Kategori Gerak
            </div>
            <span className="text-xs font-bold opacity-50">
              Klik batang untuk filter
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light tracking-tighter leading-none">
              {isLoading ? "—" : videos.length}
            </div>
            <div className="text-sm font-semibold opacity-50 mb-1">
              Total Modul Video Aktif
            </div>
          </div>

          {(() => {
            const bars = categoryBreakdown.slice(0, 6);
            const maxVal = Math.max(1, ...bars.map((b) => b.videos));

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
                  const heightPct = Math.round((bar.videos / maxVal) * 100);
                  const isSelected = selectedCategory === bar.name;

                  return (
                    <button
                      key={bar.name}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(isSelected ? "Semua" : bar.name)
                      }
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${bar.name}: ${bar.videos} Video · ${bar.logs} Jurnal Siswa`}
                    >
                      <span className="text-[11px] font-bold opacity-75">
                        {bar.videos}v
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
                              bar.videos > 0 ? 20 : 8,
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
                        {bar.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS PUSTAKA PRAKTIK */}
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
              <Activity size={16} /> Indeks Pustaka Praktik
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "coverage", label: "Instruksi" },
                { key: "engagement", label: "Dicoba" },
                { key: "categories", label: "Kategori" },
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
              gaugeMode === "coverage"
                ? `${catalogCompletenessPct}%`
                : gaugeMode === "engagement"
                ? `${activeVideosWithLogsPct}%`
                : `${Math.max(0, categories.length - 1)}`;

            const gaugeLabel =
              gaugeMode === "coverage"
                ? "Kelengkapan Panduan Teknik"
                : gaugeMode === "engagement"
                ? "Video Dicoba Mandiri"
                : "Kategori Kebugaran Aktif";

            const gaugePct =
              gaugeMode === "coverage"
                ? catalogCompletenessPct
                : gaugeMode === "engagement"
                ? activeVideosWithLogsPct
                : Math.min(100, (categories.length - 1) * 16);

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
            <div className="flex flex-wrap gap-1.5 justify-between text-[11px] font-bold tracking-widest uppercase opacity-70 pt-2 border-t border-black/10 dark:border-white/10">
              <span>{videos.length} Video Master</span>
              <span>•</span>
              <span>{practiceLogs.length} Jurnal Siswa</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: FILTER PILLS CEPAT & GRID KARTU BESAR VIDEO DEMONSTRASI
                  (min-h-[320px] • PASTEL LIGHT MODE / OBSIDIAN DARK MODE)
         ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border"
                style={{
                  backgroundColor: active
                    ? "#facc15"
                    : isDark
                    ? "#111111"
                    : "#ffffff",
                  color: active ? "#000000" : "inherit",
                  borderColor: active
                    ? "#facc15"
                    : isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={openAddVideoModal}
          className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md text-white cursor-pointer shrink-0"
          style={{ backgroundColor: "#10b981" }}
        >
          <Plus size={15} strokeWidth={2.5} /> Tambah Video Panduan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[320px] rounded-[2.5rem] animate-pulse"
              style={{ backgroundColor: "var(--ref-card-subtle)" }}
            />
          ))
        ) : filteredVideos.length === 0 ? (
          <div
            className="xl:col-span-3 p-16 text-center rounded-[2.5rem] border border-dashed opacity-50"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            }}
          >
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-xl font-light">
              Belum ada video panduan pada kategori atau pencarian ini.
            </p>
          </div>
        ) : (
          filteredVideos.map((v, index) => {
            const bgLight = bentoColors[index % bentoColors.length];
            const logCount = getVideoEngagementCount(v.title);

            return (
              <div
                key={v.id}
                onClick={() => setPreviewVideo(v)}
                className="p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[330px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group border cursor-pointer"
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

                {/* Baris Atas Kartu Video */}
                <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs font-bold tracking-widest uppercase opacity-65">
                    {v.category || "Umum"} • {v.duration_label || "3-5 Menit"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditVideoModal(v, e)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                      title="Edit Video & Panduan"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVideo(v, e)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                      title="Hapus Video"
                    >
                      <Trash2 size={15} />
                    </button>
                    <a
                      href={v.video_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      }}
                      title="Buka Tautan Video"
                    >
                      <ArrowUpRight size={18} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>

                {/* Judul & Ringkasan Prosedur Teknik */}
                <div className="my-6 relative z-10">
                  <div className="text-3xl md:text-4xl font-light tracking-tighter leading-tight mb-3">
                    {v.title}
                  </div>
                  <p className="text-xs font-medium opacity-70 line-clamp-2 leading-relaxed mb-2">
                    <strong>Teknik:</strong>{" "}
                    {v.technique_steps || "Klik untuk melihat tahapan gerakan."}
                  </p>
                  <p className="text-[11px] font-medium opacity-60 line-clamp-1">
                    <strong>Hindari:</strong>{" "}
                    {v.common_mistakes || "Belum diatur"}
                  </p>
                </div>

                {/* Baris Bawah Statistik Jurnal Mandiri Siswa (Read-Only Telemetry) */}
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Panduan Gerak
                    </div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <Play size={14} /> Klik Pratinjau
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                      Jurnal Siswa
                    </div>
                    <div className="text-4xl font-light leading-none">
                      {logCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ====================================================================
          MODAL 1: PRATINJAU DETAIL VIDEO & PANDUAN BIOMEKANIKA
         ==================================================================== */}
      <AnimatePresence>
        {previewVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPreviewVideo(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border max-h-[90vh] overflow-y-auto no-scrollbar"
              style={{
                backgroundColor: isDark ? "#141414" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <span className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-2">
                {previewVideo.category} • {previewVideo.duration_label}
              </span>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">
                {previewVideo.title}
              </h2>

              <div className="space-y-5">
                <div
                  className="p-5 rounded-3xl border"
                  style={{
                    backgroundColor: "var(--ref-card-subtle)",
                    borderColor: "var(--ref-card-border)",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-2">
                    01 — Prosedur & Langkah Teknik yang Benar
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {previewVideo.technique_steps}
                  </p>
                </div>

                <div
                  className="p-5 rounded-3xl border"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                    borderColor: "rgba(239, 68, 68, 0.25)",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 block mb-2">
                    02 — Kesalahan Umum yang Harus Dihindari Siswa
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {previewVideo.common_mistakes}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewVideo;
                      setPreviewVideo(null);
                      openEditVideoModal(target);
                    }}
                    className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest border cursor-pointer"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  >
                    Edit Panduan Ini
                  </button>

                  {previewVideo.video_url && (
                    <a
                      href={previewVideo.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white shadow-md"
                      style={{ backgroundColor: "#10b981" }}
                    >
                      <Play size={15} /> Buka Video Demonstrasi
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 2: TAMBAH / EDIT VIDEO PANDUAN PRAKTIK (MASTER_PRACTICE_VIDEOS)
         ==================================================================== */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVideoModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border max-h-[92vh] overflow-y-auto no-scrollbar"
              style={{
                backgroundColor: isDark ? "#141414" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <h2 className="text-3xl font-light tracking-tight mb-6">
                {editingVideoId ? "Edit" : "Tambah"}{" "}
                <span className="font-semibold">Video Panduan Praktik</span>
              </h2>

              <form onSubmit={handleSaveVideo} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2.5">
                    Pilih atau Ketik Kategori Komponen Kebugaran
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {presetCategories.map((cat) => {
                      const active = videoForm.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setVideoForm({ ...videoForm, category: cat })
                          }
                          className="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
                          style={{
                            backgroundColor: active
                              ? "#facc15"
                              : isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.05)",
                            color: active ? "#000" : "inherit",
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      required
                      type="text"
                      value={videoForm.category}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, category: e.target.value })
                      }
                      placeholder="Kategori (Cth: Daya Tahan)"
                      className="px-4 py-3.5 rounded-2xl text-sm font-bold border focus:outline-none"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.02)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    />
                    <input
                      required
                      type="text"
                      value={videoForm.duration_label}
                      onChange={(e) =>
                        setVideoForm({
                          ...videoForm,
                          duration_label: e.target.value,
                        })
                      }
                      placeholder="Durasi (Cth: 3-5 Menit)"
                      className="px-4 py-3.5 rounded-2xl text-sm font-bold border focus:outline-none"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.02)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Judul Video Demonstrasi Gerakan
                  </label>
                  <input
                    required
                    type="text"
                    value={videoForm.title}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, title: e.target.value })
                    }
                    placeholder="Contoh: Teknik Lari Interval & Pengaturan Napas"
                    className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Tautan Video (YouTube / Media URL)
                  </label>
                  <input
                    required
                    type="url"
                    value={videoForm.video_url}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, video_url: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-4 rounded-2xl text-sm border focus:outline-none"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Langkah-Langkah Teknik yang Benar
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={videoForm.technique_steps}
                    onChange={(e) =>
                      setVideoForm({
                        ...videoForm,
                        technique_steps: e.target.value,
                      })
                    }
                    placeholder="Tuliskan tahapan pelaksanaan gerakan yang benar..."
                    className="w-full p-4 rounded-2xl text-sm border focus:outline-none resize-y"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">
                    Kesalahan Umum yang Harus Dihindari
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={videoForm.common_mistakes}
                    onChange={(e) =>
                      setVideoForm({
                        ...videoForm,
                        common_mistakes: e.target.value,
                      })
                    }
                    placeholder="Tuliskan kesalahan postur atau gerakan yang sering terjadi..."
                    className="w-full p-4 rounded-2xl text-sm border focus:outline-none resize-y"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingVideo}
                  className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer text-white shadow-md"
                  style={{ backgroundColor: "#10b981" }}
                >
                  {isSavingVideo
                    ? "Menyimpan ke Server..."
                    : "Simpan Video Panduan"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}