import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
}

export function PageHeader({ title, subtitle = "Your Rules. Your Control", description }: PageHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-12">
      <div className="flex items-center justify-center mb-6">
        <img 
          src="/logo.png"
          alt="Control Core"
          className="h-16 w-auto max-w-[200px]"
        />
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-lg text-muted-foreground">{subtitle}</p>
      {description && (
        <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
      )}
    </div>
  );
}
