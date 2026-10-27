import React from 'react';

/** Fixed notice shown on every screen while the panel runs in demo mode. It does not change the layout. */
export const DemoBanner: React.FC = () => (
  <div
    role="status"
    className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] px-3 py-1.5 rounded-full bg-[#171717] text-[#F5F3EE] text-[11px] font-mono shadow-md"
  >
    ДЕМО-РЕЖИМ · данные вымышленные · доступ не проверяется · изменения не сохраняются на сервере
  </div>
);
