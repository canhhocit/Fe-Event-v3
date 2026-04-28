import { useState, useEffect, useRef } from "react";
import Chart from 'chart.js/auto';
import { StatusBadge, COMMISSION_RATE } from "../../utils/helpers";
import StatCards from "./StatCards";

export default function DashboardPage({ api }) {
  const salesChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [topEvents, setTopEvents] = useState([]);

  useEffect(() => {
    let salesChart = null;
    let categoryChart = null;

    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const monthLabels = [];
        const monthKeys = [];
        const monthlyProfit = [];
        
        for (let i = -5; i <= 0; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const y = d.getFullYear();
          monthLabels.push(`Th.${d.getMonth() + 1}/${y.toString().slice(-2)}`);
          monthKeys.push(`${y}-${m}`);
          monthlyProfit.push(0);
        }

        const [evRes, usRes] = await Promise.all([
          api.get("/events/admin/all?size=1000"),
          api.get("/users/admin?page=1&size=1000"),
        ]);

        const evList = evRes.result?.content ?? [];
        const usList = usRes.result?.content ?? [];
        setEvents(evList);

        let totalCommission = 0;
        let totalSold = 0;
        
        const processedEvents = evList.map(ev => {
          let eventSold = 0;
          let eventRev = 0;
          let totalQty = 0;
          
          ev.ticketTypes?.forEach(tt => {
            const soldCount = (Number(tt.totalQuantity) || 0) - (Number(tt.remainingQuantity) || 0);
            eventSold += soldCount;
            eventRev += soldCount * (Number(tt.price) || 0);
            totalQty += (Number(tt.totalQuantity) || 0);
          });

          const commission = eventRev * COMMISSION_RATE;
          totalCommission += commission;
          totalSold += eventSold;

          const dateStr = ev.startTime || ev.createdAt;
          if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const mIndex = monthKeys.indexOf(key);
              if (mIndex !== -1) {
                monthlyProfit[mIndex] += (commission / 1000000); 
              }
            }
          }

          return { ...ev, ticketsSold: eventSold, totalRevenue: eventRev, totalTickets: totalQty };
        });

        setStats([
          { title: "LỢI NHUẬN NỀN TẢNG", value: totalCommission.toLocaleString() + "đ" },
          { title: "VÉ ĐÃ BÁN", value: totalSold.toLocaleString() },
          { title: "NGƯỜI DÙNG", value: usList.length.toString() },
        ]);

        setTopEvents([...processedEvents].sort((a, b) => b.ticketsSold - a.ticketsSold).slice(0, 5));

        // Sales Chart
        if (salesChartRef.current) {
          const existingSalesChart = Chart.getChart(salesChartRef.current);
          if (existingSalesChart) existingSalesChart.destroy();
          
          salesChart = new Chart(salesChartRef.current, {
            type: 'line',
            data: {
              labels: monthLabels,
              datasets: [{
                label: 'Lợi nhuận',
                data: monthlyProfit,
                borderColor: '#0984e3',
                backgroundColor: 'rgba(9, 132, 227, 0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0984e3',
                pointBorderWidth: 3,
                borderWidth: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { callback: (val) => val + 'M' } },
                x: { grid: { display: false } }
              }
            }
          });
        }

        // Status Chart
        const statusStats = evList.reduce((acc, ev) => {
          acc[ev.status] = (acc[ev.status] || 0) + 1;
          return acc;
        }, {});

        if (categoryChartRef.current) {
          const existingCategoryChart = Chart.getChart(categoryChartRef.current);
          if (existingCategoryChart) existingCategoryChart.destroy();

          categoryChart = new Chart(categoryChartRef.current, {
            type: 'doughnut',
            data: {
              labels: Object.keys(statusStats),
              datasets: [{
                data: Object.values(statusStats),
                backgroundColor: ['#00b894', '#6c5ce7', '#0984e3', '#fdcb6e', '#fab1a0'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
              plugins: { legend: { position: 'bottom' } }
            }
          });
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      if (salesChart) salesChart.destroy();
      if (categoryChart) categoryChart.destroy();
    };
  }, []);

  return (
    <div className="animate-fade-in px-2">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Bảng điều khiển hệ thống</h4>
        <p className="text-secondary small">Chào mừng bạn trở lại! Dưới đây là tóm tắt hoạt động của nền tảng.</p>
      </div>

      <StatCards stats={stats} loading={loading} />

      <div className="row g-4 mt-2">
        <div className="col-12 col-lg-8">
          <div className="card p-4 h-100 shadow-sm border-0" style={{ minHeight: '350px', borderRadius: '20px' }}>
            <h6 className="fw-bold mb-4">Xu hướng lợi nhuận (Triệu VNĐ)</h6>
            <div className="flex-grow-1 position-relative" style={{ height: '250px' }}>
              <canvas ref={salesChartRef}></canvas>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card p-4 h-100 shadow-sm border-0" style={{ minHeight: '350px', borderRadius: '20px' }}>
            <h6 className="fw-bold mb-4">Trạng thái sự kiện</h6>
            <div className="flex-grow-1 position-relative" style={{ height: '250px' }}>
              <canvas ref={categoryChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mt-4 overflow-hidden" style={{ borderRadius: '20px' }}>
        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">Xếp hạng sự kiện bán chạy</h6>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-secondary small text-uppercase">
              <tr>
                <th className="px-4 py-3 border-0">Sự kiện</th>
                <th className="border-0">Vé đã bán</th>
                <th className="border-0">Tỷ lệ lấp chỗ</th>
                <th className="border-0">Hoa hồng ({COMMISSION_RATE * 100}%)</th>
                <th className="border-0 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5 border-0">Đang tải dữ liệu...</td></tr>
              ) : topEvents.map((ev) => {
                const percent = ev.totalTickets > 0 ? Math.round((ev.ticketsSold/ev.totalTickets)*100) : 0;
                return (
                  <tr key={ev.id}>
                    <td className="px-4 border-0">
                      <div className="fw-bold text-dark">{ev.name}</div>
                      <div className="text-muted small">{ev.categoryName}</div>
                    </td>
                    <td className="border-0 fw-bold text-primary">{ev.ticketsSold.toLocaleString()}</td>
                    <td className="border-0">
                      <div className="d-flex align-items-center gap-2" style={{ maxWidth: '120px' }}>
                        <div className="progress flex-grow-1" style={{ height: '4px' }}>
                          <div className="progress-bar bg-primary" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="small fw-bold">{percent}%</span>
                      </div>
                    </td>
                    <td className="border-0 fw-bold">{(ev.totalRevenue * COMMISSION_RATE).toLocaleString()}đ</td>
                    <td className="text-center border-0">
                      <StatusBadge status={ev.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
