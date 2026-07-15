import React, { useState } from 'react';
import './loginsignup.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginSignup = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  
  const [state, setState] = useState("Login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [formdata, setFormdata] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    role: "Farmer",
  });

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setFormdata((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errorMessage) setErrorMessage("");
  };

  const validateForm = () => {
    if (!formdata.email || !formdata.password) {
      setErrorMessage("Email and password are required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formdata.email)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }

    if (formdata.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const validateSignupForm = () => {
    if (!validateForm()) return false;

    if (!formdata.username.trim()) {
      setErrorMessage("Name is required");
      return false;
    }

    if (formdata.password !== formdata.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    // if (!validateForm()) return;

    setLoading(true);
    setErrorMessage("");
    try {
      await login(formdata.email, formdata.password);
      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getGeolocation = () => {
    return new Promise((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
          (error) => {
            console.error("Geolocation error:", error);
            resolve({ lat: 0, lon: 0 });
          }
        );
      } else {
        resolve({ lat: 0, lon: 0 });
      }
    });
  };

  const handleSignup = async () => {
    if (!validateSignupForm()) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const { lat, lon } = await getGeolocation();
      await signup({
        username: formdata.username,
        email: formdata.email,
        password: formdata.password,
        role: formdata.role,
        latitude: lat,
        longitude: lon,
      });
      setSuccessMessage("Signup successful! Redirecting to profile...");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (error) {
      setErrorMessage(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='loginsignup'>
      <div className="loginsignup-container">
        <div className="loginsignup-header">
          <h1>{state === "Login" ? "Welcome Back" : "Join FarmConnect"}</h1>
          <p>{state === "Login" ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {successMessage}
          </div>
        )}

        <div className="loginsignup-fields">
          {state === "Sign Up" && (
            <>
              <div className="form-group">
                <label htmlFor="username">Full Name *</label>
                <input
                  id="username"
                  name='username'
                  className='form-input'
                  value={formdata.username}
                  onChange={changeHandler}
                  type="text"
                  placeholder='Enter your full name'
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Select Role *</label>
                <select
                  id="role"
                  className='form-select'
                  value={formdata.role}
                  onChange={changeHandler}
                  name="role"
                  disabled={loading}
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Shopkeeper">Shopkeeper</option>
                  <option value="Merchant">Merchant</option>
                  <option value="Worker">Worker</option>
                  <option value="Deliveryboy">Delivery Boy</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name='email'
              value={formdata.email}
              onChange={changeHandler}
              type="email"
              placeholder='you@example.com'
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name='password'
              value={formdata.password}
              onChange={changeHandler}
              type="password"
              placeholder='At least 6 characters'
              disabled={loading}
            />
          </div>

          {state === "Sign Up" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name='confirmPassword'
                value={formdata.confirmPassword}
                onChange={changeHandler}
                type="password"
                placeholder='Confirm your password'
                disabled={loading}
              />
            </div>
          )}
        </div>

        <button
          className="loginsignup-btn"
          onClick={state === "Login" ? handleLogin : handleSignup}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              {state === "Login" ? "Signing In..." : "Creating Account..."}
            </>
          ) : (
            state === "Login" ? "Sign In" : "Create Account"
          )}
        </button>

        <div className="loginsignup-toggle">
          {state === "Sign Up" ? (
            <p>
              Already have an account?{" "}
              <span onClick={() => {
                setState("Login");
                setFormdata({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  username: "",
                  role: "Farmer",
                });
                setErrorMessage("");
              }} className="toggle-link">
                Sign In Here
              </span>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <span onClick={() => {
                setState("Sign Up");
                setFormdata({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  username: "",
                  role: "Farmer",
                });
                setErrorMessage("");
              }} className="toggle-link">
                Sign Up Here
              </span>
            </p>
          )}
        </div>

        <div className="loginsignup-agree">
          <input type="checkbox" id='agree' />
          <label htmlFor="agree">
            I agree to the <a href="#terms">terms of use</a> & <a href="#privacy">privacy policy</a>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
