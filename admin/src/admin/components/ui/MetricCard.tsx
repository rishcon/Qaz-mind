import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  subtitle?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  subtitle,
  badge,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-5 border border-[#E2DED5] transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-[#FF5A36]/40 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[#78716C] tracking-tight">{title}</span>
        {badge}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight text-[#171717]">{value}</span>

        {change && (
          <div
            className={`inline-flex items-center text-xs font-semibold ${
              change.trend === 'up'
                ? 'text-[#258568]'
                : change.trend === 'down'
                ? 'text-[#C94A43]'
                : 'text-[#78716C]'
            }`}
          >
            {change.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {change.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {change.trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{change.value}</span>
            {change.label && <span className="ml-1 text-[11px] text-[#A8A29E] font-normal">{change.label}</span>}
          </div>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-[#78716C]">{subtitle}</p>}
    </div>
  );
};
