import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { FeedbacksView } from './components/feedbacks/FeedbacksView';
import { FollowUpsView } from './components/followups/FollowUpsView';
import { RequestsView } from './components/requests/RequestsView';
import { MeetingsView } from './components/meetings/MeetingsView';
import { AgendaView } from './components/agenda/AgendaView';
import { TasksView } from './components/tasks/TasksView';
import { TeamView } from './components/team/TeamView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickActionModal } from './components/common/QuickActionModal';
import { PersonaGuideBanner } from './components/common/PersonaGuideBanner';

const MainLayout: React.FC = () => {
  const { currentRole } = useAuth();
  const { isLoading } = useAppData();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [quickActionTab, setQuickActionTab] = useState<'feedback' | 'meeting' | 'request' | 'task'>('feedback');

  const handleOpenQuickAction = (tab: 'feedback' | 'meeting' | 'request' | 'task' = 'feedback') => {
    setQuickActionTab(tab);
    setIsQuickActionOpen(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return currentRole === 'employee' ? (
          <EmployeeDashboard
            onNavigate={setCurrentView}
            onRequestFeedback={() => handleOpenQuickAction('request')}
            onRequestConversation={() => handleOpenQuickAction('request')}
          />
        ) : (
          <ManagerDashboard
            onNavigate={setCurrentView}
            onOpenFollowUpModal={() => {
              setCurrentView('followups');
            }}
          />
        );

      case 'agenda':
        return <AgendaView />;

      case 'meetings':
        return <MeetingsView />;

      case 'feedbacks':
        return <FeedbacksView />;

      case 'followups':
        return <FollowUpsView />;

      case 'requests':
        return <RequestsView />;

      case 'tasks':
        return <TasksView />;

      case 'team':
        return <TeamView />;

      case 'reports':
        return <ReportsView />;

      case 'settings':
        return <SettingsView />;

      default:
        return currentRole === 'employee' ? (
          <EmployeeDashboard
            onNavigate={setCurrentView}
            onRequestFeedback={() => handleOpenQuickAction('request')}
            onRequestConversation={() => handleOpenQuickAction('request')}
          />
        ) : (
          <ManagerDashboard
            onNavigate={setCurrentView}
            onOpenFollowUpModal={() => {
              setCurrentView('followups');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigate={(v) => setCurrentView(v)}
        onOpenQuickAction={handleOpenQuickAction}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar (Desktop fixed left, Mobile drawer) */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileSidebarOpen(false);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Prominent Persona Switcher & Guided Tour Banner */}
            <PersonaGuideBanner
              onOpenQuickAction={handleOpenQuickAction}
              onNavigate={(v) => setCurrentView(v)}
            />

            {isLoading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Carregando dados da plataforma...</p>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>

      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        defaultAction={quickActionTab}
        onNavigate={(v) => setCurrentView(v)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppDataProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </AppDataProvider>
  );
}
