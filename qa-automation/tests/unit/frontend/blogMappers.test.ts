import { mapBlogComment, mapBlogPost } from '@/lib/blogMappers'

describe('blogMappers', () => {
  it('maps blog posts to feed posts', () => {
    const post = mapBlogPost({
      id: 1,
      title: 'Hello World',
      content: 'This is a blog post body.',
      user_id: 2,
      category_id: 3,
      created_at: '2026-06-01T12:00:00',
      updated_at: '2026-06-01T12:00:00',
      author: {
        id: 2,
        email: 'alex@example.com',
        username: 'alexrivera',
        created_at: '2026-01-01T00:00:00',
      },
      category: {
        id: 3,
        name: 'Engineering',
        created_at: '2026-01-01T00:00:00',
      },
      comments: [],
    })

    expect(post.id).toBe('1')
    expect(post.title).toBe('Hello World')
    expect(post.categoryName).toBe('Engineering')
    expect(post.author.username).toBe('alexrivera')
    expect(post.timestamp).toBe('2026-06-01T12:00:00')
  })

  it('maps blog comments', () => {
    const comment = mapBlogComment({
      id: 9,
      content: 'Nice post!',
      user_id: 2,
      post_id: 1,
      created_at: '2026-06-01T13:00:00',
      author: {
        id: 2,
        email: 'alex@example.com',
        username: 'alexrivera',
        created_at: '2026-01-01T00:00:00',
      },
    })

    expect(comment.id).toBe('9')
    expect(comment.postId).toBe('1')
    expect(comment.content).toBe('Nice post!')
    expect(comment.author.name).toBe('alexrivera')
  })
})
