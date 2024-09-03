<center>

  # Overratd

  ![Overratd](https://github.com/garretlowe/overratd/blob/main/src/images/overratd128.png?raw=true)

  Add histograms to every list on Letterboxd

  [![Chrome Extension](https://img.shields.io/chrome-web-store/users/lllkjhpcabokchmdinbmhgmnnkgoehhf?logo=chromewebstore)](https://chromewebstore.google.com/detail/overratd/lllkjhpcabokchmdinbmhgmnnkgoehhf)
  [![Mozilla Add-on](https://img.shields.io/amo/users/overratd?logo=firefoxbrowser)](https://addons.mozilla.org/firefox/addon/overratd/)

</center>


Overratd adds histograms to Letterboxd lists which display the list owner's ratings for movies in the list.

Currently, the extension is limited to 100 movies at a time. This is because it reads the list of movies from the current page and Letterboxd can only display up to 100 movies per list page.

Additionally, the tooltips which display when hovering over bars do not currently work as you would expect them to based on the profile histograms.

<img src="https://github.com/garretlowe/overratd/blob/main/resources/sample1.png?raw=true">

## Build Instructions

### Setup

To setup dependencies, run the following:

```
npm install
```

### Build

To build the extension, run the following:

```
npm run pack
```

The extension should now be built to the `./dist/` directory.

## Changelog

### 1.2

* Add mean rating display to histograms
  * similar to the display on individual film pages
* Normalized code styling
* Added a bunch of disabled stuff that isn't being used yet

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

* Fix tooltips on Chromium browsers (working on Firefox!)
* Show user's rating histogram for the list
  * Would probably require an API which the user would login through
* Overcome 100 movie limit
  * Send a separate get request to the other pages and collect the results?
  * Use an API to view lists?
