"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Question } from "@/lib/types"

export default function QuizComponent() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number>>({}) // questionId -> selectedOptionIndex
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchQuestions = async () => {
            const userId = localStorage.getItem('userId')
            if (!userId) {
                router.push('/')
                return
            }

            // Check if already attempted
            const { data: existingAttempt } = await supabase
                .from('attempts')
                .select('id')
                .eq('user_id', userId)
                .single()

            if (existingAttempt) {
                router.push('/thank-you')
                return
            }

            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('id')
                .limit(15) // Ensure we get 15 questions

            if (error) {
                console.error(error)
                setError("Failed to load questions.")
                setLoading(false)
                return
            }

            if (data) {
                // Parse options if they are strings (depends on how supabase returns jsonb, usually object/array)
                // With simple client they come as array/object
                const formattedQuestions = data.map(q => ({
                    ...q,
                    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                }))
                setQuestions(formattedQuestions)
            }
            setLoading(false)
        }

        fetchQuestions()
    }, [router])

    const handleOptionSelect = (optionIndex: number) => {
        setAnswers({
            ...answers,
            [questions[currentQuestionIndex].id]: optionIndex
        })
    }

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            submitQuiz()
        }
    }

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const submitQuiz = async () => {
        setSubmitting(true)
        const userId = localStorage.getItem('userId')
        if (!userId) return

        // Calculate score
        let score = 0
        questions.forEach(q => {
            if (answers[q.id] === q.correct_option) {
                score += 1
            }
        })

        try {
            const { error } = await supabase
                .from('attempts')
                .insert([{
                    user_id: userId,
                    score: score,
                    answers: answers
                }])

            if (error) throw error

            router.push('/thank-you')
        } catch (err) {
            console.error(err)
            setError("Failed to submit quiz. Please try again.")
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="w-full max-w-md mx-auto border-red-800 bg-red-900/20">
                <CardContent className="pt-6 text-center text-red-400">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                    <p>{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (questions.length === 0) {
        return (
            <Card className="w-full max-w-md mx-auto border-zinc-800 bg-zinc-900/50">
                <CardContent className="pt-6 text-center text-zinc-400">
                    <p>No questions available. Please contact admin.</p>
                </CardContent>
            </Card>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const selectedOption = answers[currentQuestion.id]

    return (
        <Card className="w-full max-w-2xl mx-auto border-zinc-800 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300">
            <CardHeader>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-purple-400">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs text-zinc-500">
                        Percept Software Systems
                    </span>
                </div>
                <CardTitle className="text-xl md:text-2xl leading-relaxed">
                    {currentQuestion.question_text}
                </CardTitle>
                <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                    <div
                        className="bg-purple-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
                {currentQuestion.options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        className={`
              relative p-4 rounded-lg border cursor-pointer transition-all duration-200 group
              ${selectedOption === index
                                ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                : 'border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300'}
            `}
                    >
                        <div className="flex items-center">
                            <div className={`
                flex items-center justify-center w-6 h-6 rounded-full border mr-3 text-xs font-bold transition-colors
                ${selectedOption === index
                                    ? 'border-purple-500 bg-purple-500 text-white'
                                    : 'border-zinc-700 text-zinc-500 group-hover:border-zinc-600'}
              `}>
                                {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1">{option}</span>
                            {selectedOption === index && (
                                <CheckCircle2 className="h-5 w-5 text-purple-500 animate-in fade-in zoom-in duration-200" />
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-zinc-800/50">
                <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0 || submitting}
                    className="text-zinc-400 hover:text-white"
                >
                    Previous
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={selectedOption === undefined || submitting}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLastQuestion ? (
                        "Submit"
                    ) : (
                        "Next"
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
