import type { ComponentType } from "react";
import type { BadgeKey, ResourceCardData } from "@/components/ResourceCard";
import {
  IconPalette, IconLaptop, IconCubes, IconGraduationCap, IconBook, IconTestTube,
  IconGlobe, IconHeart, IconWrench, IconMusicNote, IconCamera, IconPencil,
  IconAtom, IconVase, IconBrain,
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
  followerCount: string;
  trending: string[];
  resourceTypes: { label: string; count: number }[];
  curated: { title: string; description: string };
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
    followerCount: "18.3K", trending: ["Mixed Media", "Clay Hand-Building", "Portrait Drawing", "Color Theory", "Art Portfolios"],
    resourceTypes: [{ label: "Lessons", count: 286 }, { label: "Projects", count: 154 }, { label: "Activities", count: 91 }, { label: "Templates", count: 42 }, { label: "Assessments", count: 33 }],
    curated: { title: "Intro to Ceramics", description: "Handpicked resources to start your ceramics journey." },
  },
  {
    name: "Technology", icon: IconLaptop,
    description: "Resources, lessons, and ideas for teaching tech skills that empower today's learners.",
    subcategories: [sub("All Tech"), sub("Coding & CS"), sub("Digital Literacy"), sub("Robotics"), sub("Hardware"), sub("AI & Data"), sub("Design & Media")],
    followerCount: "24.1K", trending: ["AI in Education", "Cybersecurity", "Robotics", "App Development", "Digital Citizenship"],
    resourceTypes: [{ label: "Lessons", count: 412 }, { label: "Projects", count: 198 }, { label: "Activities", count: 112 }, { label: "Templates", count: 74 }, { label: "Assessments", count: 68 }],
    curated: { title: "Intro to Computer Science", description: "Handpicked resources to start your CS journey." },
  },
  {
    name: "Elementary", icon: IconCubes,
    description: "Foundational resources and playful lessons built for young learners.",
    subcategories: [sub("All Elementary"), sub("Early Literacy"), sub("Math Foundations"), sub("Science Exploration"), sub("Social Skills"), sub("Arts & Crafts")],
    followerCount: "21.7K", trending: ["Phonics Games", "Number Sense", "Classroom Routines", "SEL Check-Ins", "Sensory Activities"],
    resourceTypes: [{ label: "Lessons", count: 358 }, { label: "Activities", count: 264 }, { label: "Projects", count: 88 }, { label: "Templates", count: 51 }, { label: "Assessments", count: 40 }],
    curated: { title: "First 30 Days", description: "Handpicked resources for starting the school year strong." },
  },
  {
    name: "Higher Education", icon: IconGraduationCap,
    description: "Resources for college and university instructors designing modern courses.",
    subcategories: [sub("All Higher Ed"), sub("Syllabus Design"), sub("Assessment"), sub("Research Methods"), sub("Online Learning")],
    followerCount: "9.8K", trending: ["Backward Design", "Rubric Design", "Hybrid Courses", "Academic Integrity", "Office Hours 2.0"],
    resourceTypes: [{ label: "Syllabi", count: 76 }, { label: "Lessons", count: 132 }, { label: "Templates", count: 58 }, { label: "Assessments", count: 47 }],
    curated: { title: "Course Design Essentials", description: "Handpicked resources for building your next course." },
  },
  {
    name: "ELA", icon: IconBook,
    description: "Resources for teaching reading, writing, grammar, and literature.",
    subcategories: [sub("All ELA"), sub("Reading Comprehension"), sub("Writing"), sub("Grammar & Language"), sub("Literature"), sub("Public Speaking")],
    followerCount: "27.4K", trending: ["Close Reading", "Argumentative Writing", "Vocabulary Building", "Book Clubs", "Socratic Seminars"],
    resourceTypes: [{ label: "Lessons", count: 401 }, { label: "Units", count: 122 }, { label: "Activities", count: 176 }, { label: "Assessments", count: 84 }],
    curated: { title: "Novel Study Starter Kit", description: "Handpicked resources for your next class novel." },
  },
  {
    name: "Science", icon: IconTestTube,
    description: "Hands-on resources for biology, chemistry, physics, and earth science classrooms.",
    subcategories: [sub("All Science"), sub("Biology"), sub("Chemistry"), sub("Physics"), sub("Earth Science"), sub("Environmental Science")],
    followerCount: "23.5K", trending: ["Lab Safety", "Climate Science", "Genetics", "Forces & Motion", "Citizen Science"],
    resourceTypes: [{ label: "Labs", count: 214 }, { label: "Lessons", count: 329 }, { label: "Activities", count: 148 }, { label: "Assessments", count: 71 }],
    curated: { title: "No-Prep Labs", description: "Handpicked labs that need minimal setup time." },
  },
  {
    name: "Social Studies", icon: IconGlobe,
    description: "Resources for teaching history, geography, civics, and cultures around the world.",
    subcategories: [sub("All Social Studies"), sub("History"), sub("Geography"), sub("Civics"), sub("Economics"), sub("Cultural Studies")],
    followerCount: "16.9K", trending: ["Primary Sources", "Map Skills", "Elections & Voting", "World Cultures", "Debate Units"],
    resourceTypes: [{ label: "Lessons", count: 287 }, { label: "Units", count: 94 }, { label: "Activities", count: 133 }, { label: "Assessments", count: 55 }],
    curated: { title: "Primary Source Toolkit", description: "Handpicked resources for document-based learning." },
  },
  {
    name: "Special Education", icon: IconHeart,
    description: "Resources for differentiation, IEP support, and inclusive classroom practices.",
    subcategories: [sub("All Special Ed"), sub("IEP Resources"), sub("Behavior Support"), sub("Assistive Tech"), sub("Differentiation")],
    followerCount: "14.2K", trending: ["Visual Schedules", "Sensory Breaks", "Co-Teaching", "IEP Goal Banks", "Social Stories"],
    resourceTypes: [{ label: "Resources", count: 198 }, { label: "Templates", count: 112 }, { label: "Activities", count: 87 }, { label: "Assessments", count: 39 }],
    curated: { title: "Inclusive Classroom Starter Kit", description: "Handpicked resources for day one." },
  },
  {
    name: "CTE", icon: IconWrench,
    description: "Career and technical education resources across trades, business, and healthcare.",
    subcategories: [sub("All CTE"), sub("Skilled Trades"), sub("Business & Finance"), sub("Healthcare"), sub("Culinary"), sub("Agriculture")],
    followerCount: "8.6K", trending: ["Industry Certifications", "Work-Based Learning", "Resume Building", "Shop Safety", "Entrepreneurship"],
    resourceTypes: [{ label: "Lessons", count: 143 }, { label: "Projects", count: 96 }, { label: "Certifications", count: 28 }, { label: "Assessments", count: 34 }],
    curated: { title: "Industry Certification Prep", description: "Handpicked resources to prep students for certification." },
  },
  {
    name: "Music", icon: IconMusicNote,
    description: "Resources for instrumental, vocal, and general music education.",
    subcategories: [sub("All Music"), sub("Instrumental"), sub("Vocal"), sub("Music Theory"), sub("Music Tech"), sub("Ensemble")],
    followerCount: "11.4K", trending: ["Sight Reading", "GarageBand Projects", "Rhythm Games", "Concert Prep", "Composition"],
    resourceTypes: [{ label: "Lessons", count: 176 }, { label: "Activities", count: 98 }, { label: "Sheet Music", count: 64 }, { label: "Assessments", count: 29 }],
    curated: { title: "Beginner Ensemble Kit", description: "Handpicked resources for a new ensemble's first month." },
  },
  {
    name: "Photography", icon: IconCamera,
    description: "Resources for teaching composition, editing, and visual storytelling.",
    subcategories: [sub("All Photography"), sub("Composition"), sub("Portrait"), sub("Editing"), sub("Photojournalism")],
    followerCount: "7.9K", trending: ["Rule of Thirds", "Lightroom Basics", "Mobile Photography", "Photo Essays", "Studio Lighting"],
    resourceTypes: [{ label: "Lessons", count: 92 }, { label: "Projects", count: 61 }, { label: "Critiques", count: 24 }, { label: "Assessments", count: 18 }],
    curated: { title: "Composition Bootcamp", description: "Handpicked resources for teaching visual composition." },
  },
  {
    name: "Graphic Design", icon: IconPencil,
    description: "Resources for typography, branding, and digital design tools.",
    subcategories: [sub("All Design"), sub("Typography"), sub("Branding"), sub("Digital Tools"), sub("Print Design")],
    followerCount: "13.1K", trending: ["Canva Projects", "Logo Design", "Type Pairing", "Poster Design", "Portfolio Building"],
    resourceTypes: [{ label: "Lessons", count: 121 }, { label: "Projects", count: 87 }, { label: "Templates", count: 66 }, { label: "Assessments", count: 22 }],
    curated: { title: "Canva Classroom Starter Kit", description: "Handpicked resources for design-driven projects." },
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
    followerCount: "1.2K", trending: [],
    resourceTypes: [{ label: "Lessons", count: 12 }],
    curated: { title: `Getting Started with ${name}`, description: "Handpicked resources to get started." },
  };
}

