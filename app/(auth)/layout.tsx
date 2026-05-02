export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block">
            <span className="font-heading text-xl font-bold text-snow tracking-tight">
              Content<span className="text-lime">Factory</span>
            </span>
            <div className="text-[10px] text-smoke uppercase tracking-widest mt-1">
              SMM без усилий
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
