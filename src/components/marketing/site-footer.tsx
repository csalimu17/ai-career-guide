import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
const groups = [
  { title:"Product", links:[["CV Builder","/cv-builder"],["ATS Checker","/ats-cv-checker"],["Templates","/cv-templates"],["Pricing","/pricing"]] },
  { title:"Resources", links:[["CV Examples","/cv-examples"],["Guides","/guides"],["Blog","/blog"],["Support","/support"]] },
  { title:"Company", links:[["Privacy","/privacy"],["Terms","/terms"],["Log In","/login"],["Create account","/signup?intent=create-cv"]] },
];
export function SiteFooter(){return <footer className="border-t border-slate-200 bg-white"><div className="marketing-shell grid gap-10 py-12 md:grid-cols-[1.4fr_2fr]"><div><BrandWordmark className="text-xl"/><p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">A practical workspace for stronger CVs, focused applications and a more organised UK job search.</p></div><div className="grid grid-cols-2 gap-8 sm:grid-cols-3">{groups.map((group,index)=><div key={group.title} className={index===1?"hidden sm:block":""}><h2 className="text-sm font-semibold text-slate-950">{group.title}</h2><ul className="mt-3 space-y-2.5">{group.links.map(([label,href])=><li key={href}><Link className="text-sm text-slate-600 hover:text-purple-700" href={href}>{label}</Link></li>)}</ul></div>)}</div></div><div className="border-t border-slate-200"><div className="marketing-shell py-5 text-sm text-slate-600">© {new Date().getFullYear()} AI Career Guide. All rights reserved.</div></div></footer>}
