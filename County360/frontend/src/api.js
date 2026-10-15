import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://127.0.0.1:8000/api/',
  timeout: 10000,
})

export async function getCities() {
  const { data } = await api.get('cities/')
  return Array.isArray(data) ? data : []
}

export async function getFacilities(params = {}) {
  const { data } = await api.get('facilities/', { params })
  return Array.isArray(data) ? data : (data.results || [])
}

export async function getStatistics(params = {}) {
  const { data } = await api.get('facilities/statistics/', { params })
  return data
}

export async function getCategories() {
  const { data } = await api.get('categories/')
  return data
}