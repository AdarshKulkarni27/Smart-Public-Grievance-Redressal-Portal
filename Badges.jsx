export const STATUS_LABELS = {
  pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress',
  resolved: 'Resolved', rejected: 'Rejected', closed: 'Closed'
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority?.charAt(0).toUpperCase() + priority?.slice(1)}</span>
}

export const CAT_LABELS = {
  water_supply: 'Water Supply', electricity: 'Electricity',
  road_maintenance: 'Road Maintenance', sanitation: 'Sanitation',
  street_lighting: 'Street Lighting', other: 'Other'
}
