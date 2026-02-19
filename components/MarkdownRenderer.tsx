"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
    // Auto-detection for raw code strings (e.g., from DB entries without backticks)
    const processedContent = (() => {
        if (!content) return ""

        // If it already has markdown code blocks or inline code, use as is
        if (content.includes('`')) return content

        // Detection patterns for raw code
        const codePatterns = [
            /#include/, /import .* from/, /public class/, /def .*\(.*\):/,
            /function.*\{/, /int main/, /\{[\s\S]*\}/, /;[\s\n]*$/m,
            /\[[\s\S]*\]/
        ]

        const isLikelyCode = codePatterns.some(pattern => pattern.test(content))

        if (isLikelyCode) {
            // Check if it looks like C/C++ (common in the provided example)
            const lang = content.includes('#include') ? 'cpp' : ''
            return `\`\`\`${lang}\n${content}\n\`\`\``
        }

        return content
    })()

    return (
        <div className={cn("prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')

                        if (!inline && match) {
                            return (
                                <div className="rounded-lg overflow-hidden my-4 border border-zinc-800 shadow-lg">
                                    <div className="bg-zinc-800 px-4 py-1 text-[10px] font-mono text-zinc-400 border-b border-zinc-700/50 flex justify-between items-center">
                                        <span>{match[1].toUpperCase()}</span>
                                    </div>
                                    <SyntaxHighlighter
                                        {...props}
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            padding: '1.25rem',
                                            fontSize: '0.875rem',
                                            background: '#0a0a0a',
                                        }}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            )
                        }

                        if (!inline) {
                            return (
                                <pre className="bg-[#0a0a0a] p-4 rounded-lg overflow-x-auto border border-zinc-800 my-4 text-zinc-300 font-mono text-sm leading-relaxed">
                                    {children}
                                </pre>
                            )
                        }

                        return (
                            <code className={cn("bg-zinc-800/10 px-1.5 py-0.5 rounded text-primary font-mono text-sm border border-primary/10", className)} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}
