import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { api } from '../shared/api'

type KycStatus = 'none' | 'pending' | 'approved' | 'rejected'

export default function VerifyIdentity() {
  const [status, setStatus] = useState<KycStatus>('none')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // form fields
  const [idType, setIdType] = useState<'cccd' | 'cmnd' | 'passport'>('cccd')
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [address, setAddress] = useState('')

  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const frontUrl = useMemo(() => (frontFile ? URL.createObjectURL(frontFile) : ''), [frontFile])
  const backUrl = useMemo(() => (backFile ? URL.createObjectURL(backFile) : ''), [backFile])
  const selfieUrl = useMemo(() => (selfieFile ? URL.createObjectURL(selfieFile) : ''), [selfieFile])

  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      try {
        const res = await api.get('/kyc/status')
        const s: KycStatus = res.data?.status || 'none'
        if (!mounted) return
        setStatus(s)
        setReason(res.data?.reason || '')
      } catch {
        // ignore if endpoint not ready
      }
    }
    fetchStatus()
    return () => { mounted = false }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!fullName || !idNumber || !frontFile || !selfieFile) {
      setMessage('Vui lòng điền đủ thông tin bắt buộc và tải lên ảnh mặt trước + ảnh selfie.')
      return
    }
    const formData = new FormData()
    formData.append('idType', idType)
    formData.append('fullName', fullName)
    formData.append('idNumber', idNumber)
    if (issueDate) formData.append('issueDate', issueDate)
    if (expiryDate) formData.append('expiryDate', expiryDate)
    if (address) formData.append('address', address)
    if (frontFile) formData.append('frontImage', frontFile)
    if (backFile) formData.append('backImage', backFile)
    if (selfieFile) formData.append('selfieImage', selfieFile)

    try {
      setSubmitting(true)
      const res = await api.post('/kyc/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setStatus(res.data?.status || 'pending')
      setMessage(res.data?.message || 'Đã gửi hồ sơ xác minh. Vui lòng chờ admin duyệt.')
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gửi hồ sơ thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent">Xác minh danh tính</span>
          </h1>
          <p className="text-gray-600">Tải lên CCCD/Hộ chiếu và ảnh selfie để bảo vệ tài khoản và tăng hạn mức giao dịch.</p>
        </div>

        {/* Status */}
        {status !== 'none' && (
          <div className={`mb-8 rounded-3xl p-6 border shadow-lg ${
            status === 'approved' ? 'bg-green-50 border-green-200' : status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">Trạng thái hồ sơ: {status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Bị từ chối' : 'Đang chờ duyệt'}</div>
                {reason && <div className="text-sm text-gray-700 mt-1">Lý do: {reason}</div>}
              </div>
              {status === 'rejected' && (
                <span className="px-3 py-2 rounded-xl text-red-700 bg-red-100 border border-red-200 font-semibold">Cần nộp lại</span>
              )}
              {status === 'approved' && (
                <span className="px-3 py-2 rounded-xl text-green-700 bg-green-100 border border-green-200 font-semibold">Đã xác minh</span>
              )}
              {status === 'pending' && (
                <span className="px-3 py-2 rounded-xl text-amber-700 bg-amber-100 border border-amber-200 font-semibold">Đang xử lý</span>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        {(status === 'none' || status === 'rejected') && (
          <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-8 bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-2xl">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loại giấy tờ</label>
                <select value={idType} onChange={e=>setIdType(e.target.value as any)} className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                  <option value="cccd">CCCD/CMND</option>
                  <option value="passport">Hộ chiếu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nhập họ và tên" className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số giấy tờ</label>
                <input value={idNumber} onChange={e=>setIdNumber(e.target.value)} placeholder="Ví dụ: 0792xxxxxxx" className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày cấp</label>
                  <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày hết hạn (nếu có)</label>
                  <input type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)} className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={3} placeholder="Địa chỉ trên giấy tờ" className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"></textarea>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <UploadBox label="Mặt trước (bắt buộc)" file={frontFile} setFile={setFrontFile} previewUrl={frontUrl} />
                <UploadBox label="Mặt sau" file={backFile} setFile={setBackFile} previewUrl={backUrl} />
                <UploadBox label="Selfie (bắt buộc)" file={selfieFile} setFile={setSelfieFile} previewUrl={selfieUrl} />
              </div>
              {message && (
                <div className={`text-sm p-3 rounded-2xl border ${message.toLowerCase().includes('thất bại') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{message}</div>
              )}
              <button disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50">
                {submitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ xác minh'}
              </button>
              <p className="text-xs text-gray-500">Lưu ý: Bằng việc gửi hồ sơ, bạn đồng ý cho phép hệ thống lưu trữ hình ảnh/giấy tờ để phục vụ mục đích xác minh theo Chính sách Bảo mật.</p>
            </div>
          </form>
        )}

        {(status === 'pending' || status === 'approved') && (
          <div className="text-center mt-10 text-gray-700">
            {status === 'pending' && <p>Hồ sơ của bạn đang được đội ngũ kiểm duyệt. Thời gian xử lý trung bình: 1–24 giờ.</p>}
            {status === 'approved' && <p>Chúc mừng! Tài khoản của bạn đã được xác minh. Bạn có thể thuê/cho thuê với hạn mức cao hơn.</p>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

type UploadBoxProps = {
  label: string
  file: File | null
  previewUrl: string
  setFile: (f: File | null) => void
}

function UploadBox({ label, file, setFile, previewUrl }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    <div className="rounded-2xl border border-blue-200 bg-white/70 backdrop-blur-sm p-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={()=>inputRef.current?.click()}>
      <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border border-blue-100 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-blue-600">Tải ảnh lên</span>
        )}
      </div>
      <div className="mt-2 text-xs font-semibold text-gray-700 text-center">{label}</div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e=>setFile(e.target.files?.[0] || null)} />
    </div>
  )
}


