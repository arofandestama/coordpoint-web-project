'use client';

/**
 * LandingPage — immersive dark-ocean themed landing with a motion-rich hero.
 *
 * Palette (built around #90e0ef):
 *   #03045e (deep navy base) · #023e8a · #0077b6 · #00b4d8 · #90e0ef · #caf0f8
 *
 * Hero highlights: aurora blobs with mouse parallax, drifting particles,
 * animated perspective grid floor, radar-sweep + orbiting satellite marker,
 * live DMS→DD conversion ticker, staggered word reveal with blur, and
 * count-up statistics.
 */
import dynamic from 'next/dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Compass,
  Crosshair,
  Globe,
  Map,
  MapPin,
  MapPinPlus,
  MousePointerClick,
  Network,
  Repeat,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import { MermaidDiagram } from '@/components/docs/MermaidDiagram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CLASS_DIAGRAM, SEQUENCE_DIAGRAM } from '@/lib/docs/diagrams';
import { cn } from '@/lib/utils';

export interface LandingPageProps {
  onLaunch: () => void;
}

/** Client-only 3D globe (three.js needs a real browser DOM). */
const EarthGlobe = dynamic(() => import('./EarthGlobe'), { ssr: false });

const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

const NAV_LINKS = [
  { id: 'fitur', label: 'Fitur' },
  { id: 'cara-kerja', label: 'Cara Kerja' },
  { id: 'dokumentasi', label: 'Dokumentasi' },
] as const;

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Compass,
    title: 'Konversi DMS ke DD',
    description:
      'Ubah derajat, menit, detik, dan arah menjadi decimal degrees dengan pembulatan presisi hingga lima desimal.',
  },
  {
    icon: Repeat,
    title: 'Konversi DD ke DMS',
    description:
      'Kembalikan decimal degrees ke format derajat-menit-detik, lengkap dengan arah N/S atau E/W yang dihitung otomatis.',
  },
  {
    icon: Map,
    title: 'Peta OpenStreetMap',
    description:
      'Tiles OpenStreetMap dirender lewat OpenLayers, lengkap dengan kontrol zoom, pan, dan interaksi peta yang halus.',
  },
  {
    icon: MapPinPlus,
    title: 'Marker & Auto-Center',
    description:
      'Tombol Add To Maps menambahkan marker pada koordinat lalu memusatkan peta ke titik tersebut dengan animasi.',
  },
  {
    icon: ShieldCheck,
    title: 'Validasi Ketat',
    description:
      'Latitude dibatasi ±90°, longitude ±180°, menit dan detik 0–59 — input tidak valid langsung ditolak dengan pesan yang jelas.',
  },
  {
    icon: MousePointerClick,
    title: 'Panel Konversi Mengambang',
    description:
      'Panel konversi melayang di atas peta dan bisa dibuka kapan saja — hasilnya langsung siap ditandai ke peta.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Buka panel konversi',
    description: 'Klik tombol mengambang di sisi peta untuk membuka panel konversi kapan saja.',
  },
  {
    number: '02',
    title: 'Masukkan koordinat',
    description:
      'Isi derajat, menit, detik, dan arah — atau mulai dari DD — lalu konversi seketika dengan validasi ketat.',
  },
  {
    number: '03',
    title: 'Tambahkan ke peta',
    description: 'Tekan Add To Maps: marker langsung muncul dan kamera peta terbang ke titik tersebut.',
  },
] as const;

/** Samples cycled by the live DMS → DD ticker in the hero. */
const CONVERSION_SAMPLES = [
  { dms: `49°30'10" N`, dd: '49.50278° N' },
  { dms: `106°49'40" E`, dd: '106.82778° E' },
  { dms: `6°12'00" S`, dd: '6.20000° S' },
  { dms: `23°33'00" W`, dd: '23.55000° W' },
] as const;

const STATS = [
  { value: 2, suffix: ' arah', label: 'konversi DMS ⇄ DD' },
  { value: 5, suffix: ' desimal', label: 'akurasi hasil' },
  { value: 180, suffix: '°', label: 'jangkauan longitude' },
] as const;

/** Deterministic PRNG so SSR and client render identical particles (no hydration mismatch). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const wordStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const wordUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/** Animated number that counts up when scrolled into view. */
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = String(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, value]);

  return <span ref={ref}>0</span>;
}

