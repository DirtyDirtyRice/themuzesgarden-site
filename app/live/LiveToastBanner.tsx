type ToastKind = "info" | "success" | "warn";

type ToastState = {
  visible: boolean;
  kind: ToastKind;
  title: string;
  detail?: string | null;
};

type LiveToastBannerProps = {
  toast: ToastState;
};

export default function LiveToastBanner({
  toast,
}: LiveToastBannerProps) {
  if (!toast.visible) {
    return null;
  }

  const toastStyle =
    toast.kind === "success"
      ? {
          wrap: "border border-white/15 bg-white/10",
          title: "text-white",
          detail: "text-white/80",
        }
      : toast.kind === "warn"
      ? {
          wrap: "border border-white/15 bg-white/10",
          title: "text-white",
          detail: "text-white/80",
        }
      : {
          wrap: "border border-white/15 bg-white/10",
          title: "text-white",
          detail: "text-white/80",
        };

  return (
    <div className={`rounded-2xl p-3 shadow-sm ${toastStyle.wrap}`}>
      <div className={`text-sm font-semibold ${toastStyle.title}`}>
        {toast.title}
      </div>

      {toast.detail ? (
        <div className={`mt-1 text-xs ${toastStyle.detail}`}>
          {toast.detail}
        </div>
      ) : null}
    </div>
  );
}