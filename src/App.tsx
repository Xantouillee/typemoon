import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Chrome/Header';
import { TestPage } from './pages/TestPage';
import { StatsPage } from './pages/StatsPage';
import { ArcadePage } from './pages/ArcadePage';
import { SettingsPage } from './pages/SettingsPage';
import { MobilePage } from './pages/MobilePage';
import { ScorePage } from './pages/ScorePage';
import { useSettings } from './store/settings';
import { t } from './i18n/strings';

/**
 * A phone can't drive the desktop typing surface (it reads physical key events),
 * so a touch visitor landing on the practice page is sent to the touch-first
 * experience — once per session, and only for a coarse pointer on a narrow
 * screen, so it never hijacks desktop and a tap on the logo can still get back.
 */
function TouchRedirect() {
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (loc.pathname !== '/') return;
    if (sessionStorage.getItem('touchModeSeen')) return;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const narrow = window.innerWidth < 820;
    if (coarse && narrow) {
      sessionStorage.setItem('touchModeSeen', '1');
      navigate('/play', { replace: true });
    }
  }, [loc.pathname, navigate]);
  return null;
}

function ThemeGate({ children }: { children: React.ReactNode }) {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <>{children}</>;
}

export default function App() {
  const lang = useSettings((s) => s.language);
  return (
    <ThemeGate>
      <HashRouter>
        <TouchRedirect />
        <div className="min-h-full flex flex-col relative" style={{ zIndex: 2 }}>
          <Header />
          <main className="flex-1 flex flex-col pt-4">
            <Routes>
              <Route path="/" element={<TestPage />} />
              <Route path="/arcade" element={<ArcadePage />} />
              <Route path="/history" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/play" element={<MobilePage />} />
              <Route path="/score" element={<ScorePage />} />
            </Routes>
          </main>
          <footer className="py-6 text-center text-[11px] font-sans" style={{ color: 'rgb(var(--ink-faint))' }}>
            {t(lang, 'footer')}
          </footer>
        </div>
      </HashRouter>
    </ThemeGate>
  );
}
