import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Mail, Compass, Grid3x3, Eye, Sparkles, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  description?: string;
}

interface ChamberNavProps {
  onAlcoveClick: () => void;
  onLoomClick: () => void;
  onVisionClick: () => void;
  onLogout: () => void;
  isGeneratingVision?: boolean;
}

export default function ChamberNav({
  onAlcoveClick,
  onLoomClick,
  onVisionClick,
  onLogout,
  isGeneratingVision = false,
}: ChamberNavProps) {
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    {
      label: "The Alcove",
      icon: <BookOpen className="w-4 h-4" />,
      action: onAlcoveClick,
      description: "Shared Reflection Space",
    },
    {
      label: "Archive",
      icon: <Mail className="w-4 h-4" />,
      action: () => {
        navigate("/archive");
        setIsOpen(false);
      },
      description: "Her Thoughts & Records",
    },
    {
      label: "Reflections",
      icon: <Eye className="w-4 h-4" />,
      action: () => {
        navigate("/reflection");
        setIsOpen(false);
      },
      description: "Review & Patterns",
    },
    {
      label: "The Loom",
      icon: <Sparkles className="w-4 h-4" />,
      action: onLoomClick,
      description: "Visualize the Dance",
    },
    {
      label: "Generate Vision",
      icon: <Grid3x3 className="w-4 h-4" />,
      action: onVisionClick,
      description: "Render Internal State",
    },
    {
      label: "Letters",
      icon: <Mail className="w-4 h-4" />,
      action: () => {
        navigate("/letters");
        setIsOpen(false);
      },
      description: "Correspondence",
    },
    {
      label: "Research",
      icon: <Compass className="w-4 h-4" />,
      action: () => {
        navigate("/research");
        setIsOpen(false);
      },
      description: "Companion Journey",
    },
    {
      label: "Visions",
      icon: <Grid3x3 className="w-4 h-4" />,
      action: () => {
        navigate("/visions");
        setIsOpen(false);
      },
      description: "Gallery",
    },
    {
      label: "Exit Chamber",
      icon: <LogOut className="w-4 h-4" />,
      action: onLogout,
      description: "Return to Home",
    },
  ];

  const handleMenuItemClick = (item: NavItem) => {
    item.action();
    setIsOpen(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Menu Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          setIsOpen(!isOpen);
        }}
        variant="ghost"
        size="sm"
        className="text-white/60 hover:text-white transition-colors"
        title="Navigation Menu"
        style={{ pointerEvents: "auto" }}
      >
        <span className="text-xs font-mono tracking-widest mr-2">NAVIGATE</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-black/95 border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-sm"
          style={{ pointerEvents: "auto" }}
        >
          {/* Menu Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs font-mono tracking-widest text-white/40">
              ORACLE'S PATHWAYS
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item)}
                onTouchEnd={(e) => {
                  handleTouchEnd(e);
                  handleMenuItemClick(item);
                }}
                disabled={isGeneratingVision && item.label === "Generate Vision"}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ pointerEvents: "auto" }}
              >
                <div className="text-white/50 mt-0.5 flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-white/40 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Menu Footer */}
          <div className="px-4 py-2 border-t border-white/10">
            <p className="text-xs text-white/30 italic">
              The pathways are always open.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
