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
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-6">
                <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 bg-zinc-800 rounded-full flex items-center justify-center ring-2 ring-purple-500/20">
                        <Lock className="h-6 w-6 text-purple-500" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-white">
                    Campus Placement Drive
                </CardTitle>
                <CardDescription className="text-center text-zinc-400">
                    Organized by <span className="text-purple-400 font-medium">Percept Software Systems</span>
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                type="email"
                                placeholder="Email Address"
                                className="pl-9 bg-zinc-950/50 border-zinc-800 focus:border-purple-500 transition-all duration-300"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="pl-9 bg-zinc-950/50 border-zinc-800 focus:border-purple-500 transition-all duration-300"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Start Quiz"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
