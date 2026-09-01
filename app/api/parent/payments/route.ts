import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Payment } from '@/models/Billing'
import { User } from '@/models/User'

export async function GET() {
  const { session, response } = await requireAuth(['parent', 'student'])
  if (response) return response
  await connectToDatabase()
  
  // Get parent's payments
  const parentPayments = await Payment.find({ account: session.userId }).sort({ createdAt: -1 }).lean()
  
  // Get parent's children
  const children = await User.find({ parent: session.userId, role: 'student' })
    .select('fullName preferredName email')
    .lean()
  
  const childIds = children.map(c => c._id)
  
  // Get payments for each child
  const childPayments = await Payment.find({ account: { $in: childIds } })
    .populate('account', 'fullName preferredName email')
    .sort({ createdAt: -1 })
    .lean()
  
  // Format parent payments with child details (for individual child payments)
  const childMap = new Map(children.map(c => [String(c._id), c]))
  
  const formattedParentPayments = parentPayments.map((p) => {
    const studentId = p.metadata?.studentId?.toString()
    const child = studentId ? childMap.get(studentId) : null
    
    return {
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
      childName: child ? (child.preferredName || child.fullName) : null,
      childId: studentId || null,
      paymentType: p.paymentType || (p.subscription ? 'subscription' : 'individual_child'),
      accountType: 'parent',
    }
  })
  
  // Format child payments with child information
  const formattedChildPayments = childPayments.map(p => {
    const child = p.account as any
    return {
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
      childName: child?.fullName || 'Unknown child',
      childPreferredName: child?.preferredName || null,
      childEmail: child?.email || null,
      paymentType: p.paymentType || (p.subscription ? 'subscription' : 'individual_child'),
      accountType: 'child',
    }
  })
  
  return ok({
    parentPayments: formattedParentPayments,
    childPayments: formattedChildPayments,
  })
}
