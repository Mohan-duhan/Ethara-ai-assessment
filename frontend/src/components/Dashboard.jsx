import React from 'react'
import { Package, Users, ShoppingCart, AlertTriangle, ArrowUpRight } from 'lucide-react'

export default function Dashboard({ summary, loading, onNavigate }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner">Loading Dashboard Summary...</div>
      </div>
    )
  }

  const { total_products = 0, total_customers = 0, total_orders = 0, low_stock_products = [] } = summary || {}

  return (
    <div>
      <div className="kpi-grid">
        {/* Total Products KPI */}
        <div className="glass-card kpi-card" onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-label">Total Products</span>
            <span className="kpi-value">{total_products}</span>
          </div>
          <div className="kpi-icon-wrapper cyan-glow">
            <Package size={24} />
          </div>
        </div>

        {/* Total Customers KPI */}
        <div className="glass-card kpi-card" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-label">Total Customers</span>
            <span className="kpi-value">{total_customers}</span>
          </div>
          <div className="kpi-icon-wrapper purple-glow">
            <Users size={24} />
          </div>
        </div>

        {/* Total Orders KPI */}
        <div className="glass-card kpi-card" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-value">{total_orders}</span>
          </div>
          <div className="kpi-icon-wrapper green-glow">
            <ShoppingCart size={24} />
          </div>
        </div>

        {/* Low Stock Counter KPI */}
        <div className="glass-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Low Stock items</span>
            <span className="kpi-value" style={{ color: low_stock_products.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {low_stock_products.length}
            </span>
          </div>
          <div className={`kpi-icon-wrapper ${low_stock_products.length > 0 ? 'red-glow' : 'green-glow'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Low Stock Alert Table Section */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} className={low_stock_products.length > 0 ? 'text-accent-red' : ''} style={{ color: low_stock_products.length > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Critical Inventory Alerts</h3>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>Stock threshold &lt; 5</span>
        </div>

        {low_stock_products.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            All products are sufficiently stocked. Excellent!
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products.map(product => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                    <td><code style={{ color: 'var(--accent-cyan)' }}>{product.sku}</code></td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td style={{ fontWeight: '600', color: product.quantity_in_stock === 0 ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
                      {product.quantity_in_stock}
                    </td>
                    <td>
                      <span className={`badge ${product.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {product.quantity_in_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => onNavigate('products')}
                        id={`refill-btn-${product.id}`}
                      >
                        Refill Stock <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
