// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    Archive,
    Bell,
    BookOpen,
    Building2,
    Dumbbell,
    FileText,
    Home,
    LogOut,
    Menu,
    Moon,
    RefreshCw,
    Smartphone, // <-- Tambahan icon untuk Tampilan App
    Sun,
    Target,
    X
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Sidebar({
    isMobileOpen,
    closeMobile,
    isCollapsed,
    setIsCollapsed
}: {
    isMobileOpen?: boolean;
    closeMobile?: () => void;
    isCollapsed?: boolean;
    setIsCollapsed?: (val: boolean) => void;
}) {
    const pathname = usePathname();
    const { resolvedTheme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [logoError, setLogoError] = useState(false);

    // State Popover Aktivitas Real-time Database
    const [notifOpen, setNotifOpen] = useState(false);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (typeof isMobileOpen === "boolean") {
            setMobileMenuOpen(isMobileOpen);
        }
    }, [isMobileOpen]);

    useEffect(() => {
        setLogoError(false);
    }, [resolvedTheme]);

    // Tutup popover saat klik di luar
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchRecentActivity = async () => {
        setLoadingLogs(true);
        try {
            const [refRes, metRes] = await Promise.all([
                supabase
                    .from("student_reflections")
                    .select("id, unit_name, created_at, grade, score")
                    .order("created_at", { ascending: false })
                    .limit(3),
                supabase
                    .from("student_physical_metrics")
                    .select("id, tkji_category, total_tkji_score, created_at")
                    .order("created_at", { ascending: false })
                    .limit(3)
            ]);

            const combined: any[] = [];
            (refRes.data || []).forEach((r: any) => {
                combined.push({
                    id: `ref-${r.id}`,
                    title: `Refleksi: ${r.unit_name}`,
                    subtitle: r.grade
                        ? `Sudah dinilai Guru (${r.grade})`
                        : "Menunggu penilaian Guru",
                    href: "/admin/materi",
                    time: r.created_at
                });
            });
            (metRes.data || []).forEach((m: any) => {
                combined.push({
                    id: `met-${m.id}`,
                    title: `Rekam Fisik TKJI (Skor ${m.total_tkji_score || "-"})`,
                    subtitle: `Kategori: ${m.tkji_category || "Tercatat"}`,
                    href: "/admin/program",
                    time: m.created_at
                });
            });

            setRecentLogs(combined.slice(0, 5));
        } catch {
            setRecentLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const toggleNotifPopover = () => {
        const next = !notifOpen;
        setNotifOpen(next);
        if (next) fetchRecentActivity();
    };

    // Pendaftaran Rute Navbar Admin (Tampilan App ditambahkan di sini)
    const menuItems = [
        { icon: Home, label: "Dashboard", href: "/admin" },
        { icon: Building2, label: "Institusi", href: "/admin/institusi" },
        { icon: FileText, label: "Evaluasi", href: "/admin/evaluasi" },
        { icon: BookOpen, label: "Materi", href: "/admin/materi" },
        { icon: Activity, label: "Praktik", href: "/admin/praktik" },
        { icon: Target, label: "Instrumen", href: "/admin/instrumen" },
        { icon: Dumbbell, label: "Program", href: "/admin/program" },
        { icon: Archive, label: "Arsip", href: "/admin/arsip" },
        { icon: Smartphone, label: "Tampilan UI", href: "/admin/tampilan-app" }
    ];

    const handleLogout = () => {
        toast("Konfirmasi Keluar", {
            description: "Apakah Anda yakin ingin keluar dari sistem EduFit?",
            action: {
                label: "Ya, Keluar",
                onClick: async () => {
                    toast.loading("Memproses log out...");
                    await supabase.auth.signOut();
                    router.push("/login");
                    toast.dismiss();
                }
            },
            cancel: { label: "Batal" }
        });
    };

    const isDark = mounted && resolvedTheme === "dark";

    const closeDrawer = () => {
        setMobileMenuOpen(false);
        if (closeMobile) closeMobile();
    };

    return (
        <header
            id="edufit-top-navbar"
            className="sticky top-0 z-[70] w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 pb-2 transition-all duration-300"
        >
            <div className="flex items-center justify-between gap-4">
                {/* 1. KIRI: LOGO ONLY */}
                <Link
                    href="/admin"
                    className="flex items-center shrink-0 py-1 transition-transform hover:scale-[1.03] focus:outline-none"
                >
                    {mounted && !logoError ? (
                        <img
                            src={isDark ? "/images/logo-putih.png" : "/images/logo-hitam.png"}
                            alt="EduFit"
                            onError={() => setLogoError(true)}
                            className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-opacity duration-300"
                        />
                    ) : (
                        <span
                            className="text-3xl sm:text-4xl font-extrabold tracking-tighter"
                            style={{ color: "var(--ref-text-primary)" }}
                        >
                            EduFit<span style={{ color: "var(--ref-accent-gold)" }}>.</span>
                        </span>
                    )}
                </Link>

                {/* 2. TENGAH: KAPSUL NAVIGASI UTAMA */}
                <nav
                    className="hidden xl:flex items-center p-1.5 rounded-2xl backdrop-blur-xl border overflow-x-auto no-scrollbar"
                    style={{
                        backgroundColor: "var(--ref-nav-shell)",
                        borderColor: "var(--ref-card-border)",
                        boxShadow: "var(--ref-card-shadow)"
                    }}
                >
                    {menuItems.map((item) => {
                        const isActive =
                            item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname?.startsWith(item.href);
                        const IconComp = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap flex items-center gap-2 group"
                                style={{
                                    color: isActive
                                        ? "var(--ref-nav-active-text)"
                                        : "var(--ref-nav-idle-text)"
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="edufitTopNavIndicator"
                                        className="absolute inset-0 rounded-xl"
                                        style={{ backgroundColor: "var(--ref-nav-active-bg)" }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 32
                                        }}
                                    />
                                )}
                                <IconComp
                                    size={15}
                                    strokeWidth={isActive ? 2.4 : 1.9}
                                    className="relative z-10 transition-transform duration-200 group-hover:scale-110"
                                />
                                <span className="relative z-10 tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 3. KANAN: TOMBOL TEMA, AKTIVITAS DATABASE, & TOMBOL LOGOUT ASLI */}
                <div className="flex items-center gap-2.5 shrink-0" ref={notifRef}>
                    {mounted && (
                        <button
                            type="button"
                            onClick={() => setTheme(isDark ? "light" : "dark")}
                            className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl text-[13px] font-semibold backdrop-blur-xl border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                            style={{
                                backgroundColor: "var(--ref-nav-shell)",
                                borderColor: "var(--ref-card-border)",
                                color: "var(--ref-text-primary)",
                                boxShadow: "var(--ref-card-shadow)"
                            }}
                            title="Ganti Mode Terang / Gelap"
                        >
                            <motion.div
                                key={isDark ? "dark-icon" : "light-icon"}
                                initial={{ rotate: -45, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                transition={{ duration: 0.25 }}
                            >
                                {isDark ? (
                                    <Sun size={16} style={{ color: "var(--ref-accent-gold)" }} />
                                ) : (
                                    <Moon size={16} />
                                )}
                            </motion.div>
                            <span className="hidden sm:inline">
                                {isDark ? "Mode Gelap" : "Mode Terang"}
                            </span>
                        </button>
                    )}

                    {/* Tombol Aktivitas Database Real-time */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={toggleNotifPopover}
                            className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-xl border transition-transform hover:scale-105 cursor-pointer relative"
                            style={{
                                backgroundColor: "var(--ref-nav-shell)",
                                borderColor: "var(--ref-card-border)",
                                color: "var(--ref-text-primary)",
                                boxShadow: "var(--ref-card-shadow)"
                            }}
                            title="Lihat Aktivitas Database Terbaru"
                        >
                            <Bell size={16} />
                            <span
                                className="w-2 h-2 rounded-full absolute top-2.5 right-2.5"
                                style={{ backgroundColor: "var(--ref-accent-gold)" }}
                            />
                        </button>

                        <AnimatePresence>
                            {notifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute right-0 mt-2 w-80 rounded-2xl p-4 border z-50"
                                    style={{
                                        backgroundColor: "var(--ref-card-solid)",
                                        borderColor: "var(--ref-card-border)",
                                        boxShadow: "var(--ref-card-shadow)"
                                    }}
                                >
                                    <div className="flex items-center justify-between pb-3 mb-2 border-b" style={{ borderColor: "var(--ref-card-border)" }}>
                                        <span className="text-xs font-bold" style={{ color: "var(--ref-text-primary)" }}>
                                            Log Aktivitas Database
                                        </span>
                                        <button
                                            type="button"
                                            onClick={fetchRecentActivity}
                                            className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
                                            style={{ color: "var(--ref-text-secondary)" }}
                                            title="Muat Ulang"
                                        >
                                            <RefreshCw size={13} className={loadingLogs ? "animate-spin" : ""} />
                                        </button>
                                    </div>

                                    {loadingLogs ? (
                                        <p className="text-xs py-4 text-center" style={{ color: "var(--ref-text-secondary)" }}>
                                            Memuat aktivitas terbaru...
                                        </p>
                                    ) : recentLogs.length === 0 ? (
                                        <p className="text-xs py-4 text-center" style={{ color: "var(--ref-text-secondary)" }}>
                                            Belum ada aktivitas terbaru.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {recentLogs.map((log) => (
                                                <Link
                                                    key={log.id}
                                                    href={log.href}
                                                    onClick={() => setNotifOpen(false)}
                                                    className="block p-2.5 rounded-xl transition-colors hover:opacity-90"
                                                    style={{ backgroundColor: "var(--ref-card-subtle)" }}
                                                >
                                                    <p className="text-xs font-semibold truncate" style={{ color: "var(--ref-text-primary)" }}>
                                                        {log.title}
                                                    </p>
                                                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--ref-text-secondary)" }}>
                                                        {log.subtitle}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tombol Logout dengan Ikon LogOut Asli */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-xl border transition-all hover:scale-105 hover:bg-red-500/10 hover:border-red-500/30 text-red-500 cursor-pointer"
                        style={{
                            backgroundColor: "var(--ref-nav-shell)",
                            borderColor: "var(--ref-card-border)",
                            boxShadow: "var(--ref-card-shadow)"
                        }}
                        title="Keluar dari Sistem (Logout)"
                    >
                        <LogOut size={16} />
                    </button>

                    {/* Tombol Menu Hamburger Mobile & Tablet */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="xl:hidden w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-xl border transition-transform active:scale-95"
                        style={{
                            backgroundColor: "var(--ref-nav-shell)",
                            borderColor: "var(--ref-card-border)",
                            color: "var(--ref-text-primary)"
                        }}
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* DRAWER MENU MOBILE & TABLET */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22 }}
                        className="xl:hidden mt-3 p-4 rounded-2xl backdrop-blur-2xl border"
                        style={{
                            backgroundColor: "var(--ref-card-solid)",
                            borderColor: "var(--ref-card-border)",
                            boxShadow: "var(--ref-card-shadow)"
                        }}
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {menuItems.map((item) => {
                                const isActive =
                                    item.href === "/admin"
                                        ? pathname === "/admin"
                                        : pathname?.startsWith(item.href);
                                const IconComp = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeDrawer}
                                        className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-center sm:text-left"
                                        style={{
                                            backgroundColor: isActive
                                                ? "var(--ref-nav-active-bg)"
                                                : "var(--ref-card-subtle)",
                                            color: isActive
                                                ? "var(--ref-nav-active-text)"
                                                : "var(--ref-text-primary)"
                                        }}
                                    >
                                        <IconComp size={16} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div
                            className="mt-3 pt-3 border-t flex items-center justify-between"
                            style={{ borderColor: "var(--ref-card-border)" }}
                        >
                            <span
                                className="text-xs font-medium"
                                style={{ color: "var(--ref-text-secondary)" }}
                            >
                                Navigasi Ekosistem EduFit
                            </span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/10"
                            >
                                <LogOut size={14} /> Keluar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}