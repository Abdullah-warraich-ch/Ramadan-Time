import { AlertCircle } from "lucide-react";

function EmptyState({ title, description, children }) {
  return (
    <div className="relative z-10 w-full h-screen max-h-screen max-w-3xl px-6 py-8 flex items-center justify-center">
      <div className="glass-card w-full max-w-xl rounded-3xl border border-white/15 px-8 py-10 text-center shadow-2xl backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
          <AlertCircle size={22} />
        </div>
        <p className="text-base md:text-lg font-black tracking-wide text-white">{title}</p>
        {description ? <p className="text-xs md:text-sm text-slate-300/90 mt-3 max-w-md mx-auto">{description}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}

export default EmptyState;
