export interface GuidePost {
  slug: string;
  title: string;
  excerpt: string;
  category:
    | "CV Writing"
    | "ATS Optimization"
    | "Job Search"
    | "Templates"
    | "Cover Letters"
    | "Interview Prep"
    | "AI Career Assistant";
  audience: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  keywords: string[];
  takeaways: string[];
  content: string;
}

export const GUIDE_POSTS: GuidePost[] = [
  {
    slug: "how-to-write-a-cv",
    title: "How to Write a CV That Is Clear, Relevant, and Easier to Shortlist",
    excerpt:
      "A practical guide to writing a CV that is easy to read, targeted to the role, and structured for both recruiters and applicant tracking systems.",
    category: "CV Writing",
    audience: "Anyone building or refreshing a professional CV",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-13",
    readingTime: "10 min read",
    keywords: ["how to write a cv", "how to make a cv", "cv format uk", "write a cv", "uk cv guide"],
    takeaways: [
      "Structure your CV around recruiter decisions, not decoration.",
      "Use outcome-led bullet points instead of responsibility lists.",
      "Tailor the top third of the CV before rewriting the whole document.",
    ],
    content: `
<p>A strong CV does two jobs at once. It has to make sense quickly to a recruiter and preserve the details that screening software looks for. Clarity beats cleverness because the reader is usually comparing several candidates under time pressure.</p>
<h2>Start with the decision your CV needs to support</h2>
<p>Before choosing a template or rewriting every role, decide what the reader should believe after scanning the first third of the page. A good CV quickly answers these questions:</p>
<ul>
  <li>What kind of role are you targeting?</li>
  <li>Does your recent experience support that direction?</li>
  <li>Can the reader see evidence of results, not just tasks?</li>
  <li>Is the document easy to scan in under a minute?</li>
</ul>
<h2>Use a structure that recruiters expect</h2>
<ol>
  <li><strong>Header:</strong> Name, phone, email, LinkedIn, location, and portfolio if relevant.</li>
  <li><strong>Professional summary:</strong> Three to five lines explaining your level, domain, strengths, and target direction.</li>
  <li><strong>Core skills:</strong> A compact list of tools, methods, and strengths that match the target role.</li>
  <li><strong>Experience:</strong> Recent roles first, with bullets focused on scope, action, and result.</li>
  <li><strong>Education and certifications:</strong> Keep this factual and easy to verify.</li>
</ol>
<h2>Write stronger bullet points</h2>
<p>Weak bullets describe activity. Strong bullets describe contribution. Use this pattern when possible: action, context, result.</p>
<blockquote>Improved customer onboarding completion by redesigning the first-run flow and reducing setup friction.</blockquote>
<p>Not every result needs a number, but every important bullet should show why the work mattered.</p>
<h2>Avoid the common CV traps</h2>
<ul>
  <li>Generic summaries that could belong to almost anyone.</li>
  <li>Long paragraphs under each role.</li>
  <li>Decorative labels that make the document harder to parse.</li>
  <li>Sending the same CV to every job without adjusting emphasis.</li>
</ul>
<h2>Tailor without starting over</h2>
<p>You rarely need a new CV for every role. Keep a strong master CV, then adjust the summary, skill order, and the most relevant bullets for each application. This is where a structured builder is useful: you can keep your history stable while changing the emphasis quickly.</p>
`,
  },
  {
    slug: "cv-builder-uk",
    title: "What to Look for in a CV Builder in the UK",
    excerpt:
      "How to evaluate a CV builder for UK job applications, including format expectations, ATS compatibility, template quality, and tailoring workflow.",
    category: "Job Search",
    audience: "UK job seekers comparing CV tools",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-13",
    readingTime: "9 min read",
    keywords: ["cv builder uk", "best cv builder uk", "uk cv builder", "free cv builder uk", "cv maker uk"],
    takeaways: [
      "A good builder should improve content, not just formatting.",
      "UK CVs need clean structure, strong summaries, and practical export quality.",
      "The best workflow connects CV building, ATS checks, cover letters, and tracking.",
    ],
    content: `
<p>When people search for a CV builder in the UK, they are usually trying to solve one of three problems: they need a faster way to create a CV, they want a cleaner format, or they need help tailoring applications.</p>
<h2>The features that matter most</h2>
<ul>
  <li><strong>Clear structure:</strong> Recruiters should understand the document quickly.</li>
  <li><strong>Template flexibility:</strong> You should switch layouts without rewriting content.</li>
  <li><strong>Tailoring support:</strong> The tool should help you adapt for specific roles.</li>
  <li><strong>Export quality:</strong> The final PDF must stay readable and professional.</li>
</ul>
<h2>Check the whole workflow</h2>
<p>A polished template is helpful, but it will not fix weak content. Strong tools support the full path: create a base CV, tailor it to a role, check alignment, write a cover letter, and track the application.</p>
<h2>Questions to ask before choosing a builder</h2>
<ol>
  <li>Can you upload an existing CV?</li>
  <li>Can you edit summaries, bullets, and skills easily?</li>
  <li>Can you tailor one master CV for several jobs?</li>
  <li>Are the templates readable after export?</li>
  <li>Does the product help after the CV is built?</li>
</ol>
<h2>What makes a CV builder worth using</h2>
<p>The best builder reduces friction between intent and application. It should make your next action obvious: improve a weak bullet, check a keyword gap, create a cover letter, save a job, or prepare for the interview.</p>
`,
  },
  {
    slug: "ats-resume-keywords",
    title: "How ATS Resume Keywords Actually Work",
    excerpt:
      "A practical explanation of ATS resume keywords, where to find them in a job description, and how to use them naturally without stuffing your resume.",
    category: "ATS Optimization",
    audience: "Candidates tailoring CVs or resumes to job descriptions",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-13",
    readingTime: "10 min read",
    keywords: ["ats resume keywords", "resume keywords", "ats keywords", "resume keyword checker", "ats resume tips"],
    takeaways: [
      "Useful keywords usually come directly from the job description.",
      "Keywords belong in context, especially skills and experience bullets.",
      "Keyword stuffing can weaken the CV for human readers.",
    ],
    content: `
<p>ATS keywords are not magic terms that guarantee an interview. They are words and phrases that help a hiring team match your application to what the role needs.</p>
<h2>Where keywords come from</h2>
<ul>
  <li>Job titles and seniority labels.</li>
  <li>Required tools, platforms, and methods.</li>
  <li>Repeated responsibilities and success measures.</li>
  <li>Qualifications, certifications, and domain terms.</li>
</ul>
<h2>How to identify the right keywords</h2>
<ol>
  <li>Highlight repeated hard skills and tools.</li>
  <li>Mark exact phrases that describe the work.</li>
  <li>Separate required items from nice-to-have items.</li>
  <li>Compare those terms to your summary, skills, and experience bullets.</li>
</ol>
<h2>Where to place keywords</h2>
<p>The strongest places are the sections where the words naturally belong: summary, skills, and experience. Experience bullets are usually the most credible because they show how you used the skill.</p>
<h2>Avoid keyword stuffing</h2>
<p>Stuffing happens when a CV repeats terms without evidence. A better approach is to connect the keyword to context and contribution. Instead of repeating "SQL" several times, show how SQL helped you analyse performance, reduce reporting time, or improve a decision.</p>
<h2>Keywords are only one signal</h2>
<p>Even when keyword match improves, recruiters still care about credibility, structure, and outcomes. Use keywords to improve alignment, not to replace substance.</p>
`,
  },
  {
    slug: "tailor-your-cv-to-a-job-description",
    title: "How to Tailor Your CV to a Job Description Without Starting Over",
    excerpt:
      "A step-by-step process for adapting your CV to a specific role by changing emphasis, keywords, and bullet points instead of rewriting the whole document.",
    category: "Job Search",
    audience: "Applicants sending targeted applications",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-13",
    readingTime: "9 min read",
    keywords: ["tailor cv to job description", "tailor your cv", "customize cv for job", "tailor resume to job description"],
    takeaways: [
      "Tailoring is about role relevance, not inventing a new history.",
      "The summary, skills, and first few bullets usually matter most.",
      "Use ATS checks as a final review before applying.",
    ],
    content: `
<p>Tailoring your CV does not mean inventing a new document every time. It means making your relevance easier to see.</p>
<h2>Why tailoring matters</h2>
<p>A generic CV forces the recruiter to do the matching work. A tailored CV reduces that effort by showing, early and clearly, why your background fits the role.</p>
<h2>A simple tailoring process</h2>
<ol>
  <li><strong>Read the role carefully:</strong> Look for repeated priorities, tools, and success measures.</li>
  <li><strong>Update your summary:</strong> Reflect the function, level, and focus of the target role.</li>
  <li><strong>Reorder your skills:</strong> Move the most relevant items higher.</li>
  <li><strong>Rewrite three to five bullets:</strong> Emphasize the experience that best matches the job.</li>
  <li><strong>Check your wording:</strong> Use terms from the role where they are accurate and natural.</li>
</ol>
<h2>What usually changes the most</h2>
<p>You rarely need to rewrite your full history. The professional summary, top skill list, and first two bullets under your most relevant roles often create the biggest improvement.</p>
<h2>Final check before sending</h2>
<ul>
  <li>Would the target role be obvious from the first third of the page?</li>
  <li>Do the most important requirements appear in the right places?</li>
  <li>Do the bullets show evidence rather than familiarity?</li>
</ul>
`,
  },
  {
    slug: "ats-cv-checker-guide",
    title: "How to Use an ATS CV Checker Without Over-Optimising",
    excerpt:
      "Learn how to interpret an ATS score, decide which gaps matter, and improve a CV without making it robotic.",
    category: "ATS Optimization",
    audience: "Candidates using ATS checkers before applying",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "8 min read",
    keywords: ["ats cv checker", "free ats cv checker", "cv checker", "ats score", "ats optimization"],
    takeaways: [
      "Treat ATS scores as diagnostic signals, not final truth.",
      "Prioritise missing must-have requirements over tiny score changes.",
      "Keep the CV readable for humans after every optimisation.",
    ],
    content: `
<p>An ATS CV checker is most useful when it helps you make better decisions. The goal is not to chase a perfect score. The goal is to understand whether your CV communicates the right evidence for the role.</p>
<h2>What an ATS score can tell you</h2>
<p>A score can highlight missing keywords, weak alignment, and sections that do not clearly support the target job. It is a signal that helps you decide where to revise.</p>
<h2>What an ATS score cannot tell you</h2>
<p>It cannot know whether a recruiter will like your story, whether your achievements are credible, or whether your examples are the strongest ones available. That judgement still matters.</p>
<h2>A practical optimisation process</h2>
<ol>
  <li>Paste the target job description.</li>
  <li>Review missing required skills first.</li>
  <li>Add accurate keywords where they naturally belong.</li>
  <li>Rewrite weak bullets to show evidence.</li>
  <li>Read the CV again as a human recruiter would.</li>
</ol>
<h2>When to stop optimising</h2>
<p>Stop when the CV is aligned, credible, and easy to read. If further changes make the document repetitive or unnatural, the score is no longer helping.</p>
`,
  },
  {
    slug: "best-cv-template-for-your-role",
    title: "How to Choose the Best CV Template for Your Role",
    excerpt:
      "A premium guide to choosing CV templates by role, seniority, industry, readability, and ATS compatibility.",
    category: "Templates",
    audience: "Job seekers comparing CV designs and layouts",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "9 min read",
    keywords: ["best cv template", "cv template uk", "professional cv template", "ats cv template", "modern cv template"],
    takeaways: [
      "Template choice should support the role and seniority.",
      "Recruiter readability matters more than visual novelty.",
      "Use creative layouts carefully when applying through ATS workflows.",
    ],
    content: `
<p>The best CV template is not always the most visually dramatic one. It is the one that makes your fit easy to understand for the role you want.</p>
<h2>Match the template to the hiring context</h2>
<ul>
  <li><strong>Corporate roles:</strong> Use clean structure, restrained colour, and strong spacing.</li>
  <li><strong>Creative roles:</strong> Add more personality, but keep the content easy to scan.</li>
  <li><strong>Technical roles:</strong> Prioritise skills, tools, projects, and measurable impact.</li>
  <li><strong>Senior roles:</strong> Give leadership scope, commercial outcomes, and strategic achievements enough room.</li>
</ul>
<h2>One-column or two-column?</h2>
<p>One-column layouts are usually safer for applicant tracking systems and dense experience. Two-column layouts can work well when the structure remains simple and the most important information is not buried in a narrow sidebar.</p>
<h2>Colour and typography</h2>
<p>Use colour to create hierarchy, not decoration. A strong name, clear headings, and consistent spacing will do more for readability than a bright palette.</p>
<h2>Template test before applying</h2>
<p>Before sending, export the CV and read it on a laptop and phone. If the document feels cramped, confusing, or hard to skim, choose a cleaner template.</p>
`,
  },
  {
    slug: "write-a-cv-summary",
    title: "How to Write a CV Summary That Does Real Work",
    excerpt:
      "A guide to writing a CV summary that positions your experience, target role, and strongest evidence in the first few lines.",
    category: "CV Writing",
    audience: "Candidates improving the top third of a CV",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "7 min read",
    keywords: ["cv summary", "professional summary cv", "cv profile examples", "personal statement cv", "cv opening statement"],
    takeaways: [
      "A summary should position you, not repeat generic traits.",
      "Strong summaries combine level, domain, strengths, and direction.",
      "Update the summary for each target role.",
    ],
    content: `
<p>Your CV summary is not a biography. It is a positioning statement. Its job is to help the reader understand what kind of candidate you are and why the rest of the CV is worth reading.</p>
<h2>What a strong summary includes</h2>
<ul>
  <li>Your role family or professional identity.</li>
  <li>Your experience level or scope.</li>
  <li>Two or three strengths that match the target job.</li>
  <li>A hint of the outcomes you can create.</li>
</ul>
<h2>What to avoid</h2>
<p>Avoid phrases like "hard-working team player" unless they are backed by specific evidence. They take up space without improving your positioning.</p>
<h2>A useful summary formula</h2>
<blockquote>Role identity + years or scope + domain strengths + evidence of impact + target direction.</blockquote>
<p>For example: "Product manager with six years of experience leading B2B SaaS discovery, roadmap planning, and cross-functional delivery. Strong track record improving activation, reducing churn, and translating customer insight into shipped product decisions."</p>
<h2>Tailor the summary first</h2>
<p>If you only have five minutes to tailor a CV, start with the summary. It frames the entire document and tells the reader which parts of your experience to notice.</p>
`,
  },
  {
    slug: "cv-skills-section-guide",
    title: "How to Build a CV Skills Section Recruiters Can Actually Use",
    excerpt:
      "Learn how to choose, group, and prioritise CV skills so they support both ATS matching and human readability.",
    category: "CV Writing",
    audience: "Candidates improving skills and keyword coverage",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "8 min read",
    keywords: ["cv skills section", "skills for cv", "resume skills", "ats skills", "cv keywords"],
    takeaways: [
      "Group skills so they are easy to scan.",
      "Prioritise role-relevant skills over long generic lists.",
      "Back important skills with evidence in experience bullets.",
    ],
    content: `
<p>A skills section is useful only if it helps the reader understand your fit faster. A long list of loosely related words can make the CV look unfocused.</p>
<h2>Start with the target role</h2>
<p>Review the job description and identify required tools, methods, and domain knowledge. Then compare those terms to your actual experience.</p>
<h2>Group skills by theme</h2>
<ul>
  <li><strong>Technical tools:</strong> Software, platforms, programming languages, systems.</li>
  <li><strong>Methods:</strong> Research, analysis, project management, delivery frameworks.</li>
  <li><strong>Domain knowledge:</strong> Industry, compliance, customer type, commercial context.</li>
  <li><strong>Leadership strengths:</strong> Stakeholder management, coaching, planning, decision-making.</li>
</ul>
<h2>Do not rely on the skills section alone</h2>
<p>If a skill is important, it should also appear in your experience. The skills section creates quick visibility; your bullets create credibility.</p>
<h2>Keep it current</h2>
<p>Remove outdated or low-value skills that distract from your target role. A focused list is more persuasive than a crowded one.</p>
`,
  },
  {
    slug: "cover-letter-for-job-application",
    title: "How to Write a Cover Letter That Supports Your CV",
    excerpt:
      "A practical guide to writing tailored cover letters that connect your CV, target role, and motivation without sounding generic.",
    category: "Cover Letters",
    audience: "Applicants writing role-specific cover letters",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "8 min read",
    keywords: ["cover letter generator", "how to write a cover letter", "cover letter for job application", "AI cover letter"],
    takeaways: [
      "A cover letter should add context, not repeat the CV.",
      "Connect your strongest evidence to the employer's problem.",
      "Use a shorter version for recruiter emails and quick applications.",
    ],
    content: `
<p>A cover letter is most useful when it explains the connection between your CV and the specific role. It should not simply restate your work history.</p>
<h2>What a good cover letter does</h2>
<ul>
  <li>Shows why this role makes sense for you.</li>
  <li>Highlights two or three relevant strengths.</li>
  <li>Connects your experience to the employer's needs.</li>
  <li>Gives the reader a reason to open the CV with interest.</li>
</ul>
<h2>A simple structure</h2>
<ol>
  <li><strong>Opening:</strong> Name the role and your strongest fit.</li>
  <li><strong>Evidence paragraph:</strong> Use one or two examples that match the job.</li>
  <li><strong>Motivation paragraph:</strong> Explain why this team, product, or mission is relevant.</li>
  <li><strong>Close:</strong> Keep it confident, brief, and easy to act on.</li>
</ol>
<h2>Make it specific</h2>
<p>Generic cover letters are easy to ignore. Mention the role's priorities and choose examples that directly support them.</p>
<h2>Use the CV as the foundation</h2>
<p>Your cover letter should amplify the best evidence in your CV. If the two documents tell different stories, the application feels weaker.</p>
`,
  },
  {
    slug: "job-application-tracker-guide",
    title: "How to Track Job Applications Without Losing Momentum",
    excerpt:
      "A guide to managing saved roles, applications, follow-ups, interviews, and offers in a simple pipeline.",
    category: "Job Search",
    audience: "Active job seekers applying to multiple roles",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "8 min read",
    keywords: ["job application tracker", "job tracker", "track job applications", "job search tracker", "application pipeline"],
    takeaways: [
      "A tracker turns scattered applications into a visible pipeline.",
      "Stages should reflect action: saved, started, applied, interviewing, offer.",
      "Follow-up dates and notes are as important as status labels.",
    ],
    content: `
<p>Job search momentum is hard to maintain when every application lives in a different tab, email thread, spreadsheet, or memory. A tracker gives your search a visible operating system.</p>
<h2>The stages worth tracking</h2>
<ul>
  <li><strong>Saved:</strong> Interesting role, not started yet.</li>
  <li><strong>Started:</strong> CV or cover letter in progress.</li>
  <li><strong>Applied:</strong> Application submitted.</li>
  <li><strong>Interviewing:</strong> Any active interview process.</li>
  <li><strong>Offer or rejected:</strong> Closed outcomes that help you learn.</li>
</ul>
<h2>What to record</h2>
<p>Track the company, role, source, deadline, application date, next follow-up, and notes about tailoring. These details help you avoid duplicated effort and missed opportunities.</p>
<h2>Review the pipeline weekly</h2>
<p>A weekly review keeps your search honest. Look for roles that need follow-up, applications that stalled, and gaps in the type of roles you are targeting.</p>
<h2>Connect tracking to preparation</h2>
<p>The best tracker is not only a record. It should help you decide what to do next: tailor the CV, generate a cover letter, practise interview answers, or follow up.</p>
`,
  },
  {
    slug: "ai-career-assistant-guide",
    title: "How to Use an AI Career Assistant Without Losing Your Own Voice",
    excerpt:
      "Use AI for CV edits, role research, cover letters, interview prep, and career planning while keeping the final application accurate and personal.",
    category: "AI Career Assistant",
    audience: "Job seekers using AI to move faster and think more clearly",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "9 min read",
    keywords: ["AI career assistant", "AI career coach", "AI CV assistant", "AI job search assistant", "AI career mentor"],
    takeaways: [
      "Use AI to clarify and improve, not invent experience.",
      "Give the assistant context: role, CV, job description, and constraints.",
      "Review every output for accuracy, tone, and evidence.",
    ],
    content: `
<p>An AI career assistant is most valuable when it helps you think and act more clearly. It should not replace your judgement or create claims you cannot support.</p>
<h2>Where AI helps most</h2>
<ul>
  <li>Turning rough bullet points into clearer achievement statements.</li>
  <li>Comparing a CV against a job description.</li>
  <li>Researching role expectations and skill gaps.</li>
  <li>Drafting cover letters and follow-up emails.</li>
  <li>Generating interview questions for practice.</li>
</ul>
<h2>Give better prompts</h2>
<p>The assistant needs context. Share the role you want, the job description, your current CV section, and the tone you want to preserve.</p>
<h2>Protect accuracy</h2>
<p>Never let AI add achievements, tools, employers, or qualifications that are not true. Strong applications are specific, but they must also be defensible.</p>
<h2>Keep your voice</h2>
<p>Use AI to sharpen structure and wording. Then edit the final version so it sounds like a polished version of you, not a generic career template.</p>
`,
  },
  {
    slug: "interview-prep-star-method",
    title: "How to Prepare Interview Answers with the STAR Method",
    excerpt:
      "A practical guide to structuring behavioural interview answers with situation, task, action, and result.",
    category: "Interview Prep",
    audience: "Candidates preparing for behavioural interviews",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "8 min read",
    keywords: ["STAR method", "interview prep", "behavioral interview questions", "mock interview practice", "interview answers"],
    takeaways: [
      "STAR helps answers stay structured under pressure.",
      "Choose examples that match the role's priorities.",
      "Results can be quantitative, qualitative, or learning-based.",
    ],
    content: `
<p>The STAR method helps you answer behavioural interview questions without rambling. It gives your example a beginning, middle, and outcome.</p>
<h2>What STAR means</h2>
<ul>
  <li><strong>Situation:</strong> What was happening?</li>
  <li><strong>Task:</strong> What were you responsible for?</li>
  <li><strong>Action:</strong> What did you do?</li>
  <li><strong>Result:</strong> What changed because of your action?</li>
</ul>
<h2>Choose the right examples</h2>
<p>Do not prepare random stories. Choose examples that match the job: leadership, problem solving, conflict, delivery, customer impact, technical judgement, or resilience.</p>
<h2>Keep the action section strong</h2>
<p>The action section should be the longest part because it shows your judgement. Explain the choices you made, not just what happened around you.</p>
<h2>Practise out loud</h2>
<p>Writing an answer is useful, but speaking it reveals where the story is unclear. Practise until you can deliver the answer naturally in two to three minutes.</p>
`,
  },
  {
    slug: "job-search-strategy-uk",
    title: "A Practical Job Search Strategy for UK Professionals",
    excerpt:
      "Build a focused job search plan with target roles, tailored CVs, application tracking, follow-ups, and interview preparation.",
    category: "Job Search",
    audience: "UK professionals who want a more organised search",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    readingTime: "9 min read",
    keywords: ["job search strategy", "UK job search", "job search plan", "find jobs uk", "career change strategy"],
    takeaways: [
      "A focused search beats high-volume generic applications.",
      "Use role clusters to decide which CV versions you need.",
      "Track every serious application and review the pipeline weekly.",
    ],
    content: `
<p>A strong job search is not just sending more applications. It is choosing the right roles, tailoring the right materials, and keeping momentum visible.</p>
<h2>Define role clusters</h2>
<p>Group target roles into two or three clusters. For example: product manager, product owner, and product operations. Each cluster may need a slightly different CV summary and skill emphasis.</p>
<h2>Build a weekly operating rhythm</h2>
<ul>
  <li>Search and save roles twice a week.</li>
  <li>Tailor CVs for the strongest matches.</li>
  <li>Write targeted cover letters only where they add value.</li>
  <li>Follow up on active applications.</li>
  <li>Prepare interview stories before the invitation arrives.</li>
</ul>
<h2>Measure quality, not only quantity</h2>
<p>Track how many applications are tailored, how many receive responses, and which role types perform best. This helps you adjust the search instead of guessing.</p>
<h2>Keep learning from the pipeline</h2>
<p>If applications are not converting, review role fit, CV clarity, keyword alignment, and evidence strength. If interviews are not converting, shift attention to interview practice and story quality.</p>
`,
  },
];

export function getGuideBySlug(slug: string) {
  return GUIDE_POSTS.find((guide) => guide.slug === slug);
}
