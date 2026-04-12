import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TO_EMAIL = "kawagoeasahi+monsin@gmail.com";

function buildPdfHtml(form: Record<string, unknown>): string {
  // 通常表示（空なら「なし」）
  const arr = (v: unknown) =>
    Array.isArray(v) ? (v as string[]).join("、") || "なし" : (v as string) || "なし";

  // 空なら「-」（病歴・その他用）
  const arrDash = (v: unknown) =>
    Array.isArray(v) ? (v as string[]).join("、") || "-" : (v as string) || "-";

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

  // 通常行
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:4px 8px;font-weight:bold;color:#475569;background:#f8fafc;white-space:nowrap;border:1px solid #e2e8f0;width:120px;font-size:11px">${label}</td>
      <td style="padding:4px 8px;color:#1e293b;border:1px solid #e2e8f0;font-size:11px">${value}</td>
    </tr>`;

  // 太字行（症状系）
  const rowBold = (label: string, value: string) =>
    `<tr>
      <td style="padding:4px 8px;font-weight:bold;color:#475569;background:#f8fafc;white-space:nowrap;border:1px solid #e2e8f0;width:120px;font-size:11px">${label}</td>
      <td style="padding:4px 8px;color:#1e293b;border:1px solid #e2e8f0;font-size:11px;font-weight:700">${value}</td>
    </tr>`;

  const sectionTitle = (title: string) =>
    `<div style="font-size:10px;font-weight:700;color:#fff;background:#0f766e;padding:3px 8px;margin:8px 0 4px;letter-spacing:0.08em">${title}</div>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif; background:#fff; margin:0; padding:0; font-size:11px; }
    .page { width:100%; padding:0; }
    .header { background:#0f766e; color:#fff; padding:8px 12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; }
    .header h1 { margin:0; font-size:15px; font-weight:700; letter-spacing:0.08em; }
    .header p { margin:0; font-size:10px; color:#99f6e4; }
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:0 12px; }
    .col {}
    table { width:100%; border-collapse:collapse; margin-bottom:0; }
    .footer { margin-top:8px; font-size:9px; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; padding-top:4px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>川越あさひ眼科　問診票</h1>
      <p>受付日時：${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
    </div>

    <div class="two-col">
      <div class="col">
        ${sectionTitle("基本情報")}
        <table>
          ${row("よみがな", arr(form.yomigana))}
          ${row("お名前", arr(form.name))}
          ${row("性別", arr(form.gender))}
          ${row("生年月日", arr(form.birthDate))}
          ${row("郵便番号", arr(form.postalCode))}
          ${row("住所", arr(form.address))}
          ${row("電話番号", arr(form.phone))}
          ${row("メールアドレス", arr(form.email))}
        </table>

        ${sectionTitle("症状")}
        <table>
          ${rowBold("症状のある目", arr(form.affectedEye))}
          ${rowBold("症状", arr(symptoms))}
          ${rowBold("症状の開始時期", arr(form.symptomOnset))}
        </table>
      </div>

      <div class="col">
        ${sectionTitle("眼科・病歴")}
        <table>
          ${row("過去の目の病気", arrDash(pastEye))}
          ${row("通院中の眼科", arrDash(form.currentEyeClinic))}
          ${row("全身の病気", arrDash(general))}
          ${row("服薬・サプリ・目薬", arrDash(form.medications))}
        </table>

        ${sectionTitle("その他")}
        <table>
          ${row("アレルギー", arrDash(form.allergies))}
          ${row("お薬手帳", arr(form.medicationBooklet))}
          ${row("メガネ・コンタクト", arrDash(form.visionCorrection))}
          ${row("妊娠・授乳", arrDash(form.pregnancy))}
        </table>
      </div>
    </div>

    <div class="footer">川越あさひ眼科　問診票システム　自動生成</div>
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
よみがな　：${arr(form.yomigana)}
お名前　　：${arr(form.name)}
メール　　：${arr(form.email)}
性別　　　：${arr(form.gender)}
生年月日　：${arr(form.birthDate)}
郵便番号　：${arr(form.postalCode)}
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
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
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
