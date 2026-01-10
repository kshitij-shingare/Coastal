import { SocialPost } from '@/types/social'

export const dummySocialPosts: SocialPost[] = [
  {
    id: '1',
    url: 'https://twitter.com/example/status/123',
    platform: 'twitter',
    content: 'Major flooding at the coast! Stay safe everyone!',
    author: '@coastwatcher',
    timestamp: new Date().toISOString(),
    verified: true,
    credibility: 'high',
  },
  {
    id: '2',
    url: 'https://facebook.com/post/456',
    platform: 'facebook',
    content: 'Saw some unusual wave patterns today',
    author: 'Beach Resident',
    timestamp: new Date().toISOString(),
    verified: false,
    credibility: 'medium',
  },
]
