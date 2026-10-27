import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { CommandPalette } from '../ui/CommandPalette';
import { RoleSwitcherModal } from '../ui/RoleSwitcherModal';
import { mockDb } from '../../repositories/mockDatabase';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  onSwitchWorkspace?: (ws: 'student' | 'teacher' | 'school' | 'landing') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentPath,
  onNavigate,
  onSwitchWorkspace,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [, setTick] = useState(0);

  // Subscribe to reactive database changes so any audit event, user status update or review state causes re-render
  useEffect(() => {
    const unsub = mockDb.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F3EE] text-[#171717]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <AdminSidebar
          currentPath={currentPath}
          onNavigate={(p) => {
            onNavigate(p);
            setMobileOpen(false);
          }}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
          onSwitchWorkspace={onSwitchWorkspace}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 flex w-64 flex-col bg-white">
            <AdminSidebar
              currentPath={currentPath}
              onNavigate={(p) => {
                onNavigate(p);
                setMobileOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              onOpenRoleSwitcher={() => {
                setMobileOpen(false);
                setRoleSwitcherOpen(true);
              }}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar
          currentPath={currentPath}
          onNavigate={onNavigate}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
          onToggleMobileSidebar={() => setMobileOpen(true)}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={roleSwitcherOpen}
        onClose={() => setRoleSwitcherOpen(false)}
      />
    </div>
  );
};
