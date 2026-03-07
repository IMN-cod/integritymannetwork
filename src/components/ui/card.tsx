import { cn } from "@/lib/utils";

const cardVariants = {
  default:
    "rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm shadow-lg shadow-black/20 transition-all duration-300 hover:border-zinc-700/80 text-zinc-100",
  light:
    "rounded-2xl bg-white shadow-xl shadow-black/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-0.5 text-zinc-900",
  admin:
    "rounded-2xl bg-white border border-gray-200 shadow-sm transition-all duration-300 text-gray-900",
};

function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "light" | "admin" }) {
  return (
    <div
      className={cn(cardVariants[variant], className)}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl font-bold leading-tight tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
