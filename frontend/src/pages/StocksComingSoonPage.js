import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Pages.module.css';

const StocksComingSoonPage = () => {
  return (
    <div className={styles.page} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <header className={styles.pageHeader} style={{ background: 'transparent' }}>
        <h1 style={{ marginBottom: '1rem' }}>
          Coming <Link to="/stocks-dev" style={{ textDecoration: 'none', color: 'inherit' }}>soon</Link>
        </h1>
        <p className={styles.pageDescription} style={{ margin: '0 auto' }}>
          I really want to make this page as good as I can make it. Check back later!
        </p>
      </header>
    </div>
  );
};

export default StocksComingSoonPage;
