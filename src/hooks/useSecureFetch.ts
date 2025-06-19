import { useCallback } from 'react'
import { fetchWithCSRF } from '@/utils/security/csrf'

export function useSecureFetch() {
  const secureFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetchWithCSRF(url, options)
      
      if (!response.ok) {
        if (response.status === 403) {
          // CSRF token might be invalid, reload page to get new token
          window.location.reload()
          throw new Error('セキュリティトークンが無効です。ページを再読み込みしてください。')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response
    } catch (error) {
      console.error('Fetch error:', error)
      throw error
    }
  }, [])

  return secureFetch
}