"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Question } from "@/lib/types"
import { MarkdownRenderer } from "./MarkdownRenderer"

export default function QuizComponent() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number | string>>({}) // questionId -> selectedOptionIndex (MCQ) or code text (Coding)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState(1800);
    const [violations, setViolations] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => {
            if (data.user?.userId) setUserId(data.user.userId)
            else router.push('/')
        }).catch(() => router.push('/'))
    }, [router])

    //detect change in tab, blur, etc
    useEffect(() => {
        const triggerWarning = () => {
            setViolations(prev => prev + 1);
            alert("You are not allowed to change tab's or switch between app's during assesment!");
        }
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') triggerWarning();
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        // window.addEventListener('blur', triggerWarning)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            // window.removeEventListener('blur', triggerWarning)
        }
    }, []);

    // Load state from localStorage on mount
    useEffect(() => {
        if (!userId) return

        const storedIndex = localStorage.getItem(`quiz_${userId}_current_index`)
        const storedAnswers = localStorage.getItem(`quiz_${userId}_answers`)
        const storedStartTime = localStorage.getItem(`quiz_${userId}_start_time`)
        const storedViolations = localStorage.getItem(`quiz_${userId}_violations`)

        if (storedIndex) setCurrentQuestionIndex(parseInt(storedIndex))
        if (storedAnswers) setAnswers(JSON.parse(storedAnswers))
        if (storedViolations) setViolations(parseInt(storedViolations))

        if (storedStartTime) {
            setHasStarted(true) // User had already started
            const elapsed = Math.floor((Date.now() - parseInt(storedStartTime)) / 1000)
            const remaining = 1800 - elapsed
            if (remaining > 0) {
                setTimeLeft(remaining)
            } else {
                setTimeLeft(0)
            }
        }
        // We do NOT set start time here anymore. We wait for the Start button.
    }, [userId])

    // Save state updates
    useEffect(() => {
        if (userId) {
            localStorage.setItem(`quiz_${userId}_current_index`, currentQuestionIndex.toString())
        }
    }, [currentQuestionIndex, userId])

    useEffect(() => {
        if (userId) {
            localStorage.setItem(`quiz_${userId}_answers`, JSON.stringify(answers))
        }
    }, [answers, userId])

    useEffect(() => {
        if (userId) {
            localStorage.setItem(`quiz_${userId}_violations`, violations.toString())
        }
    }, [violations, userId])

    useEffect(() => {
        if (!hasStarted) return; // Only run timer if quiz has started

        if (timeLeft <= 0) {
            // Only submit if questions are loaded and we are not already submitting
            if (questions.length > 0 && !submitting) {
                submitQuiz()
            }
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1
                if (newTime <= 0) {
                    clearInterval(timer)
                    return 0
                }
                return newTime
            });
        }, 1000);
        return () => clearInterval(timer)
    }, [timeLeft, questions.length, submitting, hasStarted])

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!userId) return

            // Check if already attempted
            const { data: existingAttempt } = await supabase
                .from('attempts')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle()

            if (existingAttempt) {
                router.push('/thank-you')
                return
            }

            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('id') // Ensure we get 15 questions

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
    }, [router, userId])

    const handleStartQuiz = () => {
        if (!userId) return;
        setHasStarted(true);
        localStorage.setItem(`quiz_${userId}_start_time`, Date.now().toString());
    }

    const convertToMMSS = (seconds: number) => {
        const mm = Math.floor(seconds / 60);
        const ss = seconds % 60;
        return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    }

    const handleOptionSelect = (optionIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestionIndex].id]: optionIndex
        }))
    }

    const handleTextAnswer = (text: string) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestionIndex].id]: text
        }))
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
        if (submitting) return
        setSubmitting(true)
        if (!userId) return

        // Calculate score
        let score = 0
        questions.forEach(q => {
            if (q.type !== 'coding' && q.correct_option !== undefined && answers[q.id] === q.correct_option) {
                score += 1
            }
        })

        try {
            const { error } = await supabase
                .from('attempts')
                .insert([{
                    user_id: userId,
                    score: score,
                    answers: answers,
                    violations: violations
                }])

            if (error) throw error

            // Clear quiz state on successful submission
            localStorage.removeItem(`quiz_${userId}_current_index`)
            localStorage.removeItem(`quiz_${userId}_answers`)
            localStorage.removeItem(`quiz_${userId}_start_time`)
            localStorage.removeItem(`quiz_${userId}_violations`)

            router.push('/thank-you')
        } catch (err) {
            console.error(err)
            setError("Failed to submit quiz. Please try again.")
            setSubmitting(false)
        }
    }

    if (loading || !userId) {
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

    if (!hasStarted) {
        return (
            <Card className="w-full border-border bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                <CardHeader className="bg-secondary/30 pb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight">Assessment Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 text-muted-foreground">
                    <p className="text-foreground font-medium">Please read the following instructions carefully before starting the assessment:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li>The assessment consists of <strong className="text-foreground">{questions.length} questions</strong>.</li>
                        <li>You have a total of <strong className="text-foreground">30 minutes</strong> to complete the test.</li>
                        <li>Once the timer starts, it cannot be paused.</li>
                        <li><strong className="text-red-400">Do not switch tabs or open other applications</strong>. Doing so will be recorded as a violation and may result in disqualification.</li>
                        <li>You can navigate between questions using the &apos;Next&apos; and &apos;Previous&apos; buttons.</li>
                        <li>Ensure you have a stable internet connection before proceeding.</li>
                    </ul>
                </CardContent>
                <CardFooter className="flex justify-end pt-6 border-t border-border/50 bg-secondary/10">
                    <Button
                        onClick={handleStartQuiz}
                        size="lg"
                        className="px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                    >
                        Start Assessment
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const selectedOption = answers[currentQuestion.id]

    return (
        <Card className="w-full border-border bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="bg-secondary/30 pb-6">
                <div className="flex justify-between items-start md:items-center mb-4 gap-4">
                    <div>
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">
                            Question {currentQuestionIndex + 1}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">/ {questions.length}</span>
                    </div>
                    <span>Time: {convertToMMSS(timeLeft)}</span>
                </div>
                <div className="text-xl md:text-2xl font-semibold leading-relaxed">
                    <MarkdownRenderer content={currentQuestion.question_text} className="prose-p:my-0" />
                </div>
                <div className="w-full bg-secondary h-1.5 mt-6 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-6">
                {currentQuestion.type === 'coding' ? (
                    <div className="w-full h-full min-h-[300px]">
                        <textarea
                            value={(answers[currentQuestion.id] as string) || ''}
                            onChange={(e) => handleTextAnswer(e.target.value)}
                            placeholder="Type your code here..."
                            className="w-full h-64 p-4 rounded-xl border-2 border-muted bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm resize-y"
                            spellCheck={false}
                        />
                    </div>
                ) : (
                    currentQuestion.options?.map((option, index) => (
                        <div
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            className={cn(
                                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group flex items-center",
                                selectedOption === index
                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                    : "border-muted bg-card hover:bg-muted/50 hover:border-muted-foreground/50"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-lg border-2 mr-4 text-sm font-bold transition-all",
                                    selectedOption === index
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                                )}
                            >
                                {String.fromCharCode(65 + index)}
                            </div>
                            <div className={cn(
                                "flex-1 font-medium transition-colors",
                                selectedOption === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                <MarkdownRenderer content={option} className="prose-p:my-0" />
                            </div>

                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all opacity-0 scale-50",
                                selectedOption === index && "opacity-100 scale-100 border-primary text-primary"
                            )}>
                                {selectedOption === index && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>

            <CardFooter className="flex justify-between pt-6 border-t border-border/50 bg-secondary/10">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0 || submitting}
                    className="text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent hover:underline"
                >
                    Back to Previous
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={selectedOption === undefined || submitting}
                    className="px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLastQuestion ? (
                        "Submit Assessment"
                    ) : (
                        "Next Question"
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
