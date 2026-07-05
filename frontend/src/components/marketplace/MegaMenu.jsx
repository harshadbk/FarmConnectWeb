import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './marketplace.css';
import { Link } from 'react-router-dom';

const MegaMenu = ({ closeMenu }) => {
  const columns = [
    {
      title: 'Seeds',
      route: '/products/seeds',
      items: ['Vegetable Seeds','Fruit Seeds','Flower Seeds','Grain Seeds','Hybrid Seeds']
    },
    {
      title: 'Fertilizers',
      route: '/products/fertilizers',
      items: ['Organic Fertilizers','Chemical Fertilizers','Bio Fertilizers','Liquid Fertilizers']
    },
    {
      title: 'Pesticides',
      route: '/products/pesticides',
      items: ['Insecticides','Fungicides','Herbicides','Organic Pesticides']
    },
    {
      title: 'Farm Equipment',
      route: '/products/equipment',
      items: ['Tractors','Sprayers','Irrigation Equipment','Power Tillers','Harvesters']
    },
    {
      title: 'Irrigation',
      route: '/products/irrigation',
      items: ['Drip Irrigation','Sprinklers','Pipes','Water Pumps']
    },
    {
      title: 'Animal Husbandry',
      route: '/products/animal-husbandry',
      items: ['Cattle Feed','Poultry Feed','Dairy Equipment','Veterinary Products']
    },
  ];

  const secondary = [
    { title: 'Crops', route: '/products/crops', items: ['Wheat','Rice','Sugarcane','Cotton','Onion','Tomato'] },
    { title: 'Organic Products', route: '/products/organic', items: ['Organic Fruits','Organic Vegetables','Organic Grains'] },
    { title: 'Gardening', route: '/products/gardening', items: ['Pots','Garden Tools','Soil Mix','Plants'] },
  ];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeMenu]);

  const content = (
    <div className="mega-menu show" onMouseLeave={closeMenu} onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-inner">
        <div className="mega-columns">
          {columns.map((col) => (
            <div className="mega-column" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.items.map((it) => (
                  <li key={it}><Link to={`${col.route}`} onClick={closeMenu}>{it}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mega-secondary">
          {secondary.map((sec) => (
            <div className="mega-column" key={sec.title}>
              <h4>{sec.title}</h4>
              <ul>
                {sec.items.map((it) => (
                  <li key={it}><Link to={`${sec.route}`} onClick={closeMenu}>{it}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default MegaMenu;
