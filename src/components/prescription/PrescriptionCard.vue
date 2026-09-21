<script setup lang="ts">
import { computed } from 'vue'
import { useFamilyStore } from '../../stores/useFamilyStore'
import type { PrescriptionWithStatus } from '../../types'
import { daysBetween, formatDate } from '../../utils/date'

const props = defineProps<{ prescription: PrescriptionWithStatus }>()
const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'open-record', recordId: string): void
}>()

const store = useFamilyStore()

const memberName = computed(
  () => store.getMember(props.prescription.memberId)?.name ?? '—',
)

const cycleText = computed(() => {
  const p = props.prescription
  const start = p.startDate ? formatDate(p.startDate) : '不限'
  const end = p.endDate ? formatDate(p.endDate) : '长期'
  if (p.endDate && p.startDate) {
    return `${start} 至 ${end}（共 ${daysBetween(p.startDate, p.endDate) + 1} 天）`
  }
  return `${start} 至 ${end}`
})
</script>

<template>
  <div class="rx-card card" :class="{ 'rx-invalid': prescription.status !== 'active' }">
    <div class="rx-head">
      <div class="rx-title">
        <span class="rx-icon">📄</span>
        <div>
          <div class="rx-name">{{ prescription.medicineName }}</div>
          <div class="rx-sub">
            {{ memberName }}<template v-if="prescription.hospital"> · {{ prescription.hospital }}</template>
          </div>
        </div>
      </div>
      <span class="rx-tag" :class="`tag-${prescription.status}`">{{ prescription.statusText }}</span>
    </div>

    <div v-if="prescription.dosage" class="rx-row">
      <label>用法用量</label>{{ prescription.dosage }}
    </div>
    <div class="rx-row"><label>服用周期</label>{{ cycleText }}</div>

    <div class="rx-links">
      <template v-if="prescription.medicine">
        <span class="link-chip ok">💊 库存：{{ prescription.medicine.name }}</span>
      </template>
      <template v-else-if="prescription.medicineId">
        <span class="link-chip broken">⚠️ 库存药品已被删除</span>
      </template>
      <template v-if="prescription.record">
        <button
          type="button"
          class="link-chip link-btn ok"
          @click="emit('open-record', prescription.record!.id)"
        >
          🏥 {{ formatDate(prescription.record.date) }} 就医记录 ↗
        </button>
      </template>
      <template v-else>
        <span class="link-chip broken">⚠️ 就医记录已被删除</span>
      </template>
    </div>

    <div v-if="prescription.remark" class="rx-row remark">
      <label>备注</label>{{ prescription.remark }}
    </div>

    <div class="rx-actions">
      <button type="button" class="btn btn-sm btn-ghost" @click="emit('edit')">编辑</button>
      <button type="button" class="btn btn-sm btn-danger-ghost" @click="emit('delete')">删除</button>
    </div>
  </div>
</template>

<style scoped>
.rx-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rx-invalid {
  border-color: #f5c6cb;
  border-left: 3px solid var(--danger-color);
}
.rx-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.rx-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rx-icon {
  font-size: 22px;
}
.rx-name {
  font-weight: 700;
  font-size: 16px;
}
.rx-sub {
  font-size: 13px;
  color: var(--text-secondary);
}
.rx-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.tag-active {
  background: #eafaf1;
  color: var(--success-color);
}
.tag-medicine_missing,
.tag-record_missing,
.tag-medicine_expired {
  background: #fdecea;
  color: var(--danger-color);
}
.rx-row {
  font-size: 14px;
}
.rx-row label {
  display: inline-block;
  min-width: 64px;
  color: var(--text-secondary);
  font-size: 13px;
}
.rx-row.remark {
  color: var(--text-secondary);
  font-size: 13px;
}
.rx-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.link-chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
}
.link-chip.ok {
  background: var(--accent-bg);
  color: var(--success-color);
}
.link-chip.broken {
  background: #fdecea;
  color: var(--danger-color);
}
.link-btn {
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.link-btn:hover {
  text-decoration: underline;
}
.rx-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
</style>
