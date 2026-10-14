import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { BarChart3, Building2, ChevronDown, CircleHelp, Download, Filter, Leaf, MapPin, Search, ShieldCheck, Sparkles, Users, Waves, GraduationCap, HeartPulse, RefreshCw, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCategories, getFacilities, getStatistics } from './api.js'

const center = [0.17, 35.08]
const icons = { health: HeartPulse, education: GraduationCap, water: Waves, agriculture: Leaf, administration: Building2, other: MapPin }
const colors = { health: '#dc6b5f', education: '#4778d0', water: '#269cb0', agriculture: '#54a46d', administration: '#8a72c7', other: '#718096' }

function MapResizer() {
  const map = useMap()
  useEffect(() => { setTimeout(() => map.invalidateSize(), 150) }, [map])
  return null
}

function downloadCsv(rows) {
  const cols = ['name','category_display','sub_county','ward','status_display','latitude','longitude','is_demo']
  const quote = v => `"${String(v ?? '').replaceAll('"','""')}"`
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => quote(r[c])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'county360-facilities.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [facilities, setFacilities] = useState([])
  const [stats, setStats] = useState({ total_facilities: 0, active_facilities: 0, demo_records: 0, by_category: {} })
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [subCounty, setSubCounty] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true); setError('')
    try {
      const [f, s, c] = await Promise.all([getFacilities(), getStatistics(), getCategories()])
      setFacilities(f); setStats(s); setCategories(c)
    } catch {
      setError('Could not connect to Django. Confirm the backend is running at 127.0.0.1:8000 and migrations have been applied.')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => facilities.filter(f =>
    (!search || f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.ward || '').toLowerCase().includes(search.toLowerCase())) &&
    (!category || f.category === category) &&
    (!subCounty || (f.sub_county || '').toLowerCase().includes(subCounty.toLowerCase()))
  ), [facilities, search, category, subCounty])

  const chartData = categories.map(c => ({
    name: c.label.replace(' Facility','').replace('Administrative Office','Admin'),
    count: stats.by_category?.[c.value] || 0,
    fill: colors[c.value] || colors.other,
  }))

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Building2 size={22}/></div><div><b>County360</b><small>COUNTY INTELLIGENCE</small></div></div>
      <div className="county-switch"><div className="county-icon">N</div><div><small>COUNTY WORKSPACE</small><b>Nandi County</b></div><ChevronDown size={16}/></div>
      <div className="nav-label">WORKSPACE</div>
      <div className="nav-item active"><BarChart3 size={18}/> Overview</div>
      <div className="nav-item"><MapPin size={18}/> Facility Explorer <span className="nav-count">{stats.total_facilities}</span></div>
      <div className="nav-item"><Filter size={18}/> Gap Analysis <span className="soon">Preview</span></div>
      <div className="nav-item"><Sparkles size={18}/> Data Assistant <span className="soon">Preview</span></div>
      <div className="nav-label second">MANAGEMENT</div>
      <a className="nav-item" href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer"><ShieldCheck size={18}/> Data Administration</a>
      <div className="sidebar-bottom"><div className="status-dot"></div><div><b>Prototype environment</b><small>Local development</small></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div><div className="eyebrow">COUNTY PLANNING PLATFORM <span>•</span> DEMO</div><h1>County overview</h1><p>Explore facilities and an illustrative view of county service data.</p></div>
        <div className="top-actions"><span className="demo-pill"><span/> DEMO DATA</span><button className="icon-button" onClick={loadData} title="Refresh data"><RefreshCw size={17}/></button><a className="admin-button" href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer">Manage data <ShieldCheck size={16}/></a></div>
      </header>

      {error && <div className="error-banner"><AlertTriangle size={18}/><span>{error}</span><button onClick={loadData}>Retry</button></div>}
      <div className="notice"><CircleHelp size={17}/><span><b>Prototype notice:</b> Sample records and map coordinates are fictional demonstrations, not verified official Nandi County data.</span></div>

      <section className="metric-grid">
        <Metric icon={Building2} label="Facilities in view" value={filtered.length} hint="Records matching current filters" color="green"/>
        <Metric icon={ShieldCheck} label="Marked active" value={filtered.filter(f => f.status === 'active').length} hint="Based on record status fields" color="blue"/>
        <Metric icon={MapPin} label="Mapped records" value={filtered.filter(f => f.latitude != null && f.longitude != null).length} hint="Coordinates available" color="purple"/>
        <Metric icon={Users} label="Demo records" value={filtered.filter(f => f.is_demo).length} hint="Not official statistics" color="orange"/>
      </section>

      <section className="content-grid">
        <div className="panel map-panel">
          <div className="panel-heading"><div><h2>Facility map</h2><p>Illustrative facility locations around Nandi County</p></div><span className="small-chip"><span/> {filtered.filter(f => f.latitude != null && f.longitude != null).length} points</span></div>
          <div className="map-wrap">
            <MapContainer center={center} zoom={10} scrollWheelZoom={true} className="leaflet-map">
              <MapResizer/>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              {filtered.filter(f => f.latitude != null && f.longitude != null).map(f =>
                <CircleMarker key={f.id} center={[f.latitude, f.longitude]} radius={8} pathOptions={{ color: colors[f.category] || colors.other, fillColor: colors[f.category] || colors.other, fillOpacity: 0.8 }}>
                  <Popup><b>{f.name}</b><br/>{f.category_display}<br/>{f.sub_county || 'Sub-county not set'}<br/><small>{f.is_demo ? 'Demonstration record' : 'Source record'}</small></Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
          <div className="legend">{categories.map(c => <span key={c.value}><i style={{background:colors[c.value] || colors.other}}/>{c.label}</span>)}</div>
        </div>

        <div className="panel chart-panel">
          <div className="panel-heading"><div><h2>Facility distribution</h2><p>Records by category</p></div><span className="chart-icon"><BarChart3 size={18}/></span></div>
          <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:12,right:8,left:-20,bottom:4}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eeeb"/><XAxis dataKey="name" tick={{fontSize:10,fill:'#788780'}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11,fill:'#788780'}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="count" name="Records" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div>
          <div className="chart-foot"><span className="foot-dot"/> Data reflects the current prototype database</div>
        </div>
      </section>

      <section className="panel records-panel">
        <div className="records-head"><div><h2>Facility explorer</h2><p>Search and filter available facility records.</p></div><button className="export-button" onClick={() => downloadCsv(filtered)}><Download size={16}/> Export CSV</button></div>
        <div className="filters">
          <div className="searchbox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search facility or ward…"/></div>
          <select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select>
          <input className="subcounty-input" value={subCounty} onChange={e=>setSubCounty(e.target.value)} placeholder="Filter by sub-county"/>
          <button className="clear-button" onClick={()=>{setSearch('');setCategory('');setSubCounty('')}}>Clear</button>
        </div>
        <div className="table-scroll"><table><thead><tr><th>FACILITY</th><th>CATEGORY</th><th>SUB-COUNTY</th><th>STATUS</th><th>DATA TYPE</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="5" className="empty-state">Loading facility records…</td></tr> :
           filtered.length ? filtered.map(f=>{const Icon=icons[f.category] || MapPin;return <tr key={f.id}><td><div className="facility-name"><span style={{color:colors[f.category]}}><Icon size={17}/></span><div><b>{f.name}</b><small>{f.ward || 'Ward not specified'}</small></div></div></td><td>{f.category_display}</td><td>{f.sub_county || '—'}</td><td><span className={`status status-${f.status}`}>{f.status_display}</span></td><td><span className="data-type">{f.is_demo ? 'Demo' : 'Verified source'}</span></td></tr>}) :
           <tr><td colSpan="5" className="empty-state">{error ? 'Backend data is unavailable.' : 'No records match these filters. Add records in Django Admin or run the demo seeder.'}</td></tr>}
        </tbody></table></div>
        <div className="table-footer"><span>Showing <b>{filtered.length}</b> of {facilities.length} loaded records</span><span>Source labels are shown per record</span></div>
      </section>
      <footer><span>County360 <b>•</b> County data prototype</span><span>Built for exploration, not as a source of official statistics.</span></footer>
    </main>
  </div>
}

function Metric({icon:Icon,label,value,hint,color}) {
  return <div className="metric-card"><div className={`metric-icon ${color}`}><Icon size={20}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>
}
