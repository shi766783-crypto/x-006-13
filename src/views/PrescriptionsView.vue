<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PrescriptionCard from '../components/prescription/PrescriptionCard.vue'
import PrescriptionForm from '../components/prescription/PrescriptionForm.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import { useFamilyStore } from '../stores/useFamilyStore'
import type { MedicalRecord, Prescription, PrescriptionWithStatus } from '../types'

const props = defineProps<{ prefillRecord?: MedicalRecord | null }>()
const emit = defineEmits<{
  (e: 'open-record', recordId: string): void
  (e: 'consume-prefill'): void
}>()

const store = useFamilyStore()

const showForm = ref(false)
const editing = ref<Prescription | null>(null)
const prefillRecord = ref<MedicalRecord | null>(null)
const filterMember = ref('all')
const filterStatus = ref<'all' | 'active' | 'invalid' | 'ended'>('all')

watch(
  () => props.prefillRecord,
  (record) => {
    if (record) {
      prefillRecord.value = record
      editing.value = null
      filterMember.value = record.memberId
      showForm.value = true
      emit('consume-prefill')
    }
  },
)

const list = computed(() => store.prescriptionsWithStatus)

const filtered = computed(() => {
  let result = list.value
  if (filterMember.value !== 'all') {
    result = result.filter((p) => p.memberId === filterMember.value)
  }
  if (filterStatus.value === 'active') {
    result = result.filter((p) => p.status === 'active' && p.inCycle)
  } else if (filterStatus.value === 'ended') {
    result = result.filter((p) => p.status === 'active' && !p.inCycle)
  } else if (filterStatus.value === 'invalid') {
    result = result.filter((p) => p.status !== 'active')
  }
  return result
})

const invalidCount = computed(() => store.invalidPrescriptions.length)
const endedCount = computed(
  () => list.value.filter((p) => p.status === 'active' && !p.inCycle).length,
)
const activeCount = computed(
  () => list.value.filter((p) => p.status === 'active' && p.inCycle).length,
)

function openAdd() {
  editing.value = null
  prefillRecord.value = null
  showForm.value = true
}

function openEdit(p: PrescriptionWithStatus) {
  editing.value = p
  prefillRecord.value = null
  showForm.value = true
}

function onSave(data: Omit<Prescription, 'id' | 'createdAt'>) {
  if (editing.value) store.updatePrescription(editing.value.id, data)
  else store.addPrescription(data)
  showForm.value = false
  prefillRecord.value = null
}

function onDelete(p: PrescriptionWithStatus) {
  if (window.confirm(`确定删除「${p.medicineName}」的处方归档吗？`)) {
    store.deletePrescription(p.id)
  }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">处方归档</h1>
      <button type="button" class="btn btn-primary" @click="openAdd">＋ 归档处方</button>
    </div>

    <div v-if="invalidCount" class="banner banner-red">
      <strong>⚠️ {{ invalidCount }} 条处方关联失效</strong>
      <span>关联药品已删除/过期，或关联的就医记录已删除，请核对后更新。</span>
    </div>

    <!-- Filters -->
    <section class="filters-bar">
      <select v-model="filterMember" class="input filter-select">
        <option value="all">全部成员</option>
        <option v-for="m in store.state.members" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
      <div class="filter-chips">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'all' }"
          @click="filterStatus = 'all'"
        >
          全部 ({{ list.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'active' }"
          @click="filterStatus = 'active'"
        >
          服用中 ({{ activeCount }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'ended' }"
          @click="filterStatus = 'ended'"
        >
          周期结束 ({{ endedCount }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'invalid' }"
          @click="filterStatus = 'invalid'"
        >
          失效提示 ({{ invalidCount }})
        </button>
      </div>
    </section>

    <div v-if="filtered.length" class="rx-grid">
      <PrescriptionCard
        v-for="p in filtered"
        :key="p.id"
        :prescription="p"
        @edit="openEdit(p)"
        @delete="onDelete(p)"
        @open-record="(id) => emit('open-record', id)"
      />
    </div>
    <EmptyState v-else icon="📄" text="暂无处方归档，可从就医记录一键归档" />
  </div>

  <BaseModal
    v-if="showForm"
    :title="editing ? '编辑处方' : '归档处方'"
    @close="showForm = false"
  >
    <PrescriptionForm
      :prescription="editing"
      :record="prefillRecord"
      @save="onSave"
      @close="showForm = false"
    />
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
.banner {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.banner-red {
  background: #fdecea;
  color: #c0392b;
  border: 1px solid #f5c6cb;
}
.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.filter-select {
  width: auto;
}
.filter-chips {
  display: flex;
  flex-wrap: wrap;
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
.rx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
}
</style>
