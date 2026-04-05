"use client";

import { useState, useRef } from "react";

type FormData = {
  name: string;
  email: string;
  gender: string;
  birthDate: string;
  address: string;
  phone: string;
  affectedEye: string;
  symptoms: string[];
  symptomsOther: string;
  symptomOnset: string;
  pastEyeDiseases: string[];
  pastEyeDiseasesOther: string;
  currentEyeClinic: string;
  generalDiseases: string[];
  generalDiseasesOther: string;
  medications: string;
  medicationBooklet: string;
  allergies: string;
  visionCorrection: string[];
  pregnancy: string[];
};

const initialData: FormData = {
  name: "",
  email: "",
  gender: "",
  birthDate: "",
  address: "",
  phone: "",
  affectedEye: "",
  symptoms: [],
  symptomsOther: "",
  symptomOnset: "",
  pastEyeDiseases: [],
  pastEyeDiseasesOther: "",
  currentEyeClinic: "",
  generalDiseases: [],
  generalDiseasesOther: "",
  medications: "",
  medicationBooklet: "",
  allergies: "",
  visionCorrection: [],
  pregnancy: [],
};

const SYMPTOMS = [
  "検査希望",
  "白内障手術希望",
  "眼科の転院希望",
  "乾く",
  "疲れる",
  "不快感がある",
  "かすむ",
  "目やにが出る",
  "涙が出る",
  "痛い",
  "かゆい",
  "充血する",
  "まぶたが腫れている",
  "何か入った",
  "近くが見えにくい",
  "遠くが見えにくい",
  "黒いもの（虫や糸くずのようなもの）が見える",
  "物が歪んで見える",
  "眼鏡の処方希望",
  "学校で用紙をもらった",
  "コンタクトレンズの処方希望",
];

const PAST_EYE_DISEASES = [
  "緑内障",
  "白内障",
  "糖尿病網膜症",
  "網膜剥離",
  "ドライアイ",
  "流行性角結膜炎（はやり目）",
  "目のけが（外傷）",
];

const GENERAL_DISEASES = [
  "いいえ（なし）",
  "糖尿病",
  "高血圧",
  "心臓病",
  "心不全",
  "喘息",
];

const VISION_CORRECTION = [
  "メガネ",
  "１日使い捨てコンタクトレンズ",
  "２週間使い捨てコンタクトレンズ",
  "１か月使い捨てコンタクトレンズ",
  "使い捨てではないソフトコンタクトレンズ",
  "ハードコンタクトレンズ",
];

const PREGNANCY = [
  "妊娠１２週以内",
  "妊娠１３週以降",
  "授乳中",
];

