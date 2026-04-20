import React from 'react';
import MobileStickyTabs from '../MobileStickyTabs';

export default function MobileMarketViewTabs({ views, activeView, onViewChange }) {
  return (
    <MobileStickyTabs
      items={views}
      activeKey={activeView}
      onChange={onViewChange}
      getKey={(item) => item.key}
      getLabel={(item) => item.label}
    />
  );
}
