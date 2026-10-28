# Hastane Yorum Atlası

119.427 düşük puanlı hastane yorumunu üç boyutlu anlamsal uzayda incelemek için geliştirilmiş, tarayıcıda çalışan etkileşimli veri keşif uygulaması.

Bu depo hem güncel arayüzü hem de arayüzün kullandığı sıkıştırılmış yorum evrenini içerir. Şehir, yıldız puanı, metin ve tesis aramasıyla veri alt kümeleri incelenebilir. Her nokta bir yorum kaydını temsil eder; bir noktaya tıklanınca yorumun metni ve kayıt ayrıntıları açılır.

> Depo yorum metinlerini içerdiği için GitHub üzerinde **private** tutulur. Depoyu herkese açmadan önce veri paylaşım izinlerini ve mahremiyet risklerini ayrıca değerlendirin.

---

## İçindekiler

1. Projenin amacı
2. Geliştirme süreci: baştan sona
3. Son sürümdeki özellikler
4. Veri hazırlama süreci
5. 3B anlamsal evrenin oluşturulması
6. Veri dosyası şeması
7. Teknik mimari
8. Yerelde çalıştırma
9. Kullanım kılavuzu
10. GitHub ile çalışma ve yedekleme
11. Sorun giderme
12. Sınırlamalar ve veri gizliliği
13. Dosya yapısı ve yeniden üretilebilirlik
14. Sonraki geliştirme fikirleri

---

## 1. Projenin amacı

Bu proje, hastane deneyimleri hakkındaki düşük puanlı yorumları yalnızca tablo veya sayılar olarak listelemek yerine, yorum metinlerinin anlamsal ilişkilerini keşfetmeye yardımcı olan bir görselleştirmeye dönüştürür.

Temel yaklaşım:

- Her yorumun metni bir embedding vektörüyle temsil edilir.
- Yüksek boyutlu embedding vektörleri üç boyutlu koordinata indirgenir.
- Koordinatlar tarayıcıda 3B nokta bulutu olarak çizilir.
- Tema kümesi, şehir, yıldız puanı, tarih, tesis ve yorum metni her kayıtla birlikte tutulur.
- Filtreler değiştiğinde aynı veri kümesinin uygun alt kümesi gösterilir.
- Bir nokta seçildiğinde gerçek yorum metni ve ilişkili kayıt ayrıntıları açılır.

Bu görünüm keşif ve inceleme amaçlıdır. Noktaların birbirine yakın olması, orijinal embedding uzayındaki metin temsillerinin benzerliğine işaret edebilir; 3B izdüşüm bütün ilişkileri kusursuz biçimde korumaz. Görselleştirme tek başına nedensellik veya klinik sonuç iddiası oluşturmaz.

## 2. Geliştirme süreci: baştan sona

Bu bölüm, yerel geliştirmede izlenen yolu ve her aşamada alınan tasarım kararlarını kaydeder.

### 2.1. Başlangıçtaki ilişki grafiği

İlk sürümde amaç, temaları, analizleri ve yöntem kayıtlarını birbirine bağlayan bir ağ görünümü oluşturmaktı. İlk geri bildirim, ağın fazla karmaşık göründüğü ve insanların hangi verilerin kümelendiğini ilk bakışta anlayamadığı yönündeydi.

Düğüm ve bağlantıların yalnızca ilişkili kavramları göstermesi yeterli değildi. Görünümün gerçek yorum hacmini de anlatması gerekiyordu.

### 2.2. Küme hacmini göstermek için ilk denemeler

Ağın yanına gerçek küme adetleriyle ilişkili renkli nokta bulutları eklendi. Her tam hacim noktası yaklaşık 1.000 yorumu temsil edecek şekilde tasarlandı. Bu, kümelerin büyüklüklerini karşılaştırmayı kolaylaştırdı.

Ancak bu ara çözümde tek tek yorumlar gösterilmiyordu; noktalar toplulaştırılmış hacim işaretleriydi. Kullanıcının gerçek yorum metinlerini tek tek nokta olarak görebilmesi için ham yorum kayıtlarına ve yorum başına embedding koordinatlarına ihtiyaç olduğu belirlendi.

