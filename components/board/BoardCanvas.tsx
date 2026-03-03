"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Board {
  id: string;
  name: string;
  description: string | null;
  vibe: string;
  background_color: string | null;
  owner_id: string;
}

interface Tack {
  id: string;
  content_url: string;
  title: string | null;
  note: string | null;
  source: string | null;
  pin_color: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
}

interface TextBlock {
  id: string;
  content: string;
  font_style: string;
  font_size: number;
  color: string;
  position_x: number;
  position_y: number;
  width: number;
  rotation: number;
  z_index: number;
}

const pinColorPresets: Record<string, string> = {
  papaya: "#E24E42",
  mustard: "#E9B000",
  blush: "#EB6E80",
  aqua: "#008F95",
};

export default function BoardCanvas() {
  const params = useParams();
  const boardId = params.id as string;
  const supabase = createClient();

  const [board, setBoard] = useState<Board | null>(null);
  const [tacks, setTacks] = useState<Tack[]>([]);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTack, setSelectedTack] = useState<Tack | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addTextModalOpen, setAddTextModalOpen] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resize state
  const [resizing, setResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });

// Touch state
const [touching, setTouching] = useState(false);

  // Load board data
  useEffect(() => {
    const loadBoard = async () => {
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single();

      if (boardError) {
        console.error("Board error:", boardError);
        setError("Board not found");
        setLoading(false);
        return;
      }

      setBoard(boardData);

      const { data: tacksData } = await supabase
        .from("tacks")
        .select("*")
        .eq("board_id", boardId)
        .order("z_index", { ascending: true });

      setTacks(tacksData || []);

      const { data: textData } = await supabase
        .from("text_blocks")
        .select("*")
        .eq("board_id", boardId)
        .order("z_index", { ascending: true });

      setTextBlocks(textData || []);
      setLoading(false);
    };

    loadBoard();
  }, [boardId]);

  // Check if we should auto-open the add tack modal
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('addTack') === 'true') {
      setAddModalOpen(true);
      window.history.replaceState({}, '', `/board/${boardId}`);
    }
  }, [boardId]);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, tackId: string, currentX: number, currentY: number) => {
    e.preventDefault();
    setDragging(tackId);
    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!dragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setTacks(tacks.map(t => 
      t.id === dragging ? { ...t, position_x: newX, position_y: newY } : t
    ));
  };

  const handleDragEnd = async () => {
    if (!dragging) return;

    const tack = tacks.find(t => t.id === dragging);
    if (tack) {
      await supabase
        .from("tacks")
        .update({ position_x: tack.position_x, position_y: tack.position_y })
        .eq("id", tack.id);
    }

    setDragging(null);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, tackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const tack = tacks.find(t => t.id === tackId);
    if (!tack) return;
    
    setResizing(tackId);
    setResizeStart({
      x: e.clientX,
      width: tack.width,
    });
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!resizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const newWidth = Math.max(100, resizeStart.width + deltaX);
    
    setTacks(tacks.map(t => 
      t.id === resizing ? { ...t, width: newWidth } : t
    ));
  };
  const [checking, setChecking] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{url: string, source?: string} | null>(null);
  const handleResizeEnd = async () => {
    if (!resizing) return;
    
    const tack = tacks.find(t => t.id === resizing);
    if (tack) {
      await supabase
        .from("tacks")
        .update({ width: tack.width })
        .eq("id", tack.id);
    }
    
    setResizing(null);
  };

  // Combined mouse handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    handleDrag(e);
    handleResize(e);
  };

  const handleMouseUp = () => {
    handleDragEnd();
    handleResizeEnd();
  };
// Touch handlers for mobile
const handleTouchStart = (e: React.TouchEvent, tackId: string, currentX: number, currentY: number) => {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  setDragging(tackId);
  setTouching(true);
  setDragOffset({
    x: touch.clientX - currentX,
    y: touch.clientY - currentY,
  });
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!dragging || !touching || e.touches.length !== 1) return;
  const touch = e.touches[0];
  
  const newX = touch.clientX - dragOffset.x;
  const newY = touch.clientY - dragOffset.y;

  setTacks(tacks.map(t => 
    t.id === dragging ? { ...t, position_x: newX, position_y: newY } : t
  ));
};

const handleTouchEnd = async () => {
  if (!dragging) return;
  
  const tack = tacks.find(t => t.id === dragging);
  if (tack) {
    await supabase
      .from("tacks")
      .update({ position_x: tack.position_x, position_y: tack.position_y })
      .eq("id", tack.id);
  }
  
  setDragging(null);
  setTouching(false);
};

