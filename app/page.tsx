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
  const [preloadStatus, setPreloadStatus] = useState<"LOADING" | "READY" | "COMPLETED">("LOADING");
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [readingPhase, setReadingPhase] = useState<"IDLE" | "SCANNING" | "READING">("IDLE");
  const [showPopup, setShowPopup] = useState(false);
  const [lastReadPrompt, setLastReadPrompt] = useState<string | null>(null);
  const [animatingCards, setAnimatingCards] = useState<{ id: string, delay: number }[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

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
    
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    setIsTouchDevice(isTouch);
    const isMobile = window.innerWidth < 768;
    setIsMobileView(isMobile);
    
    // Only expand cluster width on mobile to allow cards to spread out horizontally
    const clusterWidth = isMobile ? Math.max(window.innerWidth * 3, 1100) : window.innerWidth;
    const clusterHeight = isMobile ? Math.max(window.innerHeight * 2.5, 1800) : Math.max(window.innerHeight * 1.1, 900);
    
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
        
        // Avoid the top-left area where the header (Ernest Pascual, Creative Technologist, and [ View Instructions ]) resides
        // Bounding box: X in [0, 350], Y in [0, 180]
        if (randX - SLOT_W / 2 < 350 && randY - SLOT_H / 2 < 180) {
          overlap = true;
          attempts++;
          continue;
        }

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

    // Preload all cards and wait for fonts before displaying Let's Go
    const allCards = data.cards;
    const totalAssets = allCards.length + 1; // cards + fonts
    setTotalCount(totalAssets);
    let loaded = 0;

    const incrementLoaded = () => {
      loaded = Math.min(loaded + 1, totalAssets);
      setLoadedCount(loaded);
    };

    const imagePromises = allCards.map((card: any) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          incrementLoaded();
          resolve();
        };
        img.onerror = () => {
          incrementLoaded();
          resolve();
        };
        img.src = card.image;
      });
    });

    const fontPromise = document.fonts.ready.then(() => {
      incrementLoaded();
    });

    Promise.all([...imagePromises, fontPromise]).then(() => {
      setTimeout(() => {
        setPreloadStatus("READY");
      }, 800); // Small delay for aesthetic booting sequence
    });

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
    const targetElement = e.target as HTMLElement;
    if (
      targetElement.closest("button") ||
      targetElement.closest("a") ||
      targetElement.closest("textarea") ||
      targetElement.closest(".tarot-card")
    ) {
      return;
    }

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollX = window.scrollX;
    const startScrollY = window.scrollY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (isMobileView) {
        // Allow horizontal and vertical scrolling on mobile
        window.scrollTo(startScrollX - dx, startScrollY - dy);
      } else {
        // Scroll vertically only on desktop
        window.scrollTo(startScrollX, startScrollY - dy);
      }
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

  if (preloadStatus !== "COMPLETED") {
    const percentage = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[999] pointer-events-auto select-none">
        <div className="max-w-md w-full px-8 flex flex-col items-center">
          <h1 className="text-white text-3xl font-bold tracking-[0.25em] uppercase mb-1 text-center font-iosevka">
            ERNEST PASCUAL
          </h1>
          <h2 className="text-[#E6231D] text-xs tracking-[0.3em] uppercase mb-16 text-center font-normal font-iosevka">
            CREATIVE TECHNOLOGIST
          </h2>

          {preloadStatus === "LOADING" ? (
            <div className="w-full flex flex-col items-center font-iosevka">
              <div className="text-[#E6231D] text-[10px] tracking-[0.2em] uppercase mb-4 h-6 text-center">
                {loadedCount < totalCount - 1
                  ? `RETRIEVING ARCHETYPES (${loadedCount}/${totalCount - 1})...`
                  : "TUNING NEURAL NETWORKS..."
                }
              </div>

              {/* Progress Bar */}
              <div className="w-64 h-[2px] bg-neutral-900 relative overflow-hidden border border-neutral-800">
                <div 
                  className="h-full bg-[#E6231D] transition-all duration-300 ease-out shadow-[0_0_8px_#E6231D]" 
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="text-[#888] text-[9px] tracking-widest uppercase mt-4">
                {percentage}% LOADED
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-fadeIn font-iosevka">
              <button
                onClick={() => {
                  setPreloadStatus("COMPLETED");
                  setShowInstructionPopup(true);
                }}
                className="bg-transparent text-white border border-[#E6231D] px-10 py-4 uppercase tracking-[0.3em] text-xs font-bold hover:bg-[#E6231D] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(230,35,29,0.3)] hover:shadow-[0_0_25px_rgba(230,35,29,0.6)] cursor-pointer active:scale-95"
              >
                LET'S GO
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative ${!isTouchDevice ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ 
          minHeight: isMobileView ? "300vh" : "150vh", 
          minWidth: isMobileView ? "300vw" : "100%", 
          maxWidth: isMobileView ? "none" : "100vw", 
          touchAction: isTouchDevice ? "auto" : "none" 
        }}
        onPointerDown={isTouchDevice ? undefined : handleBoardPointerDown}
      >
        <header className="absolute top-8 left-8 flex flex-col items-start z-10 pointer-events-none gap-1">
          <div className="flex flex-col pointer-events-auto">
            <h1 className="font-normal text-2xl tracking-widest uppercase">
              {data.title || "ERNEST PASCUAL"}
            </h1>
            <div className="text-xs tracking-[0.2em] uppercase text-[#E6231D] mt-1 mb-2 font-bold">
              Creative Technologist
            </div>
            <button
              onClick={() => setShowInstructionPopup(true)}
              className="text-[#888] hover:text-white text-[10px] tracking-widest uppercase hover:underline text-left cursor-pointer transition-colors"
            >
              [ View Instructions ]
            </button>
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={handleReadCards}
          disabled={prompt.trim().length === 0 || readingPhase !== "IDLE"}
          className="bg-black text-[#E6231D] border border-[#E6231D] px-8 py-3 uppercase tracking-widest text-sm font-bold hover:bg-[#E6231D] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {readingPhase === "SCANNING" ? "SCANNING..." : readingPhase === "READING" ? "CONSULTING ORACLE..." : (lastReadPrompt === prompt && readingResult) ? "VIEW AGAIN" : "READ CARDS"}
        </button>
      </div>

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

      {/* Instructions Popup Modal */}
      {showInstructionPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#111] border border-[#E6231D] text-[#F0F0F0] max-w-md w-full p-8 relative shadow-2xl animate-fadeIn">
            <button 
              onClick={() => setShowInstructionPopup(false)}
              className="absolute top-4 right-4 text-[#E6231D] hover:text-white text-2xl leading-none cursor-pointer"
            >
              &times;
            </button>
            <h2 className="text-[#E6231D] text-base tracking-[0.2em] uppercase mb-6 font-bold border-b border-[#E6231D] pb-2 font-iosevka">
              INSTRUCTIONS
            </h2>
            <div className="text-sm leading-relaxed space-y-4 text-[#CCCCCC] font-iosevka">
              <p>
                Hi I'm Ernest and I am a Creative Technologist. If you want to know about what I do place 1 or all cards within the boxes and click READ CARDS.
              </p>
              <p>
                The position of the boxes that give meaning are randomized using the current state of time.
              </p>
              <p>
                It's archetype-based cards about what I do that you can drag around and place in certain areas where it can find meaning.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setShowInstructionPopup(false)}
                className="bg-[#E6231D] text-black border border-[#E6231D] hover:bg-transparent hover:text-[#E6231D] transition-colors px-8 py-3 uppercase tracking-widest text-xs font-bold shadow-lg cursor-pointer"
              >
                BEGIN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
