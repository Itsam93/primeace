import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  RefreshCw
} from "lucide-react";

interface Service {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  displayOrder: number;
}

interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  services: Service[];
}

interface ServicesResponse {
  success: boolean;
  message: string;
  data: {
    categories: ServiceCategory[];
  };
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? ""
).replace(/\/+$/, "");

function ServiceCard({
  service
}: {
  service: Service;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 sm:p-7">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6] transition-colors duration-300 group-hover:bg-[#1556D6] group-hover:text-white">
        <BriefcaseBusiness size={21} strokeWidth={1.8} />
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-[#07152F]">
        {service.name}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        {service.shortDescription || service.description}
      </p>

      {service.deliverables.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Key deliverables
          </p>

          <ul className="space-y-3">
            {service.deliverables.map((deliverable, index) => (
              <li
                key={`${service._id}-${index}`}
                className="flex items-start gap-3 text-sm leading-6 text-slate-600"
              >
                <CheckCircle2
                  size={16}
                  className="mt-1 shrink-0 text-[#1556D6]"
                />

                <span>{deliverable}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-7">
        <Link
          to={`/request-service?serviceId=${encodeURIComponent(service._id)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1556D6] transition-colors hover:text-[#07152F]"
        >
          Request this service

          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <LoaderCircle
        size={32}
        className="animate-spin text-[#1556D6]"
      />

      <p className="mt-5 text-sm text-slate-500">
        Loading our services...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <BriefcaseBusiness
        size={32}
        className="mx-auto text-slate-400"
      />

      <h3 className="mt-5 text-lg font-semibold text-[#07152F]">
        Services are being updated
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
        Our service catalogue is currently being updated.
        Please check back shortly or contact our team for assistance.
      </p>

      <Link
        to="/contact"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1556D6] hover:text-[#07152F]"
      >
        Contact PrimeAce
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function ErrorState({
  onRetry
}: {
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/70 px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-[#07152F]">
        Unable to load our services
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
        We could not retrieve the service catalogue.
        Please check your connection and try again.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1F44]"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchServices() {
      setIsLoading(true);
      setError(false);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/services`,
          {
            method: "GET",
            headers: {
              Accept: "application/json"
            },
            signal: controller.signal
          }
        );

        const result = await response.json() as ServicesResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to retrieve services."
          );
        }

        const orderedCategories = [
          ...(result.data?.categories ?? [])
        ]
          .map((category) => ({
            ...category,
            services: [...(category.services ?? [])].sort(
              (a, b) => a.displayOrder - b.displayOrder
            )
          }))
          .sort(
            (a, b) => a.displayOrder - b.displayOrder
          )
          .filter((category) => category.services.length > 0);

        setCategories(orderedCategories);
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchServices();

    return () => {
      controller.abort();
    };
  }, [retryCount]);

  const totalServices = categories.reduce(
    (total, category) => total + category.services.length,
    0
  );

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#07152F]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-blue-700/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              What we do
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Solutions built around{" "}
              <span className="text-blue-300">
                your ambitions.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Explore the services offered by PrimeAce.
              From specialised professional support to
              digital solutions, we help turn ideas and
              business needs into practical outcomes.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                to="/request-service"
                className="inline-flex items-center gap-3 rounded-lg bg-[#1556D6] px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-blue-500"
              >
                Request a service
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-blue-300"
              >
                Talk to our team
                <ChevronRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue introduction */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-20 lg:pt-24">
        <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1556D6]">
              Our service catalogue
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#07152F] sm:text-4xl">
              Explore our services
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Discover the areas where we can support your
              goals. Select a service to begin your request.
            </p>
          </div>

          {!isLoading && !error && totalServices > 0 && (
            <p className="text-sm font-medium text-slate-500">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
              {" · "}
              {totalServices}{" "}
              {totalServices === 1 ? "service" : "services"}
            </p>
          )}
        </div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            onRetry={() => setRetryCount((count) => count + 1)}
          />
        ) : categories.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-20">
            {categories.map((category) => (
              <section
                key={category._id}
                id={category.slug}
                className="scroll-mt-28"
              >
                <div className="mb-8 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-[#1556D6]" />

                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1556D6]">
                      Service category
                    </p>
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#07152F] sm:text-3xl">
                    {category.name}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                    {category.description}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {category.services.map((service) => (
                    <ServiceCard
                      key={service._id}
                      service={service}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* Closing CTA */}
      <section className="bg-[#F3F6FC]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-[#0A1F44] px-7 py-14 sm:px-12 lg:px-16">
            <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                  Let's work together
                </p>

                <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  Have a project or need professional support?
                </h2>

                <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
                  Tell us what you need. Our team will review
                  your requirements and guide you through
                  the next steps.
                </p>
              </div>

              <Link
                to="/request-service"
                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-lg bg-[#1556D6] px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Get started
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
