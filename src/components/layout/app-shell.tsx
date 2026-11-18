"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Activity, Bell, BookOpen, ChevronDown, CircleHelp, ClipboardCheck, FileCheck2, History,
  LayoutDashboard, LogOut, Menu, Settings2, Target, UserRound, Users, X, Tags, SlidersHorizontal
} from "lucide-react";
import { useState } from "react";

type Props = { children: React.ReactNode; title: string; subtitle?: string; role?: "employee" | "manager" | "department" | "hcd" | "admin" };

const employeeNavItems = [
  { key: "dashboard", label: "Overview", labelAr: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  { key: "objectives", label: "My objectives", labelAr: "أهدافي", href: "/employee/objectives", icon: Target },
  { key: "performance", label: "My performance", labelAr: "أدائي", href: "/employee/performance", icon: Activity },
  { key: "history", label: "Performance history", labelAr: "سجل الأداء", href: "/employee/history", icon: History },
  { key: "development", label: "Development", labelAr: "التطوير", href: "/employee/development", icon: BookOpen }
 ];

const managerNavItems = [
  { key: "dashboard", label: "Team overview", labelAr: "نظرة عامة على الفريق", href: "/manager", icon: LayoutDashboard },
  { key: "team", label: "My team", labelAr: "فريقي", href: "/manager/team", icon: Users },
  { key: "history", label: "Performance history", labelAr: "سجل الأداء", href: "/manager/history", icon: History },
  { key: "reviews", label: "Review queue", labelAr: "قائمة المراجعات", href: "/manager/reviews", icon: ClipboardCheck },
  { key: "objectives", label: "Team objectives", labelAr: "أهداف الفريق", href: "/manager/objectives", icon: Target },
  { key: "performance", label: "Team performance", labelAr: "أداء الفريق", href: "/manager/performance", icon: Activity },
  { key: "evaluation", label: "Manager evaluation", labelAr: "تقييم المدير", href: "/manager/evaluation", icon: ClipboardCheck },
  { key: "year-group", label: "Manager–Year Group", labelAr: "مجموعة المدير والسنة", href: "/manager/year-group", icon: Users }
];

const departmentNavItems = [
  { key: "dashboard", label: "Department overview", labelAr: "نظرة عامة على الإدارة", href: "/department", icon: LayoutDashboard },
  { key: "teams", label: "Teams", labelAr: "الفرق", href: "/department/teams", icon: Users },
  { key: "progress", label: "Performance progress", labelAr: "تقدم الأداء", href: "/department/progress", icon: Activity },
  { key: "reports", label: "Department reports", labelAr: "تقارير الإدارة", href: "/department/reports", icon: BookOpen },
  { key: "history", label: "Performance history", labelAr: "سجل الأداء", href: "/department/history", icon: History }
];

const hcdNavItems = [
  { key: "dashboard", label: "HCD overview", labelAr: "نظرة عامة", href: "/hcd", icon: LayoutDashboard },
  { key: "cycles", label: "Cycle governance", labelAr: "حوكمة الدورات", href: "/hcd/cycles", icon: Activity },
  { key: "templates", label: "Competency templates", labelAr: "قوالب الكفاءات", href: "/hcd/templates", icon: ClipboardCheck },
  { key: "calibration", label: "Calibration", labelAr: "المعايرة", href: "/hcd/calibration", icon: Target },
  { key: "reports", label: "Organization insights", labelAr: "مؤشرات المؤسسة", href: "/hcd/reports", icon: BookOpen },
  { key: "history", label: "Performance history", labelAr: "سجل الأداء", href: "/hcd/history", icon: History }
];

const adminNavItems = [
  { key: "dashboard", label: "Overview", labelAr: "نظرة عامة", href: "/admin", icon: LayoutDashboard },
  { key: "cycles", label: "Performance cycles", labelAr: "دورات الأداء", href: "/admin/performance-cycles", icon: Activity },
  { key: "competencies", label: "Competency templates", labelAr: "قوالب الكفاءات", href: "/admin/competency-templates", icon: ClipboardCheck },
  { key: "categories", label: "Objective categories", labelAr: "تصنيفات الأهداف", href: "/admin/objective-categories", icon: Tags },
  { key: "configuration", label: "Performance configuration", labelAr: "إعدادات الأداء", href: "/admin/performance-configuration", icon: SlidersHorizontal },
  { key: "employees", label: "Employees", labelAr: "الموظفون", href: "/admin/employees", icon: Users },
  { key: "approvals", label: "Approvals", labelAr: "الاعتمادات", href: "/admin/approvals", icon: ClipboardCheck },
  { key: "publication", label: "Results publication", labelAr: "نشر النتائج", href: "/admin/publication", icon: FileCheck2 },
  { key: "history", label: "Performance history", labelAr: "سجل الأداء", href: "/admin/history", icon: History },
  { key: "notifications", label: "Notifications", labelAr: "الإشعارات", href: "/admin/notifications", icon: Bell },
  { key: "notification-templates", label: "Notification templates", labelAr: "قوالب الإشعارات", href: "/admin/notification-templates", icon: FileCheck2 },
  { key: "reports", label: "Reports & analytics", labelAr: "التقارير والتحليلات", href: "/admin/reports", icon: BookOpen }
];

export function AppShell({ children, title, subtitle, role = "employee" }: Props) {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const localeHref = (path: string, nextLocale: string) => `/${nextLocale}${path}`;
  const navItems = role === "admin" ? adminNavItems : role === "manager" ? managerNavItems : role === "department" ? departmentNavItems : role === "hcd" ? hcdNavItems : employeeNavItems;
  const active = navItems.find((item) => pathname === `/${locale}${item.href}` || pathname.endsWith(item.href))?.key ?? "dashboard";

  return (
    <div className="app-frame" dir={isAr ? "rtl" : "ltr"}>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div><strong>Perform<span>.</span></strong><small>People & performance</small></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">{isAr ? "مساحة العمل" : "WORKSPACE"}</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.key} href={`/${locale}${item.href}`} onClick={() => setMobileOpen(false)} className={`nav-link ${active === item.key ? "active" : ""}`}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{isAr ? item.labelAr : item.label}</span>
                {item.key === "objectives" && <span className="nav-count">8</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-label">{isAr ? "المساعدة" : "SUPPORT"}</div>
          <a className="nav-link" href="mailto:people.support@example.com"><CircleHelp size={18} /><span>{isAr ? "مركز المساعدة" : "Help center"}</span></a>
          <a className="nav-link" href="#"><Settings2 size={18} /><span>{isAr ? "الإعدادات" : "Settings"}</span></a>
          <details className="role-switcher"><summary>{isAr ? "تبديل الدور التجريبي" : "Switch demo role"} <ChevronDown size={13}/></summary><div className="role-switcher-menu">{[["employee","Employee","الموظف","/dashboard"],["manager","Manager","المدير","/manager"],["department","Department Manager","مدير الإدارة","/department"],["hcd","HCD","تطوير رأس المال البشري","/hcd"],["admin","Admin","مسؤول النظام","/admin"]].map(([key,en,ar,path])=><Link key={key} href={`/${locale}${path}`} className={role===key?"current":""}>{isAr?ar:en}</Link>)}</div></details>
          <div className="sidebar-profile">
            <div className="avatar avatar-small">{role==="admin"?"HA":role==="hcd"?"HC":role==="department"?"DM":"MG"}</div>
            <div className="profile-copy"><strong>{role === "admin" ? "HCD Administrator" : role === "hcd" ? "HCD Specialist" : role === "department" ? "Department Manager" : role === "manager" ? "People Manager" : "Mostafa Gamal"}</strong><small>{role === "employee" ? "Employee" : role === "manager" ? "Manager" : role === "department" ? "Department Manager" : role === "hcd" ? "Human Capital Development" : "Administrator"}</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <nav className="breadcrumb" aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}>
              <Link className="breadcrumb-home" href={`/${locale}${role === "admin" ? "/admin" : role === "hcd" ? "/hcd" : role === "department" ? "/department" : role === "manager" ? "/manager" : "/dashboard"}`}>
                {isAr ? "مساحة العمل" : "Workspace"}
              </Link>
              <span className="breadcrumb-separator" aria-hidden="true">/</span>
              <span className="breadcrumb-current" aria-current="page">{title}</span>
            </nav>
          </div>
          <div className="topbar-actions">
            <span className="cycle-pill"><span className="status-dot" /> 2026 Cycle</span>
            <Link className="icon-button notification-button" href={`/${locale}${role === "admin" ? "/admin/notifications" : role === "hcd" ? "/hcd/notifications" : role === "department" ? "/department/notifications" : role === "manager" ? "/manager/notifications" : "/employee/notifications"}`} aria-label={isAr ? "الإشعارات" : "Notifications"}><Bell size={18} /><i /></Link>
            <div className="topbar-divider" />
            <div className="topbar-user"><div className="avatar avatar-small">{role==="admin"?"HA":role==="hcd"?"HC":role==="department"?"DM":"MG"}</div><div><strong>{role === "admin" ? "HCD Administrator" : role === "hcd" ? "HCD Specialist" : role === "department" ? "Department Manager" : role === "manager" ? "People Manager" : "Mostafa Gamal"}</strong><small>{role === "employee" ? "Frontend Developer" : role === "manager" ? "People Manager" : role === "department" ? "Department Manager" : "Human Capital Development"}</small></div></div>
            <div className="locale-switch">
              <Link href={localeHref(pathname.replace(`/${locale}`, ""), "en")} className={!isAr ? "selected" : ""}>EN</Link>
              <Link href={localeHref(pathname.replace(`/${locale}`, ""), "ar")} className={isAr ? "selected" : ""}>ع</Link>
            </div>
            <Link href={`/${locale}/login`} className="icon-button logout-button" aria-label="Sign out"><LogOut size={17} /></Link>
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="page-heading-extra"><span className="updated-label">Last updated just now</span></div></div>
          {children}
          <footer className="app-footer"><span>© 2026 Perform. All rights reserved.</span><span>Performance made meaningful.</span></footer>
        </main>
      </div>
    </div>
  );
}