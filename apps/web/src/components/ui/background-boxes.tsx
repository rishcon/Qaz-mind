import React from 'react';
import { motion } from 'framer-motion';

/** Isometric grid of cells. A cell lights up in the brand orange under the cursor and fades back. */
const ROWS = 60;
const COLS = 40;

export const BoxesCore = ({ className = '' }: { className?: string }) => {
  const rows = new Array(ROWS).fill(1);
  const cols = new Array(COLS).fill(1);

  return (
    <div
      style={{ transform: 'translate(-22%,-18%) skewX(-48deg) skewY(14deg) scale(0.8) rotate(0deg) translateZ(0)' }}
      className={`absolute left-1/4 p-4 -top-1/4 flex -translate-x-1/2 -translate-y-1/2 w-full h-full z-0 ${className}`}
    >
      {rows.map((_, i) => (
        <motion.div key={`row${i}`} className="w-16 h-8 border-l border-[#CFCAC0] relative">
          {cols.map((_, j) => (
            <motion.div
              key={`col${j}`}
              whileHover={{ backgroundColor: '#FF5A36', transition: { duration: 0 } }}
              className="w-16 h-8 border-r border-t border-[#CFCAC0] relative transition-colors duration-[1600ms]"
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="absolute h-6 w-10 -top-[14px] -left-[22px] text-[#BDB8AC] stroke-[1px] pointer-events-none"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
