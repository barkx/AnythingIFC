// Landing page copy that changes most often. Layout lives in src/app/page.tsx.

export const FAQ = [
  {
    q: "What is IFC?",
    a: "IFC (Industry Foundation Classes) is the open, vendor-neutral standard for BIM models. An IFC file opens in Revit, ArchiCAD, Tekla, Solibri, BIMcollab Zoom and many free viewers.",
  },
  {
    q: "Are projects public?",
    a: "Yes. During early access every project is public: after a quick check, its description, uploaded files and finished model are visible to anyone. Your display name is shown; your email is encrypted and only used to tell you when the model is ready.",
  },
  {
    q: "How long does it take?",
    a: "Every model is built and checked by a person. Expect it within 24–48 hours. If something is unclear we ask on your project page and by email.",
  },
  {
    q: "What level of detail do I get?",
    a: "LOD 100–200: storeys, walls, slabs, roofs, doors, windows and rooms with base quantities. No structural or MEP detail yet.",
  },
  {
    q: "Can I delete my project?",
    a: "Yes. When you create a project you get a private manage link. Use it to edit or delete the project and all its files at any time. Files are never used to train AI models.",
  },
  {
    q: "What does it cost?",
    a: "Early access is free. We'll announce pricing before it changes, and nothing you've already ordered will be charged.",
  },
  {
    q: "Which file sizes are supported?",
    a: "Up to 100 MB per file and 20 files per project. Split very large drawing sets into several files.",
  },
] as const;
