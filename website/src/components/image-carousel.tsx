import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface ImageCarouselProps {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <div className="rounded-lg overflow-hidden bg-gray-800">
        <img
          src={images[0].url}
          alt="Thread image"
          className="w-full h-auto object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 group">
      <img
        src={images[currentIndex].url}
        alt={`Image ${currentIndex + 1} of ${images.length}`}
        className="w-full h-auto object-contain"
        loading="lazy"
      />

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-900 text-gray-100 rounded-full w-8 h-8 transition-colors"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-900 text-gray-100 rounded-full w-8 h-8 transition-colors"
        onClick={goToNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Image counter */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-900/80 text-gray-100 px-2 py-1 rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
