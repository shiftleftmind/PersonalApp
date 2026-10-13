import React, { useState, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';

const JobHunterDashboard = lazy(() => import('./pages/JobHunter/JobHunterDashboard'));
const GermanLearningDashboard = lazy(() => import('./pages/GermanLearning/GermanLearningDashboard'));
const PlaywrightLabDashboard = lazy(() => import('./pages/PlaywrightLab/PlaywrightLabDashboard'));
const SettingsDashboard = lazy(() => import('./pages/Settings/SettingsDashboard'));
const KnowledgeBaseDashboard = lazy(() => import('./pages/Docs/KnowledgeBaseDashboard'));

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'german' | 'playwright' | 'settings' | 'docs'>('jobs');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main className="flex-1 h-screen overflow-y-auto bg-slate-950/50">
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          }
        >
          {activeTab === 'jobs' && <JobHunterDashboard />}
          {activeTab === 'german' && <GermanLearningDashboard />}
          {activeTab === 'playwright' && <PlaywrightLabDashboard />}
          {activeTab === 'settings' && <SettingsDashboard />}
          {activeTab === 'docs' && <KnowledgeBaseDashboard />}
        </Suspense>
      </main>
    </div>
  );
};

export default App;
