'use client'

import { useDashboard } from '../layout'
import { getPct, getTotalHafal } from '@/lib/helpers'
import { computeRanking, computeDashboardStats } from '@/lib/domain/statistics'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, Badge } from '@cloudflare/kumo'
import { Users, TrendingUp, BookOpen, Trophy } from 'lucide-react'

export default function DashboardPage() {
  const { state } = useDashboard()

  const sorted = computeRanking(state.students)
  const stats = computeDashboardStats(state.students)

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-text">Dashboard</h2>
        <p className="text-sm text-text-muted">Ikhtisar hafalan dan setoran santri.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Total Santri</p>
              <h3 className="text-2xl font-bold text-text">{stats.totalStudents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Rata-rata Hafal</p>
              <h3 className="text-2xl font-bold text-text">{stats.averageHafal}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple/10 text-purple">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Total Setoran</p>
              <h3 className="text-2xl font-bold text-text">{state.submissions.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Card className="border-border/30 shadow-sm">
        <div className="p-5 border-b border-border/50 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-text">Peringkat Hafalan</h3>
        </div>
        <CardContent className="p-0">
          {/* Empty state */}
          {sorted.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">
              Belum ada data santri
            </div>
          )}

          {/* Student list table */}
          <Table layout="fixed">
            <Table.Header>
              <Table.Row>
                <Table.Head className="w-12 text-center">#</Table.Head>
                <Table.Head>Nama Santri</Table.Head>
                <Table.Head className="w-20 text-center">Progress</Table.Head>
                <Table.Head className="w-20 text-center">Hafal</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sorted.slice(0, 10).map((s, i) => {
                const pct = getPct(s)
                const hafal = getTotalHafal(s)

                return (
                  <Table.Row key={s.id}>
                    <Table.Cell className="text-center">
                      {i === 0 ? (
                        <Badge variant="success" className="!rounded-full !px-2">{i + 1}</Badge>
                      ) : i === 1 ? (
                        <Badge variant="secondary" className="!rounded-full !px-2">{i + 1}</Badge>
                      ) : i === 2 ? (
                        <Badge variant="warning" className="!rounded-full !px-2">{i + 1}</Badge>
                      ) : (
                        <span className="text-sm font-medium text-text-muted">{i + 1}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="font-semibold text-text">
                        {s.nama}
                        {s.kelas && (
                          <span className="ml-2 text-sm font-normal text-text-muted">({s.kelas})</span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="w-full h-2 bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: pct + '%' }}
                        />
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <span className="text-sm font-bold text-primary">{hafal}</span>
                      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider ml-1">Surah</span>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
