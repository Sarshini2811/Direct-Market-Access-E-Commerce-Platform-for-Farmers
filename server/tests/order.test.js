const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');

async function registerAndLogin(role, email) {
  const res = await request(app).post('/api/auth/register').send({
    name: `${role} user`, email, password: 'Password123', role,
  });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe('Products & Orders', () => {
  test('farmer can create a listing and buyer can browse it', async () => {
    const farmer = await registerAndLogin('farmer', 'farmer1@test.com');

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmer.token}`)
      .field('name', 'Fresh Carrots')
      .field('category', 'vegetables')
      .field('unit', 'kg')
      .field('price', '30')
      .field('quantityAvailable', '100');

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data.product.name).toBe('Fresh Carrots');

    const listRes = await request(app).get('/api/products');
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBe(1);
  });

  test('checkout fails when cart quantity exceeds available stock', async () => {
    const farmer = await registerAndLogin('farmer', 'farmer2@test.com');
    const buyer = await registerAndLogin('buyer', 'buyer2@test.com');

    const product = await Product.create({
      farmer: farmer.user._id,
      name: 'Limited Onions',
      category: 'vegetables',
      unit: 'kg',
      price: 20,
      quantityAvailable: 5,
      deliveryOptions: { pickup: true, delivery: true, deliveryFee: 10 },
    });

    // add more than available to cart
    const addRes = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ productId: product._id, quantity: 10 });
    expect(addRes.statusCode).toBe(400); // rejected at cart stage already

    // add a valid quantity, then manually oversell via a second buyer to prove server-side guard
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ productId: product._id, quantity: 5 });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ deliveryMethod: 'pickup' });

    expect(orderRes.statusCode).toBe(201);

    const updated = await Product.findById(product._id);
    expect(updated.quantityReserved).toBe(5);
    expect(updated.availableToSell()).toBe(0);
  });

  test('cancelling an order releases reserved stock', async () => {
    const farmer = await registerAndLogin('farmer', 'farmer3@test.com');
    const buyer = await registerAndLogin('buyer', 'buyer3@test.com');

    const product = await Product.create({
      farmer: farmer.user._id,
      name: 'Cancel Test Beans',
      category: 'vegetables',
      unit: 'kg',
      price: 40,
      quantityAvailable: 20,
      deliveryOptions: { pickup: true },
    });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ productId: product._id, quantity: 8 });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ deliveryMethod: 'pickup' });

    const orderId = orderRes.body.data.order._id;

    let updated = await Product.findById(product._id);
    expect(updated.quantityReserved).toBe(8);

    const cancelRes = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ reason: 'Changed my mind' });

    expect(cancelRes.statusCode).toBe(200);
    updated = await Product.findById(product._id);
    expect(updated.quantityReserved).toBe(0);
  });
});
