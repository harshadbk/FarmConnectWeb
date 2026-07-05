import React, { useContext, useEffect, useRef, useState } from 'react';
import './navbar.css';
import logo from '../Assets/logo.jpg';
import cartIcon from '../Assets/cart_icon.jpg';
import { Link } from 'react-router-dom';
import { shopContext } from '../../context/shopcontext';
import { AuthContext } from '../../context/AuthContext';
import Profile from '../Assets/profile.jpeg';
import MegaMenu from '../marketplace/MegaMenu';

const Navbar = () => {
  const [menu, setMenu] = useState('Shop');
  const [showCategories, setShowCategories] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const categoryMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
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

  const mainLinks = [
    { name: 'Shop', path: '/' },
    { name: 'Products', dropdown: true },
    { name: 'Community', path: '/FCommunity' },
    { name: 'AI Assistant', path: '/ai' },
    { name: 'Feedback', path: '/feedback' },
  ];

  const productItems = [
    { name: 'Fertilizers', path: '/Fertilizers' },
    { name: 'Pesticides', path: '/Pesticides' },
    { name: 'Organic', path: '/Organic' },
    { name: 'Herbicides', path: '/Herbicides' },
    { name: 'Seeds', path: '/seed' },
    { name: 'Others', path: '/others' },
  ];

  const handleCategoriesClick = () => {
    setMenu('Products');
    setShowCategories((prev) => !prev);
  };

  const handleLinkClick = (name) => {
    setMenu(name);
    setShowCategories(false);
  };

  const handleCategorySelect = (name) => {
    setMenu(name);
    setShowCategories(false);
  };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const clickedInMega = event.target && event.target.closest && event.target.closest('.mega-menu');
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target) && !clickedInMega) {
        setShowCategories(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

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
        <p>FARM CONNECT</p>
      </div>

      <ul className='nav-menu'>
        {mainLinks.map((link) => (
          <li
            key={link.name}
            ref={link.dropdown ? categoryMenuRef : null}
            className={link.dropdown ? 'nav-item-dropdown' : ''}
          >
            {link.dropdown ? (
              <button
                type='button'
                className={`nav-link-button ${showCategories ? 'active' : ''}`}
                aria-haspopup='true'
                aria-expanded={showCategories}
                onClick={handleCategoriesClick}
              >
                Products <span className='nav-dropdown-icon'>{showCategories ? '▲' : '▼'}</span>
              </button>
            ) : (
              <Link
                to={link.path}
                className={menu === link.name ? 'active' : ''}
                onClick={() => handleLinkClick(link.name)}
              >
                {link.name}
              </Link>
            )}
            {link.dropdown && showCategories && (
              <MegaMenu closeMenu={() => setShowCategories(false)} />
            )}
          </li>
        ))}
      </ul>

      <div className='nav-login-cart'>
        <div className='translate-wrapper'>
          <span className='translate-label'>Language:</span>
          <div id='google_translate_element' className='translate-widget' aria-label='Language selector' />
        </div>

        <Link to='/cart'>
          <div className='cart-icon-container'>
            <img src={cartIcon} alt='Cart' className='nav-cart-icon' />
            {getTotalCartItem() > 0 && <div className='nav-cart-count'>{getTotalCartItem()}</div>}
          </div>
        </Link>

        {isAuthenticated ? (
          <div className='profile-menu-container' ref={profileMenuRef}>
            <button type='button' className='profile-menu-trigger' onClick={() => setShowProfileMenu((prev) => !prev)}>
              <img src={Profile} alt='Profile' className='profile-img' />
              <span className='profile-name-short'>{userName ? userName.charAt(0).toUpperCase() : 'U'}</span>
            </button>
            {showProfileMenu && (
              <div className='profile-dropdown-menu'>
                <div className='profile-dropdown-header'>
                  <img src={Profile} alt='Profile' />
                  <div>
                    <p className='dropdown-name'>{userName || 'User'}</p>
                    <p className='dropdown-email'>{userEmail || 'user@example.com'}</p>
                  </div>
                </div>

                <div className='profile-dropdown-body'>
                  <div className='dropdown-item-group'>
                    <Link to='/profile' onClick={() => setShowProfileMenu(false)}>
                      <div className='dropdown-item'>👤 My Profile</div>
                    </Link>
                    <Link to='/cart' onClick={() => setShowProfileMenu(false)}>
                      <div className='dropdown-item'>My Cart</div>
                    </Link>
                  </div>

                  {roleLinks.length > 0 && (
                    <>
                      <hr />
                      <div className='dropdown-section-heading'>Quick Actions</div>
                      <div className='dropdown-item-group'>
                        {roleLinks.map((link) => (
                          <Link key={link.path} to={link.path} onClick={() => setShowProfileMenu(false)}>
                            <div className='dropdown-item'>• {link.name}</div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <hr />
                <button type='button' className='dropdown-item logout-item' onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to='/loginsignup'>
            <button className='nav-button nav-login-btn'>Login / Sign Up</button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
