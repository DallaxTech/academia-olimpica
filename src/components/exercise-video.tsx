'use client';

import React, { useState, memo } from 'react';
import { Maximize2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ExerciseVideoProps {
  url: string;
  className?: string;
  thumbnail?: string;
}

const VideoContent = ({ url, isLoading, isFull = false, onLoaded }: { url: string, isLoading: boolean, isFull?: boolean, onLoaded: () => void }) => {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDrive = url.includes('drive.google.com');
  
  const getEmbedUrl = (url: string) => {
    if (isYouTube) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;
    }
    if (isDrive) {
      return url.replace(/\/view\?usp=sharing|\/view$/ , '/preview');
    }
    return url;
  };

  return (
    <div className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${!isFull ? 'rounded-lg' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10 backdrop-blur-sm transition-opacity duration-300">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      {isYouTube || isDrive ? (
        <iframe
          src={getEmbedUrl(url)}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={onLoaded}
        />
      ) : (
        <video
          src={url}
          className="w-full h-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={onLoaded}
        />
      )}
    </div>
  );
};

export const ExerciseVideo = memo(function ExerciseVideo({ url, className }: ExerciseVideoProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!url) return null;

  const handleLoaded = () => setIsLoading(false);

  return (
    <div className={`group relative transition-all duration-300 ${className}`}>
      <VideoContent url={url} isLoading={isLoading} onLoaded={handleLoaded} />
      
      <Dialog>
        <DialogTrigger asChild>
          <button className="absolute bottom-3 right-3 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10 shadow-lg">
            <Maximize2 className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0 shadow-2xl">
          <div className="aspect-video w-full">
            <VideoContent url={url} isLoading={false} isFull onLoaded={() => {}} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
