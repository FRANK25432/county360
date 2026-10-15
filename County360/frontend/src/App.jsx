
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Download,
  Filter,
  GraduationCap,
  HeartPulse,
  Leaf,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Waves,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  getCategories,
  getCities,
  getFacilities,
  getStatistics,
} from './api.js'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/'
).replace(/\/?$/, '/')

const center = [0.17, 35.08]

const icons = {
  health: HeartPulse,
  education: GraduationCap,
  water: Waves,
  agriculture: Leaf,
  administration: Building2,
  other: MapPin,
}

const colors = {
  health: '#dc6b5f',
  education: '#4778d0',
  water: '#269cb0',
  agriculture: '#54a46d',
  administration: '#8a72c7',
  other: '#718096',
}

const gapCategories = ['health', 'education', 'water']

function MapResizer() {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(timer)
  }, [map])

  return null
}
function CityMapController({ city }) {
  const map = useMap()

  useEffect(() => {
    if (
      city &&
      Number.isFinite(city.latitude) &&
      Number.isFinite(city.longitude)
    ) {
      map.flyTo(
        [city.latitude, city.longitude],
        12,
        { duration: 1 }
      )
    }
  }, [city, map])

  return null
}

function downloadCsv(rows) {
  const columns = [
    'id',
    'name',
    'category_display',
    'county',
    'sub_county',
    'ward',
    'status_display',
    'latitude',
    'longitude',
    'data_source',
    'is_demo',
  ]

  const quote = value => {
    let text = String(value ?? '')

    // Reduce spreadsheet formula-injection risk.
    if (/^[=+\-@]/.test(text)) {
      text = `'${text}`
    }

    return `"${text.replaceAll('"', '""')}"`
  }

  const csv = [
    columns.join(','),
    ...rows.map(row =>
      columns.map(column => quote(row[column])).join(',')
    ),
  ].join('\r\n')

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'county360-facilities.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function hasCoordinates(facility) {
  return (
    Number.isFinite(facility.latitude) &&
    Number.isFinite(facility.longitude) &&
    facility.latitude >= -90 &&
    facility.latitude <= 90 &&
    facility.longitude >= -180 &&
    facility.longitude <= 180
  )
}

