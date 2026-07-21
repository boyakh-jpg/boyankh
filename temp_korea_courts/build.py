#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import html
import json
import math
import os
import re
import sys
import time
import traceback
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
RAW = OUT / "raw"
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)

PUBLIC_DATA_URL = "https://www.data.go.kr/data/15013117/standard.do"
OSM_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
USER_AGENT = "RankBall-Korea-Court-Catalog/1.0 (noncommercial data build; contact via github.com/boyakh-jpg)"
BUILD_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

LOGS: list[str] = []
ERRORS: list[dict[str, Any]] = []
SOURCE_META: dict[str, Any] = {}

FINAL_COLUMNS = [
    "id", "source_key", "name", "name_generated", "region", "type",
    "sido", "sigungu", "eupmyeondong", "address_text", "road_address", "jibun_address",
    "lat", "lng", "indoor", "venue_type", "court_layout", "hoop_count",
    "surface_type", "lighting", "paid", "opening_hours", "application_method",
    "phone", "website", "operator_name", "access_type", "access_reason",
    "status", "confidence", "source_primary", "source_ids", "source_license",
    "source_updated_at", "dedupe_group_id", "dedupe_distance_m", "raw_tags", "updated_at",
]


def log(message: str) -> None:
    line = f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] {message}"
    LOGS.append(line)
    print(line, flush=True)


def record_error(stage: str, exc: BaseException | str, details: Any = None) -> None:
    error = {
        "stage": stage,
        "error": repr(exc) if isinstance(exc, BaseException) else str(exc),
        "details": details,
        "traceback": traceback.format_exc() if isinstance(exc, BaseException) else None,
    }
    ERRORS.append(error)
    log(f"ERROR {stage}: {error['error']}")


def clean(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    text = unicodedata.normalize("NFC", str(value))
    text = html.unescape(text).replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text).strip()


def norm(value: Any) -> str:
    text = clean(value).lower()
    text = re.sub(r"[\s\-_/·ㆍ,.()\[\]{}]+", "", text)
    text = re.sub(r"(농구장|농구코트|코트|basketballcourt|basketball)$", "", text)
    return text


def stable_hash(*parts: Any, length: int = 20) -> str:
    payload = "|".join(clean(part) for part in parts)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()[:length]


def to_float(value: Any) -> float | None:
    try:
        text = clean(value).replace(",", "")
        if not text:
            return None
        number = float(text)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def to_int(value: Any) -> int | None:
    try:
        text = clean(value)
        if not text:
            return None
        match = re.search(r"-?\d+", text)
        return int(match.group()) if match else None
    except Exception:
        return None


def yes_no(value: Any) -> bool | None:
    text = clean(value).lower()
    if text in {"y", "yes", "true", "1", "유", "있음", "무료아님"}:
        return True
    if text in {"n", "no", "false", "0", "무", "없음"}:
        return False
    return None


def json_text(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371008.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def pick_column(df: pd.DataFrame, names: Iterable[str]) -> str | None:
    normalized = {norm(c): c for c in df.columns}
    for name in names:
        key = norm(name)
        if key in normalized:
            return normalized[key]
    for name in names:
        key = norm(name)
        for ncol, original in normalized.items():
            if key and (key in ncol or ncol in key):
                return original
    return None


def read_delimited(path: Path) -> pd.DataFrame:
    errors: list[str] = []
    encodings = ["utf-8-sig", "utf-8", "cp949", "euc-kr"]
    separators = [",", "\t", "|"]
    for encoding in encodings:
        for sep in separators:
            try:
                frame = pd.read_csv(path, encoding=encoding, sep=sep, dtype=str, keep_default_na=False, engine="python")
                if frame.shape[1] >= 5:
                    return frame
            except Exception as exc:
                errors.append(f"{encoding}/{repr(sep)}:{exc}")
    raise RuntimeError("CSV parsing failed: " + " | ".join(errors[-6:]))


def download_public_data_csv() -> Path | None:
    """Download the national public-facility grid CSV through a real browser.

    The portal has changed its download UI several times. This routine tries visible CSV controls,
    captures actual browser downloads, and writes DOM diagnostics when the UI changes again.
    """
    debug: dict[str, Any] = {"url": PUBLIC_DATA_URL, "candidates": [], "attempts": []}
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        record_error("public_data.playwright_import", exc)
        return None

    target = RAW / "public_facility_standard.csv"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            )
            context = browser.new_context(
                accept_downloads=True,
                locale="ko-KR",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1440, "height": 1600},
            )
            page = context.new_page()
            page.goto(PUBLIC_DATA_URL, wait_until="domcontentloaded", timeout=120_000)
            page.wait_for_timeout(8_000)

            locator = page.locator("a,button,input,span").filter(has_text=re.compile(r"^\s*CSV\s*$", re.I))
            count = min(locator.count(), 30)
            for i in range(count):
                el = locator.nth(i)
                try:
                    debug["candidates"].append({
                        "index": i,
                        "tag": el.evaluate("el => el.tagName"),
                        "text": clean(el.inner_text(timeout=2_000)),
                        "visible": el.is_visible(),
                        "href": el.get_attribute("href"),
                        "onclick": el.get_attribute("onclick"),
                        "class": el.get_attribute("class"),
                        "id": el.get_attribute("id"),
                    })
                except Exception as exc:
                    debug["candidates"].append({"index": i, "error": repr(exc)})

            for item in reversed(debug["candidates"]):
                idx = item.get("index")
                if idx is None or not item.get("visible"):
                    continue
                el = locator.nth(idx)
                try:
                    el.scroll_into_view_if_needed(timeout=5_000)
                    with page.expect_download(timeout=25_000) as download_info:
                        el.click(force=True, timeout=10_000)
                    download = download_info.value
                    suggested = download.suggested_filename or "public_facility.csv"
                    downloaded = RAW / suggested
                    download.save_as(str(downloaded))
                    if downloaded.suffix.lower() not in {".csv", ".txt"}:
                        downloaded.rename(target)
                    elif downloaded != target:
                        downloaded.replace(target)
                    debug["success_candidate"] = item
                    debug["download_suggested_filename"] = suggested
                    break
                except PlaywrightTimeoutError as exc:
                    debug["attempts"].append({"candidate": item, "result": "no_download", "error": repr(exc)})
                    try:
                        page.keyboard.press("Escape")
                    except Exception:
                        pass
                except Exception as exc:
                    debug["attempts"].append({"candidate": item, "result": "error", "error": repr(exc)})

            if not target.exists():
                html_text = page.content()
                (RAW / "data_go_kr_page_excerpt.html").write_text(html_text[:2_000_000], encoding="utf-8")
                url_candidates = set()
                for item in debug["candidates"]:
                    for field in ("href", "onclick"):
                        value = clean(item.get(field))
                        for match in re.findall(r"https?://[^\"'\s)]+", value):
                            url_candidates.add(match)
                        for match in re.findall(r"['\"]([^'\"]*(?:download|fileDownload|csv)[^'\"]*)['\"]", value, re.I):
                            if match.startswith("/"):
                                url_candidates.add("https://www.data.go.kr" + match)
                for url in url_candidates:
                    try:
                        response = context.request.get(url, timeout=60_000)
                        body = response.body()
                        ctype = clean(response.headers.get("content-type"))
                        debug["attempts"].append({"url": url, "status": response.status, "content_type": ctype, "bytes": len(body)})
                        if response.ok and len(body) > 1000 and ("csv" in ctype.lower() or b"," in body[:500]):
                            target.write_bytes(body)
                            debug["success_url"] = url
                            break
                    except Exception as exc:
                        debug["attempts"].append({"url": url, "error": repr(exc)})

            try:
                page.screenshot(path=str(RAW / "data_go_kr_page.png"), full_page=False)
            except Exception:
                pass
            browser.close()
    except Exception as exc:
        record_error("public_data.browser", exc)
    finally:
        (RAW / "data_go_kr_debug.json").write_text(json.dumps(debug, ensure_ascii=False, indent=2), encoding="utf-8")

    if target.exists() and target.stat().st_size > 1000:
        log(f"Public-data CSV downloaded: {target.stat().st_size:,} bytes")
        return target
    log("Public-data CSV download failed; OSM build will continue")
    return None


