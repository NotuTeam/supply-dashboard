/** @format */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  Clock,
  X,
} from "lucide-react";
import AxiosClient from "@/lib/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ApiProduct, ProductFlowLog, ProductView, Shipment } from "@/interface/type";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<ProductView | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productsRes, shipmentsRes] = await Promise.all([
        AxiosClient.get<ApiProduct[]>("/products"),
        AxiosClient.get<Shipment[]>("/shipments"),
      ]);

      const shipmentData = shipmentsRes.data || [];
      setShipments(shipmentData);

      const foundProduct = (productsRes.data || []).find((p) => p.id === productId);
      if (foundProduct) {
        const ordered = shipmentData
          .filter((shipment) => shipment.status === "ordered")
          .flatMap((shipment) => shipment.items)
          .filter((item) => item.productId === foundProduct.id)
          .reduce((sum, item) => sum + item.qty, 0);

        const onDelivery = shipmentData
          .filter((shipment) => shipment.status === "on_delivery" || shipment.status === "arrived")
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

  const productFlowLogs: ProductFlowLog[] = useMemo(() => {
    if (!product) return [];

    return shipments
      .flatMap((shipment) =>
        shipment.items
          .filter((item) => item.productId === product.id)
          .map((item) => ({
            shipmentId: shipment.id,
            containerNumber: shipment.containerNumber,
            status: shipment.status,
            qty: item.qty,
            eta: shipment.eta,
            etd: shipment.etd,
          }))
      )
      .sort((a, b) => dayjs(b.eta).valueOf() - dayjs(a.eta).valueOf());
  }, [shipments, product]);

  const getStockStatus = (available: number) => {
    if (available === 0) return { label: "Habis", color: "bg-red-100 text-red-700" };
    if (available <= 40) return { label: "Rendah", color: "bg-yellow-100 text-yellow-700" };
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
          <p className="text-gray-600 mt-1">Informasi lengkap product dan log alur barang</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500">
              {product.brandName} • {product.typeName}
            </p>
            <p className="text-gray-500">
              {product.size} • {product.pattern}
            </p>
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StockCard label="Tersedia" value={product.qty} color="green" icon={<Package className="w-5 h-5" />} />
          <StockCard label="On Delivery" value={product.stockOnDelivery} color="blue" icon={<Truck className="w-5 h-5" />} />
          <StockCard label="Dipesan" value={product.stockOrdered} color="orange" icon={<Clock className="w-5 h-5" />} />
          <StockCard label="Total" value={product.totalStock} color="purple" />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Alur Barang</h3>
          {productFlowLogs.length ? (
            <div className="space-y-3">
              {productFlowLogs.map((log, idx) => (
                <div
                  key={`${log.shipmentId}-${idx}`}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-gray-900">Container {log.containerNumber}</p>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Qty: {log.qty}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ETD {dayjs(log.etd).format("DD MMM YYYY HH:mm")} • ETA {dayjs(log.eta).format("DD MMM YYYY HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Belum ada log alur barang untuk produk ini.</p>
          )}
        </div>
      </div>
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

  const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
