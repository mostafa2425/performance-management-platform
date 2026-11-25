"use client";

import { AppButton } from "@/components/ui-antd-primitives";
import { Select, Skeleton, Tag } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Tags,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthSession, type ActiveAppRole } from "@/lib/auth/session";
import { homePathForUser } from "@/lib/auth/home-path";
import { usePerformanceCycle } from "@/features/performance-cycles/performance-cycle-provider";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** When set, shows a back arrow in the page heading. */
  backHref?: string;
  /** Only admin/manager/employee are API roles; other values redirect home. */
  role?: "employee" | "manager" | "admin" | "department" | "hcd";
};

const employeeNavItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "objectives", href: "/employee/objectives", icon: Target },
  { key: "performance", href: "/employee/performance", icon: Activity },
];

const managerNavItems = [
  { key: "dashboard", href: "/manager", icon: LayoutDashboard },
  { key: "team", href: "/manager/team", icon: Users },
  { key: "objectives", href: "/manager/objectives", icon: Target },
  { key: "evaluation", href: "/manager/evaluation", icon: ClipboardCheck },
  { key: "year-group", href: "/manager/year-group", icon: Users },
];

const adminNavItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "cycles", href: "/admin/performance-cycles", icon: Activity },
  { key: "plan-reviews", href: "/admin/plan-reviews", icon: FileCheck2 },
  { key: "approvals", href: "/admin/approvals", icon: ClipboardCheck },
  { key: "employees", href: "/admin/employees", icon: Users },
  { key: "categories", href: "/admin/objective-categories", icon: Tags },
  { key: "competencies", href: "/admin/competency-templates", icon: ClipboardCheck },
  { key: "configuration", href: "/admin/performance-configuration", icon: SlidersHorizontal },
  { key: "notification-templates", href: "/admin/notification-templates", icon: FileCheck2 },
];

const SIDEBAR_COLLAPSED_KEY = "pmp.sidebar.collapsed";

