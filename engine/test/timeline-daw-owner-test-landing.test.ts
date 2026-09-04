import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/TimelineDawOwnerMusicianTest.tsx", "utf8");

describe("owner test semantic landing", () => {
  it("covers late-loading evidence instead of showing a false start screen", () => {
    expect(source).toContain("Returning to your guided DAW step…");
    expect(source).toContain("!landingReady");
  });

  it("realigns the owner-test card while panels above it change height", () => {
    expect(source).toContain("new ResizeObserver(settle)");
    expect(source).toContain('target.scrollIntoView({behavior:"instant" as ScrollBehavior,block:"start"})');
    expect(source).toContain("setTimeout(finish,500)");
  });

  it("lands an active test on the exact action card rather than the technical checklist", () => {
    expect(source).toContain("activeStepRef");
    expect(source).toContain("data.session&&!data.evaluation.complete?activeStepRef.current:workspaceRef.current");
    expect(source).toContain("Take me to this DAW control");
  });

  it("reveals the card only after final alignment", () => {
    expect(source).toContain("requestAnimationFrame(()=>setLandingReady(true))");
  });

  it("lets the musician confirm a real return when Chrome does not expose focus changes", () => {
    expect(source).toContain("I confirm I left for this Codex chat");
    expect(source).toContain('returnVerified:current.step==="return"&&returnConfirmed');
    expect(source).not.toContain("returnVerified||returnConfirmed");
    expect(source).toContain("if(!data?.session)return");
    expect(source).toContain('sessionStorage.getItem(confirmedKey)==="yes"');
  });

  it("does not let screenshot file-picker focus events pass the return step", () => {
    expect(source).not.toContain('window.addEventListener("blur"');
    expect(source).not.toContain('window.addEventListener("focus"');
    expect(source).not.toContain('document.addEventListener("visibilitychange"');
    expect(source).toContain('current.step==="return"&&!returnConfirmed');
  });
});
