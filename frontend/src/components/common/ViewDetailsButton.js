import React from 'react';
import stockStyles from '../stocks/Stocks.module.css';

const ViewDetailsButton = ({ href, className = '', children = 'View Details', ...props }) => (
  <a href={href} className={`${stockStyles.mainPageViewMore} ${className}`} {...props}>
    {children}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#181c24" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  </a>
);

export default ViewDetailsButton; 