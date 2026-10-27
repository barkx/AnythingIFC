// Landing page copy. Edit text here; layout lives in src/app/page.tsx.

export const STEPS = [
  {
    title: "Upload",
    body: "Start a public project with DWG or DXF drawings, PDF plans, photos or sketches, or just a description. Mix and match.",
  },
  {
    title: "We model",
    body: "We build the model at LOD 100–200, check it against your inputs and write down every assumption we made.",
  },
  {
    title: "Download IFC",
    body: "The model appears on your project page. View it in the browser or download an IFC4 file for Revit, ArchiCAD, Solibri and other BIM tools.",
  },
] as const;

export const INPUTS = [
  { label: "DWG / DXF", body: "2D CAD floor plans, sections and elevations." },
  { label: "PDF plans", body: "Exported or scanned drawing sets." },
  { label: "Images & sketches", body: "Hand sketches, scanned plans, photos with dimensions." },
  { label: "Text", body: "“Two-storey house, 10 × 12 m, four bedrooms, gable roof.”" },
] as const;

export const MODEL_CONTENTS = [
  "Storeys and levels",
  "Walls with thickness and height",
  "Floor slabs and roofs",
  "Doors and windows",
  "Rooms as IfcSpace with names and areas",
  "Base quantities for take-off",
] as const;

export const USE_CASES = [
  {
    title: "Architects & designers",
    body: "Turn legacy 2D drawings into a BIM starting point instead of redrawing them by hand.",
  },
  {
    title: "Contractors & estimators",
    body: "Get quantities and a model for coordination when the client only has PDFs.",
  },
  {
    title: "Homeowners",
    body: "See your sketch or old house plan as a 3D model you can share with architects and builders.",
  },
  {
    title: "Facility managers",
    body: "Build an IFC of existing buildings from archive drawings for operations and maintenance.",
  },
] as const;

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
