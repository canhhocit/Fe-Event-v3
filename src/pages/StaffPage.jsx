import { useState } from "react";
import { useApi } from "../hooks/useApi";
import Navbar from "../components/common/Navbar";

export default function StaffPage() {
  const api = useApi();
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!ticketCode) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await api.post(`/tickets/check-in?ticketCode=${ticketCode}`);
      setResult(res.result);
      setTicketCode(""); // Clear after success
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi quét vé hoặc vé không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="bg-dark p-4 text-center text-white">
                <h3 className="fw-bold mb-0">STAFF ENTRY CONTROL</h3>
                <p className="small opacity-75 mb-0">Quản trị viên / Nhân viên soát vé</p>
              </div>
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleCheckIn}>
                  <div className="mb-4 text-center">
                    <label className="form-label fw-bold text-muted text-uppercase small">Nhập mã vé hoặc Quét QR</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg text-center fs-3 fw-bold border-2 bg-light"
                      style={{ letterSpacing: "2px" }}
                      placeholder="TKT-XXXXXXXX"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  </div>
                  <button 
                    disabled={loading || !ticketCode} 
                    className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 shadow"
                  >
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : "XÁC NHẬN CHECK-IN"}
                  </button>
                </form>

                {error && (
                  <div className="alert alert-danger mt-4 rounded-3 border-0 animate__animated animate__shakeX">
                    <div className="d-flex align-items-center">
                      <span className="fs-3 me-3">⚠️</span>
                      <div>
                        <strong>Lỗi:</strong> {error}
                      </div>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="alert alert-success mt-4 rounded-3 border-0 animate__animated animate__zoomIn">
                    <div className="text-center mb-3">
                      <span className="display-4">✅</span>
                      <h4 className="fw-bold mt-2">THÀNH CÔNG!</h4>
                    </div>
                    <hr />
                    <div className="small vstack gap-2">
                       <div className="d-flex justify-content-between">
                          <span className="text-muted">Sự kiện:</span>
                          <span className="fw-bold">{result.ticketType?.event?.name}</span>
                       </div>
                       <div className="d-flex justify-content-between">
                          <span className="text-muted">Loại vé:</span>
                          <span className="fw-bold">{result.ticketType?.name}</span>
                       </div>
                       <div className="d-flex justify-content-between">
                          <span className="text-muted">Mã vé:</span>
                          <span className="fw-bold">{result.ticketCode}</span>
                       </div>
                       <div className="d-flex justify-content-between">
                          <span className="text-muted">Thời gian:</span>
                          <span className="fw-bold">{new Date().toLocaleString()}</span>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
