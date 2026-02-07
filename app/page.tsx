export default function Page() {
  const url =
    "https://ohjvqopxmmfrvgliolcr.supabase.co/storage/v1/object/public/audio/out%20of%20tune1%20hard%20.mp3";

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>The Muzes Garden</h1>

      <p>Test player (streams from Supabase only when you press Play):</p>

      <audio controls preload="none" src={url} />

      <div style={{ marginTop: 16 }}>
        <a href={url} download>
          Download this mp3
        </a>
      </div>
    </main>
  );
}