const STEPS = ["基本情報", "症状", "病歴", "その他", "確認・送信"];

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <div
          key={opt}
          className={`touch-radio ${value === opt ? "selected" : ""}`}
          onClick={() => onChange(opt)}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              value === opt
                ? "border-teal-600 bg-teal-600"
                : "border-slate-300"
            }`}
          >
            {value === opt && (
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-base">{opt}</span>
        </div>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onChange,
  columns = 2,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  columns?: number;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };
  return (
    <div className={`grid grid-cols-1 gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((opt) => {
        const checked = values.includes(opt);
        return (
          <div
            key={opt}
            className={`touch-checkbox ${checked ? "selected" : ""}`}
            onClick={() => toggle(opt)}
          >
            <div
              className={`w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                checked
                  ? "border-teal-600 bg-teal-600"
                  : "border-slate-300"
              }`}
            >
              {checked && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-base leading-snug">{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-base font-bold text-slate-700 mb-3">
      {children}
      {required && (
        <span className="ml-2 text-xs font-semibold text-white bg-rose-500 px-2 py-0.5 rounded-full">必須</span>
      )}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-teal-500 transition-colors"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string | string[] }) {
  const display = Array.isArray(value)
    ? value.join("、") || "なし"
    : value || "なし";
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm font-bold text-slate-500 w-36 flex-shrink-0 leading-relaxed">{label}</span>
      <span className="text-sm text-slate-800 flex-1 leading-relaxed">{display}</span>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialData);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return "お名前を入力してください。";
      if (!form.gender) return "性別を選択してください。";
      if (!form.birthDate) return "生年月日を入力してください。";
      if (!form.address.trim()) return "住所を入力してください。";
      if (!form.phone.trim()) return "電話番号を入力してください。";
    }
    if (step === 1) {
      if (!form.affectedEye) return "症状のある目を選択してください。";
      if (form.symptoms.length === 0) return "症状を1つ以上選択してください。";
      if (!form.symptomOnset.trim()) return "症状が始まった時期を入力してください。";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました。");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-teal-50 to-slate-50">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">送信完了</h2>
          <p className="text-slate-600 mb-2">問診票を送信しました。</p>
          <p className="text-slate-500 text-sm mb-8">受付スタッフにお声がけください。</p>
          <button
            onClick={() => {
              setForm(initialData);
              setStep(0);
              setDone(false);
            }}
            className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl text-base"
          >
            最初に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-50">
      {/* ヘッダー */}
      <header className="bg-teal-700 text-white px-5 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-teal-200 mb-0.5">川越あさひ眼科</p>
          <h1 className="text-lg font-bold tracking-wide">問 診 票</h1>
        </div>
      </header>

      {/* プログレスバー */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 sticky top-[64px] z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step
                      ? "bg-teal-600 text-white"
                      : i === step
                      ? "bg-teal-600 text-white ring-4 ring-teal-200"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    i === step ? "text-teal-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* フォーム本体 */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* エラー */}
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Step 0: 基本情報 */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-teal-700 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-black text-sm">1</span>
              基本情報
            </h2>
            <div className="space-y-5">
              <div>
                <SectionLabel required>お名前</SectionLabel>
                <TextInput value={form.name} onChange={(v) => set("name", v)} placeholder="例：山田 太郎" />
              </div>
              <div>
                <SectionLabel>メールアドレス</SectionLabel>
                <TextInput value={form.email} onChange={(v) => set("email", v)} placeholder="例：example@email.com" type="email" />
              </div>
              <div>
                <SectionLabel required>性別</SectionLabel>
                <RadioGroup
                  options={["男性", "女性", "その他"]}
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                />
              </div>
              <div>
                <SectionLabel required>生年月日</SectionLabel>
                <TextInput value={form.birthDate} onChange={(v) => set("birthDate", v)} type="date" />
              </div>
              <div>
                <SectionLabel required>住所</SectionLabel>
                <TextArea value={form.address} onChange={(v) => set("address", v)} placeholder="例：埼玉県川越市○○町1-2-3" rows={2} />
              </div>
              <div>
                <SectionLabel required>電話番号</SectionLabel>
                <TextInput value={form.phone} onChange={(v) => set("phone", v)} placeholder="例：049-000-0000" type="tel" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: 症状 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-teal-700 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-black text-sm">2</span>
              症状について
            </h2>
            <div className="space-y-6">
              <div>
                <SectionLabel required>左右どちらの目の症状ですか？</SectionLabel>
                <RadioGroup
                  options={["右眼", "左眼", "両眼"]}
                  value={form.affectedEye}
                  onChange={(v) => set("affectedEye", v)}
                />
              </div>
              <div>
                <SectionLabel required>どのような症状ですか？（複数選択可）</SectionLabel>
                <CheckboxGroup
                  options={SYMPTOMS}
                  values={form.symptoms}
                  onChange={(v) => set("symptoms", v)}
                />
                <div className="mt-3">
                  <TextInput
                    value={form.symptomsOther}
                    onChange={(v) => set("symptomsOther", v)}
                    placeholder="その他の症状があれば記入"
                  />
                </div>
              </div>
              <div>
                <SectionLabel required>いつから症状がありますか？</SectionLabel>
                <TextInput
                  value={form.symptomOnset}
                  onChange={(v) => set("symptomOnset", v)}
                  placeholder="例：1週間前から、昨日から"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 病歴 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-teal-700 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-black text-sm">3</span>
              眼科・病歴
            </h2>
            <div className="space-y-6">
              <div>
                <SectionLabel>目の病気にかかったことはありますか？（複数選択可）</SectionLabel>
                <CheckboxGroup
                  options={PAST_EYE_DISEASES}
                  values={form.pastEyeDiseases}
                  onChange={(v) => set("pastEyeDiseases", v)}
                />
                <div className="mt-3">
                  <TextInput
                    value={form.pastEyeDiseasesOther}
                    onChange={(v) => set("pastEyeDiseasesOther", v)}
                    placeholder="その他（具体的に）"
                  />
                </div>
              </div>
              <div>
                <SectionLabel>現在通院中の眼科はありますか？</SectionLabel>
                <TextInput
                  value={form.currentEyeClinic}
                  onChange={(v) => set("currentEyeClinic", v)}
                  placeholder="眼科名を入力（なければ空白）"
                />
              </div>
              <div>
                <SectionLabel>現在・過去にかかっている全身の病気（複数選択可）</SectionLabel>
                <CheckboxGroup
                  options={GENERAL_DISEASES}
                  values={form.generalDiseases}
                  onChange={(v) => set("generalDiseases", v)}
                />
                <div className="mt-3">
                  <TextInput
                    value={form.generalDiseasesOther}
                    onChange={(v) => set("generalDiseasesOther", v)}
                    placeholder="その他の病気（具体的に）"
                  />
                </div>
              </div>
              <div>
                <SectionLabel>現在飲んでいる薬・サプリ・目薬</SectionLabel>
                <TextInput
                  value={form.medications}
                  onChange={(v) => set("medications", v)}
                  placeholder="なければ空白"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: その他 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-teal-700 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-black text-sm">4</span>
              その他
            </h2>
            <div className="space-y-6">
              <div>
                <SectionLabel>アレルギー（食べ物・薬・注射）</SectionLabel>
                <TextInput
                  value={form.allergies}
                  onChange={(v) => set("allergies", v)}
                  placeholder="なければ空白"
                />
              </div>
              <div>
                <SectionLabel>お薬手帳に貼る紙の発行を希望しますか？</SectionLabel>
                <RadioGroup
                  options={["希望する", "希望しない"]}
                  value={form.medicationBooklet}
                  onChange={(v) => set("medicationBooklet", v)}
                />
              </div>
              <div>
                <SectionLabel>普段、メガネ・コンタクトを使用していますか？（複数選択可）</SectionLabel>
                <CheckboxGroup
                  options={VISION_CORRECTION}
                  values={form.visionCorrection}
                  onChange={(v) => set("visionCorrection", v)}
                  columns={1}
                />
              </div>
              <div>
                <SectionLabel>妊娠中または授乳中ですか？（該当するものを選択）</SectionLabel>
                <CheckboxGroup
                  options={PREGNANCY}
                  values={form.pregnancy}
                  onChange={(v) => set("pregnancy", v)}
                  columns={1}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 確認・送信 */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              <p className="text-teal-800 text-sm font-medium">
                以下の内容をご確認の上、「送信する」ボタンを押してください。
                修正する場合は「戻る」ボタンをご利用ください。
              </p>
            </div>

            <div ref={summaryRef} className="bg-white rounded-2xl shadow-sm p-5" id="summary-content">
              <h3 className="text-base font-bold text-teal-700 mb-4 pb-3 border-b-2 border-teal-100">
                川越あさひ眼科　問診票　確認
              </h3>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">基本情報</p>
              <SummaryRow label="お名前" value={form.name} />
              <SummaryRow label="メールアドレス" value={form.email} />
              <SummaryRow label="性別" value={form.gender} />
              <SummaryRow label="生年月日" value={form.birthDate} />
              <SummaryRow label="住所" value={form.address} />
              <SummaryRow label="電話番号" value={form.phone} />

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-5">症状</p>
              <SummaryRow label="症状のある目" value={form.affectedEye} />
              <SummaryRow
                label="症状"
                value={[...form.symptoms, ...(form.symptomsOther ? [form.symptomsOther] : [])]}
              />
              <SummaryRow label="症状の開始時期" value={form.symptomOnset} />

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-5">眼科・病歴</p>
              <SummaryRow
                label="過去の目の病気"
                value={[
                  ...form.pastEyeDiseases,
                  ...(form.pastEyeDiseasesOther ? [form.pastEyeDiseasesOther] : []),
                ]}
              />
              <SummaryRow label="通院中の眼科" value={form.currentEyeClinic} />
              <SummaryRow
                label="全身の病気"
                value={[
                  ...form.generalDiseases,
                  ...(form.generalDiseasesOther ? [form.generalDiseasesOther] : []),
                ]}
              />
              <SummaryRow label="服薬・目薬等" value={form.medications} />

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-5">その他</p>
              <SummaryRow label="アレルギー" value={form.allergies} />
              <SummaryRow label="お薬手帳" value={form.medicationBooklet} />
              <SummaryRow label="メガネ・コンタクト" value={form.visionCorrection} />
              <SummaryRow label="妊娠・授乳" value={form.pregnancy} />
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-base active:bg-slate-50"
              >
                ← 戻る
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-[2] py-4 rounded-xl bg-teal-600 text-white font-bold text-base shadow-md active:bg-teal-700"
              >
                次へ →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={sending}
                className="flex-[2] py-4 rounded-xl bg-teal-600 text-white font-bold text-base shadow-md disabled:opacity-60 active:bg-teal-700"
              >
                {sending ? "送信中..." : "送信する"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
