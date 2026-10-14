"use client";

import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Download,
    Menu,
    Play,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// ============================================================================
// ENGINE ANIMASI SCROLL (CUSTOM HOOK)
// ============================================================================
function useIntersectionObserver(options = {}) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const targetRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, ...options });

        const currentTarget = targetRef.current;
        if (currentTarget) observer.observe(currentTarget);

        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
        };
    }, [options]);

    return [targetRef, isIntersecting] as const;
}

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
    const [ref, isVisible] = useIntersectionObserver();
    return (
        <div
            ref={ref as any}
            className={`transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// ============================================================================
// KOMPONEN UTAMA LANDING PAGE
// ============================================================================
export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State Navigasi Cerdas
    const [isScrolled, setIsScrolled] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // State Scroll Timeline & Active Section (ScrollSpy)
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState('beranda');

    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // 1. Hitung Progress Bar (Timeline)
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (currentScrollY / docHeight) * 100;
            setScrollProgress(progress);

            // 2. Deteksi Section Aktif (ScrollSpy)
            const sections = ['beranda', 'tentang', 'fasilitas', 'ai-training', 'evaluasi'];
            let current = 'beranda';
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
                        current = section;
                    }
                }
            }
            setActiveSection(current);

            // 3. Logika Hide/Show Navbar
            setIsScrolled(currentScrollY > 20);
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    const features = [
        { title: "Evaluasi Postur & Komposisi", desc: "Pengukuran Tinggi Badan, Berat Badan, dan kalkulasi Indeks Massa Tubuh (IMT) secara otomatis.", image: "/images/fasilitas-1.jpg" },
        { title: "Kekuatan & Ketahanan Lengan", desc: "Tes Gantung Angkat Tubuh (Pull-up) untuk Putra dan Gantung Siku Tekuk untuk Putri.", image: "/images/about-main.jpg" },
        { title: "Ketahanan Otot Inti (Core)", desc: "Tes Baring Duduk (Sit-up) 60 detik dengan panduan biomekanika yang benar.", image: "/images/hero-bg.jpg" },
        { title: "Daya Ledak & Kecepatan", desc: "Integrasi tes Loncat Tegak (Vertical Jump) dan Lari Cepat 60 Meter.", image: "/images/fasilitas-2.jpg" },
    ];

    return (
        <>
            <style jsx global>{`
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <main className="w-full min-h-screen bg-[#f8faf9] font-jakarta antialiased selection:bg-[#006c49] selection:text-white overflow-x-hidden relative">

                {/* TIMELINE SCROLL */}
                <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-black/10">
                    <div
                        className="h-full bg-[#89f9b5] transition-all duration-100 ease-out"
                        style={{ width: `${scrollProgress}%` }}
                    ></div>
                </div>

                {/* NAVBAR */}
                <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-in-out border-b ${isScrolled ? 'border-white/10' : 'border-transparent'
                    } ${showNavbar ? 'translate-y-0' : '-translate-y-[120%]'} ${isScrolled ? 'bg-[#003b28]/95 backdrop-blur-md py-3 shadow-sm' : 'bg-transparent py-6'
                    }`}>
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
                        <a href="#beranda" onClick={(e) => scrollToSection(e, 'beranda')} className="flex items-center gap-2 z-50 hover:scale-105 transition-transform">
                            <img src="/images/logo-putih.png" alt="EduFit" className="h-16 md:h-24 object-contain drop-shadow-md" />
                        </a>

                        <nav className="hidden lg:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest z-50">
                            <a href="#tentang" onClick={(e) => scrollToSection(e, 'tentang')} className={`transition-colors ${activeSection === 'tentang' ? 'text-[#89f9b5]' : 'text-white/80 hover:text-white'}`}>Tentang</a>
                            <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')} className={`transition-colors ${activeSection === 'fasilitas' ? 'text-[#89f9b5]' : 'text-white/80 hover:text-white'}`}>Fasilitas</a>
                            <a href="#ai-training" onClick={(e) => scrollToSection(e, 'ai-training')} className={`transition-colors ${activeSection === 'ai-training' ? 'text-[#89f9b5]' : 'text-white/80 hover:text-white'}`}>Program AI</a>
                            <a href="#evaluasi" onClick={(e) => scrollToSection(e, 'evaluasi')} className={`transition-colors ${activeSection === 'evaluasi' ? 'text-[#89f9b5]' : 'text-white/80 hover:text-white'}`}>Evaluasi</a>
                        </nav>

                        <div className="flex items-center gap-6 z-50">
                            <Link href="/login" className="hidden lg:inline-flex items-center justify-center font-bold text-xs bg-white text-[#00422b] px-6 py-3 rounded-full hover:bg-[#89f9b5] transition-all uppercase tracking-wider shadow-lg">
                                Masuk Portal <ArrowUpRight className="w-4 h-4 ml-1" />
                            </Link>
                            <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                                {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                            </button>
                        </div>
                    </div>

                    {/* Menu Mobile */}
                    <div className={`lg:hidden absolute top-0 left-0 w-full bg-[#00422b] transition-all duration-500 ease-in-out flex flex-col justify-center items-center ${isMobileMenuOpen ? 'h-[100vh] opacity-100 visible' : 'h-0 opacity-0 invisible'}`}>
                        <nav className="flex flex-col items-center gap-8 text-white text-xl font-bold uppercase tracking-widest">
                            <a href="#beranda" onClick={(e) => scrollToSection(e, 'beranda')} className={`${activeSection === 'beranda' ? 'text-[#89f9b5]' : ''}`}>Beranda</a>
                            <a href="#tentang" onClick={(e) => scrollToSection(e, 'tentang')} className={`${activeSection === 'tentang' ? 'text-[#89f9b5]' : ''}`}>Tentang</a>
                            <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')} className={`${activeSection === 'fasilitas' ? 'text-[#89f9b5]' : ''}`}>Fasilitas</a>
                            <a href="#ai-training" onClick={(e) => scrollToSection(e, 'ai-training')} className={`${activeSection === 'ai-training' ? 'text-[#89f9b5]' : ''}`}>Program AI</a>
                            <a href="#evaluasi" onClick={(e) => scrollToSection(e, 'evaluasi')} className={`${activeSection === 'evaluasi' ? 'text-[#89f9b5]' : ''}`}>Evaluasi</a>
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#89f9b5] text-[#00422b] px-10 py-4 rounded-full mt-6 shadow-xl">
                                Masuk Portal
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* HERO SECTION */}
                <section id="beranda" className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col justify-end bg-[#00422b]">
                    <div className="absolute inset-0 z-0">
                        <img src="/images/hero-bg.jpg" alt="EduFit Background" className="w-full h-full object-cover object-center opacity-70" />
                        <div className="absolute inset-0 bg-[#00422b]/60 backdrop-blur-[4px]"></div>
                    </div>

                    <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 pb-16 lg:pb-24 relative z-10 flex flex-col justify-end h-full">
                        <div className="max-w-2xl mb-8 lg:mb-12">
                            <Reveal>
                                <p className="text-white/95 text-sm md:text-lg leading-relaxed font-medium drop-shadow-md border-l-2 border-[#89f9b5] pl-4">
                                    Sistem cerdas pemantauan tes kebugaran jasmani, analitik stamina, dan rapor performa fisik terpadu berbasis kurikulum S3 SMA Indonesia.
                                </p>
                            </Reveal>
                        </div>

                        <Reveal delay={200}>
                            <h1 className="text-[18vw] lg:text-[12vw] font-bebas text-white font-extrabold leading-[0.85] tracking-tight uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
                                KEBUGARAN<br />JASMANI
                            </h1>
                        </Reveal>
                    </div>
                </section>

                <div className="h-20 lg:h-32 bg-[#f8faf9]"></div>

                {/* ABOUT REDEFINE */}
                <section id="tentang" className="w-full py-20 bg-[#f8faf9] relative">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                        <Reveal className="w-full lg:w-1/4">
                            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg relative group">
                                <img src="/images/intro-card.jpg" alt="Court" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    <span className="w-3 h-3 bg-[#89f9b5] rounded-full border border-white"></span>
                                    <span className="w-3 h-3 bg-[#00422b] rounded-full border border-white"></span>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={200} className="w-full lg:w-3/4">
                            <h2 className="text-2xl lg:text-4xl lg:leading-snug font-medium text-gray-800 max-w-4xl text-center lg:text-left">
                                Di EduFit, kami mendefinisikan ulang cara siswa berlatih dan berprestasi. Dari <span className="font-black text-black">rencana evaluasi personal</span> hingga pelacakan kemajuan <span className="font-black text-black">stamina real-time</span>.
                            </h2>
                        </Reveal>
                    </div>
                </section>

                {/* BENTO GRID */}
                <section className="w-full pb-32 bg-[#f8faf9]">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                        <Reveal delay={100} className="lg:col-span-3 flex flex-col justify-center space-y-6 text-center lg:text-left order-2 lg:order-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Tentang Sistem</h3>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                Apakah Anda bersiap untuk evaluasi tengah semester atau ingin membangun kebiasaan hidup sehat, EduFit menjaga Anda tetap termotivasi dengan integrasi kurikulum S3 SMA.
                            </p>
                            <div className="flex justify-center lg:justify-start">
                                <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')} className="inline-flex items-center justify-center bg-black text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#00422b] transition-all w-fit mt-4 group">
                                    Mulai Eksplorasi <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </Reveal>

                        <Reveal delay={300} className="lg:col-span-6 h-[400px] sm:h-[500px] lg:h-[600px] rounded-[2rem] overflow-hidden shadow-2xl relative group order-1 lg:order-2">
                            <img src="/images/about-main.jpg" alt="Lari" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-black/10"></div>
                            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 text-white hover:bg-white hover:text-black transition-colors">
                                <Play className="w-6 h-6 ml-1" />
                            </button>
                        </Reveal>

                        <Reveal delay={500} className="lg:col-span-3 flex flex-col justify-center space-y-8 lg:space-y-12 text-center lg:text-left order-3">
                            <p className="text-sm font-medium text-gray-600 leading-relaxed hidden lg:block">
                                Dapatkan akses ke materi kognitif interaktif, video biomekanika gerakan yang benar, serta analitik rahasia yang biasa digunakan oleh atlet profesional.
                            </p>

                            <div className="w-full aspect-square max-w-sm mx-auto bg-[#00422b] rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all">
                                <div className="flex justify-between items-start relative z-10">
                                    <Activity className="w-6 h-6 text-[#89f9b5]" />
                                    <ArrowUpRight className="w-6 h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </div>
                                <h4 className="text-xl font-black text-white leading-tight relative z-10 text-left">
                                    ALGORITMA <br /><span className="text-[#89f9b5]">KUSTOM</span> AI
                                </h4>
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full"></div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* EXPLORE FACILITIES */}
                <section id="fasilitas" className="w-full py-24 lg:py-32 bg-white relative">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        <Reveal>
                            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-12 lg:mb-16 border-b border-gray-200 pb-8 lg:pb-12 text-center lg:text-left">
                                <h2 className="text-5xl lg:text-7xl font-bebas font-bold text-black leading-[0.85] tracking-tight">
                                    EKSPLORASI <br /> FASILITAS
                                </h2>
                                <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto lg:mx-0 lg:text-right">
                                    Empat pilar utama sistem EduFit yang dirancang untuk mengawal setiap fase perkembangan kebugaran jasmani siswa.
                                </p>
                            </div>
                        </Reveal>

                        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[600px]">
                            {[
                                { title: "PRETEST FISIK", subtitle: "Ukur batas awal stamina", img: "/images/fasilitas-1.jpg" },
                                { title: "BIOMEKANIKA", subtitle: "Efisiensi postur tubuh", img: "/images/fasilitas-2.jpg" },
                                { title: "KOGNITIF", subtitle: "Teori & Nutrisi Olahraga", img: "/images/fasilitas-3.jpg" },
                                { title: "ALGORITMA AI", subtitle: "Resep Latihan Personal", img: "/images/about-main.jpg" },
                            ].map((item, idx) => (
                                <Reveal key={idx} delay={idx * 150} className="group relative w-full h-[200px] sm:h-[250px] lg:h-full lg:flex-1 hover:flex-[2] transition-all duration-700 ease-out rounded-3xl overflow-hidden cursor-pointer bg-gray-200">
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover object-center" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black text-white transition-colors">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-2xl font-bebas font-bold text-white tracking-widest leading-none mb-1">{item.title}</h3>
                                        <p className="text-xs font-bold text-white/70 uppercase lg:opacity-0 lg:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">{item.subtitle}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PROGRAM AI */}
                <section id="ai-training" className="w-full py-24 lg:py-32 bg-[#f8faf9] border-y border-gray-200 relative">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-24 mb-16 text-center lg:text-left">
                            <Reveal className="w-full lg:w-1/3">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Program Unggulan</p>
                                <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-sm mx-auto lg:mx-0">
                                    Berdasarkan hasil tes fisik dan kategori IMT Anda, kecerdasan buatan kami akan merakit salah satu dari 4.800 matriks jadwal latihan.
                                </p>
                            </Reveal>
                            <Reveal delay={200} className="w-full lg:w-2/3">
                                <h2 className="text-4xl lg:text-6xl font-bebas font-bold text-gray-300 leading-none tracking-tight">
                                    DI EDUFIT, AI MENDORONG <br className="hidden lg:block" /><span className="text-black">LATIHAN LEBIH PINTAR</span>
                                </h2>
                            </Reveal>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((num) => (
                                <Reveal key={num} delay={num * 100} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group cursor-pointer">
                                    <div className="w-full aspect-square bg-gray-100 rounded-2xl mb-6 overflow-hidden relative">
                                        <img src={`/images/fasilitas-${num === 4 ? '1' : num}.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Matriks" />
                                        <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-[#006c49] rounded-full"></div>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-black">Matriks Vol. {num}</h4>
                                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Fase {num === 1 ? 'Adaptasi' : num === 2 ? 'Kekuatan' : num === 3 ? 'Ketahanan' : 'Pemulihan'}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* DAFTAR EVALUASI FISIK */}
                <section id="evaluasi" className="w-full py-24 lg:py-32 bg-[#f8faf9] border-t border-gray-200 relative">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-24">

                        <div className="w-full lg:w-1/2 flex flex-col text-center lg:text-left">
                            <Reveal>
                                <h2 className="text-5xl lg:text-7xl font-bebas font-bold text-gray-300 leading-[0.85] tracking-tight mb-8 lg:mb-10">
                                    DAFTAR <br className="hidden lg:block" /><span className="text-black">EVALUASI FISIK</span>
                                </h2>
                                <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gray-200 shadow-xl transition-all duration-500 relative">
                                    {features.map((feat, idx) => (
                                        <img
                                            key={idx}
                                            src={feat.image}
                                            alt={feat.title}
                                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${activeFeature === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                        />
                                    ))}
                                </div>
                            </Reveal>
                        </div>

                        <div className="w-full lg:w-1/2 flex flex-col justify-center gap-3 md:gap-4 mt-6 lg:mt-0">
                            <Reveal delay={200} className="flex flex-col gap-3">
                                {features.map((feat, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveFeature(idx)}
                                        className={`flex items-start justify-between p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${activeFeature === idx
                                                ? 'bg-white border-[#006c49] shadow-lg md:scale-[1.02]'
                                                : 'bg-transparent border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex flex-col gap-1 pr-2 w-full">
                                            <h4 className={`text-base md:text-xl font-black transition-colors ${activeFeature === idx ? 'text-[#006c49]' : 'text-black'}`}>
                                                {feat.title}
                                            </h4>
                                            <div className={`transition-all duration-300 overflow-hidden ${activeFeature === idx ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                                                <p className="text-xs md:text-sm font-medium text-gray-500 leading-relaxed">
                                                    {feat.desc}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeFeature === idx ? 'bg-[#006c49] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                    </div>
                                ))}
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* FOOTER / DOWNLOAD CTA */}
                <section id="download" className="w-full bg-[#001c12] pt-24 pb-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00422b] rounded-full blur-[100px] opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 text-center lg:text-left">

                        <Reveal className="w-full lg:w-1/2">
                            <h2 className="text-sm font-bold text-[#89f9b5] uppercase tracking-widest mb-4">Mulai Perjalanan Anda</h2>
                            <h1 className="text-5xl lg:text-7xl font-bebas font-bold text-white leading-[0.9] tracking-tight mb-8">
                                EDUFIT MENGUNDANG ANDA <br className="hidden lg:block" />BERGABUNG KE KOMUNITAS
                            </h1>
                            <p className="text-white/60 text-sm font-medium max-w-md mx-auto lg:mx-0 mb-10 leading-relaxed">
                                Unduh aplikasi Android sekarang juga dan mulailah memonitor stamina, postur, serta mendapatkan program latihan khusus yang ditenagai oleh kecerdasan buatan.
                            </p>

                            <Link href="/download/edufit-app.apk" download className="inline-flex items-center justify-center gap-3 bg-[#89f9b5] text-[#001c12] font-black text-sm uppercase tracking-wider px-10 py-4 rounded-full hover:bg-white transition-all transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(137,249,181,0.2)]">
                                <Download className="w-5 h-5" /> Unduh APK Sekarang
                            </Link>
                        </Reveal>

                        <Reveal delay={300} className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                            <div className="w-full max-w-md bg-gradient-to-tr from-[#003b28] to-[#005a3e] rounded-[2rem] p-8 border border-white/10 shadow-2xl relative text-left">
                                <img src="/images/intro-card.jpg" alt="Aplikasi" className="w-full h-48 object-cover rounded-xl mb-6 opacity-80" />
                                <h3 className="text-white font-black text-2xl mb-2">SIAP MENGHADAPI TES FISIK?</h3>
                                <h2 className="text-5xl font-bebas font-bold text-[#89f9b5] tracking-wider mb-2">AYO MULAI!</h2>
                            </div>
                        </Reveal>
                    </div>

                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-24 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                        <span className="text-white/40 text-xs font-bold uppercase tracking-wider text-center">© 2026 EduFit Platform. All Rights Reserved.</span>
                        <div className="flex gap-6 text-white/40 text-xs font-bold uppercase tracking-wider">
                            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="/login" className="hover:text-[#89f9b5] transition-colors">Admin Login</Link>
                        </div>
                    </div>
                </section>

            </main>
        </>
    );
}