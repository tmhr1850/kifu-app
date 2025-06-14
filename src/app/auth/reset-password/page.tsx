'use client'

import { useEffect, useState } from 'react'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export default function ResetPasswordPage() {
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    setHasToken(!!accessToken)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {hasToken ? <UpdatePasswordForm /> : <PasswordResetForm />}
    </div>
  )
}