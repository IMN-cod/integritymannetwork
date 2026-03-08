// Site-wide constants derived from the Integrity Man Network document
// These power every page with consistent, authentic content

export const SITE = {
  name: "The Integrity Man Network",
  shortName: "IMN",
  tagline: "God. Work. Integrity.",
  scripture: {
    reference: "Matthew 6:33",
    text: "But seek first the kingdom of God and His righteousness, and all these things shall be added to you.",
  },
  subtitle: "Men everywhere cheerfully working for God",
  description:
    "A global, non-denominational community of men committed to achieving true success by living lives of Integrity while working to advance the eternal purpose of God through their life assignments.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://integrityman.network",
} as const;

export const KEY_DEFINITIONS = [
  {
    term: "Eternal Purpose",
    definition:
      "The Eternal Vision and plan for the entire Universe. Also referred to as the Will of God — the reason why all things have come to be as they are. This is the blueprint and details the pattern that every creation of God must conform to.",
    icon: "Compass",
  },
  {
    term: "Man",
    definition:
      "An interesting and key figure in the Eternal Purpose of God. Each Man has been sent to the earth on a specific assignment crafted from the Eternal Purpose. This Spiritual assignment is a journey of righteousness and perfection and is what must become the Man's life work.",
    icon: "User",
  },
  {
    term: "Work",
    definition:
      "Any reward-based activity undertaken by men during the course of their lives. The Work of God is the mission to execute God's plan concerning the universe. Men are sent to the Earth to enforce the advancement of the Eternal Purpose of God here on earth.",
    icon: "Hammer",
  },
  {
    term: "Integrity",
    definition:
      "God is a God of Righteousness entirely motivated by the desire to see His creation rid of the capacity for corruption. Through His work and a process of regeneration, God passes on His character of righteousness. This character is what is expressed physically in the lives of Men as Integrity.",
    icon: "Shield",
  },
] as const;

export const CHANNELS = [
  {
    id: "schools",
    title: "Schools",
    subtitle: "School of Integrity & Purpose Centers",
    description:
      "A structured training and discipleship platform focused on building righteous character, doctrinal foundation, and integrity-driven leadership in men.",
    items: [
      {
        name: "School of Integrity",
        description:
          "The School of Integrity exists to form men from the inside out. In a world where information is abundant but formation is rare, it is a structured environment for deep character development, doctrinal grounding, and purpose alignment. Here, men are taught to think biblically, live righteously, lead responsibly, and work purposefully.",
      },
      {
        name: "Purpose Centers",
        subtitle: "Early Childhood & Primary Development",
        description:
          "Foundational environments designed to nurture identity, moral clarity, and purpose awareness from the earliest stages of life. We believe destiny should be cultivated early, not repaired later.",
      },
    ],
    icon: "GraduationCap",
  },
  {
    id: "outreach",
    title: "Outreach Initiatives",
    subtitle: "Campus & Corporate Campaigns",
    description:
      "Active engagement with society through campus campaigns and corporate outreach — extending our mandate beyond internal formation.",
    items: [
      {
        name: "Campus Campaign",
        description:
          "We engage young men in schools and tertiary institutions before cultural distortion defines them. Through mentorship programs, leadership workshops, and identity teaching, we introduce purpose-driven living at formative stages.",
      },
      {
        name: "Corporate & Business Men Outreach",
        description:
          "We engage professionals and entrepreneurs operating within corporate and business environments — spaces where integrity is often tested and compromise is normalized. Through advisory sessions, leadership forums, and ethical governance training, we equip men to integrate faith with work.",
      },
    ],
    icon: "Megaphone",
  },
  {
    id: "houses",
    title: "Networking",
    subtitle: "Networking & Strategic Community",
    description:
      "Relational hubs where men grow through accountability, brotherhood, and shared purpose. An Integrity House is more than a networking space — it is a covenant community.",
    items: [
      {
        name: "Networking",
        description:
          "Structured environments where men connect meaningfully, sharpen one another, share opportunities, pray together, solve problems, and walk through life's seasons with support and spiritual alignment.",
      },
    ],
    icon: "Home",
  },
  {
    id: "foundation",
    title: "Support & Charity",
    subtitle: "Fundraising & Social Impact",
    description:
      "The resource mobilization and social impact arm that fuels sustainable transformation. Vision without provision remains limited.",
    items: [
      {
        name: "Support & Charity",
        description:
          "Through partnerships, fundraising campaigns, donor networks, and strategic collaborations, we mobilize financial and material support for schools, youth outreach, community interventions, and men-focused development projects.",
      },
    ],
    icon: "Heart",
  },
] as const;

