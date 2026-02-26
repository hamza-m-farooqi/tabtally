"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";

export default function SidebarLayout({
    children,
    userName,
    isAdmin,
}: {
    children: React.ReactNode;
    userName?: string;
    isAdmin?: boolean;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            <Sidebar
                userName={userName}
                isAdmin={isAdmin}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
            />
            <main
                className={`app-content-with-sidebar${collapsed ? " sidebar-is-collapsed" : ""}`}
            >
                <PageHeader />
                {children}
            </main>
        </>
    );
}
