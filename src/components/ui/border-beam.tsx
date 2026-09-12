"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

interface BorderBeamProps {
    className?: string;
    size?: number;
    duration?: number;
    borderWidth?: number;
    colorFrom?: string;
    colorTo?: string;
    borderRadius?: number;
    reverse?: boolean;
}

export const BorderBeam = ({
    className,
    duration = 12,
    borderWidth = 1.5,
    colorFrom = "#0E7B7A",
    colorTo = "#2DD4BF",
    borderRadius = 16,
    reverse = false,
}: BorderBeamProps) => {
    const rawId = useId();
    const id = `border-beam-${rawId.replace(/:/g, "")}`;
    // `strokeDashoffset` is neither a transform nor a layout property, so
    // motion's own reduced-motion handling does not cover it. The beam is
    // purely decorative: under reduced motion the card keeps its gradient
    // border and loses only the travelling highlight.
    const prefersReducedMotion = usePrefersReducedMotion();

    return (
        <svg
            className={cn(
                "pointer-events-none absolute inset-0 z-10 h-full w-full rounded-[inherit]",
                className,
            )}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
                    <stop offset="50%" stopColor={colorTo} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={colorFrom} stopOpacity="0.2" />
                </linearGradient>
            </defs>
            <motion.rect
                x={borderWidth / 2}
                y={borderWidth / 2}
                width={`calc(100% - ${borderWidth}px)`}
                height={`calc(100% - ${borderWidth}px)`}
                rx={Math.max(0, borderRadius - borderWidth / 2)}
                ry={Math.max(0, borderRadius - borderWidth / 2)}
                fill="none"
                stroke={`url(#${id})`}
                strokeWidth={borderWidth}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="24 76"
                initial={{ strokeDashoffset: reverse ? -100 : 0 }}
                animate={
                    prefersReducedMotion
                        ? { strokeDashoffset: reverse ? -100 : 0 }
                        : { strokeDashoffset: reverse ? 0 : -100 }
                }
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : { repeat: Infinity, ease: "linear", duration }
                }
            />
        </svg>
    );
};
