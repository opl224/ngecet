
"use client";

import { useState, useEffect, useRef } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Palette, Type, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CreateTextStatusProps {
  currentUser: User;
  onClose: () => void;
  onPostStatus: (text: string, backgroundColor: string) => void; // Later, more params like font, text color
}

const colorThemes = [
  { name: 'Mustard', bg: 'bg-yellow-500', text: 'text-white', placeholder: 'placeholder-yellow-200' },
  { name: 'Forest', bg: 'bg-green-600', text: 'text-white', placeholder: 'placeholder-green-200' },
  { name: 'Sky', bg: 'bg-sky-500', text: 'text-white', placeholder: 'placeholder-sky-200' },
  { name: 'Royal', bg: 'bg-indigo-600', text: 'text-white', placeholder: 'placeholder-indigo-200' },
  { name: 'Rose', bg: 'bg-rose-500', text: 'text-white', placeholder: 'placeholder-rose-200' },
  { name: 'Slate', bg: 'bg-slate-700', text: 'text-white', placeholder: 'placeholder-slate-300' },
  { name: 'Teal', bg: 'bg-teal-500', text: 'text-white', placeholder: 'placeholder-teal-200' },
];

export function CreateTextStatus({ currentUser, onClose, onPostStatus }: CreateTextStatusProps) {
  const { toast } = useToast();
  const [statusText, setStatusText] = useState('');
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentTheme = colorThemes[currentThemeIndex];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [statusText]);

  const handleCycleTheme = () => {
    setCurrentThemeIndex((prevIndex) => (prevIndex + 1) % colorThemes.length);
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
    onPostStatus(statusText, currentTheme.name); 
    toast({
        title: "Status Terkirim",
        description: "Status teks Anda telah diposting.",
    });
    // onClose will be called by onPostStatus in parent if successful
  };
  
  // Handle Escape key to close
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
        "fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-colors duration-300",
        currentTheme.bg
      )}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
        <Button variant="ghost" size="icon" onClick={onClose} className={cn("rounded-full hover:bg-black/20", currentTheme.text)}>
          <X className="h-6 w-6" />
          <span className="sr-only">Tutup</span>
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => toast({ title: "Fitur Segera Hadir", description: "Mengganti jenis huruf akan segera tersedia."})} className={cn("rounded-full hover:bg-black/20", currentTheme.text)}>
            <Type className="h-6 w-6" />
            <span className="sr-only">Jenis Huruf</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCycleTheme} className={cn("rounded-full hover:bg-black/20", currentTheme.text)}>
            <Palette className="h-6 w-6" />
            <span className="sr-only">Ganti Warna Latar</span>
          </Button>
        </div>
      </div>

      {/* Text Input Area */}
      <div className="flex-1 flex w-full items-center justify-center overflow-hidden">
        <Textarea
          ref={textareaRef}
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          placeholder="Ketik status"
          className={cn(
            "bg-transparent border-none focus:ring-0 focus-visible:ring-0 text-center text-3xl md:text-4xl lg:text-5xl font-medium resize-none outline-none w-full max-w-2xl overflow-y-auto hide-scrollbar p-2",
            currentTheme.text,
            currentTheme.placeholder,
            "h-auto min-h-[100px] max-h-[70vh]" 
          )}
          style={{ lineHeight: '1.4' }} // Adjust line height for better readability
        />
      </div>

      {/* Send FAB */}
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
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}
