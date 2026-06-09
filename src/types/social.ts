export interface SocialUser {
  id: string
  name: string
  username: string
  avatarUrl: string
}

export interface Comment {
  id: string
  postId: string
  author: SocialUser
  content: string
  timestamp: string
}

export interface Post {
  id: string
  author: SocialUser
  content: string
  imageUrl?: string
  timestamp: string
  likes: number
  likedByCurrentUser: boolean
  comments: Comment[]
  shares: number
}

export interface CreatePostData {
  content: string
  imageUrl?: string
}

export interface CreateCommentData {
  postId: string
  content: string
}
