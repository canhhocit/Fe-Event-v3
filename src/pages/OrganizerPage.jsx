import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import OrganizerSidebar from "../components/organizer/OrganizerSidebar";
import OrganizerDashboard from "../components/organizer/OrganizerDashboard";
import MyEventsList from "../components/organizer/MyEventsList";
import CreateEventForm from "../components/organizer/CreateEventForm";
import TicketManager from "../components/organizer/TicketManager";
import OrganizerProfile from "../components/organizer/OrganizerProfile";
import StaffManager from "../components/organizer/StaffManager";
import VoucherManager from "../components/organizer/VoucherManager";
import BlogManager from "../components/organizer/BlogManager";

export default function OrganizerPage() {
  const api = useApi();

  const redirectToLogin = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRevenueYear, setSelectedRevenueYear] = useState(
    new Date().getFullYear(),
  );
  const [stats, setStats] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [dashError, setDashError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventTicketTypes, setEventTicketTypes] = useState([]);

  const [eventFormData, setEventFormData] = useState({
    name: "",
    categoryId: "",
    province: "",
    location: "",
    startTime: "",
    endTime: "",
    saleStartDate: "",
    saleEndDate: "",
    description: "",
    files: null,
    ticketTypes: [
      { name: "Vé thường", price: "", totalQuantity: "", description: "" },
    ],
  });

  const handleAddTicketType = () => {
    setEventFormData((prev) => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        { name: "", price: "", totalQuantity: "", description: "" },
      ],
    }));
  };

  const handleRemoveTicketType = (index) => {
    setEventFormData((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index),
    }));
  };

  const handleTicketFieldChange = (index, field, value) => {
    const nextTickets = [...eventFormData.ticketTypes];
    nextTickets[index][field] = value;
    setEventFormData((prev) => ({ ...prev, ticketTypes: nextTickets }));
  };

  const [ticketFormData, setTicketFormData] = useState({
    name: "",
    price: "",
    totalQuantity: "",
    description: "",
  });

  const fetchDashData = async () => {
    try {
      const eventsRes = await api.get("/events/organizer/my-events");
      setMyEvents(eventsRes.result?.content || []);
      setDashError("");
    } catch (err) {
      const statusCode = err?.response?.status;
      setStats(null);
      setMyEvents([]);
      setDashError("Không thể tải dữ liệu dashboard. Vui lòng đăng nhập lại.");
      if (statusCode === 401 || statusCode === 403) {
        redirectToLogin();
      }
    }
  };

  const fetchRevenueByYear = async (organizerId, year) => {
    if (organizerId == null) {
      return { monthlyRevenues: [], revenueYear: year };
    }

    try {
      const revenueRes = await api.get(
        `/statistics-revenue/${organizerId}/${year}`,
      );
      const revenueData = revenueRes.result || {};
      return {
        monthlyRevenues: revenueData.months || [],
        revenueYear: revenueData.year || year,
      };
    } catch (revenueErr) {
      return { monthlyRevenues: [], revenueYear: year };
    }
  };

  const fetchEventOverviewByYear = async (organizerId, year) => {
    if (organizerId == null) {
      return { year, events: [] };
    }

    try {
      const overviewRes = await api.get(
        `/statistics-event/${organizerId}/${year}/overview`,
      );
      const overviewData = overviewRes.result || {};
      return {
        year: overviewData.year || year,
        events: overviewData.events || [],
      };
    } catch (err) {
      return { year, events: [] };
    }
  };

  const fetchRevenueOverview = async (organizerId) => {
    if (organizerId == null) {
      return {
        totalOrganizerAmount: 0,
        totalTicketsSold: 0,
        totalEvents: 0,
        totalServiceFee: 0,
      };
    }

    try {
      const overviewRes = await api.get(
        `/statistics-revenue/${organizerId}/overview`,
      );
      return overviewRes.result || {};
    } catch (err) {
      try {
        const fallbackRes = await api.get(
          `/statistics-revenue/${organizerId}/overvie`,
        );
        return fallbackRes.result || {};
      } catch (fallbackErr) {
        return {
          totalOrganizerAmount: 0,
          totalTicketsSold: 0,
          totalEvents: 0,
          totalServiceFee: 0,
        };
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, profileRes, eventsRes] =
          await Promise.all([
            api.get("/categories"),
            api.get("/users/my-info"),
            api.get("/events/organizer/my-events"),
          ]);

        const profileData = profileRes.result;
        const organizerId =
          profileData?.id ??
          profileData?.organizerId ??
          profileData?.userId ??
          profileData?.idOrganizer;

        setCategories(categoriesRes.result || []);
        setProfile(profileData);
        setMyEvents(eventsRes.result?.content || []);

        const revenueStats = await fetchRevenueByYear(
          organizerId,
          selectedRevenueYear,
        );
        const revenueOverview = await fetchRevenueOverview(organizerId);
        const eventOverview = await fetchEventOverviewByYear(
          organizerId,
          selectedRevenueYear,
        );

        setStats({
          monthlyRevenues: revenueStats.monthlyRevenues,
          revenueYear: revenueStats.revenueYear,
          revenueOverview,
          eventOverview,
        });
        setDashError("");
      } catch (err) {
        const statusCode = err?.response?.status;
        setCategories([]);
        setProfile(null);
        setStats(null);
        setMyEvents([]);
        if (statusCode === 401 || statusCode === 403) {
          setDashError(
            "Phiên đăng nhập đã hết hạn hoặc không đủ quyền. Vui lòng đăng nhập lại.",
          );
          redirectToLogin();
        } else {
          setDashError(
            "Không thể tải dữ liệu organizer. Vui lòng thử lại sau.",
          );
        }
      }
    };

    loadData();
  }, []);

  const handleRevenueYearChange = async (year) => {
    setSelectedRevenueYear(year);

    const organizerId =
      profile?.id ??
      profile?.organizerId ??
      profile?.userId ??
      profile?.idOrganizer;

    const revenueStats = await fetchRevenueByYear(organizerId, year);
    const eventOverview = await fetchEventOverviewByYear(organizerId, year);

    setStats((prev) => ({
      ...(prev || {}),
      monthlyRevenues: revenueStats.monthlyRevenues,
      revenueYear: revenueStats.revenueYear,
      eventOverview,
    }));
  };

  const handleEventChange = (e) => {
    const { name, value, files } = e.target;
    setEventFormData((prev) => ({ ...prev, [name]: files ? files : value }));
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();

    const invalidTicketIndex = eventFormData.ticketTypes.findIndex((tt) => {
      const price = Number(tt.price);
      const totalQuantity = Number(tt.totalQuantity);
      return (
        !Number.isFinite(price) ||
        !Number.isFinite(totalQuantity) ||
        price <= 0 ||
        totalQuantity <= 0
      );
    });

    if (invalidTicketIndex !== -1) {
      alert(
        `⚠️ Loại vé thứ ${invalidTicketIndex + 1}: Giá vé và số lượng phải lớn hơn 0.`,
      );
      return;
    }

    // Validate dates: saleStartDate < saleEndDate < startTime < endTime
    const sStart = new Date(eventFormData.saleStartDate);
    const sEnd = new Date(eventFormData.saleEndDate);
    const eStart = new Date(eventFormData.startTime);
    const eEnd = new Date(eventFormData.endTime);

    if (sEnd <= sStart) {
      alert("⚠️ Ngày KẾT THÚC bán vé phải sau ngày BẮT ĐẦU bán vé!");
      return;
    }
    if (eStart <= sEnd) {
      alert("⚠️ Thời gian DIỄN RA sự kiện phải sau khi KẾT THÚC bán vé!");
      return;
    }
    if (eEnd <= eStart) {
      alert(
        "⚠️ Thời gian KẾT THÚC sự kiện phải sau thời gian BẮT ĐẦU diễn ra!",
      );
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(eventFormData).forEach((key) => {
        if (key === "files" && eventFormData.files) {
          for (let i = 0; i < eventFormData.files.length; i++)
            data.append("files", eventFormData.files[i]);
        } else if (key === "ticketTypes") {
          eventFormData.ticketTypes.forEach((tt, i) => {
            data.append(`ticketTypes[${i}].name`, tt.name);
            data.append(`ticketTypes[${i}].price`, tt.price);
            data.append(`ticketTypes[${i}].totalQuantity`, tt.totalQuantity);
            data.append(`ticketTypes[${i}].description`, tt.description || "");
          });
        } else if (eventFormData[key]) {
          data.append(key, eventFormData[key]);
        }
      });
      await api.post("/events", data);
      alert("Đăng ký sự kiện & vé thành công! Hãy kiên nhẫn chờ Admin duyệt.");
      setEventFormData({
        name: "",
        categoryId: "",
        province: "",
        location: "",
        startTime: "",
        endTime: "",
        saleStartDate: "",
        saleEndDate: "",
        description: "",
        files: null,
        ticketTypes: [
          { name: "Vé thường", price: "", totalQuantity: "", description: "" },
        ],
      });
      setActiveTab("events");
      fetchDashData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Lỗi khi tạo sự kiện. Vui lòng kiểm tra lại dữ liệu.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const { username, ...updateData } = profile;
      await api.put(`/users/${username}`, updateData);
      alert("Cập nhật thành công!");
    } catch (err) {
      alert("Lỗi khi cập nhật hồ sơ.");
    }
  };

  const openTicketManager = async (event) => {
    setSelectedEvent(event);
    const res = await api.get(`/ticket-types/event/${event.id}`);
    setEventTicketTypes(res.result || []);
    setActiveTab("tickets");
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post("/ticket-types", {
        ...ticketFormData,
        eventId: selectedEvent.id,
      });
      alert("Đã thêm hạng vé thành công!");
      setTicketFormData({
        name: "",
        price: "",
        totalQuantity: "",
        description: "",
      });
      openTicketManager(selectedEvent);
    } catch (err) {
      alert("Thiết lập vé thất bại.");
    }
  };

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      {/* Sidebar Navigation */}
      <OrganizerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel */}
      <div className="flex-grow-1 overflow-auto" style={{ height: "100vh" }}>
        <div className="p-3 p-md-5 mx-auto" style={{ maxWidth: "1200px" }}>
          {activeTab === "dashboard" && (
            <OrganizerDashboard
              stats={stats}
              profile={profile}
              error={dashError}
              selectedRevenueYear={selectedRevenueYear}
              onRevenueYearChange={handleRevenueYearChange}
            />
          )}

          {activeTab === "events" && (
            <MyEventsList
              myEvents={myEvents}
              openTicketManager={openTicketManager}
            />
          )}

          {activeTab === "create" && (
            <CreateEventForm
              formData={eventFormData}
              handleChange={handleEventChange}
              handleSubmit={handleEventSubmit}
              categories={categories}
              loading={loading}
              handleAddTicketType={handleAddTicketType}
              handleRemoveTicketType={handleRemoveTicketType}
              handleTicketFieldChange={handleTicketFieldChange}
            />
          )}

          {activeTab === "tickets" && (
            <TicketManager
              event={selectedEvent}
              ticketFormData={ticketFormData}
              setTicketFormData={setTicketFormData}
              handleAddTicket={handleAddTicket}
              eventTicketTypes={eventTicketTypes}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "staff" && <StaffManager api={api} />}

          {activeTab === "vouchers" && (
            <VoucherManager api={api} events={myEvents} />
          )}

          {activeTab === "blog" && (
            <BlogManager api={api} myEvents={myEvents} />
          )}

          {activeTab === "profile" && (
            <OrganizerProfile
              profile={profile}
              setProfile={setProfile}
              handleProfileUpdate={handleProfileUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
