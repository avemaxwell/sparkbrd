"use client";

import { useState } from "react";

export default function FloatingTackButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full bg-papaya text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-serif text-2xl mb-4">It works!</h2>
            <button 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-papaya text-white rounded-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}