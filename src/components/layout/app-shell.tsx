"use client";

import { AppButton, AppDetails } from "@/components/ui-antd-primitives";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity, Bell, BookOpen, ChevronDown, CircleHelp, ClipboardCheck, FileCheck2, History,
  LayoutDashboard, LogOut, Menu, Settings2, Target, UserRound, Users, X, Tags, SlidersHorizontal
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/lib/auth/session";

type Props = { children: React.ReactNode; title: string; subtitle?: string; role?: "employee" | "manager" | "department" | "hcd" | "admin" };

const employeeNavItems = [
  { key: "dashboard", labelKey: "employee.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "objectives", labelKey: "employee.objectives", href: "/employee/objectives", icon: Target },
  { key: "performance", labelKey: "employee.performance", href: "/employee/performance", icon: Activity },
  { key: "history", labelKey: "employee.history", href: "/employee/history", icon: History },
  { key: "development", labelKey: "employee.development", href: "/employee/development", icon: BookOpen }
 ];

const managerNavItems = [
  { key: "dashboard", labelKey: "manager.dashboard", href: "/manager", icon: LayoutDashboard },
  { key: "team", labelKey: "manager.team", href: "/manager/team", icon: Users },
  { key: "history", labelKey: "manager.history", href: "/manager/history", icon: History },
  { key: "reviews", labelKey: "manager.reviews", href: "/manager/reviews", icon: ClipboardCheck },
  { key: "objectives", labelKey: "manager.objectives", href: "/manager/objectives", icon: Target },
  { key: "performance", labelKey: "manager.performance", href: "/manager/performance", icon: Activity },
  { key: "evaluation", labelKey: "manager.evaluation", href: "/manager/evaluation", icon: ClipboardCheck },
  { key: "year-group", labelKey: "manager.year-group", href: "/manager/year-group", icon: Users },
  { key: "calculations", labelKey: "manager.calculations", href: "/manager/calculations", icon: Activity }
];

const departmentNavItems = [
  { key: "dashboard", labelKey: "department.dashboard", href: "/department", icon: LayoutDashboard },
  { key: "teams", labelKey: "department.teams", href: "/department/teams", icon: Users },
  { key: "progress", labelKey: "department.progress", href: "/department/progress", icon: Activity },
  { key: "reports", labelKey: "department.reports", href: "/department/reports", icon: BookOpen },
  { key: "history", labelKey: "department.history", href: "/department/history", icon: History }
];

const hcdNavItems = [
  { key: "dashboard", labelKey: "hcd.dashboard", href: "/hcd", icon: LayoutDashboard },
  { key: "cycles", labelKey: "hcd.cycles", href: "/hcd/cycles", icon: Activity },
  { key: "templates", labelKey: "hcd.templates", href: "/hcd/templates", icon: ClipboardCheck },
  { key: "calibration", labelKey: "hcd.calibration", href: "/hcd/calibration", icon: Target },
  { key: "reports", labelKey: "hcd.reports", href: "/hcd/reports", icon: BookOpen },
  { key: "history", labelKey: "hcd.history", href: "/hcd/history", icon: History }
];

const adminNavItems = [
  { key: "dashboard", labelKey: "admin.dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "cycles", labelKey: "admin.cycles", href: "/admin/performance-cycles", icon: Activity },
  { key: "competencies", labelKey: "admin.competencies", href: "/admin/competency-templates", icon: ClipboardCheck },
  { key: "categories", labelKey: "admin.categories", href: "/admin/objective-categories", icon: Tags },
  { key: "configuration", labelKey: "admin.configuration", href: "/admin/performance-configuration", icon: SlidersHorizontal },
  { key: "employees", labelKey: "admin.employees", href: "/admin/employees", icon: Users },
  { key: "approvals", labelKey: "admin.approvals", href: "/admin/approvals", icon: ClipboardCheck },
  { key: "plan-reviews", labelKey: "admin.plan-reviews", href: "/admin/plan-reviews", icon: FileCheck2 },
  { key: "bell-curve", labelKey: "admin.bell-curve", href: "/admin/bell-curve", icon: Activity },
  { key: "publication", labelKey: "admin.publication", href: "/admin/publication", icon: FileCheck2 },
  { key: "history", labelKey: "admin.history", href: "/admin/history", icon: History },
  { key: "notifications", labelKey: "admin.notifications", href: "/admin/notifications", icon: Bell },
  { key: "notification-templates", labelKey: "admin.notification-templates", href: "/admin/notification-templates", icon: FileCheck2 },
  { key: "reports", labelKey: "admin.reports", href: "/admin/reports", icon: BookOpen }
];

export function AppShell({ children, title, subtitle, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isReady, isAuthenticated } = useAuthSession();
  const locale = useLocale();
  const t = useTranslations("Shell");
  const isAr = locale === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeRole = role ?? (user?.roles.admin ? "admin" : user?.roles.manager ? "manager" : "employee");

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) { router.replace(`/${locale}/login`); return; }
    const allowed = role === undefined || (role === "admin" && user?.roles.admin) || (role === "manager" && user?.roles.manager) || (role === "employee" && user?.roles.employee);
    if (!allowed) router.replace(`/${locale}/dashboard`);
  }, [isReady, isAuthenticated, locale, role, router, user]);

  useEffect(() => {
    const pageTitle = `${title} | Perform.`;
    document.title = pageTitle;
    const upsertMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, selector.includes("property=") ? selector.match(/property="([^"]+)"/)?.[1] ?? "" : selector.match(/name="([^"]+)"/)?.[1] ?? "");
        document.head.appendChild(element);
      }
      element.content = value;
    };
    upsertMeta('meta[property="og:title"]', "property", pageTitle);
    upsertMeta('meta[name="twitter:title"]', "name", pageTitle);
    upsertMeta('meta[name="description"]', "name", subtitle ?? t("metaDescription"));
    upsertMeta('meta[property="og:description"]', "property", subtitle ?? "Performance management workspace");
  }, [title, subtitle]);
  const localeHref = (path: string, nextLocale: string) => `/${nextLocale}${path}`;
  const navItems = activeRole === "admin" ? adminNavItems : activeRole === "manager" ? managerNavItems : activeRole === "department" ? departmentNavItems : activeRole === "hcd" ? hcdNavItems : employeeNavItems;
  const active = navItems.find((item) => pathname === `/${locale}${item.href}` || pathname.endsWith(item.href))?.key ?? "dashboard";

  return (
    <div className="app-frame" dir={isAr ? "rtl" : "ltr"}>
      {mobileOpen && <AppButton className="mobile-scrim" aria-label={t("closeNavigation")} onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div><strong>Perform<span>.</span></strong><small>People & performance</small></div>
          <AppButton className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label={t("closeMenu")}><X size={18} /></AppButton>
        </div>
        <div className="workspace-label">{t("workspace")}</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.key} href={`/${locale}${item.href}`} onClick={() => setMobileOpen(false)} className={`nav-link ${active === item.key ? "active" : ""}`}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{t(`nav.${activeRole}.${item.key}`)}</span>
                
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-label">{t("support")}</div>
          <a className="nav-link" href="mailto:people.support@example.com"><CircleHelp size={18} /><span>{t("helpCenter")}</span></a>
          <a className="nav-link" href="#"><Settings2 size={18} /><span>{t("settings")}</span></a>
          
          <div className="sidebar-profile">
            <div className="avatar avatar-small">{activeRole==="admin"?"HA":activeRole==="hcd"?"HC":activeRole==="department"?"DM":activeRole==="manager"?"MG":"EM"}</div>
            <div className="profile-copy"><strong>{user?.employee?.full_name || user?.name || t(`profile.${activeRole}.name`)}</strong><small>{user?.email || t(`profile.${activeRole}.role`)}</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <AppButton className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label={t("openMenu")}><Menu size={20} /></AppButton>
            <nav className="breadcrumb" aria-label={t("breadcrumb")}>
              <Link className="breadcrumb-home" href={`/${locale}${activeRole === "admin" ? "/admin" : activeRole === "hcd" ? "/hcd" : activeRole === "department" ? "/department" : activeRole === "manager" ? "/manager" : "/dashboard"}`}>
                {t("workspace")}
              </Link>
              <span className="breadcrumb-separator" aria-hidden="true">/</span>
              <span className="breadcrumb-current" aria-current="page">{title}</span>
            </nav>
          </div>
          <div className="topbar-actions">
            <span className="cycle-pill"><span className="status-dot" /> 2026 Cycle</span>
            <Link className="icon-button notification-button" href={`/${locale}${activeRole === "admin" ? "/admin/notifications" : activeRole === "hcd" ? "/hcd/notifications" : activeRole === "department" ? "/department/notifications" : activeRole === "manager" ? "/manager/notifications" : "/employee/notifications"}`} aria-label={t("notifications")}><Bell size={18} /><i /></Link>
            <div className="topbar-divider" />
            <div className="topbar-user"><div className="avatar avatar-small">{activeRole==="admin"?"HA":activeRole==="hcd"?"HC":activeRole==="department"?"DM":activeRole==="manager"?"MG":"EM"}</div><div><strong>{user?.employee?.full_name || user?.name || t(`profile.${activeRole}.name`)}</strong><small>{user?.email || t(`profile.${activeRole}.subtitle`)}</small></div></div>
            <div className="locale-switch">
              <Link href={localeHref(pathname.replace(`/${locale}`, ""), "en")} className={!isAr ? "selected" : ""}>EN</Link>
              <Link href={localeHref(pathname.replace(`/${locale}`, ""), "ar")} className={isAr ? "selected" : ""}>ع</Link>
            </div>
            <AppButton className="icon-button logout-button" aria-label={t("signOut")} onClick={() => void logout()}><LogOut size={17} /></AppButton>
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="page-heading-extra"><span className="updated-label">{t("lastUpdated")}</span></div></div>
          {children}
          <footer className="app-footer"><span>{t("copyright")}</span><span>{t("tagline")}</span></footer>
        </main>
      </div>
    </div>
  );
}