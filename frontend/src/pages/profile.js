import React, { useState, useEffect } from 'react';
import './profile.css';
import ProfileImg from '../components/Assets/myprof.jpeg';
import { Link } from 'react-router-dom';

const Profile = () => {

    const role = localStorage.getItem('role');
    const [menu, setMenu] = useState("Shop");
    const menuItems = [
        { role: 'Farmer', items: [{name:'Pending orders',path:'/pendingo'},{name:'Complete orders',path:'/completeo'},{name:'Pending Products',path:'/pendingp'},{name:'Selled Products',path:'/completep'},{name:'Your Earning',path:'/earning'}] },
        { role: 'Admin', items: [{ name: 'Deliveries', path: '/' }, { name: 'Pickup Points', path: '/' }] },
        { role: 'Worker', items: [{ name: 'Works Near Me', path: '/' }, { name: 'Works History', path: '/' }] },
        { role: 'Shopkeeper',items:[{name:'Add Product',path:'/addproduct'},{name:'List Product',path:'/shopkeeper'},{name:'Pending Orders',path:'/Pending'},{name:'Complete Orders',path:'/complete'},{name:'Your Earning',path:'/'},{name:'Delivery Boys',path:'/'},{name:'Remote Farmers',path:'/rfarmers'},{name:'Products Availability',path:'/'},{name:'Community',path:'/'},{name:'Farmers Feedback',path:'/'}]},
      ];

    const roleItems = menuItems.find(item => item.role === role)?.items || [];


    const [data, setData] = useState(null);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

    const fetchData = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/peruser', {
                headers: {
                    'auth-token': localStorage.getItem('auth-token')
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setData(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // for farmers profile information

    const [profile, setprofile] = useState(null);
    const [info, setInfo] = useState({
        email: localStorage.getItem('user-name'),
        address: "",
        phone: 0,
        area: "",
        farm_type: "",
        soil_type: "",
        crop_grown: "",
        fertilizers: "",
    });

    const handleSaveClick = async () => {
        console.log(info);
        try {
            const response = await fetch('http://127.0.0.1:5000/farmerd', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(info),
            });
            const data = await response.json();
            data.success ? alert("Profile Added Successfully !!!") : alert("Profile Addition Failed");
            localStorage.setItem('address', info.address);
        }
        catch (error) {
            console.error("Error adding Profile:", error);
        }
    };

    const changeHandler = (e) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
    };

    const fetchFarmer = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/perfarmer', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: localStorage.getItem('user-name') })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setprofile(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        fetchFarmer();
    }, []);

    // for shopkeeper profile information

    const [shProfile, setShProfile] = useState(null);
    const [shinfo, setshinfo] = useState({
        email: localStorage.getItem('user-name'),
        ownaddress: "",
        shaddress: "",
        phoneno: 0,
        shname: "",
        shtype: "",
        ophours: "",
        payment: ""
    })

    const handleShSaveClick = async () => {
        console.log(shinfo);
        try {
            const response = await fetch('http://127.0.0.1:5000/shopkeeperd', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shinfo),
            });
            const data = await response.json();
            data.success ? alert("Profile Added Successfully !!!") : alert("Profile Addition Failed");
            localStorage.setItem('address', shinfo.shaddress);
        }
        catch (error) {
            console.error("Error adding Profile:", error);
            alert("An error occurred while adding the user");
        }
    };

    const shopChangeHandler = (e) => {
        setshinfo({ ...shinfo, [e.target.name]: e.target.value });
    };

    const fetShop = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/pershop', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: localStorage.getItem('user-name') })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setShProfile(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        fetShop();
    }, []);

    // for merchant profile information 

    const [mrProfile, setmrProfile] = useState(null);
    const [mrinfo , setmrinfo] = useState({
            email: localStorage.getItem('user-name'),
            address: "",
            phone: 0,
            business:"",
            area:"",
            payment: "",
            goods: "",
    });

    const handlemrsaveclick =async ()=>{
        try{
            const response = await fetch('http://127.0.0.1:5000/merchantd',{
                method:'POST',
                headers:{
                    Accept:'application/json',
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(mrinfo),
            });
            const data = await response.json();
            data.success ? alert("profile added successfully !!!!") : alert("Profile Addition Failed");
            localStorage.setItem('address',mrinfo.address);
        }
        catch(error){
            console.log("Error adding profile:",error);
        }
    };

    const mrchangeHandler = (e) => {
        setmrinfo({ ...mrinfo, [e.target.name]: e.target.value });
    };

    const fetchmer = async ()=>{
        try{

            const response = await fetch('http://127.0.0.1:5000/permerchant',{
                method:'POST',
                headers:{
                    'Accept':'application/json',
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({email:localStorage.getItem('user-name')})
            });
              if(!response.ok){
                throw new Error("network response not ok");
              }
              const data = await response.json();
              setmrProfile(data);
        }
        catch(error){
           console.error("error fetching user data:",error)
        }
    };

    useEffect(()=>{
        fetchmer();
    },[])

    // for worker profile information

    const [wprofile, setwprofile] = useState(null);
    const [winfo, setwInfo] = useState({
        email: localStorage.getItem('user-name'),
        address: "",
        phone: 0,
        birth:"",
        time:"",
        skills:"",
        salary:""
    });

    const whandleSaveClick = async () => {
        console.log(winfo);
        try {
            const response = await fetch('http://127.0.0.1:5000/workerd', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(winfo),
            });
            const data = await response.json();
            data.success ? alert("Profile Added Successfully !!!") : alert("Profile Addition Failed");
            localStorage.setItem('address', winfo.address);
        }
        catch (error) {
            console.error("Error adding Profile:", error);
        }
    };

    const wchangeHandler = (e) => {
        setwInfo({ ...winfo, [e.target.name]: e.target.value });
    };

    const fetWorker = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/perworker', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: localStorage.getItem('user-name') })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setwprofile(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        fetWorker();
    }, []);


    const handleCompleteProfileClick = () => {
        setShowAdditionalInfo(true);
    };

    if (!data) {
        return <div>Loading...</div>;
    }

    const renderAdditionalInfo = () => {
        if (role === 'Farmer') {
            return (
                <div className="additional-info">
                    <h2>Complete Your Profile</h2>
                    <div className="profile-row">
                        <label>
                            Your Address With Village:
                            <input type="text" name="address" value={info.address} onChange={changeHandler} />
                        </label>
                        <br />
                        <label>
                            Phone No:
                            <input type="text" name="phone" value={info.phone} onChange={changeHandler} />
                        </label>
                        <br />
                        <label>
                            Total Land Area in Acres :
                            <input type="text" name="area" value={info.area} onChange={changeHandler} />
                        </label>
                        <br />
                        <label>
                            Farm Type (Ex Grapes And Onions):
                            <input type="text" name="farm_type" value={info.farm_type} onChange={changeHandler} />
                        </label>
                        <br />
                        <label>
                            Soil Type Of Your Farm:
                            <input type="text" name="soil_type" value={info.soil_type} onChange={changeHandler} />
                        </label>
                        <br />
                        <label>
                            Currently Crop Grown in Your Farm:
                            <input type="text" name="crop_grown" value={info.crop_grown} onChange={changeHandler} />
                        </label>
                        <br />
                        <label>
                            Fertilizers Usage:
                            <input type="text" name="fertilizers" value={info.fertilizers} onChange={changeHandler} />
                        </label>
                    </div>
                    <button onClick={() => {
                        handleSaveClick();
                        window.location.replace('/profile');
                    }}>
                        Save
                    </button>

                </div>
            );
        } else if (role === 'Merchant') {
            return (
                <div className="additional-info">
                    <h2>Complete Your Profile</h2>
                    <div className="profile-row">
                        <label>
                            Your Complete Address:
                            <input type="text" name="address" value={mrinfo.address} onChange={mrchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Phone No:
                            <input type="text" name="phone" value={mrinfo.phone} onChange={mrchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Business Type (e.g., Wholesaler, Retailer, Distributor):
                            <input type="text" name="business" value={mrinfo.business} onChange={mrchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Geographical Service Area
                            <input type="text" name="area" value={mrinfo.area} onChange={mrchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Payment Methods Accepted(e.g., cash, card,credit):
                            <input type="text" name="payment" value={mrinfo.payment} onChange={mrchangeHandler} />
                        </label>
                        <label>
                            Goods Sold:
                            <input type="text" name="goods" value={mrinfo.goods} onChange={mrchangeHandler} />
                        </label>
                    </div>
                    <button onClick={() => {
                        handlemrsaveclick();
                        window.location.replace('/profile');
                    }}>
                        Save
                    </button>
                </div>
            );
        }
        else if (role === "Worker") {
            return (
                <div className="additional-info">
                    <h2>Complete Your Profile</h2>
                    <div className="profile-row">
                        <label>
                            Your Address:
                            <input type="text" name="address" value={winfo.address} onChange={wchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Phone No:
                            <input type="text" name="phone" value={winfo.phone} onChange={wchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Date Of Birth:
                            <input type="text" name="birth" value={winfo.birth} onChange={wchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Working Time (eg.,11 to 6)
                            <input type="text" name="time" value={winfo.time} onChange={wchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Skills:(e.g,crop planting, harvesting, equipment operation).
                            <input type="text" name="skills" value={winfo.skills} onChange={wchangeHandler} />
                        </label>
                        <br />
                        <label>
                            Expected Hourly Rate/Salary
                            <input type="text" name="salary" value={winfo.salary} onChange={wchangeHandler} />
                        </label>
                    </div>
                    <button onClick={() => {
                        whandleSaveClick();
                        window.location.replace('/profile');
                    }}>
                        Save
                    </button>
                </div>
            );
        }
        else if (role === "Shopkeeper") {
            return (
                <div className="additional-info">
                    <h2>Complete Your Profile</h2>
                    <div className="profile-row">
                        <label>
                            Owner Address:
                            <input type="text" name="ownaddress" value={shinfo.ownaddress} onChange={shopChangeHandler} />
                        </label>
                        <br />
                        <label>
                            Shop Address:
                            <input type="text" name="shaddress" value={shinfo.shaddress} onChange={shopChangeHandler} />
                        </label>
                        <br />
                        <label>
                            Phone No:
                            <input type="text" name="phoneno" value={shinfo.phoneno} onChange={shopChangeHandler} />
                        </label>
                        <br />
                        <label>
                            Shop Name:
                            <input type="text" name="shname" value={shinfo.shname} onChange={shopChangeHandler} />
                        </label>
                        <br />
                        <label>
                            Shop Type (Fertilizers and Pesticides):
                            <input type="text" name="shtype" value={shinfo.shtype} onChange={shopChangeHandler} />
                        </label>
                        <br />
                        <label>
                            Operating Hours(from 10 AM to 8 PM):
                            <input type="text" name="ophours" value={shinfo.ophours} onChange={shopChangeHandler} />
                        </label>
                        <br />
                        <label>
                            Payment Methods Accepted (e.g., cash, card, mobile payments):
                            <input type="text" name="payment" value={shinfo.payment} onChange={shopChangeHandler} />
                        </label>
                    </div>
                    <button onClick={() => {
                        handleShSaveClick();
                        window.location.replace('/profile');
                    }}>
                        Save
                    </button>
                </div>
            );
        }
    };

    return (
        <>
        <div className='profile'>
            <div className="profile-header">
                <h1>My Profile</h1>
                <div className="profile-pic">
                    <img src={ProfileImg} alt="Profile" />
                </div>
                <div className="profile-table">
                    <table>
                        <tbody>
                            <tr>
                                <td>Name:</td>
                                <td>{data.name}</td>
                            </tr>
                            <tr>
                                <td>Email:</td>
                                <td>{data.email}</td>
                            </tr>
                            <tr>
                                <td>Role:</td>
                                <td>{data.role}</td>
                            </tr>
                        </tbody>
                        {localStorage.setItem('role', data.role)}
                    </table>
                </div>

            </div>
            <br />
            {profile || shProfile || mrProfile || wprofile ? (
                role !== 'Admin' && role !== 'Deliveryboy' && (
                    <div className="nav2-detailsbtn">
                        <button className='nav2-profile'>
                            Your Profile
                        </button>
                    </div>
                )
            ) : (
                role !== 'Admin' && role !== 'Deliveryboy' && (
                    <>
                        <div className="nav2-detailsbtn">
                            <button className='nav2-profile' onClick={handleCompleteProfileClick}>
                                Complete Your Profile
                            </button>
                        </div>
                        {showAdditionalInfo && renderAdditionalInfo()}
                    </>
                )
            )
            }
            <div className="profile-add">
                {profile && (
                    <table>
                        <tbody>
                            <tr>
                                <th>Email</th>
                                <td>{profile.email}</td>
                            </tr>
                            <tr>
                                <th>Address</th>
                                <td>{profile.address}</td>
                            </tr>
                            <tr>
                                <th>Phone No</th>
                                <td>{profile.phone}</td>
                            </tr>
                            <tr>
                                <th>Area</th>
                                <td>{profile.area}</td>
                            </tr>
                            <tr>
                                <th>Farm Type</th>
                                <td>{profile.farm_type}</td>
                            </tr>
                            <tr>
                                <th>Soil Type</th>
                                <td>{profile.soil_type}</td>
                            </tr>
                            <tr>
                                <th>Current Crops</th>
                                <td>{profile.crop_grown}</td>
                            </tr>
                            <tr>
                                <th>Repeated Fertilizer Used</th>
                                <td>{profile.fertilizers}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            <div className="profile-add">
                {shProfile && (
                    <table>
                        <tbody>
                            <tr>
                                <th>Your Email</th>
                                <td>{shProfile.email}</td>
                            </tr>
                            <tr>
                                <th>Owner Address</th>
                                <td>{shProfile.ownaddress}</td>
                            </tr>
                            <tr>
                                <th>Shop address</th>
                                <td>{shProfile.shaddress}</td>
                            </tr>
                            <tr>
                                <th>Phone no</th>
                                <td>{shProfile.phoneno}</td>
                            </tr>
                            <tr>
                                <th>shop name</th>
                                <td>{shProfile.shname}</td>
                            </tr>
                            <tr>
                                <th>Shop type</th>
                                <td>{shProfile.shtype}</td>
                            </tr>
                            <tr>
                                <th>operating hours</th>
                                <td>{shProfile.ophours}</td>
                            </tr>
                            <tr>
                                <th>payment method</th>
                                <td>{shProfile.payment}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
            <div className="profile-add">
                {mrProfile && (
                    <table>
                        <tbody>
                            <tr>
                                <th>Address</th>
                                <td>{mrProfile.address}</td>
                            </tr>
                            <tr>
                                <th>Phone No</th>
                                <td>{mrProfile.phone}</td>
                            </tr>
                            <tr>
                                <th>Business Type</th>
                                <td>{mrProfile.business}</td>
                            </tr>
                            <tr>
                                <th>Area</th>
                                <td>{mrProfile.area}</td>
                            </tr>
                            <tr>
                                <th>Farm Type</th>
                                <td>{mrProfile.payment}</td>
                            </tr>
                            <tr>
                                <th>Soil Type</th>
                                <td>{mrProfile.goods}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
            <div className="profile-add">
                {wprofile && (
                    <table>
                        <tbody>
                            <tr>
                                <th>My Address</th>
                                <td>{wprofile.address}</td>
                            </tr>
                            <tr>
                                <th>Phone No</th>
                                <td>{wprofile.phone}</td>
                            </tr>
                            <tr>
                                <th>Birth Date</th>
                                <td>{wprofile.birth}</td>
                            </tr>
                            <tr>
                                <th>Time For Work</th>
                                <td>{wprofile.time}</td>
                            </tr>
                            <tr>
                                <th>Skills Knows</th>
                                <td>{wprofile.skills}</td>
                            </tr>
                            <tr>
                                <th>Expected Salary</th>
                                <td>{wprofile.salary}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
        <div>
            <br />
            <br />
        <ul className="profile-add-nav2-menu">
        {roleItems.map((item, index) => (
          <li key={index} onClick={() => setMenu(item.name)}>
            <Link style={{ textDecoration: 'none' }} to={item.path}>{item.name}</Link>
            {menu === item.name && <><hr /></>}
          </li>
        ))}
      </ul>
        </div>
        </>
    );
}

export default Profile;