import React, { useState, useEffect } from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ isLoading, duration = 2000 }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [minDisplayTime, setMinDisplayTime] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(0);
      setMinDisplayTime(false);
      
      // Set minimum display time
      const minTimer = setTimeout(() => {
        setMinDisplayTime(true);
      }, 300);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => {
        clearInterval(interval);
        clearTimeout(minTimer);
      };
    } else {
      // Complete the progress bar
      setProgress(100);
      
      // Only hide after minimum display time and completion
      const timer = setTimeout(() => {
        if (minDisplayTime) {
          setIsVisible(false);
          setProgress(0);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minDisplayTime]);

  if (!isVisible) return null;

  return (
    <div className={styles.progressBarContainer}>
      <div 
        className={styles.progressBar}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar; 