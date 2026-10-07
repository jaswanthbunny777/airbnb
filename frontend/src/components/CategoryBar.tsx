'use client';

import { ReactNode } from 'react';

interface Category { id: string; label: string; icon: ReactNode; }
interface Props { categories: Category[]; active: string; onChange: (id: string) => void; }

export default function CategoryBar({ categories, active, onChange }: Props) {
  return (
    <div className="category-bar">
      <div className="category-bar-inner">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-item ${active === cat.id ? 'active' : ''}`}
            onClick={() => onChange(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
