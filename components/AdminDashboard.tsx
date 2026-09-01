"use client"

import { useState, useEffect, Fragment } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Download, RefreshCw, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, LogOut, Calendar, X } from "lucide-react"
import { Attempt, Question } from "@/lib/types"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface AttemptWithDetails extends Attempt {
    user_email?: string;
    user_full_name?: string;
}

export default function AdminDashboard() {
    const [attempts, setAttempts] = useState<AttemptWithDetails[]>([])
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: 'user_full_name' | 'user_email' | 'score' | 'created_at' | null, direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'desc'
    })
    const router = useRouter()

    const fetchData = async () => {
        setLoading(true)

        // Server-side role verification via API
        try {
            const res = await fetch('/api/auth/me')
            if (!res.ok) {
                router.push('/')
                return
            }
            const { user } = await res.json()
            if (user?.role !== 'admin') {
                router.push('/')
                return
            }
        } catch (err) {
            console.error("Auth check failed", err)
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

            // Fetch profiles to get full names
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('user_id, full_name')

            const profileMap = new Map<string, string>()
            if (profilesData) {
                profilesData.forEach(p => {
                    if (p.user_id && p.full_name) {
                        profileMap.set(p.user_id, p.full_name)
                    }
                })
            }

            if (attemptsData) {
                const formattedAttempts = attemptsData.map(a => ({
                    ...a,
                    user_email: (a.users as { email?: string } | null)?.email,
                    user_full_name: profileMap.get(a.user_id) || 'Unknown'
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

    const handleSort = (key: 'user_full_name' | 'user_email' | 'score' | 'created_at') => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredAttempts = attempts
        .filter(attempt => {
            const matchesEmail = (attempt.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
            const matchesName = (attempt.user_full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            
            let matchesDate = true
            if (selectedDate) {
                const attemptDate = new Date(attempt.created_at)
                const year = attemptDate.getFullYear()
                const month = String(attemptDate.getMonth() + 1).padStart(2, '0')
                const day = String(attemptDate.getDate()).padStart(2, '0')
                const formattedDate = `${year}-${month}-${day}`
                matchesDate = formattedDate === selectedDate
            }

            return (matchesEmail || matchesName) && matchesDate
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0

            if (sortConfig.key === 'user_full_name') {
                const valA = (a.user_full_name || '').toLowerCase()
                const valB = (b.user_full_name || '').toLowerCase()
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            }

            if (sortConfig.key === 'user_email') {
                const valA = (a.user_email || '').toLowerCase()
                const valB = (b.user_email || '').toLowerCase()
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            }

            if (sortConfig.key === 'score') {
                const valA = a.score
                const valB = b.score
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            }

            if (sortConfig.key === 'created_at') {
                const valA = new Date(a.created_at).getTime()
                const valB = new Date(b.created_at).getTime()
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            }

            return 0
        })

    const handleExportCSV = () => {
        const listToExport = filteredAttempts.length > 0 ? filteredAttempts : attempts
        if (listToExport.length === 0) return

        const headers = ["Full Name", "Student Email", "Score", "Total Questions", "Percentage", "Date", "Violations"]
        const csvRows = [headers.join(",")]

        listToExport.forEach(attempt => {
            const percentage = ((attempt.score / questions.length) * 100).toFixed(1) + "%"
            const fullNameSafe = `"${(attempt.user_full_name || "Unknown").replace(/"/g, '""')}"`
            const row = [
                fullNameSafe,
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
        a.download = `quiz-results-${selectedDate ? selectedDate + '-' : ''}${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/')
        } catch (err) {
            console.error('Logout failed:', err)
        }
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
                    <Button variant="destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <CardHeader className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Search by student name or email..."
                                className="pl-9 pr-9 bg-zinc-950/50 border-zinc-800"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    title="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center flex-1 sm:flex-initial">
                                <Calendar className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="pl-9 pr-3 bg-zinc-950/50 border-zinc-800 text-zinc-200 [color-scheme:dark] w-full sm:w-auto"
                                    title="Filter by date"
                                />
                            </div>
                            {selectedDate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDate("")}
                                    className="text-zinc-400 hover:text-white px-2.5 h-10 border border-zinc-800 shrink-0"
                                    title="Clear date filter"
                                >
                                    <X className="h-4 w-4 mr-1" /> Clear Date
                                </Button>
                            )}
                        </div>
                    </div>

                    {(searchTerm || selectedDate) && (
                        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                            <span>
                                Showing {filteredAttempts.length} of {attempts.length} attempts
                                {selectedDate && (
                                    <span className="ml-1 text-purple-400">
                                        (filtered for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })})
                                    </span>
                                )}
                            </span>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("")
                                    setSelectedDate("")
                                }}
                                className="text-xs text-zinc-400 hover:text-zinc-200 p-0 h-auto"
                            >
                                Reset all filters
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-zinc-800 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-800/50 text-zinc-400 uppercase">
                                <tr>
                                    <th
                                        className="px-6 py-3 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('user_full_name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Full Name
                                            {sortConfig.key === 'user_full_name' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('user_email')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Email
                                            {sortConfig.key === 'user_email' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3">Score</th>
                                    <th
                                        className="px-6 py-3 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('score')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Percentage
                                            {sortConfig.key === 'score' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Date
                                            {sortConfig.key === 'created_at' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3">Violations</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredAttempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                                            No attempts found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttempts.map((attempt) => (
                                        <Fragment key={attempt.id}>
                                            <tr key={attempt.id} className="bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {attempt.user_full_name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-300">
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
                                                    <td colSpan={7} className="px-6 py-4">
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
