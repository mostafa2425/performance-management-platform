export type RatingBand = { rating: number; label: string; min: number; max: number };
export const DEFAULT_RATING_BANDS: RatingBand[] = [
  { rating: 1, label: "Below Expectations", min: 0, max: 64 },
  { rating: 2, label: "Partially Meets", min: 65, max: 74 },
  { rating: 3, label: "Meets Expectations", min: 75, max: 89 },
  { rating: 4, label: "Exceeds", min: 90, max: 95 },
  { rating: 5, label: "Outstanding", min: 96, max: Number.POSITIVE_INFINITY }
];
export type KpiInput = { target: number; actual: number; direction: "higher" | "lower"; weight: number };
export function calculateAchievement({target,actual,direction}:KpiInput):number|null {
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(actual) || actual < 0) return null;
  if (direction === "lower" && actual === 0) return 100;
  const raw = direction === "higher" ? actual / target * 100 : target / actual * 100;
  return Math.min(100, raw);
}
export function calculateWeightedKpi(input:KpiInput):number|null {
  const achievement=calculateAchievement(input);
  return achievement===null?null:achievement*input.weight/100;
}
export function sumWeights(weights:number[]):number { return weights.reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0); }
export function isWeightTotalValid(weights:number[], expected=100):boolean { return weights.length>0 && weights.every(x=>Number.isFinite(x)&&x>=0) && Math.abs(sumWeights(weights)-expected)<0.000001; }
export function calculatePeriodResult(kpis:KpiInput[]):number|null {
  if(!kpis.length || !isWeightTotalValid(kpis.map(x=>x.weight))) return null;
  const values=kpis.map(calculateWeightedKpi);
  return values.some(x=>x===null)?null:values.reduce<number>((sum,value)=>sum+(value??0),0);
}
export function calculateAnnualObjectives(periodResults:(number|null)[]):number|null {
  const available=periodResults.filter((x):x is number=>x!==null&&Number.isFinite(x));
  return available.length===periodResults.length&&available.length>0?available.reduce((a,b)=>a+b,0)/available.length:null;
}
export function calculateCompetencyResult(ratings:number[],weights:number[]):number|null {
  if(!ratings.length||ratings.length!==weights.length||!isWeightTotalValid(weights))return null;
  const map:Record<number,number>={1:50,2:70,3:85,4:93,5:100};
  if(ratings.some(r=>!Number.isInteger(r)||map[r]===undefined))return null;
  return ratings.reduce((sum,r,i)=>sum+map[r]*weights[i]/100,0);
}
export function calculateOverallAnnual(objectives:number|null,competencies:number|null,objectiveWeight=80,competencyWeight=20):number|null {
  if(objectives===null||competencies===null||!isWeightTotalValid([objectiveWeight,competencyWeight]))return null;
  return objectives*objectiveWeight/100+competencies*competencyWeight/100;
}
export function getRating(score:number,bands=DEFAULT_RATING_BANDS):RatingBand|null {
  if(!Number.isFinite(score))return null;
  return bands.find(b=>score>=b.min&&score<=b.max)??null;
}
export function getBellCurveCounts(population:number,limits:{rating:number;minPercent:number;maxPercent:number}[]) {
  return limits.map(limit=>({rating:limit.rating,minCount:Math.floor(population*limit.minPercent/100),maxCount:Math.ceil(population*limit.maxPercent/100)}));
}
