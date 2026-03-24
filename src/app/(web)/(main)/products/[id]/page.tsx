/** @format */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Truck, Clock, MinusCircle, X } from "lucide-react";
import AxiosClient from "@/lib/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  ApiProduct,
  ProductFlowLog,
  ProductStockOutLog,
  ProductView,
  Shipment,
} from "@/interface/type";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<ProductView | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stockOutLogs, setStockOutLogs] = useState<ProductStockOutLog[]>([]);
  const [stockOutQty, setStockOutQty] = useState(1);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [submittingStockOut, setSubmittingStockOut] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productsRes, shipmentsRes, stockOutLogsRes] = await Promise.all([
        AxiosClient.get<ApiProduct[]>("/products"),
        AxiosClient.get<Shipment[]>("/shipments"),
        AxiosClient.get<ProductStockOutLog[]>(
          `/products/${productId}/stock-out-logs`,
        ),
      ]);

      const shipmentData = shipmentsRes.data || [];
      setShipments(shipmentData);
      setStockOutLogs(stockOutLogsRes.data || []);

      const foundProduct = (productsRes.data || []).find(
        (p) => p.id === productId,
      );
      if (foundProduct) {
        const ordered = shipmentData
          .filter((shipment) => shipment.status === "ordered")
          .flatMap((shipment) => shipment.items)
          .filter((item) => item.productId === foundProduct.id)
          .reduce((sum, item) => sum + item.qty, 0);

        const onDelivery = shipmentData
          .filter(
            (shipment) =>
              shipment.status === "on_delivery" ||
              shipment.status === "arrived",
          )
          .flatMap((shipment) => shipment.items)
          .filter((item) => item.productId === foundProduct.id)
          .reduce((sum, item) => sum + item.qty, 0);

        setProduct({
          ...foundProduct,
          stockOrdered: ordered,
          stockOnDelivery: onDelivery,
          totalStock: foundProduct.qty + ordered + onDelivery,
        });
      } else {
        toast.error("Product tidak ditemukan");
        router.push("/products");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleStockOutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;

    if (stockOutQty <= 0) {
      toast.error("Quantity stok keluar harus lebih dari 0");
      return;
    }

    if (stockOutQty > product.qty) {
      toast.error(
        `Stok keluar (quantity ${stockOutQty}) tidak boleh lebih besar dari stok tersedia (${product.qty})`,
      );
      return;
    }

    try {
      setSubmittingStockOut(true);
      await AxiosClient.post(`/products/${product.id}/stock-out`, {
        qty: stockOutQty,
      });
      toast.success("Stok keluar berhasil dicatat");
      setStockOutQty(1);
      setShowStockOutModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal mencatat stok keluar",
      );
    } finally {
      setSubmittingStockOut(false);
    }
  };

  const productFlowLogs: ProductFlowLog[] = useMemo(() => {
    if (!product) return [];

    const shipmentLogs: ProductFlowLog[] = shipments.flatMap((shipment) =>
      shipment.items
        .filter((item) => item.productId === product.id)
        .map((item) => ({
          type: "shipment",
          shipmentId: shipment.id,
          containerNumber: shipment.containerNumber,
          status: shipment.status,
          qty: item.qty,
          eta: shipment.eta,
          etd: shipment.etd,
          happenedAt: shipment.eta,
        })),
    );

    const stockOutFlowLogs: ProductFlowLog[] = stockOutLogs.map((log) => ({
      type: "stock_out",
      id: log.id,
      qty: log.qty,
      stockOutAt: log.stockOutAt,
      happenedAt: log.stockOutAt,
    }));

    return [...shipmentLogs, ...stockOutFlowLogs].sort(
      (a, b) => dayjs(b.happenedAt).valueOf() - dayjs(a.happenedAt).valueOf(),
    );
  }, [shipments, stockOutLogs, product]);

  const getStockStatus = (available: number) => {
    if (available === 0)
      return { label: "Habis", color: "bg-red-100 text-red-700" };
    if (available <= 40)
      return { label: "Rendah", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Tersedia", color: "bg-green-100 text-green-700" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const stockStatus = getStockStatus(product.qty);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detail Product</h1>
          <p className="text-gray-600 mt-1">
            Informasi lengkap product dan log alur barang
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              {product.name}
            </h2>
            <p className="text-sm text-gray-500">
              {product.brandName} • {product.typeName}
            </p>
            <p className="text-gray-500">
              {product.size} • {product.pattern}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${stockStatus.color}`}
          >
            {stockStatus.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StockCard
            label="Tersedia"
            value={product.qty}
            color="green"
            icon={<Package className="w-5 h-5" />}
          />
          <StockCard
            label="On Delivery"
            value={product.stockOnDelivery}
            color="blue"
            icon={<Truck className="w-5 h-5" />}
          />
          <StockCard
            label="Dipesan"
            value={product.stockOrdered}
            color="orange"
            icon={<Clock className="w-5 h-5" />}
          />
          <StockCard label="Total" value={product.totalStock} color="purple" />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Log</h3>
          {productFlowLogs.length ? (
            <div className="space-y-3">
              {productFlowLogs.map((log) =>
                log.type === "shipment" ? (
                  <div
                    key={`shipment-${log.shipmentId}-${log.containerNumber}-${log.qty}-${log.eta}`}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <p className="font-medium text-gray-900">
                          Container {log.containerNumber}
                        </p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Quantity</p>
                        <p className="text-sm font-semibold text-gray-900">{log.qty}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">ETD</p>
                        <p className="text-sm font-semibold text-gray-900">{dayjs(log.etd).format("DD MMM YYYY HH:mm")}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">ETA</p>
                        <p className="text-sm font-semibold text-gray-900">{dayjs(log.eta).format("DD MMM YYYY HH:mm")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`stock-out-${log.id}`}
                    className="p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MinusCircle className="w-4 h-4 text-red-600" />
                      <p className="font-medium text-gray-900">Stok Keluar</p>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white border border-red-100 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Quantity</p>
                        <p className="text-sm font-semibold text-gray-900">{log.qty}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-red-100 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Tanggal Keluar</p>
                        <p className="text-sm font-semibold text-gray-900">{dayjs(log.stockOutAt).format("DD MMM YYYY HH:mm")}</p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Belum ada log alur barang untuk produk ini.
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Keluarkan Stok
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Stok keluar tidak boleh melebihi stok tersedia saat ini (
                {product.qty}).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStockOutModal(true)}
              disabled={product.qty <= 0}
              className="h-10 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Keluarkan Stok
            </button>
          </div>
        </div>
      </div>

      {showStockOutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Keluarkan Stok
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Stok tersedia saat ini: {product.qty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStockOutModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleStockOutSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Keluar
                </label>
                <input
                  type="number"
                  min={1}
                  max={product.qty}
                  value={stockOutQty}
                  onChange={(e) => setStockOutQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Stok keluar tidak boleh melebihi stok tersedia.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockOutModal(false)}
                  className="h-10 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingStockOut || product.qty <= 0}
                  className="h-10 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submittingStockOut ? "Menyimpan..." : "Keluarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StockCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "orange" | "purple";
  icon?: React.ReactNode;
}) {
  const colorMap = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`rounded-xl p-4 border ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    ordered: { label: "Ordered", color: "bg-amber-100 text-amber-700" },
    on_delivery: { label: "On Delivery", color: "bg-blue-100 text-blue-700" },
    arrived: { label: "Arrived", color: "bg-purple-100 text-purple-700" },
    done: { label: "Done", color: "bg-green-100 text-green-700" },
  };

  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
