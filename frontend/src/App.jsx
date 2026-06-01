import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import Customers from './components/Customers'
import Orders from './components/Orders'

const API_BASE = 'https://ethara-backend-9c1h.onrender.com'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  })

  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success'
  })

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type })
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' })
    }, 3500)
  }

  const loadAllData = async () => {
    try {
      const prodRes = await fetch(`${API_BASE}/api/products`)
      const custRes = await fetch(`${API_BASE}/api/customers`)
      const orderRes = await fetch(`${API_BASE}/api/orders`)
      const sumRes = await fetch(`${API_BASE}/api/dashboard/summary`)

      if (prodRes.ok && custRes.ok && orderRes.ok && sumRes.ok) {
        const prodData = await prodRes.json()
        const custData = await custRes.json()
        const orderData = await orderRes.json()
        const sumData = await sumRes.json()

        setProducts(prodData)
        setCustomers(custData)
        setOrders(orderData)
        setSummary(sumData)
      } else {
        triggerAlert('Failed to synchronize initial data with API.', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerAlert('Cannot connect to backend API server.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    loadAllData()
  }, [activeTab])

  // PRODUCTS

  const handleAddProduct = async (productData, callback) => {
    try {
      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Product '${productData.name}' created successfully.`)
        loadAllData()
        if (callback) callback()
      } else {
        triggerAlert(result.detail || 'Failed to create product.', 'error')
      }
    } catch {
      triggerAlert('Network error while creating product.', 'error')
    }
  }

  const handleUpdateProduct = async (id, productData, callback) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Product '${productData.name}' updated successfully.`)
        loadAllData()
        if (callback) callback()
      } else {
        triggerAlert(result.detail || 'Failed to update product.', 'error')
      }
    } catch {
      triggerAlert('Network error while updating product.', 'error')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Product '${result.name}' deleted successfully.`)
        loadAllData()
      } else {
        triggerAlert(result.detail || 'Failed to delete product.', 'error')
      }
    } catch {
      triggerAlert('Network error while deleting product.', 'error')
    }
  }

  // CUSTOMERS

  const handleAddCustomer = async (customerData, callback) => {
    try {
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Customer '${customerData.name}' registered successfully.`)
        loadAllData()
        if (callback) callback()
      } else {
        triggerAlert(result.detail || 'Failed to register customer.', 'error')
      }
    } catch {
      triggerAlert('Network error while registering customer.', 'error')
    }
  }

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await fetch(`${API_BASE}/api/customers/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Customer '${result.name}' removed successfully.`)
        loadAllData()
      } else {
        triggerAlert(result.detail || 'Failed to remove customer.', 'error')
      }
    } catch {
      triggerAlert('Network error while deleting customer.', 'error')
    }
  }

  // ORDERS

  const handleCreateOrder = async (orderData, callback) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Order #${result.id} placed successfully.`)
        loadAllData()
        if (callback) callback()
      } else {
        triggerAlert(result.detail || 'Failed to place order.', 'error')
      }
    } catch {
      triggerAlert('Network error while placing order.', 'error')
    }
  }

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return

    try {
      const response = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        triggerAlert(`Order #${result.id} cancelled.`)
        loadAllData()
      } else {
        triggerAlert(result.detail || 'Failed to cancel order.', 'error')
      }
    } catch {
      triggerAlert('Network error while cancelling order.', 'error')
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            summary={summary}
            loading={loading}
            onNavigate={setActiveTab}
          />
        )

      case 'products':
        return (
          <Products
            products={products}
            onAdd={handleAddProduct}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
            triggerAlert={triggerAlert}
          />
        )

      case 'customers':
        return (
          <Customers
            customers={customers}
            onAdd={handleAddCustomer}
            onDelete={handleDeleteCustomer}
            triggerAlert={triggerAlert}
          />
        )

      case 'orders':
        return (
          <Orders
            orders={orders}
            customers={customers}
            products={products}
            onCreateOrder={handleCreateOrder}
            onDeleteOrder={handleDeleteOrder}
            triggerAlert={triggerAlert}
          />
        )

      default:
        return <div>View not found</div>
    }
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} alert={alert}>
      {renderTabContent()}
    </Layout>
  )
}