/** @format */
import {
  Home,
  Users,
  Package,
  Truck,
  Tags,
} from "lucide-react";

export const ValidPath = [
  "",
  "auth",
  "products",
  "brands",
  "delivery",
];

export const DefaultMenu = [
  { id: 1, text: "Home", icon: Home, href: "/" },
    { id: 4, text: "Brands", icon: Tags, href: "/brands" },
  { id: 3, text: "Products", icon: Package, href: "/products" },
  { id: 5, text: "Delivery", icon: Truck, href: "/delivery" },
];

export const SuperMenu = [
  { id: 1, text: "Home", icon: Home, href: "/" },
  { id: 2, text: "Access", icon: Users, href: "/auth" },
    { id: 4, text: "Brands", icon: Tags, href: "/brands" },
  { id: 3, text: "Products", icon: Package, href: "/products" },
  { id: 5, text: "Delivery", icon: Truck, href: "/delivery" },
];

export const LocalToken = "supply_auth_token";
export const LocalRefreshToken = "supply_refresh_token";
export const BrandSyncEvent = "brands:updated";
export const BrandSyncStorageKey = "brands_updated_at";

export const colors = [
  "#2563eb",
  "#D0229F",
  "#7C3AED",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
];
