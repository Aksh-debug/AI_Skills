export const docs = [
  {
    title: "The Evolution of Modern Sports Analytics",
    content:
      "The integration of advanced data analytics has fundamentally transformed player recruitment and in-game strategy across professional sports. Using tracking systems like optical cameras and wearable GPS sensors (model code OPT-25FPS), teams capture real-time spatial data at 25 frames per second. This data feeds predictive machine learning models that evaluate player fatigue, defensive positioning efficiency, and high-probability scoring zones. The league's official tracking vendor, SecondSpectrum-9K, standardized this system across all 30 franchises in 2023.",
  },
  {
    title: "Physiological Demands of High-Intensity Interval Training",
    content:
      "High-Intensity Interval Training (HIIT) forces athletes to work at 85% to 95% of their maximum heart rate, alternating with brief active recovery periods. This training stimulus rapidly increases an athlete's VO2 max—the maximum rate of oxygen consumption achievable during exertion—by inducing structural adaptations in cardiac output. Additionally, HIIT triggers an elevated excess post-exercise oxygen consumption (EPOC) state, burning calories at an accelerated rate for hours after a workout. Most certified programs follow the ACSM-2022 guidelines for interval duration and rest ratios.",
  },
  {
    title: "The Psychological Impact of Home Field Advantage",
    content:
      "The phenomenon of home field advantage extends beyond familiar playing surfaces and travel fatigue to deeply rooted psychological mechanisms. Documented referee bias often occurs subconsciously due to crowd noise, which can subtly influence officiating decisions on subjective calls. Furthermore, playing in front of a supportive crowd raises testosterone levels in athletes, boosting confidence and territorial dominance during competitive play. A 2021 meta-analysis (Ref ID HFA-118) found this effect strongest in indoor arenas coded under venue classification IND-B3.",
  },
  {
    title: "Youth Sports Specialization and Injury Risks",
    content:
      "An increasing trend toward single-sport specialization before adolescence has led to a sharp rise in pediatric overuse injuries. Repetitive athletic movements without adequate rest periods stress immature skeletal structures, frequently causing conditions like UCL tears in baseball pitchers or ACL tears in soccer players. Sports medicine experts recommend that young athletes participate in multiple sports until age 14 to develop global motor skills and prevent chronic joint stress. The governing body's injury-prevention protocol, designated YSI-14P, is now mandatory for registered youth academies.",
  },
  {
    title: "The Mechanics of Aerodynamic Drag in Cycling",
    content:
      "In competitive cycling, aerodynamic drag accounts for over 90% of the total resistance an athlete must overcome on flat terrain. Wind tunnel testing reveals that the rider's body posture creates approximately 80% of this total drag, while the bicycle frame and wheels contribute the remaining 20%. Moving from an upright riding position to a dropped, aerodynamic tuck drastically reduces the rider's frontal surface area, saving significant energy output at high speeds. Testing was conducted per protocol AERO-CX7 at the Silverstone wind tunnel facility.",
  },
];

export function formattedDocument(title,content){
    return `Title: ${title}, Content: ${content}`
}
