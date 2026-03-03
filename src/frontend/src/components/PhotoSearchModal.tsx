import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImageIcon, Search, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { STATIC_CATEGORIES } from "../utils/staticData";

interface PhotoSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Keyword → category ID mapping
const KEYWORD_MAP: Record<string, string> = {
  // Mobile / Electronics
  phone: "mobile",
  smartphone: "mobile",
  iphone: "mobile",
  android: "mobile",
  samsung: "mobile",
  laptop: "electronics",
  computer: "electronics",
  pc: "electronics",
  macbook: "electronics",
  monitor: "electronics",
  tv: "electronics",
  television: "electronics",
  camera: "electronics",
  headphone: "electronics",
  earphone: "electronics",
  earbuds: "smart-gadgets",
  watch: "smart-gadgets",
  smartwatch: "smart-gadgets",
  gadget: "smart-gadgets",
  // Fashion
  shirt: "fashion",
  tshirt: "fashion",
  dress: "fashion",
  kurta: "fashion",
  saree: "fashion",
  jeans: "fashion",
  trouser: "fashion",
  jacket: "fashion",
  coat: "fashion",
  shoe: "fashion",
  sneaker: "fashion",
  sandal: "fashion",
  boot: "fashion",
  handbag: "fashion",
  bag: "fashion",
  cap: "fashion",
  hat: "fashion",
  // Grocery
  grocery: "grocery",
  fruit: "grocery",
  vegetable: "grocery",
  food: "grocery",
  rice: "grocery",
  wheat: "grocery",
  dal: "grocery",
  spice: "grocery",
  milk: "grocery",
  bread: "grocery",
  // Home & Furniture
  sofa: "furniture",
  chair: "furniture",
  table: "furniture",
  bed: "furniture",
  wardrobe: "furniture",
  shelf: "furniture",
  furniture: "furniture",
  curtain: "home",
  pillow: "home",
  lamp: "home",
  decor: "home",
  // Sports & Fitness
  cycle: "bike-scooter",
  bike: "bike-scooter",
  scooter: "bike-scooter",
  sport: "sports-fitness",
  gym: "sports-fitness",
  fitness: "sports-fitness",
  yoga: "sports-fitness",
  dumbbell: "sports-fitness",
  cricket: "sports-fitness",
  football: "sports-fitness",
  // Beauty
  beauty: "beauty-baby",
  makeup: "beauty-baby",
  lipstick: "beauty-baby",
  skincare: "beauty-baby",
  cream: "beauty-baby",
  perfume: "beauty-baby",
  baby: "beauty-baby",
  // Books / Media
  book: "books-media",
  novel: "books-media",
  magazine: "books-media",
  // Travel
  travel: "travel",
  luggage: "travel",
  suitcase: "travel",
  backpack: "travel",
  // Auto
  car: "auto-accessories",
  auto: "auto-accessories",
  // Healthcare
  medicine: "food-healthcare",
  health: "food-healthcare",
  vitamin: "food-healthcare",
  // Appliance
  appliance: "appliance",
  refrigerator: "appliance",
  fridge: "appliance",
  washing: "appliance",
  microwave: "appliance",
  cooker: "appliance",
  fan: "appliance",
  ac: "appliance",
};

// Dominant color → likely category
const COLOR_CATEGORY_MAP: Array<{
  r: [number, number];
  g: [number, number];
  b: [number, number];
  category: string;
}> = [
  { r: [180, 255], g: [80, 180], b: [0, 80], category: "fashion" }, // orange-ish
  { r: [0, 80], g: [80, 200], b: [150, 255], category: "electronics" }, // blue-ish
  { r: [0, 100], g: [130, 255], b: [0, 100], category: "grocery" }, // green-ish
  { r: [220, 255], g: [220, 255], b: [220, 255], category: "home" }, // white/grey
  { r: [130, 220], g: [0, 80], b: [130, 220], category: "beauty-baby" }, // pink/purple
];

function getDominantColor(
  img: HTMLImageElement,
): { r: number; g: number; b: number } | null {
  try {
    const canvas = document.createElement("canvas");
    const size = 50;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count === 0) return null;
    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    };
  } catch {
    return null;
  }
}

function inRange(val: number, [min, max]: [number, number]): boolean {
  return val >= min && val <= max;
}

