import React from 'react';
import styles from './UnifiedCard.module.css';

/**
 * UnifiedCard - a flexible, reusable card for all card types (main, small, featured)
 * Props:
 * - title: string (main title)
 * - tag: string (optional, e.g. sector/industry)
 * - metrics: array of { label, value, valueClass? } (optional)
 * - description: string (optional)
 * - actions: React node (e.g. View Details button)
 * - children: React node (for extra content)
 * - className: string (optional, additional CSS classes)
 * - onClick: function (optional, click handler)
 * - style: object (optional, inline styles)
 */
const UnifiedCard = ({ title, tag, metrics, description, actions, children, className = '', onClick, style }) => (
  <div className={`${styles.card} ${className}`} onClick={onClick} style={style}>
    {(title || tag) && (
      <div className={styles.cardHeader}>
        {title && (
          <div className={styles.cardTitle}>
            {title}
            {tag && <span className={styles.cardTag}>{tag}</span>}
          </div>
        )}
      </div>
    )}
    {metrics && metrics.length > 0 && (
      <div className={styles.cardMetrics}>
        {metrics.map((m, i) => (
          <div className={styles.metric} key={i}>
            <span className={styles.metricLabel}>{m.label}</span>
            <span className={
              m.label === 'Metric'
                ? `${styles.metricValue} ${styles.metricValueMetric}`
                : styles.metricValue
            }>
              <span className={m.valueClass ? styles[m.valueClass] : ''}>{m.value}</span>
            </span>
          </div>
        ))}
      </div>
    )}
    {description && <div className={styles.cardDescription}>{description}</div>}
    {children}
    {actions && <div className={styles.cardFooter}>{actions}</div>}
  </div>
);

export default UnifiedCard; 