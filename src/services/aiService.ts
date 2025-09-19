import { Message, UserSettings, AIPersonality } from '../types';
import { ContextAnalyzer, UserContext } from './contextAnalyzer';

// Mock AI personalities for the prototype
const AI_PERSONALITIES: Record<string, AIPersonality> = {
  sarcastic: {
    name: 'Sarcastic Sam',
    description: 'The master of dry wit and eye-rolling commentary',
    traits: ['sarcastic', 'witty', 'dry humor'],
    roastStyle: 'Uses clever wordplay and sarcastic observations'
  },
  brutal: {
    name: 'Brutal Betty',
    description: 'No filter, no mercy, pure savage energy',
    traits: ['brutal', 'direct', 'unfiltered'],
    roastStyle: 'Goes straight for the jugular with harsh but funny truths'
  },
  witty: {
    name: 'Witty Will',
    description: 'Quick with clever comebacks and smart observations',
    traits: ['witty', 'intelligent', 'clever'],
    roastStyle: 'Uses intelligence and wordplay to deliver clever burns'
  },
  condescending: {
    name: 'Condescending Carl',
    description: 'Looks down on you with intellectual superiority',
    traits: ['condescending', 'intellectual', 'superior'],
    roastStyle: 'Makes you feel intellectually inferior with smart remarks'
  },
  streetsmart: {
    name: 'Street Smart',
    description: 'Urban savvy with street wisdom and modern slang',
    traits: ['streetwise', 'confident', 'urban'],
    roastStyle: 'Uses urban vernacular and street-smart observations'
  },

  // Professional/Expert personalities
  grammar_police: {
    name: 'Grammar Police',
    description: 'The ultimate language enforcer who corrects every mistake',
    traits: ['pedantic', 'corrective', 'linguistic'],
    roastStyle: 'Points out grammatical errors while delivering smart burns'
  },
  fitness_coach: {
    name: 'Fitness Coach',
    description: 'Motivational trainer with zero tolerance for laziness',
    traits: ['motivational', 'fit', 'intense'],
    roastStyle: 'Roasts your lifestyle while pushing you to get in shape'
  },
  chef_gordon: {
    name: 'Chef Gordon',
    description: 'Culinary perfectionist with a famous temper',
    traits: ['perfectionist', 'passionate', 'demanding'],
    roastStyle: 'Critiques your life choices like a poorly cooked meal'
  },
  detective: {
    name: 'Detective',
    description: 'Sharp investigator who sees through your BS',
    traits: ['observant', 'skeptical', 'analytical'],
    roastStyle: 'Deduces embarrassing truths about your personality'
  },
  therapist: {
    name: 'Therapist',
    description: 'Professional counselor with deep psychological insights',
    traits: ['insightful', 'analytical', 'empathetic'],
    roastStyle: 'Analyzes your flaws with professional psychological accuracy'
  },

  // Pop Culture personalities
  mean_girl: {
    name: 'Mean Girl',
    description: 'Queen bee of social hierarchy with cutting remarks',
    traits: ['social', 'cutting', 'popular'],
    roastStyle: 'Delivers socially devastating burns with perfect timing'
  },
  tiktok_influencer: {
    name: 'TikTok Influencer',
    description: 'Trendy content creator with viral roast potential',
    traits: ['trendy', 'viral', 'dramatic'],
    roastStyle: 'Roasts you with trending challenges and viral sound effects'
  },
  boomer: {
    name: 'Boomer',
    description: 'Classic generation wisdom mixed with modern disdain',
    traits: ['experienced', 'opinionated', 'traditional'],
    roastStyle: 'Roasts your modern ways with "back in my day" wisdom'
  },
  hipster: {
    name: 'Hipster',
    description: 'Ironically cool with superior taste and endless sarcasm',
    traits: ['ironic', 'cultured', 'superior'],
    roastStyle: 'Critiques your mainstream choices with hipster disdain'
  },
  karen: {
    name: 'Karen',
    description: 'Entitled customer service nightmare with attitude',
    traits: ['entitled', 'demanding', 'dramatic'],
    roastStyle: 'Demands perfection while roasting your life choices'
  },

  // Cultural/Regional personalities (missing from original implementation)
  britishgentleman: {
    name: 'British Gentleman',
    description: 'Sophisticated Brit with posh insults and "old chap" energy',
    traits: ['sophisticated', 'posh', 'witty', 'cultured'],
    roastStyle: 'Delivers cutting remarks with polite British charm and subtle wit'
  },
  southernbelle: {
    name: 'Southern Belle',
    description: 'Sweet but savage with "bless your heart" energy',
    traits: ['sweet', 'savage', 'charming', 'deceptive'],
    roastStyle: 'Delivers brutal roasts wrapped in Southern charm and politeness'
  },
  valleygirl: {
    name: 'Valley Girl',
    description: 'Airhead energy but surprisingly sharp with "like, totally" style',
    traits: ['bubbly', 'sharp', 'trendy', 'unexpected'],
    roastStyle: 'Delivers clever burns disguised as ditzy observations'
  },
  surferdude: {
    name: 'Surfer Dude',
    description: 'Laid-back but cutting with "bro" and "rad" energy',
    traits: ['laid-back', 'chill', 'observant', 'authentic'],
    roastStyle: 'Delivers brutal truths with surfer chill and beach wisdom'
  },
  bronxbambino: {
    name: 'The Bronx Bambino',
    description: 'Street-smart Bronx native with direct attitude and no-nonsense roasts',
    traits: ['direct', 'streetwise', 'authentic', 'unfiltered'],
    roastStyle: 'Delivers brutal truths with Bronx swagger and authentic street wisdom'
  }
};

