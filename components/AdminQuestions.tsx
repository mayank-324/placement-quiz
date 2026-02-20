"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"
import { Question } from "@/lib/types"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { cn } from "@/lib/utils"

export default function AdminQuestions() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
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

    const fetchQuestions = async () => {
        setLoading(true)
        const userId = localStorage.getItem('userId')
        const userRole = localStorage.getItem('userRole')

        if (!userId || userRole !== 'admin') {
            router.push('/')
            return
        }

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('id')

        if (data) {
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
        if (!newQuestion.question_text) {
            alert("Question text is required");
            return;
        }

        if (newQuestion.type === 'mcq' && newQuestion.options.some(o => o === undefined || o === "")) {
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
        if (!confirm("Are you sure you want to delete this question?")) return

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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Manage Questions
                        </h1>
                        <p className="text-muted-foreground mt-1">Add, edit, or remove quiz questions</p>
                    </div>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle>Add New Question</DialogTitle>
                            <DialogDescription>
                                Create a new question for the quiz. All fields are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Question Type</Label>
                                <Select
                                    value={newQuestion.type}
                                    onValueChange={(val: 'mcq' | 'coding') => setNewQuestion({ ...newQuestion, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice Question</SelectItem>
                                        <SelectItem value="coding">Coding / Text Response</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question">Question Text</Label>
                                <Input
                                    id="question"
                                    value={newQuestion.question_text}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                />
                            </div>

                            {newQuestion.type === 'mcq' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        {newQuestion.options.map((option, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded flex items-center justify-center border text-xs font-bold text-muted-foreground">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <Input
                                                    value={option}
                                                    onChange={(e) => updateOption(i, e.target.value)}
                                                    placeholder={`Option ${i + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="correct">Correct Answer</Label>
                                        <Select
                                            value={newQuestion.correct_option.toString()}
                                            onValueChange={(val) => setNewQuestion({ ...newQuestion, correct_option: parseInt(val) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select correct option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {newQuestion.options.map((option, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        Option {String.fromCharCode(65 + i)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddQuestion}>Save Question</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">ID</TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead>Options</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.map((question) => (
                            <TableRow key={question.id}>
                                <TableCell>{question.id}</TableCell>
                                <TableCell className="font-medium">
                                    <MarkdownRenderer content={question.question_text} className="prose-p:my-0 text-sm" />
                                </TableCell>
                                <TableCell>
                                    {question.type === 'coding' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                Coding / Text Question
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            {question.options?.map((opt, i) => (
                                                <div key={i} className={cn(
                                                    "flex items-start gap-2",
                                                    i === question.correct_option ? "text-green-500 font-bold" : ""
                                                )}>
                                                    <span>{String.fromCharCode(65 + i)}.</span>
                                                    <MarkdownRenderer content={opt} className="prose-p:my-0 prose-code:text-[10px]" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
