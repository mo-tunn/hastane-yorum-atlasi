# Hastane Yorum Atlası — Veri ve Üretim Notları

Bu depo, hastaneler hakkında yazılmış düşük puanlı yorumlardan oluşturulan analiz veri paketini ve bu paketin nasıl üretildiğini açıklayan dokümantasyonu içerir. Paket, her yorum kaydını 384 boyutlu metin embedding'lerinden elde edilen üç boyutlu koordinatlarla ve ilgili tema, şehir, puan, tarih ve tesis bilgileriyle eşleştirir.

## Veri özeti

- **Yorum kaydı:** 119.427
- **Farklı normalize edilmiş yorum metni:** 119.206
- **Puan kapsamı:** 1 ve 2 yıldız
- **Embedding boyutu:** 384
- **Koordinat boyutu:** 3
- **Koordinat indirgeme yöntemi:** UMAP
- **Paket:** `review-universe.json.gz` (gzip ile sıkıştırılmış JSON)

Kayıt sayısı ile farklı metin sayısı aynı değildir. Farklı kaynak kayıtları aynı normalize edilmiş yorumu içerebilir. Bu kayıtlar veri paketinde ayrı ayrı tutulur; yinelenen metinler aynı anlamsal koordinatı paylaşabilir.

> **Gizlilik:** Veri paketi gerçek yorum metinlerini içerir. Bu nedenle GitHub deposu private tutulur. Depoyu herkese açmadan önce veri paylaşım izinleri, kişisel veri riski ve ilgili yükümlülükler ayrıca değerlendirilmelidir.

## 1. Veri kapsamı ve dahil etme kuralları

Kaynak yorumlardan aşağıdaki koşulların tamamını karşılayan kayıtlar alınır:

1. Kategori hastane olmalıdır.
2. Veterinerlik/hayvan ve diş hekimliği kategorileri kapsam dışında bırakılır.
3. Puan 1 veya 2 yıldız olmalıdır.
4. Tarih geçerli olmalıdır.
5. Yorum metni boş olmamalı ve en az 20 karakter içermelidir.

Bu kapsam, bütün hastane yorumlarını temsil etmez. Özellikle düşük puanlı kayıtları seçtiği için tüm hasta deneyimlerinin rastgele veya dengeli bir örneklemi olarak yorumlanmamalıdır.

### Metin normalizasyonu

Yinelenen metinleri karşılaştırmak için metinlere Unicode NFKC normalizasyonu uygulanır. Normalizasyon, kaydın özgün yorumunu veri paketinden çıkarmak veya yorum kayıtlarını birleştirmek için kullanılmaz; yalnızca aynı metinlerin belirlenmesine yardımcı olur.

119.427 kayıt içinde 119.206 farklı normalize edilmiş metin bulunması, bazı yorum metinlerinin birden fazla kayıtta geçtiğini gösterir. Kayıt kimliği, puan, tarih ve tesis bilgisi gibi kayıt düzeyindeki alanlar korunur.

## 2. Kaynak dosyalar

Üretim süreci yerel analiz çalışma alanındaki dosyalara dayanır. Bu kaynaklar boyutları ve yorum içeriği nedeniyle uygulama deposuna eklenmemiştir.

| Kaynak | Kullanım |
|---|---|
| `reviews_analysis_subset.parquet` | Temel yorum kayıtları ve kayıt alanları |
| `outputs/phase8_full_low_rating_review_topic_metadata.csv` | Düşük puanlı yorumlara ait tema metadata'sı |
| `outputs/phase7_full_corpus_embeddings.npy` | Metinlerin 384 boyutlu embedding matrisi |
| `outputs/phase7_full_corpus_embedding_progress.json` | Embedding üretimi, kayıt sayısı ve hash/doğrulama bilgileri |
| `outputs/phase29_all_1925_records_scope_and_identity.csv` | Tesis kimliği ve şehir eşleştirme bilgileri |
| `outputs/phase9_full_low_rating_topic_descriptors_labeled.csv` | Tema açıklamaları ve etiketleri |

Şehir ve tesis eşleştirmeleri `place_id` üzerinden yapılır. Uygun kayıtlar için mevcut kimlik metadata'sındaki etkin şehir bilgisi kullanılır; gerekli olduğunda analiz hattındaki yedek şehir eşlemesi devreye girer.

