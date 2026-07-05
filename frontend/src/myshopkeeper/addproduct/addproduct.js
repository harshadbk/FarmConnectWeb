import React, { useState } from 'react';
import './addproduct.css';
import uploadFile from '../../components/Assets/image_plus.jpg';

const categorySubcategoryMap = {
  Cane: ['Sugarcane', 'Molasses', 'Cane Juice Supplies', 'Cane Seedlings'],
  Seeds: ['Vegetable Seeds', 'Fruit Seeds', 'Flower Seeds', 'Grain Seeds', 'Hybrid Seeds'],
  Fertilizers: ['Organic Fertilizers', 'Chemical Fertilizers', 'Bio Fertilizers', 'Liquid Fertilizers'],
  Pesticides: ['Insecticides', 'Fungicides', 'Herbicides', 'Organic Pesticides'],
  'Farm Equipment': ['Tractors', 'Sprayers', 'Irrigation Equipment', 'Power Tillers', 'Harvesters'],
  Irrigation: ['Drip Irrigation', 'Sprinklers', 'Pipes', 'Water Pumps'],
  'Animal Husbandry': ['Cattle Feed', 'Poultry Feed', 'Dairy Equipment', 'Veterinary Products'],
  Crops: ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Onion', 'Tomato'],
  'Organic Products': ['Organic Fruits', 'Organic Vegetables', 'Organic Grains'],
  Gardening: ['Pots', 'Garden Tools', 'Soil Mix', 'Plants'],
  Herbicides: ['Atrazine', 'Glyphosate', 'Paraquat', 'Pendimethalin']
};

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [productDetails, setProductDetails] = useState({
    email: localStorage.getItem('user-email') || localStorage.getItem('user-name'),
    name: "",
    size:"",
    tags:"",
    description:"",
    crop_type: "",
    category: "Cane",
    subcategory: categorySubcategoryMap.Cane[0],
    brand: "",
    unit: "kg",
    stock: 0,
    optionsText: "",
    new_price: "",
    old_price: ""
  });

  const imageHandler = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setSuccessMessage('');
    setProductDetails((prev) => {
      if (name === 'category') {
        return {
          ...prev,
          category: value,
          subcategory: categorySubcategoryMap[value]?.[0] || '',
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const addProduct = async () => {
    console.log(productDetails);
    let product = { ...productDetails };
    let formData = new FormData();
    formData.append('product', image);

    let responseData;

    await fetch('http://127.0.0.1:5000/upload', {
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
      const parseOptionsText = (text) => {
        if (!text) return {};
        return text
          .split(/\r?\n|,/) 
          .map((row) => row.trim())
          .filter(Boolean)
          .reduce((acc, row) => {
            const [key, ...rest] = row.split(':');
            const value = rest.join(':').trim();
            if (!key || !value) return acc;
            acc[key.trim()] = value;
            return acc;
          }, {});
      };

      product.image = responseData.image_url;
      product.subcategory = productDetails.subcategory || '';
      product.options = parseOptionsText(productDetails.optionsText);

      console.log(product);
      await fetch('http://127.0.0.1:5000/addproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.success) {
          alert("Product Added");
          setSuccessMessage('Product has been added successfully. Form cleared.');
          setProductDetails({
            email: localStorage.getItem('user-email') || localStorage.getItem('user-name'),
            name: "",
            size: "",
            tags: "",
            description: "",
            crop_type: "",
            category: "Cane",
            subcategory: categorySubcategoryMap.Cane[0],
            brand: "",
            unit: "kg",
            stock: 0,
            optionsText: "",
            new_price: "",
            old_price: ""
          });
          setImage(null);
        } else {
          alert("Failed to add product");
        }
      });
    } else {
      console.error('Image upload failed:', responseData ? responseData.error : 'No response data');
    }
  };

  return (
    <div className='addproduct'>
      <div className="addproduct-price">
      <h1 className='heading'>Enter The Product Details</h1>
        {successMessage && <div className="addproduct-success">{successMessage}</div>}
        <div className="addproduct-itemfield">
          <p>Product title</p>
          <input value={productDetails.name} onChange={changeHandler} type="text" name='name' placeholder='Type Here' />
        </div>
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input value={productDetails.old_price} onChange={changeHandler} type="text" name='old_price' placeholder='Type Here' />
          <p>Offer Price</p>
          <input value={productDetails.new_price} onChange={changeHandler} type="text" name='new_price' placeholder='Type Here' />
        </div>
        <div className="addproduct-itemfield">
          <p>Product Category</p>
          <select value={productDetails.category} onChange={changeHandler} name="category" className='add-product-selector'>
            {Object.keys(categorySubcategoryMap).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Others">Others</option>
            <option value="Stationary">Stationary</option>
          </select>
        </div>
        <div className='addproduct-itemfield'>
          <p>Product Subcategory</p>
          <select value={productDetails.subcategory} onChange={changeHandler} name='subcategory' className='add-product-selector'>
            {(categorySubcategoryMap[productDetails.category] || ['General']).map((subcat) => (
              <option key={subcat} value={subcat}>{subcat}</option>
            ))}
          </select>
        </div>
        <div className='addproduct-itemfield'>
          <p>Crop Name</p>
          <input value={productDetails.crop_type} onChange={changeHandler} type="text" name='crop_type' placeholder='Type Here'/>
        </div>
        <div className="addproduct-itemfield">
          <p>Available Size</p>
          <input type="text" value={productDetails.size} onChange={changeHandler} name='size' placeholder='Enter Products Size' />
        </div>
        <div className="addproduct-itemfield">
          <p>Brand</p>
          <input type="text" value={productDetails.brand} onChange={changeHandler} name='brand' placeholder='Brand (optional)' />
        </div>
        <div className="addproduct-itemfield">
          <p>Stock Quantity</p>
          <input type="number" value={productDetails.stock} onChange={changeHandler} name='stock' placeholder='0' />
        </div>
        <div className="addproduct-itemfield">
          <p>Unit</p>
          <input type="text" value={productDetails.unit} onChange={changeHandler} name='unit' placeholder='kg / L / Pack' />
        </div>
        <div className="addproduct-itemfield">
          <p>Tags</p>
          <input type="text" value={productDetails.tags} onChange={changeHandler} name='tags' placeholder='Enter Tags'/>
        </div>
        <div className="addproduct-itemfield">
          <p>Product Options</p>
          <textarea value={productDetails.optionsText} onChange={changeHandler} name='optionsText' placeholder='Enter options as key:value pairs, comma or line separated' />
        </div>
        <div className="addproduct-itemfield">
          <p>Enter Full Product Description</p>
          <textarea type="text" value={productDetails.description} onChange={changeHandler} name='description' placeholder='Enter Description For it' />
        </div>
        <div className="addproduct-itemfield">
          <p>Add Image</p>
          <label htmlFor="file-input">
            <img src={image ? URL.createObjectURL(image) : uploadFile} className='addproduct-thumbnail-img' alt="Product Thumbnail" />
          </label>
          <input onChange={imageHandler} type="file" name='image' id='file-input' hidden />
        </div>
        <button onClick={addProduct} className='addproduct-btn'>Add</button>
      </div>
    </div>
  );
}

export default AddProduct;
