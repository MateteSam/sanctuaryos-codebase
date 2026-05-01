export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-medium text-sky-300">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">{description}</p> : null}
    </div>
  );
}
