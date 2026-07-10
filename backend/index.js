require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const port = process.env.PORT || 5000;
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const cron = require("node-cron");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || 'secret_ecom_farmconnect_2024';

// Import modular payment routes (PhonePe integration)
const paymentRoutes = require('./routes/payment.routes');
const errorHandler = require('./middleware/errorHandler');

const onlineUsers = new Map();
const groupMessages = [];
const privateMessages = new Map();

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);
const chatUsers = {};

io.on("connection", (socket) => {
    socket.on("register-user", (user) => {
        const normalized = {
            id: socket.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role || 'User',
            latitude: user.latitude || null,
            longitude: user.longitude || null,
        };
        onlineUsers.set(normalized.email, normalized);
        socket.join("farm-group");
        socket.emit("group-history", groupMessages.slice(-50));
        socket.broadcast.emit("user-online", normalized);
    });

    socket.on("send-group-message", (payload) => {
        const sender = onlineUsers.get(payload.email) || {
            name: payload.name || 'Unknown',
            role: payload.role || 'User',
            email: payload.email,
        };
        const message = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            sender: sender.name,
            email: sender.email,
            role: sender.role,
            text: payload.text,
            timestamp: new Date().toISOString(),
        };
        groupMessages.push(message);
        if (groupMessages.length > 100) groupMessages.shift();
        io.to("farm-group").emit("group-message", message);
    });

    socket.on("send-private-message", ({ toEmail, fromEmail, text, name, role }) => {
        const sender = onlineUsers.get(fromEmail) || { name, role, email: fromEmail };
        const message = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            fromEmail,
            toEmail,
            sender: sender.name,
            role: sender.role,
            text,
            timestamp: new Date().toISOString(),
        };

        const key = [fromEmail, toEmail].sort().join("::");
        if (!privateMessages.has(key)) privateMessages.set(key, []);
        privateMessages.get(key).push(message);
        if (privateMessages.get(key).length > 100) privateMessages.get(key).shift();

        const recipient = onlineUsers.get(toEmail);
        if (recipient) {
            io.to(recipient.id).emit("private-message", message);
        }
        socket.emit("private-message-sent", message);
    });

    socket.on("request-private-history", ({ fromEmail, toEmail }) => {
        const key = [fromEmail, toEmail].sort().join("::");
        const history = privateMessages.get(key) || [];
        socket.emit("private-history", history.slice(-50));
    });

    socket.on("disconnect", () => {
        const user = Array.from(onlineUsers.entries()).find(([, value]) => value.id === socket.id);
        if (user) {
            onlineUsers.delete(user[0]);
            io.emit("user-offline", { email: user[0] });
            console.log(`${user[0]} has left the chat.`);
        }
    });
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://HARSHAD:HARSHAD@ac-2ayfpqy-shard-00-00.yzv2blz.mongodb.net:27017,ac-2ayfpqy-shard-00-01.yzv2blz.mongodb.net:27017,ac-2ayfpqy-shard-00-02.yzv2blz.mongodb.net:27017/e-commerce?ssl=true&replicaSet=atlas-147c89-shard-0&authSource=admin&appName=Cluster0";

console.log(`Connecting to MongoDB with URI: ${process.env.MONGO_URI ? 'env MONGO_URI' : 'hardcoded fallback'}`);

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => {
    console.error("MongoDB Error:", err);
    console.error("If using Atlas, ensure your current IP address is whitelisted or use 0.0.0.0/0!");
});

// Ensure upload directory exists
const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

// image storage configuration
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
}).single('product');

// Static folder for images
app.use('/images', express.static(uploadDir));

