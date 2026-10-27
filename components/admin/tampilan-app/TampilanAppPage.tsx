// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    AlertCircle,
    Bell,
    CheckCircle2,
    ChevronDown,
    Download,
    Edit3,
    Image as ImageIcon,
    Layers,
    LayoutTemplate,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Smartphone,
    Target,
    Trash2,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface SlideRecord {
  id: string;
  slide_order: number;
  layout_type: string;
  title: string;
  subtitle: string;
  image_urls: string[];
  is_active: boolean;
}

interface TourRecord {
  id: string;
  step_order: number;
  target_key: string;
  title: string;
  description: string;
  is_active: boolean;
}

interface IslandNotification {
  id: number;
  message: string;
  subtitle?: string;
  type: "success" | "error" | "info";
}

const LAYOUT_OPTIONS = [
  { key: "grid", label: "Grid (Multi-Gambar)" },
  { key: "route", label: "Route (Alur Vertikal)" },
  { key: "orbit", label: "Orbit (Terpusat)" },
];

export default function TampilanAppPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [slides, setSlides] = useState<SlideRecord[]>([]);
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Filter & Kontrol Visual Trio Bento
  const [layoutFilter, setLayoutFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [gaugeMode, setGaugeMode] = useState<"slides" | "tours" | "assets">("slides");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Form State untuk Onboarding Slide
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState({
    slide_order: 1,
    layout_type: "grid",
    title: "",
    subtitle: "",
    image_urls: "",
    is_active: true,
  });
  const [isSubmittingSlide, setIsSubmittingSlide] = useState(false);

  // Form State untuk Feature Tour
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [tourForm, setTourForm] = useState({
    step_order: 1,
    target_key: "",
    title: "",
    description: "",
    is_active: true,
  });
  const [isSubmittingTour, setIsSubmittingTour] = useState(false);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchData = useCallback(
    async (notify = false) => {
      setIsLoading(true);
      try {
        const [slideRes, tourRes] = await Promise.all([
          supabase
            .from("app_onboarding_slides")
            .select("*")
            .order("slide_order", { ascending: true }),
          supabase
            .from("app_feature_tours")
            .select("*")
            .order("step_order", { ascending: true }),
        ]);

        if (slideRes.error) throw slideRes.error;
        if (tourRes.error) throw tourRes.error;

        const sData = slideRes.data || [];
        const tData = tourRes.data || [];
        setSlides(sData);
        setTours(tData);

        if (notify) {
          triggerDynamicIsland(
            "Konfigurasi UI Mobile Disinkronkan",
            `${sData.length} layar onboarding & ${tData.length} titik coachmark dimuat.`,
            "success"
          );
        }
      } catch (error: any) {
        toast.error("Gagal menarik data CMS UI", {
          description: error.message,
        });
        triggerDynamicIsland(
          "Gagal Memuat CMS Aplikasi",
          error?.message || "Periksa koneksi tabel onboarding & feature tours.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [triggerDynamicIsland]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // ==========================================================================
  // CRUD ONBOARDING SLIDES
  // ==========================================================================
  const openAddSlide = () => {
    setEditingSlideId(null);
    setSlideForm({
      slide_order: slides.length + 1,
      layout_type: layoutFilter === "all" ? "grid" : layoutFilter,
      title: "",
      subtitle: "",
      image_urls: "",
      is_active: true,
    });
    setIsSlideModalOpen(true);
  };

  const openEditSlide = (slide: SlideRecord) => {
    setEditingSlideId(slide.id);
    setSlideForm({
      slide_order: slide.slide_order,
      layout_type: slide.layout_type || "grid",
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      image_urls: Array.isArray(slide.image_urls)
        ? slide.image_urls.join("\n")
        : "",
      is_active: slide.is_active ?? true,
    });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSlide(true);
    try {
      const parsedImages = slideForm.image_urls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean);

      const payload = {
        slide_order: Number(slideForm.slide_order),
        layout_type: slideForm.layout_type,
        title: slideForm.title.trim(),
        subtitle: slideForm.subtitle.trim(),
        image_urls: parsedImages,
        is_active: slideForm.is_active,
      };

      if (editingSlideId) {
        const { error } = await supabase
          .from("app_onboarding_slides")
          .update(payload)
          .eq("id", editingSlideId);
        if (error) throw error;
        triggerDynamicIsland(
          "Layar Onboarding Diperbarui",
          `Slide #${payload.slide_order}: ${payload.title} (${payload.layout_type})`,
          "success"
        );
      } else {
        const { error } = await supabase
          .from("app_onboarding_slides")
          .insert([payload]);
        if (error) throw error;
        triggerDynamicIsland(
          "Layar Onboarding Ditambahkan",
          `Slide #${payload.slide_order} siap tampil di aplikasi mobile siswa.`,
          "success"
        );
      }
      setIsSlideModalOpen(false);
      fetchData(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan slide", { description: err.message });
      triggerDynamicIsland(
        "Gagal Menyimpan Slide",
        err?.message || "Periksa kebijakan tabel app_onboarding_slides.",
        "error"
      );
    } finally {
      setIsSubmittingSlide(false);
    }
  };

  const handleDeleteSlide = (id: string, title: string) => {
    toast("Hapus Layar Onboarding", {
      description: `Yakin menghapus layar "${title}"?`,
      action: {
        label: "Hapus",
        onClick: async () => {
          const { error } = await supabase
            .from("app_onboarding_slides")
            .delete()
            .eq("id", id);
          if (error) return toast.error("Gagal menghapus slide");
          triggerDynamicIsland(
            "Layar Onboarding Dihapus",
            `Slide "${title}" telah dihapus dari sistem.`,
            "info"
          );
          fetchData(false);
        },
      },
      cancel: { label: "Batal" },
    });
  };

  // ==========================================================================
  // CRUD FEATURE TOURS (COACHMARK)
  // ==========================================================================
  const openAddTour = () => {
    setEditingTourId(null);
    setTourForm({
      step_order: tours.length + 1,
      target_key: "",
      title: "",
      description: "",
      is_active: true,
    });
    setIsTourModalOpen(true);
  };

  const openEditTour = (tour: TourRecord) => {
    setEditingTourId(tour.id);
    setTourForm({
      step_order: tour.step_order,
      target_key: tour.target_key || "",
      title: tour.title || "",
      description: tour.description || "",
      is_active: tour.is_active ?? true,
    });
    setIsTourModalOpen(true);
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTour(true);
    try {
      const payload = {
        step_order: Number(tourForm.step_order),
        target_key: tourForm.target_key.trim(),
        title: tourForm.title.trim(),
        description: tourForm.description.trim(),
        is_active: tourForm.is_active,
      };

      if (editingTourId) {
        const { error } = await supabase
          .from("app_feature_tours")
          .update(payload)
          .eq("id", editingTourId);
        if (error) throw error;
        triggerDynamicIsland(
          "Panduan Fitur Diperbarui",
          `Tahap 0${payload.step_order} (${payload.target_key}) berhasil disimpan.`,
          "success"
        );
      } else {
        const { error } = await supabase
          .from("app_feature_tours")
          .insert([payload]);
        if (error) throw error;
        triggerDynamicIsland(
          "Panduan Fitur Ditambahkan",
          `Target UI ${payload.target_key} berhasil dipetakan.`,
          "success"
        );
      }
      setIsTourModalOpen(false);
      fetchData(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan panduan", { description: err.message });
      triggerDynamicIsland(
        "Gagal Menyimpan Panduan",
        err?.message || "Periksa kebijakan tabel app_feature_tours.",
        "error"
      );
    } finally {
      setIsSubmittingTour(false);
    }
  };

  const handleDeleteTour = (id: string, key: string) => {
    toast("Hapus Panduan Fitur", {
      description: `Yakin menghapus panduan target "${key}"?`,
      action: {
        label: "Hapus",
        onClick: async () => {
          const { error } = await supabase
            .from("app_feature_tours")
            .delete()
            .eq("id", id);
          if (error) return toast.error("Gagal menghapus panduan");
          triggerDynamicIsland(
            "Panduan Fitur Dihapus",
            `Coachmark target "${key}" telah dihapus.`,
            "info"
          );
          fetchData(false);
        },
      },
      cancel: { label: "Batal" },
    });
  };

  // ==========================================================================
  // KALKULASI TELEMETRI & FILTER
  // ==========================================================================
  const activeSlidesCount = useMemo(
    () => slides.filter((s) => s.is_active).length,
    [slides]
  );
  const activeToursCount = useMemo(
    () => tours.filter((t) => t.is_active).length,
    [tours]
  );
  const totalImageAssets = useMemo(
    () =>
      slides.reduce(
        (acc, s) =>
          acc + (Array.isArray(s.image_urls) ? s.image_urls.length : 0),
        0
      ),
    [slides]
  );

  const slideActivePct = useMemo(
    () =>
      slides.length > 0
        ? Math.round((activeSlidesCount / slides.length) * 100)
        : 0,
    [slides.length, activeSlidesCount]
  );

  const tourActivePct = useMemo(
    () =>
      tours.length > 0
        ? Math.round((activeToursCount / tours.length) * 100)
        : 0,
    [tours.length, activeToursCount]
  );

  const filteredSlides = useMemo(() => {
    return slides.filter((s) => {
      if (
        layoutFilter !== "all" &&
        String(s.layout_type || "grid").toLowerCase() !== layoutFilter
      ) {
        return false;
      }
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "inactive" && s.is_active) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(s.title || "").toLowerCase().includes(q) ||
        String(s.subtitle || "").toLowerCase().includes(q) ||
        String(s.layout_type || "").toLowerCase().includes(q)
      );
    });
  }, [slides, layoutFilter, statusFilter, searchQuery]);

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      if (statusFilter === "active" && !t.is_active) return false;
      if (statusFilter === "inactive" && t.is_active) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(t.title || "").toLowerCase().includes(q) ||
        String(t.description || "").toLowerCase().includes(q) ||
        String(t.target_key || "").toLowerCase().includes(q)
      );
    });
  }, [tours, statusFilter, searchQuery]);

  const handleExportCMS = () => {
    const rows = [
      ["Tipe", "Urutan", "Kode/Layout", "Judul", "Deskripsi", "Status"],
      ...slides.map((s) => [
        "Onboarding Slide",
        s.slide_order,
        s.layout_type,
        `"${String(s.title || "").replace(/"/g, '""')}"`,
        `"${String(s.subtitle || "").replace(/"/g, '""')}"`,
        s.is_active ? "Aktif" : "Nonaktif",
      ]),
      ...tours.map((t) => [
        "Feature Tour",
        t.step_order,
        t.target_key,
        `"${String(t.title || "").replace(/"/g, '""')}"`,
        `"${String(t.description || "").replace(/"/g, '""')}"`,
        t.is_active ? "Aktif" : "Nonaktif",
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Konfigurasi_UI_Mobile_EduFit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDynamicIsland(
      "Konfigurasi UI Diekspor",
      `${slides.length} slide & ${tours.length} coachmark telah diunduh ke CSV.`,
      "success"
    );
  };

  if (!mounted) return null;

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
              00 / MOBILE APP CMS
            </span>
            <span>—</span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone size={15} />
              Konfigurasi Antarmuka & Coachmark Aplikasi Siswa
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[1.05]">
            Kendali UI & <br />
            <span className="font-semibold">Panduan Aplikasi</span>
          </h1>
        </div>

        {/* 3 Angka Raksasa Terbuka */}
        <div className="flex flex-wrap gap-12 md:gap-16 items-baseline shrink-0">
          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : slides.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              01 / Layar Onboarding
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none text-emerald-accent">
              {isLoading ? "—" : tours.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              02 / Langkah Panduan
            </div>
          </div>

          <div>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : totalImageAssets}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-55 mt-4">
              03 / Aset Visual
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 2: 4 BAR TELEMETRI UI MOBILE
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end mb-10 relative z-10">
        {/* Bar 1: Onboarding Aktif */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Layar Onboarding</span>
            <span className="font-mono">{activeSlidesCount} AKTIF</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-forest">
            <span className="text-2xl font-light font-mono tracking-tight">
              {isLoading ? "—" : `${activeSlidesCount}/${slides.length}`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider opacity-70">
              SLIDER AWAL
            </span>
          </div>
        </div>

        {/* Bar 2: Coachmark Interaktif */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Status Coachmark</span>
            <span className="font-mono">{activeToursCount} AKTIF</span>
          </div>
          <div className="h-14 rounded-2xl px-6 flex items-center justify-between telemetry-bar-gold">
            <span className="text-2xl font-semibold font-mono tracking-tight">
              {isLoading ? "—" : `${tours.length} Target`}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Terpetakan
            </span>
          </div>
        </div>

        {/* Bar 3: Striped Track Murni */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Kapasitas Sinkronisasi UI</span>
            <span className="font-mono">REAL-TIME MOBILE</span>
          </div>
          <div className="h-14 rounded-2xl px-6 relative overflow-hidden flex items-center justify-between telemetry-bar-striped">
            <span className="text-2xl font-light font-mono tracking-tight relative z-10">
              {isLoading ? "—" : `${slideActivePct}% Aktif`}
            </span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-widest opacity-65 relative z-10">
              SIAP TAYANG
            </span>
          </div>
        </div>

        {/* Bar 4: Total Aset Gambar */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
            <span>Media Slide</span>
            <span className="font-mono">URL</span>
          </div>
          <div className="h-14 rounded-2xl px-5 flex items-center justify-center edufit-card-primary">
            <span className="text-2xl font-light font-mono tracking-tight text-emerald-accent">
              {isLoading ? "—" : `${totalImageAssets} Aset`}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 3: TRIO KARTU BENTO LEBAR (POLKADOT + GRID MILIMETER + DIAGONAL)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 mb-10">
        {/* BENTO 1 (PATTERN POLKADOT): KENDALI & FILTER KONFIGURASI UI */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-visible flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden pattern-polkadot" />

          <div className="relative z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-55">
                <span className="font-mono">01 /</span>
                <SlidersHorizontal size={14} />
                <span>Filter Antarmuka</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchData(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                  title="Muat Ulang Data UI"
                >
                  <RotateCcw
                    size={15}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleExportCMS}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer edufit-surface-subtle"
                  title="Ekspor Konfigurasi CSV"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>

            <h2 className="text-3xl font-light tracking-tight mb-2">
              Filter Layar & Tour
            </h2>
            <p className="text-sm mb-5 leading-relaxed font-medium opacity-55">
              Saring layar onboarding berdasarkan tipe tata letak atau status
              penayangan di aplikasi siswa.
            </p>

            {/* Segmented Filter Layout Onboarding */}
            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-5 edufit-surface-subtle">
              {[
                { k: "all", l: "Semua" },
                { k: "grid", l: "Grid" },
                { k: "route", l: "Route" },
                { k: "orbit", l: "Orbit" },
              ].map((lt) => {
                const active = layoutFilter === lt.k;
                return (
                  <button
                    key={lt.k}
                    type="button"
                    onClick={() => setLayoutFilter(lt.k)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active ? "seg-btn-active" : "seg-btn-idle"
                    }`}
                  >
                    {lt.l}
                  </button>
                );
              })}
            </div>

            {/* Bottom-Bordered Custom Dropdown Status Tayang */}
            <div className="relative w-full mb-5" ref={statusDropdownRef}>
              <div
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`w-full bg-transparent py-2.5 text-xl font-light tracking-tight cursor-pointer flex justify-between items-center select-none edufit-underline-select ${
                  isStatusDropdownOpen ? "edufit-underline-select-active" : ""
                }`}
              >
                <span className="truncate pr-3">
                  {statusFilter === "all"
                    ? "Semua Status Tayang"
                    : statusFilter === "active"
                    ? "Hanya Status Aktif"
                    : "Hanya Status Nonaktif"}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 opacity-60 shrink-0 ${
                    isStatusDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {isStatusDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden edufit-dropdown-menu"
                  >
                    {[
                      { k: "all", l: "Semua Status Tayang" },
                      { k: "active", l: "Hanya Status Aktif" },
                      { k: "inactive", l: "Hanya Status Nonaktif" },
                    ].map((st) => (
                      <div
                        key={st.k}
                        onClick={() => {
                          setStatusFilter(st.k as any);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`px-5 py-3.5 text-base font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                          statusFilter === st.k ? "text-gold-accent" : ""
                        }`}
                      >
                        {st.l}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pencarian Cepat */}
            <div className="relative w-full mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul slide atau kunci target UI..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-semibold outline-none edufit-surface-subtle"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10 pt-2">
            <button
              type="button"
              onClick={openAddSlide}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm btn-forest-emerald"
            >
              <Plus size={14} /> Slide Baru
            </button>
            <button
              type="button"
              onClick={openAddTour}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.01] cursor-pointer shadow-sm telemetry-bar-forest"
            >
              <Plus size={14} /> Tour Baru
            </button>
          </div>
        </div>

        {/* BENTO 2 (PATTERN GRID MILIMETER): SEBARAN ASET VISUAL PER SLIDE ONBOARDING */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-secondary">
          <div className="absolute inset-0 pointer-events-none pattern-millimeter-grid" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">02 /</span>
              <Layers size={15} />
              <span>Aset Visual per Slide</span>
            </div>
            <span className="text-[11px] font-bold font-mono opacity-55">
              KLIK EDIT
            </span>
          </div>

          <div className="my-4 flex items-end gap-3 relative z-10">
            <div className="text-6xl font-light font-mono tracking-tighter leading-none">
              {isLoading ? "—" : totalImageAssets}
            </div>
            <div className="text-sm font-semibold opacity-55 mb-1">
              Total Aset Gambar Onboarding
            </div>
          </div>

          {(() => {
            const bars =
              slides.length > 0
                ? slides.slice(0, 6)
                : [
                    {
                      id: "1",
                      slide_order: 1,
                      layout_type: "grid",
                      title: "Slide 1",
                      image_urls: [],
                    },
                    {
                      id: "2",
                      slide_order: 2,
                      layout_type: "route",
                      title: "Slide 2",
                      image_urls: [],
                    },
                    {
                      id: "3",
                      slide_order: 3,
                      layout_type: "orbit",
                      title: "Slide 3",
                      image_urls: [],
                    },
                  ];

            const maxAssets = Math.max(
              1,
              ...bars.map((b: any) =>
                Array.isArray(b.image_urls) ? b.image_urls.length : 0
              )
            );

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
                {bars.map((s: any, idx: number) => {
                  const imgCount = Array.isArray(s.image_urls)
                    ? s.image_urls.length
                    : 0;
                  const heightPct = Math.round((imgCount / maxAssets) * 100);
                  const isHighest = imgCount === maxAssets && imgCount > 0;
                  const fillClass = isHighest
                    ? "chart-fill-gold"
                    : "chart-fill-primary";

                  return (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => slides.length > 0 && openEditSlide(s)}
                      className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer focus:outline-none"
                      title={`${s.title}: ${imgCount} Aset (${s.layout_type})`}
                    >
                      <span className="text-[11px] font-bold font-mono opacity-80">
                        {imgCount}a
                      </span>
                      <div className="w-3.5 flex-1 rounded-full flex items-end overflow-hidden p-[1px] chart-track-pill">
                        <div
                          className={`w-full rounded-full transition-all duration-500 group-hover:scale-y-105 ${fillClass}`}
                          style={{
                            height: `${Math.max(
                              imgCount > 0 ? 22 : 10,
                              heightPct
                            )}%`,
                          }}
                        />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${fillClass}`} />
                      <span className="text-[10px] font-bold font-mono opacity-65">
                        S0{s.slide_order || idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* BENTO 3 (PATTERN DIAGONAL STRIPES + CIRCULAR TICK-MARK GAUGE): INDEKS KESIAPAN UI */}
        <div className="lg:col-span-4 p-8 md:p-9 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[390px] edufit-card-primary">
          <div className="absolute inset-0 pointer-events-none pattern-diagonal-stripes" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-55 text-xs font-bold uppercase tracking-widest">
              <span className="font-mono">03 /</span>
              <Activity size={15} />
              <span>Indeks Kesiapan UI</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "slides", label: "Slide" },
                { key: "tours", label: "Tour" },
                { key: "assets", label: "Aset" },
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
              gaugeMode === "slides"
                ? `${slideActivePct}%`
                : gaugeMode === "tours"
                ? `${tourActivePct}%`
                : `${totalImageAssets}`;

            const gaugeLabel =
              gaugeMode === "slides"
                ? "Layar Onboarding Aktif"
                : gaugeMode === "tours"
                ? "Langkah Coachmark Aktif"
                : "Total Aset Gambar Terpasang";

            const gaugePct =
              gaugeMode === "slides"
                ? slideActivePct
                : gaugeMode === "tours"
                ? tourActivePct
                : Math.min(100, totalImageAssets * 12);

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
                      gaugeMode === "tours"
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
              <span>{activeSlidesCount} Slide Aktif</span>
              <span>—</span>
              <span>{activeToursCount} Coachmark Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ZONA 4: 2 KOLOM KONFIGURASI (ONBOARDING SLIDES & FEATURE TOURS)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20">
        {/* KIRI (col-span-7): ONBOARDING SLIDES */}
        <div className="lg:col-span-7 p-8 md:p-10 rounded-[2rem] flex flex-col gap-6 edufit-card-primary">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-55 block mb-1">
                04 / SLIDER LAYAR AWAL ({filteredSlides.length})
              </span>
              <h3 className="text-2xl font-light tracking-tight">
                Onboarding <span className="font-semibold">Siswa</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={openAddSlide}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90 btn-forest-emerald"
            >
              <Plus size={14} /> Tambah Layar
            </button>
          </div>

          <div className="space-y-4">
            {filteredSlides.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-hairline rounded-2xl opacity-55">
                Belum ada konfigurasi layar awal pada filter ini.
              </div>
            ) : (
              filteredSlides.map((s) => (
                <div
                  key={s.id}
                  className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-opacity ${
                    s.is_active
                      ? "edufit-surface-subtle"
                      : "badge-tint-rose opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 telemetry-bar-forest text-gold-accent">
                      0{s.slide_order}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-base leading-tight">
                          {s.title}
                        </span>
                        {!s.is_active && (
                          <span className="text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-md badge-tint-rose">
                            NONAKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-65 line-clamp-1 mb-2">
                        {s.subtitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold font-mono uppercase tracking-widest opacity-60">
                        <span className="flex items-center gap-1">
                          <LayoutTemplate size={12} /> LAYOUT: {s.layout_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <ImageIcon size={12} />{" "}
                          {Array.isArray(s.image_urls)
                            ? s.image_urls.length
                            : 0}{" "}
                          ASET
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditSlide(s)}
                      className="p-2.5 rounded-xl hover:scale-105 transition-transform cursor-pointer edufit-card-primary"
                      title="Edit Layar"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(s.id, s.title)}
                      className="p-2.5 rounded-xl hover:scale-105 transition-transform cursor-pointer badge-tint-rose"
                      title="Hapus Layar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KANAN (col-span-5): PANDUAN FITUR (COACHMARK) */}
        <div className="lg:col-span-5 p-8 md:p-10 rounded-[2rem] flex flex-col gap-6 edufit-card-secondary">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-55 block mb-1">
                05 / INTERAKSI PERTAMA ({filteredTours.length})
              </span>
              <h3 className="text-2xl font-light tracking-tight">
                Panduan <span className="font-semibold">Fitur</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={openAddTour}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90 telemetry-bar-forest"
            >
              <Plus size={14} /> Tambah
            </button>
          </div>

          <div className="space-y-4">
            {filteredTours.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-hairline rounded-2xl opacity-55">
                Belum ada titik panduan fitur terdaftar.
              </div>
            ) : (
              filteredTours.map((t) => (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl flex flex-col gap-3 ${
                    t.is_active
                      ? "edufit-surface-subtle"
                      : "badge-tint-rose opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest">
                      <span className="px-2.5 py-1 rounded-md telemetry-bar-forest text-gold-accent">
                        TAHAP 0{t.step_order}
                      </span>
                      <span className="flex items-center gap-1 opacity-70">
                        <Target size={12} /> {t.target_key}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditTour(t)}
                        className="p-2 rounded-lg cursor-pointer edufit-card-primary"
                        title="Edit Panduan"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTour(t.id, t.target_key)}
                        className="p-2 rounded-lg cursor-pointer badge-tint-rose"
                        title="Hapus Panduan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight mb-1">
                      {t.title}
                    </p>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: SLIDE ONBOARDING (BEBAS <select> BAWAAN BROWSER)
         ==================================================================== */}
      <AnimatePresence>
        {isSlideModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsSlideModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                KONFIGURASI LAYAR AWAL MOBILE
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                {editingSlideId ? "Edit" : "Tambah"}{" "}
                <span className="font-semibold">Layar Onboarding</span>
              </h2>

              <form onSubmit={handleSaveSlide} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Urutan Tampil Slide
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={slideForm.slide_order}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        slide_order: Number(e.target.value),
                      })
                    }
                    className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Pilih Tipe Tata Letak (Layout)
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl edufit-surface-subtle">
                    {LAYOUT_OPTIONS.map((opt) => {
                      const active = slideForm.layout_type === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setSlideForm({
                              ...slideForm,
                              layout_type: opt.key,
                            })
                          }
                          className={`py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            active ? "seg-btn-active" : "seg-btn-idle"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Judul Utama Layar
                  </label>
                  <input
                    required
                    type="text"
                    value={slideForm.title}
                    onChange={(e) =>
                      setSlideForm({ ...slideForm, title: e.target.value })
                    }
                    placeholder="Contoh: Pantau Kebugaran Jasmani Secara Presisi"
                    className="w-full bg-transparent py-3 text-xl font-light tracking-tight focus:outline-none edufit-underline-select"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Sub-Judul (Penjelasan Singkat)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={slideForm.subtitle}
                    onChange={(e) =>
                      setSlideForm({ ...slideForm, subtitle: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl text-sm font-medium resize-y outline-none edufit-surface-subtle"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    URL Gambar (Pisahkan dengan Baris Baru / Enter)
                  </label>
                  <textarea
                    rows={3}
                    value={slideForm.image_urls}
                    onChange={(e) =>
                      setSlideForm({ ...slideForm, image_urls: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl text-xs font-mono resize-y outline-none edufit-surface-subtle"
                    placeholder="https://media.com/1.png&#10;https://media.com/2.png"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveSlide"
                    checked={slideForm.is_active}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="isActiveSlide"
                    className="text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    Layar Aktif Ditampilkan di Aplikasi Siswa
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSlide}
                  className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-emerald"
                >
                  {isSubmittingSlide ? "Menyimpan..." : "Simpan Konfigurasi"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 2: PANDUAN FITUR (COACHMARK)
         ==================================================================== */}
      <AnimatePresence>
        {isTourModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setIsTourModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] p-8 md:p-10 relative z-10 shadow-2xl edufit-card-primary"
            >
              <button
                type="button"
                onClick={() => setIsTourModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
              >
                <X size={18} />
              </button>

              <span className="text-xs font-bold font-mono uppercase tracking-widest text-gold-accent block mb-1">
                PEMETAAN ELEMEN UI MOBILE
              </span>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                {editingTourId ? "Edit" : "Tambah"}{" "}
                <span className="font-semibold">Titik Panduan Fitur</span>
              </h2>

              <form onSubmit={handleSaveTour} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                      Urutan Tahap
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={tourForm.step_order}
                      onChange={(e) =>
                        setTourForm({
                          ...tourForm,
                          step_order: Number(e.target.value),
                        })
                      }
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                      Kunci Target UI
                    </label>
                    <input
                      required
                      type="text"
                      value={tourForm.target_key}
                      onChange={(e) =>
                        setTourForm({
                          ...tourForm,
                          target_key: e.target.value,
                        })
                      }
                      placeholder="Cth: NAV_PROFILE"
                      className="w-full p-3.5 rounded-2xl text-xs font-bold font-mono outline-none edufit-surface-subtle"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Judul Tooltip Coachmark
                  </label>
                  <input
                    required
                    type="text"
                    value={tourForm.title}
                    onChange={(e) =>
                      setTourForm({ ...tourForm, title: e.target.value })
                    }
                    className="w-full bg-transparent py-3 text-xl font-light tracking-tight focus:outline-none edufit-underline-select"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-60 block mb-1.5">
                    Deskripsi Penjelasan
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={tourForm.description}
                    onChange={(e) =>
                      setTourForm({ ...tourForm, description: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl text-sm font-medium resize-y outline-none edufit-surface-subtle"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveTour"
                    checked={tourForm.is_active}
                    onChange={(e) =>
                      setTourForm({
                        ...tourForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="isActiveTour"
                    className="text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    Panduan Fitur Aktif
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTour}
                  className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md btn-forest-emerald"
                >
                  {isSubmittingTour ? "Menyimpan..." : "Simpan Panduan Fitur"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}