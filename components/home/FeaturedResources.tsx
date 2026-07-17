"use client";

import ResourceCard, { type ResourceCardData, type BadgeKey } from "@/components/ResourceCard";
import { slugify } from "@/lib/subjects";
import {
  IconPalette, IconLaptop, IconVase, IconPencil, IconGlobe, IconAtom, IconCamera, IconGraduationCap,
} from "@/components/icons";

interface FeaturedResource {
  title: string;
  description: string;
  creatorName: string;
  creatorSchool: string;
  subject: string;
  grade: string;
  type: string;
  duration: string;
  downloads: string;
  likes: string;
  icon: typeof IconPalette;
  color: string;
  badges: BadgeKey[];
}

const RESOURCES: FeaturedResource[] = [
  { title: "Watercolor Landscapes: A Beginner's Guide", description: "Students explore wet-on-wet technique to paint expressive landscapes.", creatorName: "Sarah M.", creatorSchool: "Elementary", subject: "Visual Art", grade: "6-8", type: "Lesson", duration: "45 min", downloads: "2.3k", likes: "512", icon: IconPalette, color: "#FF00C8", badges: ["proven", "peer"] },
  { title: "AI Literacy: Spotting Bias in Algorithms", description: "A discussion-based lesson helping students critically evaluate AI systems.", creatorName: "Mike D.", creatorSchool: "High School", subject: "Technology", grade: "9-12", type: "Lesson", duration: "1 hr", downloads: "1.8k", likes: "421", icon: IconLaptop, color: "#4C4DFF", badges: ["proven", "verified"] },
  { title: "Hand-Building Ceramics Unit", description: "A three-week unit covering pinch pots, coil building, and slab construction.", creatorName: "Ashley R.", creatorSchool: "Middle School", subject: "Visual Art", grade: "6-8", type: "Project", duration: "3 wks", downloads: "940", likes: "301", icon: IconVase, color: "#FF7A32", badges: ["updated"] },
  { title: "Intro to Graphic Design with Canva", description: "Empower students to create stunning visuals, presentations, and more.", creatorName: "Priya K.", creatorSchool: "High School", subject: "Graphic Design", grade: "9-12", type: "Project", duration: "50 min", downloads: "3.1k", likes: "689", icon: IconPencil, color: "#B9AEFF", badges: ["proven", "peer", "verified"] },
  { title: "Digital Citizenship Toolkit", description: "A ready-to-teach toolkit for building safe, thoughtful digital habits.", creatorName: "Rachel T.", creatorSchool: "Elementary", subject: "Technology", grade: "K-5", type: "Template", duration: "30 min", downloads: "2.7k", likes: "610", icon: IconGlobe, color: "#B9AEFF", badges: ["proven"] },
  { title: "STEM Bridge-Building Challenge", description: "Teams design and test bridges under a limited-materials budget.", creatorName: "Jordan K.", creatorSchool: "Middle School", subject: "Science", grade: "6-8", type: "Activity", duration: "2 hrs", downloads: "1.5k", likes: "372", icon: IconAtom, color: "#E7FF72", badges: ["peer", "updated"] },
  { title: "Photography Composition Basics", description: "A hands-on introduction to composition techniques using any camera.", creatorName: "Kate B.", creatorSchool: "High School", subject: "Photography", grade: "9-12", type: "Lesson", duration: "1 hr", downloads: "1.1k", likes: "305", icon: IconCamera, color: "#FF00C8", badges: ["verified"] },
  { title: "Higher Ed Syllabus Design Workshop", description: "A workshop for building a syllabus students actually read.", creatorName: "Dr. Alex C.", creatorSchool: "College", subject: "Higher Education", grade: "College", type: "Template", duration: "40 min", downloads: "612", likes: "134", icon: IconGraduationCap, color: "#4C4DFF", badges: ["peer"] },
];

function toCardData(r: FeaturedResource): ResourceCardData {
  return {
    title: r.title,
    description: r.description,
    icon: r.icon,
    iconColor: r.color,
    creatorName: r.creatorName,
    creatorSchool: r.creatorSchool,
    grade: r.grade,
    type: r.type,
    duration: r.duration,
    downloads: r.downloads,
    likes: r.likes,
    badges: r.badges,
    href: `/subjects/${slugify(r.subject)}`,
  };
}

export default function FeaturedResources() {
  return (
    <section className="py-16 md:py-20 px-6 bg-cork-warm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">Featured resources</h2>
            <p className="text-ink/50 mt-2">Classroom-tested, teacher-approved.</p>
          </div>
          <a href="/explore" className="hidden md:inline text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
            See all →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {RESOURCES.map((r, i) => (
            <ResourceCard key={i} resource={toCardData(r)} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <a href="/explore" className="inline-block text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
            See all resources →
          </a>
        </div>
      </div>
    </section>
  );
}
