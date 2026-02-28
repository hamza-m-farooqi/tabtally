"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Spinner from "@/components/Spinner";

const NAV_ITEMS = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: "/expenses",
        label: "Record",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
        ),
    },
    {
        href: "/history",
        label: "History",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        href: "/settlements",
        label: "Settlements",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
];

const ADMIN_ITEM = {
    href: "/admin",
    label: "Admin",
    icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
};

export default function Sidebar({
    userName,
    isAdmin,
    collapsed,
    onCollapsedChange,
}: {
    userName?: string;
    isAdmin?: boolean;
    collapsed: boolean;
    onCollapsedChange: (val: boolean) => void;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    // Close mobile drawer on route change
    useEffect(() => {
        const id = window.setTimeout(() => setMobileOpen(false), 0);
        return () => window.clearTimeout(id);
    }, [pathname]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    async function handleSignOut() {
        setSigningOut(true);
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/signin");
    }

    const allItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

    const sidebarContent = (isMobile: boolean) => (
        <div className={`sidebar-inner${isMobile ? " sidebar-mobile-inner" : ""}`}>
            {/* Logo / Brand */}
            <div className={`sidebar-brand${collapsed && !isMobile ? " sidebar-brand-collapsed" : ""}`}>
                {/* Show logo + title when expanded, or on mobile */}
                {(!collapsed || isMobile) && (
                    <>
                        <div className="sidebar-logo">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                                <rect x="2" y="3" width="20" height="14" rx="3" fill="currentColor" opacity="0.15" />
                                <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M2 3h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="sidebar-brand-text">
                            <span className="sidebar-brand-name">TabTally</span>
                            <span className="sidebar-brand-sub">Expense workspace</span>
                        </div>
                    </>
                )}
                {/* Collapse button - always visible on desktop, centered when collapsed */}
                {!isMobile && (
                    <button
                        className={`sidebar-collapse-btn${collapsed ? " sidebar-collapse-btn-centered" : ""}`}
                        onClick={() => onCollapsedChange(!collapsed)}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {allItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link${isActive ? " sidebar-link-active" : ""}`}
                            title={collapsed && !isMobile ? item.label : undefined}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            {(!collapsed || isMobile) && (
                                <span className="sidebar-link-label">{item.label}</span>
                            )}
                            {isActive && (!collapsed || isMobile) && (
                                <span className="sidebar-link-dot" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: User + Sign out */}
            <div className="sidebar-footer">
                {(!collapsed || isMobile) && userName && (
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{userName}</span>
                            <span className="sidebar-user-role">{isAdmin ? "Admin" : "Member"}</span>
                        </div>
                    </div>
                )}
                <button
                    className={`sidebar-signout${collapsed && !isMobile ? " sidebar-signout-icon-only" : ""}`}
                    onClick={handleSignOut}
                    disabled={signingOut}
                    title={collapsed && !isMobile ? "Sign out" : undefined}
                >
                    {signingOut ? (
                        <>
                            <Spinner size="sm" />
                            {(!collapsed || isMobile) && <span>Signing out...</span>}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {(!collapsed || isMobile) && <span>Sign out</span>}
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}>
                {sidebarContent(false)}
            </aside>

            {/* Mobile header bar */}
            <header className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <span className="mobile-header-title">TabTally</span>
                {userName && (
                    <div className="mobile-avatar">{userName.charAt(0).toUpperCase()}</div>
                )}
            </header>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile drawer */}
            <aside className={`mobile-drawer${mobileOpen ? " mobile-drawer-open" : ""}`}>
                <div className="mobile-drawer-header">
                    <button
                        className="mobile-close-btn"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                {sidebarContent(true)}
            </aside>
        </>
    );
}
