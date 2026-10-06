import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-900 text-white shadow-sm hover:bg-blue-800",
        secondary: "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
        mint: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function buttonClass(variant: VariantProps<typeof buttonStyles>["variant"] = "primary", size: VariantProps<typeof buttonStyles>["size"] = "md") {
  return buttonStyles({ variant, size });
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]", className)}>{children}</section>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

const badgeStyles = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    tone: {
      green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
      red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
      blue: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100",
      amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
      violet: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100",
      slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    },
  },
  defaultVariants: { tone: "slate" },
});

export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: "green" | "red" | "blue" | "amber" | "violet" | "slate"; className?: string }) {
  return <span className={cn(badgeStyles({ tone }), className)}>{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50", props.className)} />;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center"><p className="font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
}
