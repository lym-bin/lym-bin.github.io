// api/lost.js
// 0단계 확인용: 분실동물 API 응답의 "필드 이름"만 돌려준다 (값은 안 보냄 → 개인정보 노출 없음)
export async function GET() {
  const key = process.env.LOST_API_KEY; // Vercel 환경변수 이름 (3단계에서 같은 이름으로 등록)
  const url =
    "https://apis.data.go.kr/1543061/lossInfoService/lossInfo" +
    `?serviceKey=${encodeURIComponent(key)}` +
    "&bgnde=20261019&ended=20261119&numOfRows=3&pageNo=1&_type=json";

  try {
    const response = await fetch(url);
    const text = await response.text(); // 키 오류면 JSON이 아닐 수 있어서 글자로 먼저 받음
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({
        ok: false,
        status: response.status,
        note: "JSON 아님",
      });
    }
    // 오늘 api.js에서 쓴 것과 같은 꺼내기
    const items = data?.response?.body?.items?.item || [];
    const first = Array.isArray(items) ? items[0] : items; // 1건이면 배열이 아닐 수 있음
    return Response.json({
      ok: true,
      errMsg: data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg,
      totalCount: data?.response?.body?.totalCount,
      fields: first ? Object.keys(first) : [], // 객체의 "키 이름만" 배열로 (값은 X)
    });
  } catch (error) {
    return Response.json(
      { ok: false, message: String(error) },
      { status: 502 },
    );
  }
}
