-- DEVELOPMENT ONLY. Never run against production.
-- This seed intentionally uses example.test contact details and fictional products.

insert into public.brands (id, name, normalized_name, description) values
  ('a0000000-0000-4000-8000-000000000001', 'AeroBar', 'aerobar', 'Fictional development brand'),
  ('a0000000-0000-4000-8000-000000000002', 'Lumen', 'lumen', 'Fictional development brand'),
  ('a0000000-0000-4000-8000-000000000003', 'North', 'north', 'Fictional development brand'),
  ('a0000000-0000-4000-8000-000000000004', 'Vela', 'vela', 'Fictional development brand')
on conflict (id) do nothing;

insert into public.shops (
  id, name, slug, description, email, phone, address_line_1, city, state,
  postal_code, latitude, longitude, allowed_radius_miles, business_hours, status
) values
  (
    '11111111-1111-4111-8111-111111111111', 'Northstar Smoke & Vape',
    'northstar-smoke-vape', 'Development fixture store', 'northstar@example.test',
    '(312) 555-0142', '401 N State St', 'Chicago', 'IL', '60654',
    41.8897, -87.6278, 1,
    '{"monday":"9:00 AM – 10:00 PM","tuesday":"9:00 AM – 10:00 PM","wednesday":"9:00 AM – 10:00 PM","thursday":"9:00 AM – 10:00 PM","friday":"9:00 AM – 11:00 PM","saturday":"9:00 AM – 11:00 PM","sunday":"10:00 AM – 8:00 PM"}',
    'active'
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'Lakeview Vapor House',
    'lakeview-vapor-house', 'Development fixture store', 'lakeview@example.test',
    '(312) 555-0166', '3100 N Clark St', 'Chicago', 'IL', '60657',
    41.9387, -87.6503, 0.5,
    '{"monday":"10:00 AM – 9:00 PM","tuesday":"10:00 AM – 9:00 PM","wednesday":"10:00 AM – 9:00 PM","thursday":"10:00 AM – 9:00 PM","friday":"10:00 AM – 10:00 PM","saturday":"10:00 AM – 10:00 PM","sunday":"11:00 AM – 7:00 PM"}',
    'active'
  )
on conflict (id) do nothing;

