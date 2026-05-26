import { render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import AnnouncementPanel from '@/app/components/AnnouncementPanel'
import React from 'react'

// Mock the Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  }),
}))

test('it displays the announcement title', () => {
  const fakeAnnouncements = [
    {
      id: '1',
      title: 'Welcome to CodeWorld',
      content: 'This is a test announcement',
      type: 'info' as const,
      created_at: new Date().toISOString(),
    }
  ]

  // Render the component
  const { getByText } = render(<AnnouncementPanel initialAnnouncements={fakeAnnouncements} />)

  // Check if the title is on the screen
  const title = getByText(/Welcome/i)
  expect(title).toBeInTheDocument()
})