// Test route
app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Backend-served payment callback page (fallback)
// Displays payment status and provides a link to the frontend success page.
app.get('/payment-callback', (req, res) => {
        const phonePeConfig = require('./config/phonepe.config');
        const status = req.query.status || 'unknown';
        const id = req.query.id || '';
        const frontendTarget = `${phonePeConfig.frontendUrl}/payment-callback?status=${encodeURIComponent(status)}&id=${encodeURIComponent(id)}`;

        const html = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Payment Result</title>
        <style>
            body{font-family:Arial,Helvetica,sans-serif;background:#f7f7f9;color:#222;margin:0;padding:40px}
            .card{max-width:760px;margin:40px auto;background:#fff;border-radius:8px;padding:28px;box-shadow:0 6px 18px rgba(0,0,0,0.06)}
            .status{font-size:20px;margin-bottom:8px}
            .id{color:#666;margin-bottom:16px}
            .actions{margin-top:20px}
            .btn{display:inline-block;padding:12px 20px;border-radius:6px;text-decoration:none;color:#fff}
            .btn-primary{background:#4f46e5}
            .btn-secondary{background:#6b7280}
        </style>
        <script>
            // Try to redirect to frontend after short delay (if available)
            function tryRedirect(){
                try { window.location.replace(${JSON.stringify(frontendTarget)}); } catch(e) { /* ignore */ }
            }
            setTimeout(tryRedirect, 1200);
        </script>
    </head>
    <body>
        <div class="card">
            <h1>Payment ${status === 'success' ? 'Successful' : status === 'failed' ? 'Failed' : 'Result'}</h1>
            <p class="status">Status: <strong>${status}</strong></p>
            <p class="id">Reference ID: <strong>${id}</strong></p>
            <p>If your frontend app is running, you will be redirected automatically. If not, you can open the frontend result page manually.</p>
            <div class="actions">
                <a class="btn btn-primary" href="${frontendTarget}">Open Frontend Result</a>
                <a class="btn btn-secondary" href="/">Return to Backend Home</a>
            </div>
        </div>
    </body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
});

// Image upload endpoint
app.post("/upload", (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({
                success: 0,
                error: err.message
            });
        }
        console.log("Request file:", req.file);
        if (!req.file) {
            return res.status(400).json({
                success: 0,
                error: "No file uploaded"
            });
        }
        res.json({
            success: 1,
            image_url: `http://localhost:${port}/images/${req.file.filename}`,
        });
    });
});

// Nearby users endpoint for community chat
app.get('/api/chat/nearby-users', async (req, res) => {
    try {
        const currentEmail = req.query.email;
        const latitude = Number(req.query.lat);
        const longitude = Number(req.query.lon);

        if (!currentEmail || Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return res.status(400).json({ success: false, error: 'email, lat and lon are required' });
        }

        const users = await Users.find({
            email: { $ne: currentEmail },
            latitude: { $exists: true },
            longitude: { $exists: true },
        }).lean();

        const nearby = users
            .map((user) => {
                const distance = getDistance(latitude, longitude, user.latitude, user.longitude);
                return { ...user, distance: Number(distance.toFixed(1)) };
            })
            .filter((user) => user.distance <= 20)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 50);

        res.json({ success: true, users: nearby });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const farmerAssistantPrompt = `
You are FarmConnect AI, a practical agriculture assistant for Indian farmers.
Answer farmer questions in simple, respectful language with clear steps.
Focus on crop planning, soil health, irrigation, pest and disease control, organic and chemical input safety, harvesting, storage, selling, payments, and farm business decisions.
Ask for missing details when needed: crop, location/state, season, soil type, crop age, visible symptoms, water availability, and budget.
For pests, diseases, fertilizers, and pesticides, suggest safe diagnosis steps first, mention dose must follow the product label/local agriculture officer, and include protective handling advice.
For market price, weather, government scheme, legal, financial, or medical questions, say the information can change and recommend checking a trusted local/current source.
Keep answers concise, practical, and formatted with short bullets when useful.
`;

const AI_CHAT_MESSAGE_LIMIT = 10;

const aiConversationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, default: '' },
    title: { type: String, required: true },
    groupNumber: { type: Number, default: 1 },
    messages: [{
        speaker: { type: String, enum: ['user', 'ai'], required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

const AiConversation = mongoose.model('aiconversation', aiConversationSchema);

const getAiUserContext = async (req) => {
    const token = req.header('auth-token');
    if (!token) {
        return {
            userId: `guest:${req.ip || 'unknown'}`,
            userEmail: '',
        };
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        const user = await Users.findById(data.user.id).lean();
        return {
            userId: String(data.user.id),
            userEmail: user?.email || '',
        };
    } catch (error) {
        return {
            userId: `guest:${req.ip || 'unknown'}`,
            userEmail: '',
        };
    }
};

const getNextAiGroupNumber = async (userId) => {
    const latestConversation = await AiConversation
        .findOne({ userId })
        .sort({ groupNumber: -1 })
        .select('groupNumber')
        .lean();

    return (latestConversation?.groupNumber || 0) + 1;
};

const createAiConversation = async ({ userId, userEmail, title }) => {
    const groupNumber = await getNextAiGroupNumber(userId);
    return AiConversation.create({
        userId,
        userEmail,
        title: title || `Farm Chat ${groupNumber}`,
        groupNumber,
        messages: [],
    });
};

const formatAiConversation = (conversation) => ({
    id: conversation._id,
    title: conversation.title,
    groupNumber: conversation.groupNumber,
    messageCount: conversation.messages?.length || 0,
    messages: conversation.messages || [],
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
});

const buildAiTitle = (question) => {
    const cleanQuestion = question.replace(/\s+/g, ' ').trim();
    return cleanQuestion.length > 42 ? `${cleanQuestion.slice(0, 42)}...` : cleanQuestion;
};

app.get('/api/ai/conversations', async (req, res) => {
    try {
        const { userId } = await getAiUserContext(req);
        const conversations = await AiConversation
            .find({ userId })
            .sort({ updatedAt: -1 })
            .select('title groupNumber messages createdAt updatedAt')
            .lean();

        res.json({
            success: true,
            conversations: conversations.map(formatAiConversation),
        });
    } catch (error) {
        console.error('AI conversation list error:', error.message);
        res.status(500).json({ success: false, error: 'Unable to load AI chat history.' });
    }
});

app.get('/api/ai/conversations/:id', async (req, res) => {
    try {
        const { userId } = await getAiUserContext(req);
        const conversation = await AiConversation.findOne({
            _id: req.params.id,
            userId,
        }).lean();

        if (!conversation) {
            return res.status(404).json({ success: false, error: 'AI chat group not found.' });
        }

        res.json({ success: true, conversation: formatAiConversation(conversation) });
    } catch (error) {
        console.error('AI conversation detail error:', error.message);
        res.status(500).json({ success: false, error: 'Unable to load AI chat group.' });
    }
});

app.post('/api/ai/conversations', async (req, res) => {
    try {
        const userContext = await getAiUserContext(req);
        const conversation = await createAiConversation({
            ...userContext,
            title: req.body.title,
        });

        res.status(201).json({
            success: true,
            conversation: formatAiConversation(conversation.toObject()),
        });
    } catch (error) {
        console.error('AI conversation create error:', error.message);
        res.status(500).json({ success: false, error: 'Unable to create AI chat group.' });
    }
});

app.post('/api/ai/farmer-assistant', async (req, res) => {
    try {
        const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';
        const requestedConversationId = req.body.conversationId;

        if (!question) {
            return res.status(400).json({ success: false, error: 'Question is required.' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'Groq API key is not configured on the backend.',
            });
        }

        const userContext = await getAiUserContext(req);
        let conversation = null;

        if (requestedConversationId) {
            conversation = await AiConversation.findOne({
                _id: requestedConversationId,
                userId: userContext.userId,
            });
        }

        if (!conversation || conversation.messages.length + 2 > AI_CHAT_MESSAGE_LIMIT) {
            conversation = await createAiConversation({
                ...userContext,
                title: buildAiTitle(question),
            });
        }

        const messages = [
            { role: 'system', content: farmerAssistantPrompt },
            ...conversation.messages.slice(-8).map((entry) => ({
                role: entry.speaker === 'user' ? 'user' : 'assistant',
                content: String(entry.text || '').slice(0, 1200),
            })).filter((entry) => entry.content.trim()),
            { role: 'user', content: question },
        ];

        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.35,
                max_completion_tokens: 900,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        const answer = groqResponse.data?.choices?.[0]?.message?.content?.trim();
        if (!answer) {
            return res.status(502).json({
                success: false,
                error: 'Groq did not return an answer. Please try again.',
            });
        }

        conversation.messages.push(
            { speaker: 'user', text: question },
            { speaker: 'ai', text: answer }
        );

        if (!conversation.title || conversation.title.startsWith('Farm Chat') || conversation.title === 'New farm chat') {
            conversation.title = buildAiTitle(question);
        }

        await conversation.save();

        res.json({
            success: true,
            answer,
            conversation: formatAiConversation(conversation.toObject()),
        });
    } catch (error) {
        console.error('Groq farmer assistant error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Unable to connect to FarmConnect AI right now. Please try again.',
        });
    }
});

// Schema for creating products
const Product = mongoose.model("product", {
    email: {
        type: String,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    tags: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    crop_type: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    subcategory: {
        type: String,
        default: ''
    },
    brand: {
        type: String,
        default: ''
    },
    unit: {
        type: String,
        default: 'unit'
    },
    stock: {
        type: Number,
        default: 0
    },
    options: {
        type: Object,
        default: {}
    },
    new_price: {
        type: Number,
        required: true
    },
    old_price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    available: {
        type: Boolean,
        default: true
    }
});

// Endpoint for adding products
app.post('/addproduct', async (req, res) => {
    try {
        let products = await Product.find({});
        let id;
        if (products.length > 0) {
            let last_product = products[products.length - 1];
            id = last_product.id + 1;
        } else {
            id = 1;
        }

        const product = new Product({
            id: id,
            email: req.body.email,
            name: req.body.name,
            size: req.body.size,
            tags: req.body.tags,
            description: req.body.description,
            image: req.body.image,
            category: req.body.category,
            subcategory: req.body.subcategory || '',
            crop_type: req.body.crop_type,
            brand: req.body.brand || '',
            unit: req.body.unit || 'unit',
            stock: Number(req.body.stock) || 0,
            options: req.body.options || {},
            new_price: req.body.new_price,
            old_price: req.body.old_price,
        });
        await product.save();
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint for removing products
app.post('/removeproduct', async (req, res) => {
    try {
        await Product.findOneAndDelete({
            id: req.body.id
        });
        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// creating api for getting all products

app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched ");
    res.send(products);
})

// Endpoint for filtering products by category
app.get('/product/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category: category });
        console.log(`Products fetched for category: ${category} (${products.length} items)`);
        res.json(products);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint to seed database with sample products (with force option)
app.get('/seed-products', async (req, res) => {
    try {
        // Check if products already exist
        const existingCount = await Product.countDocuments({});
        const force = req.query.force === 'true';
        
        if (existingCount > 0 && !force) {
            return res.json({
                success: false,
                message: 'Database already has products. Use ?force=true to reseed.',
                count: existingCount
            });
        }

        // Clear existing products if force is true
        if (force && existingCount > 0) {
            await Product.deleteMany({});
            console.log("✅ Cleared existing products");
        }

        // Get list of uploaded images
        const fs = require('fs');
        const imagePath = './upload/images';
        let uploadedImages = [];
        
        try {
            uploadedImages = fs.readdirSync(imagePath).filter(file => 
                file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
            );
        } catch (err) {
            console.log("No uploaded images found, using placeholder URLs");
        }

        // Function to assign image from uploaded images
        const getImageUrl = (index) => {
            if (uploadedImages.length > 0) {
                const imgIndex = index % uploadedImages.length;
                return `http://13.233.124.185/images/${uploadedImages[imgIndex]}`;
            }
            return `http://13.233.124.185/images/placeholder.jpg`;
        };

        // Sample products for all categories
        const sampleProducts = [
            // Pesticides
            { name: 'Neem Pesticide 500ml', category: 'Pesticides', crop_type: 'General', new_price: 250, old_price: 350 },
            { name: 'Pyrethroids Insecticide 1L', category: 'Pesticides', crop_type: 'Vegetable', new_price: 450, old_price: 550 },
            { name: 'Copper Fungicide 500ml', category: 'Pesticides', crop_type: 'Tomato', new_price: 320, old_price: 420 },
            { name: 'Mancozeb Fungicide 500g', category: 'Pesticides', crop_type: 'Crop', new_price: 280, old_price: 380 },
            { name: 'Organophosphate Pesticide 1L', category: 'Pesticides', crop_type: 'Field', new_price: 380, old_price: 480 },

            // Fertilizers
            { name: 'NPK 10-10-10 Fertilizer 25kg', category: 'Fertilizers', crop_type: 'Vegetable', new_price: 450, old_price: 600 },
            { name: 'Urea Fertilizer 50kg', category: 'Fertilizers', crop_type: 'General', new_price: 350, old_price: 450 },
            { name: 'Potash Fertilizer 25kg', category: 'Fertilizers', crop_type: 'Fruit', new_price: 500, old_price: 650 },
            { name: 'Phosphate Fertilizer 25kg', category: 'Fertilizers', crop_type: 'Crop', new_price: 420, old_price: 550 },
            { name: 'Organic Compost 20kg', category: 'Fertilizers', crop_type: 'Vegetable', new_price: 280, old_price: 380 },

            // Organic
            { name: 'Organic Vermicompost 25kg', category: 'Organic', crop_type: 'Vegetable', new_price: 350, old_price: 450 },
            { name: 'Bio Fertilizer Azospirillum', category: 'Organic', crop_type: 'General', new_price: 200, old_price: 300 },
            { name: 'Cow Dung Manure 50kg', category: 'Organic', crop_type: 'Crop', new_price: 150, old_price: 250 },
            { name: 'Seaweed Extract 1L', category: 'Organic', crop_type: 'Vegetable', new_price: 320, old_price: 420 },
            { name: 'Neem Cake 25kg', category: 'Organic', crop_type: 'Field', new_price: 280, old_price: 380 },

            // Herbicides
            { name: '2,4-D Herbicide 1L', category: 'Herbicides', crop_type: 'Field', new_price: 380, old_price: 480 },
            { name: 'Glyphosate Herbicide 500ml', category: 'Herbicides', crop_type: 'General', new_price: 420, old_price: 520 },
            { name: 'Paraquat Herbicide 1L', category: 'Herbicides', crop_type: 'Crop', new_price: 450, old_price: 550 },
            { name: 'Atrazine Herbicide 500ml', category: 'Herbicides', crop_type: 'Maize', new_price: 350, old_price: 450 },
            { name: 'Pendimethalin Herbicide 1L', category: 'Herbicides', crop_type: 'Vegetable', new_price: 380, old_price: 480 },

            // Seeds
            { name: 'Tomato Seeds Premium', category: 'seed', crop_type: 'Tomato', new_price: 120, old_price: 180 },
            { name: 'Onion Seeds High Yield', category: 'seed', crop_type: 'onion', new_price: 100, old_price: 150 },
            { name: 'Carrot Seeds Organic', category: 'seed', crop_type: 'Vegetable', new_price: 80, old_price: 130 },
            { name: 'Wheat Seeds', category: 'seed', crop_type: 'Crop', new_price: 50, old_price: 100 },
            { name: 'Chilli Seeds', category: 'seed', crop_type: 'Vegetable', new_price: 150, old_price: 220 },

            // Others
            { name: 'Soil Testing Kit', category: 'others', crop_type: 'General', new_price: 500, old_price: 700 },
            { name: 'Drip Irrigation Setup', category: 'others', crop_type: 'Field', new_price: 3500, old_price: 5000 },
            { name: 'Farm Tools Kit', category: 'others', crop_type: 'General', new_price: 2500, old_price: 3500 },
            { name: 'Pruning Shears', category: 'others', crop_type: 'General', new_price: 350, old_price: 500 },
            { name: 'Mulch Paper', category: 'others', crop_type: 'Vegetable', new_price: 450, old_price: 600 },

            // Stationary
            { name: 'Farm Notebook A4', category: 'stationary', crop_type: 'General', new_price: 80, old_price: 120 },
            { name: 'Agriculture Guidebook', category: 'stationary', crop_type: 'General', new_price: 250, old_price: 350 },
            { name: 'Weather Station Record Book', category: 'stationary', crop_type: 'Field', new_price: 120, old_price: 180 },
            { name: 'Crop Calendar Planner', category: 'stationary', crop_type: 'General', new_price: 250, old_price: 350 },
            { name: 'Chemical Labels (per 100)', category: 'stationary', crop_type: 'Field', new_price: 100, old_price: 150 }
        ];

        let productId = (await Product.find({})).length + 1;
        
        for (let i = 0; i < sampleProducts.length; i++) {
            const product = sampleProducts[i];
            const newProduct = new Product({
                id: productId++,
                email: 'admin@farmconnect.com',
                name: product.name,
                category: product.category,
                crop_type: product.crop_type,
                new_price: product.new_price,
                old_price: product.old_price,
                image: getImageUrl(i),
                size: 'Standard',
                tags: product.category,
                description: `High-quality ${product.name.toLowerCase()} for professional farmers`,
                available: true
            });
            await newProduct.save();
        }

        res.json({
            success: true,
            message: `${sampleProducts.length} sample products added successfully`,
            count: sampleProducts.length
        });
        console.log(`✅ Added ${sampleProducts.length} sample products to database`);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Schema creating for User model

const Users = mongoose.model('user', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
    },
    cartdata: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number
    }
})

// Endpoint for Adding User

app.post('/adduser', async (req, res) => {
    try {
        // Check if a user with the same email already exists
        const existingUser = await Users.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                errors: "Existing user found with same email id"
            });
        }

        const user = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        });
        await user.save();
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})

// endpoint for List Out Users

app.get('/alluser', async (req, res) => {
    let users = await Users.find({});
    console.log("All Users fetched ");
    res.send(users);
})

// endpoint for Removing users

app.post('/removeuser', async (req, res) => {
    try {
        await Users.findOneAndDelete({
            email: req.body.email
        });
        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Creating Endpoint for signup

app.post('/signup', async (req, res) => {
    try {
        const { email, password, username, role, latitude, longitude } = req.body;

        // Validation
        if (!email || !password || !username || !role) {
            return res.status(400).json({
                success: false,
                errors: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                errors: "Password must be at least 6 characters long"
            });
        }

        let check = await Users.findOne({ email });
        if (check) {
            return res.status(400).json({
                success: false,
                errors: "User already exists with this email"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        const user = new Users({
            name: username,
            email,
            role,
            password: hashedPassword,
            latitude: latitude || 0,
            longitude: longitude || 0,
            cartdata: cart,
        });

        await user.save();

        const data = {
            user: {
                id: user._id
            }
        };

        const token = jwt.sign(data, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            errors: error.message
        });
    }
});

// creating endpoint for user login

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                errors: "Email and password are required"
            });
        }

        let user = await Users.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                errors: "User not found"
            });
        }

        // Compare passwords
        const passcompare = await bcrypt.compare(password, user.password);
        if (!passcompare) {
            return res.status(400).json({
                success: false,
                errors: "Invalid password"
            });
        }

        const data = {
            user: {
                id: user._id
            }
        };

        const token = jwt.sign(data, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            errors: error.message
        });
    }
});

// creating endpoint for new collections

app.get('/newcollection', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NEW COLLECTION FETCHED ");
    res.send(newcollection);

})

// creating endpoints popular in Onion

app.get('/popularinonion', async (req, res) => {
    let products = await Product.find({
        category: "onion"
    });
    let popular = products.slice(0, 6);
    console.log("Popular in onions fetched");
    res.send(popular);
})

// Creating middleware to fetch the user
const fetchuser = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send({
            errors: "Please authenticate using valid token"
        });
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error) {
        res.status(401).send({
            errors: "Invalid or expired token"
        });
    }
};