insert into public.products (
  id, brand_id, product_name, flavor_name, normalized_search_text, category,
  nicotine_percentage, nicotine_mg, puff_count, flavor_family, sweetness_level,
  cooling_level, hit_strength, expected_duration_text, rechargeable, device_type,
  description, verification_status, active
) values
  ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','AeroBar Mango Glacier','Mango Glacier','aerobar mango glacier tropical','Disposable',5,50,20000,'Tropical',6,8,7,'Varies by usage',true,'Disposable device','Mango profile with cooling. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','AeroBar Strawberry Cloud','Strawberry Cloud','aerobar strawberry cloud fruity','Disposable',5,50,20000,'Fruity',8,4,5,'Varies by usage',true,'Disposable device','Strawberry profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','AeroBar Peach Freeze','Peach Freeze','aerobar peach freeze fruity','Disposable',5,50,18000,'Fruity',7,9,7,'Varies by usage',true,'Disposable device','Peach profile with cooling. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','AeroBar Melon Wave','Melon Wave','aerobar melon wave fruity','Disposable',5,50,18000,'Fruity',6,5,6,'Varies by usage',true,'Disposable device','Melon profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000001','AeroBar Citrus Spark','Citrus Spark','aerobar citrus spark fruity','Disposable',5,50,16000,'Fruity',5,6,6,'Varies by usage',true,'Disposable device','Citrus profile. Fictional development product.','unverified',true),
  ('b0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000002','Lumen Mint Reserve','Mint Reserve','lumen mint reserve mint','Disposable',5,50,15000,'Mint',2,9,7,'Varies by usage',true,'Disposable device','Mint profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000002','Lumen Blue Razz Current','Blue Razz Current','lumen blue razz current candy','Disposable',5,50,15000,'Candy',9,7,8,'Varies by usage',true,'Disposable device','Blue candy profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000008','a0000000-0000-4000-8000-000000000002','Lumen Lemon Fizz','Lemon Fizz','lumen lemon fizz beverage','Disposable',5,50,15000,'Beverage',7,5,6,'Varies by usage',true,'Disposable device','Lemon beverage profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000002','Lumen Berry Cream','Berry Cream','lumen berry cream dessert','Disposable',5,50,15000,'Dessert',8,2,5,'Varies by usage',true,'Disposable device','Berry dessert profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000010','a0000000-0000-4000-8000-000000000002','Lumen Cola Chill','Cola Chill','lumen cola chill beverage','Disposable',5,50,17000,'Beverage',7,7,7,'Varies by usage',true,'Disposable device','Cola profile. Fictional development product.','unverified',true),
  ('b0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000003','North Vanilla Tobacco','Vanilla Tobacco','north vanilla tobacco','Disposable',5,50,12000,'Tobacco',5,1,7,'Varies by usage',true,'Disposable device','Vanilla tobacco profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000003','North Peach Tea','Peach Tea','north peach tea beverage','Disposable',5,50,12000,'Beverage',6,3,4,'Varies by usage',true,'Disposable device','Peach tea profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000013','a0000000-0000-4000-8000-000000000003','North Crisp Apple','Crisp Apple','north crisp apple fruity','Disposable',5,50,12000,'Fruity',5,2,5,'Varies by usage',true,'Disposable device','Apple profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000014','a0000000-0000-4000-8000-000000000003','North Coffee Cream','Coffee Cream','north coffee cream dessert','Disposable',5,50,12000,'Dessert',6,1,6,'Varies by usage',true,'Disposable device','Coffee dessert profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000015','a0000000-0000-4000-8000-000000000003','North Classic Menthol','Classic Menthol','north classic menthol','Disposable',5,50,12000,'Menthol',2,10,8,'Varies by usage',true,'Disposable device','Menthol profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000016','a0000000-0000-4000-8000-000000000004','Vela Pineapple Splash','Pineapple Splash','vela pineapple splash tropical','Disposable',5,50,25000,'Tropical',7,6,6,'Varies by usage',true,'Disposable device','Pineapple profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000017','a0000000-0000-4000-8000-000000000004','Vela Iced Grape','Iced Grape','vela iced grape fruity','Disposable',5,50,25000,'Fruity',8,9,8,'Varies by usage',true,'Disposable device','Grape profile with cooling. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000018','a0000000-0000-4000-8000-000000000004','Vela Coconut Lime','Coconut Lime','vela coconut lime tropical','Disposable',5,50,25000,'Tropical',6,4,5,'Varies by usage',true,'Disposable device','Coconut lime profile. Fictional development product.','admin_verified',true),
  ('b0000000-0000-4000-8000-000000000019','a0000000-0000-4000-8000-000000000004','Vela Candy Rush','Candy Rush','vela candy rush candy','Disposable',5,50,25000,'Candy',10,5,7,'Varies by usage',true,'Disposable device','Candy profile. Fictional development product.','unverified',true),
  ('b0000000-0000-4000-8000-000000000020','a0000000-0000-4000-8000-000000000004','Vela Watermelon Ice','Watermelon Ice','vela watermelon ice fruity','Disposable',5,50,25000,'Fruity',8,9,7,'Varies by usage',true,'Disposable device','Watermelon profile with cooling. Fictional development product.','admin_verified',true)
on conflict (id) do nothing;

insert into public.shop_inventory (
  shop_id, product_id, internal_sku, price, sale_price, stock_status, quantity,
  featured, staff_pick, recommendation_priority
)
select
  '11111111-1111-4111-8111-111111111111',
  id,
  'NS-' || lpad(row_number() over (order by id)::text, 3, '0'),
  17.99 + row_number() over (order by id),
  case when id = 'b0000000-0000-4000-8000-000000000012' then 16.99 else null end,
  case when id = 'b0000000-0000-4000-8000-000000000007' then 'low_stock'::public.stock_status else 'in_stock'::public.stock_status end,
  8 + row_number() over (order by id),
  id in ('b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000016'),
  id in ('b0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000011'),
  case when id = 'b0000000-0000-4000-8000-000000000001' then 2 else 0 end
from public.products
where id between 'b0000000-0000-4000-8000-000000000001' and 'b0000000-0000-4000-8000-000000000016'
on conflict (shop_id, product_id) do nothing;

