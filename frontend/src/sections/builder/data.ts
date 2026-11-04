/**
 * Everything the "Build your app" playground can make. Brands are made up;
 * prices are illustrative (₹). Week estimates are a friendly ballpark, not a
 * quote — the final card always says "about".
 */
export type BizId = string
export type StyleId = "soft" | "bold" | "luxury"
export type FeatureId = "payments" | "bookings" | "assistant" | "login" | "dashboard"

export type Business = {
  id: BizId
  emoji: string
  label: string
  brand: string
  hero: string
  sub: string
  cta: string
  nav: string
  booking: string
  chat: { q: string; a: string }
  weeks: number
  items: { emoji: string; name: string; price: number }[]
}

export const BUSINESSES: Business[] = [
  {
    id: "shop",
    emoji: "🛍️",
    label: "Shop",
    brand: "Aura Store",
    hero: "New season drop",
    sub: "Free delivery over ₹999",
    cta: "Add to cart",
    nav: "Shop",
    booking: "Pick a delivery slot",
    chat: { q: "Do you deliver to Pune?", a: "Yes! Free delivery in 2–3 days 🚚" },
    weeks: 4,
    items: [
      { emoji: "👕", name: "Linen shirt", price: 1499 },
      { emoji: "👜", name: "Canvas tote", price: 899 },
      { emoji: "💍", name: "Gold hoops", price: 2250 },
      { emoji: "👟", name: "Sneakers", price: 3999 },
    ],
  },
  {
    id: "restaurant",
    emoji: "🍕",
    label: "Restaurant",
    brand: "Spice Route",
    hero: "Tonight's specials",
    sub: "Hot at your door in 30 min",
    cta: "Order now",
    nav: "Menu",
    booking: "Book a table",
    chat: { q: "Is the biryani spicy?", a: "Medium! We can make it mild for you 🌶️" },
    weeks: 3,
    items: [
      { emoji: "🍛", name: "Butter chicken", price: 420 },
      { emoji: "🧀", name: "Paneer tikka", price: 320 },
      { emoji: "🍚", name: "Biryani", price: 380 },
      { emoji: "🥭", name: "Mango lassi", price: 120 },
    ],
  },
  {
    id: "clinic",
    emoji: "🏥",
    label: "Clinic",
    brand: "CareWell",
    hero: "See a doctor today",
    sub: "Same-day slots available",
    cta: "Book visit",
    nav: "Doctors",
    booking: "Pick a time",
    chat: { q: "Are you open on Sunday?", a: "Yes, 9am to 1pm. Shall I book you in? 🩺" },
    weeks: 3,
    items: [
      { emoji: "🩺", name: "General checkup", price: 500 },
      { emoji: "🦷", name: "Dentist", price: 800 },
      { emoji: "✨", name: "Skin care", price: 700 },
      { emoji: "👁️", name: "Eye test", price: 400 },
    ],
  },
  {
    id: "school",
    emoji: "🎓",
    label: "School",
    brand: "Bright Minds",
    hero: "Admissions open",
    sub: "Classes for ages 6–16",
    cta: "Enrol",
    nav: "Courses",
    booking: "Book a campus visit",
    chat: { q: "Is there a trial class?", a: "Yes! Your first class is free 🎉" },
    weeks: 4,
    items: [
      { emoji: "📐", name: "Maths", price: 1200 },
      { emoji: "🔬", name: "Science", price: 1400 },
      { emoji: "💻", name: "Coding", price: 1800 },
      { emoji: "🎨", name: "Art", price: 900 },
    ],
  },
  {
    id: "gym",
    emoji: "🏋️",
    label: "Gym",
    brand: "Iron Pulse",
    hero: "Get stronger, together",
    sub: "First week free",
    cta: "Join",
    nav: "Classes",
    booking: "Book a class",
    chat: { q: "Do you have yoga?", a: "Yes! Mornings at 7 and evenings at 6 🧘" },
    weeks: 3,
    items: [
      { emoji: "💪", name: "Monthly pass", price: 1999 },
      { emoji: "🧘", name: "Yoga", price: 1200 },
      { emoji: "🥊", name: "Boxing", price: 1500 },
      { emoji: "🏃", name: "Personal coach", price: 4999 },
    ],
  },
  {
    id: "salon",
    emoji: "💇",
    label: "Salon",
    brand: "Glow Studio",
    hero: "Look your best",
    sub: "Walk-ins welcome",
    cta: "Book",
    nav: "Services",
    booking: "Pick your stylist",
    chat: { q: "Do you do bridal makeup?", a: "We do! Trials are free with the package 💄" },
    weeks: 3,
    items: [
      { emoji: "✂️", name: "Haircut", price: 499 },
      { emoji: "💅", name: "Manicure", price: 699 },
      { emoji: "💆", name: "Spa", price: 1899 },
      { emoji: "💄", name: "Makeup", price: 2499 },
    ],
  },
  {
    id: "hotel",
    emoji: "🏨",
    label: "Hotel",
    brand: "Lakeview Stay",
    hero: "Wake up to the lake",
    sub: "Best price when you book direct",
    cta: "Reserve",
    nav: "Rooms",
    booking: "Pick your dates",
    chat: { q: "Is breakfast included?", a: "Yes, and it's served by the lake 🌅" },
    weeks: 4,
    items: [
      { emoji: "🛏️", name: "Classic room", price: 3499 },
      { emoji: "🌊", name: "Lake view", price: 4999 },
      { emoji: "👑", name: "Suite", price: 8999 },
      { emoji: "🍳", name: "Breakfast", price: 450 },
    ],
  },
  {
    id: "realestate",
    emoji: "🏠",
    label: "Real estate",
    brand: "Keystone Homes",
    hero: "Find your next home",
    sub: "Verified listings only",
    cta: "Visit",
    nav: "Listings",
    booking: "Book a site visit",
    chat: { q: "Any 2BHK near the metro?", a: "Three of them! Shall I send the list? 🏙️" },
    weeks: 4,
    items: [
      { emoji: "🏢", name: "2BHK flat", price: 6500000 },
      { emoji: "🏡", name: "Villa", price: 18000000 },
      { emoji: "🏬", name: "Office", price: 9500000 },
      { emoji: "🌳", name: "Plot", price: 4200000 },
    ],
  },
  {
    id: "travel",
    emoji: "✈️",
    label: "Travel",
    brand: "Wander Trips",
    hero: "Your next escape",
    sub: "All-inclusive packages",
    cta: "Book trip",
    nav: "Trips",
    booking: "Pick travel dates",
    chat: { q: "Is Goa good in June?", a: "Monsoon magic, and half the crowds 🌧️" },
    weeks: 4,
    items: [
      { emoji: "🏖️", name: "Goa, 4 days", price: 14999 },
      { emoji: "🏔️", name: "Manali, 5 days", price: 18999 },
      { emoji: "🕌", name: "Jaipur, 3 days", price: 9999 },
      { emoji: "🌴", name: "Kerala, 6 days", price: 24999 },
    ],
  },
  {
    id: "bakery",
    emoji: "🧁",
    label: "Bakery",
    brand: "Sugar & Crumb",
    hero: "Baked fresh this morning",
    sub: "Order before 4pm, get it today",
    cta: "Add",
    nav: "Menu",
    booking: "Pick a pickup time",
    chat: { q: "Can you write a name on the cake?", a: "Of course! Add it at checkout 🎂" },
    weeks: 3,
    items: [
      { emoji: "🎂", name: "Chocolate cake", price: 899 },
      { emoji: "🥐", name: "Croissant", price: 120 },
      { emoji: "🧁", name: "Cupcakes x6", price: 450 },
      { emoji: "🍪", name: "Cookies", price: 250 },
    ],
  },
  {
    id: "consulting",
    emoji: "💼",
    label: "Consulting",
    brand: "Northstar Advisors",
    hero: "Grow with clarity",
    sub: "Free 20-minute first call",
    cta: "Enquire",
    nav: "Services",
    booking: "Book a call",
    chat: { q: "Do you help with GST?", a: "Yes, filing and planning both 📑" },
    weeks: 3,
    items: [
      { emoji: "📈", name: "Strategy", price: 15000 },
      { emoji: "📑", name: "Tax & GST", price: 4999 },
      { emoji: "⚖️", name: "Legal setup", price: 9999 },
      { emoji: "🤝", name: "Monthly retainer", price: 25000 },
    ],
  },
]

