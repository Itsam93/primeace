import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import ServiceCard from "./ServiceCard";
import { services } from "../data/services";

const AUTOPLAY_INTERVAL = 6000;
const TRANSITION_DURATION = 500;

type Direction = "next" | "previous";

function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("next");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const transitionTimeout = useRef<number | null>(null);

  const clearTransition = useCallback(() => {
    if (transitionTimeout.current !== null) {
      window.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }
  }, []);

  const changeService = useCallback(
    (nextIndex: number, nextDirection: Direction) => {
      if (
        services.length <= 1 ||
        nextIndex === activeIndexRef.current ||
        isTransitioningRef.current
      ) {
        return;
      }

      isTransitioningRef.current = true;
      setIsTransitioning(true);
      setDirection(nextDirection);

      clearTransition();

      transitionTimeout.current = window.setTimeout(() => {
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
        setIsTransitioning(false);

        isTransitioningRef.current = false;
        transitionTimeout.current = null;
      }, TRANSITION_DURATION);
    },
    [clearTransition]
  );

  const goToService = (nextDirection: Direction) => {
    const directionValue = nextDirection === "next" ? 1 : -1;

    const nextIndex =
      (activeIndexRef.current + directionValue + services.length) %
      services.length;

    changeService(nextIndex, nextDirection);
  };

  // Automatic service rotation.
  useEffect(() => {
    if (services.length <= 1) return;

    const interval = window.setInterval(() => {
      if (isTransitioningRef.current) return;

      const nextIndex =
        (activeIndexRef.current + 1) % services.length;

      changeService(nextIndex, "next");
    }, AUTOPLAY_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [changeService]);

  // Clean up pending transitions.
  useEffect(() => {
    return () => {
      clearTransition();
    };
  }, [clearTransition]);

  const activeService = services[activeIndex];

  if (!activeService) return null;

  return (
    <section
      id="services"
      className="bg-[#07152F] py-24 text-white sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section heading and navigation */}
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              What We Do
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Expertise that turns ideas into results.
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-300">
              From research and data analysis to technology and business
              solutions, we provide services that address practical needs
              and support meaningful progress.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex shrink-0 items-center gap-3">
            <span className="mr-3 text-sm font-medium tabular-nums text-slate-400">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(services.length).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={() => goToService("previous")}
              disabled={services.length <= 1 || isTransitioning}
              aria-label="Previous service"
              className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors duration-200 hover:border-[#1556D6] hover:bg-[#1556D6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => goToService("next")}
              disabled={services.length <= 1 || isTransitioning}
              aria-label="Next service"
              className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors duration-200 hover:border-[#1556D6] hover:bg-[#1556D6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Active service */}
        <div className="mt-16 overflow-hidden">
          <div
            key={activeService.number}
            className={`w-full ${
              isTransitioning
                ? direction === "next"
                  ? "animate-service-enter-right"
                  : "animate-service-enter-left"
                : ""
            }`}
          >
            <ServiceCard service={activeService} />
          </div>
        </div>

        {/* Service indicators */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {services.map((service, index) => (
            <button
              key={service.number}
              type="button"
              onClick={() => {
                const nextDirection: Direction =
                  index > activeIndex ? "next" : "previous";

                changeService(index, nextDirection);
              }}
              disabled={isTransitioning}
              aria-label={`Go to ${service.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-1.5 transition-all duration-200 disabled:cursor-not-allowed ${
                index === activeIndex
                  ? "w-10 bg-blue-500"
                  : "w-5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
