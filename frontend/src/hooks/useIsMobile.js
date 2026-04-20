import { useEffect, useState } from 'react';

const MOBILE_MAX_WIDTH = 767;

const getIsMobile = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth <= MOBILE_MAX_WIDTH;
};

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getIsMobile());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}