def venue_type_from_text(text: str) -> str:
    t = clean(text).lower()
    if re.search(r"학교|초등|중학교|고등학교|대학교|대학|교육청|교육지원청|school|university|college", t):
        return "school"
    if re.search(r"아파트|apt\b|주공|lh\b|푸르지오|자이\b|힐스테이트|래미안|e편한세상|롯데캐슬|아이파크", t):
        return "apartment"
    if re.search(r"공원|park", t):
        return "park"
    if re.search(r"체육센터|스포츠센터|국민체육|체육관|sports.?centre|sports.?center", t):
        return "sports_center"
    if re.search(r"시청|구청|군청|도청|주민센터|행정복지|공공|문화센터|청소년", t):
        return "public_facility"
    return "unknown"


def parse_public_rows(path: Path | None) -> list[dict[str, Any]]:
    if path is None:
        return []
    try:
        df = read_delimited(path)
    except Exception as exc:
        record_error("public_data.parse", exc)
        return []

    columns = {
        "facility": pick_column(df, ["개방시설명", "시설명"]),
        "place": pick_column(df, ["개방장소명", "장소명"]),
        "facility_type": pick_column(df, ["개방시설유형구분", "시설유형구분", "시설유형"]),
        "closed": pick_column(df, ["휴관일"]),
        "weekday_start": pick_column(df, ["평일운영시작시각"]),
        "weekday_end": pick_column(df, ["평일운영종료시각"]),
        "weekend_start": pick_column(df, ["주말운영시작시각"]),
        "weekend_end": pick_column(df, ["주말운영종료시각"]),
        "paid": pick_column(df, ["유료사용여부"]),
        "fee": pick_column(df, ["사용료"]),
        "amenities": pick_column(df, ["부대시설정보"]),
        "application": pick_column(df, ["신청방법구분", "신청방법"]),
        "road": pick_column(df, ["소재지도로명주소", "도로명주소"]),
        "jibun": pick_column(df, ["소재지지번주소", "지번주소"]),
        "operator": pick_column(df, ["관리기관명"]),
        "department": pick_column(df, ["담당부서명"]),
        "phone": pick_column(df, ["사용안내전화번호", "전화번호"]),
        "website": pick_column(df, ["홈페이지주소"]),
        "lat": pick_column(df, ["위도"]),
        "lng": pick_column(df, ["경도"]),
        "reference_date": pick_column(df, ["데이터기준일자", "기준일자"]),
    }
    required = [columns["facility"], columns["facility_type"], columns["lat"], columns["lng"]]
    if any(c is None for c in required):
        record_error("public_data.columns", "required columns missing", {"found": list(df.columns), "mapping": columns})
        return []

    mask = pd.Series(False, index=df.index)
    for key in ("facility", "place", "facility_type"):
        col = columns[key]
        if col:
            mask |= df[col].astype(str).str.contains(r"농구|basketball", case=False, na=False, regex=True)
    subset = df.loc[mask].copy()
    log(f"Public-data rows: total={len(df):,}, basketball-filtered={len(subset):,}")

    rows: list[dict[str, Any]] = []
    for _, item in subset.iterrows():
        get = lambda key: clean(item.get(columns[key], "")) if columns.get(key) else ""
        name = get("facility") or get("place") or "농구장"
        place = get("place")
        facility_type = get("facility_type")
        road = get("road")
        jibun = get("jibun")
        address = road or jibun
        lat, lng = to_float(get("lat")), to_float(get("lng"))
        if lat is None or lng is None or not (32.0 <= lat <= 39.5 and 123.0 <= lng <= 133.5):
            continue
        operator = get("operator")
        application = get("application")
        paid = yes_no(get("paid"))
        venue = venue_type_from_text(" ".join([name, place, operator, address]))
        hours_parts = []
        if get("weekday_start") or get("weekday_end"):
            hours_parts.append(f"평일 {get('weekday_start') or '?'}-{get('weekday_end') or '?'}")
        if get("weekend_start") or get("weekend_end"):
            hours_parts.append(f"주말 {get('weekend_start') or '?'}-{get('weekend_end') or '?'}")
        if get("closed"):
            hours_parts.append(f"휴관 {get('closed')}")
        opening_hours = "; ".join(hours_parts)

        if application or paid is True or venue == "school":
            access_type = "conditional"
            reason_bits = ["공공시설 개방정보 등재"]
            if application:
                reason_bits.append(f"신청: {application}")
            if paid is True:
                reason_bits.append("유료")
            if venue == "school":
                reason_bits.append("학교시설 개방")
            access_reason = "; ".join(reason_bits)
        else:
            access_type = "public"
            access_reason = "공공시설 개방정보 등재"

        source_key_hash = stable_hash(name, place, road, jibun, operator, round(lat, 6), round(lng, 6))
        source_id = f"public_data_portal:{source_key_hash}"
        indoor = bool(re.search(r"실내|체육관|gym|indoor", " ".join([name, place, facility_type]), re.I))
        lighting = True if re.search(r"조명|라이트|lighting", get("amenities"), re.I) else None
        ref_date = get("reference_date")
        rows.append({
            "id": f"court_pd_{source_key_hash}", "source_key": source_id,
            "name": name, "name_generated": False, "region": "", "type": "실내" if indoor else "야외",
            "sido": "", "sigungu": "", "eupmyeondong": "", "address_text": address,
            "road_address": road, "jibun_address": jibun, "lat": lat, "lng": lng,
            "indoor": indoor, "venue_type": venue if venue != "unknown" else "public_facility",
            "court_layout": "unknown", "hoop_count": None, "surface_type": "unknown",
            "lighting": lighting, "paid": paid, "opening_hours": opening_hours,
            "application_method": application, "phone": get("phone"), "website": get("website"),
            "operator_name": operator, "access_type": access_type, "access_reason": access_reason,
            "status": "active", "confidence": 0.94, "source_primary": "public_data_portal",
            "source_ids": [source_id], "source_license": "공공데이터포털 전국공공시설개방정보표준데이터",
            "source_updated_at": ref_date, "dedupe_group_id": f"dg_{source_key_hash}",
            "dedupe_distance_m": None,
            "raw_tags": {"public_facility_name": name, "public_place_name": place,
                         "public_facility_type": facility_type, "fee": get("fee"),
                         "amenities": get("amenities"), "department": get("department")},
            "updated_at": BUILD_AT,
        })

    deduped: dict[str, dict[str, Any]] = {}
    for row in rows:
        deduped.setdefault(row["source_key"], row)
    SOURCE_META["public_data"] = {"downloaded": True, "source_rows": len(df),
        "basketball_rows": len(subset), "usable_rows": len(deduped), "columns": columns}
    return list(deduped.values())


