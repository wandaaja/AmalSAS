import React from 'react';

const ContactUsPage = () => {
  return (
    <div style={styles.container}>
     

      {/* Main Content */}
      <main style={styles.main}>
        <h1 style={styles.mainTitle}>Contact Us</h1>
        <p style={styles.paragraph}>
          Feel free to reach out to us through any of the following ways:
        </p>

        <div style={styles.contactInfo}>
          <ContactItem 
            label="Email" 
            value="wandaoctavia2710@gmail.com" 
            link="mailto:wandaoctavia2710@gmail.com"
            icon="envelope"
          />
          
          <ContactItem 
            label="Instagram" 
            value="@wndaoc.el" 
            link="https://instagram.com/wndaoc.el"
            icon="instagram"
          />
          
          <ContactItem 
            label="WhatsApp" 
            value="+62 881-6191-184" 
            link="https://wa.me/628816191184"
            icon="whatsapp"
          />
        </div>
      </main>
    </div>
  );
};

// Improved Contact Item component with icons and click handling
const ContactItem = ({ label, value, link, icon }) => {
  const handleClick = () => {
    if (link) {
      window.open(link, link.startsWith('mailto:') ? '_self' : '_blank');
    }
  };

  return (
    <div 
      style={styles.contactItem}
      onClick={handleClick}
    >
      <div style={styles.contactIcon}>
        <i className={`bi bi-${icon}`} style={{ fontSize: '20px' }}></i>
      </div>
      <div style={styles.contactDetails}>
        <span style={styles.contactLabel}>{label}</span>
        <span style={styles.contactValue}>{value}</span>
      </div>
      <div style={styles.contactArrow}>
        <i className="bi bi-chevron-right"></i>
      </div>
    </div>
  );
};

// Enhanced Styles
const styles = {
  container: {
    fontFamily: "'Arial', sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    color: '#333',
    minHeight: '100vh',
  },
  nav: {
    marginBottom: '40px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    gap: '20px',
  },
  navItem: {
    padding: '5px 0',
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'color 0.3s',
    ':hover': {
      color: '#2e8b57',
    }
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#2c3e50',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '30px',
  },
  contactInfo: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '12px',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid #eee',
    ':hover': {
      backgroundColor: '#f0f0f0',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    }
  },
  contactIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2e8b57',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
  },
  contactDetails: {
    flex: 1,
    textAlign: 'left',
  },
  contactLabel: {
    display: 'block',
    fontWeight: '600',
    color: '#555',
    fontSize: '14px',
    marginBottom: '3px',
  },
  contactValue: {
    display: 'block',
    color: '#2e8b57',
    fontWeight: '500',
    fontSize: '16px',
  },
  contactArrow: {
    color: '#999',
  },
};

export default ContactUsPage;