"use client"

import { useState, useEffect, Fragment } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Download, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Attempt, User, Question } from "@/lib/types"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface AttemptWithDetails extends Attempt {
    user_email?: string;
}

export default function AdminDashboard() {
    const [attempts, setAttempts] = useState<AttemptWithDetails[]>([])
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()

    const fetchData = async () => {
        setLoading(true)
        const userId = localStorage.getItem('userId')

        if (!userId) {
            router.push('/')
            return
        }

        // Server-side role verification
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .maybeSingle()

        if (userError || !userData || userData.role !== 'admin') {
            console.error("Unauthorized access attempt or user not found")
            router.push('/')
            return
        }

        try {
            // Fetch questions to map IDs to text
            const { data: questionsData } = await supabase
                .from('questions')
                .select('*')
                .order('id')

            if (questionsData) {
                setQuestions(questionsData.map(q => ({
                    ...q,
                    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                })))
            }

            // Fetch attempts with user data
            // Supabase join syntax: select('*, users(email)')
            const { data: attemptsData, error } = await supabase
                .from('attempts')
                .select('*, users(email)')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (attemptsData) {
                const formattedAttempts = attemptsData.map(a => ({
                    ...a,
                    user_email: (a.users as any)?.email // Adjust based on actual response structure
                }))
                setAttempts(formattedAttempts)
            }

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [router])

    const toggleExpand = (id: string) => {
        setExpandedAttemptId(expandedAttemptId === id ? null : id)
    }

    const filteredAttempts = attempts.filter(attempt =>
        attempt.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleExportCSV = () => {
        if (attempts.length === 0) return

        const headers = ["Student Email", "Score", "Total Questions", "Percentage", "Date", "Violations"]
        const csvRows = [headers.join(",")]

        attempts.forEach(attempt => {
            const percentage = ((attempt.score / questions.length) * 100).toFixed(1) + "%"
            const row = [
                attempt.user_email || "Unknown",
                attempt.score,
                questions.length,
                percentage,
                new Date(attempt.created_at).toLocaleDateString(),
                attempt.violations
            ]
            csvRows.push(row.join(","))
        })

        const csvContent = csvRows.join("\n")
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Overview of student performance and results</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => router.push('/admin/questions')}>
                        Manage Questions
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="default"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleExportCSV}
                        disabled={attempts.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by student email..."
                            className="pl-9 bg-zinc-950/50 border-zinc-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-zinc-800 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-800/50 text-zinc-400 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3">Score</th>
                                    <th className="px-6 py-3">Percentage</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Violations</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredAttempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                            No attempts found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttempts.map((attempt) => (
                                        <Fragment key={attempt.id}>
                                            <tr key={attempt.id} className="bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {attempt.user_email || 'Unknown User'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${attempt.score >= 10 ? 'bg-green-500/10 text-green-500' :
                                                            attempt.score >= 5 ? 'bg-yellow-500/10 text-yellow-500' :
                                                                'bg-red-500/10 text-red-500'}
                          `}>
                                                        {attempt.score} / {questions.length}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-zinc-300">
                                                        {((attempt.score / questions.length) * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400">
                                                    {new Date(attempt.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400">
                                                    {attempt.violations}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/admin/profile/${attempt.user_id}`)}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        View Profile
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpand(attempt.id)}
                                                        className="text-purple-400 hover:text-purple-300"
                                                    >
                                                        {expandedAttemptId === attempt.id ? (
                                                            <>Hide Details <ChevronUp className="ml-1 h-4 w-4" /></>
                                                        ) : (
                                                            <>View Details <ChevronDown className="ml-1 h-4 w-4" /></>
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                            {expandedAttemptId === attempt.id && (
                                                <tr className="bg-zinc-950/50">
                                                    <td colSpan={5} className="px-6 py-4">
                                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            {questions.map((q) => {
                                                                const userAnswer = attempt.answers[q.id];
                                                                const isCoding = q.type === 'coding';
                                                                const isCorrect = !isCoding && userAnswer === q.correct_option;

                                                                return (
                                                                    <div
                                                                        key={q.id}
                                                                        className={`
                                                                                p-3 rounded-lg border text-xs
                                                                                ${isCoding ? 'border-blue-900/50 bg-blue-900/10' :
                                                                                isCorrect ? 'border-green-900/50 bg-green-900/10' :
                                                                                    'border-red-900/50 bg-red-900/10'}
                                                                                `}
                                                                    >
                                                                        <div className="font-medium text-zinc-300 mb-1">
                                                                            <MarkdownRenderer content={q.question_text} className="prose-p:mt-0 text-[11px]" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className={isCoding ? "text-blue-400" : isCorrect ? "text-green-500" : "text-red-500"}>
                                                                                <span className="font-bold mr-1">{isCoding ? "Response:" : "User:"}</span>
                                                                                {userAnswer !== undefined ? (
                                                                                    isCoding ? (
                                                                                        <pre className="mt-1 p-2 bg-black/40 rounded border border-white/5 font-mono text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                                                            {userAnswer}
                                                                                        </pre>
                                                                                    ) : (
                                                                                        <MarkdownRenderer content={q.options?.[userAnswer as number] || 'Error'} className="prose-p:my-0 text-[11px] inline-block" />
                                                                                    )
                                                                                ) : 'Skipped'}
                                                                            </div>
                                                                            {!isCoding && !isCorrect && q.correct_option !== undefined && (
                                                                                <div className="text-green-500/70">
                                                                                    <span className="font-bold mr-1">Correct:</span>
                                                                                    <MarkdownRenderer content={q.options?.[q.correct_option] || 'Error'} className="prose-p:my-0 text-[11px] inline-block" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
