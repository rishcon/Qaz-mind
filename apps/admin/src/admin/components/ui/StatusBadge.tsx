import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'pending'
  | 'approved'
  | 'published'
  | 'in_review'
  | 'changes_requested'
  | 'draft'
  | 'suspended'
  | 'rejected'
  | 'archived'
  | 'expired'
  | 'trial'
  | 'healthy'
  | 'degraded'
  | 'default';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Активен', bg: 'bg-[#EBF7F2]', text: 'text-[#1D6A53]', dot: 'bg-[#258568]' },
  approved: { label: 'Одобрено', bg: 'bg-[#EBF7F2]', text: 'text-[#1D6A53]', dot: 'bg-[#258568]' },
  published: { label: 'Опубликован', bg: 'bg-[#EBF7F2]', text: 'text-[#1D6A53]', dot: 'bg-[#258568]' },
  healthy: { label: 'В норме', bg: 'bg-[#EBF7F2]', text: 'text-[#1D6A53]', dot: 'bg-[#258568]' },
  pending: { label: 'На проверке', bg: 'bg-[#FEF7EA]', text: 'text-[#9A6715]', dot: 'bg-[#D89B35]' },
  pending_verification: { label: 'Ожидает верификации', bg: 'bg-[#FEF7EA]', text: 'text-[#9A6715]', dot: 'bg-[#D89B35]' },
  in_review: { label: 'На рецензии', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B82F6]' },
  changes_requested: { label: 'Требует правок', bg: 'bg-[#FFF1F2]', text: 'text-[#BE123C]', dot: 'bg-[#E11D48]' },
  draft: { label: 'Черновик', bg: 'bg-[#F0EEE8]', text: 'text-[#5C574F]', dot: 'bg-[#A8A29E]' },
  suspended: { label: 'Приостановлен', bg: 'bg-[#FDF2F2]', text: 'text-[#9B2C2C]', dot: 'bg-[#C94A43]' },
  rejected: { label: 'Отклонено', bg: 'bg-[#FDF2F2]', text: 'text-[#9B2C2C]', dot: 'bg-[#C94A43]' },
  archived: { label: 'В архиве', bg: 'bg-[#F0EEE8]', text: 'text-[#78716C]', dot: 'bg-[#A8A29E]' },
  expired: { label: 'Истек', bg: 'bg-[#FDF2F2]', text: 'text-[#9B2C2C]', dot: 'bg-[#C94A43]' },
  trial: { label: 'Пробный', bg: 'bg-[#F5F3FF]', text: 'text-[#6D28D9]', dot: 'bg-[#8B5CF6]' },
  degraded: { label: 'Снижена', bg: 'bg-[#FEF7EA]', text: 'text-[#9A6715]', dot: 'bg-[#D89B35]' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const normalizedKey = status.toLowerCase();
  const config = statusMap[normalizedKey] || {
    label: status,
    bg: 'bg-[#F0EEE8]',
    text: 'text-[#44403C]',
    dot: 'bg-[#78716C]',
  };

  const displayText = label || config.label;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-medium border border-black/5 ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{displayText}</span>
    </span>
  );
};