### 2.3. Liste ve kart tabanlı sadeleştirme

Bir sonraki denemede 8 tema sıralı kartlara dönüştürüldü; yorum sayıları ve büyüklük çubukları eklendi. Arama ve karta tıklayınca ayrıntı görme özellikleri korundu.

Bu sürüm okunaklı olsa da asıl hedefi karşılamıyordu: yorumların uzayda nasıl dağıldığını göstermiyordu. Kartların rengini değiştirmek yerine veri temsilinin ve etkileşimin temelden değişmesi gerektiği kararlaştırıldı.

### 2.4. Gerçek yorum kayıtlarının ve embedding eşleşmesinin bulunması

Yerel analiz klasöründeki kaynaklar incelendi. Hastane yorumlarının bulunduğu Parquet dosyası, yorum başına tema metadata'sı, embedding matrisi, embedding ilerleme/hash bilgisi, şehir eşleştirmeleri ve tema açıklamaları bulundu.

Verinin yeniden kurulmuş satır sırasının mevcut metadata ile uyuştuğu kontrol edildi. Özellikle tesis kimliği, tarih, puan ve metin uzunluğu alanları karşılaştırıldı; embedding dosyasındaki metin sırası ve hash bilgisi de kullanıldı. Amaç, bir yorumun yanlış koordinata veya yanlış kümeye bağlanmasını önlemekti.

### 2.5. Her yorumu bir nokta yapan anlamsal yerleşim

119.427 uygun düşük puanlı yorum kaydı için üç boyutlu koordinatlar üretildi. Aynı normalize edilmiş metne sahip kayıtlar aynı anlamsal koordinatı paylaşabilir. Bu nedenle 119.427 yorum kaydı ile 119.206 farklı yorum metni birbirinden ayrı sayılardır.

Bu fark veri kaybı anlamına gelmez. Her yorum kaydı paket içinde ayrı ayrı bulunur; yalnızca aynı metne sahip bazı kayıtların uzaydaki konumu aynı olabilir.

### 2.6. Şehir, puan, tema ve arama filtreleri

Her noktanın tema kimliği, şehir kimliği, yıldız puanı, tarihi, tesis indeksi ve yorum metni saklandı. Böylece kullanıcı şehir veya puan filtresi seçtiğinde harita aynı veri paketi üzerinden yeniden çizilebilir hâle geldi.

Şehir eşleştirmesi tesis kimliği üzerinden mevcut yer/kimlik metadata'sından alınır. Eşleşmesi bulunamayan kayıtlar “şehir bilinmiyor” gibi bir grupta tutulabilir.

### 2.7. 3B WebGL görünümü

2B çizim yerine WebGL tabanlı gerçek bir 3B sahne oluşturuldu. Noktalar üç koordinatla çiziliyor; fareyle sürükleme sahneyi döndürüyor, tekerlek yakınlaştırıyor ve nokta seçimi yorumun ayrıntı panelini açıyor.

Bir ara sürümde küme sınırlarını temsil etmek için çemberler/küreler gösterildi. Bu sınırlar görsel olarak kafa karıştırdığı için son tasarımda kaldırıldı. Son sürümde ana görünüm tek tek yorum noktalarına odaklanır; tema renkleri ve kategori seçicileri kümeleri ayırt etmek için kullanılır.

### 2.8. Okunabilirlik ve etkileşim düzeltmeleri

Görsel denemeler sırasında şu iyileştirmeler yapıldı:

