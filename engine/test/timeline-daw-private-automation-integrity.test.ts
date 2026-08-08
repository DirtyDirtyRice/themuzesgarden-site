import { describe, expect, it } from "vitest";
import { isTimelineDawPrivateFreezeStale, timelineDawPrivateFreezeRecipeChecksum } from "../../lib/timeline/TimelineDawPrivateFreezePolicy";
import { parseTimelineDawPrivateAutomationEnvelope } from "../../lib/timeline/TimelineDawPrivateAutomationPolicy";

describe("private automation freeze integrity",()=>{
 const envelope=parseTimelineDawPrivateAutomationEnvelope({sourceKind:"lane",sourceId:"lane-1",parameter:"gain",bypassed:false,points:[{id:"point-1",samplePosition:0,value:1,interpolation:"linear"},{id:"point-2",samplePosition:48000,value:.5,interpolation:"hold"}]});
 const recipe={sourceKind:"lane" as const,sourceId:"lane-1",laneIds:["lane-1"],routing:{gain:1},inserts:[],sends:[],automation:[envelope]};
 it("keeps a freeze current for an identical canonical automation snapshot",()=>{const checksum=timelineDawPrivateFreezeRecipeChecksum(recipe);expect(isTimelineDawPrivateFreezeStale(checksum,{...recipe,automation:[{...envelope,points:[...envelope.points]}]})).toBe(false);});
 it("marks a freeze stale after point movement, value edits, or bypass",()=>{const checksum=timelineDawPrivateFreezeRecipeChecksum(recipe);expect(isTimelineDawPrivateFreezeStale(checksum,{...recipe,automation:[{...envelope,points:envelope.points.map((point,index)=>index?{...point,value:.25}:point)}]})).toBe(true);expect(isTimelineDawPrivateFreezeStale(checksum,{...recipe,automation:[{...envelope,bypassed:true}]})).toBe(true);});
});
