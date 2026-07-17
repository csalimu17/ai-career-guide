import { permanentRedirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(searchParams: SearchParams | undefined) {
  const params = new URLSearchParams();
  if (!searchParams) return params;

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    }
  }

  return params;
}

export default async function EditorRedirectPage({
  searchParams,
}: {
  // Next.js app router types (15.x) may model `searchParams` as a Promise in generated types.
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = toUrlSearchParams(resolvedSearchParams);
  const suffix = params.toString();
  permanentRedirect(suffix ? `/cv-editor?${suffix}` : "/cv-editor");
}
