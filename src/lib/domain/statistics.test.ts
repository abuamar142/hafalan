import { describe, it, expect } from 'vitest'
import {
  computeDashboardStats,
  computeRanking,
  computeReportStats,
} from './statistics'
import type { SantriWithCount } from '../types'

describe('statistics domain logic', () => {
  const mockStudents: SantriWithCount[] = [
    {
      id: 1,
      nama: 'Ahmad',
      kelas: '10-A',
      color: '#e5e5e5',
      group_id: 101,
      hafal_count: 5,
      juz_selesai: 1,
    },
    {
      id: 2,
      nama: 'Budi',
      kelas: '10-A',
      color: '#e5e5e5',
      group_id: 101,
      hafal_count: 10,
      juz_selesai: 2,
    },
  ]

  it('computes dashboard stats correctly', () => {
    const stats = computeDashboardStats(mockStudents)
    expect(stats.totalStudents).toBe(2)
    expect(stats.totalJuz).toBe(3)
    expect(stats.averageJuz).toBe(2) // Math.round(3 / 2) = 2
  })

  it('computes rankings correctly', () => {
    const ranked = computeRanking(mockStudents)
    expect(ranked[0]?.nama).toBe('Budi') // Budi has 2 juz, Ahmad has 1
    expect(ranked[1]?.nama).toBe('Ahmad')
  })

  it('computes report stats correctly', () => {
    const stats = computeReportStats(mockStudents)
    expect(stats.totalStudents).toBe(2)
    expect(stats.totalJuz).toBe(3)
    expect(stats.averageJuz).toBe(2)
    expect(stats.averagePct).toBe(30) // Ahmad=20%, Budi=40%. Average = (20+40)/2 = 30%
  })
})
