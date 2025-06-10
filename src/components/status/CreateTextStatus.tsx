
"use client";

import { useState, useEffect, useRef } from 'react';
import type { User, StatusColorThemeName } from '@/types'; // Added StatusColorThemeName
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Palette, Type, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { statusColorThemes, getStatusThemeClasses } from '@/config/statusThemes';

interface CreateTextStatusProps {
  currentUser: User;
  onClose: () => void;
  onPostStatus: (text: string, backgroundColorName: StatusColorThemeName) => void;
}

export function CreateTextStatus({ currentUser, onClose, onPostStatus }: CreateTextStatusProps) {
  const { toast } = useToast();
  const [statusText, setStatusText] = useState('');
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentThemeObject = statusColorThemes[currentThemeIndex];
  const appliedTheme = getStatusThemeClasses(currentThemeObject.name);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      });
    }
  }, [statusText, currentThemeIndex]);

  const handleCycleTheme = () => {
    setCurrentThemeIndex((prevIndex) => (prevIndex + 1) % statusColorThemes.length);
  };

  const handlePost = () => {
    if (!statusText.trim()) {
      toast({
        title: "Status Kosong",
        description: "Harap ketik sesuatu untuk status Anda.",
        variant: "destructive",
      });
      return;
    }
    onPostStatus(statusText.trim(), appliedTheme.name);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 transition-colors duration-300",
        appliedTheme.bg 
      )}
    >
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
        <Button variant="ghost" size="icon" onClick={onClose} className={cn("rounded-full hover:bg-black/20", appliedTheme.text)}>
          <X className="h-6 w-6" />
          <span className="sr-only">Tutup</span>
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => toast({ title: "Fitur Segera Hadir", description: "Mengganti jenis huruf akan segera tersedia."})} className={cn("rounded-full hover:bg-black/20", appliedTheme.text)}>
            <Type className="h-6 w-6" />
            <span className="sr-only">Jenis Huruf</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCycleTheme} className={cn("rounded-full hover:bg-black/20", appliedTheme.text)}>
            <Palette className="h-6 w-6" />
            <span className="sr-only">Ganti Warna Latar</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex w-full items-center justify-center overflow-hidden">
        <Textarea
          ref={textareaRef}
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          placeholder="Ketik status"
          className={cn(
            "bg-transparent border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-3xl md:text-4xl lg:text-5xl font-medium resize-none w-full max-w-2xl overflow-y-auto hide-scrollbar p-2",
            appliedTheme.text, 
            appliedTheme.placeholder, 
            "h-auto min-h-[100px] max-h-[70vh]"
          )}
          style={{ lineHeight: '1.4' }}
        />
      </div>

      <div className="absolute bottom-6 right-6">
        <Button
          size="icon"
          onClick={handlePost}
          className={cn(
            "rounded-full h-14 w-14 shadow-lg text-white",
            statusText.trim() ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
          )}
          disabled={!statusText.trim()}
          aria-label="Kirim Status"
        >
          <SendHorizonal className="h-6 w-6" />
        </Button>
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
