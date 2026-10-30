// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  BookOpen,
  Database,
  Home,
  LogOut,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  Sun,
  Target,
  UsersRound,
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

  if (pathname?.startsWith("/guru/live-asesmen")) {
    return null;
  }

  const fetchTeacherActivity = async () => {
    setLoadingLogs(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setRecentLogs([]);
        return;
      }

      const { data: teacherClasses } = await supabase
        .from("classes")
        .select("id, name, student_classes(student_id)")
        .eq("guru_id", session.user.id);

      const myStudentIds = Array.from(
        new Set(
          (teacherClasses || []).flatMap((c: any) =>
            (c.student_classes || []).map((sc: any) => sc.student_id)
          )
        )
      ).filter(Boolean);

      if (myStudentIds.length === 0) {
        setRecentLogs([]);
        return;
      }

      const [refRes, progRes, metRes, evalRes] = await Promise.all([
        supabase
          .from("student_reflections")
          .select(
            "id, student_id, unit_name, created_at, grade, user_profiles(full_name)"
          )
          .in("student_id", myStudentIds)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("student_programs")
          .select(
            "id, student_id, type, status, updated_at, user_profiles(full_name)"
          )
          .in("student_id", myStudentIds)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("student_physical_metrics")
          .select(
            "id, student_id, tkji_category, total_tkji_score, created_at, user_profiles(full_name)"
          )
          .in("student_id", myStudentIds)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("student_evaluation_scores")
          .select(
            "id, student_id, score, submitted_at, master_evaluations(type), user_profiles(full_name)"
          )
          .in("student_id", myStudentIds)
          .order("submitted_at", { ascending: false })
          .limit(3),
      ]);

      const combined: any[] = [];

      (refRes.data || []).forEach((r: any) => {
        const sName = r.user_profiles?.full_name || "Siswa";
        combined.push({
          id: `ref-${r.id}`,
          ts: new Date(r.created_at || 0).getTime(),
          code: "Materi",
          badgeClass: "badge-tint-amber",
          title: `${sName} · ${r.unit_name}`,
          subtitle: r.grade
            ? `Sudah dinilai (Predikat ${r.grade})`
            : "Menunggu koreksi pemantik Guru",
          href: "/guru/praktik",
        });
      });

      (progRes.data || []).forEach((p: any) => {
        const sName = p.user_profiles?.full_name || "Siswa";
        combined.push({
          id: `prog-${p.id}`,
          ts: new Date(p.updated_at || 0).getTime(),
          code: "Program",
          badgeClass: "badge-tint-violet",
          title: `${sName} · Rancangan ${String(
            p.type || "Awal"
          ).toUpperCase()}`,
          subtitle: `Status: ${p.status || "Terkumpul"}`,
          href: "/guru/rancangan",
        });
      });

      (metRes.data || []).forEach((m: any) => {
        if (!m.total_tkji_score) return;
        const sName = m.user_profiles?.full_name || "Siswa";
        combined.push({
          id: `met-${m.id}`,
          ts: new Date(m.created_at || 0).getTime(),
          code: "Fisik",
          badgeClass: "badge-tint-emerald",
          title: `${sName} · Skor TKJI ${m.total_tkji_score}/25`,
          subtitle: `Kategori: ${m.tkji_category || "Tercatat"}`,
          href: "/guru/live-asesmen",
        });
      });

      (evalRes.data || []).forEach((ev: any) => {
        if (ev.score === null || ev.score === undefined) return;
        const sName = ev.user_profiles?.full_name || "Siswa";
        const evType =
          ev.master_evaluations?.type === "posttest" ? "Posttest" : "Pretest";
        combined.push({
          id: `eval-${ev.id}`,
          ts: new Date(ev.submitted_at || 0).getTime(),
          code: evType,
          badgeClass: "badge-tint-sky",
          title: `${sName} · Nilai ${ev.score}%`,
          subtitle: `Menyelesaikan ujian ${evType}`,
          href: "/guru/teori",
        });
      });

      combined.sort((a, b) => b.ts - a.ts);
      setRecentLogs(combined.slice(0, 6));
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
    { icon: Home, label: "Dashboard", href: "/guru" },
    {
      icon: Radio,
      label: "Live Asesmen",
      href: "/guru/live-asesmen",
      isLive: true,
    },
    {
      icon: UsersRound,
      label: "Data Siswa",
      href: "/guru/siswa",
    },
    { icon: BookOpen, label: "Teori", href: "/guru/teori" },
    { icon: Activity, label: "Praktik", href: "/guru/praktik" },
    { icon: Target, label: "Rancangan", href: "/guru/rancangan" },
    {
      icon: Database,
      label: "Kurikulum",
      href: "/guru/kurikulum",
    },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/guru") return pathname === "/guru";
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    toast("Keluar Akun?", {
      description: "Sesi Anda akan diakhiri.",
      action: {
        label: "Ya, Keluar",
        onClick: async () => {
          toast.loading("Memproses keluar...");
          await supabase.auth.signOut();
          router.push("/login");
          toast.dismiss();
        },
      },
      cancel: { label: "Batal" },
      actionButtonStyle: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        fontWeight: 700,
        borderRadius: "10px",
        padding: "8px 14px",
      },
      classNames: {
        actionButton: "!bg-red-600 !text-white hover:!bg-red-700 font-bold",
      },
    });
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      {/* PENGHAPUS CAHAYA GRADIEN KUNING DI HALAMAN GURU */}
      <style jsx global>{`
        html body {
          background-image: none !important;
          --ref-canvas-gradient: none !important;
        }
      `}</style>

      <header
        id="edufit-top-navbar"
        className="edufit-guru-theme sticky top-0 z-40 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-4 pb-2 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-4">
          {/* KIRI: IDENTITAS BRAND */}
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
                  RUANG GURU
                </span>
              </div>
            )}
          </Link>

          {/* TENGAH: DEK NAVIGASI UTAMA */}
          <nav className="hidden xl:flex items-center p-1.5 rounded-2xl backdrop-blur-xl overflow-x-auto no-scrollbar edufit-card-primary">
            {menuItems.map((item) => {
              const isActive = isLinkActive(item.href);
              const IconComp = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap flex items-center gap-2 group ${
                    isActive
                      ? "text-[#14120e] font-bold"
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

          {/* KANAN: TOMBOL TEMA, NOTIFIKASI AKTIVITAS, & LOGOUT */}
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
                    <Moon size={16} className="text-gold-accent" />
                  )}
                </motion.div>
                <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
                  {isDark ? "DARK" : "LIGHT"}
                </span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifPopover}
                className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-xl transition-transform hover:scale-105 cursor-pointer relative edufit-card-primary"
                title="Lihat Aktivitas Siswa Terbaru"
              >
                <Bell size={16} />
                <span className="w-2 h-2 rounded-full absolute top-2.5 right-2.5 chart-fill-emerald" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-4 z-50 shadow-2xl edufit-dropdown-menu"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
                      <span className="text-xs font-bold uppercase tracking-wider text-gold-accent">
                        Aktivitas Siswa Terbaru
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
                        Memindai aktivitas kelas yang Anda ampu...
                      </p>
                    ) : recentLogs.length === 0 ? (
                      <p className="text-xs py-6 text-center opacity-60">
                        Belum ada aktivitas terbaru dari siswa di kelas Anda.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                        {recentLogs.map((log) => (
                          <Link
                            key={log.id}
                            href={log.href}
                            onClick={() => setNotifOpen(false)}
                            className="block p-3 rounded-xl transition-transform hover:scale-[1.01] edufit-surface-subtle"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-bold truncate">
                                {log.title}
                              </p>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase shrink-0 ${
                                  log.badgeClass || "badge-tint-amber"
                                }`}
                              >
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

            <button
              type="button"
              onClick={handleLogout}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer badge-tint-rose"
              title="Keluar dari Ruang Guru"
            >
              <LogOut size={16} />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden w-11 h-11 rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer edufit-card-primary"
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
                      <IconComp size={15} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider opacity-60">
                  Portal Pendidik PJOK EduFit
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}