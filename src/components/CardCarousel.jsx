import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CardCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  // If only one image, just render it normally
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="Invitation Card"
        className="w-full h-auto"
        onError={(e) => (e.target.style.display = 'none')}
      />
    );
  }

  return (
    <div className="relative w-full overflow-hidden group bg-gray-50">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`Invitation Card ${index + 1}`}
            className="w-full shrink-0 object-contain"
            onError={(e) => (e.target.style.display = 'none')}
          />
        ))}
      </div>
      
      {/* Navigation arrows (visible on hover) */}
      <button
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 text-ink shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
        aria-label="Previous card"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 text-ink shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
        aria-label="Next card"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-gold w-6'
                : 'bg-white/70 hover:bg-white'
            } shadow-sm`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
