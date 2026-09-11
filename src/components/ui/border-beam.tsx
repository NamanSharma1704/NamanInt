"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

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
                animate={{ strokeDashoffset: reverse ? 0 : -100 }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration,
                }}
            />
        </svg>
    );
};
