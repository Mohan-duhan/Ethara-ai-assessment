import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react'

export default function Products({ products, onAdd, onUpdate, onDelete, triggerAlert }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  // Form fields
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setSku('')
    setName('')
    setPrice('')
    setQuantity('0')
    setShowModal(true)
  }

  const handleOpenEdit = (product) => {
    setEditingProduct(product)
    setSku(product.sku)
    setName(product.name)
    setPrice(product.price.toString())
    setQuantity(product.quantity_in_stock.toString())
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!sku.trim() || !name.trim() || !price || !quantity) {
      triggerAlert('All fields are required.', 'error')
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerAlert('Price must be a positive number.', 'error')
      return
    }

    const qtyNum = parseInt(quantity)
    if (isNaN(qtyNum) || qtyNum < 0) {
      triggerAlert('Quantity in stock cannot be negative.', 'error')
      return
    }

    const productPayload = {
      sku: sku.trim(),
      name: name.trim(),
      price: priceNum,
      quantity_in_stock: qtyNum
    }

    if (editingProduct) {
      onUpdate(editingProduct.id, productPayload, () => setShowModal(false))
    } else {
      onAdd(productPayload, () => setShowModal(false))
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by SKU or name..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="product-search-input"
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} id="add-product-btn">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="glass-card">
        {filteredProducts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No products found. Click "Add Product" to create one.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Quantity in Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td><code style={{ color: 'var(--accent-cyan)' }}>{product.sku}</code></td>
                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>{product.quantity_in_stock}</td>
                    <td>
                      {product.quantity_in_stock === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : product.quantity_in_stock < 5 ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-small" 
                          onClick={() => handleOpenEdit(product)}
                          id={`edit-prod-${product.id}`}
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => onDelete(product.id)}
                          id={`delete-prod-${product.id}`}
                          title="Delete Product"
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'Edit Product Details' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="prod-sku">SKU Code *</label>
                <input 
                  type="text" 
                  id="prod-sku" 
                  className="form-input" 
                  placeholder="e.g. PROD-100" 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={!!editingProduct} // SKU cannot be modified after creation typically
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-name">Product Name *</label>
                <input 
                  type="text" 
                  id="prod-name" 
                  className="form-input" 
                  placeholder="e.g. Wireless Headset" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-price">Unit Price ($) *</label>
                <input 
                  type="number" 
                  id="prod-price" 
                  step="0.01" 
                  min="0.01"
                  className="form-input" 
                  placeholder="e.g. 59.99" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-qty">Stock Quantity *</label>
                <input 
                  type="number" 
                  id="prod-qty" 
                  min="0"
                  className="form-input" 
                  placeholder="e.g. 100" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="save-product-submit">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
