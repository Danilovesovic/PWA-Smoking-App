# 🚬 Smoke Tracker PWA

Moderna, brza i jednostavna PWA aplikacija za praćenje popušenih cigareta, kontrolu troškova i motivaciju kroz sistem bedževa i postignuća.

---

## 📱 Kako prebaciti i instalirati aplikaciju na Android telefon?

### Korak 1: Postavljanje na GitHub
1. Kreiraj novi repozitorijum na GitHub-u (npr. `smoke-tracker`).
2. U terminalu u ovom folderu pokreni sledeće komande:
   ```bash
   git init
   git add .
   git commit -m "Inicijalna verzija Smoke Tracker aplikacije"
   git branch -M main
   git remote add origin https://github.com/TVOJE_KORISNICKO_IME/smoke-tracker.git
   git push -u origin main
   ```

### Korak 2: Uključivanje GitHub Pages (Besplatan Hosting)
1. Na GitHub-u u tvom novom repozitorijumu idi na **Settings** -> **Pages** (u levom meniju).
2. Pod **Build and deployment**:
   - **Source**: Izaberi `Deploy from a branch`.
   - **Branch**: Izaberi `main` i folder `/ (root)`, pa klikni na **Save**.
3. Nakon 1–2 minuta dobićeš tvoj javni link, na primer:
   `https://tvoje-korisnicko-ime.github.io/smoke-tracker/`

### Korak 3: Instalacija na Android telefon
1. Otvori dobijeni GitHub Pages link u **Google Chrome** pretraživaču na svom Android telefonu.
2. Klikni na dugme **"Instaliraj"** koje se pojavi na vrhu ekrana, ili:
   - Klikni na tri tačkice u gornjem desnom uglu Chrome-a (meni).
   - Izaberi **"Install app"** (ili **"Add to Home screen"** / **"Dodaj na početni ekran"**).
3. Aplikacija se odmah pojavljuje na početnom ekranu tvog telefona kao prava aplikacija (otvara se preko celog ekrana, radi 100% offline i čuva sve podatke).

---

## 🌟 Ključne Funkcionalnosti

- **Veliko "SMOKE" dugme**: Taktilni odziv sa haptičkom vibracijom telefona i suptilnim zvukom pri svakom unosu.
- **Živi tajmer**: Broji sate, minute i sekunde protekle od poslednje zapaljene cigarete.
- **Sistem Trofeja & Bedževa (15+ Postignuća)**:
  - Otključavanje bedževa: 20 min, 1h, 2h, 4h, 6h, 8h, 12h, 24h, 48h, 3 dana, 1 nedelja, 1 mesec...
  - Prikaz konkretnih zdravstvenih poboljšanja u telu za svaki nivo.
  - Automatsko iskačuće slavlje sa konfetama i fanfarama pri osvajanju novog bedža!
- **Finansijski proračun**: Unos cene paklice, proračun dnevne i ukupne potrošnje.
- **Dnevnik & Istorija**: Pregled cigareta po danima i vremenu, mogućnost brisanja unosa i dodavanja unosa unazad ako zaboraviš da klikneš na vreme.
- **Undo opcija**: Brzo poništavanje slučajnog klika na dugme.
- **Sigurnost podataka**: Export / Import rezervne kopije u JSON fajl.
