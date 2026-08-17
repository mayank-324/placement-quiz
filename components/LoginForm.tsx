"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail, Loader2, EyeOff, Eye } from "lucide-react"

export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                router.push(data.redirectTo);
            } else {
                setError(data.error || "Invalid credentials. If you're new, please register first.");
            }
        } catch (err) {
            console.error(err)
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleEyeClick = () => {
        setShowPassword(!showPassword)
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
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="pl-10 h-11 bg-background/50 border-input focus:border-primary/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {
                                showPassword ? (
                                    <EyeOff className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" onClick={handleEyeClick} />
                                ) : (
                                    <Eye className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" onClick={handleEyeClick} />
                                )
                            }
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <div className="w-full space-y-4">
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
                        <div className="text-center text-sm">
                            <span className="text-muted-foreground mr-1">Don&apos;t have an account?</span>
                            <button
                                type="button"
                                onClick={() => router.push('/register')}
                                className="text-primary hover:underline font-medium"
                            >
                                Register Now
                            </button>
                        </div>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
