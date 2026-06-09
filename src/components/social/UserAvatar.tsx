export interface UserAvatarProps {
  name: string
  avatarUrl: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 48,
} as const

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  return (
    <img
      src={avatarUrl}
      alt={`${name}'s avatar`}
      width={SIZE_PX[size]}
      height={SIZE_PX[size]}
      className={`shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 ${SIZE_CLASSES[size]} ${className}`}
    />
  )
}
