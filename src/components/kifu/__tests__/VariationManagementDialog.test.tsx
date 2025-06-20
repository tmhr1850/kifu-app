import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VariationManagementDialog from '../VariationManagementDialog'
import { VariationNode } from '@/types/kifu'

describe('VariationManagementDialog', () => {
  const mockNode: VariationNode = {
    id: 'test-node-1',
    move: {
      from: { row: 2, col: 7 },
      to: { row: 2, col: 6 },
      piece: '歩',
      player: 0
    },
    moveNumber: 5,
    children: [],
    parentId: 'parent-1',
    isMainLine: false,
    comment: '既存のコメント'
  }

  const mockHandlers = {
    onClose: jest.fn(),
    onRename: jest.fn(),
    onPromoteToMainLine: jest.fn(),
    onDelete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when closed', () => {
    render(
      <VariationManagementDialog
        isOpen={false}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    expect(screen.queryByText('変化の管理')).not.toBeInTheDocument()
  })

  it('should render when open with node', () => {
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    expect(screen.getByText('変化の管理')).toBeInTheDocument()
    expect(screen.getByText('5手目の変化')).toBeInTheDocument()
    expect(screen.getByText('コメント: 既存のコメント')).toBeInTheDocument()
  })

  it('should handle rename operation', async () => {
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    // Click rename button
    fireEvent.click(screen.getByText('変化名を編集'))
    
    // Input field should appear with existing comment
    const input = screen.getByPlaceholderText('例: 攻めの変化')
    expect(input).toHaveValue('既存のコメント')
    
    // Change the value
    fireEvent.change(input, { target: { value: '新しい変化名' } })
    fireEvent.click(screen.getByText('保存'))
    
    expect(mockHandlers.onRename).toHaveBeenCalledWith('test-node-1', '新しい変化名')
  })

  it('should handle promote to main line', () => {
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    fireEvent.click(screen.getByText('本譜に昇格'))
    
    expect(mockHandlers.onPromoteToMainLine).toHaveBeenCalledWith('test-node-1')
    expect(mockHandlers.onClose).toHaveBeenCalled()
  })

  it('should not show promote option for main line nodes', () => {
    const mainLineNode = { ...mockNode, isMainLine: true }
    
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mainLineNode}
        {...mockHandlers}
      />
    )
    
    expect(screen.queryByText('本譜に昇格')).not.toBeInTheDocument()
  })

  it('should handle delete with confirmation', () => {
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    // Click delete button
    fireEvent.click(screen.getByText('変化を削除'))
    
    // Confirmation should appear
    expect(screen.getByText('本当にこの変化を削除しますか？')).toBeInTheDocument()
    
    // Confirm deletion
    fireEvent.click(screen.getByText('削除する'))
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('test-node-1')
    expect(mockHandlers.onClose).toHaveBeenCalled()
  })

  it('should cancel delete operation', () => {
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    // Click delete button
    fireEvent.click(screen.getByText('変化を削除'))
    
    // Cancel deletion
    fireEvent.click(screen.getAllByText('キャンセル')[0])
    
    expect(mockHandlers.onDelete).not.toHaveBeenCalled()
    expect(screen.queryByText('本当にこの変化を削除しますか？')).not.toBeInTheDocument()
  })

  it('should close dialog when X button is clicked', () => {
    render(
      <VariationManagementDialog
        isOpen={true}
        onClose={mockHandlers.onClose}
        node={mockNode}
        {...mockHandlers}
      />
    )
    
    fireEvent.click(screen.getByLabelText('閉じる'))
    
    expect(mockHandlers.onClose).toHaveBeenCalled()
  })
})