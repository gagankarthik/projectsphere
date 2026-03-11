"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  Users,
  Kanban,
  Search,
  Command,
  GripVertical,
  Circle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  GitBranch,
  BarChart3,
  Shield,
  Globe,
  Bell,
  MoreHorizontal,
  Plus,
  Star,
  TrendingUp,
  Layers,
  Menu,
  X,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────
const EASE = "easeOut" as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// ScrollReveal wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: delay * 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shimmer Button
// ─────────────────────────────────────────────────────────────────────────────
function ShimmerButton({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg",
        "bg-gradient-to-r from-indigo-600 to-violet-600",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "hover:shadow-xl hover:shadow-indigo-500/25 transition-shadow duration-300",
        className
      )}
    >
      {children}
    </motion.button>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = ["Features", "Pricing", "Docs", "Blog"];

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/80 shadow-sm backdrop-blur-xl border-b border-slate-100"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="ProjectSphere" width={140} height={32} className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item}
                href={item === "Features" ? "#features" : "#"}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <ShimmerButton href="/auth/signup" className="h-10 px-5 text-sm">
              Get started free
            </ShimmerButton>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <nav className="mx-auto max-w-7xl px-4 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((item) => (
                  <Link
                    key={item}
                    href={item === "Features" ? "#features" : "#"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {item}
                  </Link>
                ))}
                <div className="my-2 h-px bg-slate-100" />
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-base font-semibold text-white"
                >
                  Get started free
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Tilt Dashboard Mockup
// ─────────────────────────────────────────────────────────────────────────────
function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 120,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 120,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1200 w-full max-w-5xl mx-auto px-4"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        style={isMobile ? {} : { rotateX, rotateY }}
        className="relative w-full rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-indigo-500/10 overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 sm:px-4 py-3">
          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-400" />
          <div className="mx-auto flex h-6 w-32 sm:w-48 items-center justify-center rounded-md bg-white border border-slate-200 text-[10px] sm:text-[11px] text-slate-400 font-mono">
            app.projectsphere.io
          </div>
        </div>

        {/* App UI */}
        <div className="flex h-[280px] sm:h-[360px] md:h-[420px]">
          {/* Sidebar - hidden on mobile */}
          <div className="hidden w-44 lg:w-52 shrink-0 border-r border-slate-100 bg-slate-50/50 p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5">
              <Layers className="h-4 w-4 text-white" />
              <span className="text-xs font-semibold text-white">ProjectSphere</span>
            </div>
            {["Dashboard", "My Tasks", "Projects", "Team", "Analytics"].map((item, i) => (
              <div
                key={item}
                className={cn(
                  "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  i === 1
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {i === 0 && <BarChart3 className="h-3.5 w-3.5" />}
                {i === 1 && <CheckCircle2 className="h-3.5 w-3.5" />}
                {i === 2 && <Kanban className="h-3.5 w-3.5" />}
                {i === 3 && <Users className="h-3.5 w-3.5" />}
                {i === 4 && <TrendingUp className="h-3.5 w-3.5" />}
                {item}
              </div>
            ))}
          </div>

          {/* Kanban columns */}
          <div className="flex flex-1 gap-2 sm:gap-3 overflow-x-auto p-3 sm:p-4">
            {[
              {
                label: "To Do",
                color: "bg-slate-400",
                tasks: [
                  { title: "Design system audit", tag: "Design", priority: "high" },
                  { title: "API rate limiting", tag: "Backend", priority: "medium" },
                ],
              },
              {
                label: "In Progress",
                color: "bg-indigo-500",
                tasks: [
                  { title: "Sprint planning board", tag: "Product", priority: "urgent", active: true },
                  { title: "Onboarding flow v2", tag: "UX", priority: "high" },
                ],
              },
              {
                label: "In Review",
                color: "bg-amber-400",
                tasks: [
                  { title: "Notification center", tag: "Frontend", priority: "medium" },
                ],
              },
              {
                label: "Done",
                color: "bg-emerald-500",
                tasks: [
                  { title: "Auth with Cognito", tag: "Backend", priority: "low" },
                  { title: "S3 file upload", tag: "Backend", priority: "medium" },
                ],
              },
            ].map((col) => (
              <div key={col.label} className="flex w-32 sm:w-36 md:w-44 shrink-0 flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", col.color)} />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span className="ml-auto text-[9px] sm:text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{col.tasks.length}</span>
                </div>
                {col.tasks.map((task, ti) => (
                  <motion.div
                    key={task.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + ti * 0.08 }}
                    className={cn(
                      "rounded-lg border p-2 sm:p-2.5 text-left text-[10px] sm:text-[11px] shadow-sm transition-shadow hover:shadow-md",
                      task.active
                        ? "border-indigo-200 bg-indigo-50 ring-1 ring-indigo-300"
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <p className="font-medium leading-snug text-slate-800">{task.title}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium text-slate-500">
                        {task.tag}
                      </span>
                      <span
                        className={cn(
                          "ml-auto rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium",
                          task.priority === "urgent" && "bg-red-100 text-red-600",
                          task.priority === "high" && "bg-orange-100 text-orange-600",
                          task.priority === "medium" && "bg-blue-100 text-blue-600",
                          task.priority === "low" && "bg-slate-100 text-slate-500"
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] sm:text-[11px] text-slate-400 hover:bg-slate-50 transition-colors">
                  <Plus className="h-3 w-3" />
                  Add task
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle glow overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-200/60" />
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo cloud with SVG logos
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_LOGOS = [
  {
    name: "Vercel",
    svg: (
      <svg viewBox="0 0 76 65" fill="currentColor" className="h-4 w-auto">
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
      </svg>
    ),
  },
  {
    name: "Linear",
    svg: (
      <svg viewBox="0 0 100 100" fill="currentColor" className="h-5 w-auto">
        <path d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857L39.3342 97.1782c.6889.6889.0915 1.8189-.857 1.5765C20.0515 94.4522 5.54779 79.9485 1.22541 61.5228ZM.00189135 46.8891c-.01764375.2833.08887235.5599.28957765.7606L52.3503 99.7085c.2007.2007.4773.3072.7606.2896 2.3692-.1476 4.6938-.46 6.9624-.9261.7645-.157 1.0301-1.0963.4782-1.6481L4.57541 41.4475c-.55186-.5519-1.49117-.2863-1.64812.4782-.46605 2.2686-.77857 4.5932-.92540365 6.9624ZM4.21093 29.7054c-.16649.3738-.08169.8106.20765 1.1l64.77602 64.776c.2894.2894.7262.3742 1.1.2077 1.7861-.7946 3.5171-1.6933 5.1855-2.684.5521-.328.6373-1.0867.1932-1.5308L8.43514 24.3367c-.44414-.4441-1.20285-.359-1.53078.1932-.99074 1.6684-1.88943 3.3994-2.68343 5.1855ZM12.6587 18.074c-.3701.3701-.393.9637-.0443 1.3541L74.5765 87.3858c.3905.3487.984.326 1.3542-.0443 1.6758-1.6977 3.2444-3.5019 4.6956-5.4013.4091-.5353.3274-1.2943-.1803-1.7222L18.0601 18.072c-.17345-.1383-.38343-.2147-.60147-.2147-.21803 0-.42802.0764-.60147.2147-1.89944 1.451-3.70362 3.0196-5.40126 4.6953ZM25.0391 9.67949c-.41878.41878-.4805 1.07446-.14526 1.55633C35.4726 26.3011 73.7006 64.4847 88.7646 79.5261c.4812.4811 1.2642.4368 1.6922-.0724 1.5587-1.8529 3.0071-3.7996 4.3387-5.8309.2823-.4309.2092-.9993-.1699-1.3784L29.689 7.30753c-.3791-.37913-.9475-.45227-1.3784-.16991-2.0313 1.3316-3.978 2.78002-5.8309 4.33867ZM41.6837 2.67073c-.3594.21649-.5414.62674-.4573 1.03043C44.8656 20.9074 79.0925 55.1131 96.2989 58.7736c.4037.0841.8139-.098 1.0304-.4573 1.0098-1.6752 1.9217-3.4086 2.7322-5.1916.2062-.4536.0871-.9885-.2862-1.2992L38.3886.23925c-.3107-.37327-.8456-.49239-1.2992-.28622-1.783.81053-3.5164 1.72242-5.1916 2.7322Z" />
      </svg>
    ),
  },
  {
    name: "Notion",
    svg: (
      <svg viewBox="0 0 100 100" fill="currentColor" className="h-5 w-auto">
        <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z" />
        <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.89c5.433-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.81-2.847-3.177-4.623l-17.593-12.523C71.09.427 69.316-.103 62.86.173z" fill="#fff" />
        <path d="M27.997 19.483c-4.973.3-6.13.37-9.003-1.983L10.517 9.917c-.82-.587-.587-.973.583-1.167l53.373-3.913c4.473-.38 6.797.78 8.73 2.53l10.143 8.17c.39.19.973 1.167.193 1.167l-55.153 3.053-.39-.273z" />
        <path d="M21.38 87.08V30.907c0-2.333.78-3.5 2.917-3.693l63.09-3.69c2.14-.19 3.11 1.17 3.11 3.5v55.783c0 2.333-.39 4.277-3.883 4.467l-60.387 3.5c-3.497.19-5.037-1.17-4.847-3.693z" />
        <path d="M71.907 37.773c.39 1.75 0 3.5-1.75 3.697l-2.917.58v41.193c-2.527 1.36-4.853 2.137-6.797 2.137-3.113 0-3.887-.973-6.22-3.887L37.777 53.52v26.063l5.637 1.37s0 3.5-4.853 3.5L27.22 85.33c-.39-.78 0-2.53 1.36-2.917l3.5-.97V44.183l-4.853-.39c-.39-1.75.583-4.277 3.303-4.47l13.397-.973 17.273 26.45V44.377l-4.66-.583c-.39-2.14 1.167-3.693 3.11-3.887l13.257-.78z" fill="#fff" />
      </svg>
    ),
  },
  {
    name: "Stripe",
    svg: (
      <svg viewBox="0 0 60 25" fill="currentColor" className="h-6 w-auto">
        <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.28 10.28 0 0 1-4.56.98c-4.31 0-6.94-2.52-6.94-7.04 0-3.86 2.29-6.9 6.3-6.9 3.67 0 5.96 2.76 5.96 6.74l.05 1.3zm-8.06-2.62h4.4c0-1.42-.74-2.32-2.11-2.32-1.28 0-2.1.84-2.29 2.32zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.2.9V6.42h3.71l.17 1c.6-.67 1.66-1.2 3.08-1.2 2.9 0 5.16 2.73 5.16 6.93-.01 4.4-2.24 7.15-5 7.15zm-.95-10.67c-.9 0-1.47.31-1.87.74l.02 5.54c.38.4.92.69 1.85.69 1.52 0 2.46-1.5 2.46-3.52 0-1.99-.97-3.45-2.46-3.45zM28.24 5.57c-1.42 0-2.57-1.16-2.57-2.57 0-1.42 1.15-2.58 2.57-2.58 1.42 0 2.58 1.16 2.58 2.58 0 1.41-1.16 2.57-2.58 2.57zm-2.1 14.43V6.42h4.2V20h-4.2zM18.68 6.24l.17.78c.57-.66 1.6-1.01 2.77-1.01.72 0 1.23.08 1.63.22l-.6 3.88c-.36-.11-.78-.19-1.3-.19-1.04 0-2 .37-2.4 1.39v8.69h-4.21V6.42l3.94-.18zM8.16 6.22l.19.9c.8-.87 1.9-1.12 2.95-1.12 2.18 0 3.5 1.1 3.5 3.66V20h-4.2v-9.72c0-.93-.41-1.26-1.15-1.26-.55 0-1.13.23-1.56.66v10.3h-4.2V9.92L0 10.24V7.3l3.69-1.08z" />
      </svg>
    ),
  },
  {
    name: "Figma",
    svg: (
      <svg viewBox="0 0 38 57" className="h-5 w-auto">
        <path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
        <path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
        <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
        <path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
        <path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
      </svg>
    ),
  },
  {
    name: "Supabase",
    svg: (
      <svg viewBox="0 0 109 113" className="h-5 w-auto">
        <path d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874l-43.151 54.347Z" fill="url(#a)" />
        <path d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874l-43.151 54.347Z" fill="url(#b)" fillOpacity=".2" />
        <path d="M45.317 2.071c2.86-3.601 8.657-1.628 8.726 2.97l.442 67.251H9.83c-8.19 0-12.759-9.46-7.665-15.875L45.317 2.072Z" fill="#3ECF8E" />
        <defs>
          <linearGradient id="a" x1="53.974" y1="54.974" x2="94.163" y2="71.829" gradientUnits="userSpaceOnUse">
            <stop stopColor="#249361" />
            <stop offset="1" stopColor="#3ECF8E" />
          </linearGradient>
          <linearGradient id="b" x1="36.156" y1="30.578" x2="54.484" y2="65.081" gradientUnits="userSpaceOnUse">
            <stop />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: "GitHub",
    svg: (
      <svg viewBox="0 0 98 96" fill="currentColor" className="h-6 w-auto">
        <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
      </svg>
    ),
  },
  {
    name: "Slack",
    svg: (
      <svg viewBox="0 0 127 127" className="h-5 w-auto">
        <path d="M27.2 80a13.28 13.28 0 0 1-13.24 13.28A13.28 13.28 0 0 1 .72 80a13.28 13.28 0 0 1 13.24-13.28h13.24V80ZM33.84 80A13.28 13.28 0 0 1 47.08 66.72a13.28 13.28 0 0 1 13.24 13.28v33.2a13.28 13.28 0 0 1-13.24 13.28A13.28 13.28 0 0 1 33.84 113.2V80Z" fill="#E01E5A" />
        <path d="M47.08 27.2A13.28 13.28 0 0 1 33.84 13.96 13.28 13.28 0 0 1 47.08.72a13.28 13.28 0 0 1 13.24 13.24v13.24H47.08ZM47.08 33.84a13.28 13.28 0 0 1 13.24 13.24 13.28 13.28 0 0 1-13.24 13.24H13.96A13.28 13.28 0 0 1 .72 47.08a13.28 13.28 0 0 1 13.24-13.24h33.12Z" fill="#36C5F0" />
        <path d="M99.92 47.08a13.28 13.28 0 0 1 13.24-13.24 13.28 13.28 0 0 1 13.24 13.24 13.28 13.28 0 0 1-13.24 13.24H99.92V47.08ZM93.28 47.08a13.28 13.28 0 0 1-13.24 13.24 13.28 13.28 0 0 1-13.24-13.24V13.96A13.28 13.28 0 0 1 80.04.72a13.28 13.28 0 0 1 13.24 13.24v33.12Z" fill="#2EB67D" />
        <path d="M80.04 99.92a13.28 13.28 0 0 1 13.24 13.24 13.28 13.28 0 0 1-13.24 13.24 13.28 13.28 0 0 1-13.24-13.24V99.92h13.24ZM80.04 93.28a13.28 13.28 0 0 1-13.24-13.24 13.28 13.28 0 0 1 13.24-13.24h33.2a13.28 13.28 0 0 1 13.24 13.24 13.28 13.28 0 0 1-13.24 13.24H80.04Z" fill="#ECB22E" />
      </svg>
    ),
  },
];

function LogoCloud() {
  const logos = [...COMPANY_LOGOS, ...COMPANY_LOGOS];
  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute inset-y-0 left-0 z-10 w-20 sm:w-32 bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-20 sm:w-32 bg-gradient-to-l from-white to-transparent" />
      <motion.div
        className="flex gap-8 sm:gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        style={{ width: "max-content" }}
      >
        {logos.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex shrink-0 items-center gap-2.5 text-slate-400 opacity-70 hover:opacity-100 transition-opacity"
          >
            {logo.svg}
            <span className="text-sm font-semibold tracking-tight">{logo.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento Feature Grid
// ─────────────────────────────────────────────────────────────────────────────

// Draggable task card visual
function DragTaskCard() {
  const [dragged, setDragged] = useState(false);
  return (
    <div className="relative h-full flex flex-col justify-between p-4 sm:p-6">
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Kanban className="h-3 w-3" /> Drag &amp; Drop
        </span>
        <h3 className="mt-3 text-base sm:text-lg font-bold leading-snug text-slate-900">
          Kanban that moves at the speed of thought.
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Drag tasks across any column. Updates sync instantly to your whole team.
        </p>
      </div>
      {/* Fake drag animation */}
      <div className="relative flex gap-2 sm:gap-3">
        {["To Do", "In Progress", "Done"].map((col, ci) => (
          <div key={col} className="flex-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 sm:p-2">
            <p className="mb-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-400">{col}</p>
            {ci === 0 && (
              <div className="rounded-md border border-slate-200 bg-white p-1.5 sm:p-2 shadow-sm text-[10px] sm:text-[11px] text-slate-700 font-medium">
                Write copy
              </div>
            )}
            {ci === 1 && (
              <>
                <div className="rounded-md border border-indigo-200 bg-indigo-50 p-1.5 sm:p-2 shadow-sm text-[10px] sm:text-[11px] text-indigo-800 font-medium ring-1 ring-indigo-300">
                  Redesign nav
                </div>
                <motion.div
                  animate={dragged ? { x: 40, y: -30, rotate: 4, scale: 1.04 } : { x: 0, y: 0, rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  onHoverStart={() => setDragged(true)}
                  onHoverEnd={() => setDragged(false)}
                  className="mt-1 cursor-grab rounded-md border border-slate-200 bg-white p-1.5 sm:p-2 shadow-md text-[10px] sm:text-[11px] text-slate-700 font-medium active:cursor-grabbing"
                >
                  <span className="flex items-center gap-1">
                    <GripVertical className="h-3 w-3 text-slate-300" />
                    API integration
                  </span>
                </motion.div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Real-time presence visual
function PresenceCard() {
  const avatars = [
    { name: "Alex", color: "bg-violet-400", typing: true },
    { name: "Sam", color: "bg-sky-400", typing: false },
    { name: "Jordan", color: "bg-emerald-400", typing: false },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-4 sm:p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" /> Live Collaboration
        </span>
        <h3 className="mt-3 text-base sm:text-lg font-bold leading-snug text-slate-900">
          See your team in real-time.
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Live cursors, presence indicators, and typing signals keep everyone aligned.
        </p>
      </div>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
        {avatars.map((av) => (
          <div key={av.name} className="flex items-center gap-2.5">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", av.color)}>
              {av.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">{av.name}</p>
            </div>
            {av.typing && (
              <div className="flex items-center gap-0.5 rounded-full bg-slate-200 px-2 py-1">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1 w-1 rounded-full bg-slate-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                  />
                ))}
              </div>
            )}
            {!av.typing && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Command K visual
function CommandKCard() {
  const suggestions = ["Create new sprint", "Assign to Alex", "Move to Done", "Set due date"];

  return (
    <div className="flex h-full flex-col justify-between p-4 sm:p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          <Command className="h-3 w-3" /> Command Palette
        </span>
        <h3 className="mt-3 text-base sm:text-lg font-bold leading-snug text-slate-900">
          Your keyboard is a superpower.
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Hit ⌘K and do anything — navigate, create, assign — without leaving the keyboard.
        </p>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-xs sm:text-sm text-slate-400">Search or run a command...</span>
          <kbd className="hidden sm:inline rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">⌘K</kbd>
        </div>
        <div className="p-1">
          {suggestions.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-xs sm:text-sm",
                i === 0 ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <ChevronRight className={cn("h-3.5 w-3.5", i === 0 ? "text-indigo-200" : "text-slate-400")} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Analytics mini card
function AnalyticsCard() {
  const bars = [40, 65, 48, 80, 55, 92, 70];
  return (
    <div className="flex h-full flex-col justify-between p-4 sm:p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <TrendingUp className="h-3 w-3" /> Analytics
        </span>
        <h3 className="mt-3 text-sm sm:text-base font-bold leading-snug text-slate-900">
          Velocity reports, at a glance.
        </h3>
      </div>
      <div className="flex items-end gap-1 pt-4 h-24">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-violet-500"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="font-semibold text-emerald-600">+24%</span> velocity this sprint
      </div>
    </div>
  );
}

// Notifications mini card
function NotifCard() {
  const notifs = [
    { text: "Alex commented on Sprint #7", time: "2m ago", unread: true },
    { text: "New task assigned: API docs", time: "14m ago", unread: true },
    { text: "Sam moved card to Done", time: "1h ago", unread: false },
  ];
  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 self-start">
        <Bell className="h-3 w-3" /> Smart Notifications
      </span>
      <h3 className="mt-3 text-sm sm:text-base font-bold leading-snug text-slate-900">
        Never miss what matters.
      </h3>
      <div className="mt-4 flex flex-col gap-2">
        {notifs.map((n, i) => (
          <div key={i} className={cn("flex items-start gap-2.5 rounded-lg p-2", n.unread ? "bg-indigo-50" : "bg-transparent")}>
            {n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}
            {!n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
            <div>
              <p className="text-[10px] sm:text-[11px] leading-snug text-slate-700 font-medium">{n.text}</p>
              <p className="text-[9px] sm:text-[10px] text-slate-400">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoGrid() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Drag card — large */}
      <Reveal className="lg:col-span-2 lg:row-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[280px] sm:min-h-[300px]">
        <DragTaskCard />
      </Reveal>

      {/* Analytics — small */}
      <Reveal delay={1} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[280px] sm:min-h-[300px]">
        <AnalyticsCard />
      </Reveal>

      {/* Presence — medium */}
      <Reveal delay={2} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[260px] sm:min-h-[280px]">
        <PresenceCard />
      </Reveal>

      {/* Command K — large */}
      <Reveal delay={3} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[260px] sm:min-h-[280px]">
        <CommandKCard />
      </Reveal>

      {/* Notif — span full on mobile, 1 col on lg */}
      <Reveal delay={4} className="sm:col-span-2 lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[240px] sm:min-h-[260px]">
        <NotifCard />
      </Reveal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats row
// ─────────────────────────────────────────────────────────────────────────────
function StatsRow() {
  const stats = [
    { value: "40k+", label: "Teams worldwide" },
    { value: "2M+", label: "Tasks completed" },
    { value: "99.98%", label: "Uptime SLA" },
    { value: "4.9", label: "Average rating", icon: <Star className="h-4 w-4 fill-amber-400 text-amber-400 inline ml-0.5" /> },
  ];
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
      {stats.map((s, i) => (
        <Reveal key={s.label} delay={i} className="text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tighter text-slate-900">
            {s.value}
            {s.icon}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">{s.label}</p>
        </Reveal>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Features List Section
// ─────────────────────────────────────────────────────────────────────────────
function FeaturesList() {
  const features = [
    { icon: <Zap className="h-5 w-5" />, title: "Lightning Fast", desc: "Sub-100ms load times. No more waiting around." },
    { icon: <Shield className="h-5 w-5" />, title: "Enterprise Security", desc: "SOC 2 Type II certified. Your data is safe." },
    { icon: <Globe className="h-5 w-5" />, title: "Works Everywhere", desc: "Web, desktop, and mobile. Always in sync." },
    { icon: <GitBranch className="h-5 w-5" />, title: "Git Integration", desc: "Connect GitHub, GitLab, or Bitbucket." },
    { icon: <Users className="h-5 w-5" />, title: "Unlimited Members", desc: "Invite your whole team. No per-seat pricing." },
    { icon: <BarChart3 className="h-5 w-5" />, title: "Advanced Analytics", desc: "Track velocity, burndown, and team health." },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900">
            Everything you need to ship faster
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Built by engineers, for engineers. No bloat, no learning curve.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i} className="group">
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      quote: "ProjectSphere transformed how our team collaborates. We shipped 40% faster in the first month.",
      author: "Sarah Chen",
      role: "Engineering Lead",
      company: "TechCorp",
      avatar: "SC",
      color: "bg-violet-500",
    },
    {
      quote: "Finally, a project management tool that doesn't get in the way. It just works.",
      author: "Marcus Johnson",
      role: "Product Manager",
      company: "StartupXYZ",
      avatar: "MJ",
      color: "bg-emerald-500",
    },
    {
      quote: "The real-time collaboration features are game-changing. Our remote team feels more connected than ever.",
      author: "Emily Park",
      role: "Design Director",
      company: "Creative Studio",
      avatar: "EP",
      color: "bg-amber-500",
    },
  ];

  return (
    <section className="bg-slate-50 py-16 sm:py-24 border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center mb-10 sm:mb-14">
          <p className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Loved by teams
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900">
            Don&apos;t just take our word for it
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.author} delay={i}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-5 sm:mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white", t.color)}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role} at {t.company}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA Section
// ─────────────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Gradient bg */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
      <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml,%3Csvg width=%2230%22 height=%2230%22 viewBox=%220 0 30 30%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z%22 fill=%22rgba(255,255,255,0.07)%22/%3E%3C/svg%3E')] opacity-50" />

      <Reveal className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs sm:text-sm font-semibold text-black">
          <Sparkles className="h-4 w-4" />
          Free to start — no credit card required
        </span>
        <h2 className="mt-6 sm:mt-8 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-black">
          Your next sprint starts here.
        </h2>
        <p className="mx-auto mt-4 sm:mt-6 max-w-lg text-black sm:text-lg text-base">
          Join 40,000+ teams who ship faster, communicate clearer, and actually enjoy their workflow.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-colors"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            View demo
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const links = {
    Product: ["Features", "Pricing", "Roadmap", "Changelog"],
    Company: ["About", "Blog", "Careers", "Press"],
    Resources: ["Docs", "API", "Community", "Status"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };
  return (
    <footer className="border-t border-slate-100 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 sm:gap-12 lg:flex-row">
          <div className="shrink-0 lg:w-64">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="ProjectSphere" width={140} height={32} className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              Project management for teams that move fast and ship great work.
            </p>
            <div className="mt-5 flex gap-4">
              {/* Social icons */}
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(links).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {cat}
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item}>
                      <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} ProjectSphere, Inc. All rights reserved.</p>
          <p>Built with care for teams that ship.</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero headline word reveal
// ─────────────────────────────────────────────────────────────────────────────
function SplitHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.07 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .before\\:animate-shimmer::before {
          animation: shimmer 2.4s infinite;
        }
      `}</style>

      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-28">
        {/* Background decoration */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 sm:px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">New: Sprints 2.0 is here</span>
              <span className="sm:hidden">Sprints 2.0 is here</span>
              <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
            </span>
          </motion.div>

          {/* Headline */}
          <div className="mx-auto max-w-4xl text-center">
            <SplitHeadline text="Velocity for Visionaries." />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-slate-500 leading-relaxed"
            >
              ProjectSphere gives high-performing teams one beautiful place to plan, build,
              and ship — with Kanban boards, sprint tracking, and real-time collaboration built in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <ShimmerButton href="/auth/signup" className="w-full sm:w-auto h-12 px-8 text-sm">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
              <motion.a
                href="#features"
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                See how it works
              </motion.a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-xs text-slate-400"
            >
              Free forever for small teams &middot; No credit card required
            </motion.p>
          </div>

          {/* 3D Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 sm:mt-16"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-slate-100 bg-white py-6 sm:py-8">
        <p className="mb-4 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">
          Trusted by teams at
        </p>
        <LogoCloud />
      </section>

      {/* Stats */}
      <section className="bg-white py-16 sm:py-20">
        <StatsRow />
      </section>

      {/* Bento features */}
      <section id="features" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center mb-10 sm:mb-14">
            <p className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Everything you need
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-900">
              Built for the way teams actually work.
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-500">
              No bloat. No learning curve. Just the features that move the needle.
            </p>
          </Reveal>

          <BentoGrid />
        </div>
      </section>

      {/* Features List */}
      <FeaturesList />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
