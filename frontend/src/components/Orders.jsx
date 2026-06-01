import React, { useState } from 'react'
import { Plus, Trash2, Eye, X, PlusCircle, MinusCircle } from 'lucide-react'

export default function Orders({ orders, customers, products, onCreateOrder, onDeleteOrder, triggerAlert }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Order Form State
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])

  const handleOpenCreate = () => {
    if (customers.length === 0) {
      triggerAlert('Please add a customer first before creating an order.', 'error')
      return
    }
    if (products.length === 0) {
      triggerAlert('Please add a product first before creating an order.', 'error')
      return
    }
    setCustomerId(customers[0].id.toString())
    setItems([{ product_id: products[0].id.toString(), quantity: 1 }])
    setShowCreateModal(true)
  }

  const handleAddItemRow = () => {
    // Add row initialized with the first available product
    if (products.length > 0) {
      setItems([...items, { product_id: products[0].id.toString(), quantity: 1 }])
    }
  }

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  // Calculate live total price on frontend for visual feedback
  const calculateLiveTotal = () => {
    let total = 0
    for (const item of items) {
      const prod = products.find(p => p.id.toString() === item.product_id)
      if (prod) {
        total += Number(prod.price) * (parseInt(item.quantity) || 0)
      }
    }
    return total
  }

  const handleOpenDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleSubmitOrder = (e) => {
    e.preventDefault()

    // Validate customer
    if (!customerId) {
      triggerAlert('Please select a customer.', 'error')
      return
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.product_id) {
        triggerAlert(`Please select a product for line ${i + 1}.`, 'error')
        return
      }
      
      const qtyNum = parseInt(item.quantity)
      if (isNaN(qtyNum) || qtyNum <= 0) {
        triggerAlert(`Line ${i + 1}: Quantity must be greater than 0.`, 'error')
        return
      }

      // Check stock limit on client side
      const product = products.find(p => p.id.toString() === item.product_id)
      if (product && product.quantity_in_stock < qtyNum) {
        triggerAlert(
          `Line ${i + 1}: Insufficient stock for ${product.name}. Available: ${product.quantity_in_stock}.`, 
          'error'
        )
        return
      }
    }

    // De-duplicate product selections by grouping quantities
    const groupedItems = {}
    items.forEach(item => {
      const pId = parseInt(item.product_id)
      const qty = parseInt(item.quantity)
      if (groupedItems[pId]) {
        groupedItems[pId] += qty
      } else {
        groupedItems[pId] = qty
      }
    })

    // Recheck stock for consolidated list
    for (const [pId, qty] of Object.entries(groupedItems)) {
      const product = products.find(p => p.id === parseInt(pId))
      if (product && product.quantity_in_stock < qty) {
        triggerAlert(
          `Insufficient stock for ${product.name}. Consolidated Quantity: ${qty}, In Stock: ${product.quantity_in_stock}.`, 
          'error'
        )
        return
      }
    }

    const payload = {
      customer_id: parseInt(customerId),
      items: Object.keys(groupedItems).map(pId => ({
        product_id: parseInt(pId),
        quantity: groupedItems[pId]
      }))
    }

    onCreateOrder(payload, () => setShowCreateModal(false))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={handleOpenCreate} id="create-order-btn">
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="glass-card">
        {orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders found. Click "New Order" to place one.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Items Count</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><span style={{ color: 'var(--text-secondary)' }}>#</span>{order.id}</td>
                    <td style={{ fontWeight: '500' }}>{order.customer?.name || 'Unknown'}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td>{order.items?.length || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-small" 
                          onClick={() => handleOpenDetails(order)}
                          id={`view-order-${order.id}`}
                          title="View Order Details"
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => onDeleteOrder(order.id)}
                          id={`delete-order-${order.id}`}
                          title="Cancel/Delete Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Wizard Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content modal-large">
            <div className="modal-header">
              <h3 className="modal-title">Create New Order</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder}>
              <div className="form-group">
                <label className="form-label" htmlFor="order-cust">Select Customer *</label>
                <select 
                  id="order-cust" 
                  className="form-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="order-items-section">
                <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Order Items</h4>
                
                {items.map((item, index) => {
                  const selectedProductObj = products.find(p => p.id.toString() === item.product_id)
                  const maxQty = selectedProductObj ? selectedProductObj.quantity_in_stock : 0

                  return (
                    <div className="order-item-row" key={index}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Product Name *</label>
                        <select 
                          className="form-select"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          required
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ${Number(p.price).toFixed(2)} ({p.quantity_in_stock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Quantity *</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="1" 
                          max={maxQty}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                        />
                      </div>

                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        style={{ padding: '0.75rem', height: '42px', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleAddItemRow}
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                >
                  <PlusCircle size={16} /> Add Item Row
                </button>
              </div>

              <div className="order-summary-box">
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Estimated Grand Total</span>
                  <span className="order-summary-total">${calculateLiveTotal().toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Backend will recalculate final amounts.<br/>Stock quantities are verified instantly.
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="save-order-submit">
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details View Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="glass-card modal-content modal-large">
            <div className="modal-header">
              <h3 className="modal-title">Order Details #{selectedOrder.id}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.5rem' }}>Customer Profile</h4>
                <p style={{ fontWeight: '600', fontSize: '1.05rem' }}>{selectedOrder.customer?.name}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedOrder.customer?.email}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedOrder.customer?.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.5rem' }}>Order Details</h4>
                <p style={{ fontSize: '0.9rem' }}><span style={{ color: 'var(--text-secondary)' }}>Fulfillment Time:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                <p style={{ fontSize: '0.9rem' }}><span style={{ color: 'var(--text-secondary)' }}>Fulfillment Method:</span> Instant Database Commit</p>
              </div>
            </div>

            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' }}>Items List</h4>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price Charged</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '500' }}>{item.product?.name || 'Deleted Product'}</td>
                      <td><code style={{ color: 'var(--accent-cyan)' }}>{item.product?.sku || 'N/A'}</code></td>
                      <td>${Number(item.price_at_order).toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        ${(Number(item.price_at_order) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(255,255,255,0.01)', borderTop: '2px solid var(--border-color)' }}>
                    <td colSpan="4" style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Grand Total</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
                      ${Number(selectedOrder.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
