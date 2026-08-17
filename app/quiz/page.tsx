import Image from "next/image";
import QuizComponent from "@/components/QuizComponent";

export default function QuizPage() {
    return (
        <main className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

            {/* Header */}
            <header className="w-full max-w-7xl flex items-center justify-between mb-8 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                        <Image src="/icon.png" alt="icon" width={36} height={36} />
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden md:block">Percept Software Systems</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border">
                    Placement Drive 2026
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-3xl flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
                <QuizComponent />
            </div>
        </main>
    );
}
