import { getPublicStudentReportAction } from '@/lib/actions/public'
import ReportDetailClient from '@/components/public/ReportDetailClient'
import { notFound } from 'next/navigation'

export default async function RaportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const studentId = Number(resolvedParams.id)

  if (isNaN(studentId)) {
    return notFound()
  }

  try {
    const reportData = await getPublicStudentReportAction(studentId)
    
    // Typecast to any to prevent strict TS shape checks if they vary slightly from actions
    return (
      <ReportDetailClient
        student={reportData.student as any}
        submissions={reportData.submissions as any[]}
        memorizations={reportData.memorizations as any[]}
      />
    )
  } catch (error) {
    console.error('Error loading report:', error)
    return notFound()
  }
}
