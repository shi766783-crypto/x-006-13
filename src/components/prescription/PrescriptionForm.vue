<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useFamilyStore } from '../../stores/useFamilyStore'
import type { MedicalRecord, Prescription } from '../../types'
import { daysUntil, formatDate, todayStr } from '../../utils/date'

const props = defineProps<{
  prescription?: Prescription | null
  record?: MedicalRecord | null
}>()
const emit = defineEmits<{
  (e: 'save', data: Omit<Prescription, 'id' | 'createdAt'>): void
  (e: 'close'): void
}>()

const store = useFamilyStore()

const form = reactive({
  memberId:
    props.prescription?.memberId ??
    props.record?.memberId ??
    store.state.members[0]?.id ??
    '',
  medicineName: props.prescription?.medicineName ?? '',
  dosage: props.prescription?.dosage ?? '',
  startDate: props.prescription?.startDate ?? props.record?.date ?? todayStr(),
  endDate: props.prescription?.endDate ?? '',
  hospital:
    props.prescription?.hospital ?? props.record?.hospital ?? '',
  medicineId: props.prescription?.medicineId ?? '',
  recordId: props.prescription?.recordId ?? props.record?.id ?? '',
  remark: props.prescription?.remark ?? '',
})

const selectedRecord = computed(() =>
  form.recordId ? store.getRecord(form.recordId) : undefined,
)

const selectedMedicine = computed(() =>
  form.medicineId ? store.getMedicine(form.medicineId) : undefined,
)

const medicineExpiryHint = computed(() => {
  const m = selectedMedicine.value
  if (!m || !m.expiryDate) return ''
  const days = daysUntil(m.expiryDate)
  if (days < 0) return `该药品已过期 ${Math.abs(days)} 天（${formatDate(m.expiryDate)}）`
  if (days <= 30) return `该药品 ${days} 天后过期`
  return ''
})

// Records of the chosen member, newest first.
const recordOptions = computed(() =>
  store.state.records
    .filter((r) => !form.memberId || r.memberId === form.memberId)
    .sort((a, b) => b.date.localeCompare(a.date)),
)

function onRecordChange() {
  const record = selectedRecord.value
  if (!record) return
  if (!form.hospital) form.hospital = record.hospital
  if (!form.startDate || form.startDate === todayStr()) form.startDate = record.date
}

function submit() {
  if (!form.memberId || !form.medicineName.trim()) return
  emit('save', {
    memberId: form.memberId,
    medicineName: form.medicineName.trim(),
    dosage: form.dosage.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    hospital: form.hospital.trim(),
    medicineId: form.medicineId,
    recordId: form.recordId,
    remark: form.remark.trim(),
  })
}
</script>

<template>
  <div class="form-grid">
    <div class="form-group">
      <label class="form-label">家庭成员 *</label>
      <select v-model="form.memberId" class="input">
        <option v-for="m in store.state.members" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">开具医院</label>
      <input v-model="form.hospital" class="input" placeholder="如：市第一人民医院" />
    </div>
    <div class="form-group">
      <label class="form-label">药品名称 *</label>
      <input v-model="form.medicineName" class="input" placeholder="如：苯磺酸氨氯地平片" />
    </div>
    <div class="form-group">
      <label class="form-label">关联库存药品</label>
      <select v-model="form.medicineId" class="input">
        <option value="">不关联</option>
        <option v-for="m in store.state.medicines" :key="m.id" :value="m.id">
          {{ m.name }}（{{ formatDate(m.expiryDate) }}到期）
        </option>
      </select>
      <span v-if="medicineExpiryHint" class="field-hint hint-warning">{{ medicineExpiryHint }}</span>
    </div>
    <div class="form-group span-2">
      <label class="form-label">用法用量</label>
      <input v-model="form.dosage" class="input" placeholder="如：口服，一次1片，一日1次，晨起服用" />
    </div>
    <div class="form-group">
      <label class="form-label">服用周期开始</label>
      <input v-model="form.startDate" type="date" class="input" />
    </div>
    <div class="form-group">
      <label class="form-label">服用周期结束</label>
      <input v-model="form.endDate" type="date" class="input" />
      <span class="field-hint">长期医嘱可不填结束日期</span>
    </div>
    <div class="form-group span-2">
      <label class="form-label">关联就医记录</label>
      <select v-model="form.recordId" class="input" @change="onRecordChange">
        <option value="">不关联</option>
        <option v-for="r in recordOptions" :key="r.id" :value="r.id">
          {{ formatDate(r.date) }} · {{ r.hospital || '未知医院' }}<template v-if="r.diagnosis">
            ｜{{ r.diagnosis }}</template>
        </option>
      </select>
      <span v-if="!prescription && record" class="field-hint">已根据该次就医预填成员、医院与日期</span>
    </div>
    <div class="form-group span-2">
      <label class="form-label">备注</label>
      <textarea v-model="form.remark" class="input textarea" rows="2"></textarea>
    </div>
  </div>
  <div class="form-actions">
    <button type="button" class="btn btn-ghost" @click="emit('close')">取消</button>
    <button type="button" class="btn btn-primary" @click="submit">归档</button>
  </div>
</template>

<style scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.field-hint {
  font-size: 12px;
  color: var(--text-secondary);
}
.hint-warning {
  color: var(--warning-color);
}
</style>
