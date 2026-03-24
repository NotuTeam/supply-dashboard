/** @format */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useGlobalState } from "@/lib/middleware";
import { useLogout } from "@/hooks/useAuth";

import { MenuItem } from "@/interface/type";
import { DefaultMenu, SuperMenu } from "@/lib/var";

import {
  LogOut,
  Menu,
  X,
  MoveLeft,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";

export default function Sidebar() {
  const { state } = useGlobalState();
  const pathname = usePathname();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [menuList, setMenuList] = useState<MenuItem[]>(DefaultMenu);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (state.user && state.user.role === "superadmin") {
      setMenuList(SuperMenu);
    }
  }, [state]);

  const toggleMenu = (menuId: number) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => child.href === pathname);
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isMenuActive(item);
    const isExpanded = expandedMenus.has(item.id);

    if (hasChildren && isCollapsed) {
      return (
        <button
          key={item.id}
          onClick={() => {
            setIsCollapsed(false);
            toggleMenu(item.id);
          }}
          className={`flex items-center justify-center gap-3 !px-3 py-2.5 rounded-xl transition-all duration-200 group lg:justify-center lg:px-2 ${
            isActive
              ? "bg-primary-50 text-primary-600"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
          title={item.text}
        >
          <Icon
            className={`w-5 h-5 flex-shrink-0 ${
              isActive
                ? "text-primary-600"
                : "text-gray-500 group-hover:text-gray-700"
            }`}
          />
        </button>
      );
    }

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              isActive
                ? "bg-primary-50 text-primary-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive
                    ? "text-primary-600"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              <span className="font-medium">{item.text}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
          </button>

          {isExpanded && (
            <div className="space-y-2 py-2">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={`flex items-center rounded-xl transition-all duration-200 group ${
            isActive
              ? level === 0
                ? "bg-primary-50 text-primary-600"
                : "bg-primary-50 text-primary-600"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          } ${isCollapsed ? "justify-center py-2.5 lg:px-2" : "px-3 py-2.5 gap-3"}`}
          title={isCollapsed && level === 0 ? item.text : undefined}
        >
          {level === 0 ? (
            <>
              {Icon && (
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-primary-600"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                />
              )}
              {!isCollapsed && <span className="font-medium">{item.text}</span>}
            </>
          ) : (
            <>
              <div className="w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.text}</span>
              )}
            </>
          )}
        </Link>
      );
    }

    return null;
  };

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div
        className={`fixed lg:sticky left-0 top-0 h-[100dvh] bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          isCollapsed ? "-translate-x-full lg:translate-x-0 w-0 lg:w-20" : "w-64"
        }`}
      >
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${isCollapsed ? "hidden lg:flex" : "flex"}`}>
          <div
            className={`flex items-center w-full ${
              isCollapsed ? "lg:justify-center" : "justify-between"
            }`}
          >
            <div className="flex gap-3 items-center">
              <div
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 flex items-center justify-center cursor-pointer bg-primary-500 rounded-lg"
              >
                <Package className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-gray-900 text-lg">
                  Supply
                </span>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden text-sm lg:block p-2 bg-gray-100 border border-gray-200 rounded-lg shadow-sm transition-all duration-300"
              >
                <MoveLeft size={10} className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <nav className="p-4 space-y-2 overflow-auto max-h-[65dvh] custom-scrollbar text-sm">
          {menuList.map((item: MenuItem) => renderMenuItem(item))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {!isCollapsed && state.user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {state.user.username ? state.user.username[0].toUpperCase() : "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{state.user.username}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{state.user.role}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => logout()}
            disabled={logoutPending}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full ${
              isCollapsed ? "lg:justify-center lg:px-2" : ""
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {logoutPending ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            {!isCollapsed && (
              <span className="font-medium">
                {logoutPending ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 left-4 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm lg:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
    </>
  );
}
