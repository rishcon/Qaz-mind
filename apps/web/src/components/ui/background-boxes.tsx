import React from 'react';
import { motion } from 'framer-motion';

/** Isometric grid of cells. A cell lights up in the brand orange under the cursor and fades back. */
const ROWS = 50;
const COLS = 50;

export const BoxesCore = ({ className = '' }: { className?: string }) => {
  const rows = new Array(ROWS).fill(1);
  const cols = new Array(COLS).fill(1);

  return (
    <div className={`absolute inset-0 overflow-hidden z-0 ${className}`}>
    <div
      style={{ transform: 'translate(-50%,-50%) skewX(-48deg) skewY(14deg) translateZ(0)' }}
      className="absolute left-1/2 top-1/2 flex w-max"
    >
      {rows.map((_, i) => (
        <motion.div key={`row${i}`} className="w-16 border-l border-[#DAD6CC] relative">
          {cols.map((_, j) => (
            <motion.div
              key={`col${j}`}
              whileHover={{ backgroundColor: 'rgba(255,90,54,1)', transition: { duration: 0 } }}
              animate={{ backgroundColor: 'rgba(255,90,54,0)', transition: { duration: 2.2 } }}
              className="w-16 h-8 border-r border-t border-[#DAD6CC] relative"
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="absolute h-6 w-10 -top-[14px] -left-[22px] text-[#C9C4B8] stroke-[1px] pointer-events-none"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
