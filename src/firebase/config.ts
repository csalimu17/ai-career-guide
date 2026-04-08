const defaultAuthDomain = "studio-3704831244-a5638.firebaseapp.com";

function resolveAuthDomain() {
  if (typeof window === "undefined") {
    return "aicareerguide.uk";
  }

  const { hostname } = window.location;
  if (hostname === "aicareerguide.uk" || hostname === "www.aicareerguide.uk") {
    return hostname;
  }

  return defaultAuthDomain;
}

export const firebaseConfig = {
  "projectId": "studio-3704831244-a5638",
  "appId": "1:654833041005:web:ff42e78c79e5df50fc0964",
  "apiKey": "AIzaSyCK49YIHYu78Ee_rVi7WWfl7RZk09-qLVk",
  "authDomain": resolveAuthDomain(),
  "storageBucket": "studio-3704831244-a5638.firebasestorage.app",
  "measurementId": "",
  "messagingSenderId": "654833041005"
};
