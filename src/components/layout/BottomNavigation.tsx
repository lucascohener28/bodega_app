import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type BottomNavigationItem<Key extends string> = {
  key: Key;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type Props<Key extends string> = {
  active: Key;
  primaryItems: BottomNavigationItem<Key>[];
  moreItems: BottomNavigationItem<Key>[];
  onChange: (key: Key) => void;
};

export function BottomNavigation<Key extends string>({
  active,
  primaryItems,
  moreItems,
  onChange,
}: Props<Key>) {
  const [moreOpen, setMoreOpen] = useState(false);
  const hasMore = moreItems.length > 0;

  function handleChange(key: Key) {
    onChange(key);
    setMoreOpen(false);
  }

  return (
    <>
      {moreOpen && hasMore && (
        <div className="fixed inset-0 z-[70] bg-slate-950/20 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 right-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Más módulos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => handleChange(item.key)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[75] border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleChange(item.key)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}

          {hasMore && (
            <button
              onClick={() => setMoreOpen((value) => !value)}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition ${
                moreOpen || moreItems.some((item) => item.key === active)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <MoreHorizontal className={`h-5 w-5 ${moreOpen ? "text-brand-600" : "text-slate-400"}`} />
              <span>Más</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
