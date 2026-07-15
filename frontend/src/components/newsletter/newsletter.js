import React, { useState } from 'react'
import './newsletter.css'

const NewsLetter = () => {

  const [subscribers, setsubscribers] = useState({
    user: localStorage.getItem('user-name'),
    email: "",
  })

  const changehandler = (e) => {
    setsubscribers({ ...subscribers, [e.target.name]: e.target.value })
  }

  const subscribe = async () => {
    console.log("Subscribe operation executes ", subscribers);
    let response;
    await fetch('http://13.233.124.185:5000/subscribe', {
      method: 'POST',
      headers: {
        Accept: 'application/form-data',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(subscribers),
    })
      .then((resp) => resp.json())
      .then((data) => response = data)
    if (response.success) {
      response ? alert("Subscribe Added Successfully") : alert("Unable to Added Subscribe")
    }
    else {
      alert(response.errors);
    }
  }

  const remove = async (email)=>{

   let response = await fetch('http://13.233.124.185:5000/unsub',{
      method:'POST',
      headers:{
        Accept:'application/json',
        'Content-Type':'application/json'
      },
      body:JSON.stringify({email:email})
    })

    if(response){
      alert('Email Unsubscribe Successfully')
    }
    else{
      alert('Email Not Found Give Me Proper Email')
    }
  }

  return (
    <div className='newsletter'>
      <h1>GET EXCLUSIVE OFFERS ON YOUR EMAIL</h1>
      <p>Subscribe to our newsletter and stay updated</p>
      <div>
        <input name='email' onChange={changehandler} type="email" value={subscribers.email} placeholder='Your Email Id' />
        <button onClick={subscribe} className='subscribe'>Subscribe</button>
        <button onClick={()=>{remove(subscribers.email)}} className='unsubscribe'>Unsubscribe</button>
      </div>
    </div>
  )
}

export default NewsLetter
