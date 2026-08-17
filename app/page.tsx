import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-background relative overflow-hidden">
      {/* Abstract Background - Updated for Tailwind v4/Shadcn compatibility */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

      {/* Header */}
      <header className="w-full max-w-7xl flex items-center gap-3 py-4 z-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-primary h-10 w-10 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground font-bold text-xl">
          <Image src="/icon.png" alt="icon" width={40} height={40} />
        </div>
        <span className="font-bold text-2xl tracking-tight text-foreground/90">Percept Software Systems</span>
      </header>

      {/* Main */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center gap-8 relative z-10">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <LoginForm />
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-muted-foreground text-sm z-10">
        © 2026 Percept Software Systems. All rights reserved.
      </footer>
    </main>
  );
}
