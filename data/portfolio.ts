/**
 * Single source of truth for every piece of portfolio content.
 * Edit text, links and projects here — the game and modals read from this file.
 */

export type BuildingId = 'home' | 'projects' | 'roadmap' | 'contact'

export type PixelIconName =
  | 'house'
  | 'sword'
  | 'scroll'
  | 'envelope'
  | 'star'
  | 'heart'
  | 'terminal'
  | 'chart'
  | 'tv'
  | 'monitor'
  | 'trophy'
  | 'flag'
  | 'moon'
  | 'blossom'

export const profile = {
  name: 'Kartik Raj',
  className: 'Code Apprentice',
  level: 1,
  hometown: 'Sahokhar, Sohsarai',
  education: 'Pursuing B.Tech in CSE at RRSDCE, Begusarai',
  hobbies: ['Coding', 'Watching Anime'],
  mainQuest: "Settle in Japan's IT sector as an SDE-2 (Software Development Engineer 2)",
  goalBadge: 'GOAL: JAPAN SDE-2',
  bio: "A computer science student levelling up one bug fix at a time. I love building things with code, binge-watching anime after a long debug session, and I'm on a quest to become a Software Development Engineer in Japan.",
  traits: [
    { label: 'Night Owl Coder', icon: 'moon' as PixelIconName, description: '+20% focus after midnight' },
    { label: 'Anime Enthusiast', icon: 'tv' as PixelIconName, description: 'Unlimited arc-watching stamina' },
    { label: 'Bug Slayer', icon: 'sword' as PixelIconName, description: 'Hunts errors without mercy' },
    { label: 'Japan Bound', icon: 'blossom' as PixelIconName, description: 'Sakura-powered motivation' },
  ],
  stats: [
    { label: 'C / JAVA', value: 72, color: 'lavender' },
    { label: 'DSA', value: 58, color: 'sage' },
    { label: 'PROBLEM SOLVING', value: 66, color: 'peach' },
    { label: 'CURIOSITY', value: 95, color: 'sakura' },
    { label: 'ANIME LORE', value: 99, color: 'lavender' },
  ] as { label: string; value: number; color: 'lavender' | 'sage' | 'peach' | 'sakura' }[],
}

export type Project = {
  id: string
  title: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  icon: PixelIconName
  description: string
  tech: string[]
  demoUrl: string
  githubUrl: string
}

export const projects: Project[] = [
  {
    id: 'console-engine',
    title: 'C/Java Console Engine',
    rarity: 'RARE',
    icon: 'terminal',
    description:
      'A tiny text-mode game engine with a render loop, input handling and ASCII sprites — built to master the fundamentals of C and Java.',
    tech: ['C', 'Java', 'OOP'],
    demoUrl: '#',
    githubUrl: '#',
  },
  {
    id: 'dsa-visualizer',
    title: 'DSA Visualizer',
    rarity: 'EPIC',
    icon: 'chart',
    description:
      'Step-by-step animations for sorting, searching, stacks, queues and graph traversals to make data structures click.',
    tech: ['TypeScript', 'React', 'Algorithms'],
    demoUrl: '#',
    githubUrl: '#',
  },
  {
    id: 'anime-tracker',
    title: 'Anime Watchlist Tracker',
    rarity: 'RARE',
    icon: 'tv',
    description:
      'Track watching, completed and plan-to-watch shows with episode progress, ratings and seasonal recommendations.',
    tech: ['Next.js', 'REST API', 'Tailwind'],
    demoUrl: '#',
    githubUrl: '#',
  },
  {
    id: 'portfolio-os',
    title: 'Portfolio OS',
    rarity: 'LEGENDARY',
    icon: 'monitor',
    description:
      'This very pixel RPG world! A canvas game engine with pathfinding, door animations and 8-bit sound — built as an interactive portfolio.',
    tech: ['Next.js', 'Canvas 2D', 'Framer Motion'],
    demoUrl: '#',
    githubUrl: '#',
  },
]

export type Semester = {
  sem: number
  label: string
  title: string
  skills: string[]
  xp: number
  description: string
}

/** Change this to move the "current" marker along the roadmap. */
export const currentSemester = 3

