import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
    return (
        <main className="min-h-screen p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
            <header className="max-w-7xl mx-auto mb-8 flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-bold text-white">
                    P
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Percept Software Systems</span>
            </header>

            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
                <AdminDashboard />
            </div>
        </main>
    );
}
