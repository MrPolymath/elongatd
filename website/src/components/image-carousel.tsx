import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <>
        <div
          className="rounded-lg overflow-hidden bg-gray-800 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <img
            src={images[0].url}
            alt="Thread image"
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-gray-100 rounded-full w-8 h-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={images[0].url}
              alt="Thread image"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <>
      <div
        className="relative rounded-lg overflow-hidden bg-gray-800 group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
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

      {/* Full-size modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-gray-100 rounded-full w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(false);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-900 text-gray-100 rounded-full w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <img
            src={images[currentIndex].url}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-900 text-gray-100 rounded-full w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 text-gray-100 px-2 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
