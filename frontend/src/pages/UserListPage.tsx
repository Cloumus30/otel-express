import { useState, useEffect } from "react";
import type { FC } from "react";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  Users,
  CheckCircle,
  AlertTriangle,
  Mail,
  Calendar,
} from "lucide-react";
import type { User, CreateUserInput, UpdateUserInput } from "../types/user";
import { userService } from "../services/userService";
import { UserModal } from "../components/UserModal";
import { useLogger } from "../hooks/useLogger";

export const UserListPage: FC = () => {
  const log = useLogger("UserListPage");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      log.debug("Mengambil data user dari API...");
      const data = await userService.getAll();
      setUsers(data);
      log.info("Berhasil mengambil data user", {
        total_users: data.length,
        action: "fetch_users_success",
      });
    } catch (err: any) {
      log.error("Gagal mengambil data user dari backend Express", err, {
        action: "fetch_users_error",
      });
      setError(
        err.response?.data?.message ||
          "Gagal mengambil data user dari server. Pastikan backend Express sedang berjalan di port 3000.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCreateOrUpdate = async (
    payload: CreateUserInput | UpdateUserInput,
  ) => {
    try {
      if (editingUser) {
        log.info("Mengupdate user...", {
          user_id: editingUser.id,
          updated_fields: Object.keys(payload),
          action: "update_user_start",
        });
        await userService.update(editingUser.id, payload);
        log.info("User berhasil diperbarui", {
          user_id: editingUser.id,
          action: "update_user_success",
        });
        showToast("User berhasil diperbarui!");
      } else {
        log.info("Membuat user baru...", {
          username: payload.username,
          email: payload.email,
          action: "create_user_start",
        });
        await userService.create(payload as CreateUserInput);
        log.info("User baru berhasil dibuat", {
          username: payload.username,
          action: "create_user_success",
        });
        showToast("User baru berhasil ditambahkan!");
      }
      await fetchUsers();
    } catch (err: any) {
      log.error("Gagal menyimpan data user", err, {
        is_edit: Boolean(editingUser),
        action: "save_user_error",
      });
      throw err; // Re-throw agar modal bisa menampilkan pesan error
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) {
      try {
        setDeletingId(id);
        log.warn("Menghapus user...", {
          user_id: id,
          user_name: name,
          action: "delete_user_start",
        });
        await userService.delete(id);
        log.info("User berhasil dihapus", {
          user_id: id,
          action: "delete_user_success",
        });
        showToast("User berhasil dihapus.");
        await fetchUsers();
      } catch (err: any) {
        log.error("Gagal menghapus user", err, {
          user_id: id,
          action: "delete_user_error",
        });
        showToast(
          err.response?.data?.message || "Gagal menghapus user.",
          "error",
        );
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data akun pengguna yang terhubung langsung dengan REST API
            Express.js & Prisma ORM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-2xs flex items-center justify-center disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-xs border animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold uppercase tracking-wider hover:opacity-75"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Pengguna
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {loading ? "-" : users.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hasil Filter
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {loading ? "-" : filteredUsers.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Backend Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  error ? "bg-red-500" : "bg-emerald-500"
                }`}
              />
              {error ? "Disconnected" : "Online (:3000)"}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 mt-3 truncate">
            {error ? "Koneksi error" : "Express & Prisma Terhubung"}
          </p>
        </div>
      </div>

      {/* Main Table / Data Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari user berdasarkan nama, username, atau email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Gagal Terhubung ke Backend</p>
              <p className="mt-1 text-red-600">{error}</p>
              <button
                onClick={() => fetchUsers()}
                className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Memuat data user...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Tidak ada data user
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? "Tidak ditemukan user yang cocok dengan kata kunci pencarian Anda."
                : "Belum ada data user tersimpan di database. Silakan klik tombol Tambah User."}
            </p>
          </div>
        )}

        {/* Table Content */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Username</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Dibuat Pada</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        @{user.username}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={deletingId === user.id}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus User"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingUser}
      />
    </div>
  );
};