- Koyu ve yeşil ağırlıklı tasarım, sade beyaz arayüzle değiştirildi.
- Uzun tanıtım metinleri kaldırılarak harita alanı genişletildi.
- Noktalar tıklamayı kolaylaştırmak için büyütüldü ve fareyle seçme toleransı artırıldı.
- İmlecin üzerindeki nokta için renkli parlama, dış halka ve parlak merkez eklendi.
- Seçilen noktanın imlecin altındaki gerçek noktadan farklı görünmesine yol açan perspektif/ekran koordinatı uyumsuzluğu düzeltildi.
- Yakınlaştırma sınırı artırıldı; tekerlekle imlecin bulunduğu bölgeye doğru yakınlaştırma ve çift tıklamayla yakınlaştırma eklendi.
- Kategori seçicilerinde yorum sayısının yanında toplam veri içindeki yüzde gösterilmeye başlandı.
- Türkçe karakterlerin bozulmaması için HTML/JavaScript metinleri ve UTF-8 kodlaması gözden geçirildi.
- Küme çemberleri kaldırıldı; 3B noktalar, filtreler ve yorum seçimi korundu.

### 2.9. GitHub yedeğinin hazırlanması

Uygulama, daha büyük çalışma deposuna yanlışlıkla karışmaması için kendi Git deposuna sahip bağımsız bir klasör olarak ayrıldı. Yalnızca uygulama için gereken dosyalar ilk commit'e eklendi. GitHub'da yeni ve private bir depo oluşturuldu; yerel ana dal **main**, uzak **origin/main** ile eşitlendi.

README dosyası da geliştirme sürecini ve teknik yapıyı kaydetmek için genişletilmiştir.

## 3. Son sürümdeki özellikler

### 3.1. 3B yorum evreni

- 119.427 düşük puanlı yorum kaydı.
- 119.206 farklı normalize edilmiş yorum metni.
- Gerçek metin embedding'lerinden hesaplanmış X, Y ve Z koordinatları.
- Tarayıcıda WebGL üzerinden çizilen noktalar.
- Tema/küme etiketlerine göre renklendirme.
- Fareyle nokta üzerine gelince parlama ve tıklayınca kalıcı seçim işareti.
- Seçilen yorumun ayrıntıları için sağ panel.
- Gerçek zamanlı kamera dönüşü ve yakınlaştırma.

### 3.2. Filtreler

- **Şehir:** Tüm şehirler veya veri içinde bulunan belirli bir şehir.
- **Puan:** 1–2 yıldız, yalnızca 1 yıldız veya yalnızca 2 yıldız.
- **Metin araması:** Yorum metninde ve hastane/tesis adında arama.
- **Tema:** Alt bölümdeki kategori düğmeleriyle tüm temalar veya tek bir tema.
- **Kategori sayıları:** Her kategori için yorum sayısı ve toplam yorumlar içindeki yüzdesi.

Filtreler birlikte kullanılabilir. Örneğin İstanbul + yalnızca 1 yıldız + belirli bir tema seçilerek daha küçük bir alt küme incelenebilir.

### 3.3. Nokta seçimi

Bir nokta seçildiğinde sağ panelde kaydın tema etiketi, yorum metni, yıldız puanı, tarihi, şehir bilgisi ve tesis adı gösterilir. İmleç başka bir noktaya gittiğinde hover vurgusu değişir; tıklanmış kaydın seçimi ayrıca görünür tutulur.

## 4. Veri hazırlama süreci

Veri paketi bir tablodan rastgele noktalar üretilerek oluşturulmadı. Yerel analiz hattındaki gerçek embedding ve metadata dosyaları kullanıldı.

### 4.1. Kaynak dosyalar

Veri üretiminde yerel makinede bulunan şu kaynaklardan yararlanıldı:

- **reviews_analysis_subset.parquet** — hastane yorumlarını içeren analiz alt kümesi.
- **phase8_full_low_rating_review_topic_metadata.csv** — düşük puanlı yorumların tema/küme metadata'sı.
- **phase7_full_corpus_embeddings.npy** — yorum metinleri için 384 boyutlu embedding matrisi.
- **phase7_full_corpus_embedding_progress.json** — embedding üretimi, metin sayısı ve hash kontrol bilgileri.
- **phase29_all_1925_records_scope_and_identity.csv** — tesis kimliği ve şehir eşleştirmesi için kullanılan kayıtlar.
- **phase9_full_low_rating_topic_descriptors_labeled.csv** — temaların açıklama/etiket metadata'sı.

