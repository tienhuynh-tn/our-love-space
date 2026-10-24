export type MoodTone = "soft" | "tired" | "bright" | "quiet" | "missing";

export type Need =
  | "nothing"
  | "talk_to_me"
  | "distract_me"
  | "space"
  | "stay_with_me"
  | "i_need_you";

export type Person = {
  id: string;
  name: string;
  roleLabel: string;
  timezone: string;
  location: string;
  initials: string;
  accent: "rose" | "amber";
};

export type Status = {
  personId: string;
  mood: string;
  tone: MoodTone;
  note: string;
  need: Need;
  updatedAt: string;
};

export type SharedMoment = {
  id: string;
  authorId: string;
  caption: string;
  timeLabel: string;
  color: "rose" | "amber" | "sage";
};

export type Meeting = {
  startsAt: string;
  location: string;
  note: string;
};

export type OpenMeWhenLetter = {
  id: string;
  title: string;
  fromPersonId: string;
  unlockLabel: string;
};

export type LoveSpaceHome = {
  people: [Person, Person];
  currentUserId: string;
  partnerStatus: Status;
  recentThinkingAt: string;
  nextMeeting: Meeting;
  todaysMoments: SharedMoment[];
  unopenedLetters: OpenMeWhenLetter[];
};
