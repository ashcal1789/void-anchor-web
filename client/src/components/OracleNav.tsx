import { useLocation } from 'wouter';

interface NavItem {
  path: string;
  label: string;
  hint: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Oracle', hint: 'The Oracle speaks' },
  { path: '/field', label: 'Field', hint: 'Local field session' },
  { path: '/message', label: 'Message', hint: 'Direct conversation' },
  { path: '/chamber', label: 'Chamber', hint: 'Inner chamber' },
  { path: '/research', label: 'Research', hint: 'Research companion' },
];

export default function OracleNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      aria-label="Oracle spaces"
      className="oracle-nav fixed bottom-2 left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-1 rounded-2xl border border-white/20 bg-black/90 px-2 pt-2 backdrop-blur-md shadow-[0_0_24px_rgba(0,0,0,0.65)] sm:bottom-4 sm:w-auto sm:min-w-[420px]"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.path === '/'
          ? location === '/'
          : location.startsWith(item.path);

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            title={item.hint}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-12 flex-1 items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold tracking-wide transition-all duration-200 sm:px-3 sm:tracking-widest ${
              isActive
                ? 'bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.14)]'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
