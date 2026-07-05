import React from 'react'
import './Item.css';
import { Link } from 'react-router-dom';

const Item = (props) => {
  return (
    <div className='item'>
      <div className="item-inner">
        <Link to={`/product/${props.id}`} onClick={() => window.scrollTo(0,0)}>
          <img src={props.image} alt={props.name || 'product'} />
        </Link>
        <p>{props.name}</p>
        <div className="item-price">
          <div className="item-price-new">₹{props.new_price}</div>
          <div className="item-price-old">₹{props.old_price}</div>
        </div>
      </div>
    </div>
  )
}

export default Item
