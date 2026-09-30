export const MATERIAL_CATEGORIES = ['POLRI', 'TNI', 'Kedinasan', 'BUMN', 'PCPN-BI'] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_TYPE_LABELS = {
  PDF: 'PDF',
  VIDEO: 'Video',
  LINK: 'Tautan',
} as const;
