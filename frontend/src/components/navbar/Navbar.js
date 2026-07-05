import React, { useContext, useState } from 'react';
import './navbar.css';
import logo from '../Assets/logo.jpg';
import cartIcon from '../Assets/cart_icon.jpg';
import { Link } from 'react-router-dom';
import { shopContext } from '../../context/shopcontext';
import { AuthContext } from '../../context/AuthContext';
import Profile from '../Assets/profile.jpeg';

const Navbar = () => {
  const [menu, setMenu] = useState('Shop');
  const [showCategories, setShowCategories] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { getTotalCartItem } = useContext(shopContext);
  const { user } = useContext(AuthContext);

  const isAuthenticated = !!localStorage.getItem('auth-token');
  const userName = localStorage.getItem('user-name');
  const userEmail = localStorage.getItem('user-email');
  const role = localStorage.getItem('role');
  const normalizedRole = role?.trim() || '';

  const roleLinks = {
    Farmer: [
      { name: 'Add Product', path: '/faddproduct' },
      { name: 'Add Work', path: '/addwork' },
      { name: 'Remote Merchants', path: '/rmerchants' },
      { name: 'Remote Shopkeepers', path: '/rshopkeeper' },
      { name: 'Remote Workers', path: '/rworkers' },
      { name: 'Community', path: '/FCommunity' },
      { name: 'AI Assistant', path: '/ai' },
      { name: 'Add Feedback', path: '/feedback' },
      { name: 'Pending Work', path: '/pendingo' },
      { name: 'Completed Work', path: '/completeo' },
      { name: 'My Earnings', path: '/earning' },
      { name: 'Investments', path: '/myinvest' },
    ],
    Shopkeeper: [
      { name: 'Add Product', path: '/addproduct' },
      { name: 'List Products', path: '/shopkeeper' },
      { name: 'Pending Orders', path: '/pending' },
      { name: 'Complete Orders', path: '/complete' },
      { name: 'Remote Farmers', path: '/rfarmers' },
      { name: 'Community', path: '/FCommunity' },
    ],
    Merchant: [
      { name: 'Buy Product', path: '/' },
      { name: 'Farmers Near Me', path: '/rfarmers' },
      { name: 'Community', path: '/FCommunity' },
    ],
  }[normalizedRole] || [];

  const handleCategoriesClick = () => {
    setMenu('Categories');
    setShowCategories((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-name');
    localStorage.removeItem('user-email');
    localStorage.removeItem('role');
    localStorage.removeItem('address');
    setShowProfileMenu(false);
    window.location.replace('/');
  };

  return (
    <header className='navbar'>
      <div className='nav-logo'>
        <img src={logo} alt='Logo' />
        <p>VISHWA_AGRO</p>
      </div>

      <ul className='nav-menu'>
        <li onClick={() => setMenu('Shop')}>
          <Link to='/'>Shop</Link>
          {menu === 'Shop' && <hr />}
        </li>
        <li onClick={handleCategoriesClick}>
          <span className='nav-link-button'>Products</span>
          {menu === 'Categories' && <hr />}
          {showCategories && (
            <ul className='dropdown'>
              <li onClick={() => setMenu('Fertilizers')}>
                <Link to='/Fertilizers'>Fertilizers</Link>
              </li>
              <li onClick={() => setMenu('Pesticides')}>
                <Link to='/Pesticides'>Pesticides</Link>
              </li>
              <li onClick={() => setMenu('Organic')}>
                <Link to='/Organic'>Organic</Link>
              </li>
              <li onClick={() => setMenu('Herbicides')}>
                <Link to='/Herbicides'>Herbicides</Link>
              </li>
              <li onClick={() => setMenu('Seeds')}>
                <Link to='/seed'>Seeds</Link>
              </li>
              <li onClick={() => setMenu('Others')}>
                <Link to='/others'>Others</Link>
              </li>
            </ul>
          )}
        </li>
        <li onClick={() => setMenu('Offers')}>
          <Link to='/Offers'>Offers</Link>
          {menu === 'Offers' && <hr />}
        </li>
        <li onClick={() => setMenu('Community')}>
          <Link to='/FCommunity'>Community</Link>
          {menu === 'Community' && <hr />}
        </li>
        <li onClick={() => setMenu('AI')}>
          <Link to='/ai'>AI Assistant</Link>
          {menu === 'AI' && <hr />}
        </li>
        <li onClick={() => setMenu('About')}>
          <Link to='/About'>Contact</Link>
          {menu === 'About' && <hr />}
        </li>
      </ul>

      <div className='nav-login-cart'>
        <Link to='/cart'>
          <div className='cart-icon-container'>
            <img src={cartIcon} alt='Cart' className='nav-cart-icon' />
            {getTotalCartItem() > 0 && <div className='nav-cart-count'>{getTotalCartItem()}</div>}
          </div>
        </Link>

        {isAuthenticated ? (
          <div className='profile-menu-container'>
            <div className='profile-menu-trigger' onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <img src={Profile} alt='Profile' className='profile-img' />
              <span className='profile-name-short'>{userName ? userName.charAt(0).toUpperCase() : 'U'}</span>
            </div>
            {showProfileMenu && (
              <div className='profile-dropdown-menu'>
                <div className='profile-dropdown-header'>
                  <img src={Profile} alt='Profile' />
                  <div>
                    <p className='dropdown-name'>{userName || 'User'}</p>
                    <p className='dropdown-email'>{userEmail || 'user@example.com'}</p>
                  </div>
                </div>
                <hr />
                <Link to='/profile' onClick={() => setShowProfileMenu(false)}>
                  <div className='dropdown-item'>👤 My Profile</div>
                </Link>
                <div className='dropdown-item' onClick={handleLogout}>
                  🚪 Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to='/loginsignup'>
            <button className='nav-button nav-login-btn'>Login / Sign Up</button>
          </Link>
        )}
      </div>

      {isAuthenticated && roleLinks.length > 0 && (
        <div className='secondary-nav'>
          {roleLinks.map((link) => (
            <Link key={link.path} to={link.path} className='secondary-nav-link'>
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
