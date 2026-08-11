export function PageHeader({
  title,
  detail,
  actions,
}: {
  title: string;
  detail?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-tx-primary">{title}</h1>
        {detail && <p className="mt-0.5 text-xs text-tx-muted">{detail}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
