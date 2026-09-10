import fs from "fs";
import { runPipeLine } from "./index.js";

const testQuestions=[
  {
    "question": "What tracking system frame rate do professional sports teams use to capture player movement data?",
    "ground_truth": "Teams use tracking systems like optical cameras and wearable GPS sensors (model code OPT-25FPS) that capture real-time spatial data at 25 frames per second."
  },
  {
    "question": "What heart rate range do athletes work at during High-Intensity Interval Training?",
    "ground_truth": "HIIT forces athletes to work at 85% to 95% of their maximum heart rate, alternating with brief active recovery periods."
  },
  {
    "question": "What percentage of total resistance in cycling comes from aerodynamic drag, and how much of that is caused by the rider's body position?",
    "ground_truth": "Aerodynamic drag accounts for over 90% of total resistance on flat terrain, and the rider's body posture creates approximately 80% of that total drag."
  },
  {
    "question": "What is the reference code for the assessment tool used in concussion evaluation?",
    "ground_truth": "The SCAT6 assessment is referenced internally by many leagues as protocol CNC-6R."
  },
  {
    "question": "At what altitude range do endurance athletes train to naturally increase erythropoietin production?",
    "ground_truth": "Endurance athletes train at moderate altitude, typically between 1800 and 2500 meters, to stimulate a natural rise in erythropoietin (EPO) production."
  },
  {
    "question": "How many days of progressive heat exposure are typically required for heat acclimatization?",
    "ground_truth": "Heat acclimatization protocols typically require 10 to 14 days of progressive heat exposure, formally designated HEAT-14D in many high school athletic association mandates."
  },
]

const results=[];

for(const testCase of testQuestions){
    const {top5:retrievedChunks,answer} = await runPipeLine(testCase.question)

    results.push({
        question: testCase.question,
        answer:answer.answer,
        contexts: retrievedChunks.map((r)=>r.content),
        ground_truth:testCase.ground_truth
    })
    console.log("-----Test case done-------",testCase.question)
}

fs.writeFileSync("eval-data.json",JSON.stringify(results,null,2));
console.log(`Wrote ${results.length} eval rows to eval-data.json`);

