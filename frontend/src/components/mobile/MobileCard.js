import React from 'react';
import styles from './MobileCard.module.css';

export default function MobileCard({ children, interactive = false, className = '', ...rest }) {
  const interactiveClass = interactive ? styles.interactive : '';
  return (
    <div className={`${styles.card} ${interactiveClass} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
