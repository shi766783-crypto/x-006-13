export type MetricType =
  | 'blood_pressure'
  | 'blood_sugar'
  | 'heart_rate'
  | 'temperature'
  | 'weight'

export type MedicineCategory =
  | 'cold'
  | 'anti-inflammatory'
  | 'hypertension'
  | 'diabetes'
  | 'external'
  | 'other'

export type DoseStatus = 'taken' | 'skipped'

export interface HealthMetric {
  id: string
  type: MetricType
  value: string
  unit: string
  timestamp: number
}

export interface AchievementDefinition {
  id: string
  name: string
  icon: string
  description: string
}

export interface Achievement extends AchievementDefinition {
  unlockedAt: number | null
}

export interface FamilyMember {
  id: string
  name: string
  relation: string
  dob: string
  bloodType: string
  height: number
  weight: number
  allergies: string
  chronicDiseases: string
  emergencyContact: string
  avatar?: string
  metrics: HealthMetric[]
}

export interface Medicine {
  id: string
  name: string
  category: MedicineCategory
  spec: string
  quantity: number
  unit: string
  expiryDate: string
  location: string
  usage: string
  remark: string
  photo?: string
}

export interface MedicationPlan {
  id: string
  memberId: string
  medicineId: string
  dosage: string
  times: string[]
  startDate: string
  endDate: string
}

export interface MedicationLog {
  id: string
  planId: string
  memberId: string
  date: string
  time: string
  status: DoseStatus
  timestamp: number
}

export interface MedicalRecord {
  id: string
  memberId: string
  date: string
  hospital: string
  department: string
  doctor: string
  diagnosis: string
  prescription: string
  cost: number
  remark: string
  attachments: string[]
}

/** A prescription entry filed in the prescription archive. */
export interface Prescription {
  id: string
  memberId: string
  medicineName: string
  dosage: string
  startDate: string
  endDate: string
  hospital: string
  /** Linked home-inventory medicine (optional; prescribed drugs are not always in stock). */
  medicineId: string
  /** Linked medical visit record. */
  recordId: string
  remark: string
  createdAt: number
}

/** Link status of a prescription against the referenced medicine / medical record. */
export type PrescriptionLinkStatus =
  | 'active'
  | 'medicine_expired'
  | 'medicine_missing'
  | 'record_missing'

/** A prescription enriched with resolved relation data for display. */
export interface PrescriptionWithStatus extends Prescription {
  status: PrescriptionLinkStatus
  statusText: string
  /** False when the medication cycle (endDate) is over, independent of link health. */
  inCycle: boolean
  medicine?: Medicine
  record?: MedicalRecord
}

/** A single dose due today, resolved from a plan + member + medicine. */
export interface TodayDose {
  planId: string
  memberId: string
  memberName: string
  medicineName: string
  dosage: string
  time: string
  status: 'pending' | DoseStatus
}
