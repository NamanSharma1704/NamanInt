import type { ButtonHTMLAttributes, ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Link, type LinkProps } from "react-router"

import { cn } from "@/lib/utils"

const shell =
  "group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold"

/**
 * The resting label with its dot, and the face that slides in when the dot floods the pill. Spans, not divs, so
 * the markup stays valid inside a button. The focus-visible variants give a keyboard user the same flood a
 * pointer gets on hover.
 */
function HoverFaces({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="flex items-center gap-2">
        <span className="bg-primary h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8] group-focus-visible:scale-[100.8] motion-reduce:transition-none"></span>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 group-focus-visible:translate-x-12 group-focus-visible:opacity-0 motion-reduce:transition-none">
          {children}
        </span>
      </span>
      {/* A copy of the label for the eye only; assistive tech reads the resting one. */}
      <span
        aria-hidden="true"
        className="text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100 group-focus-visible:-translate-x-5 group-focus-visible:opacity-100 motion-reduce:transition-none"
      >
        <span>{children}</span>
        <ArrowRight />
      </span>
    </>
  )
}

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(shell, className)} {...props}>
      <HoverFaces>{children}</HoverFaces>
    </button>
  )
}

/** The same pill as a router link, for navigation: a button nested in a link is two tab stops for one action. */
export function InteractiveHoverLink({ children, className, ...props }: LinkProps) {
  return (
    <Link className={cn(shell, "inline-block", className)} {...props}>
      <HoverFaces>{children}</HoverFaces>
    </Link>
  )
}
