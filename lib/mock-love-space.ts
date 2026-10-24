import type { LoveSpaceHome } from "@/types/love-space";

export const loveSpaceHome: LoveSpaceHome = {
  currentUserId: "person-a",
  people: [
    {
      id: "person-a",
      name: "Linh",
      roleLabel: "Here",
      timezone: "Asia/Ho_Chi_Minh",
      location: "Ho Chi Minh City",
      initials: "L",
      accent: "rose",
    },
    {
      id: "person-b",
      name: "Minh",
      roleLabel: "There",
      timezone: "Europe/Paris",
      location: "Paris",
      initials: "M",
      accent: "amber",
    },
  ],
  partnerStatus: {
    personId: "person-b",
    mood: "Missing you quietly",
    tone: "missing",
    note: "Making tea before bed. Wish the kitchen light was on in the same room as you.",
    need: "stay_with_me",
    updatedAt: "2026-09-29T21:14:00+02:00",
  },
  recentThinkingAt: "2026-09-29T20:52:00+07:00",
  nextMeeting: {
    startsAt: "2026-10-18T09:30:00+07:00",
    location: "Da Nang, Vietnam",
    note: "First coffee by the river, then no plans on purpose.",
  },
  todaysMoments: [
    {
      id: "moment-1",
      authorId: "person-a",
      caption: "The sky turned peach after the rain.",
      timeLabel: "07:28",
      color: "rose",
    },
    {
      id: "moment-2",
      authorId: "person-b",
      caption: "Found the song from our walk again.",
      timeLabel: "13:06",
      color: "sage",
    },
    {
      id: "moment-3",
      authorId: "person-a",
      caption: "Saved you the last bite in spirit.",
      timeLabel: "19:41",
      color: "amber",
    },
  ],
  unopenedLetters: [
    {
      id: "letter-1",
      title: "Open when the distance feels louder than usual",
      fromPersonId: "person-b",
      unlockLabel: "Available tonight",
    },
    {
      id: "letter-2",
      title: "Open on the morning before we meet",
      fromPersonId: "person-a",
      unlockLabel: "Locked until Oct 17",
    },
  ],
};
