'use client';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {title && <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>}
      {description && <p className="text-gray-600 text-sm mb-4">{description}</p>}
      {children}
    </div>
  );
}
