import React from 'react';
import { Database } from 'lucide-react';

interface DemoBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ className = '', showIcon = true }) => {
  return (
    <div
      title="Изолированный слой демонстрационных данных платформы QazMind. Не затрагивает боевую базу."
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0EEE8] text-[#78716C] border border-[#E2DED5] select-none ${className}`}
    >
      {showIcon && <Database className="w-3 h-3 text-[#A8A29E]" />}
      <span>Демо-данные</span>
    </div>
  );
};
