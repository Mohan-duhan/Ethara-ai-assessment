import React from 'react'
import { LayoutDashboard, Package, Users, ShoppingCart } from 'lucide-react'

export default function Layout({ activeTab, setActiveTab, alert, children }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ]

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">E</div>
          <span className="logo-text">Ethara AI</span>
        </div>

        <nav>
          <ul className="nav-links">
            {menuItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <li key={item.id} className="nav-item">
                  <a 
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    id={`nav-link-${item.id}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">
            {menuItems.find(item => item.id === activeTab)?.label} Management
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            System Status: <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>● Online</span>
          </div>
        </header>

        {children}
      </main>

      {/* Toast alert overlay */}
      {alert.show && (
        <div className={`alert-toast ${alert.type}`} id="global-alert-toast">
          <span>{alert.message}</span>
        </div>
      )}
    </div>
  )
}
