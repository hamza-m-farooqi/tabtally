"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    "/dashboard": {
        title: "Dashboard",
        subtitle: "Month-to-date overview & balances",
    },
    "/expenses": {
        title: "Record Expense",
        subtitle: "Log a new shared expense",
    },
    "/history": {
        title: "History",
        subtitle: "Monthly view with daily totals",
    },
    "/settlements": {
        title: "Settlements",
        subtitle: "Review and settle outstanding balances",
    },
    "/admin": {
        title: "Admin",
        subtitle: "Manage users and approvals",
    },
};

function getPageMeta(pathname: string) {
    // Exact match first
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // History detail page: /history/YYYY-MM-DD
    const historyMatch = pathname.match(/^\/history\/(\d{4}-\d{2}-\d{2})$/);
    if (historyMatch) {
        return { title: "Day Detail", subtitle: historyMatch[1] };
    }
    // Fallback
    const segment = pathname.split("/").filter(Boolean)[0] ?? "";
    return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        subtitle: undefined,
    };
}

export default function PageHeader() {
    const pathname = usePathname();
    const { title, subtitle } = getPageMeta(pathname);

    return (
        <header className="page-header">
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </header>
    );
}
