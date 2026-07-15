# Ajax Click Photo Studio LAB — Payment & Image-Generation Server

ဒီ server က အောက်ပါ အလုပ် ၄ ခု လုပ်ပေးပါတယ်:
1. Stripe နဲ့ Credit ဝယ်ယူခြင်း (Checkout Session ဖန်တီးခြင်း)
2. Stripe webhook နဲ့ ငွေရောက်ကြောင်း အတည်ပြုပြီး Credit ထည့်ပေးခြင်း
3. User ရဲ့ Credit balance ကို ပြန်ပေးခြင်း
4. **Together AI Key ကို server ဘက်မှာပဲ လုံခြုံစွာ ထားပြီး**, Credit လောက်မှ ပုံထုတ်ပေးခြင်း (Frontend ထဲမှာ Key မထားတော့ပါ)

---

## အဆင့် ၁ — Stripe Account ဖွင့်ပါ

1. https://dashboard.stripe.com/register မှာ Account အသစ် ဖွင့်ပါ (Free)
2. **Test Mode** နဲ့ စလုပ်ပါ (Toggle က ညာဘက်အပေါ်မှာ ရှိပါတယ်) — ငွေအစစ် မဟုတ်သေးဘဲ စမ်းသပ်လို့ရပါတယ်
3. **Developers → API keys** ကနေ **Secret key** (sk_test_... နဲ့ စတဲ့) ကို copy ကူးထားပါ

## အဆင့် ၂ — ဒီ Folder ကို GitHub ပေါ် တင်ပါ

```bash
cd backend
git init
git add .
git commit -m "Initial payment server"
```
GitHub.com မှာ repo အသစ် ဖန်တီးပြီး push လုပ်ပါ (`.env` file ကို **လုံးဝ** push မလုပ်ပါနဲ့ — `.gitignore` ထဲမှာ ထည့်ထားပါ)

## အဆင့် ၃ — Render.com မှာ Deploy လုပ်ပါ (အခမဲ့)

1. https://render.com မှာ Sign up (GitHub account နဲ့ တိုက်ရိုက် login လို့ရပါတယ်)
2. **New +** → **Web Service** ကို နှိပ်ပါ
3. GitHub repo ကို ချိတ်ဆက်ပြီး ရွေးပါ
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. **Environment Variables** ထဲမှာ (`.env.example` ကို ကြည့်ပြီး) အောက်ပါ value တွေ ထည့်ပါ:
   - `STRIPE_SECRET_KEY` → Stripe က ကူးထားတဲ့ key
   - `TOGETHER_API_KEY` → ခင်ဗျားရဲ့ Together AI key
   - `FRONTEND_URL` → main_UI_index-v4.html နဲ့ pricing_index.html ကို host လုပ်ထားတဲ့ URL (e.g. Netlify link)
   - `CREDIT_COST_PER_IMAGE` → `15` (ပုံတစ်ပုံရိုက်ရင် Credit ဘယ်နှစ်ခု ဖြတ်မလဲ — 1500 Credit / 15 = ပုံ 100 ဝန်းကျင် ရမယ်၊ ပြောင်းလို့ရပါတယ်)
   - `STRIPE_WEBHOOK_SECRET` → **အဆင့် ၅ ပြီးမှ** ရမှာမို့ အခုတော့ ဗလာ ထားထားပါ
6. **Create Web Service** နှိပ်ပါ — ၂-၃ မိနစ်အတွင်း Deploy ပြီးပါမယ်
7. Deploy ပြီးရင် URL တစ်ခု ရပါမယ် (e.g. `https://ajax-click-payment.onrender.com`) — ဒါကို မှတ်ထားပါ

> ⚠️ Render **Free** tier က 15 မိနစ် idle ဖြစ်ရင် sleep သွားပါတယ်၊ နောက်တစ်ခါ request ဝင်လာရင် နိုးဖို့ 30 စက္ကန့်ခန့် ကြာနိုင်ပါတယ် (ပထမဆုံး request နှေးနိုင်ပါတယ်)။ Student အရေအတွက် များလာရင် Paid tier ($7/month) ကို စဉ်းစားပါ။

## အဆင့် ၄ — Frontend ကို Backend URL နဲ့ ချိတ်ပါ

`pricing_index.html` နဲ့ `main_UI_index-v4.html` ထဲက `BACKEND_URL` constant ကို Render ကပေးတဲ့ URL နဲ့ အစားထိုးပါ (ဒီ Claude session ကနေ ပြင်ပြီးသား file တွေ ရနိုင်ပါတယ်)။

## အဆင့် ၅ — Stripe Webhook ချိတ်ပါ (Credit အလိုအလျောက် ထည့်ဖို့ လိုအပ်ပါတယ်)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://<your-render-url>/webhook`
3. Event ရွေးပါ: `checkout.session.completed`
4. Save လုပ်ပြီးရင် **Signing secret** (whsec_... ) ကို copy ကူးပါ
5. Render ရဲ့ Environment Variables ထဲက `STRIPE_WEBHOOK_SECRET` ကို ဒီ value နဲ့ update လုပ်ပြီး redeploy လုပ်ပါ

## အဆင့် ၆ — စမ်းသပ်ပါ

1. Stripe Test Mode ဖြစ်နေသေးရင် Test Card နံပါတ် သုံးလို့ရပါတယ်: `4242 4242 4242 4242`, ဘယ် Expiry/CVC မဆို ရပါတယ်
2. Pricing page ကနေ Plan တစ်ခု ဝယ်ကြည့်ပါ → Credit ရောက်လား စစ်ပါ
3. Main UI ကနေ ပုံတစ်ပုံ generate လုပ်ကြည့်ပါ → Credit လျှော့သွားလား စစ်ပါ
4. **အားလုံး အဆင်ပြေရင် Stripe ကို Live Mode ပြောင်းပြီး live key တွေနဲ့ အစားထိုးပါ** (`sk_live_...`)

---

## Local Testing (Computer ပေါ်မှာ စမ်းချင်ရင်)

```bash
cd backend
cp .env.example .env
# .env ထဲမှာ key တွေ ဖြည့်ပါ
npm install
npm start
```
Server က `http://localhost:5000` မှာ run ပါမယ်။

## ⚠️ လုံခြုံရေး မှတ်ချက်

- `.env` file ကို **GitHub ပေါ် တင်ခြင်း မပြုပါနဲ့** — Key တွေ ပေါက်ကြားနိုင်ပါတယ်
- `data.json` ထဲမှာ user credit တွေ သိမ်းထားပါတယ် — Render free tier မှာ redeploy တိုင်း ဒီ file reset ဖြစ်နိုင်ပါတယ်။ Student အရေအတွက် တိုးလာရင် Postgres/MongoDB လို database အစစ်ကို ပြောင်းသုံးဖို့ စဉ်းစားပါ
