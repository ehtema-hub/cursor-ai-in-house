import type { UserProfileStats } from '@/components'

export interface SampleUser {
  id: string
  avatarUrl: string
  name: string
  username?: string
  bio?: string
  stats: UserProfileStats
  isOwnProfile?: boolean
  initiallyFollowing?: boolean
}

export const sampleUsers: SampleUser[] = [
  {
    id: 'own-profile',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=You',
    name: 'Jordan Lee',
    username: 'jordanlee',
    bio: 'This is your profile. Use Edit Profile to update your photo, bio, and other details.',
    stats: { posts: 28, followers: 512, following: 198 },
    isOwnProfile: true,
  },
  {
    id: 'alex-rivera',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    name: 'Alex Rivera',
    username: 'alexrivera',
    bio: 'Designer & developer building thoughtful digital experiences. Coffee enthusiast, weekend hiker, and occasional photographer.',
    stats: { posts: 142, followers: 12800, following: 384 },
    initiallyFollowing: false,
  },
  {
    id: 'maya-chen',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
    name: 'Maya Chen',
    username: 'mayachen',
    bio: 'Product designer at a climate-tech startup. Sharing sketches, prototypes, and the occasional cat photo.',
    stats: { posts: 89, followers: 4200, following: 612 },
    initiallyFollowing: true,
  },
  {
    id: 'sam-ortiz',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
    name: 'Sam Ortiz',
    username: 'samortiz',
    bio: 'Full-stack engineer. Open-source contributor. Currently learning Rust and baking sourdough on weekends.',
    stats: { posts: 256, followers: 18500, following: 891 },
    initiallyFollowing: false,
  },
  {
    id: 'priya-nair',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
    name: 'Priya Nair',
    username: 'priyanair',
    stats: { posts: 3, followers: 47, following: 120 },
    initiallyFollowing: false,
  },
  {
    id: 'nova-studios',
    avatarUrl: 'https://api.dicebear.com/9.x/identicon/svg?seed=NovaStudios',
    name: 'Nova Studios',
    username: 'novastudios',
    bio: 'Independent animation studio. New short film dropping this fall. Collabs welcome.',
    stats: { posts: 1040, followers: 2480000, following: 142 },
    initiallyFollowing: true,
  },
]