Bu kaynak dosyalar analiz çalışma alanında bulunur; tamamı bu uygulama deposuna kopyalanmamıştır. Uygulamayı çalıştırmak için kaynak analiz dosyaları yerine depo içindeki **review-universe.json.gz** dosyası yeterlidir.

### 4.2. Dahil edilme koşulları

Veri üretim adımında:

1. Hastane kategorisindeki kayıtlar seçildi.
2. Veteriner/hayvan hizmetleri ve diş kliniği gibi hastane dışı kapsamlar filtrelendi.
3. Geçerli bir tarih ve en az 20 karakter uzunluğunda, boş olmayan yorum metni arandı.
4. Uygun kayıtlar içinden 1 veya 2 yıldız puanlı yorumlar alındı.
5. Metinler Unicode NFKC normalizasyonu ve boşluk düzenlemesiyle eşleştirildi.
6. Tema metadata'sının satır sırası ile kayıtların tesis kimliği, tarih, puan ve metin uzunluğu kontrolleri karşılaştırıldı.
7. Benzersiz metinler embedding matrisiyle eşleştirildi; eşleşme sayısı ve hash kontrol edildi.
8. Her yorum kaydına ilgili metnin 3B koordinatı, tema kimliği, şehir kimliği ve diğer alanları bağlandı.
9. Büyük JSON paketi gzip ile sıkıştırılıp uygulamanın yanına yazıldı.

### 4.3. Veri sayıları

| Ölçüm | Değer |
|---|---:|
| Yorum kayıtları | 119.427 |
| Farklı normalize edilmiş yorum metni | 119.206 |
| Embedding boyutu | 384 |
| Görselleştirme boyutu | 3B |
| Tema kümesi | 8 |
| Sıkıştırılmış veri paketi | yaklaşık 20,3 MB |

Aynı normalize edilmiş metne sahip yorum kayıtları aynı X/Y/Z konumunu paylaşabilir. Kayıtlar paket içinde yine ayrı ayrı tutulur.

## 5. 3B anlamsal evrenin oluşturulması

### 5.1. Embedding

Embedding, metni sabit uzunlukta sayısal bir vektör olarak temsil eder. Bu projedeki mevcut embedding matrisi 384 boyutludur. Vektörler, metinler arasındaki anlamsal benzerlikleri keşfetmek için kullanılır.

### 5.2. UMAP ile boyut indirgeme

384 boyutlu embedding'lerin tamamı ekranda doğrudan gösterilemez. Bu yüzden düşük puanlı benzersiz metinlerin embedding'leri UMAP ile üç boyutlu uzaya indirgenir.

Veri üretim script'indeki ayarlar:

- Boyut sayısı: 3.
- Komşu sayısı: 20.
- Minimum mesafe: 0,08.
- Mesafe ölçümü: cosine.
- Epoch sayısı: 180.
- Rastgelelik tohumu: 42.
- Düşük bellek modu: açık.
- İş parçacığı: 1.

Bu ayarlar aynı makinede veri hattını yeniden çalıştırırken tutarlı bir yerleşim elde etmeyi hedefler. Kütüphane sürümü veya kaynak veriler değişirse koordinatlar birebir aynı olmayabilir.

### 5.3. Tarayıcıdaki 3B çizim

- WebGL, X/Y/Z koordinatlarını perspektifli 3B sahnede çizer.
- Noktaların rengi tema kimliğine göre atanır.
- Kamera dönüşü ve yakınlaştırma GPU tarafındaki projeksiyonla uygulanır.
- İmleç seçimi için noktaların ekran koordinatları hesaplanır; yakın nokta araması küçük bir mekânsal grid üzerinden yapılır.
- Seçilen ve hover edilen noktalar ana nokta katmanının üzerinde ayrı bir vurgu katmanıyla çizilir.