export const roadmap: Semester[] = [
  { sem: 1, label: '1st Sem', title: 'Village Beginnings', skills: ['C', 'Java'], xp: 100, description: 'Learn the ancient tongues of programming: pointers, loops, classes and objects.' },
  { sem: 2, label: '2nd Sem', title: 'Forge of Java', skills: ['Java', 'DSA Basics'], xp: 150, description: 'Sharpen Java skills and take the first steps into arrays, linked lists and recursion.' },
  { sem: 3, label: '3rd Sem', title: 'Dungeon of DSA', skills: ['DSA'], xp: 200, description: 'Venture deep into trees, graphs, hashing and dynamic programming.' },
  { sem: 4, label: '4th Sem', title: 'LeetCode Trials', skills: ['DSA', 'LeetCode', 'Git & GitHub'], xp: 250, description: 'Daily problem grinding plus version control mastery with Git & GitHub.' },
  { sem: 5, label: '5th Sem', title: 'Guild Apprentice', skills: ['Internship', 'Projects'], xp: 300, description: 'Join a guild as an intern and ship real-world projects.' },
  { sem: 6, label: '6th Sem', title: 'Field Expedition', skills: ['Internship', 'Projects'], xp: 350, description: 'Take on bigger quests, collaborate with teams and grow the project inventory.' },
  { sem: 7, label: '7th Sem', title: 'Trial of Interviews', skills: ['Interview Preparation'], xp: 400, description: 'System design scrolls, mock interviews and behavioural rounds.' },
  { sem: 8, label: '8th Sem', title: 'Industry Ready', skills: ['Industry Ready'], xp: 500, description: 'All skills unlocked. The gates to the final boss open...' },
]

export const finalBoss = {
  title: 'Final Boss Unlocked',
  name: 'SDE-2 in Japan',
  description: "Defeat the last challenge and settle into Japan's IT sector as a Software Development Engineer 2.",
}

export const contact = {
  email: 'kartikraj@example.com',
  postcardGreeting: 'Greetings from Dev Village!',
  socials: [
    { label: 'GitHub', handle: 'github.com/kartikraj', url: 'https://github.com/kartikraj' },
    { label: 'LinkedIn', handle: 'linkedin.com/in/kartikraj', url: 'https://www.linkedin.com/in/kartikraj' },
    { label: 'LeetCode', handle: 'leetcode.com/kartikraj', url: 'https://leetcode.com/kartikraj' },
    { label: 'Email', handle: 'kartikraj@example.com', url: 'mailto:kartikraj@example.com' },
  ],
}

export const buildings: Record<BuildingId, { name: string; sign: string; icon: PixelIconName; tagline: string }> = {
  home: { name: "Kartik's House", sign: 'HOME', icon: 'house', tagline: 'About me' },
  projects: { name: 'Project Guild Hall', sign: 'GUILD', icon: 'scroll', tagline: 'Quest board' },
  roadmap: { name: 'The Dojo', sign: 'DOJO', icon: 'flag', tagline: 'Skill tree' },
  contact: { name: 'Post Office', sign: 'POST', icon: 'envelope', tagline: 'Send a raven' },
}

export type FriendId = 'mahi' | 'rishi' | 'raunak' | 'sam'
export type CreatureId = 'fish' | 'dragon' | 'wizard' | 'slime'
export type NpcId = FriendId | CreatureId

type NpcContent = {
  name: string
  role: string
  /** Line shown in the dialogue box when walking near them. */
  nearby: string
  greeting: string
  link?: { label: string; url: string }
  action?: { label: string; reply: string }
  farewell: string
}

