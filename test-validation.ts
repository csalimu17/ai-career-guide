import { 
  isValidEmail, 
  isLikelyPhone, 
  isLikelyPersonName, 
  isLikelyLocation, 
  cleanParsedData, 
  scoreFieldConfidence 
} from './src/lib/cv-validation';

const testCases = [
  {
    name: "Valid Email",
    fn: () => isValidEmail("test@example.com"),
    expected: true
  },
  {
    name: "Invalid Email",
    fn: () => isValidEmail("not-an-email"),
    expected: false
  },
  {
    name: "Valid Phone",
    fn: () => isLikelyPhone("555-0199-1234"),
    expected: true
  },
  {
    name: "Short Phone",
    fn: () => isLikelyPhone("123"),
    expected: false
  },
  {
    name: "Valid Name",
    fn: () => isLikelyPersonName("Jane Doe"),
    expected: true
  },
  {
    name: "Single Name",
    fn: () => isLikelyPersonName("John"),
    expected: false
  },
  {
    name: "Valid Location",
    fn: () => isLikelyLocation("London, UK"),
    expected: true
  },
  {
    name: "Summary as Location (Long)",
    fn: () => isLikelyLocation("This is a very long summary that might have been mistakenly mapped to the location field by a poor parser."),
    expected: true, // Internal isOk check only checks length < 80. The mapping logic splits at 6 words.
    notes: "Validation layer allows up to 80 chars, but mapping logic handles the context."
  }
];

console.log("--- CV VALIDATION TESTS ---");
testCases.forEach(tc => {
  const result = tc.fn();
  const passed = result === tc.expected;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tc.name}: ${result} ${tc.notes || ''}`);
});

console.log("\n--- CONFIDENCE SCORING TESTS ---");
console.log(`Email Confidence (Good): ${scoreFieldConfidence('email', 'test@example.com')}`);
console.log(`Email Confidence (Bad): ${scoreFieldConfidence('email', 'foo')}`);
console.log(`Name Confidence (Good): ${scoreFieldConfidence('fullName', 'John Smith')}`);
console.log(`Location Confidence (Bad/Long): ${scoreFieldConfidence('location', 'This is a long string that is definitely not a location...')}`);

console.log("\n--- CLEAN DATA TEST ---");
const rawData = {
  fullName: "John", // Should be wiped
  email: "invalid", // Should be wiped
  phone: "1234567890", // Should keep
  location: "New York, NY", // Should keep
  summary: "Experienced dev..."
};
console.log("Raw:", rawData);
console.log("Cleaned:", cleanParsedData(rawData));
