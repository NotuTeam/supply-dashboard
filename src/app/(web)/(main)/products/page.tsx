/** @format */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Package,
  Truck,
  Clock,
} from "lucide-react";
import AxiosClient from "@/lib/axios";
import toast from "react-hot-toast";
import { ApiProduct, Brand, ProductView, Shipment } from "@/interface/type";
import { BrandSyncEvent, BrandSyncStorageKey } from "@/lib/var";

type ProductForm = {
  brandId: number;
  typeName: string;
  size: string;
  pattern: string;
  qty: number;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<number | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductView | null>(null);
  const [formData, setFormData] = useState<ProductForm>({
    brandId: 0,
    typeName: "",
    size: "",
    pattern: "",
    qty: 0,
  });

  useEffect(() => {
    fetchData();

    const handleBrandUpdated = () => {
      fetchBrandsOnly();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BrandSyncStorageKey) {
        fetchBrandsOnly();
      }
    };

    window.addEventListener(BrandSyncEvent, handleBrandUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(BrandSyncEvent, handleBrandUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const enrichProduct = (product: ApiProduct, allShipments: Shipment[]): ProductView => {
    const ordered = allShipments
      .filter((shipment) => shipment.status === "ordered")
      .flatMap((shipment) => shipment.items)
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.qty, 0);

    const onDelivery = allShipments
      .filter((shipment) => shipment.status === "on_delivery" || shipment.status === "arrived")
      .flatMap((shipment) => shipment.items)
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.qty, 0);

    return {
      ...product,
      stockOrdered: ordered,
      stockOnDelivery: onDelivery,
      totalStock: product.qty + ordered + onDelivery,
    };
  };

  const fetchData = async () => {
    try {
      const [productsRes, shipmentsRes, brandsRes] = await Promise.all([
        AxiosClient.get<ApiProduct[]>("/products"),
        AxiosClient.get<Shipment[]>("/shipments"),
        AxiosClient.get<Brand[]>("/brands"),
      ]);

      const shipmentData = shipmentsRes.data || [];
      const brandData = brandsRes.data || [];
      setShipments(shipmentData);
      setBrands(brandData);

      const mapped = (productsRes.data || []).map((product) => enrichProduct(product, shipmentData));
      setProducts(mapped);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat products");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandsOnly = async () => {
    try {
      const brandsRes = await AxiosClient.get<Brand[]>("/brands");
      setBrands(brandsRes.data || []);
    } catch {
      
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brandId) {
      toast.error("Merk wajib dipilih");
      return;
    }

    try {
      if (editingProduct) {
        await AxiosClient.patch(`/products/${editingProduct.id}`, formData);
        toast.success("Product berhasil diupdate");
      } else {
        await AxiosClient.post("/products", formData);
        toast.success("Product berhasil dibuat");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operasi gagal");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus product ini?")) return;

    try {
      await AxiosClient.delete(`/products/${id}`);
      toast.success("Product berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus product");
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: ProductView, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      brandId: product.brandId,
      typeName: product.typeName,
      size: product.size,
      pattern: product.pattern,
      qty: product.qty,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      brandId: 0,
      typeName: "",
      size: "",
      pattern: "",
      qty: 0,
    });
  };

  const selectedBrandName = useMemo(() => {
    return brands.find((brand) => brand.id === formData.brandId)?.name ?? "";
  }, [brands, formData.brandId]);

  const getStockStatus = (available: number) => {
    if (available === 0) return { label: "Habis", color: "bg-red-500" };
    if (available <= 40) return { label: "Rendah", color: "bg-yellow-500" };
    return { label: "Tersedia", color: "bg-green-500" };
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const key = `${product.name} ${product.brandName} ${product.typeName} ${product.size} ${product.pattern}`.toLowerCase();
        const matchSearch = key.includes(search.toLowerCase());
        const matchBrand = brandFilter === "all" ? true : product.brandId === brandFilter;
        return matchSearch && matchBrand;
      }),
    [products, search, brandFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">List product, stok, dan detail alur barang</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Semua Merk</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Memuat product...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.qty);
              return (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">{product.brandName} • {product.typeName}</p>
                        <p className="text-xs text-gray-500">{product.size} • {product.pattern}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${stockStatus.color}`} title={stockStatus.label} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-600 font-medium">Tersedia</p>
                      <p className="text-lg font-bold text-green-700">{product.qty}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-600 font-medium">On Delivery</p>
                      <p className="text-lg font-bold text-blue-700">{product.stockOnDelivery}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-orange-600 font-medium">Dipesan</p>
                      <p className="text-lg font-bold text-orange-700">{product.stockOrdered}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      stockStatus.label === "Habis"
                        ? "bg-red-100 text-red-700"
                        : stockStatus.label === "Rendah"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {stockStatus.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEditModal(product, e)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">Tidak ada product</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? "Edit Product" : "Tambah Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Merk</label>
                <select
                  required
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>Pilih merk</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jenis</label>
                <input
                  type="text"
                  required
                  value={formData.typeName}
                  onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Product (Auto)</label>
                <input
                  type="text"
                  value={`${selectedBrandName} ${formData.typeName}`.trim()}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                  <input
                    type="text"
                    required
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {editingProduct ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
