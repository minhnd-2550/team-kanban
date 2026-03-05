interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'h-5 w-5 text-xs',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const cls = `${sizeClasses[size]} inline-flex items-center justify-center rounded-full ${className ?? ''}`

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        className={`${cls} object-cover`}
      />
    )
  }

  return (
    <span
      className={`${cls} bg-blue-500 font-semibold text-white select-none`}
      title={name}
      aria-label={name}
    >
      {initials(name)}
    </span>
  )
}
