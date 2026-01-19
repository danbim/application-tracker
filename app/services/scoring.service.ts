import type { JobOpening, ScoringFormula } from "~/db/schema";

export type RankedJobOpening = {
  job: JobOpening;
  score: number;
};

const RATING_FIELDS = [
  "ratingImpact",
  "ratingCompensation",
  "ratingRole",
  "ratingTech",
  "ratingLocation",
  "ratingIndustry",
  "ratingCulture",
  "ratingGrowth",
  "ratingProfileMatch",
  "ratingCompanySize",
  "ratingStress",
] as const;

const WEIGHT_KEYS = [
  "impact",
  "compensation",
  "role",
  "tech",
  "location",
  "industry",
  "culture",
  "growth",
  "profileMatch",
  "companySize",
  "stress",
] as const;

export class ScoringService {
  calculateScore(job: JobOpening, formula: ScoringFormula): number {
    let score = 0;

    for (let i = 0; i < RATING_FIELDS.length; i++) {
      const ratingField = RATING_FIELDS[i];
      const weightKey = WEIGHT_KEYS[i];
      const rating = job[ratingField];
      const weight = formula.weights[weightKey];

      if (rating !== null && rating !== undefined) {
        score += rating * weight;
      }
    }

    return score;
  }

  rankJobOpenings(
    jobs: JobOpening[],
    formula: ScoringFormula
  ): RankedJobOpening[] {
    return jobs
      .map((job) => ({
        job,
        score: this.calculateScore(job, formula),
      }))
      .sort((a, b) => b.score - a.score);
  }
}
