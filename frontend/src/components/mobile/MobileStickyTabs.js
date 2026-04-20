import React from 'react';
import styles from './MobileStickyTabs.module.css';

export default function MobileStickyTabs({
  items = [],
  activeKey,
  onChange,
  getLabel = (item) => item.label,
  getKey = (item) => item.key,
}) {
  return (
    <div className={styles.tabsWrap}>
      <div className={styles.tabs}>
        {items.map((item) => {
          const key = getKey(item);
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange?.(key)}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`.trim()}
            >
              {getLabel(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
