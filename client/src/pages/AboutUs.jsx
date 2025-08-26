import React from 'react';
import RumahGadang from "../assests/icons/RGS.jpg";

const AboutUs = () => {
  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Text Content */}
        <div style={styles.textContent}>
          <h1 style={styles.mainTitle}>About Us</h1>
          <p style={styles.paragraph}>
            Sulit Air Sepakat (SAS) adalah organisasi sosial kemasyarakatan yang menghimpun masyarakat asal Nagari Sulit Air, baik yang berada di kampung maupun di perantauan.
            Salah satu bentuk komitmen kami terhadap kepedulian sosial dan pembangunan umat adalah melalui program Jumat Berkah.
          </p>
          <p style={styles.paragraph}>
            Melalui program ini, kami membuka kesempatan seluas-luasnya kepada para donatur untuk berkontribusi dalam bentuk donasi uang guna pembangunan gedung sosial/keagamaan, 
            serta mendukung kegiatan lainnya seperti Zakat, Qurban, Infaq, dan Sedekah.
          </p>
          <p style={styles.paragraph}>
            Kini, kami menghadirkan platform donasi online berbasis website agar semua proses dapat dilakukan lebih mudah, transparan, dan efisien. Website ini memungkinkan siapa saja, 
            dari mana saja, untuk berdonasi dan ikut serta dalam membangun kebaikan bersama.
          </p>
        </div>

        {/* Image Section */}
        <div style={styles.imageContainer}>
          <div style={styles.imageWrapper}>
            <img 
              src={RumahGadang}
              alt="Our Team" 
              style={styles.image}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    // backgroundColor: '#f0fdf4',
    fontFamily: "'Arial', sans-serif",
    color: '#333',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
  },
  contentWrapper: {
    maxWidth: '1200px',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '50px',
  },
  textContent: {
    flex: 1,
    minWidth: '300px',
    paddingRight: '40px',
  },
  mainTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: '30px',
    textAlign: 'left',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#374151',
    marginBottom: '20px',
    textAlign: 'left',
  },
  imageContainer: {
    flex: 1,
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    maxWidth: '400px',
    height: '400px',
    backgroundColor: '#dcfce7',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
};

export default AboutUs;