/**
 * Simple status polling utility for smoke tests.
 * This file is used to verify that the application is up and running.
 */

async function checkStatus(url, maxRetries = 10, interval = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Checking status of ${url} (Attempt ${i + 1}/${maxRetries})...`);
      const response = await fetch(url);
      if (response.ok) {
        console.log(`Site is UP! Status: ${response.status}`);
        return true;
      }
      console.log(`Site returned status ${response.status}. Retrying...`);
    } catch (error) {
      console.log(`Connection failed: ${error.message}. Retrying...`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

module.exports = { checkStatus };
