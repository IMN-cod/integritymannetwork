"use client";

import { use } from "react";
import EventEditor from "@/components/admin/EventEditor";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EventEditor eventId={id} />;
}
