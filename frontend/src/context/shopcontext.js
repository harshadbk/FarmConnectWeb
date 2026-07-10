import React, { createContext, useEffect, useState } from "react";

export const shopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index < 301; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [allProduct, setAllProduct] = useState([]);
  const [cartItem, setCartItem] = useState(getDefaultCart());

  useEffect(() => {
    fetch('http://13.233.124.185/allproducts')
      .then((resp) => {
        if (!resp.ok) {
          throw new Error('Network response was not ok');
        }
        return resp.json();
      })
      .then((data) => {
        // Normalize product objects to match frontend expectations.
        // Ensure each product has a numeric `id`, a full `image` URL, and numeric prices.
        const normalized = (Array.isArray(data) ? data : []).map((p, idx) => {
          const id = p.id !== undefined && p.id !== null ? Number(p.id) : idx + 1;
          const image = p.image
            ? String(p.image).startsWith('http')
              ? p.image
              : `http://13.233.124.185/${String(p.image).replace(/^\/+/, '')}`
            : '';
          const new_price = p.new_price !== undefined ? Number(p.new_price) : p.newPrice !== undefined ? Number(p.newPrice) : null;
          const old_price = p.old_price !== undefined ? Number(p.old_price) : p.oldPrice !== undefined ? Number(p.oldPrice) : null;

          return {
            ...p,
            id,
            image,
            new_price,
            old_price,
          };
        });

        setAllProduct(normalized);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
      });

    if (localStorage.getItem('auth-token')) {
      fetch('http://13.233.124.185/getcart', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'auth-token': `${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
        body: "",
      })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error('Network response was not ok');
        }
        return resp.json();
      })
      .then((data) => setCartItem(data))
      .catch((error) => {
        console.error('Fetch error:', error);
      });
    }
  }, []);

  const addToCart = (itemId) => {
    setCartItem((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    if (localStorage.getItem('auth-token')) {
      fetch('http://13.233.124.185/addtocart', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'auth-token': localStorage.getItem('auth-token'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error('Network response was not ok');
          }
          return resp.text().then(text => {
            try {
              return JSON.parse(text);
            } catch (error) {
              return text;
            }
          });
        })
        .then((data) => console.log(data))
        .catch((error) => {
          console.error('Fetch error:', error);
        });
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setCartItem((prev) => ({
        ...prev,
        [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : 0,
      }));
      const authToken = localStorage.getItem('auth-token');
      if (!authToken) {
        console.error('No authentication token found.');
        return;
      }
      const response = await fetch('http://13.233.124.185/removefromcart', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'auth-token': authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = text;
      }
      console.log('Cart updated:', data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };
  

  const clearCart = () => {
    setCartItem(getDefaultCart());
  };

  const getTotalCartItem = () => {
    let totalItem = 0;
    for (const item in cartItem) {
      if (cartItem[item] > 0) {
        totalItem += cartItem[item];
      }
    }
    return totalItem;
  };

  const contextValue = {
    getTotalCartItem,
    allProduct,
    cartItem,
    addToCart,
    removeFromCart,
    clearCart,
  };

  return (
    <shopContext.Provider value={contextValue}>
      {props.children}
    </shopContext.Provider>
  );
};

export default ShopContextProvider;
