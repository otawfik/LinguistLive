
export enum Language {
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  JAPANESE = 'Japanese',
  CHINESE = 'Mandarin Chinese',
  ITALIAN = 'Italian',
  KOREAN = 'Korean'
}

export enum Proficiency {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  NATIVE_FLUENCY = 'Native Fluency'
}

export enum Scenario {
  CASUAL = 'Casual Conversation',
  TRAVEL = 'Travel & Tourism',
  CAFE = 'Ordering at a Restaurant',
  JOB_INTERVIEW = 'Professional Interview',
  MARKET = 'Shopping at a Market',
  MEDICAL = 'Visiting a Doctor'
}

export interface SessionConfig {
  language: Language;
  proficiency: Proficiency;
  scenario: Scenario;
}

export interface TranscriptionEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
