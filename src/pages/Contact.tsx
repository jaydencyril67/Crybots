import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaEnvelope, FaTelegram, FaMapMarkerAlt, FaClock, FaHeadset, FaQuestionCircle, FaGlobe } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Custom Chat icon component
const ChatIcon = ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="8" fill={color} />
        <path d="M6 7.5C6 6.67157 6.67157 6 7.5 6H16.5C17.3284 6 18 6.67157 18 7.5V13.5C18 14.3284 17.3284 15 16.5 15H8.91421C8.65279 15 8.40215 15.1054 8.20711 15.2929L6.85355 16.6464C6.53857 16.9614 6 16.7383 6 16.2929V7.5Z" fill="#fff" />
        <circle cx="9.5" cy="11" r="1" fill={color} />
        <circle cx="12" cy="11" r="1" fill={color} />
        <circle cx="14.5" cy="11" r="1" fill={color} />
    </svg>
);

const Contact: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';
            const response = await axios.post(`${API}/api/messages/public/send`, {
                email: formData.email,
                message: formData.message
            });

            if (response.data.msg && response.data.msg.success) {
                setSubmitStatus('success');
                setFormData({ email: '', message: '' });
            } else {
                setSubmitStatus('error');
                setErrorMessage('Failed to send message. Please try again.');
            }
        } catch (error: any) {
            setSubmitStatus('error');
            setErrorMessage(error.response?.data?.error || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactOptions = [
        {
            icon: <FaEnvelope />,
            title: 'Email Support',
            description: 'Get help via email',
            contact: 'support@tradespot.online',
            action: () => window.open('mailto:support@tradespot.online?subject=Support Request'),
            color: '#EA4335'
        },
        {
            icon: <FaTelegram />,
            title: 'Telegram',
            description: 'Join our Telegram community',
            contact: '🌎TradeSpot Global 🌎',
            action: () => window.open('https://t.me/tradespotglobals', '_blank'),
            color: '#0088cc'
        },
        {
            icon: <FaGlobe />,
            title: 'SpotSocials',
            description: 'Visit our social hub',
            contact: 'socials.tradespot.online',
            action: () => window.open('https://socials.tradespot.online', '_blank'),
            color: '#6366f1'
        },
    ];

    const faqItems = [
        {
            question: 'How do I reset my password?',
            answer: 'You can reset your password by clicking "Forgot Password" on the login page and following the instructions sent to your email.'
        },
        {
            question: 'How long does it take to process withdrawals?',
            answer: 'Withdrawals are typically processed within 24-48 hours during business days.'
        },
        {
            question: 'Is my account secure?',
            answer: 'Yes, we use industry-standard encryption and security measures to protect your account and funds.'
        },
        {
            question: 'How can I enable 2FA?',
            answer: 'Go to Settings > Security > Two-Factor Authentication to enable 2FA for added security.'
        }
    ];

    return (
        <div style={{
            background: 'var(--bg)',
            padding: window.innerWidth <= 768 ? '4px' : '20px',
            width: '100%',
            minHeight: '100vh',
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
        }}>
            <Helmet>
                <title>Contact TradeSpot Support</title>
                <meta name="description" content="Contact TradeSpot support — email, Telegram, live chat and socials. We're here to help." />
            </Helmet>


            {/* Contact Options Grid */}
            <div
                className="contact-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '8px',
                    marginBottom: '20px'
                }}
            >
                <style>{
                    `@media (max-width: 640px) {
                            .contact-grid {
                                grid-template-columns: repeat(2, 1fr) !important;
                            }
                        }`
                }</style>
                {contactOptions.map((option, index) => (
                    <div
                        key={index}
                        onClick={option.action}
                        style={{
                            background: 'var(--card-background)',
                            boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
                            borderRadius: '6px',
                            padding: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div style={{
                            fontSize: '1.5rem',
                            color: option.color,
                            marginBottom: '6px'
                        }}>
                            {option.icon}
                        </div>
                        <h3 style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '3px',
                            color: 'var(--text)'
                        }}>
                            {option.title}
                        </h3>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>
                            {option.description}
                        </p>
                        <p style={{
                            fontSize: '0.7rem',
                            color: 'var(--text)',
                            fontWeight: '500'
                        }}>
                            {option.contact}
                        </p>
                    </div>
                ))}
            </div>

            {/* Contact Form */}
            <div style={{
                background: 'var(--card-bg)',
                boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--text)',
                    textAlign: 'center'
                }}>
                    Send us a Message
                </h2>
                <form onSubmit={handleSubmit}>
                    <style>{`
                            @media (max-width: 768px) {
                                .form-grid {
                                    grid-template-columns: 1fr !important;
                                }
                                .form-field input,
                                .form-field textarea {
                                    box-sizing: border-box !important;
                                }
                            }
                        `}</style>
                    <div className="form-field" style={{ marginBottom: '8px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '3px',
                            fontWeight: '500',
                            color: 'var(--text)',
                            fontSize: '0.85rem'
                        }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '6px',
                                boxShadow: 'inset 0 1px 2px rgba(2,6,23,0.04)',
                                borderRadius: '4px',
                                background: 'var(--card-bg)',
                                color: 'var(--text)',
                                fontSize: '0.85rem',
                                border: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div className="form-field" style={{ marginBottom: '12px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '3px',
                            fontWeight: '500',
                            color: 'var(--text)',
                            fontSize: '0.85rem'
                        }}>
                            Message *
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '6px',
                                boxShadow: 'inset 0 1px 2px rgba(2,6,23,0.04)',
                                borderRadius: '4px',
                                background: 'var(--card-bg)',
                                color: 'var(--text)',
                                fontSize: '0.85rem',
                                resize: 'vertical',
                                border: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                        <div style={{
                            background: 'rgba(74, 222, 128, 0.08)',
                            color: 'var(--success-color)',
                            boxShadow: '0 4px 12px rgba(34,197,94,0.08)',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '12px',
                            textAlign: 'center',
                            fontSize: '0.8rem'
                        }}>
                            ✅ <strong>Message sent successfully!</strong><br />
                            We'll reply to your email within 24 hours.
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div style={{
                            background: 'rgba(248, 113, 113, 0.08)',
                            color: 'var(--error-color)',
                            boxShadow: '0 4px 12px rgba(239,68,68,0.08)',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '12px',
                            textAlign: 'center',
                            fontSize: '0.75rem'
                        }}>
                            ❌ <strong>Error:</strong> {errorMessage}
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                background: isSubmitting ? '#ccc' : 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>

            {/* FAQ Section */}
            <div style={{
                background: 'var(--card-bg)',
                boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px'
            }}>
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--text)',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}>
                    <FaQuestionCircle />
                    Frequently Asked Questions
                </h2>
                <div style={{
                    display: 'grid',
                    gap: '6px'
                }}>
                    {faqItems.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                boxShadow: '0 4px 10px rgba(2,6,23,0.04)',
                                borderRadius: '4px',
                                padding: '8px',
                                background: 'var(--card-bg)'
                            }}
                        >
                            <h3 style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '4px',
                                color: 'var(--text)'
                            }}>
                                {item.question}
                            </h3>
                            <p style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.3'
                            }}>
                                {item.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Company Info */}
            <div style={{
                background: 'var(--card-bg)',
                boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
                borderRadius: '6px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '12px'
            }}>
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--text)'
                }}>
                    TradeSpot Global
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem'
                    }}>
                        <FaMapMarkerAlt />
                        <span>Global Trading Platform</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem'
                    }}>
                        <FaClock />
                        <span>24/7 Support Available</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem'
                    }}>
                        <FaHeadset />
                        <span>Expert Customer Service</span>
                    </div>
                </div>
                <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                    margin: '0'
                }}>
                    We're committed to providing exceptional support and ensuring your trading experience is smooth and secure.
                    Our team is available around the clock to assist you with any questions or concerns.
                </p>
            </div>

            {/* Back to Login Button */}
            <div style={{
                textAlign: 'center',
                marginTop: '12px'
            }}>
            </div>
        </div>
    );
};

export default Contact;