export function getSubject(slug: string): SubjectDef {
  return SUBJECTS[slug] ?? genericSubject(slug);
}

// ---- deterministic mock resource generation --------------------------------

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CREATORS = [
  { name: "Jessica M.", school: "Middle School" }, { name: "Mark D.", school: "High School" },
  { name: "Rachel P.", school: "High School" }, { name: "Tommy R.", school: "Middle School" },
  { name: "Alyssa T.", school: "High School" }, { name: "Ben S.", school: "Middle School" },
  { name: "Priya K.", school: "Elementary" }, { name: "Dr. Alex C.", school: "College" },
  { name: "Sarah M.", school: "Elementary" }, { name: "Jordan K.", school: "Middle School" },
];

export const DURATIONS = ["30 min", "45 min", "50 min", "1 hr", "75 min", "2 hrs", "3 wks"];
export const BADGE_COMBOS: BadgeKey[][] = [
  ["proven", "peer"], ["proven", "verified"], ["updated"], ["proven", "peer", "verified"],
  ["proven"], ["peer", "updated"], ["verified"], ["peer"],
];

export const RESOURCE_TYPES = ["Lesson", "Worksheet", "Activity", "Project", "Template", "Assessment"] as const;
export const GRADE_BANDS = ["K-5", "6-8", "9-12", "College"] as const;

