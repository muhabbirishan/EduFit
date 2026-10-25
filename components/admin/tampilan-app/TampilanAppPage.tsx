// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowUpRight,
    Edit3,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Layers,
    LayoutTemplate,
    MapPin,
    Plus,
    Smartphone,
    Target,
    Trash2,
    X
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
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

export default function TampilanAppPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";

    const [slides, setSlides] = useState<SlideRecord[]>([]);
    const [tours, setTours] = useState<TourRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [slideRes, tourRes] = await Promise.all([
                supabase.from("app_onboarding_slides").select("*").order("slide_order", { ascending: true }),
                supabase.from("app_feature_tours").select("*").order("step_order", { ascending: true }),
            ]);

            if (slideRes.error) throw slideRes.error;
            if (tourRes.error) throw tourRes.error;

            setSlides(slideRes.data || []);
            setTours(tourRes.data || []);
        } catch (error: any) {
            toast.error("Gagal menarik data CMS UI", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAddSlide = () => {
        setEditingSlideId(null);
        setSlideForm({
            slide_order: slides.length + 1,
            layout_type: "grid",
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
            image_urls: Array.isArray(slide.image_urls) ? slide.image_urls.join("\n") : "",
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
                const { error } = await supabase.from("app_onboarding_slides").update(payload).eq("id", editingSlideId);
                if (error) throw error;
                toast.success("Layar onboarding berhasil diperbarui.");
            } else {
                const { error } = await supabase.from("app_onboarding_slides").insert([payload]);
                if (error) throw error;
                toast.success("Layar onboarding baru ditambahkan.");
            }
            setIsSlideModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error("Gagal menyimpan slide", { description: err.message });
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
                    const { error } = await supabase.from("app_onboarding_slides").delete().eq("id", id);
                    if (error) return toast.error("Gagal menghapus slide");
                    toast.success("Layar dihapus");
                    fetchData();
                },
            },
            cancel: { label: "Batal" },
        });
    };

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
                const { error } = await supabase.from("app_feature_tours").update(payload).eq("id", editingTourId);
                if (error) throw error;
                toast.success("Panduan fitur berhasil diperbarui.");
            } else {
                const { error } = await supabase.from("app_feature_tours").insert([payload]);
                if (error) throw error;
                toast.success("Panduan fitur baru ditambahkan.");
            }
            setIsTourModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error("Gagal menyimpan panduan", { description: err.message });
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
                    const { error } = await supabase.from("app_feature_tours").delete().eq("id", id);
                    if (error) return toast.error("Gagal menghapus panduan");
                    toast.success("Panduan dihapus");
                    fetchData();
                },
            },
            cancel: { label: "Batal" },
        });
    };

    const activeSlidesCount = slides.filter((s) => s.is_active).length;
    const activeToursCount = tours.filter((t) => t.is_active).length;

    if (!mounted) return null;

    return (
        <div className="w-full pt-2 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-10 relative z-10">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <Smartphone size={16} /> Content Management System • Aplikasi Mobile Siswa
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Kendali UI & <br />
                        <span className="font-semibold">Panduan Aplikasi</span>
                    </h1>
                </div>

                <div className="flex flex-wrap gap-12 md:gap-20 items-baseline shrink-0">
                    <div>
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
                            {isLoading ? "—" : slides.length}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Layar Onboarding
                        </div>
                    </div>

                    <div>
                        <div className="text-7xl md:text-8xl font-light tracking-tighter leading-none text-emerald-500">
                            {isLoading ? "—" : tours.length}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4">
                            Langkah Panduan
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-8 relative z-10">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Status Konfigurasi Onboarding</span>
                        <span>{activeSlidesCount} Layar Aktif</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 border relative overflow-hidden flex items-center justify-between"
                        style={{
                            backgroundColor: "var(--ref-card-solid)",
                            borderColor: "var(--ref-card-border)",
                            backgroundImage: "var(--ref-stripe-pattern)",
                        }}
                    >
                        <span className="text-2xl font-light tracking-tight relative z-10" style={{ color: "var(--ref-text-primary)" }}>
                            {isLoading ? "—" : `${Math.round((activeSlidesCount / Math.max(1, slides.length)) * 100)}%`}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 relative z-10" style={{ color: "var(--ref-text-primary)" }}>
                            Kapasitas Sinkronisasi
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-1">
                        <span>Status Coachmark Interaktif</span>
                        <span>{activeToursCount} Langkah Aktif</span>
                    </div>
                    <div
                        className="h-14 rounded-2xl px-6 flex items-center justify-between"
                        style={{ backgroundColor: "#facc15", color: "#18181b" }}
                    >
                        <span className="text-2xl font-semibold tracking-tight">
                            {isLoading ? "—" : `${tours.length} Target`}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            Terpetakan
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20">
                <div
                    className="lg:col-span-7 p-8 md:p-10 rounded-[2.5rem] border shadow-sm flex flex-col gap-6"
                    style={{
                        backgroundColor: isDark ? "#111111" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--ref-card-border)" }}>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                                Slider Layar Awal
                            </div>
                            <h3 className="text-2xl font-light tracking-tight">Onboarding <span className="font-semibold">Siswa</span></h3>
                        </div>
                        <button
                            type="button"
                            onClick={openAddSlide}
                            className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                            style={{ backgroundColor: "#10b981" }}
                        >
                            <Plus size={14} /> Tambah Layar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {slides.length === 0 ? (
                            <div className="p-10 text-center border border-dashed rounded-3xl opacity-50" style={{ borderColor: "var(--ref-card-border)" }}>
                                Belum ada konfigurasi layar awal.
                            </div>
                        ) : (
                            slides.map((s) => (
                                <div
                                    key={s.id}
                                    className="p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    style={{
                                        backgroundColor: "var(--ref-card-subtle)",
                                        borderColor: s.is_active ? "var(--ref-card-border)" : "rgba(239, 68, 68, 0.3)",
                                        opacity: s.is_active ? 1 : 0.6,
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                            style={{ backgroundColor: "var(--ref-dark-panel)", color: "#facc15" }}
                                        >
                                            {s.slide_order}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-base leading-tight">{s.title}</span>
                                                {!s.is_active && (
                                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-500/20 text-red-500">Nonaktif</span>
                                                )}
                                            </div>
                                            <p className="text-xs opacity-60 line-clamp-1 mb-1.5">{s.subtitle}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-50">
                                                <span className="flex items-center gap-1"><LayoutTemplate size={12}/> Tata Letak: {s.layout_type}</span>
                                                <span className="flex items-center gap-1"><ImageIcon size={12}/> {Array.isArray(s.image_urls) ? s.image_urls.length : 0} Aset</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => openEditSlide(s)} className="p-2.5 rounded-xl border hover:scale-105 transition-transform cursor-pointer" style={{ borderColor: "var(--ref-card-border)", backgroundColor: "var(--ref-card-solid)" }}>
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteSlide(s.id, s.title)} className="p-2.5 rounded-xl border hover:scale-105 transition-transform text-red-500 hover:bg-red-500/10 cursor-pointer" style={{ borderColor: "var(--ref-card-border)", backgroundColor: "var(--ref-card-solid)" }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div
                    className="lg:col-span-5 p-8 md:p-10 rounded-[2.5rem] border shadow-sm flex flex-col gap-6"
                    style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--ref-card-border)" }}>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                                Interaksi Pertama
                            </div>
                            <h3 className="text-2xl font-light tracking-tight">Panduan <span className="font-semibold">Fitur</span></h3>
                        </div>
                        <button
                            type="button"
                            onClick={openAddTour}
                            className="px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90 border"
                            style={{ backgroundColor: "var(--ref-card-solid)", color: "var(--ref-text-primary)", borderColor: "var(--ref-card-border)" }}
                        >
                            <Plus size={14} /> Tambah
                        </button>
                    </div>

                    <div className="space-y-4">
                        {tours.length === 0 ? (
                            <div className="p-10 text-center border border-dashed rounded-3xl opacity-50" style={{ borderColor: "var(--ref-card-border)" }}>
                                Belum ada titik panduan fitur terdaftar.
                            </div>
                        ) : (
                            tours.map((t) => (
                                <div
                                    key={t.id}
                                    className="p-5 rounded-3xl border flex flex-col gap-3"
                                    style={{
                                        backgroundColor: "var(--ref-card-subtle)",
                                        borderColor: t.is_active ? "var(--ref-card-border)" : "rgba(239, 68, 68, 0.3)",
                                        opacity: t.is_active ? 1 : 0.6,
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                            <span className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">Langkah 0{t.step_order}</span>
                                            <span className="flex items-center gap-1 opacity-60"><Target size={12}/> Kunci: {t.target_key}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEditTour(t)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"><Edit3 size={13}/></button>
                                            <button onClick={() => handleDeleteTour(t.id, t.target_key)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 cursor-pointer"><Trash2 size={13}/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm leading-tight mb-1">{t.title}</p>
                                        <p className="text-xs opacity-70 leading-relaxed">{t.description}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL SLIDE ONBOARDING */}
            <AnimatePresence>
                {isSlideModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsSlideModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                            style={{ backgroundColor: isDark ? "#141414" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
                        >
                            <button onClick={() => setIsSlideModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"><X size={20} /></button>
                            <h2 className="text-3xl font-light tracking-tight mb-6">{editingSlideId ? "Edit" : "Tambah"} <span className="font-semibold">Layar Onboarding</span></h2>
                            <form onSubmit={handleSaveSlide} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Urutan Tampil</label>
                                        <input required type="number" min={1} value={slideForm.slide_order} onChange={(e) => setSlideForm({ ...slideForm, slide_order: Number(e.target.value) })} className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Tata Letak (Layout)</label>
                                        <select value={slideForm.layout_type} onChange={(e) => setSlideForm({ ...slideForm, layout_type: e.target.value })} className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent cursor-pointer" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
                                            <option value="grid">Grid (Banyak Gambar)</option>
                                            <option value="route">Route (Rute Vertikal)</option>
                                            <option value="orbit">Orbit (Terpusat)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Judul Utama</label>
                                    <input required type="text" value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} className="w-full bg-transparent border-b-2 py-3 text-xl font-light tracking-tight focus:outline-none" style={{ borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Sub-Judul (Penjelasan Singkat)</label>
                                    <textarea required rows={2} value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} className="w-full p-4 rounded-2xl text-sm font-medium border resize-y outline-none bg-transparent" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">URL Gambar (Pisahkan dengan Enter)</label>
                                    <textarea rows={3} value={slideForm.image_urls} onChange={(e) => setSlideForm({ ...slideForm, image_urls: e.target.value })} className="w-full p-4 rounded-2xl text-xs border resize-y outline-none bg-transparent" placeholder="https://media.com/1.png&#10;https://media.com/2.png" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isActiveSlide" checked={slideForm.is_active} onChange={(e) => setSlideForm({ ...slideForm, is_active: e.target.checked })} className="w-4 h-4 cursor-pointer" />
                                    <label htmlFor="isActiveSlide" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Layar Aktif Ditampilkan</label>
                                </div>
                                <button type="submit" disabled={isSubmittingSlide} className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md text-white" style={{ backgroundColor: "#10b981" }}>
                                    {isSubmittingSlide ? "Menyimpan..." : "Simpan Konfigurasi"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PANDUAN FITUR */}
            <AnimatePresence>
                {isTourModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsTourModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                            style={{ backgroundColor: isDark ? "#141414" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
                        >
                            <button onClick={() => setIsTourModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full opacity-60 hover:opacity-100 cursor-pointer"><X size={20} /></button>
                            <h2 className="text-3xl font-light tracking-tight mb-6">{editingTourId ? "Edit" : "Tambah"} <span className="font-semibold">Titik Panduan Fitur</span></h2>
                            <form onSubmit={handleSaveTour} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Urutan Tahap</label>
                                        <input required type="number" min={1} value={tourForm.step_order} onChange={(e) => setTourForm({ ...tourForm, step_order: Number(e.target.value) })} className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Kunci Target UI</label>
                                        <input required type="text" value={tourForm.target_key} onChange={(e) => setTourForm({ ...tourForm, target_key: e.target.value })} placeholder="Cth: NAV_PROFILE" className="w-full p-3.5 rounded-2xl text-xs font-bold border outline-none bg-transparent" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Judul Tooltip</label>
                                    <input required type="text" value={tourForm.title} onChange={(e) => setTourForm({ ...tourForm, title: e.target.value })} className="w-full bg-transparent border-b-2 py-3 text-xl font-light tracking-tight focus:outline-none" style={{ borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-1.5">Deskripsi Penjelasan</label>
                                    <textarea required rows={3} value={tourForm.description} onChange={(e) => setTourForm({ ...tourForm, description: e.target.value })} className="w-full p-4 rounded-2xl text-sm font-medium border resize-y outline-none bg-transparent" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isActiveTour" checked={tourForm.is_active} onChange={(e) => setTourForm({ ...tourForm, is_active: e.target.checked })} className="w-4 h-4 cursor-pointer" />
                                    <label htmlFor="isActiveTour" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Panduan Aktif</label>
                                </div>
                                <button type="submit" disabled={isSubmittingTour} className="w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md text-white" style={{ backgroundColor: "#10b981" }}>
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