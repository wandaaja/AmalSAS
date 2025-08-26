import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5050/api/v1";
const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "http://localhost:5050";

export const API = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

export const getImageUrl = (photo) => {
  if (!photo) return "https://via.placeholder.com/600x400?text=No+Image";
  if (photo.startsWith("http")) return photo;
  return `${IMAGE_BASE_URL}/uploads/${photo}`;
};