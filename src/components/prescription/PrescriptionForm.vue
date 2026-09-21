<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useFamilyStore } from '../../stores/useFamilyStore'
import type { Prescription } from '../../types'
import { formatDate, todayStr } from '../../utils/date'

const props = defineProps<{ prescription?: Prescription | null }>()
const emit = defineEmits<{
  (e: 'save', data: Omit<Prescription, 'id'>): void
  (e: 'close'): void
}>()

const store = useFamilyStore()

const form = reactive({
  memberId: props.prescription?.memberId ?? store.state.members[0]?.id ?? '',
  recordId: props.prescription?.recordId ?? '',
  medicineId: props.prescription?.medicineId ?? '',
  medicineName: props.prescription?.medicineName ?? '',
  dosage: props.prescription?.dosage ?? '',
  startDate: props.prescription?.startDate ?? todayStr(),
  endDate: props.prescription?.endDate ?? '',
  hospital: props.prescription?.hospital ?? '',
})

/** Records of the selected member, newest first, for the link dropdown. */
const memberRecords = computed(() =>
  store.state.records
    .filter((r) => r.memberId === form.memberId)
    .sort((a, b) => b.date.localeCompare(a.date)),
)

function recordLabel(id: string): string {
  const r = store.state.records.find((x) => x.id === id)
  if (!r) return ''
  return `${formatDate(r.date)} · ${r.hospital || '未知医院'}${r.diagnosis ? ' · ' + r.diagnosis : ''}`
}

// Switching member invalidates the previously chosen record link.
watch(
  () => form.memberId,
  () => {
    const record = store.state.records.find((r) => r.id === form.recordId)
    if (record && record.memberId !== form.memberId) form.recordId = ''
  },
)

// Picking an inventory medicine prefills the archived name (still editable).
watch(
  () => form.medicineId,
  (id) => {
    const medicine = store.state.medicines.find((m) => m.id === id)
    if (medicine) {
      form.medicineName = medicine.name
      if (!form.dosage && medicine.usage) form.dosage = medicine.usage
    }
  },
)

// Picking a record prefills the prescribing hospital (still editable).
watch(
  () => form.recordId,
  (id) => {
    const record = store.state.records.find((r) => r.id === id)
    if (record && record.hospital) form.hospital = record.hospital
  },
)

function submit() {
  if (!form.memberId || !form.medicineName.trim()) return
  emit('save', {
    memberId: form.memberId,
    recordId: form.recordId,
    medicineId: form.medicineId,
    medicineName: form.medicineName.trim(),
    dosage: form.dosage.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    hospital: form.hospital.trim(),
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
      <label class="form-label">关联库存药品</label>
      <select v-model="form.medicineId" class="input">
        <option value="">不关联</option>
        <option v-for="m in store.state.medicines" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">药品名称 *</label>
      <input v-model="form.medicineName" class="input" placeholder="如：苯磺酸氨氯地平片" />
    </div>
    <div class="form-group">
      <label class="form-label">用法用量</label>
      <input v-model="form.dosage" class="input" placeholder="如：每日1次，每次5mg，晨起服用" />
    </div>
    <div class="form-group">
      <label class="form-label">开始服用日期</label>
      <input v-model="form.startDate" type="date" class="input" />
    </div>
    <div class="form-group">
      <label class="form-label">结束日期（留空为长期服用）</label>
      <input v-model="form.endDate" type="date" class="input" :min="form.startDate" />
    </div>
    <div class="form-group">
      <label class="form-label">开具医院</label>
      <input v-model="form.hospital" class="input" placeholder="医院名称" />
    </div>
    <div class="form-group">
      <label class="form-label">关联就医记录</label>
      <select v-model="form.recordId" class="input">
        <option value="">不关联</option>
        <option v-for="r in memberRecords" :key="r.id" :value="r.id">{{ recordLabel(r.id) }}</option>
      </select>
    </div>
  </div>
  <div class="form-actions">
    <button type="button" class="btn btn-ghost" @click="emit('close')">取消</button>
    <button type="button" class="btn btn-primary" @click="submit">保存</button>
  </div>
</template>

<style scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
</style>
