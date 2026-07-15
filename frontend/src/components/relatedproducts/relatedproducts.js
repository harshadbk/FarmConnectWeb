import React, { useEffect, useState, useContext } from 'react';
import './relatedproducts.css';
import Item from '../item/Item';
import { shopContext } from '../../context/shopcontext';


const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const RelatedProducts = () => {
  const [products, setProducts] = useState([]);
  const { allProduct } = useContext(shopContext);

  useEffect(() => {
    if (allProduct && allProduct.length > 0) {
      setProducts(shuffleArray(allProduct).slice(0, 7));
      return;
    }

    // fallback: fetch directly if context not populated
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch('http://13.233.124.185:5000/allproducts');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(shuffleArray(data).slice(0, 7));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchRelatedProducts();
  }, [allProduct]);

  return (
    <div className='relatedproducts'>
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {products.map((item, i) => (
          <Item
            key={item.id ?? item._id ?? i}
            id={item.id ?? item._id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
