"use client"

import { useState, useEffect, Fragment } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Download, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Attempt, User, Question } from "@/lib/types"

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
        const userRole = localStorage.getItem('userRole')

        if (!userId || userRole !== 'admin') {
            // In a real app, verify with server/db
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
                    <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
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
                                                <td className="px-6 py-4 text-zinc-400">
                                                    {new Date(attempt.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400">
                                                    {attempt.violations}
                                                </td>
                                                <td className="px-6 py-4 text-right">
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
                                                                const userAnswerIndex = attempt.answers[q.id];
                                                                const isCorrect = userAnswerIndex === q.correct_option;
                                                                return (
                                                                    <div
                                                                        key={q.id}
                                                                        className={`
                                                                                p-3 rounded-lg border text-xs
                                                                                ${isCorrect ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'}
                                                                                `}
                                                                    >
                                                                        <p className="font-medium text-zinc-300 mb-1">{q.question_text}</p>
                                                                        <div className="flex flex-col gap-1">
                                                                            <p className={isCorrect ? "text-green-500" : "text-red-500"}>
                                                                                User: {userAnswerIndex !== undefined ? q.options[userAnswerIndex] : 'Skipped'}
                                                                            </p>
                                                                            {!isCorrect && (
                                                                                <p className="text-green-500/70">
                                                                                    Correct: {q.options[q.correct_option]}
                                                                                </p>
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
