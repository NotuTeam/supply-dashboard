/** @format */

"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Plus, Tags, Pencil, Trash2, Check, X, Search } from "lucide-react";
import AxiosClient from "@/lib/axios";
import toast from "react-hot-toast";
import { Brand } from "@/interface/type";
import { BrandSyncEvent, BrandSyncStorageKey } from "@/lib/var";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await AxiosClient.get<Brand[]>("/brands");
      setBrands(res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat brand");
    } finally {
      setLoading(false);
    }
  };

  const notifyBrandUpdated = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(BrandSyncStorageKey, Date.now().toString());
    window.dispatchEvent(new Event(BrandSyncEvent));
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    try {
      setSaving(true);
      await AxiosClient.post("/brands", { name: brandName.trim() });
      setBrandName("");
      setShowCreateModal(false);
      toast.success("Brand berhasil disimpan");
      notifyBrandUpdated();
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan brand");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setEditName(brand.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdateBrand = async (brandId: number) => {
    if (!editName.trim()) return;

    try {
      setSaving(true);
      await AxiosClient.patch(`/brands/${brandId}`, { name: editName.trim() });
      toast.success("Brand berhasil diupdate");
      cancelEdit();
      notifyBrandUpdated();
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal update brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`Hapus brand ${brand.name}?`)) return;

    try {
      setDeletingId(brand.id);
      await AxiosClient.delete(`/brands/${brand.id}`);
      toast.success("Brand berhasil dihapus");
      notifyBrandUpdated();
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus brand");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBrands = useMemo(
    () =>
      brands.filter((brand) =>
        brand.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [brands, search],
  );

  let brandContent: ReactNode;

  if (loading) {
    brandContent = <div className="p-6 text-gray-500">Memuat brand...</div>;
  } else if (filteredBrands.length === 0) {
    brandContent = (
      <div className="p-6 text-gray-500 text-center">Tidak ada data brand.</div>
    );
  } else {
    brandContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary-600" />
              {editingId === brand.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="font-medium text-gray-900">{brand.name}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-1">
              {editingId === brand.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateBrand(brand.id)}
                    disabled={saving}
                    className="p-2 rounded-lg text-green-700 hover:bg-green-100"
                    title="Simpan"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-200"
                    title="Batal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(brand)}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-100"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(brand)}
                    disabled={deletingId === brand.id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-100 disabled:opacity-50"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">
            Master data merk untuk konsistensi produk dan filter
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Brand
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        {brandContent}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Tambah Brand
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setBrandName("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Brand
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama brand..."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setBrandName("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
