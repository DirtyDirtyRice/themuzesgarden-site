import { describe, expect, it } from "vitest";
import { TimelineDawPrivateFreezeRenderer } from "../../lib/timeline/TimelineDawPrivateFreezeRenderer";

describe("private automation freeze rendering",()=>{
 it("applies lane gain automation at exact timeline samples",()=>{const audio={sourceArtifactId:"source",sourceFingerprint:"sum",sampleRate:1000,channelCount:1,frameCount:3,durationSeconds:.003,channels:[new Float32Array([1,1,1])],decodedAt:"now",decodedBy:"user"};const result=new TimelineDawPrivateFreezeRenderer().render([{id:"lane",audio,timelineStartSeconds:0,sourceInSeconds:0,sourceOutSeconds:.003,gain:1,pan:-1,inserts:[],automation:[{id:"gain",sourceKind:"lane",sourceId:"lane",parameter:"gain",bypassed:false,points:[{id:"a",samplePosition:0,value:0,interpolation:"linear"},{id:"b",samplePosition:2,value:2,interpolation:"linear"}]}]}]);expect([...result.channels[0]]).toEqual([0,1,1]);expect([...audio.channels[0]]).toEqual([1,1,1]);});
});
