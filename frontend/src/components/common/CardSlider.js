import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import styles from './CardSlider.module.css';

const CARD_WIDTH = 340; // px, max card width

const CardSlider = ({ children, className = '', style = {}, cardClassName = '' }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps',
  });

  // Arrow navigation handlers
  const scrollPrev = useCallback(() => {
    if (emblaApi && typeof emblaApi.scrollPrev === 'function') emblaApi.scrollPrev();
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    if (emblaApi && typeof emblaApi.scrollNext === 'function') emblaApi.scrollNext();
  }, [emblaApi]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [scrollPrev, scrollNext]);

  // Re-initialize embla when children change (e.g. from loading skeletons to real data)
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, children]);

  // Responsive card width (peeking effect)
  const cardStyle = {
    flex: '0 0 auto',
    minWidth: 200,
    width: CARD_WIDTH,
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const validChildren = React.Children.toArray(children).filter(Boolean);
  const cardCount = validChildren.length;

  return (
    <div className={`${styles.sliderContainer} ${className}`} style={style}>
      {cardCount > 3 && (
      <button
        className={`${styles.arrowBtn} ${styles.arrowLeft}`}
        aria-label="Scroll left"
        onClick={scrollPrev}
        tabIndex={-1}
      >
        &#8592;
      </button>
      )}
      <div className={styles.sliderRow} ref={emblaRef}>
        <div className="embla__container" style={{ display: 'flex', gap: 'var(--slider-gap, 28px)' }}>
          {validChildren.map((child, i) => (
            <div className={`${styles.sliderCard} ${cardClassName} embla__slide`} style={cardStyle} key={i}>
              {child}
            </div>
          ))}
        </div>
      </div>
      {cardCount > 3 && (
      <button
        className={`${styles.arrowBtn} ${styles.arrowRight}`}
        aria-label="Scroll right"
        onClick={scrollNext}
        tabIndex={-1}
      >
        &#8594;
      </button>
      )}
    </div>
  );
};

export default CardSlider; 