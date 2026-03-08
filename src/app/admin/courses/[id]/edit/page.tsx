"use client";

import { use } from "react";
import CourseEditor from "@/components/admin/CourseEditor";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CourseEditor courseId={id} />;
}
