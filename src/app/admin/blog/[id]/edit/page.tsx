"use client";

import { use } from "react";
import BlogEditorPage from "@/components/admin/BlogEditor";

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BlogEditorPage postId={id} />;
}
