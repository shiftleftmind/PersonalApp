import React from 'react';
import { Briefcase, BookOpen, Terminal, Settings, ChevronLeft, ChevronRight, Sparkles, LucideIcon, Compass } from 'lucide-react';

interface SidebarProps {
  activeTab: 'jobs' | 'german' | 'playwright' | 'settings' | 'docs';
  setActiveTab: (tab: 'jobs' | 'german' | 'playwright' | 'settings' | 'docs') => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const navItems: Array<{
    id: 'jobs' | 'german' | 'playwright' | 'settings';
    label: string;
    icon: LucideIcon;
    color: string;
    badge?: string;
  }> = [
    { id: 'jobs', label: 'Job Hunter', icon: Briefcase, color: 'text-indigo-400', badge: 'Berlin QA' },
    { id: 'german', label: 'German A0 ➔ B1', icon: BookOpen, color: 'text-emerald-400', badge: 'Goethe B1' },
    { id: 'playwright', label: 'Playwright Lab', icon: Terminal, color: 'text-amber-400', badge: 'Automation' },
    { id: 'settings', label: 'CV & Settings', icon: Settings, color: 'text-slate-400' },
  ];

  return (
    <aside
      className={`h-screen bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                P
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm tracking-tight text-slate-100 truncate">Career & Learning</h1>
                <p className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">Berlin QA Hub</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
                P
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-lg transition-all text-sm font-medium ${
                  collapsed ? 'justify-center p-3' : 'px-3 py-2.5 justify-between'
                } ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} className={isActive ? item.color : 'text-slate-400'} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Knowledge Base Button & Status */}
      <div className="p-3 border-t border-slate-900 space-y-2">
        <button
          onClick={() => setActiveTab('docs')}
          className={`w-full flex items-center rounded-xl transition-all text-xs font-semibold ${
            collapsed ? 'justify-center p-3' : 'px-3 py-2.5 justify-between'
          } ${
            activeTab === 'docs'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 ring-1 ring-sky-400'
              : 'bg-slate-900/60 hover:bg-slate-900 text-sky-400 hover:text-sky-300 border border-slate-800'
          }`}
          title="Knowledge Base & Documentation"
        >
          <div className="flex items-center space-x-2.5">
            <Compass size={18} className={activeTab === 'docs' ? 'text-white' : 'text-sky-400'} />
            {!collapsed && <span>Knowledge Base &amp; Docs</span>}
          </div>
          {!collapsed && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                activeTab === 'docs'
                  ? 'bg-sky-700 text-white'
                  : 'bg-sky-950 text-sky-300 border border-sky-800'
              }`}
            >
              KB
            </span>
          )}
        </button>

        {!collapsed ? (
          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-900">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-400">
              <Sparkles size={12} />
              <span>Berlin QA Hub Active</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Karan Joshi · Chancenkarte</p>
          </div>
        ) : (
          <div className="flex justify-center pt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Connected" />
          </div>
        )}
      </div>
    </aside>
  );
};
