interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const SettingsSection = ({
  title,
  description,
  children,
}: SectionProps) => (
  <section className="mb-12 last:mb-0">
    <h2 className="text-xl font-bold mb-3">{title}</h2>
    <p className="text-slate-600 mb-6 leading-relaxed">{description}</p>
    <div className="space-y-4 max-w-md">{children}</div>
  </section>
);
