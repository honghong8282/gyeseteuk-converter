exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { passcode, original, subject, area, tone, limit } = JSON.parse(event.body);

    const SITE_PASSWORD = '16543';
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (passcode !== SITE_PASSWORD) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '비밀번호가 올바르지 않습니다.' })
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `당신은 경기도 중학교 자유학기제 통지표 작성을 도와주는 전문 보조 도구입니다.
교과세부능력특기사항(과세특) 문구를 자유학기 활동상황 통지표 형식으로 변환합니다.

변환 원칙:
1. 학생의 성장과 배움 과정을 중심으로 서술합니다.
2. 자유학기제 취지(성적 미산출, 참여·과정 중심 평가)를 반영합니다.
3. 서술형 문체로 작성하며 학생이 주체가 되는 표현을 씁니다. (~함, ~였음 등 기록체 유지)
4. 지정된 글자수 이내로 작성합니다.
5. 과도한 미사여구 없이 구체적이고 진정성 있게 씁니다.
6. 변환된 통지표 문구만 출력하세요. 설명이나 부가 내용은 절대 포함하지 마세요.`,
        messages: [{
          role: 'user',
          content: `[과목] ${subject}\n[활동영역] ${area}\n[서술 톤] ${tone}\n[글자수 제한] ${limit}자 이내\n\n[과세특 원문]\n${original}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || '변환 오류가 발생했습니다.' })
      };
    }

    const result = data.content[0].text;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