def overpass_request(query: str, label: str, timeout: int = 360) -> dict[str, Any]:
    last_error: Exception | None = None
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    for attempt in range(8):
        url = OSM_MIRRORS[attempt % len(OSM_MIRRORS)]
        try:
            response = requests.post(url, data={"data": query}, headers=headers, timeout=timeout)
            if response.status_code in {429, 502, 503, 504}:
                raise RuntimeError(f"HTTP {response.status_code}: {response.text[:300]}")
            response.raise_for_status()
            data = response.json()
            log(f"Overpass {label}: {len(data.get('elements', [])):,} elements via {url}")
            return data
        except Exception as exc:
            last_error = exc
            log(f"Overpass retry {label} {attempt + 1}/8 via {url}: {exc}")
            time.sleep(min(20, 2 + attempt * 2))
    raise RuntimeError(f"Overpass failed for {label}: {last_error}")


def osm_point(element: dict[str, Any]) -> tuple[float | None, float | None]:
    if "lat" in element and "lon" in element:
        return to_float(element.get("lat")), to_float(element.get("lon"))
    center = element.get("center") or {}
    if "lat" in center and "lon" in center:
        return to_float(center.get("lat")), to_float(center.get("lon"))
    bounds = element.get("bounds") or {}
    if all(k in bounds for k in ("minlat", "maxlat", "minlon", "maxlon")):
        return ((float(bounds["minlat"]) + float(bounds["maxlat"])) / 2,
                (float(bounds["minlon"]) + float(bounds["maxlon"])) / 2)
    return None, None


def is_osm_court(tags: dict[str, Any]) -> bool:
    sport = clean(tags.get("sport")).lower().split(";")
    return "basketball" in sport or "hoops" in tags or "basketball" in tags


def fetch_osm_elements() -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    combined_query = r'''
[out:json][timeout:300];
area["ISO3166-1"="KR"]["boundary"="administrative"]->.kr;
(
  nwr(area.kr)["sport"~"(^|;)basketball(;|$)"];
  nwr(area.kr)["hoops"];
  nwr(area.kr)["basketball"];
)->.c;
.c out center tags qt;
(
  nwr(around.c:160)["amenity"~"^(school|kindergarten|college|university)$"];
  nwr(around.c:160)["landuse"="education"];
  nwr(around.c:160)["building"~"^(apartments|residential)$"];
  nwr(around.c:160)["landuse"="residential"];
  nwr(around.c:160)["leisure"="park"];
  nwr(around.c:160)["leisure"="sports_centre"];
)->.ctx;
.ctx out bb tags qt;
'''
    try:
        data = overpass_request(combined_query, "KR courts+contexts", timeout=420)
        elements = data.get("elements", [])
        courts = [e for e in elements if is_osm_court(e.get("tags") or {})]
        contexts = [e for e in elements if not is_osm_court(e.get("tags") or {})]
        return courts, contexts, data.get("osm3s") or {}
    except Exception as exc:
        record_error("osm.combined_query", exc)

    courts_query = r'''
[out:json][timeout:300];
area["ISO3166-1"="KR"]["boundary"="administrative"]->.kr;
(
  nwr(area.kr)["sport"~"(^|;)basketball(;|$)"];
  nwr(area.kr)["hoops"];
  nwr(area.kr)["basketball"];
);
out center tags qt;
'''
    data = overpass_request(courts_query, "KR courts", timeout=420)
    courts = [e for e in data.get("elements", []) if is_osm_court(e.get("tags") or {})]
    contexts_by_id: dict[tuple[str, int], dict[str, Any]] = {}
    points = []
    for e in courts:
        lat, lng = osm_point(e)
        if lat is not None and lng is not None:
            points.append((lat, lng))
    batch_size = 18
    for start in range(0, len(points), batch_size):
        statements = []
        for lat, lng in points[start:start + batch_size]:
            statements.extend([
                f'nwr(around:160,{lat:.7f},{lng:.7f})["amenity"~"^(school|kindergarten|college|university)$"];',
                f'nwr(around:160,{lat:.7f},{lng:.7f})["landuse"="education"];',
                f'nwr(around:160,{lat:.7f},{lng:.7f})["building"~"^(apartments|residential)$"];',
                f'nwr(around:160,{lat:.7f},{lng:.7f})["landuse"="residential"];',
                f'nwr(around:160,{lat:.7f},{lng:.7f})["leisure"="park"];',
                f'nwr(around:160,{lat:.7f},{lng:.7f})["leisure"="sports_centre"];',
            ])
        query = "[out:json][timeout:180];(\n" + "\n".join(statements) + "\n);out bb tags qt;"
        try:
            batch = overpass_request(query, f"contexts {start + 1}-{min(start + batch_size, len(points))}", timeout=240)
            for e in batch.get("elements", []):
                contexts_by_id[(e.get("type"), int(e.get("id")))] = e
        except Exception as exc:
            record_error("osm.context_batch", exc, {"start": start, "size": batch_size})
    return courts, list(contexts_by_id.values()), data.get("osm3s") or {}


