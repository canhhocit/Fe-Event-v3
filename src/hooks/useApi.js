import api from "../api/api";

export const useApi = () => {
  const get = (url, params) => api.get(url, { params }).then(res => res.data);
  const post = (url, data) => api.post(url, data).then(res => res.data);
  const put = (url, data) => api.put(url, data).then(res => res.data);
  const patch = (url, data) => api.patch(url, data).then(res => res.data);
  const del = (url) => api.delete(url).then(res => res.data);

  return { get, post, put, patch, del };
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Trỏ về đường dẫn lấy ảnh của backend (chuẩn Microservices)
  return `http://localhost:8080/images/${path}`;
};