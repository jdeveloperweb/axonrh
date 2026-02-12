"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"


export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    const defaultClassNames = getDefaultClassNames();
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                today: "border border-[var(--color-primary)] rounded-md",
                selected: "bg-[var(--color-primary)] text-white rounded-md",
                range_middle: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                range_end: "bg-[var(--color-primary)] text-white rounded-md",
                range_start: "bg-[var(--color-primary)] text-white rounded-md",
                chevron: `${defaultClassNames.chevron} fill-[var(--color-primary)]`,
                ...classNames,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
