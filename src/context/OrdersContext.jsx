import React, { createContext, useContext, useState, useEffect } from 'react';

const OrdersContext = createContext();

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

export const OrdersProvider = ({ children }) => {
  // ✅ Initialize from localStorage or default to 'pending'
  const [orderType, setOrderTypeState] = useState(() => {
    const saved = localStorage.getItem('orderType');
    return saved || 'pending';
  });

  // ✅ Sync to localStorage whenever orderType changes
  useEffect(() => {
    localStorage.setItem('orderType', orderType);
  }, [orderType]);

  // ✅ Custom setter that also updates localStorage
  const setOrderType = (type) => {
    setOrderTypeState(type);
    localStorage.setItem('orderType', type);
  };

  // ✅ Clear order type (optional utility)
  const clearOrderType = () => {
    setOrderTypeState('pending');
    localStorage.removeItem('orderType');
  };

  const value = {
    orderType,
    setOrderType,
    clearOrderType,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};
