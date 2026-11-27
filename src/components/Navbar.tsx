import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/policies', label: '혜택 모아보기' },
  { to: '/assistant', label: 'AI 신청 도우미' },
  { to: '/my-benefits', label: '내 혜택 & 담당자' },
] as const;

export function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          청년모아
        </Link>

        <nav aria-label="주 메뉴" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${
                      isActive
                        ? 'text-blue-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/policies"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            맞춤 혜택 찾기
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={isDrawerOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setIsDrawerOpen((prev) => !prev)}
          >
            {isDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            aria-hidden="true"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            id="mobile-nav-drawer"
            aria-label="모바일 내비게이션 드로어"
            className="fixed inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <span className="text-lg font-bold text-slate-900">청년모아</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="모바일 주 메뉴" className="mt-6 flex-1">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-slate-200 pt-4">
              <Link
                to="/policies"
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                맞춤 혜택 찾기
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
