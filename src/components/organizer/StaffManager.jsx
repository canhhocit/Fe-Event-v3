import { useState, useEffect } from "react";

const StaffAvatar = ({ name, size = 35 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const colors = ["#6c5ce7", "#00b894", "#0984e3", "#fdcb6e", "#e17055"];
  const bgColor = colors[name ? name.length % colors.length : 0];
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
      style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
};

export default function StaffManager({ api }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [refetch, setRefetch] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/organizer/my-staff?page=${page}&size=10`)
      .then((res) => {
        setStaffList(res.result?.content ?? []);
        setTotalPages(res.result?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, refetch]);

  const handleDisable = async (username) => {
    if (!window.confirm(`Xác nhận khóa tài khoản nhân viên "${username}"?`)) return;
    setActionLoading(username);
    try {
      await api.del(`/users/organizer/staff/${username}`);
      setRefetch((n) => n + 1);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnable = async (username) => {
    if (!window.confirm(`Xác nhận kích hoạt lại tài khoản "${username}"?`)) return;
    setActionLoading(username);
    try {
      await api.patch(`/users/organizer/staff/${username}/enable`);
      setRefetch((n) => n + 1);
    } finally {
      setActionLoading(null);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    username: "", password: "", email: "", fullName: "", phone: "", role: "STAFF"
  });
  const [addLoading, setAddLoading] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post("/users/organizer/staff", addForm);
      alert("Đã tạo nhân viên thành công! Vui lòng yêu cầu nhân viên check email để xác thực.");
      setShowAddModal(false);
      setAddForm({ username: "", password: "", email: "", fullName: "", phone: "", role: "STAFF" });
      setRefetch((n) => n + 1);
    } catch (err) {
      alert("Lỗi khi thêm nhân viên: " + (err.message || "Kiểm tra lại dữ liệu"));
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Nhân viên (Staff)</h4>
          <p className="text-secondary small mb-0">
            Danh sách nhân viên soát vé thuộc ban tổ chức của bạn.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary rounded-pill px-4 fw-bold"
            onClick={() => setShowAddModal(true)}
          >
            + Thêm Nhân Viên
          </button>
          <button
            className="btn btn-sm btn-outline-secondary rounded-pill px-4 fw-bold"
            onClick={() => setRefetch((n) => n + 1)}
          >
            Làm mới ↻
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-secondary small text-uppercase">
              <tr>
                <th className="px-4 py-3 border-0">Nhân viên</th>
                <th className="border-0">Email</th>
                <th className="border-0 text-center">Trạng thái</th>
                <th className="border-0 text-end px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted border-0">
                    <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                    Đang tải...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted border-0">
                    Chưa có nhân viên nào. Hãy thêm nhân viên để hỗ trợ check-in sự kiện.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 border-0">
                      <div className="d-flex align-items-center gap-3">
                        <StaffAvatar name={s.fullName || s.username} />
                        <div>
                          <div className="fw-bold text-dark">@{s.username}</div>
                          <div className="text-muted small">{s.fullName || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 small text-muted">{s.email || "—"}</td>
                    <td className="border-0 text-center">
                      {s.enabled ? (
                        <span className="badge bg-success-subtle text-success">Hoạt động</span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger">Đã khóa / Chưa XT</span>
                      )}
                    </td>
                    <td className="border-0 text-end px-4">
                      {s.enabled ? (
                        <button
                          className="btn btn-sm btn-outline-danger rounded-1 px-3"
                          disabled={actionLoading === s.username}
                          onClick={() => handleDisable(s.username)}
                        >
                          {actionLoading === s.username ? "..." : "Khóa"}
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-success rounded-1 px-3"
                          disabled={actionLoading === s.username}
                          onClick={() => handleEnable(s.username)}
                        >
                          {actionLoading === s.username ? "..." : "Kích hoạt"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-top d-flex justify-content-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-outline-secondary"} rounded-1`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Thêm Nhân viên Mới</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Tên đăng nhập *</label>
                    <input type="text" className="form-control form-control-sm" required
                      value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Mật khẩu *</label>
                    <input type="text" className="form-control form-control-sm" required minLength="6"
                      value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Email *</label>
                    <input type="email" className="form-control form-control-sm" required
                      value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Họ và Tên *</label>
                    <input type="text" className="form-control form-control-sm" required
                      value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-secondary">Số điện thoại</label>
                    <input type="text" className="form-control form-control-sm"
                      value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
                  </div>
                  
                  <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary px-4" disabled={addLoading}>
                      {addLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
