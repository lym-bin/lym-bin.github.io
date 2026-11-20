// api/lost.js
// 분실동물 API를 서버에서 대신 불러, 화면에 필요한 필드만 골라(허용 목록) 돌려준다.
// 보호자 이름·전화(callName, callTel), 상세 위치(happenAddrDtl, happenPlace),
// 자유 입력(specialMark)은 응답에 넣지 않는다.

// 이 응답을 받아 써도 되는 페이지 출처 (배포 + 로컬 Live Server)
const ALLOWED_ORIGINS = ["https://lym-bin.github.io", "http://127.0.0.1:5500"];

// 날짜 → "YYYYMMDD"
const format = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

export async function GET(request) {
  // 1. CORS: 요청한 페이지 출처가 허용 목록에 있으면, 그 출처로 스티커를 붙임
  const origin = request.headers.get("Origin");
  const headers = { Vary: "Origin" };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  // 2. 날짜: 오늘 ~ 30일 전
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const key = process.env.LOST_API_KEY;
  const url =
    "https://apis.data.go.kr/1543061/lossInfoService/lossInfo" +
    `?serviceKey=${encodeURIComponent(key)}` +
    `&bgnde=${format(start)}&ended=${format(end)}` +
    "&numOfRows=50&pageNo=1&_type=json";

  try {
    const response = await fetch(url);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json(
        { ok: false, message: "분실동물 API 응답이 JSON이 아닙니다." },
        { status: 502, headers },
      );
    }

    // 3. 키 에러 등은 "0건"이 아니라 실패로
    const errMsg = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
    if (errMsg) {
      return Response.json(
        { ok: false, message: errMsg },
        { status: 502, headers },
      );
    }

    const raw = data?.response?.body?.items?.item || [];
    const list = Array.isArray(raw) ? raw : [raw]; // 1건이면 객체로 와서 배열로 감쌈

    // 4. 허용 목록: 화면에 필요한 필드만 새 객체로 (나머지는 여기서 버려짐)
    const items = list
      .map((item) => ({
        image: item.popfile?.replace(/^http:\/\//i, `https://`) || ``,
        kind: item.kindCd,
        color: item.colorCd,
        sex: item.sexCd,
        age: item.age,
        date: item.happenDt,
        region: item.orgNm,
      }))
      .sort((a, b) => Number(b.date) - Number(a.date)) // 최근 분실일 먼저
      .slice(0, 8);

    return Response.json({ ok: true, items }, { headers });
  } catch (error) {
    console.error("분실동물 API 요청 실패:", error); // Vercel 로그에만 남음
    return Response.json(
      { ok: false, message: "분실동물 API 요청에 실패했습니다." },
      { status: 502, headers },
    );
  }
}