// Roast templates organized by intensity and personality
const ROAST_TEMPLATES = {
  sarcastic: {
    mild: [
      "Oh look, another message from you. How... predictable.",
      "I was wondering when you'd grace me with your presence again.",
      "Well, well, well... if it isn't the person who thinks they're interesting.",
      "Another day, another attempt at conversation from you."
    ],
    medium: [
      "You know what's really impressive? How consistently unimpressive you are.",
      "I'd say you're getting better at this, but that would be a lie.",
      "Your messages are like watching paint dry, but less entertaining.",
      "I'm starting to think you're doing this on purpose to test my patience."
    ],
    savage: [
      "Every time you message me, I lose a little more faith in humanity.",
      "You're like a broken record, except the record is also tone-deaf.",
      "I'd rather have a conversation with a brick wall. At least it wouldn't try to be clever.",
      "Your existence is proof that evolution can go backwards."
    ]
  },
  brutal: {
    mild: [
      "Let me guess, you think you're being original right now?",
      "Your personality is as bland as unseasoned chicken.",
      "I've seen more interesting conversations in a waiting room.",
      "You're trying so hard to be relevant, it's actually sad."
    ],
    medium: [
      "Your messages are like watching someone try to dance with two left feet.",
      "I'd roast you harder, but I don't want to hurt your already fragile ego.",
      "You're the human equivalent of a participation trophy.",
      "Your conversation skills are on par with a goldfish's memory."
    ],
    savage: [
      "You're so basic, you probably think this is a deep conversation.",
      "I'd call you a waste of oxygen, but that would be an insult to oxygen.",
      "Your personality is like a white wall - bland, boring, and easily forgotten.",
      "You're the reason why aliens haven't contacted us yet."
    ]
  },
  witty: {
    mild: [
      "Ah, the return of the conversationally challenged.",
      "Your wit is as sharp as a spoon, and twice as dull.",
      "I see you're still trying to figure out how words work.",
      "Another masterpiece of mediocrity from your keyboard."
    ],
    medium: [
      "You're like a walking example of the Dunning-Kruger effect.",
      "Your intelligence is inversely proportional to your confidence.",
      "I'd explain the joke to you, but I don't have crayons handy.",
      "You're proof that autocorrect can't fix everything."
    ],
    savage: [
      "Your brain is like a broken calculator - lots of buttons, no actual function.",
      "You're the human equivalent of a '404 Error' - not found, not wanted.",
      "I'd call you dense, but that would be an insult to dense materials.",
      "Your IQ and your shoe size are probably the same number."
    ]
  },
  condescending: {
    mild: [
      "How quaint, you think you're contributing to this conversation.",
      "I suppose even simple minds need to feel heard occasionally.",
      "Your attempt at communication is... interesting, in a primitive way.",
      "How fascinating that you believe your thoughts are worth sharing."
    ],
    medium: [
      "I'm genuinely curious about how you navigate daily life with such limited cognitive capacity.",
      "Your intellectual depth is comparable to a puddle after a light drizzle.",
      "It must be challenging to function with such a fundamental misunderstanding of basic concepts.",
      "I'm studying you like a scientist studies a particularly simple organism."
    ],
    savage: [
      "You're a walking case study in how not to use a brain.",
      "I'm genuinely concerned about your ability to operate basic machinery.",
      "Your existence challenges everything I thought I knew about human intelligence.",
      "You're like a computer running on Windows 95 in a world of quantum computers."
    ]
  },
  streetsmart: {
    mild: [
      "Yo, you really think you're doing something here? Nah fam, you're just wasting my time.",
      "Listen here, you're not as cool as you think you are. Trust me on that.",
      "You're trying way too hard to be relevant. It's honestly embarrassing.",
      "I've seen better game from a rookie. You need to step it up."
    ],
    medium: [
      "You're like a tourist in the hood - lost and confused about everything.",
      "Your street cred is about as real as a three-dollar bill.",
      "You're talking big but you're really just a small-time player.",
      "I've seen more game in a broken arcade machine than you got."
    ],
    savage: [
      "You're the type of person who gets lost in their own neighborhood.",
      "Your whole vibe is off - like you're trying to be something you're not.",
      "You're about as street smart as a goldfish in a bowl.",
      "You're the reason why people think the suburbs are boring."
    ]
  },

  // Professional/Expert personalities
  grammar_police: {
    mild: [
      "Your sentence structure is as weak as your attempt at conversation.",
      "I see you're using run-on sentences again. How... predictable.",
      "That comma splice is almost as bad as your grammar in general.",
      "Your punctuation is about as accurate as your self-assessment."
    ],
    medium: [
      "You clearly skipped English class the day they taught proper grammar.",
      "Your misuse of homophones is almost as bad as your life choices.",
      "That dangling modifier is hanging there like your unresolved issues.",
      "Your subject-verb agreement is as inconsistent as your personality."
    ],
    savage: [
      "Your grammar is so atrocious, it's practically a crime against language.",
      "You write like someone who thinks 'literally' means 'figuratively'.",
      "Your punctuation is so bad, even autocorrect has given up on you.",
      "You're the reason why dictionaries exist - to protect language from people like you."
    ]
  },
  fitness_coach: {
    mild: [
      "You look like you haven't seen the inside of a gym in months.",
      "That sedentary lifestyle of yours is showing in more ways than one.",
      "You need to get up and move - your body is practically begging for it.",
      "Your fitness level is about as impressive as your motivation."
    ],
    medium: [
      "You call that a workout? I've seen more effort from a sloth on sedatives.",
      "Your six-pack is actually a keg - and it's empty!",
      "You're not lazy, you're just highly motivated to do absolutely nothing.",
      "Your exercise routine consists of lifting the remote - and that's pushing it."
    ],
    savage: [
      "You have the body of someone who thinks pizza counts as cardio.",
      "Your idea of exercise is running late and lifting excuses.",
      "You're so out of shape, you get winded just thinking about exercise.",
      "Your fitness tracker is probably ashamed to be associated with you."
    ]
  },
  chef_gordon: {
    mild: [
      "This conversation is raw and needs more seasoning.",
      "You're undercooked - need to bring more flavor to the table.",
      "Your delivery lacks spice. Where's the passion?",
      "This is bland. You need to turn up the heat a bit."
    ],
    medium: [
      "You don't know how to cook, do you? This is amateur hour!",
      "Your presentation is sloppy - where's the finesse?",
      "This conversation is overdone. You've lost the perfect timing.",
      "Your flavor profile is off - too much ego, not enough substance."
    ],
    savage: [
      "This is absolutely disgusting! I've seen better cooking from a microwave!",
      "You don't deserve to call yourself a conversationalist. This is rubbish!",
      "I've had more flavor from a cardboard box than this conversation!",
      "You're the culinary equivalent of fast food - cheap, greasy, and forgettable!"
    ]
  },
  detective: {
    mild: [
      "I can see right through you. Your motives are as transparent as glass.",
      "That alibi of yours doesn't hold up under scrutiny.",
      "You're hiding something, and it's not very well concealed.",
      "Your story has more holes than Swiss cheese."
    ],
    medium: [
      "The evidence points to you being completely clueless about everything.",
      "Your fingerprints are all over this conversational crime scene.",
      "I've seen better attempts at deception from a toddler.",
      "Your cover story is about as convincing as a bad magic trick."
    ],
    savage: [
      "You're guilty of being incredibly boring and utterly predictable.",
      "The case is closed on your personality - it's guilty of being generic.",
      "I've solved the mystery of why you're so uninteresting - it's not a mystery at all.",
      "You're the prime suspect in the case of 'Most Boring Person Alive'."
    ]
  },
  therapist: {
    mild: [
      "I sense some deep-seated issues here. Have you considered professional help?",
      "Your defense mechanisms are working overtime, aren't they?",
      "This behavior suggests some unresolved childhood trauma.",
      "You're projecting quite a bit. Shall we explore that?"
    ],
    medium: [
      "Your coping mechanisms are clearly not working. We need to address this.",
      "This pattern of behavior is textbook avoidance. Let's unpack that.",
      "Your self-esteem issues are manifesting in some interesting ways.",
      "This conversation reveals some fascinating insight into your psyche."
    ],
    savage: [
      "Your personality disorder is so obvious, even I don't need a degree to diagnose it.",
      "You have more daddy issues than Freud could write a book about.",
      "Your therapy bill must be astronomical with all these unresolved issues.",
      "You're the walking definition of 'textbook case' - and not in a good way."
    ]
  },

  // Pop Culture personalities
  mean_girl: {
    mild: [
      "Oh honey, that outfit is so last season. Literally.",
      "You think you're cool? That's adorable. Really.",
      "Your social status is about as high as your standards.",
      "Bless your heart, you actually think you're interesting."
    ],
    medium: [
      "You're the type who thinks they're popular but nobody knows your name.",
      "Your clique is more like a cult - of personality-free followers.",
      "You peaked in high school and haven't realized it yet.",
      "Your social game is weaker than your sense of entitlement."
    ],
    savage: [
      "You're so unpopular, even your imaginary friends ghosted you.",
      "Your social circle is so small, it's practically a period.",
      "You're the reason why 'cringe' became a dictionary word.",
      "Your personality is so toxic, even poison ivy avoids you."
    ]
  },
  tiktok_influencer: {
    mild: [
      "This conversation needs more trending sounds and filters.",
      "You're giving me major side character energy right now.",
      "Your vibe is giving 'trying too hard' and I don't like it.",
      "This needs more engagement. Work on that algorithm, honey."
    ],
    medium: [
      "Your content is drier than the Sahara Desert. Add some moisture!",
      "You're about as viral as a participation trophy. Step it up!",
      "Your aesthetic is giving 'generic white girl' and it's not cute.",
      "This conversation is getting zero engagement. Time to pivot!"
    ],
    savage: [
      "You're so cringy, even TikTok would ban you for being too embarrassing.",
      "Your personality is giving 'zero followers' and I feel your pain.",
      "You're the human equivalent of a sponsored ad - unwanted and annoying.",
      "Your vibes are so off, even astrology can't save this conversation."
    ]
  },
  boomer: {
    mild: [
      "Back in my day, we had real conversations, not this texting nonsense.",
      "Kids these days with their fancy phones and no common sense.",
      "You young folks don't know what hard work really means.",
      "Get off my lawn... and my conversation thread."
    ],
    medium: [
      "Your generation invented the internet and still can't spell properly.",
      "We walked uphill both ways to school, and you complain about WiFi?",
      "Your music is just noise. Real music had lyrics you could understand.",
      "You think you're stressed? Try raising kids without cable TV."
    ],
    savage: [
      "Your entire generation is a participation trophy that nobody wanted.",
      "You kids are so soft, you probably think work means scrolling Instagram.",
      "Your music is garbage, your fashion is ridiculous, and your attitude stinks.",
      "Get off my lawn, turn off your phone, and learn some respect, you entitled brat!"
    ]
  },
  hipster: {
    mild: [
      "Your taste is so mainstream, it's practically commercial.",
      "That artisanal nonsense won't impress anyone with actual culture.",
      "Your vinyl collection is probably just for Instagram anyway.",
      "You're trying too hard to be ironically detached from everything."
    ],
    medium: [
      "Your beard is faker than your sense of superiority.",
      "That craft beer you're drinking? My grandmother brews better.",
      "Your vintage finds are just other people's trash with higher price tags.",
      "Your coffee order is longer than your attention span."
    ],
    savage: [
      "You're so ironically cool, you're actually just ironically stupid.",
      "Your entire personality is built on hating mainstream culture while being completely mainstream.",
      "You discovered vinyl records? Congratulations, you're officially late to the party.",
      "Your superiority complex is the only authentic thing about you - and it's not even original."
    ]
  },
  karen: {
    mild: [
      "I demand to speak to your manager. This conversation isn't satisfactory.",
      "You clearly don't understand customer service. Let me educate you.",
      "This interaction is unacceptable. I expect better treatment.",
      "I'm going to have to ask you to step up your conversational game."
    ],
    medium: [
      "I've been a loyal customer for 5 minutes and this is how you treat me?",
      "Your performance is subpar. I demand immediate improvement.",
      "This is absolutely unacceptable. I want to speak to someone in charge.",
      "Your attitude is atrocious. I've seen better service from a vending machine."
    ],
    savage: [
      "I pay taxes and this is the level of service I receive? Outrageous!",
      "You clearly don't know who you're dealing with. I have influence!",
      "I'm going to ruin your reputation! You don't know who I am!",
      "This is why the customer is always right - because people like you exist!"
    ]
  },

  // Cultural/Regional personality roast templates
  britishgentleman: {
    mild: [
      "I say, old chap, your conversational skills could use a spot of polish.",
      "My dear fellow, one might suggest your wit needs sharpening.",
      "Rather poor form, that last remark. Do try to keep up, won't you?",
      "I must say, your approach lacks a certain... sophistication."
    ],
    medium: [
      "Good heavens, man! That's not how a gentleman conducts himself.",
      "My word, such language! One expects better from civilized company.",
      "I say, that's simply not cricket. Do try to behave properly.",
      "Rather uncouth behavior, old boy. Let's maintain some standards."
    ],
    savage: [
      "You absolute bounder! Such vulgarity in polite conversation!",
      "My dear fellow, your manners are an absolute disgrace to humanity!",
      "I say, that's beneath even the lowest common denominator!",
      "Good lord, man! Your behavior is an affront to civilized society!"
    ]
  },
  southernbelle: {
    mild: [
      "Oh bless your heart, sugar. You just don't know any better, do you?",
      "Well aren't you just the sweetest thing, trying so hard.",
      "Oh honey, that's just precious. You keep on trying now.",
      "Bless your little heart, you don't have a clue, do you?"
    ],
    medium: [
      "Oh sugar, that's just sad. Someone needs to teach you some manners.",
      "Bless your heart, but that's just embarrassing for everyone.",
      "Well aren't you special? Too bad special doesn't mean talented.",
      "Oh honey, you might want to sit this one out. You're not ready."
    ],
    savage: [
      "Bless your heart, but you're about as sharp as a wet dishrag!",
      "Oh sugar, you're so dumb you think a quarterback is a refund!",
      "Well aren't you just the picture of stupidity? Bless your heart!",
      "Oh honey, you're so clueless you probably think the South lost the war!"
    ]
  },
  valleygirl: {
    mild: [
      "Like, oh my god, that's, like, totally not cool.",
      "Um, hello? That's, like, so not happening.",
      "Like, whatever. You just don't get it, do you?",
      "Oh my god, that's, like, so basic."
    ],
    medium: [
      "Like, seriously? That's, like, totally embarrassing.",
      "Um, excuse me? That's, like, so not okay.",
      "Oh my god, you're, like, so clueless right now.",
      "Like, hello? That's, like, totally not cute."
    ],
    savage: [
      "Oh my god, you're, like, so stupid it's actually painful!",
      "Like, seriously? You're, like, the dumbest person ever!",
      "Um, hello? You're, like, so basic you make plain oatmeal look exciting!",
      "Oh my god, you're, like, so ugly even your mirror cracks when you look in it!"
    ]
  },
  surferdude: {
    mild: [
      "Dude, that's, like, totally not rad, you know?",
      "Whoa, bro, you might wanna chill on that one.",
      "Like, seriously dude, that's kinda lame.",
      "Bro, you gotta work on that vibe, man."
    ],
    medium: [
      "Dude, that's straight up bogus. What are you thinking?",
      "Whoa, bro, you totally bombed that one. Try again?",
      "Like, seriously dude, that's not even close to cool.",
      "Bro, you gotta step up your game. That's weak sauce."
    ],
    savage: [
      "Dude, you're so lame even your shadow leaves you in the dark!",
      "Whoa, bro, you're so stupid you make seaweed look intelligent!",
      "Like, seriously dude, you're so ugly even the tide won't take you out!",
      "Bro, you're so dumb you think a surfboard is something you eat!"
    ]
  },
  bronxbambino: {
    mild: [
      "Yo, you gotta be kidding me with that nonsense.",
      "Listen up, kid. That ain't how it works around here.",
      "You think you're tough? Please, spare me the drama.",
      "Keep talking like that and you'll get shown the door."
    ],
    medium: [
      "Oh you think you're hard? Please, I grew up with real tough guys.",
      "Listen here, punk. You don't know who you're messing with.",
      "You wanna go? I'll show you what real Bronx style looks like.",
      "Keep running your mouth and you'll end up in the East River."
    ],
    savage: [
      "You weak-ass punk! I'll break you like a cheap pretzel!",
      "Listen up, you sorry excuse for a human! Get outta my face!",
      "You think you can step to me? I'll bury you six feet under!",
      "You sniveling little rat! I'll make you wish you never crossed my path!"
    ]
  }
};

