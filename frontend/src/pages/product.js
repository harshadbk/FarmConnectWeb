import React, { useContext } from 'react';
import { shopContext } from '../context/shopcontext';
import { useParams } from 'react-router-dom';
import Breadcrums from '../components/breadcrums/breadcrums';
import Productdisplay from '../components/productdisplay/productdisplay';
import Descriptionbox from '../components/descriptionbox/descriptionbox';
import Relatedproducts from '../components/relatedproducts/relatedproducts';

const Product = () => {
  const { allProduct } = useContext(shopContext);
  const { productId } = useParams();

  if (!allProduct) {
    return <div>Loading...</div>;
  }

  const product = allProduct.find((e) => {
    // support numeric `id` and MongoDB `_id` string
    if (e.id !== undefined && !isNaN(Number(productId))) {
      return Number(e.id) === Number(productId);
    }
    return e._id === productId || String(e.id) === String(productId);
  });

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <Breadcrums product={product} />
      <Productdisplay product={product} />
      <Descriptionbox product={product} />
      <Relatedproducts category={product.category} />
    </div>
  );
};

export default Product;
