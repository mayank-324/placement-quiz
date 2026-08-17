
"use client"

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";

export default function ThankYouPage() {
    const [loading, setLoading] = useState(false);

    const handleReturnHome = async () => {
        setLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-background relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

            {/* Header */}
            <header className="w-full max-w-7xl flex items-center justify-center py-4 z-10">
                <div className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center text-white font-bold text-xl mr-3">
                    <Image src="/icon.png" alt="icon" width={40} height={40} />
                </div>
                <span className="font-bold text-2xl tracking-tight text-foreground/90">Percept Software Systems</span>
            </header>

            <div className="flex-1 w-full flex items-center justify-center z-10 animate-in fade-in zoom-in duration-500 pb-20">
                <Card className="w-full max-w-md text-center border-border bg-card/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="flex flex-col items-center space-y-4 pb-2">
                        <div className="rounded-full bg-green-500/10 p-6 ring-1 ring-green-500/50 mb-2">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                            Quiz Completed!
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Thank you for participating.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <p className="text-muted-foreground leading-relaxed">
                            Your responses have been recorded successfully. Percept Software Systems team will review your performance and get back to you shortly.
                        </p>
                        <Button
                            onClick={handleReturnHome}
                            disabled={loading}
                            className="w-full h-11 text-base shadow-lg shadow-primary/20"
                            variant="default"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging out...
                                </>
                            ) : (
                                <>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Exit & Return to Home
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <footer className="w-full text-center py-6 text-muted-foreground text-sm z-10">
                © 2026 Percept Software Systems. All rights reserved.
            </footer>
        </main>
    );
}