UMAP yerleşimi, 384 boyutlu uzayın birebir kopyası değildir. Nokta uzaklıkları ve görsel kümeler veri keşfi için yararlıdır; tek başına kesin sınıflandırma, neden-sonuç veya klinik önem kanıtı değildir.

## 6. Veri dosyası şeması

**review-universe.json.gz**, UTF-8 JSON içeriğinin gzip ile sıkıştırılmış hâlidir. Tarayıcı dosyayı HTTP üzerinden alır ve **DecompressionStream** ile açar.

### 6.1. Üst düzey alanlar

| Alan | Açıklama |
|---|---|
| version | Veri paketi sürümü. |
| count | Yorum kayıtlarının sayısı. |
| uniqueTexts | Farklı normalize edilmiş metinlerin sayısı. |
| dimensions | Koordinat boyutu; güncel pakette 3. |
| bounds | X/Y/Z eksenlerindeki özet sınırlar. |
| description | Veri kapsamına ilişkin kısa açıklama. |
| topics | Tema kimliği, görünen etiket, sayı, yüzde ve renk. |
| cities | Sayısal kimlik, şehir adı ve şehirdeki yorum sayısı. |
| places | Tesis adı ve tesis kimliği. |
| points | Tek tek yorum kayıtları. |

### 6.2. Nokta kayıt dizisi

Her **points** elemanı, veri boyutunu azaltmak için anahtar/değer nesnesi yerine sıralı bir dizidir:

| İndeks | Alan | Açıklama |
|---:|---|---|
| 0 | X | Birinci UMAP koordinatı. |
| 1 | Y | İkinci UMAP koordinatı. |
| 2 | Z | Üçüncü UMAP koordinatı. |
| 3 | Tema kimliği | topics içindeki tema kimliği. |
| 4 | Şehir kimliği | cities dizisindeki indeks. |
| 5 | Yıldız puanı | 1 veya 2. |
| 6 | Tarih ofseti | 1 Ocak 2000'den itibaren gün sayısı. |
| 7 | Tesis indeksi | places dizisindeki indeks. |
| 8 | Yorum metni | Gerçek kayıt metni. |

Dizilerin pozisyonel şeması dosya boyutunu azaltmak ve 119 bin noktanın tarayıcıda daha hızlı yüklenmesini sağlamak için kullanılır. Bu şemayı değiştirirseniz **index.html** içindeki okuma, filtreleme, tooltip ve nokta seçimi kodlarıyla birlikte güncellenmelidir.

## 7. Teknik mimari

### 7.1. İstemci tarafı

Uygulama tek sayfalı bir HTML/CSS/JavaScript uygulamasıdır; bu depoda ayrı bir backend servisi bulunmaz.

- **HTML:** Sayfa yapısı, filtreler, kategori seçicileri ve ayrıntı paneli.
- **CSS:** Beyaz/sade arayüz, responsive düzen ve hover/selected görünümleri.
- **JavaScript:** Sıkıştırılmış veri yükleme, filtreleme, kamera etkileşimleri ve nokta ayrıntıları.
- **WebGL:** 3B nokta çizimi, perspektif, kamera dönüşü ve seçili nokta vurguları.
- **DecompressionStream:** Gzip dosyasını tarayıcıda açma.

Uygulama veri paketini aynı dizindeki göreli adresten yükler. Bu yüzden HTML ve JSON.GZ dosyası birlikte sunulmalıdır.

### 7.2. Etkileşimler

| Eylem | Sonuç |
|---|---|
| Fareyle sürükleme | 3B evreni döndürür. |
| Fare tekerleği | İmleç konumuna doğru yakınlaştırır veya uzaklaştırır. |
| Çift tıklama | Yakınlaştırır. |
| Shift + sürükleme | Kamerayı yatay/dikey kaydırır. |
| Noktanın üzerine gelme | Nokta parlama halkasıyla belirginleşir ve kısa tooltip çıkar. |
| Noktaya tıklama | Yorumu sağ ayrıntı panelinde seçer. |
| Şehir seçimi | İlgili şehrin yorumlarını gösterir. |
| Puan seçimi | 1–2 yıldız, sadece 1 veya sadece 2 yıldız kayıtlarını filtreler. |
| Metin araması | Yorum metni veya tesis adında arama yapar. |
| Kategori seçicisi | Tek temayı veya tüm temaları filtreler. |
| Sıfırla | Filtreleri ve kamera görünümünü ilk duruma getirir. |

