import { useEffect, useRef, useState } from "react";
import { C, G, SH1 } from "../theme";
import { RoleToggle, Frog, Tag } from "./common";
import { supabase } from "../supabaseClient";

const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";
const MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID;
const LISTING_COLUMNS = "id,title,price,address,region,dong,complex,prop_type,deal_type,price_label,price_num,lat,lng,created_at,status";

const loadNaverMap = () => new Promise((resolve, reject) => {
  if (typeof window === "undefined") return reject(new Error("window unavailable"));
  if (window.naver?.maps) return resolve(window.naver.maps);
  if (!MAP_CLIENT_ID) return reject(new Error("missing VITE_NAVER_MAPS_CLIENT_ID"));
  const current = document.getElementById(NAVER_MAP_SCRIPT_ID);
  if (current) {
    current.addEventListener("load", () => resolve(window.naver.maps), { once: true });
    current.addEventListener("error", reject, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.id = NAVER_MAP_SCRIPT_ID;
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(MAP_CLIENT_ID)}`;
  script.async = true;
  script.onload = () => resolve(window.naver.maps);
  script.onerror = reject;
  document.head.appendChild(script);
});

const pointValue = (point, key) => {
  if (!point) return null;
  if (typeof point[key] === "function") return point[key]();
  return point[`_${key}`] ?? point[key] ?? null;
};

const boundsFromMap = map => {
  const bounds = map.getBounds();
  const sw = bounds.getSW();
  const ne = bounds.getNE();
  return {
    south: pointValue(sw, "lat"),
    west: pointValue(sw, "lng"),
    north: pointValue(ne, "lat"),
    east: pointValue(ne, "lng"),
  };
};

const listingFromRow = row => ({
  id: row.id,
  title: row.title || row.complex || "매물",
  address: row.address || `${row.region || ""} ${row.dong || ""}`.trim(),
  complex: row.complex || row.title || "매물",
  region: row.region || "",
  dong: row.dong || "",
  propType: row.prop_type || "",
  dealType: row.deal_type || "",
  price: row.price_label || (row.price ? `${Number(row.price).toLocaleString()}만` : "가격 미입력"),
  priceNum: row.price_num || row.price || 0,
  lat: Number(row.lat),
  lng: Number(row.lng),
});

async function fetchListingsInBounds(bounds) {
  if (!bounds || [bounds.south, bounds.north, bounds.west, bounds.east].some(v => !Number.isFinite(Number(v)))) return [];
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("status", "active")
    .gte("lat", bounds.south)
    .lte("lat", bounds.north)
    .gte("lng", bounds.west)
    .lte("lng", bounds.east)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Supabase map listings error:", error);
    return [];
  }
  return (data || []).map(listingFromRow).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

export function PropertyMap({ role, availableRoles, onSwitchRole }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const idleTimer = useRef(null);
  const [readyError, setReadyError] = useState("");
  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    loadNaverMap()
      .then(maps => {
        if (!alive || !mapEl.current) return;
        const map = new maps.Map(mapEl.current, {
          center: new maps.LatLng(37.5665, 126.9780),
          zoom: 12,
          minZoom: 9,
        });
        mapRef.current = map;
        const refresh = () => {
          clearTimeout(idleTimer.current);
          idleTimer.current = setTimeout(async () => {
            const next = await fetchListingsInBounds(boundsFromMap(map));
            if (!alive) return;
            setListings(next);
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = next.map(listing => {
              const marker = new maps.Marker({
                position: new maps.LatLng(listing.lat, listing.lng),
                map,
                title: listing.complex,
              });
              maps.Event.addListener(marker, "click", () => setSelected(listing));
              return marker;
            });
          }, 400);
        };
        maps.Event.addListener(map, "idle", refresh);
        refresh();
      })
      .catch(() => setReadyError("네이버 지도 키가 필요해요. VITE_NAVER_MAPS_CLIENT_ID를 설정하세요."));
    return () => {
      alive = false;
      clearTimeout(idleTimer.current);
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  return (
    <div style={{ height: "100%", background: G.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ background: G.header, padding: "46px 20px 18px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>지도</div>
            <div style={{ color: "#ffffffcc", fontSize: 13, fontWeight: 800, marginTop: 2 }}>현재 화면 안 매물 {listings.length}건</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="calm" size={58}/>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div ref={mapEl} style={{ position: "absolute", inset: 0, background: "#E8EFEA" }}/>
        {readyError && (
          <div style={{ position: "absolute", left: 16, right: 16, top: 18, background: "#fff", borderRadius: 16, padding: 16, boxShadow: SH1, color: C.mid, fontSize: 13, lineHeight: 1.6 }}>
            {readyError}
          </div>
        )}
        {selected && (
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 14px 34px rgba(39,57,47,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.complex}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{selected.address}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.line}`, background: "#fff", color: C.gray, fontSize: 18, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <Tag>{selected.propType}</Tag>
              <Tag tone="gold">{selected.dealType}</Tag>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>{selected.price}</div>
          </div>
        )}
      </div>
    </div>
  );
}
