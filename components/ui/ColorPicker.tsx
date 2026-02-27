"use client";

import { useState, useRef, useEffect } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [hexInput, setHexInput] = useState(color);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Parse hex to HSB on mount and when color prop changes
  useEffect(() => {
    const rgb = hexToRgb(color);
    if (rgb) {
      const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
      setHue(hsb.h);
      setSaturation(hsb.s);
      setBrightness(hsb.b);
      setHexInput(color);
    }
  }, [color]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsb = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, b: v * 100 };
  };

  const hsbToHex = (h: number, s: number, b: number) => {
    s /= 100; b /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
  };

  const updateColor = (h: number, s: number, b: number) => {
    const hex = hsbToHex(h, s, b);
    setHexInput(hex);
    onChange(hex);
  };

  const handleFieldMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateFromMouse = (e: MouseEvent | React.MouseEvent) => {
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const newSat = x * 100;
      const newBright = (1 - y) * 100;
      setSaturation(newSat);
      setBrightness(newBright);
      updateColor(hue, newSat, newBright);
    };

    updateFromMouse(e);

    const handleMouseMove = (e: MouseEvent) => updateFromMouse(e);
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateFromMouse = (e: MouseEvent | React.MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newHue = x * 360;
      setHue(newHue);
      updateColor(newHue, saturation, brightness);
    };

    updateFromMouse(e);

    const handleMouseMove = (e: MouseEvent) => updateFromMouse(e);
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
      const rgb = hexToRgb(value);
      if (rgb) {
        const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
        setHue(hsb.h);
        setSaturation(hsb.s);
        setBrightness(hsb.b);
      }
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      {label && <p className="text-xs text-ink-soft mb-1">{label}</p>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-xl border-2 border-ink/10 hover:border-ink/20 transition-colors overflow-hidden"
        style={{ backgroundColor: color }}
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-ink/10 z-50 w-64">
          {/* Saturation/Brightness Field */}
          <div
            ref={fieldRef}
            className="w-full h-40 rounded-xl cursor-crosshair relative mb-3"
            style={{
              background: `
                linear-gradient(to top, #000, transparent),
                linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
              `
            }}
            onMouseDown={handleFieldMouseDown}
          >
            {/* Picker dot */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${saturation}%`,
                top: `${100 - brightness}%`,
                backgroundColor: color
              }}
            />
          </div>

          {/* Hue Slider */}
          <div
            ref={hueRef}
            className="w-full h-4 rounded-full cursor-pointer relative mb-4"
            style={{
              background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
            }}
            onMouseDown={handleHueMouseDown}
          >
            {/* Hue handle */}
            <div
              className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                backgroundColor: `hsl(${hue}, 100%, 50%)`
              }}
            />
          </div>

          {/* Hex Input */}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg border border-ink/10 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-3 py-2 bg-ink/5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-papaya/20 uppercase"
            />
          </div>
        </div>
      )}
    </div>
  );
}