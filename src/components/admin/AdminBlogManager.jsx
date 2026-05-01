import React, { useState, useEffect } from "react";

const AdminBlogManager = ({ api }) => {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [tagForm, setTagForm] = useState({ name: "", slug: "" });
  const [notify, setNotify] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [currentPagePosts, setCurrentPagePosts] = useState(1);
  const [currentPageTags, setCurrentPageTags] = useState(1);
  const postsPerPage = 5;
  const tagsPerPage = 6;

  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    } else {
      fetchTags();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blog/admin/posts?size=100");
      setPosts(res.result?.content || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bài viết:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blog/tags");
      setTags(res.result || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tag:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (id, action) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thực hiện hành động này?`)) return;
    try {
      await api.patch(`/blog/admin/posts/${id}/${action}`);
      setNotify({ type: "success", message: "Cập nhật thành công!" });
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật bài viết");
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Xác nhận xóa bài viết này?")) return;
    try {
      await api.del(`/blog/admin/posts/${id}`);
      setNotify({ type: "success", message: "Đã xóa bài viết thành công!" });
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa bài viết");
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      const slug = tagForm.slug || tagForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      await api.post("/blog/admin/tags", { ...tagForm, slug });
      setNotify({ type: "success", message: "Tạo tag mới thành công!" });
      setTagForm({ name: "", slug: "" });
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi tạo tag");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">Đã xuất bản</span>;
      case "REJECTED":
        return <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2">Bị từ chối</span>;
      case "ARCHIVED":
        return <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2">Đã lưu trữ</span>;
      default:
        return <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2">Chờ duyệt</span>;
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (p.authorName && p.authorName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-2 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Blog & Tin tức</h4>
        </div>
      </div>

      <ul className="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-4 shadow-sm" style={{ width: 'fit-content' }}>
        <li className="nav-item">
          <button 
            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'posts' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('posts')}
          >
            Bài viết
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'tags' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('tags')}
          >
            Thẻ (Tags)
          </button>
        </li>
      </ul>

      {notify && (
        <div className={`alert alert-${notify.type} alert-dismissible fade show rounded-4 border-0 shadow-sm mb-4`} role="alert">
          {notify.message}
          <button type="button" className="btn-close" onClick={() => setNotify(null)}></button>
        </div>
      )}

      {activeTab === "posts" ? (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white p-3 border-0 border-bottom">
            <div className="row g-2">
              <div className="col-md-6">
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control bg-light border-0 shadow-none" 
                    placeholder="Tìm theo tiêu đề hoặc tác giả..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select 
                  className="form-select bg-light border-0 shadow-none"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="DRAFT">Chờ duyệt</option>
                  <option value="PUBLISHED">Đã xuất bản</option>
                  <option value="REJECTED">Bị từ chối</option>
                  <option value="ARCHIVED">Đã lưu trữ</option>
                </select>
              </div>
              <div className="col-md-3 text-end">
                <button className="btn btn-outline-secondary border-0" onClick={fetchPosts}>
                  Làm mới ↻
                </button>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="px-4 py-3 border-0">Nội dung / SEO</th>
                  <th className="border-0">Tác giả & Liên kết</th>
                  <th className="border-0 text-center">Trạng thái</th>
                  <th className="px-4 border-0 text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && posts.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm"></div></td></tr>
                ) : filteredPosts.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-5 text-muted">Không tìm thấy bài viết </td></tr>
                ) : (
                  (() => {
                    const indexOfLastItem = currentPagePosts * postsPerPage;
                    const indexOfFirstItem = indexOfLastItem - postsPerPage;
                    const currentItems = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);
                    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

                    return (
                      <>
                        {currentItems.map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center gap-3">
                                <img 
                                  src={p.thumbnail || "https://via.placeholder.com/60x40"} 
                                  className="rounded shadow-sm object-fit-cover" 
                                  style={{ width: '60px', height: '40px' }}
                                  alt=""
                                />
                                <div style={{ maxWidth: '300px' }}>
                                  <div className="fw-bold text-dark text-truncate">{p.title}</div>
                                  <div className="d-flex gap-2 mt-1">
                                    {p.metaTitle ? <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '9px' }}>SEO OK</span> : null}
                                    <span className="text-muted small text-truncate" style={{ fontSize: '11px' }}>{p.slug}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <div className="small fw-medium d-flex align-items-center gap-1">
                                  {p.authorName || "Admin"}
                                </div>
                                {p.eventIds && p.eventIds.length > 0 ? (
                                  <div className="small text-primary d-flex align-items-center gap-1">
                                    {p.eventIds.length} sự kiện
                                  </div>
                                ) : (
                                  <div className="small text-muted opacity-50">Không có liên kết</div>
                                )}
                              </div>
                            </td>
                            <td className="text-center">{getStatusBadge(p.status)}</td>
                            <td className="px-4 text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button 
                                  className="btn btn-sm btn-outline-info rounded-pill px-3 shadow-sm"
                                  onClick={() => setPreviewPost(p)}
                                >
                                  Xem
                                </button>
                                {p.status === "DRAFT" && (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-success rounded-pill px-3 shadow-sm"
                                      onClick={() => handleStatusAction(p.id, "publish")}
                                    >
                                      Duyệt
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger rounded-pill px-3 shadow-sm"
                                      onClick={() => handleStatusAction(p.id, "reject")}
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {p.status === "PUBLISHED" && (
                                  <button 
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm"
                                    onClick={() => handleStatusAction(p.id, "archive")}
                                  >
                                    Lưu trữ
                                  </button>
                                )}
                                <button 
                                  className="btn btn-sm btn-light rounded-circle shadow-sm text-danger"
                                  onClick={() => handleDeletePost(p.id)}
                                  title="Xóa bài viết"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {totalPages > 1 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-3 border-0">
                              <div className="d-flex justify-content-center gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                  <button
                                    key={i}
                                    className={`btn btn-sm rounded-pill px-3 ${currentPagePosts === i + 1 ? 'btn-primary' : 'btn-light'}`}
                                    onClick={() => setCurrentPagePosts(i + 1)}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h6 className="fw-bold mb-4">Tạo Tag mới</h6>
              <form onSubmit={handleCreateTag}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Tên thẻ *</label>
                  <input 
                    type="text" 
                    className="form-control bg-light border-0 shadow-none" 
                    placeholder="VD: Công nghệ, Nghệ thuật..."
                    required
                    value={tagForm.name}
                    onChange={e => setTagForm({ ...tagForm, name: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold">Slug</label>
                  <input 
                    type="text" 
                    className="form-control bg-light border-0 shadow-none" 
                    placeholder="VD: cong-nghe"
                    value={tagForm.slug}
                    onChange={e => setTagForm({ ...tagForm, slug: e.target.value })}
                  />
                  <small className="text-muted" style={{ fontSize: '10px' }}>Nếu bỏ trống hệ thống sẽ tự sinh slug từ tên.</small>
                </div>
                <button type="submit" className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm">
                  TẠO THẺ
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="card-header bg-white p-3 border-0 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Danh sách Thẻ hiện có</h6>
                <button className="btn btn-sm btn-outline-secondary border-0" onClick={fetchTags}>↻</button>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-secondary small">
                      <tr>
                        <th className="px-4 py-3 border-0">Tên thẻ</th>
                        <th className="border-0">Slug</th>
                        {/* <th className="px-4 border-0 text-end">ID</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="3" className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm"></div></td></tr>
                      ) : tags.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-5 text-muted">Chưa có tag nào.</td></tr>
                      ) : (
                        (() => {
                          const indexOfLastItem = currentPageTags * tagsPerPage;
                          const indexOfFirstItem = indexOfLastItem - tagsPerPage;
                          const currentItems = tags.slice(indexOfFirstItem, indexOfLastItem);
                          const totalPages = Math.ceil(tags.length / tagsPerPage);

                          return (
                            <>
                              {currentItems.map(t => (
                                <tr key={t.id}>
                                  <td className="px-4">
                                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
                                      {t.name}
                                    </span>
                                  </td>
                                  <td className="text-secondary small">{t.slug}</td>
                                </tr>
                              ))}
                              {totalPages > 1 && (
                                <tr>
                                  <td colSpan="2" className="px-4 py-3 border-0">
                                    <div className="d-flex justify-content-center gap-2">
                                      {[...Array(totalPages)].map((_, i) => (
                                        <button
                                          key={i}
                                          className={`btn btn-sm rounded-pill px-3 ${currentPageTags === i + 1 ? 'btn-primary' : 'btn-light'}`}
                                          onClick={() => setCurrentPageTags(i + 1)}
                                        >
                                          {i + 1}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold">Xem trước bài viết</h5>
                <button type="button" className="btn-close" onClick={() => setPreviewPost(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <h2 className="fw-bold mb-3">{previewPost.title}</h2>
                  <div className="d-flex gap-3 text-muted small mb-3">
                    <span>Tác giả: <strong>{previewPost.authorName || "Admin"}</strong></span>
                    <span>Ngày: {new Date(previewPost.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <img 
                    src={previewPost.thumbnail || "https://via.placeholder.com/800x400"} 
                    alt="Thumbnail" 
                    className="w-100 rounded-4 mb-4 shadow-sm object-fit-cover"
                    style={{ maxHeight: '350px' }}
                  />
                  <div className="p-3 bg-light rounded-3 mb-4 border-start border-primary border-4">
                    <p className="mb-0 fw-medium italic">{previewPost.summary}</p>
                  </div>
                  <div className="blog-content fs-5 lh-lg text-secondary" dangerouslySetInnerHTML={{ __html: previewPost.content }}></div>
                </div>

                {/* <div className="bg-light p-3 rounded-3 mt-4">
                  <h6 className="fw-bold small text-uppercase text-muted mb-2">Thông tin SEO</h6>
                  <div className="small">
                    <div className="mb-1"><strong>Meta Title:</strong> {previewPost.metaTitle || "Không có"}</div>
                    <div><strong>Meta Description:</strong> {previewPost.metaDescription || "Không có"}</div>
                  </div>
                </div> */}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setPreviewPost(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogManager;
