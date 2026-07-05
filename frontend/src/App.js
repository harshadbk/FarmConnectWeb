import './App.css';
import Navbar from './components/navbar/Navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Shop from './pages/shop';
import ShopCategory from './pages/ShopCategory';
import Product from './pages/product';
import Cart from './pages/cart';
import LoginSignup from './pages/loginsignup';
import Products from './pages/Products';
import Footer from './components/footer/footer';
import p_1 from './components/Assets/banner_1.jpg';
import p_15 from './components/Assets/banner_4.jpg';
import p_31 from './components/Assets/banner_3.jpg';
import p_32 from './components/Assets/others.jpeg';
import p_33 from './components/Assets/stationary.jpeg';
import HB from './components/Assets/hb.jpeg';
import SB from './components/Assets/sbt.avif';
import Payment from './pages/payment';
import CheckoutPage from './pages/checkout';
import Profile from './pages/profile';
import ShopKeeper from './pages/shopkeeper';
import AddProduct from './pages/addproduct';
import Pending from './myshopkeeper/pending/pending';
import Complete from './myshopkeeper/complete/complete';
import Farmers from './myshopkeeper/rfarmers/Rfarmers';
import FarmerCommunity from './Farmer/community/FCommunity';
import Aii from './Farmer/Ai/ai';
import Faddproduct from './Farmer/addproduct/faddproduct';
import Success2 from './pages/success';
import PaymentCallback from './pages/paymentCallback';
import Rshopkeeper from './Farmer/rshopkeeper/rshopkeeper';
import Rmerchants from './Farmer/rmerchants/rmerchants';
import Rworkers from './Farmer/rworkers/rworkers';
import Completeo from './Farmer/completeo/completeo';
import Pendingo from './Farmer/pendingo/pendingo';
import Completep from './Farmer/completep/completep';
import Pendingp from './Farmer/pendingp/pendingp';
import Earning from './Farmer/earning/earning';
import Addearning from './Farmer/earning/addearning/addearning';
import Myearning from './Farmer/earning/myearning/myearning';
import Myinvest from './Farmer/earning/investment/myinvest';
import Feedback from './Farmer/feedback/feedback';
import Addwork from './Farmer/addwork/addwork';

function App() {
    return (
        <AuthProvider>
            <div>
                <BrowserRouter>
                    <Navbar />
                    <Routes>
                        <Route path='/' element={<Shop />} />
                        <Route path='/products' element={<Products />} />
                        <Route path='/products/seeds' element={<ShopCategory banner={SB} category="Seeds" />} />
                        <Route path='/products/fertilizers' element={<ShopCategory banner={p_1} category="Fertilizers" />} />
                        <Route path='/products/pesticides' element={<ShopCategory banner={p_15} category="Pesticides" />} />
                        <Route path='/products/equipment' element={<ShopCategory banner={HB} category="Equipment" />} />
                        <Route path='/products/irrigation' element={<ShopCategory banner={p_33} category="Irrigation" />} />
                        <Route path='/products/animal-husbandry' element={<ShopCategory banner={p_32} category="Animal Husbandry" />} />
                        <Route path='/products/cane' element={<ShopCategory banner={p_31} category="Cane" />} />                        <Route path='/products/cane' element={<ShopCategory banner={p_31} category="Cane" />} />                        <Route path='/products/crops' element={<ShopCategory banner={p_31} category="Crops" />} />
                        <Route path='/products/organic' element={<ShopCategory banner={p_31} category="Organic" />} />
                        <Route path='/products/gardening' element={<ShopCategory banner={p_32} category="Gardening" />} />
                        <Route path='/Fertilizers' element={<ShopCategory banner={p_1} category="Fertilizers" />} />
                        <Route path='/Pesticides' element={<ShopCategory banner={p_15} category="Pesticides" />} />
                        <Route path='/Organic' element={<ShopCategory banner={p_31} category="Organic" />} />
                        <Route path='/Herbicides' element={<ShopCategory banner={HB} category="Herbicides" />} />
                        <Route path='/seed' element={<ShopCategory banner={SB} category="seed" />}/>
                        <Route path='/others' element={<ShopCategory banner={p_32} category="others" />}/>
                        <Route path='/stationary' element={<ShopCategory banner={p_33} category="stationary" />}/>
                        <Route path='/product/:productId' element={<Product />} />
                        <Route path='/cart' element={<Cart />} />
                        <Route path='/loginsignup' element={<LoginSignup />} />
                        <Route path='/checkout' element={<CheckoutPage />} />
                        <Route path='/payment' element={<Payment/>} />
                        <Route path='/payment-callback' element={<PaymentCallback/>} />
                        <Route path='/profile' element={<Profile/>} />
                        <Route path='/shopkeeper' element={<ShopKeeper/>} />
                        <Route path='/addproduct' element={<AddProduct/>} />
                        <Route path='/pending' element={<Pending/>} />
                        <Route path='/complete' element={<Complete/>} />
                        <Route path='/rfarmers' element={<Farmers/>} />
                        <Route path='/FCommunity' element={<FarmerCommunity/>} />
                        <Route path='/ai' element={<Aii/>}/>
                        <Route path='/faddproduct' element={<Faddproduct/>}/>
                        <Route path='/success' element={<Success2/>}/>
                        <Route path='/rshopkeeper' element={<Rshopkeeper/>}></Route>
                        <Route path='/rmerchants' element={<Rmerchants/>}></Route>
                        <Route path='/rworkers' element={<Rworkers/>}></Route>
                        <Route path='/completeo' element={<Completeo/>}></Route>
                        <Route path='/pendingo' element={<Pendingo/>}></Route>
                        <Route path='/completep' element={<Completep/>}></Route>
                        <Route path='/pendingp' element={<Pendingp/>}></Route>
                        <Route path='/earning' element={<Earning/>}></Route>
                        <Route path='/addearning' element={<Addearning/>}></Route>
                        <Route path='/myearning' element={<Myearning/>}></Route>
                        <Route path='/myinvest' element={<Myinvest/>}></Route>
                        <Route path='/feedback' element={<Feedback/>}></Route>
                        <Route path='/addwork' element={<Addwork/>}></Route>
                    </Routes>
                    <br/>
                    <br/>
                    <Footer/>
                </BrowserRouter>
            </div>
        </AuthProvider>
    );
}

export default App;
