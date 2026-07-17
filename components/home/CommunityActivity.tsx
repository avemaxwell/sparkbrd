interface Activity {
  initials: string;
  color: string;
  text: string;
  time: string;
}

const ACTIVITY: Activity[] = [
  { initials: "SM", color: "from-blush to-papaya",   text: "Sarah shared a new watercolor lesson.",             time: "2 min ago" },
  { initials: "MD", color: "from-papaya to-lavender", text: "Mike's resource became Classroom Proven.",          time: "14 min ago" },
  { initials: "AR", color: "from-mustard to-blush",   text: "Ashley updated her Graphic Design Unit.",            time: "38 min ago" },
  { initials: "RT", color: "from-aqua to-lime",        text: "Rachel reviewed a STEM project.",                    time: "1 hr ago" },
  { initials: "JK", color: "from-lavender to-aqua",    text: "Jordan shared a new AI Literacy activity.",          time: "2 hrs ago" },
  { initials: "KB", color: "from-lime to-mustard",     text: "Kate's Ceramics 101 became Classroom Proven.",       time: "3 hrs ago" },
];

export default function CommunityActivity() {
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">The community, right now</h2>
          <p className="text-ink/50 mt-2">Educators sharing, testing, and improving lessons together.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-black/5 divide-y divide-ink/5">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                {a.initials}
              </div>
              <p className="text-sm text-ink/80 flex-1">{a.text}</p>
              <span className="text-xs text-ink/35 flex-shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
