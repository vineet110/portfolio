/**
 * Companies the team has built for, shown as the "clients" wall under the
 * work grid. Alphabetical. `project` links a client to its tile in
 * `projects.ts` (hovering lights it up, clicking opens the case).
 * To add a client: add one line here.
 */
export type Client = {
  name: string
  /** small suffix under the name, e.g. "Pvt Ltd" */
  suffix?: string
  project?: string
}

export const clients: Client[] = [
  { name: "Ambrane India" },
  { name: "BodhBox", project: "threat-accordme" },
  { name: "Chinar Scientific", project: "chinar" },
  { name: "IPAD", suffix: "Pvt Ltd" },
  { name: "MV Manpower", suffix: "Pvt Ltd" },
  { name: "Occttro Fashion", suffix: "Pvt Ltd" },
  { name: "Samagyo", suffix: "Pvt Ltd" },
  { name: "SkillXploit", project: "ctf" },
  { name: "Spark", project: "spark-erp" },
  { name: "Srikara" },
  { name: "ToyBharat" },
]