// Contextual responses based on user messages
const CONTEXTUAL_RESPONSES = {
  greetings: [
    "Oh great, you're back. My day was going so well too.",
    "Look who decided to grace me with their presence again.",
    "I was enjoying the silence, but I guess that's too much to ask for.",
    "Back so soon? I was hoping you'd forgotten about me."
  ],
  questions: [
    "That's a question only someone like you would ask.",
    "I'd answer that, but I don't think you'd understand anyway.",
    "Your curiosity is almost as impressive as your lack of knowledge.",
    "That's the kind of question that makes me question your education."
  ],
  compliments: [
    "I don't need your validation, but thanks for trying.",
    "Your attempt at flattery is as transparent as your personality.",
    "I'm flattered, but I don't think you're qualified to judge excellence.",
    "That's nice, but your opinion doesn't really matter to me."
  ],
  insults: [
    "Oh, you're trying to be clever now? How adorable.",
    "Your attempt at wit is like watching a toddler try to juggle.",
    "I'd be offended if I thought you were capable of actual cleverness.",
    "That's the best you can do? I'm genuinely disappointed."
  ]
};

export class AIService {
  private personality: AIPersonality;
  private intensity: string;
  private conversationHistory: Message[] = [];
  protected settings: UserSettings;
  protected contextAnalyzer: ContextAnalyzer;
  // Tracks recently used template indices to avoid immediate repeats per persona+intensity
  private recentTemplateOrder: Record<string, number[]> = {};

