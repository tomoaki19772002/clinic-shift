import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TO_EMAIL = "kawagoeasahi+monsin@gmail.com";

function buildPdfHtml(form: Record<string, unknown>): string {
  const arr = (v: unknown) =>
    Array.isArray(v) ? (v as string[]).join("、") || "なし" : (v as string) || "なし";

  const symptoms = [
    ...((form.symptoms as string[]) || []),
    ...((form.symptomsOther as string) ? [form.symptomsOther as string] : []),
  ];
  const pastEye = [
    ...((form.pastEyeDiseases as string[]) || []),
    ...((form.pastEyeDiseasesOther as string) ? [form.pastEyeDiseasesOther as string] : []),
  ];
  const general = [
    ...((form.generalDiseases as string[]) || []),
    ...((form.generalDiseasesOther as string) ? [form.generalDiseasesOther as string] : []),
  ];

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:8px 12px;font-weight:bold;color:#475569;background:#f8fafc;white-space:nowrap;border:1px solid #e2e8f0;width:160px">${label}</td>
      <td style="padding:8px 12px;color:#1e293b;border:1px solid #e2e8f0">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
    body { font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif; background:#fff; margin:0; padding:0; }
    .page { max-width:680px; margin:0 auto; padding:32px 24px; }
    .header { background:#0f766e; color:#fff; border-radius:8px; padding:20px 24px; margin-bottom:24px; }
    .header h1 { margin:0 0 4px; font-size:20px; font-weight:700; letter-spacing:0.08em; }
    .header p { margin:0; font-size:12px; color:#99f6e4; }
    .section-title { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:0.12em; text-transform:uppercase; margin:20px 0 8px; }
    table { width:100%; border-collapse:collapse; font-size:14px; margin-bottom:4px; }
    .footer { margin-top:32px; font-size:11px; color:#94a3b8; text-align:center; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>川越あさひ眼科　問診票</h1>
      <p>受付日時：${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
    </div>

    <div class="section-title">基本情報</div>
    <table>
      ${row("お名前", arr(form.name))}
      ${row("メールアドレス", arr(form.email))}
      ${row("性別", arr(form.gender))}
      ${row("生年月日", arr(form.birthDate))}
      ${row("住所", arr(form.address))}
      ${row("電話番号", arr(form.phone))}
    </table>

    <div class="section-title">症状</div>
    <table>
      ${row("症状のある目", arr(form.affectedEye))}
      ${row("症状", arr(symptoms))}
      ${row("症状の開始時期", arr(form.symptomOnset))}
    </table>

    <div class="section-title">眼科・病歴</div>
    <table>
      ${row("過去の目の病気", arr(pastEye))}
      ${row("通院中の眼科", arr(form.currentEyeClinic))}
      ${row("全身の病気", arr(general))}
      ${row("服薬・サプリ・目薬", arr(form.medications))}
    </table>

    <div class="section-title">その他</div>
    <table>
      ${row("アレルギー", arr(form.allergies))}
      ${row("お薬手帳", arr(form.medicationBooklet))}
      ${row("メガネ・コンタクト", arr(form.visionCorrection))}
      ${row("妊娠・授乳", arr(form.pregnancy))}
    </table>

    <div class="footer">このPDFは川越あさひ眼科の問診票システムにより自動生成されました。</div>
  </div>
</body>
</html>`;
}

function buildTextBody(form: Record<string, unknown>): string {
  const arr = (v: unknown) =>
    Array.isArray(v) ? (v as string[]).join("、") || "なし" : (v as string) || "なし";

  const symptoms = [
    ...((form.symptoms as string[]) || []),
    ...((form.symptomsOther as string) ? [form.symptomsOther as string] : []),
  ];
  const pastEye = [
    ...((form.pastEyeDiseases as string[]) || []),
    ...((form.pastEyeDiseasesOther as string) ? [form.pastEyeDiseasesOther as string] : []),
  ];
  const general = [
    ...((form.generalDiseases as string[]) || []),
    ...((form.generalDiseasesOther as string) ? [form.generalDiseasesOther as string] : []),
  ];

  return `川越あさひ眼科　問診票
受付日時：${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
${"=".repeat(50)}

【基本情報】
お名前　　：${arr(form.name)}
メール　　：${arr(form.email)}
性別　　　：${arr(form.gender)}
生年月日　：${arr(form.birthDate)}
住所　　　：${arr(form.address)}
電話番号　：${arr(form.phone)}

【症状】
症状のある目：${arr(form.affectedEye)}
症状　　　　：${arr(symptoms)}
開始時期　　：${arr(form.symptomOnset)}

【眼科・病歴】
過去の目の病気：${arr(pastEye)}
通院中の眼科　：${arr(form.currentEyeClinic)}
全身の病気　　：${arr(general)}
服薬・目薬等　：${arr(form.medications)}

【その他】
アレルギー　　：${arr(form.allergies)}
お薬手帳　　　：${arr(form.medicationBooklet)}
メガネ・コンタクト：${arr(form.visionCorrection)}
妊娠・授乳　　：${arr(form.pregnancy)}
`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { error: "メール設定が未構成です。管理者にお問い合わせください。" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const htmlContent = buildPdfHtml(form);
    const textContent = buildTextBody(form);
    const patientName = (form.name as string) || "患者";

    await transporter.sendMail({
      from: `"川越あさひ眼科 問診票" <${emailUser}>`,
      to: TO_EMAIL,
      subject: `【問診票】${patientName} 様`,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Email error:", e);
    return NextResponse.json(
      { error: "メールの送信に失敗しました。" },
      { status: 500 }
    );
  }
}
