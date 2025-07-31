export interface UserContext {
  profession?: string;
  personality?: string[];
  location?: string;
  interests?: string[];
  characteristics?: string[];
  circumstances?: string[];
  mentionedTopics?: string[];
}

export class ContextAnalyzer {
  private static instance: ContextAnalyzer;

  static getInstance(): ContextAnalyzer {
    if (!ContextAnalyzer.instance) {
      ContextAnalyzer.instance = new ContextAnalyzer();
    }
    return ContextAnalyzer.instance;
  }

  analyzeUserInput(userInput: string): UserContext {
    const context: UserContext = {
      personality: [],
      interests: [],
      characteristics: [],
      circumstances: [],
      mentionedTopics: [],
    };

    const input = userInput.toLowerCase();

    // Extract profession/job
    context.profession = this.extractProfession(input);

    // Extract personality traits
    context.personality = this.extractPersonalityTraits(input);

    // Extract location
    context.location = this.extractLocation(input);

    // Extract interests/hobbies
    context.interests = this.extractInterests(input);

    // Extract physical characteristics
    context.characteristics = this.extractCharacteristics(input);

    // Extract life circumstances
    context.circumstances = this.extractCircumstances(input);

    // Extract any other mentioned topics
    context.mentionedTopics = this.extractMentionedTopics(input);

    return context;
  }

  private extractProfession(input: string): string | undefined {
    const professionKeywords = {
      'lawyer': ['lawyer', 'attorney', 'legal', 'law school', 'bar exam'],
      'doctor': ['doctor', 'physician', 'medical', 'nurse', 'healthcare', 'hospital'],
      'teacher': ['teacher', 'professor', 'educator', 'school', 'classroom', 'students'],
      'engineer': ['engineer', 'software', 'programmer', 'developer', 'coding', 'tech'],
      'marketing': ['marketing', 'advertising', 'brand', 'social media', 'campaign'],
      'sales': ['sales', 'salesperson', 'selling', 'commission', 'closing'],
      'finance': ['finance', 'banker', 'accountant', 'investment', 'money', 'wall street'],
      'artist': ['artist', 'painter', 'musician', 'creative', 'designer', 'photographer'],
      'writer': ['writer', 'author', 'journalist', 'blogger', 'content'],
      'chef': ['chef', 'cook', 'restaurant', 'kitchen', 'food'],
      'student': ['student', 'college', 'university', 'school', 'studying'],
      'entrepreneur': ['entrepreneur', 'business owner', 'startup', 'founder', 'ceo'],
    };

    for (const [profession, keywords] of Object.entries(professionKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return profession;
      }
    }

    return undefined;
  }

  private extractPersonalityTraits(input: string): string[] {
    const traits: string[] = [];
    const personalityKeywords = {
      'shy': ['shy', 'introverted', 'quiet', 'reserved', 'timid'],
      'outgoing': ['outgoing', 'extroverted', 'social', 'loud', 'energetic'],
      'anxious': ['anxious', 'worried', 'stressed', 'nervous', 'overthinker'],
      'confident': ['confident', 'arrogant', 'cocky', 'self-assured', 'bold'],
      'lazy': ['lazy', 'procrastinator', 'unmotivated', 'slacker'],
      'perfectionist': ['perfectionist', 'anal', 'detail-oriented', 'obsessive'],
      'chaotic': ['chaotic', 'messy', 'disorganized', 'spontaneous'],
      'organized': ['organized', 'neat', 'structured', 'planner'],
      'sensitive': ['sensitive', 'emotional', 'cry easily', 'thin-skinned'],
      'sarcastic': ['sarcastic', 'witty', 'smart-ass', 'snarky'],
    };

    for (const [trait, keywords] of Object.entries(personalityKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        traits.push(trait);
      }
    }

    return traits;
  }

  private extractLocation(input: string): string | undefined {
    const locationKeywords = {
      'LA': ['los angeles', 'la', 'california', 'hollywood', 'beverly hills'],
      'NYC': ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens'],
      'Texas': ['texas', 'dallas', 'houston', 'austin', 'san antonio'],
      'Florida': ['florida', 'miami', 'orlando', 'tampa', 'disney'],
      'Seattle': ['seattle', 'washington', 'pacific northwest', 'rain'],
      'Portland': ['portland', 'oregon', 'hipster', 'coffee'],
      'Chicago': ['chicago', 'illinois', 'windy city', 'midwest'],
      'Boston': ['boston', 'massachusetts', 'new england', 'academic'],
      'Nashville': ['nashville', 'tennessee', 'country music', 'music city'],
      'Vegas': ['las vegas', 'vegas', 'nevada', 'casino', 'sin city'],
    };

    for (const [location, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return location;
      }
    }

    return undefined;
  }

