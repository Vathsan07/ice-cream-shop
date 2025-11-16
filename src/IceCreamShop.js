import React, { useState } from 'react';

const products = [
  { id: 'choc', name: 'Chocolate Ice Cream', desc: 'Rich chocolate made with cocoa.', sizes: [{ label: '200ml', price: 60 }, { label: '500ml', price: 120 }], emoji: '🍫' },
  { id: 'straw', name: 'Strawberry Ice Cream', desc: 'Fresh strawberry swirls.', sizes: [{ label: '200ml', price: 60 }, { label: '500ml', price: 120 }], emoji: '🍓' },
  { id: 'van', name: 'Vanilla Ice Cream', desc: 'Classic vanilla bean.', sizes: [{ label: '200ml', price: 60 }, { label: '500ml', price: 120 }], emoji: '🍨' },
];

export default function IceCreamShop() {
  const [cart, setCart] = useState({}); // key: "prodId-sizeIndex" -> qty
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const addToCart = (productId, sizeIndex) => {
    const key = `${productId}-${sizeIndex}`;
    setCart(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const removeFromCart = (productId, sizeIndex) => {
    const key = `${productId}-${sizeIndex}`;
    setCart(prev => {
      const qty = prev[key] || 0;
      if (qty <= 1) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: qty - 1 };
    });
  };

  const subtotal = Object.entries(cart).reduce((sum, [key, qty]) => {
    const [productId, sizeIndex] = key.split('-');
    const prod = products.find(p => p.id === productId);
    const size = prod?.sizes[Number(sizeIndex)];
    return sum + (size?.price || 0) * qty;
  }, 0);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const genOrderId = () => 'ORD-' + Date.now().toString(36).toUpperCase().slice(0,8);

  const buildPayload = (orderId) => {
    const items = Object.entries(cart).map(([key, qty]) => {
      const [productId, sizeIndex] = key.split('-');
      const prod = products.find(p => p.id === productId);
      const size = prod?.sizes[Number(sizeIndex)];
      return { id: productId, name: prod?.name, size: size?.label, unitPrice: size?.price || 0, qty, lineTotal: (size?.price || 0) * qty };
    });
    return { orderId, createdAt: new Date().toISOString(), customer: form, items, subtotal };
  };

  const openCheckout = () => {
    if (subtotal === 0) return alert('Cart is empty.');
    setShowCheckout(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address) return alert('Complete all fields.');
    const orderId = genOrderId();
    const payload = buildPayload(orderId);
    setProcessing(true);
    try {
      const res = await fetch('http://localhost:5001/api/submitOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Server error ' + res.status);
      const data = await res.json();
      setOrderResult({ ok: true, orderId, response: data });
      setCart({});
      setForm({ name: '', email: '', phone: '', address: '' });
      setShowCheckout(false);
      alert(`Order placed — ${orderId}`);
    } catch (err) {
      console.error('place order error', err);
      setOrderResult({ ok: false, error: err.message });
      alert('Failed to place order. See console.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="icecream-shop">
      <div>
        <header className="shop-header">
          <div style={{ fontSize: 28 }}>🍦</div>
          <div>
            <h1>Shri's Ice Cream House</h1>
            <div className="shop-sub">Premium Ice Creams Delivered Fresh</div>
          </div>
        </header>

        <h2 className="center">Our Menu</h2>

        <div className="product-grid">
          {products.map(p => (
            <article className="product-card" key={p.id}>
              <div className="product-image">{p.emoji}</div>
              <h3 className="product-title">{p.name}</h3>
              <p className="product-desc">{p.desc}</p>

              <div className="qty-controls" style={{ marginTop: 8 }}>
                {p.sizes.map((s, i) => {
                  const key = `${p.id}-${i}`;
                  const qty = cart[key] || 0;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => addToCart(p.id, i)}>
                        {s.label} - Rs.{s.price}
                      </button>
                      <div className="qty-display">
                        <div style={{ fontWeight: 700 }}>{qty}</div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                          <button type="button" onClick={() => addToCart(p.id, i)} style={{ fontSize: 12 }}>＋</button>
                          <button type="button" onClick={() => removeFromCart(p.id, i)} style={{ fontSize: 12 }}>－</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="order-panel">
        <h3>Your Order</h3>
        <p className="small text-muted">Select items to add to cart</p>

        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {Object.keys(cart).length === 0 && <p className="small text-muted">Cart is empty</p>}
          {Object.entries(cart).map(([key, qty]) => {
            const [productId, sizeIndex] = key.split('-');
            const prod = products.find(p => p.id === productId);
            const size = prod?.sizes[Number(sizeIndex)];
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{prod?.name} <span style={{ fontWeight: 400, fontSize: 12 }}>({size?.label})</span></div>
                  <div className="small text-muted">Rs.{size?.price} × {qty}</div>
                </div>
                <div style={{ fontWeight: 700 }}>Rs.{(size?.price || 0) * qty}</div>
              </div>
            );
          })}
        </div>

        <div className="totals" style={{ marginTop: 12 }}>
          <span>Subtotal</span>
          <strong>Rs.{subtotal}</strong>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={subtotal === 0} onClick={openCheckout}>
          Checkout
        </button>

        {orderResult && orderResult.ok && (
          <div className="order-success" style={{ marginTop: 12 }}>
            <div>Order placed — <strong>{orderResult.orderId}</strong></div>
            <div className="small text-muted">We attempted to send a confirmation email.</div>
          </div>
        )}
      </aside>

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={handlePlaceOrder} style={{ width: 420, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 12px 36px rgba(15,23,42,0.18)' }}>
            <h3 style={{ marginTop: 0 }}>Place Order</h3>

            <div className="form-field">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCheckout(false)} disabled={processing}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={processing}>{processing ? 'Placing...' : 'Place Order'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}