function SectionHeading({
  label,
  title,
  description,
  titleId,
}: {
  label: string;
  title: string;
  description: string;
  titleId?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0077b6]">{label}</p>
      <h2 id={titleId} className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

/** Slow-drifting glowing aurora blobs, shifted by mouse parallax. */
function AuroraBlobs({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  return (
    <motion.div aria-hidden="true" style={{ x, y }} className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute -top-48 left-[-12%] size-[42rem] rounded-full bg-[#0077b6]/45 blur-[140px]"
        animate={{ x: [0, 60, -20, 0], y: [0, 30, 60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-14%] top-[-18%] size-[34rem] rounded-full bg-[#90e0ef]/20 blur-[130px]"
        animate={{ x: [0, -50, 10, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-22%] left-[28%] size-[30rem] rounded-full bg-[#00b4d8]/25 blur-[120px]"
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/** Deterministic field of softly floating particles. */
function Particles() {
  const particles = useMemo(() => {
    const rand = mulberry32(20240910);
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: 1 + rand() * 2.2,
      duration: 5 + rand() * 9,
      delay: rand() * 6,
      drift: 12 + rand() * 30,
      opacity: 0.25 + rand() * 0.5,
    }));
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-[#90e0ef]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -particle.drift, 0],
            opacity: [particle.opacity * 0.35, particle.opacity, particle.opacity * 0.35],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/** Perspective grid floor scrolling toward the viewer. */
function GridFloor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] [mask-image:linear-gradient(to_top,black_20%,transparent)]"
    >
      <motion.div
        className="absolute inset-0 origin-bottom [transform:perspective(700px)_rotateX(62deg)_scale(1.7)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(144,224,239,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(144,224,239,0.16) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '0px 56px'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function HeroVisual() {
  const shouldReduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((current) => (current + 1) % CONVERSION_SAMPLES.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  const sample = CONVERSION_SAMPLES[tick];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="relative isolate"
    >
      {/* Ambient glow behind the globe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(60%_60%_at_50%_45%,rgba(0,180,216,0.45),transparent)] blur-3xl"
      />

      {/* 3D Earth (glTF model, client-only) */}
      <EarthGlobe className="relative aspect-square w-full max-w-[640px] mx-auto" />

      {/* Floating card: live DMS → DD ticker */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
        className="absolute -left-3 bottom-8 sm:-left-6"
      >
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-44 rounded-2xl border border-[#90e0ef]/20 bg-[#001233]/85 p-3.5 shadow-[0_16px_50px_-12px_rgba(0,180,216,0.5)] backdrop-blur sm:w-48"
        >
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#90e0ef]">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#00b4d8] opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#00b4d8]" />
            </span>
            Live · DMS → DD
          </p>
          <div className="mt-2 min-h-[64px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tick}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-mono text-sm text-[#caf0f8]">{sample.dms}</p>
                <ArrowDown className="my-1 size-3.5 text-[#00b4d8]" aria-hidden="true" />
                <p className="font-mono text-sm font-semibold text-[#90e0ef]">{sample.dd}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card: precision chip */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5, ease: 'easeOut' }}
        className="absolute -right-2 top-8 sm:-right-5"
      >
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="flex items-center gap-2.5 rounded-2xl border border-[#90e0ef]/20 bg-[#001233]/85 px-4 py-3 shadow-[0_16px_50px_-12px_rgba(0,180,216,0.5)] backdrop-blur"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#90e0ef]/15 text-[#90e0ef]">
            <Crosshair className="size-4" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-white sm:text-sm">
            ±0.00001°
            <span className="block font-mono text-[10px] font-medium uppercase tracking-widest text-[#90e0ef]/70">presisi</span>
          </span>
        </motion.div>
      </motion.div>

      {/* Floating card: tiles chip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
        className="absolute bottom-4 right-6 hidden sm:block"
      >
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
          className="flex items-center gap-2.5 rounded-2xl border border-[#90e0ef]/20 bg-[#001233]/85 px-4 py-3 shadow-[0_16px_50px_-12px_rgba(0,180,216,0.5)] backdrop-blur"
        >
          <Globe className="size-4 text-[#90e0ef]" aria-hidden="true" />
          <span className="font-mono text-xs font-medium text-[#caf0f8]">OpenStreetMap Tiles</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

interface DocCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  diagramId: string;
  chart: string;
}

function DocCard({ icon: Icon, title, subtitle, diagramId, chart }: DocCardProps) {
  return (
    <Card className="h-full gap-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0077b6] ring-1 ring-sky-100">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="hidden rounded-full border border-slate-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400 sm:inline-block">
          mermaid
        </span>
      </div>
      <Separator className="my-5" />
      <div className="max-h-[32rem] overflow-auto rounded-2xl border border-slate-100">
        <MermaidDiagram id={diagramId} chart={chart} className="p-4" />
      </div>
    </Card>
  );
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();

  // Mouse parallax springs (hero only).
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const blobsX = useTransform(springX, (v) => v * -36);
  const blobsY = useTransform(springY, (v) => v * -24);
  const visualX = useTransform(springX, (v) => v * 22);
  const visualY = useTransform(springY, (v) => v * 14);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#03045e]/75 backdrop-blur-md">
        <div className={cn(CONTAINER, 'flex h-14 items-center justify-between gap-4')}>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00b4d8] to-[#0077b6] shadow-lg shadow-[#00b4d8]/30">
              <MapPin className="size-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white">CoordPoint</span>
          </div>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-[#caf0f8]/70 transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <Button
            type="button"
            onClick={onLaunch}
            className="h-10 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#90e0ef] px-6 text-sm font-semibold text-[#03045e] shadow-md shadow-[#00b4d8]/25 transition hover:brightness-110"
          >
            Buka Peta
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative isolate overflow-hidden bg-[#03045e] text-white"
        >
          {/* Base gradient wash */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,#023e8a_0%,#03045e_55%,#001233_100%)]"
          />
          <AuroraBlobs x={blobsX} y={blobsY} />
          {/* Dot pattern */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(202,240,248,0.1)_1px,transparent_0)] bg-[size:26px_26px] [mask-image:radial-gradient(60%_50%_at_50%_35%,black,transparent)]"
          />
          <Particles />
          <GridFloor />

          <div
            className={cn(
              CONTAINER,
              'relative z-10 grid min-h-[88vh] grid-cols-1 items-center gap-14 pb-24 pt-32 sm:pt-36 lg:grid-cols-[1fr_1.1fr] lg:gap-8',
            )}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-xl"
            >
              <motion.h1
                variants={wordStagger}
                className="mt-7 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
              >
                <motion.span variants={wordUp} className="inline-block">Konversi</motion.span>{' '}
                <motion.span variants={wordUp} className="inline-block">koordinat</motion.span>{' '}
                <motion.span variants={wordUp} className="relative inline-block whitespace-nowrap">
                  <motion.span
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    className="bg-gradient-to-r from-[#caf0f8] via-[#90e0ef] to-[#00b4d8] bg-clip-text text-transparent bg-[length:200%_auto]"
                  >
                    DMS ⇄ DD
                  </motion.span>
                  <motion.span
                    aria-hidden="true"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-gradient-to-r from-[#00b4d8] to-[#90e0ef]"
                  />
                </motion.span>{' '}
                <motion.span variants={wordUp} className="inline-block">langsung</motion.span>{' '}
                <motion.span variants={wordUp} className="inline-block">di</motion.span>{' '}
                <motion.span variants={wordUp} className="inline-block">atas</motion.span>{' '}
                <motion.span variants={wordUp} className="inline-block">peta.</motion.span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-6 text-base leading-relaxed text-[#caf0f8]/75 sm:text-lg">
                Ubah koordinat Derajat-Menit-Detik menjadi Decimal Degrees langsung di atas peta
                OpenStreetMap — dengan marker interaktif, animasi halus, dan validasi ketat.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  onClick={onLaunch}
                  className="group relative h-12 gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] px-9 text-base font-semibold text-white shadow-lg shadow-[#00b4d8]/30 transition-all hover:shadow-xl hover:shadow-[#00b4d8]/40"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                  <span className="relative">Buka Peta</span>
                  <ArrowRight
                    className="relative size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => scrollToSection('dokumentasi')}
                  className="h-12 rounded-full border-[#90e0ef]/30 bg-white/5 px-7 text-base text-[#caf0f8] backdrop-blur transition-colors hover:border-[#90e0ef]/60 hover:bg-white/10 hover:text-white"
                >
                  Lihat Diagram Rancangan
                </Button>
              </motion.div>

              <motion.ul variants={fadeUp} className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {STATS.map((stat) => (
                  <li key={stat.label}>
                    <p className="flex items-baseline gap-1 text-2xl font-bold text-white">
                      <Counter value={stat.value} />
                      <span className="text-sm font-semibold text-[#90e0ef]">{stat.suffix}</span>
                    </p>
                    <p className="mt-1 text-xs leading-snug text-[#caf0f8]/60">{stat.label}</p>
                  </li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div style={{ x: visualX, y: visualY }}>
              <HeroVisual />
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div
            aria-hidden="true"
            animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 md:block"
          >
            <ChevronDown className="size-5 text-[#90e0ef]/70" />
          </motion.div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section id="fitur" aria-labelledby="fitur-title" className="scroll-mt-24 py-16 sm:py-24">
          <div className={CONTAINER}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
              <motion.div variants={fadeUp}>
                <SectionHeading
                  titleId="fitur-title"
                  label="Fitur"
                  title="Semua yang dibutuhkan untuk bekerja dengan koordinat"
                  description="Dari konversi dua arah hingga visualisasi di peta — dirancang presisi, cepat, dan mudah diverifikasi."
                />
              </motion.div>

              <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => {
                  const { icon: Icon, title, description } = feature;
                  return (
                    <motion.div key={title} variants={fadeUp} className="min-w-0">
                      <Card className="group h-full gap-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-[#0077b6] ring-1 ring-sky-100 transition-colors duration-300 group-hover:bg-[#0077b6] group-hover:text-white">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section
          id="cara-kerja"
          aria-labelledby="cara-kerja-title"
          className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70 py-16 sm:py-24"
        >
          <div className={CONTAINER}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
              <motion.div variants={fadeUp}>
                <SectionHeading
                  titleId="cara-kerja-title"
                  label="Cara Kerja"
                  title="Tiga langkah dari koordinat ke peta"
                  description="Alur penggunaan yang ringkas — tanpa perhitungan manual, tanpa copy-paste ke tools lain."
                />
              </motion.div>

              <div className="relative mt-14">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-24 top-6 hidden border-t-2 border-dashed border-[#90e0ef]/60 lg:block"
                />
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
                  {STEPS.map((step) => (
                    <motion.div key={step.number} variants={fadeUp} className="relative">
                      <span
                        aria-hidden="true"
                        className="relative z-10 inline-block select-none text-5xl font-bold leading-none text-[#90e0ef]"
                      >
                        {step.number}
                      </span>
                      <h3 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Documentation ────────────────────────────────────────────── */}
        <section id="dokumentasi" aria-labelledby="dokumentasi-title" className="scroll-mt-24 py-16 sm:py-24">
          <div className={CONTAINER}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
              <motion.div variants={fadeUp}>
                <SectionHeading
                  titleId="dokumentasi-title"
                  label="Dokumentasi"
                  title="Diagram rancangan sistem"
                  description="Perancangan lengkap dalam bentuk class diagram & sequence diagram — juga tersedia di folder docs/."
                />
              </motion.div>

              <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div variants={fadeUp} className="min-w-0">
                  <DocCard
                    icon={Network}
                    title="Class Diagram"
                    subtitle="Struktur modul, converter, dan komponen UI"
                    diagramId="class-diagram"
                    chart={CLASS_DIAGRAM}
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="min-w-0">
                  <DocCard
                    icon={Workflow}
                    title="Sequence Diagram"
                    subtitle="Alur interaksi konversi hingga marker muncul"
                    diagramId="sequence-diagram"
                    chart={SEQUENCE_DIAGRAM}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA band ─────────────────────────────────────────────────── */}
        <section className="pb-20 sm:pb-24">
          <div className={CONTAINER}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative isolate overflow-hidden rounded-3xl bg-[#03045e] px-6 py-14 text-center sm:px-14 sm:py-20"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-[#00b4d8]/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-28 right-0 -z-10 h-56 w-72 rounded-full bg-[#90e0ef]/15 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(202,240,248,0.08)_1px,transparent_0)] bg-[size:22px_22px]"
              />

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Siap mencoba konversi koordinat?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#caf0f8]/70">
                Coba sendiri bagaimana DMS berubah menjadi DD — lalu lihat titiknya muncul di peta dalam hitungan
                detik.
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  onClick={onLaunch}
                  className="group relative h-12 gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#00b4d8] to-[#90e0ef] px-10 text-base font-semibold text-[#03045e] shadow-lg shadow-[#00b4d8]/30 transition-all hover:shadow-xl hover:shadow-[#00b4d8]/40"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                  <span className="relative">Buka Peta</span>
                  <ArrowRight
                    className="relative size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200/70 bg-white">
        <div className={cn(CONTAINER, 'flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between')}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00b4d8] to-[#0077b6] text-white">
              <MapPin className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">CoordPoint</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Konversi koordinat DMS ⇄ DD langsung di atas peta OpenStreetMap.
              </p>
            </div>
          </div>

          <nav aria-label="Tautan eksternal" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href="https://openlayers.org"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              OpenLayers Docs
            </a>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              © OpenStreetMap
            </a>
          </nav>

          <p className="text-sm text-slate-400">© {new Date().getFullYear()} CoordPoint</p>
        </div>
      </footer>
    </div>
  );
}