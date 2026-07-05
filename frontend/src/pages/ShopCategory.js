import React, { useContext, useState, useEffect } from 'react';
import './shopcategory.css';
import { shopContext } from '../context/shopcontext';
import Item from '../components/item/Item';
import drop_down from '../components/Assets/dd.jpg';

const ShopCategory = (props) => {
  const { allProduct } = useContext(shopContext);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch products for this category
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/product/category/${props.category}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCategoryProducts(data);
        setError(null);
      } catch (err) {
        console.error(`Error fetching products for category ${props.category}:`, err);
        // Fallback to client-side filtering if backend fails
        if (allProduct && allProduct.length > 0) {
          const filtered = allProduct.filter(item => props.category === item.category);
          setCategoryProducts(filtered);
        }
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [props.category, allProduct]);

  if (loading) {
    return <div className='shopcategory'>Loading products...</div>;
  }

  if (error) {
    return <div className='shopcategory'>Error loading products. Please try again.</div>;
  }

  const productCount = categoryProducts.length;

  return (
    <div className='shopcategory'>
      <img className='shopcategory-banner' src={props.banner} alt="" />
      <div className="shopcategory-indexSort">
        <p>
          <span>Showing 1-{Math.min(12, productCount)} </span> Out of {productCount} products
        </p>
        <div className="shopcategory-sort">
          sort by <img src={drop_down} alt="" />
        </div>
      </div>
      <div className="shopcategory-products">
        {categoryProducts.length > 0 ? (
          categoryProducts.map((item, i) => (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))
        ) : (
          <div className="no-products">
            <p>No products found in {props.category} category</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopCategory;
