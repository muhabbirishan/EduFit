// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  BookOpen,
  Home,
  LogOut,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  Sun,
  Target,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NavbarGuru() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // State Popover Aktivitas Kelas Real-Time (Kembar dengan Sidebar Admin)
  const [notifOpen, setNotifOpen] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLogoError(false);
  }, [resolvedTheme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sembunyikan navbar ketika guru sedang berada di dalam ruang Live Asesmen layar penuh
  if (pathname?.startsWith("/guru/live-asesmen")) {
    return null;
  }

  const fetchTeacherActivity = async () => {
    setLoadingLogs(true);
    try {
      const [refRes, progRes, metRes] = await Promise.all([
        supabase
          .from("student_reflections")
          .select("id, unit_name, created_at, grade")
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("student_programs")
          .select("id, type, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(2),
        supabase
          .from("student_physical_metrics")
          .select("id, tkji_category, total_tkji_score, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
      ]);

      const combined: any[] = [];
      (refRes.data || []).forEach((r: any) => {
        combined.push({
          id: `ref-${r.id}`,
          code: "PRAKTIK",
          title: `Refleksi: ${r.unit_name}`,
          subtitle: r.grade
            ? `Sudah dinilai (${r.grade})`
            : "Menunggu koreksi Guru",
          href: "/guru/praktik",
        });
      });
      (progRes.data || []).forEach((p: any) => {
        combined.push({
          id: `prog-${p.id}`,
          code: "FITT",
          title: `Rancangan ${String(p.type || "Awal").toUpperCase()}`,
          subtitle: `Status: ${p.status || "Terkumpul"}`,
          href: "/guru/rancangan",
        });
      });
      (metRes.data || []).forEach((m: any) => {
        combined.push({
          id: `met-${m.id}`,
          code: "TKJI",
          title: `Pengukuran TKJI (Skor ${m.total_tkji_score || "-"})`,
          subtitle: `Kategori: ${m.tkji_category || "Tercatat"}`,
          href: "/guru/live-asesmen",
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
    if (next) fetchTeacherActivity();
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/guru", idx: "01" },
    {
      icon: Radio,
      label: "Live Asesmen",
      href: "/guru/live-asesmen",
      isLive: true,
      idx: "02",
    },
    { icon: BookOpen, label: "Teori", href: "/guru/teori", idx: "03" },
    { icon: Activity, label: "Praktik", href: "/guru/praktik", idx: "04" },
    { icon: Target, label: "Rancangan", href: "/guru/rancangan", idx: "05" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/guru") return pathname === "/guru";
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    toast("Keluar dari Akun?", {
      description: "Anda akan mengakhiri sesi aktif di Ruang Guru.",
      action: {
        label: "Ya, Keluar",
        onClick: async () => {
          toast.loading("Memproses log out...");
          await supabase.auth.signOut();
          router.push("/login");
          toast.dismiss();
        },
      },
      cancel: { label: "Batal" },
    });
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header
      id="edufit-top-navbar"
      className="sticky top-0 z-[70] w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 pb-2 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-4">
        {/* 1. KIRI: IDENTITAS BRAND & PERAN ARSITEKTURAL (IDENTIK DENGAN ADMIN) */}
        <Link
          href="/guru"
          className="flex items-center gap-3 shrink-0 py-1 transition-transform hover:scale-[1.02] focus:outline-none"
        >
          {mounted && !logoError ? (
            <img
              src={isDark ? "/images/logo-putih.png" : "/images/logo-hitam.png"}
              alt="EduFit"
              onError={() => setLogoError(true)}
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-opacity duration-300"
            />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tighter">
                EduFit<span className="text-gold-accent">.</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-widest opacity-55">
                GURU / STUDIO
              </span>
            </div>
          )}
        </Link>

        {/* 2. TENGAH: DEK NAVIGASI UTAMA ARSITEKTURAL (IDENTIK DENGAN ADMIN) */}
        <nav className="hidden xl:flex items-center p-1.5 rounded-2xl backdrop-blur-xl overflow-x-auto no-scrollbar edufit-card-primary">
          {menuItems.map((item) => {
            const isActive = isLinkActive(item.href);
            const IconComp = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap flex items-center gap-2 group ${
                  isActive
                    ? "text-ink-dark font-bold"
                    : "opacity-65 hover:opacity-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="edufitGuruNavIndicator"
                    className="absolute inset-0 rounded-xl btn-forest-gold shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}
                <IconComp
                  size={15}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className={`relative z-10 transition-transform duration-200 group-hover:scale-110 ${
                    item.isLive && !isActive ? "text-emerald-accent" : ""
                  }`}
                />
                <span className="relative z-10 tracking-tight">
                  {item.label}
                </span>
                {item.isLive && (
                  <span
                    className={`relative z-10 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "telemetry-bar-forest text-gold-accent"
                        : "badge-tint-emerald"
                    }`}
                  >
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3. KANAN: TOMBOL TEMA, LONCENG TELEMETRI KELAS, & LOGOUT (IDENTIK DENGAN ADMIN) */}
        <div className="flex items-center gap-2.5 shrink-0" ref={notifRef}>
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl text-[13px] font-semibold backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer edufit-card-primary"
              title="Ganti Mode Terang / Gelap"
            >
              <motion.div
                key={isDark ? "dark-icon" : "light-icon"}
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {isDark ? (
                  <Sun size={16} className="text-gold-accent" />
                ) : (
                  <Moon size={16} />
                )}
              </motion.div>
              <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
                {isDark ? "DARK" : "LIGHT"}
              </span>
            </button>
          )}

          {/* Tombol Aktivitas Kelas Real-time */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifPopover}
              className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-xl transition-transform hover:scale-105 cursor-pointer relative edufit-card-primary"
              title="Lihat Aktivitas Siswa Terbaru"
            >
              <Bell size={16} />
              <span className="w-2 h-2 rounded-full absolute top-2.5 right-2.5 chart-fill-gold" />
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-2 w-80 rounded-2xl p-4 z-50 shadow-2xl edufit-dropdown-menu"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider">
                      00 / AKTIVITAS KELAS TERBARU
                    </span>
                    <button
                      type="button"
                      onClick={fetchTeacherActivity}
                      className="p-1.5 rounded-lg opacity-70 hover:opacity-100 cursor-pointer edufit-surface-subtle"
                      title="Muat Ulang"
                    >
                      <RefreshCw
                        size={13}
                        className={loadingLogs ? "animate-spin" : ""}
                      />
                    </button>
                  </div>

                  {loadingLogs ? (
                    <p className="text-xs py-6 text-center opacity-60">
                      Memuat aktivitas siswa...
                    </p>
                  ) : recentLogs.length === 0 ? (
                    <p className="text-xs py-6 text-center opacity-60">
                      Belum ada aktivitas siswa terbaru.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {recentLogs.map((log) => (
                        <Link
                          key={log.id}
                          href={log.href}
                          onClick={() => setNotifOpen(false)}
                          className="block p-3 rounded-xl transition-transform hover:scale-[1.01] edufit-surface-subtle"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-xs font-bold truncate">
                              {log.title}
                            </p>
                            <span className="text-[10px] font-mono font-bold text-gold-accent shrink-0">
                              {log.code}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-65 truncate">
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

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer badge-tint-rose"
            title="Keluar dari Ruang Guru (Logout)"
          >
            <LogOut size={16} />
          </button>

          {/* Tombol Menu Hamburger Mobile & Tablet */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-11 h-11 rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer edufit-card-primary"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* DRAWER MENU MOBILE & TABLET (IDENTIK DENGAN ADMIN) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="xl:hidden mt-3 p-5 rounded-2xl shadow-2xl edufit-card-primary"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {menuItems.map((item) => {
                const isActive = isLinkActive(item.href);
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive ? "seg-btn-active" : "edufit-surface-subtle"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-60">
                      {item.idx}/
                    </span>
                    <IconComp size={15} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider opacity-60">
                PORTAL PENDIDIK PJOK EDUFIT
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer badge-tint-rose"
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