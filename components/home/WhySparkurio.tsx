import {
  IconPersonCheck, IconUsers, IconRefresh, IconShieldCheck, IconStar,
  IconClock, IconBrain, IconChatBubble,
} from "@/components/icons";

const SIGNALS = [
  { icon: IconPersonCheck, text: "Built by educators." },
  { icon: IconUsers,       text: "Shared by educators." },
  { icon: IconRefresh,     text: "Improved by educators." },
  { icon: IconShieldCheck, text: "Classroom-tested." },
  { icon: IconStar,        text: "Peer reviewed." },
  { icon: IconClock,       text: "Version history." },
  { icon: IconBrain,       text: "AI transparency." },
  { icon: IconChatBubble,  text: "Real classroom reflections." },
];

export default function WhySparkurio() {
  return (
    <section className="py-16 md:py-20 px-6 bg-cork-warm">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-3">Why Sparkurio?</h2>
        <p className="text-ink/50 mb-10 max-w-md mx-auto">Trust, built in from the start.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SIGNALS.map((s) => (
            <div key={s.text} className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
              <s.icon className="w-6 h-6 text-papaya mx-auto" />
              <p className="text-sm font-medium text-ink mt-3 leading-snug">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
