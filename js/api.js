// api.js
// 한마디로 흐름은 api.js: 서버에 직접 요청을 보내고, 데이터를 무사히 받아올 때 까지
// (await)가 데이터 배열을 통째로 배달해주는 역할

// -------------------------------------------------------------
// [1] 하단 통계 데이터 조회
//- 지정된 기간(시작일~종료일) 동안의 유기동물 구조 및 통계 데이터를 공공데이터 API로부터 받아옴
// -------------------------------------------------------------
async function fetchAnimalStats() {
  // 날짜를 YYYYMMDD 문자열로 변환하는 헬퍼
  const format = (d) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  // 종료일: 오늘
  const end = new Date();
  const endde = format(end);

  // 시작일: 오늘로부터 3개월 전 (필요에 따라 조정 가능)
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  const bgnde = format(start);

  // numOfRows 기본값(10)이면 chart1 6개 항목이 잘려서 넉넉히 50
  const url = `${STATS_API_URL}?serviceKey=${encodeURIComponent(API_KEY)}&bgnde=${bgnde}&endde=${endde}&numOfRows=50&_type=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP 에러 발생! 상태 코드: ${response.status}`);
    }
    const data = await response.json();
    return data?.response?.body?.items?.item || [];
  } catch (error) {
    console.error("API 요청 실패:", error);
    return [];
  }
}

/**
 * [3] 유기동물 목록 조회 함수 (가장 핵심)
 * - 전국의 보호 동물 리스트를 가져오는 메인 API 함수.
 * - 기본값인 10개만 가져오면 지역 필터링 시 데이터가 부족하므로, numOfRows=200을 주어 데이터 풀을 넓힘.
 */
async function fetchAnimalsList() {
  const url = `${RESCUEANIMAL_API_URL}?serviceKey=${encodeURIComponent(API_KEY)}&numOfRows=200&_type=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP 에러 발생! 상태 코드: ${response.status}`);
    }
    const data = await response.json();

    // 공공데이터 응답 구조에 따라 경로 확인 필요 (보통 response.body.items.item)
    return data?.response?.body?.items?.item || [];
  } catch (error) {
    console.error("유기동물 API 요청 실패:", error);
    return [];
  }
}

/**
 * [4] 유기동물 보호소 데이터 조회 함수
 * - filters 객체로 지역(upr_cd), 시군구(org_cd), 축종(upkind) 등을 동적으로 받음.
 */
async function fetchProtectData(filters = {}) {
  // 1. 유기동물 조회 서비스 정식 엔드포인트 URL
  const baseUrl =
    "https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2";

  // 2. 기본 필수 파라미터 조합 (서비스키 및 응답 타입)
  const numOfRows = filters.numOfRows || 500;
  let url = `${baseUrl}?serviceKey=${encodeURIComponent(API_KEY)}&numOfRows=${numOfRows}&_type=json`;

  // 3. 전달받은 필터 값이 있다면 동적으로 URL에 추가
  if (filters.uprCd) url += `&upr_cd=${filters.uprCd}`;
  if (filters.orgCd) url += `&org_cd=${filters.orgCd}`;
  if (filters.upKind) url += `&upkind=${filters.upKind}`;
  if (filters.state && filters.state !== "전체")
    url += `&state=${filters.state}`;
  if (filters.bgnde) url += `&bgnde=${filters.bgnde}`;
  if (filters.endde) url += `&endde=${filters.endde}`;
  if (filters.sexCd && filters.sexCd !== "전체")
    url += `&sex_cd=${filters.sexCd}`;
  if (filters.neuterYn && filters.neuterYn !== "전체")
    url += `&neuter_yn=${filters.neuterYn}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP 에러 발생! 상태 코드: ${response.status}`);
    }

    const data = await response.json();

    // 4. 공공 API 응답 구조 안전하게 파싱 (items.item 또는 배열 체크)
    const body = data?.response?.body;
    const items = body?.items;

    if (items && Array.isArray(items.item)) {
      return items.item; // 정상적인 배열 데이터 반환
    } else if (Array.isArray(items)) {
      return items;
    } else if (items?.item) {
      return [items.item]; // 데이터가 1건이라 객체로 오는 경우 배열로 감싸서 반환
    }

    return [];
  } catch (error) {
    console.error("유기동물 API 요청 실패:", error);
    return [];
  }
}
