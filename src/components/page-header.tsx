export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 max-w-[720px]">
      {eyebrow ? (
        <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.15] text-foreground">{title}</h1>
      {description ? <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{description}</p> : null}
    </header>
  );
}
