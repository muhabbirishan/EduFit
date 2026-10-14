"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Moon, Radio, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavbarGuru() {
    const pathname = usePathname();
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // SEMBUNYIKAN NAVBAR SAAT BERADA DI DALAM LIVE ASESMEN STUDIO AGAR FULL-SCREEN TANPA DISTRAKSI
    if (pathname?.startsWith("/guru/live-asesmen")) {
        return null;
    }

    const menuItems = [
        { label: "Dashboard", href: "/guru" },
        { label: "Live Asesmen", href: "/guru/live-asesmen", isLive: true },
        { label: "Teori", href: "/guru/teori" },
        { label: "Praktik", href: "/guru/praktik" },
        { label: "Rancangan", href: "/guru/rancangan" },
    ];

    const isLinkActive = (href: string) => {
        if (href === "/guru") return pathname === "/guru";
        return pathname.startsWith(href);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const isDark = mounted && resolvedTheme === "dark";

    return (
        <>
            {/* 1. DESKTOP HEADER */}
            <header
                className={`hidden lg:flex fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 items-center justify-between
                ${
                    isScrolled
                        ? "top-4 w-[92%] max-w-[1080px] rounded-full px-4 py-2 shadow-xl border backdrop-blur-2xl"
                        : "top-0 w-[95%] max-w-[1150px] rounded-none rounded-b-2xl px-8 py-4 shadow-none border-transparent bg-transparent"
                }`}
                style={{
                    backgroundColor: isScrolled
                        ? isDark
                            ? "rgba(17,17,17,0.85)"
                            : "rgba(255,255,255,0.85)"
                        : "transparent",
                    borderColor: isScrolled
                        ? isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)"
                        : "transparent",
                }}
            >
                <div
                    className={`flex items-center transition-all duration-300 ${
                        isScrolled ? "h-12 pl-2 pr-6 border-r" : "h-16 pr-8"
                    }`}
                    style={{
                        borderColor: isScrolled
                            ? isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)"
                            : "transparent",
                    }}
                >
                    {mounted && (
                        <img
                            src={isDark ? "/images/logo-putih.png" : "/images/logo-hitam.png"}
                            alt="EduFit"
                            className="h-full object-contain"
                        />
                    )}
                </div>

                <nav className="flex items-center gap-1">
                    {menuItems.map((item) => {
                        const active = isLinkActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative px-5 py-2.5 rounded-full text-sm font-bold transition-all z-10 flex items-center gap-2"
                                style={{
                                    color: active
                                        ? "#000"
                                        : isDark
                                        ? "rgba(255,255,255,0.6)"
                                        : "rgba(0,0,0,0.6)",
                                }}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute inset-0 rounded-full -z-10 shadow-sm"
                                        style={{ backgroundColor: "#facc15" }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                {item.isLive && (
                                    <Radio
                                        size={14}
                                        className={
                                            active
                                                ? "text-black animate-pulse"
                                                : "text-[#facc15] animate-pulse"
                                        }
                                    />
                                )}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div
                    className={`flex items-center gap-2 transition-all duration-300 ${
                        isScrolled ? "pl-4 border-l" : ""
                    }`}
                    style={{
                        borderColor: isScrolled
                            ? isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)"
                            : "transparent",
                    }}
                >
                    {mounted && (
                        <button
                            onClick={() => setTheme(isDark ? "light" : "dark")}
                            className="w-11 h-11 flex items-center justify-center rounded-full transition-all hover:text-[#facc15]"
                            style={{
                                backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                        >
                            {isDark ? (
                                <Sun size={22} strokeWidth={2} />
                            ) : (
                                <Moon size={22} strokeWidth={2} />
                            )}
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                        <LogOut size={22} strokeWidth={2} />
                    </button>
                </div>
            </header>

            {/* 2. MOBILE HEADER */}
            <header
                className={`lg:hidden fixed top-0 left-0 right-0 h-20 z-[60] flex items-center justify-between px-6 transition-all duration-300 ${
                    isScrolled ? "backdrop-blur-xl border-b shadow-sm" : ""
                }`}
                style={{
                    backgroundColor: isScrolled
                        ? isDark
                            ? "rgba(5,5,5,0.9)"
                            : "rgba(255,255,255,0.9)"
                        : "transparent",
                    borderColor: isScrolled
                        ? isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.1)"
                        : "transparent",
                }}
            >
                {mounted && (
                    <img
                        src={isDark ? "/images/logo-putih.png" : "/images/logo-hitam.png"}
                        alt="EduFit"
                        className="h-8 object-contain"
                    />
                )}
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2"
                    style={{ color: isDark ? "#fff" : "#000" }}
                >
                    <Menu size={28} />
                </button>
            </header>

            {/* 3. MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden fixed inset-0 z-[100] p-6 flex flex-col"
                        style={{ backgroundColor: isDark ? "#050505" : "#fcfcfc" }}
                    >
                        <div className="flex justify-end mb-10">
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="p-2"
                                style={{ color: isDark ? "#fff" : "#000" }}
                            >
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 text-3xl font-light tracking-tight flex-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`flex items-center gap-3 ${
                                        isLinkActive(item.href) ? "font-bold" : ""
                                    }`}
                                    style={{
                                        color: isLinkActive(item.href)
                                            ? "#facc15"
                                            : isDark
                                            ? "rgba(255,255,255,0.4)"
                                            : "rgba(0,0,0,0.4)",
                                    }}
                                >
                                    {item.label}
                                    {item.isLive && (
                                        <Radio size={22} className="text-[#facc15] animate-pulse" />
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div
                            className="pb-8 pt-8 space-y-8 border-t"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.1)",
                            }}
                        >
                            {mounted && (
                                <button
                                    onClick={() => {
                                        setTheme(isDark ? "light" : "dark");
                                        setIsMobileOpen(false);
                                    }}
                                    className="flex items-center gap-4 text-2xl transition-all"
                                    style={{
                                        color: isDark
                                            ? "rgba(255,255,255,0.8)"
                                            : "rgba(0,0,0,0.8)",
                                    }}
                                >
                                    {isDark ? (
                                        <>
                                            <Sun size={28} /> Mode Terang
                                        </>
                                    ) : (
                                        <>
                                            <Moon size={28} /> Mode Gelap
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 text-2xl text-red-500 hover:text-red-400 transition-colors"
                            >
                                <LogOut size={28} /> Keluar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}