/** shown circling the empty phone; the rest live in the list */
export const ORBIT_IDS: BizId[] = ["shop", "restaurant", "clinic", "gym", "salon", "hotel"]

/** "Type your own": any business at all gets a sensible starter app. */
export function customBusiness(text: string): Business {
  const name = text.trim().replace(/\s+/g, " ").slice(0, 28).toLowerCase()
  return {
    id: `custom:${name}`,
    emoji: "✨",
    label: name.charAt(0).toUpperCase() + name.slice(1),
    brand: name.replace(/\b\w/g, (c) => c.toUpperCase()),
    hero: "Welcome! How can we help?",
    sub: "Book, buy or ask in seconds",
    cta: "Enquire",
    nav: "Services",
    booking: "Book an appointment",
    chat: { q: "What are your timings?", a: "We're open 9am to 8pm, every day 😊" },
    weeks: 4,
    items: [
      { emoji: "⭐", name: "Starter", price: 999 },
      { emoji: "💎", name: "Popular", price: 2499 },
      { emoji: "🚀", name: "Premium", price: 4999 },
      { emoji: "🤝", name: "Business", price: 9999 },
    ],
  }
}

export const COLORS = [
  { id: "violet", name: "Violet", hex: "#7c5cff" },
  { id: "pink", name: "Pink", hex: "#ff4f9a" },
  { id: "mint", name: "Mint", hex: "#16b97e" },
  { id: "amber", name: "Amber", hex: "#f59e0b" },
  { id: "blue", name: "Blue", hex: "#3b6dff" },
  { id: "coral", name: "Coral", hex: "#ff5a3d" },
] as const

