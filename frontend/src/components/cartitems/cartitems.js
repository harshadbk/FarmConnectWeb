import React, { useContext } from 'react';
import './cartitems.css';
import { shopContext } from '../../context/shopcontext';
import remove_icon from '../Assets/remove.jpg';
import { Link } from 'react-router-dom';

const Cartitems = () => {
    const { allProduct, cartItem, removeFromCart } = useContext(shopContext);

    const calculateSubtotal = () => {
        let subtotal = 0;
        if (Array.isArray(allProduct) && cartItem) {
            allProduct.forEach(product => {
                const quantity = cartItem[product.id] || 0;
                if (quantity > 0) {
                    subtotal += quantity * product.new_price;
                }
            });
        }
        return subtotal;
    };

    return (
        <div className='cartitems'>
            <div className="cartitems-format-main">
                <p>Products</p>
                <p>Title</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total</p>
                <p>Remove</p>
            </div>
            <hr />
            {Array.isArray(allProduct) && allProduct.map((product) => {
                const quantity = cartItem[product.id] || 0;
                if (quantity > 0) {
                    return (
                        <div key={product.id}>
                            <div className="cartitems-format">
                                <img src={product.image} alt={product.name} className='carticon-product-icon' />
                                <p>{product.name}</p>
                                <p>₹{product.new_price}</p>
                                <button className='cartitems-quantity'>{quantity}</button>
                                <p>₹{quantity * product.new_price}</p>
                                <img
                                    src={remove_icon}
                                    onClick={() => removeFromCart(product.id)}
                                    alt="Remove"
                                    className="cartitems-remove-icon"
                                />
                            </div>
                        </div>
                    );
                }
                return null;
            })}
            <br />
            <br />
            <br />
            <div className="cartitems-down">
                <div className="cartitems-total">
                    <h1>Cart Totals</h1>
                    <div>
                        <div className="cartitems-total-item">
                            <p>SubTotal</p>
                            <p>${calculateSubtotal()}</p>
                        </div>
                        <hr />
                        <div className="cartitems-total-item">
                            <p>Shipping Fee</p>
                            <p>Free</p>
                        </div>
                        <hr />
                        <div className="cartitems-total-item">
                            <h3>Total</h3>
                            <h3>${calculateSubtotal()}</h3>
                        </div>
                    </div>
                   <Link to={'/checkout'}><button>PROCEED TO CHECKOUT</button></Link>
                </div>
            </div>
        </div>
    );
};

export default Cartitems;
