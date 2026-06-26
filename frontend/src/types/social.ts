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
  title?: string
  categoryId?: number
  categoryName?: string
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
  title: string
  content: string
  category_id: number
}

export interface CreateCommentData {
  postId: string
  content: string
}
