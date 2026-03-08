"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  Users,
  Clock,
  Ticket,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { ProtectedImage } from "@/components/ui/video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface EventCard {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  type: string;
  location: string | null;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  capacity: number | null;
  price: number;
  isFree: boolean;
  featured: boolean;
  status: string;
  organizer: string | null;
  _count: { registrations: number };
}

const EVENT_TYPES: Record<string, string> = {
  INTEGRITY_SUMMIT: "Integrity Summit",
  MENS_RETREAT: "Men's Retreat",
  CORPORATE_BREAKFAST: "Corporate Breakfast",
  CORPORATE_LUNCH: "Corporate Lunch",
  WORKSHOP: "Workshop",
  OTHER: "Other",
};

const FILTER_TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All Events" },
  { key: "past", label: "Past Events" },
];

// ─── HERO ───
function EventsHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0">
        <ProtectedImage src="/images/god-work.jpg" alt="God Work Integrity" fill className="object-cover opacity-20" priority />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
      </div>
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="container-wide relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5 sm:mb-8">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500">Our Gatherings</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
            Events & <span className="text-gradient">Gatherings</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            The Integrity Man Network hosts regular gatherings that go beyond entertainment — they are strategic, intentional, and purpose-centered.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FEATURED EVENT BANNER ───
function FeaturedBanner({ event }: { event: EventCard }) {
  const startDate = new Date(event.startDate);
  return (
    <motion.div {...fadeInUp}>
      <Link href={`/events/${event.slug}`} className="block group">
        <Card variant="light" className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative aspect-video lg:aspect-auto lg:min-h-80 overflow-hidden">
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white/30" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge className="bg-orange-500 text-white border-0"><Star className="w-3 h-3 fill-white" /> Featured</Badge>
                </div>
              </div>
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Badge>{EVENT_TYPES[event.type] || event.type}</Badge>
                  <Badge variant={event.status === "UPCOMING" ? "success" : event.status === "ONGOING" ? "warning" : "secondary"}>
                    {event.status}
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-display mb-3 group-hover:text-orange-600 transition-colors">
                  {event.title}
                </h2>
                {event.summary && <p className="text-zinc-600 text-sm sm:text-base mb-4 line-clamp-3">{event.summary}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  {(event.venue || event.location) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      {event.venue || event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-orange-500" />
                    {event.isFree ? "Free" : formatCurrency(Number(event.price))}
                  </span>
                </div>
                <div className="mt-6">
                  <Button size="lg" className="group/btn">
                    View Details <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// ─── EVENT CARD ───
function EventCardItem({ event }: { event: EventCard }) {
  const startDate = new Date(event.startDate);
  const isPast = startDate < new Date();

  return (
    <motion.div {...fadeInUp}>
      <Link href={`/events/${event.slug}`} className="group block h-full">
        <Card variant="light" className="h-full overflow-hidden hover:border-orange-300 transition-colors">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="relative aspect-video overflow-hidden">
              {event.coverImage ? (
                <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-zinc-300" />
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <Badge className="text-[10px] px-2 py-0.5">{EVENT_TYPES[event.type] || event.type}</Badge>
              </div>
              <div className="absolute top-3 right-3">
                {event.isFree ? (
                  <Badge className="bg-emerald-500 text-white border-0 text-[10px]">Free</Badge>
                ) : (
                  <Badge className="bg-zinc-900 text-white border-0 text-[10px]">{formatCurrency(Number(event.price))}</Badge>
                )}
              </div>
              {isPast && (
                <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
                  <span className="text-white font-medium text-sm bg-zinc-900/70 px-3 py-1 rounded-full">Past Event</span>
                </div>
              )}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>{startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {event.endDate && startDate.toDateString() !== new Date(event.endDate).toDateString() && (
                  <span>– {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
              </div>
              <h3 className="font-display text-lg font-bold text-zinc-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                {event.title}
              </h3>
              {event.summary && <p className="text-sm text-zinc-600 line-clamp-2 mb-3 flex-1">{event.summary}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {(event.venue || event.location) && (
                    <span className="flex items-center gap-1 truncate max-w-35"><MapPin className="w-3 h-3" />{event.venue || event.location}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-orange-500 group-hover:text-orange-600 transition-colors flex items-center gap-1">
                  Details <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// ─── CTA SECTION ───
function EventsCTA() {
  return (
    <section className="section-padding bg-linear-to-br from-orange-600 via-orange-500 to-orange-700 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      </div>

      <div className="container-wide relative z-10 text-center">
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">Ready to Attend?</h2>
          <p className="text-zinc-900 text-sm sm:text-lg mb-8 sm:mb-10 leading-relaxed">
            Stay connected for upcoming event announcements, early registrations, and exclusive access to our gatherings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/contact" className="block sm:inline">
              <Button variant="white" size="xl" className="w-full sm:w-auto">Get Notified<ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/join" className="block sm:inline">
              <Button variant="outline" size="xl" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">Join The Network</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── MAIN PAGE ───
export default function EventsPage() {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [featured, setFeatured] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9", filter });
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      if (data.featured) setFeatured(data.featured);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchQuery, typeFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { setPage(1); }, [filter, searchQuery, typeFilter]);

  return (
    <>
      <EventsHero />
      <div className="divider-gradient" />

      {/* Featured Events */}
      {featured.length > 0 && filter === "upcoming" && page === 1 && !searchQuery && (
        <section className="section-padding">
          <div className="container-wide space-y-8">
            {featured.map((evt) => (
              <FeaturedBanner key={evt.id} event={evt} />
            ))}
          </div>
        </section>
      )}

      {/* All Events */}
      <section className="section-padding bg-zinc-50">
        <div className="container-wide">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <SectionHeading title="Browse Events" description="Discover our upcoming and past gatherings" align="center" />
          </motion.div>

          {/* Filters */}
          <motion.div {...fadeInUp} className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-1 bg-white rounded-lg border border-zinc-200 p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === tab.key
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-sm px-3 min-w-35"
                >
                  <option value="">All Types</option>
                  {Object.entries(EVENT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="pl-10 h-10 border-zinc-200 bg-white text-zinc-900"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : events.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCardItem key={event.id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="border-zinc-300 text-zinc-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <span className="text-sm text-zinc-500">
                    Page {page} of {totalPages} · {total} events
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="border-zinc-300 text-zinc-700"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-zinc-700 mb-2">No events found</p>
              <p className="text-sm text-zinc-500">
                {searchQuery ? "Try a different search term." : "Check back soon for upcoming events."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="divider-gradient" />
      <EventsCTA />
    </>
  );
}