// Touch resize
const handleResizeTouchStart = (e: React.TouchEvent, tackId: string) => {
  e.stopPropagation();
  if (e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  const tack = tacks.find(t => t.id === tackId);
  if (!tack) return;
  
  setResizing(tackId);
  setResizeStart({
    x: touch.clientX,
    width: tack.width,
  });
};

const handleResizeTouchMove = (e: React.TouchEvent) => {
  if (!resizing || e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - resizeStart.x;
  const newWidth = Math.max(100, resizeStart.width + deltaX);
  
  setTacks(tacks.map(t => 
    t.id === resizing ? { ...t, width: newWidth } : t
  ));
};

const handleResizeTouchEnd = async () => {
  if (!resizing) return;
  
  const tack = tacks.find(t => t.id === resizing);
  if (tack) {
    await supabase
      .from("tacks")
      .update({ width: tack.width })
      .eq("id", tack.id);
  }
  
  setResizing(null);
};
  // Add tack
  const addTack = async (url: string, note: string, pinColor: string, source?: string) => {
    if (!board) return;
    
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_limits')
      .eq('id', session.session.user.id)
      .single();
      
    const maxTacks = profile?.plan_limits?.max_tacks_per_board || 50;
    
    if (maxTacks !== -1 && tacks.length >= maxTacks) {
      alert(`You've reached the limit of ${maxTacks} tacks per board on your current plan. Upgrade to add more!`);
      return;
    }
    
    const newTack = {
      board_id: boardId,
      user_id: session.session.user.id,
      content_url: url,
      note: note || null,
      source: source || null,
      pin_color: pinColor,
      position_x: Math.round(100 + Math.random() * 200),
      position_y: Math.round(100 + Math.random() * 200),
      width: 250,
      height: 300,
      rotation: Math.floor(Math.random() * 6) - 3,
      z_index: tacks.length,
    };
    
    const { data, error } = await supabase
      .from("tacks")
      .insert(newTack)
      .select()
      .single();
      
    if (!error && data) {
      setTacks([...tacks, data]);
      setAddModalOpen(false);
    } else {
      console.error("Add tack error:", error);
    }
  };

  // Add text block
  const addTextBlock = async (content: string, fontStyle: string) => {
    if (!board) return;
    
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;
    
    const newText = {
      board_id: boardId,
      user_id: session.session.user.id,
      content,
      font_style: fontStyle,
      font_size: fontStyle === "heading" ? 32 : fontStyle === "quote" ? 20 : 16,
      color: board.vibe === "dark" ? "#FFFFFF" : "#1A1A1A",
      position_x: Math.round(150 + Math.random() * 200),
      position_y: Math.round(150 + Math.random() * 200),
      width: 300,
      rotation: 0,
      z_index: tacks.length + textBlocks.length,
    };
    
    const { data, error } = await supabase
      .from("text_blocks")
      .insert(newText)
      .select()
      .single();
      
    if (!error && data) {
      setTextBlocks([...textBlocks, data]);
      setAddTextModalOpen(false);
    }
  };

  // Get background style
  const getBackgroundStyle = () => {
    if (!board) return {};
    
    const colors = board.background_color?.split(",") || ["#fef3e2", "#fce7f3"];
    const c1 = colors[0] || "#fef3e2";
    const c2 = colors[1] || "#fce7f3";

    switch (board.vibe) {
      case "gradient":
        return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
      case "starburst":
        return { background: `repeating-conic-gradient(from 0deg, ${c1} 0deg 15deg, ${c2} 15deg 30deg)` };
      case "swirl":
        return { 
          background: `
            radial-gradient(ellipse at 20% 80%, ${c1} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, ${c2} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${c1} 0%, transparent 40%),
            linear-gradient(135deg, ${c1} 0%, ${c2} 100%)
          `
        };
      case "solid":
        return { backgroundColor: c1 };
      case "warm":
        return { background: `linear-gradient(135deg, #fef3e2 0%, #fce7f3 100%)` };
      case "cool":
        return { background: `linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)` };
      case "dark":
        return { background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)` };
      case "minimal":
        return { backgroundColor: "#ffffff" };
      default:
        return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cork-warm flex items-center justify-center">
        <div className="text-ink-soft">Loading board...</div>
      </div>
    );
  }

  // Error state
  if (error || !board) {
    return (
      <div className="min-h-screen bg-cork-warm flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-soft mb-4">{error || "Board not found"}</p>
          <Link href="/" className="text-papaya">Go home</Link>
        </div>
      </div>
    );
  }

return (
  <div 
    className="min-h-screen relative overflow-hidden touch-none"
    style={getBackgroundStyle()}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onMouseLeave={handleMouseUp}
    onTouchMove={(e) => {
      handleTouchMove(e);
      handleResizeTouchMove(e);
    }}
    onTouchEnd={() => {
      handleTouchEnd();
      handleResizeTouchEnd();
    }}
  >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
            <h1 className="font-serif text-lg leading-tight">{board.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="relative w-full h-screen overflow-auto">
        {board.description && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-md text-center px-4">
            <p className={`font-serif text-lg italic ${
              board.vibe === 'dark' ? 'text-white/60' : 'text-ink/40'
            }`}>
              &ldquo;{board.description}&rdquo;
            </p>
          </div>
        )}
        
        <div className="relative" style={{ width: '2000px', height: '1500px', margin: '120px auto 100px' }}>
          {/* Tacks */}
          {tacks.map((tack) => (
  <div
    key={tack.id}
    className={`absolute group ${
      dragging === tack.id || resizing === tack.id ? 'z-50' : 'hover:z-10'
    }`}
    style={{
      left: tack.position_x,
      top: tack.position_y,
      width: tack.width,
      transform: `rotate(${tack.rotation}deg)`,
    }}
  >
    {/* Tack content */}
    <div 
      className={`bg-white p-2 rounded-sm shadow-xl cursor-move transition-shadow duration-300 ${
        dragging === tack.id ? 'shadow-2xl' : 'hover:shadow-xl'
      }`}
      onMouseDown={(e) => handleDragStart(e, tack.id, tack.position_x, tack.position_y)}
      onTouchStart={(e) => handleTouchStart(e, tack.id, tack.position_x, tack.position_y)}
      onClick={(e) => {
        if (!dragging && !touching) {
          e.stopPropagation();
          setSelectedTack(tack);
        }
      }}
    >
      <img
        src={tack.content_url}
        alt={tack.title || ""}
        className="w-full rounded-sm pointer-events-none"
        style={{ height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
        draggable={false}
      />
      {tack.title && (
        <p className="mt-2 text-xs font-medium text-ink truncate">{tack.title}</p>
      )}
    </div>
    
    {/* Pin */}
    <div 
      className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-md pointer-events-none"
      style={{ backgroundColor: pinColorPresets[tack.pin_color] || tack.pin_color }}
    />
    
    {/* Resize Handle - bigger on mobile */}
    <div
      className="absolute -bottom-3 -right-3 w-8 h-8 md:w-6 md:h-6 bg-papaya rounded-full cursor-se-resize opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg active:scale-110"
      onMouseDown={(e) => handleResizeStart(e, tack.id)}
      onTouchStart={(e) => handleResizeTouchStart(e, tack.id)}
    >
      <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
        <path d="M1 9L9 1M5 9L9 5M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
))}

          {/* Text Blocks */}
          {textBlocks.map((text) => (
            <div
              key={text.id}
              className="absolute cursor-move"
              style={{
                left: text.position_x,
                top: text.position_y,
                width: text.width,
                transform: `rotate(${text.rotation}deg)`,
              }}
            >
              <p 
                className={`${
                  text.font_style === 'heading' ? 'font-serif font-bold' :
                  text.font_style === 'quote' ? 'font-serif italic' :
                  'font-sans'
                }`}
                style={{ fontSize: text.font_size, color: text.color }}
              >
                {text.content}
              </p>
            </div>
          ))}

          {/* Empty state */}
          {tacks.length === 0 && textBlocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-lg mb-4 ${board.vibe === 'dark' ? 'text-white/60' : 'text-ink-soft'}`}>
                  This board is empty
                </p>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors"
                >
                  Tack your first image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-6 left-6 z-40 flex gap-2">
        <button 
          onClick={() => setAddTextModalOpen(true)}
          className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg text-sm font-medium text-ink hover:bg-white transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
          </svg>
          Add Text
        </button>
      </div>

      <button 
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-papaya text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {/* Modals */}
      {settingsOpen && (
        <SettingsSidebar
          board={board}
          onClose={() => setSettingsOpen(false)}
          onUpdate={(updates) => setBoard({ ...board, ...updates })}
        />
      )}

      {selectedTack && (
        <TackDetailModal
          tack={selectedTack}
          onClose={() => setSelectedTack(null)}
          onUpdate={(tackId, updates) => {
            setTacks(tacks.map(t => t.id === tackId ? { ...t, ...updates } : t));
            setSelectedTack(prev => prev ? { ...prev, ...updates } : null);
          }}
          onDelete={(tackId) => setTacks(tacks.filter(t => t.id !== tackId))}
        />
      )}

      {addModalOpen && (
        <AddTackModal 
          onClose={() => setAddModalOpen(false)} 
          onAdd={addTack}
          boardId={boardId}
        />
      )}

      {addTextModalOpen && (
        <AddTextModal
          onClose={() => setAddTextModalOpen(false)}
          onAdd={addTextBlock}
        />
      )}

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl">Activity</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center"
              >
                <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <p className="text-ink-soft text-sm">No activity yet</p>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// SETTINGS SIDEBAR
// ============================================================================

function SettingsSidebar({ 
  board, 
  onClose, 
  onUpdate 
}: { 
  board: Board; 
  onClose: () => void; 
  onUpdate: (updates: Partial<Board>) => void;
}) {
  const supabase = createClient();
  
  const initialColors = board.background_color?.split(",") || ["#fef3e2", "#fce7f3"];
  
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || "");
  const [bgStyle, setBgStyle] = useState(board.vibe || "gradient");
  const [color1, setColor1] = useState(initialColors[0] || "#fef3e2");
  const [color2, setColor2] = useState(initialColors[1] || "#fce7f3");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const saveChanges = async () => {
      setSaving(true);
      const colorString = `${color1},${color2}`;
      const updates = {
        name,
        description: description || null,
        vibe: bgStyle,
        background_color: colorString,
      };

      const { error } = await supabase
        .from("boards")
        .update(updates)
        .eq("id", board.id);

      if (!error) {
        onUpdate(updates);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
      setSaving(false);
    };

    const timeout = setTimeout(saveChanges, 500);
    return () => clearTimeout(timeout);
  }, [name, description, bgStyle, color1, color2]);

  const bgPatterns = [
    { id: "gradient", label: "Gradient", description: "Smooth blend" },
    { id: "starburst", label: "Starburst", description: "Radial rays" },
    { id: "swirl", label: "Swirl", description: "Dreamy mix" },
    { id: "solid", label: "Solid", description: "Keep it simple" },
  ];

  const renderPatternPreview = (patternId: string, c1: string, c2: string) => {
    switch (patternId) {
      case "gradient":
        return <div className="w-full h-full rounded-lg" style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }} />;
      case "starburst":
        return <div className="w-full h-full rounded-lg" style={{ background: `repeating-conic-gradient(from 0deg, ${c1} 0deg 15deg, ${c2} 15deg 30deg)` }} />;
      case "swirl":
        return <div className="w-full h-full rounded-lg overflow-hidden" style={{ background: `radial-gradient(ellipse at 20% 80%, ${c1} 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${c2} 0%, transparent 50%), linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }} />;
      case "solid":
        return <div className="w-full h-full rounded-lg" style={{ backgroundColor: c1 }} />;
      default:
        return null;
    }
  };

  const colorPresets = [
    { c1: "#fef3e2", c2: "#fce7f3", name: "Sunset" },
    { c1: "#d1fae5", c2: "#a5f3fc", name: "Ocean" },
    { c1: "#fecaca", c2: "#fef08a", name: "Citrus" },
    { c1: "#1a1a2e", c2: "#0f3460", name: "Midnight" },
    { c1: "#ffffff", c2: "#f5f5f5", name: "Clean" },
    { c1: "#fdf4ff", c2: "#f5d0fe", name: "Lavender" },
    { c1: "#fef9c3", c2: "#d9f99d", name: "Lemon Lime" },
    { c1: "#ffe4e6", c2: "#fecdd3", name: "Blush" },
  ];

  const funNameIdeas = ["Mood Board Magic", "Creative Chaos", "Vision Vibes", "Inspo Central", "Dream Collection", "Color Stories", "Visual Diary", "Spark & Wonder"];

  const suggestName = () => {
    const random = funNameIdeas[Math.floor(Math.random() * funNameIdeas.length)];
    setName(random);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-ink/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-ink">Board Settings</h2>
              <p className="text-sm text-ink-soft mt-0.5">Make it yours</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-ink/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">Board Name</p>
              <button onClick={suggestName} className="text-xs text-papaya hover:text-papaya/70 transition-colors">Surprise me</button>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 font-medium text-ink transition-all"
              placeholder="Give your board a name..."
            />
          </div>

          <div className="p-6 border-b border-ink/5">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-3">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What story does this board tell?"
              rows={3}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 resize-none text-sm text-ink transition-all"
            />
          </div>

          <div className="p-6 border-b border-ink/5">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-4">Background Style</p>
            <div className="grid grid-cols-2 gap-3">
              {bgPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => setBgStyle(pattern.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${bgStyle === pattern.id ? 'border-papaya' : 'border-ink/10 hover:border-ink/20'}`}
                >
                  <div className="w-full h-16 mb-2 rounded-lg overflow-hidden">
                    {renderPatternPreview(pattern.id, color1, color2)}
                  </div>
                  <p className={`text-sm font-medium ${bgStyle === pattern.id ? 'text-papaya' : 'text-ink'}`}>{pattern.label}</p>
                  <p className="text-xs text-ink-soft">{pattern.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-ink/5">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-4">Quick Palettes</p>
            <div className="grid grid-cols-4 gap-2">
              {colorPresets.map((preset, i) => (
                <button key={i} onClick={() => { setColor1(preset.c1); setColor2(preset.c2); }} title={preset.name}>
                  <div className="h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-papaya transition-all">
                    {renderPatternPreview(bgStyle, preset.c1, preset.c2)}
                  </div>
                  <p className="text-xs text-ink-soft mt-1 truncate text-center">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-4">Custom Colors</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-2 border-ink/10 p-1" />
                <div className="flex-1">
                  <p className="text-xs text-ink-soft mb-1">Color 1</p>
                  <input type="text" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-full px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/20" />
                </div>
              </div>
              {bgStyle !== "solid" && (
                <div className="flex items-center gap-3">
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-2 border-ink/10 p-1" />
                  <div className="flex-1">
                    <p className="text-xs text-ink-soft mb-1">Color 2</p>
                    <input type="text" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-full px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/20" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-ink/5 bg-white">
          <div className={`flex items-center justify-center gap-2 text-sm transition-all duration-300 ${justSaved ? 'text-green-600' : 'text-ink-soft'}`}>
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-ink/20 border-t-papaya rounded-full animate-spin"/>
                <span>Saving...</span>
              </>
            ) : justSaved ? (
              <>
                <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Saved</span>
              </>
            ) : (
              <span>Auto-saves as you edit</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// TACK DETAIL MODAL
// ============================================================================

function TackDetailModal({
  tack,
  onClose,
  onUpdate,
  onDelete,
}: {
  tack: Tack;
  onClose: () => void;
  onUpdate: (tackId: string, updates: Partial<Tack>) => void;
  onDelete: (tackId: string) => void;
}) {
  const [title, setTitle] = useState(tack.title || "");
  const [note, setNote] = useState(tack.note || "");
  const [rotation, setRotation] = useState(tack.rotation);
  const [pinColor, setPinColor] = useState(tack.pin_color);
  const [customColor, setCustomColor] = useState(pinColorPresets[tack.pin_color] ? "" : tack.pin_color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (title !== (tack.title || "") || note !== (tack.note || "") || rotation !== tack.rotation || pinColor !== tack.pin_color) {
        setSaving(true);
        const updates = { title: title || null, note: note || null, rotation, pin_color: pinColor };
        await supabase.from("tacks").update(updates).eq("id", tack.id);
        onUpdate(tack.id, updates);
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, note, rotation, pinColor]);

  const handlePinColorChange = (color: string) => {
    setPinColor(color);
    setShowColorPicker(false);
  };

  const handleDelete = async () => {
    await supabase.from("tacks").delete().eq("id", tack.id);
    onDelete(tack.id);
    onClose();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(tack.content_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title || 'tack-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(tack.content_url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 bg-ink/5 flex items-center justify-center p-6 min-h-[300px]">
          <div style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s' }}>
            <img src={tack.content_url} alt={title} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" />
          </div>
        </div>
        
        <div className="w-full md:w-96 p-6 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-ink-soft">{saving ? "Saving..." : "Tack details"}</span>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center">
              <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-ink-soft mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give this tack a name..." className="w-full px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/30" />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-ink-soft mb-1">Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What inspires you about this?" rows={3} className="w-full px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none" />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-ink-soft mb-2">Rotation</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setRotation(r => r - 5)} className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-colors">
                <svg className="w-4 h-4 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24"><path d="M2.5 2v6h6M2.66 15a10 10 0 1 0 1.26-8"/></svg>
              </button>
              <input type="range" min="-45" max="45" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="flex-1 accent-papaya" />
              <button onClick={() => setRotation(r => r + 5)} className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-colors">
                <svg className="w-4 h-4 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15a10 10 0 1 1-1.26-8"/></svg>
              </button>
              <button onClick={() => setRotation(0)} className="px-2 py-1 text-xs text-ink-soft hover:text-ink">Reset</button>
            </div>
            <p className="text-xs text-ink-soft text-center mt-1">{rotation}°</p>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-ink-soft mb-2">Pin color</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(pinColorPresets).map(([name, color]) => (
                <button key={name} onClick={() => handlePinColorChange(name)} className={`w-8 h-8 rounded-full ${pinColor === name ? 'ring-2 ring-offset-2 ring-ink' : ''} hover:scale-110 transition-transform`} style={{ backgroundColor: color }} />
              ))}
              <button onClick={() => setShowColorPicker(!showColorPicker)} className={`w-8 h-8 rounded-full border-2 border-dashed border-ink/30 flex items-center justify-center hover:border-ink/50 transition-colors ${!pinColorPresets[pinColor] ? 'ring-2 ring-offset-2 ring-ink' : ''}`} style={{ backgroundColor: !pinColorPresets[pinColor] ? pinColor : 'transparent' }}>
                {pinColorPresets[pinColor] && <svg className="w-4 h-4 stroke-ink/50 stroke-2 fill-none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>}
              </button>
            </div>
            {showColorPicker && (
              <div className="mt-3 flex items-center gap-2">
                <input type="color" value={customColor || "#E24E42"} onChange={(e) => { setCustomColor(e.target.value); setPinColor(e.target.value); }} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <input type="text" value={customColor} onChange={(e) => { setCustomColor(e.target.value); if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) setPinColor(e.target.value); }} placeholder="#E24E42" className="flex-1 px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/30" />
              </div>
            )}
          </div>

          {tack.source && <p className="text-xs text-ink-soft mb-4">Source: {tack.source}</p>}

          <div className="mt-auto pt-4 border-t border-ink/5">
            {confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors">Yes, delete</button>
                <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleDownload} className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
                <button onClick={() => setConfirmDelete(true)} className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-red-50 hover:text-red-500 transition-colors">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PIN COLOR PICKER
// ============================================================================

function PinColorPicker({
  pinColor,
  setPinColor,
  customPinColor,
  setCustomPinColor,
  showCustomPinColor,
  setShowCustomPinColor,
}: {
  pinColor: string;
  setPinColor: (color: string) => void;
  customPinColor: string;
  setCustomPinColor: (color: string) => void;
  showCustomPinColor: boolean;
  setShowCustomPinColor: (show: boolean) => void;
}) {
  return (
    <div className="mb-6">
      <label className="text-sm text-ink-soft mb-2 block">Pin color</label>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(pinColorPresets).map(([name, color]) => (
          <button key={name} type="button" onClick={() => { setPinColor(name); setShowCustomPinColor(false); }} className={`w-8 h-8 rounded-full ${pinColor === name && !showCustomPinColor ? 'ring-2 ring-offset-2 ring-ink' : ''} hover:scale-110 transition-transform`} style={{ backgroundColor: color }} />
        ))}
        <button type="button" onClick={() => setShowCustomPinColor(!showCustomPinColor)} className={`w-8 h-8 rounded-full border-2 border-dashed border-ink/30 flex items-center justify-center hover:border-ink/50 transition-colors ${showCustomPinColor ? 'ring-2 ring-offset-2 ring-ink' : ''}`} style={{ backgroundColor: showCustomPinColor && customPinColor ? customPinColor : 'transparent' }}>
          {!showCustomPinColor && <svg className="w-4 h-4 stroke-ink/50 stroke-2 fill-none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>}
        </button>
      </div>
      {showCustomPinColor && (
        <div className="mt-3 flex items-center gap-2">
          <input type="color" value={customPinColor || "#E24E42"} onChange={(e) => setCustomPinColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
          <input type="text" value={customPinColor} onChange={(e) => setCustomPinColor(e.target.value)} placeholder="#E24E42" className="flex-1 px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/30" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADD TACK MODAL
// ============================================================================

function AddTackModal({ 
  onClose, 
  onAdd,
  boardId,
}: { 
  onClose: () => void; 
  onAdd: (url: string, note: string, pinColor: string, source?: string) => void;
  boardId: string;
}) {
  const [mode, setMode] = useState<"upload" | "url" | "scrape">("upload");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [pinColor, setPinColor] = useState("papaya");
  const [customPinColor, setCustomPinColor] = useState("");
  const [showCustomPinColor, setShowCustomPinColor] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [scrapedSource, setScrapedSource] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{url: string, note: string, pinColor: string, source?: string} | null>(null);
  
  const supabase = createClient();

  const checkForAI = async (imageUrl: string): Promise<boolean> => {
    setChecking(true);
    setAiWarning(null);
    try {
      const response = await fetch('/api/check-ai', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ imageUrl }) 
      });
      const data = await response.json();
      
      // If likely AI, show warning modal - don't block
      if (data.isLikelyAI || data.blocked) {
        setAiWarning(data.reason || 'This image may be AI-generated.');
        setChecking(false);
        return false; // Signal to show confirmation
      }
      
      // Otherwise allow upload
      setChecking(false);
      return true;
    } catch (error) {
      console.error('AI check failed:', error);
      setChecking(false);
      return true; // Allow upload if check fails
    }
  };

  const proceedWithUpload = () => {
    if (!pendingUpload) return;
    onAdd(pendingUpload.url, pendingUpload.note, pendingUpload.pinColor, pendingUpload.source);
    setPendingUpload(null);
    setShowAiConfirm(false);
  };

  const handleCancelUpload = () => {
    setShowAiConfirm(false);
    setAiWarning(null);
    if (mode === "upload") {
      setPreviewUrl(null);
      setUrl("");
    }
    setPendingUpload(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAiWarning(null);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    const fileName = `${boardId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("tacks").upload(fileName, file);
    if (error) { console.error("Upload error:", error); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("tacks").getPublicUrl(fileName);
    setUrl(publicUrl);
    setUploading(false);
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapedImages([]);
    setSelectedImages(new Set());
    setAiWarning(null);
    try {
      const response = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: scrapeUrl }) });
      const data = await response.json();
      if (data.error) { console.error('Scrape error:', data.error); alert('Could not fetch images from this URL'); }
      else { setScrapedImages(data.images || []); setScrapedSource(data.source || ''); }
    } catch (error) { console.error('Scrape failed:', error); alert('Failed to fetch images'); }
    setScraping(false);
  };

  const toggleImageSelection = async (imgUrl: string) => {
    if (selectedImages.has(imgUrl)) { 
      const newSelected = new Set(selectedImages); 
      newSelected.delete(imgUrl); 
      setSelectedImages(newSelected); 
      return; 
    }
    
    const isOk = await checkForAI(imgUrl);
    const finalPinColor = showCustomPinColor && customPinColor ? customPinColor : pinColor;
    
    if (!isOk) {
      // Show confirmation modal
      setPendingUpload({ url: imgUrl, note: note.trim(), pinColor: finalPinColor, source: scrapedSource });
      setShowAiConfirm(true);
      return;
    }
    
    const newSelected = new Set(selectedImages);
    newSelected.add(imgUrl);
    setSelectedImages(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    const isOk = await checkForAI(url);
    const finalPinColor = showCustomPinColor && customPinColor ? customPinColor : pinColor;
    
    if (!isOk) {
      // Show confirmation modal
      setPendingUpload({ url: url.trim(), note: note.trim(), pinColor: finalPinColor });
      setShowAiConfirm(true);
      return;
    }
    
    onAdd(url.trim(), note.trim(), finalPinColor);
  };

  const handleAddSelectedImages = () => {
    if (selectedImages.size === 0) return;
    const finalPinColor = showCustomPinColor && customPinColor ? customPinColor : pinColor;
    selectedImages.forEach(imgUrl => { onAdd(imgUrl, note.trim(), finalPinColor, scrapedSource); });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl">Tack something new</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center">
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-ink/5 rounded-lg">
          <p className="text-xs text-ink-soft"><strong>Human-made content only.</strong> Sparkbrd is a space for authentic, human-created inspiration.</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => { setMode("upload"); setAiWarning(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "upload" ? "bg-ink text-white" : "bg-ink/5 text-ink hover:bg-ink/10"}`}>Upload</button>
          <button onClick={() => { setMode("url"); setAiWarning(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "url" ? "bg-ink text-white" : "bg-ink/5 text-ink hover:bg-ink/10"}`}>Image URL</button>
          <button onClick={() => { setMode("scrape"); setAiWarning(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "scrape" ? "bg-ink text-white" : "bg-ink/5 text-ink hover:bg-ink/10"}`}>From Page</button>
        </div>

        {checking && (
          <div className="mb-4 p-4 bg-ink/5 rounded-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-papaya rounded-full animate-spin"/>
            <p className="text-sm text-ink-soft">Checking content authenticity...</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
{mode === "upload" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setPreviewUrl(null); setUrl(""); setAiWarning(null); }} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-ink/20 rounded-xl p-8 text-center hover:border-papaya hover:bg-papaya/5 transition-colors cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    {uploading ? <p className="text-ink-soft">Uploading...</p> : (
                      <>
                        <svg className="w-12 h-12 stroke-ink-soft stroke-[1.5] fill-none mx-auto mb-3" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <p className="font-medium text-ink mb-1">Drop an image here</p>
                        <p className="text-sm text-ink-soft">or click to browse</p>
                      </>
                    )}
                  </label>
                )}
              </div>
              <div className="mb-4">
                <label className="text-sm text-ink-soft mb-2 block">Note (optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What inspires you about this?" rows={3} className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none" />
              </div>
              <PinColorPicker pinColor={pinColor} setPinColor={setPinColor} customPinColor={customPinColor} setCustomPinColor={setCustomPinColor} showCustomPinColor={showCustomPinColor} setShowCustomPinColor={setShowCustomPinColor} />
              <button type="submit" disabled={!url || uploading || checking} className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{checking ? 'Checking...' : 'Tack it'}</button>
            </form>
          )}

          {mode === "url" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-sm text-ink-soft mb-2 block">Image URL</label>
                <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setAiWarning(null); }} placeholder="https://example.com/image.jpg" className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30" required />
              </div>
              {url && <div className="mb-4"><img src={url} alt="Preview" className="w-full h-48 object-contain rounded-xl bg-ink/5" onError={(e) => (e.currentTarget.style.display = 'none')} /></div>}
              <div className="mb-4">
                <label className="text-sm text-ink-soft mb-2 block">Note (optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What inspires you about this?" rows={3} className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none" />
              </div>
              <PinColorPicker pinColor={pinColor} setPinColor={setPinColor} customPinColor={customPinColor} setCustomPinColor={setCustomPinColor} showCustomPinColor={showCustomPinColor} setShowCustomPinColor={setShowCustomPinColor} />
              <button type="submit" disabled={!url || checking} className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{checking ? 'Checking...' : 'Tack it'}</button>
            </form>
          )}

          {mode === "scrape" && (
            <div>
              <div className="mb-4">
                <label className="text-sm text-ink-soft mb-2 block">Page URL</label>
                <div className="flex gap-2">
                  <input type="url" value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://example.com/article" className="flex-1 bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30" />
                  <button type="button" onClick={handleScrape} disabled={!scrapeUrl || scraping} className="px-4 py-2 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/80 transition-colors disabled:opacity-50">{scraping ? "Finding..." : "Find Images"}</button>
                </div>
              </div>
              {scrapedImages.length > 0 && (
                <>
                  <p className="text-sm text-ink-soft mb-3">Found {scrapedImages.length} images from <strong>{scrapedSource}</strong>. Select images to tack:</p>
                  <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
                    {scrapedImages.map((imgUrl, index) => (
                      <button key={index} type="button" onClick={() => toggleImageSelection(imgUrl)} disabled={checking} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImages.has(imgUrl) ? 'border-papaya ring-2 ring-papaya/30' : 'border-transparent hover:border-ink/20'} disabled:opacity-50`}>
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')} />
                        {selectedImages.has(imgUrl) && <div className="absolute top-1 right-1 w-6 h-6 bg-papaya rounded-full flex items-center justify-center"><svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>}
                      </button>
                    ))}
                  </div>
                  <div className="mb-4">
                    <label className="text-sm text-ink-soft mb-2 block">Note for all selected (optional)</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What inspires you about these?" rows={2} className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none" />
                  </div>
                  <PinColorPicker pinColor={pinColor} setPinColor={setPinColor} customPinColor={customPinColor} setCustomPinColor={setCustomPinColor} showCustomPinColor={showCustomPinColor} setShowCustomPinColor={setShowCustomPinColor} />
                  <button type="button" onClick={handleAddSelectedImages} disabled={selectedImages.size === 0 || checking} className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Tack {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}</button>
                </>
              )}
              {scrapedImages.length === 0 && !scraping && <p className="text-sm text-ink-soft text-center py-8">Enter a URL and click &quot;Find Images&quot; to discover images on that page.</p>}
            </div>
          )}
        </div>
      </div>

      {/* AI Confirmation Modal */}
      {showAiConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 stroke-yellow-600 stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink mb-1">This may be AI-generated</h3>
                <p className="text-sm text-ink-soft">{aiWarning}</p>
              </div>
            </div>
            
            <div className="bg-ink/5 rounded-xl p-4 mb-4">
              <p className="text-sm text-ink-soft">
                <strong className="text-ink">Sparkbrd is for human-made inspiration.</strong> We're building a space free from AI-generated content. Uploading AI imagery violates our community standards.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleCancelUpload}
                className="flex-1 px-4 py-3 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Go back
              </button>
              <button 
                onClick={proceedWithUpload}
                className="flex-1 px-4 py-3 bg-ink/10 text-ink rounded-full text-sm font-medium hover:bg-ink/20 transition-colors"
              >
                Upload anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================================
// TEXT DETAIL MODAL
// ============================================================================

function TextDetailModal({
  textBlock,
  onClose,
  onUpdate,
  onDelete,
}: {
  textBlock: TextBlock;
  onClose: () => void;
  onUpdate: (textId: string, updates: Partial<TextBlock>) => void;
  onDelete: (textId: string) => void;
}) {
  const [content, setContent] = useState(textBlock.content);
  const [fontSize, setFontSize] = useState(textBlock.font_size);
  const [color, setColor] = useState(textBlock.color);
  const [fontStyle, setFontStyle] = useState(textBlock.font_style);
  const [rotation, setRotation] = useState(textBlock.rotation);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (
        content !== textBlock.content ||
        fontSize !== textBlock.font_size ||
        color !== textBlock.color ||
        fontStyle !== textBlock.font_style ||
        rotation !== textBlock.rotation
      ) {
        setSaving(true);
        const updates = { content, font_size: fontSize, color, font_style: fontStyle, rotation };
        await supabase.from("text_blocks").update(updates).eq("id", textBlock.id);
        onUpdate(textBlock.id, updates);
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [content, fontSize, color, fontStyle, rotation]);

  const handleDelete = async () => {
    await supabase.from("text_blocks").delete().eq("id", textBlock.id);
    onDelete(textBlock.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-ink-soft">{saving ? "Saving..." : "Edit text"}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center">
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1">Text</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-2">Style</label>
            <div className="flex gap-2">
              {[
                { id: "heading", label: "Heading" },
                { id: "body", label: "Body" },
                { id: "quote", label: "Quote" },
                { id: "label", label: "Label" }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setFontStyle(style.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    fontStyle === style.id ? 'bg-ink text-white' : 'bg-ink/5 text-ink hover:bg-ink/10'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-2">Size</label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-papaya"
            />
            <p className="text-xs text-ink-soft text-center mt-1">{fontSize}px</p>
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-2">Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-ink/10 p-1"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-soft mb-2">Rotation</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setRotation(r => r - 5)} className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-colors">
                <svg className="w-4 h-4 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24"><path d="M2.5 2v6h6M2.66 15a10 10 0 1 0 1.26-8"/></svg>
              </button>
              <input
                type="range"
                min="-45"
                max="45"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="flex-1 accent-papaya"
              />
              <button onClick={() => setRotation(r => r + 5)} className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-colors">
                <svg className="w-4 h-4 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15a10 10 0 1 1-1.26-8"/></svg>
              </button>
              <button onClick={() => setRotation(0)} className="px-2 py-1 text-xs text-ink-soft hover:text-ink">Reset</button>
            </div>
            <p className="text-xs text-ink-soft text-center mt-1">{rotation}°</p>
          </div>

          <div className="bg-ink/5 rounded-xl p-4">
            <p className="text-xs text-ink-soft mb-2">Preview</p>
            <div
              style={{ transform: `rotate(${rotation}deg)` }}
              className="inline-block transition-transform"
            >
              <p
                className={`${
                  fontStyle === 'heading' ? 'font-serif font-bold' :
                  fontStyle === 'quote' ? 'font-serif italic' :
                  fontStyle === 'label' ? 'font-sans uppercase tracking-wide' :
                  'font-sans'
                }`}
                style={{ fontSize, color }}
              >
                {content || "Your text here"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ink/5">
          {confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors">Yes, delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="w-full px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-red-50 hover:text-red-500 transition-colors">Delete text</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADD TEXT MODAL
// ============================================================================

function AddTextModal({ onClose, onAdd }: { onClose: () => void; onAdd: (content: string, fontStyle: string) => void }) {
  const [content, setContent] = useState("");
  const [fontStyle, setFontStyle] = useState("body");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) onAdd(content.trim(), fontStyle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Add text</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center">
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-sm text-ink-soft mb-2 block">Text</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a heading, quote, or note..." rows={3} className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none" required />
          </div>
          <div className="mb-6">
            <label className="text-sm text-ink-soft mb-2 block">Style</label>
            <div className="flex gap-2 flex-wrap">
              {[{ id: "heading", label: "Heading" }, { id: "body", label: "Body" }, { id: "quote", label: "Quote" }, { id: "label", label: "Label" }].map((style) => (
                <button key={style.id} type="button" onClick={() => setFontStyle(style.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${fontStyle === style.id ? 'bg-ink text-white' : 'bg-ink/5 text-ink hover:bg-ink/10'}`}>{style.label}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors">Add text</button>
        </form>
      </div>
    </div>
  );
}