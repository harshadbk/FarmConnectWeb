import React from 'react';
import './Hero.css';
import arrow from '../Assets/arrow.jpg';
import heroimg from '../Assets/heroimg.jpg';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <div className='hero'>
            <div className="hero-left">
                <h1 className="hero-title">
                    Empowering Farmers,
                    <span className="hero-highlight"> Nurturing Growth</span>
                </h1>
                <p className="hero-subtitle">
                    We are committed to supporting farmers with the tools, resources, and community they need to thrive
                </p>
                <div className="hero-buttons">
                    <Link to='/Fertilizers' className="hero-cta-primary">
                        <button>
                            Shop Now
                            <span className="arrow-icon">→</span>
                        </button>
                    </Link>
                    <Link to='/FCommunity' className="hero-cta-secondary">
                        <button>
                            Join Community
                        </button>
                    </Link>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <h3>10K+</h3>
                        <p>Happy Farmers</p>
                    </div>
                    <div className="stat-item">
                        <h3>5K+</h3>
                        <p>Products</p>
                    </div>
                    <div className="stat-item">
                        <h3>24/7</h3>
                        <p>Support</p>
                    </div>
                </div>
            </div>
            <div className="hero-right">
                <img src={heroimg} alt="Hero" className="hero-image" />
            </div>
        </div>
    );
}

export default Hero;
