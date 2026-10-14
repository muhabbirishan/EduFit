// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity, Archive,
    Building2,
    ChevronRight,
    Dumbbell,
    FileText,
    Home,
    LogOut,
    Moon,
    Sun,
    Target,
    X
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Sidebar({
    isMobileOpen,
    closeMobile,
    isCollapsed,
    setIsCollapsed
}: {
    isMobileOpen: boolean,
    closeMobile: () => void,
    isCollapsed: boolean,
    setIsCollapsed: (val: boolean) => void
}) {
    const pathname = usePathname();
    const { resolvedTheme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const menuItems = [
        { icon: Home, label: "Ringkasan", href: "/admin" },
        { icon: Building2, label: "Kelola Institusi", href: "/admin/institusi" },
        { icon: FileText, label: "Pretest & Posttest", href: "/admin/evaluasi" },
        { icon: BookOpenIcon, label: "Materi & Refleksi", href: "/admin/materi" },
        { icon: Activity, label: "Praktik Opsional", href: "/admin/praktik" },
        { icon: Target, label: "Rancangan & Instrumen", href: "/admin/instrumen" },
        { icon: Dumbbell, label: "Program Kebugaran", href: "/admin/program" },
        { icon: Archive, label: "Arsip Lama", href: "/admin/arsip" },
    ];

    const handleLogout = () => {
        toast('Konfirmasi Keluar', {
            description: 'Apakah Anda yakin ingin keluar dari sistem EduFit?',
            action: {
                label: 'Ya, Keluar',
                onClick: async () => {
                    toast.loading('Memproses log out...');
                    await supabase.auth.signOut();
                    router.push('/login');
                    toast.dismiss();
                }
            },
            cancel: { label: 'Batal' }
        });
    };

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <aside
            className={`fixed inset-y-0 left-0 shadow-2xl lg:shadow-none flex flex-col z-[70] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-r 
      ${isMobileOpen ? "translate-x-0 w-full" : "-translate-x-full w-full"}
      lg:translate-x-0 ${isCollapsed ? "lg:w-[88px]" : "lg:w-[280px]"}`}
            style={{
                // Paksa Warna Tahan Banting (Light: Putih | Dark: Hitam Pekat)
                backgroundColor: isDark ? '#050505' : '#fcfcfc',
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
        >
            <button onClick={closeMobile} className="lg:hidden absolute top-6 right-6 p-3 rounded-full transition-colors z-50"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                <X className="w-7 h-7" />
            </button>

            {/* Tombol Collapse Desktop */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-full items-center justify-center shadow-md z-50 transition-colors"
                style={{ backgroundColor: isDark ? '#111111' : '#ffffff', color: isDark ? '#fff' : '#000', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}
            >
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} />
            </button>

            <div className="h-28 flex items-center justify-center px-6 shrink-0 pt-6">
                <AnimatePresence mode="wait">
                    {(isCollapsed && !isMobileOpen) ? (
                        <motion.div
                            key="logo-collapse"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-10 h-10 flex items-center justify-center font-bebas text-xl rounded-xl"
                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}
                        >
                            EF
                        </motion.div>
                    ) : (
                        <motion.img
                            key="logo-full"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            src={isDark ? "/images/logo-putih.png" : "/images/logo-hitam.png"}
                            alt="EduFit"
                            className="w-32 h-auto object-contain"
                        />
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 mt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link href={item.href} key={item.href} onClick={() => { if (window.innerWidth < 1024) closeMobile() }} className="relative flex items-center p-4 lg:p-3.5 rounded-2xl group w-full">
                            {isActive && (
                                <motion.div layoutId="activeSidebar" className="absolute inset-0 rounded-2xl"
                                    style={{ backgroundColor: isDark ? 'rgba(137, 249, 181, 0.1)' : '#89f9b5' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                            )}
                            <item.icon strokeWidth={isActive ? 2.5 : 2}
                                className={`w-6 h-6 lg:w-[22px] lg:h-[22px] min-w-[24px] lg:min-w-[22px] relative z-10 transition-colors`}
                                style={{ color: isActive ? (isDark ? '#89f9b5' : '#000') : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') }}
                            />
                            <AnimatePresence>
                                {(!isCollapsed || isMobileOpen) && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                                        className={`ml-5 lg:ml-4 relative z-10 font-bold text-sm tracking-wide whitespace-nowrap overflow-hidden transition-colors`}
                                        style={{ color: isActive ? (isDark ? '#89f9b5' : '#000') : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)') }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}
            </div>

            <div className="shrink-0 px-4 py-6 lg:py-6 pb-10 lg:pb-6 border-t space-y-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {mounted && (
                    isCollapsed && !isMobileOpen ? (
                        <button
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className="mx-auto flex items-center justify-center p-3.5 rounded-full shadow-sm transition-colors hover:scale-105"
                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        >
                            {isDark ? <Sun className="w-[20px] h-[20px] text-white" /> : <Moon className="w-[20px] h-[20px] text-black" />}
                        </button>
                    ) : (
                        <div
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className="relative flex items-center cursor-pointer p-1 rounded-full shadow-inner h-14 lg:h-12 w-full transition-colors"
                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        >
                            <div className="relative z-10 w-full h-full flex justify-between items-center">
                                <div className="w-1/2 flex justify-center"><Sun className={`w-5 h-5 lg:w-4 lg:h-4 ${!isDark ? 'text-black' : 'text-white/30'}`} /></div>
                                <div className="w-1/2 flex justify-center"><Moon className={`w-5 h-5 lg:w-4 lg:h-4 ${isDark ? 'text-white' : 'text-black/30'}`} /></div>
                            </div>
                            <motion.div className="absolute w-[calc(50%-4px)] h-[48px] lg:h-[40px] rounded-full shadow-sm"
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff' }}
                                animate={{ left: isDark ? "calc(50% + 2px)" : "4px" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                        </div>
                    )
                )}

                <button onClick={handleLogout} className={`flex items-center p-4 lg:p-3.5 rounded-2xl transition-all ${isCollapsed && !isMobileOpen ? 'justify-center mx-auto w-12' : 'w-full'}`}
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                    <LogOut className="w-6 h-6 lg:w-[20px] lg:h-[20px] min-w-[24px] lg:min-w-[20px]" />
                    <AnimatePresence>
                        {(!isCollapsed || isMobileOpen) && (
                            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="ml-5 lg:ml-4 font-bold text-sm tracking-wide whitespace-nowrap overflow-hidden">Keluar</motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </aside>
    );
}

const BookOpenIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);