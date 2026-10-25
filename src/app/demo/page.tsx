import DemoPlayer from '@/components/landing/demo-player';

export const metadata = {
  title: 'Watch the demo — VidyaAI',
  description: 'A 4-minute walkthrough of VidyaAI: 8 tools for students and 7 for teachers, each shown from input to result.',
};

export default function DemoPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0E0E1A] px-4 pb-20 pt-28 lg:pt-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="gen-aurora absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-saffron/25 blur-[140px]" />
        <div className="gen-aurora absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-indigo-brand/25 blur-[140px] [animation-delay:-8s]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>
      <div className="relative mx-auto mb-10 max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-saffron">Product demo · 4 min</p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          See VidyaAI <span className="bg-gradient-to-r from-saffron-300 via-saffron to-rose-500 bg-clip-text text-transparent">in action</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/65 sm:text-lg">
          Every student and teacher tool, from what you type to what you get. Jump to any feature below.
        </p>
      </div>
      <div className="relative">
        <DemoPlayer />
      </div>
    </main>
  );
}