export const EVENTS_INFO = [
  {
    name: "Integrity Summit",
    schedule: "Annual — November",
    description:
      "Our flagship annual gathering. A high-level convergence of leaders, professionals, entrepreneurs, young men, and fathers who desire to live and lead with integrity. Through keynote teachings, strategic dialogues, and leadership sessions, the Summit sets the tone for the coming year.",
    highlight: "It is not just an event. It is a call to higher standards.",
    icon: "Crown",
  },
  {
    name: "Men's Retreat",
    schedule: "Quarterly",
    description:
      "A space for withdrawal, reflection, spiritual renewal, and strategic recalibration. These retreats include extended prayer sessions, strategic teaching, accountability conversations, and goal-setting workshops.",
    highlight: "Men must periodically withdraw in order to return stronger.",
    icon: "Mountain",
  },
  {
    name: "Corporate & Businessmen Gatherings",
    schedule: "Monthly",
    description:
      "Breakfast and lunch meetings designed for professionals and entrepreneurs. Spaces for ethical leadership conversations, business advisory discussions, purpose-driven networking, and faith-work integration dialogue.",
    highlight:
      "Raising men who excel in the marketplace without compromising integrity.",
    icon: "Briefcase",
  },
] as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Channels", href: "/channels" },
  { label: "School", href: "/school" },
  { label: "Events", href: "/events" },
  { label: "Store", href: "/store" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const ABOUT_CONTENT = {
  whoWeAre: {
    title: "Who We Are",
    paragraphs: [
      "The Integrity Man Network is a global, non-denominational, not-for-profit organization committed to restoring righteousness in men through knowledge that fosters a deeper understanding of Eternal Purpose — reshaping how they view success, wealth creation, impact, and fuels their motivation to work and live in integrity.",
      "Borne out of a deep desire to help men understand why they exist in the light of God's eternal plan, The Integrity Man Network calls men to prioritize purpose-driven work over the mundane pursuits of life. We serve as a formative community that is committed to facilitating men's alignment to God, self-discovery, character formation and purposeful work that breeds true fulfilment.",
      "We believe men are not accidents of creation, but vessels of divine intention; therefore, their lives, labor, and legacy must reflect the nature of the Divine Intelligence that formed them.",
    ],
  },
  burden: {
    title: "Our Burden",
    paragraphs: [
      "Our burden is the quiet crisis of increasing corruption wrought by misaligned men — men created to advance eternal purpose through righteousness, yet trapped in shallow pursuits, borrowed definitions of success, and work divorced from divine meaning.",
      "We are burdened by the normalization of compromise, where integrity has become negotiable due to shallow understanding, and righteousness is dismissed as optional. Men are busy without alignment, productive without fulfilment — chasing success at all cost yet failing to leave enduring legacies.",
      "We are also burdened by a culture in which men have vacated their God-given role of authority and presence in the family, often in the pursuit of provision alone. In their absence, women are forced to stand in the gap, and children are raised without the stability of an engaged and visible father — leaving them exposed to confusion, distortion, and destructive influences contributing to the ever growing rate of corruption in society.",
    ],
  },
  mandate: {
    title: "Our Mandate",
    paragraphs: [
      "We recognize that men universally desire success, wealth, and impact. These longings are not evil in themselves — they are echoes of divine intention. However, Scripture reveals that these outcomes are not meant to be pursued as primary objectives, but as by-products of a higher pursuit.",
      "Based on the truth of Matthew 6:33, we believe we have discovered the divine order for true success: seeking first the Kingdom of God and His righteousness. We believe that as men seek first the Kingdom and His righteousness, success, wealth, influence, and fulfilment are added — not chased.",
      "We exist to raise men who recognize that the reason for their existence is to work for God in obedience, understanding that this is the only pathway ordained by God for true and lasting success. Men who cheerfully work for God in every sphere of life, advancing His Kingdom, reflecting His righteousness, and enforcing His will on the earth.",
    ],
  },
  method: {
    title: "Our Method",
    paragraphs: [
      "We advance this mandate through strategic channels designed to form, equip, deploy, and support men across every stage of life and calling. These channels function as practical expressions of our burden and mandate — creating clear pathways for growth, alignment, and purposeful engagement.",
    ],
  },
} as const;
