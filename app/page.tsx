"use client";

import { useEffect, useState } from "react";
import data from "./config/data.json";

const SLOT_W = 154; // 140 * 1.1
const SLOT_H = 276; // 251 * 1.1
const PADDING = 15; // tighter minimum distance

export default function TarotExperience() {
  const [spreads, setSpreads] = useState<any[]>(data.spreads);
  const [cards, setCards] = useState<any[]>(data.cards);
  
  const [highestZ, setHighestZ] = useState(10);
  const [isClient, setIsClient] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [readingPhase, setReadingPhase] = useState<"IDLE" | "SCANNING" | "READING">("IDLE");
  const [showPopup, setShowPopup] = useState(false);
  const [lastReadPrompt, setLastReadPrompt] = useState<string | null>(null);
  const [animatingCards, setAnimatingCards] = useState<{ id: string, delay: number }[]>([]);

  // Update prompt state whenever a card is dropped
  useEffect(() => {
    let newPrompt = "";
    cards.forEach(card => {
      if (card.currentX === undefined) return;
      
      const currentSpread = spreads.find(s => 
        s.pxX !== undefined &&
        Math.abs(card.currentX - s.pxX) < SLOT_W / 2 &&
        Math.abs(card.currentY - s.pxY) < SLOT_H / 2
      );

      if (currentSpread) {
        newPrompt += `${card.meaning} | ${currentSpread.meaning}\n`;
      }
    });
    setPrompt(newPrompt);
  }, [cards, spreads]);

  const handleReadCards = async () => {
    if (!prompt.trim()) return;

    if (lastReadPrompt === prompt && readingResult) {
      setShowPopup(true);
      return;
    }

    setReadingPhase("SCANNING");

    // Filter placed cards and trigger animation
    const placedCards = cards.filter(card => {
      if (card.currentX === undefined) return false;
      return spreads.some(s => 
        s.pxX !== undefined &&
        Math.abs(card.currentX - s.pxX) < SLOT_W / 2 &&
        Math.abs(card.currentY - s.pxY) < SLOT_H / 2
      );
    });

    if (placedCards.length > 0) {
      // Sort cards from left to right based on X coordinate
      placedCards.sort((a, b) => a.currentX - b.currentX);
      
      const animState = placedCards.map((c, index) => ({
        id: c.id,
        delay: index * 0.4 // 400ms stagger between cards
      }));
      setAnimatingCards(animState);
      
      // Wait for the animation to finish before proceeding with the fetch
      // Total time = max delay + 1s (animation duration)
      const maxDelay = (placedCards.length - 1) * 0.4 + 1;
      await new Promise(r => setTimeout(r, maxDelay * 1000));
      
      setAnimatingCards([]);
    }

    if (data.sendToGemini === false) {
      setReadingPhase("IDLE");
      return; // Stop here, do not call Gemini
    }

    setReadingPhase("READING");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (data.text) {
        setReadingResult(data.text);
        setLastReadPrompt(prompt);
        setShowPopup(true);
      } else {
        console.error("Error:", data.error);
        alert("Failed to read cards.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while fetching the reading.");
    } finally {
      setReadingPhase("IDLE");
    }
  };

  useEffect(() => {
    setIsClient(true);
    const isMobile = window.innerWidth < 768;
    
    // Tighter clustering to keep them near each other
    // Ensure we have enough space for 10 slots, but tighter area.
    const clusterWidth = Math.max(window.innerWidth * 0.9, 800);
    const clusterHeight = Math.max(window.innerHeight * 1.1, 900);
    
    const placedSpreads: any[] = [];

    data.spreads.forEach((spread) => {
      let attempts = 0;
      let overlap = true;
      let randX = 0;
      let randY = 0;
      
      while (overlap && attempts < 1000) {
        overlap = false;
        
        const minX = SLOT_W / 2 + PADDING;
        const maxX = clusterWidth - SLOT_W / 2 - PADDING;
        const minY = SLOT_H / 2 + PADDING;
        const maxY = clusterHeight - SLOT_H / 2 - PADDING;
        
        randX = Math.random() * (maxX - minX) + minX;
        randY = Math.random() * (maxY - minY) + minY;
        
        for (const p of placedSpreads) {
          const distBaseX = SLOT_W + PADDING;
          const distBaseY = SLOT_H + PADDING;
          if (Math.abs(randX - p.pxX) < distBaseX && Math.abs(randY - p.pxY) < distBaseY) {
            overlap = true;
            break;
          }
        }
        attempts++;
      }
      
      placedSpreads.push({ ...spread, pxX: randX, pxY: randY });
    });

    const randomizedCards = data.cards
      .filter((card: any) => card.isVisible !== false)
      .map((card) => {
        const minX = SLOT_W / 2;
      const maxX = window.innerWidth - SLOT_W / 2;
      const minY = isMobile ? window.innerHeight * 0.8 : window.innerHeight / 2;
      const maxY = clusterHeight - SLOT_H / 2;

      const randomX = Math.random() * (maxX - minX) + minX;
      const randomY = Math.random() * (maxY - minY) + minY;
      return { ...card, currentX: randomX, currentY: randomY };
    });

    setSpreads(placedSpreads);
    setCards(randomizedCards);
  }, []);

  const handlePointerDown = (e: React.PointerEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const initialLeft = rect.left + rect.width / 2 + scrollX;
    const initialTop = rect.top + rect.height / 2 + scrollY;

    const startX = e.pageX;
    const startY = e.pageY;

    setHighestZ(z => z + 1);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.pageX - startX;
      const dy = moveEvent.pageY - startY;

      setCards(prev => prev.map(c => 
        c.id === cardId 
          ? { ...c, currentX: initialLeft + dx, currentY: initialTop + dy } 
          : c
      ));
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", onPointerUp);
    
    setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, zIndex: highestZ + 1 } : c
    ));
  };

  const handleBoardPointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollX = window.scrollX;
    const startScrollY = window.scrollY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      window.scrollTo(startScrollX - dx, startScrollY - dy);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", onPointerUp);
  };

  if (!isClient) return null;

  return (
    <>
      <div 
        className="relative cursor-grab active:cursor-grabbing" 
        style={{ minHeight: "150vh", minWidth: "150vw", touchAction: "none" }}
        onPointerDown={handleBoardPointerDown}
      >
        <header className="absolute top-8 left-8 flex justify-between items-start z-10 pointer-events-none" style={{ width: "calc(100vw - 4rem)" }}>
          <h1 className="font-normal text-2xl tracking-widest uppercase pointer-events-auto">
            {data.title}
          </h1>
          <div className="max-w-[300px] text-xs leading-relaxed text-right pointer-events-auto whitespace-pre-wrap hidden md:block">
            {data.introText}
          </div>
        </header>

        <div className="fixed top-1/2 left-4 -translate-y-1/2 -rotate-90 origin-center text-[10px] tracking-widest uppercase pointer-events-none z-20 text-[#E6231D] bg-black p-[5px]">
          DRAG CARDS
        </div>
        <div className="fixed top-1/2 right-4 -translate-y-1/2 rotate-90 origin-center text-[10px] tracking-widest uppercase pointer-events-none z-20 text-[#E6231D] bg-black p-[5px]">
          DRAG AROUND SCREEN
        </div>

        <main className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {spreads.map((spread) => {
            if (spread.pxX === undefined) return null;
            return (
              <div
                key={spread.id}
                className="spread-slot-wrapper pointer-events-auto"
                style={{ left: `${spread.pxX}px`, top: `${spread.pxY}px` }}
              >
                <div className="spread-slot-label">{spread.label}</div>
                <div className="spread-slot" id={spread.id}></div>
              </div>
            );
          })}

          {cards.map((card: any) => {
            if (card.currentX === undefined) return null;
            
            const animConfig = animatingCards.find(a => a.id === card.id);
            const isHolo = !!animConfig;
            const isOuterGlow = card.isOuterGlowCard === true;

            return (
              <div
                key={card.id}
                className={`tarot-card pointer-events-auto ${isHolo ? 'holo-active' : ''} ${isHolo && isOuterGlow ? 'holo-glow-active' : ''}`}
                id={card.id}
                onPointerDown={(e) => handlePointerDown(e, card.id)}
                style={{
                  backgroundImage: `url('${card.image}')`,
                  left: `${card.currentX}px`,
                  top: `${card.currentY}px`,
                  zIndex: card.zIndex || 10,
                  ...(isHolo ? { '--holo-delay': `${animConfig.delay}s` } as any : {})
                }}
              ></div>
            );
          })}
        </main>
      </div>

      {/* Card Location Tracker (Rendered outside the 150vw container to guarantee viewport fixing) */}
      {data.isLocationVisible !== false && (
        <div className="fixed bottom-8 right-8 bg-white p-4 border border-[#E6231D] text-[#E6231D] text-xs z-50 pointer-events-none uppercase tracking-wider max-w-sm">
          <h3 className="font-bold mb-2">Card Locations</h3>
          {cards.map(card => {
            if (card.currentX === undefined) return null;
            
            // Check if center of card is inside any spread bounds
            const currentSpread = spreads.find(s => 
              s.pxX !== undefined &&
              Math.abs(card.currentX - s.pxX) < SLOT_W / 2 &&
              Math.abs(card.currentY - s.pxY) < SLOT_H / 2
            );

            // Format card name slightly better (e.g. "card-1" -> "CARD 1")
            const cardName = card.id.replace("-", " ");
            
            return (
              <div key={card.id} className="mb-1 flex justify-between gap-4">
                <span>{cardName}:</span>
                <span className="font-bold">{currentSpread ? `Spread ${currentSpread.label}` : "NONE"}</span>
              </div>
            );
          })}

          {/* Prompt State View */}
          <div className="mt-4 pt-4 border-t border-[#E6231D] pointer-events-auto">
            <h3 className="font-bold mb-2">Generated Prompt State:</h3>
            <textarea 
              readOnly 
              className="w-full text-[10px] bg-transparent outline-none resize-none h-24"
              value={prompt}
              placeholder="Waiting for cards to be placed in spreads..."
            />
          </div>
        </div>
      )}

      {/* Read Cards Button */}
      {prompt.trim().length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={handleReadCards}
            disabled={readingPhase !== "IDLE"}
            className="bg-black text-[#E6231D] border border-[#E6231D] px-8 py-3 uppercase tracking-widest text-sm font-bold hover:bg-[#E6231D] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {readingPhase === "SCANNING" ? "SCANNING..." : readingPhase === "READING" ? "CONSULTING ORACLE..." : (lastReadPrompt === prompt && readingResult) ? "VIEW AGAIN" : "READ CARDS"}
          </button>
        </div>
      )}

      {/* Reading Popup Modal */}
      {showPopup && readingResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#111] border border-[#E6231D] text-[#F0F0F0] max-w-lg w-full p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-[#E6231D] hover:text-white text-2xl leading-none"
            >
              &times;
            </button>
            <h2 className="text-[#E6231D] text-xl tracking-widest uppercase mb-6 font-bold border-b border-[#E6231D] pb-2">Your Reading</h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {readingResult}
            </div>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setShowPopup(false)}
                className="bg-transparent border border-[#E6231D] text-[#E6231D] hover:bg-[#E6231D] hover:text-white transition-colors px-6 py-2 uppercase tracking-widest text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
