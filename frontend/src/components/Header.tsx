/* eslint-disable */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthModal from './AuthModal';
import styles from './Header.module.css';

const AIRBNB_LOGO = (
  <svg viewBox="0 0 1000 1000" width="32" height="32" fill="#FF385C">
    <path d="M499.3 736.7c-51-64-81-120.1-91-168.1-10-39-6-70 11-93 18-27 45-40 80-40s62 13 80 40c17 23 21 54 11 93-10 48-40 104.1-91 168.1zm362.2 43c-7 47-39 86-83 105-85 37-169.1-22-241.1-102 119.1-149.1 141.1-265.1 90-340.2-30-43-73-64-128.1-64-111 0-172.1 94-148.1 215.1 13 66 50 137.1 105 205.1-55 58-110 90-162.1 90-16 0-33-4-49-11-44-19-76-58-83-105-5-31 0-61 13-89l228.1-480.4c9-18 16-32 20-41 4-10 8-18 14-25 10-14 24-21 39-21 15 0 29 7 39 21 6 7 10 15 14 25 4 9 11 23 20 41l228.1 480.4c13 28 18 58 13 89z"/>
  </svg>
);

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.topRow}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            {AIRBNB_LOGO}
            <span className={styles.logoText}>airbnb</span>
          </Link>

          {/* User Menu */}
          <div className={styles.userArea}>
            <button className={styles.hostBtn} onClick={() => user ? router.push('/host/dashboard') : setAuthModal('login')}>
              Become a host
            </button>
            <button className={styles.globeBtn}>
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
                <path d="M16 2a14 14 0 1 0 0 28 14 14 0 0 0 0-28zm7.3 5.4c1.8 1.9 3 4.3 3.5 6.9h-5.2c-.3-2.6-1.1-5-2.2-7.1 1.5.1 2.8.6 3.9 1.4V8zm-7.3-3.2c1.4 2 2.4 4.4 2.9 7h-5.8c.5-2.6 1.5-5 2.9-7zM4.2 16c0-2.4.8-4.6 2.1-6.4 1 2 1.8 4.2 2.2 6.4H4.2zm0 2h4.3c-.4 2.2-1.2 4.4-2.2 6.4-1.3-1.8-2.1-4-2.1-6.4zm4.5 7.6c1.1-2.1 1.9-4.5 2.2-7.1h5.2c-.5 2.6-1.7 5-3.5 6.9-1.1-.8-2.4-1.3-3.9-1.4zM16 27.8c-1.4-2-2.4-4.4-2.9-7h5.8c-.5 2.6-1.5 5-2.9 7z" />
              </svg>
            </button>
            <div className={styles.menuWrap}>
              <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <span className={styles.hamburger}>
                  <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
                    <path d="M2 8h28M2 16h28M2 24h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  </svg>
                </span>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.first_name} className={styles.avatar} />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    <svg viewBox="0 0 32 32" width="20" height="20" fill="#717171">
                      <path d="M16 2a9 9 0 1 1 0 18A9 9 0 0 1 16 2zm0 20c-6 0-11 3-12 7h24c-1-4-6-7-12-7z"/>
                    </svg>
                  </span>
                )}
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  {user ? (
                    <>
                      <div className={styles.dropdownName}>{user.first_name} {user.last_name}</div>
                      <div className={styles.dropdownDivider} />
                      <Link href="/trips" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>My trips</Link>
                      <Link href="/wishlists" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>Wishlists</Link>
                      <div className={styles.dropdownDivider} />
                      <Link href="/host/dashboard" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>Manage listings</Link>
                      <Link href="/host/new" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>Create listing</Link>
                      <div className={styles.dropdownDivider} />
                      <button className={styles.dropdownItem} onClick={handleLogout}>Log out</button>
                    </>
                  ) : (
                    <>
                      <button className={styles.dropdownItemBold} onClick={() => { setAuthModal('login'); setMenuOpen(false); }}>Log in</button>
                      <button className={styles.dropdownItem} onClick={() => { setAuthModal('register'); setMenuOpen(false); }}>Sign up</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Big Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <div className={`${styles.searchBlock} ${styles.searchBlockActive}`}>
              <div className={styles.searchLabel}>Where</div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const loc = fd.get('location');
                if (loc) {
                  router.push(`/?location=${encodeURIComponent(loc as string)}`);
                } else {
                  router.push('/');
                }
              }}>
                <input name="location" type="text" className={styles.searchInput} placeholder="Search destinations" />
              </form>
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchBlock}>
              <div className={styles.searchLabel}>When</div>
              <div className={styles.searchValue}>Add dates</div>
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchBlockLast}>
              <div style={{ flex: 1 }}>
                <div className={styles.searchLabel}>Who</div>
                <div className={styles.searchValue}>Add guests</div>
              </div>
              <button className={styles.searchBtn} onClick={() => {
                const input = document.querySelector('input[name="location"]') as HTMLInputElement;
                if (input) {
                  if (input.value) router.push(`/?location=${encodeURIComponent(input.value)}`);
                  else router.push('/');
                }
              }}>
                <svg viewBox="0 0 32 32" width="16" height="16" fill="white" stroke="white" strokeWidth="2">
                  <path d="M13 3a10 10 0 1 0 0 20A10 10 0 0 0 13 3zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm14.707 5.293l-5.4-5.4a11.9 11.9 0 0 1-1.414 1.414l5.4 5.4a1 1 0 0 0 1.414-1.414z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {authModal && (
        <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={(m) => setAuthModal(m)} />
      )}

      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
    </>
  );
}
