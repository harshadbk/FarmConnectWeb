import React from 'react';
import './Hero.css';
import arrow from '../Assets/arrow.jpg';
import heroimg from '../Assets/heroimg.jpg';
import { Link } from 'react-router-dom';

const roles = [
    {
        label: 'Farmers',
        desc: 'Grow crops and list produce directly',
    },
    {
        label: 'Shopkeepers',
        desc: 'Stock verified goods for local buyers',
    },
    {
        label: 'Merchants',
        desc: 'Move produce from field to market fast',
    },
    {
        label: 'Workers',
        desc: 'Get farm work matched to their skills',
    },
];

const Hero = () => {
    return (
        <div className='hero'>
            <div className="hero-main">
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

            {/* One ecosystem, four roles, working together with no friction */}
            <div className="hero-network">
                <div className="network-heading">
                    <span className="network-eyebrow">Our Ecosystem</span>
                    <h2 className="network-title">One platform, built for everyone on the farm-to-market chain</h2>
                    <p className="network-subtitle">
                        Farm Connect brings farmers, shopkeepers, merchants, and workers onto a single
                        platform, so produce, orders, and work move seamlessly from one hand to the next.
                    </p>
                </div>

                <div className="network-flow">
                    {roles.map((role, index) => (
                        <React.Fragment key={role.label}>
                            <div className="network-node" style={{ '--delay': `${index * 0.15}s` }}>
                                <div className="node-icon">{role.icon}</div>
                                <h4 className="node-label">{role.label}</h4>
                                <p className="node-desc">{role.desc}</p>
                            </div>
                            {index < roles.length - 1 && (
                                <div className="network-connector" style={{ '--delay': `${index * 0.15 + 0.1}s` }}>
                                    <span className="connector-dot"></span>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Hero;