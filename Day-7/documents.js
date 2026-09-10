// sportsData.js

/**
 * 5 Document paragraphs related to Sports for LLM Context
 */
export const sportsDocuments = [
  {
    title: "The Evolution of Modern Sports Analytics",
    content:
      "The integration of advanced data analytics has fundamentally transformed player recruitment and in-game strategy across professional sports. Using tracking systems like optical cameras and wearable GPS sensors, teams capture real-time spatial data at 25 frames per second. This data feeds predictive machine learning models that evaluate player fatigue, defensive positioning efficiency, and high-probability scoring zones.",
  },
  {
    title: "Physiological Demands of High-Intensity Interval Training",
    content:
      "High-Intensity Interval Training (HIIT) forces athletes to work at 85% to 95% of their maximum heart rate, alternating with brief active recovery periods. This training stimulus rapidly increases an athlete's VO2 max—the maximum rate of oxygen consumption achievable during exertion—by inducing structural adaptations in cardiac output. Additionally, HIIT triggers an elevated excess post-exercise oxygen consumption (EPOC) state, burning calories at an accelerated rate for hours after a workout.",
  },
  {
    title: "The Psychological Impact of Home Field Advantage",
    content:
      "The phenomenon of home field advantage extends beyond familiar playing surfaces and travel fatigue to deeply rooted psychological mechanisms. Documented referee bias often occurs subconsciously due to crowd noise, which can subtly influence officiating decisions on subjective calls. Furthermore, playing in front of a supportive crowd raises testosterone levels in athletes, boosting confidence and territorial dominance during competitive play.",
  },
  {
    title: "Youth Sports Specialization and Injury Risks",
    content:
      "An increasing trend toward single-sport specialization before adolescence has led to a sharp rise in pediatric overuse injuries. Repetitive athletic movements without adequate rest periods stress immature skeletal structures, frequently causing conditions like UCL tears in baseball pitchers or ACL tears in soccer players. Sports medicine experts recommend that young athletes participate in multiple sports until age 14 to develop global motor skills and prevent chronic joint stress.",
  },
  {
    title: "The Mechanics of Aerodynamic Drag in Cycling",
    content:
      "In competitive cycling, aerodynamic drag accounts for over 90% of the total resistance an athlete must overcome on flat terrain. Wind tunnel testing reveals that the rider's body posture creates approximately 80% of this total drag, while the bicycle frame and wheels contribute the remaining 20%. Moving from an upright riding position to a dropped, aerodynamic tuck drastically reduces the rider's frontal surface area, saving significant energy output at high speeds.",
  },
];

/**
 * 5 Evaluation queries to test the LLM's retrieval performance
 */
export const testQueries = [
  "What specific frame rate do optical cameras use to capture spatial data in modern sports analytics?",
  "In competitive cycling, what percentage of aerodynamic drag is caused by the bicycle frame and wheels compared to the rider's body posture?",
  "According to sports medicine experts, at what age should young athletes wait until before specializing in a single sport to avoid overuse injuries?",
  "How does High-Intensity Interval Training (HIIT) specifically increase an athlete's VO2 max, and what happens to calorie burning after the workout?",
  "Based on the provided documents, what specific soccer tournament matches showed the highest rate of referee bias due to crowd noise?",
];

/**
 * Helper utility to format the array of documents into a single flat string
 * that can be easily fed directly into an LLM user or system prompt.
 */
export function getFormattedContext(docs) {
  return docs
    .map(
      (doc, index) =>
        `Source Document [${index + 1}]: ${doc.title}\n${doc.content}`,
    )
    .join("\n\n");
}

export function formattedDocument(title, content) {
  return `Title:${title},Content:${content}`;
}
