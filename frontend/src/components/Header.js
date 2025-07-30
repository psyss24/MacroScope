import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <h1>
              <span className={styles.name}>Saad Saqib</span>
              <Link to="/" className={styles.homeLink}>/ MacroScope</Link>
            </h1>
          </div>
          
          <nav className={styles.nav}>
            <div className={styles.navLinks}>
              <Link to="/markets" className={styles.navLink}>Markets</Link>
              <Link to="/stocks" className={styles.navLink}>Stocks</Link>
              <Link to="/currency" className={styles.navLink}>Currency</Link>
              <Link to="/macro" className={styles.navLink}>Macro</Link>
              <Link to="/commodities" className={styles.navLink}>Commodities</Link>
              <Link to="/bonds" className={styles.navLink}>Bonds & Risk</Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
