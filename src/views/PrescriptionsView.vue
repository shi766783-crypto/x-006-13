<script setup lang="ts">
import { computed, ref } from 'vue'
import PrescriptionForm from '../components/prescription/PrescriptionForm.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import { useFamilyStore } from '../stores/useFamilyStore'
import type { Medicine, Prescription } from '../types'
import { daysUntil, formatDate } from '../utils/date'

const store = useFamilyStore()

const showForm = ref(false)
const editing = ref<Prescription | null>(null)
const filterMember = ref('all')
const filterStatus = ref<'all' | 'valid' | 'invalid'>('all')

type MedicineLinkStatus = 'none' | 'ok' | 'expiring' | 'expired' | 'deleted'

interface MedicineLink {
  status: MedicineLinkStatus
  medicine?: Medicine
  days?: number
}

/** Resolve the inventory-medicine link without ever dropping the archived name. */
function medicineLink(p: Prescription): MedicineLink {
  if (!p.medicineId) return { status: 'none' }
  const medicine = store.getMedicine(p.medicineId)
  if (!medicine) return { status: 'deleted' }
  const days = daysUntil(medicine.expiryDate)
  if (days < 0) return { status: 'expired', medicine, days }
  if (days <= 30) return { status: 'expiring', medicine, days }
  return { status: 'ok', medicine, days }
}

function isInvalid(p: Prescription): boolean {
  const s = medicineLink(p).status
  return s === 'deleted' || s === 'expired'
}

const invalidCount = computed(() => store.state.prescriptions.filter(isInvalid).length)

const filtered = computed(() => {
  let list = store.state.prescriptions
  if (filterMember.value !== 'all') list = list.filter((p) => p.memberId === filterMember.value)
  if (filterStatus.value === 'valid') list = list.filter((p) => !isInvalid(p))
  if (filterStatus.value === 'invalid') list = list.filter(isInvalid)
  return [...list].sort((a, b) => b.startDate.localeCompare(a.startDate))
})

function memberName(id: string) {
  return store.getMember(id)?.name ?? '—'
}

function recordOf(p: Prescription) {
  return p.recordId ? store.state.records.find((r) => r.id === p.recordId) : undefined
}

function periodText(p: Prescription): string {
  if (!p.endDate) return `自 ${formatDate(p.startDate)} 起长期服用`
  return `${formatDate(p.startDate)} ~ ${formatDate(p.endDate)}`
}

function courseEnded(p: Prescription): boolean {
  return !!p.endDate && daysUntil(p.endDate) < 0
}

function openAdd() {
  editing.value = null
  showForm.value = true
}

function openEdit(p: Prescription) {
  editing.value = p
  showForm.value = true
}

function onSave(data: Omit<Prescription, 'id'>) {
  if (editing.value) store.updatePrescription(editing.value.id, data)
  else store.addPrescription(data)
  showForm.value = false
}

