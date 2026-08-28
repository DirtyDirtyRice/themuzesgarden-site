export function createTimelineDawMusicianInvitationHandoff(input: { label: string; code: string; origin: string }) {
  const label = input.label.trim().slice(0, 100) || "musician";
  const code = input.code.trim();
  if (code.length < 20) throw new Error("A valid one-time invitation code is required.");
  const enrollmentUrl = `${input.origin.replace(/\/$/, "")}/workspace/daw/beta`;
  const subject = "Invitation to help test The Muzes Garden";
  const message = `Hi ${label},\n\nI would like to invite you to be one of the first musicians to try The Muzes Garden. I need honest feedback about what feels clear, confusing, useful, or broken.\n\nPlan on about 45-60 minutes using Google Chrome on a desktop or laptop. Please use headphones and keep backups of your original music. Your test recording stays private in your browser and does not change my original project.\n\n1. Open the guest testing page here—no member sign-in is required:\n${enrollmentUrl}\n\n2. Enter this private guest pass:\n${code}\n\nThe pass does not expire. I can revoke it if needed. Do not share it with anyone else.\n\n3. Complete the short setup check. After I release the session, open My Beta Sessions and try these steps:\n- Play the approved song\n- Record a short take\n- Play and trim your take\n- Refresh and confirm it reopens\n- Export an edited WAV\n- Tell me what worked or where you got stuck\n\nYou do not need technical experience. I want your honest reaction as a musician.\n\nThank you,\nSteve\nThe Muzes Garden`;
  return { subject, enrollmentUrl, message };
}
