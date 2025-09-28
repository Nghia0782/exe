import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../shared/api'

type P = { _id: string; title: string; price: number; images?: string[]; category?: string }

export default function AdminProducts() {
  const [items, setItems] = useState<P[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/product/search', { params: { limit: 100 } })
      setItems(res.data?.metadata || [])
    } finally { setLoading(false) }
  }

  const filtered = items.filter(p => (p.title || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">Quản lý sản phẩm</h1>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên" className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 placeholder:text-white/50"/>
        </div>
        {loading ? (
          <div className="text-white/80">Đang tải...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div key={p._id} className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-white/10">
                  {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover"/>}
                </div>
                <div className="p-4">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-white/80">{p.price?.toLocaleString()} ₫/ngày</div>
                </div>
              </div>
            ))}
            {filtered.length===0 && <div className="text-white/70">Không có sản phẩm</div>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}


