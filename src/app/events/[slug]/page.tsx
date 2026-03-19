"use client";

/* eslint-disable @next/next/no-img-element */

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  ArrowLeft,
  Share2,
  Globe,
  Phone,
  Mail,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Minus,
  Plus,
  Star,
  User,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const EVENT_TYPES: Record<string, string> = {
  INTEGRITY_SUMMIT: "Integrity Summit",
  MENS_RETREAT: "Men's Retreat",
  CORPORATE_BREAKFAST: "Corporate Breakfast",
  CORPORATE_LUNCH: "Corporate Lunch",
  WORKSHOP: "Workshop",
  OTHER: "Other",
};

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary: string | null;
  coverImage: string | null;
  type: string;
  location: string | null;
  locationUrl: string | null;
  venue: string | null;
  address: string | null;
  startDate: string;
  endDate: string | null;
  capacity: number | null;
  maxPerPerson: number;
  price: number;
  isFree: boolean;
  featured: boolean;
  status: string;
  organizer: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  schedule: string | null;
  viewCount: number;
  spotsRemaining: number | null;
  registeredCount: number;
  _count: { registrations: number };
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEvent(data.event);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const handleBook = async () => {
    if (!event) return;
    if (!session?.user && (!guestName.trim() || !guestEmail.trim())) {
      setBookingError("Please provide your name and email.");
      return;
    }

    setBooking(true);
    setBookingError("");

    try {
      const res = await fetch(`/api/events/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName || undefined,
          guestEmail: guestEmail || undefined,
          guestPhone: guestPhone || undefined,
          ticketCount,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Registration failed");
        return;
      }
      setBookingSuccess(true);
    } catch {
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-4">
        <Calendar className="w-16 h-16 text-zinc-700 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2 font-display">Event Not Found</h1>
        <p className="text-zinc-400 mb-6">This event may have been removed or doesn&apos;t exist.</p>
        <Link href="/events"><Button><ArrowLeft className="w-4 h-4" /> Back to Events</Button></Link>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = startDate < new Date() && event.status !== "ONGOING";
  const isBookable = !isPast && event.status !== "CANCELLED" && event.status !== "COMPLETED" && (event.spotsRemaining === null || event.spotsRemaining > 0);

  const formatEventDateTime = () => {
    const opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    const start = startDate.toLocaleDateString("en-US", opts);
    const time = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (!endDate) return `${start} at ${time}`;
    if (startDate.toDateString() === endDate.toDateString()) {
      const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${start} · ${time} – ${endTime}`;
    }
    return `${start} – ${endDate.toLocaleDateString("en-US", opts)}`;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        {event.coverImage && (
          <div className="absolute inset-0">
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
          </div>
        )}

        <div className="container-wide relative z-10 pt-28 sm:pt-36 pb-12 sm:pb-16">
          <motion.div {...fadeInUp}>
            <Link href="/events" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-orange-500 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge>{EVENT_TYPES[event.type] || event.type}</Badge>
              <Badge variant={event.status === "UPCOMING" ? "success" : event.status === "ONGOING" ? "warning" : "secondary"}>
                {event.status}
              </Badge>
              {event.featured && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Star className="w-3 h-3 fill-amber-400" /> Featured</Badge>}
              {event.isFree && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Free Event</Badge>}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              {event.title}
            </h1>

            {event.summary && (
              <p className="text-lg text-zinc-400 max-w-3xl mb-6">{event.summary}</p>
            )}

            <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{formatEventDateTime()}</span>
              </div>
              {(event.venue || event.location) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>{[event.venue, event.location].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {!event.isFree && (
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-white">{formatCurrency(Number(event.price))}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient" />

      {/* Content */}
      <section className="section-padding bg-zinc-50">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left — Description */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div {...fadeInUp}>
                <Card variant="light">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-zinc-900 font-display mb-6">About This Event</h2>
                    <div
                      className="prose prose-zinc max-w-none prose-headings:font-display prose-a:text-orange-600 prose-img:rounded-xl"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cover image full width */}
              {event.coverImage && (
                <motion.div {...fadeInUp}>
                  <img src={event.coverImage} alt={event.title} className="w-full rounded-2xl shadow-lg" />
                </motion.div>
              )}
            </div>

            {/* Right — Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <motion.div {...fadeInUp}>
                <Card variant="light" className="sticky top-28 overflow-hidden">
                  <div className="bg-linear-to-br from-orange-500 to-orange-600 p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium opacity-90">Event Registration</span>
                      {event.capacity && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {event.spotsRemaining !== null ? `${event.spotsRemaining} spots left` : `${event.capacity} capacity`}
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-bold font-display">
                      {event.isFree ? "Free" : formatCurrency(Number(event.price))}
                    </div>
                    {!event.isFree && <span className="text-xs opacity-75">per person</span>}
                  </div>

                  <CardContent className="p-5">
                    {bookingSuccess ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-zinc-900 mb-1">You&apos;re Registered!</h3>
                        <p className="text-sm text-zinc-600 mb-4">We look forward to seeing you at {event.title}.</p>
                        <Link href="/events"><Button variant="outline" size="sm"><ArrowLeft className="w-3.5 h-3.5" /> Browse Events</Button></Link>
                      </div>
                    ) : !isBookable ? (
                      <div className="text-center py-4">
                        <AlertCircle className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">
                          {event.status === "CANCELLED" ? "This event has been cancelled." :
                           event.status === "COMPLETED" ? "This event has already ended." :
                           event.spotsRemaining === 0 ? "This event is fully booked." :
                           "Registration is currently closed."}
                        </p>
                      </div>
                    ) : !showBooking ? (
                      <Button className="w-full" size="lg" onClick={() => setShowBooking(true)}>
                        <Ticket className="w-4 h-4" /> Register Now
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* Ticket count */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Number of Tickets</label>
                          <div className="flex items-center gap-3 justify-center bg-zinc-50 rounded-lg p-2">
                            <button
                              onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                              className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:border-orange-300 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xl font-bold text-zinc-900 w-8 text-center">{ticketCount}</span>
                            <button
                              onClick={() => setTicketCount(Math.min(event.maxPerPerson, ticketCount + 1))}
                              className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:border-orange-300 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-400 text-center mt-1">Max {event.maxPerPerson} per person</p>
                        </div>

                        {/* Guest info (only if not logged in) */}
                        {!session?.user && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-zinc-600 mb-1.5"><User className="w-3 h-3 inline mr-1" />Full Name *</label>
                              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" className="text-sm border-zinc-200" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-600 mb-1.5"><Mail className="w-3 h-3 inline mr-1" />Email *</label>
                              <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="john@example.com" className="text-sm border-zinc-200" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-600 mb-1.5"><Phone className="w-3 h-3 inline mr-1" />Phone (optional)</label>
                              <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+233 ..." className="text-sm border-zinc-200" />
                            </div>
                          </>
                        )}

                        {session?.user && (
                          <div className="bg-zinc-50 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900">Registering as {session.user.name}</p>
                              <p className="text-xs text-zinc-500">{session.user.email}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Notes (optional)</label>
                          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements..." rows={2} className="text-sm border-zinc-200" />
                        </div>

                        {!event.isFree && (
                          <div className="bg-zinc-50 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-sm text-zinc-600">Total</span>
                            <span className="text-lg font-bold text-zinc-900">{formatCurrency(Number(event.price) * ticketCount)}</span>
                          </div>
                        )}

                        {bookingError && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{bookingError}</span>
                          </div>
                        )}

                        <Button className="w-full" size="lg" onClick={handleBook} disabled={booking}>
                          {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {booking ? "Registering..." : "Confirm Registration"}
                        </Button>

                        <button onClick={() => setShowBooking(false)} className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Event Details Card */}
              <motion.div {...fadeInUp}>
                <Card variant="light">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider">Event Details</h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-zinc-900">Date & Time</p>
                          <p className="text-zinc-500">{formatEventDateTime()}</p>
                          {event.schedule && <p className="text-zinc-400 text-xs mt-0.5">{event.schedule}</p>}
                        </div>
                      </div>

                      {(event.venue || event.location) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-zinc-900">Venue</p>
                            {event.venue && <p className="text-zinc-500">{event.venue}</p>}
                            {event.location && <p className="text-zinc-500">{event.location}</p>}
                            {event.address && <p className="text-zinc-400 text-xs mt-0.5">{event.address}</p>}
                            {event.locationUrl && (
                              <a href={event.locationUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 text-xs hover:underline flex items-center gap-1 mt-1">
                                <Globe className="w-3 h-3" /> View on Map
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {event.organizer && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-zinc-900">Organizer</p>
                            <p className="text-zinc-500">{event.organizer}</p>
                          </div>
                        </div>
                      )}

                      {event.capacity && (
                        <div className="flex items-start gap-3">
                          <Users className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-zinc-900">Capacity</p>
                            <p className="text-zinc-500">{event.registeredCount} / {event.capacity} registered</p>
                            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {(event.contactEmail || event.contactPhone) && (
                        <>
                          <hr className="border-zinc-100" />
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Contact</p>
                          {event.contactEmail && (
                            <a href={`mailto:${event.contactEmail}`} className="flex items-center gap-2 text-zinc-600 hover:text-orange-500 transition-colors">
                              <Mail className="w-4 h-4" />
                              <span>{event.contactEmail}</span>
                            </a>
                          )}
                          {event.contactPhone && (
                            <a href={`tel:${event.contactPhone}`} className="flex items-center gap-2 text-zinc-600 hover:text-orange-500 transition-colors">
                              <Phone className="w-4 h-4" />
                              <span>{event.contactPhone}</span>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Share */}
              <motion.div {...fadeInUp}>
                <Card variant="light">
                  <CardContent className="p-5">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: event.title, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 text-sm text-zinc-600 hover:text-orange-500 transition-colors py-2"
                    >
                      <Share2 className="w-4 h-4" /> Share This Event
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
