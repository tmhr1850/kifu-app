import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DraggableBoard } from './DraggableBoard'

describe('DraggableBoard', () => {
  const mockOnMove = jest.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  it('should render the board with initial setup', () => {
    render(<DraggableBoard />)
    
    const pieces = screen.getAllByText('歩')
    expect(pieces).toHaveLength(18)
    
    expect(screen.getByText('王')).toBeInTheDocument()
    expect(screen.getByText('玉')).toBeInTheDocument()
  })

  it('should highlight valid moves when piece is selected', () => {
    render(<DraggableBoard />)
    
    const sentePawn = screen.getAllByText('歩').find(element => {
      const parent = element.closest('.board-cell')
      return parent && Array.from(parent.classList).includes('board-cell')
    })
    
    if (sentePawn) {
      fireEvent.click(sentePawn)
      
      const cells = document.querySelectorAll('.board-cell')
      const highlightedCells = Array.from(cells).filter(cell => 
        cell.classList.contains('bg-green-300')
      )
      
      expect(highlightedCells.length).toBeGreaterThan(0)
    }
  })

  it('should move piece when clicking valid destination', async () => {
    render(<DraggableBoard onMove={mockOnMove} />)
    
    const cells = document.querySelectorAll('.board-cell')
    // Find a sente pawn (7th row)
    const pawnCell = cells[60] // row 6, col 6 in 0-indexed
    
    fireEvent.click(pawnCell)
    
    // Check that moves are highlighted
    const highlightedCells = Array.from(cells).filter(cell => 
      cell.classList.contains('bg-green-300')
    )
    expect(highlightedCells.length).toBeGreaterThan(0)
    
    // Click on valid destination
    if (highlightedCells[0]) {
      fireEvent.click(highlightedCells[0])
      await waitFor(() => {
        expect(mockOnMove).toHaveBeenCalled()
      })
    }
  })

  it('should cancel selection when ESC is pressed', () => {
    render(<DraggableBoard />)
    
    const sentePawn = screen.getAllByText('歩')[9]
    fireEvent.click(sentePawn)
    
    const cells = document.querySelectorAll('.board-cell')
    let highlightedCells = Array.from(cells).filter(cell => 
      cell.classList.contains('bg-green-300')
    )
    expect(highlightedCells.length).toBeGreaterThan(0)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    highlightedCells = Array.from(cells).filter(cell => 
      cell.classList.contains('bg-green-300')
    )
    expect(highlightedCells).toHaveLength(0)
  })

  it('should deselect piece when clicking it again', () => {
    render(<DraggableBoard />)
    
    const sentePawn = screen.getAllByText('歩')[9]
    
    fireEvent.click(sentePawn)
    
    let cells = document.querySelectorAll('.board-cell')
    let selectedCell = Array.from(cells).find(cell => 
      cell.classList.contains('bg-amber-400')
    )
    expect(selectedCell).toBeTruthy()
    
    fireEvent.click(sentePawn)
    
    cells = document.querySelectorAll('.board-cell')
    selectedCell = Array.from(cells).find(cell => 
      cell.classList.contains('bg-amber-400')
    )
    expect(selectedCell).toBeFalsy()
  })

  it('should not move piece to invalid destination', () => {
    render(<DraggableBoard onMove={mockOnMove} />)
    
    const sentePawn = screen.getAllByText('歩')[9]
    fireEvent.click(sentePawn)
    
    const cells = document.querySelectorAll('.board-cell')
    const invalidCell = cells[0]
    
    fireEvent.click(invalidCell)
    
    expect(mockOnMove).not.toHaveBeenCalled()
  })
})