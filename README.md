
<p align="center"><img width="128" alt="Overratd Logo" src="https://github.com/garretlowe/overratd/blob/main/src/images/overratd128.png?raw=true"></p>
<h2 align="center"><b>Overratd</b></h2>
<p align="center"><b>Add histograms to every list on Letterboxd</b></p>

---

Overratd adds histograms to Letterboxd lists which display the list owner's ratings for movies in the list.

Currently, the extension is limited to 100 movies at a time. This is because it reads the list of movies from the current page and Letterboxd can only display up to 100 movies per list page.

Additionally, the tooltips which display when hovering over bars do not currently work as you would expect them to based on the profile histograms.

Try it on: 

[Chrome Web Store](https://chrome.google.com/webstore/detail/overratd/lllkjhpcabokchmdinbmhgmnnkgoehhf)

[Firefox Add-ons](https://addons.mozilla.org/firefox/addon/overratd/)

<img src="https://github.com/garretlowe/overratd/blob/main/resources/sample1.png?raw=true">

## Changelog

### 1.1

* Migrated code from JS to TS with webpack
* Shortened graph label to first name only if username if formatted like a full name
* Cleaned up a lot of poor practices
  * Replaced xpath DOM searching with selector queries
  * Removed all `var` usage
  * Separated functionality into functions where it made sense to
  * Renamed almost everything for improved readability
  * Removed unused functionalities
* Updated to Manifest 3

### 1.0

* Initial commit <img width="28" alt="HYPERS" src="https://cdn.betterttv.net/emote/5980af4e3a1ac5330e89dc76/1x">
* Added histograms to letterboxd lists
* Automatically simplifies histogram for users who don't use half-star ratings

## Feature Wishlist

* Fix Tooltips
* Also show user's rating histogram for the list
  * Would probably require an API which the user would login through
* Overcome 100 movie limit
  * Send a separate get request to the other pages and collect the results?
  * Use an API to view lists?
