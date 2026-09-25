"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Receipt,
  BarChart2,
  Sparkles,
  FileDown,
  Target,
  PiggyBank,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  Rocket,
  MessageSquare,
  TrendingUp,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { CurrencySelector } from "@/components/currency-selector";
import { PageTransition } from "@/components/page-transition";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transaction/create", icon: Receipt },
  { name: "Analytics", href: "/analyzer", icon: BarChart2 },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "AI Forecast", href: "/forecast", icon: TrendingUp },
  { name: "Budgets", href: "/budget", icon: PiggyBank },
  { name: "Subscriptions", href: "/subscriptions", icon: Calendar },
  { name: "Reports", href: "/reports", icon: FileDown },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Security", href: "/security", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ pathname, onClose, isCollapsed, setIsCollapsed }) {
  return (
    <>
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-slate-200 dark:border-slate-800/80 shrink-0 overflow-hidden",
        isCollapsed ? "justify-center px-0" : "px-5 justify-between"
      )}>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col leading-none"
            >
              <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                SAMPAT
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                AI Finance Manager
              </span>
            </motion.div>
          )}
        </Link>
        {!isCollapsed && setIsCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsCollapsed(true);
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <motion.nav 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
      >
        {menuItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/transaction/create"
              ? pathname.startsWith("/transaction")
              : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <motion.div
              key={item.name}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 }
              }}
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href={item.href}
                prefetch={true}
                onClick={onClose}
                className={cn(
                  "flex items-center rounded-xl text-[14.5px] font-semibold transition-all duration-200 group relative",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
                  isActive
                    ? "text-[#3B82F6] dark:text-indigo-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-xl bg-blue-50 dark:bg-indigo-500/10 border border-blue-200/50 dark:border-indigo-500/20 z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    "relative z-10 transition-colors duration-200 shrink-0",
                    isActive
                      ? "text-[#3B82F6] dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}
                />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* Logout */}
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 }
          }}
          whileHover={{ x: isCollapsed ? 0 : 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 mt-1",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
            )}
          >
            <LogOut size={17} className="text-slate-500 dark:text-slate-400 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
          </Link>
        </motion.div>
      </motion.nav>

      {/* Upgrade to Pro Card */}
      <div className="p-3 shrink-0 overflow-hidden">
        {isCollapsed ? (
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer shrink-0">
              <Rocket size={18} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-[#1A1F3A] dark:to-[#0F172A] border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 overflow-hidden">
            {/* glow blobs */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-xl" />

            {/* rocket icon */}
            <div className="relative z-10 flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Rocket size={20} className="text-white" />
              </div>
            </div>

            <p className="relative z-10 text-sm font-black text-slate-900 dark:text-white text-center mb-1">
              Upgrade to Pro
            </p>
            <p className="relative z-10 text-xs text-slate-500 dark:text-slate-400 text-center mb-3 leading-relaxed">
              Unlock advanced analytics, AI reports and more insights.
            </p>
            <button className="relative z-10 w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20" suppressHydrationWarning>
              Upgrade Now
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    closed: {
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const firstName =
    user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";
  const fullName = user?.fullName || firstName;

  return (
    <div className="bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 min-h-screen flex overflow-hidden font-sans transition-colors duration-500">
      {/* ── Desktop Sidebar ── */}
      <motion.aside 
        animate={{ width: isCollapsed ? 76 : 224 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={() => {
          if (isCollapsed) setIsCollapsed(false);
        }}
        className={cn(
          "hidden lg:flex flex-col bg-white dark:bg-[#0a0a0f] border-r border-slate-200 dark:border-slate-800/60 shrink-0 transition-colors duration-500 overflow-hidden relative select-none",
          isCollapsed && "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
        )}
      >
        <SidebarContent 
          pathname={pathname} 
          onClose={undefined} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="fixed inset-y-0 left-0 w-56 bg-white dark:bg-[#0a0a0f] border-r border-slate-200 dark:border-slate-800/60 z-50 flex flex-col lg:hidden transition-colors duration-500"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  suppressHydrationWarning
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent
                pathname={pathname}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={false}
                setIsCollapsed={undefined}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Navbar ── */}
        <header className="h-14 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-5 z-30 shrink-0 transition-colors duration-500">
          {/* Left: mobile toggle + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white p-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50"
              suppressHydrationWarning
            >
              <Menu size={18} />
            </button>

            {/* Welcome text (desktop) */}
            <div className="hidden md:block">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Welcome back,{" "}
                <span className="text-slate-900 dark:text-white font-black">{firstName}!</span>
              </p>
            </div>
          </div>

          {/* Right: search + bell + theme toggle + user */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-1.5 w-52 focus-within:border-[#3B82F6]/50 transition-all">
              <Search size={13} className="text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
                suppressHydrationWarning
              />
              <span className="text-sm text-slate-500 dark:text-slate-600 font-bold border border-slate-300 dark:border-slate-700 px-1 py-0.5 rounded hidden lg:block">
                ⌘K
              </span>
            </div>

            {/* Bell with badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                suppressHydrationWarning
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-sm font-black text-slate-900 dark:text-white flex items-center justify-center">
                  3
                </span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        Notifications
                      </span>
                      <span className="text-sm bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black px-2 py-0.5 rounded-full uppercase">
                        3 New
                      </span>
                    </div>
                    {[
                      {
                        title: "High spending in Shopping",
                        time: "2 hours ago",
                        color: "#EF4444",
                      },
                      {
                        title: "Budget limit exceeded",
                        time: "Yesterday",
                        color: "#F59E0B",
                      },
                      {
                        title: "New AI recommendation",
                        time: "2 days ago",
                        color: "#8B5CF6",
                      },
                    ].map((n, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800/50 transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: n.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Global Toggles */}
            <CurrencySelector />
            <PrivacyToggle />
            <ThemeToggle />

            {/* User */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <UserButton
                appearance={{
                  elements: { avatarBox: "w-8 h-8 ring-2 ring-indigo-500/30" },
                }}
              />
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{fullName}</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">
                  Premium User
                </span>
              </div>
              <ChevronDown size={13} className="text-slate-500 dark:text-slate-500 hidden md:block" />
            </div>
          </div>
        </header>

        {/* ── Page Body ── */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative max-w-7xl mx-auto w-full pb-24 md:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 dark:border-slate-800/50 px-6 py-3 flex items-center justify-center text-xs text-slate-500 dark:text-slate-600 font-semibold shrink-0">
          <span>
            Made with{" "}
            <span className="text-rose-500">♥</span> for smart financial
            planning
          </span>
        </footer>
      </div>
    </div>
  );
}
