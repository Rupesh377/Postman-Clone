export default function AppLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="APIForge logo">
      <rect width="32" height="32" rx="8" fill="#FF6C37" />
      <path d="M8 22l4-12h2l2 6 2-6h2l4 12h-2.5l-1-3h-4l-1 3H8zm5-5h3l-1.5-4.5L13 17z" fill="white" />
      <circle cx="24" cy="10" r="3" fill="white" fillOpacity="0.9" />
    </svg>
  )
}
