"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";

interface DiscoveryImage {
  id: string;
  url: string;
  aspectRatio: number;
}

// Curated sample images for the discovery feed
const SAMPLE_IMAGES: DiscoveryImage[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400", aspectRatio: 1.5 },
  { id: "2", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400", aspectRatio: 0.75 },
  { id: "3", url: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400", aspectRatio: 1.2 },
  { id: "4", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", aspectRatio: 0.8 },
  { id: "5", url: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400", aspectRatio: 1.3 },
  { id: "6", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", aspectRatio: 0.9 },
  { id: "7", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400", aspectRatio: 1.5 },
  { id: "8", url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400", aspectRatio: 1.0 },
  { id: "9", url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400", aspectRatio: 0.7 },
  { id: "10", url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", aspectRatio: 1.4 },
  { id: "11", url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400", aspectRatio: 0.85 },
  { id: "12", url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400", aspectRatio: 1.6 },
  { id: "13", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", aspectRatio: 1.1 },
  { id: "14", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400", aspectRatio: 0.9 },
  { id: "15", url: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400", aspectRatio: 1.3 },
  { id: "16", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400", aspectRatio: 1.5 },
  { id: "17", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400", aspectRatio: 0.8 },
  { id: "18", url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400", aspectRatio: 1.2 },
  { id: "19", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400", aspectRatio: 1.0 },
  { id: "20", url: "https://images.unsplash.com/photo-1518173946687-a4c036bc2b6e?w=400", aspectRatio: 0.75 },
  { id: "21", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", aspectRatio: 1.4 },
  { id: "22", url: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400", aspectRatio: 0.85 },
  { id: "23", url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400", aspectRatio: 1.1 },
  { id: "24", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400", aspectRatio: 1.3 },
  { id: "25", url: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400", aspectRatio: 0.9 },
];

export default function DiscoverySection() {
  const { profile } = useUser();
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [columnCount, setColumnCount] = useState(5);

  useEffect(() => {
    setMounted(true);
    
    // Calculate columns based on window width
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 500) setColumnCount(2);
      else if (width < 768) setColumnCount(3);
      else if (width < 1024) setColumnCount(4);
      else if (width < 1400) setColumnCount(5);
      else if (width < 1800) setColumnCount(6);
      else setColumnCount(7);
    };
    
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-id");
            if (id) {
              setVisibleItems((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    const items = document.querySelectorAll("[data-discovery-item]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [mounted, columnCount]);

  // Split images into columns for masonry layout
  const getColumns = () => {
    const columns: DiscoveryImage[][] = Array.from({ length: columnCount }, () => []);
    SAMPLE_IMAGES.forEach((img, i) => {
      columns[i % columnCount].push(img);
    });
    return columns;
  };

  const columns = getColumns();

  return (
    <section className="py-10">
      {/* Section header - has horizontal padding */}
      <div 
        className={`px-4 md:px-6 mb-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h2 className="font-serif text-2xl md:text-3xl text-ink/90 mb-1">Discover</h2>
        <p className="text-ink/40">Curated inspiration</p>
      </div>

      {/* Masonry grid - FULL WIDTH, edge to edge */}
      <div 
        className="grid gap-2 md:gap-3 px-2 md:px-3"
        style={{ 
          gridTemplateColumns: `repeat(${columnCount}, 1fr)` 
        }}
      >
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2 md:gap-3">
            {column.map((image, imgIndex) => (
              <ImageCard 
                key={image.id} 
                image={image} 
                visible={visibleItems.has(image.id)}
                delay={(colIndex * 30) + (imgIndex * 60)}
                profile={profile}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Load more / Sign up CTA */}
      <div 
        className={`text-center mt-12 px-4 transition-all duration-700 delay-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {profile ? (
          <button className="px-6 py-2.5 border border-ink/10 text-ink/50 text-sm font-medium rounded-full hover:border-ink/20 hover:text-ink/70 transition-colors">
            Load more
          </button>
        ) : (
          <div>
            <p className="text-ink/40 text-sm mb-3">Sign in to save your inspiration</p>
            <a 
              href="/login"
              className="inline-block px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink/90 transition-colors"
            >
              Get started
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function ImageCard({ 
  image, 
  visible, 
  delay, 
  profile 
}: { 
  image: DiscoveryImage; 
  visible: boolean; 
  delay: number;
  profile: any;
}) {
  return (
    <div
      data-discovery-item
      data-id={image.id}
      className={`group relative overflow-hidden rounded-lg transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div 
        className="relative overflow-hidden"
        style={{ aspectRatio: image.aspectRatio }}
      >
        <img
          src={image.url}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Add button - appears on hover */}
        {profile && (
          <button 
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:bg-white hover:scale-105"
            onClick={(e) => {
              e.preventDefault();
              // Will trigger add to board modal
            }}
          >
            <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}