import { ArrowRight } from "lucide-react";
import heroImage from "../../../assets/hero.png";

function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-[#07152F] text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(7, 21, 47, 0.82), rgba(7, 21, 47, 0.88)), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute -right-32 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-[#1556D6]/25 blur-3xl" />

      <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Welcome to PrimeAce
          </p>

          <h1 className="text-5xl font-bold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
            Your vision.
            <span className="block text-blue-400">Our next project.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
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

        <div className="relative hidden min-h-[420px] items-center justify-center lg:flex">
          <div className="relative flex h-72 w-72 rotate-[-6deg] items-center justify-center rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#1556D6] to-[#0A1F44] shadow-2xl shadow-blue-950/50">
            <div className="text-center">
              <p className="text-5xl font-bold tracking-tight">
                Prime<span className="text-blue-300">Ace</span>
              </p>
              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-blue-300" />
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.3em] text-blue-100/80">
                Ideas into reality
              </p>
            </div>
          </div>

          <div className="absolute left-0 top-12 h-14 w-14 rounded-full bg-blue-400/20 blur-sm" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
