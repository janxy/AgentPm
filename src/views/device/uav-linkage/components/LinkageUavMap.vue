<template>
  <div class="linkage-uav-map annot-device-uav-linkage-map">
    <div ref="mapContainer" class="map-container"></div>
    <div class="map-legend">
      <span><i class="dot dot-target"></i>告警目标</span>
      <span><i class="dot dot-uav"></i>无人机</span>
      <span><i class="dot dot-takeoff"></i>起降点</span>
      <span><i class="dot dot-route"></i>飞赴航线</span>
    </div>
    <div v-if="target" class="map-coords">
      目标 {{ target.lat.toFixed(5) }}, {{ target.lng.toFixed(5) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * 无人机联动地图
 * 展示告警目标、无人机当前位置、起降点与飞赴航线，任务执行时按进度推进无人机标记
 */
const props = defineProps<{
  target: { lat: number; lng: number; address?: string } | null;
  uav: any;
  route: any;
  progress: number;
}>();

const mapContainer = ref<HTMLDivElement>();
let map: L.Map | null = null;
let layerGroup: L.LayerGroup | null = null;

const tileUrl =
  "https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029";

/** 任务执行中按进度插值出无人机当前位置 */
const currentPosition = computed(() => {
  const t = props.target;
  const r = props.route;
  if (!t || !r?.takeoffPoint) return null;
  const p = Math.min(100, Math.max(0, props.progress)) / 100;
  return {
    lat: r.takeoffPoint.lat + (t.lat - r.takeoffPoint.lat) * p,
    lng: r.takeoffPoint.lng + (t.lng - r.takeoffPoint.lng) * p,
  };
});

function initMap() {
  if (!mapContainer.value || map) return;
  map = L.map(mapContainer.value, { zoomControl: true }).setView(
    [29.95, 122.12],
    11,
  );
  L.tileLayer(tileUrl, {
    maxZoom: 18,
    subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
    attribution: "",
  }).addTo(map);
  layerGroup = L.layerGroup().addTo(map);
  setTimeout(() => map?.invalidateSize(), 200);
}

function addMarker(
  lat: number,
  lng: number,
  label: string,
  cls: string,
  popup: string,
) {
  if (!map || !layerGroup) return;
  const icon = L.divIcon({
    className: "route-div-icon",
    html: `<div class="${cls}">${label}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
  const marker = L.marker([lat, lng], { icon });
  marker.bindPopup(popup);
  marker.addTo(layerGroup);
}

function render() {
  if (!map || !layerGroup) return;
  layerGroup.clearLayers();
  const t = props.target;
  if (!t) return;

  const r = props.route;
  const takeoff = r?.takeoffPoint || {
    lat: props.uav?.lat ?? t.lat,
    lng: props.uav?.lng ?? t.lng,
  };
  const pos = currentPosition.value || {
    lat: props.uav?.lat ?? t.lat,
    lng: props.uav?.lng ?? t.lng,
  };

  addMarker(
    t.lat,
    t.lng,
    "警",
    "target-dot",
    `${t.address || "告警目标"}\n${t.lat.toFixed(5)}, ${t.lng.toFixed(5)}`,
  );
  addMarker(
    takeoff.lat,
    takeoff.lng,
    "起",
    "takeoff-dot",
    `起降点\n${takeoff.lat.toFixed(5)}, ${takeoff.lng.toFixed(5)}`,
  );
  addMarker(
    pos.lat,
    pos.lng,
    "机",
    "uav-dot",
    `${props.uav?.name || "无人机"}\n${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`,
  );

  L.polyline(
    [
      [takeoff.lat, takeoff.lng],
      [t.lat, t.lng],
    ],
    { color: "#409eff", weight: 2, dashArray: "6 4" },
  ).addTo(layerGroup);
  if (props.progress > 0) {
    L.polyline(
      [
        [takeoff.lat, takeoff.lng],
        [pos.lat, pos.lng],
      ],
      { color: "#67c23a", weight: 3 },
    ).addTo(layerGroup);
  }

  const bounds = L.latLngBounds([
    [t.lat, t.lng],
    [takeoff.lat, takeoff.lng],
  ]);
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
}

watch(
  () => props.target,
  () => render(),
  { deep: true },
);
watch(
  () => props.route,
  () => render(),
  { deep: true },
);
watch(
  () => props.progress,
  () => render(),
);
watch(
  () => [props.uav?.lat, props.uav?.lng],
  () => render(),
);
watch(
  () => props.uav?.id,
  () => render(),
);

onMounted(() => {
  initMap();
  render();
});
onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style lang="scss" scoped>
.linkage-uav-map {
  position: relative;
  height: 100%;
  min-height: 0;
}
.map-container {
  width: 100%;
  height: 100%;
}
.map-legend {
  position: absolute;
  left: 10px;
  bottom: 8px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  font-size: 11px;
  color: var(--el-text-color-regular);
  box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
}
.map-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.map-coords {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  font-size: 11px;
  color: var(--el-text-color-secondary);
  box-shadow: 0 1px 4px rgb(0 0 0 / 10%);
  white-space: nowrap;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.dot-target {
  background: var(--el-color-danger);
}
.dot-uav {
  background: var(--el-color-primary);
}
.dot-takeoff {
  background: var(--el-color-success);
}
.dot-route {
  height: 3px;
  border-radius: 2px;
  background: repeating-linear-gradient(
    90deg,
    #409eff 0 5px,
    transparent 5px 9px
  );
}
:deep(.target-dot),
:deep(.takeoff-dot),
:deep(.uav-dot) {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 30%);
}
:deep(.target-dot) {
  background: var(--el-color-danger);
}
:deep(.takeoff-dot) {
  background: var(--el-color-success);
}
:deep(.uav-dot) {
  background: var(--el-color-primary);
}
:deep(.route-div-icon) {
  background: transparent;
  border: none;
}
</style>
