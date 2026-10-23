// Central place for enums / shared constants so models, validators and
// the frontend contract all agree on the same string values.

module.exports = {
  ROLES: ['farmer', 'buyer', 'admin'],

  PRODUCT_CATEGORIES: [
    'vegetables', 'fruits', 'grains', 'pulses', 'dairy',
    'spices', 'herbs', 'flowers', 'other',
  ],

  PRODUCT_UNITS: ['kg', 'g', 'quintal', 'ton', 'dozen', 'piece', 'litre', 'bunch'],

  QUALITY_GRADES: ['A', 'B', 'C', 'ungraded'],

  ORDER_STATUS: [
    'placed', 'accepted', 'packed', 'dispatched',
    'delivered', 'cancelled', 'refunded', 'rejected',
  ],

  PAYMENT_STATUS: ['pending', 'paid', 'failed', 'refunded'],

  DELIVERY_METHODS: ['pickup', 'delivery'],

  PREORDER_STATUS: ['upcoming', 'open', 'closed', 'fulfilled', 'cancelled'],

  GROUP_BUY_STATUS: ['open', 'target_reached', 'closed', 'expired', 'cancelled', 'fulfilled'],

  VERIFICATION_STATUS: ['unverified', 'pending', 'verified', 'rejected'],

  NOTIFICATION_TYPES: [
    'order', 'preorder', 'harvest', 'inventory', 'groupbuy',
    'verification', 'review', 'report', 'system', 'message',
  ],

  REPORT_TARGET_TYPES: ['product', 'user', 'review'],
  REPORT_STATUS: ['open', 'reviewing', 'resolved', 'dismissed'],

  ACCOUNT_STATUS: ['active', 'suspended', 'banned'],

  PRICE_SOURCE_TYPES: ['platform_transaction', 'external_reference', 'user_estimate'],
};
