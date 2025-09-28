import { Link } from 'react-router-dom'

type ProductCardProps = {
  id: string
  title: string
  price: number
  imageUrl?: string
  brand?: string
  location?: string
  soldCount?: number
  rating?: number
  isNewProduct?: boolean
  isHotProduct?: boolean
  discount?: number
  index?: number
}

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
)

export default function ProductCard(props: ProductCardProps) {
  const {
    id,
    title,
    price,
    imageUrl,
    brand,
    location,
    soldCount,
    rating = 4.8,
    isNewProduct,
    isHotProduct,
    discount,
    index = 0,
  } = props

  return (
    <Link to={`/products/${id}`} className={`group relative snap-start bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform overflow-hidden border border-gray-100`} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {isNewProduct && (
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">✨ Mới</span>
        )}
        {isHotProduct && (
          <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">🔥 Hot</span>
        )}
        {discount && discount > 0 && (
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">💥 -{discount}%</span>
        )}
      </div>

      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
        {imageUrl ? (
          <img loading="lazy" src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1 text-lg">{title}</h3>
          {brand && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-2 font-medium">{brand}</span>
          )}
        </div>

        {location && (
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {location}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{price.toLocaleString()} ₫/ngày</div>
            {soldCount && soldCount > 0 && (
              <div className="text-sm text-gray-500">Đã thuê {soldCount} lần</div>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <StarIcon key={star} filled={star <= Math.round(Math.min(5, Math.max(0, rating))) } />
              ))}
            </div>
            <span className="ml-2 font-semibold">{rating}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}


