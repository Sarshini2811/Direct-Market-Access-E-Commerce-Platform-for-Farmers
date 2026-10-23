/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const {
  User, FarmerProfile, Product, Order, Review, Notification,
  PreOrder, GroupBuy, VerificationRequest, PaymentRecord,
  PriceHistory, ExternalPriceReference,
} = require('../models');

const DESTROY = process.argv.includes('--destroy');

async function destroyAll() {
  await Promise.all([
    User.deleteMany(), FarmerProfile.deleteMany(), Product.deleteMany(),
    Order.deleteMany(), Review.deleteMany(), Notification.deleteMany(),
    PreOrder.deleteMany(), GroupBuy.deleteMany(), VerificationRequest.deleteMany(),
    PaymentRecord.deleteMany(), PriceHistory.deleteMany(), ExternalPriceReference.deleteMany(),
  ]);
  console.log('[seed] All collections cleared.');
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function run() {
  await connectDB();
  await destroyAll();
  if (DESTROY) {
    console.log('[seed] --destroy flag set: database cleared, no new data inserted.');
    return mongoose.disconnect();
  }

  console.log('[seed] Creating admin...');
  const admin = await User.create({
    name: 'Platform Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@farmmarket.demo',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  });

  console.log('[seed] Creating farmers...');
  const farmerSeeds = [
    { name: 'Murugan Velu', farmName: 'Velu Organic Farms', district: 'Coimbatore', state: 'Tamil Nadu', verified: true, type: 'organic' },
    { name: 'Lakshmi Narayanan', farmName: 'Narayanan Paddy Fields', district: 'Thanjavur', state: 'Tamil Nadu', verified: true, type: 'conventional' },
    { name: 'Karthik Raja', farmName: 'Raja Fruit Orchards', district: 'Theni', state: 'Tamil Nadu', verified: false, type: 'mixed' },
    { name: 'Ananya Reddy', farmName: 'Reddy Spice Gardens', district: 'Guntur', state: 'Andhra Pradesh', verified: true, type: 'organic' },
  ];

  const farmers = [];
  for (const f of farmerSeeds) {
    const user = await User.create({
      name: f.name,
      email: `${f.name.split(' ')[0].toLowerCase()}@farmmarket.demo`,
      password: 'Farmer@12345',
      role: 'farmer',
      phone: '9' + Math.floor(100000000 + Math.random() * 899999999),
    });
    const profile = await FarmerProfile.create({
      user: user._id,
      farmName: f.farmName,
      farmingType: f.type,
      location: { district: f.district, state: f.state, pincode: '600001' },
      bio: `${f.farmName} has been growing quality produce for local and regional buyers.`,
      yearsFarming: 5 + Math.floor(Math.random() * 15),
      verificationStatus: f.verified ? 'verified' : 'unverified',
      verifiedAt: f.verified ? new Date() : undefined,
    });
    farmers.push({ user, profile });
  }

  // one pending verification request for the unverified farmer, to populate admin dashboard
  const unverified = farmers.find((f) => f.profile.verificationStatus === 'unverified');
  await VerificationRequest.create({
    farmer: unverified.user._id,
    farmerProfile: unverified.profile._id,
    documents: [{ name: 'Land record', url: '/uploads/sample-land-record.pdf' }],
    farmerNote: 'Please verify my farm — documents attached.',
    status: 'pending',
  });
  unverified.profile.verificationStatus = 'pending';
  await unverified.profile.save();

  console.log('[seed] Creating buyers...');
  const buyerSeeds = [
    { name: 'Priya Sharma' }, { name: 'Rahul Iyer' }, { name: 'Fresh Mart Retail' }, { name: 'Spice Route Restaurant' },
  ];
  const buyers = [];
  for (const b of buyerSeeds) {
    const user = await User.create({
      name: b.name,
      email: `${b.name.split(' ')[0].toLowerCase()}@buyer.demo`,
      password: 'Buyer@12345',
      role: 'buyer',
      phone: '8' + Math.floor(100000000 + Math.random() * 899999999),
      address: { line1: '12 MG Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
    });
    buyers.push(user);
  }

  console.log('[seed] Creating products...');
  const productSeeds = [
    {
      farmer: 0,
      name: 'Fresh Tomatoes',
      category: 'vegetables',
      unit: 'kg',
      price: 28,
      qty: 400,
      wholesale: true,
      minQty: 50,
      wsPrice: 22,
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 0,
      name: 'Organic Spinach',
      category: 'vegetables',
      unit: 'kg',
      price: 40,
      qty: 150,
      wholesale: false,
      images: [
        'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 0,
      name: 'Crisp Red Onions',
      category: 'vegetables',
      unit: 'kg',
      price: 32,
      qty: 500,
      wholesale: true,
      minQty: 50,
      wsPrice: 26,
      images: [
        'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 0,
      name: 'Farm Fresh Potatoes',
      category: 'vegetables',
      unit: 'kg',
      price: 25,
      qty: 800,
      wholesale: true,
      minQty: 100,
      wsPrice: 20,
      images: [
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 1,
      name: 'Sona Masoori Rice',
      category: 'grains',
      unit: 'kg',
      price: 55,
      qty: 2000,
      wholesale: true,
      minQty: 100,
      wsPrice: 48,
      images: [
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 1,
      name: 'Golden Whole Wheat',
      category: 'grains',
      unit: 'kg',
      price: 42,
      qty: 1200,
      wholesale: true,
      minQty: 80,
      wsPrice: 36,
      images: [
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 1,
      name: 'Toor Dal',
      category: 'pulses',
      unit: 'kg',
      price: 110,
      qty: 500,
      wholesale: true,
      minQty: 50,
      wsPrice: 98,
      images: [
        'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 1,
      name: 'Organic Kabuli Chana',
      category: 'pulses',
      unit: 'kg',
      price: 135,
      qty: 450,
      wholesale: true,
      minQty: 40,
      wsPrice: 120,
      images: [
        'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 2,
      name: 'Alphonso Mangoes',
      category: 'fruits',
      unit: 'dozen',
      price: 450,
      qty: 80,
      wholesale: false,
      surplus: true,
      discount: 15,
      images: [
        'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 2,
      name: 'Nendran Bananas',
      category: 'fruits',
      unit: 'dozen',
      price: 60,
      qty: 200,
      wholesale: false,
      images: [
        'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 2,
      name: 'Shimla Fresh Apples',
      category: 'fruits',
      unit: 'kg',
      price: 170,
      qty: 350,
      wholesale: true,
      minQty: 30,
      wsPrice: 150,
      images: [
        'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 2,
      name: 'Sweet Crunchy Carrots',
      category: 'vegetables',
      unit: 'kg',
      price: 46,
      qty: 300,
      wholesale: false,
      images: [
        'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 3,
      name: 'Guntur Red Chilli',
      category: 'spices',
      unit: 'kg',
      price: 220,
      qty: 300,
      wholesale: true,
      minQty: 20,
      wsPrice: 195,
      images: [
        'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 3,
      name: 'Turmeric Powder',
      category: 'spices',
      unit: 'kg',
      price: 180,
      qty: 250,
      wholesale: false,
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      farmer: 3,
      name: 'Black Malabar Peppercorn',
      category: 'spices',
      unit: 'kg',
      price: 540,
      qty: 120,
      wholesale: true,
      minQty: 10,
      wsPrice: 490,
      images: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  const products = [];
  for (const p of productSeeds) {
    const farmer = farmers[p.farmer];
    const product = await Product.create({
      farmer: farmer.user._id,
      name: p.name,
      description: `Farm-fresh ${p.name.toLowerCase()} sourced directly from ${farmer.profile.farmName}, ${farmer.profile.location.district}.`,
      category: p.category,
      variety: 'Standard',
      grade: 'A',
      unit: p.unit,
      price: p.price,
      images: p.images || [],
      wholesale: p.wholesale
        ? { enabled: true, minQuantity: p.minQty, pricePerUnit: p.wsPrice }
        : { enabled: false },
      quantityAvailable: p.qty,
      harvestDate: monthsAgo(0),
      expiryOrFreshUntil: daysFromNow(10),
      deliveryOptions: { pickup: true, delivery: true, deliveryFee: 30, estimatedDays: 2 },
      isSurplusDiscount: !!p.surplus,
      surplusDiscountPercent: p.discount || 0,
      location: { district: farmer.profile.location.district, state: farmer.profile.location.state },
    });
    products.push(product);
  }

  console.log('[seed] Creating historical delivered orders (for analytics + price trends)...');
  for (let m = 5; m >= 0; m--) {
    for (let i = 0; i < 3; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const qty = 2 + Math.floor(Math.random() * 8);
      const priceVariance = product.price * (0.9 + Math.random() * 0.2);
      const lineTotal = +(priceVariance * qty).toFixed(2);
      const orderDate = monthsAgo(m);

      const order = await Order.create({
        buyer: buyer._id,
        items: [{
          product: product._id,
          farmer: product.farmer,
          nameSnapshot: product.name,
          unit: product.unit,
          quantity: qty,
          pricePerUnit: +priceVariance.toFixed(2),
          lineTotal,
        }],
        itemsTotal: lineTotal,
        deliveryFee: 30,
        totalAmount: lineTotal + 30,
        status: 'delivered',
        paymentStatus: 'paid',
        deliveryMethod: 'delivery',
        deliveryAddress: { line1: '12 MG Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
        statusHistory: [{ status: 'placed', at: orderDate }, { status: 'delivered', at: orderDate }],
        tracking: { currentStage: 'delivered', lastUpdatedAt: orderDate },
        isReviewEligible: true,
        createdAt: orderDate,
        updatedAt: orderDate,
      });

      await PriceHistory.create({
        productCategory: product.category,
        productName: product.name,
        unit: product.unit,
        pricePerUnit: +priceVariance.toFixed(2),
        quantity: qty,
        state: product.location.state,
        district: product.location.district,
        order: order._id,
        farmer: product.farmer,
        recordedAt: orderDate,
      });

      if (Math.random() > 0.4) {
        await Review.create({
          buyer: buyer._id,
          product: product._id,
          farmer: product.farmer,
          order: order._id,
          rating: 3 + Math.floor(Math.random() * 3),
          comment: 'Good quality produce, delivered on time.',
        });
      }
    }
  }

  // recalc ratings from seeded reviews
  const allProducts = await Product.find();
  for (const product of allProducts) {
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      product.ratingAverage = +stats[0].avg.toFixed(2);
      product.ratingCount = stats[0].count;
      product.totalSold += stats[0].count * 5;
      await product.save();
    }
  }

  console.log('[seed] Creating a couple of live (non-delivered) orders...');
  await Order.create({
    buyer: buyers[0]._id,
    items: [{
      product: products[0]._id, farmer: products[0].farmer, nameSnapshot: products[0].name,
      unit: products[0].unit, quantity: 5, pricePerUnit: products[0].price, lineTotal: products[0].price * 5,
    }],
    itemsTotal: products[0].price * 5,
    deliveryFee: 30,
    totalAmount: products[0].price * 5 + 30,
    status: 'placed',
    paymentStatus: 'paid',
    deliveryMethod: 'delivery',
    deliveryAddress: { line1: '12 MG Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
    statusHistory: [{ status: 'placed' }],
    tracking: { currentStage: 'placed', lastUpdatedAt: new Date() },
  });
  products[0].quantityReserved += 5;
  await products[0].save();

  console.log('[seed] Creating Smart Harvest pre-orders...');
  await PreOrder.create([
    {
      farmer: farmers[0].user._id,
      productName: 'Baby Corn',
      category: 'vegetables',
      unit: 'kg',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
      expectedHarvestDate: daysFromNow(18),
      estimatedQuantity: 300,
      pricePerUnit: 65,
      maxPerBuyer: 40,
      status: 'upcoming',
    },
    {
      farmer: farmers[2].user._id,
      productName: 'Nagpur Oranges',
      category: 'fruits',
      unit: 'kg',
      image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80',
      expectedHarvestDate: daysFromNow(24),
      estimatedQuantity: 500,
      pricePerUnit: 75,
      maxPerBuyer: 50,
      status: 'upcoming',
    },
    {
      farmer: farmers[0].user._id,
      productName: 'Organic Strawberries',
      category: 'fruits',
      unit: 'box',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80',
      expectedHarvestDate: daysFromNow(12),
      estimatedQuantity: 180,
      pricePerUnit: 120,
      maxPerBuyer: 20,
      status: 'upcoming',
    },
  ]);

  console.log('[seed] Creating a group buy...');
  await GroupBuy.create({
    product: products[2]._id, // Sona Masoori Rice (wholesale-enabled)
    farmer: products[2].farmer,
    createdBy: buyers[2]._id,
    pricePerUnit: products[2].wholesale.pricePerUnit,
    targetQuantity: 500,
    quantityCommitted: 150,
    closesAt: daysFromNow(7),
    status: 'open',
    participants: [{ buyer: buyers[2]._id, quantity: 100 }, { buyer: buyers[3]._id, quantity: 50 }],
  });

  console.log('[seed] Creating external reference prices...');
  await ExternalPriceReference.create([
    {
      category: 'vegetables', productName: 'Tomato', unit: 'kg', referencePrice: 25,
      state: 'Tamil Nadu', district: 'Coimbatore', source: 'e-NAM bulletin', sourceDate: monthsAgo(0), addedBy: admin._id,
    },
    {
      category: 'grains', productName: 'Rice (Sona Masoori)', unit: 'kg', referencePrice: 50,
      state: 'Tamil Nadu', source: 'Local APMC bulletin', sourceDate: monthsAgo(0), addedBy: admin._id,
    },
  ]);

  console.log('[seed] Creating a couple of notifications...');
  await Notification.create([
    { user: farmers[0].user._id, type: 'system', title: 'Welcome to the platform', message: 'Your farmer account is ready. Start by adding your first listing.' },
    { user: buyers[0]._id, type: 'system', title: 'Welcome!', message: 'Explore fresh produce directly from verified farmers near you.' },
  ]);

  console.log('\n[seed] Done. Demo credentials:');
  console.log(`  Admin:  ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'}`);
  farmers.forEach((f) => console.log(`  Farmer: ${f.user.email} / Farmer@12345  (${f.profile.farmName})`));
  buyers.forEach((b) => console.log(`  Buyer:  ${b.email} / Buyer@12345`));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
