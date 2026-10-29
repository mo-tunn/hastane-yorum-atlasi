# Hastane Yorum Atlası — Veri ve Üretim Notları

Bu depo, hastaneler hakkında yazılmış düşük puanlı yorumlardan oluşturulan analiz veri paketini ve bu paketin nasıl üretildiğini açıklayan dokümantasyonu içerir. Paket, her yorum kaydını 384 boyutlu metin embedding'lerinden elde edilen üç boyutlu koordinatlarla ve ilgili tema, şehir, puan, tarih ve tesis bilgileriyle eşleştirir.

**Canlı araştırma aracı:** https://hastane-yorum-atlasi.metekizilcik.workers.dev/

> **Araştırma notu:** Site ve yorum metinleri herkese açıktır. Yorumlar kullanıcılar tarafından yazılmış öznel değerlendirmelerdir; doğrulanmış tıbbi bulgular değildir. Kümeler keşif amaçlıdır, bütün hastane deneyimlerini temsil etmez ve tek başlarına bir tesis hakkında kesin yargı oluşturmak için kullanılmamalıdır.

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

## 4. Kullanılan AI modelleri ve analiz metotları

Bu bölüm, analiz hattında gerçekten kullanılan modeli, model çıktılarının nasıl kümelendiğini ve temaların nasıl betimlenip adlandırıldığını ayırır. Böylece embedding modeli ile kümeleme algoritmasının farklı görevler yaptığı net kalır.

### 4.1. Metin embedding modeli: multilingual MiniLM

