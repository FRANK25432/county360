import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/',
  timeout: 10000,
})

export async function getFacilities(params = {}) {
  const { data } = await api.get('facilities/', { params })
  return Array.isArray(data) ? data : (data.results || [])
}
export async function getStatistics() {
  const { data } = await api.get('facilities/statistics/')
  return data
}
export async function getCategories() {
  const { data } = await api.get('categories/')
  return data
}
