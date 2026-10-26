// retrieve.js — STUB so Day 23 runs standalone.
// Replace the body with a call into your real pipeline (hybrid search + Cohere rerank from Day 9-11).
// It must return chunks sorted best-first, shaped like: [{ text: "..." }, ...]
export async function retrieveChunks(query) {
  return [
    { text: "Home loan eligibility: minimum CIBIL score of 750 for salaried applicants." },
    { text: "Home loan interest rates start at 8.5% p.a. for scores above 800." },
    { text: "Processing fee is 0.5% of the loan amount, capped at Rs 10,000." },
    { text: "Prepayment charges are nil for floating-rate loans." },
    { text: "Required documents: ID proof, address proof, 3 months salary slips." },
  ];
}