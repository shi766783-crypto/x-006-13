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

/**
 * Archived long-term prescription / doctor's order.
 * Links (`recordId` / `medicineId`) are deliberately kept when the target is
 * deleted so the archive can flag them as invalid instead of silently breaking.
 */
export interface Prescription {
  id: string
  memberId: string
  /** Linked medical record; '' = unlinked. A dangling id means the record was deleted. */
  recordId: string
  /** Linked inventory medicine; '' = unlinked. A dangling id means the medicine was deleted. */
  medicineId: string
  /** Archived copy of the medicine name, kept readable even if the link breaks. */
  medicineName: string
  /** 用法用量，如：每日3次，每次1片 */
  dosage: string
  startDate: string
  /** 服用周期结束日；'' = 长期服用 */
  endDate: string
  /** 开具医院 */
  hospital: string
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