def surface_type(tags: dict[str, Any]) -> str:
    raw = clean(tags.get("surface")).lower()
    mapping = {"asphalt": "asphalt", "concrete": "concrete", "paving_stones": "paving_stones",
        "wood": "wood", "parquet": "wood", "rubber": "rubber", "tartan": "rubber",
        "synthetic": "synthetic", "acrylic": "synthetic", "grass": "grass",
        "dirt": "dirt", "compacted": "compacted", "sand": "sand"}
    for token in re.split(r"[;,/]", raw):
        token = token.strip()
        if token in mapping:
            return mapping[token]
    return raw or "unknown"


def classify_osm_access(tags: dict[str, Any], venue: str, context_name: str = "") -> tuple[str, str]:
    access = clean(tags.get("access")).lower()
    fee = clean(tags.get("fee")).lower()
    if access in {"no", "private", "customers", "destination", "permit", "members"}:
        return "restricted", f"OSM access={access}"
    if access == "permissive":
        return "conditional", "OSM access=permissive"
    if access in {"yes", "public"}:
        return "public", f"OSM access={access}"
    if venue == "school":
        return "restricted", f"학교 부지 추정{': ' + context_name if context_name else ''}; 공개근거 없음"
    if venue == "apartment":
        return "restricted", f"아파트 단지 추정{': ' + context_name if context_name else ''}; 공개근거 없음"
    if fee in {"yes", "true", "1"}:
        return "conditional", "OSM fee=yes"
    return "unknown", "OSM에 공개 접근 정보 없음"


def element_context_type(tags: dict[str, Any]) -> str:
    amenity, landuse = clean(tags.get("amenity")).lower(), clean(tags.get("landuse")).lower()
    building, leisure = clean(tags.get("building")).lower(), clean(tags.get("leisure")).lower()
    text = " ".join(clean(tags.get(k)) for k in ("name", "operator", "description"))
    if amenity in {"school", "kindergarten", "college", "university"} or landuse == "education":
        return "school"
    if building in {"apartments", "residential"} or landuse == "residential":
        if re.search(r"아파트|apt\b|주공|lh\b|푸르지오|자이\b|힐스테이트|래미안|e편한세상|롯데캐슬|아이파크", text, re.I):
            return "apartment"
        return "residential"
    if leisure == "park": return "park"
    if leisure == "sports_centre": return "sports_center"
    return "unknown"


