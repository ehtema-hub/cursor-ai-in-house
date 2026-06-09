import type { Post, SocialUser } from '@/types/social'

export const CURRENT_USER: SocialUser = {
  id: 'user-jordan',
  name: 'Jordan Lee',
  username: 'jordanlee',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan',
}

const maya: SocialUser = {
  id: 'user-maya',
  name: 'Maya Chen',
  username: 'mayachen',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
}

const alex: SocialUser = {
  id: 'user-alex',
  name: 'Alex Rivera',
  username: 'alexrivera',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
}

const sam: SocialUser = {
  id: 'user-sam',
  name: 'Sam Ortiz',
  username: 'samortiz',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
}

const priya: SocialUser = {
  id: 'user-priya',
  name: 'Priya Nair',
  username: 'priyanair',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
}

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    author: maya,
    content:
      'Just shipped the new onboarding wireframes! Really happy with how the step-by-step flow turned out. Feedback welcome 🎨',
    imageUrl:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=450&fit=crop',
    timestamp: '2026-06-09T10:30:00',
    likes: 24,
    likedByCurrentUser: false,
    shares: 3,
    comments: [
      {
        id: 'comment-1',
        postId: 'post-1',
        author: alex,
        content: 'These look great! Love the clean visual hierarchy.',
        timestamp: '2026-06-09T11:00:00',
      },
      {
        id: 'comment-2',
        postId: 'post-1',
        author: CURRENT_USER,
        content: 'Can we schedule a review session tomorrow?',
        timestamp: '2026-06-09T11:15:00',
      },
    ],
  },
  {
    id: 'post-2',
    author: sam,
    content:
      'Auth API endpoints are live on staging. Login, logout, and token refresh all passing integration tests. Documentation update coming next.',
    timestamp: '2026-06-09T08:45:00',
    likes: 18,
    likedByCurrentUser: true,
    shares: 5,
    comments: [
      {
        id: 'comment-3',
        postId: 'post-2',
        author: priya,
        content: 'Nice work! I will start on the API docs today.',
        timestamp: '2026-06-09T09:10:00',
      },
    ],
  },
  {
    id: 'post-3',
    author: alex,
    content:
      'Quick tip for the team: use `focus-visible` instead of `focus` for keyboard-only focus rings. Makes a huge difference for mouse users.',
    timestamp: '2026-06-08T16:20:00',
    likes: 42,
    likedByCurrentUser: false,
    shares: 12,
    comments: [],
  },
  {
    id: 'post-4',
    author: priya,
    content:
      'Finished the README refresh and updated all endpoint examples. Also added a getting-started guide for new contributors.',
    timestamp: '2026-06-08T14:00:00',
    likes: 11,
    likedByCurrentUser: false,
    shares: 2,
    comments: [
      {
        id: 'comment-4',
        postId: 'post-4',
        author: sam,
        content: 'Perfect timing — this will help the onboarding sprint.',
        timestamp: '2026-06-08T14:30:00',
      },
    ],
  },
  {
    id: 'post-5',
    author: CURRENT_USER,
    content:
      'Team standup takeaway: we are on track for the June release. Mobile sidebar fix merged, Kanban board is next up.',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop',
    timestamp: '2026-06-08T09:00:00',
    likes: 31,
    likedByCurrentUser: false,
    shares: 4,
    comments: [
      {
        id: 'comment-5',
        postId: 'post-5',
        author: maya,
        content: 'Great progress everyone! 💪',
        timestamp: '2026-06-08T09:30:00',
      },
    ],
  },
  {
    id: 'post-6',
    author: maya,
    content:
      'Exploring some new color palettes for the dashboard. Leaning toward indigo + emerald accents. Thoughts?',
    timestamp: '2026-06-07T15:45:00',
    likes: 15,
    likedByCurrentUser: true,
    shares: 1,
    comments: [],
  },
  {
    id: 'post-7',
    author: sam,
    content:
      'Deployed a performance patch — task list rendering is ~40% faster on large boards. Benchmarks in the PR description.',
    timestamp: '2026-06-07T11:30:00',
    likes: 27,
    likedByCurrentUser: false,
    shares: 6,
    comments: [
      {
        id: 'comment-6',
        postId: 'post-7',
        author: alex,
        content: 'Confirmed on my end. Huge improvement!',
        timestamp: '2026-06-07T12:00:00',
      },
      {
        id: 'comment-7',
        postId: 'post-7',
        author: CURRENT_USER,
        content: 'Merged and deployed to prod. Thanks Sam!',
        timestamp: '2026-06-07T12:15:00',
      },
    ],
  },
  {
    id: 'post-8',
    author: alex,
    content:
      'Weekend hike photos incoming next week. Need to recharge before the next sprint 😊',
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=450&fit=crop',
    timestamp: '2026-06-06T18:00:00',
    likes: 56,
    likedByCurrentUser: false,
    shares: 8,
    comments: [
      {
        id: 'comment-8',
        postId: 'post-8',
        author: priya,
        content: 'Enjoy the break! You earned it.',
        timestamp: '2026-06-06T18:30:00',
      },
    ],
  },
]

export const POSTS_PER_PAGE = 3
