"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Loader2, 
    Plus, 
    Trash2, 
    ArrowLeft, 
    LogOut, 
    Search, 
    CheckCircle2, 
    Code2, 
    HelpCircle, 
    FileQuestion,
    Filter
} from "lucide-react"
import { Question } from "@/lib/types"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { cn } from "@/lib/utils"

export default function AdminQuestions() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<"all" | "mcq" | "coding">("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newQuestion, setNewQuestion] = useState<{
        question_text: string;
        options: string[];
        correct_option: number;
        type: 'mcq' | 'coding';
    }>({
        question_text: "",
        options: ["", "", "", ""],
        correct_option: 0,
        type: 'mcq',
    })
    const router = useRouter()

    /** Insert 4 spaces at the cursor position on Tab keypress */
    const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, onChange: (val: string) => void) => {
        if (e.key !== 'Tab') return
        e.preventDefault()
        const ta = e.currentTarget
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const spaces = '    ' // 4 spaces
        const next = ta.value.substring(0, start) + spaces + ta.value.substring(end)
        onChange(next)
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + spaces.length
        })
    }

    const fetchQuestions = async () => {
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

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('id')

        if (error) {
            console.error("Error fetching questions:", error)
        } else if (data) {
            setQuestions(data.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            })))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchQuestions()
    }, [router])

    const handleAddQuestion = async () => {
        if (!newQuestion.question_text.trim()) {
            alert("Question text is required");
            return;
        }

        if (newQuestion.type === 'mcq' && newQuestion.options.some(o => !o || !o.trim())) {
            alert("All 4 options are required for MCQ questions");
            return;
        }

        try {
            const { error } = await supabase
                .from('questions')
                .insert([{
                    question_text: newQuestion.question_text,
                    options: newQuestion.type === 'mcq' ? newQuestion.options : [],
                    correct_option: newQuestion.type === 'mcq' ? newQuestion.correct_option : 0,
                    type: newQuestion.type
                }])

            if (error) throw error

            setIsAddOpen(false)
            setNewQuestion({
                question_text: "",
                options: ["", "", "", ""],
                correct_option: 0,
                type: 'mcq'
            })
            fetchQuestions()
        } catch (err) {
            console.error(err)
            alert("Failed to add question")
        }
    }

    const handleDeleteQuestion = async (id: number) => {
        if (!confirm(`Are you sure you want to delete Question #${id}?`)) return

        try {
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchQuestions()
        } catch (err) {
            console.error(err)
            alert("Failed to delete question")
        }
    }

    const updateOption = (index: number, value: string) => {
        const newOptions = [...newQuestion.options]
        newOptions[index] = value
        setNewQuestion({ ...newQuestion, options: newOptions })
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/')
        } catch (err) {
            console.error('Logout failed:', err)
        }
    }

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (q.options && q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                q.id.toString().includes(searchTerm)
            
            const matchesType = typeFilter === "all" || 
                (typeFilter === "mcq" && q.type !== "coding") ||
                (typeFilter === "coding" && q.type === "coding")

            return matchesSearch && matchesType
        })
    }, [questions, searchTerm, typeFilter])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Top Navigation & Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.push('/admin')}
                        className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                Manage Questions
                            </h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {questions.length} Total
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Create, view, and organize test questions
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20">
                                <Plus className="mr-2 h-4 w-4" /> Add Question
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100">
                            <div className="max-h-[85vh] overflow-y-auto pr-1">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Add New Question</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Create a new assessment question with Markdown or code formatting support.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Question Type</Label>
                                    <Select
                                        value={newQuestion.type}
                                        onValueChange={(val: 'mcq' | 'coding') => setNewQuestion({ ...newQuestion, type: val })}
                                    >
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            <SelectItem value="mcq">Multiple Choice Question (MCQ)</SelectItem>
                                            <SelectItem value="coding">Coding / Open Response</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="question">Question Statement</Label>
                                    <Textarea
                                        id="question"
                                        placeholder={`Type your question here.

You can write multiple lines,
    indent with Tab,
    and the formatting is preserved exactly as typed.`}
                                        rows={7}
                                        className="bg-zinc-900 border-zinc-800 font-mono text-sm resize-y"
                                        value={newQuestion.question_text}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                        onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion({ ...newQuestion, question_text: val }))}
                                    />
                                    <p className="text-[11px] text-zinc-600">
                                        Tab inserts 4 spaces · newlines and indentation are preserved exactly as typed
                                    </p>
                                </div>

                                {newQuestion.type === 'mcq' && (
                                    <>
                                        <div className="space-y-3">
                                            <Label>Multiple Choice Options</Label>
                                            <div className="space-y-2.5">
                                                {newQuestion.options.map((option, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold shrink-0 mt-1 transition-colors",
                                                            newQuestion.correct_option === i 
                                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold" 
                                                                : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                                        )}>
                                                            {String.fromCharCode(65 + i)}
                                                        </div>
                                                        <Textarea
                                                            value={option}
                                                            onChange={(e) => updateOption(i, e.target.value)}
                                                            onKeyDown={(e) => handleTabKey(e, (val) => updateOption(i, val))}
                                                            placeholder={`Option ${String.fromCharCode(65 + i)} — supports multiple lines and indentation`}
                                                            rows={2}
                                                            className="bg-zinc-900 border-zinc-800 font-mono text-sm resize-y focus-visible:ring-0"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="correct">Designate Correct Answer</Label>
                                            <Select
                                                value={newQuestion.correct_option.toString()}
                                                onValueChange={(val) => setNewQuestion({ ...newQuestion, correct_option: parseInt(val) })}
                                            >
                                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-emerald-400 font-medium">
                                                    <SelectValue placeholder="Select correct option" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                                    {newQuestion.options.map((_, i) => (
                                                        <SelectItem key={i} value={i.toString()}>
                                                            Option {String.fromCharCode(65 + i)} {newQuestion.options[i] ? `(${newQuestion.options[i].slice(0, 30)}${newQuestion.options[i].length > 30 ? '...' : ''})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="hover:bg-zinc-900">
                                    Cancel
                                </Button>
                                <Button onClick={handleAddQuestion} className="bg-purple-600 hover:bg-purple-700">
                                    Save Question
                                </Button>
                            </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="destructive" onClick={handleLogout} className="bg-red-600/90 hover:bg-red-600">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search questions by text, code, or ID..."
                        className="pl-9 h-10 bg-zinc-950/60 border-zinc-800 focus:border-purple-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-zinc-500 shrink-0 hidden sm:block" />
                    <div className="flex rounded-lg border border-zinc-800 p-1 bg-zinc-950/60 text-xs font-medium">
                        <button
                            onClick={() => setTypeFilter("all")}
                            className={cn(
                                "px-3 py-1 rounded-md transition-all",
                                typeFilter === "all" ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            All ({questions.length})
                        </button>
                        <button
                            onClick={() => setTypeFilter("mcq")}
                            className={cn(
                                "px-3 py-1 rounded-md transition-all",
                                typeFilter === "mcq" ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            MCQ ({questions.filter(q => q.type !== 'coding').length})
                        </button>
                        <button
                            onClick={() => setTypeFilter("coding")}
                            className={cn(
                                "px-3 py-1 rounded-md transition-all",
                                typeFilter === "coding" ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            Coding ({questions.filter(q => q.type === 'coding').length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Questions Card Feed */}
            {filteredQuestions.length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                        <FileQuestion className="h-12 w-12 mb-3 text-zinc-600" />
                        <h3 className="text-lg font-medium text-zinc-300">No questions found</h3>
                        <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                            {searchTerm || typeFilter !== 'all' 
                                ? "No questions match your current search or filter criteria."
                                : "You haven't added any questions yet. Click 'Add Question' to create one."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredQuestions.map((question) => {
                        const isCoding = question.type === 'coding'

                        return (
                            <Card 
                                key={question.id} 
                                className="border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-200 shadow-lg overflow-hidden group"
                            >
                                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-zinc-800/50 bg-zinc-950/30 flex flex-row items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 font-mono text-xs font-bold border border-zinc-700">
                                            Q#{question.id}
                                        </span>
                                        
                                        {isCoding ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                <Code2 className="h-3.5 w-3.5" /> Coding / Text Question
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                <HelpCircle className="h-3.5 w-3.5" /> MCQ ({question.options?.length || 0} Options)
                                            </span>
                                        )}

                                        {!isCoding && question.correct_option !== undefined && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Correct: Option {String.fromCharCode(65 + question.correct_option)}
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors shrink-0"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                        title={`Delete Question #${question.id}`}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1.5" />
                                        <span className="hidden sm:inline text-xs font-medium">Delete</span>
                                    </Button>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-5 space-y-4">
                                    {/* Question Text */}
                                    <div className="text-zinc-200 text-sm md:text-base leading-relaxed">
                                        <MarkdownRenderer content={question.question_text} />
                                    </div>

                                    {/* Options Section for MCQ */}
                                    {!isCoding && question.options && question.options.length > 0 && (
                                        <div className="pt-2 border-t border-zinc-800/40">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                                                Options
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {question.options.map((opt, i) => {
                                                    const isCorrect = i === question.correct_option
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "relative p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between overflow-hidden",
                                                                isCorrect
                                                                    ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                                                                    : "border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/80"
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className={cn(
                                                                    "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                                                                    isCorrect
                                                                        ? "bg-emerald-500 text-emerald-950 font-extrabold"
                                                                        : "bg-zinc-800 text-zinc-400"
                                                                )}>
                                                                    {String.fromCharCode(65 + i)}
                                                                </div>
                                                                <div className="flex-1 overflow-x-auto">
                                                                    <MarkdownRenderer 
                                                                        content={opt} 
                                                                        className="prose-p:my-0 text-xs font-medium" 
                                                                    />
                                                                </div>
                                                            </div>
                                                            {isCorrect && (
                                                                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Correct Answer
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Coding Question helper info */}
                                    {isCoding && (
                                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-300 flex items-center gap-2">
                                            <Code2 className="h-4 w-4 text-blue-400 shrink-0" />
                                            <span>Students will be presented with a full-height code editor with Tab-indentation support to write their solution.</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