  private extractInterests(input: string): string[] {
    const interests: string[] = [];
    const interestKeywords = {
      'fitness': ['gym', 'workout', 'fitness', 'exercise', 'running', 'yoga'],
      'gaming': ['gaming', 'video games', 'gamer', 'playstation', 'xbox', 'nintendo'],
      'social media': ['instagram', 'tiktok', 'twitter', 'facebook', 'social media'],
      'music': ['music', 'concert', 'band', 'singer', 'playlist', 'spotify'],
      'cooking': ['cooking', 'baking', 'recipe', 'food', 'kitchen'],
      'travel': ['travel', 'vacation', 'trip', 'airplane', 'hotel', 'backpacking'],
      'reading': ['reading', 'books', 'novel', 'library', 'bookworm'],
      'sports': ['sports', 'football', 'basketball', 'soccer', 'baseball', 'tennis'],
      'art': ['art', 'painting', 'drawing', 'creative', 'design'],
      'photography': ['photography', 'camera', 'photos', 'instagram'],
      'coffee': ['coffee', 'starbucks', 'espresso', 'latte', 'caffeine'],
      'wine': ['wine', 'alcohol', 'drinking', 'bar', 'cocktail'],
    };

    for (const [interest, keywords] of Object.entries(interestKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        interests.push(interest);
      }
    }

    return interests;
  }

  private extractCharacteristics(input: string): string[] {
    const characteristics: string[] = [];
    const characteristicKeywords = {
      'tall': ['tall', 'height', '6 foot', 'towering'],
      'short': ['short', 'height', '5 foot', 'petite'],
      'bald': ['bald', 'hair loss', 'shaved head'],
      'beard': ['beard', 'facial hair', 'mustache', 'goatee'],
      'glasses': ['glasses', 'contacts', 'vision', 'blind'],
      'tattoos': ['tattoo', 'ink', 'body art'],
      'piercings': ['piercing', 'earring', 'nose ring'],
      'muscular': ['muscular', 'buff', 'strong', 'gym rat'],
      'skinny': ['skinny', 'thin', 'slim', 'underweight'],
      'curvy': ['curvy', 'plus size', 'thick', 'voluptuous'],
    };

    for (const [characteristic, keywords] of Object.entries(characteristicKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        characteristics.push(characteristic);
      }
    }

    return characteristics;
  }

  private extractCircumstances(input: string): string[] {
    const circumstances: string[] = [];
    const circumstanceKeywords = {
      'single': ['single', 'dating', 'relationship', 'boyfriend', 'girlfriend'],
      'married': ['married', 'husband', 'wife', 'spouse', 'wedding'],
      'divorced': ['divorced', 'ex', 'breakup', 'separation'],
      'parent': ['parent', 'mom', 'dad', 'children', 'kids', 'baby'],
      'student': ['student', 'college', 'university', 'school', 'studying'],
      'unemployed': ['unemployed', 'jobless', 'fired', 'laid off', 'between jobs'],
      'rich': ['rich', 'wealthy', 'money', 'expensive', 'luxury'],
      'poor': ['poor', 'broke', 'money', 'cheap', 'budget'],
      'living with parents': ['parents', 'mom', 'dad', 'basement', 'living at home'],
      'roommate': ['roommate', 'room', 'apartment', 'rent'],
    };

    for (const [circumstance, keywords] of Object.entries(circumstanceKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        circumstances.push(circumstance);
      }
    }

    return circumstances;
  }

  private extractMentionedTopics(input: string): string[] {
    const topics: string[] = [];
    const topicKeywords = [
      'politics', 'religion', 'money', 'dating', 'friends', 'family',
      'work', 'school', 'health', 'food', 'sleep', 'exercise',
      'technology', 'cars', 'pets', 'weather', 'time', 'age',
      'clothes', 'shoes', 'hair', 'makeup', 'fashion', 'style'
    ];

    for (const topic of topicKeywords) {
      if (input.includes(topic)) {
        topics.push(topic);
      }
    }

    return topics;
  }

  generateContextPrompt(context: UserContext): string {
    const prompts: string[] = [];

    if (context.profession) {
      prompts.push(`The user mentioned they work as a ${context.profession}.`);
    }

    if (context.personality.length > 0) {
      prompts.push(`They described themselves as: ${context.personality.join(', ')}.`);
    }

    if (context.location) {
      prompts.push(`They're from ${context.location}.`);
    }

    if (context.interests.length > 0) {
      prompts.push(`They're interested in: ${context.interests.join(', ')}.`);
    }

    if (context.characteristics.length > 0) {
      prompts.push(`Physical characteristics: ${context.characteristics.join(', ')}.`);
    }

    if (context.circumstances.length > 0) {
      prompts.push(`Life circumstances: ${context.circumstances.join(', ')}.`);
    }

    if (context.mentionedTopics.length > 0) {
      prompts.push(`They mentioned: ${context.mentionedTopics.join(', ')}.`);
    }

    if (prompts.length === 0) {
      return "The user provided minimal context about themselves.";
    }

    return `Context about the user: ${prompts.join(' ')} Use this information to create a personalized roast that feels specifically tailored to them.`;
  }
} 