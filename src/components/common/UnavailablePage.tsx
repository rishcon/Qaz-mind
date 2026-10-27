import React from 'react';
import { ArrowRight } from 'lucide-react';

interface UnavailablePageProps {
  label: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Honest placeholder for a screen that is not connected to the server yet. Shows no demo data. */
export const UnavailablePage: React.FC<UnavailablePageProps> = ({
  label,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) => {
  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      <header className="w-full border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <span className="text-xl font-extrabold tracking-tight font-mono">
          qazmind<span className="text-[#FF5A36]">.</span>
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">{label}</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">{title}</h1>
          <p className="text-sm text-[#74736F] mt-3 leading-relaxed">{description}</p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={onAction}
              className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {secondaryLabel && onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                className="w-full py-2.5 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer underline underline-offset-4"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND. Образовательная платформа ЕНТ / ҰБТ.
      </footer>
    </div>
  );
};
