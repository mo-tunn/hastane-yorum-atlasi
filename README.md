# Hastane Yorum Atlası

119.427 düşük puanlı hastane yorumunu 3B anlamsal uzayda keşfetmek için etkileşimli bir arayüz.

## Çalıştırma

Python 3 kuruluysa bu klasörde terminal açıp çalıştır:

```powershell
python -m http.server 8765
```

Sonra tarayıcıda http://127.0.0.1:8765/ adresini aç. Port 8765 kullanımda ise `python -m http.server 8766` komutuyla başlatıp 8766 portunu kullan.

Uygulama güncel Chrome/Edge, WebGL ve `DecompressionStream` destekleyen bir tarayıcı gerektirir. Dosyayı doğrudan `file://` ile açmak yerine yerel HTTP sunucusu kullan.

## İçerik

- `index.html` — 3B yorum atlası, şehir/puan/arama filtreleri ve nokta ayrıntıları.
- `review-universe.json.gz` — yorumların 3B koordinatlarını, şehir/tema etiketlerini ve yorum metinlerini içeren sıkıştırılmış veri anlık görüntüsü.

## Veri ve gizlilik

Bu depo, yorum metinlerini içeren veri dosyasını barındırır; bu nedenle **private** olarak oluşturuldu. Depoyu public yapmadan önce yorumların paylaşım iznini, kullanım koşullarını ve kişisel/veri gizliliği risklerini ayrıca değerlendir. Veri dosyasını kaldırırsan arayüz açılır ancak yorum evreni yüklenemez.

3B yerleşim, yorum metni embedding'lerinin UMAP ile indirgenmesinden elde edilir. Tema etiketleri keşif amaçlıdır; tek başına neden-sonuç ilişkisi göstermez.