// Creating endpoints for adding product into cartdata
app.post('/addtocart', fetchuser, async (req, res) => {
    try {
        console.log("Added", req.body.itemId);
        let userdata = await Users.findOne({
            _id: req.user.id
        });
        if (!userdata) {
            return res.status(404).send("User not found");
        }
        userdata.cartdata[req.body.itemId] += 1;
        await Users.findByIdAndUpdate(req.user.id, {
            cartdata: userdata.cartdata
        });
        res.send("Added");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/removefromcart', fetchuser, async (req, res) => {
    try {
        console.log("Removed", req.body.itemId);
        let userdata = await Users.findOne({
            _id: req.user.id
        });

        if (userdata.cartdata[req.body.itemId] > 0) {
            userdata.cartdata[req.body.itemId] -= 1;
        }

        await Users.findOneAndUpdate({
            _id: req.user.id
        }, {
            cartdata: userdata.cartdata
        })

        res.send("Removed");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Creating endpoint to get cartdata
app.post('/getcart', fetchuser, async (req, res) => {
    try {
        console.log("Get cart");
        let userdata = await Users.findOne({
            _id: req.user.id
        });
        res.json(userdata.cartdata);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

const Orders = mongoose.model('Orders', {

    id: {
        type: Number,
    },

    user: {
        type: String,
        require: true,
    },

    name: {
        type: String,
        require: true,
    },

    lname: {
        type: String,
        require: true,
    },

    email: {
        type: String,
        require: true,
    },
    contact: {
        type: Number,
        require: true,
    },

    payment: {
        type: String,
        require: true
    },

    // PhonePe Payment Tracking Fields
    transactionId: {
        type: String,
        default: null,
    },

    merchantTransactionId: {
        type: String,
        default: null,
        index: true,
    },

    paymentStatus: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
        default: 'PENDING',
    },

    paymentMethod: {
        type: String,
        default: null,
    },

    amount: {
        type: Number,
        default: 0,
    },

    paymentResponse: {
        type: String,
        default: null,
    },

    paymentDate: {
        type: Date,
        default: null,
    },

    address: {
        type: String,
        require: true,
    },

    cartdata: {
        type: Object,
    },

    status: {
        type: Boolean
    },

    date: {
        type: Date,
        default: Date.now
    }
});

// creating endpoint for adding the order

app.post(('/addorder'), async (req, res) => {
    try {
        const lastOrder = await Orders.findOne().sort({ id: -1 });
        const id = lastOrder ? (lastOrder.id || 0) + 1 : 1;

        const order = new Orders({
            id: id,
            name: req.body.name,
            user: req.body.user,
            lname: req.body.lname,
            email: req.body.email,
            contact: req.body.contact,
            payment: req.body.payment,
            transactionId: req.body.transactionId || null,
            merchantTransactionId: req.body.merchantTransactionId || null,
            paymentStatus: req.body.paymentStatus || 'PENDING',
            paymentMethod: req.body.paymentMethod || req.body.payment,
            amount: Number(req.body.amount) || 0,
            address: req.body.address,
            cartdata: req.body.cartdata,
            status: req.body.status
        });

        await order.save();
        res.json({
            success: true,
            name: req.body.name,
            orderId: order._id,
            merchantTransactionId: order.merchantTransactionId,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})

// Mount modular PhonePe payment routes
app.use('/api/payment', paymentRoutes);

// Legacy status endpoint (for backward compatibility)
app.get('/status', async (req, res) => {
    try {
        const merchantTransactionId = req.query.id;
        if (!merchantTransactionId) {
            return res.status(400).json({ error: 'Transaction id is required' });
        }
        // Redirect to the new modular endpoint
        return res.redirect(`/api/payment/status/${encodeURIComponent(merchantTransactionId)}`);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// creating endpoint for fetching the pending orders

app.get('/pending', async (req, res) => {
    let orders = await Orders.find({
        status: false
    });
    console.log("All Pending Orders fetched ");
    res.send(orders);
})

// creating endpoint for fetching te complete orders

app.get('/complete', async (req, res) => {
    let orders = await Orders.find({
        status: true
    });
    console.log("All Complete Orders fetched ");
    res.send(orders);
})

// creating endpoint for fetching the perticular shopkeeper orders

app.post('/spending', async (req, res) => {
    const {
        email
    } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            error: "Invalid email format."
        });
    }

    try {
        let orders = await Orders.find({
            status: false,
            'cartdata.email': email
        });
        console.log("Orders with specific email in cartdata fetched");
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// creating endpoint for fetching the perticular shopkeeper orders

app.post('/scomplete', async (req, res) => {
    const {
        email
    } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            error: "Invalid email format."
        });
    }

    try {
        let orders = await Orders.find({
            status: true,
            'cartdata.email': email
        });
        console.log("Orders with specific email in cartdata fetched");
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// craeting schema for subscribers

const subscribers = mongoose.model('Subscribers', {
    user: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

// creating endpoints for adding the subscribers

app.post('/subscribe', async (req, res) => {
    try {
        let check = await subscribers.findOne({
            email: req.body.email
        });
        if (check) {
            return res.status(400).json({
                success: false,
                errors: "Email already Subscribed"
            });
        }
        const subscribe = new subscribers({
            user: req.body.user,
            email: req.body.email,
        });

        await subscribe.save()

        res.json({
            success: true,
            email: req.body.email
        })
        console.log("Subscribe addeds", req.body.email);
    } catch (errors) {
        res.json({
            success: false,
            errors: errors.message
        })
    }
})

// creating endpoint for fetching the subscribers for it

app.get('/getsub', async (req, res) => {
    let subscribe = await subscribers.find({});
    console.log("All Complete Orders fetched ");
    res.send(subscribe);
})

// creating endpoints for unsubscribe 

app.post('/unsub', async (req, res) => {
    try {
        let check = await subscribers.findOne({
            email: req.body.email
        });
        if (!check) {
            return res.status(400).json({
                success: false,
                errors: "Email Not Found "
            });
        }
        await subscribers.findOneAndDelete({
            email: req.body.email
        });
        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// creating endpoint for fetching particular user 

app.get('/peruser', fetchuser, async (req, res) => {
    try {
        console.log("Get User Details");
        let user = await Users.findOne({
            _id: req.user.id
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})

// creating schema for farmer profile

const Farmers = mongoose.model('farmer', {

    email: {
        type: String,
        require: true
    },

    address: {
        type: String,
        require: true
    },

    phone: {
        type: Number,
        require: true
    },

    area: {
        type: String,
        require: true
    },

    farm_type: {
        type: String,
        require: true
    },

    soil_type: {
        type: String,
        require: true
    },

    crop_grown: {
        type: String,
        require: true
    },

    fertilizers: {
        type: String,
        require: true
    }
})

// creating schema for worker profile

const workers = mongoose.model('worker', {

    email: {
        type: String,
        require: true
    },

    address: {
        type: String,
        require: true
    },

    phone: {
        type: Number,
        require: true
    },

    birth: {
        type: String,
        require: true
    },

    time: {
        type: String,
        require: true
    },

    skills: {
        type: String,
        require: true
    },

    salary: {
        type: String,
        require: true
    }
})

// creating schema for merchant

const merchant = mongoose.model('merchant', {

    email: {
        type: String,
        require: true
    },

    address: {
        type: String,
        require: true
    },

    phone: {
        type: Number,
        require: true
    },

    business: {
        type: String,
        require: true
    },

    area: {
        type: String,
        require: true
    },

    payment: {
        type: String,
        require: true
    },

    goods: {
        type: String,
        require: true
    }
})

// creating modules for shopkeeper

const shopkeepers = mongoose.model('shopkeeper', {

    email: {
        type: String,
        require: true
    },

    ownaddress: {
        type: String,
        require: true
    },

    shaddress: {
        type: String,
        require: true
    },

    phoneno: {
        type: Number,
        require: true
    },

    shname: {
        type: String,
        require: true
    },

    shtype: {
        type: String,
        require: true
    },

    ophours: {
        type: String,
        require: true
    },

    payment: {
        type: String,
        require: true
    }

})

// creating endpoint for storing farmers information

app.post('/farmerd', async (req, res) => {
    try {
        let check = await Farmers.findOne({
            email: req.body.email
        });

        if (check) {
            return res.status(400).json({
                success: false,
                errors: "You already Enter Your Basic Details"
            });
        }
        const farmerdata = new Farmers({
            email: req.body.email,
            address: req.body.address,
            phone: req.body.phone,
            area: req.body.area,
            farm_type: req.body.farm_type,
            soil_type: req.body.soil_type,
            crop_grown: req.body.crop_grown,
            fertilizers: req.body.fertilizers
        });

        await farmerdata.save();

        res.json({
            success: true,
            email: req.body.email
        })

        console.log("Profile adds successfully !!!", req.body.email);

    } catch (error) {
        res.json({
            success: false,
            error: error.message
        })
    }
})
// creating endpoint for fetching the farmers

app.post('/perfarmer', async (req, res) => {
    try {
        const {
            email
        } = req.body;
        if (!email) {
            return res.status(400).send("Email is required");
        }

        let farmer = await Farmers.findOne({
            email: email
        });

        if (!farmer) {
            return res.status(404).send("Farmer not found");
        }

        res.json(farmer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// creating endpoint for storing workers data

app.post('/workerd', async (req, res) => {
    try {
        let existingWorker = await workers.findOne({
            email: req.body.email
        });

        if (existingWorker) {
            return res.status(400).json({
                success: false,
                message: "Worker with this email already exists"
            });
        }

        const workerdata = new workers({
            email: req.body.email,
            address: req.body.address,
            phone: req.body.phone,
            birth: req.body.birth,
            time: req.body.time,
            skills: req.body.skills,
            salary: req.body.salary
        });


        await workerdata.save();

        res.json({
            success: true,
            message: "Worker profile added successfully",
            email: req.body.email
        });

        console.log("Profile added successfully for:", req.body.email);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// endpoint for fetching perticular worker

app.post('/perworker', async (req, res) => {
    try {
        const {
            email
        } = req.body;
        if (!email) {
            return res.status(400).send("Email is required");
        }

        let worker = await workers.findOne({
            email: email
        });

        if (!worker) {
            return res.status(404).send("Farmer not found");
        }

        res.json(worker);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// fetching perticular merchats data for their profile

app.post('/permerchant', async (req, res) => {
    try {
        const {
            email
        } = req.body;

        if (!email) {
            return res.status(400).send("Email is required");
        }

        let merchantdata = await merchant.findOne({
            email: email
        });

        if (!merchantdata) {
            return res.status(400).send("Farmer not found");
        }

        res.json(merchantdata);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});

// creating endpoint for Fetching profile for ShopKeeper 

app.post('/pershop', async (req, res) => {
    try {
        const {
            email
        } = req.body;
        if (!email) {
            return res.status(400).send("Email is Required ");
        }
        let Shopkeeper = await shopkeepers.findOne({
            email: email
        });
        if (!Shopkeeper) {
            return res.status(404).send("farmer Not Found ");
        }
        res.json(Shopkeeper);
    } catch (error) {
        console.error(error);
        res.status(500).send("internal server Error");
    }
})

// creating api for getting all products for perticular shopkeeper

app.post('/allsproducts', async (req, res) => {

    const {
        email
    } = req.body;
    if (!email) {
        return res.status(400).send("Email is Required ");
    }

    let products = await Product.find({
        email: email
    });
    console.log("Products Fetched for ", email);
    res.send(products);
})

app.get('/myproducts', fetchuser, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        const products = await Product.find({ email: user.email });
        console.log("Products Fetched for logged-in user", user.email);
        res.json(products);
    } catch (error) {
        console.error("Error fetching my products:", error);
        res.status(500).json({ error: error.message });
    }
});

// creating Api for fetching the shopkeeper data for perticular product

app.post('/shopkeeperdatas', async (req, res) => {
    const {
        email
    } = req.body;
    const {
        id
    } = req.body;

    if (!email) {
        return res.status(400).send("Email is required.");
    }

    try {
        const data = await shopkeepers.findOne({
            email: email
        });

        if (!data) {
            return res.status(404).send("Shopkeeper not found.");
        }

        console.log("Shopkeeper fetched for product Id: ", id);
        res.send(data);

    } catch (error) {
        console.error("Error fetching shopkeeper data: ", id);
        res.status(500).send("Internal Server Error.");
    }
});

// fetching related farmers 

app.get('/rfarmers', async (req, res) => {

    let rfarmers = await Farmers.find({});
    console.log("Related Farmers Fetched ");
    res.send(rfarmers);
})

// fetching user those who is farmer

app.get('/farmeruser', async (req, res) => {
    try {
        const users = await Users.find({
            role: "Farmer"
        });
        console.log("All Farmer users fetched:", users.length);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching farmer users:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

// shema for related shopkeepers and theire data

app.get('/rshopkeepers', async (req, res) => {
    let rshopkeepers = await shopkeepers.find({});
    console.log("Related Shopkeepers Fetched ");
    res.send(rshopkeepers);
})

app.get('/shopkeeperuser', async (req, res) => {
    try {
        const users = await Users.find({
            role: "Shopkeeper"
        });
        console.log("All Shopkeeper users fetched:", users.length);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching Shopkeeper users:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
})

// shema for related merchant and theire data

app.get('/rmerchants', async (req, res) => {
    let rmerchant = await merchant.find({});
    console.log("Related Merchants Fetched ");
    res.send(rmerchant);
})

app.get('/merchantuser', async (req, res) => {
    try {
        const users = await Users.find({
            role: "Merchant"
        });
        console.log("All Merchant users fetched:", users.length);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching Merchant users:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
})

// shema for related workers and theire data

app.get('/rworkers', async (req, res) => {
    let rworkers = await workers.find({});
    res.send(rworkers);
    console.log("Related Workers Fetched ");
})

app.get('/workersuser', async (req, res) => {
    try {
        const users = await Users.find({
            role: "Worker"
        });
        res.status(200).json(users);
        console.log("All Worker users fetched:", users.length);
    } catch (error) {
        console.error("Error fetching Worker users:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
})

// schema for fetching complete orders for perticular farmer 

app.post('/fcomplete', async (req, res) => {
    const {
        email
    } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            error: "Invalid email format."
        });
    }

    try {
        let orders = await Orders.find({
            status: true,
            'user': email
        });
        console.log("Complete Orders with specific email fetched");
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// schema for fetching pending orders for perticular farmer 

app.post('/fpending', async (req, res) => {
    const {
        email
    } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            error: "Invalid email format."
        });
    }

    try {
        let orders = await Orders.find({
            status: false,
            'user': email
        });
        console.log("Pending Orders with specific email fetched with count ", orders.length);
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// schema for Farmers products

const FProductSchema = mongoose.model('fproduct', {
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    quantity: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    quality: {
        type: String,
        required: true,
    },
    packagetype: {
        type: String,
        required: true,
    },
    harverstD: {
        type: Date,
        required: true,
    },
    expireD: {
        type: Date,
        required: true,
    },
    fertilizersused: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    timeframe: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean
    },
});

// endpoint for uploading farmers products details here

app.post('/addfproduct', async (req, res) => {
    try {

        const product = new FProductSchema({
            email: req.body.email,
            name: req.body.name,
            image: req.body.image,
            description: req.body.description,
            quantity: req.body.quantity,
            price: req.body.price,
            quality: req.body.quality,
            packagetype: req.body.packagetype,
            harverstD: req.body.harverstD,
            expireD: req.body.expireD,
            fertilizersused: req.body.fertilizersused,
            location: req.body.location,
            timeframe: req.body.timeframe,
            status: req.body.status
        });

        await product.save();

        res.json({
            success: true,
            name: req.body.name,
            message: 'Product added successfully!'
        });

        console.log("Product added for Farmer:", req.body.email);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// creating endpoint for fetching farmers pending product that is not selled by other merchant

app.post('/fpendingp', async (req, res) => {
    const {
        email
    } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            error: "Invalid email format."
        });
    }

    try {
        let orders = await FProductSchema.find({
            status: false,
            'email': email
        });
        console.log("Pending Orders with specific email fetched with count ", orders.length);
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// creating endpoint for fetching farmers complete product that is selled by other merchant

app.post('/fcompletep', async (req, res) => {
    const {
        email
    } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            error: "Invalid email format."
        });
    }

    try {
        let orders = await FProductSchema.find({
            status: true,
            'email': email
        });
        console.log("Complete Orders with specific email fetched with count ", orders.length);
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// creating schema for earnings

const earning = mongoose.model('earning', {
    email: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        require: true
    },
    reason: {
        type: String,
        require: true
    },
    amount: {
        type: Number,
        require: true
    }
})

// endpoint for uploading farmers income

app.post('/income', async (req, res) => {

    try {
        const income = new earning({
            email: req.body.email,
            type: req.body.type,
            reason: req.body.reason,
            amount: req.body.amount
        });

        console.log('Income Altered Successfully');

        await income.save();

        res.send({
            success: true,
            email: req.body.email,
            message: "Income altered Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

// craeting endpoint for fetching the income

app.get('/fearning', async (req, res) => {
    try {
        const earn = await earning.find({
            type: "Earn"
        });
        res.status(200).json(earn);
        console.log("All Earn Alteration fetched:", earn.length);
    } catch (error) {
        console.error("Error fetching Investment:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
})

// investment

app.get('/finvest', async (req, res) => {
    try {
        const earn = await earning.find({
            type: "Invest"
        });
        res.status(200).json(earn);
        console.log("All Invest Alteration fetched:", earn.length);
    } catch (error) {
        console.error("Error fetching Investment:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
})

// schema for feedback

const feedback = mongoose.model('feedback', {
    email: {
        type: String,
        require: true
    },
    name: {
        type: String,
        require: true
    },
    entityType: {
        type: String,
        require: true
    },
    whome: {
        type: String,
        require: true
    },
    comments: {
        type: String,
        require: true
    },
    rating: {
        type: Number,
        require: true
    }
});

// creating endpoint for feedback storing
app.post('/addfeedback', async (req, res) => {
    try {
        const newFeedback = new feedback({
            email: req.body.email,
            name: req.body.name,
            entityType: req.body.entityType,
            whome: req.body.whome,
            comments: req.body.comments,
            rating: req.body.rating
        });

        console.log("Feedback added by ", req.body.email);

        await newFeedback.save();

        res.status(201).json({
            success: true,
            email: req.body.email,
            message: "Feedback saved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// creating endpoint for storing the work

const fwork = mongoose.model('farmerwork', {
    email: {
        type: String,
        require: true
    },
    task: {
        type: String,
        require: true
    },
    location: {
        type: String,
        require: true
    },
    nopeople: {
        type: Number,
        require: true
    },
    salary: {
        type: Number,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '24h'
    }
});

app.post('/addFarmingWork', async (req, res) => {
    try {
        const newwork = new fwork({
            email: req.body.email,
            task: req.body.task,
            location: req.body.location,
            nopeople: req.body.nopeople,
            salary: req.body.salary,
            description: req.body.description
        });

        console.log("Work added by ", req.body.email);

        await newwork.save();

        res.status(201).json({
            success: true,
            email: req.body.email,
            message: "Work Added Successfully successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

cron.schedule('* * * * *', async () => {
    const currentTime = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(24, 0, 0, 0);

    if (currentTime.getHours() >= 24) {
        try {
            await fwork.deleteMany({ createdAt: { $lt: cutoffTime } });
            console.log("Expired works deleted.");
        } catch (error) {
            console.error("Error deleting expired works:", error);
        }
    }
});

// Global error handler middleware (must be last)
app.use(errorHandler);

// Start the server
server.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on port " + port);
        console.log("Socket.IO chat server is active");
    } else {
        console.log("Error : " + error);
    }
});