Yakınlaştırma sınırı 0,25× ile 50× arasındadır. Klavyedeki yön tuşları sahneyi döndürür; artı/eksi tuşları yakınlaştırmayı değiştirir.

## 8. Yerelde çalıştırma

### Gereksinimler

- Python 3 (yerel HTTP sunucusu için).
- WebGL destekleyen güncel Chrome veya Edge.
- DecompressionStream API'sini destekleyen modern tarayıcı.
- Aynı klasörde index.html ve review-universe.json.gz.

Node.js derleme işlemi gerekmez; arayüz doğrudan tarayıcıda çalışır.

### Windows / PowerShell

PowerShell'i uygulama klasöründe açın:

    cd "$env:USERPROFILE\Desktop\codemode-remote\remote-control-mcp\atlas-local"
    python -m http.server 8765

Sonra şu adresi tarayıcıda açın:

    http://127.0.0.1:8765/

Sunucuyu durdurmak için PowerShell penceresinde Ctrl+C kullanın.

Port 8765 başka bir işlem tarafından kullanılıyorsa farklı port belirleyin:

    python -m http.server 8766

Bu durumda tarayıcı adresi http://127.0.0.1:8766/ olur.

### Neden dosyaya çift tıklamak yerine HTTP sunucusu?

Uygulama veriyi **fetch()** ile yükler ve gzip içeriğini tarayıcıda açar. Güvenlik kısıtlamaları nedeniyle doğrudan **file://** üzerinden açıldığında veri isteği engellenebilir. Yerel HTTP sunucusu bu yüzden en güvenilir yöntemdir.

## 9. Kullanım kılavuzu

1. Sayfa açıldığında veri paketi yüklenir ve üç boyutlu nokta bulutu görünür.
2. Evreni fareyle sürükleyerek farklı açılardan inceleyin.
3. Bir bölgeye yaklaşmak için fare tekerleğini kullanın. Çok yakına geldiğinizde sürükleyerek çevrede gezinebilirsiniz.
4. Alt bölümde bir tema seçerek yalnızca o temaya ait yorumları gösterin. Tema düğmelerinde yorum sayısı ve toplam yorumlar içindeki yüzde birlikte gösterilir.
5. Şehir filtresinden bir şehir seçin. Tema ve yıldız filtresiyle birleştirebilirsiniz.
6. Belirli bir ifade veya tesis arıyorsanız arama alanına metin yazın.
7. İmleci bir noktanın üzerine getirin. Parlayan nokta ve tooltip hangi kaydı işaret ettiğinizi anlamanıza yardımcı olur.
8. Noktaya tıklayarak yorumun tam metnini, puanını, tarihini ve ilgili tesis/şehir bilgilerini sağ panelde açın.
9. Başlangıç görünümüne dönmek için Sıfırla düğmesini kullanın.

Çok yoğun bölgelerde aynı veya çok yakın koordinatlara sahip kayıtlar üst üste gelebilir. Bu durumlarda yakınlaştırmayı artırmak, metin araması kullanmak veya şehir/tema filtresiyle alt kümeyi küçültmek daha kolay seçim yapmanızı sağlar.

## 10. GitHub ile çalışma ve yedekleme

GitHub deposu:

    https://github.com/mo-tunn/hastane-yorum-atlasi

Depo **private** olarak ayarlanmıştır. Yerel Git deposu **main** dalını ve **origin** isimli uzak adresi kullanır.

### 10.1. Güncel değişiklikleri kaydetme

PowerShell'de proje klasörüne geçin:

    cd "$env:USERPROFILE\Desktop\codemode-remote\remote-control-mcp\atlas-local"

