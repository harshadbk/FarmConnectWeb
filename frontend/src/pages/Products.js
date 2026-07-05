import React from 'react';
import './shopcategory.css';
import ProductCard from '../components/marketplace/ProductCard';
import products from '../data/dummyProducts';

const Products = () => {
  return (
    <div className='shopcategory'>
      <div style={{width:'100%', maxWidth:1200}}>
        <h2 style={{margin:'12px 0'}}>Marketplace</h2>
      </div>
      <div className="shopcategory-indexSort" style={{maxWidth:1200}}>
        <p>Find the best agricultural products from local farmers</p>
        <div className="shopcategory-controls">
          <input type="search" placeholder="Search products" className="shopcategory-search" />
          <select className="shopcategory-sort-select"><option>Relevance</option></select>
        </div>
      </div>

      <div className="shopcategory-products" style={{maxWidth:1200}}>
        {products.map((p) => (
          <div className="item-card" key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
