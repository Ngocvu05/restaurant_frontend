import React from 'react';
import { useCart } from '../context/CartContext';

const CartPage: React.FC = () => {
  const { 
    cart, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    isLoading 
  } = useCart();

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2>Giỏ hàng ({totalItems} món)</h2>
      {cart.length === 0 ? (
        <div className="text-center py-5">
          <i className="fa fa-shopping-cart fa-3x text-muted mb-3"></i>
          <p className="text-muted">Giỏ hàng trống.</p>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <img 
                src={item.image} 
                alt={item.name} 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  objectFit: 'cover',
                  borderRadius: '8px' 
                }} 
              />
              <div className="flex-grow-1 ms-3">
                <h5 className="mb-1">{item.name}</h5>
                <p className="mb-0 text-muted">
                  {item.price.toLocaleString()}₫ x {item.quantity}
                </p>
                <p className="mb-0 fw-bold text-primary">
                  {(item.price * item.quantity).toLocaleString()}₫
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={isLoading || item.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value);
                      if (!isNaN(newQuantity) && newQuantity > 0) {
                        updateQuantity(item.id, newQuantity);
                      }
                    }}
                    className="form-control text-center mx-2"
                    style={{ width: '60px' }}
                    disabled={isLoading}
                  />
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={isLoading}
                  >
                    +
                  </button>
                </div>
                <button 
                  className="btn btn-danger btn-sm ms-2" 
                  onClick={() => removeFromCart(item.id)}
                  disabled={isLoading}
                >
                  <i className="fa fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
          
          <div className="row mt-4">
            <div className="col-md-6">
              <button 
                className="btn btn-outline-secondary" 
                onClick={clearCart}
                disabled={isLoading}
              >
                <i className="fa fa-trash me-2"></i>
                Xóa tất cả
              </button>
            </div>
            <div className="col-md-6 text-end">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Tổng cộng</h5>
                  <p className="card-text">
                    <span className="text-muted">Số món: </span>
                    <span className="fw-bold">{totalItems}</span>
                  </p>
                  <p className="card-text">
                    <span className="text-muted">Tổng tiền: </span>
                    <span className="h4 text-primary fw-bold">
                      {totalPrice.toLocaleString()}₫
                    </span>
                  </p>
                  <button 
                    className="btn btn-primary btn-lg w-100"
                    disabled={isLoading}
                  >
                    <i className="fa fa-credit-card me-2"></i>
                    Tiến hành đặt hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;