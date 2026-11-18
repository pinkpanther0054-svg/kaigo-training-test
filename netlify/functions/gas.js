
exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Allow": "GET"
      },
      body: JSON.stringify({
        ok: false,
        error: "Method Not Allowed"
      })
    };
  }

  const GAS_URL = "https://script.google.com/macros/s/AKfycbya9RPyAa-OhsIPo59X5qvO-IPO_K6U1PVCkBOMz6ii1hpwbn_Y1Gu1rK9eMh7rCTIDCA/exec";
  const params = new URLSearchParams(event.queryStringParameters || {});
  const callback = params.get("callback") || "";

  try {
    const target = GAS_URL + "?" + params.toString();
    const upstream = await fetch(target, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "text/javascript, application/javascript, application/json, text/plain, */*"
      }
    });

    const body = await upstream.text();

    if (!upstream.ok) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({
          ok: false,
          error: "GAS応答エラー",
          status: upstream.status
        })
      };
    }

    let jsonText = body.trim();

    if (callback) {
      const prefix = callback + "(";

      if (!jsonText.startsWith(prefix) || !jsonText.endsWith(");")) {
        return {
          statusCode: 502,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
          },
          body: JSON.stringify({
            ok: false,
            error: "GAS応答形式を確認できません"
          })
        };
      }

      jsonText = jsonText.slice(prefix.length, -2);
    }

    const data = JSON.parse(jsonText);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: callback
        ? callback + "(" + JSON.stringify(data) + ");"
        : JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        ok: false,
        error: "中継処理でエラーが発生しました"
      })
    };
  }
};
