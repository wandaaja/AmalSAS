import React from 'react';
import Titi from "../assests/icons/tti.jpeg";

const VisionMissionPage = () => {
  return (
    <div style={styles.container}>
      {/* Header with Title and Image side by side */}
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h1 style={styles.mainTitle}>Visi & Misi</h1>
          <p style={styles.intro}>
            Sulit Air Sepakat (SAS) berkomitmen untuk membangun masa depan yang berkelanjutan dan berdampak melalui visi yang jelas dan misi yang kuat.
          </p>
        </div>
        <div style={styles.headerImage}>
          <img 
            src={Titi}
            alt="Team SAS" 
            style={styles.image}
          />
        </div>
      </div>

      {/* Vision and Mission sections below */}
      <div style={styles.sectionsContainer}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Visi Kami</h2>
          <p style={styles.paragraph}>
            Menjadi organisasi terdepan yang mendorong perubahan positif, mempromosikan solidaritas sosial, dan memberdayakan masyarakat Nagari Sulit Air baik di kampung maupun di perantauan.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Misi Kami</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>Meningkatkan kesadaran masyarakat tentang pentingnya gotong royong</li>
            <li style={styles.listItem}>Memberdayakan melalui program Jumat Berkah, Zakat, dan Qurban</li>
            <li style={styles.listItem}>Membangun sarana keagamaan dan sosial untuk Nagari Sulit Air</li>
            <li style={styles.listItem}>Menyediakan platform donasi online yang transparan</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    fontFamily: "'Arial', sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    color: '#333',
    // backgroundColor: '#f8f9fa',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '50px',
    marginBottom: '40px',
  },
  headerText: {
    flex: 1,
  },
  headerImage: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    maxWidth: '400px',
    height: 'auto',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#27ae60',
  },
  intro: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#555',
  },
  sectionsContainer: {
    display: 'flex',
    gap: '40px',
  },
  section: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#27ae60',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#555',
  },
  list: {
    paddingLeft: '20px',
    margin: 0,
  },
  listItem: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '8px',
  },
};

export default VisionMissionPage;