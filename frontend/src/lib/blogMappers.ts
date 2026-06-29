import type { ApiBlogComment, ApiBlogPost } from '@/lib/blogApi'
import type { Comment, Post, SocialUser } from '@/types/social'

function mapBlogAuthor(author?: ApiBlogPost['author']): SocialUser {
  if (!author) {
    return {
      id: 'unknown',
      name: 'Unknown',
      username: 'unknown',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown',
    }
  }

  return {
    id: String(author.id),
    name: author.username,
    username: author.username,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(author.username)}`,
  }
}

export function mapBlogComment(comment: ApiBlogComment): Comment {
  return {
    id: String(comment.id),
    postId: String(comment.post_id),
    author: mapBlogAuthor(comment.author),
    content: comment.content,
    timestamp: comment.created_at,
  }
}

export function mapBlogPost(post: ApiBlogPost): Post {
  return {
    id: String(post.id),
    title: post.title,
    categoryId: post.category_id,
    categoryName: post.category?.name,
    author: mapBlogAuthor(post.author),
    content: post.content,
    timestamp: post.created_at,
    likes: 0,
    likedByCurrentUser: false,
    shares: 0,
    comments: (post.comments ?? []).map(mapBlogComment),
  }
}

export function mapBlogPosts(posts: ApiBlogPost[]): Post[] {
  return posts.map(mapBlogPost)
}
