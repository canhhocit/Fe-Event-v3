import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { StatusBadge } from "../../utils/helpers";
import StatCards from "./StatCards";

const STATUS_TRANSLATIONS = {
  PENDING: "CHỜ DUYỆT",
  UPCOMING: "SẮP MỞ BÁN",
  OPENING: "ĐANG MỞ BÁN",
  CLOSED: "SẮP DIỄN RA",
  COMPLETED: "KẾT THÚC",
  CANCELLED: "ĐÃ HỦY",
};

const STATUS_COLORS = {
  PENDING: "#fdcb6e",
  UPCOMING: "#6c5ce7",
  OPENING: "#0984e3",
  CLOSED: "#00b894",
  COMPLETED: "#00cec9",
  CANCELLED: "#d63031",
};

const FALLBACK_STATUS_COLORS = [
  "#0984e3",
  "#00b894",
  "#6c5ce7",
  "#fdcb6e",
  "#d63031",
  "#00cec9",
];

const getQuarterOptions = () => [1, 2, 3, 4];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
};

// Order weekdays so Monday..Saturday come first, Sunday last
const DAY_OPTIONS = [
  { value: "2", label: "Thứ 2", name: "Monday" },
  { value: "3", label: "Thứ 3", name: "Tuesday" },
  { value: "4", label: "Thứ 4", name: "Wednesday" },
  { value: "5", label: "Thứ 5", name: "Thursday" },
  { value: "6", label: "Thứ 6", name: "Friday" },
  { value: "7", label: "Thứ 7", name: "Saturday" },
  { value: "1", label: "Chủ nhật", name: "Sunday" },
];

const TEMPORAL_API_URL = "statistics-event/by-temporal";
const TOP_EVENTS_API_URL = "statistics-event/top5-events";

const getDisplayDayLabel = (day) => {
  const raw = String(day || "");
  const byValue = DAY_OPTIONS.find((item) => item.value === raw);
  if (byValue) return byValue.label;

  const title = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const byName = DAY_OPTIONS.find((item) => item.name === title);
  return byName?.label || raw;
};

const formatHourRange = (hour) => {
  const start = String(hour).padStart(2, "0");
  const endHour = hour + 1;
  const end = endHour === 24 ? "24" : String(endHour).padStart(2, "0");
  return `${start}h-${end}h`;
};

const formatHourRangeSimple = (hour) => {
  const start = String(hour).padStart(2, "0");
  const end = hour === 23 ? "24" : String(hour + 1).padStart(2, "0");
  return `${start}-${end}`;
};

const translateStatus = (status) => STATUS_TRANSLATIONS[status] || status;

const getStatusColor = (status, index = 0) =>
  STATUS_COLORS[status] ||
  FALLBACK_STATUS_COLORS[index % FALLBACK_STATUS_COLORS.length];

