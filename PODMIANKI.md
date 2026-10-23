# Podmianki do Margonem

[Zainstaluj dodatek w Tampermonkey](https://raw.githubusercontent.com/Oskirrix/notyfikator/main/privejtozaur-rex-ni.user.js)

Jeśli wcześniej instalowano plik ręcznie, trzeba raz zainstalować powyższą wersję 3.1.0. Ma tę samą nazwę i namespace, więc powinna aktualizować dotychczasową instalację. Wyłącz ewentualne osobne starsze kopie i odśwież grę.

Skrypt ma adresy aktualizacji i pobierania wskazujące na ten plik w repozytorium. Tampermonkey sprawdza aktualizacje według ustawień użytkownika; automatyczne aktualizacje muszą być włączone. Po pobraniu nowej wersji należy odświeżyć grę. Aktualizacja nie jest natychmiastowa. Można też ręcznie wybrać sprawdzenie aktualizacji w Tampermonkey.

## Dodanie kolejnej podmianki

1. Wgraj przezroczysty PNG do tego repozytorium.
2. Otwórz `privejtozaur-rex-ni.user.js` i dopisz pozycję w tablicy `assets`, oddzielając ją przecinkiem od poprzedniej:

```js
{name:'Dokładna nazwa potwora', names:['dokładna nazwa potwora'], data:'https://raw.githubusercontent.com/Oskirrix/notyfikator/main/nowy-obrazek.png'}
```

3. W `names` wpisuj nazwę małymi literami, z polskimi znakami; można dodać warianty nazwy jako kolejne elementy tablicy.
4. Zwiększ `@version`, np. z `3.1.0` na `3.1.1`, oraz numer w `status()`.
5. Zapisz zmianę na gałęzi `main`. Użytkownicy z włączonymi aktualizacjami dostaną nową wersję przez Tampermonkey.

Samo dodanie PNG do repozytorium nie tworzy podmianki: trzeba również przypisać plik do nazwy NPC w skrypcie. Nie zmieniaj nazwy ani namespace skryptu, aby zachować ciągłość aktualizacji. Zachowaj Terrozaura jako pierwszy element tablicy: jego starsza ścieżka GIF jest rozpoznawana również przed pojawieniem się danych NPC.

Przy zmianie istniejącego obrazka najlepiej użyj nowej nazwy pliku (np. `nowy-obrazek-v2.png`) i zaktualizuj URL w skrypcie, żeby uniknąć starej kopii w pamięci podręcznej.

## Obecne podmianki i sprawdzenie

- Terrozaur → Privejtozaur Rex z poprawionymi zębami.
- Neferkar Set → Irianogarbaróg na wężu.

Podmiana jest lokalna dla osoby z zainstalowanym dodatkiem. Testy SI oraz rysowania NI przeszły; działania w zalogowanej sesji gry nie zweryfikowano.

Dokumentacja aktualizacji: [Tampermonkey](https://www.tampermonkey.net/documentation.php#meta:updateURL).

