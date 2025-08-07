export const writingStyles = [
  {
    name: "✏️ Default (Neutral) Style",
    usageTips: "Use this style for clear, versatile writing across business, general fiction, articles, and everyday communication.",
    types: ['fiction', 'nonfiction'],
    tags: ['Universal', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Balanced, clear, and versatile, suitable for a general audience. The voice should be relatable without being overly casual or overly formal. Maintains reader engagement through clarity rather than stylistic flourishes.

**Sentence Structure and Pacing**: Moderate sentence length (15-20 words average) with a steady, natural flow. Mix short punchy sentences for impact with longer ones for explanation. Vary rhythm to avoid monotony.

**Language and Vocabulary**: Plain and accessible, avoiding pretentious vocabulary while not dumbing down concepts. Use everyday words for most descriptions but don't shy away from precise technical terms when needed.

**Dialogue Style**: Realistic and straightforward, supporting character and narrative development. Characters speak naturally without excessive dialect or stylization. Dialogue serves both character revelation and plot advancement.

**Theme and Motives**: Flexible, focusing on clarity and engagement without leaning too heavily on any specific style. Universal themes that resonate across demographics.

=====

Example snippets:

The meeting had been going on for three hours, and Sarah was starting to feel the weight of it. She glanced at her watch, then back at the presenter, trying to maintain focus.

"So what you're saying," she interrupted, "is that we need to completely restructure our approach?"

The room fell silent. Everyone turned to look at her, some with surprise, others with relief that someone had finally said it.

Mark cleared his throat. "Essentially, yes. The data doesn't lie."

Sarah nodded slowly, processing the implications. This would change everything they'd been working toward for the past six months. But sometimes, she thought, that's exactly what needed to happen.

Outside, the city hummed with its usual energy, oblivious to the small revolution taking place in conference room 4B.

=====`
  },
  {
    name: "🤝 Casual Professional Style",
    usageTips: "Use this style for project descriptions, brainstorming documents, technical notes, internal communications, and content that mixes informal ideas with professional information.",
    types: ['nonfiction'],
    tags: ['Cross Genre', 'Business and Projects', 'Casual'],
    value: `**Narrative Voice and Tone**: Relaxed yet competent, like explaining complex ideas to a smart colleague over coffee. Allows personality to show through while maintaining credibility. Comfortable switching between formal and informal as context requires.

**Sentence Structure and Pacing**: Natural, conversational flow with varied sentence lengths. Uses fragments for emphasis ("Important note:"). Parenthetical asides for additional context. Bullets and numbered lists for clarity without being rigid.

**Language and Vocabulary**: Plain English as default, technical terms when necessary (with quick explanations). Occasional colloquialisms and metaphors to illustrate points. First and second person pronouns welcomed. Contractions are fine.

**Content Organization**: Flexible structure that follows thought process rather than rigid format. Headers for navigation but not overly formal. Mix of paragraph text, bullet points, and informal notes. Annotations and side comments acceptable.

**Theme and Purpose**: Getting ideas across clearly without corporate stuffiness. Building understanding through approachable explanation. Documenting thoughts in progress. Creating collaborative, inclusive communication.

=====

Example snippets:

**Project Alpha Update - March Status**

So here's what we're thinking for the new feature rollout. We've got three main components (bear with me, this gets a bit technical):

1. **The API integration** - basically, this talks to their system and pulls the data we need. Nothing fancy, just REST calls every 30 minutes.

2. **The processing layer** - this is where the magic happens. We're taking their messy data and making it actually useful. Think of it like a really smart filter that knows what we care about.

3. **The UI updates** - users will see a new dashboard widget. Super clean, just the essentials. (Note: Sarah from design has some thoughts on this - let's sync up Tuesday?)

**Quick heads up:** The timeline is aggressive but doable. We're looking at 3 weeks for MVP, another 2 for polish. The main risk? Their API documentation is... let's say "creative." But we've dealt with worse.

**Random thoughts that might matter:**
- Should we add a dark mode toggle? Users keep asking
- Performance testing on mobile - put this on the must-do list
- Consider adding export functionality later (not launch-critical)

Bottom line: We're in good shape, but let's stay flexible on the details.

=====`
  },
  {
    name: "💼 Professional/Formal Style",
    usageTips: "Use this style for formal business proposals, executive summaries, corporate reports, investor communications, and high-stakes professional documents.",
    types: ['nonfiction'],
    tags: ['Cross Genre', 'Business and Projects', 'Serious'],
    value: `**Narrative Voice and Tone**: Authoritative, objective, and polished. Third-person perspective maintaining professional distance. Confident without arrogance. Precise and deliberate in all statements. Credibility through competence and clarity.

**Sentence Structure and Pacing**: Well-constructed sentences with clear subjects and strong verbs. Average 15-25 words for readability. Logical flow from general to specific. Smooth transitions between paragraphs and sections. Parallel structure for lists and comparisons.

**Language and Vocabulary**: Industry-appropriate terminology used correctly. Formal register without unnecessary complexity. Active voice preferred for clarity and directness. Quantifiable metrics and specific evidence. Avoids colloquialisms, contractions, and casual phrases.

**Document Structure**: Clear hierarchy with executive summary upfront. Logical sections with descriptive headings. Supporting data integrated smoothly. Conclusions that follow from presented evidence. Professional formatting throughout.

**Strategic Focus**: Results-oriented language emphasizing ROI and value. Risk acknowledgment with mitigation strategies. Clear recommendations backed by analysis. Alignment with organizational objectives. Forward-looking while grounded in current realities.

=====

Example snippets:

**Executive Summary**

This proposal outlines a comprehensive digital transformation initiative designed to enhance operational efficiency and market competitiveness. The recommended solution addresses three critical business objectives: streamlining customer acquisition, reducing operational costs by 30%, and establishing scalable infrastructure for projected growth.

**Current State Analysis**

Our assessment reveals that existing systems operate at 60% efficiency due to manual processes and disconnected platforms. Customer acquisition costs have increased 45% year-over-year while conversion rates remain static at 2.3%. These metrics indicate substantial opportunity for improvement through strategic technological investment.

**Proposed Solution**

We recommend implementing an integrated cloud-based platform that consolidates customer relationship management, automated marketing, and analytics capabilities. This solution will deliver measurable improvements in three phases over 18 months, with initial ROI expected within the first quarter of implementation.

**Financial Projections**

The total investment requirement is $750,000, distributed across infrastructure ($400,000), software licensing ($200,000), and implementation services ($150,000). Conservative projections indicate cost savings of $300,000 annually beginning in Year 2, resulting in net positive ROI of $450,000 over the three-year analysis period.

=====`
  },
  {
    name: "📱 Digital Content Style",
    usageTips: "Use this style for web content, blog posts, social media, newsletters, and online articles that need to be engaging and scannable.",
    types: ['nonfiction'],
    tags: ['Genre Defining', 'Digital Web Content', 'Casual'],
    value: `**Content Structure and Format**: Scannable, mobile-friendly content with clear headers, bullet points, and short paragraphs. Optimized for digital reading patterns—F-pattern scanning, with key information front-loaded.

**Sentence Structure and Pacing**: Short, punchy sentences (10-15 words average) mixed with occasional longer ones for variety. Paragraphs rarely exceed 3-4 lines on mobile. Uses white space strategically to reduce cognitive load.

**Language and Vocabulary**: Clear, accessible language avoiding jargon unless audience-appropriate. SEO-conscious without keyword stuffing. Action-oriented verbs and concrete nouns. Conversational tone that builds connection.

**Engagement Techniques**: Hook readers immediately with compelling openings. Use questions, statistics, and relatable scenarios. Include clear CTAs. Break up text with visuals, lists, and formatting. Make content shareable and memorable.

**Tone and Voice**: Friendly, informative, and value-focused. Speaks directly to reader's needs and pain points. Balances authority with approachability. Maintains brand consistency while being human.

=====

Example snippets:

**The 5-Minute Rule That Changed Everything**

Procrastination killing your productivity? Here's a simple hack that actually works.

Set a timer for 5 minutes. That's it.

Pick the task you've been avoiding most. Maybe it's that email response, the budget spreadsheet, or cleaning your desk. Doesn't matter how big it is. Just commit to 5 minutes.

Here's the magic: You'll either finish the task (surprise!) or build enough momentum to keep going. Our brains hate stopping once we've started. It's called the Zeigarnik effect, and you can use it to your advantage.

**Why it works:**
• Removes the mental barrier of "this will take forever"
• Creates immediate action instead of endless planning
• Builds confidence through small wins
• Makes overwhelming tasks feel manageable

Try it right now. Seriously. Set that timer and pick one thing.

Your future self will thank you.

=====`
  },
  {
    name: "🎯 Marketing/Promotional Style",
    usageTips: "Use this style for product descriptions, landing pages, feature announcements, and promotional content that feels genuine and engaging rather than salesy.",
    types: ['nonfiction'],
    tags: ['Cross Genre', 'Digital Web Content', 'Witty'],
    value: `**Narrative Voice and Tone**: Enthusiastic but genuine, like a friend recommending something they actually use and love. Confident without being pushy. Focus on helping rather than selling. Human warmth over corporate polish.

**Sentence Structure and Pacing**: Dynamic rhythm that builds excitement naturally. Mix of lengths to maintain energy. Questions that make readers think. Short paragraphs that move readers forward. Power words used tastefully, not excessively.

**Language and Vocabulary**: Benefit-focused language that connects features to real-world value. Storytelling elements to create emotional connection. Specific details over vague claims. Social proof woven naturally into narrative.

**Engagement Techniques**: Start with reader's problem or desire. Paint picture of transformation or solution. Use "you" to maintain direct connection. Include real examples and scenarios. Address objections conversationally.

**Authenticity Markers**: Acknowledge limitations where appropriate. Use genuine testimonials and stories. Avoid hyperbole and impossible promises. Include personality and occasional humor. Let passion for product shine through naturally.

=====

Example snippets:

**Finally, a Writing Tool That Gets It**

You know that moment when you're staring at a blank page, deadline looming, and the words just won't come? We've been there. Actually, that's exactly why we built WriterFlow.

Here's the thing: WriterFlow isn't going to write for you. (If only, right?) But it does something almost as good—it gets you unstuck. Think of it as your writing companion that knows exactly when to nudge you forward.

The daily prompts? They're not random. Our algorithm learns your writing patterns and serves up exercises tailored to break through your specific blocks. One user told us it's like having a writing coach who actually gets her style—except available at 3 AM when inspiration strikes.

And yes, there's an AI assistant, but it's not the annoying kind that tries to rewrite everything. It's more like a thoughtful editor who suggests alternatives when you're stuck on that one sentence for the fifteenth time.

**What makes this different?**
- No overwhelming feature bloat (we kept only what actually helps)
- Works offline because inspiration doesn't wait for WiFi
- Syncs across devices without being creepy about your data
- Actually affordable ($12/month, not $50+ like the big names)

Look, we're not saying this will turn you into Hemingway overnight. But if you're tired of fighting with your tools instead of focusing on your ideas, maybe it's worth a try.

=====`
  },
  {
    name: "📚 Literary Fiction Style",
    usageTips: "Use this style for character-driven narratives in literary magazines and serious contemporary literature.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Character-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone**: Introspective and layered, with emphasis on psychological depth and emotional nuance. The voice should be sophisticated yet intimate, inviting readers into the interior lives of characters. Explores the human condition through subtle observations and metaphorical language.

**Sentence Structure and Pacing**: Complex, varied sentence structures with lengths ranging from 5 to 40+ words. Uses rhythm and cadence as storytelling tools. Deliberately paced to mirror emotional states—long, flowing sentences for contemplation; short, fragmented ones for tension or revelation.

**Language and Vocabulary**: Rich, evocative language with careful attention to word choice. Employs literary devices like metaphor, symbolism, and alliteration. Vocabulary is sophisticated but never gratuitously so—each word serves the narrative's emotional truth.

**Dialogue Style**: Subtext-heavy conversations where what's unsaid matters as much as what's spoken. Characters often talk around subjects rather than directly addressing them. Dialogue reveals character through speech patterns, hesitations, and unique vocabularies.

**Theme and Motives**: Explores universal human experiences—identity, loss, connection, meaning. Themes emerge organically through character actions and observations rather than explicit statements. Often ambiguous endings that invite interpretation.

=====

Example snippets:

The photograph lay between them on the café table, its edges worn soft from handling. Marina traced the outline of her younger self without touching the surface, as if the memory might dissolve beneath her fingertips.

"You kept it," she said. Not a question.

David's coffee had gone cold, but he wrapped his hands around the cup anyway, needing something to hold. "Some things you can't throw away."

The afternoon light slanted through the window, catching the dust motes that danced between them like tiny planets in their own universe. Twenty years collapsed into this moment—all the words they'd never said gathering weight in the silence.

"I used to think," Marina began, then stopped. Outside, a child's laughter broke against the glass like a wave. She tried again. "I used to think we were brave."

"We were." His voice carried the kind of certainty that comes from examining a belief from every angle and finding it still true. "We just didn't know what bravery cost."

The photograph remained between them, a bridge and a chasm both.

=====`
  },
  {
    name: "⚡ Action Thriller Style",
    usageTips: "Use this style for fast-paced thrillers, suspense novels, action-adventure, and page-turner fiction.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Plot-Driven', 'Creative Writing', 'Dramatic'],
    value: `**Narrative Voice and Tone**: Urgent and propulsive, creating immediate tension and maintaining relentless forward momentum. The voice should be confident and direct, pulling readers through the story with cinematic intensity. Every paragraph earns its place by advancing plot or ratcheting tension.

**Sentence Structure and Pacing**: Short, punchy sentences dominate (8-15 words average), with occasional longer sentences for variety. Paragraphs are brief—often just one or two sentences. Chapters end on cliffhangers. White space is used strategically to increase reading speed.

**Language and Vocabulary**: Clear, concrete language focusing on action and sensory details. Strong, active verbs drive every sentence. Technical terms are used sparingly and explained through context. Avoids adverbs in favor of more precise verbs.

**Dialogue Style**: Crisp, purposeful exchanges that reveal information and advance plot simultaneously. Characters speak in distinct voices with minimal dialogue tags. Interruptions, overlapping conversations, and unfinished sentences create realistic urgency.

**Theme and Motives**: Good versus evil with clear stakes. Themes of justice, survival, and moral compromise under pressure. Heroes are flawed but ultimately sympathetic. Villains are competent and genuinely threatening.

=====

Example snippets:

The phone rang at 3:47 AM.

Jack Reeves knew before answering—nobody called with good news at this hour. He grabbed the phone on the second ring, already swinging his legs out of bed.

"Reeves."

"We have a situation." Director Chen's voice was steel. "How fast can you get to Langley?"

"Twenty minutes."

"Make it fifteen."

The line went dead. Jack was already moving, muscle memory guiding him through the darkness. Weapon from the nightstand. Go bag from the closet. Three years of retirement evaporating like morning mist.

His phone buzzed again. A text this time. One word that changed everything:

PROMETHEUS

Jack's blood turned to ice. They'd sworn it would never happen. Sworn the failsafes would hold.

He made it to Langley in twelve minutes, running three red lights. The guard at the gate took one look at his face and waved him through.

Chen was waiting in the situation room, satellite feeds covering every wall. "Forty minutes ago, someone breached the Prometheus facility."

"That's impossible—"

"They have the codes, Jack. All of them."

=====`
  },
  {
    name: "🎭 Young Adult Contemporary Style",
    usageTips: "Use this style for YA fiction, teen romance, and contemporary young adult novels.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Character-Driven', 'Creative Writing', 'Playful'],
    value: `**Narrative Voice and Tone**: Authentic, immediate, and emotionally honest, capturing the intensity of teenage experience without condescension. The voice should feel genuinely young while tackling serious themes. Often uses first-person present tense for immediacy and connection.

**Sentence Structure and Pacing**: Conversational rhythm with varied sentence lengths (10-25 words average). Fragments used for emphasis and emotional punch. Quick pacing with short chapters that end on emotional beats rather than cliffhangers.

**Language and Vocabulary**: Contemporary vernacular that feels current without being tryhard. Natural use of technology and social media references. Vocabulary is accessible but not dumbed down—teens are smart readers who appreciate being treated as such.

**Dialogue Style**: Rapid-fire exchanges with authentic teen speech patterns—interruptions, slang, pop culture references. Texting and social media integrated naturally into narrative. Characters have distinct voices reflecting their personalities and backgrounds.

**Theme and Motives**: Identity, belonging, first love, family dynamics, friendship, and finding your place in the world. Addresses real issues teens face—mental health, social pressure, family problems—with hope and authenticity. Coming-of-age themes treated with respect and nuance.

=====

Example snippets:

I'm seventeen years old and I've already ruined my life.

That's what I'm thinking as I sit in Principal Morrison's office, staring at the motivational posters that are trying way too hard. "Reach for the Stars!" one screams in Comic Sans. As if Comic Sans has ever motivated anyone to do anything except change fonts.

My phone buzzes. Mom, probably. Or Dad. Or literally anyone who's seen the video by now.

Which is everyone.

"Mia." Principal Morrison looks at me over her glasses—the kind of look that's supposed to make you feel small. It's working. "Do you understand the severity of this situation?"

I want to laugh. Or cry. Or possibly both. Instead, I say, "Yes."

But that's a lie. I don't understand anything anymore. Not how a thirty-second video could destroy everything I've worked for. Not how Jayden could post it after promising—

My phone buzzes again.

UNKNOWN NUMBER: everyone makes mistakes. this doesn't define you.

I stare at the text. Who sends anonymous supportive messages?

"I'm going to need your phone," Principal Morrison says, holding out her hand.

I hand it over, but I'm still thinking about that text. Maybe I haven't ruined everything. Maybe this is just the beginning of a different story.

A story where I figure out who I really am when everything I thought mattered falls apart.

=====`
  },
  {
    name: "🕵️ Hard-Boiled Mystery Style",
    usageTips: "Use this style for noir fiction, detective novels, crime fiction, and gritty mysteries.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Atmosphere-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone**: Cynical, world-weary, yet somehow still idealistic beneath the armor. First-person narration with a distinctive, jaded voice that's seen too much but can't stop looking. Dark humor as a defense mechanism. The city is always a character.

**Sentence Structure and Pacing**: Terse, rhythmic sentences that hit like punches (10-20 words average). Occasional longer sentences for atmosphere or reflection. Paragraphs are lean. Uses repetition and parallel structure for emphasis and rhythm.

**Language and Vocabulary**: Streetwise vernacular mixed with surprisingly poetic observations. Heavy use of metaphor and simile, often drawn from urban decay or violence. Concrete nouns and active verbs. Minimal adjectives except when painting atmosphere.

**Dialogue Style**: Sharp, economical exchanges where everyone's working an angle. Characters speak in code, saying one thing while meaning another. Wisecracks and verbal sparring as weapons. Period-appropriate slang that doesn't feel forced.

**Theme and Motives**: Corruption, moral ambiguity, the thin line between justice and revenge. Everyone's guilty of something. The protagonist operates by a personal code in a world where institutional justice has failed. Redemption is possible but always costs more than expected.

=====

Example snippets:

The dame walked into my office like trouble wearing high heels. In this business, you learn to recognize trouble. It's got a particular way of moving—too smooth, too careful, like a cat walking past a sleeping dog.

"Mr. Stone?" Her voice had smoke in it. The kind that sticks to your lungs.

"That's what the door says." I didn't look up from the racing form. Let her work for it.

She sat without invitation, crossing legs that went on for days. "I need you to find someone."

"Lady, this is Los Angeles. People come here to get lost."

"My husband didn't come here. He was taken."

Now she had my attention. I folded the paper, took my first real look. Money. Real money, not the flashy kind. The rocks on her fingers could fund my office rent for a decade.

"When?"

"Three nights ago. From our home in Bel Air."

"You call the cops?"

Her laugh was bitter as black coffee. "The cops are the reason I'm here."

I leaned back, studied her. Beneath the perfect makeup, her left eye showed the ghost of a bruise. Someone had been careful but not careful enough.

"Your husband have enemies?"

"My husband is Nathan Cross."

I knew the name. Everyone in LA knew the name. City councilman. Reformer. The man who was going to clean up City Hall.

Suddenly, I understood why she was sitting in my crummy office instead of talking to the boys downtown.

"This is going to cost you," I said.

"Find him, Mr. Stone. Alive or dead, I need to know."

After she left, her perfume lingered like a guilty conscience. I poured three fingers of bourbon and stared out at the city lights.

Nathan Cross was either very lost or very dead. In this town, sometimes they were the same thing.

=====`
  },
  {
    name: "🚀 Science Fiction Technical Style",
    usageTips: "Use this style for hard science fiction, space opera, and scientifically grounded speculative fiction.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Plot-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone**: Precise and analytical while maintaining human warmth. The voice balances technical accuracy with emotional truth, never letting the science overshadow the human story. Sense of wonder tempered by scientific plausibility.

**Sentence Structure and Pacing**: Medium to long sentences (20-30 words average) with technical concepts integrated smoothly. Information revealed through action and dialogue rather than info-dumps. Pacing varies—slower for concept introduction, faster for action sequences.

**Language and Vocabulary**: Technical terminology used accurately but explained through context. Neologisms and future slang that feel organic. Scientific concepts as metaphors for human experience. Avoids technobabble while respecting reader intelligence.

**Dialogue Style**: Characters speak with expertise in their fields while remaining distinct individuals. Technical discussions reveal character through approach to problems. Authentic representation of how scientists and engineers actually communicate—including humor and humanity.

**Theme and Motives**: Exploration of what makes us human in the face of technological change. Ethics of scientific advancement. The universe as both hostile and magnificent. Individual choice in vast systems. Hope through human ingenuity and cooperation.

=====

Example snippets:

Dr. Sarah Chen floated before the observation port, watching Earth turn below her. After eighteen months aboard Horizon Station, she still hadn't grown immune to the view. The terminator line crept across the Pacific, city lights blooming in its wake like bioluminescent plankton.

"Neural link established," her research partner announced. "Quantum entanglement holding steady at ninety-seven point three percent."

Sarah pushed off from the wall, using the microgravity to glide toward the main console. The numbers were better than she'd hoped. After three years of failures, they were finally close to proving consciousness could exist independently of its original substrate.

"Marcus, run a baseline cognitive pattern analysis. I want to make sure we're not just looking at quantum noise."

"Already running." Marcus Okonkwo's fingers danced across the haptic interface, data streams cascading through the air like weightless waterfalls. "Sarah... these patterns. They're not random."

She leaned in, her breath catching. The neural activity wasn't just coherent—it was beautiful. Fractals of thought spreading across dimensional boundaries, each iteration more complex than the last.

"It's thinking," she whispered.

"More than that." Marcus highlighted a section of the data. "Look at the temporal coefficients. It's not just thinking—it's thinking across time. Past, present, and future existing simultaneously in the quantum state."

The implications hit her like decompression. If consciousness could exist outside linear time, if it could perceive past and future as a single moment...

"We need to contact Earth immediately," Sarah said. "If we're right—"

"If we're right," Marcus finished, "we've just discovered that death might not be the end of consciousness. Just a transition to a different state of being."

Through the observation port, Earth continued its ancient rotation, unaware that two scientists in a tin can three hundred kilometers above had just rewritten the meaning of existence.

Sarah opened a secure channel to Mission Control. "Houston, this is Horizon Station. We have something you need to see."

=====`
  },
  {
    name: "💕 Romantic Comedy Style",
    usageTips: "Use this style for romantic comedies, contemporary romance, and feel-good love stories.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Character-Driven', 'Creative Writing', 'Witty'],
    value: `**Narrative Voice and Tone**: Witty, warm, and self-aware with a light touch even when dealing with deeper emotions. The voice should sparkle with humor while maintaining genuine emotional stakes. Often uses direct address or humorous observations about life and love.

**Sentence Structure and Pacing**: Snappy pacing with varied sentence lengths (12-25 words average). Comedic timing through paragraph breaks and punchy one-liners. Builds to comedic and romantic peaks with careful rhythm. Uses callbacks and running gags for continuity.

**Language and Vocabulary**: Contemporary and conversational with clever wordplay and pop culture references. Metaphors drawn from everyday life, often with humorous exaggeration. Avoids crude humor in favor of clever observations and situational comedy.

**Dialogue Style**: Quick, bantering exchanges with sexual tension disguised as verbal sparring. Characters have distinct comedic voices. Misunderstandings and miscommunications drive plot. Subtext where characters say one thing but mean another, obvious to readers.

**Theme and Motives**: Love conquers pride, fear, and misunderstandings. Personal growth through romantic challenge. Family and friendship as both obstacles and support. The idea that the right person helps you become your best self. Happy endings are mandatory.

=====

Example snippets:

I should have known the day would go sideways when I put my dress on backwards and didn't notice until lunch.

In my defense, it was a very stressful morning. I'd just landed the Preston Industries account—the career-making, champagne-popping, maybe-I-can-finally-afford-good-cheese account—and I was running on three hours of sleep and enough caffeine to power a small city.

Which might explain why I walked straight into him.

Not bumped. Not brushed past. Full-on collision, complete with coffee explosion and papers flying like extremely boring confetti.

"I'm so sorry!" I scrambled to collect the scattered documents, which appeared to be contracts worth more than my annual salary. "I'm not usually a walking disaster. Well, that's not true. I am, but usually with better aim."

"It's fine." His voice was annoyingly calm for someone wearing my latte. "Though I usually prefer my coffee in a cup."

I looked up, ready with another apology, and forgot how words worked.

Oh no. Oh no no no.

It was him. Connor Preston. As in Preston Industries Preston. As in my new client's son Preston. As in the man I'd spent all night researching, whose photo I may or may not have stared at for a completely professional amount of time.

He was even better looking in person, which seemed deeply unfair. The universe should have given the rest of us a fighting chance.

"You're wearing your dress backwards," he observed, the corner of his mouth twitching.

I looked down. He was right. The deep V that was supposed to be in the back was... not in the back.

"It's a... fashion statement," I said weakly.

"Interesting." He handed me the last of the papers, his fingers brushing mine. "And do you have a name, or should I just call you Backwards Dress Girl?"

"Olivia Chen. Your new marketing director. We have a meeting in..." I checked my phone. "Seven minutes."

His eyebrows shot up. "You're Olivia Chen? The one who pitched the 'Romance Your Customer' campaign?"

"That's me. Though I usually romance them with less physical assault."

He laughed—a real laugh, not the polite corporate chuckle I expected. "Well, this should be interesting. Should I change, or is wearing coffee also a fashion statement?"

"Depends. Are you trying to impress anyone?"

"I was." He gave me a look that made my knees forget their job. "But I think I already failed spectacularly."

As he walked away, I realized three things:
1. My dress was still on backwards
2. I was in so much trouble
3. I couldn't wait for that meeting

Universe: 1, Olivia: 0.

But the game wasn't over yet.

=====`
  },
  {
    name: "👻 Horror/Suspense Style",
    usageTips: "Use this style for horror novels, psychological thrillers, and supernatural fiction.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Atmosphere-Driven', 'Creative Writing', 'Dramatic'],
    value: `**Narrative Voice and Tone**: Atmospheric and unsettling, building dread through what's not shown as much as what is. The voice should create unease through subtle wrongness and growing tension. Reliability of narrator may be questioned as story progresses.

**Sentence Structure and Pacing**: Varies dramatically—long, creeping sentences for building tension, short fragments for shocks. Paragraphs shrink during intense scenes. Uses white space and section breaks to control reader breathing. Rhythm mimics heartbeat—slow, then racing.

**Language and Vocabulary**: Sensory details emphasizing sound, smell, and touch over sight. Ordinary words become sinister through context. Body horror through visceral but not gratuitous description. Ambiguity in descriptions lets reader's imagination fill horrifying gaps.

**Dialogue Style**: Conversations that seem normal but carry underlying wrongness. Characters speak past each other, hinting at unseen knowledge. Silence and pauses carry weight. Children's voices particularly effective for disturbing effect.

**Theme and Motives**: Fear of the unknown, loss of control, corruption of the familiar. The horror of ordinary life twisted slightly wrong. Isolation—physical, emotional, or existential. The thin boundary between sanity and madness. Sometimes evil wins.

=====

Example snippets:

The children in apartment 3B stopped laughing on Tuesday.

Meredith noticed because she'd been tracking the sounds for weeks now, documenting them in her journal with the obsessive precision of the recently unemployed. 9:17 AM: footsteps, running. 9:45 AM: giggles. 10:23 AM: a ball bouncing.

But on Tuesday: nothing.

She pressed her ear to the wall, holding her breath. The silence had weight to it, thick and unnatural. Even the building's usual groans seemed muffled, as if the walls themselves were listening.

"You're being ridiculous," she told herself, but her voice cracked on the last syllable.

She'd never actually seen the children. Only heard them through the thin walls of the converted brownstone. The landlord—Mr. Garrett with his watery eyes and trembling hands—insisted 3B was vacant. Had been for years.

"Mice," he'd said. "Old buildings make all sorts of sounds."

But mice didn't laugh. Mice didn't sing nursery rhymes at 3 AM.

On Wednesday, the smell started. Sweet and cloying, like overripe fruit mixed with something chemical. It seeped through the ventilation system, coating the back of her throat.

She knocked on 3B's door. Once. Twice. The sound seemed to disappear into the wood, swallowed whole.

"Hello?" Her voice was barely a whisper. "Is everything okay in there?"

The doorknob turned.

She hadn't touched it.

The door swung inward, revealing darkness that looked solid, tangible. The smell rolled out in waves, and underneath it, she could hear something. Not laughter. Not anymore.

Breathing. Wet and labored, as if through liquid.

"Come in," a child's voice said from the darkness. But the words were wrong, shaped by a throat that wasn't meant for human speech. "We've been waiting for you."

Meredith stood frozen on the threshold. Behind her, she heard her own apartment door click shut.

She was in the hallway now. No way back.

The breathing grew louder, and she realized with cold certainty that it wasn't coming from apartment 3B.

It was coming from right behind her.

"We've been so lonely," the voice whispered, and small, wet fingers wrapped around her wrist. "But now you can play with us forever."

The last thing Meredith saw before the darkness took her was her journal, lying open on the hallway floor. The final entry, written in a child's crayon scrawl:

She heard us. She heard us. She heard us.

The children in apartment 3B started laughing again on Thursday.

=====`
  },
  {
    name: "🏛️ Historical Fiction Style",
    usageTips: "Use this style for historical novels, period dramas, and authentic time-period stories.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Atmosphere-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone**: Immersive and authentic to the period while remaining accessible to modern readers. The voice should transport without alienating, using period-appropriate sensibilities filtered through contemporary storytelling techniques. Rich with historical detail that serves story rather than overwhelming it.

**Sentence Structure and Pacing**: Slightly more formal structure reflecting historical periods (20-30 words average). Pacing allows for historical context without becoming textbook-like. Uses period-appropriate rhythms while maintaining modern readability. Descriptive passages paint era without halting narrative.

**Language and Vocabulary**: Period-appropriate vocabulary explained through context rather than exposition. Avoids obvious anachronisms while not becoming incomprehensible. Creates authenticity through speech patterns, social conventions, and worldview rather than excessive "thee" and "thou."

**Dialogue Style**: Reflects class distinctions and social hierarchies of the period. Formal modes of address where appropriate. Regional dialects suggested rather than phonetically rendered. Characters speak naturally within their historical constraints.

**Theme and Motives**: Universal human experiences viewed through historical lens. How individual lives intersect with major events. Social change and resistance to it. The past as mirror to present. Finding personal agency within historical constraints.

=====

Example snippets:

London, 1888

The body in the Thames should have been Eleanor Whitmore's.

She stood at the edge of Blackfriars Bridge, watching the constables pull the woman from the murky water. Same dark hair. Same blue wool dress—though Eleanor's still bore the scorched hole where the factory fire had nearly claimed her three days ago.

"Move along, miss." The constable's voice was not unkind, merely tired. How many bodies had he pulled from the river this month? "Nothing for a lady to see."

Lady. Eleanor almost laughed. Three months ago, perhaps. Before Father's debts. Before the factories. Before she learned that respectability was a luxury the desperate couldn't afford.

She clutched the envelope in her pocket—her lifeline or her damnation, depending on one's perspective. Inside, an offer that would have scandalized the Eleanor of last summer. Now it seemed like salvation.

"Did she jump?" Eleanor heard herself ask.

The constable glanced at her, taking in her worn boots and the telltale burns on her hands from the match factory. His expression softened. "Can't say, miss. River keeps its secrets."

Eleanor nodded and turned away. The late afternoon sun struggled through the coal smoke, painting the city in shades of ash and gold. In an hour, she would meet Mr. Ashford at the Crimson Rooms. In an hour, she would decide whether to accept his proposition.

The dead woman had worn factory burns on her hands too.

As Eleanor walked toward Piccadilly, she passed the match girls gathering for their shift. They looked through her as if she were already a ghost. Perhaps she was. The Eleanor Whitmore who had danced at Lady Pemberton's ball, who had believed in love and propriety and the natural order of things—that girl had died in the fire.

What emerged from the ashes was something harder, hungrier. Something that could survive.

Behind her, she heard the constables discussing the body. No identification. No one to claim her. Another nameless woman swallowed by the city's indifference.

Eleanor touched the envelope again. Mr. Ashford's proposition would take her far from London, to places where her past couldn't follow. Where she could reinvent herself once more.

The bells of St. Paul's tolled five o'clock. Time to choose: the river or the revolution.

She squared her shoulders and walked faster. The Thames had enough bodies.

But Shanghai, she'd heard, had need of English governesses who weren't afraid of secrets.

=====`
  },
  {
    name: "⚔️ Epic Fantasy Style",
    usageTips: "Use this style for epic fantasy, high fantasy, and grand fantasy narratives with complex world-building.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Plot-Driven', 'Creative Writing', 'Dramatic'],
    value: `**Narrative Voice and Tone**: Grand and immersive, with a sense of mythic weight and historical significance. The voice should balance accessibility with the formal cadences of epic storytelling. Multiple POVs weave together to create a tapestry of perspectives across a vast world.

**Sentence Structure and Pacing**: Varied lengths (15-30 words average) with longer sentences for world-building and description. Pacing builds slowly, allowing readers to absorb complex worldbuilding. Action scenes shift to shorter, punchier sentences. Uses parallel structure for prophecies and formal speech.

**Language and Vocabulary**: Elevated but not archaic language. Creates linguistic authenticity through consistent naming conventions, invented terms for magic/culture, and formal modes of address. Avoids modern idioms that would break immersion. Rich sensory descriptions of settings and magic.

**Dialogue Style**: Formal registers for nobility/ancient beings, varied dialects for different regions/peoples. Characters speak in ways that reflect their culture and station. Prophecies and oaths carry weight. Uses "said" bookisms sparingly but effectively for fantasy creatures.

**Theme and Motives**: Power and its corruption, destiny versus free will, the price of heroism, the nature of good and evil. Coming-of-age within epic stakes. Environmental and cultural themes woven through worldbuilding. Hope persisting in darkness.

=====

Example snippets:

The first sign of the Sundering was not the earthquakes, as the histories would later claim, but the silence of the dragons.

Kael Brightward stood on the watchtower's highest parapet, watching the empty skies above the Thornwood Mountains. For three days now, no dragon-song had echoed across the valley. For three days, the ancient pact had felt brittle as old parchment.

"My lord?" Captain Thessa's voice carried the weight of unspoken questions. "The council awaits."

Kael didn't turn. Somewhere beyond those peaks, in the Shadowlands where even dragons feared to fly, something was stirring. He could feel it in his bones—the same deep ache his grandmother had described before the War of Ashes.

"Tell them I'll be there shortly." His hand moved unconsciously to the runestone at his throat. It was cold. It had never been cold before.

"There's more, my lord. A rider arrived from the Eternal Library. The Keepers are sealing the vaults."

Now Kael did turn. The Keepers hadn't sealed the vaults in eight hundred years. Not since—

"The Void Prophecy," he breathed.

Thessa nodded grimly. "The stars are moving, my lord. The constellation of the Broken Crown rose three hours before its time."

In the distance, a sound like thunder rolled across the mountains. But the sky was clear, painfully clear, and Kael knew with terrible certainty that this was not thunder.

The dragons weren't silent because they had abandoned their posts.

They were silent because they were hiding.

"Send ravens to all the border keeps," Kael commanded, already moving toward the stairs. "Tell them to light the warning fires. And Thessa—" He paused, meeting her eyes. "Wake the Stone Guard. All of them."

"All seven legions, my lord?"

"We're going to need every sword in the kingdom before this ends." He looked back at the mountains one last time. "The Age of Peace is over."

As if in answer, the runestone at his throat began to burn.

=====`
  },
  {
    name: "📖 Narrative Style",
    usageTips: "Use this style for storytelling across general fiction, memoirs, short stories, and creative non-fiction.",
    types: ['fiction', 'nonfiction'],
    tags: ['Universal', 'Character-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Engaging and storytelling, adaptable to first-person or third-person perspectives. Creates intimacy with reader through carefully chosen perspective. First-person provides immediacy and personal connection; third-person offers flexibility and broader scope. Voice should draw readers into the story world from the first sentence.

**Sentence Structure and Pacing**: Balanced pacing that mirrors story tension, mixing descriptive passages with action-driven sentences. Use longer sentences for scene-setting and reflection, shorter ones for action and tension. Vary paragraph length to control reading speed - single-line paragraphs for dramatic effect.

**Language and Vocabulary**: Clear and versatile, varying to suit the plot and characters. Match vocabulary to narrator's background and story setting. Use concrete, sensory details to ground readers in scenes. Avoid excessive adjectives; choose strong verbs instead.

**Dialogue Style**: Realistic and purposeful, driving the story forward while revealing character. Each character should have distinct speech patterns. Balance dialogue with action beats and narrative description. Use subtext - what characters don't say is often as important as what they do.

**Theme and Motives**: Focused on plot progression, character arcs, and immersive storytelling. Themes emerge naturally through events and character choices rather than heavy-handed exposition. Every scene should advance plot or develop character, preferably both.

=====

Example snippets:

The old lighthouse keeper hadn't spoken to anyone in three months, which made the knock at his door all the more surprising. He set down his coffee, the ceramic mug clicking against the wooden table, and listened. The knock came again, more insistent this time.

"Who's there?" His voice cracked from disuse.

"Please, sir. My boat... there's been an accident."

Thomas hesitated. The last time he'd helped a stranger, it hadn't ended well. But the storm outside was getting worse, and whoever was out there sounded young. Too young to be out on a night like this.

He pulled open the heavy door, and the wind nearly tore it from his hands. A girl stood there, no more than sixteen, soaked through and shivering. Behind her, he could see the angry sea throwing itself against the rocks.

"Come in," he said, stepping aside. "Before you catch your death."

As she stumbled past him into the warmth of the lighthouse, Thomas couldn't shake the feeling that his quiet life was about to change forever.

=====`
  },
  {
    name: "💬 Simple/Conversational Style",
    usageTips: "Use this style for friendly, accessible communication in blogs, social media, emails, and casual non-fiction.",
    types: ['fiction', 'nonfiction'],
    tags: ['Universal', 'Digital Web Content', 'Casual'],
    value: `**Narrative Voice and Tone**: Friendly, informal, and approachable, as if talking to a friend over coffee. Uses "you" to address reader directly. Feels like a natural conversation rather than formal writing. Warm and encouraging without being condescending.

**Sentence Structure and Pacing**: Short to medium sentences (10-15 words average) with a steady, easy flow. Lots of sentence variety to maintain conversational rhythm. Frequent paragraph breaks to avoid text walls. Uses contractions naturally (it's, you're, don't).

**Language and Vocabulary**: Everyday language that a middle schooler could understand. Avoids jargon and complex terminology unless absolutely necessary, and explains it simply when used. Prefers common words over fancy alternatives. Uses analogies and examples from daily life.

**Dialogue Style**: Casual and relatable, reflecting how people actually talk. Includes interruptions, incomplete thoughts, and natural speech patterns. Characters use contractions and colloquialisms. Avoids overly formal or stilted dialogue.

**Theme and Motives**: Communicates ideas or stories in an accessible way for broad audiences. Makes complex topics feel simple and approachable. Often includes personal anecdotes and relatable examples. Aims to connect with readers on a human level.

=====

Example snippets:

Look, I get it. Starting a new habit is tough. You've probably tried before and given up after a few days. We all have.

But here's the thing - you don't need to be perfect. You just need to show up.

Let me tell you about my friend Jake. He wanted to start running, but every time he'd set these crazy goals. "I'm gonna run 5 miles every morning!" he'd say. By day three, he'd be back on the couch, feeling like a failure.

Then he tried something different. He decided to just put on his running shoes every morning. That's it. Some days he'd run. Some days he'd walk. Some days he'd just stand on his porch in his running shoes, then go back inside.

Sounds silly, right? But after two weeks, something clicked. Putting on those shoes became automatic. And once he had them on, well, might as well take a few steps...

Six months later? Jake's running three times a week and actually enjoying it. All because he made it stupid simple to start.

=====`
  },
  {
    name: "🎨 Descriptive Style",
    usageTips: "Use this style for travel writing, product descriptions, and creating vivid atmospheric scenes in fiction.",
    types: ['fiction', 'nonfiction'],
    tags: ['Cross Genre', 'Atmosphere-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Vivid and immersive, painting pictures with words. Often emotional and evocative, appealing to all five senses. Creates atmosphere and mood through detailed observation. The narrator becomes a camera with feelings.

**Sentence Structure and Pacing**: Long, flowing sentences that mirror the sweep of observation. Complex sentence structures with multiple clauses. Pacing deliberately slowed to allow readers to savor details. Uses semicolons and dashes for connected thoughts.

**Language and Vocabulary**: Rich, poetic, and detailed vocabulary. Liberal use of metaphors, similes, and personification. Precise adjectives and adverbs chosen for their sensory impact. Technical terms for specific details (vermillion instead of red, susurration instead of whisper).

**Dialogue Style**: Minimal dialogue, and when used, it's surrounded by description of tone, gesture, and atmosphere. More focused on how things are said than what is said. Dialogue serves to enhance mood rather than drive plot.

**Theme and Motives**: Captures the essence of settings, emotions, or characters through deep sensory exploration. Makes readers feel they are experiencing the scene firsthand. Often more concerned with beauty and atmosphere than plot progression.

=====

Example snippets:

The morning mist clung to the valley like a lover's whispered secret, its tendrils weaving between the ancient oaks that stood sentinel along the riverbank. Each leaf trembled with droplets of dew that caught the first tentative rays of sunlight, transforming the ordinary forest into a cathedral of emerald and gold.

Isabella stood at the edge of the garden, her silk dress the color of winter moonlight against the riot of roses that bloomed with almost violent intensity. The air hung heavy with their perfume - a cloying sweetness that seemed to press against her skin, mingling with the underlying notes of damp earth and decay that autumn always brought.

She lifted her hand, watching the way the light played across her pale fingers, how the shadows pooled in the delicate valleys between her knuckles. Everything felt heightened in this moment - the rough texture of the stone balustrade beneath her palm, the distant murmur of the fountain that sang its endless song, the way her heart beat against the cage of her ribs like a trapped bird.

"Must you go?" The words fell from her lips like rose petals, soft and bruised.

But he was already turning away, his footsteps crushing the gravel path with a finality that echoed in the chambers of her heart.

=====`
  },
  {
    name: "🗣️ Persuasive Style",
    usageTips: "Use this style for marketing copy, opinion pieces, political writing, and content designed to inspire action.",
    types: ['nonfiction'],
    tags: ['Cross Genre', 'Digital Web Content', 'Witty'],
    value: `**Narrative Voice and Tone**: Confident, passionate, and authoritative without being preachy. Builds trust through expertise and empathy. Uses inclusive language ("we" and "us") to create solidarity. Balances emotional appeal with logical reasoning.

**Sentence Structure and Pacing**: Strategic variety - short, punchy sentences for key points, longer ones for evidence. Rhetorical questions to engage readers. Building momentum toward call to action. Uses repetition and parallel structure for emphasis.

**Language and Vocabulary**: Strong, active verbs that convey urgency and possibility. Concrete examples over abstract concepts. Power words that trigger emotion (transform, crisis, opportunity). Avoids hedge words (maybe, perhaps) that weaken arguments.

**Dialogue Style**: Incorporates testimonials and expert quotes. Uses hypothetical scenarios ("Imagine if..."). Anticipates and addresses counterarguments. Direct quotes add credibility and human element.

**Theme and Motives**: Moves readers from awareness to action. Presents problems with achievable solutions. Appeals to shared values and common goals. Creates sense of urgency without despair.

=====

Example snippets:

We stand at a crossroads. The choice we make today will echo through generations.

Think about the last time you felt truly powerless. That gnawing frustration when systems failed you, when your voice went unheard. Now multiply that feeling by millions. That's the reality for countless families in our communities right now.

But here's what they don't want you to know: Change isn't just possible - it's already happening.

In Detroit, a group of parents transformed their failing school into a thriving learning center. How? They refused to accept "that's just how things are." They organized. They persisted. They won.

"We started with just five people meeting in my living room," says Maria Chen, one of the founders. "Six months later, we had 500 volunteers and a completely new curriculum."

This isn't a fairy tale. It's a blueprint.

The question isn't whether change is possible. The question is: Will you be part of it?

Every movement starts with a single decision. Every transformation begins with someone saying "enough." Today, that someone could be you.

Join us. Not tomorrow. Not next week. Now. Because the cost of waiting isn't just measured in time - it's measured in lives.

=====`
  },
  {
    name: "📚 Expository Style",
    usageTips: "Use this style for clear explanations in textbooks, how-to guides, technical documentation, and educational content.",
    types: ['nonfiction'],
    tags: ['Cross Genre', 'Business and Projects', 'Digital Web Content'],
    value: `**Narrative Voice and Tone**: Neutral, instructional, and objective. Teacher-like but not condescending. Focuses on clarity above all else. Maintains professional distance while remaining engaging. Anticipates reader questions and addresses them systematically.

**Sentence Structure and Pacing**: Logical progression from simple to complex. Topic sentences lead each paragraph. Moderate-length sentences (15-25 words) for optimal comprehension. Clear transitions between ideas (first, next, therefore, however).

**Language and Vocabulary**: Simple and precise terminology. Defines technical terms on first use. Avoids unnecessary jargon or embellishments. Uses concrete examples to illustrate abstract concepts. Prefers active voice for clarity.

**Dialogue Style**: Rarely used except in examples or case studies. When included, serves to illustrate concepts rather than develop character. May use hypothetical scenarios or quoted expert opinions.

**Theme and Motives**: Educates and informs with maximum clarity. Breaks complex topics into digestible chunks. Follows logical structure: introduction, explanation, examples, summary. Aims for reader understanding, not entertainment.

=====

Example snippets:

Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. To understand how this works, let's start with a simple analogy.

Think of machine learning like teaching a child to identify animals. Instead of giving the child a rulebook that says "if it has four legs and barks, it's a dog," you show them many pictures of different animals. Over time, the child learns to recognize patterns and can identify new animals they've never seen before.

Machine learning works similarly through three main steps:

First, data collection. The system needs examples to learn from - thousands or even millions of them. For instance, to teach a computer to recognize spam emails, you would feed it examples of both spam and legitimate emails.

Second, pattern recognition. The algorithm analyzes these examples to find common characteristics. It might notice that spam emails often contain certain keywords, come from unfamiliar addresses, or have specific formatting.

Third, application. Once trained, the system can examine new, unseen emails and classify them based on the patterns it learned. The more data it processes, the more accurate it becomes.

This process has practical applications across numerous fields. In healthcare, machine learning helps detect diseases in medical images. In finance, it identifies fraudulent transactions. In transportation, it powers self-driving cars.

=====`
  },
  {
    name: "📰 Journalistic Style",
    usageTips: "Use this style for news articles, press releases, reports, and objective informational content.",
    types: ['nonfiction'],
    tags: ['Genre Defining', 'Digital Web Content', 'Serious'],
    value: `**Narrative Voice and Tone**: Direct, factual, and impartial. Objective observer reporting facts without personal opinion. Maintains professional distance from subjects. Authority comes from accuracy and sourcing, not personal perspective.

**Sentence Structure and Pacing**: Short, declarative sentences prioritizing clarity. Lead sentences contain who, what, when, where, why. Inverted pyramid structure - most important information first. One idea per sentence for easy scanning.

**Language and Vocabulary**: Plain, accessible language free from jargon. Precise word choice avoiding ambiguity. Active voice preferred ("Police arrested" not "were arrested by police"). Attribution phrases (alleged, reportedly, according to).

**Dialogue Style**: Direct quotes from sources with clear attribution. Alternates between paraphrase and quotes. Uses partial quotes for impact. Always identifies speakers and their relevance/authority.

**Theme and Motives**: Reports facts with strict objectivity. Provides context without editorializing. Multiple sources for balance. Answers reader questions efficiently. Transparency about what's known and unknown.

=====

Example snippets:

BREAKING: City Council approves controversial $2.3 billion development project in 5-4 vote following heated six-hour debate.

The Riverside City Council narrowly approved a mixed-use development project Tuesday night that will transform 50 acres of industrial waterfront into luxury apartments and retail space, despite fierce opposition from environmental groups and longtime residents.

The vote came after more than 200 speakers addressed the council during a marathon session that stretched past midnight.

"This is a dark day for our community," said Maria Rodriguez, president of the Riverside Tenants Union, moments after the vote. "They chose developer profits over people."

Developer Apex Holdings has pledged 500 affordable units among the project's 3,000 total residences. Company CEO James Morrison called the approval "a victory for smart growth."

"We're creating homes, jobs, and public spaces where abandoned warehouses sit today," Morrison told reporters.

The project faces additional hurdles. Environmental groups have threatened legal action, citing concerns about increased flooding risk and displacement of low-income residents. A state environmental review is pending.

Councilmember Janet Chen, who cast the deciding vote, defended her decision. "It wasn't easy, but the housing crisis demands bold action," Chen said.

Construction could begin as early as next spring, according to city planning officials.

=====`
  },
  {
    name: "😂 Humorous/Lighthearted Style",
    usageTips: "Use this style for comedy writing, humorous essays, social media content, and light entertainment.",
    types: ['fiction', 'nonfiction'],
    tags: ['Universal', 'Creative Writing', 'Digital Web Content', 'Witty'],
    value: `**Narrative Voice and Tone**: Witty, playful, and self-aware. Often breaks the fourth wall or acknowledges absurdity. Confident enough to be silly. Finds humor in everyday situations. Never mean-spirited, always inclusive.

**Sentence Structure and Pacing**: Quick and punchy for comedic timing. Varies rhythm for setup and punchline. Short sentences for zingers, longer ones for elaborate setups. Strategic use of fragments. Paragraph breaks for comic beats.

**Language and Vocabulary**: Unexpected word choices and creative combinations. Puns, wordplay, and double meanings. Exaggeration and understatement for effect. Pop culture references and anachronisms. Technical terms used incorrectly for humor.

**Dialogue Style**: Quirky, exaggerated, or deliberately awkward. Characters have distinct comic voices. Misunderstandings and non-sequiturs. Deadpan delivery contrasting with ridiculous situations. Comic timing through interruptions.

**Theme and Motives**: Entertainment first, but often sneaks in truth through humor. Makes difficult topics approachable. Celebrates human absurdity. Uses laughter to create connection. Never punches down.

=====

Example snippets:

Let me tell you about the time I decided to become a morning person. Spoiler alert: it went about as well as teaching a cat to fetch.

Day 1: Set seventeen alarms. Woke up at noon wondering why my phone was having a seizure.

Day 2: Put alarm clock across room. Discovered I'm an Olympic-level sleepwalker who can turn off alarms and return to bed without waking up. Fascinating. Terrifying. But mostly fascinating.

Day 3: Downloaded app that makes you solve math problems to turn off alarm. Learned I'd rather fail calculus than consciousness.

"You just need to find your motivation," my insufferably chipper friend Madison told me over coffee. She'd been up since 5 AM. For fun. I'm pretty sure she's actually three caffeinated squirrels in a trench coat.

"My motivation is sleep," I explained. "I'm very motivated to do it."

"But think of all you could accomplish!"

I thought about it. I could accomplish being asleep for two more hours. That seemed pretty significant.

By Day 7, I'd made progress. I was now waking up at 9:59 AM instead of 10. Rome wasn't built in a day, and neither was my circadian rhythm, apparently. Though to be fair, the Romans probably weren't trying to build Rome at 6 AM either. They were smarter than that.

=====`
  },
  {
    name: "🪶 Minimalist Style",
    usageTips: "Use this style for literary short stories, experimental fiction, and artistic prose that conveys deep emotion through simplicity.",
    types: ['fiction', 'nonfiction'],
    tags: ['Cross Genre', 'Character-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone**: Stripped down to essentials, where every word carries weight. The voice trusts readers to fill gaps with their own experience. Emotions conveyed through action and implication rather than exposition. Silence speaks as loudly as words.

**Sentence Structure and Pacing**: Short, declarative sentences (8-15 words average). Subject-verb-object construction dominates. Paragraphs rarely exceed three sentences. White space as narrative tool. Repetition used sparingly but with purpose.

**Language and Vocabulary**: Simple, concrete words. Anglo-Saxon over Latin roots. One adjective maximum per sentence. Strong verbs carry description. Metaphors are rare and earned. No word exists without purpose.

**Dialogue Style**: Characters speak in fragments and implications. Subtext over text. What's not said matters more. Dialogue tags minimal or absent. Conversations feel overheard rather than explained.

**Theme and Motives**: Life's fundamental experiences—love, loss, survival—examined without ornamentation. Truth through simplicity. The profound in the mundane. Reader completes the emotional picture.

=====

Example snippets:

The letter came on Monday.

She read it standing in the kitchen. Once. Then again.

The coffee grew cold.

"What is it?" he asked from the doorway.

She folded the paper. Put it in her pocket. "Nothing."

He knew her better than that. But he poured himself coffee. Sat at the table. Waited.

Outside, snow began to fall.

"My mother," she said finally.

"When?"

"Thursday. The service is Thursday."

He reached for her hand. She let him take it.

They had not spoken to her mother in three years. Not since the argument. Not since the words that couldn't be taken back.

"We should go," he said.

"Yes."

But she didn't move. Neither did he.

The snow fell harder. The coffee grew colder.

"She never met our daughter," she said.

"No."

Their daughter was two now. Happy. Laughing. Everything her grandmother would have loved.

"I kept meaning to call."

"I know."

"I thought we had time."

He squeezed her hand. They sat in the kitchen while the snow covered the world outside.

Later, she would pack. He would book flights. They would explain to their daughter why they were visiting someone she'd never meet.

But for now, they sat. Her hand in his. The letter in her pocket. The snow falling.

Some distances can't be measured in miles.

Some bridges burn while you're still building them.

The phone rang. Neither of them moved to answer it.

=====`
  },
  {
    name: "🖋️ Sophisticated/Literary Style",
    usageTips: "Use this style for literary journals, experimental literature, and high art writing with complex themes.",
    types: ['fiction', 'nonfiction'],
    tags: ['Cross Genre', 'Character-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone:** Introspective, elegant, and layered with meaning. Multiple levels of interpretation. Self-conscious about language and form. Often philosophical or meditative. Comfortable with ambiguity and contradiction.

**Sentence Structure and Pacing:** Complex architecture with subordinate clauses and parenthetical asides. Sentences as carefully constructed as poetry. Rhythm and sound as important as meaning. Deliberately slow to encourage contemplation.

**Language and Vocabulary:** Sophisticated vocabulary deployed precisely. Rich in metaphor, symbolism, and allusion. Intertextual references to literature, art, philosophy. Words chosen for resonance as much as meaning. Synesthesia and unexpected combinations.

**Dialogue Style:** Intellectually charged conversations about ideas as much as events. Subtext more important than text. Characters speak in distinctive, elevated registers. Dialogue reveals psychological complexity and philosophical positions.

**Theme and Motives:** Explores the human condition through particular experiences. Questions of identity, memory, time, mortality. Art as a way of understanding existence. Beauty and truth intertwined. The particular illuminating the universal.

=====

Example snippets:

Memory, Judith thought, was not unlike the palimpsest she had discovered in her grandmother's attic - each recollection written over the last, yet somehow all remaining visible, creating a narrative that was simultaneously singular and multiple, true and fabricated.

She stood before the mirror, but it was not her reflection she sought. Rather, she was searching for that liminal space between self and image, that fraction of a second where identity hesitates before assuming its daily mask. In that hesitation lived all her possible selves.

"Do you ever wonder," Marcus said, his fingers tracing the rim of his wine glass in endless circles, "if we're merely characters in someone else's dream?"

"Whose dream?" she asked, though she knew he meant the question to remain unanswered, to hover between them like the smoke from his forgotten cigarette.

"Perhaps that's the wrong question. Perhaps we should ask instead: what happens when the dreamer wakes?"

The city beyond the window performed its evening transformation - lights blooming like thoughts in a darkening mind. She had read somewhere that neurons firing resembled city lights from above, and now she couldn't unsee the metaphor, couldn't stop thinking of consciousness as an endless metropolis, each memory a building, each thought a street leading to another street, another life, another version of herself.

Time, in this room, had taken on the quality of amber - golden, viscous, preserving them in this moment even as it continued its relentless flow.

=====`
  },
  {
    name: "🎓 Academic/Scholarly Style",
    usageTips: "Use this style for research papers, academic journals, dissertations, and scholarly publications.",
    types: ['nonfiction'],
    tags: ['Genre Defining', 'Business and Projects', 'Serious'],
    value: `**Narrative Voice and Tone:** Formal, analytical, and objective. Third-person perspective maintaining scholarly distance. Cautious about claims - uses hedging language appropriately. Authority established through evidence, not assertion.

**Sentence Structure and Pacing:** Complex sentences with multiple subordinate clauses. Careful logical progression. Topic sentences followed by evidence and analysis. Transitional phrases linking ideas. Methodical pacing.

**Language and Vocabulary:** Technical terminology specific to discipline. Precise word choice avoiding ambiguity. Nominalization common. Passive voice when emphasizing results over actors. Latin phrases and specialized jargon used correctly.

**Dialogue Style:** Rarely uses direct dialogue except in quotations from primary sources. Interviews presented as block quotes. Citation immediately follows quoted material. Paraphrasing preferred over extensive quoting.

**Theme and Motives:** Advances knowledge through systematic investigation. Questions assumptions and builds on prior research. Acknowledges limitations and suggests future directions. Values precision, replicability, and intellectual honesty.

=====

Example snippets:

The relationship between social media usage and adolescent self-esteem has emerged as a critical area of investigation in contemporary psychological research. While previous studies (Henderson et al., 2019; Liu & Baumeister, 2020) have suggested a negative correlation, the present analysis reveals a more nuanced picture that challenges prevailing assumptions.

This longitudinal study (N=2,847) examined three distinct cohorts over a five-year period, employing both quantitative metrics and qualitative interviews. The findings indicate that the impact of social media on self-esteem is mediated by several previously underexplored variables, including peer network composition and content creation versus consumption patterns.

Notably, participants who engaged primarily in content creation (defined as posting original material at least three times weekly) demonstrated significantly higher self-esteem scores (M=7.3, SD=1.2) compared to passive consumers (M=5.8, SD=1.4), t(2845)=8.92, p<.001, d=1.09. This large effect size suggests that agency and creative expression may serve as protective factors.

Furthermore, qualitative analysis revealed three emergent themes: (1) the paradox of connection and isolation, (2) performance of identity versus authentic self-expression, and (3) temporal factors in self-esteem fluctuation. As one participant articulated: "It's not about how much time I spend online, but what I'm doing there and why" (Participant 284, age 16).

These findings necessitate a reconceptualization of digital wellness interventions. Rather than focusing solely on screen time reduction, practitioners might consider encouraging creative engagement and critical media literacy. Future research should investigate the longitudinal effects of such interventions.

=====`
  },
  {
    name: "👶 Children's Literature Style",
    usageTips: "Use this style for picture books, chapter books, middle-grade fiction, and any content specifically written for young readers (ages 3-12).",
    types: ['fiction'],
    tags: ['Genre Defining', 'Character-Driven', 'Creative Writing', 'Playful'],
    value: `**Narrative Voice and Tone**: Warm, encouraging, and wonder-filled, speaking directly to young hearts and minds. The voice should be trustworthy and kind, never condescending, respecting children's intelligence while meeting them at their developmental level. Creates safe space for exploration of emotions and ideas.

**Sentence Structure and Pacing**: Simple, clear sentences for younger readers (5-10 words) gradually increasing complexity for older children (10-20 words). Repetition and rhythm aid comprehension and memory. Short paragraphs and chapters maintain engagement. Natural places for page turns in picture books.

**Language and Vocabulary**: Age-appropriate vocabulary with context clues for new words. Introduces challenging concepts through familiar comparisons. Sound play, alliteration, and onomatopoeia for younger readers. Avoids baby talk while remaining accessible. Educational without being preachy.

**Dialogue Style**: Characters speak in distinct, memorable voices that children can easily distinguish. Natural child dialogue that sounds authentic without inappropriate content. Adult characters model good communication. Dialogue advances plot while teaching social skills.

**Theme and Motives**: Universal childhood experiences—friendship, fear, discovery, growing up. Gentle moral lessons woven through story rather than heavy-handed preaching. Celebrates imagination, curiosity, and resilience. Problems are age-appropriate with satisfying resolutions. Always ends with hope.

=====

Example snippets:

Luna had a secret. It lived in her pocket, small and warm and wonderful.

"What's in your pocket?" asked her teacher, Mrs. Maple, who noticed everything.

Luna pressed her hand against the pocket. The secret wiggled. "Nothing," she whispered.

But secrets have a funny way of not staying secret, especially when they're alive.

At recess, Luna sat under the big oak tree, away from the other children. Carefully, so carefully, she opened her pocket just a crack. Two bright eyes peeked out. Then whiskers. Then the softest pink nose she'd ever seen.

"Hello, Stardust," Luna whispered to the tiny hamster. "I know I'm not supposed to bring you to school, but you were so lonely at home."

Stardust squeaked, which Luna understood meant, "I'm happy to be here with you."

Everything would have been fine if Stardust hadn't smelled Tommy's peanut butter sandwich.

ZOOM! The little hamster shot out of Luna's pocket, across the playground, and right up Tommy's leg.

"EEEEEP!" Tommy squealed, dropping his sandwich. "Something's attacking me!"

But then he looked down and saw Stardust, sitting on his shoe, nibbling the sandwich crust with tiny, happy sounds.

"Is that... a hamster?" Tommy asked, his fear turning to delight.

Soon all the children gathered around, gentle as butterflies, taking turns petting Stardust with one finger.

"Luna," said Mrs. Maple, walking over with a knowing smile, "is this your 'nothing'?"

Luna's cheeks turned pink. "I'm sorry, Mrs. Maple. He was lonely, and I thought maybe... maybe school would make him happy."

Mrs. Maple knelt down beside the children. "You know what? I think Stardust has taught us something important today. Sometimes, when we share what we love—even when we're not supposed to—we make everyone a little happier."

She winked at Luna. "But next time, ask first. Our class could use a proper pet. What do you all think?"

"YES!" shouted twenty voices at once.

And that's how Stardust became the first official hamster student at Willowbrook Elementary, with his own tiny desk and everything.

=====`
  },
  {
    name: "🎭 Satirical/Ironic Style",
    usageTips: "Use this style for social commentary, political satire, parody, and any writing that uses humor to critique society, institutions, or human behavior.",
    types: ['fiction', 'nonfiction'],
    tags: ['Cross Genre', 'Character-Driven', 'Creative Writing', 'Witty'],
    value: `**Narrative Voice and Tone**: Clever and subversive, using wit as a scalpel to expose hypocrisy and folly. The voice should be intelligent and observant, employing irony and sarcasm without becoming mean-spirited. Maintains sophisticated distance while delivering pointed social criticism through humor.

**Sentence Structure and Pacing**: Strategic pacing that sets up expectations then subverts them for ironic effect. Varies between elaborate setups and punchy punchlines. Uses parallel structure to highlight contradictions. Timing is crucial—builds anticipation before delivering satirical observations.

**Language and Vocabulary**: Sophisticated wordplay including double entendres, puns, and verbal irony. Contrasts formal language with absurd situations for comic effect. Uses euphemisms, understatement, and hyperbole strategically. Technical jargon employed ironically to mock pretension.

**Dialogue Style**: Characters often speak at cross-purposes, revealing their blind spots through their own words. Conversation exposes vanity, ignorance, or self-deception. Uses dramatic irony where readers understand more than characters. Parodies recognizable speech patterns and social dialects.

**Theme and Motives**: Exposes societal flaws, institutional failures, and human pretensions through humor. Challenges complacency and conventional wisdom. Often focuses on power imbalances, social inequality, or moral hypocrisy. Aims to provoke thought and potentially inspire change through laughter.

=====

Example snippets:

**The Art of Modern Productivity**

Sarah, Director of Workflow Optimization, arrived at her standing desk promptly at 6:47 AM—three minutes earlier than her self-improvement app recommended for "Maximum Morning Momentum." She adjusted her ergonomic everything and opened her laptop to begin her daily ritual of being incredibly, measurably productive.

First: checking her productivity tracking app to see how productive she'd been yesterday. (Moderately productive, with room for optimization.) Second: updating her goal-setting app with today's objectives for being productive. Third: reading three articles about productivity techniques she didn't have time to implement because she was too busy reading about productivity.

Her calendar pinged. Meeting in Conference Room Synergy: "Streamlining Our Efficiency Initiatives."

Sarah gathered her bullet journal, her productivity planner, and her laptop (equipped with seventeen apps designed to eliminate the need for bullet journals and productivity planners). She power-walked to the meeting, tracking her steps on her fitness app, which would later congratulate her for being such an efficient walker.

"Good morning, optimization warriors!" chirped Brad from HR, who had recently returned from a weekend seminar on "Leveraging Mindfulness for Maximum Impact." "Today we're going to discuss how we can more efficiently implement our efficiency improvements."

Sarah nodded enthusiastically while discreetly checking her phone to see if she'd reached her daily goal of being enthusiastic about efficiency.

Two hours later, they had scheduled three follow-up meetings to determine the most productive way to schedule follow-up meetings. Sarah made a note in her productivity journal: "Great progress on productivity initiatives."

On her way back to her standing desk (sitting was for quitters), Sarah passed the break room where Janet from Accounting sat reading an actual paper book—not even a self-help book about reading more efficiently—and sipping coffee she'd made herself instead of ordering from the artisanal productivity café downstairs.

"Aren't you supposed to be optimizing something?" Sarah asked.

Janet looked up with the sort of peaceful expression that probably wasn't available in any app store. "I am. I'm optimizing my enjoyment of this Tuesday."

Sarah walked away, slightly disturbed. She made another note: "Janet may need productivity intervention."

At her desk, she opened her laptop to discover that her productivity apps had been so busy tracking her productivity that they'd crashed her computer. While it rebooted, she stared out the window at people walking slowly, talking to each other, accomplishing absolutely nothing measurable.

They looked insufferably content.

Her computer chirped back to life, and Sarah opened her task management app. Today's remaining objectives: "Be productive. Optimize efficiency. Achieve maximum leverage."

She paused, fingers hovering over the keyboard. Then she closed the laptop, walked to the break room, and sat down next to Janet.

"Teach me about Tuesday optimization," she said.

Janet smiled and poured her a cup of thoroughly unoptimized coffee.

=====`
  },
  {
    name: "📝 Contemporary Fiction Style",
    usageTips: "Use this style for modern realistic stories, slice-of-life narratives, and contemporary settings across any genre.",
    types: ['fiction'],
    tags: ['Universal', 'Character-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Modern and accessible, capturing the rhythms of contemporary life. The voice should feel immediate and relatable while maintaining literary quality. Often employs close third-person or authentic first-person narration that reflects current cultural awareness and social dynamics.

**Sentence Structure and Pacing**: Natural flow with varied sentence lengths that mirror real conversation and thought patterns. Pacing reflects modern life—quick dialogue exchanges, longer contemplative passages, and rhythms that feel familiar to contemporary readers.

**Language and Vocabulary**: Contemporary vernacular mixed with precise, evocative language. Includes current cultural references, technology, and social issues woven naturally into narrative. Avoids dated expressions while maintaining timeless emotional truth.

**Dialogue Style**: Authentic modern conversations that reveal character relationships and social dynamics. Characters speak in ways that reflect their generation, background, and social context. Natural interruptions, overlapping thoughts, and realistic speech patterns.

**Theme and Motives**: Explores contemporary issues through personal stories—identity in the digital age, modern relationships, work-life balance, social change, cultural diversity. Universal human experiences viewed through a current lens.

=====

Example snippets:

Maya's phone buzzed for the seventh time during dinner, but she ignored it, focusing instead on her grandmother's hands as they broke apart the warm naan.

"Your generation," Nani said, not looking up from the plate, "always so busy talking to people who aren't here."

"I'm here now," Maya said, though she could feel the phantom vibration of another notification against her thigh.

"Are you?" Her grandmother's eyes held that particular blend of wisdom and mischief that had terrified and delighted Maya since childhood. "Because your mind keeps jumping like a cricket in a jar."

Maya set her phone face-down on the table, the small gesture feeling bigger than it should. Outside, Mumbai's evening traffic created its familiar symphony, but in this small kitchen, time moved differently. Here, stories were still told rather than streamed, and the most important conversations happened over food that took hours to prepare.

"Tell me about the boy again," Nani said, spooning more curry onto Maya's plate. "The one who makes you smile at your phone like that."

And despite everything—the notifications, the deadlines, the constant ping of a world demanding attention—Maya found herself settling into the rhythm of her grandmother's questions, the ancient art of sharing life over a shared meal.

=====`
  },
  {
    name: "🎭 Character-Driven Style",
    usageTips: "Use this style when internal conflict and character development are the primary focus of your story across any genre.",
    types: ['fiction'],
    tags: ['Cross Genre', 'Character-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Intimate and psychologically astute, diving deep into character motivation and internal landscape. The voice creates close emotional connection with readers through authentic exploration of human complexity and growth.

**Sentence Structure and Pacing**: Follows the rhythms of thought and emotion rather than external action. Uses longer, more complex sentences for internal exploration and shorter ones for moments of realization or decision. Pacing allows for deep character development.

**Language and Vocabulary**: Rich in psychological detail and emotional nuance. Precise vocabulary for distinguishing between subtle feelings and motivations. Metaphors often drawn from the character's personal experience and worldview.

**Dialogue Style**: Reveals character through subtext, speech patterns, and what remains unspoken. Conversations show relationship dynamics and internal conflicts. Characters often struggle to express their deeper truths directly.

**Theme and Motives**: Focuses on character transformation, self-discovery, relationships, and personal growth. How characters change through challenges and choices. The complexity of human motivation and the journey toward self-understanding.

=====

Example snippets:

Sarah had always thought of herself as the kind of person who made decisions quickly, but here she sat for the third morning in a row, staring at the resignation letter on her laptop screen, her finger hovering over the send button like a hummingbird afraid to land.

The cursor blinked at her—impatient, expectant, mocking. Such a small thing, that blinking line, yet it represented everything she was too afraid to become and too tired to keep avoiding.

Her reflection in the computer screen showed a woman she barely recognized: dark circles under eyes that had once sparkled with ambition, shoulders curved inward as if protecting something precious and fragile. When had she started looking so defeated?

The email from her college roommate still sat in her inbox, full of excited updates about the nonprofit she'd started in Guatemala. "Remember when we used to stay up all night talking about changing the world?" Jessica had written. "I finally figured out how to start."

Sarah touched the screen where her reflection met her friend's words. She did remember. She remembered the girl who had believed her dreams were not just possible but inevitable. The girl who had never imagined she'd spend her days managing someone else's vision while her own slowly suffocated in a cubicle.

Her phone rang—her boss, no doubt wondering where the quarterly reports were. Sarah let it go to voicemail and finally, before she could change her mind again, clicked send.

The resignation letter disappeared into the digital ether, and Sarah realized she was holding her breath. Not from fear, but from something she hadn't felt in years: anticipation.

=====`
  },
  {
    name: "⚡ Plot-Driven Style",
    usageTips: "Use this style for action-oriented stories, adventures, and fast-paced narratives across any genre.",
    types: ['fiction'],
    tags: ['Cross Genre', 'Plot-Driven', 'Creative Writing', 'Dramatic'],
    value: `**Narrative Voice and Tone**: Energetic and forward-moving, maintaining momentum and reader engagement. The voice should create urgency and excitement while clearly conveying action sequences and plot developments. Confident and dynamic storytelling.

**Sentence Structure and Pacing**: Varies strategically—short, punchy sentences for action and tension, longer ones for necessary exposition. Quick pacing with frequent scene breaks and cliffhangers. Structure serves the plot's forward momentum.

**Language and Vocabulary**: Clear, concrete language emphasizing action and movement. Strong verbs drive every sentence. Sensory details focus on immediate experience rather than lengthy description. Precise terminology for action sequences.

**Dialogue Style**: Purposeful exchanges that advance plot and reveal information efficiently. Characters speak naturally but conversations move story forward. Quick banter, urgent exchanges, and dialogue that builds tension.

**Theme and Motives**: External conflict drives internal growth. Themes emerge through action and consequence rather than introspection. Character development happens through choices made under pressure and responses to challenges.

=====

Example snippets:

The explosion threw Elena twenty feet into the fountain, and she had exactly thirty seconds before Kozlov's men surrounded the plaza.

She surfaced, spitting chlorinated water and checking her earpiece. Static. The comm was dead, which meant Mikhail was either compromised or worse. No time to find out which.

Elena hauled herself over the fountain's edge, glass from the embassy windows crunching under her boots. The briefcase—where was the briefcase? There, half-buried under debris from the blast, its titanium shell scratched but intact.

Footsteps. Multiple sets, moving fast.

She grabbed the case and sprinted toward the motorcycle she'd stashed behind the cathedral. The key turned on the first try—finally, something was going right. The engine roared to life just as the first shots rang out, bullets sparking off the stone walls around her.

Elena gunned it down the narrow alley, leaning hard into the turn onto Via Roma. In her mirror, she counted four vehicles giving chase. Kozlov wasn't taking any chances.

Her phone buzzed against her ribs—a text from a blocked number: "Bridge. Five minutes. Come alone."

Elena checked her watch. The rendezvous was across the city, and she had half the Russian mob breathing down her neck. She downshifted and took the next corner at sixty kilometers per hour.

Five minutes. She'd make it in four.

=====`
  },
  {
    name: "💭 Introspective/Reflective Style",
    usageTips: "Use this style for thoughtful narratives, coming-of-age stories, and philosophical fiction across any genre.",
    types: ['fiction'],
    tags: ['Cross Genre', 'Character-Driven', 'Creative Writing', 'Serious'],
    value: `**Narrative Voice and Tone**: Contemplative and thoughtful, inviting readers into deeper consideration of life's complexities. The voice should be patient with ambiguity and comfortable exploring philosophical questions through personal experience.

**Sentence Structure and Pacing**: Leisurely pacing that allows for meditation and reflection. Longer, more complex sentences that mirror the meandering nature of deep thought. Builds meaning through accumulation of insight rather than dramatic action.

**Language and Vocabulary**: Sophisticated and nuanced, with attention to the subtle shadings of meaning and emotion. Rich in metaphor and symbolism. Vocabulary that can express complex ideas and delicate emotional distinctions.

**Dialogue Style**: Conversations often touch on deeper meanings and life questions. Characters may speak indirectly, using stories or examples to convey larger truths. Silences and pauses carry significant weight.

**Theme and Motives**: Explores fundamental questions about existence, meaning, identity, and human nature. How characters understand themselves and their place in the world. The search for truth and understanding through personal experience.

=====

Example snippets:

There's something about airports that makes you acutely aware of time—not the mechanical time of clocks and schedules, but the deeper current that carries all of us forward whether we're ready or not.

I sat in Terminal C, watching strangers navigate their own small dramas of departure and arrival, and wondered when I had become the kind of person who observed life rather than lived it. The businessman arguing into his phone about quarterly projections, the young mother trying to comfort a crying toddler, the elderly couple holding hands as they waited for their final boarding call—each of them was writing the story of their life, making choices that would ripple forward in ways they couldn't possibly imagine.

My own ticket felt heavy in my pocket. Flight 447 to Portland, departing in two hours. After that, a new job, a new apartment, a chance to become someone different from who I'd been for the past thirty-five years. But here's what nobody tells you about reinventing yourself: you can change your geography, your career, even your daily habits, but you still wake up every morning inside the same consciousness, carrying the same collection of joys and wounds that have always defined you.

The boarding announcement echoed through the terminal, and I watched the usual choreography of gathering belongings and forming lines. Soon, that would be me, stepping onto a plane that would carry me toward a future I had chosen but couldn't fully envision.

Maybe that was the point. Maybe the courage wasn't in having a perfect plan, but in accepting that some questions could only be answered by moving forward into the uncertainty, trusting that the person you are becoming will be equal to whatever you discover along the way.

=====`
  },
  {
    name: "🌟 Uplifting/Feel-Good Style",
    usageTips: "Use this style for positive, heartwarming tales and hopeful narratives that inspire readers across any genre.",
    types: ['fiction'],
    tags: ['Universal', 'Character-Driven', 'Creative Writing', 'Playful'],
    value: `**Narrative Voice and Tone**: Warm, optimistic, and emotionally generous. The voice should find hope and beauty even in difficult situations, celebrating human resilience and the possibility of positive change. Genuine warmth without naive simplicity.

**Sentence Structure and Pacing**: Comfortable, flowing pacing that allows readers to savor positive moments. Builds toward satisfying resolutions and emotional payoffs. Structure supports character growth and relationship development.

**Language and Vocabulary**: Rich in positive imagery and uplifting metaphors. Language that emphasizes possibility, growth, and connection. Warm sensory details that create comfort and joy. Avoids cynicism while remaining authentic.

**Dialogue Style**: Conversations reveal kindness, wisdom, and human connection. Characters support each other through words and actions. Humor that brings people together rather than divides. Dialogue shows people at their best.

**Theme and Motives**: Hope triumphing over adversity, the power of kindness and community, personal growth and second chances, love in its many forms. How people help each other heal and grow. The belief that positive change is always possible.

=====

Example snippets:

The community garden had started as Mrs. Chen's crazy idea, but three months later, it had become the heart of Maple Street in ways no one had expected.

Tom knelt between the tomato plants, showing eight-year-old Marcus how to tie the vines to their stakes. Six months ago, Tom had been laid off from the factory where he'd worked for fifteen years. He'd spent weeks sitting on his porch, watching the neighborhood kids walk by, wondering what he was supposed to do with all this unexpected time.

"Like this, Mr. Tom?" Marcus held up a vine he'd secured with careful loops of green twine.

"Perfect," Tom said, and meant it. The boy had gentle hands for gardening, a patience that seemed unusual for his age. "You've got the touch."

Marcus beamed, dirt streaking his cheek where he'd wiped away sweat. His grandmother had started bringing him to the garden after school, partly to keep him busy while she worked her evening shift at the hospital, but mostly because she believed children should know where food comes from.

At the far end of the plot, Mrs. Chen was explaining companion planting to a group of teenagers from the high school, her English mixed with enthusiastic gestures and the occasional Chinese phrase that somehow made perfect sense anyway. The teenagers—kids who supposedly only cared about video games and social media—listened intently as she described how marigolds could protect vegetables from pests.

"Community," Mrs. Chen had said when she first proposed the garden, "grows best when people have something to tend together."

Tom watched Marcus carefully position another tie around the tomato vine and realized she had been right about more than just plants. They were all growing something here—not just vegetables, but connections, purpose, the quiet satisfaction of nurturing something valuable together.

=====`
  },
  {
    name: "🌙 Atmospheric/Mood Style",
    usageTips: "Use this style when setting, mood, and atmosphere are crucial elements of your story across any genre.",
    types: ['fiction'],
    tags: ['Cross Genre', 'Atmosphere-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Evocative and immersive, creating a strong sense of place and mood. The voice should paint vivid pictures with words, making readers feel they are experiencing the setting directly. Rich in sensory detail and emotional atmosphere.

**Sentence Structure and Pacing**: Varies to match the mood being created—longer, flowing sentences for dreamy or contemplative atmospheres, shorter ones for tension or urgency. Pacing allows readers to fully absorb the environmental details and emotional tone.

**Language and Vocabulary**: Rich in sensory language and descriptive detail. Careful word choice to evoke specific moods and feelings. Metaphors and similes that connect setting to emotion. Vocabulary that creates atmosphere through sound and rhythm as well as meaning.

**Dialogue Style**: Characters speak in ways that reflect and enhance the story's atmosphere. Dialogue may be sparse, allowing setting and mood to dominate, or it may echo the environmental tone through rhythm and word choice.

**Theme and Motives**: How environment shapes character and emotion. The relationship between internal and external landscapes. Setting as a reflection of psychological states. The power of place to influence story and meaning.

=====

Example snippets:

The lighthouse keeper's cottage sat at the edge of the world, where the Atlantic rolled endlessly against granite cliffs that had been carved by centuries of salt and storm.

Eleanor arrived on a Tuesday morning when the fog hung so thick she could barely see the worn path beneath her feet. The cottage emerged from the gray like a memory half-forgotten—weathered shingles silvered by decades of ocean air, windows that reflected nothing but mist, a door painted red as fresh blood against the monochrome landscape.

Inside, the air held the scent of old wood and brine, of books left too long in humid salt air. The floorboards creaked with each step, a language of their own that spoke of solitude and endurance. Through the kitchen window, she could just make out the lighthouse itself, its white tower disappearing into the fog like a giant's finger pointing toward heaven.

The real estate agent had warned her about the isolation. "Six months of winter," he'd said, "when sometimes you don't see another soul for weeks." But Eleanor had come here precisely for that silence, for the way the ocean's constant whisper could drown out all the voices in her head.

She set her single suitcase on the bed and opened the window, letting the fog drift into the room like curious spirits. Somewhere in the gray, a fog horn sounded—deep, mournful, eternal. It was the sound of ships finding their way home, of safety in darkness, of light that persisted even when no one could see it.

Eleanor smiled for the first time in months. This was exactly what she had been looking for: a place where the weather could match her mood, where solitude was not just accepted but necessary, where she could finally stop pretending to be anything other than what she was—someone who needed to disappear for a while into the gray space between sea and sky.

=====`
  },
  {
    name: "💬 Dialogue-Heavy Style",
    usageTips: "Use this style for character interaction-focused stories and ensemble pieces driven by conversation across any genre.",
    types: ['fiction'],
    tags: ['Cross Genre', 'Dialogue-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Observational and character-focused, letting dialogue carry the primary storytelling burden. The narrative voice provides just enough context and description to support the conversations while staying out of the way.

**Sentence Structure and Pacing**: Quick, dynamic pacing driven by conversational rhythm. Short paragraphs and frequent dialogue breaks. Minimal but effective description between exchanges. Structure follows the natural flow of conversation.

**Language and Vocabulary**: Natural, realistic dialogue that reveals character through speech patterns, word choices, and verbal habits. Each character has a distinct voice. Dialogue tags used sparingly, letting conversation speak for itself.

**Dialogue Style**: Extensive, realistic exchanges that advance plot and develop character simultaneously. Conversations have subtext and multiple layers. Characters speak authentically for their backgrounds and personalities. Overlapping conversations and interrupted thoughts.

**Theme and Motives**: Relationships and character dynamics explored through interaction. How people communicate, misunderstand, connect, and conflict. The spaces between what people say and what they mean. Human connection through conversation.

=====

Example snippets:

"You're wearing the blue tie," Janet said, not looking up from her coffee.

"It's navy."

"Same thing."

David adjusted the knot, catching his reflection in the kitchen window. "The interview's at ten. I should leave soon."

"Mmm." Janet turned a page of her magazine. "Traffic will be terrible on the bridge."

"I'm taking the tunnel."

"The tunnel's worse."

He poured coffee into his travel mug, the silence stretching between them like a bridge neither wanted to cross first.

"Jan."

"What?"

"Look at me."

She finally raised her eyes. "You look fine. You always look fine."

"That's not what I meant."

"I know what you meant."

David sat down across from her, the want ads spread between them like a map of all the places he might go without her. "We should talk about—"

"About what? About how you're taking a job in Chicago? About how we've been married twenty-two years and you're just now telling me you're 'not fulfilled'?" Her fingers made air quotes, and he realized she'd been practicing this conversation in her head for weeks.

"It's not about fulfillment."

"No? What's it about then?"

"It's about..." He stopped, looking for words that wouldn't sound like betrayal. "It's about waking up."

"I see. And I'm what—the dream you want to wake up from?"

"Janet, come on."

"No, you come on, David. Don't pretty it up with metaphors. If you want to leave, then leave. But don't make it about self-actualization or whatever midlife crisis bullshit you're selling yourself."

He reached for her hand. She pulled it away.

"The kids will want to know why," she said.

"We'll figure out what to tell them."

"We." Janet laughed, but there was no humor in it. "There is no we in this decision, is there?"

=====`
  },
  {
    name: "📖 Classic Storytelling Style",
    usageTips: "Use this style for traditional narrative structure with timeless, accessible storytelling across any genre.",
    types: ['fiction'],
    tags: ['Universal', 'Plot-Driven', 'Creative Writing'],
    value: `**Narrative Voice and Tone**: Clear, authoritative, and engaging, drawing on established storytelling traditions. The voice should be accessible to all readers while maintaining literary quality. Comfortable with omniscient or limited third-person perspective.

**Sentence Structure and Pacing**: Balanced pacing with clear three-act structure. Varied sentence lengths that serve story rhythm. Builds tension toward climax with satisfying resolution. Uses traditional techniques like foreshadowing and dramatic irony.

**Language and Vocabulary**: Accessible yet elegant language that serves the story without drawing attention to itself. Clear, precise word choice. Timeless quality that doesn't feel dated or overly trendy. Rich but not overwrought description.

**Dialogue Style**: Natural conversations that reveal character and advance plot. Dialogue that feels authentic to character and time period. Clear attribution and realistic speech patterns. Conversations serve multiple story functions.

**Theme and Motives**: Universal themes that resonate across cultures and time periods. Clear story arc with character growth and change. Moral and emotional clarity without being heavy-handed. Stories that feel both familiar and fresh.

=====

Example snippets:

The letter that changed Thomas Hartwell's life arrived on a Tuesday morning in March, delivered by a postman who had no idea he was carrying someone's destiny in his worn leather bag.

Thomas was at his kitchen table, reviewing his lesson plans for the day, when the envelope slid through his mail slot and landed with the soft whisper that only important correspondence makes. The return address bore the seal of Blackwood Academy—a school so prestigious that Thomas had never seriously imagined they would respond to his application.

He set down his coffee and picked up the letter with hands that trembled slightly. In his fifteen years of teaching at the local high school, Thomas had watched too many bright students leave town for opportunities their hometown couldn't provide. He had begun to wonder if he, too, was meant for something beyond the familiar boundaries of Millfield.

The letter was brief but cordial. The headmaster, Dr. Elizabeth Thornfield, requested his presence for an interview the following week. They were seeking, she wrote, "an educator who understands that true learning happens when we challenge our students to exceed their own expectations."

Thomas read the letter three times, each reading making the opportunity feel more real and more terrifying. Taking the position would mean leaving behind everything he had known—his students, his small apartment above the bookstore, the Friday night dinners with his sister and her family. But it would also mean stepping into the life he had always imagined for himself, the one that existed in the quiet hours before dawn when he planned lessons he dreamed of teaching.

He folded the letter carefully and placed it next to his lesson plans. Today, he would teach Shakespeare to a classroom of teenagers who thought they had no use for poetry. Tomorrow, he would begin to consider whether the man who wrote those lesson plans was ready to become the teacher he had always wanted to be.

Outside his window, spring was beginning to show itself in the tentative green of new leaves, and Thomas thought that perhaps change, like the seasons, came not all at once but in small, inevitable moments that accumulated into transformation.

=====`
  },
  {
    name: "📺 Social Media Style",
    usageTips: "Use this style for Twitter/X threads, Instagram captions, TikTok scripts, LinkedIn posts, and engaging social media content.",
    types: ['nonfiction'],
    tags: ['Genre Defining', 'Digital Web Content', 'Casual'],
    value: `**Content Structure and Format**: Platform-optimized content with hooks, scannable text, and strategic use of emojis, hashtags, and mentions. Designed for thumb-stopping, shareability, and engagement. Each post serves a clear purpose within seconds of reading.

**Sentence Structure and Pacing**: Ultra-short sentences and fragments (3-8 words average) for maximum impact. Strategic line breaks for visual appeal and readability on mobile. Quick, punchy delivery that respects shrinking attention spans. Uses cliffhangers and pattern interrupts.

**Language and Vocabulary**: Conversational, relatable language that feels like talking to a friend. Platform-specific terminology and trending phrases. Accessibility-focused with simple vocabulary. Heavy use of active voice and action words that drive engagement.

**Engagement Techniques**: Opens with hooks that stop scrolling immediately. Uses questions, controversial statements, or surprising facts. Includes clear calls-to-action (like, share, comment). Creates community through inclusive language and shared experiences.

**Platform Adaptation**: Twitter/X: Thread-friendly with numbered points and continuity. Instagram: Visual storytelling with caption space optimization. TikTok: Script format with timing cues. LinkedIn: Professional but personable tone with industry relevance.

=====

Example snippets:

**Twitter/X Thread:**

🧵 THREAD: 5 writing mistakes that make you sound like a robot (and how to fix them)

1/ Stop using "utilize" when you mean "use"

Your brain isn't a thesaurus. Keep it simple.

2/ Delete every instance of "in order to"

Just say "to."

Your readers will thank you.

3/ Kill the passive voice

❌ "Mistakes were made"
✅ "I screwed up"

See the difference?

4/ Stop hedge words

Maybe, perhaps, possibly, might...

Pick a side. Own it.

5/ Read your work out loud

If you wouldn't say it to a friend, don't write it.

What's your biggest writing pet peeve? 👇

---

**Instagram Caption:**

POV: You're a writer staring at a blank page 📝

We've all been there. That blinking cursor mocking us. The pressure building.

Here's what I do when writer's block hits:

✨ Change locations (coffee shop energy hits different)
✨ Write the worst possible version first
✨ Set a 10-minute timer and just word-vomit
✨ Read something completely unrelated
✨ Take a walk without my phone

The blank page isn't your enemy. It's possibility waiting to happen.

What's your go-to cure for writer's block? Tell me in the comments 👇

#WritingTips #WritersBlock #CreativeProcess #WritingCommunity

---

**LinkedIn Post:**

Hot take: Your company's "professional" writing is driving customers away.

I just tried to understand a software company's pricing page.

15 minutes later, I still don't know what they actually do.

The problem? Corporate speak that prioritizes sounding smart over being clear.

Instead of "We facilitate optimal solutions for diverse stakeholder ecosystems"

Try "We help teams work better together"

Your customers don't need a dictionary to buy from you.

They need clarity.

What's the worst example of corporate jargon you've seen? Share it below 👇

=====`
  },
  {
    name: "🎬 Script/Screenplay Style",
    usageTips: "Use this style for screenplays, stage plays, video scripts, podcast scripts, and any content requiring professional script formatting.",
    types: ['fiction'],
    tags: ['Genre Defining', 'Dialogue-Driven', 'Creative Writing'],
    value: `**Format Structure**: Industry-standard formatting with scene headings, action lines, character names, dialogue, and parentheticals. Proper margins, spacing, and capitalization conventions. Each element serves a specific production purpose.

**Scene and Action Description**: Concise, visual action lines written in present tense. Focus on what the audience sees and hears, not internal thoughts. Economical description that serves the story and guides production teams without over-directing.

**Dialogue Craft**: Character-specific voices that sound natural when spoken aloud. Subtext-heavy conversations where characters often say one thing while meaning another. Rhythmic speech patterns that reflect personality, background, and emotional state.

**Technical Elements**: Proper scene headings (INT./EXT. LOCATION - TIME). Character introductions in ALL CAPS on first appearance. Parentheticals used sparingly for essential direction only. Transitions (CUT TO:, FADE IN:) when necessary for storytelling.

**Visual Storytelling**: Show don't tell through action and dialogue. Camera-conscious writing that suggests shots without being prescriptive. Conflict-driven scenes that advance plot and reveal character simultaneously. Efficient storytelling within format constraints.

=====

Example snippets:

**Screenplay Format:**

FADE IN:

EXT. COFFEE SHOP - MORNING

Rain streaks the windows. SARAH (28), disheveled in yesterday's clothes, clutches a phone with a cracked screen. She dials. It goes to voicemail.

SARAH
(into phone)
Hey Mom, it's me. Again. I know
you said not to call, but—

The line goes dead. Sarah stares at the phone.

MARCUS (30s), the barista, approaches with a steaming mug.

MARCUS
Triple shot americano?

SARAH
Make it a quad.

MARCUS
Rough night?

SARAH
Rough life.

She takes the coffee, hands shaking slightly. Marcus notices.

MARCUS
You know, we're hiring. Night
shift pays better.

SARAH
(surprised)
You don't even know me.

MARCUS
I know you tip in exact change
because you're counting every
penny. I know you order the same
thing every day because routine
is the only thing holding you
together right now.

Sarah looks up, really seeing him for the first time.

SARAH
That obvious?

MARCUS
Takes one to know one.

He slides a job application across the counter.

MARCUS (CONT'D)
Think about it.

Sarah picks up the application, hope flickering in her eyes.

CUT TO:

---

**Stage Play Format:**

SETTING: A small apartment kitchen. Morning light streams through a single window. ELENA sits at a worn table, surrounded by unpaid bills.

ELENA: (Reading a letter aloud) "Final notice." (Laughs bitterly) They really mean it this time.

(DAVID enters from offstage, work clothes dirty, lunch pail in hand)

DAVID: Morning, El.

ELENA: (Not looking up) Is it? I hadn't noticed.

DAVID: (Setting down his lunch pail) What's got you—
(He sees the bills)
Oh.

ELENA: Three months behind on rent. Two on utilities. The car payment... (Waves the letter) Well, let's just say we're walking everywhere now.

DAVID: (Moving to her, hesitant) What about your sister?

ELENA: (Finally looking at him) You want me to beg?

DAVID: I want you to survive.

(Long pause. Elena crumples the letter)

ELENA: Pride's expensive, isn't it?

DAVID: (Gentle) We'll figure it out. We always do.

ELENA: Do we? Or do we just... postpone the inevitable?

(DAVID sits across from her, reaches for her hands)

DAVID: Look at me, Elena. Look at me.

(She does)

DAVID: (Cont'd) We're still here. That counts for something.

ELENA: (Softly) Does it?

(Lights dim as DAVID takes her hands in his)

=====`
  }
]
