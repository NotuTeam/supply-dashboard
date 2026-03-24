/** @format */

"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  Truck,
  X,
  Calendar,
  Package,
  CheckCircle2,
  Clock3,
  CircleDashed,
  Plus,
  ArrowRight,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";
import AxiosClient from "@/lib/axios";
import toast from "react-hot-toast";
import { ApiProduct, Shipment, ShipmentStatus } from "@/interface/type";

const STATUS_STEPS: ShipmentStatus[] = [
  "ordered",
  "on_delivery",
  "arrived",
  "done",
];

type DeliveryFormItem = {
  productId: number;
  qty: number;
};

type DeliveryForm = {
  containerNumber: string;
  etd: string;
  eta: string;
  forwarder: string;
  supplier: string;
  status: ShipmentStatus;
  items: DeliveryFormItem[];
};

const initialForm: DeliveryForm = {
  containerNumber: "",
  etd: "",
  eta: "",
  forwarder: "",
  supplier: "",
  status: "ordered",
  items: [{ productId: 0, qty: 1 }],
};

export default function DeliveryPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">(
    "all",
  );
  const [selectedDelivery, setSelectedDelivery] = useState<Shipment | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DeliveryForm>(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shipmentsRes, productsRes] = await Promise.all([
        AxiosClient.get<Shipment[]>("/shipments"),
        AxiosClient.get<ApiProduct[]>("/products"),
      ]);
      setShipments(shipmentsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat delivery");
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const base: Record<ShipmentStatus, number> = {
      ordered: 0,
      on_delivery: 0,
      arrived: 0,
      done: 0,
    };

    for (const shipment of shipments) {
      base[shipment.status] += 1;
    }

    return base;
  }, [shipments]);

  const filteredShipments = useMemo(
    () =>
      shipments.filter((shipment) => {
        const key =
          `${shipment.containerNumber} ${shipment.forwarder} ${shipment.supplier}`.toLowerCase();
        const matchSearch = key.includes(search.toLowerCase());
        const matchStatus =
          statusFilter === "all" ? true : shipment.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [shipments, search, statusFilter],
  );

  const resetForm = () => {
    setFormData(initialForm);
  };

  const handleAddDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedItems = formData.items.filter(
      (item) => item.productId > 0 && item.qty > 0,
    );
    if (!normalizedItems.length) {
      toast.error("Produk delivery minimal 1 item");
      return;
    }

    try {
      setSubmitting(true);
      await AxiosClient.post("/shipments", {
        ...formData,
        etd: new Date(formData.etd).toISOString(),
        eta: new Date(formData.eta).toISOString(),
        items: normalizedItems,
      });

      toast.success("Delivery berhasil ditambahkan");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal menambahkan delivery",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (
    shipmentId: number,
    status: ShipmentStatus,
  ) => {
    try {
      await AxiosClient.patch(`/shipments/${shipmentId}/status`, { status });
      toast.success("Status delivery berhasil diperbarui");
      fetchData();
      if (selectedDelivery && selectedDelivery.id === shipmentId) {
        setSelectedDelivery({ ...selectedDelivery, status });
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal update status delivery",
      );
    }
  };

  const getNextStatus = (status: ShipmentStatus): ShipmentStatus | null => {
    const idx = STATUS_STEPS.indexOf(status);
    if (idx === -1 || idx === STATUS_STEPS.length - 1) return null;
    return STATUS_STEPS[idx + 1];
  };

  const setItemField = (
    index: number,
    field: keyof DeliveryFormItem,
    value: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: 0, qty: 1 }],
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev) => {
      const items = prev.items.filter((_, idx) => idx !== index);
      return {
        ...prev,
        items: items.length ? items : [{ productId: 0, qty: 1 }],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery</h1>
          <p className="text-gray-600 mt-1">
            List delivery, status, detail produk, dan log status
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Delivery
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatusFilterCard
          active={statusFilter === "all"}
          label="Semua"
          count={shipments.length}
          onClick={() => setStatusFilter("all")}
          color="bg-gray-100 text-gray-700"
        />
        <StatusFilterCard
          active={statusFilter === "ordered"}
          label="Ordered"
          count={statusCounts.ordered}
          onClick={() => setStatusFilter("ordered")}
          color="bg-amber-100 text-amber-700"
        />
        <StatusFilterCard
          active={statusFilter === "on_delivery"}
          label="On Delivery"
          count={statusCounts.on_delivery}
          onClick={() => setStatusFilter("on_delivery")}
          color="bg-blue-100 text-blue-700"
        />
        <StatusFilterCard
          active={statusFilter === "arrived"}
          label="Arrived"
          count={statusCounts.arrived}
          onClick={() => setStatusFilter("arrived")}
          color="bg-purple-100 text-purple-700"
        />
        <StatusFilterCard
          active={statusFilter === "done"}
          label="Done"
          count={statusCounts.done}
          onClick={() => setStatusFilter("done")}
          color="bg-green-100 text-green-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari delivery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Memuat delivery...</div>
        ) : filteredShipments.length ? (
          <>
            <div className="md:hidden divide-y divide-gray-100">
              {filteredShipments.map((shipment) => {
                const nextStatus = getNextStatus(shipment.status);
                return (
                  <div key={shipment.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                        <p className="font-medium text-gray-900 truncate">{shipment.containerNumber}</p>
                      </div>
                      <StatusBadge status={shipment.status} />
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-sm">
                      <p className="text-gray-700"><span className="text-gray-500">Forwarder:</span> {shipment.forwarder}</p>
                      <p className="text-gray-700"><span className="text-gray-500">Supplier:</span> {shipment.supplier}</p>
                      <p className="text-gray-700"><span className="text-gray-500">ETA:</span> {dayjs(shipment.eta).format("DD MMM YYYY HH:mm")}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {nextStatus && (
                        <button
                          onClick={() => handleChangeStatus(shipment.id, nextStatus)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
                          title="Next Status"
                        >
                          <ArrowRight className="w-3 h-3" />
                          {toStatusLabel(nextStatus)}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDelivery(shipment)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Container</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Forwarder</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Supplier</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ETA</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredShipments.map((shipment) => {
                    const nextStatus = getNextStatus(shipment.status);
                    return (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{shipment.containerNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{shipment.forwarder}</td>
                        <td className="py-3 px-4 text-gray-700">{shipment.supplier}</td>
                        <td className="py-3 px-4 text-gray-600">{dayjs(shipment.eta).format("DD MMM YYYY HH:mm")}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={shipment.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-2">
                            {nextStatus && (
                              <button
                                onClick={() => handleChangeStatus(shipment.id, nextStatus)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
                                title="Next Status"
                              >
                                <ArrowRight className="w-3 h-3" />
                                {toStatusLabel(nextStatus)}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedDelivery(shipment)}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">Tidak ada data delivery</div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Delivery
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleAddDelivery}
              className="p-4 overflow-y-auto max-h-[calc(90vh-80px)] space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nomor Kontainer">
                  <input
                    type="text"
                    required
                    value={formData.containerNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        containerNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
                <Field label="Supplier">
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
                <Field label="Forwarder">
                  <input
                    type="text"
                    required
                    value={formData.forwarder}
                    onChange={(e) =>
                      setFormData({ ...formData, forwarder: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as ShipmentStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ordered">Ordered</option>
                    <option value="on_delivery">On Delivery</option>
                    <option value="arrived">Arrived</option>
                    <option value="done">Done</option>
                  </select>
                </Field>
                <Field label="ETD">
                  <input
                    type="datetime-local"
                    required
                    value={formData.etd}
                    onChange={(e) =>
                      setFormData({ ...formData, etd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
                <Field label="ETA">
                  <input
                    type="datetime-local"
                    required
                    value={formData.eta}
                    onChange={(e) =>
                      setFormData({ ...formData, eta: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Produk + Qty
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-[1fr_160px_40px] gap-2 items-end"
                  >
                    <Field label={`Produk #${idx + 1}`}>
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          setItemField(idx, "productId", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value={0}>Pilih produk</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.size})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Qty">
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.qty}
                        onChange={(e) =>
                          setItemField(idx, "qty", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="h-10 w-10 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200"
                      title="Hapus item"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60"
                >
                  {submitting ? "Menyimpan..." : "Simpan Delivery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Delivery
              </h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoCard
                  label="Container"
                  value={selectedDelivery.containerNumber}
                  icon={<Truck className="w-4 h-4" />}
                />
                <InfoCard
                  label="ETD"
                  value={dayjs(selectedDelivery.etd).format(
                    "DD MMM YYYY HH:mm",
                  )}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <InfoCard
                  label="ETA"
                  value={dayjs(selectedDelivery.eta).format(
                    "DD MMM YYYY HH:mm",
                  )}
                  icon={<Clock3 className="w-4 h-4" />}
                />
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={selectedDelivery.status} />
                <select
                  value={selectedDelivery.status}
                  onChange={(e) =>
                    handleChangeStatus(
                      selectedDelivery.id,
                      e.target.value as ShipmentStatus,
                    )
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ordered">Ordered</option>
                  <option value="on_delivery">On Delivery</option>
                  <option value="arrived">Arrived</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Detail Produk
                </h4>
                {selectedDelivery.items.length ? (
                  <div className="space-y-2">
                    {selectedDelivery.items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">
                          Qty {item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Tidak ada item pada delivery ini.
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Log Status Pengiriman
                </h4>
                <div className="space-y-2">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = STATUS_STEPS.indexOf(
                      selectedDelivery.status,
                    );
                    const reached = idx <= currentIdx;
                    return (
                      <div
                        key={step}
                        className={`p-3 rounded-lg border ${
                          reached
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {reached ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <CircleDashed className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {toStatusLabel(step)}
                            </span>
                          </div>
                          <span
                            className={`text-xs ${reached ? "text-green-700" : "text-gray-500"}`}
                          >
                            {reached ? "done" : "pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toStatusLabel(status: ShipmentStatus): string {
  const map: Record<ShipmentStatus, string> = {
    ordered: "Ordered",
    on_delivery: "On Delivery",
    arrived: "Arrived",
    done: "Done",
  };
  return map[status];
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const colorMap: Record<ShipmentStatus, string> = {
    ordered: "bg-amber-100 text-amber-700",
    on_delivery: "bg-blue-100 text-blue-700",
    arrived: "bg-purple-100 text-purple-700",
    done: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colorMap[status]}`}
    >
      {toStatusLabel(status)}
    </span>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusFilterCard({
  active,
  label,
  count,
  onClick,
  color,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all min-w-0 ${
        active
          ? "border-primary-400 shadow-sm"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700 truncate">{label}</p>
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
      <span
        className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {count} Pengiriman
      </span>
    </button>
  );
}
