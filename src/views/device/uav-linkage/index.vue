<template>
  <div class="uav-linkage-page">
    <!-- 预警事件无人机联动上下文条 -->
    <div
      v-if="linkContext?.eventId"
      class="context-bar annot-device-uav-linkage-context"
    >
      <div class="context-info">
        <strong>联动事件 #{{ linkContext.eventId }}</strong>
        <span
          >{{ linkContext.targetName || "-" }} /
          {{ linkContext.targetMmsi || "-" }}</span
        >
        <span>{{ linkContext.ruleName || "触发规则未提供" }}</span>
        <ElTag
          :type="alertLevelTag[linkContext.alertLevel || ''] || 'info'"
          size="small"
          disable-transitions
        >
          {{ alertLevelLabel[linkContext.alertLevel || ""] || "未知级别" }}
        </ElTag>
        <ElTag
          :type="statusTag[linkContext.status || ''] || 'info'"
          size="small"
          disable-transitions
        >
          {{ statusLabel[linkContext.status || ""] || "未知状态" }}
        </ElTag>
        <span class="context-coord">告警坐标 {{ targetDisplay }}</span>
        <span class="context-time">{{ linkContext.triggerTime || "-" }}</span>
        <ElTag v-if="fromOptics" type="primary" size="small"
          >链路：光电 → 无人机</ElTag
        >
      </div>
      <div class="context-actions">
        <ElButton
          v-if="fromOptics"
          size="small"
          type="primary"
          :icon="Back"
          @click="backToOptics"
          >返回光电联动</ElButton
        >
        <ElButton size="small" :icon="Back" @click="backToEvent"
          >返回事件</ElButton
        >
      </div>
    </div>

    <div class="main-row">
      <ElCard
        shadow="never"
        class="list-panel annot-device-uav-linkage-list-card"
      >
        <LinkageUavList
          :uavs="uavs"
          :selected-id="selectedUav?.id || null"
          :target="target"
          :nearest-id="nearestUavId"
          :show-distance="!!linkContext?.eventId"
          @select="selectUav"
        />
      </ElCard>

      <div class="right-col">
        <ElCard
          shadow="never"
          class="live-panel annot-device-uav-linkage-video-card"
        >
          <LinkageLivePanel
            ref="livePanelRef"
            :uav="selectedUav"
            :target="target"
            :task="activeTask"
            :arrived="arrived"
            :recording="recording"
            @capture="handleCapture"
          />
        </ElCard>

        <ElCard
          shadow="never"
          class="control-area annot-device-uav-linkage-control-card"
        >
          <LinkageControlBar
            :uav="selectedUav"
            :target="target"
            :task="activeTask"
            :arrived="arrived"
            :recording="recording"
            @capture="handleControlCapture"
            @record-toggle="toggleRecording"
            @dispatch="dispatchToTarget"
            @hover="hoverUav"
            @return="returnUav"
            @evidence="evidenceVisible = true"
          />
          <div class="map-panel annot-device-uav-linkage-map-card">
            <LinkageUavMap
              :target="target"
              :uav="selectedUav"
              :route="flightRoute"
              :progress="flightProgress"
            />
          </div>
        </ElCard>
      </div>
    </div>

    <LinkageEvidenceDrawer
      v-model:visible="evidenceVisible"
      :device="selectedUav"
      :event-context="linkContext"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Back } from "@element-plus/icons-vue";
import { useDeviceStore } from "@/store/modules/device";
import {
  getUavList,
  getUavState,
  controlUav,
  getUavTaskList,
  createUavTask,
  updateUavTask,
  addEvidence,
} from "@/api/device";
import LinkageUavList from "./components/LinkageUavList.vue";
import LinkageUavMap from "./components/LinkageUavMap.vue";
import LinkageLivePanel from "./components/LinkageLivePanel.vue";
import LinkageControlBar from "./components/LinkageControlBar.vue";
import LinkageEvidenceDrawer from "./components/LinkageEvidenceDrawer.vue";

/**
 * 无人机联动页（新链路）
 * 承接光电联动页入口，展示告警坐标与无人机资源，支持飞赴告警点、直播、截图、录像、喊话
 */
defineOptions({ name: "DeviceUavLinkage" });

const route = useRoute();
const router = useRouter();
const deviceStore = useDeviceStore();

