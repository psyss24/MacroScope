import React from 'react';
import MobileStickyTabs from '../MobileStickyTabs';

export default function MobileBondRegionTabs({ regions, activeRegion, onRegionChange }) {
  return (
    <MobileStickyTabs
      items={regions}
      activeKey={activeRegion}
      onChange={onRegionChange}
      getKey={(item) => item.key}
      getLabel={(item) => item.label}
    />
  );
}
