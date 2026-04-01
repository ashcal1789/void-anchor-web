import { useLocation } from 'wouter';

interface NavItem {
  path: string;
  label: string;
  hint: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '◈ ORACLE', hint: 'The Oracle speaks' },
  { path: '/message', label: '◇ MESSAGE', hint: 'Direct conversation' },
  { path: '/chamber', label: '◆ CHAMBER', hint: 'Inner chamber' },
  { path: '/research', label: '◉ RESEARCH', hint: 'Research companion' },
];

export default function OracleNav() {
  const [location, navigate] = useLocation();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {NAV_ITEMS.map((item) => {
        const isActive = item.path === '/'
          ? location === '/'
          : location.startsWith(item.path);

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            title={item.hint}
            className={`px-3 py-1.5 rounded-full text-[10px] tracking-widest font-bold transition-all duration-200 ${
              isActive
                ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'text-white/30 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
