const mongoose = require("mongoose");
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://HARSHAD:HARSHAD@ac-2ayfpqy-shard-00-00.yzv2blz.mongodb.net:27017,ac-2ayfpqy-shard-00-01.yzv2blz.mongodb.net:27017,ac-2ayfpqy-shard-00-02.yzv2blz.mongodb.net:27017/e-commerce?ssl=true&replicaSet=atlas-147c89-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log("Connected to MongoDB for DB Migration.");
    
    // Minimal product schema just for updating images
    const Product = mongoose.model("product", new mongoose.Schema({
        image: String
    }, { strict: false }));
    
    const products = await Product.find({ image: { $regex: 'localhost' } });
    console.log(`Found ${products.length} products with localhost image URLs.`);
    
    let updatedCount = 0;
    for (let p of products) {
        const newImage = p.image.replace(/http:\/\/localhost:\d+/g, 'http://13.233.124.185');
        p.image = newImage;
        await p.save();
        updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} product image URLs successfully.`);
    process.exit(0);
})
.catch(err => {
    console.error("Migration Error:", err);
    process.exit(1);
});
