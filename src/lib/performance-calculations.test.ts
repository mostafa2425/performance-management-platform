import { describe, expect, it } from "vitest";
import { calculateAchievement, calculateAnnualObjectives, calculateCompetencyResult, calculateOverallAnnual, calculatePeriodResult, getBellCurveCounts, getRating, isWeightTotalValid } from "./performance-calculations";

describe("performance calculations",()=>{
  it("calculates higher-is-better and caps achievement at 100%",()=>{
    expect(calculateAchievement({target:100,actual:90,direction:"higher",weight:40})).toBe(90);
    expect(calculateAchievement({target:100,actual:120,direction:"higher",weight:40})).toBe(100);
  });
  it("calculates lower-is-better and handles zero actual as 100%",()=>{
    expect(calculateAchievement({target:8,actual:4,direction:"lower",weight:100})).toBe(100);
    expect(calculateAchievement({target:8,actual:0,direction:"lower",weight:100})).toBe(100);
  });
  it("rejects invalid target and invalid weights",()=>{
    expect(calculateAchievement({target:0,actual:2,direction:"higher",weight:100})).toBeNull();
    expect(isWeightTotalValid([40,40])).toBe(false);
    expect(isWeightTotalValid([40,60])).toBe(true);
  });
  it("calculates weighted period result only when KPI weights total 100",()=>{
    expect(calculatePeriodResult([{target:100,actual:80,direction:"higher",weight:50},{target:10,actual:5,direction:"lower",weight:50}])).toBe(90);
    expect(calculatePeriodResult([{target:100,actual:80,direction:"higher",weight:40}])).toBeNull();
  });
  it("averages all periods equally and does not silently skip missing periods",()=>{
    expect(calculateAnnualObjectives([80,90,100])).toBe(90);
    expect(calculateAnnualObjectives([80,null,100])).toBeNull();
  });
  it("maps competency ratings and applies component weights",()=>{
    expect(calculateCompetencyResult([1,3,5],[25,25,50])).toBe(83.75);
    expect(calculateCompetencyResult([1,3],[30,30])).toBeNull();
    expect(calculateOverallAnnual(90,80,80,20)).toBe(88);
  });
  it("maps rating bands",()=>{
    expect(getRating(64)?.rating).toBe(1);
    expect(getRating(75)?.rating).toBe(3);
    expect(getRating(96)?.rating).toBe(5);
  });
  it("uses floor and ceil for Bell Curve allowed counts",()=>{
    expect(getBellCurveCounts(7,[{rating:5,minPercent:10,maxPercent:20}])).toEqual([{rating:5,minCount:0,maxCount:2}]);
  });
});
