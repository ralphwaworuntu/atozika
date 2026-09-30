CREATE TABLE "MemberMaterialCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberMaterialCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberMaterialCategory_userId_category_key" ON "MemberMaterialCategory"("userId", "category");
CREATE INDEX "MemberMaterialCategory_userId_idx" ON "MemberMaterialCategory"("userId");

ALTER TABLE "MemberMaterialCategory"
ADD CONSTRAINT "MemberMaterialCategory_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Material" ("id", "title", "category", "type", "description", "fileUrl", "createdAt")
SELECT v.id, v.title, v.category, v.type::"MaterialType", v.description, v."fileUrl", CURRENT_TIMESTAMP
FROM (VALUES
  ('mat-polri-video', 'Video Strategi Tes POLRI', 'POLRI', 'VIDEO', 'Pembahasan video pola soal dan strategi tes POLRI.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ('mat-polri-link', 'Tautan Resmi Seleksi POLRI', 'POLRI', 'LINK', 'Halaman resmi informasi seleksi POLRI.', 'https://www.polri.go.id'),
  ('mat-tni-link', 'Tautan Penerimaan TNI', 'TNI', 'LINK', 'Informasi penerimaan TNI dan jadwal seleksi.', 'https://rekrutmen-tni.mil.id'),
  ('mat-kedinasan-pdf', 'Modul SKD Kedinasan', 'Kedinasan', 'PDF', 'Ringkasan materi SKD untuk sekolah kedinasan.', '/dummy-modul.pdf'),
  ('mat-kedinasan-video', 'Video Psikotes Kedinasan', 'Kedinasan', 'VIDEO', 'Latihan video soal psikotes kedinasan.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ('mat-kedinasan-link', 'Tautan Portal Kedinasan', 'Kedinasan', 'LINK', 'Referensi portal informasi sekolah kedinasan.', 'https://www.stan.ac.id'),
  ('mat-bumn-pdf', 'Modul TIU BUMN', 'BUMN', 'PDF', 'Materi TIU untuk seleksi BUMN.', '/dummy-modul.pdf'),
  ('mat-bumn-video', 'Video Wawancara BUMN', 'BUMN', 'VIDEO', 'Simulasi video wawancara seleksi BUMN.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ('mat-bumn-link', 'Tautan Rekrutmen BUMN', 'BUMN', 'LINK', 'Halaman rekrutmen bersama BUMN.', 'https://rekrutmenbersama2025.fhcibumn.id'),
  ('mat-pcpn-pdf', 'Modul Seleksi PCPN-BI', 'PCPN-BI', 'PDF', 'Panduan belajar seleksi PCPN dan Bank Indonesia.', '/dummy-modul.pdf'),
  ('mat-pcpn-video', 'Video Tes PCPN-BI', 'PCPN-BI', 'VIDEO', 'Pembahasan video tes PCPN dan Bank Indonesia.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ('mat-pcpn-link', 'Tautan PCPN-BI', 'PCPN-BI', 'LINK', 'Referensi informasi seleksi PCPN dan Bank Indonesia.', 'https://www.bi.go.id')
) AS v(id, title, category, type, description, "fileUrl")
WHERE NOT EXISTS (SELECT 1 FROM "Material" m WHERE m.title = v.title);

INSERT INTO "MemberMaterialCategory" ("id", "userId", "category", "createdAt")
SELECT 'mmc-demo-' || c.category, u.id, c.category, CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN (VALUES ('POLRI'), ('TNI'), ('Kedinasan'), ('BUMN'), ('PCPN-BI')) AS c(category)
WHERE u.email = 'member@atozika.id'
ON CONFLICT ("userId", "category") DO NOTHING;
