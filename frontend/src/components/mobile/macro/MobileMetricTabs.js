import React from 'react';
import MobileStickyTabs from '../MobileStickyTabs';

export default function MobileMetricTabs({ metrics, activeMetric, onMetricChange }) {
  return (
    <MobileStickyTabs
      items={metrics}
      activeKey={activeMetric}
      onChange={onMetricChange}
      getKey={(item) => item.key}
      getLabel={(item) => item.label}
    />
  );
}
