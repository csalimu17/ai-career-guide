const apiKey = "a9e8b34f86msh13f7529159dc5a5p17d106jsnecb7da8c3fbb";

async function testIndeed12() {
  console.log("Testing Indeed12...");
  try {
    const url = "https://indeed12.p.rapidapi.com/jobs/search?query=IT+Support&location=us";
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "indeed12.p.rapidapi.com"
      }
    });
    console.log("Indeed12 status:", res.status);
    const data = await res.json();
    console.log("Indeed12 response keys:", Object.keys(data));
    const results = data.results || data.data || [];
    console.log("Indeed12 results count:", results.length);
    if (results.length > 0) console.log("First job title:", results[0].job_title || results[0].title);
  } catch (err) {
    console.error("Indeed12 error:", err.message);
  }
}

async function testJobsSearch() {
  console.log("Testing JOBS SEARCH API...");
  try {
    const url = "https://jobs-search-api.p.rapidapi.com/search?query=IT+Support+in+us";
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jobs-search-api.p.rapidapi.com"
      }
    });
    console.log("JobsSearch status:", res.status);
    const data = await res.json();
    console.log("JobsSearch response keys:", Object.keys(data));
    const results = data.data || [];
    console.log("JobsSearch results count:", results.length);
    if (results.length > 0) console.log("First job title:", results[0].job_title);
  } catch (err) {
    console.error("JobsSearch error:", err.message);
  }
}

async function run() {
  await testIndeed12();
  await testJobsSearch();
}

run();
