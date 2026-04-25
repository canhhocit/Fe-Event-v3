import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import Navbar from "../components/common/Navbar";

const VIETNAM_PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", 
  "Bình Dương", "Đồng Nai", "Quảng Ninh", "Khánh Hòa", "Lâm Đồng", 
  "Thừa Thiên Huế", "Bà Rịa - Vũng Tàu", "Đắk Lắk", "An Giang", "Tiền Giang"
];

export default function HomePage() {
  const api = useApi();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search Filters
  const [filters, setFilters] = useState({
    keyword: "",
    province: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    fetchCategories();
    handleSearch();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.result || []);
    } catch (err) {}
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          if (key === 'startDate' || key === 'endDate') {
            params.append(key, filters[key] + "T00:00:00");
          } else {
            params.append(key, filters[key]);
          }
        }
      });
      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.result?.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar />
      
      {/* Hero Section with Search */}
      <div className="bg-primary pt-5 pb-5 text-white position-relative overflow-hidden" style={{ borderRadius: "0 0 50px 50px" }}>
        <div className="container py-5 text-center position-relative" style={{ zIndex: 2 }}>
          <h1 className="display-4 fw-bold mb-3 animate__animated animate__fadeInDown">Khám phá sự kiện sắp tới</h1>
          <p className="lead mb-5 opacity-75">Tìm kiếm hàng ngàn sự kiện âm nhạc, hội thảo và thể thao</p>
          
          <div className="card shadow-lg p-4 border-0 mx-auto" style={{ maxWidth: "1000px", borderRadius: "30px", marginTop: "20px" }}>
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-lg-4 col-md-6">
                  <input 
                    type="text" 
                    name="keyword" 
                    className="form-control form-control-lg bg-light border-0" 
                    placeholder="Tên sự kiện..." 
                    value={filters.keyword}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-lg-3 col-md-6">
                  <select name="province" className="form-select form-select-lg bg-light border-0" value={filters.province} onChange={handleFilterChange}>
                    <option value="">Toàn quốc (Tỉnh/Thành)</option>
                    {VIETNAM_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-lg-3 col-md-6">
                  <select name="categoryId" className="form-select form-select-lg bg-light border-0" value={filters.categoryId} onChange={handleFilterChange}>
                    <option value="">Tất cả danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-lg-2 col-md-6">
                  <button type="submit" className="btn btn-dark w-100 h-100 py-3 rounded-3 fw-bold">TÌM KIẾM</button>
                </div>
                
                {/* Advanced Row */}
                <div className="col-lg-3 col-md-6">
                   <div className="input-group">
                      <span className="input-group-text bg-light border-0 px-2 fw-bold text-muted small">Từ</span>
                      <input type="number" name="minPrice" className="form-control form-control-lg bg-light border-0" placeholder="Giá tối thiểu" value={filters.minPrice} onChange={handleFilterChange} />
                   </div>
                </div>
                <div className="col-lg-3 col-md-6">
                   <div className="input-group">
                      <span className="input-group-text bg-light border-0 px-2 fw-bold text-muted small">Đến</span>
                      <input type="number" name="maxPrice" className="form-control form-control-lg bg-light border-0" placeholder="Giá tối đa" value={filters.maxPrice} onChange={handleFilterChange} />
                   </div>
                </div>
                <div className="col-lg-3 col-md-6">
                   <input type="date" name="startDate" className="form-control form-control-lg bg-light border-0" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className="col-lg-3 col-md-6">
                   <button type="button" className="btn btn-link text-muted small text-decoration-none w-100" onClick={() => setFilters({
                     keyword: "", province: "", categoryId: "", minPrice: "", maxPrice: "", startDate: "", endDate: ""
                   })}>Làm mới bộ lọc ↻</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container py-5 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
           <h3 className="fw-bold m-0">Sự kiện nổi bật</h3>
           <span className="text-muted">{events.length} kết quả</span>
        </div>
        
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : events.length === 0 ? (
          <div className="text-center py-5 card border-0 rounded-4">Chưa tìm thấy sự kiện nào khớp với yêu cầu của bạn. 😅</div>
        ) : (
          <div className="row g-4 text-start">
            {events.map((event) => (
              <div className="col-md-6 col-lg-4" key={event.id}>
                 <div className="card border-0 shadow-sm h-100 hover-up transition-all overflow-hidden" style={{ borderRadius: "20px" }}>
                    <img 
                      src={event.imageUrls?.[0] || "https://via.placeholder.com/400x250"} 
                      alt={event.name} 
                      className="card-img-top" 
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body p-4">
                       <span className="badge bg-primary-subtle text-primary rounded-pill px-3 mb-2">{event.categoryName}</span>
                       <h5 className="card-title fw-bold mb-3">{event.name}</h5>
                       <div className="vstack gap-2 text-muted small mb-4">
                          <div>📍 {event.province} - {event.location}</div>
                          <div>📅 {new Date(event.startTime).toLocaleDateString('vi-VN')}</div>
                          <div className="fw-bold text-dark fs-5 mt-2">
                             {event.ticketTypes?.[0] ? `${event.ticketTypes[0].price.toLocaleString()}đ` : "Sắp mở bán"}
                          </div>
                       </div>
                       <button className="btn btn-primary w-100 rounded-pill fw-bold py-2">Chi tiết / Đặt vé</button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
