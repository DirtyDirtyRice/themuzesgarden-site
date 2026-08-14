import { describe, expect, it } from "vitest";
import { createTimelineDawBetaInviteCode, createTimelineDawBetaOnboardingReceipt, evaluateTimelineDawBetaRelease, hashTimelineDawBetaInviteCode } from "../../lib/timeline/TimelineDawBetaOnboardingPolicy";
const environment={secureContext:true,supportedBrowser:true,audioInput:true,audioOutput:true,localStorage:true,fileApi:true,supportedAudioTypes:true};
describe("DAW beta onboarding policy",()=>{
 it("creates non-stored invitation secrets",()=>{const code=createTimelineDawBetaInviteCode();expect(code.length).toBeGreaterThan(20);expect(hashTimelineDawBetaInviteCode(code)).toMatch(/^sha256:[a-f0-9]{64}$/)});
 it("opens the release gate only when every required control passes",()=>{expect(evaluateTimelineDawBetaRelease({enrolled:true,acknowledged:true,environment,workflowPercent:100,workflowComplete:true,exportReady:true,blockingFeedback:0,unresolvedFeedback:2,integrityBlockers:0})).toMatchObject({ready:true,warnings:["2 non-blocking report(s) remain open."]});expect(evaluateTimelineDawBetaRelease({enrolled:true,acknowledged:false,environment,workflowPercent:100,workflowComplete:true,exportReady:true,blockingFeedback:0,unresolvedFeedback:0,integrityBlockers:0}).ready).toBe(false)});
 it("creates checksum-protected onboarding receipts",()=>expect(createTimelineDawBetaOnboardingReceipt({sessionId:"s",testerId:"t"}).checksum).toMatch(/^sha256:/));
});
