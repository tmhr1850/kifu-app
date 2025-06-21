import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProfileView } from '../ProfileView'
import type { UserProfile } from '@/types/profile'

// Next.js Imageコンポーネントをモック
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, className, sizes }: any) => (
    <img 
      src={src} 
      alt={alt}
      className={className}
      data-fill={fill}
      data-sizes={sizes}
    />
  )
}))

describe('ProfileView', () => {
  const mockProfile: UserProfile = {
    id: 'user-123',
    username: 'testuser',
    full_name: 'テスト太郎',
    bio: 'テストプロフィール\n複数行の\n自己紹介文',
    avatar_url: 'https://example.com/avatar.jpg',
    rank: '初段',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }

  it('プロフィール情報が正しく表示されること', () => {
    render(<ProfileView profile={mockProfile} />)

    expect(screen.getByRole('heading', { name: 'テスト太郎' })).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
    expect(screen.getByText('棋力:')).toBeInTheDocument()
    expect(screen.getByText('初段')).toBeInTheDocument()
    expect(screen.getByText('テストプロフィール')).toBeInTheDocument()
    expect(screen.getByText('複数行の')).toBeInTheDocument()
    expect(screen.getByText('自己紹介文')).toBeInTheDocument()
  })

  it('アバター画像が表示されること', () => {
    render(<ProfileView profile={mockProfile} />)

    const avatar = screen.getByAltText('testuser')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(avatar).toHaveAttribute('data-fill', 'true')
    expect(avatar).toHaveAttribute('data-sizes', '128px')
  })

  it('アバター画像がない場合はデフォルトアイコンが表示されること', () => {
    const profileWithoutAvatar = {
      ...mockProfile,
      avatar_url: null
    }

    render(<ProfileView profile={profileWithoutAvatar} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    
    // デフォルトアイコンの親要素を確認
    const iconContainer = screen.getByRole('heading').parentElement?.querySelector('.w-16.h-16.text-gray-400')
    expect(iconContainer).toBeInTheDocument()
  })

  it('フルネームがない場合はユーザー名のみ表示されること', () => {
    const profileWithoutFullName = {
      ...mockProfile,
      full_name: null
    }

    render(<ProfileView profile={profileWithoutFullName} />)

    expect(screen.getByRole('heading', { name: 'testuser' })).toBeInTheDocument()
    expect(screen.queryByText('@testuser')).not.toBeInTheDocument()
  })

  it('ユーザー名もフルネームもない場合はデフォルト名が表示されること', () => {
    const profileWithoutNames = {
      ...mockProfile,
      username: null,
      full_name: null
    }

    render(<ProfileView profile={profileWithoutNames} />)

    expect(screen.getByRole('heading', { name: 'ユーザー' })).toBeInTheDocument()
  })

  it('棋力がない場合は表示されないこと', () => {
    const profileWithoutRank = {
      ...mockProfile,
      rank: null
    }

    render(<ProfileView profile={profileWithoutRank} />)

    expect(screen.queryByText('棋力:')).not.toBeInTheDocument()
  })

  it('自己紹介がない場合は表示されないこと', () => {
    const profileWithoutBio = {
      ...mockProfile,
      bio: null
    }

    render(<ProfileView profile={profileWithoutBio} />)

    expect(screen.queryByText('テストプロフィール')).not.toBeInTheDocument()
  })

  it('登録日が正しくフォーマットされること', () => {
    render(<ProfileView profile={mockProfile} />)

    expect(screen.getByText('登録日: 2024年1月15日')).toBeInTheDocument()
  })

  it('複数行の自己紹介文が改行を保持して表示されること', () => {
    render(<ProfileView profile={mockProfile} />)

    const bioElement = screen.getByText(/テストプロフィール/)
    expect(bioElement).toHaveClass('whitespace-pre-wrap')
  })

  it('アイコンが正しく表示されること', () => {
    const { container } = render(<ProfileView profile={mockProfile} />)

    // 棋力アイコン
    const awardIcon = container.querySelector('.w-5.h-5.text-yellow-600')
    expect(awardIcon).toBeInTheDocument()

    // カレンダーアイコン
    const calendarIcon = container.querySelector('.w-4.h-4')
    expect(calendarIcon).toBeInTheDocument()
  })

  it('最小限のプロフィール情報でも表示されること', () => {
    const minimalProfile: UserProfile = {
      id: 'user-456',
      username: null,
      full_name: null,
      bio: null,
      avatar_url: null,
      rank: null,
      created_at: '2024-12-01T00:00:00Z',
      updated_at: '2024-12-01T00:00:00Z'
    }

    render(<ProfileView profile={minimalProfile} />)

    expect(screen.getByRole('heading', { name: 'ユーザー' })).toBeInTheDocument()
    expect(screen.getByText('登録日: 2024年12月1日')).toBeInTheDocument()
  })

  it('異なるタイムゾーンの日付も正しく表示されること', () => {
    const profileWithDifferentDate = {
      ...mockProfile,
      created_at: '2023-07-04T15:30:00-07:00' // PDT
    }

    render(<ProfileView profile={profileWithDifferentDate} />)

    // 日本のロケールで表示
    expect(screen.getByText(/登録日: 2023年7月/)).toBeInTheDocument()
  })

  it('空文字の値は表示されないこと', () => {
    const profileWithEmptyStrings = {
      ...mockProfile,
      full_name: '',
      bio: '',
      rank: ''
    }

    render(<ProfileView profile={profileWithEmptyStrings} />)

    expect(screen.getByRole('heading', { name: 'testuser' })).toBeInTheDocument()
    expect(screen.queryByText('棋力:')).not.toBeInTheDocument()
    expect(screen.queryByText('@testuser')).not.toBeInTheDocument()
  })

  it('カードコンポーネントの構造が正しいこと', () => {
    const { container } = render(<ProfileView profile={mockProfile} />)

    // CardHeaderとCardContentが存在
    expect(container.querySelector('.text-center')).toBeInTheDocument()
    expect(container.querySelector('.space-y-4')).toBeInTheDocument()
  })
})