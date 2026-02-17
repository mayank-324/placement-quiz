
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function ThankYouPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-center z-10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-bold text-white">
                        P
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Percept Software Systems</span>
                </div>
            </div>

            <div className="z-10 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-md text-center border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                    <CardHeader className="flex flex-col items-center space-y-4">
                        <div className="rounded-full bg-green-500/10 p-6 ring-1 ring-green-500/50">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                            Quiz Completed!
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-lg">
                            Thank you for participating in the Placement Drive.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-zinc-500">
                            Your responses have been recorded successfully. We will review your performance and get back to you shortly.
                        </p>
                        <Button asChild className="bg-zinc-800 hover:bg-zinc-700 text-white w-full">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <footer className="absolute bottom-4 text-zinc-500 text-xs text-center z-10">
                <p>© 2026 Percept Software Systems. All rights reserved.</p>
            </footer>
        </main>
    );
}
