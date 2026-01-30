import React from 'react';

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  action,
  className,
  children,
}) => (
  <section className={`mt-10 ${className || ''}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {subtitle && <h2 className="mt-2 text-2xl font-semibold text-slate-800">{subtitle}</h2>}
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

export default ContentSection;
