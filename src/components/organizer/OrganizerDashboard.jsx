/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { VND, StatusBadge, COMMISSION_RATE } from "../../utils/helpers";
import { getImageUrl } from "../../hooks/useApi";
import Chart from "chart.js/auto";

export default function OrganizerDashboard({
  stats,
  profile,
  error,
  selectedRevenueYear,
  onRevenueYearChange,
}) {
  const overview = stats?.revenueOverview || {};
  const eventOverview = stats?.eventOverview || {};
  const monthlyRevenues = Array.isArray(stats?.monthlyRevenues)
    ? stats.monthlyRevenues
    : [];
  const eventStats = Array.isArray(stats?.eventStats) ? stats.eventStats : [];
  const overviewEvents = Array.isArray(eventOverview.events)
    ? eventOverview.events
    : [];
  const totalRevenue = Number(stats?.totalRevenue) || 0;
  const totalTicketsSold =
    Number(overview.totalTicketsSold ?? stats?.totalTicketsSold) || 0;
  const totalEvents = Number(overview.totalEvents ?? stats?.totalEvents) || 0;
  const organizerAmount =
    overview.totalOrganizerAmount != null
      ? Number(overview.totalOrganizerAmount) || 0
      : Math.max(totalRevenue - totalRevenue * COMMISSION_RATE, 0);
  const serviceFee =
    overview.totalServiceFee != null
      ? Number(overview.totalServiceFee) || 0
      : totalRevenue * COMMISSION_RATE;
  const revenueYear = stats?.revenueYear || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const activeRevenueYear = selectedRevenueYear || revenueYear;
  const annualRevenue = monthlyRevenues.reduce(
    (sum, month) => sum + (Number(month?.revenue) || 0),
    0,
  );

  useEffect(() => {
    const revenueRows = Array.isArray(stats?.monthlyRevenues)
      ? stats.monthlyRevenues
      : [];
    if (!revenueRows.length) return;

    const ctx = document.getElementById("organizerRevenueChart");
    if (!ctx) return;

    // Destroy existing chart if any
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    const labels = revenueRows.map((m) => `Th.${m.month}`);
    const data = revenueRows.map((m) => Number(m.revenue) || 0);

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Doanh thu thực nhận (VNĐ)",
            data: data,
            borderColor: "#00b894",
            backgroundColor: "rgba(0, 184, 148, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#00b894",
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
              label: function (context) {
                return " Thực nhận: " + VND(context.raw);
              },
            },
          },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "#f1f2f6" } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [stats?.monthlyRevenues, revenueYear]);

  if (!stats && error) {
    return (
      <div
        className="alert alert-warning border-0 shadow-sm"
        style={{ borderRadius: "12px" }}
      >
        <div className="fw-bold mb-1">Không tải được dashboard organizer</div>
        <div className="small mb-3">{error}</div>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Đăng nhập lại
        </button>
      </div>
    );
  }

  if (!stats)
    return <div className="text-center py-5">Đang tải dữ liệu...</div>;

  return (
    <div className="animate__animated animate__fadeIn">
      <h4 className="fw-bold mb-4">Xin chào, {profile?.fullName}!</h4>

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm p-4 h-100 bg-primary text-white"
            style={{ borderRadius: "20px" }}
          >
            <div className="d-flex justify-content-center">
              <small className="fw-bold text-uppercase opacity-75">
                Thực nhận
              </small>
            </div>
            <h2 className="fw-bold mt-2">{VND(organizerAmount)}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm p-4 h-100 bg-success text-white"
            style={{ borderRadius: "20px" }}
          >
            {/* <div className="d-flex justify-content align-items-center"> */}
            <div className="d-flex justify-content-center">
              <small className="fw-bold text-uppercase opacity-75">
                Vé đã bán
              </small>
            </div>
            <h2 className="fw-bold text-center mt-4">{totalTicketsSold} </h2>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm p-4 h-100 bg-dark text-white"
            style={{ borderRadius: "20px" }}
          >
            <div className="d-flex justify-content-center">
              <small className="fw-bold text-uppercase opacity-75">
                Sự kiện đã tạo
              </small>
            </div>
            <h2 className="fw-bold text-center mt-4">{totalEvents}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm p-4 h-100 bg-warning text-dark"
            style={{ borderRadius: "20px" }}
          >
            <div className="d-flex justify-content-center">
              <small className="fw-bold text-uppercase opacity-50">
                Phí dịch vụ
              </small>
            </div>
            <h2 className="fw-bold text-center mt-2">{VND(serviceFee)}</h2>
          </div>
        </div>
      </div>

      <div
        className="card border-0 shadow-sm p-4 mb-5"
        style={{ borderRadius: "20px" }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
          <h5 className="fw-bold mb-0">Thống kê doanh thu</h5>
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">Năm</small>
            <select
              className="form-select form-select-sm"
              style={{ minWidth: "120px" }}
              value={activeRevenueYear}
              onChange={(e) => onRevenueYearChange?.(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <small className="text-muted">Đã trừ phí dịch vụ</small>
            <h2 className="fw-bold mb-0 mt-2 text-primary">
              {VND(annualRevenue)}
            </h2>
          </div>
        </div>
      </div>

      {/* Revenue Growth Chart */}
      <div
        className="card border-0 shadow-sm p-4 mb-5"
        style={{ borderRadius: "20px" }}
      >
        <h5 className="fw-bold mb-4">
          Biểu đồ doanh thu năm {activeRevenueYear}
        </h5>
        <div style={{ height: "300px" }}>
          <canvas id="organizerRevenueChart"></canvas>
        </div>
      </div>

      {/* Event Overview Table */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">
          Tổng quan sự kiện năm {eventOverview.year || activeRevenueYear}
        </h5>
        {/* fake content */}
        <span className="badge bg-light text-dark border p-2 px-3 fw-normal"></span>
      </div>

      <div
        className="card border-0 shadow-sm overflow-hidden"
        style={{ borderRadius: "20px" }}
      >
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle text-nowrap">
            <thead className="bg-light">
              <tr>
                <th className="py-3 border-0 px-4">Tên sự kiện</th>
                <th className="py-3 border-0">Trạng thái</th>
                <th className="py-3 border-0">Đã bán / Tổng</th>
                <th className="py-3 border-0">Tỉ lệ bán</th>
                <th className="py-3 text-end px-4 border-0">Thực nhận</th>
              </tr>
            </thead>
            <tbody>
              {(overviewEvents.length > 0 ? overviewEvents : eventStats).map(
                (ev, index) => {
                  const sold = Number(ev.ticketsSold) || 0;
                  const total =
                    Number(ev.totalQuantity ?? ev.totalTickets) || 0;
                  const sellRate =
                    Number(ev.sellRate ?? ev.sellThroughRate) || 0;
                  const organizerAmount = Number(ev.organizerAmount) || 0;
                  return (
                    <tr key={ev.eventId ?? ev.eventName ?? index}>
                      <td className="py-3 px-4 fw-bold">{ev.eventName}</td>
                      <td className="py-3">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="py-3 text-muted">
                        {sold} / {total}
                      </td>
                      <td className="py-3" style={{ minWidth: "150px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="progress flex-grow-1"
                            style={{ height: 10, borderRadius: 5 }}
                          >
                            <div
                              className={`progress-bar ${sellRate > 80 ? "bg-danger" : sellRate > 50 ? "bg-warning" : "bg-info"}`}
                              style={{ width: `${sellRate}%` }}
                            ></div>
                          </div>
                          <small className="text-secondary fw-bold">
                            {sellRate.toFixed(1)}%
                          </small>
                        </div>
                      </td>
                      <td className="py-3 text-end px-4 fw-bold text-primary">
                        {VND(organizerAmount)}
                      </td>
                    </tr>
                  );
                },
              )}
              {(overviewEvents.length > 0 ? overviewEvents : eventStats)
                .length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    Chưa có dữ liệu thống kê.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
