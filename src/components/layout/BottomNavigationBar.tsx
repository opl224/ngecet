
"use client";

import { MessageSquare, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavigationBarProps {
  activeTab: 'chat' | 'status';
  onTabChange: (tab: 'chat' | 'status') => void;
}

export function BottomNavigationBar({ activeTab, onTabChange }: BottomNavigationBarProps) {
  const navItems = [
    { name: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { name: 'status' as const, label: 'Status', icon: UserCircle2 },
  ];

  return (
    <footer className="sticky bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background shadow-md dark:bg-neutral-900 dark:border-neutral-700">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.name;
        return (
          <Button
            key={item.name}
            variant="ghost" // Keep ghost for base structure, but override problematic styles
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-center rounded-none p-1 text-xs focus:z-10 relative",
              // Explicitly set static and hover background to match footer (bg-background)
              // This overrides any potential background from 'ghost' or other sources.
              "bg-background hover:bg-background",
              // Set text color based on active state, and maintain it on hover
              // This overrides hover:text-accent-foreground from 'ghost'
              isActive
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-muted-foreground"
            )}
            onClick={() => onTabChange(item.name)}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={cn(
                "absolute top-[2px] h-[3px] w-6 rounded-b-lg bg-primary transition-opacity duration-300 ease-out",
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              aria-hidden="true"
            />
            <Icon className={cn("mb-0.5 h-5 w-5", isActive ? "text-primary" : "")} />
            {item.label}
          </Button>
        );
      })}
    </footer>
  );
}
