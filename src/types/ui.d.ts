// UI コンポーネントの型定義
declare module '@/components/ui/table' {
  import { ForwardRefExoticComponent, RefAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

  export const Table: ForwardRefExoticComponent<HTMLAttributes<HTMLTableElement> & RefAttributes<HTMLTableElement>>;
  export const TableHeader: ForwardRefExoticComponent<HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>>;
  export const TableBody: ForwardRefExoticComponent<HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>>;
  export const TableFooter: ForwardRefExoticComponent<HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>>;
  export const TableRow: ForwardRefExoticComponent<HTMLAttributes<HTMLTableRowElement> & RefAttributes<HTMLTableRowElement>>;
  export const TableHead: ForwardRefExoticComponent<ThHTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>>;
  export const TableCell: ForwardRefExoticComponent<TdHTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>>;
  export const TableCaption: ForwardRefExoticComponent<HTMLAttributes<HTMLTableCaptionElement> & RefAttributes<HTMLTableCaptionElement>>;
}

declare module '@/components/ui/badge' {
  import { HTMLAttributes } from 'react';
  import { VariantProps } from 'class-variance-authority';

  const badgeVariants: (props?: Record<string, unknown>) => string;

  export interface BadgeProps
    extends HTMLAttributes<HTMLDivElement>,
      VariantProps<typeof badgeVariants> {}

  export const Badge: React.FC<BadgeProps>;
  export { badgeVariants };
}
