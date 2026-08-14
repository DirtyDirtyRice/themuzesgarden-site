import { describe, expect, it } from "vitest";
import { evaluateTimelineDawOwnerTest, validateTimelineDawOwnerTestResult, type TimelineDawOwnerTestEvidence } from "../../lib/timeline/TimelineDawOwnerMusicianTestPolicy";
const empty: TimelineDawOwnerTestEvidence={audioSourceCount:0,editCount:0,mixControlCount:0,snapshotCount:0,completedExportCount:0};
describe("TimelineDawOwnerMusicianTestPolicy",()=>{
  it("reveals exactly the first unfinished step",()=>{expect(evaluateTimelineDawOwnerTest([],empty).current?.step).toBe("protect");expect(evaluateTimelineDawOwnerTest([{step:"protect",outcome:"pass"}],empty).current?.step).toBe("import")});
  it("does not accept a pass without durable DAW proof",()=>{expect(()=>validateTimelineDawOwnerTestResult({step:"import",outcome:"pass",evidence:empty})).toThrow(/required proof/);expect(validateTimelineDawOwnerTestResult({step:"import",outcome:"pass",evidence:{...empty,audioSourceCount:1}}).step).toBe("import")});
  it("retains failures while keeping that step current",()=>{const result=evaluateTimelineDawOwnerTest([{step:"protect",outcome:"pass"},{step:"import",outcome:"fail"}],empty);expect(result.completed).toBe(1);expect(result.current?.step).toBe("import")});
});
