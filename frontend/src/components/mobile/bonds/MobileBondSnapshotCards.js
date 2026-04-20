import React from 'react';
import MobileCard from '../MobileCard';
import styles from './MobileBondSnapshotCards.module.css';

const getChangeClass = (value) => {
  if (typeof value !== 'number') return styles.neutral;
  if (value > 0) return styles.positive;
  if (value < 0) return styles.negative;
  return styles.neutral;
};

export default function MobileBondSnapshotCards({ cards = [] }) {
  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <MobileCard key={card.key} className={styles.card}>
          <p className={styles.label}>{card.label}</p>
          <p className={styles.value}>{card.valueText}</p>
          <p className={`${styles.change} ${getChangeClass(card.changePercent)}`}>{card.changeText}</p>
        </MobileCard>
      ))}
    </div>
  );
}
