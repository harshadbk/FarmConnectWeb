import React, { useContext, useState, useEffect, useMemo } from 'react';
import './shopcategory.css';
import { shopContext } from '../context/shopcontext';
import Item from '../components/item/Item';
import drop_down from '../components/Assets/dd.jpg';

const ShopCategory = (props) => {
  const { allProduct } = useContext(shopContext);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('relevance');

  const displayedProducts = useMemo(() => {
    let list = Array.isArray(categoryProducts) ? [...categoryProducts] : [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    if (sortOption === 'price-asc') list.sort((a, b) => (a.new_price || 0) - (b.new_price || 0));
    if (sortOption === 'price-desc') list.sort((a, b) => (b.new_price || 0) - (a.new_price || 0));
    if (sortOption === 'newest') list.sort((a, b) => (b.createdAt ? new Date(b.createdAt) - new Date(a.createdAt) : 0));
    return list;
  }, [categoryProducts, searchQuery, sortOption]);

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
          const filtered = allProduct.filter((item) =>
            String(item.category || '').trim().toLowerCase() === String(props.category || '').trim().toLowerCase()
          );
          if (filtered.length > 0) {
            setCategoryProducts(filtered);
          } else {
            const fuzzyFiltered = allProduct.filter((item) =>
              String(item.category || '').trim().toLowerCase().includes(String(props.category || '').trim().toLowerCase())
            );
            setCategoryProducts(fuzzyFiltered);
          }
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
          <span>Showing {displayedProducts.length > 0 ? 1 : 0}-{displayedProducts.length > 12 ? 12 : displayedProducts.length} </span>
          Out of {productCount} products
        </p>
        <div className="shopcategory-controls">
          <input
            type="search"
            placeholder="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shopcategory-search"
            aria-label="Search products"
          />
          <select className="shopcategory-sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
      <div className="shopcategory-products">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((item, i) => (
            <Item
              key={item.id || i}
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