/** Village friends and creatures. Edit names, lines and website links here. */
export const npcs: Record<NpcId, NpcContent> = {
  mahi: {
    name: 'Mahi',
    role: 'Fellow Coder',
    nearby: 'Mahi is debugging something under the sky. Press A to say hi!',
    greeting: "Hey Kartik's visitor! I'm Mahi. I just shipped a fresh build of my portfolio. Want to visit my website?",
    link: { label: 'Visit coder-mahi.github.io', url: 'https://coder-mahi.github.io' },
    farewell: 'Maybe later',
  },
  rishi: {
    name: 'Rishi',
    role: 'Guild Member',
    nearby: 'Rishi is pinning a new quest to the guild board. Press A to talk.',
    greeting: "Yo! Rishi here. I'm logging my own coding quests online. Want to check out my website?",
    link: { label: 'Visit coder-rishi.github.io', url: 'https://coder-rishi.github.io' },
    farewell: 'Maybe later',
  },
  raunak: {
    name: 'Raunak',
    role: 'Code Ranger',
    nearby: 'Raunak waves from beside the post office. Press A to talk.',
    greeting: "Hi there! I'm Raunak. My website has all my projects and experiments. Want to take a look?",
    link: { label: 'Visit coder-raunak.github.io', url: 'https://coder-raunak.github.io' },
    farewell: 'Maybe later',
  },
  sam: {
    name: 'Sam',
    role: 'Village Star',
    nearby: 'Sam is enjoying the breeze by the dojo. Press A to talk.',
    greeting: "Hello! I'm Sam. I share my everyday moments on Instagram. Would you like to visit my page?",
    link: {
      label: 'Visit Instagram',
      url: 'https://instagram.com/samantharuthprabhuoffl?avpt=MXE2dzB3ODA4b2dkMQ==',
    },
    farewell: 'Maybe later',
  },
  wizard: {
    name: 'Wizard Chronos',
    role: 'Keeper of Time',
    nearby: 'An old wizard hums over a glowing staff. He can bend time & seasons. Press A to talk.',
    greeting: 'Ahh, a traveler! I am Chronos, keeper of time. Shall I turn the sky, or change the season?',
    farewell: 'Farewell',
  },
  dragon: {
    name: 'Byte',
    role: 'Baby Dragon',
    nearby: 'A tiny dragon is napping among the trees. Press A to talk.',
    greeting: 'Rawr! I am Byte, a baby dragon. I guard the legendary bugs of the guild hall.',
    action: { label: 'Ask for a fire show', reply: 'FWOOOSH! Byte puffs a little flame and looks very proud of himself.' },
    farewell: 'Bye, Byte',
  },
  slime: {
    name: 'Gloop',
    role: 'Friendly Slime',
    nearby: 'A bouncy slime is hopping along the path. Press A to talk.',
    greeting: 'Bloop! I am Gloop. I absorbed three missing semicolons today. Yum.',
    action: { label: 'Poke it', reply: 'BOING! Gloop bounces sky-high and wobbles happily.' },
    farewell: 'Leave it be',
  },
  fish: {
    name: 'Koi-chan',
    role: 'River Koi',
    nearby: 'A shiny koi swims in the river. Press A to talk.',
    greeting: '*blub blub* I am Koi-chan, the best rubber-duck debugger in the river.',
    action: { label: 'Toss a crumb', reply: 'SPLASH! Koi-chan leaps out of the water and does a perfect flip.' },
    farewell: 'Wave goodbye',
  },
}

export const wizardLines = {
  seasonPrompt: 'Choose a season, young coder, and I shall weave it into the world.',
  day: 'Lux solaris! The sun climbs back over Dev Village.',
  night: 'Nox eterna! Stars bloom across the village sky.',
  season: (label: string) => `Tempus mutatio! ${label} has arrived in Dev Village.`,
}

export type ZoneKey = 'intro' | 'village' | 'river' | 'bridge' | 'sakura' | 'notice' | BuildingId | NpcId

const npcZones = Object.fromEntries(
  Object.entries(npcs).map(([id, n]) => [id, { speaker: n.name.toUpperCase(), text: n.nearby }]),
) as Record<NpcId, { speaker: string; text: string }>

export const dialogue: Record<ZoneKey, { speaker: string; text: string }> = {
  ...npcZones,
  intro: {
    speaker: 'GUIDE',
    text: "Welcome to Dev Village, traveler! I'm Kartik. Click anywhere to walk, use WASD / D-pad, or press A to visit the nearest door.",
  },
  village: { speaker: 'KARTIK', text: 'The village is calm today. Four doors, four stories. Which one shall we open?' },
  river: { speaker: 'KARTIK', text: 'The river hums like a fan on a long compile... Cross a bridge to reach the east side.' },
  bridge: { speaker: 'KARTIK', text: 'Creak, creak. These planks have survived more merges than my repos.' },
  sakura: { speaker: 'KARTIK', text: "Sakura petals... a little reminder of the main quest: Japan, here I come!" },
  notice: { speaker: 'NOTICE BOARD', text: 'HOME: about me. GUILD: projects. DOJO: roadmap. POST: contact. Recruiters may use Fast Travel!' },
  home: { speaker: "KARTIK'S HOUSE", text: 'My cozy home base. Step inside for my character profile & stats. (Press A)' },
  projects: { speaker: 'GUILD HALL', text: 'The quest board is full of completed adventures. Step inside to browse projects. (Press A)' },
  roadmap: { speaker: 'THE DOJO', text: 'Eight semesters of training lead to the final boss. Enter to view the skill tree. (Press A)' },
  contact: { speaker: 'POST OFFICE', text: 'Want to send Kartik a message? The ravens are ready. (Press A)' },
}
