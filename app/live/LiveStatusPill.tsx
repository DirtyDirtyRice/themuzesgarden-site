type ExecStatus = "IDLE" | "ARMED" | "RUNNING" | "COMPLETED";

type LiveStatusPillProps = {
  status: ExecStatus;
};

export default function LiveStatusPill({ status }: LiveStatusPillProps) {
  const base =
    "inline-flex items-center rounded-full border border-white/15 px-2 py-1 text-xs font-semibold";

  if (status === "IDLE") {
    return <span className={`${base} bg-white/5 text-white/75`}>IDLE</span>;
  }

  if (status === "ARMED") {
    return <span className={`${base} bg-white/10 text-white`}>ARMED</span>;
  }

  if (status === "RUNNING") {
    return <span className={`${base} bg-white text-black`}>RUNNING</span>;
  }

  return <span className={`${base} bg-white/15 text-white`}>COMPLETED</span>;
}