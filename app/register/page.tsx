import Image from "next/image";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-background relative overflow-hidden">
            {/* Abstract Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

            {/* Header */}
            <header className="w-full max-w-7xl flex items-center gap-3 py-4 z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-primary h-10 w-10 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground font-bold text-xl">
                    <Image src="/icon.png" alt="icon" width={40} height={40} />
                </div>
                <span className="font-bold text-2xl tracking-tight text-foreground/90">Percept Software Systems</span>
            </header>

            {/* Main */}
            <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 relative z-10 py-12">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

                <div className="w-full max-w-2xl transform transition-all duration-500 animate-in zoom-in-95 fade-in duration-700">
                    <RegisterForm />
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full text-center py-6 text-muted-foreground text-sm z-10">
                © 2026 Percept Software Systems. All rights reserved.
            </footer>
        </main>
    );
}
