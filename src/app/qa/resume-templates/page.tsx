import { notFound } from "next/navigation";

import { ResumeTemplate } from "@/components/editor/resume-template";
import { TemplateThumbnail } from "@/components/editor/template-thumbnail";
import { buildTemplatePreviewResume, getTemplateConfig, resolveTemplateId, TEMPLATES } from "@/lib/templates-config";

export const metadata = {
  title: "Resume Template QA",
  robots: {
    index: false,
    follow: false,
  },
};

type ResumeTemplateQaPageProps = {
  searchParams?: Promise<{
    template?: string;
    mode?: "screen" | "mobile" | "print";
  }>;
};

export default async function ResumeTemplateQaPage({ searchParams }: ResumeTemplateQaPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = (await searchParams) ?? {};
  const templateId = params.template ? resolveTemplateId(params.template) : null;
  const mode = params.mode ?? "screen";

  if (templateId) {
    const template = getTemplateConfig(templateId);
    const previewResume = buildTemplatePreviewResume(template.id);

    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
        <div className="mx-auto max-w-[1200px] space-y-6">
          <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">Internal QA</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{template.name}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Focused verification view for the <strong>{template.name}</strong> template in <strong>{mode}</strong> mode.
            </p>
          </header>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className={mode === "print" ? "mx-auto max-w-[210mm]" : "mx-auto max-w-[32rem] md:max-w-[940px]"}>
              <ResumeTemplate
                data={previewResume}
                mode={mode === "print" ? "screen" : mode}
                isPrint={mode === "print"}
                className="resume-paper-shadow"
              />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-[1400px] space-y-10">
        <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">Internal QA</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Resume Template Verification Lab</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            This page renders every resume template from the same configuration used by the editor, thumbnail cards,
            mobile preview, and print output so we can verify structural consistency and ATS-safe quality.
          </p>
        </header>

        <section className="space-y-4">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">Gallery Cards</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Thumbnail Accuracy</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {TEMPLATES.map((template) => (
              <article
                key={`card-${template.id}`}
                className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm"
                data-template-id={template.id}
              >
                <div className="h-56 border-b border-slate-100">
                  <TemplateThumbnail template={template} />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">{template.name}</h3>
                    {template.isAtsSafe ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        ATS-safe
                      </span>
                    ) : null}
                    {template.isPremium ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-amber-700">
                        Premium
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{template.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">Desktop Output</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Preview vs Print Source</h2>
          </div>
          <div className="space-y-8">
            {TEMPLATES.map((template) => {
              const previewResume = buildTemplatePreviewResume(template.id);
              return (
                <article
                  key={`desktop-${template.id}`}
                  className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm"
                  data-template-id={template.id}
                >
                  <div className="border-b border-slate-100 px-6 py-5">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">{template.category}</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">{template.name}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{template.description}</p>
                  </div>
                  <div className="overflow-x-auto bg-slate-100 px-4 py-8 md:px-8">
                    <div className="mx-auto max-w-[940px]">
                      <ResumeTemplate data={previewResume} mode="screen" className="resume-paper-shadow" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">Mobile Output</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Phone Preview Mode</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {TEMPLATES.map((template) => {
              const previewResume = buildTemplatePreviewResume(template.id);
              return (
                <article
                  key={`mobile-${template.id}`}
                  className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm"
                  data-template-id={template.id}
                >
                  <div className="mb-4">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-500">Mobile Mode</p>
                    <h3 className="mt-2 text-base font-black tracking-tight text-slate-900">{template.name}</h3>
                  </div>
                  <div className="mx-auto max-w-[30rem]">
                    <ResumeTemplate data={previewResume} mode="mobile" className="resume-paper-shadow" />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
