import React, { useState, useEffect } from "react";
import { Ticket, Plus, Tag, Calendar, Trash2, Search, Percent, DollarSign } from "lucide-react";

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
    eventId: ""
  });

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert dates to ISO format
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        eventId: formData.eventId ? parseInt(formData.eventId) : null,
        startDate: formData.startDate + ":00", // Add seconds for LocalDateTime
        endDate: formData.endDate + ":00"
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
        eventId: ""
      });
      setShowForm(false);
      fetchVouchers();
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi tạo voucher";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Mã giảm giá</h4>
          <p className="text-muted small mb-0">Tạo và quản lý các chương trình khuyến mãi cho sự kiện</p>
        </div>
        <button 
          className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'} rounded-pill px-4 d-flex align-items-center gap-2`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hủy" : <><Plus size={18} /> Tạo mã mới</>}
        </button>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
            <h6 className="fw-bold text-primary mb-0">Thiết lập Voucher mới</h6>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-bold">Mã Voucher</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><Tag size={16} /></span>
                  <input 
                    type="text" name="code" className="form-control bg-light border-start-0" 
                    placeholder="VD: SUMMER2024" value={formData.code} onChange={handleChange} required 
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Loại giảm giá</label>
                <select name="discountType" className="form-select bg-light" value={formData.discountType} onChange={handleChange}>
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="AMOUNT">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Giá trị giảm</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    {formData.discountType === 'PERCENTAGE' ? <Percent size={16} /> : <DollarSign size={16} />}
                  </span>
                  <input 
                    type="number" name="amount" className="form-control bg-light border-start-0" 
                    placeholder={formData.discountType === 'PERCENTAGE' ? "VD: 20" : "VD: 50000"} 
                    value={formData.amount} onChange={handleChange} required 
                  />
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold">Số lượng mã</label>
                <input type="number" name="quantity" className="form-control bg-light" placeholder="VD: 100" value={formData.quantity} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Đơn tối thiểu (đ)</label>
                <input type="number" name="minOrderAmount" className="form-control bg-light" placeholder="VD: 200000" value={formData.minOrderAmount} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Giảm tối đa (đ)</label>
                <input type="number" name="maxDiscount" className="form-control bg-light" placeholder="VD: 50000" value={formData.maxDiscount} onChange={handleChange} disabled={formData.discountType === 'AMOUNT'} />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Ngày bắt đầu</label>
                <input type="datetime-local" name="startDate" className="form-control bg-light" value={formData.startDate} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Ngày kết thúc</label>
                <input type="datetime-local" name="endDate" className="form-control bg-light" value={formData.endDate} onChange={handleChange} required />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Áp dụng cho Sự kiện</label>
                <select name="eventId" className="form-select bg-light" value={formData.eventId} onChange={handleChange}>
                  <option value="">Tất cả sự kiện của tôi</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 mt-4">
                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : "TẠO VOUCHER"}
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
                <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">Chưa có mã giảm giá nào</td></tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id}>
                    <td className="px-4">
                      <div className="fw-bold text-primary">{v.code}</div>
                      <small className="text-muted">{v.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền'}</small>
                    </td>
                    <td>
                      <div className="fw-bold">
                        {v.discountType === 'PERCENTAGE' ? `${v.amount}%` : `${v.amount.toLocaleString()}đ`}
                      </div>
                      {v.maxDiscount > 0 && <small className="text-muted">Tối đa {v.maxDiscount.toLocaleString()}đ</small>}
                    </td>
                    <td>
                      <div className="small"><Calendar size={12} className="me-1" /> {new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                      <div className="small text-muted">Đến {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{v.quantity || '∞'}</span>
                    </td>
                    <td>
                      {new Date() > new Date(v.endDate) ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">Hết hạn</span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill">Đang chạy</span>
                      )}
                    </td>
                    <td className="px-4 text-end">
                      <button className="btn btn-sm btn-outline-danger border-0"><Trash2 size={16} /></button>
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
