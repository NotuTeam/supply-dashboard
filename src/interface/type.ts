/** @format */

export interface GlobalState {
  hasLogin: boolean;
  user: User | null;
  token?: string;
  isLoading: boolean;
}

export interface GlobalActions {
  setAuth: (user: User | null, token: string) => void;
  setLoading: (loading: boolean) => void;
  setToken: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export interface GlobalProviderProps {
  state: GlobalState;
  actions: GlobalActions;
}

export type Actions =
  | { type: "SET_AUTH"; payload: { user: User | null; token: string } }
  | { type: "SET_TOKEN"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGOUT" };

export interface MenuItem {
  id: number;
  text: string;
  icon: any;
  href?: string;
  children?: MenuItem[];
}

export interface User {
  id: number;
  username: string;
  role: "superadmin" | "admin" | "staff";
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: number;
  brandId: number;
  brandName: string;
  typeName: string;
  name: string;
  size: string;
  pattern: string;
  qty: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductView extends ApiProduct {
  stockOnDelivery: number;
  stockOrdered: number;
  totalStock: number;
}

export type ShipmentStatus = "ordered" | "on_delivery" | "arrived" | "done";

export interface ShipmentItem {
  productId: number;
  productName: string;
  qty: number;
}

export interface Shipment {
  id: number;
  containerNumber: string;
  etd: string;
  eta: string;
  forwarder: string;
  supplier: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  items: ShipmentItem[];
}

export interface OverviewResponse {
  kpi: {
    totalSkus: number;
    totalUnits: number;
    lowStockAlerts: number;
    incomingShipmentsToday: number;
  };
  flow: {
    orderedQty: number;
    onDeliveryQty: number;
    arrivedQty: number;
    doneQty: number;
  };
  timeline: Array<{
    step: string;
    status: "active" | "idle";
    count: number;
  }>;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: "superadmin" | "admin" | "staff";
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: "superadmin" | "admin" | "staff";
}

export interface UserApiResponse {
  id: number;
  username: string;
  role: "superadmin" | "admin" | "staff";
  createdAt: string;
  updatedAt: string;
}

export interface ProductFlowLog {
  shipmentId: number;
  containerNumber: string;
  status: ShipmentStatus;
  qty: number;
  eta: string;
  etd: string;
}
