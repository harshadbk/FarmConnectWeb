import React, { useEffect, useState } from 'react'
import './NewCollections.css'
import Item from '../item/Item';

const NewCollections = () => {

  const [new_collections,set_new_collections] = useState([]);

  useEffect(()=>{
   fetch('http://13.233.124.185/newcollection')
   .then((resp)=>resp.json())
   .then((data)=>set_new_collections(data));
  },[])

  return (
    <div className='new-collections'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
       {new_collections.map((item,i)=>{
        return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price}/>
       })}
      </div>
    </div>
  )
}

export default NewCollections