Değişiklikleri kontrol edin:

    git status

Dosyaları staging alanına ekleyin, commit oluşturun ve GitHub'a gönderin:

    git add .
    git commit -m "Atlas güncellemesi"
    git push

Sadece README değiştiyse daha kontrollü bir commit için:

    git add README.md
    git commit -m "README dokümantasyonunu genişlet"
    git push

Yeni bir makinede GitHub yedeğini almak için:

    git clone https://github.com/mo-tunn/hastane-yorum-atlasi.git
    cd hastane-yorum-atlasi
    python -m http.server 8765

Ardından http://127.0.0.1:8765/ adresini açın.

### 10.2. GitHub'a eklenen dosyalar

Bu depo uygulamanın çalışması için gereken dört dosyanın kaydını tutar:

- **index.html**
- **review-universe.json.gz**
- **README.md**
- **.gitignore**

Üst çalışma klasöründeki başka MCP/server dosyaları bu depoya dahil edilmemiştir. Gereksiz dosyaları veya gizli anahtarları bu depoya kopyalamayın.

## 11. Sorun giderme

### Sayfa açılıyor ama noktalar yüklenmiyor

- **review-universe.json.gz** dosyasının **index.html** ile aynı dizinde bulunduğunu kontrol edin.
- Sayfayı **file://** üzerinden değil, **http://127.0.0.1:8765/** üzerinden açın.
- Tarayıcıda Ctrl+F5 ile önbelleği yenileyin.
- Geliştirici araçlarındaki Network bölümünde **review-universe.json.gz** isteğinin başarılı olduğunu kontrol edin.

### 3B sahne görünmüyor

- Güncel Chrome/Edge kullanın.
- Tarayıcı ayarlarında donanım hızlandırma/WebGL desteğinin kapalı olmadığını kontrol edin.
- Uzak masaüstü veya sanal makine kullanıyorsanız grafik hızlandırması sınırlı olabilir.
- Tarayıcı konsolundaki WebGL veya shader hata mesajlarını inceleyin.

### Türkçe karakterler bozuk görünüyor

- Dosyayı UTF-8 kodlamasıyla saklayın.
- HTML başlığındaki UTF-8 charset tanımını kaldırmayın.
- Dosyaları yeniden kaydederken eski ANSI/Windows kodlamasına dönmeyin.
- Değişiklikten sonra Ctrl+F5 yapın.

### Yakın noktaya tıklayamıyorum

- Biraz daha yakınlaştırın.
- Şehir, puan veya tema filtresiyle noktaları azaltın.
- Arama alanını kullanın.
- Aynı veya çok yakın konumda birden fazla yorum bulunabileceğini unutmayın; üst üste binen noktalardan biri diğerlerini örtebilir.

### Değişiklik GitHub'a gitmedi

    git status
    git log -3 --oneline
    git remote -v

Commit oluşturulmuş ama gönderilmemişse:

    git push

## 12. Sınırlamalar ve veri gizliliği

- **Kapsam:** Paket bütün hastane yorumlarını değil, belirtilen koşulları sağlayan düşük puanlı yorumları içerir.
- **Temsil edicilik:** Düşük puanlı yorumlar, tüm hastaların veya tüm hastane deneyimlerinin rastgele örneklemi değildir.
- **Tekrarlanan metinler:** Farklı kayıtlar aynı normalize edilmiş metni taşıyorsa aynı 3B koordinatı paylaşabilir.
- **UMAP:** Üç boyutlu projeksiyon orijinal 384 boyutlu embedding ilişkilerini kusursuz korumaz. Eksenlerin tıbbi veya coğrafi anlamı yoktur.
- **Tema adları:** Tema etiketleri mevcut küme analizinden ve yorumlamadan gelir. İnsan doğrulaması yapılmadan kesin kategoriler olarak değerlendirilmemelidir.
- **Şehir verisi:** Şehir bilgisi tesis kimliği üzerinden eşlenir. Eşleşmeyen veya belirsiz şehir bilgileri için bir bilinmiyor değeri bulunabilir.
- **Nedensellik:** Noktaların yakınlığı veya bir temanın çok sayıda yoruma sahip olması tek başına belirli bir nedenin kanıtı değildir.
- **Performans:** 119 bin nokta GPU belleği, tarayıcı ve ekran çözünürlüğüne göre performans farkı yaratabilir. Filtreler görünür veri miktarını azaltır ama temel veri paketini tekrar indirmez.
- **Gizlilik:** Veri paketi yorum metinlerini içerir. Private GitHub deposu erişimi sınırlar ancak veri paylaşım izinlerinin veya veri koruma yükümlülüklerinin yerini tutmaz. Depoyu public yapmadan önce paylaşım koşullarını değerlendirin.

