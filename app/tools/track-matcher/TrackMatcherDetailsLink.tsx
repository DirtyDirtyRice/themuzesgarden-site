import Link from "next/link";

export default function TrackMatcherDetailsLink() {
  return (
    <Link
      href="/tools/track-matcher/details"
      className="block rounded-2xl border border-white bg-black px-5 py-4"
    >
      <div className="text-2xl font-bold text-white">
        Details / More Info
      </div>

      <p className="mt-2 text-base leading-6 text-white">
        Open the Track Matcher guide to learn how BPM syncing, key selection,
        Auto Sync, and nudge timing work before changing or matching tracks.
      </p>
    </Link>
  );
}