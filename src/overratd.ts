/*
 * Overratd | Adds rating histograms to public lists on Letterboxd
 * Copyright (C) 2022  Garret Lowe
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// import axios from 'axios';

interface Bucket {
  count: number;
  value: number;
}

const STAR = '★';
const HALF_FRACTION = '½';

const STAR_ATTRIBUTES = (xTranslation: number) => {
  return {
    transform: `translate(${xTranslation}, 0)`,
    'fill-rule': 'evenodd',
    d: 'M5.065.45c-.22-.61-.95-.59-1.14 0l-.75 2.57H.705c-.73 0-.96.62-.37 1.07l1.99 1.53-.76 2.49c-.22.73.34 1.16.93.71l2-1.53 2 1.53c.59.45 1.15.02.93-.71l-.76-2.49 1.99-1.53c.59-.45.39-1.07-.33-1.07h-2.48z',
  };
};

function incrementBuckets(ratingBuckets: Bucket[], movieList: HTMLCollectionOf<HTMLElementTagNameMap['li']>): void {
  for (const movie of movieList) {
    const isGridView = movie.hasAttribute('data-owner-rating');
    let bucketNumber = -1;
    if (isGridView) {
      bucketNumber = Number.parseInt(movie.getAttribute('data-owner-rating') ?? '0') - 1;
    } else {
      // List View
      const ratingText = movie.querySelector('div.film-detail-content > p > span')?.textContent?.trim() ?? '';
      bucketNumber += ratingText.length * 2;
      if (ratingText.charAt(ratingText.length - 1) === HALF_FRACTION) bucketNumber -= 1;
    }

    if (bucketNumber >= 0) ratingBuckets[bucketNumber].count += 1;
  }
}

function setCountsForMovies(doc: Document, ratingBuckets: Bucket[]): void {
  const movieList = doc.querySelector('div#content > div > div > section > ul')?.getElementsByTagName<'li'>('li');
  if (!movieList) return;

  incrementBuckets(ratingBuckets, movieList);
}

// function setCountsForMoviesFromNextPage(doc: Document, ratingBuckets: Bucket[]): void {
//   const nextPageLink = doc.querySelector('a.next')?.getAttribute('href');
//   if (!nextPageLink) return;

//   const headers = { Accept: 'text/html' };

//   axios
//     .get(nextPageLink, { headers })
//     .then((response) => {
//       const nextDocument = new DOMParser().parseFromString(response.data, 'text/html');
//       setCountsForMovies(nextDocument, ratingBuckets);
//       setCountsForMoviesFromNextPage(nextDocument, ratingBuckets);
//     })
//     .catch((error) => {
//       console.error('Could not fetch next page\n' + `URL: ${nextPageLink}\n` + error);
//     });
// }

// function setCountsForMoviesFromPreviousPage(doc: Document, ratingBuckets: Bucket[]): void {
//   const previousPageLink = doc.querySelector('a.previous')?.getAttribute('href');
//   if (!previousPageLink) return;

//   const headers = { Accept: 'text/html' };

//   axios
//     .get(previousPageLink, { headers })
//     .then((response) => {
//       const previousDocument = new DOMParser().parseFromString(response.data, 'text/html');
//       setCountsForMoviesFromPreviousPage(previousDocument, ratingBuckets);
//       setCountsForMovies(previousDocument, ratingBuckets);
//     })
//     .catch((error) => {
//       console.error('Could not fetch next page\n' + `URL: ${previousPageLink}\n` + error);
//     });
// }

export function getRatingBucketsWithCounts(): Bucket[] {
  const ratingBuckets = new Array(10).fill(undefined).map(() => {
    return { count: 0.0, value: 1.0 };
  });
  // setCountsForMoviesFromPreviousPage(document, ratingBuckets)
  setCountsForMovies(document, ratingBuckets);
  // setCountsForMoviesFromNextPage(document, ratingBuckets)
  return ratingBuckets;
}

function createElementWithAttribute(tagName: string, attributes?: Record<string, string>): HTMLElement {
  const element = document.createElement(tagName);
  for (const attributeName in attributes) element.setAttribute(attributeName, attributes[attributeName]);
  return element;
}

function getStars(bucketNumber: number): string {
  const stars = STAR.repeat(Math.floor(bucketNumber / 2));
  return bucketNumber % 2 !== 0 ? `${stars}${HALF_FRACTION}` : stars;
}

function getStarsForHeader(bucketNumber: number): string {
  const starsText = getStars(bucketNumber);
  if (starsText === HALF_FRACTION) return `half-${STAR}`;
  return starsText;
}

function getOwnerName(): string {
  let name = document.querySelector('a.name > span')?.textContent ?? '';
  name = name.split(' ')[0]; // If it looks like a full name, only take the first name
  return name.slice(-1) === 's' ? `${name}'` : `${name}'s`;
}

function calculateCountsAndValues(ratingBuckets: Bucket[]): number {
  let maxCount = 0;
  let movieCount = 0;
  for (const bucket of ratingBuckets) {
    if (bucket.count > maxCount) maxCount = bucket.count;
    movieCount += bucket.count;
  }

  for (const bucket of ratingBuckets) bucket.value = (1.0 * bucket.count) / maxCount;

  return movieCount;
}

function roundToNearestHundredth(num: number): number {
  return Math.round(num * 100) / 100.0;
}

function calculateAverageRating(ratingBuckets: Bucket[], movieCount: number): string {
  if (movieCount === 0) return '-';
  let average = 0;
  for (let i = 0; i < ratingBuckets.length; i++) {
    const starValue = (i + 1) * 0.5;
    average += (ratingBuckets[i].count * starValue) / movieCount;
  }
  if (average === 0) return '-';
  return `${roundToNearestHundredth(average)}`;
}

function isSimplified(ratingBuckets: Bucket[]): boolean {
  for (let i = 0; i < ratingBuckets.length; i += 2) if (ratingBuckets[i].count !== 0) return false;
  return true;
}

export function buildHistogram(ratingBuckets: Bucket[]): DocumentFragment {
  const section = createElementWithAttribute('section', { class: 'section ratings-histogram-chart' });
  const sectionHeader = createElementWithAttribute('header', { class: 'section-header -divider -spaced-loose' });

  // Build Header Title
  const sectionHeaderTitle = createElementWithAttribute('h2', { class: 'section-heading -omitdivider heading' });
  const sectionHeaderText = createElementWithAttribute('a');
  sectionHeaderText.textContent = `${getOwnerName()} Ratings`;

  sectionHeaderTitle.appendChild(sectionHeaderText);
  sectionHeader.appendChild(sectionHeaderTitle);

  // Build Header Count
  const sectionHeaderCount = createElementWithAttribute('aside', { class: 'aside' });
  const sectionHeaderCountDiv = createElementWithAttribute('div', { class: 'section-accessories' });
  const sectionHeaderCountText = createElementWithAttribute('a', { class: 'accessory' });
  const movieTotal = calculateCountsAndValues(ratingBuckets);
  sectionHeaderCountText.textContent = movieTotal.toLocaleString();

  sectionHeaderCountDiv.appendChild(sectionHeaderCountText);
  sectionHeaderCount.appendChild(sectionHeaderCountDiv);
  sectionHeader.appendChild(sectionHeaderCount);

  section.appendChild(sectionHeader);

  // Build Histogram
  const ratingHistogram = createElementWithAttribute('div', { class: 'rating-histogram' });
  const histogramLayout = createElementWithAttribute('div', { class: 'layout' });

  // Build Star 1
  const star1Span = createElementWithAttribute('span', {
    class: 'stars -start rating-green rating-green-tiny rating-1',
  });
  const star1 = createElementWithAttribute('span', { class: 'rating rated-2' });
  star1.textContent = STAR;

  star1Span.appendChild(star1);
  histogramLayout.appendChild(star1Span);

  // Build Rating Table
  const ratingTable = createElementWithAttribute('table', { class: 'chart' });
  const ratingCaption = createElementWithAttribute('caption', { class: '_sr-only' });
  ratingCaption.textContent = 'Rating Distribution';

  ratingTable.appendChild(ratingCaption);

  // Build Table Header
  const tableHead = createElementWithAttribute('thead', { class: '_sr-only' });
  const tableHeadRow = createElementWithAttribute('tr');
  const tableHeader1 = createElementWithAttribute('th', { scope: 'col' });
  tableHeader1.textContent = 'Rating';
  const tableHeader2 = createElementWithAttribute('th', { scope: 'col' });
  tableHeader2.textContent = 'Count';

  tableHeadRow.appendChild(tableHeader1);
  tableHeadRow.appendChild(tableHeader2);
  tableHead.appendChild(tableHeadRow);

  ratingTable.appendChild(tableHead);

  // Build Table Body
  const tableBody = createElementWithAttribute('tbody', { class: 'plot' });
  const simplify = isSimplified(ratingBuckets);
  const increment = simplify ? 2 : 1;
  for (let i = simplify ? 1 : 0; i < ratingBuckets.length; i += increment) {
    const bucket = ratingBuckets[i];
    const tableRow = createElementWithAttribute('tr', { class: 'column', style: `--value: ${bucket.value};` });
    const rowHeader = createElementWithAttribute('th', { scope: 'row', class: '_sr-only' });
    const headerText = getStarsForHeader(i + 1);
    rowHeader.textContent = headerText;

    tableRow.appendChild(rowHeader);

    const cell = createElementWithAttribute('td', { class: 'cell' });
    const ratingPercentage = movieTotal !== 0 ? Math.round(bucket.value * 100) : 0.0;
    const cellLinkTitle =
      bucket.count === 0 ? `No ${headerText} ratings` : `${bucket.count} ${headerText} ratings (${ratingPercentage}%)`;
    const cellLink = createElementWithAttribute('a', {
      class: 'barcolumn tooltip',
      'data-original-title': cellLinkTitle,
    });
    const linkSpan = createElementWithAttribute('span', { class: '_sr-only' });
    linkSpan.textContent = `${bucket.count} (${ratingPercentage}%)`;
    const spanBar = createElementWithAttribute('span', { class: 'bar' });
    const spanFill = createElementWithAttribute('span', { class: 'fill' });

    spanBar.appendChild(spanFill);
    cellLink.appendChild(linkSpan);
    cellLink.appendChild(spanBar);
    cell.appendChild(cellLink);
    tableRow.appendChild(cell);
    tableBody.appendChild(tableRow);
  }

  ratingTable.appendChild(tableBody);
  histogramLayout.appendChild(ratingTable);

  // Build Star 5
  const star5Span = createElementWithAttribute('span', {
    class: 'stars -end rating-green rating-green-tiny rating-5',
  });
  const star5 = createElementWithAttribute('span', { class: 'rating rated-10' });
  star5.textContent = STAR.repeat(5);

  star5Span.appendChild(star5);
  histogramLayout.appendChild(star5Span);

  // Finish Build
  ratingHistogram.appendChild(histogramLayout);
  section.appendChild(ratingHistogram);

  const histogramFragment = new DocumentFragment();
  histogramFragment.append(section);
  return histogramFragment;
}

