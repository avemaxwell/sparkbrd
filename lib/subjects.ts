import type { ComponentType } from "react";
import {
  IconPalette, IconLaptop, IconCubes, IconGraduationCap, IconBook, IconTestTube,
  IconGlobe, IconHeart, IconWrench, IconMusicNote, IconCamera, IconPencil,
  IconBrain, IconTheatreMasks, IconCalculator,
} from "@/components/icons";

export interface Subcategory {
  name: string;
  slug: string;
}

export interface SubjectDef {
  slug: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  textOn: "ink" | "white";
  subcategories: Subcategory[];
}

// The fixed 8-color subject palette. Every subject card, its hero background,
// and anywhere else that subject's identity color appears all draw from this
// same list, so a subject reads as one consistent color everywhere it shows
// up. `textOn` is pre-computed per color (not derived at runtime) so text
// contrast is guaranteed regardless of which color a subject lands on.
export const SUBJECT_PALETTE: { hex: string; textOn: "ink" | "white" }[] = [
  { hex: "#C3BBF9", textOn: "ink" },   // Lavender background
  { hex: "#E4FE97", textOn: "ink" },   // Neon yellow-green
  { hex: "#5ECC71", textOn: "ink" },   // Bright green
  { hex: "#4D49F5", textOn: "white" }, // Electric blue-violet
  { hex: "#EA33E5", textOn: "white" }, // Hot magenta
  { hex: "#ED7035", textOn: "white" }, // Bright orange
  { hex: "#721C1C", textOn: "white" }, // Dark burgundy
  { hex: "#F6C8C1", textOn: "ink" },   // Pale blush pink
];

export function slugify(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sub(name: string): Subcategory {
  return { name, slug: slugify(name) };
}

const SUBJECT_DEFS: Omit<SubjectDef, "slug" | "color" | "textOn">[] = [
  {
    name: "Visual Art", icon: IconPalette,
    description: "Resources, lessons, and ideas for teaching drawing, painting, ceramics, and visual expression.",
    subcategories: [sub("All Art"), sub("Drawing & Painting"), sub("Ceramics"), sub("Sculpture"), sub("Digital Art"), sub("Art History")],
  },
  {
    name: "Technology", icon: IconLaptop,
    description: "Resources, lessons, and ideas for teaching tech skills that empower today's learners.",
    subcategories: [sub("All Tech"), sub("Coding & CS"), sub("Digital Literacy"), sub("Robotics"), sub("Hardware"), sub("AI & Data"), sub("Design & Media")],
  },
  {
    name: "Elementary", icon: IconCubes,
    description: "Foundational resources and playful lessons built for young learners.",
    subcategories: [sub("All Elementary"), sub("Early Literacy"), sub("Math Foundations"), sub("Science Exploration"), sub("Social Skills"), sub("Arts & Crafts")],
  },
  {
    name: "Higher Education", icon: IconGraduationCap,
    description: "Resources for college and university instructors designing modern courses.",
    subcategories: [sub("All Higher Ed"), sub("Syllabus Design"), sub("Assessment"), sub("Research Methods"), sub("Online Learning")],
  },
  {
    name: "Math", icon: IconCalculator,
    description: "Resources for teaching arithmetic, algebra, geometry, and problem solving.",
    subcategories: [sub("All Math"), sub("Arithmetic"), sub("Algebra"), sub("Geometry"), sub("Fractions & Decimals"), sub("Word Problems")],
  },
  {
    name: "ELA", icon: IconBook,
    description: "Resources for teaching reading, writing, grammar, and literature.",
    subcategories: [sub("All ELA"), sub("Reading Comprehension"), sub("Writing"), sub("Grammar & Language"), sub("Literature"), sub("Public Speaking")],
  },
  {
    name: "Science", icon: IconTestTube,
    description: "Hands-on resources for biology, chemistry, physics, and earth science classrooms.",
    subcategories: [sub("All Science"), sub("Biology"), sub("Chemistry"), sub("Physics"), sub("Earth Science"), sub("Environmental Science")],
  },
  {
    name: "Social Studies", icon: IconGlobe,
    description: "Resources for teaching history, geography, civics, and cultures around the world.",
    subcategories: [sub("All Social Studies"), sub("History"), sub("Geography"), sub("Civics"), sub("Economics"), sub("Cultural Studies")],
  },
  {
    name: "Special Education", icon: IconHeart,
    description: "Resources for differentiation, IEP support, and inclusive classroom practices.",
    subcategories: [sub("All Special Ed"), sub("IEP Resources"), sub("Behavior Support"), sub("Assistive Tech"), sub("Differentiation")],
  },
  {
    name: "CTE", icon: IconWrench,
    description: "Career and technical education resources across trades, business, and healthcare.",
    subcategories: [sub("All CTE"), sub("Skilled Trades"), sub("Business & Finance"), sub("Healthcare"), sub("Culinary"), sub("Agriculture")],
  },
  {
    name: "Music", icon: IconMusicNote,
    description: "Resources for instrumental, vocal, and general music education.",
    subcategories: [sub("All Music"), sub("Instrumental"), sub("Vocal"), sub("Music Theory"), sub("Music Tech"), sub("Ensemble")],
  },
  {
    name: "Photography", icon: IconCamera,
    description: "Resources for teaching composition, editing, and visual storytelling.",
    subcategories: [sub("All Photography"), sub("Composition"), sub("Portrait"), sub("Editing"), sub("Photojournalism")],
  },
  {
    name: "Drama", icon: IconTheatreMasks,
    description: "Resources, lessons, and ideas for teaching acting, stagecraft, and theatrical storytelling.",
    subcategories: [sub("All Drama"), sub("Acting"), sub("Scene Study"), sub("Devised Theatre"), sub("Design & Tech"), sub("Voice & Movement")],
  },
  {
    name: "Graphic Design", icon: IconPencil,
    description: "Resources for typography, branding, and digital design tools.",
    subcategories: [sub("All Design"), sub("Typography"), sub("Branding"), sub("Digital Tools"), sub("Print Design")],
  },
];

export const SUBJECTS: Record<string, SubjectDef> = Object.fromEntries(
  SUBJECT_DEFS.map((s, i) => {
    const slug = slugify(s.name);
    const { hex, textOn } = SUBJECT_PALETTE[i % SUBJECT_PALETTE.length];
    return [slug, { ...s, slug, color: hex, textOn }];
  })
);

export const SUBJECT_LIST = Object.values(SUBJECTS);

function genericSubject(slug: string): SubjectDef {
  const name = slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  const { hex, textOn } = SUBJECT_PALETTE[hashStr(slug) % SUBJECT_PALETTE.length];
  return {
    slug, name, icon: IconBrain, color: hex, textOn,
    description: `Resources, lessons, and ideas for teaching ${name}.`,
    subcategories: [sub(`All ${name}`)],
  };
}

export function getSubject(slug: string): SubjectDef {
  return SUBJECTS[slug] ?? genericSubject(slug);
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const RESOURCE_TYPES = ["Lesson", "Worksheet", "Activity", "Project", "Template", "Assessment"] as const;
export const GRADE_BANDS = ["K-5", "6-8", "9-12", "College"] as const;
