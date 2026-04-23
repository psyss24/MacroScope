import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  const headerRef = useRef(null);
  const frameRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const setHeaderHeight = () => {
      if (!headerRef.current) return;
      const nextHeight = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--app-header-height', `${nextHeight}px`);
    };

    const onScroll = () => {
      if (frameRef.current != null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        const delta = currentY - lastScrollYRef.current;
        lastScrollYRef.current = currentY;

        if (currentY <= 0) {
          offsetRef.current = 0;
          setOffset(0);
          frameRef.current = null;
          return;
        }

        const headerHeight = headerRef.current?.offsetHeight ?? 0;
        if (headerHeight <= 0) {
          frameRef.current = null;
          return;
        }

        const nextOffset = Math.max(0, Math.min(headerHeight, offsetRef.current + delta));
        if (nextOffset !== offsetRef.current) {
          offsetRef.current = nextOffset;
          setOffset(nextOffset);
        }

        frameRef.current = null;
      });
    };

    setHeaderHeight();
    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    window.addEventListener('resize', setHeaderHeight);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', setHeaderHeight);
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={styles.header}
      style={{ transform: `translateY(-${offset}px)` }}
    >
      <div className="container">
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <h1>
              <a href="https://saadsaqib.dev" className={styles.nameLink}>Saad Saqib</a>
              <Link to="/" className={styles.homeLink}>/ MacroScope</Link>
            </h1>
          </div>
          
          <nav className={styles.nav}>
            <div className={styles.navLinks}>
              <Link to="/markets" className={styles.navLink}>Markets</Link>
              <Link to="/stocks" className={styles.navLink}>Stocks</Link>
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
