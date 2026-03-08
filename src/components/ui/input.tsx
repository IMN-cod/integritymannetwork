import * as React from "react";
import { cn } from "@/lib/utils";

const inputVariants = {
  default:
    "flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-white placeholder:text-zinc-500 ring-offset-background transition-all duration-200 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50",
  admin:
    "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 ring-offset-background transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50",
};

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { variant?: "default" | "admin" }
>(({ className, type, variant = "default", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants[variant], className)}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
