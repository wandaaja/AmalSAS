import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SAS from "../assests/icons/LogoBaru.png";
import SignInModal from "./SignIn";
import SignUpModal from "./SignUp";
import { UserContext } from "../context/userContext";
import { setAuthToken } from "../config/api";
import { API } from "../config/api";


const navbarPages = [
  {
    id: 'home',
    title: 'Home',
    content: 'Home page of AmalSAS.id',
    path: '/'
  },
  {
    id: 'vision-mission',
    title: 'Vision & Mission',
    content: 'Our vision is to create a better world...',
    path: '/vision-mission'
  },
  {
    id: 'about-us',
    title: 'About Us',
    content: 'AmalSAS.id is a non-profit organization...',
    path: '/about-us'
  },
  {
    id: 'history',
    title: 'History',
    content: 'Donation history and records',
    path: '/history'
  },
  {
    id: 'profile',
    title: 'Profile',
    content: 'User profile and account settings',
    path: '/profile'
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    content: 'Admin dashboard for managing campaigns',
    path: '/admin/dashboard'
  },
  {
    id: 'add-campaign',
    title: 'Add Campaign',
    content: 'Create new donation campaign',
    path: '/admin/campaigns/add'
  }
];


export default function Navbar() {
  const [activeModal, setActiveModal] = useState(null); // 'signin' | 'signup' | null
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const navigate = useNavigate();


  const [state, dispatch] = useContext(UserContext);
  const isAdmin = state.user?.isAdmin;

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await API.get("/campaigns");
        const data = res.data?.data;
        if (data?.campaigns?.length > 0) {
          setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error("Gagal mengambil data campaign:", error.message);
      }
    };
    fetchCampaigns();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const foundCampaigns = campaigns.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const foundPages = navbarPages.filter(page =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const keywordResults = [];
    const query = searchQuery.toLowerCase();

    if (query.includes('masuk') || query.includes('login') || query.includes('signin')) {
      keywordResults.push({
        id: 'signin',
        title: 'Sign In / Masuk',
        content: 'Login to your account',
        type: 'action',
      icon: '🔐'
      });
    }
    
    if (query.includes('daftar') || query.includes('register') || query.includes('signup')) {
      keywordResults.push({
        id: 'signup',
        title: 'Sign Up / Daftar',
        content: 'Create new account',
        type: 'action',
      icon: '📝'
      });
    }
    
    if (query.includes('logout') || query.includes('keluar')) {
      keywordResults.push({
        id: 'logout',
        title: 'Logout',
        content: 'Sign out from your account',
        type: 'action',
      icon: '🚪'
      });
    }

    if (query.includes('home') || query.includes('beranda') || query.includes('utama')) {
    keywordResults.push({
      id: 'home',
      title: 'Home / Beranda',
      content: 'Kembali ke halaman utama',
      type: 'navigation',
      path: '/',
      icon: '🏠'
    });
  }

  if (query.includes('profil') || query.includes('profile') || query.includes('akun')) {
    keywordResults.push({
      id: 'profile',
      title: 'Profile / Profil',
      content: 'Kelola informasi akun Anda',
      type: 'navigation',
      path: '/profile',
      icon: '👤'
    });
  }

  if (query.includes('history') || query.includes('riwayat') || query.includes('donasi')) {
    keywordResults.push({
      id: 'history',
      title: 'History / Riwayat',
      content: 'Lihat riwayat donasi Anda',
      type: 'navigation',
      path: '/history',
      icon: '📊'
    });
  }

  if (query.includes('visi') || query.includes('misi') || query.includes('vision') || query.includes('mission')) {
    keywordResults.push({
      id: 'vision-mission',
      title: 'Visi & Misi',
      content: 'Pelajari visi dan misi organisasi kami',
      type: 'navigation',
      path: '/vision-mission',
      icon: '🎯'
    });
  }

  if (query.includes('tentang') || query.includes('about') || query.includes('kami')) {
    keywordResults.push({
      id: 'about-us',
      title: 'Tentang Kami / About Us',
      content: 'Ketahui lebih lanjut tentang AmalSAS.id',
      type: 'navigation',
      path: '/about-us',
      icon: 'ℹ️'
    });
  }

  if (query.includes('kontak') || query.includes('contact') || query.includes('hubungi')) {
    keywordResults.push({
      id: 'contact-us',
      title: 'Kontak / Contact Us',
      content: 'Hubungi kami untuk informasi lebih lanjut',
      type: 'navigation',
      path: '/contact-us',
      icon: '📞'
    });
  }

  // Keyword untuk Admin Features
  if (query.includes('admin') || query.includes('dashboard') || query.includes('panel')) {
    keywordResults.push({
      id: 'dashboard',
      title: 'Admin Dashboard',
      content: 'Panel administrasi untuk mengelola kampanye',
      type: 'navigation',
      path: '/admin/dashboard',
      icon: '⚙️',
      adminOnly: true
    });
  }

  if (query.includes('tambah') || query.includes('add') || query.includes('buat') || query.includes('kampanye')) {
    keywordResults.push({
      id: 'add-campaign',
      title: 'Tambah Kampanye / Add Campaign',
      content: 'Buat kampanye donasi baru',
      type: 'navigation',
      path: '/admin/campaigns/add',
      icon: '➕',
      adminOnly: true
    });
  }

  // Filter keyword results berdasarkan role user
  const filteredKeywords = keywordResults.filter(keyword => {
    if (keyword.adminOnly && !isAdmin) return false;
    return true;
  });

    navigate('/search-results', {
      state: {
        query: searchQuery,
        campaigns: foundCampaigns,
        pages: foundPages,
        keywords: filteredKeywords
      }
    });

    setSearchQuery('');
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("token");
    setAuthToken();
  };

  return (
    <>
      <nav className="navbar-container">
        <div className="navbar-brand">
          <img src={SAS} alt="Logo" className="navbar-logo" />
          <Link to="/" className="navbar-brand-text" onClick={() => setActiveModal(null)}>AmalSAS.id</Link>
        </div>

        {!isAdmin && (
          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Cari program atau halaman"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">🔍</button>
          </form>
        )}

        <div className="navbar-links">
          <Link to="/vision-mission" className="nav-link" onClick={() => setActiveModal(null)}>Vision & Mission</Link>
          <Link to="/about-us" className="nav-link" onClick={() => setActiveModal(null)}>About Us</Link>

          {state.isLogin ? (
            <>
              {isAdmin ? (
                <>
                  <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/admin/campaigns/add" className="nav-link add-campaign-button">Add Campaign</Link>
                </>
              ) : (
                <>
                  <Link to="/" className="nav-link">Home</Link>
                  <Link to="/history" className="nav-link">History</Link>
                </>
              )}
              <div className="profile">
                <Link to="/profile" className="username-link">
                  <span className="username">{state.user?.fullname || state.user?.name || state.user?.username}</span>
                </Link>
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </div>
            </>
          ) : (
            <>
              <button className="auth-button masuk" onClick={() => setActiveModal('signin')}>MASUK</button>
              <button className="auth-button daftar" onClick={() => setActiveModal('signup')}>DAFTAR</button>
            </>
          )}
        </div>

        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? '✕' : '☰'}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            {!isAdmin && (
              <form className="mobile-search" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Cari program atau halaman"
                  className="mobile-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="mobile-search-button">🔍</button>
              </form>
            )}

            <Link to="/vision-mission" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Vision & Mission</Link>
            <Link to="/about-us" className="mobile-link" onClick={() => setIsMenuOpen(false)}>About Us</Link>

            {state.isLogin ? (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                    <Link to="/admin/campaigns/add" className="mobile-link add-campaign-button" onClick={() => setIsMenuOpen(false)}>Add Campaign</Link>
                  </>
                ) : (
                  <>
                    <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link to="/history" className="mobile-link" onClick={() => setIsMenuOpen(false)}>History</Link>
                  </>
                )}
                <div className="mobile-profile">
                  <Link to="/profile" className="mobile-username-link" onClick={() => setIsMenuOpen(false)}>
                    <span>{state.user?.fullname || state.user?.username}</span>
                  </Link>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mobile-logout">Logout</button>
                </div>
              </>
            ) : (
              <>
                <button className="mobile-button masuk" onClick={() => { setActiveModal('signin'); setIsMenuOpen(false); }}>MASUK</button>
                <button className="mobile-button daftar" onClick={() => { setActiveModal('signup'); setIsMenuOpen(false); }}>DAFTAR</button>
              </>
            )}
          </div>
        )}
      </nav>

      <SignInModal
        show={activeModal === 'signin'}
        onHide={() => setActiveModal(null)}
        openSignUp={() => setActiveModal('signup')}
      />
      <SignUpModal
        show={activeModal === 'signup'}
        onHide={() => setActiveModal(null)}
        openSignIn={() => setActiveModal('signin')}
      />


      <style jsx="true">{`
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          padding: 15px 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          flex-wrap: wrap;
        }

        .navbar-brand { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
        }
        .navbar-logo { 
          height: 40px; 
        }
        .navbar-brand-text { 
          text-decoration: none; 
          color: #2e8b57; 
          font-weight: bold; 
          font-size: 20px; 
        }

        .navbar-search, .mobile-search {
          display: flex;
          align-items: center;
          background: #f1f1f1;
          border-radius: 20px;
          overflow: hidden;
          height: 36px;
          min-width: 200px;
          max-width: 400px;
          flex: 1;
          margin: 0 20px;
        }

        .search-input, .mobile-search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 15px;
          background: transparent;
          font-size: 14px;
        }

        .search-button, .mobile-search-button {
          background: #2e8b57;
          color: #fff;
          border: none;
          padding: 0 15px;
          height: 100%;
          cursor: pointer;
          font-size: 16px;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-link {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          font-size: 16px;
          white-space: nowrap;
        }

        .nav-link:hover { 
          color: #2e8b57; 
        }

        .auth-button {
          border: 1px solid #2e8b57;
          padding: 8px 16px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .auth-button.masuk {
          color: #2e8b57;
          background: none;
        }

        .auth-button.masuk:hover {
          background: #f0fff0;
        }

        .auth-button.daftar {
          background: #2e8b57;
          color: #fff;
          border: none;
        }

        .auth-button.daftar:hover {
          background: #267d4d;
        }

        .profile {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .username {
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
        }

        .username-link {
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }

        .username-link:hover {
          color: #2e8b57;
        }

        .logout-button {
          background: none;
          border: none;
          color: #d33;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        .hamburger {
          display: none;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
        }

        .mobile-menu {
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          background: #fff;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          gap: 15px;
          z-index: 999;
        }

        .mobile-search {
          margin-bottom: 15px;
          width: 100%;
        }

        .mobile-link {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          font-size: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .mobile-profile {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px 0;
          border-top: 1px solid #eee;
          margin-top: 10px;
        }

        .mobile-username-link {
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          padding: 8px 0;
        }

        .mobile-logout {
          background: none;
          border: none;
          color: #d33;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          padding: 8px 0;
          text-align: left;
        }

        .mobile-button {
          padding: 12px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          text-align: center;
          margin: 5px 0;
          width: 100%;
        }

        .mobile-button.masuk {
          border: 1px solid #2e8b57;
          color: #2e8b57;
          background: none;
        }

        .mobile-button.daftar {
          background: #2e8b57;
          color: #fff;
          border: none;
        }

        .add-campaign-button {
          background-color: #2e8b57;
          color: white !important;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.3s;
        }

        .add-campaign-button:hover {
          background-color: #267d4d;
        }

        @media (max-width: 768px) {
          .navbar-search, .navbar-links {
            display: none;
          }

          .hamburger {
            display: block;
          }
        }
      `}</style>
    </>
  );
}