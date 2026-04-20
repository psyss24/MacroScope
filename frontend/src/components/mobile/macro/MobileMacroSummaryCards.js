import React from 'react';
import { MobileCard } from '../index';
import styles from './MobileMacroSummaryCards.module.css';

export default function MobileMacroSummaryCards({ items = [] }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <MobileCard key={item.key} className={styles.card}>
          <p className={styles.label}>{item.label}</p>
          <p className={styles.value}>{item.valueText}</p>
          <p className={styles.asOf}>{item.asOfText}</p>
        </MobileCard>
      ))}
    </div>
  );
}
