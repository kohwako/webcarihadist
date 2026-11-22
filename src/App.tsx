import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { Layout } from './components/Layout';
import { ShareModal, SharePayload } from './components/ShareModal';
import { HomePage } from './pages/HomePage';
import { QuranPage } from './pages/QuranPage';
import { HadithPage } from './pages/HadithPage';
import { IntegratedSearchPage } from './pages/IntegratedSearchPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';
import { DetailPage } from './pages/DetailPage';
import { DetailTarget, NavPage } from './types/islamic';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [searchSeed, setSearchSeed] = useState<{ query: string; category: string }>({
    query: 'Kesabaran',
    category: '',
  });
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [draftNoteLink, setDraftNoteLink] = useState<{
    refKey: string;
    label: string;
  } | null>(null);

  const handleRunIntegratedSearch = (query: string, category = '') => {
    setSearchSeed({ query, category });
    setCurrentPage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuranDetail = (surahNumber: number, ayahNumber: number) => {
    setDetailTarget({
      type: 'quran',
      surahNumber,
      ayahNumber,
      returnPage: currentPage === 'detail' ? detailTarget?.returnPage || 'quran' : currentPage,
    });
    setCurrentPage('detail');
  };

  const handleOpenHadithDetail = (hadithBook: string, hadithNumber: number) => {
    setDetailTarget({
      type: 'hadith',
      hadithBook,
      hadithNumber,
      returnPage: currentPage === 'detail' ? detailTarget?.returnPage || 'hadith' : currentPage,
    });
    setCurrentPage('detail');
  };

  const handleCreateLinkedNote = (refKey: string, label: string) => {
    setDraftNoteLink({ refKey, label });
    setCurrentPage('notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'home' && (
        <HomePage
          onRunIntegratedSearch={handleRunIntegratedSearch}
          onNavigate={setCurrentPage}
          onOpenQuranDetail={handleOpenQuranDetail}
          onOpenHadithDetail={handleOpenHadithDetail}
          onShare={setSharePayload}
          onCreateLinkedNote={handleCreateLinkedNote}
        />
      )}

      {currentPage === 'quran' && (
        <QuranPage
          onOpenDetail={handleOpenQuranDetail}
          onShare={setSharePayload}
          onCreateLinkedNote={handleCreateLinkedNote}
        />
      )}

      {currentPage === 'hadith' && (
        <HadithPage
          onOpenDetail={handleOpenHadithDetail}
          onShare={setSharePayload}
          onCreateLinkedNote={handleCreateLinkedNote}
        />
      )}

      {currentPage === 'search' && (
        <IntegratedSearchPage
          initialQuery={searchSeed.query}
          initialCategory={searchSeed.category}
          onOpenQuranDetail={handleOpenQuranDetail}
          onOpenHadithDetail={handleOpenHadithDetail}
          onShare={setSharePayload}
          onCreateLinkedNote={handleCreateLinkedNote}
        />
      )}

      {currentPage === 'collections' && (
        <CollectionsPage
          onOpenQuranDetail={handleOpenQuranDetail}
          onOpenHadithDetail={handleOpenHadithDetail}
          onShare={setSharePayload}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'notes' && (
        <NotesPage
          draftLink={draftNoteLink}
          onClearDraftLink={() => setDraftNoteLink(null)}
          onOpenQuranDetail={handleOpenQuranDetail}
          onOpenHadithDetail={handleOpenHadithDetail}
        />
      )}

      {currentPage === 'settings' && <SettingsPage />}

      {currentPage === 'detail' && detailTarget && (
        <DetailPage
          target={detailTarget}
          onBack={() => setCurrentPage(detailTarget.returnPage || 'home')}
          onNavigateTarget={(next) => setDetailTarget(next)}
          onShare={setSharePayload}
          onCreateLinkedNote={handleCreateLinkedNote}
        />
      )}

      <AuthModal />
      <ShareModal payload={sharePayload} onClose={() => setSharePayload(null)} />
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
