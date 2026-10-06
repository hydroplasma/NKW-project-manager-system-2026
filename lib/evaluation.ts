export type ScoreSummary = {
  mean: number;
  sd: number;
  count: number;
  quality: string;
  passed: boolean;
};

export function summarizeScores(scores: number[]): ScoreSummary {
  if (!scores.length) return { mean: 0, sd: 0, count: 0, quality: "ยังไม่มีข้อมูล", passed: false };
  const mean = scores.reduce((total, score) => total + score, 0) / scores.length;
  const variance = scores.length > 1
    ? scores.reduce((total, score) => total + (score - mean) ** 2, 0) / (scores.length - 1)
    : 0;
  const quality = mean >= 4.51 ? "ดีเยี่ยม" : mean >= 3.51 ? "ดีมาก" : mean >= 2.51 ? "ดี" : mean >= 1.51 ? "ปานกลาง" : "ควรปรับปรุง";
  return { mean: Number(mean.toFixed(2)), sd: Number(Math.sqrt(variance).toFixed(2)), count: scores.length, quality, passed: mean >= 4 };
}

export function summarizeSatisfaction(scores: number[]) {
  const summary = summarizeScores(scores);
  const satisfactionLevel = summary.mean >= 4.51 ? "มากที่สุด" : summary.mean >= 3.51 ? "มาก" : summary.mean >= 2.51 ? "ปานกลาง" : summary.mean >= 1.51 ? "น้อย" : scores.length ? "น้อยที่สุด" : "ยังไม่มีข้อมูล";
  return { ...summary, satisfactionLevel };
}