const uavs = ref<any[]>([]);
const selectedUav = ref<any>(null);
const activeTask = ref<any>(null);
const evidenceVisible = ref(false);
const recording = ref(false);
const livePanelRef = ref<InstanceType<typeof LinkageLivePanel> | null>(null);
let recordStart = 0;
let taskTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setInterval> | null = null;

const alertLevelLabel: Record<string, string> = {
  urgent: "紧急",
  important: "重要",
  normal: "一般",
  tip: "提示",
};
const alertLevelTag: Record<string, "danger" | "warning" | "primary" | "info"> =
  { urgent: "danger", important: "warning", normal: "primary", tip: "info" };
const statusLabel: Record<string, string> = {
  pending: "待核验",
  disposing: "处置中",
  closed: "已闭环",
  archived: "已归档",
};
const statusTag: Record<string, "danger" | "warning" | "success" | "info"> = {
  pending: "danger",
  disposing: "warning",
  closed: "success",
  archived: "info",
};
const linkContext = computed(() => deviceStore.linkContext);

const target = computed<{ lat: number; lng: number; address?: string }>(() => {
  const loc = linkContext.value?.location;
  if (loc?.lat != null && loc?.lng != null) {
    return { lat: loc.lat, lng: loc.lng, address: loc.address || "告警目标" };
  }
  return { lat: 29.85, lng: 121.95, address: "东海海域（示例）" };
});
const targetDisplay = computed(
  () =>
    `${target.value.lat.toFixed(4)}, ${target.value.lng.toFixed(4)} ${target.value.address || ""}`,
);
const fromOptics = computed(
  () =>
    linkContext.value?.fromOptics === true || route.query.fromOptics === "1",
);
const canOperate = computed(
  () => !!selectedUav.value && selectedUav.value.status === 1,
);
const taskRunning = computed(
  () =>
    !!activeTask.value &&
    (activeTask.value.status === "running" ||
      activeTask.value.status === "planned"),
);
const arrived = computed(
  () =>
    !!activeTask.value &&
    activeTask.value.status === "finished" &&
    (activeTask.value.progress || 0) >= 100,
);
const flightProgress = computed(() => activeTask.value?.progress || 0);

/** 距告警坐标最近的无人机（优先在线设备） */
const nearestUavId = computed(() => {
  if (!uavs.value.length || !target.value) return null;
  const withCoord = uavs.value.filter((u) => u.lat != null && u.lng != null);
  const online = withCoord.filter((u) => u.status === 1);
  const source = online.length > 0 ? online : withCoord;
  if (source.length === 0) return null;
  return [...source].sort(
    (a, b) =>
      haversine(target.value.lat, target.value.lng, a.lat, a.lng) -
      haversine(target.value.lat, target.value.lng, b.lat, b.lng),
  )[0].id;
});