export default function App() {
  const [facilities, setFacilities] = useState([])
  const [stats, setStats] = useState({
    total_facilities: 0,
    active_facilities: 0,
    inactive_facilities: 0,
    unknown_status: 0,
    facilities_with_coordinates: 0,
    by_category: {},
  })
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [subCounty, setSubCounty] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('checking')

  const [county, setCounty] = useState('Nandi')
  const [wardsInput, setWardsInput] = useState('')
  const [gapLoading, setGapLoading] = useState(false)
  const [gapError, setGapError] = useState('')
  const [gapResult, setGapResult] = useState(null)

  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState('Eldoret')
async function loadData(cityName = selectedCity) {
  setLoading(true)
  setError('')
  setConnectionStatus('checking')

  try {
    const [cityData, facilityData, statistics, categoryData] =
      await Promise.all([
        getCities(),
        getFacilities({ city: cityName }),
        getStatistics({ city: cityName }),
        getCategories(),
      ])

    setCities(cityData)
    setFacilities(facilityData)
    setStats(statistics)
    setCategories(categoryData)
    setConnectionStatus('connected')
  } catch (err) {
    console.error('County360 API connection failed:', err)

    setError(
      'Unable to load County360 data. Check that Django is running and the API is accessible.'
    )
    setConnectionStatus('disconnected')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
  loadData(selectedCity)
}, [selectedCity])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const subCountyTerm = subCounty.trim().toLowerCase()

    return facilities.filter(facility => {
      const matchesSearch =
        !term ||
        (facility.name || '').toLowerCase().includes(term) ||
        (facility.ward || '').toLowerCase().includes(term) ||
        (facility.sub_county || '').toLowerCase().includes(term)

      const matchesCategory =
        !category || facility.category === category

      const matchesSubCounty =
        !subCountyTerm ||
        (facility.sub_county || '')
          .toLowerCase()
          .includes(subCountyTerm)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubCounty
      )
    })
  }, [facilities, search, category, subCounty])

  const mappedFacilities = useMemo(
    () => filtered.filter(hasCoordinates),
    [filtered]
  )

  const chartData = useMemo(
    () =>
      categories.map(item => ({
        name: item.label
          .replace(' Facility', '')
          .replace('Administrative Office', 'Admin'),
        count: stats.by_category?.[item.value] || 0,
        fill: colors[item.value] || colors.other,
      })),
    [categories, stats]
  )

  async function runGapAnalysis(event) {
    event.preventDefault()
    setGapError('')
    setGapResult(null)

    const wards = [
      ...new Set(
        wardsInput
          .split(',')
          .map(ward => ward.trim())
          .filter(Boolean)
      ),
    ]

    if (!wards.length) {
      setGapError(
        'Enter at least one ward name, separating multiple wards with commas.'
      )
      return
    }

    setGapLoading(true)

    try {
      const response = await axios.get(
        `${API_BASE_URL}facilities/service_gaps/`,
        {
          params: {
            wards: wards.join(','),
            categories: gapCategories.join(','),
            county: county.trim(),
          },
          timeout: 15000,
        }
      )

      setGapResult(response.data)
    } catch (err) {
      console.error('Service gap analysis failed:', err)

      const message =
        err.response?.data?.error ||
        'Service gap analysis could not run. Check the Django endpoint and try again.'

      setGapError(message)
    } finally {
      setGapLoading(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setCategory('')
    setSubCounty('')
  }

  const connectionLabel = {
    checking: 'Checking connection',
    connected: 'API connected',
    disconnected: 'API unavailable',
  }[connectionStatus]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={22} />
          </div>
          <div>
            <b>Count360</b>
            <small>CITY INTELLIGENCE</small>
          </div>
        </div>

        <div className="county-switch">
  <div className="county-icon">
    <MapPin size={18} />
  </div>

  <div style={{ flex: 1, minWidth: 0 }}>
    <small>SELECT CITY / TOWN</small>

    <select
      value={selectedCity}
      onChange={event => setSelectedCity(event.target.value)}
      aria-label="Select city or town"
      style={{
        width: '100%',
        marginTop: 5,
        padding: '6px 4px',
        border: '1px solid #dce5df',
        borderRadius: 6,
        background: 'white',
      }}
    >
      {cities.map(city => (
        <option key={city.name} value={city.name}>
          {city.name}
        </option>
      ))}
    </select>
  </div>

  <ChevronDown size={16} />
</div>

        <div className="nav-label">WORKSPACE</div>

        <button
          type="button"
          className="nav-item active"
          onClick={() =>
            document.getElementById('overview')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <BarChart3 size={18} />
          Overview
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() =>
            document.getElementById('facility-explorer')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <MapPin size={18} />
          Facility Explorer
          <span className="nav-count">{stats.total_facilities}</span>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() =>
            document.getElementById('gap-analysis')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <Filter size={18} />
          Gap Analysis
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() =>
            document.getElementById('planning-assistant')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <Sparkles size={18} />
          Planning Assistant
          <span className="soon">Planned</span>
        </button>

        <div className="nav-label second">MANAGEMENT</div>

        <a
          className="nav-item"
          href="http://127.0.0.1:8000/admin/"
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={18} />
          Data Administration
        </a>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <b>{connectionLabel}</b>
            <small>Local development</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar" id="overview">
          <div>
            <div className="eyebrow">
              CITY PLANNING PLATFORM <span>•</span> LIVE DATABASE VIEW
            </div>
            <h1>City  overview</h1>
            <p>
              Explore facility records, geographic coverage and potential
              service gaps.
            </p>
          </div>

          <div className="top-actions">
            <span className="demo-pill">
              {connectionStatus === 'connected' ? (
                <Wifi size={14} />
              ) : connectionStatus === 'disconnected' ? (
                <WifiOff size={14} />
              ) : (
                <Activity size={14} />
              )}
              {connectionLabel.toUpperCase()}
            </span>

            <button
              className="icon-button"
              onClick={loadData}
              disabled={loading}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw size={17} />
            </button>

            <a
              className="admin-button"
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              rel="noreferrer"
            >
              Manage data <ShieldCheck size={16} />
            </a>
          </div>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={loadData}>Retry</button>
          </div>
        )}

        <div className="notice">
          <CircleHelp size={17} />
          <span>
            <b>Data quality notice:</b> Database records are not automatically
            verified official information. Confirm each source and coordinate
            before using results for county planning.
          </span>
        </div>

        <section className="metric-grid">
          <Metric
            icon={Building2}
            label="Facilities in database"
            value={loading ? '…' : stats.total_facilities ?? facilities.length}
            hint="Non-demo records returned by the API"
            color="green"
          />

          <Metric
            icon={ShieldCheck}
            label="Marked active"
            value={loading ? '…' : stats.active_facilities ?? 0}
            hint="Based on recorded status"
            color="blue"
          />

          <Metric
            icon={MapPin}
            label="Records with coordinates"
            value={
              loading
                ? '…'
                : stats.facilities_with_coordinates ??
                  facilities.filter(hasCoordinates).length
            }
            hint="Coordinate fields are populated"
            color="purple"
          />

          <Metric
            icon={CircleHelp}
            label="Records in current view"
            value={filtered.length}
            hint="After applying local filters"
            color="orange"
          />
        </section>

        <section className="content-grid">
          <div className="panel map-panel">
            <div className="panel-heading">
              <div>
                <h2>Facility map</h2>
                <p>
                  Locations from database records with valid coordinates
                </p>
              </div>
              <span className="small-chip">
                <span />
                {mappedFacilities.length} points
              </span>
            </div>

            <div className="map-wrap">
              <MapContainer
                  center={center}
                  zoom={10}
                  scrollWheelZoom
                  className="leaflet-map"
              >
                <MapResizer />

                <CityMapController
                  city={cities.find(item => item.name === selectedCity)}
                />

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mappedFacilities.map(facility => (
                  <CircleMarker
                    key={facility.id}
                    center={[
                      facility.latitude,
                      facility.longitude,
                    ]}
                    radius={8}
                    pathOptions={{
                      color:
                        colors[facility.category] || colors.other,
                      fillColor:
                        colors[facility.category] || colors.other,
                      fillOpacity: 0.8,
                    }}
                  >
                    <Popup>
                      <b>{facility.name}</b>
                      <br />
                      {facility.category_display || facility.category}
                      <br />
                      {facility.county || 'County not specified'}
                      <br />
                      {facility.sub_county || 'Sub-county not set'}
                      <br />
                      {facility.ward || 'Ward not set'}
                      <br />
                      <small>
                        {facility.is_demo
                          ? 'Demonstration record'
                          : 'Source requires verification'}
                      </small>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {mappedFacilities.length === 0 && (
              <p className="metric-hint">
                No facilities with valid coordinates are available in the
                current view. Add verified records with coordinates to
                populate the map.
              </p>
            )}

            <div className="legend">
              {categories.map(item => (
                <span key={item.value}>
                  <i
                    style={{
                      background:
                        colors[item.value] || colors.other,
                    }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h2>Facility distribution</h2>
                <p>Database totals by category</p>
              </div>
              <span className="chart-icon">
                <BarChart3 size={18} />
              </span>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 8,
                    left: -20,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e9eeeb"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#788780' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#788780' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Records"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-foot">
              <span className="foot-dot" />
              Counts represent recorded facilities, not proof of service
              coverage.
            </div>
          </div>
        </section>

        <section className="panel records-panel" id="facility-explorer">
          <div className="records-head">
            <div>
              <h2>Facility explorer</h2>
              <p>Search and filter records returned by Django.</p>
            </div>

            <button
              className="export-button"
              onClick={() => downloadCsv(filtered)}
              disabled={loading || filtered.length === 0}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          <div className="filters">
            <div className="searchbox">
              <Search size={17} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search facility, ward or sub-county"
              />
            </div>

            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <input
              className="subcounty-input"
              value={subCounty}
              onChange={event => setSubCounty(event.target.value)}
              placeholder="Filter by sub-county"
            />

            <button className="clear-button" onClick={clearFilters}>
              Clear
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>FACILITY</th>
                  <th>CATEGORY</th>
                  <th>SUB-COUNTY</th>
                  <th>STATUS</th>
                  <th>DATA SOURCE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      Loading facility records…
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map(facility => {
                    const Icon = icons[facility.category] || MapPin

                    return (
                      <tr key={facility.id}>
                        <td>
                          <div className="facility-name">
                            <span
                              style={{
                                color:
                                  colors[facility.category] ||
                                  colors.other,
                              }}
                            >
                              <Icon size={17} />
                            </span>
                            <div>
                              <b>{facility.name}</b>
                              <small>
                                {facility.ward || 'Ward not specified'}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {facility.category_display ||
                            facility.category}
                        </td>

                        <td>
                          {facility.sub_county || '—'}
                        </td>

                        <td>
                          <span
                            className={`status status-${facility.status || 'unknown'}`}
                          >
                            {facility.status_display ||
                              facility.status ||
                              'Unknown'}
                          </span>
                        </td>

                        <td>
                          <span className="data-type">
                            {facility.is_demo
                              ? 'Demo'
                              : facility.data_source &&
                                  facility.data_source !==
                                    'Demonstration data'
                                ? facility.data_source
                                : 'Needs verification'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      {error
                        ? 'The backend data is unavailable. Check the connection and retry.'
                        : facilities.length === 0
                          ? 'No facility records are currently available. Add records through Data Administration.'
                          : 'No records match these filters. Try changing your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Showing <b>{filtered.length}</b> of {facilities.length}{' '}
              loaded records
            </span>
            <span>Source labels do not independently verify a record.</span>
          </div>
        </section>

        <section className="panel records-panel" id="gap-analysis">
          <div className="records-head">
            <div>
              <h2>Service gap analysis</h2>
              <p>
                Find wards with no matching facility records in selected
                categories.
              </p>
            </div>
            <Filter size={20} />
          </div>

          <form className="filters" onSubmit={runGapAnalysis}>
            <input
              value={county}
              onChange={event => setCounty(event.target.value)}
              placeholder="city name"
              aria-label="City name"
              required
            />

            <input
              className="subcounty-input"
              value={wardsInput}
              onChange={event => setWardsInput(event.target.value)}
              placeholder="Ward names separated by commas"
              aria-label="Ward names separated by commas"
              required
            />

            <button
              className="export-button"
              type="submit"
              disabled={gapLoading}
            >
              {gapLoading ? 'Analysing…' : 'Analyse gaps'}
            </button>
          </form>

          <div style={{ padding: '16px 19px' }}>
            <p className="metric-hint">
              Categories checked: health, education and water. A missing
              database record does not prove a real-world service shortage.
              Verify findings against authoritative county data.
            </p>

            {gapError && (
              <div className="error-banner" role="alert">
                <AlertTriangle size={18} />
                <span>{gapError}</span>
              </div>
            )}

            {gapResult && (
              <div>
                <h3 style={{ marginBottom: 12 }}>
                  Analysis results — {gapResult.county || county}
                </h3>

                {gapResult.results?.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>WARD</th>
                          <th>RECORDED FACILITIES</th>
                          <th>CATEGORIES WITHOUT RECORDS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gapResult.results.map((result, index) => (
                          <tr key={`${result.ward}-${index}`}>
                            <td>{result.ward}</td>
                            <td>{result.recorded_facilities}</td>
                            <td>
                              {result.missing_record_categories.length
                                ? result.missing_record_categories.join(
                                    ', '
                                  )
                                : 'No checked category is missing from the records'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No results were returned for the supplied wards.</p>
                )}

                <p
                  className="metric-hint"
                  style={{ marginTop: 12 }}
                >
                  {gapResult.wards_checked} wards checked. These results
                  describe database records only.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          className="panel records-panel"
          id="planning-assistant"
          style={{ padding: 19, marginTop: 18 }}
        >
          <div className="panel-heading">
            <div>
              <h2>Planning assistant</h2>
              <p>AI-supported planning is the next development phase.</p>
            </div>
            <Sparkles size={22} />
          </div>

          <p style={{ marginTop: 12, fontSize: 12, lineHeight: 1.7 }}>
            Count360 can prepare evidence-based recommendations once
            verified facility, population, climate and infrastructure
            datasets are connected. AI recommendations are not yet
            implemented in this dashboard, and this panel does not generate
            predictions.
          </p>
        </section>

        <footer>
          <span>
            Count360 <b>•</b> city intelligence platform
          </span>
          <span>
            Use verified sources before making planning decisions.
          </span>
        </footer>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, hint, color }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${color}`}>
        <Icon size={20} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-hint">{hint}</div>
    </div>
  )
}
