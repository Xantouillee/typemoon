import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Chrome/Header';
import { TestPage } from './pages/TestPage';
import { StatsPage } from './pages/StatsPage';
import { ArcadePage } from './pages/ArcadePage';
import { SettingsPage } from './pages/SettingsPage';
import { useSettings } from './store/settings';

function ThemeGate({ children }: { children: React.ReactNode }) {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeGate>
      <HashRouter>
        <div className="min-h-full flex flex-col relative" style={{ zIndex: 2 }}>
          <Header />
          <main className="flex-1 flex flex-col pt-4">
            <Routes>
              <Route path="/" element={<TestPage />} />
              <Route path="/arcade" element={<ArcadePage />} />
              <Route path="/history" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
          <footer className="py-6 text-center text-[11px] font-sans" style={{ color: 'rgb(var(--ink-faint))' }}>
            Typemoon · public-domain passages via Project Gutenberg · built for the love of letters
          </footer>
        </div>
      </HashRouter>
    </ThemeGate>
  );
}
