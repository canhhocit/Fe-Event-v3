import React, { useState, useEffect, useRef } from "react";
import { 
  Heading1, Heading2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, 
  Trash2, Edit, Eye, Plus, CheckCircle, AlertCircle, X, Search
} from 'lucide-react';

const DEFAULT_BLOG_IMAGE = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop";

const getStatusBadge = (status) => {
  switch (status) {
    case "PUBLISHED":
      return <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 d-flex align-items-center gap-1 w-fit-content"><CheckCircle size={14} /> Đã đăng</span>;
    case "REJECTED":
      return <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 d-flex align-items-center gap-1 w-fit-content"><AlertCircle size={14} /> Bị từ chối</span>;
    case "ARCHIVED":
      return <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-1 w-fit-content">Đã lưu trữ</span>;
    default:
      return <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 d-flex align-items-center gap-1 w-fit-content">Chờ duyệt</span>;
  }
};

const BlogManager = ({ api, myEvents = [] }) => {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "", summary: "", content: "", thumbnail: "",
    tagIds: [], eventIds: [], metaTitle: "", metaDescription: ""
  });
  const [notify, setNotify] = useState(null);
  const contentRef = useRef(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blog/organizer/posts?size=100");
      setPosts(res.result?.content || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bài viết:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get("/blog/tags");
      setTags(res.result || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tag:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [api]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await api.post("/files/upload", data);
      setFormData(prev => ({ ...prev, thumbnail: res.result }));
      setNotify({ type: "success", message: "Tải ảnh lên thành công!" });
    } catch (err) {
      setNotify({ type: "error", message: "Lỗi khi tải ảnh lên" });
    } finally {
      setUploading(false);
    }
  };

  const insertText = (before, after = "") => {
    const textarea = contentRef.current;
    const { selectionStart: start, selectionEnd: end, value: text } = textarea;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setFormData(prev => ({ ...prev, content: newValue }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      summary: post.summary || "",
      content: post.content || "",
      thumbnail: post.thumbnail || "",
      tagIds: post.tags ? post.tags.map(t => t.id) : [],
      eventIds: post.eventIds || [],
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || ""
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, thumbnail: formData.thumbnail || DEFAULT_BLOG_IMAGE };
      if (editingPost) {
        await api.put(`/blog/organizer/posts/${editingPost.id}`, payload);
        setNotify({ type: "success", message: "Cập nhật bài viết thành công!" });
      } else {
        await api.post("/blog/organizer/posts", payload);
        setNotify({ type: "success", message: "Tạo bài viết mới thành công! Chờ Admin duyệt." });
      }
      setShowForm(false);
      setEditingPost(null);
      setFormData({ title: "", summary: "", content: "", thumbnail: "", tagIds: [], eventIds: [], metaTitle: "", metaDescription: "" });
      fetchPosts();
    } catch (err) {
      setNotify({ type: "error", message: err.response?.data?.message || "Lỗi khi lưu bài viết" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await api.del(`/blog/organizer/posts/${id}`);
      setNotify({ type: "success", message: "Xóa bài viết thành công!" });
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa bài viết");
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Bài viết Blog</h4>
        </div>
        {!showForm && (
          <button
            className="btn btn-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
            onClick={() => {
              setEditingPost(null);
              setFormData({ title: "", summary: "", content: "", thumbnail: "", tagIds: [], eventIds: [], metaTitle: "", metaDescription: "" });
              setShowForm(true);
            }}
          >
            <Plus size={18} /> Viết bài mới
          </button>
        )}
      </div>

      {notify && (
        <div className={`alert alert-${notify.type === "error" ? "danger" : "success"} alert-dismissible fade show rounded-4 border-0 shadow-sm mb-4`}>
          <strong>{notify.type === "error" ? "Lỗi!" : "Thành công!"}</strong> {notify.message}
          <button type="button" className="btn-close" onClick={() => setNotify(null)}></button>
        </div>
      )}

      {showForm && (
        <div className="card border-0 shadow-lg rounded-4 mb-5 overflow-hidden animate-fade-in">
          <div className="card-header bg-white border-bottom p-0">
            <div className="px-4 py-3">
              <h6 className="fw-bold text-primary mb-0">{editingPost ? "Chỉnh sửa bài viết" : "Viết bài mới"}</h6>
            </div>
          </div>
          
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="mb-4">
                    <label className="form-label small fw-bold">Tiêu đề bài viết *</label>
                    <input type="text" name="title" className="form-control form-control-lg bg-light border-0 rounded-3" placeholder="Tiêu đề..." value={formData.title} onChange={handleChange} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold">Tóm tắt ngắn</label>
                    <textarea name="summary" rows="2" className="form-control bg-light border-0 rounded-3" placeholder="Tóm tắt..." value={formData.summary} onChange={handleChange} />
                  </div>
                  <div className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small fw-bold mb-0">Nội dung bài viết *</label>
                      <div className="btn-group border rounded-3 bg-white overflow-hidden shadow-xs">
                        <button type="button" className="btn btn-sm btn-white border-0 py-1 px-2" title="Tiêu đề lớn" onClick={()=>insertText("<h1>","</h1>")}><Heading1 size={16} /></button>
                        <button type="button" className="btn btn-sm btn-white border-0 py-1 px-2" title="Tiêu đề nhỏ" onClick={()=>insertText("<h2>","</h2>")}><Heading2 size={16} /></button>
                        <button type="button" className="btn btn-sm btn-white border-0 py-1 px-2" title="Chữ đậm" onClick={()=>insertText("<strong>","</strong>")}><Bold size={16} /></button>
                        <button type="button" className="btn btn-sm btn-white border-0 py-1 px-2" title="Chữ nghiêng" onClick={()=>insertText("<em>","</em>")}><Italic size={16} /></button>
                        <button type="button" className="btn btn-sm btn-white border-0 py-1 px-2" title="Thêm liên kết" onClick={()=>insertText('<a href="#">','</a>')}><LinkIcon size={16} /></button>
                        <button type="button" className="btn btn-sm btn-white border-0 py-1 px-2" title="Thêm ảnh" onClick={()=>insertText('<img src="','" alt="" />')}><ImageIcon size={16} /></button>
                      </div>
                    </div>
                    <textarea ref={contentRef} name="content" rows="12" className="form-control bg-light border-0 rounded-3 font-monospace" placeholder="Nội dung..." value={formData.content} onChange={handleChange} required />
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="card bg-light border-0 rounded-4 p-3 mb-4 shadow-sm text-center">
                    <label className="form-label small fw-bold mb-2">Ảnh đại diện</label>
                    <div className="mb-3 position-relative rounded-3 bg-white d-flex align-items-center justify-content-center overflow-hidden border-2 border-dashed border-secondary border-opacity-25" style={{ height: '180px' }}>
                      {formData.thumbnail ? (
                        <>
                          <img src={formData.thumbnail} alt="Preview" className="w-100 h-100 object-fit-cover" />
                          <button type="button" className="btn btn-danger btn-sm position-absolute rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ top: '10px', right: '10px', width: '24px', height: '24px' }} onClick={() => setFormData(p => ({ ...p, thumbnail: "" }))}><X size={14} /></button>
                        </>
                      ) : <p className="small text-muted mb-0">Chưa có ảnh</p>}
                    </div>
                    <input type="file" className="d-none" id="blogThumbInput" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    <button type="button" className="btn btn-primary w-100 rounded-pill fw-bold" onClick={() => document.getElementById('blogThumbInput').click()} disabled={uploading}>
                      {uploading ? <span className="spinner-border spinner-border-sm"></span> : "TẢI ẢNH LÊN"}
                    </button>
                    <input type="text" name="thumbnail" className="form-control form-control-sm border-0 bg-white mt-3" placeholder="Hoặc dán URL ảnh..." value={formData.thumbnail} onChange={handleChange} />
                  </div>

                  <div className="card bg-light border-0 rounded-4 p-3 mb-4 shadow-sm">
                    <label className="form-label small fw-bold mb-2">Liên kết Sự kiện</label>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {myEvents.map(ev => (
                        <div key={ev.id} className="form-check small text-truncate">
                          <input className="form-check-input" type="checkbox" checked={formData.eventIds.includes(ev.id)} onChange={() => {
                               setFormData(prev => ({
                                ...prev,
                                eventIds: prev.eventIds.includes(ev.id)
                                  ? prev.eventIds.filter(id => id !== ev.id)
                                  : [...prev.eventIds, ev.id]
                              }));
                          }} />
                          <label className="form-check-label">{ev.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card bg-light border-0 rounded-4 p-3 shadow-sm">
                    <label className="form-label small fw-bold mb-2">Thẻ (Tags)</label>
                    <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {tags.map(tag => (
                        <button key={tag.id} type="button" className={`btn btn-xs rounded-pill border-0 ${formData.tagIds.includes(tag.id) ? "btn-primary" : "btn-white text-secondary"}`} onClick={() => handleTagToggle(tag.id)}>#{tag.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 d-flex gap-2 justify-content-end pt-5 border-top mt-4">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" disabled={loading || uploading}>
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : (editingPost ? "LƯU THAY ĐỔI" : "XÁC NHẬN ĐĂNG")}
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
                <th className="px-4 py-3 border-0">Bài viết</th>
                <th className="py-3 border-0">Liên kết</th>
                <th className="py-3 border-0">Ngày tạo</th>
                <th className="py-3 border-0">Trạng thái</th>
                <th className="px-4 py-3 border-0 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && posts.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm"></div></td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có bài viết nào.</td></tr>
              ) : (
                (() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const currentItems = posts.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);
                  const totalPages = Math.ceil(posts.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3" style={{ maxWidth: '350px' }}>
                            <div className="d-flex align-items-center gap-3">
                              <img src={p.thumbnail || DEFAULT_BLOG_IMAGE} className="rounded-3 object-fit-cover shadow-sm" style={{ width: '80px', height: '50px' }} alt="" />
                              <div className="overflow-hidden">
                                <div className="fw-bold text-dark text-truncate">{p.title}</div>
                                <div className="d-flex gap-1 overflow-hidden">
                                  {p.tags?.map(t => <span key={t.id} className="text-primary" style={{ fontSize: '10px' }}>#{t.name}</span>)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="small fw-medium text-primary">{p.eventIds?.length || 0} sự kiện</td>
                          <td className="small">{new Date(p.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td>{getStatusBadge(p.status)}</td>
                          <td className="px-4 text-end">
                            <div className="d-flex justify-content-end gap-1">
                              {p.status === 'PUBLISHED' && (
                                <a href={`http://localhost:5174/blog/${p.slug || p.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info rounded-pill px-3 text-decoration-none d-flex align-items-center gap-1">
                                  <Eye size={14} /> Xem
                                </a>
                              )}
                              <button className="btn btn-sm btn-light rounded-circle p-2 shadow-sm" title="Chỉnh sửa" onClick={() => handleEdit(p)}><Edit size={14} /></button>
                              <button className="btn btn-sm btn-light rounded-circle p-2 shadow-sm text-danger" title="Xóa bài" onClick={() => handleDelete(p.id)} disabled={p.status === 'PUBLISHED'}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {totalPages > 1 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-3 border-0">
                            <div className="d-flex justify-content-center gap-2">
                              {[...Array(totalPages)].map((_, i) => (
                                <button key={i} className={`btn btn-sm rounded-pill px-3 ${currentPage === i + 1 ? 'btn-primary' : 'btn-light'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
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
      <style>{`
        .btn-xs { padding: 0.2rem 0.4rem; font-size: 0.75rem; }
        .object-fit-cover { object-fit: cover; }
        .shadow-xs { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
};

export default BlogManager;
