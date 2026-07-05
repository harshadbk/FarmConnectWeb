import React, { useEffect, useState } from 'react'
import remove_icon from '../../components/Assets/remove.jpg'
import './listproduct.css'

const ListProduct = () => {

  const [allproducts,setallproducts]=useState([]);

  const fetchinfo = async ()=>{
    await fetch('http://127.0.0.1:5000/allsproducts',{
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: localStorage.getItem('user-name') })
    })
    .then((resp)=>resp.json())
    .then((data)=>{setallproducts(data)});
  }

  useEffect(()=>{
    fetchinfo();
  },[])

  const remove_product = async (id)=>{
    await fetch('http://127.0.0.1:5000/removeproduct',{
       method:'POST',
       headers:{
        Accept:'application/json',
        'Content-Type':'application/json',
       },
       body:JSON.stringify({id:id})
    })
    await fetchinfo();
  }

  return (
    <div className='listproduct'>
      <h1>All My Products List</h1>
      <br />
      <div className="listproduct-table-wrapper">
        <table className="listproduct-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Title</th>
              <th>Brand</th>
              <th>Old Price</th>
              <th>New Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Options</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {allproducts.map((product, index) => (
              <tr key={index}>
                <td>
                  <img className='listproduct-product-icon' src={product.image} alt="" />
                </td>
                <td>{product.name}</td>
                <td>{product.brand || '-'}</td>
                <td>${product.old_price}</td>
                <td>${product.new_price}</td>
                <td>{product.stock ?? 0} {product.unit || ''}</td>
                <td>{product.category}</td>
                <td>{product.subcategory || '-'}</td>
                <td>{product.options && typeof product.options === 'object' ? Object.entries(product.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '-'}</td>
                <td>
                  <img 
                    onClick={() => remove_product(product.id)} 
                    className='listproduct-remove-icon' 
                    src={remove_icon} 
                    alt="Remove" 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default ListProduct
