import React from 'react';
import styles from './MobilePageShell.module.css';

export default function MobilePageShell({ title, subtitle, children }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
