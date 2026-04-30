/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Tag,
  Calendar,
  Trash2,
  Search,
  Percent,
  DollarSign,
} from "lucide-react";

const VoucherManager = ({ api, events }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    amount: "",
    maxDiscount: "",
    minOrderAmount: "",
    quantity: "",
    startDate: "",
    endDate: "",
    eventId: "",
  });
  const [errors, setErrors] = useState({});
  const [notify, setNotify] = useState(null); // { type: 'success'|'error'|'info', message: string }

  // Helper to add 1 hour to a date string for 'min' attribute validation
  const getMinNextHour = (dateStr) => {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    d.setHours(d.getHours() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vouchers?size=100");
      setVouchers(res.result?.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear field error when user edits
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => {
      if (name === "discountType" && value === "AMOUNT") {
        return {
          ...prev,
          discountType: value,
          maxDiscount: "",
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const quantity = Number(formData.quantity);
    const minOrderAmount = Number(formData.minOrderAmount);
    const maxDiscount = Number(formData.maxDiscount);
    const amount = Number(formData.amount);

    // numeric checks
    if (!Number.isFinite(quantity) || quantity < 1)
      newErrors.quantity = "Số lượng mã phải lớn hơn hoặc bằng 1";
    if (
      formData.minOrderAmount.toString().trim() &&
      (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)
    )
      newErrors.minOrderAmount = "Đơn tối thiểu phải lớn hơn hoặc bằng 0";
    if (
      formData.discountType === "PERCENTAGE" &&
      (!Number.isFinite(maxDiscount) || maxDiscount <= 0)
    )
      newErrors.maxDiscount = "Giảm tối đa phải lớn hơn 0";
    if (!Number.isFinite(amount) || amount <= 0)
      newErrors.amount = "Giá trị giảm phải lớn hơn 0";

    // date checks (if both provided)
    if (formData.startDate.trim() && formData.endDate.trim()) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        newErrors.startDate = newErrors.startDate || "Ngày không hợp lệ";
        newErrors.endDate = newErrors.endDate || "Ngày không hợp lệ";
      } else {
        const diffInMs = end - start;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        if (diffInHours < 1) {
          newErrors.endDate =
            "Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 tiếng";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Convert dates to ISO format
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        maxDiscount: formData.maxDiscount
          ? parseFloat(formData.maxDiscount)
          : null,
        minOrderAmount: formData.minOrderAmount
          ? parseFloat(formData.minOrderAmount)
          : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        eventId: formData.eventId ? parseInt(formData.eventId) : null,
        startDate: formData.startDate + ":00", // Add seconds for LocalDateTime
        endDate: formData.endDate + ":00",
      };

      await api.post("/vouchers", payload);
      alert("Tạo mã giảm giá thành công!");
      setFormData({
        code: "",
        discountType: "PERCENTAGE",
        amount: "",
        maxDiscount: "",
        minOrderAmount: "",
        quantity: "",
        startDate: "",
        endDate: "",
        eventId: "",
      });
      setShowForm(false);
      fetchVouchers();
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi tạo voucher";
      setNotify({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;
    setLoading(true);
    try {
      await api.del(`/vouchers/${id}`);
      alert("Xóa mã giảm giá thành công!");
      fetchVouchers();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Mã giảm giá</h4>
          <p className="text-muted small mb-0">
            Tạo và quản lý các chương trình khuyến mãi cho sự kiện
          </p>
        </div>
        <button
          className={`btn ${showForm ? "btn-outline-secondary" : "btn-primary"} rounded-pill px-4 d-flex align-items-center gap-2`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            "Hủy"
          ) : (
            <>
              <Plus size={18} /> Tạo mã mới
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
            <h6 className="fw-bold text-primary mb-0">Thiết lập Voucher mới</h6>
          </div>
          <div className="card-body p-4">
            {notify && (
              <div
                className={`alert alert-${notify.type === "error" ? "danger" : notify.type === "success" ? "success" : "info"} mt-2 mb-3 rounded-3 border-0 animate__animated ${notify.type === "error" ? "animate__shakeX" : "animate__zoomIn"}`}
                role="alert"
              >
                <div className="d-flex align-items-center">
                  <span className="fs-3 me-3">
                    {notify.type === "error" ? "⚠️" : notify.type === "success" ? "✅" : "ℹ️"}
                  </span>
                  <div>
                    <strong>{notify.type === "error" ? "Lỗi:" : notify.type === "success" ? "Thành công:" : "Thông báo:"}</strong>{" "}{notify.message}
                  </div>
                  <button
                    type="button"
                    className="btn-close ms-auto"
                    aria-label="Close"
                    onClick={() => setNotify(null)}
                  ></button>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-bold">Mã Voucher</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Tag size={16} />
                  </span>
                  <input
                    type="text"
                    name="code"
                    className={`form-control bg-light border-start-0 ${errors.code ? "is-invalid" : ""}`}
                    placeholder="SUMMER2026"
                    value={formData.code}
                    onChange={handleChange}
                    required
                  />
                  {errors.code && (
                    <div className="invalid-feedback d-block">
                      {errors.code}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">
                  Loại giảm giá
                </label>
                <select
                  name="discountType"
                  className="form-select bg-light"
                  value={formData.discountType}
                  onChange={handleChange}
                >
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="AMOUNT">Số tiền (đ)</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Giá trị giảm</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    {formData.discountType === "PERCENTAGE" ? (
                      <Percent size={16} />
                    ) : (
                      <DollarSign size={16} />
                    )}
                  </span>
                  <input
                    type="number"
                    name="amount"
                    className={`form-control bg-light border-start-0 ${errors.amount ? "is-invalid" : ""}`}
                    placeholder={
                      formData.discountType === "PERCENTAGE"
                        ? "VD: 20"
                        : "VD: 50000"
                    }
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                  {errors.amount && (
                    <div className="invalid-feedback d-block">
                      {errors.amount}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold">Số lượng mã</label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  className={`form-control bg-light ${errors.quantity ? "is-invalid" : ""}`}
                  placeholder="..."
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
                {errors.quantity && (
                  <div className="invalid-feedback d-block">
                    {errors.quantity}
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  className={`form-control bg-light ${errors.startDate ? "is-invalid" : ""}`}
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.startDate && (
                  <div className="invalid-feedback d-block">
                    {errors.startDate}
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  className={`form-control bg-light ${errors.endDate ? "is-invalid" : ""}`}
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={
                    getMinNextHour(formData.startDate) ||
                    new Date().toISOString().slice(0, 16)
                  }
                />
                {errors.endDate && (
                  <div className="invalid-feedback d-block">
                    {errors.endDate}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Đơn tối thiểu (đ)
                </label>
                <input
                  type="number"
                  min="0"
                  name="minOrderAmount"
                  className={`form-control bg-light ${errors.minOrderAmount ? "is-invalid" : ""}`}
                  placeholder="VD: 200000"
                  value={formData.minOrderAmount}
                  onChange={handleChange}
                  required
                />
                {errors.minOrderAmount && (
                  <div className="invalid-feedback d-block">
                    {errors.minOrderAmount}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className={`form-label small fw-bold ${formData.discountType === "AMOUNT" ? "text-muted" : ""}`}>
                  Giảm tối đa (đ)
                </label>
                <input
                  type="number"
                  min="1"
                  name="maxDiscount"
                  className={`form-control bg-light ${errors.maxDiscount ? "is-invalid" : ""}`}
                  placeholder="VD: 50000"
                  value={formData.maxDiscount}
                  onChange={handleChange}
                  disabled={formData.discountType === "AMOUNT"}
                  required={formData.discountType === "PERCENTAGE"}
                />
                {errors.maxDiscount && (
                  <div className="invalid-feedback d-block">
                    {errors.maxDiscount}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">
                  Áp dụng cho Sự kiện
                </label>
                <select
                  name="eventId"
                  className="form-select bg-light"
                  value={formData.eventId}
                  onChange={handleChange}
                >
                  <option value="">Tất cả sự kiện của tôi</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    "TẠO VOUCHER"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 border-0">Mã / Loại</th>
                <th className="py-3 border-0">Giảm giá</th>
                <th className="py-3 border-0">Thời hạn</th>
                <th className="py-3 border-0">Số lượng</th>
                <th className="py-3 border-0">Trạng thái</th>
                <th className="px-4 py-3 border-0 text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    Chưa có mã giảm giá nào
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4">
                      <div className="fw-bold text-primary">{v.code}</div>
                      <small className="text-muted">
                        {v.discountType === "PERCENTAGE"
                          ? "Phần trăm"
                          : "Số tiền"}
                      </small>
                    </td>
                    <td>
                      <div className="fw-bold">
                        {v.discountType === "PERCENTAGE"
                          ? `${v.amount}%`
                          : `${v.amount.toLocaleString()}đ`}
                      </div>
                      {v.maxDiscount > 0 && (
                        <small className="text-muted">
                          Tối đa {v.maxDiscount.toLocaleString()}đ
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="small">
                        <Calendar size={12} className="me-1" />{" "}
                        {new Date(v.startDate).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="small text-muted">
                        Đến {new Date(v.endDate).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {v.quantity || "0"}
                      </span>
                    </td>
                    <td>
                      {new Date() > new Date(v.endDate) ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                          Hết hạn
                        </span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill">
                          Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 text-end">
                      <button
                        className="btn btn-sm btn-outline-danger border-0"
                        onClick={() => handleDelete(v.id)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VoucherManager;
