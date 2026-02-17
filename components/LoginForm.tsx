"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail, Loader2 } from "lucide-react"

export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single()

            if (existingUser) {
                // User exists, verify password (simple comparison as per requirement)
                if (existingUser.password === password) {
                    localStorage.setItem('userId', existingUser.id)
                    localStorage.setItem('userRole', existingUser.role)
                    if (existingUser.role === 'admin') {
                        router.push('/admin')
                    } else {
                        // Check if student has already attempted
                        const { data: attempt } = await supabase
                            .from('attempts')
                            .select('id')
                            .eq('user_id', existingUser.id)
                            .single()

                        if (attempt) {
                            router.push('/thank-you')
                        } else {
                            router.push('/quiz')
                        }
                    }
                } else {
                    setError("Invalid password given for this email.")
                }
            } else {
                // Create new user
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ email, password, role: 'student' }])
                    .select()
                    .single()

                if (createError) throw createError

                if (newUser) {
                    localStorage.setItem('userId', newUser.id)
                    localStorage.setItem('userRole', 'student')
                    router.push('/quiz')
                }
            }
        } catch (err) {
            console.error(err)
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full border-border bg-card/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 pb-8">
                <div className="flex justify-center">
                    <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center ring-4 ring-background shadow-inner">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <div className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Placement Drive
                    </CardTitle>
                    <CardDescription className="text-base">
                        Sign in to start your assessment
                    </CardDescription>
                </div>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm text-center font-medium border border-destructive/20">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="email"
                                placeholder="Email Address"
                                className="pl-10 h-11 bg-background/50 border-input focus:border-primary/50 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative group">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="pl-10 h-11 bg-background/50 border-input focus:border-primary/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.01]"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            "Start Assessment"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
