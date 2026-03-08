import * as React from "react";
import { cn } from "@/lib/utils";

const textareaVariants = {
  default:
    "flex min-h-30 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500 ring-offset-background transition-all duration-200 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  admin:
    "flex min-h-30 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 ring-offset-background transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
};

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { variant?: "default" | "admin" }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <textarea
      className={cn(textareaVariants[variant], className)}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
