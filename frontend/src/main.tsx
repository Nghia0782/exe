import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './pages/App'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import OAuthCallback from './pages/OAuthCallback'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Checkout from './pages/Checkout'
import Dashboard from './pages/Dashboard'
import UserDashboard from './pages/UserDashboard'
import AdminUnits from './pages/AdminUnits'
import AdminProducts from './pages/AdminProducts'
import About from './pages/About'
import SellerProducts from './pages/SellerProducts'
import UserProvider from './shared/UserContext'
import ToastProvider from './shared/ToastContext'
import VerifyIdentity from './pages/VerifyIdentity'
import AdminKyc from './pages/AdminKyc'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminDeposits from './pages/admin/AdminDeposits'
import AdminOverview from './pages/admin/AdminOverview'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Chatbot from './components/Chatbot'

// Global console de-duplication to avoid repeated noisy logs in UI
;(function setupConsoleDedup() {
  const originalLog = console.log.bind(console)
  const originalDebug = console.debug ? console.debug.bind(console) : originalLog
  const cache = new Map<string, number>()
  const WINDOW_MS = 2000 // suppress duplicate messages within 2s

  function wrap(method: (...args: any[]) => void) {
    return (...args: any[]) => {
      try {
        const key = JSON.stringify(args, (_k, v) => (typeof v === 'function' ? '[fn]' : v))
        const now = Date.now()
        const last = cache.get(key) || 0
        if (now - last < WINDOW_MS) return
        cache.set(key, now)
      } catch {
        // if serialization fails, just pass through
      }
      method(...args)
    }
  }

  console.log = wrap(originalLog)
  console.debug = wrap(originalDebug)
})()

export function AppRouter() {
  const router = createBrowserRouter([
    { path: '/', element: <App /> },
    { path: '/products', element: <Products /> },
    { path: '/products/:id', element: <ProductDetail /> },
    { path: '/login', element: <Login /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { 
      path: '/profile', 
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      )
    },
    { path: '/orders', element: <Orders /> },
    { path: '/orders/:id', element: <OrderDetail /> },
    { path: '/checkout', element: <Checkout /> },
    { 
      path: '/dashboard', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <Dashboard />
        </ProtectedRoute>
      )
    },
    { 
      path: '/user-dashboard', 
      element: (
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      )
    },
    { path: '/about', element: <About /> },
    { path: '/seller/products', element: <SellerProducts /> },
    { 
      path: '/verify', 
      element: (
        <ProtectedRoute>
          <VerifyIdentity />
        </ProtectedRoute>
      )
    },
    { 
      path: '/verify-identity', 
      element: (
        <ProtectedRoute>
          <VerifyIdentity />
        </ProtectedRoute>
      )
    },
    { 
      path: '/admin/kyc', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <AdminKyc />
        </ProtectedRoute>
      )
    },
    { 
      path: '/admin', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <AdminOverview />
        </ProtectedRoute>
      )
    },
    { 
      path: '/admin/units', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <AdminUnits />
        </ProtectedRoute>
      )
    },
    { 
      path: '/admin/products', 
      element: (
        <ErrorBoundary>
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminProducts />
          </ProtectedRoute>
        </ErrorBoundary>
      )
    },
    { 
      path: '/admin/users', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      )
    },
    { 
      path: '/admin/orders', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <AdminOrders />
        </ProtectedRoute>
      )
    },
    { 
      path: '/admin/deposits', 
      element: (
        <ProtectedRoute requiredRoles={['admin']}>
          <AdminDeposits />
        </ProtectedRoute>
      )
    },
    { path: '/oauth-callback', element: <OAuthCallback /> },
  ])

  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <UserProvider>
      <AppRouter />
      <Chatbot />
    </UserProvider>
  </ToastProvider>,
)
