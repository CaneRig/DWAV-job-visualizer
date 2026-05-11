"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Github, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-lg">
              DS
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                IT & Data Science Job Market
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Russia • 5,000+ Job Postings Analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
