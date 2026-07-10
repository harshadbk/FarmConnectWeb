import React, { useContext, useState, useEffect } from 'react';
import './productdisplay.css';
import star_image from '../Assets/star.jpg';
import star_dull from '../Assets/stard.jpg';
import { shopContext } from '../../context/shopcontext';
import { redirect } from 'react-router-dom';

const ProductDisplay = ({ product }) => {

  const [shopkeeperDetails, setShopkeeperDetails] = useState({
    show: false,
    data: null,
  });

  const { addToCart } = useContext(shopContext);

  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const voicesArray = window.speechSynthesis.getVoices();
    setVoices(voicesArray);

    if (!voicesArray.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
    }
  }, []);

  const handleOnClick = () => {
    const descriptionText = product.description
      ? product.description
      : "उर्वरक कोई भी प्राकृतिक या सिंथेटिक सामग्री है जो मिट्टी या पौधे पर लागू की जाती है।";

    const chunks = descriptionText.match(/.{1,1000}/g);

    const speakChunk = (index) => {
      if (index < chunks.length) {
        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = 'hi-IN';

        const hindiVoice = voices.find(voice => voice.lang === 'hi-IN' && voice.name.toLowerCase().includes('female')) 
                        || voices.find(voice => voice.lang === 'hi-IN'); 

        if (hindiVoice) {
          utterance.voice = hindiVoice;
        } else {
          console.warn("Hindi voice not available, using default voice.");
        }

        utterance.onend = () => speakChunk(index + 1); 
        window.speechSynthesis.speak(utterance);
      }
    };

    speakChunk(0);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  const toggleShopkeeperDetails = async () => {
    if (shopkeeperDetails.show) {
      setShopkeeperDetails(prev => ({ ...prev, show: false }));
      return;
    }

    try {
      const response = await fetch('http://13.233.124.185/shopkeeperdatas', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: product.email, id: product.id })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shopkeeper details.');
      }

      const data = await response.json();
      setShopkeeperDetails({ show: true, data });

    } catch (error) {
      console.error("Error fetching shopkeeper details:", error);
      alert("Could not load shopkeeper details. Please try again later.");
    }
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className='productdisplay'>
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          {Array(4).fill(<img src={product.image} alt={product.name} />)}
        </div>
        <div className="productdisplay-image">
          <img className='productdisplay-main-img' src={product.image} alt={product.name} />
        </div>
      </div>
      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <div className="productdisplay-right-star">
          {Array(4).fill(<img src={star_image} alt="star" />)}
          <img src={star_dull} alt="star dull" />
          <p>(122)</p> <br /> <br />
          <h1 className='productdisplay-right-category'><span>Product Id : </span>{product.id || "Latest"}</h1>
        </div>
        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">₹{product.old_price}</div>
          <div className="productdisplay-right-price-new">₹{product.new_price}</div>
          <div className="productdisplay-right-description">
            {product.description 
              ? product.description.slice(0, 120)
              :  "उर्वरक कोई भी प्राकृतिक या सिंथेटिक सामग्री है जो मिट्टी या पौधे पर लागू की जाती है।"
            }
          </div>
          <div className="productdisplay-right-size">
            <h1>Available Size</h1>
            <div>{product.size}</div>
          </div>
          <button onClick={() => addToCart(product.id)}>ADD TO CART</button>
          <p className='productdisplay-right-category'><span>Category :</span> {product.category}</p>
          <p className='productdisplay-right-category'><span>Tags :</span>{product.tags || "Latest"}</p>
        </div>
        <h1 className='productdisplay-right-category'><span>Crop Name : </span>{product.crop_type ? product.crop_type : "NA" }</h1>
        <div className="productdisplay-right-shopkeeper">
          <button onClick={toggleShopkeeperDetails}>
            {shopkeeperDetails.show ? "Hide Shopkeeper Details" : "Show Shopkeeper Details"}
          </button>
          {shopkeeperDetails.show && shopkeeperDetails.data && (
            <div className="shopkeeper-details">
              <table>
                <tbody>
                  <tr>
                    <th>Shopkeeper Email</th>
                    <td>{shopkeeperDetails.data.email || "abc"}</td>
                  </tr>
                  <tr>
                    <th>Shopkeeper Address</th>
                    <td>{shopkeeperDetails.data.ownaddress || "Xyz"}</td>
                  </tr>
                  <tr>
                    <th>Shop Address</th>
                    <td>{shopkeeperDetails.data.shaddress || "Lmn"}</td>
                  </tr>
                  <tr>
                    <th>Phone No</th>
                    <td>{shopkeeperDetails.data.phoneno || 123}</td>
                  </tr>
                  <tr>
                    <th>Shop Name</th>
                    <td>{shopkeeperDetails.data.shname || "nop"}</td>
                  </tr>
                  <tr>
                    <th>Shop Type</th>
                    <td>{shopkeeperDetails.data.shtype || "Pesticides"}</td>
                  </tr>
                  <tr>
                    <th>Operating Hours</th>
                    <td>{shopkeeperDetails.data.ophours || "7am To 9pm"}</td>
                  </tr>
                  <tr>
                    <th>Payment Methods</th>
                    <td>{shopkeeperDetails.data.payment || "Cash"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <button className='buttonstyle' onClick={handleOnClick}>Listen Product Description</button>
          <br />
          <button className='buttonstyle' onClick={stopSpeaking}>Stop Playing</button>
        </div>
        <div>
          <button className='buttonstyleai' onClick={()=>{window.location.replace("/ai")}}>Talk With AI</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplay;
