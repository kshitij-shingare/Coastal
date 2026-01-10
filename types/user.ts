export interface User {
  id: string
  email: string
  name: string
  role: 'citizen' | 'admin' | 'responder'
  createdAt: string
}