**Model kimliği:** [`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)

Yorum metinlerini sayısal anlamsal vektörlere dönüştürmek için Sentence-Transformers kütüphanesi üzerinden çok dilli MiniLM tabanlı cümle embedding modeli kullanıldı. Model kartı, 50 dil için kullanılabildiğini ve her metni 384 boyutlu yoğun bir vektörle temsil ettiğini belirtir. Model mimarisi en fazla 128 tokenlık girdiyi işler ve token temsillerini mean pooling ile cümle vektörüne toplar.

Üretim hattındaki uygulama ayrıntıları:

- **Tam model kimliği:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- **Yerel model revizyonu:** `e8f8c211226b894fcb81acc59f3b34ba3efd5f42` (kaynak script'te sabitlenmiş Hugging Face snapshot dizini)
- **Vektör boyutu:** 384 (`float32`)
- **Çağrı:** `SentenceTransformer.encode(..., batch_size=32, convert_to_numpy=True, normalize_embeddings=True)`
- **İşleme düzeni:** metinler 8.192 kayıtlık parçalarda işlenir; her parçada model batch boyutu 32'dir. Model bellekteki CUDA GPU varsa onu, yoksa CPU'yu kullanır.
- **Normalizasyon:** embedding vektörleri `normalize_embeddings=True` ile birim uzunluğa normalize edilir.
- **Model eğitimi:** proje verisi üzerinde model fine-tuning yapılmaz; mevcut model çıkarım için kullanılır.

Tam korpus aşamasında 373.298 kullanılabilir yorum kaydı 371.371 farklı normalize edilmiş metne karşılık geliyordu. Yinelenen normalize metinlerin embedding'i bir kez hesaplanır; bu metni kullanan birden fazla yorum kaydının adetleri ve kayıt bilgileri analizlerde ayrı ayrı korunur.

### 4.2. Konu kümeleri: MiniBatch K-Means

Embedding üretimi ile konu kümelemesi birbirinden ayrı aşamalardır. Embedding modeli metinleri vektörleştirir; **MiniBatchKMeans** bu vektörleri önceden belirlenen küme sayısına göre gruplar. Büyük korpus üzerinde MiniBatch K-Means, tüm vektörleri her adımda birlikte işleyen klasik K-Means'e göre daha yönetilebilir mini-batch'lerle çalıştığı için tercih edilmiştir.

| Analiz aşaması | Kullanılan vektörler | Algoritma | Küme sayısı |
|---|---|---|---:|
| Tam korpus (Phase 7) | Tüm kullanılabilir farklı metinlerin MiniLM embedding'leri | `MiniBatchKMeans` | 12 |
| Düşük puanlı alt küme (Phase 8) | Tam korpusta önceden hesaplanmış embedding'lerden 1–2 yıldızlı metinlere karşılık gelenler | `MiniBatchKMeans` | 8 |
| Önceki keşif denemeleri | MiniLM embedding'leri; ayrıca TF-IDF tabanlı başlangıç karşılaştırması | `KMeans` / `MiniBatchKMeans` | Denemeye göre 8 veya 12 |

Tam korpus ve düşük puan alt kümesi için kullanılan MiniBatchKMeans ayarları:

| Parametre | Değer |
|---|---:|
| `random_state` | 42 |
| `n_init` | 3 |
| `batch_size` | 8.192 |
| `max_iter` | 100 |
| `max_no_improvement` | 20 |
| `reassignment_ratio` | 0.01 |

Phase 8, embedding modelini ikinci kez çalıştırmaz: tam korpus embedding matrisi ve SHA-256 ile doğrulanmış normalize metin listesi üzerinden 119.206 düşük puanlı benzersiz metne ait vektörler seçilir; sekiz kümeli model bu alt küme üzerinde ayrı eğitilir. Bu nedenle tam korpusun 12 kümesi ile düşük puan alt kümesinin 8 kümesindeki **küme numaraları birbirine karşılık gelen ortak sınıf kimlikleri değildir**.

Küme sayıları keşif amacıyla belirlenmiştir. Mevcut çıktı özetlerinde model seçimi/küme sayısı için sistematik bir optimizasyon veya tüm küme etiketleri için tamamlanmış insan doğrulaması raporlanmamaktadır. Küme üyeliği, tek başına klinik olarak doğrulanmış konu sınıfı anlamına gelmez.

### 4.3. Küme betimleyicileri: TF-IDF

TF-IDF, ana küme atamasını yapan algoritma değildir. Kümeleme tamamlandıktan sonra her grupta öne çıkan kelimeleri ve iki kelimeli ifadeleri çıkarmak, böylece kümeleri yorumlamaya yardımcı olmak için kullanılır.

- **Özellikler:** tekli ve ikili kelime öbekleri (`ngram_range=(1, 2)`).
- **Ön işleme:** küçük harfe çevirme ve projede tanımlanmış Türkçe durak kelime listesi.
- **Tam korpus ayarları:** `min_df=20`, `max_df=0.8`, `max_features=60000`, `sublinear_tf=True`.
- **1–2 yıldız alt kümesi ayarları:** `min_df=10`, `max_df=0.8`, `max_features=60000`, `sublinear_tf=True`.
- **Küme özeti:** her kümenin içindeki dokümanların TF-IDF değerleri özellik bazında ortalanır; tam korpusta ilk 18, düşük puan alt kümesinde ilk 20 terim kaydedilir.

Bu terimler otomatik konu atamasının bağımsız kanıtı değil, küme yorumlama araçlarıdır. Sık geçen kelimeler tek başına kümenin tutarlı olduğu anlamına gelmez.

### 4.4. İnsan tarafından tanımlanmış geçici tema isimleri

Küme numaralarından okunabilir tema başlıklarına geçiş, `phase9_finalize_full_analysis.py` içinde tanımlanmış etiket sözlükleriyle yapılır. Script her başlık için bir güven seviyesi ve gerekçe de ekler; çıktıdaki doğrulama durumu açıkça **“GEÇİCİ — insan değerlendirmesi gerekiyor”** olarak işaretlenmiştir. Analiz özetleri de tema etiketlerinin insan tarafından tam doğrulanmadığını belirtir.

Bu nedenle nihai başlıkları üreten bir GPT/Claude/Gemini çağrısı bu ana konu analizi ve atlas üretim hattının parçası değildir. Model, kümeleri oluşturmak için embedding ve kümeleme aşamalarında kullanılır; okunabilir etiketler script'teki tanımlı eşlemelerden gelir ve uzman/insan incelemesine açıktır. Proje genelindeki geçmiş manuel araştırma adımlarıyla bu otomatik konu kümeleme hattını birbirine karıştırmamak gerekir.

### 4.5. Diğer analiz ve kalite kontrol metotları

- **Kapsam filtresi:** DuckDB SQL ile kategori, geçerli tarih, puan ve minimum metin uzunluğu koşulları uygulanır; tesis kimliği ve kayıt alanları Parquet kaynağından okunur.
- **Metin normalizasyonu:** Unicode NFKC, küçük harfe çevirme ve ardışık boşlukları tek boşluğa indirgeme. Benzersiz normalize metin listesi sıralanır.
- **Embedding eşleştirmesi:** metin sayısı, 384 boyutlu matris şekli ve SHA-256 korpus hash'i doğrulanır; düşük puan alt kümesinin vektörleri eşleşen metin üzerinden seçilir.
- **Trend hesapları:** yıl, şehir/eşleşme güven düzeyi ve tema bazında kayıt adetleri ile paylar gruplanarak hesaplanır. Paylar ilgili tabloda belirtilen payda üzerinden okunmalıdır; son yıl kısmi yıl olabilir.
- **Tesis ve şehir eşleştirmesi:** son atlas üretimi tesis kimliği üzerinden Phase 29 kimlik/kapsam tablosunu kullanır ve etkin şehir alanı yoksa mevcut yedek alanına döner. Bu, MiniLM'in konum tahmini yaptığı anlamına gelmez.
- **3B indirgeme:** düşük puanlı benzersiz metin embedding'leri UMAP ile üç boyuta indirgenir. Kullanılan bütün UMAP parametreleri bir sonraki bölümde verilmiştir.

### 4.6. Model ve yöntem kaynakları

- [MiniLM model kartı — mimari, dil kapsamı ve 384 boyutlu embedding'ler](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
- [Sentence-BERT makalesi — cümle embedding yaklaşımının temel yayını](https://arxiv.org/abs/1908.10084)
- [scikit-learn MiniBatchKMeans belgeleri](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.MiniBatchKMeans.html)
- [scikit-learn TfidfVectorizer belgeleri](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html)
- [UMAP parametreleri ve davranışı](https://umap-learn.readthedocs.io/en/latest/parameters.html)

## 5. Üç boyutlu koordinatların üretilmesi

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

## 6. Çıktı paketi

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

## 7. Üretim script'i ve yeniden üretilebilirlik

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

## 8. Sınırlamalar ve yorumlama ilkeleri

- **Seçilim yanlılığı:** Veri yalnızca belirli koşulları sağlayan 1–2 yıldızlı hastane yorumlarından oluşur. Genel memnuniyet oranı çıkarmak için tek başına kullanılamaz.
- **Eksik eşleştirmeler:** Bazı kayıtlarda şehir veya tesis metadata'sı bulunmayabilir ya da belirsiz olabilir.
- **Tema belirsizliği:** Tema atamaları analiz hattının çıktısıdır; elle doğrulanmış kesin etiketler olarak görülmemelidir.
- **UMAP izdüşümü:** Üç boyutlu uzaydaki mesafeler orijinal embedding uzayındaki tüm ilişkileri korumaz. Eksenlerin doğrudan bir yorumu yoktur.
- **Nedensellik:** Koordinat yakınlığı, ortak tema veya yorum sayısı tek başına belirli bir sorunun nedenini kanıtlamaz.
- **Gizlilik:** Yorum metinlerinin doğrudan içermediği hâlde kişileri veya olayları tanımlamaya yarayabilecek bağlamsal bilgiler bulunabilir. Paylaşım öncesi ayrı bir gizlilik değerlendirmesi yapılmalıdır.

## Yayınlama: Cloudflare Workers

Canlı sürüm, Cloudflare Workers'ın statik varlıkları üzerinden yayınlanır. Yayınlanan klasöre `index.html`, `grafikler.html` ve `review-universe.json.gz` kopyalanır; ham analiz kaynakları ve embedding matrisi yüklenmez. Ana sayfadaki **Embedding Evreni** ve **Grafikler** bağlantıları iki ekran arasında geçiş sağlar. Sıkıştırılmış veri paketi yaklaşık 19,39 MiB'dır; Cloudflare statik varlıklar için tek dosyada 25 MiB sınırı belirtir ([güncel limitler](https://developers.cloudflare.com/workers/platform/limits/)).

Wrangler oturumu açılmış makinede proje kökünden yeniden dağıtım yapmak için:

    .\deploy.ps1

Script gerekli iki dosyayı `dist/` klasörüne kopyalar ve Wrangler ile dağıtım yapar. `dist/` Git'e alınmaz; Wrangler yapılandırması `wrangler.jsonc` içindedir. Site `workers.dev` üzerinde herkese açık olarak sunulur.

## 9. Depo içeriği

    atlas-local/
    ├── .gitignore
    ├── README.md
    ├── favicon.svg
    ├── grafikler.html
    ├── index.html
    ├── site-nav.css
    └── review-universe.json.gz

Bu README yalnızca veri kapsamını, kaynakları, kalite kontrollerini ve üretim yöntemini belgelemeye odaklanır. Kaynak analiz verileri ve embedding'ler bu dosya ağacına dahil değildir.

---

## Kısa yöntem özeti

Hastane kategorisindeki, geçerli tarihe ve en az 20 karakterlik metne sahip 1–2 yıldızlı yorumlar seçilir; veterinerlik/hayvan ve diş hekimliği kategorileri dışarıda bırakılır. Yorum kayıtları tema metadata'sı ve 384 boyutlu embedding'lerle satır sırası, adet ve hash bilgileri üzerinden doğrulanır. Embedding'ler belirtilen UMAP ayarlarıyla üç boyuta indirgenir; tema, şehir, puan, tarih, tesis referansı ve gerçek yorum metniyle birlikte gzip'li JSON paketine yazılır.
