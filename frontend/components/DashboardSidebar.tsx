"use client";

import { ArrowDown, ArrowLeft, Circle, Diamond, Plus, Settings, Shield, Shuffle } from "lucide-react";

type Tab = "portfolio" | "positions" | "markets" | "trade" | "redeem" | "settings";

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onNewPosition: () => void;
  onBackHome: () => void;
};

const groups = [
  {
    label: "Overview",
    items: [
      { tab: "portfolio" as const, label: "Portfolio", icon: Diamond },
      { tab: "positions" as const, label: "My Positions", icon: Shield },
      { tab: "markets" as const, label: "Markets", icon: Circle }
    ]
  },
  {
    label: "Actions",
    items: [
      { tab: "portfolio" as const, label: "Add Liquidity", icon: Plus, action: "deposit" },
      { tab: "trade" as const, label: "Trade YT-LP", icon: Shuffle },
      { tab: "redeem" as const, label: "Redeem PT-LP", icon: ArrowDown }
    ]
  },
  {
    label: "System",
    items: [
      { tab: "settings" as const, label: "Settings", icon: Settings },
      { tab: "portfolio" as const, label: "Back Home", icon: ArrowLeft, action: "home" }
    ]
  }
];

export function DashboardSidebar({ activeTab, onTabChange, onNewPosition, onBackHome }: Props) {
  return (
    <aside className="dashboard-sidebar border-white/10 bg-[#111318]">
      {groups.map((group) => (
        <div key={group.label} className="sidebar-group">
          <p className="sidebar-label">{group.label}</p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const action = "action" in item ? item.action : undefined;
            const active = activeTab === item.tab && action !== "deposit" && action !== "home";
            return (
              <button
                key={`${group.label}-${item.label}`}
                type="button"
                onClick={() => {
                  if (action === "deposit") onNewPosition();
                  else if (action === "home") onBackHome();
                  else onTabChange(item.tab);
                }}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
