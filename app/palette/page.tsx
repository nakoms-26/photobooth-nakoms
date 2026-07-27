import React from "react";

export default function PalettePage() {
  const colorGroups = [
    {
      name: "Brand Colors",
      colors: [
        { name: "Primary", class: "bg-primary", hex: "#10069f", text: "text-white" },
        { name: "Secondary", class: "bg-secondary", hex: "#fae03c", text: "text-black" },
      ],
    },
    {
      name: "Supporting Colors",
      colors: [
        { name: "Danger", class: "bg-danger", hex: "#dd0000", text: "text-white" },
        { name: "Orange", class: "bg-orange", hex: "#ff7900", text: "text-black" },
        { name: "Sky", class: "bg-sky", hex: "#008dd1", text: "text-white" },
        { name: "Navy", class: "bg-navy", hex: "#001f67", text: "text-white" },
      ],
    },
    {
      name: "Semantic & Neutral",
      colors: [
        { name: "Background", class: "bg-background", hex: "#ffffff", text: "text-black" },
        { name: "Surface", class: "bg-surface", hex: "#f8fafc", text: "text-black" },
        { name: "White", class: "bg-white", hex: "#ffffff", text: "text-black" },
        { name: "Black", class: "bg-black", hex: "#000000", text: "text-white" },
      ],
    },
    {
      name: "State Colors",
      colors: [
        { name: "Success", class: "bg-success", hex: "#16a34a", text: "text-white" },
        { name: "Warning", class: "bg-warning", hex: "var(--color-orange)", text: "text-black" },
        { name: "Info", class: "bg-info", hex: "var(--color-sky)", text: "text-white" },
        { name: "Error", class: "bg-error", hex: "var(--color-danger)", text: "text-white" },
      ],
    },
    {
      name: "Gray Scale",
      colors: [
        { name: "Gray 50", class: "bg-gray-50", hex: "#f8fafc", text: "text-black" },
        { name: "Gray 100", class: "bg-gray-100", hex: "#f1f5f9", text: "text-black" },
        { name: "Gray 200 (Border)", class: "bg-gray-200", hex: "#e2e8f0", text: "text-black" },
        { name: "Gray 300", class: "bg-gray-300", hex: "#cbd5e1", text: "text-black" },
        { name: "Gray 400 (Muted)", class: "bg-gray-400", hex: "#94a3b8", text: "text-black" },
        { name: "Gray 500", class: "bg-gray-500", hex: "#64748b", text: "text-white" },
        { name: "Gray 600 (Secondary)", class: "bg-gray-600", hex: "#475569", text: "text-white" },
        { name: "Gray 700", class: "bg-gray-700", hex: "#334155", text: "text-white" },
        { name: "Gray 800", class: "bg-gray-800", hex: "#1e293b", text: "text-white" },
        { name: "Gray 900 (Text)", class: "bg-gray-900", hex: "#0f172a", text: "text-white" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-grid py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 neo-box p-8 bg-white max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-chillax font-bold text-gray-900">
            Design System Palette
          </h1>
          <p className="text-gray-600 text-lg">
            A visual overview of the newly implemented colors and neo-brutalist variables.
          </p>
        </div>

        {/* Color Groups */}
        {colorGroups.map((group, idx) => (
          <div key={idx} className="space-y-6">
            <h2 className="text-2xl font-bold font-chillax text-gray-900 border-b-4 border-black pb-2 inline-block">
              {group.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {group.colors.map((color, i) => (
                <div
                  key={i}
                  className="neo-box flex flex-col overflow-hidden group hover:-translate-y-1 transition-transform"
                >
                  <div
                    className={`h-28 w-full ${color.class} flex items-center justify-center border-b-2 border-black p-4 transition-colors`}
                  >
                    <span
                      className={`${color.text} font-bold opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      {color.class.replace("bg-", "")}
                    </span>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-1 border-t-0">
                    <span className="font-bold text-gray-900 line-clamp-1">{color.name}</span>
                    <span className="text-sm text-gray-500 uppercase">{color.hex}</span>
                    <code className="text-xs bg-gray-100 p-1.5 rounded border border-gray-200 mt-2 text-center text-gray-700">
                      text-{color.class.replace("bg-", "")}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Component Showcase */}
        <div className="space-y-6 pt-8">
            <h2 className="text-2xl font-bold font-chillax text-gray-900 border-b-4 border-black pb-2 inline-block">
              Component Preview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="neo-btn-primary py-4 px-6 text-lg">Primary Button</button>
                <button className="neo-btn-yellow py-4 px-6 text-lg">Secondary Button</button>
                <button className="neo-btn-danger py-4 px-6 text-lg">Danger Button</button>
            </div>
        </div>
      </div>
    </main>
  );
}
