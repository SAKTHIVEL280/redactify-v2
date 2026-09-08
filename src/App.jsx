import React, { useState } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { PricingPage } from './components/PricingPage';
import { StudioDropzone } from './components/StudioDropzone';
import { DocumentViewer } from './components/DocumentViewer';
import { StyleToolbar } from './components/StyleToolbar';
import { EntityInspector } from './components/EntityInspector';
import { ProModal } from './components/ProModal';
import { FeedbackModal } from './components/FeedbackModal';
import { useDocumentStore } from './store/documentStore';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  const file = useDocumentStore((s) => s.file);
  const [activePage, setActivePage] = useState('overview'); // 'overview' | 'studio' | 'pricing'
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // If a file gets set while on overview or pricing, automatically switch to studio
  const handleNavigateToStudio = () => setActivePage('studio');
  const handleNavigateToPricing = () => setActivePage('pricing');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-warm-bone text-charcoal selection:bg-charcoal selection:text-white">
      {/* Universal Top Header */}
      <Header activePage={activePage} setActivePage={setActivePage} />

      {/* Main Workspace Protected by ErrorBoundary */}
      <main className="flex-1 flex overflow-hidden relative">
        <ErrorBoundary>
          {activePage === 'overview' && (
            <div className="flex-1 overflow-y-auto bg-warm-bone">
              <LandingPage 
                onNavigateToStudio={handleNavigateToStudio}
                onNavigateToPricing={handleNavigateToPricing}
              />
            </div>
          )}

          {activePage === 'pricing' && (
            <div className="flex-1 overflow-y-auto bg-warm-bone">
              <PricingPage onNavigateToStudio={handleNavigateToStudio} />
            </div>
          )}

          {activePage === 'studio' && (
            !file ? (
              <StudioDropzone />
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                  <DocumentViewer />
                  <EntityInspector onOpenFeedback={() => setShowFeedbackModal(true)} />
                </div>
                <StyleToolbar />
              </div>
            )
          )}
        </ErrorBoundary>
      </main>

      {/* Modals */}
      <ProModal onNavigateToPricing={handleNavigateToPricing} />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}

export default App;
