"use client"

import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
    content: string
    className?: string
}

/**
 * Renders text content preserving all whitespace, indentation, tabs, and
 * newlines exactly as typed — like a <pre> block but with wrapping enabled.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    if (!content) return null

    return (
        <pre
            className={cn(
                // Preserve every space, tab, and newline exactly as typed
                "whitespace-pre-wrap",
                // Wrap long lines instead of overflowing
                "break-words",
                // Use monospace font for code-like content
                "font-mono",
                // Match surrounding text size / colour
                "text-sm leading-relaxed text-zinc-200",
                // Remove default <pre> margin
                "m-0",
                className
            )}
        >
            {content}
        </pre>
    )
}
