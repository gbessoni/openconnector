"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "./actions";
import type { SessionUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (path: string) =>
    path === "/app" ? pathname === "/app" : pathname?.startsWith(path);

  const navItems = [
    { href: "/app", label: "My Leads", icon: "📋" },
    { href: "/app/companies", label: "Companies", icon: "🏢" },
    { href: "/app/leads/new", label: "Add Lead", icon: "＋" },
    { href: "/app/leads/import", label: "Import CSV", icon: "⬆" },
  ];
  if (user.role === "admin") {
    navItems.push({ href: "/app/admin", label: "Admin", icon: "⚙️" });
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar — fixed height, doesn't scroll */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen shrink-0">
        <div className="px-6 py-5 border-b border-gray-200 shrink-0">
          <Link href="/" className="block">
            <h1 className="font-serif text-2xl text-gray-900">Leapify</h1>
            <p className="text-xs text-gray-400 mt-0.5">Connector Portal</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer — always visible */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {user.role === "admin" && (
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content — scrolls independently */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
