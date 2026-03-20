"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  ArrowRight,
  Users,
  Clock,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  Target,
  Shield,
  Award,
  Compass,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { ProtectedImage } from "@/components/ui/video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatCurrency } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

interface CourseCard {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  instructor: string | null;
  duration: string | null;
  level: string;
  category: string | null;
  price: number;
  isFree: boolean;
  featured: boolean;
  status: string;
  maxStudents: number | null;
  enrollmentCount: number;
  startDate: string | null;
  endDate: string | null;
  learningOutcomes: string | null;
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const FILTER_TABS = [
  { key: "all", label: "All Courses" },
  { key: "BEGINNER", label: "Beginner" },
  { key: "INTERMEDIATE", label: "Intermediate" },
  { key: "ADVANCED", label: "Advanced" },
];

// ─── HERO ───
function SchoolHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0">
        <ProtectedImage
          src="/images/god-work.jpg"
          alt="School of Integrity"
          fill
          className="object-cover opacity-15"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
      </div>
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5 sm:mb-8">
            <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500">
              School of Integrity
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
            Forming Men from the{" "}
            <span className="text-gradient">Inside Out</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            In a world where information is abundant but formation is rare, the
            School of Integrity is a structured environment for deep character
            development, doctrinal grounding, and purpose alignment.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── PILLARS SECTION ───
function PillarsSection() {
  const pillars = [
    {
      icon: BookOpen,
      title: "Think Biblically",
      description:
        "Grounded in Scripture, our curriculum builds a solid doctrinal foundation that shapes how men understand their identity and purpose.",
    },
    {
      icon: Shield,
      title: "Live Righteously",
      description:
        "We equip men with the character and conviction needed to live lives of integrity in every sphere — home, work, and community.",
    },
    {
      icon: Target,
      title: "Lead Responsibly",
      description:
        "Our courses develop leadership capacity rooted in servanthood, accountability, and the advancement of God's Kingdom.",
    },
    {
      icon: Compass,
      title: "Work Purposefully",
      description:
        "Men are trained to align their daily work with their divine assignment, transforming their labor into lasting legacy.",
    },
  ];

  return (
    <section className="section-padding bg-zinc-900/30 bg-radial-dark">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Our Pillars"
            title="What We Teach"
            description="Every course in the School of Integrity is built on four foundational pillars that guide men toward true formation."
          />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10 sm:mt-14">
          {pillars.map((pillar, i) => (
            <motion.div key={pillar.title} {...fadeInUp} transition={{ ...fadeInUp.transition, delay: i * 0.1 }}>
              <Card className="bg-zinc-900/50 h-full">
                <CardContent className="p-5 sm:p-6">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                    <pillar.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURED COURSE BANNER ───
function FeaturedCourseBanner({ course }: { course: CourseCard }) {
  return (
    <motion.div {...fadeInUp}>
      <Card className="bg-zinc-900/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative aspect-video lg:aspect-auto lg:min-h-80 overflow-hidden">
              {course.coverImage ? (
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-white/30" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge className="bg-orange-500 text-white border-0">
                  <Star className="w-3 h-3 fill-white" /> Featured
                </Badge>
              </div>
            </div>
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                {course.category && <Badge>{course.category}</Badge>}
                <Badge
                  className={LEVEL_COLORS[course.level] || ""}
                >
                  {LEVEL_LABELS[course.level] || course.level}
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-3">
                {course.title}
              </h2>
              {course.summary && (
                <ExpandableSummary
                  summary={course.summary}
                  textClassName="text-zinc-400 text-sm sm:text-base"
                />
              )}
              <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                {course.instructor && (
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-orange-500" />
                    {course.instructor}
                  </span>
                )}
                {course.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {course.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-500" />
                  {course.enrollmentCount} enrolled
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  {course.isFree ? "Free" : formatCurrency(Number(course.price))}
                </span>
              </div>
              <div className="mt-6">
                <a href="#enroll">
                  <Button size="lg" className="group/btn">
                    Enroll Now
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ExpandableSummary({
  summary,
  textClassName,
}: {
  summary: string;
  textClassName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = summary.length > 180;

  return (
    <div className="mb-4">
      <p className={`${textClassName} leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
        {summary}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// ─── COURSE CARD ───
function CourseCardItem({ course }: { course: CourseCard }) {
  const spotsLeft =
    course.maxStudents && course.maxStudents > 0
      ? course.maxStudents - course.enrollmentCount
      : null;

  return (
    <motion.div {...fadeInUp}>
      <Card className="bg-zinc-900/50 overflow-hidden group h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden">
          {course.coverImage ? (
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-zinc-700" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className={LEVEL_COLORS[course.level] || ""}>
              {LEVEL_LABELS[course.level] || course.level}
            </Badge>
          </div>
          {course.isFree && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-emerald-500/90 text-white border-0">
                Free
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
          {course.category && (
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500 mb-2">
              {course.category}
            </span>
          )}
          <h3 className="font-display text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
            {course.title}
          </h3>
          {course.summary && (
            <ExpandableSummary
              summary={course.summary}
              textClassName="text-xs sm:text-sm text-zinc-400"
            />
          )}

          <div className="mt-auto space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              {course.instructor && (
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-orange-500/70" />
                  {course.instructor}
                </span>
              )}
              {course.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-500/70" />
                  {course.duration}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-orange-500/70" />
                {course.enrollmentCount} enrolled
              </span>
            </div>

            {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
              <p className="text-[10px] text-amber-400 font-medium">
                Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-sm font-bold text-white">
                {course.isFree ? "Free" : formatCurrency(Number(course.price))}
              </span>
              <a href="#enroll">
                <Button size="sm" variant="ghost" className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10">
                  Enroll <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── ENROLLMENT FORM ───
function EnrollmentForm({ courses }: { courses: CourseCard[] }) {
  const [formData, setFormData] = useState({
    courseId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.courseId) {
      setError("Please select a course");
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/school/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll");
      setSuccess(true);
      setFormData({ courseId: "", firstName: "", lastName: "", email: "", phone: "", notes: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section id="enroll" className="section-padding">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
                Enrollment Submitted!
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mb-6">
                Thank you for enrolling in the School of Integrity. We&apos;ll
                send a confirmation to your email with course details and next
                steps.
              </p>
              <Button onClick={() => setSuccess(false)} variant="outline">
                Enroll in Another Course
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="enroll" className="section-padding bg-zinc-900/30 bg-radial-dark">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Get Started"
            title="Enroll Today"
            description="Ready to begin your journey of formation? Select a course and fill in your details below."
          />
        </motion.div>

        <motion.div {...fadeInUp} className="max-w-2xl mx-auto mt-10 sm:mt-14">
          <Card className="bg-zinc-900/50">
            <CardContent className="p-4 sm:p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {/* Course Selection */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-zinc-300 block mb-2">
                    Select Course <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, courseId: e.target.value }))
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 text-sm text-white px-4 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                        {c.isFree ? " — Free" : ` — ${formatCurrency(Number(c.price))}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-zinc-300 block mb-2">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      placeholder="Your first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-zinc-300 block mb-2">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      placeholder="Your last name"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-zinc-300 block mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-zinc-300 block mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+233 XX XXX XXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-zinc-300 block mb-2">
                    Additional Notes
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Any questions or special requirements..."
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      Submit Enrollment
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] sm:text-xs text-zinc-500">
                  By enrolling, you agree to our{" "}
                  <Link href="/terms" className="text-orange-500 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-orange-500 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ───
function SchoolCTA() {
  return (
    <section className="section-padding bg-linear-to-br from-orange-600 via-orange-500 to-amber-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="container-wide relative z-10 text-center">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Begin Your Journey of Formation
          </h2>
          <p className="text-sm sm:text-lg text-white/80 mb-6 sm:mb-10 max-w-2xl mx-auto">
            The School of Integrity is more than education — it is transformation.
            Join men who are committed to being formed from the inside out.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a href="#enroll">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 border-0"
              >
                Enroll Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── MAIN PAGE ───
export default function SchoolOfIntegrityPage() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [featured, setFeatured] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (searchQuery) params.set("search", searchQuery);
      if (levelFilter !== "all") params.set("level", levelFilter);

      const res = await fetch(`/api/school?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourses(data.courses);
      setFeatured(data.featured || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, levelFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, levelFilter]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <SchoolHero />

      <div className="divider-gradient" />

      <PillarsSection />

      <div className="divider-gradient" />

      {/* FEATURED COURSE */}
      {featured.length > 0 && (
        <>
          <section className="section-padding">
            <div className="container-wide">
              <motion.div {...fadeInUp}>
                <SectionHeading
                  label="Featured"
                  title="Spotlight Course"
                  description="Our recommended course for men ready to take the next step in their formation journey."
                />
              </motion.div>
              <div className="mt-10 sm:mt-14">
                <FeaturedCourseBanner course={featured[0]} />
              </div>
            </div>
          </section>
          <div className="divider-gradient" />
        </>
      )}

      {/* COURSE LISTING */}
      <section className="section-padding">
        <div className="container-wide">
          <motion.div {...fadeInUp}>
            <SectionHeading
              label="Courses"
              title="Explore Our Curriculum"
              description="Browse courses designed to equip you for purposeful living and righteous leadership."
            />
          </motion.div>

          {/* Filters */}
          <motion.div {...fadeInUp} className="mt-8 sm:mt-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-1 overflow-x-auto mobile-scroll-x pb-2 sm:pb-0">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setLevelFilter(tab.key)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      levelFilter === tab.key
                        ? "bg-orange-500 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <div className="relative w-full sm:w-auto sm:min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </motion.div>

          {/* Course Grid */}
          <div className="mt-8 sm:mt-10">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCardItem key={course.id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <span className="text-xs sm:text-sm text-zinc-500 px-3">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <motion.div {...fadeInUp} className="text-center py-16">
                <GraduationCap className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-1">No courses found</p>
                <p className="text-xs text-zinc-500">
                  {searchQuery || levelFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "New courses are being prepared. Check back soon!"}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="divider-gradient" />

      {/* ENROLLMENT FORM */}
      <EnrollmentForm courses={courses.length > 0 ? courses : featured} />

      <div className="divider-gradient" />

      <SchoolCTA />
    </div>
  );
}
