// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  Layers,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Video,
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

const PRESET_CATEGORIES = [
  "Daya Tahan",
  "Kekuatan",
  "Kelincahan",
  "Kelenturan",
  "Kecepatan",
  "Koordinasi",
];

export default function PraktikPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<any[]>([]);

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

  // Filter & Pencarian Katalog Video (Murni dari Database)
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
      triggerDynamicIsland(
        "Gagal Memuat Katalog Video",
        "Periksa koneksi ke tabel master_practice_videos.",
        "error"
      );
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

  // Hitung statistik penggunaan jurnal mandiri siswa per judul video
  const logsCountByVideoTitle = useMemo(() => {
    const map: Record<string, number> = {};
    practiceLogs.forEach((log) => {
      const uName = String(log.unit_name || "").trim().toLowerCase();
      if (!uName) return;
      map[uName] = (map[uName] || 0) + 1;
    });
    return map;
  }, [practiceLogs]);

  const getVideoEngagementCount = useCallback(
    (title: string) => {
      const clean = String(title || "").trim().toLowerCase();
      if (!clean) return 0;
      if (logsCountByVideoTitle[clean]) return logsCountByVideoTitle[clean];
      let sum = 0;
      Object.entries(logsCountByVideoTitle).forEach(([k, cnt]) => {
        if (k.includes(clean) || clean.includes(k)) sum += cnt;
      });
      return sum;
    },
    [logsCountByVideoTitle]
  );

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
  }, [videos, getVideoEngagementCount]);

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

  // Persentase kelengkapan atribut panduan pada katalog video
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
  }, [videos, getVideoEngagementCount]);

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
        triggerDynamicIsland(
          "Video Panduan Diperbarui",
          `${payload.title} (${payload.category}) telah disimpan.`,
          "success"
        );
      } else {
        const { error } = await supabase
          .from("master_practice_videos")
          .insert([payload]);
        if (error) throw error;
        triggerDynamicIsland(
          "Video Panduan Ditambahkan",
          `${payload.title} kini aktif pada katalog aplikasi siswa.`,
          "success"
        );
      }
      setIsVideoModalOpen(false);
      fetchAllPraktikCatalog();
    } catch (err: any) {
      toast.error("Gagal menyimpan video panduan");
      triggerDynamicIsland(
        "Gagal Menyimpan Video",
        err?.message || "Periksa kebijakan RLS pada master_practice_videos.",
        "error"
      );
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
            triggerDynamicIsland(
              "Video Panduan Dihapus",
              `"${v.title}" telah dihapus dari katalog praktik.`,
              "info"
            );
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
    triggerDynamicIsland(
      "Katalog Video Diekspor",
      `${videos.length} modul video panduan berhasil diunduh ke CSV.`,
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
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">
            <span className="font-mono text-gold-accent">
              PUSTAKA BIOMEKANIKA GERAK
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Video size={15} />
              {selectedCategory === "Semua"
                ? "Manajemen Video Demonstrasi & Koreksi Teknik"
                : `Fokus Kategori Gerak: ${selectedCategory}`}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Katalog Video & <br />
            <span className="font-semibold">Panduan Praktik</span>
          </h1>
        </div>

        {/* 3 Angka Utama */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : videos.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Video Demonstrasi
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : Math.max(0, categories.length - 1)}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Kategori Gerak
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : practiceLogs.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              Jurnal Mandiri Siswa
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI MEDIA PRAKTIK
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Filter Kategori Aktif */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory("Semua");
            triggerDynamicIsland(
              "Filter Kategori Direset",
              `Menampilkan seluruh ${videos.length} video panduan praktik.`,
              "info"
            );
          }}
          className="lg:col-span-3 space-y-2 text-left cursor-pointer group"
        >
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Cakupan Katalog</span>
            <span className="font-mono">KLIK RESET</span>
          </div>
          <div
            className={`h-14 rounded-2xl px-6 flex items-center justify-between transition-transform group-hover:scale-[1.01] ${
              selectedCategory !== "Semua"
                ? "telemetry-bar-forest-active"
                : "telemetry-bar-forest"
            }`}
          >
            <span className="text-2xl font-light tracking-tight truncate pr-2">
              {selectedCategory}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider opacity-70 shrink-0">
              {filteredVideos.length} VIDEO
            </span>
          </div>
        </button>

        {/* Bar 2: Kelengkapan Panduan Teknik & Kesalahan Umum */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Standar Instruksi</span>
            <span className="font-mono">PROSEDUR & KOREKSI</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${catalogCompletenessPct}% Lengkap`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Terverifikasi
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Eksplorasi Mandiri Siswa</span>
            <span className="font-mono">TELEMETRI JURNAL</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${activeVideosWithLogsPct}% Dicoba`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-widest opacity-65 relative z-10">
              {practiceLogs.length} CATATAN
            </span>
          </div>
        </div>

        {/* Bar 4: Status Sinkronisasi Mobile */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Status Aplikasi</span>
            <span className="font-mono">MOBILE SYNC</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              Live Aktif
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1: FILTER KATEGORI & TAMBAH VIDEO BARU */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55">
                <SlidersHorizontal size={14} />
                <span>Filter Katalog</span>
              </div>
              <button
                type="button"
                onClick={handleExportCatalogCSV}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                title="Ekspor Katalog Video CSV"
              >
                <Download size={15} />
              </button>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Kendali Katalog
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium opacity-55">
              Sediakan materi video gerakan, tahapan teknik, dan koreksi
              kesalahan untuk dipelajari siswa secara mandiri.
            </p>

            {/* Underline Custom Dropdown Kategori Gerak */}
            <div className="relative w-full mb-6" ref={categoryDropdownRef}>
              <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-55 block mb-1">
                FILTER KATEGORI KEBUGARAN
              </label>
              <div
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className={`w-full bg-transparent py-3 text-2xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isCategoryDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {selectedCategory === "Semua"
                    ? `Semua Kategori (${videos.length} Video)`
                    : selectedCategory}
                </span>
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
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
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar edufit-dropdown-menu"
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
                            triggerDynamicIsland(
                              `Kategori Aktif: ${cat}`,
                              `Menampilkan ${cnt} modul video demonstrasi.`,
                              "info"
                            );
                          }}
                          className={`px-6 py-4 text-base font-medium cursor-pointer transition-colors flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 ${
                            selectedCategory === cat ? "text-gold-accent" : ""
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-xs font-bold font-mono opacity-60">
                            {cnt} VIDEO
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
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold outline-none edufit-surface-subtle"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openAddVideoModal}
            className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer shadow-md relative z-10 btn-forest-emerald"
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Video Demonstrasi
          </button>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): DISTRIBUSI VIDEO & JURNAL MANDIRI */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <Layers size={15} />
              <span>Distribusi Kategori Gerak</span>
            </div>
            <span className="text-[11px] font-bold font-mono opacity-55">
              KLIK BATANG
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : videos.length}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Total Modul Video Aktif
            </div>
          </div>

          {(() => {
            const bars = categoryBreakdown.slice(0, 6);
            const maxVal = Math.max(1, ...bars.map((b) => b.videos));

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
                      Belum ada sebaran kategori
                    </div>
                  ) : (
                    bars.map((bar, idx) => {
                      const heightPct = Math.round((bar.videos / maxVal) * 100);
                      const isSelected = selectedCategory === bar.name;
                      const fillClass = isSelected
                        ? "chart-fill-emerald"
                        : idx === 0
                        ? "chart-fill-gold"
                        : "chart-fill-primary";

                      return (
                        <button
                          key={bar.name}
                          type="button"
                          onClick={() =>
                            setSelectedCategory(
                              isSelected ? "Semua" : bar.name
                            )
                          }
                          className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                          title={`${bar.name}: ${bar.videos} Video · ${bar.logs} Jurnal Siswa`}
                        >
                          <span
                            className={`text-[10px] font-bold font-mono transition-opacity ${
                              isSelected || idx === 0
                                ? "opacity-100 text-gold-accent"
                                : "opacity-65 group-hover:opacity-100"
                            }`}
                          >
                            {bar.videos}v
                          </span>
                          <div className="w-5 flex-1 rounded-xl flex items-end overflow-hidden p-0.5 chart-track-pill">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${Math.max(
                                  bar.videos > 0 ? 14 : 4,
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
                            {bar.name.split(" ")[0]}
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

        {/* BENTO 3: INDEKS PUSTAKA PRAKTIK (TEKS LABEL DI LUAR LINGKARAN CHART) */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <Activity size={15} />
              <span>Indeks Pustaka Praktik</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl edufit-surface-subtle">
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
                ? `${catalogCompletenessPct}%`
                : gaugeMode === "engagement"
                ? `${activeVideosWithLogsPct}%`
                : `${Math.max(0, categories.length - 1)}`;

            const gaugeLabel =
              gaugeMode === "coverage"
                ? "Kelengkapan Panduan Teknik"
                : gaugeMode === "engagement"
                ? "Total Video Dicoba Mandiri"
                : "Total Kategori Kebugaran Aktif";

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
                        gaugeMode === "engagement"
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
            <div className="flex flex-wrap gap-1.5 justify-between text-[11px] font-bold font-mono tracking-widest uppercase opacity-75 pt-2 border-t border-hairline">
              <span>{videos.length} Video Master</span>
              <span>—</span>
              <span>{practiceLogs.length} Jurnal Siswa</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: BARIS FILTER KATEGORI & GRID KARTU BESAR VIDEO
         ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 relative z-10">
        <div>
          <div className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent mb-2">
            DIREKTORI MODUL DEMONSTRASI GERAK
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl edufit-surface-subtle">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    active ? "seg-btn-active" : "seg-btn-idle"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={openAddVideoModal}
          className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer shrink-0 btn-forest-emerald"
        >
          <Plus size={15} strokeWidth={2.5} /> Tambah Video Panduan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[320px] rounded-[2rem] animate-pulse edufit-surface-subtle"
            />
          ))
        ) : filteredVideos.length === 0 ? (
          <div className="xl:col-span-3 p-16 text-center rounded-[2rem] border border-dashed border-hairline opacity-60">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-xl font-light">
              Belum ada video panduan pada kategori atau pencarian ini.
            </p>
          </div>
        ) : (
          filteredVideos.map((v, index) => {
            const showcaseClass =
              BENTO_SHOWCASE_CLASSES[index % BENTO_SHOWCASE_CLASSES.length];
            const logCount = getVideoEngagementCount(v.title);
            const hasValidUrl =
              v.video_url && String(v.video_url).trim().startsWith("http");

            return (
              <div
                key={v.id}
                onClick={() => setPreviewVideo(v)}
                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[330px] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${showcaseClass}`}
              >
                <div className="absolute inset-0 pointer-events-none pattern-polkadot" />

                {/* Baris Atas Kartu Video */}
                <div className="flex justify-between items-start relative z-10">
                  <span className="px-3 py-1 rounded-xl text-[11px] font-bold font-mono tracking-widest uppercase badge-tint-emerald">
                    {v.category || "UMUM"} · {v.duration_label || "3-5 MENIT"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditVideoModal(v, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Edit Video & Panduan"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVideo(v, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer badge-tint-rose hover:opacity-80"
                      title="Hapus Video"
                    >
                      <Trash2 size={15} />
                    </button>
                    {hasValidUrl && (
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                        title="Buka Tautan Video"
                      >
                        <ArrowUpRight size={18} strokeWidth={1.75} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Judul & Ringkasan Prosedur Teknik */}
                <div className="my-6 relative z-10">
                  <div className="text-3xl md:text-4xl font-light tracking-tighter leading-tight mb-3">
                    {v.title}
                  </div>
                  <p className="text-xs font-medium opacity-75 line-clamp-2 leading-relaxed mb-2">
                    <strong>Teknik:</strong>{" "}
                    {v.technique_steps || "Klik untuk melihat tahapan gerakan."}
                  </p>
                  <p className="text-[11px] font-medium opacity-60 line-clamp-1">
                    <strong>Hindari:</strong>{" "}
                    {v.common_mistakes || "Belum diatur"}
                  </p>
                </div>

                {/* Baris Bawah Statistik Jurnal Mandiri Siswa */}
                <div className="flex items-end justify-between border-t border-black/10 dark:border-white/10 pt-5 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Panduan Gerak
                    </div>
                    <div className="text-sm font-bold flex items-center gap-1.5 text-gold-accent">
                      <Play size={14} /> Klik Pratinjau
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-55 mb-1">
                      Jurnal Siswa
                    </div>
                    <div className="text-4xl font-light font-mono leading-none">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setPreviewVideo(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-2">
                {previewVideo.category} · {previewVideo.duration_label}
              </span>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">
                {previewVideo.title}
              </h2>

              <div className="space-y-5">
                <div className="p-5 rounded-2xl edufit-surface-subtle">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-2">
                    01 / PROSEDUR & LANGKAH TEKNIK YANG BENAR
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {previewVideo.technique_steps}
                  </p>
                </div>

                <div className="p-5 rounded-2xl badge-tint-rose">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest block mb-2">
                    02 / KESALAHAN UMUM YANG HARUS DIHINDARI SISWA
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
                    className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer edufit-surface-subtle"
                  >
                    Edit Panduan Ini
                  </button>

                  {previewVideo.video_url && (
                    <a
                      href={previewVideo.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md btn-forest-emerald"
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
          MODAL 2: TAMBAH / EDIT VIDEO PANDUAN PRAKTIK
         ==================================================================== */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 edufit-modal-open">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsVideoModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                KONFIGURASI PUSTAKA GERAK
              </span>
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
                    {PRESET_CATEGORIES.map((cat) => {
                      const active = videoForm.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setVideoForm({ ...videoForm, category: cat })
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active ? "seg-btn-active" : "edufit-surface-subtle"
                          }`}
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
                      className="px-4 py-3.5 rounded-2xl text-sm font-bold focus:outline-none edufit-surface-subtle"
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
                      className="px-4 py-3.5 rounded-2xl text-sm font-bold font-mono focus:outline-none edufit-surface-subtle"
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
                    className="w-full bg-transparent py-3 text-2xl font-light tracking-tight focus:outline-none edufit-underline-select"
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
                    className="w-full p-4 rounded-2xl text-sm font-mono focus:outline-none edufit-surface-subtle"
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
                    className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-y edufit-surface-subtle"
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
                    className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-y edufit-surface-subtle"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingVideo}
                  className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-gold"
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