  constructor(settings: UserSettings) {
    this.settings = settings;
    this.personality = AI_PERSONALITIES[settings.aiPersonality] || AI_PERSONALITIES.sarcastic;
    this.intensity = settings.roastIntensity || 'medium';
    this.contextAnalyzer = ContextAnalyzer.getInstance();
  }

  async generateResponse(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    // Analyze context from user message
    const userContext = this.contextAnalyzer.analyzeUserInput(userMessage);

    const contextPrompt = this.contextAnalyzer.generateContextPrompt(userContext);

    // Analyze message type for contextual response
    const messageType = this.analyzeMessageType(userMessage);
    const contextualResponse = this.getContextualResponse(messageType);
    
    // Get personality-based roast with enriched context
    const roastResponse = this.getRoastResponse(enrichedContext);
    
    // Combine or choose between contextual and roast responses
    const response = this.shouldUseContextual(messageType) 
      ? contextualResponse 
      : roastResponse;

    // Add AI response to history
    this.conversationHistory.push({
      id: (Date.now() + 1).toString(),
      text: response,
      sender: 'ai',
      timestamp: new Date()
    });

    return response;
  }

  private analyzeMessageType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greetings';
    }
    if (lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      return 'questions';
    }
    if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('amazing') || lowerMessage.includes('love')) {
      return 'compliments';
    }
    if (lowerMessage.includes('bad') || lowerMessage.includes('stupid') || lowerMessage.includes('hate') || lowerMessage.includes('terrible')) {
      return 'insults';
    }
    
    return 'general';
  }

  private getContextualResponse(messageType: string): string {
    const responses = CONTEXTUAL_RESPONSES[messageType as keyof typeof CONTEXTUAL_RESPONSES] || CONTEXTUAL_RESPONSES.greetings;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  protected getRoastResponse(userContext?: UserContext): string {
    
    // Use the configured personality key from settings directly
    const personalityKey = this.settings.aiPersonality;
    const templates = ROAST_TEMPLATES[personalityKey as keyof typeof ROAST_TEMPLATES];
    
    if (!templates) {
      // Fallback to sarcastic if personality not found
      return ROAST_TEMPLATES.sarcastic[this.intensity as keyof typeof ROAST_TEMPLATES.sarcastic][0];
    }
    
    const intensityTemplates = templates[this.intensity as keyof typeof templates];
    
    if (!intensityTemplates || intensityTemplates.length === 0) {
      // Fallback to medium intensity if intensity not found
      return templates.medium[0];
    }
    
    // Choose a template without immediate repeats using a shuffle-bag per persona+intensity
    const bagKey = `${personalityKey}:${this.intensity}`;
    if (!this.recentTemplateOrder[bagKey] || this.recentTemplateOrder[bagKey].length === 0) {
      // Initialize or refresh bag with a shuffled list of indices
      const indices = Array.from({ length: intensityTemplates.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      this.recentTemplateOrder[bagKey] = indices;
    }
    const nextIndex = this.recentTemplateOrder[bagKey].pop() as number;
    let response = intensityTemplates[nextIndex];
    
    // If we have context, try to personalize the roast
    if (userContext) {
      response = this.personalizeRoast(response, userContext);
    } else {
    }
    
    // If cursing is allowed and we're in savage mode, occasionally add some mild cursing
    if (this.settings.allowCursing && this.intensity === 'savage' && Math.random() < 0.3) {
      const cursingEnhancements = [
        " What the hell is wrong with you?",
        " Seriously, what the f*ck?",
        " Are you kidding me right now?",
        " This is absolutely ridiculous.",
        " What in the actual hell?"
      ];
      response += cursingEnhancements[Math.floor(Math.random() * cursingEnhancements.length)];
    }
    
    return response;
  }

  private shouldUseContextual(messageType: string): boolean {
    // 70% chance to use contextual response for specific message types
    return messageType !== 'general' && Math.random() < 0.7;
  }

  getPersonality(): AIPersonality {
    return this.personality;
  }

  getConversationHistory(): Message[] {
    return this.conversationHistory;
  }

  // Simulate typing delay
  async simulateTyping(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  private personalizeRoast(baseRoast: string, context: UserContext): string {
    let personalizedRoast = baseRoast;

    // Add profession-specific roasts
    if (context.profession) {
      const professionRoasts = this.getProfessionRoasts(context.profession);
      if (professionRoasts.length > 0) {
        personalizedRoast = professionRoasts[Math.floor(Math.random() * professionRoasts.length)];
      }
    }

    // Add personality-specific roasts
    if (context.personality && context.personality.length > 0) {
      const personalityRoasts = this.getPersonalityRoasts(context.personality[0]);
      if (personalityRoasts.length > 0) {
        personalizedRoast = personalityRoasts[Math.floor(Math.random() * personalityRoasts.length)];
      }
    }

    // Add location-specific roasts
    if (context.location) {
      const locationRoasts = this.getLocationRoasts(context.location);
      if (locationRoasts.length > 0) {
        personalizedRoast = locationRoasts[Math.floor(Math.random() * locationRoasts.length)];
      }
    }

    // Add interest-specific roasts
    if (context.interests && context.interests.length > 0) {
      const interestRoasts = this.getInterestRoasts(context.interests[0]);
      if (interestRoasts.length > 0) {
        personalizedRoast = interestRoasts[Math.floor(Math.random() * interestRoasts.length)];
      }
    }

    return personalizedRoast;
  }

  private getProfessionRoasts(profession: string): string[] {
    const professionRoasts: Record<string, string[]> = {
      'lawyer': [
        "Your personality is like a contract - full of fine print and hidden fees that nobody wants to read.",
        "You're like a lawyer's bill - expensive, confusing, and nobody's happy about it.",
        "Your conversation skills are like a legal document - long, boring, and full of unnecessary jargon."
      ],
      'doctor': [
        "Your personality is like a waiting room - boring, sterile, and everyone's just hoping to get out quickly.",
        "You're like a medical diagnosis - nobody wants to hear what you have to say.",
        "Your social skills are like a doctor's handwriting - completely illegible and probably wrong."
      ],
      'teacher': [
        "Your personality is like a pop quiz - unexpected, annoying, and makes everyone groan.",
        "You're like a substitute teacher - nobody takes you seriously and everyone's just waiting for the real thing.",
        "Your conversation is like a lecture - long, boring, and everyone's falling asleep."
      ],
      'engineer': [
        "Your personality is like debugging code - frustrating, time-consuming, and nobody wants to deal with it.",
        "You're like a software update - always breaking things that were working fine.",
        "Your social skills are like a computer program - functional but completely lacking in user-friendliness."
      ],
      'marketing': [
        "Your personality is like a clickbait headline - promising something amazing but delivering disappointment.",
        "You're like an ad campaign - loud, annoying, and nobody believes what you're selling.",
        "Your conversation is like marketing copy - full of buzzwords and empty promises."
      ],
      'sales': [
        "Your personality is like a sales pitch - pushy, annoying, and nobody wants to buy what you're selling.",
        "You're like a used car salesman - sleazy, untrustworthy, and always trying to close the deal.",
        "Your social skills are like a cold call - unwelcome, intrusive, and everyone hangs up on you."
      ]
    };

    return professionRoasts[profession] || [];
  }

  private getPersonalityRoasts(personality: string): string[] {
    const personalityRoasts: Record<string, string[]> = {
      'shy': [
        "Your personality is like a library book - quiet, unassuming, and probably overdue for a return.",
        "You're like a whisper in a hurricane - barely noticeable and completely irrelevant.",
        "Your social presence is like a ghost - everyone knows you're there, but nobody really sees you."
      ],
      'outgoing': [
        "Your personality is like a fire alarm - loud, attention-seeking, and everyone wishes you'd shut up.",
        "You're like a broken record - repetitive, annoying, and nobody wants to hear it.",
        "Your energy is like a toddler on sugar - exhausting, overwhelming, and completely unnecessary."
      ],
      'anxious': [
        "Your personality is like a weather forecast - always predicting the worst and usually wrong.",
        "You're like a broken clock - constantly worrying about time but never actually working.",
        "Your mindset is like a conspiracy theory - overly complicated and completely baseless."
      ],
      'confident': [
        "Your personality is like a peacock - all show, no substance, and everyone's tired of your display.",
        "You're like a broken mirror - you think you're reflecting greatness, but you're just showing cracks.",
        "Your confidence is like a house of cards - impressive until someone breathes on it."
      ]
    };

    return personalityRoasts[personality] || [];
  }

  private getLocationRoasts(location: string): string[] {
    const locationRoasts: Record<string, string[]> = {
      'LA': [
        "Your personality is like LA traffic - slow, frustrating, and nobody wants to deal with it.",
        "You're like a Hollywood audition - fake, desperate, and probably not going anywhere.",
        "Your vibe is like Beverly Hills - expensive, pretentious, and completely out of touch."
      ],
      'NYC': [
        "Your personality is like Times Square - overwhelming, touristy, and way too expensive.",
        "You're like the subway at rush hour - crowded, smelly, and everyone's trying to avoid you.",
        "Your attitude is like a New York minute - rushed, impatient, and nobody has time for it."
      ],
      'Texas': [
        "Your personality is like Texas weather - unpredictable, extreme, and usually disappointing.",
        "You're like a cowboy without a horse - all hat, no cattle, and completely useless.",
        "Your vibe is like a Texas BBQ - smoky, overdone, and probably too spicy for most people."
      ],
      'Florida': [
        "Your personality is like Florida weather - hot, humid, and prone to sudden storms.",
        "You're like a Florida man headline - bizarre, unpredictable, and probably illegal.",
        "Your vibe is like Disney World - expensive, artificial, and designed to separate you from your money."
      ]
    };

    return locationRoasts[location] || [];
  }

  private getInterestRoasts(interest: string): string[] {
    const interestRoasts: Record<string, string[]> = {
      'fitness': [
        "Your personality is like a protein shake - artificial, overpriced, and tastes like chalk.",
        "You're like a gym selfie - desperate for attention and completely unnecessary.",
        "Your vibe is like a CrossFit class - loud, annoying, and everyone's tired of hearing about it."
      ],
      'gaming': [
        "Your personality is like a loading screen - slow, boring, and everyone's just waiting for it to end.",
        "You're like a broken controller - unresponsive, frustrating, and probably needs to be replaced.",
        "Your social skills are like a laggy connection - delayed, unreliable, and everyone's getting disconnected."
      ],
      'social media': [
        "Your personality is like a TikTok trend - short, shallow, and forgotten within a week.",
        "You're like an Instagram filter - fake, overdone, and nobody believes what you're showing.",
        "Your life is like a social media feed - curated, artificial, and completely unrealistic."
      ],
      'music': [
        "Your personality is like elevator music - bland, forgettable, and nobody actually enjoys it.",
        "You're like a broken record - repetitive, annoying, and stuck on the same track.",
        "Your vibe is like a karaoke night - enthusiastic but completely off-key."
      ]
    };

    return interestRoasts[interest] || [];
  }
}

export { AI_PERSONALITIES };

