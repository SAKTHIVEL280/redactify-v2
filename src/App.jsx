import React, { useState } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { DocumentViewer } from './components/DocumentViewer';
import { StyleToolbar } from './components/StyleToolbar';
import { EntityInspector } from './components/EntityInspector';
import { ProModal } from './components/ProModal';
import { FeedbackModal } from './components/FeedbackModal';
import { useDocumentStore } from './store/documentStore';

export function App() {
  const file = useDocumentStore((s) => s.file);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Universal Top Header */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {!file ? (
          <div className="flex-1 overflow-y-auto">
            <LandingPage />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              <DocumentViewer />
              <EntityInspector onOpenFeedback={() => setShowFeedbackModal(true)} />
            </div>
            <StyleToolbar />
          </div>
        )}
      </main>

      {/* Modals */}
      <ProModal />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}

export default App;
