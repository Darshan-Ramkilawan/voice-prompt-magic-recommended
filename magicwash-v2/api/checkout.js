export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { priceId, email, vehicle_size, wash_package, location } = req.body;

    const params = new URLSearchParams();
    params.append('line_items[0][price]',    priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('customer_email',          email);
    params.append('custom_fields[0][key]',           'vehicle_rego');
    params.append('custom_fields[0][label][type]',   'custom');
    params.append('custom_fields[0][label][custom]', 'Vehicle Registration (Rego)');
    params.append('custom_fields[0][type]',          'text');
    params.append('custom_fields[0][optional]',      'false');
    params.append('metadata[vehicle_size]', vehicle_size);
    params.append('metadata[wash_package]', wash_package);
    params.append('metadata[location]',     location || 'Hoppers Crossing');
    params.append('metadata[discount]',     '10%');
    params.append('metadata[source]',       'AI Concierge');
    // params.append('discounts[0][coupon]', '10OFF'); // Uncomment once coupon created in Stripe
    params.append('mode',        'payment');
    params.append('success_url', 'https://magicwash.com.au/thank-you?session={CHECKOUT_SESSION_ID}');
    params.append('cancel_url',  req.headers.referer || 'https://magicwash.com.au');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: session.error?.message || 'Stripe error' });
    }

    return res.status(200).json({ url: session.url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