insert into public.shop_inventory (
  shop_id, product_id, internal_sku, price, stock_status, quantity, featured, staff_pick
)
select
  '22222222-2222-4222-8222-222222222222',
  id,
  'LV-' || lpad(row_number() over (order by id)::text, 3, '0'),
  18.49 + row_number() over (order by id),
  case
    when id = 'b0000000-0000-4000-8000-000000000018' then 'out_of_stock'::public.stock_status
    when id = 'b0000000-0000-4000-8000-000000000019' then 'hidden'::public.stock_status
    else 'in_stock'::public.stock_status
  end,
  case when id in ('b0000000-0000-4000-8000-000000000018','b0000000-0000-4000-8000-000000000019') then 0 else 12 end,
  id = 'b0000000-0000-4000-8000-000000000017',
  id = 'b0000000-0000-4000-8000-000000000013'
from public.products
where id between 'b0000000-0000-4000-8000-000000000007' and 'b0000000-0000-4000-8000-000000000020'
on conflict (shop_id, product_id) do nothing;

insert into public.qr_codes (
  id, shop_id, code, label, destination_path, qr_type, active, total_scans, last_scanned_at
) values
  ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','demo-northstar-entrance','Front entrance','/app/store/northstar-smoke-vape?qr=demo-northstar-entrance','store',true,1284,now()),
  ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','demo-northstar-disabled','Checkout counter','/app/store/northstar-smoke-vape?qr=demo-northstar-disabled','counter',false,184,now() - interval '12 days'),
  ('55555555-5555-4555-8555-555555555555','22222222-2222-4222-8222-222222222222','demo-lakeview-entrance','Front entrance','/app/store/lakeview-vapor-house?qr=demo-lakeview-entrance','store',true,1037,now())
on conflict (id) do nothing;

insert into public.shop_applications (
  business_name, applicant_name, email, phone, address, number_of_locations,
  website_or_social, message, status
) values (
  'City Smoke Collective', 'Jordan Lee', 'jordan@example.test', '(312) 555-0198',
  '1500 W Example Ave, Chicago, IL 60600', 2, 'https://example.test',
  'Interested in inventory-grounded customer recommendations.', 'new'
);

insert into public.customer_sessions (
  id, anonymous_session_id, shop_id, qr_code_id, age_confirmed,
  location_permission_status, location_verified, distance_from_store_miles,
  device_type, created_at
) values
  ('66666666-6666-4666-8666-666666666661','77777777-7777-4777-8777-777777777771','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',true,'granted',true,0.12,'mobile',now() - interval '1 day'),
  ('66666666-6666-4666-8666-666666666662','77777777-7777-4777-8777-777777777772','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',true,'granted',true,0.34,'mobile',now() - interval '2 days'),
  ('66666666-6666-4666-8666-666666666663','77777777-7777-4777-8777-777777777773','22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555',false,'granted',false,1.70,'desktop',now() - interval '3 days')
on conflict (id) do nothing;

insert into public.recommendations (session_id, shop_id, product_id, rank, score, reason, customer_clicked, customer_liked) values
  ('66666666-6666-4666-8666-666666666661','11111111-1111-4111-8111-111111111111','b0000000-0000-4000-8000-000000000001',1,91.5,'Matches tropical flavor and strong cooling.',true,true),
  ('66666666-6666-4666-8666-666666666661','11111111-1111-4111-8111-111111111111','b0000000-0000-4000-8000-000000000016',2,84.0,'A tropical alternative with medium cooling.',true,null),
  ('66666666-6666-4666-8666-666666666662','11111111-1111-4111-8111-111111111111','b0000000-0000-4000-8000-000000000002',1,88.0,'Matches fruity and sweet preferences.',true,true);

insert into public.product_requests (
  session_id, shop_id, requested_brand, requested_flavor, request_details, matching_product_found, source
) values
  ('66666666-6666-4666-8666-666666666661','11111111-1111-4111-8111-111111111111',null,'Mango','Strong cooling under $20',false,'match_flow'),
  ('66666666-6666-4666-8666-666666666662','11111111-1111-4111-8111-111111111111',null,'Dessert','Smooth dessert profile',false,'text');
