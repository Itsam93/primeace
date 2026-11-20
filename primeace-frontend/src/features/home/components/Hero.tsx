import { ArrowRight } from "lucide-react";

function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-[#07152F] text-white"
    >
      <div className="absolute -right-32 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-[#1556D6]/25 blur-3xl" />

      <div className="mx-auto grid min-h-[650px] max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Welcome to PrimeAce
          </p>

          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-7xl">
            Your vision.
            <span className="block text-blue-400">
              Our next project.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Every great project starts with an idea. Tell us what you have in
            mind, and let&apos;s explore what we can build together.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="inline-flex items-center gap-3 rounded-lg bg-[#1556D6] px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Start a Project
              <ArrowRight size={18} />
            </a>
          </div>
        </div>

        <div className="relative flex min-h-[300px] items-center justify-center sm:min-h-[380px] lg:min-h-[420px]">
          <div className="relative flex h-56 w-56 rotate-[-6deg] items-center justify-center rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#1556D6] to-[#0A1F44] shadow-2xl shadow-blue-950/50 sm:h-72 sm:w-72">
            <div className="text-center">
              <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                Prime<span className="text-blue-300">Ace</span>
              </p>

              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-blue-300" />

              <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.3em] text-blue-100/80 sm:text-xs">
                Ideas into reality
              </p>
            </div>
          </div>

          <div className="absolute left-0 top-8 h-14 w-14 rounded-full bg-blue-400/20 blur-sm sm:top-12" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
