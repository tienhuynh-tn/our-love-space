import { Card, SectionLabel } from "@/components/ui/card";
import { LocalTime, MeetingCountdown } from "@/components/space/live-time";
import { ThinkingButton } from "@/components/space/thinking-button";
import type { LoveSpaceHome, Person, SharedMoment } from "@/types/love-space";

type HomePageProps = {
  home: LoveSpaceHome;
};

export function HomePage({ home }: HomePageProps) {
  const [currentUser, partner] = home.people;
  const letters = home.unopenedLetters;

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:gap-6">
      <section className="min-w-0 space-y-5">
        <Hero people={home.people} />
        <div id="our-now" className="scroll-mt-6"><PartnerStatus partner={partner} home={home} /></div>

        <div className="grid gap-5 md:grid-cols-2">
          <MeetingCard home={home} />
          <div id="our-letters" className="scroll-mt-6"><LettersPreview partner={partner} letters={letters} /></div>
        </div>
      </section>

      <aside className="min-w-0 space-y-5">
        <div id="thinking-of-you" className="scroll-mt-6"><ThinkingButton partnerName={partner.name} recentThinkingAt={home.recentThinkingAt} /></div>
        <div id="our-day" className="scroll-mt-6"><MomentsPreview people={home.people} moments={home.todaysMoments} /></div>
        <QuietNote currentUser={currentUser} partner={partner} />
      </aside>
    </div>
  );
}

function Hero({ people }: { people: [Person, Person] }) {
  return (
    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div className="absolute right-[-5rem] top-[-6rem] size-52 rounded-full bg-[#e7b9a7]/30 blur-3xl dark:bg-[#b77f69]/20" />
      <div className="absolute bottom-[-7rem] left-[-5rem] size-56 rounded-full bg-[#b9cfc2]/35 blur-3xl dark:bg-[#6f9183]/18" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Good evening</p>
            <h1 className="mt-2 max-w-[11ch] text-3xl font-semibold leading-tight tracking-tight text-stone-950 dark:text-white min-[380px]:max-w-[13ch] min-[380px]:text-4xl sm:max-w-xl sm:text-5xl">
              Your little room is awake.
            </h1>
          </div>
          <div className="hidden rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.07] dark:text-stone-400 sm:block">
            Private
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <PersonTimeCard key={person.id} person={person} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PersonTimeCard({ person }: { person: Person }) {
  const accent =
    person.accent === "rose"
      ? "from-[#f6d6c8] to-[#f9efe5] dark:from-[#6d3e33] dark:to-[#29201d]"
      : "from-[#f3d49b] to-[#f8eed9] dark:from-[#75592b] dark:to-[#2b2418]";

  return (
    <div className={`rounded-[1.5rem] bg-gradient-to-br ${accent} p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-white/75 text-base font-semibold text-stone-950 shadow-sm dark:bg-white/10 dark:text-white">
          {person.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-950 dark:text-white">{person.name}</p>
          <p className="text-xs text-stone-600 dark:text-stone-300">{person.location}</p>
        </div>
      </div>
      <p className="mt-6 text-4xl font-semibold tabular-nums tracking-tight text-stone-950 dark:text-white">
        <LocalTime timezone={person.timezone} />
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {person.roleLabel}
      </p>
    </div>
  );
}

function PartnerStatus({ partner, home }: { partner: Person; home: LoveSpaceHome }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SectionLabel>{partner.name} now</SectionLabel>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">
            {home.partnerStatus.mood}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">
            {home.partnerStatus.note}
          </p>
        </div>
        <div className="rounded-2xl bg-[#efe3d6] px-4 py-3 text-sm font-semibold text-stone-800 dark:bg-white/[0.08] dark:text-stone-100">
          Needs: stay with me
        </div>
      </div>
    </Card>
  );
}

function MeetingCard({ home }: { home: LoveSpaceHome }) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionLabel>Until we meet again</SectionLabel>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">
        {home.nextMeeting.location}
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{home.nextMeeting.note}</p>
      <div className="mt-5">
        <MeetingCountdown startsAt={home.nextMeeting.startsAt} />
      </div>
    </Card>
  );
}

function MomentsPreview({ people, moments }: { people: [Person, Person]; moments: SharedMoment[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Our day</SectionLabel>
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Today</span>
      </div>
      <div className="mt-5 space-y-3">
        {moments.map((moment) => {
          const author = people.find((person) => person.id === moment.authorId);
          return <MomentRow key={moment.id} author={author} moment={moment} />;
        })}
      </div>
    </Card>
  );
}

function MomentRow({ author, moment }: { author?: Person; moment: SharedMoment }) {
  const colors = {
    rose: "bg-[#ead0c4]",
    amber: "bg-[#ead8a8]",
    sage: "bg-[#c9d8cf]",
  };

  return (
    <article className="flex gap-3 rounded-2xl bg-white/55 p-3 dark:bg-white/[0.06]">
      <div className={`h-16 w-14 shrink-0 rounded-2xl ${colors[moment.color]} shadow-inner`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-stone-950 dark:text-white">{author?.name}</p>
          <time className="text-xs tabular-nums text-stone-500 dark:text-stone-400">{moment.timeLabel}</time>
        </div>
        <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-stone-300">{moment.caption}</p>
      </div>
    </article>
  );
}

function LettersPreview({
  partner,
  letters,
}: {
  partner: Person;
  letters: LoveSpaceHome["unopenedLetters"];
}) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionLabel>Open me when</SectionLabel>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">
        {letters.length} unopened letters
      </h2>
      <div className="mt-5 space-y-3">
        {letters.map((letter) => (
          <article key={letter.id} className="rounded-2xl border border-stone-900/5 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-sm font-semibold leading-6 text-stone-950 dark:text-white">{letter.title}</p>
            <p className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400">
              From {letter.fromPersonId === partner.id ? partner.name : "you"} / {letter.unlockLabel}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}

function QuietNote({ currentUser, partner }: { currentUser: Person; partner: Person }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-900/10 bg-stone-950/5 p-5 text-sm leading-6 text-stone-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
      <p className="font-semibold text-stone-950 dark:text-white">
        {currentUser.name} and {partner.name}
      </p>
      <p className="mt-2">
        A place for the tiny updates, the not-quite-messages, and the soft proof that the day is being shared.
      </p>
    </div>
  );
}
