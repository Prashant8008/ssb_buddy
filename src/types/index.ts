export type EntryType = 'NDA' | 'CDS' | 'AFCAT' | 'INET' | 'Agniveer' | 'TES' | 'Others';
export type ServiceType = 'Indian Army' | 'Indian Navy' | 'Indian Air Force';
export type BadgeType = 'Recommended' | 'Officer' | 'Mentor' | 'Verified' | 'Fitness Champion' | 'NDA Qualified';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  entry: EntryType;
  service: ServiceType;
  location: {
    city: string;
    state: string;
    country: string;
  };
  education: {
    school: string;
    college: string;
    degree: string;
    gradYear: string;
  };
  fitness: {
    running: string;
    pushups: number;
    pullups: number;
    bmi: number;
  };
  socials: {
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  badges: BadgeType[];
  ssbAttempts: number;
  recommendedStatus: boolean;
  ssbBoard?: string;
  reportingDate?: string;
  followers: number;
  following: number;
  postsCount: number;
}

export interface SSBJourneyEntry {
  id: string;
  year: string;
  title: string;
  board: string;
  result: 'Recommended' | 'Conference Out' | 'Screened Out' | 'Written Cleared';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
}
