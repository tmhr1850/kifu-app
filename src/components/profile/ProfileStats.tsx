'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ProfileStatsProps {
  userId: string
}

export function ProfileStats({ userId }: ProfileStatsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>対局統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600">
            <p>ユーザーID: {userId}</p>
            <p className="mt-4">統計機能は開発中です</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}