/** 飞赴航线：从无人机当前位置直飞告警点 */
const flightRoute = computed(() => {
  const uav = selectedUav.value;
  if (!uav) return null;
  const t = target.value;
  return {
    takeoffPoint: { lat: uav.lat ?? t.lat, lng: uav.lng ?? t.lng },
    landingPoint: { lat: t.lat, lng: t.lng },
    waypoints: [{ lat: t.lat, lng: t.lng, altitude: 120, speed: 18 }],
  };
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const flightMetrics = computed(() => {
  const uav = selectedUav.value;
  const t = target.value;
  if (!uav)
    return {
      totalDistance: 0,
      flownDistance: 0,
      remainDistance: 0,
      remainMinutes: 0,
    };
  const total = haversine(uav.lat ?? t.lat, uav.lng ?? t.lng, t.lat, t.lng);
  const flown = total * (flightProgress.value / 100);
  const speed = Math.max(10, uav.speed || 15);
  return {
    totalDistance: total,
    flownDistance: flown,
    remainDistance: Math.max(0, total - flown),
    remainMinutes: Math.ceil(
      (Math.max(0, total - flown) * 1000) / (speed * 60),
    ),
  };
});

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 从查询参数重建联动上下文 */
function readLinkContextFromQuery() {
  const q = route.query;
  const eventId = Number(q.eventId);
  if (!eventId) return;
  const lat = Number(q.lat);
  const lng = Number(q.lng);
  deviceStore.setLinkContext({
    eventId,
    targetId: String(q.targetId || ""),
    deviceId: Number(q.uavId) || Number(q.deviceId) || undefined,
    opticDeviceId: Number(q.opticDeviceId) || undefined,
    sourceRoute: String(q.sourceRoute || "/alert/event"),
    eventName: String(q.eventName || ""),
    targetName: String(q.targetName || ""),
    targetMmsi: String(q.targetMmsi || ""),
    ruleName: String(q.ruleName || ""),
    alertLevel: String(q.alertLevel || ""),
    status: String(q.status || ""),
    location:
      lat && lng ? { lat, lng, address: String(q.address || "") } : undefined,
    triggerTime: String(q.triggerTime || ""),
    fromOptics: q.fromOptics === "1",
  });
}

async function loadUavs() {
  const { data } = await getUavList();
  uavs.value = (data as any)?.list || [];
  const queryUavId = Number(route.query.uavId);
  let nearest: any = null;
  if (queryUavId) nearest = uavs.value.find((u) => u.id === queryUavId);
  if (!nearest && uavs.value.length > 0) {
    const online = uavs.value.filter((u) => u.status === 1);
    const source = online.length > 0 ? online : uavs.value;
    nearest = [...source].sort(
      (a, b) =>
        haversine(target.value.lat, target.value.lng, a.lat, a.lng) -
        haversine(target.value.lat, target.value.lng, b.lat, b.lng),
    )[0];
  }
  nearest = nearest || uavs.value.find((u) => u.status === 1) || uavs.value[0];
  if (nearest) await selectUav(nearest);
}

async function selectUav(uav: any) {
  stopTaskTimer();
  activeTask.value = null;
  selectedUav.value = uav;
  deviceStore.selectDevice(uav.id);
  await Promise.all([refreshUavState(), loadTasks()]);
}

async function refreshUavState() {
  if (!selectedUav.value) return;
  const { data } = await getUavState(selectedUav.value.id);
  Object.assign(selectedUav.value, data || {});
}

async function loadTasks() {
  if (!selectedUav.value) return;
  const { data } = await getUavTaskList(selectedUav.value.id);
  const tasks = (data as any)?.list || [];
  const running = tasks.find((t: any) => t.status === "running");
  if (running) {
    activeTask.value = running;
    startTaskTimer(running);
  } else {
    activeTask.value = null;
  }
}

/** 一键飞赴告警点：创建飞赴任务并模拟推进 */
async function dispatchToTarget() {
  if (!canOperate.value) {
    ElMessage.warning("当前无人机不可用，无法起飞");
    return;
  }
  if (taskRunning.value) {
    ElMessage.warning("任务执行中，请先返航");
    return;
  }
  if ((selectedUav.value?.battery ?? 100) < 20) {
    ElMessage.warning("电量不足，无法执行飞行任务");
    return;
  }

  const waypoint = {
    lat: target.value.lat,
    lng: target.value.lng,
    altitude: 120,
    speed: 18,
  };
  const { data } = await createUavTask({
    uavId: selectedUav.value.id,
    waypoints: [waypoint],
  });
  const task = data;
  const started = await updateUavTask(task.id, {
    status: "running",
    startTime: formatNow(),
  });
  activeTask.value = started?.data || {
    ...task,
    status: "running",
    startTime: formatNow(),
  };
  ElMessage.success(`无人机已起飞，目标 ${target.value.address || "告警点"}`);
  startTaskTimer(activeTask.value);
}

/** 模拟飞赴进度，到达后保留已完成任务用于展示“已到达” */
function startTaskTimer(task: any) {
  stopTaskTimer();
  const totalSteps = 10;
  let ticks = Math.round(((task.progress || 0) / 100) * totalSteps);
  taskTimer = setInterval(async () => {
    ticks += 1;
    const progress = Math.min(100, Math.round((ticks / totalSteps) * 100));
    const patch: any = {
      progress,
      currentWaypointIndex: 1,
      flownDistance: Number(
        ((flightMetrics.value.totalDistance * progress) / 100).toFixed(1),
      ),
    };
    if (progress >= 100) {
      patch.status = "finished";
      patch.endTime = formatNow();
    }
    const { data } = await updateUavTask(task.id, patch);
    if (data?.status === "finished") {
      stopTaskTimer();
      activeTask.value = data;
      ElMessage.success("无人机已到达告警点，可执行取证喊话");
      refreshUavState();
    } else {
      activeTask.value = data;
    }
  }, 1200);
}

function stopTaskTimer() {
  if (taskTimer) {
    clearInterval(taskTimer);
    taskTimer = null;
  }
}

async function hoverUav() {
  if (!canOperate.value) return;
  const { data } = await controlUav(selectedUav.value.id, "hover");
  Object.assign(selectedUav.value, data || {});
  ElMessage.success("悬停指令已下发");
  refreshUavState();
}

async function returnUav() {
  if (!selectedUav.value) return;
  if (
    activeTask.value &&
    ["running", "planned"].includes(activeTask.value.status)
  ) {
    await updateUavTask(activeTask.value.id, {
      status: "finished",
      endTime: formatNow(),
      progress: activeTask.value.progress || 0,
    });
    stopTaskTimer();
  }
  activeTask.value = null;
  const { data } = await controlUav(selectedUav.value.id, "return");
  Object.assign(selectedUav.value, data || {});
  ElMessage.success("返航指令已下发");
  refreshUavState();
}

/** 截图取证，自动携带联动事件编号 */
async function handleCapture(dataUrl: string) {
  if (!selectedUav.value) return;
  await addEvidence({
    deviceId: selectedUav.value.id,
    deviceType: "uav",
    type: "screenshot",
    fileUrl: dataUrl,
    size: "1MB",
    content: `${selectedUav.value.name} 现场截图`,
    eventId: linkContext.value?.eventId ?? null,
    targetId: linkContext.value?.targetId ?? null,
  });
  ElMessage.success("截图已保存到取证记录");
}

async function toggleRecording() {
  if (!selectedUav.value) return;
  if (recording.value) {
    const seconds = Math.max(1, Math.round((Date.now() - recordStart) / 1000));
    await addEvidence({
      deviceId: selectedUav.value.id,
      deviceType: "uav",
      type: "video",
      content: `${selectedUav.value.name} 录像片段（${seconds}s）`,
      eventId: linkContext.value?.eventId ?? null,
      targetId: linkContext.value?.targetId ?? null,
    });
    ElMessage.success("录像已停止并生成取证记录");
  } else {
    recordStart = Date.now();
    ElMessage.success("开始录像");
  }
  recording.value = !recording.value;
}

/** 操作栏截图：调用无人机直播画面的截图能力 */
function handleControlCapture() {
  livePanelRef.value?.capture();
}

function backToEvent() {
  router.push(linkContext.value?.sourceRoute || "/alert/event");
}

function backToOptics() {
  const ctx = linkContext.value;
  if (!ctx) return;
  const opticDeviceId = Number(route.query.opticDeviceId) || ctx.opticDeviceId;
  if (!opticDeviceId) {
    backToEvent();
    return;
  }
  const query: Record<string, string> = {
    deviceId: String(opticDeviceId),
    eventId: String(ctx.eventId || ""),
    targetId: ctx.targetId || "",
    eventName: ctx.eventName || "",
    targetName: ctx.targetName || "",
    targetMmsi: ctx.targetMmsi || "",
    ruleName: ctx.ruleName || "",
    alertLevel: ctx.alertLevel || "",
    status: ctx.status || "",
    triggerTime: ctx.triggerTime || "",
    sourceRoute: ctx.sourceRoute || "/alert/event",
  };
  if (ctx.location) {
    query.lat = String(ctx.location.lat ?? "");
    query.lng = String(ctx.location.lng ?? "");
    query.address = String(ctx.location.address || "");
  }
  router.push({ path: "/device/optics", query });
}

onMounted(async () => {
  readLinkContextFromQuery();
  await loadUavs();
  statusTimer = setInterval(refreshUavState, 10000);
});

onBeforeUnmount(() => {
  stopTaskTimer();
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
  deviceStore.clearLinkContext();
});
</script>

<style lang="scss" scoped>
.uav-linkage-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
}
.context-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.context-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.context-coord,
.context-time {
  color: var(--el-text-color-secondary);
}
.main-row {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}
.list-panel {
  width: 280px;
  flex: none;
  align-self: stretch;
  min-height: 0;
  overflow: hidden;
}
.list-panel :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}
.right-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}
.live-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.live-panel :deep(.el-card__body) {
  height: 100%;
  padding: 0;
  overflow: hidden;
}
.control-area {
  flex: none;
  height: 150px;
  display: flex;
  gap: 12px;
  min-height: 0;
}
.control-area :deep(.el-card__body) {
  height: 100%;
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 12px;
  padding: 10px;
  overflow: hidden;
}
.control-area :deep(.linkage-control-bar) {
  flex: 1;
  min-width: 0;
  height: 100%;
}
.map-panel {
  width: 300px;
  flex: none;
  overflow: hidden;
}
</style>
