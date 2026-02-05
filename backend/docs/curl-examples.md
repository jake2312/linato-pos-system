# Linato POS API - curl examples

## Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@linato.com","password":"password"}'
```

## List products (POS)
```bash
curl -X GET "http://localhost:8000/api/v1/products?all=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Create an order
```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dine_type":"dine_in",
    "table_id":1,
    "items":[
      {"product_id":1,"qty":2,"discount_amount":0,"notes":"No cheese"}
    ],
    "discount_amount":0,
    "service_charge_rate":0,
    "tax_rate":12,
    "rounding":0
  }'
```

## Confirm order (send to KDS)
```bash
curl -X POST http://localhost:8000/api/v1/orders/1/confirm \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Add payment (split bills supported)
```bash
curl -X POST http://localhost:8000/api/v1/orders/1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"cash","amount":500}'
```

## Kitchen update status
```bash
curl -X PATCH http://localhost:8000/api/v1/kds/orders/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'
```

## Cancel order with admin PIN
```bash
curl -X POST http://localhost:8000/api/v1/orders/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"admin_pin":"1234","reason":"Customer changed mind"}'
```