Bu yollar yerel analiz klasörünün düzenini tarif eder; başka bir makinede aynı dosyaların aynı yollarla mevcut olacağı garanti edilmez.

## 3. Kayıt sırası ve veri bütünlüğü kontrolleri

Embedding'leri yorumlarla birleştirirken yalnızca satır sayılarına güvenmek yeterli değildir. Satır sırasının değişmesi, bir yoruma başka bir yorumun embedding'inin atanmasına neden olabilir. Bu nedenle üretim hattında şu kontroller uygulanır:

- Filtrelenmiş yorum kayıtlarının sırası, ilgili yorum tema metadata'sının sırasıyla karşılaştırılır.
- Embedding sayısı ve ilerleme dosyasındaki doğrulama/hash bilgileri kontrol edilir.
- Kaynak kayıt, tema bilgisi ve embedding dizisinin satır düzeyinde birbirine karşılık geldiği doğrulanır.
- Tesis ve şehir bilgileri tesis kimliği üzerinden eşleştirilir.
- Kontrol edilen kayıtlar tema, puan, tarih ve metin alanlarıyla birlikte çıktı paketine aktarılır.

Bu kontroller başarısız olursa veriyi sessizce eşleştirmek yerine üretim durdurulmalı ve kaynak dosyaların sırası ile sürümü yeniden incelenmelidir.

## 4. Üç boyutlu koordinatların üretilmesi

Kaynak embedding'leri 384 boyutludur. Bunlar, yorumlar arasındaki anlamsal yakınlığı keşif amaçlı incelemeye elverişli bir gösterime dönüştürmek için UMAP ile üç boyuta indirgenir.

Kullanılan temel parametreler:

| Parametre | Değer |
|---|---:|
| Bileşen sayısı (`n_components`) | 3 |
| Komşu sayısı (`n_neighbors`) | 20 |
| Minimum uzaklık (`min_dist`) | 0.08 |
| Uzaklık ölçüsü (`metric`) | cosine |
| Epoch sayısı (`n_epochs`) | 180 |
| Rastgele tohum (`random_state`) | 42 |
| Bellek tasarrufu (`low_memory`) | true |
| İşçi sayısı (`n_jobs`) | 1 |
| Başlatma (`init`) | spectral |

Aynı parametreler, aynı embedding matrisi ve uyumlu bağımlılık sürümleri kullanılsa dahi farklı kütüphane/sistem sürümleri sonuçlarda küçük farklılıklar oluşturabilir. Yeniden üretilebilirlik için kaynak dosyalar ve Python bağımlılık sürümleri de sabitlenmelidir.

### Koordinatları yorumlama

- X, Y ve Z, UMAP'in ürettiği koordinatlardır; kendi başlarına coğrafi, klinik veya başka bir ölçüm birimi taşımazlar.
- Yakın noktalar, indirgenmiş uzayda benzer temsil edilen metinlere işaret edebilir; üç boyutlu izdüşüm 384 boyutlu uzaydaki bütün ilişkileri kusursuz biçimde korumaz.
- Tema kimlikleri, mevcut tema analizinden gelir. Etiketler veri incelemesini kolaylaştırır ancak insan doğrulaması olmadan kesin sınıflar olarak kabul edilmemelidir.
- Aynı normalize edilmiş metne ait kayıtlar aynı koordinatı paylaşabilir. Bu, kayıtların paket dışına çıkarıldığı anlamına gelmez.

## 5. Çıktı paketi

Üretim script'i şu dosyayı oluşturur:

    atlas-local/review-universe.json.gz

Dosya gzip ile sıkıştırılmış bir JSON paketidir. Sıkıştırılmış dosyanın boyutu üretim sürümünde yaklaşık 20,3 MB'tır; değişikliklerle bu değer farklılaşabilir.

Her nokta kaydı aşağıdaki sırada alanlar içerir:

    [x, y, z, topicId, cityId, rating, daysSince2000-01-01, placeIndex, reviewText]

| Alan | Anlamı |
|---|---|
| `x`, `y`, `z` | UMAP ile elde edilen üç boyutlu koordinatlar |
| `topicId` | Yorumun tema kimliği |
| `cityId` | Şehir sözlüğündeki kimlik |
| `rating` | Kaydın yıldız puanı |
| `daysSince2000-01-01` | Tarihin 1 Ocak 2000'e göre gün cinsinden kodlanmış değeri |
| `placeIndex` | Tesis sözlüğüne işaret eden indeks |
| `reviewText` | Yorumun metni |