export default function DashboardPage({ api }) {
  const salesChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const temporalChartRef = useRef(null);
  const apiRef = useRef(api);
  const [loading, setLoading] = useState(true);
  const [topEvents, setTopEvents] = useState([]);
  const [topEventsPeriod, setTopEventsPeriod] = useState({
    quarter: "",
    year: "",
  });
  const [selectedQuarter, setSelectedQuarter] = useState(
    () => Math.floor(new Date().getMonth() / 3) + 1,
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSummary, setStatusSummary] = useState({ total: 0, details: [] });
  const [temporalLoading, setTemporalLoading] = useState(false);
  // Default to Monday (Thứ 2)
  const [temporalDay, setTemporalDay] = useState(() => "2");
  const [temporalSummary, setTemporalSummary] = useState({
    day: "",
    details: [],
  });
  const [temporalError, setTemporalError] = useState("");
  const [userStats, setUserStats] = useState({
    customers: 0,
    organizers: 0,
    staffs: 0,
    total: 0,
  });
  const [userLoading, setUserLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("users");

  useEffect(() => {
    let salesChart = null;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [revenueRes, topEventsRes] = await Promise.all([
          apiRef.current.get(
            `/statistics-service-revenue/admin/${selectedYear}`,
          ),
          apiRef.current.get(TOP_EVENTS_API_URL),
        ]);

        const revenueData = revenueRes.result ?? revenueRes ?? {};
        const monthlyRevenues = revenueData.monthlyRevenues ?? [];

        // Build month labels and extract revenue data
        const monthLabels = [];
        const monthlyRevenueData = [];

        for (let month = 1; month <= 12; month++) {
          monthLabels.push(`Th.${month}`);
          const monthData = monthlyRevenues.find(
            (m) => m.month === month && m.year === selectedYear,
          );
          monthlyRevenueData.push(
            monthData ? Number(monthData.revenue) / 1000000 : 0,
          );
        }

        const topEventsPayload = topEventsRes?.result ?? topEventsRes ?? {};
        const topEventsList = Array.isArray(topEventsPayload?.events)
          ? topEventsPayload.events.map((event) => ({
              eventName: event.eventName || "Không xác định",
              ticketsSold: Number(event.ticketsSold) || 0,
              occupancyRate: Number(event.occupancyRate) || 0,
              totalRevenue: Number(event.totalRevenue) || 0,
              status: event.status || "",
            }))
          : [];

        setTopEvents(topEventsList);
        setTopEventsPeriod({
          quarter: topEventsPayload?.quarter ?? "",
          year: topEventsPayload?.year ?? "",
        });

        // Sales Chart
        if (salesChartRef.current) {
          const existingSalesChart = Chart.getChart(salesChartRef.current);
          if (existingSalesChart) existingSalesChart.destroy();

          salesChart = new Chart(salesChartRef.current, {
            type: "line",
            data: {
              labels: monthLabels,
              datasets: [
                {
                  label: "Doanh thu dịch vụ nền tảng",
                  data: monthlyRevenueData,
                  borderColor: "#0984e3",
                  backgroundColor: "rgba(9, 132, 227, 0.15)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: "#fff",
                  pointBorderColor: "#0984e3",
                  pointBorderWidth: 3,
                  borderWidth: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const currentValue = context.parsed.y;
                      return `Doanh thu: ${currentValue.toFixed(2)}M VNĐ`;
                    },
                    afterLabel: (context) => {
                      const currentIndex = context.dataIndex;

                      // Get previous month value
                      const previousValue =
                        currentIndex > 0
                          ? context.chart.data.datasets[0].data[
                              currentIndex - 1
                            ]
                          : null;

                      // Calculate percentage change if previous value exists
                      if (previousValue !== null && previousValue > 0) {
                        const currentValue = context.parsed.y;
                        const percentChange =
                          ((currentValue - previousValue) / previousValue) *
                          100;
                        const trend = percentChange >= 0 ? "📈" : "📉";
                        const sign = percentChange >= 0 ? "+" : "";
                        return `${trend} ${sign}${percentChange.toFixed(1)}% so với tháng trước`;
                      }

                      return "";
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { callback: (val) => val + "M" },
                },
                x: { grid: { display: false } },
              },
            },
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
    };
  }, [selectedYear, activeSection]);

  useEffect(() => {
    let statusChart = null;

    const fetchStatusData = async () => {
      setStatusLoading(true);
      try {
        const statusRes = await apiRef.current.get(
          `/statistics-event/by-status/${selectedQuarter}/${selectedYear}`,
        );
        const result = statusRes.result ?? statusRes ?? {};
        const details = result.eventStatusStatsDetail ?? [];

        setStatusSummary({
          total: Number(result.total) || 0,
          details,
        });

        if (categoryChartRef.current) {
          const existingCategoryChart = Chart.getChart(
            categoryChartRef.current,
          );
          if (existingCategoryChart) existingCategoryChart.destroy();

          const hasData = details.length > 0;
          const labels = hasData
            ? details.map((item) => translateStatus(item.status))
            : ["Không có dữ liệu"];
          const data = hasData
            ? details.map((item) => Number(item.countEvents) || 0)
            : [1];
          const backgroundColor = hasData
            ? details.map((item, index) => getStatusColor(item.status, index))
            : ["#dfe6e9"];

          statusChart = new Chart(categoryChartRef.current, {
            type: "pie",
            data: {
              labels,
              datasets: [
                {
                  data,
                  backgroundColor,
                  borderWidth: 0,
                  hoverOffset: 18,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    boxWidth: 12,
                    padding: 14,
                    usePointStyle: true,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      if (!hasData) return "Không có dữ liệu";
                      const detail = details[context.dataIndex];
                      const count = Number(detail?.countEvents) || 0;
                      const percentage = Number(detail?.percentage) || 0;
                      return `${context.label}: ${count.toLocaleString()} (${percentage.toFixed(1)}%)`;
                    },
                  },
                },
              },
            },
          });
        }
      } catch (err) {
        console.error("Status statistics error:", err);
        setStatusSummary({ total: 0, details: [] });
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatusData();

    return () => {
      if (statusChart) statusChart.destroy();
    };
  }, [selectedQuarter, selectedYear, activeSection]);

  useEffect(() => {
    let temporalChart = null;

    const fetchTemporalData = async () => {
      setTemporalLoading(true);
      setTemporalError("");
      try {
        const res = await apiRef.current.get(
          `${TEMPORAL_API_URL}/${temporalDay}`,
        );
        const result = res.result ?? res ?? {};
        const details = Array.isArray(result.eventTemporalStatsDetail)
          ? result.eventTemporalStatsDetail
          : [];

        setTemporalSummary({
          day: result.day || temporalDay,
          details,
        });

        if (details.length === 0) {
          setTemporalError("Backend trả về rỗng cho ngày đã chọn.");
        }

        if (temporalChartRef.current) {
          const existingTemporalChart = Chart.getChart(
            temporalChartRef.current,
          );
          if (existingTemporalChart) existingTemporalChart.destroy();

          const hourlyMap = Array.from({ length: 24 }, (_, hour) => {
            const item = details.find(
              (entry) => Number(entry.hourOfDay) === hour,
            );
            return {
              hour,
              percentageOfTicketsSold:
                Number(item?.percentageOfTicketsSold) || 0,
            };
          });

          const labels = hourlyMap.map((item) =>
            formatHourRangeSimple(item.hour),
          );
          const percentageData = hourlyMap.map(
            (item) => item.percentageOfTicketsSold,
          );
          const peakHour = hourlyMap.reduce(
            (best, current) =>
              current.percentageOfTicketsSold > best.percentageOfTicketsSold
                ? current
                : best,
            hourlyMap[0],
          );

          temporalChart = new Chart(temporalChartRef.current, {
            type: "line",
            data: {
              labels,
              datasets: [
                {
                  label: "% Vé đã bán",
                  data: percentageData,
                  borderColor: "#e53935",
                  backgroundColor: "rgba(229, 57, 53, 0.15)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  pointBackgroundColor: "#e53935",
                  pointBorderColor: "#e53935",
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    usePointStyle: true,
                    boxWidth: 10,
                  },
                },
                tooltip: {
                  callbacks: {
                    title: (items) => {
                      const hourLabel = items[0]?.label || "";
                      return `Khung giờ ${hourLabel}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  suggestedMax: 100,
                  grid: { color: "#eef1f5" },
                  ticks: { callback: (value) => `${value}%` },
                  title: {
                    display: true,
                    text: "Tỉ lệ (%)",
                    color: "#666",
                    font: { size: 12 },
                  },
                },
                x: {
                  grid: { display: false },
                  title: {
                    display: true,
                    text: "Khung giờ",
                    color: "#666",
                    font: { size: 12 },
                  },
                },
              },
            },
          });

          setTemporalSummary((prev) => ({
            ...prev,
            peakHour: peakHour?.hour ?? null,
            peakPercentage: peakHour?.percentageOfTicketsSold ?? 0,
          }));
        }
      } catch (err) {
        console.error("Temporal statistics error:", err);
        setTemporalSummary({ day: temporalDay, details: [] });
        setTemporalError("Không lấy được dữ liệu từ backend cho giờ vàng.");
      } finally {
        setTemporalLoading(false);
      }
    };

    fetchTemporalData();

    return () => {
      if (temporalChart) temporalChart.destroy();
    };
  }, [temporalDay, activeSection]);

  useEffect(() => {
    const fetchUserStats = async () => {
      setUserLoading(true);
      try {
        const res = await apiRef.current.get("/users/admin/stats");
        const data = res ?? {};
        // support response wrapped in result
        const payload = data.result ?? data;
        setUserStats({
          customers: Number(payload.customers) || 0,
          organizers: Number(payload.organizers) || 0,
          staffs: Number(payload.staffs) || 0,
          total: Number(payload.total) || 0,
        });
      } catch (err) {
        console.error("User stats error:", err);
        setUserStats({ customers: 0, organizers: 0, staffs: 0, total: 0 });
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  return (
    <div className="animate-fade-in px-2">
      <div className="mb-3 dashboard-section-buttons">
        <style>{`
          .dashboard-section-buttons .section-btn{border-radius:999px;padding:.45rem 1.2rem;display:inline-flex;align-items:center;gap:.5rem;font-weight:600;border-width:1px}
          .dashboard-section-buttons .section-btn{transition:transform .14s ease,box-shadow .14s ease,opacity .12s}
          .dashboard-section-buttons .section-btn:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(9,132,227,0.12)}
          .dashboard-section-buttons .section-btn:focus{outline:none;box-shadow:0 0 0 6px rgba(9,132,227,0.08)}
          .dashboard-section-buttons .section-btn .icon{font-size:1.05rem;line-height:1}
          .dashboard-section-buttons .section-btn.active{background:linear-gradient(90deg,#0d6efd,#0b5ed7);color:#fff;border-color:transparent}
          .dashboard-section-buttons .section-btn.inactive{background:#fff}
        `}</style>
        <div className="d-flex gap-2">
          <button
            type="button"
            title="Xem thống kê người dùng"
            aria-label="Người dùng"
            aria-pressed={activeSection === "users"}
            onClick={() => setActiveSection("users")}
            className={`section-btn btn btn-sm d-flex align-items-center ${
              activeSection === "users"
                ? "active"
                : "btn-outline-primary text-primary inactive"
            }`}
          >
            <span className="icon" aria-hidden>
              👤
            </span>
            <span>Người dùng</span>
          </button>

          <button
            type="button"
            title="Xem thống kê sự kiện"
            aria-label="Sự kiện"
            aria-pressed={activeSection === "events"}
            onClick={() => setActiveSection("events")}
            className={`section-btn btn btn-sm d-flex align-items-center ${
              activeSection === "events"
                ? "active"
                : "btn-outline-primary text-primary inactive"
            }`}
          >
            <span className="icon" aria-hidden>
              🎫
            </span>
            <span>Sự kiện</span>
          </button>

          <button
            type="button"
            title="Xem thống kê doanh thu"
            aria-label="Doanh thu dịch vụ nền tảng"
            aria-pressed={activeSection === "revenue"}
            onClick={() => setActiveSection("revenue")}
            className={`section-btn btn btn-sm d-flex align-items-center ${
              activeSection === "revenue"
                ? "active"
                : "btn-outline-primary text-primary inactive"
            }`}
          >
            <span className="icon" aria-hidden>
              💰
            </span>
            <span>Doanh thu</span>
          </button>
        </div>
      </div>

      {/* Sections: Users, Events, Revenue */}

      {/* Users */}
      {activeSection === "users" && (
        <div className="mb-4">
          <h5 className="fw-bold mb-3">Thống kê người dùng</h5>
          <div
            className="card p-3 mb-3 shadow-sm border-0"
            style={{ borderRadius: "16px" }}
          >
            <StatCards
              stats={[
                {
                  title: "KHÁCH HÀNG",
                  value: userStats.customers.toLocaleString(),
                },
                {
                  title: "BAN TỔ CHỨC",
                  value: userStats.organizers.toLocaleString(),
                },
                {
                  title: "NHÂN VIÊN",
                  value: userStats.staffs.toLocaleString(),
                },
                {
                  title: "TỔNG NGƯỜI DÙNG",
                  value: userStats.total.toLocaleString(),
                },
              ]}
              loading={userLoading}
            />
          </div>
        </div>
      )}

      {/* Events */}
      {activeSection === "events" && (
        <div className="mb-4">
          <h5 className="fw-bold mb-3">Thống kê sự kiện</h5>
          <div className="row g-4 justify-content-center">
            <div className="col-12 col-lg-8 col-xl-6">
              <div
                className="card p-4 h-100 shadow-sm border-0"
                style={{ borderRadius: "18px", minHeight: "460px" }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3 gap-3 flex-wrap">
                  <div>
                    <h6 className="fw-bold mb-1">Tỉ lệ trạng thái sự kiện</h6>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <select
                      className="form-select form-select-sm"
                      value={selectedQuarter}
                      onChange={(e) =>
                        setSelectedQuarter(Number(e.target.value))
                      }
                      style={{ minWidth: 96 }}
                    >
                      {getQuarterOptions().map((q) => (
                        <option key={q} value={q}>
                          Quý {q}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select form-select-sm"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ minWidth: 116 }}
                    >
                      {getYearOptions().map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge bg-primary-subtle text-primary px-3 py-2">
                    Tổng số sự kiện: {statusSummary.total.toLocaleString()}
                  </span>
                  {statusLoading && (
                    <small className="text-muted">Đang tải...</small>
                  )}
                </div>
                <div style={{ height: 300 }} className="position-relative">
                  {statusLoading && (
                    <div className="position-absolute top-50 start-50 translate-middle small text-muted">
                      Đang tải biểu đồ...
                    </div>
                  )}
                  <canvas ref={categoryChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card p-3 shadow-sm border-0 mt-4"
            style={{ borderRadius: "16px" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
              <div>
                <h6 className="fw-bold mb-1">Giờ vàng trong tuần</h6>
                <small className="text-muted">
                  Phân tích giờ vàng tổ chức sự kiện
                </small>
              </div>
              <div className="d-flex align-items-end gap-2 flex-wrap">
                <div>
                  <label className="form-label small text-muted mb-1">
                    Ngày
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={temporalDay}
                    onChange={(e) => setTemporalDay(e.target.value)}
                    style={{ minWidth: 140 }}
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="badge bg-success-subtle text-success px-3 py-2">
                  {temporalSummary.peakHour !== undefined &&
                  temporalSummary.peakHour !== null
                    ? `Giờ đỉnh: ${formatHourRange(temporalSummary.peakHour)} - ${Number(temporalSummary.peakPercentage || 0).toFixed(2)}%`
                    : "Giờ đỉnh: --h--"}
                </span>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge bg-primary-subtle text-primary px-3 py-2">
                Ngày: {getDisplayDayLabel(temporalSummary.day || temporalDay)}
              </span>
              {temporalLoading && (
                <small className="text-muted">Đang tải...</small>
              )}
            </div>
            {temporalError && (
              <div
                className="alert alert-warning py-2 px-3 mb-3 small"
                role="alert"
              >
                {temporalError}
              </div>
            )}
            <div className="position-relative" style={{ height: "320px" }}>
              {temporalLoading && (
                <div className="position-absolute top-50 start-50 translate-middle small text-muted">
                  Đang tải biểu đồ...
                </div>
              )}
              <canvas ref={temporalChartRef}></canvas>
            </div>
          </div>

          <div
            className="card border-0 shadow-sm mt-4 overflow-hidden"
            style={{ borderRadius: "16px" }}
          >
            <div className="card-header bg-white p-3 border-0 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0">Top sự kiện nổi bật</h6>
                <small className="text-muted">
                  Quý {topEventsPeriod.quarter || "-"}. Năm{" "}
                  {topEventsPeriod.year || "-"}
                </small>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-secondary small text-uppercase">
                  <tr>
                    <th className="ps-4 py-3 border-0">Thứ tự</th>
                    <th className="px-4 py-3 border-0">Sự kiện</th>
                    <th className="border-0">Vé đã bán</th>
                    <th className="border-0">Tỷ lệ lấp chỗ</th>
                    <th className="border-0">Doanh thu</th>
                    <th className="border-0 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 border-0">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : topEvents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-5 border-0 text-muted"
                      >
                        Chưa có dữ liệu sự kiện nổi bật.
                      </td>
                    </tr>
                  ) : (
                    topEvents.map((ev, index) => {
                      const percent = Number.isFinite(Number(ev.occupancyRate))
                        ? Number(ev.occupancyRate)
                        : 0;
                      return (
                        <tr key={`${ev.eventName}-${ev.ticketsSold}`}>
                          <td className="ps-4 border-0 fw-bold text-primary">
                            {index + 1}
                          </td>
                          <td className="px-4 border-0">
                            <div className="fw-bold text-dark">
                              {ev.eventName}
                            </div>
                          </td>
                          <td className="border-0 fw-bold text-primary">
                            {ev.ticketsSold.toLocaleString()}
                          </td>
                          <td className="border-0">
                            <div
                              className="d-flex align-items-center gap-2"
                              style={{ maxWidth: "120px" }}
                            >
                              <div
                                className="progress flex-grow-1"
                                style={{ height: "4px" }}
                              >
                                <div
                                  className="progress-bar bg-primary"
                                  style={{
                                    width: `${Math.min(percent, 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="small fw-bold">
                                {percent.toFixed(
                                  Number.isInteger(percent) ? 0 : 1,
                                )}
                                %
                              </span>
                            </div>
                          </td>
                          <td className="border-0 fw-bold">
                            {ev.totalRevenue.toLocaleString()}đ
                          </td>
                          <td className="text-center border-0">
                            <StatusBadge status={ev.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue */}
      {activeSection === "revenue" && (
        <div className="mb-4">
          <h5 className="fw-bold mb-3">Thống kê doanh thu</h5>
          <div
            className="card p-3 shadow-sm border-0"
            style={{ borderRadius: "16px" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Doanh thu dịch vụ nền tảng</h6>
              <div className="d-flex gap-2 align-items-center">
                <label className="form-label mb-0 fw-medium text-secondary">
                  Chọn năm:
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "120px" }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {getYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="position-relative" style={{ height: 320 }}>
              <canvas ref={salesChartRef}></canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