export const SCHOOL_TO_GRADE: Record<string, string> = {
  "Elementary": "K-5", "Middle School": "6-8", "High School": "9-12", "College": "College",
};

const TEMPLATES = ["Fundamentals", "Getting Started Guide", "Project Guide", "Classroom Activity", "Unit Plan", "Assessment Toolkit"] as const;
const TEMPLATE_TYPE: Record<(typeof TEMPLATES)[number], string> = {
  "Fundamentals": "Lesson", "Getting Started Guide": "Lesson", "Project Guide": "Project",
  "Classroom Activity": "Activity", "Unit Plan": "Lesson", "Assessment Toolkit": "Assessment",
};

const TECHNOLOGY_RESOURCES: Omit<ResourceCardData, "href">[] = [
  { title: "Micro:bit Basics: Code Your World", description: "Students learn the basics of micro:bit by building their first interactive project.", icon: IconLaptop, iconColor: "#4C4DFF", creatorName: "Jessica M.", creatorSchool: "Middle School", grade: "6-8", type: "Lesson", subcategorySlug: "hardware", duration: "60 min", downloads: "2.3k", likes: "512", badges: ["proven"] },
  { title: "Canva for the Classroom: Student Projects", description: "Empower students to create stunning visuals, presentations, and more.", icon: IconPencil, iconColor: "#FF00C8", creatorName: "Mark D.", creatorSchool: "High School", grade: "9-12", type: "Project", subcategorySlug: "design-and-media", duration: "45 min", downloads: "1.8k", likes: "421", badges: ["peer"] },
  { title: "Intro to Digital Photography: Composition Basics", description: "A hands-on introduction to composition techniques using any camera.", icon: IconCamera, iconColor: "#B9AEFF", creatorName: "Rachel P.", creatorSchool: "High School", grade: "9-12", type: "Lesson", subcategorySlug: "design-and-media", duration: "1 hr", downloads: "3.1k", likes: "689", badges: ["verified"] },
  { title: "Game Design in Scratch", description: "Students design and code their own games while learning core CS concepts.", icon: IconAtom, iconColor: "#FF7A32", creatorName: "Tommy R.", creatorSchool: "Middle School", grade: "6-8", type: "Project", subcategorySlug: "coding-and-cs", duration: "120 min", downloads: "2.7k", likes: "610", badges: ["updated"] },
  { title: "Video Editing with DaVinci Resolve", description: "Beginner-friendly video editing curriculum for middle and high school.", icon: IconLaptop, iconColor: "#B9AEFF", creatorName: "Alyssa T.", creatorSchool: "High School", grade: "9-12", type: "Lesson", subcategorySlug: "design-and-media", duration: "75 min", downloads: "1.6k", likes: "372", badges: ["proven"] },
  { title: "Arduino: Build a Smart Night Light", description: "Students build and code a smart night light using sensors and LEDs.", icon: IconWrench, iconColor: "#E7FF72", creatorName: "Ben S.", creatorSchool: "Middle School", grade: "6-8", type: "Project", subcategorySlug: "hardware", duration: "60 min", downloads: "1.2k", likes: "305", badges: ["peer"] },
];

