import AdminQuestions from "@/components/AdminQuestions";

export default function AdminQuestionsPage() {
    return (
        <main className="min-h-screen flex flex-col p-4 md:p-8 bg-background relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

            <header className="w-full max-w-7xl mx-auto flex items-center gap-3 mb-8">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                    <img src="/icon.png" alt="icon" />
                </div>
                <span className="font-bold text-xl tracking-tight">Percept Software Systems</span>
                <div className="ml-auto px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    Admin Portal
                </div>
            </header>

            <div className="w-full max-w-7xl mx-auto flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
                <AdminQuestions />
            </div>
        </main>
    );
}
