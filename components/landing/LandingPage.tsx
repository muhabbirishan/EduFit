// @ts-nocheck
"use client";

import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Download,
    Menu,
    Play,
    X
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

// ============================================================================
// ENGINE ANIMASI SCROLL (CUSTOM HOOK)
// ============================================================================
function useIntersectionObserver(options = {}) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const targetRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.12, ...options }
        );

        const currentTarget = targetRef.current;
        if (currentTarget) observer.observe(currentTarget);

        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
        };
    }, [options]);

    return [targetRef, isIntersecting] as const;
}

const Reveal = ({
    children,
    delay = 0,
    className = ""
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) => {
    const [ref, isVisible] = useIntersectionObserver();
    return (
        <div
            ref={ref as any}
            className={`transition-all duration-1000 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// ============================================================================
// KOMPONEN UTAMA LANDING PAGE (EDITORIAL & STICKY SCROLL ARCHITECTURE)
// ============================================================================
export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State Navigasi Cerdas (Konsep Asli yang Disukai User)
    const [isScrolled, setIsScrolled] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // State Scroll Timeline & Active Section (ScrollSpy)
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState("beranda");

    // State Interaktif untuk Evaluasi & Video Modal
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // 1. Hitung Progress Bar (Timeline)
            const docHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (currentScrollY / docHeight) * 100 : 0;
            setScrollProgress(progress);

            // 2. Deteksi Section Aktif (ScrollSpy)
            const sections = [
                "beranda",
                "tentang",
                "fasilitas",
                "ai-training",
                "evaluasi"
            ];
            let current = "beranda";
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (
                        rect.top <= window.innerHeight / 2.5 &&
                        rect.bottom >= window.innerHeight / 3
                    ) {
                        current = section;
                    }
                }
            }
            setActiveSection(current);

            // 3. Logika Hide/Show Navbar saat Scroll
            setIsScrolled(currentScrollY > 30);
            if (currentScrollY > lastScrollY && currentScrollY > 120) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const scrollToSection = (
        e: React.MouseEvent<HTMLAnchorElement>,
        id: string
    ) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
        setIsMobileMenuOpen(false);
    };

    // Data Evaluasi Fisik (URL Gambar 100% Asli)
    const features = [
        {
            num: "01",
            title: "Evaluasi Postur & Komposisi",
            subtitle: "Indeks Massa Tubuh (WHO 2007)",
            desc: "Pengukuran Tinggi Badan, Berat Badan, dan kalkulasi Indeks Massa Tubuh (IMT) secara otomatis sesuai profil umur bulan dan jenis kelamin siswa.",
            image: "/images/fasilitas-1.jpg"
        },
        {
            num: "02",
            title: "Kekuatan & Ketahanan Lengan",
            subtitle: "Pull-Up & Bent-Arm Hang",
            desc: "Tes Gantung Angkat Tubuh (Pull-up) untuk Putra dan Gantung Siku Tekuk untuk Putri dengan standar norma Tes Kebugaran Jasmani Indonesia.",
            image: "/images/about-main.jpg"
        },
        {
            num: "03",
            title: "Ketahanan Otot Inti (Core)",
            subtitle: "Baring Duduk 60 Detik",
            desc: "Tes Baring Duduk (Sit-up) 60 detik dengan panduan biomekanika yang benar untuk memetakan daya tahan otot perut siswa.",
            image: "/images/hero-bg.jpg"
        },
        {
            num: "04",
            title: "Daya Ledak & Kecepatan",
            subtitle: "Vertical Jump & Sprint 60m",
            desc: "Integrasi tes Loncat Tegak (Vertical Jump), Lari Cepat 60 Meter, dan Lari Daya Tahan ke dalam satu rapor kebugaran digital.",
            image: "/images/fasilitas-2.jpg"
        }
    ];

    // Data 4 Fase Matriks untuk Sticky Stacking Scroll (URL Gambar 100% Asli)
    const stickyMatrices = [
        {
            num: "01",
            volume: "Matriks Vol. 1",
            phase: "FASE ADAPTASI · MINGGU 1–2",
            target: "Pengenalan Gerak & Irama Napas",
            desc: "Menyesuaikan respons jantung-paru dan jaringan sendi terhadap beban kerja awal pada intensitas rendah hingga sedang (RPE 4–5) tanpa memaksakan kecepatan.",
            dosis: "3 Sesi / Minggu · 25 Menit · Jeda Pemulihan Penuh",
            img: "/images/fasilitas-1.jpg",
            bg: "#18181b",
            accent: "#f5c84c"
        },
        {
            num: "02",
            volume: "Matriks Vol. 2",
            phase: "FASE PEMANTAPAN · MINGGU 3–4",
            target: "Konsistensi Volume & Kontrol Teknik",
            desc: "Membangun kebiasaan gerak yang stabil melalui metode Continuous Run dan latihan beban tubuh terkendali sesuai komponen TKJI yang diprioritaskan.",
            dosis: "3–4 Sesi / Minggu · 30 Menit · RPE 5–6",
            img: "/images/fasilitas-2.jpg",
            bg: "#201e1a",
            accent: "#f5c84c"
        },
        {
            num: "03",
            volume: "Matriks Vol. 3",
            phase: "FASE PENGUATAN · MINGGU 5–6",
            target: "Progresi Beban Terukur 5–10%",
            desc: "Meningkatkan tuntutan latihan secara bertahap melalui kombinasi Interval Training dan Fartlek ketika beban minggu sebelumnya sudah terasa lebih ringan.",
            dosis: "4 Sesi / Minggu · 35 Menit · RPE 6–7",
            img: "/images/fasilitas-3.jpg",
            bg: "#141816",
            accent: "#f5c84c"
        },
        {
            num: "04",
            volume: "Matriks Vol. 4",
            phase: "FASE PERKEMBANGAN · MINGGU 7–8",
            target: "Puncak Kesiapan Fisik & Evaluasi Akhir",
            desc: "Menyiapkan kondisi puncak kebugaran siswa sebelum pelaksanaan Posttest sekaligus mengevaluasi konsistensi jurnal latihan pribadi.",
            dosis: "3–4 Sesi / Minggu · 35–40 Menit · Evaluasi FITT",
            img: "/images/about-main.jpg",
            bg: "#1c1917",
            accent: "#f5c84c"
        }
    ];

    return (
        <>
            <style jsx global>{`
                html {
                    scroll-behavior: smooth;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <main className="w-full min-h-screen bg-[#f4f1ea] text-[#18181b] font-jakarta antialiased selection:bg-[#f5c84c] selection:text-[#18181b] overflow-x-hidden relative">
                {/* ==============================================================
                    TIMELINE SCROLL PROGRESS BAR
                   ============================================================== */}
                <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-black/10">
                    <div
                        className="h-full bg-[#f5c84c] transition-all duration-100 ease-out"
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>

                {/* ==============================================================
                    NAVBAR (KONSEP ASLI LANDING PAGE + WARNA WARM CARBON & GOLD)
                   ============================================================== */}
                <header
                    className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-in-out border-b ${
                        isScrolled ? "border-white/10" : "border-transparent"
                    } ${showNavbar ? "translate-y-0" : "-translate-y-[120%]"} ${
                        isScrolled
                            ? "bg-[#141413]/95 backdrop-blur-md py-3 shadow-lg"
                            : "bg-transparent py-5 lg:py-6"
                    }`}
                >
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
                        <a
                            href="#beranda"
                            onClick={(e) => scrollToSection(e, "beranda")}
                            className="flex items-center gap-2 z-50 hover:scale-105 transition-transform"
                        >
                            <img
                                src="/images/logo-putih.png"
                                alt="EduFit"
                                className="h-14 sm:h-16 md:h-20 object-contain drop-shadow-md"
                            />
                        </a>

                        <nav className="hidden lg:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest z-50">
                            {[
                                { id: "tentang", label: "Tentang" },
                                { id: "fasilitas", label: "Fasilitas" },
                                { id: "ai-training", label: "Program AI" },
                                { id: "evaluasi", label: "Evaluasi" }
                            ].map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(e) => scrollToSection(e, item.id)}
                                    className={`transition-colors relative py-1 ${
                                        activeSection === item.id
                                            ? "text-[#f5c84c]"
                                            : "text-white/80 hover:text-white"
                                    }`}
                                >
                                    {item.label}
                                    {activeSection === item.id && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5c84c]" />
                                    )}
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-4 z-50">
                            <Link
                                href="/login"
                                className="hidden lg:inline-flex items-center justify-center font-bold text-xs bg-[#f5c84c] text-[#18181b] px-7 py-3.5 rounded-full hover:bg-white transition-all uppercase tracking-wider shadow-lg"
                            >
                                Masuk Portal <ArrowUpRight className="w-4 h-4 ml-1.5" />
                            </Link>
                            <button
                                type="button"
                                className="lg:hidden text-white p-2"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-8 h-8" />
                                ) : (
                                    <Menu className="w-8 h-8" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Menu Fullscreen Mobile */}
                    <div
                        className={`lg:hidden fixed inset-0 bg-[#141413] transition-all duration-500 ease-in-out flex flex-col justify-center items-center ${
                            isMobileMenuOpen
                                ? "opacity-100 visible pointer-events-auto"
                                : "opacity-0 invisible pointer-events-none"
                        }`}
                    >
                        <nav className="flex flex-col items-center gap-8 text-white text-xl font-bold uppercase tracking-widest">
                            <a
                                href="#beranda"
                                onClick={(e) => scrollToSection(e, "beranda")}
                                className={
                                    activeSection === "beranda" ? "text-[#f5c84c]" : ""
                                }
                            >
                                Beranda
                            </a>
                            <a
                                href="#tentang"
                                onClick={(e) => scrollToSection(e, "tentang")}
                                className={
                                    activeSection === "tentang" ? "text-[#f5c84c]" : ""
                                }
                            >
                                Tentang
                            </a>
                            <a
                                href="#fasilitas"
                                onClick={(e) => scrollToSection(e, "fasilitas")}
                                className={
                                    activeSection === "fasilitas" ? "text-[#f5c84c]" : ""
                                }
                            >
                                Fasilitas
                            </a>
                            <a
                                href="#ai-training"
                                onClick={(e) => scrollToSection(e, "ai-training")}
                                className={
                                    activeSection === "ai-training" ? "text-[#f5c84c]" : ""
                                }
                            >
                                Program AI
                            </a>
                            <a
                                href="#evaluasi"
                                onClick={(e) => scrollToSection(e, "evaluasi")}
                                className={
                                    activeSection === "evaluasi" ? "text-[#f5c84c]" : ""
                                }
                            >
                                Evaluasi
                            </a>
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="bg-[#f5c84c] text-[#18181b] px-10 py-4 rounded-full mt-4 text-sm font-black shadow-xl"
                            >
                                Masuk Portal
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* ==============================================================
                    HERO SECTION (FULL-BLEED CINEMATIC TANPA PILL BADGE AI SLOP)
                   ============================================================== */}
                <section
                    id="beranda"
                    className="relative w-full min-h-screen overflow-hidden flex flex-col justify-end bg-[#141413]"
                >
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/images/hero-bg.jpg"
                            alt="EduFit Background"
                            className="w-full h-full object-cover object-center opacity-65"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/55 to-black/40" />
                    </div>

                    <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 pt-36 pb-12 lg:pb-20 relative z-10 flex flex-col justify-end">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8 lg:mb-12">
                            <div className="lg:col-span-7">
                                <Reveal>
                                    <p className="text-white/95 text-sm sm:text-base md:text-lg leading-relaxed font-medium max-w-xl border-l-2 border-[#f5c84c] pl-5">
                                        Sistem cerdas pemantauan tes kebugaran jasmani, analitik
                                        stamina, dan rapor performa fisik terpadu berbasis
                                        kurikulum SMA Indonesia.
                                    </p>
                                </Reveal>
                            </div>

                            {/* Statistik Editorial Tanpa Kotak Kapsul */}
                            <div className="lg:col-span-5 grid grid-cols-3 gap-6 border-t border-white/20 pt-5 text-white">
                                <Reveal delay={100}>
                                    <span className="block text-2xl sm:text-3xl font-bebas text-[#f5c84c] tracking-wide">
                                        4.800+
                                    </span>
                                    <span className="block text-[11px] uppercase tracking-wider text-white/70 mt-0.5">
                                        Matriks Latihan
                                    </span>
                                </Reveal>
                                <Reveal delay={200}>
                                    <span className="block text-2xl sm:text-3xl font-bebas text-white tracking-wide">
                                        5 POS TKJI
                                    </span>
                                    <span className="block text-[11px] uppercase tracking-wider text-white/70 mt-0.5">
                                        Standar Nasional
                                    </span>
                                </Reveal>
                                <Reveal delay={300}>
                                    <span className="block text-2xl sm:text-3xl font-bebas text-white tracking-wide">
                                        KELAS X–XII
                                    </span>
                                    <span className="block text-[11px] uppercase tracking-wider text-white/70 mt-0.5">
                                        Kurikulum Terpadu
                                    </span>
                                </Reveal>
                            </div>
                        </div>

                        <Reveal delay={200}>
                            <h1 className="text-[17vw] sm:text-[15vw] lg:text-[11.5vw] font-bebas text-white font-extrabold leading-[0.83] tracking-tight uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                                KEBUGARAN
                                <br />
                                <span className="text-[#f5c84c]">JASMANI</span>
                            </h1>
                        </Reveal>
                    </div>
                </section>

                {/* ==============================================================
                    SECTION TENTANG (EDITORIAL ASYMMETRIC LAYOUT)
                   ============================================================== */}
                <section
                    id="tentang"
                    className="w-full py-24 lg:py-36 bg-[#f4f1ea] relative"
                >
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        {/* Baris Editorial Pembuka */}
                        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-24 lg:mb-32">
                            <Reveal className="w-full lg:w-1/3">
                                <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl relative group">
                                    <img
                                        src="/images/intro-card.jpg"
                                        alt="Court"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                    <div className="absolute bottom-5 left-5 flex items-center gap-2">
                                        <span className="w-3 h-3 bg-[#f5c84c] rounded-full" />
                                        <span className="w-3 h-3 bg-[#18181b] rounded-full border border-white/40" />
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={150} className="w-full lg:w-2/3">
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717a] mb-4">
                                    01 — Filosofi Pendidikan Fisik
                                </div>
                                <h2 className="text-2xl sm:text-3xl lg:text-5xl lg:leading-[1.18] font-medium text-[#18181b]">
                                    Di EduFit, kami mendefinisikan ulang cara siswa berlatih dan
                                    berprestasi. Dari{" "}
                                    <span className="font-black underline decoration-[#f5c84c] decoration-4 underline-offset-4">
                                        rencana evaluasi personal
                                    </span>{" "}
                                    hingga pelacakan kemajuan{" "}
                                    <span className="font-black">stamina real-time</span>.
                                </h2>
                            </Reveal>
                        </div>

                        {/* Komposisi Asimetris 3 Kolom */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            <Reveal
                                delay={100}
                                className="lg:col-span-3 flex flex-col justify-center space-y-6 text-left order-2 lg:order-1"
                            >
                                <div className="h-px w-12 bg-[#18181b]" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#71717a]">
                                    Integrasi Kurikulum
                                </h3>
                                <p className="text-sm font-medium text-[#52525b] leading-relaxed">
                                    Apakah Anda bersiap untuk evaluasi tengah semester atau
                                    ingin membangun kebiasaan hidup sehat, EduFit menjaga siswa
                                    tetap termotivasi dengan integrasi kurikulum Kelas X, XI, dan
                                    XII.
                                </p>
                                <div className="pt-2">
                                    <a
                                        href="#fasilitas"
                                        onClick={(e) => scrollToSection(e, "fasilitas")}
                                        className="inline-flex items-center justify-center bg-[#18181b] text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#f5c84c] hover:text-[#18181b] transition-all w-fit group"
                                    >
                                        Mulai Eksplorasi{" "}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </Reveal>

                            <Reveal
                                delay={250}
                                className="lg:col-span-6 h-[380px] sm:h-[480px] lg:h-[580px] rounded-[2rem] overflow-hidden shadow-2xl relative group order-1 lg:order-2"
                            >
                                <img
                                    src="/images/about-main.jpg"
                                    alt="Lari"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-black/20" />
                                <button
                                    type="button"
                                    onClick={() => setIsVideoOpen(true)}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18 bg-[#18181b]/70 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[#f5c84c] hover:bg-[#f5c84c] hover:text-[#18181b] transition-all cursor-pointer shadow-2xl"
                                    aria-label="Lihat Ringkasan Ekosistem"
                                >
                                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                                </button>
                            </Reveal>

                            <Reveal
                                delay={400}
                                className="lg:col-span-3 flex flex-col justify-center space-y-8 order-3"
                            >
                                <p className="text-sm font-medium text-[#52525b] leading-relaxed">
                                    Dapatkan akses ke materi kognitif interaktif, video
                                    biomekanika gerakan yang benar, serta analitik kebugaran yang
                                    dirancang khusus untuk profil fisik remaja Indonesia.
                                </p>

                                <a
                                    href="#ai-training"
                                    onClick={(e) => scrollToSection(e, "ai-training")}
                                    className="w-full aspect-square max-w-sm bg-[#18181b] rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:shadow-2xl transition-all"
                                >
                                    <div className="flex justify-between items-start relative z-10">
                                        <Activity className="w-7 h-7 text-[#f5c84c]" />
                                        <ArrowUpRight className="w-6 h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 block mb-2">
                                            4.800 Kombinasi
                                        </span>
                                        <h4 className="text-2xl font-black text-white leading-tight">
                                            ALGORITMA <br />
                                            <span className="text-[#f5c84c]">KUSTOM</span> AI
                                        </h4>
                                    </div>
                                    <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#f5c84c]/10 rounded-full blur-xl" />
                                </a>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* ==============================================================
                    SECTION EKSPLORASI FASILITAS (ACCORDION GALLERY EXPANSION)
                   ============================================================== */}
                <section
                    id="fasilitas"
                    className="w-full py-24 lg:py-32 bg-white relative border-t border-black/5"
                >
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        <Reveal>
                            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-12 lg:mb-16 border-b border-black/10 pb-8 lg:pb-12">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717a] mb-3">
                                        02 — Empat Pilar Utama
                                    </div>
                                    <h2 className="text-5xl lg:text-7xl font-bebas font-bold text-[#18181b] leading-[0.85] tracking-tight">
                                        EKSPLORASI <br /> FASILITAS
                                    </h2>
                                </div>
                                <p className="text-sm font-medium text-[#52525b] max-w-sm lg:text-right">
                                    Empat pilar utama sistem EduFit yang dirancang untuk
                                    mengawal setiap fase perkembangan kebugaran jasmani siswa.
                                </p>
                            </div>
                        </Reveal>

                        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[580px]">
                            {[
                                {
                                    num: "01",
                                    title: "PRETEST FISIK",
                                    subtitle: "Ukur batas awal stamina",
                                    img: "/images/fasilitas-1.jpg"
                                },
                                {
                                    num: "02",
                                    title: "BIOMEKANIKA",
                                    subtitle: "Efisiensi postur tubuh",
                                    img: "/images/fasilitas-2.jpg"
                                },
                                {
                                    num: "03",
                                    title: "KOGNITIF",
                                    subtitle: "Teori & Refleksi Ilmiah",
                                    img: "/images/fasilitas-3.jpg"
                                },
                                {
                                    num: "04",
                                    title: "ALGORITMA AI",
                                    subtitle: "Resep Latihan Personal",
                                    img: "/images/about-main.jpg"
                                }
                            ].map((item, idx) => (
                                <Reveal
                                    key={idx}
                                    delay={idx * 120}
                                    className="group relative w-full h-[240px] sm:h-[280px] lg:h-full lg:flex-1 hover:lg:flex-[2.2] transition-all duration-700 ease-out rounded-3xl overflow-hidden cursor-pointer bg-[#18181b]"
                                >
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                                    <div className="absolute top-6 left-6 text-white/60 font-bebas text-2xl tracking-widest">
                                        {item.num}
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-[#f5c84c] group-hover:text-[#18181b] text-white transition-colors">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-bebas font-bold text-white tracking-wider leading-none mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs font-bold text-[#f5c84c] uppercase tracking-wider lg:opacity-0 lg:translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ==============================================================
                    SECTION PROGRAM AI: STICKY STACKING SCROLL ARCHITECTURE
                    (Konsep Baru Sesuai Permintaan User - Kartu Bertumpuk Saat Scroll!)
                   ============================================================== */}
                <section
                    id="ai-training"
                    className="w-full py-24 lg:py-36 bg-[#f4f1ea] border-t border-black/10 relative"
                >
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                            {/* KOLOM KIRI: STICKY NARRATIVE CONTROLLER */}
                            <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-6">
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717a]">
                                    03 — Mesin Rekomendasi Kelas XII
                                </div>
                                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bebas font-bold text-[#18181b] leading-[0.88] tracking-tight">
                                    DI EDUFIT, AI MENDORONG{" "}
                                    <span className="text-[#c88a04]">
                                        LATIHAN LEBIH PINTAR
                                    </span>
                                </h2>
                                <p className="text-sm sm:text-base font-medium text-[#52525b] leading-relaxed">
                                    Berdasarkan hasil tes fisik TKJI dan kategori IMT setiap
                                    siswa, sistem kami merakit salah satu dari{" "}
                                    <strong className="text-[#18181b]">
                                        4.800 matriks jadwal latihan
                                    </strong>{" "}
                                    ke dalam 4 fase perkembangan selama 8 minggu.
                                </p>

                                <div className="pt-4 border-t border-black/10 grid grid-cols-2 gap-6">
                                    <div>
                                        <span className="text-3xl font-bebas font-bold text-[#18181b] block">
                                            8 MINGGU
                                        </span>
                                        <span className="text-xs font-medium text-[#71717a]">
                                            Siklus Program Pribadi FITT
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bebas font-bold text-[#18181b] block">
                                            4 FASE
                                        </span>
                                        <span className="text-xs font-medium text-[#71717a]">
                                            Gulir ke bawah untuk melihat tahapan →
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* KOLOM KANAN: STICKY STACKING CARDS (BERTUMPUK SAAT DI-SCROLL) */}
                            <div className="lg:col-span-7 space-y-8 lg:space-y-12">
                                {stickyMatrices.map((mat, idx) => (
                                    <div
                                        key={mat.num}
                                        className="sticky rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 transition-transform duration-500"
                                        style={{
                                            top: `${104 + idx * 24}px`,
                                            backgroundColor: mat.bg,
                                            color: "#ffffff",
                                            zIndex: 10 + idx
                                        }}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
                                            <div className="md:col-span-5 relative min-h-[220px] md:min-h-[320px] overflow-hidden">
                                                <img
                                                    src={mat.img}
                                                    alt={mat.volume}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                                                <span className="absolute top-5 left-5 font-bebas text-4xl text-[#f5c84c] tracking-wider">
                                                    {mat.num}
                                                </span>
                                            </div>

                                            <div className="md:col-span-7 p-7 sm:p-9 flex flex-col justify-between space-y-6">
                                                <div className="space-y-3">
                                                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f5c84c]">
                                                        {mat.phase}
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                                        {mat.volume} — {mat.target}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                                                        {mat.desc}
                                                    </p>
                                                </div>

                                                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                                                    <span className="text-xs font-bold text-white/90">
                                                        {mat.dosis}
                                                    </span>
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[#f5c84c] shrink-0" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ==============================================================
                    SECTION DAFTAR EVALUASI FISIK (CLEAN EDITORIAL LIST + STICKY VISUAL)
                   ============================================================== */}
                <section
                    id="evaluasi"
                    className="w-full py-24 lg:py-36 bg-white border-t border-black/10 relative"
                >
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                        {/* Kolom Kiri: Sticky Visual Preview */}
                        <div className="lg:col-span-6 lg:sticky lg:top-32">
                            <Reveal>
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717a] mb-3">
                                    04 — Instrumen Lapangan Terstandar
                                </div>
                                <h2 className="text-5xl lg:text-7xl font-bebas font-bold text-[#d4d4d8] leading-[0.85] tracking-tight mb-8">
                                    DAFTAR <br className="hidden lg:block" />
                                    <span className="text-[#18181b]">EVALUASI FISIK</span>
                                </h2>

                                <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-[#18181b] shadow-2xl relative">
                                    {features.map((feat, idx) => (
                                        <img
                                            key={idx}
                                            src={feat.image}
                                            alt={feat.title}
                                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                                                activeFeature === idx
                                                    ? "opacity-100 scale-100 z-10"
                                                    : "opacity-0 scale-105 z-0"
                                            }`}
                                        />
                                    ))}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20" />
                                    <div className="absolute bottom-6 left-6 right-6 z-30 flex items-end justify-between text-white">
                                        <div>
                                            <span className="font-bebas text-2xl text-[#f5c84c] tracking-widest block">
                                                INSTRUMEN {features[activeFeature].num}
                                            </span>
                                            <span className="text-sm font-bold">
                                                {features[activeFeature].subtitle}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        </div>

                        {/* Kolom Kanan: Editorial List dengan Garis Pembatas Halus (Tanpa Kotak Pil) */}
                        <div className="lg:col-span-6 flex flex-col justify-center lg:pt-20">
                            <Reveal delay={150} className="divide-y divide-black/10 border-y border-black/10">
                                {features.map((feat, idx) => {
                                    const isActive = activeFeature === idx;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveFeature(idx)}
                                            className="py-6 sm:py-8 cursor-pointer group transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-baseline gap-5">
                                                    <span
                                                        className={`font-bebas text-2xl sm:text-3xl tracking-wider transition-colors ${
                                                            isActive
                                                                ? "text-[#c88a04]"
                                                                : "text-[#a1a1aa] group-hover:text-[#18181b]"
                                                        }`}
                                                    >
                                                        {feat.num}
                                                    </span>
                                                    <div>
                                                        <h4
                                                            className={`text-lg sm:text-2xl font-black tracking-tight transition-colors ${
                                                                isActive
                                                                    ? "text-[#18181b]"
                                                                    : "text-[#52525b] group-hover:text-[#18181b]"
                                                            }`}
                                                        >
                                                            {feat.title}
                                                        </h4>
                                                        <span className="text-xs font-bold uppercase tracking-widest text-[#71717a] block mt-1">
                                                            {feat.subtitle}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                                        isActive
                                                            ? "bg-[#18181b] text-[#f5c84c] rotate-45"
                                                            : "bg-[#f4f1ea] text-[#71717a] group-hover:bg-[#18181b] group-hover:text-white"
                                                    }`}
                                                >
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </div>
                                            </div>

                                            <div
                                                className={`transition-all duration-500 overflow-hidden pl-10 sm:pl-12 ${
                                                    isActive
                                                        ? "max-h-40 opacity-100 mt-4"
                                                        : "max-h-0 opacity-0 mt-0"
                                                }`}
                                            >
                                                <p className="text-sm font-medium text-[#52525b] leading-relaxed">
                                                    {feat.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* ==============================================================
                    FOOTER / DOWNLOAD CTA (DEEP CARBON & CHAMPIONSHIP GOLD)
                   ============================================================== */}
                <section
                    id="download"
                    className="w-full bg-[#141413] pt-24 pb-12 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f5c84c]/15 rounded-full blur-[130px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 text-center lg:text-left">
                        <Reveal className="w-full lg:w-1/2">
                            <div className="text-xs font-bold text-[#f5c84c] uppercase tracking-[0.2em] mb-4">
                                05 — Mulai Perjalanan Anda
                            </div>
                            <h2 className="text-5xl lg:text-7xl font-bebas font-bold text-white leading-[0.9] tracking-tight mb-8">
                                EDUFIT MENGUNDANG ANDA{" "}
                                <br className="hidden lg:block" />
                                BERGABUNG KE KOMUNITAS
                            </h2>
                            <p className="text-white/65 text-sm sm:text-base font-medium max-w-md mx-auto lg:mx-0 mb-10 leading-relaxed">
                                Unduh aplikasi Android sekarang juga dan mulailah memonitor
                                stamina, postur, serta mendapatkan program latihan khusus yang
                                ditenagai oleh kecerdasan buatan.
                            </p>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                <Link
                                    href="/download/edufit-app.apk"
                                    download
                                    className="inline-flex items-center justify-center gap-3 bg-[#f5c84c] text-[#18181b] font-black text-xs sm:text-sm uppercase tracking-wider px-9 py-4 rounded-full hover:bg-white transition-all transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(245,200,76,0.25)]"
                                >
                                    <Download className="w-5 h-5" /> Unduh APK Sekarang
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-8 py-4 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    Portal Guru & Admin <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </Reveal>

                        <Reveal
                            delay={250}
                            className="w-full lg:w-1/2 flex justify-center lg:justify-end"
                        >
                            <div className="w-full max-w-md bg-[#1f1e1b] rounded-[2rem] p-8 border border-white/10 shadow-2xl relative text-left">
                                <img
                                    src="/images/intro-card.jpg"
                                    alt="Aplikasi"
                                    className="w-full h-48 object-cover rounded-2xl mb-6 opacity-90"
                                />
                                <h3 className="text-white font-black text-2xl mb-1">
                                    SIAP MENGHADAPI TES FISIK?
                                </h3>
                                <h2 className="text-5xl font-bebas font-bold text-[#f5c84c] tracking-wider">
                                    AYO MULAI!
                                </h2>
                            </div>
                        </Reveal>
                    </div>

                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-20 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                        <span className="text-white/40 text-xs font-bold uppercase tracking-wider text-center">
                            © 2026 EduFit Platform. All Rights Reserved.
                        </span>
                        <div className="flex gap-6 text-white/50 text-xs font-bold uppercase tracking-wider">
                            <a
                                href="#tentang"
                                onClick={(e) => scrollToSection(e, "tentang")}
                                className="hover:text-white transition-colors"
                            >
                                Tentang
                            </a>
                            <a
                                href="#fasilitas"
                                onClick={(e) => scrollToSection(e, "fasilitas")}
                                className="hover:text-white transition-colors"
                            >
                                Fasilitas
                            </a>
                            <Link
                                href="/login"
                                className="hover:text-[#f5c84c] transition-colors"
                            >
                                Admin & Guru Login
                            </Link>
                        </div>
                    </div>
                </section>

                {/* MODAL RINGKASAN SISTEM SAAT TOMBOL PLAY DIKLIK */}
                {isVideoOpen && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setIsVideoOpen(false)}
                    >
                        <div
                            className="w-full max-w-xl bg-[#18181b] text-white rounded-3xl p-8 border border-white/15 space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <h3 className="font-bebas text-3xl tracking-wider text-[#f5c84c]">
                                    ARSITEKTUR EKOSISTEM EDUFIT
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsVideoOpen(false)}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                                <p>
                                    <strong className="text-white">1. Aplikasi Mobile Siswa:</strong>{" "}
                                    Digunakan oleh siswa Kelas 10, 11, dan 12 untuk mempelajari
                                    modul interaktif, mengerjakan Pretest/Posttest, mengirim
                                    refleksi, dan mengikuti program latihan 8 minggu.
                                </p>
                                <p>
                                    <strong className="text-white">2. Dashboard Guru PJOK:</strong>{" "}
                                    Mengelola kelas, memandu sesi pengujian TKJI di lapangan
                                    secara langsung, dan menilai refleksi pemahaman siswa.
                                </p>
                                <p>
                                    <strong className="text-white">3. Dashboard Admin Pusat:</strong>{" "}
                                    Mengelola institusi sekolah, akun guru, bank soal evaluasi,
                                    dan merancang modul pembelajaran berbasis SaaS.
                                </p>
                            </div>
                            <div className="flex justify-end">
                                <Link
                                    href="/login"
                                    className="px-6 py-3 rounded-full bg-[#f5c84c] text-[#18181b] font-bold text-xs uppercase tracking-wider"
                                >
                                    Masuk ke Portal →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}