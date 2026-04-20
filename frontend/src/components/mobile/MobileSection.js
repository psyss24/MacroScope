import React from 'react';
import styles from './MobileSection.module.css';

export default function MobileSection({ title, description, children }) {
  return (
    <section className={styles.section}>
      {title ? <h2 className={styles.heading}>{title}</h2> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