function onDelete(p: Prescription) {
  if (window.confirm(`确定删除处方「${p.medicineName}」吗？`)) {
    store.deletePrescription(p.id)
  }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">处方归档</h1>
      <button type="button" class="btn btn-primary" @click="openAdd">＋ 添加处方</button>
    </div>

    <!-- Filters -->
    <section class="card filters-card">
      <div class="filter-group">
        <label class="form-label">成员</label>
        <select v-model="filterMember" class="input">
          <option value="all">全部成员</option>
          <option v-for="m in store.state.members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="form-label">状态</label>
        <div class="status-chips">
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'all' }"
            @click="filterStatus = 'all'"
          >
            全部 ({{ store.state.prescriptions.length }})
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'valid' }"
            @click="filterStatus = 'valid'"
          >
            正常 ({{ store.state.prescriptions.length - invalidCount }})
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'invalid' }"
            @click="filterStatus = 'invalid'"
          >
            已失效 ({{ invalidCount }})
          </button>
        </div>
      </div>
    </section>

    <div v-if="filtered.length" class="rx-list">
      <div
        v-for="p in filtered"
        :key="p.id"
        class="rx-item card"
        :class="{ 'rx-invalid': isInvalid(p) }"
      >
        <div class="rx-head">
          <div class="rx-title">
            <strong>💊 {{ p.medicineName }}</strong>
            <span class="rx-member">{{ memberName(p.memberId) }}</span>
          </div>
          <div class="rx-tags">
            <span v-if="courseEnded(p)" class="tag tag-ended">疗程已结束</span>
            <template v-if="medicineLink(p).status === 'deleted'">
              <span class="tag tag-invalid">已失效：关联药品已删除</span>
            </template>
            <template v-else-if="medicineLink(p).status === 'expired'">
              <span class="tag tag-invalid">
                已失效：关联药品已过期 {{ Math.abs(medicineLink(p).days!) }} 天
              </span>
            </template>
          </div>
        </div>

        <div class="rx-meta">
          <span v-if="p.dosage">用法用量：{{ p.dosage }}</span>
          <span>服用周期：{{ periodText(p) }}</span>
          <span v-if="p.hospital">开具医院：{{ p.hospital }}</span>
        </div>

        <!-- Linked medical record -->
        <div class="rx-link">
          <template v-if="recordOf(p)">
            🔗 关联就医记录：{{ formatDate(recordOf(p)!.date) }} ·
            {{ recordOf(p)!.hospital || '未知医院'
            }}{{ recordOf(p)!.diagnosis ? ' · ' + recordOf(p)!.diagnosis : '' }}
          </template>
          <span v-else-if="p.recordId" class="link-broken">⚠️ 关联的就医记录已删除</span>
          <span v-else class="link-none">未关联就医记录</span>
        </div>

        <!-- Linked inventory medicine -->
        <div v-if="p.medicineId" class="rx-link">
          <template v-if="medicineLink(p).status === 'deleted'">
            <span class="link-broken">⚠️ 关联的库存药品已被删除，请核对后重新关联或更新归档</span>
          </template>
          <template v-else-if="medicineLink(p).status === 'expired'">
            <span class="link-broken">
              ⚠️ 关联药品「{{ medicineLink(p).medicine!.name }}」已过期，请勿继续服用
            </span>
          </template>
          <template v-else-if="medicineLink(p).status === 'expiring'">
            <span class="link-warning">
              库存药品「{{ medicineLink(p).medicine!.name }}」临近过期（剩
              {{ medicineLink(p).days }} 天）
            </span>
          </template>
          <template v-else>
            <span class="link-ok">
              库存药品「{{ medicineLink(p).medicine!.name }}」有效期至
              {{ formatDate(medicineLink(p).medicine!.expiryDate) }}
            </span>
          </template>
        </div>

        <div class="rx-actions">
          <button type="button" class="btn btn-sm btn-ghost" @click="openEdit(p)">编辑</button>
          <button type="button" class="btn btn-sm btn-danger-ghost" @click="onDelete(p)">删除</button>
        </div>
      </div>
    </div>
    <EmptyState v-else icon="📋" text="暂无处方归档" />
  </div>

  <BaseModal
    v-if="showForm"
    :title="editing ? '编辑处方' : '添加处方'"
    @close="showForm = false"
  >
    <PrescriptionForm :prescription="editing" @save="onSave" @close="showForm = false" />
  </BaseModal>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
}
.filters-card {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.status-chips {
  display: flex;
  gap: 8px;
}
.filter-chip {
  padding: 6px 14px;
  border-radius: 18px;
  border: 1px solid var(--border-color);
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
}
.filter-chip.active {
  background: var(--accent-color);
  color: #fff;
  border-color: var(--accent-color);
}
.rx-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rx-item.rx-invalid {
  border-color: #f5c6cb;
}
.rx-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.rx-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rx-member {
  color: var(--text-secondary);
  font-size: 13px;
}
.rx-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
}
.tag-invalid {
  background: #fdecea;
  color: var(--danger-color);
  font-weight: 600;
}
.tag-ended {
  background: var(--bg-color);
  color: var(--text-secondary);
}
.rx-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}
.rx-link {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}
.link-broken {
  color: var(--danger-color);
  font-weight: 600;
}
.link-warning {
  color: var(--warning-color);
}
.link-ok {
  color: var(--success-color);
}
.link-none {
  color: var(--text-secondary);
  opacity: 0.7;
}
.rx-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
