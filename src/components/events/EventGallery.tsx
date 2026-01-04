import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface EventGalleryProps {
  images: string[];
  mainImage?: string | null;
}

export function EventGallery({ images, mainImage }: EventGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const allImages = mainImage ? [mainImage, ...images] : images;
  
  if (allImages.length === 0) return null;

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? allImages.length - 1 : selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === allImages.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <ZoomIn className="w-5 h-5 text-primary" />
          Event Gallery
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {allImages.map((image, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedIndex(index)}
              className="aspect-square rounded-lg overflow-hidden relative group"
            >
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-background/95 backdrop-blur-sm border-border">
          <div className="relative">
            <AnimatePresence mode="wait">
              {selectedIndex !== null && (
                <motion.img
                  key={selectedIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={allImages[selectedIndex]}
                  alt={`Gallery image ${selectedIndex + 1}`}
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
            </AnimatePresence>

            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedIndex ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}