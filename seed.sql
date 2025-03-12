-- イベント会場情報の挿入
INSERT INTO "EventVenue" (
  id,
  country,
  prefecture,
  city,
  reception_location
) VALUES (
  '018e0e38-c23d-7870-92f1-f1e67029f0e0',
  '日本',
  '滋賀県',
  '日野町',
  '近江日野商人ふるさと館'
);

-- イベント開催日の挿入
INSERT INTO "EventDate" (
  id,
  event_date,
  event_time
) VALUES 
(
  '018e0e38-c23d-7870-92f1-f1e67029f0e1',
  '2025-03-08',
  '10:00:00'
),
(
  '018e0e38-c23d-7870-92f1-f1e67029f0e2',
  '2025-03-09',
  '10:00:00'
);

-- イベント情報の挿入
INSERT INTO "Event" (
  id,
  name,
  theme,
  event_venue_id
) VALUES (
  '018e0e38-c23d-7870-92f1-f1e67029f0e3',
  'Japan Coffee Festival 2025 in 滋賀県日野町',
  '850年続く日野祭に華を添える16の曳山',
  '018e0e38-c23d-7870-92f1-f1e67029f0e0'
);

-- イベントと開催日の紐付け
INSERT INTO "Event_EventDate" (
  event_id,
  event_date_id
) VALUES 
(
  '018e0e38-c23d-7870-92f1-f1e67029f0e3',
  '018e0e38-c23d-7870-92f1-f1e67029f0e1'
),
(
  '018e0e38-c23d-7870-92f1-f1e67029f0e3',
  '018e0e38-c23d-7870-92f1-f1e67029f0e2'
);