function initials(name?: string | null, fallback = "EM") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function AppShell({ children, title, subtitle, backHref, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, activeRole, availableRoles, setActiveRole, isReady, isAuthenticated } = useAuthSession();
  const { cycleId, activeCycleLabel, options: cycleOptions, cycles, setCycleId } = usePerformanceCycle();
  const locale = useLocale();
  const t = useTranslations("Shell");
  const isAr = locale === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.sessionStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const resolvedRole = activeRole || (user?.roles.admin ? "admin" : user?.roles.manager ? "manager" : "employee");
  const displayName = user?.employee?.full_name || user?.name || t(`profile.${resolvedRole}.name`);
  const displayEmail = user?.email || t(`profile.${resolvedRole}.role`);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
      return;
    }
    const apiRole =
      role === "admin" || role === "manager" || role === "employee" || role === undefined;
    const allowed = role === undefined || (role === activeRole && ((role === "admin" && user?.roles.admin) || (role === "manager" && user?.roles.manager) || (role === "employee" && user?.roles.employee)));
    if (!apiRole || !allowed) router.replace(homePathForUser(user, locale, activeRole));
  }, [isReady, isAuthenticated, locale, role, router, user, activeRole]);

  useEffect(() => {
    document.title = title ? `${title} | Perform.` : "Perform.";
  }, [title]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.sessionStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const localeHref = (path: string, nextLocale: string) => `/${nextLocale}${path}`;
  const navItems =
    activeRole === "admin" ? adminNavItems : activeRole === "manager" ? managerNavItems : employeeNavItems;
  const active =
    navItems.find((item) => pathname === `/${locale}${item.href}` || pathname.endsWith(item.href))?.key ??
    "dashboard";
  const homeHref = homePathForUser(user, locale, activeRole);

  if (!isReady || !isAuthenticated) {
    return <div className="app-frame" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}><div style={{ width: "min(100%, 520px)" }}><Skeleton active paragraph={{ rows: 4 }} /></div></div>;
  }

  return (
    <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      {mobileOpen && (
        <AppButton
          type="button"
          variant="text"
          className="mobile-scrim"
          aria-label={t("closeNavigation")}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div className="brand-copy">
            <strong>
              Perform<span>.</span>
            </strong>
            <small>People & performance</small>
          </div>
          {/* <AppButton
            type="button"
              variant="text"
            className="shell-icon-btn sidebar-collapse-btn"
            aria-label={collapsed ? t("openMenu") : t("closeMenu")}
            title={collapsed ? t("openMenu") : t("closeMenu")}
            icon={collapsed ? <PanelLeftOpen size={18} strokeWidth={2.2} /> : <PanelLeftClose size={18} strokeWidth={2.2} />}
            onClick={toggleCollapsed}
          /> */}
          <AppButton
            type="button"
              variant="text"
            className="shell-icon-btn sidebar-close"
            aria-label={t("closeMenu")}
            icon={<X size={18} strokeWidth={2.2} />}
            onClick={() => setMobileOpen(false)}
          />
        </div>
        <div className="workspace-label">{t("workspace")}</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = t(`nav.${activeRole}.${item.key}`);
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={() => setMobileOpen(false)}
                className={`nav-link ${active === item.key ? "active" : ""}`}
                title={label}
              >
                <Icon size={16} strokeWidth={2} className="nav-link-icon" aria-hidden />
                <span className="nav-link-label">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="avatar avatar-small">
              {initials(displayName, activeRole === "admin" ? "AD" : activeRole === "manager" ? "MG" : "EM")}
            </div>
            <div className="profile-copy">
              <strong>{displayName}</strong>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <AppButton
              type="button"
              variant="text"
              className="shell-icon-btn mobile-menu"
              aria-label={t("openMenu")}
              icon={<Menu size={20} strokeWidth={2.2} />}
              onClick={() => setMobileOpen(true)}
            />
            <AppButton
              type="button"
              variant="text"
              className="shell-icon-btn desktop-sidebar-toggle"
              aria-label={collapsed ? t("openMenu") : t("closeMenu")}
              title={collapsed ? t("openMenu") : t("closeMenu")}
              icon={collapsed ? <PanelLeftOpen size={18} strokeWidth={2.2} /> : <PanelLeftClose size={18} strokeWidth={2.2} />}
              onClick={toggleCollapsed}
            />
            {/* <nav className="breadcrumb" aria-label={t("breadcrumb")}>
              <Link className="breadcrumb-home" href={homeHref}>
                {t("workspace")}
              </Link>
              <span className="breadcrumb-separator" aria-hidden="true">
                /
              </span>
              <span className="breadcrumb-current" aria-current="page">
                {title}
              </span>
            </nav> */}
          </div>
          <div className="topbar-actions">
            {availableRoles.length > 1 ? (
              <Select
                aria-label={isAr ? "تغيير مساحة العمل" : "Switch workspace"}
                value={activeRole || undefined}
                options={availableRoles.map((value: ActiveAppRole) => ({
                  value,
                  label: value === "admin" ? (isAr ? "مساحة المسؤول" : "Admin workspace") : value === "manager" ? (isAr ? "مساحة المدير" : "Manager workspace") : (isAr ? "مساحة الموظف" : "Employee workspace"),
                }))}
                onChange={(value: ActiveAppRole) => {
                  setActiveRole(value);
                  router.replace(homePathForUser(user, locale, value));
                  setMobileOpen(false);
                }}
                style={{ width: 176, maxWidth: "34vw" }}
                size="middle"
                popupMatchSelectWidth={false}
              />
            ) : null}

            {cycleOptions.length > 0 ? (
              <div className="topbar-cycle-context" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {activeCycleLabel ? <Tag color="processing" style={{ marginInlineEnd: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{activeCycleLabel}</Tag> : null}
                <Select
                  size="middle"
                  aria-label={isAr ? "اختيار دورة الأداء" : "Select performance cycle"}
                  value={cycleId}
                  options={cycleOptions}
                  loading={cycles.isFetching}
                  onChange={setCycleId}
                  style={{ width: 190, maxWidth: "32vw" }}
                  placeholder={isAr ? "اختر الدورة" : "Select cycle"}
                  showSearch
                  optionFilterProp="label"
                />
              </div>
            ) : null}
            <div className="topbar-user">
              <div className="avatar avatar-small">{initials(displayName)}</div>
              <div>
                <strong>{displayName}</strong>
              </div>
            </div>
            <div className="locale-switch">
              <Link href={localeHref(pathname.replace(`/${locale}`, "") || "/", "en")} className={!isAr ? "selected" : ""}>
                EN
              </Link>
              <Link href={localeHref(pathname.replace(`/${locale}`, "") || "/", "ar")} className={isAr ? "selected" : ""}>
                ع
              </Link>
            </div>
            <AppButton
              type="button"
              variant="text"
              className="shell-icon-btn logout-button"
              aria-label={t("signOut")}
              title={t("signOut")}
              icon={<LogOut size={18} strokeWidth={2.2} />}
              onClick={() => void logout()}
            />
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading">
            <div className="page-heading-main">
              {backHref ? (
                <Link
                  href={backHref.startsWith("/") ? `/${locale}${backHref}` : backHref}
                  className="page-heading-back"
                  aria-label={t("back")}
                  title={t("back")}
                >
                  <ArrowLeft size={20} strokeWidth={2.2} aria-hidden />
                </Link>
              ) : null}
              {(title || subtitle) ? (
                <div>
                  {title ? <h1>{title}</h1> : null}
                  {subtitle && <p>{subtitle}</p>}
                </div>
              ) : null}
            </div>
          </div>
          {children}
          <footer className="app-footer">
            <span>{t("copyright")}</span>
            <span>{t("tagline")}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
