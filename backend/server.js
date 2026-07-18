require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || '';
const CREDIT_COST_PER_IMAGE = parseInt(process.env.CREDIT_COST_PER_IMAGE || '15', 10);

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY is not set. Paid checkout will fail until you set it in .env');
}
if (!TOGETHER_API_KEY) {
    console.warn('⚠️  TOGETHER_API_KEY is not set. Image generation will fail until you set it in .env');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Same plan list shown on pricing_index.html — kept here too because the
// SERVER, not the browser, decides prices and credit amounts. Never trust
// price/credit values coming from the client.
const PLANS = {
    free: { credits: 150, price: 0.00, label: 'Free' },
    essential: { credits: 1500, price: 3.50, label: 'Essential' },
    advanced: { credits: 4500, price: 10.50, label: 'Advanced' },
    infinite: { credits: 9000, price: 21.00, label: 'Infinite' },
    wonder: { credits: 18000, price: 42.00, label: 'Wonder' }
};

// ============================================================
//  TINY JSON-FILE DATABASE
//  (Good enough for a small course. If you outgrow this, swap
//   loadDB/saveDB for a real database like Postgres or SQLite.)
//  ⚠️ On some free hosts (e.g. Render free tier) the filesystem
//  resets on redeploy — data.json will reset too. For a small,
//  slow-changing student list this is usually fine to start with.
// ============================================================
const DB_PATH = path.join(__dirname, 'data.json');

function loadDB() {
    if (!fs.existsSync(DB_PATH)) return { users: {}, processedSessions: {} };
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to read data.json, starting fresh:', err.message);
        return { users: {}, processedSessions: {} };
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(db, userId) {
    if (!db.users[userId]) db.users[userId] = { credits: 0, freeClaimed: false };
    return db.users[userId];
}

const app = express();

// ============================================================
//  STRIPE WEBHOOK — must read the RAW body, so this route is
//  registered BEFORE express.json() below.
// ============================================================
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    let event;
    try {
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const db = loadDB();

        // Idempotency guard: Stripe may send the same event more than once.
        if (!db.processedSessions[session.id]) {
            const { userId, planKey } = session.metadata || {};
            const plan = PLANS[planKey];
            if (userId && plan) {
                const user = getUser(db, userId);
                user.credits += plan.credits;
                db.processedSessions[session.id] = true;
                saveDB(db);
                console.log(`✅ Credited ${plan.credits} credits to ${userId} (${planKey})`);
            } else {
                console.warn('Webhook: missing/invalid metadata on session', session.id);
            }
        }
    }

    res.json({ received: true });
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
    res.send('Ajax Click Photo Studio LAB — Payment & Generation Server is running. ✅');
});

// ============================================================
//  CREATE STRIPE CHECKOUT SESSION (paid plans only)
// ============================================================
app.post('/api/payment/create-checkout-session', async (req, res) => {
    try {
        const { userId, planKey } = req.body;
        const plan = PLANS[planKey];

        if (!userId || !plan) {
            return res.status(400).json({ error: 'Invalid userId or planKey' });
        }
        if (plan.price === 0) {
            return res.status(400).json({ error: 'Free plan does not use Stripe checkout. Call /api/user/:userId/claim-free instead.' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${plan.label} Plan — ${plan.credits} Credits (Ajax Click Photo Studio LAB)`
                    },
                    unit_amount: Math.round(plan.price * 100)
                },
                quantity: 1
            }],
            metadata: { userId, planKey },
            success_url: `${FRONTEND_URL}/pricing_index.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/pricing_index.html`
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('create-checkout-session error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  CHECK SESSION STATUS (frontend polls this right after Stripe redirect)
// ============================================================
app.get('/api/payment/check-session-status', async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        res.json({ status: session.payment_status === 'paid' ? 'paid' : 'unpaid' });
    } catch (err) {
        console.error('check-session-status error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  FREE PLAN — granted directly by the server, once per user
// ============================================================
app.post('/api/user/:userId/claim-free', (req, res) => {
    const db = loadDB();
    const user = getUser(db, req.params.userId);

    if (user.freeClaimed) {
        return res.json({ credits: user.credits, message: 'Free credits already claimed for this account.' });
    }

    user.credits += PLANS.free.credits;
    user.freeClaimed = true;
    saveDB(db);
    res.json({ credits: user.credits });
});

// ============================================================
//  GET CURRENT CREDIT BALANCE
// ============================================================
app.get('/api/user/:userId/credits', (req, res) => {
    const db = loadDB();
    const user = getUser(db, req.params.userId);
    saveDB(db);
    res.json({ credits: user.credits });
});

// ============================================================
//  SECURE IMAGE GENERATION PROXY
//  The Together AI key never leaves the server. This endpoint
//  also enforces the credit system — nobody can generate images
//  for free just by reading the frontend's source code anymore.
// ============================================================
// Only these two are allowed — never trust a model string from the client directly.
const ALLOWED_MODELS = {
    'black-forest-labs/FLUX.2-pro': { creditCost: CREDIT_COST_PER_IMAGE, label: 'Black Forest 2.0' },
    'black-forest-labs/FLUX.2-max': { creditCost: Math.round(CREDIT_COST_PER_IMAGE * 1.5), label: 'Black Forest 3.0' }
};

app.post('/api/generate-image', async (req, res) => {
    try {
        const { userId, prompt, aspectRatio, model, referenceImages } = req.body;
        if (!userId || !prompt) {
            return res.status(400).json({ error: 'Missing userId or prompt' });
        }
        if (!TOGETHER_API_KEY) {
            return res.status(500).json({ error: 'Server is missing TOGETHER_API_KEY. Ask the developer to configure it.' });
        }

        const chosenModel = ALLOWED_MODELS[model] ? model : 'black-forest-labs/FLUX.2-pro';
        const cost = ALLOWED_MODELS[chosenModel].creditCost;

        const db = loadDB();
        const user = getUser(db, userId);

        if (user.credits < cost) {
            return res.status(402).json({ error: 'Not enough credits', credits: user.credits, required: cost });
        }

        const requestBody = {
            model: chosenModel,
            prompt,
            aspect_ratio: aspectRatio || '16:9',
            n: 1,
            response_format: 'url'
        };

        // FLUX.2 supports up to 10 real reference images for identity/outfit
        // preservation — this is far more accurate than a text description alone.
        if (Array.isArray(referenceImages) && referenceImages.length > 0) {
            requestBody.reference_images = referenceImages.slice(0, 10);
        }

        const response = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Together AI error:', errText);
            return res.status(502).json({ error: `Together AI error: ${errText}` });
        }

        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) {
            return res.status(502).json({ error: 'No image URL returned from Together AI' });
        }

        // Only deduct credits AFTER a successful generation.
        user.credits -= cost;
        saveDB(db);

        res.json({ imageUrl, creditsRemaining: user.credits, creditsUsed: cost });
    } catch (err) {
        console.error('generate-image error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`   Frontend URL configured as: ${FRONTEND_URL}`);
});
