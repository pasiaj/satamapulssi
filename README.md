# Satamapulssi

Oulun satamakäyntejä esittävä itsenäinen, staattinen projektisivu. Kuukausittaisia käyntejä voi tutkia satamittain ja alustyypeittäin. Sivun rakenne ja typografia seuraavat pasiaj.comin Junavalo-projektisivua. Projekti on myös liitetty pasiaj.comin lähdekoodiin; verkkosivulle julkaisu tehdään sivuston oman julkaisuprosessin kautta.

## Sisältö

- `index.html`: projektisivu, lähteet ja menetelmä
- `satamat.css`: responsiivinen ulkoasu
- `satamat.js`: kuukausipylväät, rajaukset ja lämpökartta ilman ulkoisia kirjastoja
- `data.json`: Digitrafficista 9.10.2026 haettu kuukausittainen aineisto
- `update_data.py`: datan päivitys julkisesta Portnet API:sta

## Päivitä aineisto

Aja hakemistossa `python3 update_data.py`. Skripti käyttää Pythonin vakiokirjastoa sekä `curl`-ohjelmaa ja hakee Oulun (`FIOUL`) toteutuneet saapumiset vuosittaisina API-kyselyinä. Se estää julkaisun, jos jokin vuosihaku saavuttaa rajapinnan 1 000 rivin rajan. Kuukausi määräytyy Suomen paikallisajan mukaan. Yksi `portCallId` lasketaan kerran ja kohdistetaan ensimmäisen toteutuneen `ata`-ajan satama-alueeseen.

Vuosi 2018 on hajanainen ennen lokakuuta, ja kuluvan kuukauden ruutu merkitään keskeneräiseksi. API ei sisällä luotettavaa käyntikohtaista lastimäärää. Sivun leipätekstin historialliset luvut ja Oulun Sataman vuoden 2025 tonni-/konttiluvut ovat tarkoituksella toimituksellista, päivättyä tekstiä; tarkista ne erikseen, jos tekstiä muutetaan tai ajanjaksoa laajennetaan.

## Esikatsele ja julkaise

Aja `python3 -m http.server 8765` tässä hakemistossa ja avaa `http://127.0.0.1:8765/`. Sivun oma `index.html` toimii ilman sivustogeneraattoria. Pasiaj.comin lähdekoodissa projektisivun teksti on erillisessä Markdown-tiedostossa ja nämä kaaviot sekä data kopioidaan sen assetteihin. Sivuston julkaisu ja datan automaattinen päivitys edellyttävät erillistä ajastusta.

## Lähteet

- [Digitrafficin meriliikenteen rajapinta](https://www.digitraffic.fi/meriliikenne/)
- [Digitraffic Swagger](https://meri.digitraffic.fi/swagger/)
- [Oulun Sataman satamat](https://ouluport.com/satamat/)
- [Oulun Sataman vuoden 2025 liikennetiedote](https://ouluport.com/oulun-sataman-sahatavaran-vienti-nousi-uuteen-ennatykseen-myos-konttiliikenne-lahes-huippulukemissa/)
- [Junavalo-esimerkki pasiaj.comissa](https://pasiaj.com/projektit/junavalo/)
- [Kaupunnin Ajan Junavalo-juttu](https://kaupunni.org/kaupunki/oulun-junat-liikennevaloissa/)
