import QuizComponent from "@/components/QuizComponent";

export default function QuizPage() {
    return (
        <main className="flex min-h-screen flex-col relative overflow-hidden bg-zinc-950">
            {/* Background Elements */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute left-0 right-0 bottom-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-pink-500 opacity-20 blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="w-full p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-bold text-white">
                        P
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Percept Software Systems</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                <QuizComponent />
            </div>

            {/* Footer */}
            <footer className="w-full p-6 text-center z-10">
                <p className="text-zinc-500 text-sm">
                    © 2026 Percept Software Systems. All rights reserved.
                </p>
            </footer>
        </main>
    );
}
