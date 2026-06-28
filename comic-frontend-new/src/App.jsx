import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import { ThemeProvider }  from './context/ThemeContext';
import AppRoutes          from './routes/AppRoutes';
import Navbar             from './components/Navbar';
import Footer             from './components/Footer';
import MobileBottomNav    from './components/MobileBottomNav';
import ErrorBoundary      from './components/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css'; /* must be BEFORE index.css */
import './index.css'; /* overrides Bootstrap */

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <div className="app-wrapper">
              <a href="#main-content" className="skip-link">Skip to main content</a>
              <Navbar />
              <main className="main-content" id="main-content">
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </main>
              <Footer />
              {/* Fixed bottom nav — only visible on mobile */}
              <MobileBottomNav />
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
