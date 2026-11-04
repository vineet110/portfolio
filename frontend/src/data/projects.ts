export type Preview =
  /** the real site, running inside the page */
  | { kind: "live" }
  /** the site blocks embedding (X-Frame-Options), so a full-page screenshot scrolls instead */
  | { kind: "scroll"; src: string }
  /** no public URL — a product shot */
  | { kind: "image" }

export type Project = {
  id: string
  index: string
  name: string
  category: string
  status: "LIVE" | "CASE STUDY"
  description: string
  tags: string[]
  /** the client this was built for — shown in the "clients" row under the work */
  client?: string
  /** public address, when the project has one */
  url?: string
  preview: Preview
  /** resting image on the tile (and while a live site loads) */
  image: { src: string; alt: string }
}

const img = (file: string) => `/images/work/${file}`

/**
 * Work made by the team. The first three are live websites; the rest are
 * platforms without a public address, shown with product shots.
 */
export const projects: Project[] = [
  {
    id: "tufger",
    index: "01",
    name: "Tufger",
    client: "Tufger",
    category: "Sports · Web App",
    status: "LIVE",
    description: "A turf booking manager that splits every booking and collects each player's share over UPI — no chasing anyone for money.",
    tags: ["Web App", "UPI Payments", "Booking"],
    url: "https://tufger.vercel.app",
    preview: { kind: "live" },
    image: { src: img("tufger.jpg"), alt: "Tufger sign-in screen: a dark green pitch with an amber scoreboard-style passcode panel" },
  },
  {
    id: "jewellery",
    index: "02",
    name: "Jewellery Store",
    client: "Jewellery Store",
    category: "Commerce · Website",
    status: "LIVE",
    description: "An online store for hallmarked gold, silver and diamond jewellery — temple, kundan and bridal pieces, delivered insured across India.",
    tags: ["E-commerce", "Website", "Catalogue & Cart"],
    url: "https://jewellery-store-orcin.vercel.app/",
    preview: { kind: "scroll", src: img("jewellery-full.jpg") },
    image: { src: img("jewellery.jpg"), alt: "Jewellery Store home page: a gold kundan necklace beside the headline 'Jewellery made to be handed down'" },
  },
  {
    id: "chinar",
    index: "03",
    name: "Chinar Scientific",
    client: "Chinar Scientific",
    category: "Education · Company Website",
    status: "LIVE",
    description: "The website for Chinar Scientific Industries — STEM, ICT and EdTech solutions for schools across India since 1984.",
    tags: ["Website", "Corporate", "Education"],
    url: "https://chinarscientific.in/",
    preview: { kind: "live" },
    image: { src: img("chinar.jpg"), alt: "Chinar Scientific home page: 'Innovating Education Since 1984' on a deep blue banner" },
  },
  {
    id: "whatsapp",
    index: "04",
    name: "WhatsApp Marketing Platform",
    category: "Healthcare · SaaS Platform",
    status: "CASE STUDY",
    description: "Campaign and appointment management for healthcare clients, delivering WhatsApp campaigns to 500,000–1,000,000+ recipients on auto-scaling AWS infrastructure.",
    tags: ["AWS", "Node.js", "React", "WhatsApp Cloud API"],
    preview: { kind: "image" },
    image: { src: img("spark-ai.jpg"), alt: "Dark, glowing product screen with an AI assistant robot and campaign navigation" },
  },
  {
    id: "spark-erp",
    index: "05",
    name: "Spark ERP",
    client: "Spark",
    category: "Enterprise · ERP System",
    status: "CASE STUDY",
    description: "One centralized ERP — on web and mobile — for academics, students, exams, HR and finance.",
    tags: ["React", "React Native", "Node.js", "MongoDB"],
    preview: { kind: "image" },
    image: { src: img("spark.jpg"), alt: "Spark ERP dashboard on a desktop monitor: student counts, attendance chart and calendar" },
  },
  {
    id: "threat-accordme",
    index: "06",
    name: "Threat Accordme",
    client: "BodhBox",
    category: "Education · Learning Platform",
    status: "CASE STUDY",
    description: "A learning management system with role-based access for admins, authors and learners.",
    tags: ["React", "Node.js", "MySQL", "RBAC"],
    preview: { kind: "image" },
    image: { src: img("bodhbox.jpg"), alt: "Learning platform admin dashboard with user management and analytics cards" },
  },
  {
    id: "ctf",
    index: "07",
    name: "CTF Platform",
    client: "SkillXploit",
    category: "Cybersecurity · Challenge App",
    status: "CASE STUDY",
    description: "A real-time capture-the-flag platform — live challenges, submissions and a leaderboard over WebSockets.",
    tags: ["React", "Node.js", "WebSockets", "Firebase Auth"],
    preview: { kind: "image" },
    image: { src: img("skillxploit.jpg"), alt: "CTF admin dashboard on a monitor: users, live competitions and recent flag captures" },
  },
]
