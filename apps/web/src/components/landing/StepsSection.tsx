import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { locales } from '../../content/locales';
import './landing.css';

/** Three steps. The row at the middle of the screen lights up as the visitor scrolls. */
export const StepsSection: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = locales[currentLang].steps;
  const rows = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(rows.current.indexOf(entry.target as HTMLDivElement));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    rows.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{t.label}</span>

        <div className="mt-12 md:mt-16">
          {t.items.map((item, i) => {
            const on = i === active;
            return (
              <div
                key={item.title}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                className="grid grid-cols-[3rem_1fr] md:grid-cols-[6rem_1fr_22rem] items-baseline gap-x-4 gap-y-2 py-8 md:py-12 border-t border-[#E2DED5] last:border-b"
              >
                <span
                  className={`font-mono text-sm font-bold transition-colors duration-500 ${on ? 'text-[#FF5A36]' : 'text-[#C9C4B8]'}`}
                >
                  0{i + 1}
                </span>
                <h3
                  className={`font-display font-extrabold tracking-tighter leading-none text-4xl sm:text-6xl lg:text-7xl transition-all duration-500 ${
                    on ? 'text-[#171717] translate-x-2' : 'text-[#C9C4B8]'
                  }`}
                >
                  {item.title}
                  {i === 2 && (
                    <span className="ml-4 align-middle font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF5A36] border border-[#FF5A36] px-2 py-1">
                      {t.soon}
                    </span>
                  )}
                </h3>
                <p
                  className={`col-start-2 md:col-start-3 text-base leading-relaxed transition-opacity duration-500 ${
                    on ? 'text-[#171717]/80 opacity-100' : 'opacity-0 md:opacity-30 text-[#171717]/60'
                  }`}
                >
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
