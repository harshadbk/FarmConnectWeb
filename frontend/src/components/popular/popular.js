import React, { useEffect, useState } from 'react';
import './popular.css';
import Item from '../item/Item';

const Popular = () => {
   
  const [popular,setpapular] = useState([]);

  useEffect(()=>{
   fetch('http://13.233.124.185/popularinonion')
   .then((resp)=>resp.json())
   .then((data)=>setpapular(data));
  },[])

  return (
    <div className='popular'>
      <h1>YOUR POPULAR PRODUCTS</h1>
      <hr/>
      <div className="popular-item">
        {popular.map((item, i) => {
          return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price}/>
        }).slice(0,5)}
      </div>
    </div>
  );
}

export default Popular;
