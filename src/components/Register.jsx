import { useEffect, useRef, useState } from "react";
import { C, G, SH1, SH2 } from "../theme";
import { Frog, Btn, Dots, Slide, Tag, Dot } from "./common";
import { PROPERTY_TYPE_GROUPS, REGISTER_DEAL_OPTIONS_BY_PROP, RIGHTS_PROP_TYPES, normalizePropType } from "../data/data";

const POSTCODE_SCRIPT_URL = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
const getPostcode = () => window.daum?.Postcode || window.kakao?.Postcode;
const SIDO_LABELS = {
  서울: "서울특별시",
  부산: "부산광역시",
  대구: "대구광역시",
  인천: "인천광역시",
  광주: "광주광역시",
  대전: "대전광역시",
  울산: "울산광역시",
  세종: "세종특별자치시",
  경기: "경기도",
  강원: "강원특별자치도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전북특별자치도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주특별자치도",
};
const loadPostcodeScript = () => new Promise((resolve, reject) => {
  if (typeof window === "undefined") return reject(new Error("window unavailable"));
  if (getPostcode()) return resolve(getPostcode());
  const current = document.querySelector(`script[src="${POSTCODE_SCRIPT_URL}"]`);
  if (current) {
    current.addEventListener("load", () => resolve(getPostcode()), { once: true });
    current.addEventListener("error", reject, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = POSTCODE_SCRIPT_URL;
  script.async = true;
  script.onload = () => resolve(getPostcode());
  script.onerror = reject;
  document.head.appendChild(script);
});

const normalizeSido = value => SIDO_LABELS[value] || value || "";
const pickCity = data => normalizeSido(data.sido || (data.address || data.roadAddress || data.jibunAddress || "").split(" ")[0] || "");
const pickRegion = data => data.sigungu || (data.address || data.roadAddress || data.jibunAddress || "").match(/(\S+(구|시|군))/)?.[1] || "";
const pickDong = data => data.bname || (data.jibunAddress || data.address || "").match(/(\S+(동|읍|면|가))/)?.[1] || "";
const pickComplex = data => data.buildingName || (data.apartment === "Y" ? data.roadname : "") || "";
const fullAddress = (base, detail) => [base, detail].filter(Boolean).join(" ");
const expandSidoInAddress = (address, city) => {
  if (!address || !city) return address || "";
  const shortCity = Object.keys(SIDO_LABELS).find(key => SIDO_LABELS[key] === city);
  return shortCity && address.startsWith(`${shortCity} `) ? address.replace(shortCity, city) : address;
};

export function Register({ onDone, onClose, onBack }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState({ propType:"", dealType:"", deposit:"", monthly:"", premium:"", address:"", detailAddress:"", zonecode:"", roadAddress:"", jibunAddress:"", city:"", region:"", dong:"", complex:"", supplyArea:"", exclusiveArea:"", area:"", floor:"", totalFloor:"", roomCount:"", bathCount:"", direction:"", duplex:"", moveInDate:"", loan:"", maintenance:"", parking:"", special:"", description:"", tenant:"", tenantEnd:"", tenantDeposit:"", tenantMonthly:"", tenantMemo:"", feeRate:0.4, fastMode:null, directMode:false, certified:false });
  const [cs, setCs] = useState(0);
  const [code, setCode] = useState("");
  const [addressError, setAddressError] = useState("");
  const submitted = useRef(false);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const TOTAL = 10;
  const next = () => { setDir(1); setStep(s => s + 1); };
  const back = () => { if (step === 0) return onBack(); setDir(-1); setStep(s => s - 1); };
  const dealOptions = REGISTER_DEAL_OPTIONS_BY_PROP[d.propType] || [];
  const selectPropType = propType => {
    const nextDeal = (REGISTER_DEAL_OPTIONS_BY_PROP[propType] || [])[0]?.[0] || "";
    setD(p => ({ ...p, propType, dealType: nextDeal, deposit: "", monthly: "", premium: "" }));
    setTimeout(next, 160);
  };
  const selectDealType = dealType => {
    setD(p => ({ ...p, dealType, deposit: "", monthly: "", premium: "" }));
    setTimeout(next, 160);
  };
  useEffect(() => {
    loadPostcodeScript().catch(() => {});
  }, []);
  const openAddressSearch = async () => {
    setAddressError("");
    try {
      const Postcode = await loadPostcodeScript();
      new Postcode({
        oncomplete: data => {
          const city = pickCity(data);
          const baseAddress = expandSidoInAddress(data.roadAddress || data.jibunAddress || data.address || "", city);
          setD(p => ({
            ...p,
            address: baseAddress,
            detailAddress: "",
            zonecode: data.zonecode || "",
            roadAddress: data.roadAddress || "",
            jibunAddress: data.jibunAddress || "",
            city,
            region: pickRegion(data),
            dong: pickDong(data),
            complex: pickComplex(data),
          }));
        },
      }).open({ q: d.address || undefined, popupTitle: "주소 찾기" });
    } catch {
      setAddressError("주소검색을 불러오지 못했어요. 직접 입력해 주세요.");
    }
  };
  // 만원 단위 숫자 → "12억 5,000만원" 형태
  const formatMan = man => {
    const n = parseInt(man, 10);
    if (!n) return "";
    const eok = Math.floor(n / 10000);
    const rest = n % 10000;
    if (eok > 0) return `${eok}억${rest > 0 ? ` ${rest.toLocaleString()}만` : ""}원`;
    return `${n.toLocaleString()}만원`;
  };
  const depositNum = parseInt(d.deposit, 10) || 0;
  const monthlyNum = parseInt(d.monthly, 10) || 0;
  const premiumNum = parseInt(d.premium, 10) || 0;
  // 권리성 상품은 거래금액 = 권리가/분양가 + 프리미엄
  const isRights = RIGHTS_PROP_TYPES.includes(d.propType);
  const isLand = d.propType === "토지";
  const isCommercialLease = ["상가", "상가주택", "사무실", "건물", "공장/창고", "지식산업센터"].includes(d.propType) && d.dealType === "임대";
  const isMonthlyLike = d.dealType === "월세" || isCommercialLease;
  const rightsBaseLabel = d.propType.includes("분양권") ? "분양가" : "권리가";
  const rightsTotal = depositNum + premiumNum;
  // 가격 입력 미리보기
  const pricePreview = !d.deposit ? "" :
    isRights ? (premiumNum ? `${rightsBaseLabel} ${formatMan(d.deposit)} + P ${formatMan(d.premium)} = 총 ${formatMan(String(rightsTotal))}` : `${rightsBaseLabel} ${formatMan(d.deposit)}`) :
    isCommercialLease ? `보증금 ${formatMan(d.deposit)}${monthlyNum ? ` / 월 ${monthlyNum}만원` : ""}${premiumNum ? ` / 권리금 ${formatMan(d.premium)}` : ""}` :
    d.dealType === "월세" ? (monthlyNum ? `보증금 ${formatMan(d.deposit)} / 월 ${monthlyNum}만원` : `보증금 ${formatMan(d.deposit)}`) :
    isLand ? `토지 매매가 ${formatMan(d.deposit)}` :
    formatMan(d.deposit);
  const isBasicInfoReady = d.address && d.supplyArea && d.exclusiveArea && d.floor && d.totalFloor && d.roomCount && d.bathCount && d.direction;
  const isDetailInfoReady = !!d.moveInDate;
  // 수수료 산정 기준액(만원): 월세/상가임대는 환산보증금, 권리성 상품은 권리가+프리미엄
  const feeBaseMan = isRights ? rightsTotal : (isMonthlyLike ? depositNum + monthlyNum * 100 : depositNum);
  const estFeeWon = Math.round(feeBaseMan * 10000 * (d.feeRate / 100));
  // 원 → "약 OO만원 / O억 O만원"
  const wonShort = n => n >= 1e8 ? `${Math.floor(n/1e8)}억${Math.round((n%1e8)/1e4) > 0 ? ` ${Math.round((n%1e8)/1e4).toLocaleString()}만` : ""}원` : n >= 1e4 ? `${Math.round(n/1e4).toLocaleString()}만원` : `${n.toLocaleString()}원`;
  // 입력값 → PROPERTIES 형식의 매물 객체로 변환
  const buildListing = () => {
    // 주소에서 "OO구" 추출 (없으면 마포구 기본)
    const regionMatch = d.region || (d.address.match(/(\S+(구|시|군))/) || [])[1] || "기타";
    const dongMatch = d.dong || (d.address.match(/(\S+(동|읍|면|가))/) || [])[1] || "";
    // price 문자열: 매매/전세/토지는 만원→억/만 표기, 월세/상가임대는 "보증금/월세만", 권리성 상품은 총액
    const manToPrice = man => { const n=parseInt(man,10)||0; const eok=Math.floor(n/10000); const rest=n%10000; return eok>0?`${eok}억${rest>0?` ${rest.toLocaleString()}만`:""}`:`${n.toLocaleString()}만`; };
    const priceStr = isRights ? manToPrice(String(rightsTotal)) : (isMonthlyLike ? `${depositNum.toLocaleString()}/${monthlyNum}만${isCommercialLease && premiumNum ? ` 권리금 ${manToPrice(d.premium)}` : ""}` : manToPrice(d.deposit));
    const doneLabelMap = { "매매":"매도완료", "전세":"전세완료", "월세":"임대완료", "임대":"임대완료", "권리양도":"양도완료", "전매":"전매완료" };
    return {
      id: "u" + Date.now(),
      region: regionMatch, dong: dongMatch,
      address: fullAddress(d.address, d.detailAddress),
      detailAddress: d.detailAddress,
      zonecode: d.zonecode,
      roadAddress: d.roadAddress,
      jibunAddress: d.jibunAddress,
      complex: d.complex || d.address.split(" ").slice(-1)[0] || "새 매물",
      propType: normalizePropType(d.propType),
      dealType: d.dealType,
      price: priceStr, priceNum: isRights ? rightsTotal : depositNum,
      premium: (isRights || isCommercialLease) ? premiumNum : null,
      supplyArea: parseInt(d.supplyArea, 10) || null,
      exclusiveArea: parseInt(d.exclusiveArea, 10) || null,
      area: parseInt(d.exclusiveArea || d.area, 10) || 84,
      floor: parseInt(d.floor, 10) || 1,
      totalFloor: parseInt(d.totalFloor, 10) || null,
      roomCount: parseInt(d.roomCount, 10) || null,
      bathCount: parseInt(d.bathCount, 10) || null,
      fee: d.feeRate + "%", fast: !!d.fastMode,
      views: 0, ago: "방금 전",
      updatedAgo: "방금 전",
      updatedReason: "최초 등록",
      x: 50, y: 50, badge: "NEW",
      status: "active", doneLabel: doneLabelMap[d.dealType] || "거래완료", completedDaysAgo: null,
      createdDaysAgo: 0,
      priceHistory: [{ date: "2026-05-27", priceNum: isRights ? rightsTotal : depositNum, reason: "최초 등록" }],
      expiresInDays: 14, // 의뢰 기한: 기본 2주
      direction: d.direction,
      duplex: d.duplex,
      moveInDate: d.moveInDate,
      loan: d.loan,
      maintenance: d.maintenance,
      parking: d.parking,
      special: d.special,
      description: d.description,
      tenant: d.tenant,
      tenantEnd: d.tenantEnd,
      tenantDeposit: d.tenantDeposit,
      tenantMonthly: d.tenantMonthly,
      tenantMemo: d.tenantMemo,
    };
  };
  // 완료 스텝 진입 시 매물 1회 등록
  useEffect(() => {
    if (step === 10 && !submitted.current) { submitted.current = true; onDone && onDone(buildListing()); }
  }, [step]);
  const moods = ["calm","pondering","determined","pondering","pondering","pondering","calm","pondering","determined","calm","excited"];
  const titles = ["어떤 매물인가요?","어떤 거래를 원하세요?","희망 금액을 입력하세요","매물 주소를 알려주세요","세부 정보를 입력해 주세요","임차인이 있나요?","사진을 등록해 주세요","수수료 상한을 설정하세요","의뢰 방식을 골라주세요","소유자 인증","등록 완료!"];
  const subs = ["누르면 바로 넘어가요","누르면 바로 넘어가요","수수료 계산의 기준이 돼요","주소 찾기 후 상세주소","중개사들이 궁금해해요","정확할수록 빠른 거래","많을수록 문의가 늘어요","높을수록 적극적으로","소유주가 직접 선택","허위매물 방지 필수","전국 중개사에게 발송!"];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: G.pageBg }}>
      <div style={{ padding: "46px 20px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={back} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 900, cursor: "pointer", color: C.mid, padding: 0, fontFamily: "inherit" }}>← 이전</button>
          <div style={{ flex: 1 }}><Dots total={TOTAL} current={step}/></div>
          <div style={{ fontSize: 12, color: C.gray }}>{step+1}/{TOTAL}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 24px 24px", scrollbarWidth: "none" }}>
        <Slide k={step} dir={dir}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <Frog mood={moods[step]} size={70} animate/>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: C.dark, lineHeight: 1.25 }}>{titles[step]}</div><div style={{ fontSize: 13, color: C.gray, marginTop: 3 }}>{subs[step]}</div></div>
          </div>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {PROPERTY_TYPE_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: C.mid, margin: "0 0 7px 2px" }}>{group.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {group.types.map(({ value: t, description: ds }) => (
                      <div key={t} onClick={() => selectPropType(t)} style={{ padding: "15px 10px", borderRadius: 18, border: `2px solid ${d.propType===t?C.green:C.line}`, background: d.propType===t?G.greenSoft:G.card, textAlign: "center", cursor: "pointer", transition: "all .15s", boxShadow: d.propType===t?"none":SH2 }}>
                        <div style={{ fontSize: 14, fontWeight: d.propType===t?700:500, color: d.propType===t?C.greenInk:C.dark, lineHeight: 1.25 }}>{t}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{ds}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dealOptions.map(([k, ds]) => (
                <div key={k} onClick={() => selectDealType(k)} style={{ padding: "18px 20px", borderRadius: 18, border: `2px solid ${d.dealType===k?C.green:C.line}`, background: d.dealType===k?G.greenSoft:G.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all .15s", boxShadow: d.dealType===k?"none":SH2 }}>
                  <Dot color={d.dealType===k?C.green:C.line} size={12}/>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: d.dealType===k?C.greenInk:C.dark }}>{k}</div><div style={{ fontSize: 12, color: C.gray }}>{ds}</div></div>
                </div>
              ))}
              {!dealOptions.length && <div style={{ fontSize: 14, color: C.gray, textAlign: "center", padding: "20px 0" }}>먼저 매물 종류를 선택해 주세요</div>}
            </div>
          )}
          {step === 2 && (
            <>
              {isRights && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>{rightsBaseLabel}</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 80000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>프리미엄 (웃돈)</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 15000 (마이너스P는 0)" value={d.premium} onChange={e => set("premium", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 5 }}>프리미엄이 없으면 0, 마이너스 프리미엄도 0으로 입력하고 메모에 적어주세요</div>
                  </div>
                </>
              )}
              {!isRights && (d.dealType === "매매" || d.dealType === "전세") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>{isLand ? "토지 매매가" : d.dealType === "매매" ? `${d.propType} 매매가` : "전세 보증금"}</div>
                  <div style={{ position: "relative" }}>
                    <input inputMode="numeric" placeholder="예: 125000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                    <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                  </div>
                </div>
              )}
              {!isRights && isCommercialLease && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>임대 보증금</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 5000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>월 임대료</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 250" value={d.monthly} onChange={e => set("monthly", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>권리금 (선택)</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 3000" value={d.premium} onChange={e => set("premium", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                </>
              )}
              {!isRights && d.dealType === "월세" && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>보증금</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 2000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>월세</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 76" value={d.monthly} onChange={e => set("monthly", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                </>
              )}
              {!d.dealType && !isRights && <div style={{ fontSize: 14, color: C.gray, textAlign: "center", padding: "20px 0" }}>먼저 거래 유형을 선택해 주세요</div>}
              {pricePreview && <div style={{ background: G.greenSoft, borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: C.greenInk, fontWeight: 700, textAlign: "center" }}>{pricePreview}</div>}
              <Btn onClick={next} disabled={!d.deposit || (!isRights && isMonthlyLike && !d.monthly)}>다음</Btn>
            </>
          )}
          {step === 3 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
                <input placeholder="주소 찾기로 선택" value={d.address} readOnly autoFocus style={{ width: "100%", padding: 16, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8faf7", color: d.address ? C.dark : C.gray, cursor: "default" }}/>
                <button onClick={openAddressSearch} style={{ border: "none", background: G.header, color: "#fff", borderRadius: 16, padding: "0 14px", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>주소 찾기</button>
              </div>
              <input placeholder="상세주소 (동/호수, 층, 참고사항)" value={d.detailAddress} onChange={e => set("detailAddress", e.target.value)} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10, background: "#fff" }}/>
              {(d.region || d.dong || d.complex || d.zonecode) && (
                <div style={{ background: G.greenSoft, borderRadius: 14, padding: "10px 12px", marginBottom: 10, fontSize: 12, color: C.greenInk, fontWeight: 800, lineHeight: 1.5 }}>
                  {d.zonecode && <span>{d.zonecode} · </span>}{[d.city, d.region, d.dong].filter(Boolean).join(" ") || "지역 미분류"}{d.complex ? ` · ${d.complex}` : ""}
                </div>
              )}
              {addressError && <div style={{ fontSize: 11, color: C.goldInk, margin: "0 0 10px 2px" }}>{addressError}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[["공급면적㎡*","supplyArea"],["전용면적㎡*","exclusiveArea"],["해당층*","floor"],["총층*","totalFloor"],["방수*","roomCount"],["욕실수*","bathCount"]].map(([ph, k]) => (
                  <input key={k} inputMode="numeric" placeholder={ph} value={d[k]} onChange={e => set(k, e.target.value.replace(/[^0-9]/g, ""))} style={{ padding: "13px 12px", borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}/>
                ))}
              </div>
              <input placeholder="향* (예: 남향, 동향)" value={d.direction} onChange={e => set("direction", e.target.value)} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12, background: "#fff" }}/>
              <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.6, marginBottom: 14 }}>* 표시 항목은 매물 비교에 필요해서 필수예요. 모르면 대략 입력 후 상세 설명에 적어주세요.</div>
              <Btn onClick={next} disabled={!isBasicInfoReady}>다음</Btn>
            </>
          )}
          {step === 4 && (
            <>
              {[["입주가능일*","moveInDate","예: 즉시입주, 2026년 8월"],["관리비(월)","maintenance","예: 15만원"],["융자금","loan","예: 없음, 2억"],["주차","parking","예: 1대 가능"],["복층 여부","duplex","예: 단층, 복층"],["특이사항","special","예: 풀옵션, 리모델링"]].map(([l, k, ph]) => (
                <div key={k} style={{ marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>{l}</div><input placeholder={ph} value={d[k]} onChange={e => set(k, e.target.value)} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/></div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>상세 설명</div>
                <textarea placeholder="예: 채광 좋음, 누수 없음, 입주 협의 가능, 최근 수리 내역" value={d.description} onChange={e => set("description", e.target.value)} rows={4} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", resize: "none", lineHeight: 1.6 }}/>
              </div>
              <Btn onClick={next} disabled={!isDetailInfoReady}>다음</Btn>
            </>
          )}
          {step === 5 && (
            <>
              {["없어요 (공실)","있어요","내가 살고 있어요"].map(o => (
                <div key={o} onClick={() => { set("tenant", o); if (o !== "있어요") setTimeout(next, 160); }} style={{ padding: "18px 20px", borderRadius: 18, border: `2px solid ${d.tenant===o?C.green:C.line}`, background: d.tenant===o?G.greenSoft:G.card, cursor: "pointer", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all .15s", boxShadow: d.tenant===o?"none":SH2 }}>
                  <span style={{ fontSize: 15, fontWeight: d.tenant===o?700:500, color: d.tenant===o?C.greenInk:C.dark }}>{o}</span>
                  {d.tenant===o && <span style={{ color: C.green, fontSize: 18 }}>✓</span>}
                </div>
              ))}
              {d.tenant === "있어요" && (
                <div style={{ background: G.greenSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input inputMode="numeric" placeholder="보증금 만원" value={d.tenantDeposit} onChange={e => set("tenantDeposit", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                    <input inputMode="numeric" placeholder="월세 만원" value={d.tenantMonthly} onChange={e => set("tenantMonthly", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                  </div>
                  <input placeholder="계약 만료 (예: 2026년 8월)" value={d.tenantEnd} onChange={e => set("tenantEnd", e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8, background: "#fff" }}/>
                  <input placeholder="임차인 협의사항 (예: 만기 전 퇴거 협의 가능)" value={d.tenantMemo} onChange={e => set("tenantMemo", e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8, background: "#fff" }}/>
                  <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>계약 만료 전 매도 시 임차인 권리가 승계됩니다.</div>
                  <Btn onClick={next} style={{ marginTop: 12 }}>다음</Btn>
                </div>
              )}
            </>
          )}
          {step === 6 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {["거실","주방","안방","욕실","외관","뷰"].map(l => (
                  <div key={l} style={{ aspectRatio: "1", borderRadius: 16, border: `2px dashed ${C.mint}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: G.greenSoft, gap: 6 }}>
                    <div style={{ width: 24, height: 18, borderRadius: 4, border: `2px solid ${C.green}`, position: "relative" }}><div style={{ width: 6, height: 6, borderRadius: 3, background: C.green, position: "absolute", top: 3, right: 3 }}/></div>
                    <span style={{ fontSize: 11, color: C.mid }}>{l}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={next}>다음</Btn>
              <button onClick={next} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>나중에 추가할게요</button>
            </>
          )}
          {step === 7 && (
            <>
              <div style={{ background: G.card, borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: SH1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.mid }}>최대 수수료</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: C.greenInk }}>{d.feeRate}%</span>
                    {feeBaseMan > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: C.mid, marginTop: 2 }}>예상 약 {wonShort(estFeeWon)}</div>}
                  </div>
                </div>
                <input type="range" min="0.1" max="0.9" step="0.1" value={d.feeRate} onChange={e => set("feeRate", parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.green, marginBottom: 8 }}/>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 14 }}><span>0.1%</span><span>법정상한 0.9%</span></div>
                <div style={{ background: G.greenSoft, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.greenInk }}>{d.feeRate <= 0.2 ? "직거래 위주로 연결돼요" : d.feeRate <= 0.4 ? "중개사들이 관심을 가져요" : d.feeRate <= 0.6 ? "중개사들이 적극적으로 움직여요" : "빠른 거래에 유리해요"}</div>
              </div>
              {feeBaseMan > 0 && (
                <div style={{ background: G.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, fontSize: 12, color: C.mid, lineHeight: 1.7 }}>
                  {isMonthlyLike ? `환산보증금 ${feeBaseMan.toLocaleString()}만원` : `${feeBaseMan.toLocaleString()}만원`} × {d.feeRate}% = <b style={{ color: C.greenInk }}>약 {wonShort(estFeeWon)}</b>
                  <div style={{ color: C.gray, marginTop: 3 }}>중개사가 받을 수 있는 최대 보수예요{isMonthlyLike ? " · 월 임대료는 환산보증금 기준" : ""}</div>
                </div>
              )}
              <Btn onClick={next}>다음</Btn>
            </>
          )}
          {step === 8 && (
            <>
              {[
                { key: true, t: "빠른 의뢰", s: "번호 공개 · 소유주 무료", desc: "중개사나 직거래 매수자가 포인트를 내면 바로 연락처를 확인해요. 광고와 빠른 연락에 유리해요.", tone: "gold" },
                { key: false, t: "안심 의뢰", s: "승인 후 공개 · 소유주 무료", desc: "중개사와 직거래 매수자가 포인트를 먼저 쓰고 연락처 공개를 요청해요. 승인하면 확정, 거절이나 24시간 무응답이면 자동 환불돼요.", tone: "green" },
              ].map(o => {
                const col = o.tone === "gold" ? C.gold : C.green;
                const inkCol = o.tone === "gold" ? C.goldInk : C.greenInk;
                const sel = d.fastMode === o.key;
                return (
                  <div key={String(o.key)} onClick={() => { set("fastMode", o.key); setTimeout(next, 200); }} style={{ padding: 20, borderRadius: 20, border: `2px solid ${sel?col:C.line}`, background: sel ? (o.tone==="gold"?G.goldSoft:G.greenSoft) : C.card, cursor: "pointer", marginBottom: 12, transition: "all .15s", boxShadow: sel?"none":SH2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: col + "22", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 12, height: 12, borderRadius: 6, background: col }}/></div>
                      <div><div style={{ fontSize: 16, fontWeight: 800, color: sel?inkCol:C.dark }}>{o.t}</div><div style={{ fontSize: 12, color: C.gray }}>{o.s}</div></div>
                      {sel && <span style={{ marginLeft: "auto", color: inkCol, fontSize: 20 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, background: "#ffffffcc", borderRadius: 12, padding: "10px 12px" }}>{o.desc}</div>
                  </div>
                );
              })}
              <div style={{ background: G.peachSoft, borderRadius: 18, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", marginTop: 4 }}>
                <Frog mood="suspicious" size={42}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#B5654A", marginBottom: 3 }}>직거래도 함께 받을까요? <span style={{ fontSize: 11, fontWeight: 600, color: C.gray }}>(무료)</span></div>
                  <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>매수자에게도 매물을 노출해요. <b style={{ color: "#B5654A" }}>등록은 무료</b>이고, 빠른의뢰는 바로 열람, 안심의뢰는 채팅 승인 후 연락처가 공개돼요. 중개수수료 없이 거래할 수 있어요.</div>
                  <div style={{ marginTop: 8, background: "#fff7ef", border: "1px solid #F2C098", borderRadius: 12, padding: "9px 10px", fontSize: 11.5, color: "#9B5B38", lineHeight: 1.5 }}>직거래는 계약서 확인, 권리관계, 잔금 일정, 하자 분쟁을 직접 챙겨야 해서 위험할 수 있어요. 불안하면 중개사를 끼고 진행하세요.</div>
                  <div onClick={() => set("directMode", !d.directMode)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${d.directMode?C.peach:C.gray}`, background: d.directMode?C.peach:"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{d.directMode && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: d.directMode?"#B5654A":C.mid }}>직거래 매수자에게도 노출하기</span>
                  </div>
                </div>
              </div>
            </>
          )}
          {step === 9 && (
            <>
              {cs === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["등기부등본 자동 조회","공공데이터 API로 소유자 명의 자동 확인"],["휴대폰 본인인증","PASS 또는 통신사 인증"]].map(([t, ds]) => (
                    <div key={t} style={{ background: G.card, borderRadius: 18, padding: "16px 18px", border: `1.5px solid ${C.line}`, display: "flex", gap: 14, alignItems: "center", boxShadow: SH2 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: C.greenSoft, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Dot color={C.green} size={14}/></div>
                      <div><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{t}</div><div style={{ fontSize: 12, color: C.gray, marginTop: 3, lineHeight: 1.5 }}>{ds}</div></div>
                    </div>
                  ))}
                  <Btn onClick={() => setCs(1)} style={{ marginTop: 4 }}>인증 시작하기</Btn>
                </div>
              )}
              {cs === 1 && (
                <>
                  <div style={{ fontSize: 14, color: C.gray, marginBottom: 16, textAlign: "center" }}>발송된 6자리 번호를 입력하세요</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    {Array.from({ length: 6 }).map((_, i) => (<div key={i} style={{ flex: 1, height: 52, borderRadius: 14, border: `2px solid ${i<code.length?C.green:C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, background: "#fff", color: C.greenInk }}>{code[i]?"●":""}</div>))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[..."123456789"].map(n => (<button key={n} onClick={() => { if (code.length<6){ const nc=code+n; setCode(nc); if(nc.length===6) setTimeout(()=>{set("certified",true);setCs(2);},300);} }} style={{ padding: "16px 0", borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: C.dark }}>{n}</button>))}
                    <div/>
                    <button onClick={() => { if (code.length<6){ const nc=code+"0"; setCode(nc); if(nc.length===6) setTimeout(()=>{set("certified",true);setCs(2);},300);} }} style={{ padding: "16px 0", borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: C.dark }}>0</button>
                    <button onClick={() => setCode(c => c.slice(0,-1))} style={{ padding: "16px 0", borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 18, cursor: "pointer", fontFamily: "inherit", color: C.mid }}>⌫</button>
                  </div>
                </>
              )}
              {cs === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["등기부등본 소유자 일치","휴대폰 본인인증 완료","인증마크 부여 완료"].map(t => (<div key={t} style={{ background: G.greenSoft, borderRadius: 16, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}><span style={{ color: C.green, fontWeight: 900, fontSize: 16 }}>✓</span><span style={{ fontSize: 14, fontWeight: 600, color: C.greenInk }}>{t}</span></div>))}
                  <Btn onClick={next} style={{ marginTop: 4 }}>다음</Btn>
                </div>
              )}
            </>
          )}
          {step === 10 && (
            <div style={{ textAlign: "center", paddingTop: 6 }}>
              <Frog mood="excited" size={142} animate/>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginTop: 6 }}>의뢰 공개 완료!</div>
              <div style={{ fontSize: 14, color: C.gray, marginTop: 6, marginBottom: 22, lineHeight: 1.7 }}>{d.fastMode ? "빠른의뢰로" : "안심의뢰로"} 등록됐어요{d.directMode ? " · 직거래 매수자에게도 노출돼요" : ""}<br/>소유주는 등록·노출 모두 무료예요!</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
                {[["중개사","0명"],["직거래","0건"],["경과","방금"]].map(([lb, v]) => (<div key={lb} style={{ flex: 1, background: G.card, borderRadius: 18, padding: "16px 8px", boxShadow: SH2 }}><div style={{ fontSize: 18, fontWeight: 800, color: C.greenInk }}>{v}</div><div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{lb}</div></div>))}
              </div>
              <Btn onClick={onClose}>내 매물 보기</Btn>
            </div>
          )}
        </Slide>
      </div>
    </div>
  );
}

// ===== 공용 매물 데이터 (지역/종류/좌표 포함) =====