const VISUAL_ART_RESOURCES: Omit<ResourceCardData, "href">[] = [
  { title: "Watercolor Landscapes: A Beginner's Guide", description: "Students explore wet-on-wet technique to paint expressive landscapes.", icon: IconPalette, iconColor: "#FF00C8", creatorName: "Sarah M.", creatorSchool: "Elementary", grade: "K-5", type: "Lesson", subcategorySlug: "drawing-and-painting", duration: "45 min", downloads: "2.3k", likes: "512", badges: ["proven", "peer"] },
  { title: "Hand-Building Ceramics Unit", description: "A three-week unit covering pinch pots, coil building, and slab construction.", icon: IconVase, iconColor: "#FF7A32", creatorName: "Ashley R.", creatorSchool: "Middle School", grade: "6-8", type: "Project", subcategorySlug: "ceramics", duration: "3 wks", downloads: "940", likes: "301", badges: ["updated"] },
  { title: "Color Theory Through Collage", description: "Students build intuition for complementary and analogous color schemes.", icon: IconPalette, iconColor: "#B9AEFF", creatorName: "Priya K.", creatorSchool: "Elementary", grade: "K-5", type: "Activity", subcategorySlug: "drawing-and-painting", duration: "50 min", downloads: "1.5k", likes: "298", badges: ["proven"] },
  { title: "Digital Illustration in Procreate", description: "An intro workflow for students moving from sketch to finished digital art.", icon: IconPencil, iconColor: "#4C4DFF", creatorName: "Mark D.", creatorSchool: "High School", grade: "9-12", type: "Lesson", subcategorySlug: "digital-art", duration: "1 hr", downloads: "1.1k", likes: "245", badges: ["verified"] },
  { title: "Sculpture with Found Objects", description: "An eco-conscious sculpture unit using recycled and found materials.", icon: IconCubes, iconColor: "#B9AEFF", creatorName: "Jordan K.", creatorSchool: "Middle School", grade: "6-8", type: "Project", subcategorySlug: "sculpture", duration: "2 hrs", downloads: "780", likes: "190", badges: ["peer"] },
  { title: "Art History: Movements in 30 Minutes", description: "A fast-paced visual tour of major art movements for quick classroom reference.", icon: IconBook, iconColor: "#E7FF72", creatorName: "Dr. Alex C.", creatorSchool: "College", grade: "College", type: "Lesson", subcategorySlug: "art-history", duration: "30 min", downloads: "612", likes: "134", badges: ["proven", "verified"] },
];

const HAND_AUTHORED: Record<string, Omit<ResourceCardData, "href">[]> = {
  "technology": TECHNOLOGY_RESOURCES,
  "visual-art": VISUAL_ART_RESOURCES,
};

function generateResources(subject: SubjectDef): Omit<ResourceCardData, "href">[] {
  const rand = mulberry32(hashStr(subject.slug));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const count = Math.max(6, subject.subcategories.length);

  return Array.from({ length: count }).map((_, i) => {
    const subcat = subject.subcategories[(i + 1) % subject.subcategories.length];
    const cat = subcat?.name.replace(/^All /, "") || subject.name;
    const creator = pick(CREATORS);
    const template = pick(TEMPLATES);
    return {
      title: `${cat}: ${template}`,
      description: `A classroom-ready resource for teaching ${cat.toLowerCase()} in ${subject.name.toLowerCase()}.`,
      icon: subject.icon,
      iconColor: subject.color,
      creatorName: creator.name,
      creatorSchool: creator.school,
      grade: SCHOOL_TO_GRADE[creator.school] ?? "9-12",
      type: TEMPLATE_TYPE[template],
      subcategorySlug: subcat?.slug ?? subject.subcategories[0]?.slug,
      duration: pick(DURATIONS),
      downloads: `${(rand() * 3 + 0.3).toFixed(1)}k`,
      likes: `${Math.floor(rand() * 500 + 80)}`,
      badges: pick(BADGE_COMBOS),
    };
  });
}

export function getSubjectResources(slug: string): ResourceCardData[] {
  const subject = getSubject(slug);
  const base = HAND_AUTHORED[slug] ?? generateResources(subject);
  // No standalone resource-detail page exists yet, so link back to the
  // subject page rather than a dead anchor.
  return base.map((r) => ({ ...r, href: `/subjects/${slug}` }));
}

// All mock resources across every subject — used by Explore/Search so browsing
// never falls back to real (and, right now, thematically unrelated) tack data.
export function getAllResources(): ResourceCardData[] {
  return SUBJECT_LIST.flatMap((s) => getSubjectResources(s.slug));
}