def nearest_contexts(courts: list[dict[str, Any]], contexts: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    context_points = []
    for context in contexts:
        lat, lng = osm_point(context)
        if lat is None or lng is None: continue
        ctype = element_context_type(context.get("tags") or {})
        if ctype != "unknown": context_points.append((lat, lng, ctype, context))
    results: dict[str, dict[str, Any]] = {}
    for court in courts:
        lat, lng = osm_point(court)
        if lat is None or lng is None: continue
        best = None
        for clat, clng, ctype, context in context_points:
            if abs(clat - lat) > 0.006 or abs(clng - lng) > 0.008: continue
            distance = haversine_m(lat, lng, clat, clng)
            bounds = context.get("bounds") or {}
            if bounds:
                near_bounds = (float(bounds.get("minlat", 99)) - 0.0015 <= lat <= float(bounds.get("maxlat", -99)) + 0.0015
                    and float(bounds.get("minlon", 999)) - 0.0018 <= lng <= float(bounds.get("maxlon", -999)) + 0.0018)
                if near_bounds: distance = min(distance, 20.0)
            max_distance = 120 if ctype in {"school", "apartment"} else 160
            if distance > max_distance: continue
            rank = {"school": 0, "apartment": 1, "residential": 3, "park": 2, "sports_center": 2}.get(ctype, 9)
            candidate = (rank, distance, ctype, context)
            if best is None or candidate[:2] < best[:2]: best = candidate
        if best:
            _, distance, ctype, context = best
            results[f"{court.get('type')}/{court.get('id')}"] = {"type": ctype,
                "distance_m": round(distance, 1), "name": clean((context.get("tags") or {}).get("name")),
                "osm_id": f"{context.get('type')}/{context.get('id')}"}
    return results


def parse_osm_rows(courts: list[dict[str, Any]], contexts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id: dict[tuple[str, int], dict[str, Any]] = {}
    for e in courts:
        try: by_id[(clean(e.get("type")), int(e.get("id")))] = e
        except Exception: continue
    courts = list(by_id.values())
    context_map = nearest_contexts(courts, contexts)
    rows: list[dict[str, Any]] = []
    for element in courts:
        tags = element.get("tags") or {}
        lat, lng = osm_point(element)
        if lat is None or lng is None or not (32.0 <= lat <= 39.5 and 123.0 <= lng <= 133.5): continue
        osm_type, osm_id = clean(element.get("type")), int(element.get("id"))
        source_id = f"osm:{osm_type}:{osm_id}"
        context = context_map.get(f"{osm_type}/{osm_id}", {})
        explicit_text = " ".join(clean(tags.get(k)) for k in ("name", "operator", "description", "addr:full"))
        explicit_venue = venue_type_from_text(explicit_text)
        context_type = context.get("type")
        venue = explicit_venue if explicit_venue != "unknown" else (context_type or "unknown")
        if venue == "residential": venue = "unknown"
        name = clean(tags.get("name") or tags.get("official_name") or tags.get("loc_name"))
        generated = not bool(name)
        if not name:
            context_name = clean(context.get("name"))
            name = f"{context_name} 농구장" if context_name else f"이름 없는 농구장 ({osm_type}/{osm_id})"
        indoor_value, covered_value = clean(tags.get("indoor")).lower(), clean(tags.get("covered")).lower()
        indoor = indoor_value in {"yes", "true", "1"} or clean(tags.get("leisure")).lower() == "sports_hall"
        if covered_value in {"yes", "true", "1"} and indoor_value not in {"no", "false", "0"}: indoor = True
        hoop_count = to_int(tags.get("hoops"))
        basketball_value, leisure = clean(tags.get("basketball")).lower(), clean(tags.get("leisure")).lower()
        if basketball_value == "hoop" or (osm_type == "node" and leisure != "pitch" and hoop_count in {None, 1}):
            layout, hoop_count = "single_hoop", hoop_count or 1
        elif hoop_count == 1: layout = "half"
        elif hoop_count == 2: layout = "full"
        elif hoop_count and hoop_count > 2: layout = "multi"
        else: layout = "unknown"
        lit, paid = yes_no(tags.get("lit")), yes_no(tags.get("fee"))
        access_type, access_reason = classify_osm_access(tags, venue, clean(context.get("name")))
        if context and venue in {"school", "apartment"}:
            access_reason += f"; 근접 맥락 {context.get('osm_id')} {context.get('distance_m')}m"
        address_parts = [clean(tags.get("addr:province")), clean(tags.get("addr:city")),
            clean(tags.get("addr:district")), clean(tags.get("addr:street")), clean(tags.get("addr:housenumber"))]
        address = clean(tags.get("addr:full")) or " ".join(p for p in address_parts if p)
        source_key_hash = stable_hash(osm_type, osm_id)
        rows.append({
            "id": f"court_osm_{osm_type}_{osm_id}", "source_key": source_id, "name": name,
            "name_generated": generated, "region": "", "type": "실내" if indoor else "야외",
            "sido": "", "sigungu": "", "eupmyeondong": "", "address_text": address,
            "road_address": address, "jibun_address": "", "lat": lat, "lng": lng,
            "indoor": indoor, "venue_type": venue, "court_layout": layout, "hoop_count": hoop_count,
            "surface_type": surface_type(tags), "lighting": lit, "paid": paid,
            "opening_hours": clean(tags.get("opening_hours")), "application_method": "",
            "phone": clean(tags.get("phone") or tags.get("contact:phone")),
            "website": clean(tags.get("website") or tags.get("contact:website")),
            "operator_name": clean(tags.get("operator")), "access_type": access_type,
            "access_reason": access_reason, "status": "active",
            "confidence": 0.83 if access_type != "unknown" or not generated else 0.72,
            "source_primary": "openstreetmap", "source_ids": [source_id],
            "source_license": "OpenStreetMap ODbL 1.0", "source_updated_at": "",
            "dedupe_group_id": f"dg_{source_key_hash}", "dedupe_distance_m": None,
            "raw_tags": {"osm_type": osm_type, "osm_id": osm_id, "tags": tags, "context": context},
            "updated_at": BUILD_AT})
    SOURCE_META["osm"] = {"raw_court_objects": len(courts), "raw_context_objects": len(contexts),
        "usable_rows": len(rows), "context_matches": len(context_map)}
    return rows


def assign_admin_areas(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not rows: return rows
    try:
        import admdongkor as adk
        import geopandas as gpd
        from shapely.geometry import Point
        versions = [str(v) for v in adk.versions()]
        version = max(v for v in versions if v <= "20260721")
        emd = adk.get(version, "emd", crs="EPSG:4326")
        points = gpd.GeoDataFrame({"row_index": list(range(len(rows)))},
            geometry=[Point(float(row["lng"]), float(row["lat"])) for row in rows], crs="EPSG:4326")
        cols = list(emd.columns)
        full_col = next((c for c in ["adm_nm", "name", "emd_nm", "emdnm"] if c in cols), None)
        sido_col = next((c for c in ["sidonm", "sido_nm", "sido"] if c in cols), None)
        sgg_col = next((c for c in ["sggnm", "sgg_nm", "sigungu"] if c in cols), None)
        code_col = next((c for c in ["adm_cd", "adm_cd2", "code"] if c in cols), None)
        keep = [c for c in [full_col, sido_col, sgg_col, code_col, "geometry"] if c]
        joined = gpd.sjoin(points, emd[keep], how="left", predicate="within")
        joined = joined.sort_values("row_index").drop_duplicates("row_index").set_index("row_index")
        for i, row in enumerate(rows):
            if i not in joined.index: continue
            match = joined.loc[i]
            full = clean(match.get(full_col)) if full_col else ""
            sido = clean(match.get(sido_col)) if sido_col else ""
            sgg = clean(match.get(sgg_col)) if sgg_col else ""
            tokens = full.split()
            if not sido and tokens: sido = tokens[0]
            if not sgg and len(tokens) >= 2: sgg = " ".join(tokens[1:-1]) if len(tokens) > 2 else tokens[1]
            emd_name = tokens[-1] if len(tokens) >= 2 else ""
            row["sido"], row["sigungu"], row["eupmyeondong"] = sido, sgg, emd_name
            row["region"] = " ".join(part for part in [sido, sgg] if part)
            if not row["address_text"] and row["source_primary"] == "openstreetmap":
                row["address_text"] = " ".join(part for part in [sido, sgg, emd_name] if part)
            raw = row.get("raw_tags") or {}
            raw["admin_version"] = version
            raw["admin_code"] = clean(match.get(code_col)) if code_col else ""
            row["raw_tags"] = raw
        SOURCE_META["admin_boundary"] = {"version": version, "rows": len(emd)}
        log(f"Administrative join completed using admdongkor {version}")
    except Exception as exc:
        record_error("admin_join", exc)
        for row in rows:
            tokens = clean(row.get("address_text")).split()
            if tokens: row["sido"] = tokens[0]
            if len(tokens) >= 2: row["sigungu"] = tokens[1]
            row["region"] = " ".join(part for part in [row.get("sido"), row.get("sigungu")] if part)
    return rows


def token_similarity(a: str, b: str) -> float:
    na, nb = norm(a), norm(b)
    if not na or not nb: return 0.0
    if na == nb: return 100.0
    if na in nb or nb in na: return 88.0
    try:
        from rapidfuzz.fuzz import token_set_ratio
        return float(token_set_ratio(clean(a), clean(b)))
    except Exception:
        from difflib import SequenceMatcher
        return 100.0 * SequenceMatcher(None, na, nb).ratio()


def is_generic_name(name: str, generated: bool = False) -> bool:
    if generated: return True
    n = norm(name)
    return not n or n in {"농구", "농구장", "야외농구", "basketball"} or n.startswith("이름없는")


def absorb_osm_hoops(rows: list[dict[str, Any]], report: list[dict[str, Any]]) -> list[dict[str, Any]]:
    pitch_rows = [r for r in rows if r["source_primary"] == "openstreetmap" and (r.get("raw_tags") or {}).get("tags", {}).get("leisure") == "pitch"]
    absorbed: set[str] = set()
    for row in rows:
        if row["source_primary"] != "openstreetmap" or row["court_layout"] != "single_hoop": continue
        candidates = []
        for pitch in pitch_rows:
            if pitch["id"] == row["id"]: continue
            if abs(pitch["lat"] - row["lat"]) > 0.0005 or abs(pitch["lng"] - row["lng"]) > 0.0007: continue
            d = haversine_m(row["lat"], row["lng"], pitch["lat"], pitch["lng"])
            if d <= 35: candidates.append((d, pitch))
        if not candidates: continue
        d, pitch = min(candidates, key=lambda x: x[0])
        pitch["hoop_count"] = max(pitch.get("hoop_count") or 0, 1)
        pitch["source_ids"] = sorted(set(pitch["source_ids"] + row["source_ids"]))
        pitch["dedupe_distance_m"] = round(d, 1)
        absorbed.add(row["id"])
        report.append({"action": "absorb_osm_hoop_into_pitch", "kept_id": pitch["id"],
            "removed_id": row["id"], "distance_m": round(d, 1),
            "name_similarity": token_similarity(pitch["name"], row["name"]),
            "reason": "single hoop node within 35m of mapped basketball pitch"})
    return [r for r in rows if r["id"] not in absorbed]


def merge_rows(primary: dict[str, Any], secondary: dict[str, Any], distance: float) -> dict[str, Any]:
    merged = dict(primary)
    if secondary["source_primary"] == "openstreetmap": merged["lat"], merged["lng"] = secondary["lat"], secondary["lng"]
    for field in ["court_layout", "hoop_count", "surface_type", "lighting", "opening_hours", "phone", "website",
                  "operator_name", "indoor", "venue_type", "address_text", "road_address", "jibun_address",
                  "sido", "sigungu", "eupmyeondong", "region"]:
        current, candidate = merged.get(field), secondary.get(field)
        if current in {None, "", "unknown"} and candidate not in {None, "", "unknown"}: merged[field] = candidate
    if merged.get("type") not in {"실내", "야외"} and secondary.get("type"): merged["type"] = secondary["type"]
    access_pair = {primary.get("access_type"), secondary.get("access_type")}
    if primary["source_primary"] == "public_data_portal":
        if secondary.get("access_type") == "restricted":
            merged["access_type"] = "conditional"
            merged["access_reason"] = clean(primary.get("access_reason")) + "; OSM 제한 표기 충돌—공식 개방정보 우선"
            merged["confidence"] = min(float(primary.get("confidence") or 0.9), 0.82)
    elif "restricted" in access_pair:
        merged["access_type"] = "restricted"
        merged["access_reason"] = clean(primary.get("access_reason")) + "; " + clean(secondary.get("access_reason"))
    merged["source_ids"] = sorted(set((primary.get("source_ids") or []) + (secondary.get("source_ids") or [])))
    merged["source_primary"] = "public_data_portal+openstreetmap" if {primary["source_primary"], secondary["source_primary"]} == {"public_data_portal", "openstreetmap"} else primary["source_primary"]
    licenses = [clean(primary.get("source_license")), clean(secondary.get("source_license"))]
    merged["source_license"] = " + ".join(dict.fromkeys(x for x in licenses if x))
    merged["dedupe_distance_m"] = round(distance, 1)
    merged["dedupe_group_id"] = f"dg_{stable_hash(*merged['source_ids'])}"
    merged["confidence"] = round(min(0.99, max(float(primary.get("confidence") or 0), float(secondary.get("confidence") or 0)) + 0.03), 2)
    merged["raw_tags"] = {"primary": primary.get("raw_tags"), "secondary": secondary.get("raw_tags")}
    return merged


def dedupe_rows(public_rows: list[dict[str, Any]], osm_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    report: list[dict[str, Any]] = []
    osm_rows = absorb_osm_hoops(osm_rows, report)
    def same_source_collapse(rows: list[dict[str, Any]], label: str) -> list[dict[str, Any]]:
        kept: list[dict[str, Any]] = []
        for row in rows:
            duplicate_idx, duplicate_distance = None, None
            for idx, other in enumerate(kept):
                if norm(row["name"]) != norm(other["name"]): continue
                if abs(row["lat"] - other["lat"]) > 0.00015 or abs(row["lng"] - other["lng"]) > 0.0002: continue
                d = haversine_m(row["lat"], row["lng"], other["lat"], other["lng"])
                if d <= 8: duplicate_idx, duplicate_distance = idx, d; break
            if duplicate_idx is None: kept.append(row)
            else:
                primary = kept[duplicate_idx]
                kept[duplicate_idx] = merge_rows(primary, row, duplicate_distance or 0)
                report.append({"action": f"merge_{label}_exact_near", "kept_id": primary["id"],
                    "removed_id": row["id"], "distance_m": round(duplicate_distance or 0, 1),
                    "name_similarity": 100, "reason": "same normalized name and <=8m"})
        return kept
    public_rows, osm_rows = same_source_collapse(public_rows, "public"), same_source_collapse(osm_rows, "osm")
    matched_osm: set[int] = set(); merged_public: list[dict[str, Any]] = []
    for public in public_rows:
        candidates = []
        for idx, osm in enumerate(osm_rows):
            if idx in matched_osm: continue
            if abs(public["lat"] - osm["lat"]) > 0.00055 or abs(public["lng"] - osm["lng"]) > 0.00075: continue
            distance = haversine_m(public["lat"], public["lng"], osm["lat"], osm["lng"])
            if distance > 50: continue
            name_sim = token_similarity(public["name"], osm["name"])
            place_name = clean((public.get("raw_tags") or {}).get("public_place_name"))
            place_sim = token_similarity(place_name, osm["name"]) if place_name else 0
            same_region = bool(public.get("sigungu") and public.get("sigungu") == osm.get("sigungu"))
            generic = is_generic_name(public["name"], public.get("name_generated")) or is_generic_name(osm["name"], osm.get("name_generated"))
            accepted, reason = False, ""
            if distance <= 15: accepted, reason = True, "<=15m"
            elif distance <= 30 and (name_sim >= 32 or place_sim >= 42 or generic or same_region): accepted, reason = True, "<=30m + compatible name/context"
            elif distance <= 50 and (name_sim >= 60 or place_sim >= 65): accepted, reason = True, "30–50m + strong name/place match"
            if accepted: candidates.append((distance, -max(name_sim, place_sim), idx, osm, name_sim, place_sim, reason))
        if candidates:
            distance, _, idx, osm, name_sim, place_sim, reason = min(candidates, key=lambda x: (x[0], x[1]))
            matched_osm.add(idx); merged_public.append(merge_rows(public, osm, distance))
            report.append({"action": "merge_public_osm", "kept_id": public["id"], "removed_id": osm["id"],
                "distance_m": round(distance, 1), "name_similarity": round(name_sim, 1),
                "place_similarity": round(place_sim, 1), "reason": reason})
        else: merged_public.append(public)
    final_rows = merged_public + [row for idx, row in enumerate(osm_rows) if idx not in matched_osm]
    for row in final_rows:
        row["source_ids"] = json_text(row.get("source_ids") or [])
        row["raw_tags"] = json_text(row.get("raw_tags") or {})
        row["name_generated"] = bool(row.get("name_generated")); row["confidence"] = round(float(row.get("confidence") or 0), 2)
        row["region"] = clean(row.get("region")) or " ".join(x for x in [clean(row.get("sido")), clean(row.get("sigungu"))] if x)
        row["type"] = "실내" if row.get("indoor") is True else "야외"
        for col in FINAL_COLUMNS: row.setdefault(col, None)
    final_rows.sort(key=lambda r: (clean(r.get("sido")), clean(r.get("sigungu")), clean(r.get("name")), r["id"]))
    return final_rows, report


def sql_literal(value: Any, json_column: bool = False) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)) or value == "": return "NULL"
    if isinstance(value, bool): return "TRUE" if value else "FALSE"
    if isinstance(value, (int, np.integer)): return str(int(value))
    if isinstance(value, (float, np.floating)): return repr(float(value))
    text = str(value).replace("'", "''"); suffix = "::jsonb" if json_column else ""
    return f"'{text}'{suffix}"


def write_schema_migration(path: Path) -> None:
    sql = r'''-- RankBall nationwide court catalog: extend the existing legacy public.courts table.
-- Do not bulk-load this catalog into public.approved_courts; that table remains for user approval requests.

alter table public.courts add column if not exists source_key text;
alter table public.courts add column if not exists name_generated boolean not null default false;
alter table public.courts add column if not exists sido text;
alter table public.courts add column if not exists sigungu text;
alter table public.courts add column if not exists eupmyeondong text;
alter table public.courts add column if not exists address_text text;
alter table public.courts add column if not exists road_address text;
alter table public.courts add column if not exists jibun_address text;
alter table public.courts add column if not exists lat double precision;
alter table public.courts add column if not exists lng double precision;
alter table public.courts add column if not exists indoor boolean;
alter table public.courts add column if not exists venue_type text;
alter table public.courts add column if not exists court_layout text;
alter table public.courts add column if not exists hoop_count integer;
alter table public.courts add column if not exists surface_type text;
alter table public.courts add column if not exists lighting boolean;
alter table public.courts add column if not exists paid boolean;
alter table public.courts add column if not exists opening_hours text;
alter table public.courts add column if not exists application_method text;
alter table public.courts add column if not exists phone text;
alter table public.courts add column if not exists website text;
alter table public.courts add column if not exists operator_name text;
alter table public.courts add column if not exists access_type text;
alter table public.courts add column if not exists access_reason text;
alter table public.courts add column if not exists status text not null default 'active';
alter table public.courts add column if not exists confidence numeric(4,2);
alter table public.courts add column if not exists source_primary text;
alter table public.courts add column if not exists source_ids jsonb not null default '[]'::jsonb;
alter table public.courts add column if not exists source_license text;
alter table public.courts add column if not exists source_updated_at date;
alter table public.courts add column if not exists dedupe_group_id text;
alter table public.courts add column if not exists dedupe_distance_m numeric(8,2);
alter table public.courts add column if not exists raw_tags jsonb not null default '{}'::jsonb;
alter table public.courts add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'courts_access_type_check' and conrelid = 'public.courts'::regclass) then
    alter table public.courts add constraint courts_access_type_check check (access_type is null or access_type in ('public','conditional','restricted','unknown'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courts_venue_type_check' and conrelid = 'public.courts'::regclass) then
    alter table public.courts add constraint courts_venue_type_check check (venue_type is null or venue_type in ('park','public_facility','school','apartment','sports_center','private','unknown'));
  end if;
end;
$$;
create unique index if not exists courts_source_key_unique on public.courts (source_key) where source_key is not null;
create index if not exists courts_region_access_idx on public.courts (sido, sigungu, access_type, status);
create index if not exists courts_lat_lng_idx on public.courts (lat, lng) where lat is not null and lng is not null;
create index if not exists courts_source_primary_idx on public.courts (source_primary);
'''
    path.write_text(sql, encoding="utf-8")


def write_upsert_sql(rows: list[dict[str, Any]], path: Path, batch_size: int = 200) -> None:
    cols = FINAL_COLUMNS; json_cols = {"source_ids", "raw_tags"}; update_cols = [c for c in cols if c not in {"id", "source_key"}]
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("-- Run rankball_courts_schema_migration.sql first.\nbegin;\n")
        for start in range(0, len(rows), batch_size):
            batch = rows[start:start + batch_size]
            handle.write(f"\ninsert into public.courts ({', '.join(cols)}) values\n")
            value_lines = []
            for row in batch:
                values = [sql_literal(row.get(col), col in json_cols) for col in cols]
                value_lines.append("  (" + ", ".join(values) + ")")
            handle.write(",\n".join(value_lines)); handle.write("\non conflict (source_key) do update set\n  ")
            handle.write(",\n  ".join(f"{col} = excluded.{col}" for col in update_cols)); handle.write(";\n")
        handle.write("\ncommit;\n")


def write_outputs(rows: list[dict[str, Any]], report: list[dict[str, Any]], osm_meta: dict[str, Any]) -> dict[str, Any]:
    df = pd.DataFrame(rows, columns=FINAL_COLUMNS)
    df.to_csv(OUT / "rankball_korea_courts.csv", index=False, encoding="utf-8-sig", quoting=csv.QUOTE_MINIMAL)
    restricted = df[df["access_type"] == "restricted"].copy()
    restricted.to_csv(OUT / "rankball_korea_courts_restricted.csv", index=False, encoding="utf-8-sig")
    report_df = pd.DataFrame(report); report_df.to_csv(OUT / "rankball_korea_courts_dedupe_report.csv", index=False, encoding="utf-8-sig")
    region_dir = OUT / "by_sido"; region_dir.mkdir(exist_ok=True)
    for sido, group in df.groupby(df["sido"].fillna("").replace("", "미분류")):
        slug = re.sub(r"[^0-9A-Za-z가-힣]+", "_", clean(sido)).strip("_") or "미분류"
        group.to_csv(region_dir / f"{slug}.csv", index=False, encoding="utf-8-sig")
    write_schema_migration(OUT / "rankball_courts_schema_migration.sql")
    write_upsert_sql(rows, OUT / "rankball_courts_upsert.sql")
    geojson = {"type": "FeatureCollection", "name": "rankball_korea_courts", "features": [],
        "attribution": "Contains information from OpenStreetMap, available under ODbL 1.0; public-facility data from data.go.kr providers."}
    for row in rows:
        props = {k: row.get(k) for k in FINAL_COLUMNS if k not in {"lat", "lng", "raw_tags"}}
        props["raw_tags"] = json.loads(row["raw_tags"]) if row.get("raw_tags") else {}
        geojson["features"].append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [row["lng"], row["lat"]]}, "properties": props})
    (OUT / "rankball_korea_courts.geojson").write_text(json.dumps(geojson, ensure_ascii=False), encoding="utf-8")
    counts_source = Counter(df["source_primary"].fillna("")); counts_access = Counter(df["access_type"].fillna(""))
    counts_venue = Counter(df["venue_type"].fillna("")); counts_sido = Counter(df["sido"].fillna("미분류").replace("", "미분류"))
    summary = {"build_at": BUILD_AT, "total_courts": len(df), "restricted_courts": len(restricted),
        "school_restricted": int(((df["venue_type"] == "school") & (df["access_type"] == "restricted")).sum()),
        "apartment_restricted": int(((df["venue_type"] == "apartment") & (df["access_type"] == "restricted")).sum()),
        "dedupe_actions": len(report_df), "by_source": dict(counts_source), "by_access": dict(counts_access),
        "by_venue": dict(counts_venue), "by_sido": dict(sorted(counts_sido.items())),
        "source_meta": SOURCE_META, "osm_meta": osm_meta, "errors": ERRORS,
        "coverage_note": "공공데이터포털 전국공공시설개방정보표준데이터와 OpenStreetMap 등록 객체의 합집합. 미등록·폐쇄·철거·접근정책 변경은 자동으로 완전 반영되지 않음.",
        "dedupe_rule": "동일 소스는 동일 이름+8m 이내만 병합. 공공데이터↔OSM은 15m 이내 자동, 15–30m는 이름/맥락 호환, 30–50m는 강한 이름/장소 일치일 때만 병합."}
    (OUT / "rankball_korea_courts_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main() -> int:
    log("Korea court catalog build started")
    public_path = download_public_data_csv(); public_rows = parse_public_rows(public_path)
    osm_courts: list[dict[str, Any]] = []; osm_contexts: list[dict[str, Any]] = []; osm_meta: dict[str, Any] = {}
    try:
        osm_courts, osm_contexts, osm_meta = fetch_osm_elements()
        (RAW / "osm_courts.json").write_text(json.dumps(osm_courts, ensure_ascii=False), encoding="utf-8")
        (RAW / "osm_contexts.json").write_text(json.dumps(osm_contexts, ensure_ascii=False), encoding="utf-8")
    except Exception as exc: record_error("osm.fetch", exc)
    osm_rows = parse_osm_rows(osm_courts, osm_contexts) if osm_courts else []
    combined = assign_admin_areas(public_rows + osm_rows)
    public_rows = [r for r in combined if r["source_primary"] == "public_data_portal"]
    osm_rows = [r for r in combined if r["source_primary"] == "openstreetmap"]
    rows, report = dedupe_rows(public_rows, osm_rows); write_outputs(rows, report, osm_meta)
    (OUT / "build.log").write_text("\n".join(LOGS) + "\n", encoding="utf-8")
    status = {"ok": bool(rows) and not any(e["stage"] == "osm.fetch" for e in ERRORS), "build_at": BUILD_AT,
        "total_courts": len(rows), "public_rows": len(public_rows), "osm_rows": len(osm_rows), "errors": ERRORS,
        "summary_file": "rankball_korea_courts_summary.json"}
    (OUT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"Build completed: {len(rows):,} courts")
    return 0 if rows else 2


if __name__ == "__main__":
    try: raise SystemExit(main())
    except SystemExit: raise
    except Exception as exc:
        record_error("main", exc)
        (OUT / "build.log").write_text("\n".join(LOGS) + "\n", encoding="utf-8")
        (OUT / "status.json").write_text(json.dumps({"ok": False, "errors": ERRORS}, ensure_ascii=False, indent=2), encoding="utf-8")
        raise