Tema, şehir ve tesis gibi tekrarlanan alanlar paket içinde sözlük/indeks yapılarıyla temsil edilebilir; kayıt alanlarındaki kimlikler bu eşlemelerle birlikte okunmalıdır. Şema değişikliği yapılırsa bu belge ve paketi okuyan tüketiciler birlikte güncellenmelidir.

## 6. Üretim script'i ve yeniden üretilebilirlik

Veri paketini üreten script yerel analiz çalışma alanındadır:

    C:/Users/metehan/Desktop/review_preanalysis/build_atlas_universe.py

Bu script, yukarıda listelenen kaynak dosyalara ihtiyaç duyar ve filtreleme, doğrulama, koordinat üretimi, metadata eşleme ve sıkıştırılmış çıktı oluşturma aşamalarını yürütür.

**Önemli:** Üretim script'i ve ham kaynaklar şu anda GitHub deposunda bulunmaz. Dolayısıyla yalnızca bu depoyu klonlamak, veri paketini baştan üretmek için yeterli değildir. Script'in başka bir makinede çalıştırılabilmesi için kaynak dosyaların güvenli biçimde sağlanması, dosya yollarının yapılandırılabilir hale getirilmesi ve gerekli Python bağımlılıklarının sürümlerinin sabitlenmesi gerekir.

Yeniden üretilebilirliği iyileştirmek için önerilen işler:

- Üretim script'ini uygun bir `scripts/` klasörüne taşımak.
- Yerel mutlak yolları komut satırı argümanlarına veya bir yapılandırma dosyasına dönüştürmek.
- Python ve veri işleme kütüphanelerinin sürümlerini sabitlemek.
- Kaynak dosyaların satır sayısı, hash değeri, kapsamı ve üretim tarihini kaydeden bir manifest üretmek.
- Filtreleme, satır sırası doğrulaması, şehir eşleştirmesi ve çıktı şeması için otomatik kontroller eklemek.
- Hassas veya büyük kaynak verileri Git'e eklemeden, erişim ve saklama kurallarını ayrı yönetmek.

## 7. Sınırlamalar ve yorumlama ilkeleri

- **Seçilim yanlılığı:** Veri yalnızca belirli koşulları sağlayan 1–2 yıldızlı hastane yorumlarından oluşur. Genel memnuniyet oranı çıkarmak için tek başına kullanılamaz.
- **Eksik eşleştirmeler:** Bazı kayıtlarda şehir veya tesis metadata'sı bulunmayabilir ya da belirsiz olabilir.
- **Tema belirsizliği:** Tema atamaları analiz hattının çıktısıdır; elle doğrulanmış kesin etiketler olarak görülmemelidir.
- **UMAP izdüşümü:** Üç boyutlu uzaydaki mesafeler orijinal embedding uzayındaki tüm ilişkileri korumaz. Eksenlerin doğrudan bir yorumu yoktur.
- **Nedensellik:** Koordinat yakınlığı, ortak tema veya yorum sayısı tek başına belirli bir sorunun nedenini kanıtlamaz.
- **Gizlilik:** Yorum metinlerinin doğrudan içermediği hâlde kişileri veya olayları tanımlamaya yarayabilecek bağlamsal bilgiler bulunabilir. Paylaşım öncesi ayrı bir gizlilik değerlendirmesi yapılmalıdır.

## 8. Depo içeriği

    atlas-local/
    ├── .gitignore
    ├── README.md
    ├── index.html
    └── review-universe.json.gz

Bu README yalnızca veri kapsamını, kaynakları, kalite kontrollerini ve üretim yöntemini belgelemeye odaklanır. Kaynak analiz verileri ve embedding'ler bu dosya ağacına dahil değildir.

---

## Kısa yöntem özeti

Hastane kategorisindeki, geçerli tarihe ve en az 20 karakterlik metne sahip 1–2 yıldızlı yorumlar seçilir; veterinerlik/hayvan ve diş hekimliği kategorileri dışarıda bırakılır. Yorum kayıtları tema metadata'sı ve 384 boyutlu embedding'lerle satır sırası, adet ve hash bilgileri üzerinden doğrulanır. Embedding'ler belirtilen UMAP ayarlarıyla üç boyuta indirgenir; tema, şehir, puan, tarih, tesis referansı ve gerçek yorum metniyle birlikte gzip'li JSON paketine yazılır.
