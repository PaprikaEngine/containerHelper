import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { OSSelection } from '../OSSelection'
import type { OsConfig } from '../../types/config'

const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  )
}

describe('OSSelection', () => {
  const mockOnOSSelect = vi.fn()
  const defaultOS: OsConfig = { type: '', version: '' }

  beforeEach(() => {
    mockOnOSSelect.mockClear()
  })

  it('renders OS selection title and description', () => {
    renderWithMantine(
      <OSSelection selectedOS={defaultOS} onOSSelect={mockOnOSSelect} />
    )

    expect(screen.getByText('Choose Base OS')).toBeInTheDocument()
    expect(screen.getByText('Select the operating system for your development environment.')).toBeInTheDocument()
  })

  it('renders all OS options', () => {
    renderWithMantine(
      <OSSelection selectedOS={defaultOS} onOSSelect={mockOnOSSelect} />
    )

    expect(screen.getByText('Ubuntu')).toBeInTheDocument()
    expect(screen.getByText('Debian')).toBeInTheDocument()
    expect(screen.getByText('Alpine')).toBeInTheDocument()
  })

  it('calls onOSSelect when Ubuntu is clicked', () => {
    renderWithMantine(
      <OSSelection selectedOS={defaultOS} onOSSelect={mockOnOSSelect} />
    )

    const ubuntuCard = screen.getByText('Ubuntu').closest('div')
    fireEvent.click(ubuntuCard!)

    expect(mockOnOSSelect).toHaveBeenCalledWith({
      type: 'ubuntu',
      version: '20.04'
    })
  })

  it('shows version selection when OS is selected', () => {
    const selectedOS: OsConfig = { type: 'ubuntu', version: '20.04' }

    renderWithMantine(
      <OSSelection selectedOS={selectedOS} onOSSelect={mockOnOSSelect} />
    )

    expect(screen.getByText('Select Version')).toBeInTheDocument()
    expect(screen.getByText('20.04')).toBeInTheDocument()
    expect(screen.getByText('22.04')).toBeInTheDocument()
    expect(screen.getByText('24.04')).toBeInTheDocument()
  })

  it('calls onOSSelect when version is changed', () => {
    const selectedOS: OsConfig = { type: 'ubuntu', version: '20.04' }

    renderWithMantine(
      <OSSelection selectedOS={selectedOS} onOSSelect={mockOnOSSelect} />
    )

    const version2204Button = screen.getByText('22.04')
    fireEvent.click(version2204Button)

    expect(mockOnOSSelect).toHaveBeenCalledWith({
      type: 'ubuntu',
      version: '22.04'
    })
  })

  it('highlights selected OS with different styling', () => {
    const selectedOS: OsConfig = { type: 'debian', version: 'bullseye' }

    renderWithMantine(
      <OSSelection selectedOS={selectedOS} onOSSelect={mockOnOSSelect} />
    )

    const debianCard = screen.getByText('Debian').closest('div')
    expect(debianCard).toHaveStyle({ backgroundColor: 'var(--mantine-color-blue-0)' })
  })

  it('highlights selected version button', () => {
    const selectedOS: OsConfig = { type: 'alpine', version: 'latest' }

    renderWithMantine(
      <OSSelection selectedOS={selectedOS} onOSSelect={mockOnOSSelect} />
    )

    const selectedVersionButton = screen.getByText('latest')
    expect(selectedVersionButton).toHaveAttribute('data-variant', 'filled')
  })
})