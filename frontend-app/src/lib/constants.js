export const CATEGORIES_META = {
  electronics: { name: 'Electronics', icon: 'bolt' },
  enclosures: { name: 'Enclosures & Metal', icon: 'box' },
  sensors: { name: 'Sensors', icon: 'target' },
  power: { name: 'Power & Battery', icon: 'bolt' },
  connectors: { name: 'Connectors & Cable', icon: 'wrench' },
  fasteners: { name: 'Fasteners & Hardware', icon: 'wrench' },
  packaging: { name: 'Packaging', icon: 'box' },
};
export const productIcon = (cat) => CATEGORIES_META[cat]?.icon || 'box';

export const REQUEST_STAGES = ['submitted', 'review', 'info', 'feasibility', 'quote', 'approved', 'production', 'delivered'];
export const REQUEST_STAGE_LABEL = {
  submitted: 'Request Submitted', review: 'Under Review', info: 'Need More Information',
  feasibility: 'Feasibility Confirmed', quote: 'Quote / Proposal', approved: 'Approved',
  production: 'In Production', delivered: 'Delivered',
};
export const REQUEST_STAGE_DESC = {
  submitted: 'We received your request and logged it into our sourcing queue.',
  review: 'Our sourcing team is matching this against our manufacturing network.',
  info: 'We need a couple more details from you before we can confirm feasibility.',
  feasibility: 'Confirmed this can be made — preparing a formal quote.',
  quote: 'A proposal is ready for your review.',
  approved: 'You approved the quote — scheduling production.',
  production: 'Your components are being manufactured.',
  delivered: 'Delivered. This request is complete.',
};

export const DEAL_STAGES = ['submitted', 'review', 'contacted', 'discussion', 'quoted', 'won'];
export const DEAL_STAGE_LABEL = {
  submitted: 'Opportunity Submitted', review: 'Under Review', contacted: 'Contacted',
  discussion: 'In Discussion', quoted: 'Quoted', won: 'Won', lost: 'Lost',
};
export const DEAL_STAGE_DESC = {
  submitted: 'We logged your opportunity.', review: 'Our team is reviewing the fit.',
  contacted: 'We reached out to the customer.', discussion: 'Actively scoping the deal.',
  quoted: 'A quote has been sent.', won: 'Commission earned.',
};
