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
      hafal_count: 5, // 5 / 68 surahs
    },
    {
      id: 2,
      nama: 'Budi',
      kelas: '10-A',
      color: '#e5e5e5',
      group_id: 101,
      hafal_count: 10, // 10 / 68 surahs
    },
  ]

  it('computes dashboard stats correctly', () => {
    const stats = computeDashboardStats(mockStudents)
    expect(stats.totalStudents).toBe(2)
    expect(stats.totalHafal).toBe(15)
    expect(stats.averageHafal).toBe(8) // Math.round(15 / 2) = 8
  })

  it('computes rankings correctly', () => {
    const ranked = computeRanking(mockStudents)
    expect(ranked[0]?.nama).toBe('Budi') // Budi has 10, Ahmad has 5
    expect(ranked[1]?.nama).toBe('Ahmad')
  })

  it('computes report stats correctly', () => {
    const stats = computeReportStats(mockStudents)
    expect(stats.totalStudents).toBe(2)
    expect(stats.totalHafal).toBe(15)
    expect(stats.averageHafal).toBe(8)
    expect(stats.averagePct).toBe(11) // Budi is 15%, Ahmad is 7%. Average is (15+7)/2 = 11%
  })
})
