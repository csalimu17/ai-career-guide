const apiKey = "a9e8b34f86msh13f7529159dc5a5p17d106jsnecb7da8c3fbb";

async function testIndeed12() {
  console.log("Testing Indeed12...");
  const res = await fetch("https://indeed12.p.rapidapi.com/jobs/search?query=IT+Support&location=us", {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "indeed12.p.rapidapi.com" }
  });
  const data = await res.json();
  console.log("Indeed12 status:", res.status, "message:", data.message);
}

async function testJobsSearch() {
  console.log("Testing JOBS SEARCH API...");
  const res = await fetch("https://jobs-search-api.p.rapidapi.com/search?query=IT+Support+in+us", {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jobs-search-api.p.rapidapi.com" }
  });
  const data = await res.json();
  console.log("JobsSearch status:", res.status, "message:", data.message);
}

testIndeed12().then(testJobsSearch);
