import React, { useState } from 'react';
import './addproduct.css';
import uploadFile from '../../components/Assets/image_plus.jpg';

const Addproduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    email: localStorage.getItem('user-name'),
    name: '',
    description: '',
    quantity: '',
    price: '',
    quality: '',
    packagetype: '',
    harverstD: new Date().toISOString().split('T')[0],
    expireD: new Date().toISOString().split('T')[0],
    fertilizersused: '',
    location: '',
    timeframe: '',
    status:false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductDetails({ ...productDetails, [name]: value });
  };

  const imageHandler = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  const handleSubmit = async () => {
    console.log(productDetails);
    let product = productDetails;
    const formData = new FormData();
    formData.append('product', image);

    let responseData;

    await fetch('http://13.233.124.185:5000/upload', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    })
      .then((resp) => resp.json())
      .then((data) => {
        responseData = data;
      });

    if (responseData && responseData.success) {
      product.image = responseData.image_url;
      console.log(product);
      await fetch('http://13.233.124.185:5000/addfproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })
        .then((resp) => resp.json())
        .then((data) => {
          console.log(data);
          data.success ? alert("Product Added") : alert("Failed");
        });
    } else {
      console.error('Image upload failed:', responseData ? responseData.error : 'No response data');
    }

  };

  return (
    <div className='faddproducts'>
      <div className="addfproduct-price">
        <h1 className="heading">Add Products Information</h1>

        <form>
          <div className="addfproduct-itemfield">
            <label>Product Title</label>
            <input
              value={productDetails.name}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter The Product Name"
              name="name"
              required
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Short Description</label>
            <textarea
              value={productDetails.description}
              onChange={handleInputChange}
              placeholder="Add Product Description"
              name="description"
              required
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Quantity or Weight Of Product (e.g. 100kg)</label>
            <input
              value={productDetails.quantity}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter Product Quantity/Weight (e.g. 50kg)"
              name="quantity"
              required
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Expected Price (Per Unit/Per Weight)</label>
            <input
              value={productDetails.price}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter Price (e.g. Rs.1000 per 50kg)"
              name="price"
              required
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Grade/Quality</label>
            <input
              value={productDetails.quality}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter Product Grade (e.g. A-Grade)"
              name="quality"
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Packaging Type</label>
            <input
              value={productDetails.packagetype}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter Packaging Type (e.g. Sealed eco-friendly bags)"
              name="packagetype"
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Harvest/Production Date</label>
            <input
              value={productDetails.harverstD}
              onChange={handleInputChange}
              type="date"
              name="harverstD"
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Expiration Date (if applicable)</label>
            <input
              value={productDetails.expireD}
              onChange={handleInputChange}
              type="date"
              name="expireD"
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Fertilizers/Pesticides Used</label>
            <input
              value={productDetails.fertilizersused}
              onChange={handleInputChange}
              type="text"
              placeholder="Describe Fertilizers or Pesticides Used"
              name="fertilizersused"
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Farm Location</label>
            <input
              value={productDetails.location}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter Farm Location (e.g. Nashik, Jalgaon, Pune)"
              name="location"
            />
          </div>

          <div className="addfproduct-itemfield">
            <label>Delivery Timeframe</label>
            <input
              value={productDetails.timeframe}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter Delivery Time (e.g. 7 days after order)"
              name="timeframe"
            />
          </div>
          <label>Add Images</label>
          <div className="addproduct-itemfield">
            <label htmlFor="file-input">
              <img src={image ? URL.createObjectURL(image) : uploadFile} className='addproduct-thumbnail-img' alt="Product Thumbnail" />
            </label>
            <input onChange={imageHandler} type="file" name='image' id='file-input' hidden />
            <label htmlFor="file-input">
              <img src={image ? URL.createObjectURL(image) : uploadFile} className='addproduct-thumbnail-img' alt="Product Thumbnail" />
            </label>
            <input onChange={imageHandler} type="file" name='image' id='file-input' hidden />
            <label htmlFor="file-input">
              <img src={image ? URL.createObjectURL(image) : uploadFile} className='addproduct-thumbnail-img' alt="Product Thumbnail" />
            </label>
            <input onChange={imageHandler} type="file" name='image' id='file-input' hidden />
            <label htmlFor="file-input">
              <img src={image ? URL.createObjectURL(image) : uploadFile} className='addproduct-thumbnail-img' alt="Product Thumbnail" />
            </label>
            <input onChange={imageHandler} type="file" name='image' id='file-input' hidden />
          </div>
          <div className="addfproduct-itemfield">
            <button onClick={handleSubmit} type="button" className='addproduct-btn'>Submit Product</button>
          </div>
        </form >
      </div >
    </div >
  );
};

export default Addproduct;