function detectKeywordsFromFilename(filename: string): string[] {
  const lower = filename.toLowerCase().replace(/[^a-z0-9]/g, " ");
  const words = lower.split(/\s+/).filter(Boolean);
  const found = new Set<string>();

  for (const word of words) {
    // Direct match
    if (KEYWORD_MAP[word]) {
      found.add(KEYWORD_MAP[word]);
      continue;
    }
    // Substring match
    for (const [kw, cat] of Object.entries(KEYWORD_MAP)) {
      if (word.includes(kw) || kw.includes(word)) {
        found.add(cat);
        break;
      }
    }
  }
  return Array.from(found);
}

function detectCategoryFromColor(color: {
  r: number;
  g: number;
  b: number;
}): string | null {
  for (const entry of COLOR_CATEGORY_MAP) {
    if (
      inRange(color.r, entry.r) &&
      inRange(color.g, entry.g) &&
      inRange(color.b, entry.b)
    ) {
      return entry.category;
    }
  }
  return null;
}

function getCategoryName(categoryId: string): string {
  const cat = STATIC_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

export function PhotoSearchModal({
  open,
  onOpenChange,
}: PhotoSearchModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [detectedCategories, setDetectedCategories] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const reset = () => {
    setPreviewUrl(null);
    setImageFile(null);
    setDetectedCategories([]);
    setAnalyzed(false);
    setAnalyzing(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const processFile = (file: File) => {
    reset();
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      const filenameKeywords = detectKeywordsFromFilename(file.name);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const color = getDominantColor(img);
        let colorCategory: string | null = null;
        if (color) {
          colorCategory = detectCategoryFromColor(color);
        }
        const combined = new Set(filenameKeywords);
        if (colorCategory) combined.add(colorCategory);
        setDetectedCategories(Array.from(combined));
        setAnalyzing(false);
        setAnalyzed(true);
      };
      img.onerror = () => {
        setDetectedCategories(filenameKeywords);
        setAnalyzing(false);
        setAnalyzed(true);
      };
      img.src = url;
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleSearch = () => {
    if (detectedCategories.length > 0) {
      const primaryCategory = detectedCategories[0];
      void navigate({
        to: "/products",
        search: { category: primaryCategory, q: undefined, sort: undefined },
      });
    } else {
      void navigate({
        to: "/products",
        search: { q: undefined, category: undefined, sort: undefined },
      });
    }
    handleClose(false);
  };

  const removeCategory = (cat: string) => {
    setDetectedCategories((prev) => prev.filter((c) => c !== cat));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Camera className="w-5 h-5 text-brand-orange" />
            Search with Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload / Capture buttons */}
          {!previewUrl && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-border rounded-xl hover:border-brand-orange hover:bg-brand-orange-light transition-colors group cursor-pointer"
              >
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                <span className="text-sm font-medium text-foreground">
                  Upload Photo
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  From gallery or files
                </span>
              </button>

              <button
                type="button"
                onClick={() => captureInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-border rounded-xl hover:border-brand-orange hover:bg-brand-orange-light transition-colors group cursor-pointer"
              >
                <Camera className="w-8 h-8 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                <span className="text-sm font-medium text-foreground">
                  Take Photo
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Use device camera
                </span>
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={captureInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Image preview */}
          {previewUrl && (
            <div className="relative">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 max-w-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={reset}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Analyzing state */}
          {analyzing && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Analyzing image...
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-brand-orange rounded-full animate-[progress_1.5s_ease-out_forwards]" />
              </div>
            </div>
          )}

          {/* Detected keywords */}
          {analyzed && !analyzing && (
            <div className="space-y-3">
              {detectedCategories.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Search className="w-4 h-4" />
                    Detected categories:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detectedCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="gap-1 pr-1.5 bg-brand-orange-light text-brand-orange border border-brand-orange/20 hover:bg-brand-orange/20"
                      >
                        {getCategoryName(cat)}
                        <button
                          type="button"
                          onClick={() => removeCategory(cat)}
                          className="ml-0.5 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-3 text-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No specific category detected.
                    <br />
                    We&apos;ll show you all products.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {analyzed && !analyzing && (
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => reset()}
              >
                Try Another
              </Button>
              <Button
                className="flex-1 bg-brand-orange hover:bg-orange-600 text-white gap-2"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4" />
                Search Products
              </Button>
            </div>
          )}

          {/* Tip text */}
          {!previewUrl && (
            <p className="text-xs text-muted-foreground text-center">
              Tip: Take or upload a photo of any product to find similar items
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