export type Look = {
  label: string
  /** card corner radius (px) */
  r: number
  /** button corner radius (px) */
  btnR: number
  head: string
  weight: number
  upper: boolean
  italic: boolean
  bg: string
  card: string
  line: string
  bw: number
}

export const LOOKS: Record<StyleId, Look> = {
  soft: { label: "Soft", r: 16, btnR: 999, head: "var(--font-sans)", weight: 700, upper: false, italic: false, bg: "#f7f6fb", card: "#ffffff", line: "rgba(20,18,30,0.08)", bw: 1 },
  bold: { label: "Bold", r: 2, btnR: 2, head: "var(--font-grotesk)", weight: 700, upper: true, italic: false, bg: "#ffffff", card: "#ffffff", line: "#14121e", bw: 2 },
  luxury: { label: "Luxury", r: 6, btnR: 4, head: "var(--font-serif)", weight: 400, upper: false, italic: true, bg: "#f4ede0", card: "#fbf7ef", line: "rgba(120,96,60,0.28)", bw: 1 },
}

export const FEATURES: { id: FeatureId; emoji: string; label: string; says: string; weeks: number }[] = [
  { id: "payments", emoji: "💳", label: "Payments", says: "take money online", weeks: 1 },
  { id: "bookings", emoji: "📅", label: "Bookings", says: "customers pick a slot", weeks: 1 },
  { id: "assistant", emoji: "💬", label: "AI assistant", says: "answers questions 24/7", weeks: 0.5 },
  { id: "login", emoji: "🔐", label: "Login", says: "customer accounts", weeks: 0.5 },
  { id: "dashboard", emoji: "📊", label: "Dashboard", says: "your sales at a glance", weeks: 1 },
]

export const STYLES: StyleId[] = ["soft", "bold", "luxury"]

export function estimateWeeks(biz: Business, features: FeatureId[]): number {
  const extra = FEATURES.filter((f) => features.includes(f.id)).reduce((s, f) => s + f.weeks, 0)
  return Math.ceil(biz.weeks + extra)
}

export function rupees(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}