## 13. Dosya yapısı ve yeniden üretilebilirlik

Mevcut depo:

    atlas-local/
    ├── .gitignore
    ├── README.md
    ├── index.html
    └── review-universe.json.gz

**index.html**, veri paketini okuyan ve çizen istemci uygulamasıdır. **review-universe.json.gz**, önceden hazırlanmış koordinatları ve yorum kayıtlarını içerir. Bu iki dosya yerelde uygulamayı çalıştırmak için yeterlidir.

Koordinatları ve veri paketini yeniden üretmek için kullanılan geliştirme script'i yerel analiz çalışma alanında bulunur:

    C:\Users\metehan\Desktop\review_preanalysis\build_atlas_universe.py

Script şu tür ek kaynaklara ihtiyaç duyar: **reviews_analysis_subset.parquet**, embedding matrisi ve ilerleme/hash JSON'u, tema metadata/etiket CSV dosyaları ve şehir/tesis eşleştirme CSV'si. Bunlar bu uygulama deposuna dahil değildir; yol ve kaynak dosyalar taşınırsa üretim script'inin yapılandırması da güncellenmelidir.

Veri üretimini yeniden çalıştırmak, yalnızca noktaları tekrar çizmekten daha ağırdır: 384 boyutlu embedding'leri eşleştirir, UMAP ile 3B koordinatları yeniden hesaplar, şehir ve tema metadata'sını bağlar ve sıkıştırılmış veri dosyasını yeniden oluşturur. Yalnızca arayüzü değiştirmek için bu işlem gerekmez; çoğu tasarım/etkileşim güncellemesi **index.html** üzerinde yapılabilir.

Tekrarlanabilirliği geliştirmek için gelecekte veri üretim script'ini bu depoda **scripts/** altına taşımak, bağımlılık sürümlerini sabitlemek ve dosya yollarını komut satırı argümanlarına dönüştürmek önerilir. Ham yorum verileri ve kaynak embedding dosyaları büyük ve hassas olabileceğinden bunlar otomatik olarak GitHub'a eklenmemelidir.

## 14. Sonraki geliştirme fikirleri

- Belirli bir noktanın en yakın komşularını panelde göstermek.
- Şehir ve tema dağılımları için küçük istatistik özetleri eklemek.
- Veri paketi sürümünü, üretim tarihini ve kaynak hash'ini gösteren metadata oluşturmak.
- Veri üretim script'ini yapılandırılabilir hâle getirip bağımlılıkları sabitlemek.
- Nokta seçimi ve koordinat eşleşmeleri için otomatik testler eklemek.
- İstenirse yorum metnini panelde anonimleştirme veya kısmi gösterme seçeneği eklemek.

---

## Geliştirme özeti

Projenin ana evrimi, ilişki grafiğinden toplulaştırılmış küme görünümüne, oradan da her yorumun gerçek embedding koordinatını temsil ettiği 3B yorum evrenine geçiştir. Son tasarımın odağı yalnızca renk veya dekorasyon değil; gerçek veriyi keşfetmek, şehir ve puanlara göre alt kümeler oluşturmak, yakınlaştırarak tek tek noktaları seçmek ve yorum kaydını doğrudan inceleyebilmektir.
