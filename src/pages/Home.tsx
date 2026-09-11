import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from "react-router-dom";
import { useTheme } from '../ThemeContext';
import { FaRocket, FaShieldAlt, FaBolt, FaChartLine, FaUsers, FaCog, FaArrowRight, FaSignInAlt, FaUserPlus, FaLock, FaRobot, FaExchangeAlt } from 'react-icons/fa';
import { isTokenValid } from '../utils/tokenValidation';
import Header from '../components/Header';
import '../theme.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Check if user has valid token
    setHasValidToken(isTokenValid());
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      <Helmet>
        <title>TradeSpot — Secure Crypto Investing</title>
        <meta name="description" content="TradeSpot: AI-powered crypto trading, instant P2P transfers, and enterprise-grade security. Join today to invest smarter." />
      </Helmet>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div style={{
        paddingTop: '60px',
        width: '100%'
      }}>
        {/* Hero Section */}
        <section style={{
          padding: "20px 0",
          textAlign: "center"
        }}>
        <div style={{
          background: "var(--card-bg)",
          borderRadius: "0",
          padding: "20px 16px",
          boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)",
          marginBottom: "0",
          width: "100%"
        }}>
          <h1 style={{
            fontSize: "1.6rem",
            fontWeight: "700",
            marginBottom: "12px",
            color: "var(--text)",
            lineHeight: "1.2"
          }}>
            TRADESPOT GLOBAL
            <br />
            <span style={{
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Crypto Organization
            </span>
          </h1>
          <p style={{
            fontSize: "0.8rem",
            marginBottom: "16px",
            color: "var(--text)",
            opacity: 0.8,
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: "1.5"
          }}>
            TradeSpot revolutionizes digital asset management with AI-powered trading bots, 
            copy trading, staking rewards, and instant peer-to-peer transfers. 
            Experience seamless crypto investing backed by cutting-edge technology and comprehensive security.
          </p>
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
              <button
               onClick={() => navigate(hasValidToken ? "/d" : "/l")}
               className="home-btn"
              style={{
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                color: theme === 'dark' ? '#ffffff' : "#1a1a1a",
                border: "none",
                borderRadius: "8px",
                padding: window.innerWidth <= 480 ? "6px 12px" : "10px 20px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: window.innerWidth <= 480 ? "0.7rem" : "0.85rem",
                boxShadow: "0 3px 10px rgba(25, 118, 210, 0.25)",
                width: "auto",
                minWidth: window.innerWidth <= 480 ? "80px" : "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <FaRocket size={14} />
              {hasValidToken ? "Dashboard" : "Sign In"}
            </button>
            <button
              onClick={() => navigate("/r")}
              className="home-btn"
              style={{
                background: "var(--secondary)",
                color: "var(--button-text)",
                border: "none",
                borderRadius: "8px",
                padding: window.innerWidth <= 480 ? "6px 12px" : "10px 20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: window.innerWidth <= 480 ? "0.7rem" : "0.85rem",
                boxShadow: "0 2px 8px rgba(108, 108, 108, 0.3), 0 0 0 1px rgba(108, 108, 108, 0.15) inset",
                width: "auto",
                minWidth: window.innerWidth <= 480 ? "80px" : "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <FaUserPlus size={14} />
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section style={{
        padding: "24px 0",
        background: "var(--bg)"
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "16px",
          padding: "0 16px"
        }}>
          <h2 style={{
            fontSize: "1.3rem",
            fontWeight: "700",
            marginBottom: "8px",
            color: "var(--text)"
          }}>
            Why Choose TradeSpot?
          </h2>
          <p style={{
            fontSize: "0.85rem",
            color: "var(--text)",
            opacity: 0.8,
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            Our platform combines cutting-edge technology with user-friendly design 
            to deliver an unmatched crypto trading experience.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0",
          marginBottom: "0"
        }}>
          {/* Copy Trading */}
          <div style={{
            background: "var(--card-bg)",
            borderRadius: "0",
            padding: "24px 18px",
            boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)",
            borderRight: "1px solid var(--border-color)"
          }}
          >
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "white"
            }}>
              <FaUsers size={20} />
            </div>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text)",
              textAlign: "center"
            }}>
              Copy Trading System
            </h3>
            <p style={{
              color: "var(--text)",
              opacity: 0.8,
              lineHeight: "1.5",
              textAlign: "center",
              fontSize: "0.8rem"
            }}>
              Follow and copy successful traders automatically. Our platform connects you 
              with top-performing traders, allowing you to replicate their strategies 
              and potentially earn similar returns with minimal effort.
            </p>
          </div>

          {/* Security */}
          <div style={{
            background: "var(--card-bg)",
            borderRadius: "0",
            padding: "24px 18px",
            boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)",
            borderRight: "1px solid var(--border-color)"
          }}
          >
            <div style={{
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "white"
            }}>
              <FaShieldAlt size={20} />
            </div>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text)",
              textAlign: "center"
            }}>
              Enterprise-Grade Security
            </h3>
            <p style={{
              color: "var(--text)",
              opacity: 0.8,
              lineHeight: "1.5",
              textAlign: "center",
              fontSize: "0.8rem"
            }}>
              Multi-layer security including SPOT ID verification, Biometric Security, 
              and real-time monitoring. Your assets are protected by bank-level 
              security protocols and 24/7 admin oversight.
            </p>
          </div>

          {/* Instant Transfers */}
          <div style={{
            background: "var(--card-bg)",
            borderRadius: "0",
            padding: "24px 18px",
            boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)",
            borderRight: "1px solid var(--border-color)"
          }}
          >
            <div style={{
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "white"
            }}>
              <FaBolt size={20} />
            </div>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text)",
              textAlign: "center"
            }}>
              Instant P2P Transfers
            </h3>
            <p style={{
              color: "var(--text)",
              opacity: 0.8,
              lineHeight: "1.5",
              textAlign: "center",
              fontSize: "0.8rem"
            }}>
              Transfer funds instantly between users with zero fees. 
              Our peer-to-peer system ensures fast, secure, and cost-effective 
              transactions without traditional banking delays.
            </p>
          </div>

          {/* Mining & Staking */}
          <div style={{
            background: "var(--card-bg)",
            borderRadius: "0",
            padding: "24px 18px",
            boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)"
          }}
          >
            <div style={{
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "white"
            }}>
              <FaCog size={20} />
            </div>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text)",
              textAlign: "center"
            }}>
              Staking Rewards
            </h3>
            <p style={{
              color: "var(--text)",
              opacity: 0.8,
              lineHeight: "1.5",
              textAlign: "center",
              fontSize: "0.8rem"
            }}>
              Earn passive income through our staking contracts. 
              Choose from liquid or fixed staking options with competitive daily returns 
              for steady crypto rewards.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: "24px 0"
      }}>
        <div style={{
          background: "var(--card-bg)",
          borderRadius: "0",
          padding: "32px 16px",
          boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)",
          width: "100%"
        }}>
          <div style={{
            textAlign: "center",
            marginBottom: "20px"
          }}>
            <h2 style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              marginBottom: "8px",
              color: "var(--text)"
            }}>
              Get Started in 4 Simple Steps
            </h2>
            <p style={{
              fontSize: "0.85rem",
              color: "var(--text)",
              opacity: 0.8,
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              Join thousands of traders who trust TradeSpot for their crypto investments
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px"
          }}>
            <div style={{
              textAlign: "center"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                margin: "0 auto 8px",
                fontWeight: "bold",
                color: theme === 'dark' ? '#ffffff' : "#1a1a1a"
              }}>
                1
              </div>
              <h3 style={{
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text)"
              }}>
                Create Account
              </h3>
              <p style={{
                color: "var(--text)",
                opacity: 0.8,
                fontSize: "0.75rem"
              }}>
                Sign up with email verification and complete SPOT ID verification
              </p>
            </div>

            <div style={{
              textAlign: "center"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                margin: "0 auto 8px",
                fontWeight: "bold",
                color: theme === 'dark' ? '#ffffff' : "#1a1a1a"
              }}>
                2
              </div>
              <h3 style={{
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text)"
              }}>
                Deposit Funds
              </h3>
              <p style={{
                color: "var(--text)",
                opacity: 0.8,
                fontSize: "0.75rem"
              }}>
                Add USDT to your account via TRC20 or TRX networks
              </p>
            </div>

            <div style={{
              textAlign: "center"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                margin: "0 auto 8px",
                fontWeight: "bold",
                color: theme === 'dark' ? '#ffffff' : "#1a1a1a"
              }}>
                3
              </div>
              <h3 style={{
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text)"
              }}>
                Start Trading
              </h3>
              <p style={{
                color: "var(--text)",
                opacity: 0.8,
                fontSize: "0.75rem"
              }}>
                Trade manually, copy successful traders, or start staking
              </p>
            </div>

            <div style={{
              textAlign: "center"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                margin: "0 auto 8px",
                fontWeight: "bold",
                color: theme === 'dark' ? '#ffffff' : "#1a1a1a"
              }}>
                4
              </div>
              <h3 style={{
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text)"
              }}>
                Earn Profits
              </h3>
              <p style={{
                color: "var(--text)",
                opacity: 0.8,
                fontSize: "0.75rem"
              }}>
                Watch your portfolio grow with our advanced trading strategies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: "24px 0"
      }}>
        <div style={{
          background: "var(--card-bg)",
          borderRadius: "0",
          padding: "32px 16px",
          boxShadow: "var(--card-shadow), 0 0 0 1px rgba(108, 108, 108, 0.15)",
          textAlign: "center",
          width: "100%"
        }}>
          <h2 style={{
            fontSize: "1.3rem",
            fontWeight: "700",
            marginBottom: "12px",
            color: "var(--text)"
          }}>
            Ready to Start Trading?
          </h2>
          <p style={{
            fontSize: "0.85rem",
            color: "var(--text)",
            opacity: 0.8,
            marginBottom: "16px",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Join thousands of traders who trust TradeSpot for their crypto investments. 
            Start your journey today with copy trading, staking, and secure P2P transfers.
          </p>
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => navigate("/r")}
              className="home-btn"
              style={{
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                color: theme === 'dark' ? '#ffffff' : "#1a1a1a",
                border: "none",
                borderRadius: "8px",
                padding: window.innerWidth <= 480 ? "6px 12px" : "10px 20px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: window.innerWidth <= 480 ? "0.7rem" : "0.85rem",
                boxShadow: "0 3px 10px rgba(25, 118, 210, 0.25)",
                width: "auto",
                minWidth: window.innerWidth <= 480 ? "80px" : "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <FaUserPlus size={14} />
              Create Free Account
            </button>
            <button
              onClick={() => navigate(hasValidToken ? "/d" : "/l")}
              className="home-btn"
              style={{
                background: "var(--secondary)",
                color: "var(--button-text)",
                border: "none",
                borderRadius: "8px",
                padding: window.innerWidth <= 480 ? "6px 12px" : "10px 20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: window.innerWidth <= 480 ? "0.7rem" : "0.85rem",
                boxShadow: "0 2px 8px rgba(108, 108, 108, 0.3), 0 0 0 1px rgba(108, 108, 108, 0.15) inset",
                width: "auto",
                minWidth: window.innerWidth <= 480 ? "80px" : "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {hasValidToken ? (
                <>
                  <FaRocket size={14} />
                  Access Dashboard
                </>
              ) : (
                <>
                  <FaSignInAlt size={14} />
                  Sign In
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer style={{
        padding: "24px 16px",
        textAlign: "center",
        boxShadow: "0 -2px 8px rgba(108, 108, 108, 0.15)",
        background: "var(--card-bg)",
        marginTop: "0",
        width: "100%"
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>🚀</span>
            <span style={{
              fontSize: "1rem",
              fontWeight: "700",
              color: "var(--text)",
              letterSpacing: "0.5px"
            }}>
              TRADESPOT
            </span>
          </div>
          <p style={{
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            marginBottom: "12px"
          }}>
            © 2024 TradeSpot. All rights reserved. Secure crypto trading with copy trading and staking.
          </p>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <span style={{
              color: "var(--text-muted)",
              fontSize: "0.7rem",
              display: "flex",
              alignItems: "center",
              gap: "3px"
            }}>
              <FaLock size={10} />
              Bank-Level Security
            </span>
            <span style={{
              color: "var(--text-muted)",
              fontSize: "0.7rem",
              display: "flex",
              alignItems: "center",
              gap: "3px"
            }}>
              <FaUsers size={10} />
              Copy Trading
            </span>
            <span style={{
              color: "var(--text-muted)",
              fontSize: "0.7rem",
              display: "flex",
              alignItems: "center",
              gap: "3px"
            }}>
              <FaBolt size={10} />
              Instant Transfers
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Responsive Styles */}
      <style>
        {`
          @media (max-width: 768px) {
            .home-header-btn {
              padding: 5px 10px !important;
              font-size: 0.7rem !important;
              gap: 3px !important;
            }
            
            .home-header-btn svg {
              width: 9px !important;
              height: 9px !important;
            }
            
            .home-btn {
              padding: 6px 12px !important;
              font-size: 0.7rem !important;
              min-width: 80px !important;
              border-radius: 6px !important;
              min-height: 32px !important;
            }
            
            div[style*="flex-direction: row"] {
              flex-direction: column !important;
              gap: 8px !important;
            }
            
            div[style*="min-width: 140px"] {
              min-width: 100% !important;
              max-width: 200px !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))"] {
              grid-template-columns: 1fr !important;
              gap: 0 !important;
            }
            
            div[style*="borderRight: "] {
              border-right: none !important;
              border-bottom: 1px solid var(--border-color) !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))"] {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
            
            div[style*="padding: 20px 16px"] {
              padding: 16px 12px !important;
            }
            
            div[style*="font-size: 1.6rem"] {
              font-size: 1.4rem !important;
            }
            
            div[style*="font-size: 1.3rem"] {
              font-size: 1.1rem !important;
            }
            
            div[style*="padding: 18px"] {
              padding: 14px !important;
            }
          }
          
          @media (max-width: 480px) {
            .home-header-btn {
              padding: 4px 8px !important;
              font-size: 0.65rem !important;
              gap: 2px !important;
            }
            
            .home-header-btn svg {
              width: 8px !important;
              height: 8px !important;
            }
            
            .home-btn {
              padding: 5px 10px !important;
              font-size: 0.65rem !important;
              min-width: 70px !important;
              border-radius: 5px !important;
              min-height: 30px !important;
            }
            
            div[style*="flex-direction: row"] {
              flex-direction: column !important;
              gap: 6px !important;
            }
            
            div[style*="min-width: 140px"] {
              min-width: 100% !important;
              max-width: 180px !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))"] {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
            
            div[style*="padding: 16px 12px"] {
              padding: 12px 8px !important;
            }
            
            div[style*="font-size: 1.4rem"] {
              font-size: 1.2rem !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 1rem !important;
            }
            
            div[style*="max-width: 260px"] {
              max-width: 100% !important;
            }
            
            div[style*="padding: 14px"] {
              padding: 10px !important;
            }
          }
          
          @media (max-width: 360px) {
            .home-btn {
              padding: 4px 8px !important;
              font-size: 0.6rem !important;
              min-width: 60px !important;
              border-radius: 4px !important;
              min-height: 28px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 12px !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 1rem !important;
            }
          }
        `}
      </style>
      </div>
    </div>
  );
};

export default Home;
