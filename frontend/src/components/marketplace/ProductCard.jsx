import React from 'react';
import './productcard.css';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="pcard">
      <Link to={`/product/${product.id}`} onClick={() => window.scrollTo(0,0)}>
        <div className="pcard-image">
          <img src={product.image} alt={product.name} />
        </div>
      </Link>
      <div className="pcard-body">
        <h3 className="pcard-title">{product.name}</h3>
        <div className="pcard-meta">
          <div className="pcard-farmer">{product.farmer || 'Farmer'}</div>
          <div className="pcard-rating">⭐ {product.rating || 4.5}</div>
        </div>
        <div className="pcard-location">{product.location || 'Local'}</div>
        <div className="pcard-price">
          <span className="pcard-new">₹{product.new_price}</span>
          {product.old_price && <span className="pcard-old">₹{product.old_price}</span>}
        </div>
        <div className="pcard-actions">
          <button className="btn btn-primary">Add to Cart</button>
          <button className="btn btn-ghost">Buy Now</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
