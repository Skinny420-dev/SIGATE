import { clsx } from 'clsx';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, padding = 'md', hover = false, glow = false }: CardProps) {
  return (
    <div className={clsx(
      styles.card,
      styles[padding],
      hover && styles.hover,
      glow  && styles.glow,
      className
    )}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
