import { HeroIllustration } from "@/components/hero-illustration";
import { Section } from "@/components/section";
import { FAQ, INPUTS, MODEL_CONTENTS, STEPS, USE_CASES } from "@/content/home";
import { APP_URL } from "@/lib/site";

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
        <div>
          <p className="inline-flex rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-muted">
            Early access · free · public projects
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            From drawings to <span className="text-accent">IFC</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Upload CAD drawings, PDF plans, sketches or a text description. We model the building and send
            you back an IFC file you can open in any BIM tool.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`${APP_URL}/new`}
              className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              Start a project
            </a>
            <a
              href={APP_URL}
              className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium hover:border-subtle"
            >
              Browse projects
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <HeroIllustration />
        </div>
      </section>

      <Section id="how-it-works" eyebrow="How it works" title="Three steps, one IFC file.">
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-border bg-surface p-6">
              <span className="font-mono text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="inputs"
        eyebrow="Inputs and output"
        title="Whatever you have, an IFC model back."
        intro="Combine several inputs in one project. A sketch with a few written dimensions works better than either one alone."
      >
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {INPUTS.map((input) => (
              <li key={input.label} className="rounded-xl border border-border bg-surface p-5">
                <p className="font-mono text-sm font-medium">{input.label}</p>
                <p className="mt-2 text-sm text-muted">{input.body}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-6">
            <p className="font-mono text-sm font-medium">IFC4 · LOD 100–200</p>
            <ul className="mt-4 space-y-2 text-sm">
              {MODEL_CONTENTS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Every model comes with a short list of the assumptions we made.
            </p>
          </div>
        </div>
      </Section>

      <Section id="use-cases" eyebrow="Use cases" title="Built for everyone who works with buildings.">
        <ul className="grid gap-6 sm:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <li key={useCase.title} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="font-semibold">{useCase.title}</h3>
              <p className="mt-2 text-sm text-muted">{useCase.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Questions and answers.">
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section
        id="start"
        eyebrow="Public projects"
        title="Start a project. Everyone can see the result."
        intro="During early access every project is public: once we've checked it, your drawings, description and the finished IFC model appear in the project gallery for anyone to view and download. Only your display name is shown — your email stays private."
      >
        <div className="flex flex-wrap gap-3">
          <a
            href={`${APP_URL}/new`}
            className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Start a project
          </a>
          <a
            href={APP_URL}
            className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium hover:border-subtle"
          >
            Browse projects
          </a>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-muted">
          Please don&apos;t upload confidential drawings or documents with personal details such as owners&apos;
          names or addresses.
        </p>
      </Section>
    </main>
  );
}
