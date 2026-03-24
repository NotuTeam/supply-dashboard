/** @format */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, Filter, Package, Truck } from "lucide-react";
import dayjs from "dayjs";
import AxiosClient from "@/lib/axios";
import toast from "react-hot-toast";
import { ApiProduct, Brand, Shipment, ShipmentStatus } from "@/interface/type";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const STOCK_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

type StockStatus = "available" | "ordered" | "on_delivery" | "arrived";

export default function DashboardPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [brandFilter, setBrandFilter] = useState<number | "all">("all");
  const [productFilter, setProductFilter] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, brandsRes, shipmentsRes] = await Promise.all([
          AxiosClient.get<ApiProduct[]>("/products"),
          AxiosClient.get<Brand[]>("/brands"),
          AxiosClient.get<Shipment[]>("/shipments"),
        ]);

        setProducts(productsRes.data || []);
        setBrands(brandsRes.data || []);
        setShipments(shipmentsRes.data || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal memuat dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProductsByBrand = useMemo(() => {
    if (brandFilter === "all") return products;
    return products.filter((product) => product.brandId === brandFilter);
  }, [products, brandFilter]);

  useEffect(() => {
    if (productFilter === "all") return;

    const exists = filteredProductsByBrand.some((product) => product.id === productFilter);
    if (!exists) {
      setProductFilter("all");
    }
  }, [filteredProductsByBrand, productFilter]);

  const selectedProductIds = useMemo(() => {
    if (productFilter !== "all") {
      return new Set([productFilter]);
    }

    if (brandFilter !== "all") {
      return new Set(filteredProductsByBrand.map((product) => product.id));
    }

    return new Set(products.map((product) => product.id));
  }, [productFilter, brandFilter, filteredProductsByBrand, products]);

  const stockSummary = useMemo(() => {
    const available = products
      .filter((product) => selectedProductIds.has(product.id))
      .reduce((sum, product) => sum + product.qty, 0);

    let ordered = 0;
    let onDelivery = 0;
    let arrived = 0;

    for (const shipment of shipments) {
      for (const item of shipment.items) {
        if (!selectedProductIds.has(item.productId)) continue;

        if (shipment.status === "ordered") ordered += item.qty;
        if (shipment.status === "on_delivery") onDelivery += item.qty;
        if (shipment.status === "arrived") arrived += item.qty;
      }
    }

    return { available, ordered, onDelivery, arrived };
  }, [products, shipments, selectedProductIds]);

  const pieData = useMemo(
    () => [
      { name: "Tersedia", value: stockSummary.available },
      { name: "Ordered", value: stockSummary.ordered },
      { name: "On Delivery", value: stockSummary.onDelivery },
      { name: "Arrived", value: stockSummary.arrived },
    ],
    [stockSummary]
  );

  const pieDataNonZero = useMemo(() => pieData.filter((item) => item.value > 0), [pieData]);

  const shipmentContext = useMemo(
    () =>
      shipments.filter((shipment) =>
        shipment.items.some((item) => selectedProductIds.has(item.productId))
      ),
    [shipments, selectedProductIds]
  );

  const deliveryCounts = useMemo(() => {
    return {
      ordered: shipmentContext.filter((shipment) => shipment.status === "ordered").length,
      on_delivery: shipmentContext.filter((shipment) => shipment.status === "on_delivery").length,
      arrived: shipmentContext.filter((shipment) => shipment.status === "arrived").length,
    };
  }, [shipmentContext]);

  const detailShipments = useMemo(() => {
    if (!selectedStatus) return [];

    return shipmentContext
      .filter((shipment) => shipment.status === selectedStatus)
      .map((shipment) => ({
        ...shipment,
        items: shipment.items.filter((item) => selectedProductIds.has(item.productId)),
      }))
      .filter((shipment) => shipment.items.length > 0);
  }, [selectedStatus, shipmentContext, selectedProductIds]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 bg-gray-200 rounded" />
          <div className="h-28 bg-gray-200 rounded-xl" />
          <div className="h-80 bg-gray-200 rounded-xl" />
          <div className="h-56 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Home</h1>
        <p className="text-gray-600 mt-1">Monitoring instan stok dan delivery berdasarkan brand/product</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Brand</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Semua Brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Product</label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Semua Product</option>
            {filteredProductsByBrand.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Distribusi Total Stok per Status</h2>
          <p className="text-sm text-gray-500 mb-4">Tersedia, Ordered, On Delivery, dan Arrived</p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieDataNonZero}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieDataNonZero.map((entry, index) => (
                  <Cell key={entry.name} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Total Qty by Status</h2>
          <div className="space-y-3">
            <QtyRow icon={<Boxes className="w-4 h-4" />} label="Tersedia" value={stockSummary.available} color="bg-green-100 text-green-700" />
            <QtyRow icon={<Package className="w-4 h-4" />} label="Ordered" value={stockSummary.ordered} color="bg-amber-100 text-amber-700" />
            <QtyRow icon={<Truck className="w-4 h-4" />} label="On Delivery" value={stockSummary.onDelivery} color="bg-blue-100 text-blue-700" />
            <QtyRow icon={<Truck className="w-4 h-4" />} label="Arrived" value={stockSummary.arrived} color="bg-purple-100 text-purple-700" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Jumlah Delivery per Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DeliveryCountCard
            label="Ordered"
            value={deliveryCounts.ordered}
            color="bg-amber-100 text-amber-700"
            onClick={() => setSelectedStatus("ordered")}
          />
          <DeliveryCountCard
            label="On Delivery"
            value={deliveryCounts.on_delivery}
            color="bg-blue-100 text-blue-700"
            onClick={() => setSelectedStatus("on_delivery")}
          />
          <DeliveryCountCard
            label="Arrived"
            value={deliveryCounts.arrived}
            color="bg-purple-100 text-purple-700"
            onClick={() => setSelectedStatus("arrived")}
          />
        </div>
      </div>

      {selectedStatus && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Detail Delivery - {toStatusLabel(selectedStatus)} ({detailShipments.length})
            </h3>
            <button
              onClick={() => setSelectedStatus(null)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Tutup Detail
            </button>
          </div>

          {detailShipments.length ? (
            detailShipments.map((shipment) => (
              <div key={shipment.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Container {shipment.containerNumber}</p>
                    <p className="text-sm text-gray-500">
                      ETD {dayjs(shipment.etd).format("DD MMM YYYY HH:mm")} • ETA {dayjs(shipment.eta).format("DD MMM YYYY HH:mm")}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {toStatusLabel(shipment.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
                  <p><span className="text-gray-500">Forwarder:</span> {shipment.forwarder}</p>
                  <p><span className="text-gray-500">Supplier:</span> {shipment.supplier}</p>
                </div>

                <div className="space-y-2">
                  {shipment.items.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-600">Qty: {item.qty}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Tidak ada delivery untuk filter saat ini.</p>
          )}
        </div>
      )}
    </div>
  );
}

function QtyRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-700">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function DeliveryCountCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-gray-200 p-4 text-left hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <p className="text-sm text-gray-600">{label}</p>
      <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-sm font-semibold ${color}`}>{value}</span>
      <p className="text-xs text-gray-500 mt-2">Klik untuk lihat detail</p>
    </button>
  );
}

function toStatusLabel(status: ShipmentStatus): string {
  const labelMap: Record<ShipmentStatus, string> = {
    ordered: "Ordered",
    on_delivery: "On Delivery",
    arrived: "Arrived",
    done: "Done",
  };

  return labelMap[status];
}
