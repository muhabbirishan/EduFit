// @ts-nocheck
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

// ============================================================================
// IKON VEKTOR ARSITEKTURAL MURNI
// ============================================================================
const SvgActivity = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const SvgArrowRight = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const SvgArrowUpRight = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
    </svg>
);

const SvgCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SvgDownload = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const SvgMenu = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
);

const SvgX = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SvgSmartphone = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
);

const SvgEye = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const SvgZoomIn = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const SvgZoomOut = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const SvgSun = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const SvgMoon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

// ============================================================================
// SINGLETON LOADER ENGINE 3D
// ============================================================================
function loadThreeJsEngine(): Promise<any> {
    if (typeof window === "undefined") return Promise.reject();
    if ((window as any).THREE && (window as any).THREE.WebGLRenderer) {
        return Promise.resolve((window as any).THREE);
    }
    if ((window as any).__edufitThreeEnginePromise) {
        return (window as any).__edufitThreeEnginePromise;
    }

    const cdnMirrors = [
        "https://unpkg.com/three@0.128.0/build/three.min.js",
        "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    ];

    (window as any).__edufitThreeEnginePromise = new Promise(
        (resolve, reject) => {
            let mirrorIndex = 0;

            const tryLoadNextMirror = () => {
                if (
                    (window as any).THREE &&
                    (window as any).THREE.WebGLRenderer
                ) {
                    resolve((window as any).THREE);
                    return;
                }
                if (mirrorIndex >= cdnMirrors.length) {
                    reject(new Error("Gagal memuat pustaka 3D"));
                    return;
                }

                const scriptUrl = cdnMirrors[mirrorIndex++];
                const script = document.createElement("script");
                script.src = scriptUrl;
                script.async = true;
                script.onload = () => {
                    if (
                        (window as any).THREE &&
                        (window as any).THREE.WebGLRenderer
                    ) {
                        resolve((window as any).THREE);
                    } else {
                        tryLoadNextMirror();
                    }
                };
                script.onerror = () => {
                    tryLoadNextMirror();
                };
                document.head.appendChild(script);
            };

            tryLoadNextMirror();
        }
    );

    return (window as any).__edufitThreeEnginePromise;
}

// ============================================================================
// DATA STATION 5 POS TKJI + GURU PJOK
// ============================================================================
type StationFilterKey =
    | "ALL"
    | "GURU"
    | "POS1"
    | "POS2"
    | "POS3"
    | "POS4"
    | "POS5";

const STATION_META: Record<
    StationFilterKey,
    {
        code: StationFilterKey;
        shortTitle: string;
        fullTitle: string;
        accent: string;
    }
> = {
    ALL: {
        code: "ALL",
        shortTitle: "Stadion Utuh",
        fullTitle: "Arena Stadion 5 Pos TKJI & Guru PJOK",
        accent: "#0EA5E9",
    },
    GURU: {
        code: "GURU",
        shortTitle: "Layar & Guru",
        fullTitle: "Podium Guru PJOK & Layar Skor Utama",
        accent: "#F5C84C",
    },
    POS1: {
        code: "POS1",
        shortTitle: "Pos 1: 60m",
        fullTitle: "Pos 01 • Lintasan Lurus Sprint 60 Meter",
        accent: "#E87A3E",
    },
    POS2: {
        code: "POS2",
        shortTitle: "Pos 2: Pull-Up",
        fullTitle: "Pos 02 • Gantung Angkat Tubuh & Siku Tekuk",
        accent: "#38BDF8",
    },
    POS3: {
        code: "POS3",
        shortTitle: "Pos 3: Sit-Up",
        fullTitle: "Pos 03 • Baring Duduk (Sit-Up) 60 Detik",
        accent: "#10B981",
    },
    POS4: {
        code: "POS4",
        shortTitle: "Pos 4: Loncat",
        fullTitle: "Pos 04 • Loncat Tegak (Vertical Jump)",
        accent: "#A78BFA",
    },
    POS5: {
        code: "POS5",
        shortTitle: "Pos 5: 1.200m",
        fullTitle: "Pos 05 • Lintasan Oval Lari 1.200m / 1.000m",
        accent: "#14B8A6",
    },
};

// ============================================================================
// DATA KURIKULUM AKTUAL EDUFIT (KELAS X, XI, DAN XII)
// ============================================================================
const CURRICULUM_DATA: Record<
    10 | 11 | 12,
    {
        fase: string;
        focus: string;
        units: {
            num: string;
            title: string;
            summary: string;
            target: string;
            keyMetric: string;
        }[];
    }
> = {
    10: {
        fase: "Fase E",
        focus: "Kebugaran Jasmani Terkait Kesehatan & Interpretasi Kondisi Tubuh",
        units: [
            {
                num: "01",
                title: "Orientasi, Keselamatan & Kondisi Awal",
                summary:
                    "Pengenalan komponen kebugaran kesehatan, kesiapan fisik, pemanasan, dan pendinginan.",
                target: "Memahami pentingnya data awal sebelum memulai latihan.",
                keyMetric: "Kesiapan Fisik",
            },
            {
                num: "02",
                title: "Daya Tahan Jantung-Paru & Intensitas",
                summary:
                    "Aktivitas aerobik vs anaerobik, pengaturan tempo melalui respons napas dan tes bicara.",
                target: "Mengontrol durasi kerja dan waktu pemulihan secara aman.",
                keyMetric: "Zona Aerobik",
            },
            {
                num: "03",
                title: "Kekuatan, Daya Tahan Otot & Kelenturan",
                summary:
                    "Teknik dasar latihan beban tubuh serta peregangan statis dan dinamis.",
                target: "Mengidentifikasi fungsi otot dan mengoreksi postur gerak.",
                keyMetric: "Kontrol Postur",
            },
            {
                num: "04",
                title: "Pengukuran TKJI & Interpretasi IMT",
                summary:
                    "Prosedur 5 Pos TKJI serta rumus perhitungan Indeks Massa Tubuh menurut umur.",
                target: "Menafsirkan skor norma TKJI dan kategori IMT mandiri.",
                keyMetric: "IMT & 5 Pos TKJI",
            },
            {
                num: "05",
                title: "Pola Makan Sehat & Keseimbangan Hidrasi",
                summary:
                    "Fungsi zat gizi makro dan kebutuhan cairan sebelum, saat, dan sesudah beraktivitas.",
                target: "Menyelaraskan asupan energi dengan beban aktivitas harian.",
                keyMetric: "Nutrisi & Cairan",
            },
            {
                num: "06",
                title: "Strategi Peningkatan & Refleksi Akhir",
                summary:
                    "Integrasi profil diri, prinsip FITT, progresi, istirahat, dan nutrisi.",
                target: "Merumuskan strategi peningkatan kebugaran sederhana.",
                keyMetric: "Evaluasi FITT",
            },
        ],
    },
    11: {
        fase: "Fase F",
        focus: "Prinsip Latihan & 6 Komponen Kebugaran Terkait Keterampilan",
        units: [
            {
                num: "01",
                title: "Prinsip Latihan Kebugaran Keterampilan",
                summary:
                    "Perbedaan kebugaran kesehatan dan keterampilan beserta kekhususan dan progresi.",
                target: "Menerapkan individualisasi dan keteraturan latihan.",
                keyMetric: "6 Komponen Gerak",
            },
            {
                num: "02",
                title: "Kecepatan & Waktu Reaksi (Sprint 60m)",
                summary:
                    "Studi waktu reaksi, akselerasi, dan kecepatan puncak pada lari cepat 60 meter.",
                target: "Mengoreksi sikap start, ayunan lengan, dan frekuensi langkah.",
                keyMetric: "Pos 01 Sprint 60m",
            },
            {
                num: "03",
                title: "Kelincahan & Perubahan Arah (Agility)",
                summary:
                    "Perubahan arah terencana (shuttle run) dan kelincahan reaktif berbasis isyarat.",
                target: "Menguasai perlambatan, titik berat tubuh, dan akselerasi.",
                keyMetric: "Kontrol Arah",
            },
            {
                num: "04",
                title: "Keseimbangan Statis & Dinamis",
                summary:
                    "Hubungan bidang tumpuan, pusat massa tubuh, dan fokus pandangan.",
                target: "Mempertahankan stabilitas saat bergerak maupun mendarat.",
                keyMetric: "Pusat Massa",
            },
            {
                num: "05",
                title: "Koordinasi Mata-Tangan & Mata-Kaki",
                summary:
                    "Sinkronisasi informasi indra dengan akurasi dan ketepatan waktu gerak.",
                target: "Meningkatkan efisiensi rangkaian gerak kompleks.",
                keyMetric: "Akurasi Gerak",
            },
            {
                num: "06",
                title: "Daya Ledak (Explosive Power)",
                summary:
                    "Kombinasi kekuatan dan kecepatan melalui lompatan vertikal dan horizontal.",
                target: "Memaksimalkan tolakan dan peredaman benturan mendarat.",
                keyMetric: "Pos 04 Vertical Jump",
            },
            {
                num: "07",
                title: "Analisis Keterampilan dalam Permainan",
                summary:
                    "Penerapan multi-komponen kebugaran dalam situasi permainan olahraga.",
                target: "Mengevaluasi efektivitas gerak disertai alasan perbaikan.",
                keyMetric: "Evaluasi Taktis",
            },
        ],
    },
    12: {
        fase: "Fase F (Tingkat Akhir)",
        focus: "Perancangan Program FITT Mandiri & Matriks 8 Minggu (24 Sesi)",
        units: [
            {
                num: "01",
                title: "Analisis Kondisi Kebugaran Awal (TKJI)",
                summary:
                    "Bedah profil 5 Pos TKJI untuk menentukan komponen prioritas yang harus ditingkatkan.",
                target: "Menjelaskan kebutuhan latihan spesifik tiap profil fisik.",
                keyMetric: "Skor 5 Pos / 25",
            },
            {
                num: "02",
                title: "Profil IMT/U & Penetapan Tujuan SMART",
                summary:
                    "Korelasi komposisi tubuh dengan perumusan tujuan latihan yang terukur.",
                target: "Menetapkan target latihan berbasis kerangka SMART.",
                keyMetric: "Target SMART",
            },
            {
                num: "03",
                title: "Prinsip Penyusunan Program (FITT)",
                summary:
                    "Pengaturan Frekuensi, Intensitas, Durasi, dan Jenis Latihan sesuai kapasitas.",
                target: "Menyusun Rancangan Program Awal untuk dinilai Guru PJOK.",
                keyMetric: "Rancangan Awal",
            },
            {
                num: "04",
                title: "Struktur Program Latihan Mingguan",
                summary:
                    "Urutan pemanasan, latihan inti, pendinginan, dan distribusi hari pemulihan.",
                target: "Menjalankan 3 Sesi Latihan FITT minggu depan dari algoritma.",
                keyMetric: "3 Sesi Intervensi",
            },
            {
                num: "05",
                title: "Monitoring Jurnal & Keteraturan",
                summary:
                    "Evaluasi realisasi latihan, catatan respons tubuh, dan penyesuaian beban.",
                target: "Menafsirkan jurnal praktik untuk menyempurnakan dosis.",
                keyMetric: "Jurnal Latihan",
            },
            {
                num: "06",
                title: "Revisi Rancangan Akhir & Siklus 8 Minggu",
                summary:
                    "Perbandingan data awal-akhir, Revisi Rancangan Akhir, dan Post-Test.",
                target: "Membuka Rapor Radar 4K & Bonus 24 Pertemuan (8 Minggu).",
                keyMetric: "24 Sesi Terbuka",
            },
        ],
    },
};

const ROLE_SHOWCASE = {
    siswa: {
        tag: "APLIKASI MOBILE SISWA",
        title: "Pembelajaran & Latihan Personal yang Terarah",
        desc: "Siswa mengikuti tahapan pembelajaran secara berurutan mulai dari evaluasi awal, pengukuran lapangan, hingga membuka jadwal latihan 24 pertemuan sesuai hasil ukur fisik masing-masing.",
        metrics: [
            { val: "8 Tahap", label: "Alur Belajar Kelas XII" },
            { val: "Radar 4K", label: "Unduh Rapor ke Galeri" },
            { val: "24 Sesi", label: "Program Latihan Mandiri" },
        ],
        highlights: [
            "Konfirmasi kehadiran garis start & waktu finis lari langsung ke Guru.",
            "Modul bacaan interaktif dengan tabel norma Putra/Putri & simulasi tempo.",
            "Rekomendasi latihan otomatis dari 4.800+ kombinasi program FITT.",
        ],
    },
    guru: {
        tag: "DASHBOARD GURU PJOK",
        title: "Komando Pengujian Lapangan & Penilaian Rubrik Terpadu",
        desc: "Guru memanggil gelombang 5 siswa di lapangan, menjalankan Stopwatch Utama atau Timer 60 Detik, serta menilai refleksi materi dan rancangan program latihan dalam satu layar.",
        metrics: [
            { val: "5 Siswa", label: "Panggilan per Gelombang" },
            { val: "60 Detik", label: "Timer Pos Pull-Up & Sit-Up" },
            { val: "Skala 1–4", label: "Rubrik Rancangan FITT" },
        ],
        highlights: [
            "Validasi otomatis kesiapan siswa sebelum mengikuti ujian fisik lapangan.",
            "Fitur Sesi Remedial & Tunda Medis dengan penjagaan skor murni.",
            "Unduh rekapitulasi nilai TKJI, IMT, dan Teori ke format laporan tabel.",
        ],
    },
    admin: {
        tag: "PUSAT KENDALI KURIKULUM SEKOLAH",
        title: "Manajemen Institusi, Bank Soal & Penyusun Materi",
        desc: "Pengelola sekolah mengatur daftar rombel kelas, penempatan Guru PJOK, kisi-kisi capaian pembelajaran, hingga menyusun modul materi menggunakan 10 komponen blok interaktif.",
        metrics: [
            { val: "10 Komponen", label: "Editor Modul Materi" },
            { val: "4.800+", label: "Matriks Algoritma FITT" },
            { val: "Multi-Kelas", label: "Manajemen Rombel & Guru" },
        ],
        highlights: [
            "Pratinjau langsung tampilan layar ponsel siswa saat menyusun materi.",
            "Pemetaan otomatis butir soal evaluasi terhadap capaian Tujuan Pembelajaran.",
            "Penyimpanan arsip rekam jejak akademik dan fisik lintas tahun ajaran.",
        ],
    },
};

const CUSTOM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap');

html {
    scroll-behavior: smooth;
}
.font-jakarta {
    font-family: 'Plus Jakarta Sans', sans-serif;
}
.font-montserrat {
    font-family: 'Montserrat', sans-serif;
}
.font-poppins {
    font-family: 'Poppins', sans-serif;
}
.edufit-hero-day-bg {
    background: linear-gradient(120deg, #F7F5F0 0%, #F4F1EA 46%, #E6DFD1 100%);
}
.edufit-hero-night-bg {
    background: linear-gradient(125deg, #05130E 0%, #081C15 50%, #040C09 100%);
}
.edufit-left-scrim-day {
    background: linear-gradient(90deg, rgba(247, 245, 240, 0.97) 0%, rgba(247, 245, 240, 0.88) 36%, rgba(247, 245, 240, 0.0) 68%);
}
.edufit-left-scrim-night {
    background: linear-gradient(90deg, rgba(5, 19, 14, 0.96) 0%, rgba(5, 19, 14, 0.85) 36%, rgba(5, 19, 14, 0.0) 68%);
}
.edufit-pill-shadow {
    box-shadow: 0 16px 38px -8px rgba(11, 49, 36, 0.10),
        0 4px 12px -2px rgba(11, 49, 36, 0.05);
}
.edufit-dispatch-shadow {
    box-shadow: 0 20px 44px -12px rgba(11, 49, 36, 0.16),
        0 4px 14px -4px rgba(11, 49, 36, 0.06);
}
input[type="range"].edufit-slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
}
input[type="range"].edufit-slider::-webkit-slider-runnable-track {
    background: #e2dfd7;
    height: 7px;
    border-radius: 999px;
}
input[type="range"].edufit-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    margin-top: -5px;
    background-color: #0b3124;
    height: 17px;
    width: 17px;
    border-radius: 999px;
    border: 2.5px solid #0ea5e9;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transition: transform 0.15s ease;
}
input[type="range"].edufit-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
}
`;

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [footerLogoError, setFooterLogoError] = useState(false);
    const [is3DReady, setIs3DReady] = useState(false);
    const [inspect3DOnly, setInspect3DOnly] = useState(false);

    // Filter Stasiun Tunggal yang Mengontrol Kamera 3D + Spotlight + Jumbotron
    const [activeStation, setActiveStation] =
        useState<StationFilterKey>("ALL");
    const [isNightStudio, setIsNightStudio] = useState(false);

    // Quick Hero Bar Inputs
    const [heroStudentName, setHeroStudentName] = useState("Andi Pratama");

    // State Preset Aktif & Kalkulator Lengkap 5 Pos TKJI + IMT
    const [activePreset, setActivePreset] = useState<
        "pemula" | "ideal" | "unggul" | "kustom"
    >("ideal");
    const [simGender, setSimGender] = useState<"L" | "P">("L");
    const [simGrade, setSimGrade] = useState<10 | 11 | 12>(12);
    const [simWeight, setSimWeight] = useState<number>(62);
    const [simHeight, setSimHeight] = useState<number>(170);
    const [simSprint60, setSimSprint60] = useState<number>(7.5);
    const [simPullHang, setSimPullHang] = useState<number>(16);
    const [simSitUp, setSimSitUp] = useState<number>(36);
    const [simVertJump, setSimVertJump] = useState<number>(66);
    const [simEnduranceSec, setSimEnduranceSec] = useState<number>(225);

    // State Kurikulum & Ekosistem Role
    const [selectedCurrGrade, setSelectedCurrGrade] = useState<10 | 11 | 12>(
        12
    );
    const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(0);
    const [activeStage12, setActiveStage12] = useState<number>(2);
    const [activeRoleKey, setActiveRoleKey] = useState<
        "siswa" | "guru" | "admin"
    >("siswa");
    const [studentVolume, setStudentVolume] = useState<number>(360);

    // State Modal Legal & Kebijakan (DAFTAREASY)
    const [legalModal, setLegalModal] = useState<
        null | "terms" | "privacy" | "license"
    >(null);

    // Toast Non-Blocking
    const [toastData, setToastData] = useState<{
        visible: boolean;
        title: string;
        desc: string;
    }>({
        visible: false,
        title: "",
        desc: "",
    });
    const toastTimeoutRef = useRef<any>(null);

    // Refs untuk komunikasi langsung ke Three.js
    const heroSectionRef = useRef<HTMLElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const floatingTagRef = useRef<HTMLDivElement>(null);
    const floatingTagNameRef = useRef<HTMLSpanElement>(null);
    const floatingTagPosRef = useRef<HTMLSpanElement>(null);

    const threeApiRef = useRef<{
        focusStation: (
            station: StationFilterKey,
            athleteName?: string
        ) => void;
        toggleLighting: () => boolean;
        zoomCamera: (delta: number) => void;
        updateSimulationMetrics: (
            sprintSec: number,
            pullCount: number,
            situpCount: number,
            vjumpCm: number,
            enduranceSec: number,
            totalTkji: number,
            tkjiCat: string,
            bmiVal: number,
            studentName?: string
        ) => void;
    } | null>(null);

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 24);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const triggerToast = (title: string, desc: string) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastData({ visible: true, title, desc });
        toastTimeoutRef.current = setTimeout(() => {
            setToastData((prev) => ({ ...prev, visible: false }));
        }, 4000);
    };

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const formatEnduranceTime = (totalSec: number) => {
        const mm = Math.floor(totalSec / 60)
            .toString()
            .padStart(2, "0");
        const ss = Math.floor(totalSec % 60)
            .toString()
            .padStart(2, "0");
        return `${mm}:${ss}`;
    };

    // =========================================================================
    // KALKULASI REAL-TIME SELURUH 5 POS TKJI + IMT + RADAR CHART POLYGON
    // =========================================================================
    const simResult = useMemo(() => {
        const hm = simHeight / 100;
        const bmi = hm > 0 ? Number((simWeight / (hm * hm)).toFixed(2)) : 0;
        let bmiCategory = "Normal";
        if (bmi < 17.0) bmiCategory = "Sangat Kurus";
        else if (bmi < 18.5) bmiCategory = "Kurus";
        else if (bmi <= 24.9) bmiCategory = "Normal";
        else if (bmi <= 29.9) bmiCategory = "Overweight";
        else bmiCategory = "Obesitas";

        const isMale = simGender === "L";

        // Skor Pos 1: Lari Cepat 60 Meter
        const s1 = isMale
            ? simSprint60 <= 7.2
                ? 5
                : simSprint60 <= 8.3
                ? 4
                : simSprint60 <= 9.6
                ? 3
                : simSprint60 <= 11.0
                ? 2
                : 1
            : simSprint60 <= 8.4
            ? 5
            : simSprint60 <= 9.8
            ? 4
            : simSprint60 <= 11.4
            ? 3
            : simSprint60 <= 13.4
            ? 2
            : 1;

        // Skor Pos 2: Gantung Angkat Tubuh (Putra) / Gantung Siku Tekuk (Putri)
        const s2 = isMale
            ? simPullHang >= 19
                ? 5
                : simPullHang >= 14
                ? 4
                : simPullHang >= 9
                ? 3
                : simPullHang >= 5
                ? 2
                : 1
            : simPullHang >= 41
            ? 5
            : simPullHang >= 22
            ? 4
            : simPullHang >= 10
            ? 3
            : simPullHang >= 3
            ? 2
            : 1;

        // Skor Pos 3: Baring Duduk (Sit-Up 60 Detik)
        const s3 = isMale
            ? simSitUp >= 41
                ? 5
                : simSitUp >= 30
                ? 4
                : simSitUp >= 21
                ? 3
                : simSitUp >= 10
                ? 2
                : 1
            : simSitUp >= 28
            ? 5
            : simSitUp >= 20
            ? 4
            : simSitUp >= 10
            ? 3
            : simSitUp >= 3
            ? 2
            : 1;

        // Skor Pos 4: Loncat Tegak (Vertical Jump)
        const s4 = isMale
            ? simVertJump >= 73
                ? 5
                : simVertJump >= 60
                ? 4
                : simVertJump >= 50
                ? 3
                : simVertJump >= 39
                ? 2
                : 1
            : simVertJump >= 50
            ? 5
            : simVertJump >= 39
            ? 4
            : simVertJump >= 31
            ? 3
            : simVertJump >= 23
            ? 2
            : 1;

        // Skor Pos 5: Lari Daya Tahan 1200m (Putra) / 1000m (Putri)
        const s5 = isMale
            ? simEnduranceSec <= 194
                ? 5
                : simEnduranceSec <= 265
                ? 4
                : simEnduranceSec <= 312
                ? 3
                : simEnduranceSec <= 393
                ? 2
                : 1
            : simEnduranceSec <= 232
            ? 5
            : simEnduranceSec <= 296
            ? 4
            : simEnduranceSec <= 358
            ? 3
            : simEnduranceSec <= 443
            ? 2
            : 1;

        const totalTkji = s1 + s2 + s3 + s4 + s5;

        const tkjiCategory =
            totalTkji >= 22
                ? "Baik Sekali"
                : totalTkji >= 18
                ? "Baik"
                : totalTkji >= 14
                ? "Sedang"
                : totalTkji >= 10
                ? "Kurang"
                : "Kurang Sekali";

        const durationMin =
            totalTkji >= 20 ? 40 : totalTkji >= 14 ? 30 : 25;
        const restSec = totalTkji >= 20 ? 45 : totalTkji >= 14 ? 60 : 90;
        const methodTitle =
            totalTkji >= 20
                ? "Interval Sprint & Plyometric Circuit"
                : totalTkji >= 14
                ? "Continuous Tempo Run & Core Endurance"
                : "Aerobic Walk-Jog & Mobility Conditioning";

        return {
            bmi,
            bmiCategory,
            s1,
            s2,
            s3,
            s4,
            s5,
            scores: [s1, s2, s3, s4, s5],
            totalTkji,
            tkjiCategory,
            durationMin,
            restSec,
            methodTitle,
        };
    }, [
        simGender,
        simWeight,
        simHeight,
        simSprint60,
        simPullHang,
        simSitUp,
        simVertJump,
        simEnduranceSec,
    ]);

    useEffect(() => {
        if (threeApiRef.current) {
            threeApiRef.current.updateSimulationMetrics(
                simSprint60,
                simPullHang,
                simSitUp,
                simVertJump,
                simEnduranceSec,
                simResult.totalTkji,
                simResult.tkjiCategory,
                simResult.bmi,
                heroStudentName
            );
        }
    }, [
        simSprint60,
        simPullHang,
        simSitUp,
        simVertJump,
        simEnduranceSec,
        simResult.totalTkji,
        simResult.tkjiCategory,
        simResult.bmi,
        heroStudentName,
    ]);

    const radarPolygonPoints = useMemo(() => {
        const cx = 110;
        const cy = 110;
        const maxR = 74;
        return simResult.scores
            .map((sc, i) => {
                const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
                const r = (sc / 5) * maxR;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    }, [simResult.scores]);

    // =========================================================================
    // ENGINE 3D RINGAN, HEMAT GPU & KOMPOSISI KANAN (TIDAK TABRAKAN TEKS KIRI)
    // =========================================================================
    useEffect(() => {
        let isDisposed = false;
        let isHeroVisible = true;
        let animationFrameId: number;
        let cleanupEvents: (() => void) | null = null;

        async function bootThreeArena() {
            let THREE: any;
            try {
                THREE = await loadThreeJsEngine();
            } catch (_) {
                return;
            }

            if (isDisposed || !canvasContainerRef.current || !THREE) return;

            const container = canvasContainerRef.current;
            container.innerHTML = "";

            const width = Math.max(
                320,
                container.clientWidth || window.innerWidth
            );
            const height = Math.max(
                560,
                container.clientHeight || window.innerHeight
            );

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                25,
                width / height,
                0.5,
                200
            );

            const isMobileScreen = width < 1024;

            // KOMPOSISI ANTI-TABRAKAN TEKS:
            // Pada layar desktop, target kamera digeser ke X = -3.8 sehingga seluruh Stadion 3D
            // berada bersih di sisi kanan layar dan tidak menumpuk di bawah teks Hero kiri!
            const CAMERA_PRESETS: Record<
                StationFilterKey,
                { pos: any; target: any; ringPos: [number, number, number] }
            > = {
                ALL: {
                    pos: new THREE.Vector3(
                        isMobileScreen ? 18.5 : 15.8,
                        14.4,
                        isMobileScreen ? 24.0 : 21.5
                    ),
                    target: new THREE.Vector3(
                        isMobileScreen ? 1.0 : -3.8,
                        1.4,
                        0.4
                    ),
                    ringPos: [-2.8, 0.45, 2.2],
                },
                GURU: {
                    pos: new THREE.Vector3(4.5, 6.2, 12.8),
                    target: new THREE.Vector3(
                        isMobileScreen ? -3.2 : -5.2,
                        3.6,
                        -0.6
                    ),
                    ringPos: [-2.8, 0.45, 2.2],
                },
                POS1: {
                    pos: new THREE.Vector3(4.2, 5.0, 14.0),
                    target: new THREE.Vector3(
                        isMobileScreen ? 0.8 : -1.5,
                        1.1,
                        5.4
                    ),
                    ringPos: [0.8, 0.45, 5.4],
                },
                POS2: {
                    pos: new THREE.Vector3(1.8, 4.8, 8.8),
                    target: new THREE.Vector3(
                        isMobileScreen ? -0.2 : -2.2,
                        1.7,
                        -1.5
                    ),
                    ringPos: [-0.2, 0.45, -1.5],
                },
                POS3: {
                    pos: new THREE.Vector3(5.2, 4.5, 8.6),
                    target: new THREE.Vector3(
                        isMobileScreen ? 3.2 : 1.2,
                        1.1,
                        -1.5
                    ),
                    ringPos: [3.2, 0.45, -1.5],
                },
                POS4: {
                    pos: new THREE.Vector3(8.8, 5.0, 8.8),
                    target: new THREE.Vector3(
                        isMobileScreen ? 6.6 : 4.6,
                        1.8,
                        -1.5
                    ),
                    ringPos: [6.6, 0.45, -1.5],
                },
                POS5: {
                    pos: new THREE.Vector3(16.2, 9.6, 15.0),
                    target: new THREE.Vector3(
                        isMobileScreen ? 3.5 : 1.2,
                        1.2,
                        -1.5
                    ),
                    ringPos: [9.8, 0.45, -2.5],
                },
            };

            const camTarget = CAMERA_PRESETS.ALL.target.clone();
            const desiredTarget = CAMERA_PRESETS.ALL.target.clone();

            const computeSpherical = (pos: any, target: any) => {
                const offset = new THREE.Vector3().subVectors(pos, target);
                const radius = Math.max(7, Math.min(48, offset.length()));
                const phi = Math.acos(
                    Math.max(-0.99, Math.min(0.99, offset.y / radius))
                );
                const theta = Math.atan2(offset.x, offset.z);
                return { radius, phi, theta };
            };

            const currentSpherical = computeSpherical(
                CAMERA_PRESETS.ALL.pos,
                CAMERA_PRESETS.ALL.target
            );
            const desiredSpherical = { ...currentSpherical };

            const updateCameraFromSpherical = () => {
                const sinPhiRadius =
                    Math.sin(currentSpherical.phi) * currentSpherical.radius;
                camera.position.x =
                    camTarget.x +
                    sinPhiRadius * Math.sin(currentSpherical.theta);
                camera.position.y =
                    camTarget.y +
                    Math.cos(currentSpherical.phi) * currentSpherical.radius;
                camera.position.z =
                    camTarget.z +
                    sinPhiRadius * Math.cos(currentSpherical.theta);
                camera.lookAt(camTarget);
            };
            updateCameraFromSpherical();

            // Renderer dioptimalkan (pixelRatio max 1.5 & shadowMap 1024 agar sangat ringan!)
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.06;
            container.appendChild(renderer.domElement);

            let isDragging = false;
            let prevPointerX = 0;
            let prevPointerY = 0;

            const onPointerDown = (e: PointerEvent) => {
                if (e.pointerType === "touch") return;
                isDragging = true;
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
            };

            const onPointerMove = (e: PointerEvent) => {
                if (!isDragging) return;
                const dx = e.clientX - prevPointerX;
                const dy = e.clientY - prevPointerY;
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;

                desiredSpherical.theta -= dx * 0.0055;
                desiredSpherical.phi = Math.max(
                    0.22,
                    Math.min(
                        Math.PI / 2 - 0.08,
                        desiredSpherical.phi - dy * 0.0045
                    )
                );
            };

            const onPointerUp = () => {
                isDragging = false;
            };

            const domElem = renderer.domElement;
            domElem.addEventListener("pointerdown", onPointerDown);
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);

            const handleContextLost = (e: Event) => e.preventDefault();
            domElem.addEventListener(
                "webglcontextlost",
                handleContextLost,
                false
            );

            let nightMode = false;
            let activeFilterMode: StationFilterKey = "ALL";
            let simParams = {
                sprintSec: 7.5,
                sprintSpeed: 1.25,
                pullUpCount: 16,
                pullUpSpeed: 2.8,
                sitUpCount: 36,
                sitUpSpeed: 3.4,
                vjumpCm: 66,
                jumpHeight: 1.2,
                enduranceSec: 225,
                enduranceSpeed: 1.0,
                totalTkji: 22,
                tkjiCat: "BAIK SEKALI",
                bmiVal: 21.5,
                trackedHeroName: "Andi Pratama",
                trackedStationLabel: "STADION UTUH 5 POS",
            };

            let loadedLogoImg: HTMLImageElement | null = null;
            const logoImgLoader = new Image();
            logoImgLoader.crossOrigin = "anonymous";
            logoImgLoader.onload = () => {
                loadedLogoImg = logoImgLoader;
                redrawDynamic3DBrandSign();
            };
            logoImgLoader.src = "/images/logo-hitam.png";

            // -----------------------------------------------------------------
            // TEKSTUR EVENT-DRIVEN (HANYA DI-RENDER SAAT ADA PERUBAHAN DATA)
            // -----------------------------------------------------------------
            const brandSignCanvas = document.createElement("canvas");
            brandSignCanvas.width = 512;
            brandSignCanvas.height = 256;
            const brandSignCtx = brandSignCanvas.getContext("2d")!;
            const brandSignTexture = new THREE.CanvasTexture(brandSignCanvas);

            function redrawDynamic3DBrandSign() {
                brandSignCtx.fillStyle = nightMode ? "#071E16" : "#FFFFFF";
                brandSignCtx.fillRect(0, 0, 512, 256);

                const barColors = [
                    "#0EA5E9",
                    "#E87A3E",
                    "#2563EB",
                    "#10B981",
                    "#7C3AED",
                ];
                barColors.forEach((col, i) => {
                    brandSignCtx.fillStyle = col;
                    brandSignCtx.fillRect(40 + i * 86, 208, 76, 9);
                });

                brandSignCtx.font =
                    '900 88px "Plus Jakarta Sans", "Montserrat", sans-serif';
                brandSignCtx.fillStyle = nightMode ? "#FFFFFF" : "#111111";
                brandSignCtx.textBaseline = "middle";
                const word = "EduFit";
                const wordWidth = brandSignCtx.measureText(word).width;
                const startX = 42;
                const startY = 104;
                brandSignCtx.fillText(word, startX, startY);

                brandSignCtx.fillStyle = "#0EA5E9";
                brandSignCtx.beginPath();
                brandSignCtx.arc(
                    startX + wordWidth + 14,
                    startY + 19,
                    12,
                    0,
                    Math.PI * 2
                );
                brandSignCtx.fill();

                if (loadedLogoImg && !nightMode) {
                    brandSignCtx.drawImage(loadedLogoImg, 385, 22, 85, 42);
                }

                brandSignCtx.font = '800 17px "Montserrat", sans-serif';
                brandSignCtx.fillStyle = nightMode ? "#38BDF8" : "#525A56";
                brandSignCtx.fillText(
                    "STADION ASESMEN TKJI & FITT",
                    44,
                    174
                );

                brandSignTexture.needsUpdate = true;
            }
            redrawDynamic3DBrandSign();

            // TEKSTUR JUMBOTRON SKOR STADION (TAJAM & ANTI-TERTUTUP BINGKAI!)
            const jumbotronCanvas = document.createElement("canvas");
            jumbotronCanvas.width = 1024;
            jumbotronCanvas.height = 512;
            const jumbotronCtx = jumbotronCanvas.getContext("2d")!;
            const jumbotronTexture = new THREE.CanvasTexture(jumbotronCanvas);

            function redrawJumbotronScoreboard() {
                jumbotronCtx.fillStyle = "#04120D";
                jumbotronCtx.fillRect(0, 0, 1024, 512);

                jumbotronCtx.strokeStyle = "#0EA5E9";
                jumbotronCtx.lineWidth = 12;
                jumbotronCtx.strokeRect(14, 14, 996, 484);

                // Baris Atas: EduFit. (Putih + Titik Biru) & Nama Atlet
                jumbotronCtx.font = '900 56px "Plus Jakarta Sans", sans-serif';
                jumbotronCtx.fillStyle = "#FFFFFF";
                const brandTxt = "EduFit";
                const bw = jumbotronCtx.measureText(brandTxt).width;
                jumbotronCtx.fillText(brandTxt, 52, 84);

                jumbotronCtx.fillStyle = "#0EA5E9";
                jumbotronCtx.beginPath();
                jumbotronCtx.arc(52 + bw + 12, 78, 10, 0, Math.PI * 2);
                jumbotronCtx.fill();

                jumbotronCtx.font = '800 28px "Montserrat", sans-serif';
                jumbotronCtx.fillStyle = "#F5C84C";
                jumbotronCtx.textAlign = "right";
                jumbotronCtx.fillText(
                    `ATLET: ${simParams.trackedHeroName.toUpperCase()}`,
                    968,
                    82
                );
                jumbotronCtx.textAlign = "left";

                jumbotronCtx.fillStyle = "rgba(255,255,255,0.15)";
                jumbotronCtx.fillRect(52, 116, 920, 3);

                // Skor Utama Raksasa di Kiri
                jumbotronCtx.font = '800 24px "Poppins", sans-serif';
                jumbotronCtx.fillStyle = "#38BDF8";
                jumbotronCtx.fillText("TOTAL SKOR 5 POS TKJI", 52, 166);

                jumbotronCtx.font = '900 132px "Montserrat", sans-serif';
                jumbotronCtx.fillStyle = "#F5C84C";
                jumbotronCtx.fillText(
                    `${simParams.totalTkji}/25`,
                    52,
                    292
                );

                // Panel Predikat & IMT di Kanan
                jumbotronCtx.fillStyle = "#0B3124";
                jumbotronCtx.fillRect(520, 142, 452, 168);
                jumbotronCtx.strokeStyle = "#10B981";
                jumbotronCtx.lineWidth = 4;
                jumbotronCtx.strokeRect(520, 142, 452, 168);

                jumbotronCtx.font = '800 22px "Poppins", sans-serif';
                jumbotronCtx.fillStyle = "#10B981";
                jumbotronCtx.fillText("PREDIKAT KEBUGARAN", 548, 186);

                jumbotronCtx.font = '900 48px "Montserrat", sans-serif';
                jumbotronCtx.fillStyle = "#FFFFFF";
                jumbotronCtx.fillText(simParams.tkjiCat, 548, 244);

                jumbotronCtx.font = '700 24px "Montserrat", sans-serif';
                jumbotronCtx.fillStyle = "#F5C84C";
                jumbotronCtx.fillText(
                    `IMT: ${simParams.bmiVal} ( IDEAL )`,
                    548,
                    286
                );

                // Baris Bawah: Rincian 5 Pos TKJI
                jumbotronCtx.fillStyle = "#0EA5E9";
                jumbotronCtx.fillRect(52, 342, 920, 52);
                jumbotronCtx.font = '800 26px "Montserrat", sans-serif';
                jumbotronCtx.fillStyle = "#04120D";
                jumbotronCtx.fillText(
                    `60M: ${simParams.sprintSec.toFixed(1)}s  |  PULL/SIKU: ${simParams.pullUpCount}  |  SIT-UP: ${simParams.sitUpCount}  |  LONCAT: ${simParams.vjumpCm}cm`,
                    74,
                    377
                );

                jumbotronCtx.font = '700 22px "Montserrat", sans-serif';
                jumbotronCtx.fillStyle = "#94A3B8";
                jumbotronCtx.fillText(
                    `KOMANDO GURU PJOK AKTIF  •  SOROTAN POS: ${simParams.trackedStationLabel}`,
                    52,
                    448
                );

                jumbotronTexture.needsUpdate = true;
            }
            redrawJumbotronScoreboard();

            function createJisStripedTurfTexture() {
                const c = document.createElement("canvas");
                c.width = 512;
                c.height = 256;
                const ctx = c.getContext("2d")!;

                const numStripes = 12;
                const stripeW = 512 / numStripes;
                for (let i = 0; i < numStripes; i++) {
                    ctx.fillStyle = i % 2 === 0 ? "#15803D" : "#166534";
                    ctx.fillRect(i * stripeW, 0, stripeW, 256);
                }

                ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
                ctx.lineWidth = 4;
                ctx.strokeRect(18, 18, 476, 220);

                ctx.beginPath();
                ctx.moveTo(256, 18);
                ctx.lineTo(256, 238);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(256, 128, 46, 0, Math.PI * 2);
                ctx.stroke();

                return new THREE.CanvasTexture(c);
            }

            function makeStationSignTexture(
                bgHex: string,
                accentHex: string,
                posCode: string,
                title: string
            ) {
                const c = document.createElement("canvas");
                c.width = 256;
                c.height = 110;
                const ctx = c.getContext("2d")!;

                ctx.fillStyle = bgHex;
                ctx.fillRect(0, 0, 256, 110);

                ctx.fillStyle = accentHex;
                ctx.fillRect(0, 0, 10, 110);

                ctx.fillStyle = accentHex;
                ctx.font = '800 15px "Montserrat", sans-serif';
                ctx.fillText(posCode, 22, 39);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
                ctx.fillText(title, 22, 74);

                return new THREE.CanvasTexture(c);
            }

            // -----------------------------------------------------------------
            // BUILDER KARAKTER MULTI-SENDI RINGAN (LOW-POLY GEOMETRY HEMAT GPU)
            // -----------------------------------------------------------------
            function createBiomechanicalCharacter(
                jerseyColorHex: number,
                shortsColorHex = 0x121c18,
                skinColorHex = 0xf1c27d,
                isGuruCoach = false
            ) {
                const root = new THREE.Group();
                const pelvisGroup = new THREE.Group();
                pelvisGroup.position.y = 0.68;
                root.add(pelvisGroup);

                const jerseyMat = new THREE.MeshStandardMaterial({
                    color: jerseyColorHex,
                    roughness: 0.35,
                });
                const shortsMat = new THREE.MeshStandardMaterial({
                    color: shortsColorHex,
                    roughness: 0.45,
                });
                const skinMat = new THREE.MeshStandardMaterial({
                    color: skinColorHex,
                    roughness: 0.4,
                });
                const accentMat = new THREE.MeshStandardMaterial({
                    color: isGuruCoach ? 0x0ea5e9 : 0xf5c84c,
                    roughness: 0.25,
                });

                const pelvisMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.35, 0.2, 0.22),
                    shortsMat
                );
                pelvisMesh.castShadow = true;
                pelvisGroup.add(pelvisMesh);

                const torsoPivot = new THREE.Group();
                torsoPivot.position.y = 0.08;
                pelvisGroup.add(torsoPivot);

                const torsoMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 0.48, 0.23),
                    jerseyMat
                );
                torsoMesh.position.y = 0.24;
                torsoMesh.castShadow = true;
                torsoPivot.add(torsoMesh);

                if (isGuruCoach) {
                    const lanyard = new THREE.Mesh(
                        new THREE.BoxGeometry(0.16, 0.26, 0.25),
                        new THREE.MeshStandardMaterial({ color: 0xf5c84c })
                    );
                    lanyard.position.y = 0.34;
                    torsoPivot.add(lanyard);
                } else {
                    const chestBand = new THREE.Mesh(
                        new THREE.BoxGeometry(0.42, 0.09, 0.24),
                        accentMat
                    );
                    chestBand.position.y = 0.3;
                    torsoPivot.add(chestBand);
                }

                const headGroup = new THREE.Group();
                headGroup.position.y = 0.64;
                const headMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.155, 12, 12),
                    skinMat
                );
                headMesh.castShadow = true;
                headGroup.add(headMesh);

                if (isGuruCoach) {
                    const capCrown = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.16, 0.16, 0.1, 12),
                        new THREE.MeshStandardMaterial({ color: 0x0b3124 })
                    );
                    capCrown.position.y = 0.08;
                    headGroup.add(capCrown);

                    const capVisor = new THREE.Mesh(
                        new THREE.BoxGeometry(0.22, 0.03, 0.2),
                        accentMat
                    );
                    capVisor.position.set(0, 0.05, 0.12);
                    headGroup.add(capVisor);
                } else {
                    const headband = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.16, 0.16, 0.055, 12),
                        jerseyMat
                    );
                    headband.position.y = 0.05;
                    headGroup.add(headband);
                }
                torsoPivot.add(headGroup);

                function buildTwoSegmentArm(isLeft: boolean) {
                    const shoulderPivot = new THREE.Group();
                    shoulderPivot.position.set(isLeft ? -0.26 : 0.26, 0.44, 0);

                    const upperArm = new THREE.Mesh(
                        new THREE.BoxGeometry(0.11, 0.25, 0.11),
                        jerseyMat
                    );
                    upperArm.position.y = -0.11;
                    upperArm.castShadow = true;
                    shoulderPivot.add(upperArm);

                    const elbowPivot = new THREE.Group();
                    elbowPivot.position.set(0, -0.23, 0);
                    shoulderPivot.add(elbowPivot);

                    const forearm = new THREE.Mesh(
                        new THREE.BoxGeometry(0.095, 0.24, 0.095),
                        skinMat
                    );
                    forearm.position.y = -0.11;
                    forearm.castShadow = true;
                    elbowPivot.add(forearm);

                    if (isGuruCoach && isLeft) {
                        const tablet = new THREE.Mesh(
                            new THREE.BoxGeometry(0.26, 0.03, 0.34),
                            new THREE.MeshStandardMaterial({
                                color: 0x0ea5e9,
                                emissive: 0x0284c7,
                                emissiveIntensity: 0.6,
                            })
                        );
                        tablet.position.set(0.06, -0.23, 0.1);
                        elbowPivot.add(tablet);
                    }

                    torsoPivot.add(shoulderPivot);
                    return { shoulderPivot, elbowPivot };
                }

                const leftArm = buildTwoSegmentArm(true);
                const rightArm = buildTwoSegmentArm(false);

                function buildTwoSegmentLeg(isLeft: boolean) {
                    const hipPivot = new THREE.Group();
                    hipPivot.position.set(isLeft ? -0.11 : 0.11, -0.04, 0);

                    const thigh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.135, 0.31, 0.135),
                        shortsMat
                    );
                    thigh.position.y = -0.15;
                    thigh.castShadow = true;
                    hipPivot.add(thigh);

                    const kneePivot = new THREE.Group();
                    kneePivot.position.set(0, -0.3, 0);
                    hipPivot.add(kneePivot);

                    const calf = new THREE.Mesh(
                        new THREE.BoxGeometry(0.11, 0.31, 0.11),
                        isGuruCoach ? shortsMat : skinMat
                    );
                    calf.position.y = -0.15;
                    calf.castShadow = true;
                    kneePivot.add(calf);

                    const shoe = new THREE.Mesh(
                        new THREE.BoxGeometry(0.135, 0.09, 0.24),
                        accentMat
                    );
                    shoe.position.set(0, -0.3, 0.04);
                    shoe.castShadow = true;
                    kneePivot.add(shoe);

                    pelvisGroup.add(hipPivot);
                    return { hipPivot, kneePivot };
                }

                const leftLeg = buildTwoSegmentLeg(true);
                const rightLeg = buildTwoSegmentLeg(false);

                root.userData = {
                    pelvisGroup,
                    torsoPivot,
                    headGroup,
                    leftArm,
                    rightArm,
                    leftLeg,
                    rightLeg,
                };
                return root;
            }

            // -----------------------------------------------------------------
            // PENCAHAYAAN STUDIO (SHADOW MAP 1024 HEMAT GPU)
            // -----------------------------------------------------------------
            const hemiLight = new THREE.HemisphereLight(
                0xfffdf9,
                0xdfd7c8,
                0.88
            );
            hemiLight.position.set(0, 28, 0);
            scene.add(hemiLight);

            const sunLight = new THREE.DirectionalLight(0xfff7eb, 1.3);
            sunLight.position.set(16, 25, 15);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 1024;
            sunLight.shadow.mapSize.height = 1024;
            sunLight.shadow.camera.near = 4;
            sunLight.shadow.camera.far = 60;
            const d = 18;
            sunLight.shadow.camera.left = -d;
            sunLight.shadow.camera.right = d;
            sunLight.shadow.camera.top = d;
            sunLight.shadow.camera.bottom = -d;
            sunLight.shadow.bias = -0.0008;
            scene.add(sunLight);

            const stadiumFloodLight = new THREE.PointLight(
                0x38bdf8,
                0.6,
                28,
                1.5
            );
            stadiumFloodLight.position.set(2.0, 9.5, -5.5);
            scene.add(stadiumFloodLight);

            const spotlightRingGroup = new THREE.Group();
            const ringGeo = new THREE.RingGeometry(1.3, 1.58, 36);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x0ea5e9,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.75,
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            spotlightRingGroup.add(ringMesh);
            spotlightRingGroup.position.set(-2.8, 0.45, 2.2);
            scene.add(spotlightRingGroup);
            const desiredRingPos = new THREE.Vector3(-2.8, 0.45, 2.2);

            // -----------------------------------------------------------------
            // PODIUM DASAR & LAPANGAN RUMPUT BELANG JIS
            // -----------------------------------------------------------------
            const groundPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(140, 140),
                new THREE.ShadowMaterial({ opacity: 0.13 })
            );
            groundPlane.rotation.x = -Math.PI / 2;
            groundPlane.position.y = -0.55;
            groundPlane.receiveShadow = true;
            scene.add(groundPlane);

            const mainPodium = new THREE.Mesh(
                new THREE.BoxGeometry(27.5, 0.85, 18.5),
                new THREE.MeshStandardMaterial({
                    color: 0xeae6dd,
                    roughness: 0.42,
                })
            );
            mainPodium.position.set(1.8, -0.1, -0.4);
            mainPodium.receiveShadow = true;
            scene.add(mainPodium);

            const jisTurfTex = createJisStripedTurfTexture();
            const infieldTurf = new THREE.Mesh(
                new THREE.BoxGeometry(13.4, 0.14, 7.5),
                new THREE.MeshStandardMaterial({
                    map: jisTurfTex,
                    roughness: 0.65,
                })
            );
            infieldTurf.position.set(1.8, 0.36, -1.5);
            infieldTurf.receiveShadow = true;
            scene.add(infieldTurf);

            // -----------------------------------------------------------------
            // TRIBUN PENONTON & ATAP STADION JIS
            // -----------------------------------------------------------------
            const jisStadiumGroup = new THREE.Group();
            const concreteMat = new THREE.MeshStandardMaterial({
                color: 0xe5e7eb,
                roughness: 0.4,
            });
            const darkSteelMat = new THREE.MeshStandardMaterial({
                color: 0x0b3124,
                metalness: 0.5,
                roughness: 0.3,
            });

            const tierColors = [0x0b3124, 0x0ea5e9, 0xf5c84c];
            for (let t = 0; t < 3; t++) {
                const tierStep = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        21.0 + t * 1.2,
                        0.75 + t * 0.65,
                        1.05
                    ),
                    concreteMat
                );
                tierStep.position.set(
                    1.8,
                    0.7 + t * 0.55,
                    -8.2 - t * 0.95
                );
                tierStep.receiveShadow = true;
                jisStadiumGroup.add(tierStep);

                const seatStrip = new THREE.Mesh(
                    new THREE.BoxGeometry(20.2 + t * 1.0, 0.14, 0.45),
                    new THREE.MeshStandardMaterial({
                        color: tierColors[t % tierColors.length],
                        roughness: 0.35,
                    })
                );
                seatStrip.position.set(
                    1.8,
                    1.12 + t * 0.85,
                    -8.0 - t * 0.95
                );
                jisStadiumGroup.add(seatStrip);
            }

            for (let p = -4; p <= 4; p += 2) {
                const xCol = 1.8 + p * 2.5;
                const ribPillar = new THREE.Mesh(
                    new THREE.BoxGeometry(0.28, 5.8, 0.35),
                    darkSteelMat
                );
                ribPillar.position.set(xCol, 3.2, -10.8);
                ribPillar.rotation.x = 0.18;
                jisStadiumGroup.add(ribPillar);
            }

            const canopyRoof = new THREE.Mesh(
                new THREE.BoxGeometry(23.2, 0.3, 3.6),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.25,
                })
            );
            canopyRoof.position.set(1.8, 6.1, -9.5);
            canopyRoof.rotation.x = 0.12;
            jisStadiumGroup.add(canopyRoof);

            const floodlightMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0x38bdf8,
                emissiveIntensity: 1.4,
            });
            for (let f = -3; f <= 3; f += 2) {
                const lampPod = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 0.22, 0.35),
                    floodlightMat
                );
                lampPod.position.set(1.8 + f * 3.1, 5.85, -7.8);
                jisStadiumGroup.add(lampPod);
            }

            scene.add(jisStadiumGroup);

            // -----------------------------------------------------------------
            // GEDUNG HUB UTAMA + LOGO "EduFit." + JUMBOTRON SKOR YANG TERLIHAT JELAS
            // -----------------------------------------------------------------
            const hubGroup = new THREE.Group();
            const whiteWallMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.25,
            });
            const forestWallMat = new THREE.MeshStandardMaterial({
                color: 0x0b3124,
                roughness: 0.35,
            });
            const goldAccentMat = new THREE.MeshStandardMaterial({
                color: 0xf5c84c,
                emissive: 0xd99b26,
                emissiveIntensity: 0.35,
                roughness: 0.25,
            });

            // Menggunakan BoxGeometry presisi agar panel logo & layar Jumbotron tidak pernah tertutup bevel!
            const mainBuilding = new THREE.Mesh(
                new THREE.BoxGeometry(4.0, 3.6, 3.4),
                whiteWallMat
            );
            mainBuilding.position.set(-3.8, 2.1, -1.6);
            mainBuilding.castShadow = true;
            mainBuilding.receiveShadow = true;
            hubGroup.add(mainBuilding);

            const brandSignMat = new THREE.MeshBasicMaterial({
                map: brandSignTexture,
            });

            // Panel Depan (+Z) & Panel Kanan (+X) tepat di luar dinding gedung (100% Terlihat!)
            const frontBrandPanel = new THREE.Mesh(
                new THREE.PlaneGeometry(3.6, 1.8),
                brandSignMat
            );
            frontBrandPanel.position.set(-3.8, 2.3, 0.12);
            hubGroup.add(frontBrandPanel);

            const sideBrandPanel = new THREE.Mesh(
                new THREE.PlaneGeometry(3.1, 1.55),
                brandSignMat
            );
            sideBrandPanel.rotation.y = Math.PI / 2;
            sideBrandPanel.position.set(-1.78, 2.3, -1.6);
            hubGroup.add(sideBrandPanel);

            // LAYAR JUMBOTRON 3D DI ATAS ATAP GEDUNG (BoxGeometry tipis 0.22m, Layar di Z = +0.13m)
            const jumbotronGroup = new THREE.Group();
            jumbotronGroup.position.set(-3.6, 5.15, -1.5);
            jumbotronGroup.rotation.y = 0.58;

            const jumboFrame = new THREE.Mesh(
                new THREE.BoxGeometry(5.3, 2.65, 0.22),
                new THREE.MeshStandardMaterial({
                    color: 0x05140f,
                    roughness: 0.3,
                })
            );
            jumbotronGroup.add(jumboFrame);

            const jumboScreen = new THREE.Mesh(
                new THREE.PlaneGeometry(5.05, 2.42),
                new THREE.MeshBasicMaterial({ map: jumbotronTexture })
            );
            jumboScreen.position.z = 0.13; // Di luar permukaan depan jumboFrame (0.11)!
            jumbotronGroup.add(jumboScreen);

            [-1.5, 1.5].forEach((xPost) => {
                const post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.09, 0.09, 1.3, 10),
                    forestWallMat
                );
                post.position.set(xPost, -1.3, 0);
                jumbotronGroup.add(post);
            });

            hubGroup.add(jumbotronGroup);
            scene.add(hubGroup);

            // =================================================================
            // KARAKTER 3D GURU PJOK DI DEPAN LAPANGAN
            // =================================================================
            const guruStationGroup = new THREE.Group();
            guruStationGroup.position.set(-2.8, 0.4, 2.2);
            guruStationGroup.rotation.y = 0.65;

            const guruPodiumBase = new THREE.Mesh(
                new THREE.CylinderGeometry(1.0, 1.12, 0.2, 24),
                forestWallMat
            );
            guruPodiumBase.receiveShadow = true;
            guruStationGroup.add(guruPodiumBase);

            const guruGlowRing = new THREE.Mesh(
                new THREE.RingGeometry(1.14, 1.26, 24),
                new THREE.MeshBasicMaterial({
                    color: 0x0ea5e9,
                    side: THREE.DoubleSide,
                })
            );
            guruGlowRing.rotation.x = -Math.PI / 2;
            guruGlowRing.position.y = 0.05;
            guruStationGroup.add(guruGlowRing);

            const guruCoachMesh = createBiomechanicalCharacter(
                0x0f172a,
                0x1e293b,
                0xf1c27d,
                true
            );
            guruCoachMesh.position.set(0, 0.12, 0);
            guruCoachMesh.scale.setScalar(1.1);
            guruCoachMesh.userData.leftArm.shoulderPivot.rotation.x = -0.55;
            guruCoachMesh.userData.leftArm.elbowPivot.rotation.x = -1.1;
            guruStationGroup.add(guruCoachMesh);

            const signGuru = new THREE.Mesh(
                new THREE.PlaneGeometry(2.2, 0.9),
                new THREE.MeshBasicMaterial({
                    map: makeStationSignTexture(
                        "#07241A",
                        "#0EA5E9",
                        "KOMANDO LAPANGAN",
                        "Guru PJOK (Live)"
                    ),
                })
            );
            signGuru.position.set(0, 2.5, -0.6);
            guruStationGroup.add(signGuru);

            scene.add(guruStationGroup);

            // =================================================================
            // POS 05: SIRKUIT STADION OVAL 1.200M / 1.000M
            // =================================================================
            const ovalGroup = new THREE.Group();
            const ovalCenterX = 1.8;
            const ovalCenterZ = -1.5;
            const ovalStraightHalf = 6.6;
            const ovalRadius = 5.2;
            const trackWidth = 1.85;

            function createOvalTrackShape(
                halfStraight: number,
                radius: number
            ) {
                const s = new THREE.Shape();
                s.moveTo(-halfStraight, -radius);
                s.lineTo(halfStraight, -radius);
                s.absarc(
                    halfStraight,
                    0,
                    radius,
                    -Math.PI / 2,
                    Math.PI / 2,
                    false
                );
                s.lineTo(-halfStraight, radius);
                s.absarc(
                    -halfStraight,
                    0,
                    radius,
                    Math.PI / 2,
                    (3 * Math.PI) / 2,
                    false
                );
                return s;
            }

            const outerOvalShape = createOvalTrackShape(
                ovalStraightHalf,
                ovalRadius + trackWidth / 2
            );
            const innerOvalHole = createOvalTrackShape(
                ovalStraightHalf,
                ovalRadius - trackWidth / 2
            );
            outerOvalShape.holes.push(innerOvalHole);

            const ovalGeo = new THREE.ExtrudeGeometry(outerOvalShape, {
                depth: 0.12,
                bevelEnabled: false,
                curveSegments: 32,
            });
            ovalGeo.rotateX(Math.PI / 2);

            const ovalTrackMesh = new THREE.Mesh(
                ovalGeo,
                new THREE.MeshStandardMaterial({
                    color: 0x0d9488,
                    roughness: 0.48,
                })
            );
            ovalTrackMesh.position.set(ovalCenterX, 0.44, ovalCenterZ);
            ovalTrackMesh.receiveShadow = true;
            ovalGroup.add(ovalTrackMesh);

            const signPos5 = new THREE.Mesh(
                new THREE.PlaneGeometry(2.4, 1.05),
                new THREE.MeshBasicMaterial({
                    map: makeStationSignTexture(
                        "#07241A",
                        "#14B8A6",
                        "POS 05 • SIRKUIT OVAL",
                        "Lari 1.200m / 1.000m"
                    ),
                })
            );
            signPos5.position.set(10.5, 2.1, -2.5);
            signPos5.rotation.y = -0.35;
            ovalGroup.add(signPos5);

            scene.add(ovalGroup);

            function getOvalTrackPose(uNorm: number, laneOffset = 0) {
                const u = ((uNorm % 1) + 1) % 1;
                const r = ovalRadius + laneOffset;
                const L = ovalStraightHalf * 2;
                const arcLen = Math.PI * r;
                const totalPerim = 2 * L + 2 * arcLen;
                const dist = u * totalPerim;

                let localX = 0;
                let localZ = 0;
                let rotY = 0;

                if (dist < L) {
                    localX = -ovalStraightHalf + dist;
                    localZ = -r;
                    rotY = Math.PI / 2;
                } else if (dist < L + arcLen) {
                    const dArc = dist - L;
                    const theta = -Math.PI / 2 + dArc / r;
                    localX = ovalStraightHalf + r * Math.cos(theta);
                    localZ = r * Math.sin(theta);
                    rotY = -theta;
                } else if (dist < 2 * L + arcLen) {
                    const dStr = dist - (L + arcLen);
                    localX = ovalStraightHalf - dStr;
                    localZ = r;
                    rotY = -Math.PI / 2;
                } else {
                    const dArc = dist - (2 * L + arcLen);
                    const theta = Math.PI / 2 + dArc / r;
                    localX = -ovalStraightHalf + r * Math.cos(theta);
                    localZ = r * Math.sin(theta);
                    rotY = -theta;
                }

                return {
                    x: ovalCenterX + localX,
                    z: ovalCenterZ + localZ,
                    rotY,
                };
            }

            // =================================================================
            // POS 01: LINTASAN LURUS SPRINT 60 METER
            // =================================================================
            const pos1SprintGroup = new THREE.Group();
            const sprintStartZ = 5.4;
            const sprintStartX = -5.6;
            const sprintEndX = 7.4;

            const sprintTrackMesh = new THREE.Mesh(
                new THREE.BoxGeometry(15.2, 0.16, 2.2),
                new THREE.MeshStandardMaterial({
                    color: 0xe87a3e,
                    roughness: 0.45,
                })
            );
            sprintTrackMesh.position.set(1.0, 0.41, sprintStartZ);
            sprintTrackMesh.receiveShadow = true;
            pos1SprintGroup.add(sprintTrackMesh);

            [-0.52, 0.52].forEach((zOff) => {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(14.6, 0.02, 0.05),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
                line.position.set(1.0, 0.5, sprintStartZ + zOff);
                pos1SprintGroup.add(line);
            });

            [-0.3, 0.3].forEach((zOff) => {
                const block = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.14, 0.22),
                    forestWallMat
                );
                block.position.set(sprintStartX, 0.53, sprintStartZ + zOff);
                pos1SprintGroup.add(block);
            });

            const archPillarL = new THREE.Mesh(
                new THREE.BoxGeometry(0.26, 2.9, 0.26),
                forestWallMat
            );
            archPillarL.position.set(sprintEndX, 1.75, sprintStartZ - 1.0);
            pos1SprintGroup.add(archPillarL);

            const archPillarR = new THREE.Mesh(
                new THREE.BoxGeometry(0.26, 2.9, 0.26),
                forestWallMat
            );
            archPillarR.position.set(sprintEndX, 1.75, sprintStartZ + 1.0);
            pos1SprintGroup.add(archPillarR);

            const archTop = new THREE.Mesh(
                new THREE.BoxGeometry(0.38, 0.42, 2.4),
                goldAccentMat
            );
            archTop.position.set(sprintEndX, 3.2, sprintStartZ);
            pos1SprintGroup.add(archTop);

            const signPos1 = new THREE.Mesh(
                new THREE.PlaneGeometry(2.3, 1.0),
                new THREE.MeshBasicMaterial({
                    map: makeStationSignTexture(
                        "#0B3124",
                        "#E87A3E",
                        "POS 01 • LINTASAN LURUS",
                        "Sprint Cepat 60m"
                    ),
                })
            );
            signPos1.position.set(-4.6, 2.0, sprintStartZ - 1.2);
            pos1SprintGroup.add(signPos1);

            scene.add(pos1SprintGroup);

            // =================================================================
            // POS 02, POS 03, DAN POS 04 DI TENGAH LAPANGAN RUMPUT JIS
            // =================================================================
            // POS 02: PULL-UP & GANTUNG SIKU RIG
            const pos2Group = new THREE.Group();
            pos2Group.position.set(-0.2, 0.42, -1.5);

            const blueMatPad = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 0.16, 2.2),
                new THREE.MeshStandardMaterial({
                    color: 0x2563eb,
                    roughness: 0.45,
                })
            );
            blueMatPad.receiveShadow = true;
            pos2Group.add(blueMatPad);

            const chromeMat = new THREE.MeshStandardMaterial({
                color: 0xe2e8f0,
                metalness: 0.75,
                roughness: 0.2,
            });
            [-0.76, 0.76].forEach((xPos) => {
                const post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.07, 0.07, 2.75, 12),
                    forestWallMat
                );
                post.position.set(xPos, 1.38, 0);
                pos2Group.add(post);
            });

            const highBar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 1.65, 12),
                chromeMat
            );
            highBar.rotation.z = Math.PI / 2;
            highBar.position.set(0, 2.68, 0);
            pos2Group.add(highBar);

            const pullUpAthlete = createBiomechanicalCharacter(
                0x2563eb,
                0x0f172a
            );
            pullUpAthlete.position.set(0, 0.85, 0);
            pos2Group.add(pullUpAthlete);

            const signPos2 = new THREE.Mesh(
                new THREE.PlaneGeometry(2.05, 0.92),
                new THREE.MeshBasicMaterial({
                    map: makeStationSignTexture(
                        "#0B3124",
                        "#38BDF8",
                        "POS 02 TKJI",
                        "Pull-Up / Siku"
                    ),
                })
            );
            signPos2.position.set(0, 3.35, 0);
            pos2Group.add(signPos2);
            scene.add(pos2Group);

            // POS 03: SIT-UP 60 DETIK
            const pos3Group = new THREE.Group();
            pos3Group.position.set(3.2, 0.42, -1.5);

            const emeraldMatPad = new THREE.Mesh(
                new THREE.BoxGeometry(2.6, 0.16, 2.2),
                new THREE.MeshStandardMaterial({
                    color: 0x10b981,
                    roughness: 0.45,
                })
            );
            emeraldMatPad.receiveShadow = true;
            pos3Group.add(emeraldMatPad);

            const sitUpAthlete = createBiomechanicalCharacter(
                0x059669,
                0x1e293b
            );
            sitUpAthlete.position.set(-0.2, 0.22, 0);
            sitUpAthlete.rotation.y = Math.PI / 2;
            sitUpAthlete.userData.leftLeg.hipPivot.rotation.x = -Math.PI / 2.2;
            sitUpAthlete.userData.leftLeg.kneePivot.rotation.x = Math.PI / 2.1;
            sitUpAthlete.userData.rightLeg.hipPivot.rotation.x = -Math.PI / 2.2;
            sitUpAthlete.userData.rightLeg.kneePivot.rotation.x = Math.PI / 2.1;
            pos3Group.add(sitUpAthlete);

            const signPos3 = new THREE.Mesh(
                new THREE.PlaneGeometry(2.05, 0.92),
                new THREE.MeshBasicMaterial({
                    map: makeStationSignTexture(
                        "#0B3124",
                        "#10B981",
                        "POS 03 TKJI",
                        "Sit-Up 60 Detik"
                    ),
                })
            );
            signPos3.position.set(0, 1.95, -0.92);
            pos3Group.add(signPos3);
            scene.add(pos3Group);

            // POS 04: LONCAT TEGAK / VERTICAL JUMP
            const pos4Group = new THREE.Group();
            pos4Group.position.set(6.6, 0.42, -1.5);

            const violetMatPad = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 0.16, 2.2),
                new THREE.MeshStandardMaterial({
                    color: 0x7c3aed,
                    roughness: 0.45,
                })
            );
            violetMatPad.receiveShadow = true;
            pos4Group.add(violetMatPad);

            const vjTower = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 3.5, 0.18),
                forestWallMat
            );
            vjTower.position.set(0.58, 1.75, -0.2);
            pos4Group.add(vjTower);

            for (let v = 0; v < 8; v++) {
                const vane = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.05, 0.06),
                    v >= 5
                        ? goldAccentMat
                        : new THREE.MeshStandardMaterial({ color: 0xe87a3e })
                );
                vane.position.set(0.28, 1.98 + v * 0.18, -0.2);
                pos4Group.add(vane);
            }

            const jumpAthlete = createBiomechanicalCharacter(
                0x7c3aed,
                0x0f172a
            );
            jumpAthlete.position.set(-0.15, 0.15, -0.1);
            pos4Group.add(jumpAthlete);

            const signPos4 = new THREE.Mesh(
                new THREE.PlaneGeometry(2.05, 0.92),
                new THREE.MeshBasicMaterial({
                    map: makeStationSignTexture(
                        "#0B3124",
                        "#A78BFA",
                        "POS 04 TKJI",
                        "Vertical Jump"
                    ),
                })
            );
            signPos4.position.set(0, 3.55, -0.68);
            pos4Group.add(signPos4);
            scene.add(pos4Group);

            // =================================================================
            // ATLET PELARI: SPRINT 60M (LURUS) VS ENDURANCE 1200M (OVAL)
            // =================================================================
            const sprinter1 = createBiomechanicalCharacter(0xf5c84c, 0x0b3124);
            const sprinter2 = createBiomechanicalCharacter(0xe87a3e, 0x18181b);
            scene.add(sprinter1);
            scene.add(sprinter2);

            const sprintRunners = [
                {
                    mesh: sprinter1,
                    name: "Andi Pratama",
                    progress: 0.05,
                    speed: 0.22,
                    laneZ: sprintStartZ - 0.32,
                },
                {
                    mesh: sprinter2,
                    name: "Rizky XII-1",
                    progress: 0.45,
                    speed: 0.19,
                    laneZ: sprintStartZ + 0.32,
                },
            ];

            const ovalRunner1 = createBiomechanicalCharacter(
                0x10b981,
                0x07241a
            );
            const ovalRunner2 = createBiomechanicalCharacter(
                0x38bdf8,
                0x0f172a
            );
            const ovalRunner3 = createBiomechanicalCharacter(
                0xf43f5e,
                0x18181b
            );
            scene.add(ovalRunner1);
            scene.add(ovalRunner2);
            scene.add(ovalRunner3);

            const enduranceRunners = [
                {
                    mesh: ovalRunner1,
                    name: "Bagas (1.200m)",
                    u: 0.12,
                    speed: 0.055,
                    laneOffset: -0.35,
                },
                {
                    mesh: ovalRunner2,
                    name: "Nadia (1.000m)",
                    u: 0.48,
                    speed: 0.048,
                    laneOffset: 0.35,
                },
                {
                    mesh: ovalRunner3,
                    name: "Aulia (1.000m)",
                    u: 0.78,
                    speed: 0.052,
                    laneOffset: -0.35,
                },
            ];

            function applyRunningBiomechanics(
                athleteMesh: any,
                phase: number,
                isSprint: boolean
            ) {
                const u = athleteMesh.userData;
                const amp = isSprint ? 1.05 : 0.72;

                u.torsoPivot.rotation.x = isSprint ? 0.28 : 0.12;
                u.torsoPivot.rotation.y = Math.sin(phase) * 0.12;

                const leftArmSwing = Math.sin(phase) * amp;
                const rightArmSwing = -Math.sin(phase) * amp;
                u.leftArm.shoulderPivot.rotation.x = leftArmSwing;
                u.leftArm.elbowPivot.rotation.x =
                    -1.35 - Math.max(0, leftArmSwing) * 0.35;

                u.rightArm.shoulderPivot.rotation.x = rightArmSwing;
                u.rightArm.elbowPivot.rotation.x =
                    -1.35 - Math.max(0, rightArmSwing) * 0.35;

                const leftLegSwing = -Math.sin(phase) * amp;
                const rightLegSwing = Math.sin(phase) * amp;

                u.leftLeg.hipPivot.rotation.x = leftLegSwing;
                u.leftLeg.kneePivot.rotation.x =
                    Math.max(0, -Math.cos(phase)) * (isSprint ? 1.65 : 1.25);

                u.rightLeg.hipPivot.rotation.x = rightLegSwing;
                u.rightLeg.kneePivot.rotation.x =
                    Math.max(0, Math.cos(phase)) * (isSprint ? 1.65 : 1.25);
            }

            // -----------------------------------------------------------------
            // API KONTROL DARI REACT KE ARENA 3D
            // -----------------------------------------------------------------
            const applyStationFocus = (
                station: StationFilterKey,
                customAthleteName?: string
            ) => {
                const preset = CAMERA_PRESETS[station] || CAMERA_PRESETS.ALL;
                const nextSph = computeSpherical(preset.pos, preset.target);
                desiredSpherical.radius = nextSph.radius;
                desiredSpherical.phi = nextSph.phi;
                desiredSpherical.theta = nextSph.theta;
                desiredTarget.copy(preset.target);

                desiredRingPos.set(
                    preset.ringPos[0],
                    preset.ringPos[1],
                    preset.ringPos[2]
                );
                ringMat.opacity = station === "ALL" ? 0.45 : 0.9;

                activeFilterMode = station;
                if (customAthleteName) {
                    simParams.trackedHeroName = customAthleteName;
                }
                if (STATION_META[station]) {
                    simParams.trackedStationLabel =
                        STATION_META[station].shortTitle.toUpperCase();
                }
                redrawJumbotronScoreboard();
            };

            threeApiRef.current = {
                focusStation: (station, athleteName) => {
                    applyStationFocus(station, athleteName);
                },
                toggleLighting: () => {
                    nightMode = !nightMode;
                    if (nightMode) {
                        sunLight.intensity = 0.42;
                        sunLight.color.setHex(0x9ab4e8);
                        hemiLight.intensity = 0.36;
                        stadiumFloodLight.intensity = 2.6;
                    } else {
                        sunLight.intensity = 1.3;
                        sunLight.color.setHex(0xfff7eb);
                        hemiLight.intensity = 0.88;
                        stadiumFloodLight.intensity = 0.6;
                    }
                    redrawDynamic3DBrandSign();
                    return nightMode;
                },
                zoomCamera: (delta) => {
                    desiredSpherical.radius = Math.max(
                        8,
                        Math.min(42, desiredSpherical.radius + delta)
                    );
                },
                updateSimulationMetrics: (
                    sprintSec,
                    pullCount,
                    situpCount,
                    vjumpCm,
                    enduranceSec,
                    totalTkji,
                    tkjiCat,
                    bmiVal,
                    studentName
                ) => {
                    simParams.sprintSec = sprintSec;
                    simParams.sprintSpeed = Math.max(
                        0.65,
                        Math.min(1.85, 9.6 / Math.max(6.2, sprintSec))
                    );
                    simParams.pullUpCount = pullCount;
                    simParams.pullUpSpeed = Math.max(
                        1.6,
                        Math.min(5.2, pullCount * 0.18)
                    );
                    simParams.sitUpCount = situpCount;
                    simParams.sitUpSpeed = Math.max(
                        1.8,
                        Math.min(5.5, situpCount * 0.11)
                    );
                    simParams.vjumpCm = vjumpCm;
                    simParams.jumpHeight = Math.max(
                        0.45,
                        Math.min(1.65, vjumpCm / 50)
                    );
                    simParams.enduranceSec = enduranceSec;
                    simParams.enduranceSpeed = Math.max(
                        0.6,
                        Math.min(1.6, 260 / Math.max(150, enduranceSec))
                    );
                    simParams.totalTkji = totalTkji;
                    simParams.tkjiCat = tkjiCat.toUpperCase();
                    simParams.bmiVal = bmiVal;
                    if (studentName && studentName.trim()) {
                        simParams.trackedHeroName = studentName.trim();
                    }
                    // Render ulang layar Jumbotron HANYA saat nilai slider/input berubah!
                    redrawJumbotronScoreboard();
                },
            };

            if (!isDisposed) {
                setIs3DReady(true);
            }

            // -----------------------------------------------------------------
            // AUTO-PAUSE SAAT USER SCROLL KE BAWAH (MENGHEMAT GPU 100%)
            // -----------------------------------------------------------------
            let heroObserver: IntersectionObserver | null = null;
            if (
                typeof IntersectionObserver !== "undefined" &&
                heroSectionRef.current
            ) {
                heroObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            isHeroVisible = entry.isIntersecting;
                        });
                    },
                    { threshold: 0.05 }
                );
                heroObserver.observe(heroSectionRef.current);
            }

            // -----------------------------------------------------------------
            // 60FPS ANIMATION LOOP (MURNI TRANSFORMASI VEKTOR RINGAN)
            // -----------------------------------------------------------------
            const clock = new THREE.Clock();

            const animateLoop = () => {
                if (isDisposed) return;
                animationFrameId = requestAnimationFrame(animateLoop);

                // Jika pengguna sedang berada di bagian bawah halaman, lewati render 3D agar halaman super ringan!
                if (!isHeroVisible) return;

                const rawDelta = clock.getDelta();
                const dt = Math.min(Math.max(rawDelta, 0.001), 0.05);
                const elapsed = clock.getElapsedTime();

                currentSpherical.radius +=
                    (desiredSpherical.radius - currentSpherical.radius) * 0.08;
                currentSpherical.phi +=
                    (desiredSpherical.phi - currentSpherical.phi) * 0.08;
                currentSpherical.theta +=
                    (desiredSpherical.theta - currentSpherical.theta) * 0.08;
                camTarget.lerp(desiredTarget, 0.08);
                updateCameraFromSpherical();

                spotlightRingGroup.position.lerp(desiredRingPos, 0.12);
                const ringScale = 1.0 + Math.sin(elapsed * 4.5) * 0.07;
                spotlightRingGroup.scale.set(ringScale, 1, ringScale);

                const guruWaveScale = 1.0 + ((elapsed * 0.8) % 1.0) * 0.45;
                guruGlowRing.scale.set(guruWaveScale, guruWaveScale, 1);

                // Animasi Karakter Guru PJOK
                {
                    const gu = guruCoachMesh.userData;
                    gu.headGroup.rotation.y = Math.sin(elapsed * 1.4) * 0.45;
                    const cmdWave = (Math.sin(elapsed * 2.2) + 1) * 0.5;
                    gu.rightArm.shoulderPivot.rotation.x =
                        -0.65 - cmdWave * 1.25;
                    gu.rightArm.elbowPivot.rotation.x = -0.45;
                }

                // POS 01: ANIMASI SPRINT LURUS 60 METER
                sprintRunners.forEach((sr, idx) => {
                    sr.progress += sr.speed * simParams.sprintSpeed * dt;
                    if (sr.progress > 1.15) {
                        sr.progress = 0.0;
                    }

                    const u = sr.mesh.userData;
                    if (sr.progress < 0.12) {
                        sr.mesh.position.set(sprintStartX, 0.42, sr.laneZ);
                        sr.mesh.rotation.y = Math.PI / 2;
                        u.pelvisGroup.position.y = 0.48;
                        u.torsoPivot.rotation.x = 0.75;
                        u.leftLeg.hipPivot.rotation.x = -0.9;
                        u.leftLeg.kneePivot.rotation.x = 1.4;
                        u.rightLeg.hipPivot.rotation.x = 0.4;
                        u.rightLeg.kneePivot.rotation.x = 0.8;
                    } else {
                        const runT = Math.min(
                            1.0,
                            (sr.progress - 0.12) / 0.88
                        );
                        const easedT = Math.pow(runT, 0.85);
                        const xPos =
                            sprintStartX +
                            easedT * (sprintEndX + 1.2 - sprintStartX);
                        const phase =
                            elapsed * 18 * simParams.sprintSpeed + idx * 2.1;

                        sr.mesh.position.set(xPos, 0.42, sr.laneZ);
                        sr.mesh.rotation.y = Math.PI / 2;
                        u.pelvisGroup.position.y =
                            0.68 + Math.abs(Math.sin(phase)) * 0.09;
                        applyRunningBiomechanics(sr.mesh, phase, true);
                    }
                });

                // POS 02: ANIMASI PULL-UP & GANTUNG SIKU
                {
                    const u = pullUpAthlete.userData;
                    const pullWave =
                        (Math.sin(elapsed * simParams.pullUpSpeed) + 1) * 0.5;
                    pullUpAthlete.position.y = 0.72 + pullWave * 0.46;

                    const shoulderAngle = -Math.PI + pullWave * 0.95;
                    const elbowAngle = -pullWave * 1.65;
                    u.leftArm.shoulderPivot.rotation.x = shoulderAngle;
                    u.rightArm.shoulderPivot.rotation.x = shoulderAngle;
                    u.leftArm.elbowPivot.rotation.x = elbowAngle;
                    u.rightArm.elbowPivot.rotation.x = elbowAngle;
                    u.leftLeg.kneePivot.rotation.x = 0.65;
                    u.rightLeg.kneePivot.rotation.x = 0.65;
                }

                // POS 03: ANIMASI SIT-UP 60 DETIK
                {
                    const u = sitUpAthlete.userData;
                    const sitWave =
                        (Math.sin(elapsed * simParams.sitUpSpeed) + 1) * 0.5;
                    u.torsoPivot.rotation.x = -1.35 + sitWave * 1.25;
                    u.leftArm.shoulderPivot.rotation.x = -0.9 - sitWave * 0.5;
                    u.rightArm.shoulderPivot.rotation.x = -0.9 - sitWave * 0.5;
                    u.leftArm.elbowPivot.rotation.x = -1.1;
                    u.rightArm.elbowPivot.rotation.x = -1.1;
                }

                // POS 04: ANIMASI VERTICAL JUMP
                {
                    const u = jumpAthlete.userData;
                    const jCycle = (elapsed * 0.85) % 1.0;

                    if (jCycle < 0.35) {
                        const sq = Math.sin((jCycle / 0.35) * Math.PI);
                        jumpAthlete.position.y = 0.15;
                        u.pelvisGroup.position.y = 0.68 - sq * 0.24;
                        u.torsoPivot.rotation.x = sq * 0.45;
                        u.leftLeg.hipPivot.rotation.x = -sq * 0.85;
                        u.leftLeg.kneePivot.rotation.x = sq * 1.45;
                        u.rightLeg.hipPivot.rotation.x = -sq * 0.85;
                        u.rightLeg.kneePivot.rotation.x = sq * 1.45;
                        u.rightArm.shoulderPivot.rotation.x = sq * 0.8;
                        u.leftArm.shoulderPivot.rotation.x = sq * 0.8;
                    } else if (jCycle < 0.78) {
                        const airT = (jCycle - 0.35) / 0.43;
                        const arc = Math.sin(airT * Math.PI);
                        jumpAthlete.position.y =
                            0.15 + arc * simParams.jumpHeight;
                        u.pelvisGroup.position.y = 0.68;
                        u.torsoPivot.rotation.x = 0.0;
                        u.leftLeg.hipPivot.rotation.x = 0.08;
                        u.leftLeg.kneePivot.rotation.x = 0.15;
                        u.rightLeg.hipPivot.rotation.x = 0.08;
                        u.rightLeg.kneePivot.rotation.x = 0.15;
                        u.rightArm.shoulderPivot.rotation.x = -Math.PI * 0.96;
                        u.rightArm.elbowPivot.rotation.x = -0.05;
                        u.leftArm.shoulderPivot.rotation.x = -0.4;
                    } else {
                        const landT = (jCycle - 0.78) / 0.22;
                        const absorb = Math.sin(landT * Math.PI) * 0.5;
                        jumpAthlete.position.y = 0.15;
                        u.pelvisGroup.position.y = 0.68 - absorb * 0.18;
                        u.leftLeg.hipPivot.rotation.x = -absorb * 0.6;
                        u.leftLeg.kneePivot.rotation.x = absorb * 1.1;
                        u.rightLeg.hipPivot.rotation.x = -absorb * 0.6;
                        u.rightLeg.kneePivot.rotation.x = absorb * 1.1;
                        u.rightArm.shoulderPivot.rotation.x = 0.0;
                    }
                }

                // POS 05: ANIMASI LARI DAYA TAHAN 1.200M / 1.000M DI SIRKUIT OVAL
                enduranceRunners.forEach((er, idx) => {
                    er.u =
                        (er.u + er.speed * simParams.enduranceSpeed * dt) %
                        1.0;
                    const pose = getOvalTrackPose(er.u, er.laneOffset);
                    const phase =
                        elapsed * 12 * simParams.enduranceSpeed + idx * 1.7;

                    er.mesh.position.set(pose.x, 0.45, pose.z);
                    er.mesh.rotation.y = pose.rotY;
                    er.mesh.userData.pelvisGroup.position.y =
                        0.68 + Math.abs(Math.sin(phase)) * 0.055;
                    applyRunningBiomechanics(er.mesh, phase, false);
                });

                // FLOATING TAG PROJECTION
                if (floatingTagRef.current) {
                    let targetObj = sprintRunners[0].mesh;
                    if (activeFilterMode === "GURU") targetObj = guruCoachMesh;
                    else if (activeFilterMode === "POS2")
                        targetObj = pullUpAthlete;
                    else if (activeFilterMode === "POS3")
                        targetObj = sitUpAthlete;
                    else if (activeFilterMode === "POS4")
                        targetObj = jumpAthlete;
                    else if (activeFilterMode === "POS5")
                        targetObj = enduranceRunners[0].mesh;

                    const worldPos = new THREE.Vector3();
                    targetObj.getWorldPosition(worldPos);
                    worldPos.y += 1.9;
                    worldPos.project(camera);

                    const halfW = container.clientWidth / 2;
                    const halfH = container.clientHeight / 2;
                    const screenX = worldPos.x * halfW + halfW;
                    const screenY = -(worldPos.y * halfH) + halfH;

                    if (
                        !Number.isNaN(screenX) &&
                        !Number.isNaN(screenY) &&
                        worldPos.z < 1.0 &&
                        screenX > 70 &&
                        screenX < container.clientWidth - 70 &&
                        screenY > 60 &&
                        screenY < container.clientHeight - 60
                    ) {
                        floatingTagRef.current.style.transform = `translate3d(${Math.round(
                            screenX - 85
                        )}px, ${Math.round(screenY - 24)}px, 0)`;
                        floatingTagRef.current.style.opacity = "1";
                        if (floatingTagNameRef.current) {
                            floatingTagNameRef.current.textContent =
                                activeFilterMode === "GURU"
                                    ? "Guru PJOK"
                                    : simParams.trackedHeroName;
                        }
                        if (floatingTagPosRef.current) {
                            floatingTagPosRef.current.textContent =
                                simParams.trackedStationLabel;
                        }
                    } else {
                        floatingTagRef.current.style.opacity = "0";
                    }
                }

                renderer.render(scene, camera);
            };

            animateLoop();

            const handleResize = () => {
                if (!container || isDisposed) return;
                const w = Math.max(320, container.clientWidth);
                const h = Math.max(560, container.clientHeight);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            };

            window.addEventListener("resize", handleResize);

            let resizeObs: ResizeObserver | null = null;
            if (typeof ResizeObserver !== "undefined") {
                resizeObs = new ResizeObserver(() => handleResize());
                resizeObs.observe(container);
            }

            cleanupEvents = () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerup", onPointerUp);
                domElem.removeEventListener("pointerdown", onPointerDown);
                domElem.removeEventListener(
                    "webglcontextlost",
                    handleContextLost
                );
                if (resizeObs) resizeObs.disconnect();
                if (heroObserver) heroObserver.disconnect();
                renderer.dispose();
            };
        }

        bootThreeArena();

        return () => {
            isDisposed = true;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (cleanupEvents) cleanupEvents();
        };
    }, []);

    // =========================================================================
    // HANDLER INTERAKSI PENGGUNA
    // =========================================================================
    const handleSelectStation = (
        stationKey: StationFilterKey,
        customName?: string
    ) => {
        setActiveStation(stationKey);
        const athleteName =
            customName?.trim() || heroStudentName.trim() || "Andi Pratama";
        threeApiRef.current?.focusStation(stationKey, athleteName);
    };

    const handleToggleLighting = () => {
        if (!threeApiRef.current) return;
        const night = threeApiRef.current.toggleLighting();
        setIsNightStudio(night);
        triggerToast(
            night
                ? "Mode Malam Stadion Aktif"
                : "Mode Siang Stadion Aktif",
            night
                ? "Pencahayaan malam stadion & papan EduFit. putih bertitik biru menyala."
                : "Pencahayaan siang studio & papan EduFit. hitam bertitik biru aktif."
        );
    };

    const handleQuickHeroSimulate = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = heroStudentName.trim() || "Andi Pratama";
        const target = activeStation === "ALL" ? "POS1" : activeStation;
        handleSelectStation(target, cleanName);

        triggerToast(
            `Kamera 3D Mengunci ${cleanName}`,
            `Menyorot simulasi ${STATION_META[target].fullTitle}.`
        );
    };

    const applyAthletePreset = (
        presetKey: "pemula" | "ideal" | "unggul",
        gender: "L" | "P",
        w: number,
        h: number,
        sprint: number,
        pullHang: number,
        situp: number,
        vjump: number,
        enduranceSec: number
    ) => {
        setActivePreset(presetKey);
        setSimGender(gender);
        setSimWeight(w);
        setSimHeight(h);
        setSimSprint60(sprint);
        setSimPullHang(pullHang);
        setSimSitUp(situp);
        setSimVertJump(vjump);
        setSimEnduranceSec(enduranceSec);
    };

    const schoolSimMetrics = useMemo(() => {
        const rombelCount = Math.max(1, Math.ceil(studentVolume / 36));
        const totalSessionsGenerated = studentVolume * 24;
        const totalTkjiRecords = studentVolume * 5;
        return { rombelCount, totalSessionsGenerated, totalTkjiRecords };
    }, [studentVolume]);

    const activeCurriculum = CURRICULUM_DATA[selectedCurrGrade];
    const activeUnitObj =
        activeCurriculum.units[selectedUnitIdx] || activeCurriculum.units[0];
    const activeRoleObj = ROLE_SHOWCASE[activeRoleKey];

    return (
        <div className="min-h-screen bg-[#F4F1EA] text-[#121C18] font-jakarta selection:bg-[#0EA5E9] selection:text-white overflow-x-hidden">
            <style dangerouslySetInnerHTML={{ __html: CUSTOM_CSS }} />

            {/* ============================================================= */}
            {/* FLOATING NAVBAR (ADAPTIF SIANG/MALAM + LOGO 3X + TITIK BIRU)  */}
            {/* ============================================================= */}
            <header
                className={`fixed inset-x-0 z-50 transition-all duration-300 pointer-events-none ${
                    isScrolled
                        ? "top-3 sm:top-5 px-3 sm:px-8 lg:px-12"
                        : "top-0 px-4 sm:px-10 lg:px-16 pt-3 sm:pt-5"
                }`}
            >
                <nav
                    className={`mx-auto flex items-center justify-between pointer-events-auto transition-all duration-300 ${
                        isScrolled
                            ? "max-w-[1280px] rounded-full bg-white/95 backdrop-blur-xl edufit-pill-shadow border border-black/[0.07] px-5 sm:px-8 py-2.5"
                            : "max-w-[1440px] rounded-none bg-transparent border-transparent shadow-none px-2 sm:px-4 py-2"
                    }`}
                >
                    <a
                        href="#beranda"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToSection("beranda");
                            handleSelectStation("ALL");
                        }}
                        className="flex items-center focus:outline-none group shrink-0"
                    >
                        {!logoError ? (
                            <img
                                src={
                                    isNightStudio && !isScrolled
                                        ? "/images/logo-putih.png"
                                        : "/images/logo-hitam.png"
                                }
                                alt="EduFit"
                                onError={() => setLogoError(true)}
                                className={`w-auto object-contain transition-all duration-300 group-hover:scale-[1.03] ${
                                    isScrolled
                                        ? "h-14 sm:h-16 md:h-20"
                                        : "h-20 sm:h-24 md:h-28 lg:h-32"
                                }`}
                            />
                        ) : (
                            <span
                                className={`font-extrabold tracking-[-0.04em] leading-none transition-all duration-300 ${
                                    isNightStudio && !isScrolled
                                        ? "text-white"
                                        : "text-[#111111]"
                                } ${
                                    isScrolled
                                        ? "text-3xl sm:text-4xl"
                                        : "text-4xl sm:text-5xl lg:text-6xl"
                                }`}
                            >
                                EduFit
                                <span className="text-[#0EA5E9]">.</span>
                            </span>
                        )}
                    </a>

                    <div
                        className={`hidden xl:flex items-center gap-8 text-[14px] font-bold transition-colors ${
                            isNightStudio && !isScrolled
                                ? "text-white/90"
                                : "text-[#121C18]"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => scrollToSection("simulasi")}
                            className="hover:underline decoration-[#0EA5E9] decoration-2 underline-offset-8 transition-all py-1 cursor-pointer"
                        >
                            Simulasi &amp; Radar TKJI
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("kurikulum")}
                            className="hover:underline decoration-[#0EA5E9] decoration-2 underline-offset-8 transition-all py-1 cursor-pointer"
                        >
                            Peta Kurikulum X–XII
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("ekosistem")}
                            className="hover:underline decoration-[#0EA5E9] decoration-2 underline-offset-8 transition-all py-1 cursor-pointer"
                        >
                            Platform 3 Role
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("download")}
                            className="hover:underline decoration-[#0EA5E9] decoration-2 underline-offset-8 transition-all py-1 cursor-pointer"
                        >
                            Unduh APK
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                        <a
                            href="/app-release.apk"
                            download="EduFit-Mobile.apk"
                            className="bg-white/95 hover:bg-[#F5C84C] text-[#0B3124] border border-black/10 rounded-full px-5 py-3 text-[13px] font-extrabold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                            <SvgDownload className="w-4 h-4 text-[#0B3124]" />
                            <span>Unduh APK</span>
                        </a>
                        <Link
                            href="/login"
                            className="bg-[#0B3124] hover:bg-[#07241A] text-white rounded-full px-6 py-3 text-[13px] font-extrabold flex items-center gap-2 transition-all active:scale-95 group shadow-md border border-white/10"
                        >
                            <span>Masuk Portal</span>
                            <SvgArrowUpRight className="w-4 h-4 text-[#F5C84C] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="sm:hidden w-11 h-11 rounded-full bg-white/90 border border-black/10 flex items-center justify-center text-[#0B3124] shadow-sm"
                        aria-label="Menu Navigasi"
                    >
                        {mobileMenuOpen ? (
                            <SvgX className="w-5 h-5" />
                        ) : (
                            <SvgMenu className="w-5 h-5" />
                        )}
                    </button>
                </nav>

                {mobileMenuOpen && (
                    <div className="sm:hidden mt-2 rounded-3xl bg-white/95 backdrop-blur-xl p-5 border border-black/10 shadow-2xl pointer-events-auto space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => scrollToSection("simulasi")}
                                className="p-3 rounded-2xl bg-[#F4F1EA] text-left text-[#121C18]"
                            >
                                Simulasi &amp; Radar
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("kurikulum")}
                                className="p-3 rounded-2xl bg-[#F4F1EA] text-left text-[#121C18]"
                            >
                                Kurikulum X–XII
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("ekosistem")}
                                className="p-3 rounded-2xl bg-[#F4F1EA] text-left text-[#121C18]"
                            >
                                Sistem 3 Role
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("download")}
                                className="p-3 rounded-2xl bg-[#F4F1EA] text-left text-[#121C18]"
                            >
                                Unduh APK
                            </button>
                        </div>
                        <div className="pt-2 border-t border-black/10 flex flex-col xs:flex-row gap-2">
                            <a
                                href="/app-release.apk"
                                download="EduFit-Mobile.apk"
                                className="flex-1 py-3.5 rounded-2xl bg-[#F5C84C] text-[#07241A] font-extrabold text-xs text-center flex items-center justify-center gap-1.5"
                            >
                                <SvgDownload className="w-4 h-4" /> Unduh APK
                            </a>
                            <Link
                                href="/login"
                                className="flex-1 py-3.5 rounded-2xl bg-[#0B3124] text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5"
                            >
                                Masuk Portal{" "}
                                <SvgArrowUpRight className="w-4 h-4 text-[#F5C84C]" />
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ============================================================= */}
            {/* HERO SECTION: MINIMALIS, KONTRAS SEMPURNA & STADION 3D DI KANAN */}
            {/* ============================================================= */}
            <section
                ref={heroSectionRef}
                id="beranda"
                className={`relative w-full min-h-screen h-auto overflow-hidden flex flex-col justify-between pt-32 sm:pt-36 lg:pt-40 pb-6 sm:pb-8 transition-colors duration-500 ${
                    isNightStudio
                        ? "edufit-hero-night-bg text-white"
                        : "edufit-hero-day-bg text-[#121C18]"
                }`}
            >
                {/* 3D Canvas Container */}
                <div
                    ref={canvasContainerRef}
                    className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing touch-pan-y"
                    title="Geser horizontal untuk memutar Stadion 5 Pos TKJI 3D"
                />

                {/* Lapisan Scrim Kiri Halus agar Tipografi Kiri Tidak Pernah Tabrakan dengan Objek 3D */}
                <div
                    className={`pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[58%] z-10 transition-opacity duration-500 ${
                        inspect3DOnly
                            ? "opacity-0"
                            : isNightStudio
                            ? "edufit-left-scrim-night"
                            : "edufit-left-scrim-day"
                    }`}
                />

                {!is3DReady && (
                    <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center gap-3 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-black/10 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] animate-ping" />
                        <span className="text-xs font-poppins font-bold text-[#0B3124]">
                            Menyiapkan Stadion 3D EduFit...
                        </span>
                    </div>
                )}

                {/* Dynamic 3D Floating Tag */}
                <div
                    ref={floatingTagRef}
                    className="pointer-events-none absolute z-20 hidden sm:flex items-center gap-2 bg-[#07241A]/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-white/15 shadow-lg text-[11px] font-montserrat font-bold transition-opacity duration-200"
                    style={{ opacity: 0 }}
                >
                    <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                    <span ref={floatingTagNameRef}>Andi Pratama</span>
                    <span className="text-white/40">|</span>
                    <span
                        ref={floatingTagPosRef}
                        className="text-[#F5C84C] font-extrabold"
                    >
                        STADION UTUH
                    </span>
                </div>

                {/* HERO CONTENT OVERLAY GRID (MINIMALIS & LEGA) */}
                <div
                    className={`relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12 my-auto pointer-events-none transition-all duration-500 ${
                        inspect3DOnly
                            ? "opacity-0 -translate-x-10 pointer-events-none"
                            : "opacity-100 translate-x-0"
                    }`}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        <div
                            className={`lg:col-span-5 ${
                                inspect3DOnly
                                    ? "pointer-events-none"
                                    : "pointer-events-auto"
                            }`}
                        >
                            <h1
                                className={`text-[36px] xs:text-[42px] sm:text-[54px] xl:text-[62px] font-extrabold tracking-[-0.035em] leading-[1.03] mb-4 ${
                                    isNightStudio
                                        ? "text-white"
                                        : "text-[#121C18]"
                                }`}
                            >
                                Ukur Fisik.
                                <br />
                                Rancang FITT.
                                <br />
                                <span
                                    className={`underline decoration-[#0EA5E9] decoration-4 underline-offset-8 ${
                                        isNightStudio
                                            ? "text-[#F5C84C]"
                                            : "text-[#0B3124]"
                                    }`}
                                >
                                    Capai Puncak.
                                </span>
                            </h1>

                            <p
                                className={`text-[14px] sm:text-[15px] font-medium leading-[1.6] max-w-[400px] mb-6 ${
                                    isNightStudio
                                        ? "text-white/80"
                                        : "text-[#414B47]"
                                }`}
                            >
                                Evaluasi 5 Pos TKJI, kalkulasi IMT, modul
                                interaktif, dan 4.800+ matriks latihan 8 minggu
                                untuk Siswa, Guru PJOK, dan Sekolah.
                            </p>

                            {/* Bar Interaktif Simulasi Atlet & Filter Pos 3D */}
                            <form
                                onSubmit={handleQuickHeroSimulate}
                                className="relative max-w-[480px] mb-5"
                            >
                                <div className="rounded-3xl sm:rounded-full bg-white edufit-dispatch-shadow p-1.5 sm:pl-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-0 border border-black/[0.08]">
                                    <div className="flex items-center flex-1 min-w-0 px-2 sm:px-0">
                                        <div className="flex-shrink-0 mr-2 text-[#0EA5E9]">
                                            <SvgActivity className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={heroStudentName}
                                            onChange={(e) =>
                                                setHeroStudentName(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ketik nama atlet..."
                                            required
                                            className="w-full bg-transparent text-[13px] font-bold text-[#121C18] placeholder-[#6E7A75] focus:outline-none truncate py-1.5 sm:py-0"
                                        />
                                    </div>

                                    <div className="hidden sm:block h-6 w-[1px] bg-black/10 mx-2.5 flex-shrink-0" />

                                    <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-1 min-w-0 px-2 sm:px-0 sm:pr-1 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-black/10">
                                        <select
                                            value={activeStation}
                                            onChange={(e) =>
                                                handleSelectStation(
                                                    e.target
                                                        .value as StationFilterKey
                                                )
                                            }
                                            className="w-full bg-transparent text-[12px] font-extrabold text-[#0B3124] focus:outline-none cursor-pointer truncate"
                                        >
                                            <option value="ALL">
                                                Stadion Utuh (5 Pos)
                                            </option>
                                            <option value="GURU">
                                                Layar Skor &amp; Guru
                                            </option>
                                            <option value="POS1">
                                                Pos 1: Sprint 60m
                                            </option>
                                            <option value="POS2">
                                                Pos 2: Pull-Up &amp; Siku
                                            </option>
                                            <option value="POS3">
                                                Pos 3: Sit-Up 60s
                                            </option>
                                            <option value="POS4">
                                                Pos 4: Vertical Jump
                                            </option>
                                            <option value="POS5">
                                                Pos 5: Oval 1.200m
                                            </option>
                                        </select>

                                        <button
                                            type="submit"
                                            title="Sorot Pos di Stadion 3D"
                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B3124] hover:bg-[#07241A] text-[#F5C84C] flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer"
                                        >
                                            <SvgArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Baris Tombol Utama */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <a
                                    href="/app-release.apk"
                                    download="EduFit-Mobile.apk"
                                    className="px-5 py-3 rounded-full bg-[#F5C84C] hover:bg-[#e5b53c] text-[#07241A] text-[11px] font-poppins font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                                >
                                    <SvgSmartphone className="w-4 h-4 shrink-0" />
                                    <span>Unduh EduFit Mobile (APK)</span>
                                </a>
                                <Link
                                    href="/login"
                                    className="px-5 py-3 rounded-full bg-white hover:bg-[#0B3124] text-[#121C18] hover:text-white border border-black/10 text-[11px] font-poppins font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <span>Portal Guru &amp; Admin</span>
                                    <SvgArrowUpRight className="w-4 h-4 shrink-0" />
                                </Link>
                            </div>
                        </div>

                        {/* Area Kanan (7 Kolom) Dibiarkan Terbuka Penuh untuk Panggung Stadion 3D */}
                        <div className="lg:col-span-7 h-[280px] sm:h-[360px] lg:h-[500px] pointer-events-none" />
                    </div>
                </div>

                {/* ========================================================= */}
                {/* SATU DOCK KONTROL 3D MINIMALIS DI TENGAH BAWAH            */}
                {/* ========================================================= */}
                <div className="relative z-30 max-w-[1380px] w-full mx-auto px-3.5 sm:px-8 lg:px-12 mt-4 pointer-events-none flex justify-center lg:justify-end">
                    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 bg-white/95 backdrop-blur-md border border-black/[0.08] rounded-full px-2.5 py-1.5 edufit-pill-shadow text-[#121C18]">
                        {(
                            [
                                "ALL",
                                "GURU",
                                "POS1",
                                "POS2",
                                "POS3",
                                "POS4",
                                "POS5",
                            ] as StationFilterKey[]
                        ).map((key) => {
                            const active = activeStation === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleSelectStation(key)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-poppins font-bold transition-all cursor-pointer ${
                                        active
                                            ? "bg-[#0B3124] text-[#F5C84C] shadow-sm"
                                            : "text-[#6E7A75] hover:text-[#121C18]"
                                    }`}
                                >
                                    {STATION_META[key].shortTitle}
                                </button>
                            );
                        })}

                        <div className="h-4 w-[1px] bg-black/10 mx-1" />

                        <button
                            type="button"
                            onClick={() => setInspect3DOnly(!inspect3DOnly)}
                            title="Sembunyikan Teks untuk Eksplorasi Penuh Stadion 3D"
                            className={`px-3 py-1.5 rounded-full text-[11px] font-poppins font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                inspect3DOnly
                                    ? "bg-[#0EA5E9] text-white"
                                    : "bg-[#F4F1EA] text-[#0B3124] hover:bg-[#DFD7C8]"
                            }`}
                        >
                            <SvgEye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                                {inspect3DOnly ? "Tampilkan Teks" : "Fokus 3D"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                threeApiRef.current?.zoomCamera(-3.0)
                            }
                            title="Perbesar Kamera 3D"
                            className="p-1.5 rounded-full bg-[#F4F1EA] hover:bg-[#0B3124] hover:text-white text-[#121C18] transition-colors cursor-pointer"
                        >
                            <SvgZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => threeApiRef.current?.zoomCamera(3.0)}
                            title="Perkecil Kamera 3D"
                            className="p-1.5 rounded-full bg-[#F4F1EA] hover:bg-[#0B3124] hover:text-white text-[#121C18] transition-colors cursor-pointer"
                        >
                            <SvgZoomOut className="w-3.5 h-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={handleToggleLighting}
                            title="Ubah Mode Siang / Malam"
                            className="bg-[#F4F1EA] hover:bg-[#DFD7C8] text-[#0B3124] px-3 py-1.5 rounded-full text-[11px] font-poppins font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                            {isNightStudio ? (
                                <>
                                    <SvgMoon className="w-3.5 h-3.5 text-[#0EA5E9]" />
                                    <span className="hidden md:inline">
                                        Malam
                                    </span>
                                </>
                            ) : (
                                <>
                                    <SvgSun className="w-3.5 h-3.5 text-[#D99B26]" />
                                    <span className="hidden md:inline">
                                        Siang
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* ============================================================= */}
            {/* SECTION SIMULASI BIOMETRIK 5 POS + LIVE RADAR PENTAGON        */}
            {/* ============================================================= */}
            <section
                id="simulasi"
                className="py-20 sm:py-28 border-t border-black/[0.08] bg-[#F4F1EA]"
            >
                <div className="max-w-[1380px] mx-auto px-3.5 sm:px-8 lg:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-7 border-b border-black/[0.08] gap-4">
                        <h2 className="text-[28px] sm:text-[40px] font-extrabold tracking-[-0.03em] text-[#121C18] leading-[1.1]">
                            Laboratorium Simulasi 5 Pos TKJI &amp; Radar
                            Biometrik.
                        </h2>

                        {/* 3 Tombol Preset dengan State Aktif yang Berpindah Secara Akurat */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    applyAthletePreset(
                                        "pemula",
                                        "L",
                                        54,
                                        167,
                                        9.4,
                                        7,
                                        22,
                                        51,
                                        305
                                    )
                                }
                                className={`text-xs font-poppins font-extrabold px-4 py-2.5 rounded-full border transition-all cursor-pointer ${
                                    activePreset === "pemula"
                                        ? "bg-[#0B3124] text-[#F5C84C] border-[#0B3124] shadow-sm"
                                        : "bg-white text-[#525A56] border-black/10 hover:text-[#121C18]"
                                }`}
                            >
                                Preset Pemula
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    applyAthletePreset(
                                        "ideal",
                                        "L",
                                        62,
                                        170,
                                        7.5,
                                        16,
                                        36,
                                        66,
                                        225
                                    )
                                }
                                className={`text-xs font-poppins font-extrabold px-4 py-2.5 rounded-full border transition-all cursor-pointer ${
                                    activePreset === "ideal"
                                        ? "bg-[#0B3124] text-[#F5C84C] border-[#0B3124] shadow-sm"
                                        : "bg-white text-[#525A56] border-black/10 hover:text-[#121C18]"
                                }`}
                            >
                                Preset Putra Ideal
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    applyAthletePreset(
                                        "unggul",
                                        "P",
                                        51,
                                        160,
                                        8.1,
                                        38,
                                        30,
                                        53,
                                        240
                                    )
                                }
                                className={`text-xs font-poppins font-extrabold px-4 py-2.5 rounded-full border transition-all cursor-pointer ${
                                    activePreset === "unggul"
                                        ? "bg-[#0B3124] text-[#F5C84C] border-[#0B3124] shadow-sm"
                                        : "bg-white text-[#525A56] border-black/10 hover:text-[#121C18]"
                                }`}
                            >
                                Preset Putri Unggul
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Kolom Kiri (7 Kolom): Workbench Sliders */}
                        <div className="lg:col-span-7 bg-white rounded-[2.2rem] border border-black/[0.08] p-5 sm:p-9 edufit-pill-shadow flex flex-col justify-between space-y-6">
                            {/* Baris Gender & Antropometri IMT */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pb-5 border-b border-black/[0.07]">
                                <div className="sm:col-span-4 flex gap-1.5 p-1.5 rounded-2xl bg-[#F4F1EA]">
                                    {(["L", "P"] as const).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => {
                                                setSimGender(g);
                                                setActivePreset("kustom");
                                            }}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-poppins font-extrabold transition-all cursor-pointer ${
                                                simGender === g
                                                    ? "bg-[#0B3124] text-[#F5C84C]"
                                                    : "text-[#6E7A75]"
                                            }`}
                                        >
                                            {g === "L" ? "Putra (L)" : "Putri (P)"}
                                        </button>
                                    ))}
                                </div>

                                <div className="sm:col-span-4 bg-[#F7F5F0] px-4 py-3 rounded-2xl">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-bold text-[#525A56]">
                                            Berat
                                        </span>
                                        <span className="font-montserrat font-extrabold text-[#0B3124]">
                                            {simWeight} kg
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={35}
                                        max={105}
                                        value={simWeight}
                                        onChange={(e) => {
                                            setSimWeight(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>

                                <div className="sm:col-span-4 bg-[#F7F5F0] px-4 py-3 rounded-2xl">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-bold text-[#525A56]">
                                            Tinggi
                                        </span>
                                        <span className="font-montserrat font-extrabold text-[#0B3124]">
                                            {simHeight} cm
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={140}
                                        max={195}
                                        value={simHeight}
                                        onChange={(e) => {
                                            setSimHeight(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>
                            </div>

                            {/* Grid 5 Pos Ujian TKJI */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Pos 1: Sprint 60m */}
                                <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-black/[0.05] space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                scrollToSection("beranda");
                                                handleSelectStation("POS1");
                                            }}
                                            className="text-xs font-extrabold text-[#121C18] hover:text-[#E87A3E] flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-[#E87A3E]" />
                                            <span>Pos 1 • Sprint 60m</span>
                                        </button>
                                        <span className="font-montserrat text-xs font-extrabold px-2 py-0.5 rounded bg-[#E87A3E]/15 text-[#E87A3E]">
                                            {simSprint60.toFixed(1)}s • Skor{" "}
                                            {simResult.s1}/5
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={6.5}
                                        max={13.5}
                                        step={0.1}
                                        value={simSprint60}
                                        onChange={(e) => {
                                            setSimSprint60(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>

                                {/* Pos 2: Pull-Up / Gantung Siku */}
                                <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-black/[0.05] space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                scrollToSection("beranda");
                                                handleSelectStation("POS2");
                                            }}
                                            className="text-xs font-extrabold text-[#121C18] hover:text-[#2563EB] flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                                            <span>
                                                {simGender === "L"
                                                    ? "Pos 2 • Pull-Up"
                                                    : "Pos 2 • Gantung Siku"}
                                            </span>
                                        </button>
                                        <span className="font-montserrat text-xs font-extrabold px-2 py-0.5 rounded bg-[#2563EB]/15 text-[#2563EB]">
                                            {simPullHang}
                                            {simGender === "L"
                                                ? " rep"
                                                : "s"}{" "}
                                            • Skor {simResult.s2}/5
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={simGender === "L" ? 25 : 60}
                                        value={simPullHang}
                                        onChange={(e) => {
                                            setSimPullHang(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>

                                {/* Pos 3: Sit-Up 60s */}
                                <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-black/[0.05] space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                scrollToSection("beranda");
                                                handleSelectStation("POS3");
                                            }}
                                            className="text-xs font-extrabold text-[#121C18] hover:text-[#10B981] flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                                            <span>Pos 3 • Sit-Up 60s</span>
                                        </button>
                                        <span className="font-montserrat text-xs font-extrabold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981]">
                                            {simSitUp} rep • Skor {simResult.s3}
                                            /5
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={5}
                                        max={50}
                                        value={simSitUp}
                                        onChange={(e) => {
                                            setSimSitUp(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>

                                {/* Pos 4: Vertical Jump */}
                                <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-black/[0.05] space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                scrollToSection("beranda");
                                                handleSelectStation("POS4");
                                            }}
                                            className="text-xs font-extrabold text-[#121C18] hover:text-[#7C3AED] flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                                            <span>Pos 4 • Vertical Jump</span>
                                        </button>
                                        <span className="font-montserrat text-xs font-extrabold px-2 py-0.5 rounded bg-[#7C3AED]/15 text-[#7C3AED]">
                                            {simVertJump} cm • Skor{" "}
                                            {simResult.s4}/5
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={20}
                                        max={85}
                                        value={simVertJump}
                                        onChange={(e) => {
                                            setSimVertJump(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>

                                {/* Pos 5: Lari Oval 1200m / 1000m */}
                                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F7F5F0] border border-black/[0.05] space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                scrollToSection("beranda");
                                                handleSelectStation("POS5");
                                            }}
                                            className="text-xs font-extrabold text-[#121C18] hover:text-[#0D9488] flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                                            <span>
                                                {simGender === "L"
                                                    ? "Pos 5 • Sirkuit Oval Lari 1.200 Meter (Putra)"
                                                    : "Pos 5 • Sirkuit Oval Lari 1.000 Meter (Putri)"}
                                            </span>
                                        </button>
                                        <span className="font-montserrat text-xs font-extrabold px-2.5 py-0.5 rounded bg-[#0D9488]/15 text-[#0D9488]">
                                            {formatEnduranceTime(
                                                simEnduranceSec
                                            )}{" "}
                                            mnt • Skor {simResult.s5}/5
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={160}
                                        max={480}
                                        step={5}
                                        value={simEnduranceSec}
                                        onChange={(e) => {
                                            setSimEnduranceSec(
                                                Number(e.target.value)
                                            );
                                            setActivePreset("kustom");
                                        }}
                                        className="w-full edufit-slider"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan (5 Kolom): Live Pentagonal Radar Chart & Kirim ke Layar 3D */}
                        <div className="lg:col-span-5 bg-[#07241A] text-white rounded-[2.2rem] p-6 sm:p-9 flex flex-col justify-between shadow-xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div>
                                    <span className="font-poppins text-[11px] font-bold uppercase tracking-wider text-[#0EA5E9] block">
                                        VISUALISASI RADAR 5 POS
                                    </span>
                                    <h3 className="text-xl font-extrabold">
                                        Predikat: {simResult.tkjiCategory}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="font-montserrat text-3xl sm:text-4xl font-extrabold text-[#F5C84C] leading-none">
                                        {simResult.totalTkji}/25
                                    </span>
                                    <span className="block text-[11px] text-white/60 mt-1">
                                        IMT: {simResult.bmi} (
                                        {simResult.bmiCategory})
                                    </span>
                                </div>
                            </div>

                            {/* Live SVG Spider Radar Chart */}
                            <div className="my-4 flex items-center justify-center">
                                <svg
                                    viewBox="0 0 220 220"
                                    className="w-56 h-56 sm:w-64 sm:h-64 overflow-visible"
                                >
                                    {[1, 2, 3, 4, 5].map((lv) => {
                                        const r = (lv / 5) * 74;
                                        const pts = [0, 1, 2, 3, 4]
                                            .map((i) => {
                                                const a =
                                                    (2 * Math.PI * i) / 5 -
                                                    Math.PI / 2;
                                                return `${(
                                                    110 +
                                                    r * Math.cos(a)
                                                ).toFixed(1)},${(
                                                    110 +
                                                    r * Math.sin(a)
                                                ).toFixed(1)}`;
                                            })
                                            .join(" ");
                                        return (
                                            <polygon
                                                key={lv}
                                                points={pts}
                                                fill="none"
                                                stroke="rgba(255,255,255,0.12)"
                                                strokeWidth="1"
                                            />
                                        );
                                    })}

                                    <polygon
                                        points={radarPolygonPoints}
                                        fill="rgba(14, 165, 233, 0.28)"
                                        stroke="#F5C84C"
                                        strokeWidth="2.8"
                                        strokeLinejoin="round"
                                    />

                                    {[
                                        `Sprint (${simResult.s1})`,
                                        `Gantung (${simResult.s2})`,
                                        `Sit-Up (${simResult.s3})`,
                                        `Loncat (${simResult.s4})`,
                                        `1200m (${simResult.s5})`,
                                    ].map((lbl, i) => {
                                        const a =
                                            (2 * Math.PI * i) / 5 - Math.PI / 2;
                                        const lx = 110 + 96 * Math.cos(a);
                                        const ly = 110 + 96 * Math.sin(a);
                                        return (
                                            <text
                                                key={lbl}
                                                x={lx}
                                                y={ly}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fill="#FFFFFF"
                                                fontSize="9.5"
                                                fontWeight="700"
                                                className="font-montserrat"
                                            >
                                                {lbl}
                                            </text>
                                        );
                                    })}
                                </svg>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-white/10">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-white/60">
                                        Resep Algoritma FITT:
                                    </span>
                                    <span className="font-bold text-[#10B981]">
                                        {simResult.methodTitle}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        scrollToSection("beranda");
                                        handleSelectStation(
                                            "GURU",
                                            heroStudentName
                                        );
                                        triggerToast(
                                            `Skor ${simResult.totalTkji}/25 (${simResult.tkjiCategory}) Tampil di Layar 3D!`,
                                            `Kamera 3D menyorot Papan Skor Utama di atas gedung stadion beserta kecepatan baru atlet.`
                                        );
                                    }}
                                    className="w-full rounded-full bg-[#F5C84C] hover:bg-white text-[#07241A] py-3.5 px-5 font-poppins font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                                >
                                    <span>
                                        Kirim Skor ke Layar Stadion 3D
                                    </span>
                                    <SvgArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================= */}
            {/* SECTION PETA KURIKULUM INTERAKTIF KELAS X, XI, DAN XII        */}
            {/* ============================================================= */}
            <section
                id="kurikulum"
                className="py-20 sm:py-28 border-t border-black/[0.08] bg-white"
            >
                <div className="max-w-[1380px] mx-auto px-3.5 sm:px-8 lg:px-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 pb-7 border-b border-black/[0.08] gap-6">
                        <div>
                            <h2 className="text-[28px] sm:text-[40px] font-extrabold tracking-[-0.03em] text-[#121C18] leading-[1.1]">
                                Peta Kurikulum Interaktif Kelas X, XI &amp; XII.
                            </h2>
                        </div>

                        <div className="flex p-1.5 rounded-full bg-[#F4F1EA] border border-black/[0.07] self-start lg:self-auto">
                            {(
                                [
                                    { g: 10, label: "Kelas X (Fase E)" },
                                    { g: 11, label: "Kelas XI (Fase F)" },
                                    { g: 12, label: "Kelas XII (Fase F)" },
                                ] as const
                            ).map((tab) => {
                                const active = selectedCurrGrade === tab.g;
                                return (
                                    <button
                                        key={tab.g}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCurrGrade(tab.g);
                                            setSelectedUnitIdx(0);
                                        }}
                                        className={`px-4 sm:px-6 py-2.5 rounded-full text-xs font-poppins font-extrabold transition-all cursor-pointer ${
                                            active
                                                ? "bg-[#0B3124] text-[#F5C84C] shadow-sm"
                                                : "text-[#525A56] hover:text-[#121C18]"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
                            {activeCurriculum.units.map((u, idx) => {
                                const active = selectedUnitIdx === idx;
                                return (
                                    <button
                                        key={u.num}
                                        type="button"
                                        onClick={() => setSelectedUnitIdx(idx)}
                                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                            active
                                                ? "bg-[#0B3124] text-white border-[#0B3124] shadow-md"
                                                : "bg-[#F7F5F0] text-[#121C18] border-black/[0.05] hover:bg-[#EDEAE2]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <span
                                                className={`w-9 h-9 rounded-xl font-montserrat font-extrabold text-xs flex items-center justify-center shrink-0 ${
                                                    active
                                                        ? "bg-[#F5C84C] text-[#07241A]"
                                                        : "bg-white text-[#0B3124]"
                                                }`}
                                            >
                                                {u.num}
                                            </span>
                                            <span className="font-bold text-sm truncate">
                                                {u.title}
                                            </span>
                                        </div>
                                        <SvgArrowRight
                                            className={`w-4 h-4 shrink-0 ${
                                                active
                                                    ? "text-[#F5C84C]"
                                                    : "text-[#6E7A75]"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="lg:col-span-7 bg-[#F7F5F0] rounded-[2.2rem] border border-black/[0.08] p-6 sm:p-10 flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-6 border-b border-black/[0.08]">
                                    <span className="font-poppins text-xs font-extrabold uppercase tracking-wider text-[#0B3124]">
                                        UNIT {activeUnitObj.num} • KELAS{" "}
                                        {selectedCurrGrade} (
                                        {activeCurriculum.fase})
                                    </span>
                                    <span className="px-3.5 py-1 rounded-full bg-[#0B3124] text-[#F5C84C] font-montserrat text-xs font-extrabold">
                                        {activeUnitObj.keyMetric}
                                    </span>
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#121C18] mt-6 mb-4 leading-tight">
                                    {activeUnitObj.title}
                                </h3>

                                <p className="text-sm sm:text-base text-[#525A56] leading-relaxed mb-6">
                                    {activeUnitObj.summary}
                                </p>

                                <div className="p-5 rounded-2xl bg-white border border-black/[0.06]">
                                    <span className="font-poppins text-[11px] font-extrabold uppercase tracking-wider text-[#0B3124] block mb-1">
                                        Target Capaian Siswa:
                                    </span>
                                    <p className="text-sm font-bold text-[#121C18]">
                                        {activeUnitObj.target}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-black/[0.08]">
                                <span className="font-poppins text-[11px] font-extrabold uppercase tracking-wider text-[#6E7A75] block mb-3">
                                    Alur Pembelajaran Berurutan Kelas XII (Klik
                                    Tahap):
                                </span>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                                    {[
                                        { n: 1, l: "Pre-Test" },
                                        { n: 2, l: "5 Pos TKJI" },
                                        { n: 3, l: "IMT & Awal" },
                                        { n: 4, l: "3 Sesi FITT" },
                                        { n: 5, l: "6 Materi" },
                                        { n: 6, l: "Revisi FITT" },
                                        { n: 7, l: "Post-Test" },
                                        { n: 8, l: "24 Sesi" },
                                    ].map((st) => {
                                        const isDone = st.n <= activeStage12;
                                        return (
                                            <button
                                                key={st.n}
                                                type="button"
                                                onClick={() =>
                                                    setActiveStage12(st.n)
                                                }
                                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                                    isDone
                                                        ? "bg-[#0B3124] text-[#F5C84C] border-[#0B3124]"
                                                        : "bg-white text-[#6E7A75] border-black/10"
                                                }`}
                                            >
                                                <span className="font-montserrat text-xs font-extrabold block">
                                                    0{st.n}
                                                </span>
                                                <span
                                                    className={`text-[9px] font-bold block truncate mt-0.5 ${
                                                        isDone
                                                            ? "text-white/90"
                                                            : "text-[#6E7A75]"
                                                    }`}
                                                >
                                                    {st.l}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================= */}
            {/* SECTION EKOSISTEM 3 ROLE & SIMULATOR KAPASITAS SEKOLAH        */}
            {/* ============================================================= */}
            <section
                id="ekosistem"
                className="py-20 sm:py-28 border-t border-black/[0.08] bg-[#F4F1EA]"
            >
                <div className="max-w-[1380px] mx-auto px-3.5 sm:px-8 lg:px-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 pb-7 border-b border-black/[0.08] gap-6">
                        <h2 className="text-[28px] sm:text-[40px] font-extrabold tracking-[-0.03em] text-[#121C18] leading-[1.1]">
                            Satu Ekosistem. Tiga Peran Terintegrasi.
                        </h2>

                        <div className="flex p-1.5 rounded-full bg-white border border-black/[0.08] self-start lg:self-auto">
                            {(
                                [
                                    { k: "siswa", l: "Aplikasi Siswa" },
                                    { k: "guru", l: "Ruang Guru PJOK" },
                                    { k: "admin", l: "Pusat Sekolah" },
                                ] as const
                            ).map((r) => {
                                const active = activeRoleKey === r.k;
                                return (
                                    <button
                                        key={r.k}
                                        type="button"
                                        onClick={() => setActiveRoleKey(r.k)}
                                        className={`px-4 sm:px-6 py-2.5 rounded-full text-xs font-poppins font-extrabold transition-all cursor-pointer ${
                                            active
                                                ? "bg-[#0B3124] text-[#F5C84C] shadow-sm"
                                                : "text-[#525A56] hover:text-[#121C18]"
                                        }`}
                                    >
                                        {r.l}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        <div className="lg:col-span-7 bg-white rounded-[2.2rem] border border-black/[0.08] p-6 sm:p-10 edufit-pill-shadow flex flex-col justify-between">
                            <div>
                                <span className="font-poppins text-xs font-extrabold uppercase tracking-wider text-[#0B3124] block mb-2">
                                    {activeRoleObj.tag}
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#121C18] mb-3 leading-tight">
                                    {activeRoleObj.title}
                                </h3>
                                <p className="text-sm sm:text-base text-[#525A56] leading-relaxed mb-7">
                                    {activeRoleObj.desc}
                                </p>

                                <div className="space-y-3 mb-8">
                                    {activeRoleObj.highlights.map((h) => (
                                        <div
                                            key={h}
                                            className="flex items-center gap-3 text-sm font-semibold text-[#121C18]"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                                                <SvgCheck className="w-3.5 h-3.5" />
                                            </div>
                                            <span>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-black/[0.08]">
                                {activeRoleObj.metrics.map((m) => (
                                    <div
                                        key={m.label}
                                        className="p-4 rounded-2xl bg-[#F7F5F0]"
                                    >
                                        <span className="font-montserrat text-xl sm:text-2xl font-extrabold text-[#0B3124] block">
                                            {m.val}
                                        </span>
                                        <span className="text-[11px] font-semibold text-[#525A56] mt-0.5 block">
                                            {m.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-5 bg-[#0B3124] text-white rounded-[2.2rem] p-6 sm:p-10 flex flex-col justify-between shadow-xl">
                            <div>
                                <span className="font-poppins text-xs font-extrabold uppercase tracking-wider text-[#F5C84C] block mb-2">
                                    SIMULATOR SKALA SEKOLAH MITRA
                                </span>
                                <div className="flex items-baseline gap-3 mb-3">
                                    <span className="font-montserrat text-4xl sm:text-5xl font-extrabold text-white">
                                        {studentVolume.toLocaleString("id-ID")}
                                    </span>
                                    <span className="text-sm text-white/70 font-semibold">
                                        Siswa Aktif
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={60}
                                    max={1500}
                                    step={30}
                                    value={studentVolume}
                                    onChange={(e) =>
                                        setStudentVolume(Number(e.target.value))
                                    }
                                    className="w-full edufit-slider mb-6"
                                />

                                <div className="grid grid-cols-2 gap-3.5 mb-6">
                                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                                        <span className="text-[10px] font-poppins uppercase text-white/60 block">
                                            ROMBEL KELAS
                                        </span>
                                        <span className="font-montserrat text-2xl font-extrabold text-[#F5C84C]">
                                            {schoolSimMetrics.rombelCount} Kelas
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                                        <span className="text-[10px] font-poppins uppercase text-white/60 block">
                                            SESI FITT DIHASILKAN
                                        </span>
                                        <span className="font-montserrat text-2xl font-extrabold text-[#10B981]">
                                            {schoolSimMetrics.totalSessionsGenerated.toLocaleString(
                                                "id-ID"
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                                <a
                                    href="/app-release.apk"
                                    download="EduFit-Mobile.apk"
                                    className="flex-1 py-3.5 rounded-full bg-[#F5C84C] hover:bg-white text-[#07241A] font-poppins font-extrabold text-xs uppercase tracking-wider text-center transition-colors"
                                >
                                    Unduh APK Siswa
                                </a>
                                <Link
                                    href="/login"
                                    className="flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-poppins font-extrabold text-xs uppercase tracking-wider text-center transition-colors"
                                >
                                    Masuk Portal Web
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================= */}
            {/* FOOTER, UNDUH APK & BRANDING DEVELOPED BY DAFTAREASY          */}
            {/* ============================================================= */}
            <footer
                id="download"
                className="bg-[#07241A] text-white border-t border-white/10"
            >
                <div className="max-w-[1380px] mx-auto px-3.5 sm:px-8 lg:px-12 py-16 sm:py-24">
                    <div className="rounded-[2.2rem] bg-[#0B3124] border border-white/10 p-6 sm:p-12 mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-3">
                            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08]">
                                Siap Memulai Pengukuran &amp; Evaluasi Digital?
                            </h2>
                            <p className="text-white/75 text-sm sm:text-base max-w-xl leading-relaxed">
                                Unduh installer aplikasi resmi untuk Siswa
                                (Kelas X, XI, XII) atau masuk ke Portal Web
                                untuk Guru PJOK dan Pengelola Sekolah.
                            </p>
                        </div>

                        <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3.5 justify-end">
                            <a
                                href="/app-release.apk"
                                download="EduFit-Mobile.apk"
                                className="px-7 py-4 rounded-full bg-[#F5C84C] hover:bg-white text-[#07241A] font-poppins font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl"
                            >
                                <SvgDownload className="w-5 h-5 shrink-0" />
                                <span>Unduh APK Siswa</span>
                            </a>
                            <Link
                                href="/login"
                                className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-poppins font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                            >
                                <span>Login Guru &amp; Admin</span>
                                <SvgArrowUpRight className="w-4 h-4 text-[#F5C84C] shrink-0" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-14 border-b border-white/10">
                        <div className="md:col-span-5">
                            <div className="mb-5">
                                {!footerLogoError ? (
                                    <img
                                        src="/images/logo-putih.png"
                                        alt="EduFit"
                                        onError={() => setFooterLogoError(true)}
                                        className="h-20 sm:h-24 w-auto object-contain"
                                    />
                                ) : (
                                    <span className="font-extrabold text-[36px] tracking-[-0.04em] text-white leading-none">
                                        EduFit
                                        <span className="text-[#0EA5E9]">
                                            .
                                        </span>
                                    </span>
                                )}
                            </div>
                            <p className="text-[14px] text-white/65 max-w-[360px] leading-relaxed mb-6">
                                Platform Pendidikan Jasmani, Olahraga, dan
                                Kesehatan (PJOK) dengan integrasi 5 Pos TKJI,
                                komposisi tubuh IMT, dan matriks program latihan
                                FITT 8 minggu.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-poppins font-semibold text-white/80">
                                <span>Developed by</span>
                                <a
                                    href="https://instagram.com/daftareasy"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#F5C84C] font-extrabold hover:underline tracking-wider"
                                >
                                    DAFTAREASY
                                </a>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2.5 text-[14px]">
                            <div className="font-poppins text-[11px] uppercase tracking-wider text-[#F5C84C] mb-3 font-extrabold">
                                Navigasi
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    scrollToSection("beranda");
                                    handleSelectStation("ALL");
                                }}
                                className="block text-white/65 hover:text-white cursor-pointer"
                            >
                                Stadion 3D 5 Pos
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("simulasi")}
                                className="block text-white/65 hover:text-white cursor-pointer"
                            >
                                Simulasi &amp; Radar
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("kurikulum")}
                                className="block text-white/65 hover:text-white cursor-pointer"
                            >
                                Peta Kurikulum X–XII
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("ekosistem")}
                                className="block text-white/65 hover:text-white cursor-pointer"
                            >
                                Platform 3 Role
                            </button>
                        </div>

                        <div className="md:col-span-2 space-y-2.5 text-[14px]">
                            <div className="font-poppins text-[11px] uppercase tracking-wider text-[#F5C84C] mb-3 font-extrabold">
                                Legal &amp; Kebijakan
                            </div>
                            <button
                                type="button"
                                onClick={() => setLegalModal("terms")}
                                className="block text-white/65 hover:text-white cursor-pointer text-left"
                            >
                                Terms of Service
                            </button>
                            <button
                                type="button"
                                onClick={() => setLegalModal("privacy")}
                                className="block text-white/65 hover:text-white cursor-pointer text-left"
                            >
                                Privacy Policy
                            </button>
                            <button
                                type="button"
                                onClick={() => setLegalModal("license")}
                                className="block text-white/65 hover:text-white cursor-pointer text-left"
                            >
                                Kebijakan Data Sekolah
                            </button>
                            <a
                                href="https://instagram.com/daftareasy"
                                target="_blank"
                                rel="noreferrer"
                                className="block text-white/65 hover:text-[#F5C84C] transition-colors"
                            >
                                Instagram @daftareasy
                            </a>
                        </div>

                        <div className="md:col-span-3">
                            <div className="font-poppins text-[11px] uppercase tracking-wider text-[#F5C84C] mb-3 font-extrabold">
                                Kamera Cepat 3D
                            </div>
                            <p className="text-[13px] text-white/65 mb-4 leading-relaxed">
                                Sorot langsung Podium Guru PJOK dan Layar Skor
                                Stadion di panggung 3D.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    scrollToSection("beranda");
                                    handleSelectStation("GURU");
                                }}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-[#0EA5E9] text-white px-5 py-2.5 text-[12px] font-poppins font-extrabold transition-colors cursor-pointer"
                            >
                                <span>Sorot Layar Skor &amp; Guru</span>
                                <SvgArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[12px] font-poppins text-white/50 gap-4 text-center sm:text-left">
                        <span>
                            © 2026 EDUFIT • DEVELOPED BY{" "}
                            <strong className="text-[#F5C84C]">
                                DAFTAREASY
                            </strong>
                            . ALL RIGHTS RESERVED.
                        </span>
                        <div className="flex flex-wrap justify-center gap-5">
                            <button
                                type="button"
                                onClick={() => setLegalModal("terms")}
                                className="hover:text-white cursor-pointer"
                            >
                                Ketentuan Layanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setLegalModal("privacy")}
                                className="hover:text-white cursor-pointer"
                            >
                                Kebijakan Privasi
                            </button>
                            <button
                                type="button"
                                onClick={() => setLegalModal("license")}
                                className="hover:text-white cursor-pointer"
                            >
                                Lisensi Institusi
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ============================================================= */}
            {/* MODAL TERMS OF SERVICE, PRIVACY POLICY & KEBIJAKAN DAFTAREASY */}
            {/* ============================================================= */}
            {legalModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLegalModal(null)}
                >
                    <div
                        className="bg-white text-[#121C18] rounded-[2rem] max-w-xl w-full p-6 sm:p-9 border border-black/10 shadow-2xl relative max-h-[88vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setLegalModal(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#F4F1EA] hover:bg-[#0B3124] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <SvgX className="w-5 h-5" />
                        </button>

                        <span className="font-poppins text-[11px] font-extrabold uppercase tracking-wider text-[#0B3124] block mb-1">
                            DOKUMEN RESMI • DAFTAREASY
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#121C18] mb-4">
                            {legalModal === "terms" &&
                                "Ketentuan Layanan (Terms of Service)"}
                            {legalModal === "privacy" &&
                                "Kebijakan Privasi & Data Biometrik"}
                            {legalModal === "license" &&
                                "Lisensi Kurikulum & Keamanan Sekolah"}
                        </h3>

                        <div className="space-y-4 text-sm text-[#525A56] leading-relaxed border-t border-black/10 pt-4">
                            {legalModal === "terms" && (
                                <>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            1. Cakupan Penggunaan Platform:
                                        </strong>{" "}
                                        EduFit adalah sistem manajemen evaluasi
                                        kebugaran jasmani dan pembelajaran PJOK
                                        yang dikembangkan oleh{" "}
                                        <strong>DAFTAREASY</strong> untuk
                                        digunakan oleh Siswa, Guru PJOK, dan
                                        Pengelola Sekolah.
                                    </p>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            2. Keselamatan Pengukuran Fisik:
                                        </strong>{" "}
                                        Pelaksanaan ujian lapangan 5 Pos TKJI
                                        dan program latihan 8 minggu wajib
                                        diawasi oleh Guru PJOK dengan mengikuti
                                        prosedur pemanasan, tahapan teknik, dan
                                        fitur proteksi Tunda Medis yang tersedia
                                        di dalam sistem.
                                    </p>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            3. Hak Kekayaan Intelektual:
                                        </strong>{" "}
                                        Seluruh desain sistem, simulasi 3D, dan
                                        mesin perakit algoritma FITT merupakan
                                        karya pengembangan{" "}
                                        <strong>DAFTAREASY</strong>.
                                    </p>
                                </>
                            )}

                            {legalModal === "privacy" && (
                                <>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            1. Perlindungan Data Antropometri
                                            Siswa:
                                        </strong>{" "}
                                        Data berat badan, tinggi badan, tanggal
                                        lahir, serta capaian 5 Pos TKJI hanya
                                        digunakan untuk keperluan penghitungan
                                        norma akademik PJOK dan perumusan
                                        rekomendasi latihan FITT.
                                    </p>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            2. Isolasi Akses Pengguna:
                                        </strong>{" "}
                                        Setiap siswa hanya dapat mengakses rapor
                                        dan progres pribadinya sendiri,
                                        sementara Guru PJOK hanya dapat
                                        mengelola rombel kelas yang berada di
                                        bawah penempatan sekolahnya.
                                    </p>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            3. Penyimpanan &amp; Arsip:
                                        </strong>{" "}
                                        Data rekam jejak akademik disimpan
                                        secara aman dan dikelola oleh
                                        masing-masing institusi sekolah mitra
                                        bersama tim <strong>DAFTAREASY</strong>.
                                    </p>
                                </>
                            )}

                            {legalModal === "license" && (
                                <>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            1. Kepatuhan Kurikulum Nasional:
                                        </strong>{" "}
                                        Instrumen evaluasi kognitif, refleksi
                                        materi, dan norma penilaian fisik pada
                                        EduFit disusun selaras dengan Capaian
                                        Pembelajaran (CP) dan Tujuan
                                        Pembelajaran (TP) Fase E dan Fase F.
                                    </p>
                                    <p>
                                        <strong className="text-[#121C18]">
                                            2. Dukungan Teknis DAFTAREASY:
                                        </strong>{" "}
                                        Institusi sekolah yang bermitra
                                        mendapatkan akses penuh ke Studio Live
                                        Asesmen Guru, Penyusun Materi, serta
                                        pembaruan berkala aplikasi mobile siswa.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="mt-7 pt-4 border-t border-black/10 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setLegalModal(null)}
                                className="px-6 py-3 rounded-full bg-[#0B3124] text-[#F5C84C] font-poppins font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                            >
                                Mengerti &amp; Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* NON-BLOCKING NOTIFICATION TOAST                               */}
            {/* ============================================================= */}
            <div
                className={`fixed bottom-5 right-5 z-50 max-w-md bg-[#07241A] text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/15 transform transition-all duration-300 flex items-start gap-3.5 ${
                    toastData.visible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-28 opacity-0 pointer-events-none"
                }`}
            >
                <div className="w-8 h-8 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <SvgCheck className="w-4 h-4" />
                </div>
                <div>
                    <div className="font-extrabold text-[14px] text-white">
                        {toastData.title}
                    </div>
                    <div className="text-[12px] text-white/75 font-medium mt-0.5">
                        {toastData.desc}
                    </div>
                </div>
            </div>
        </div>
    );
}