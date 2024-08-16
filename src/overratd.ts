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

import axios from 'axios'

interface Bucket {
  count: number,
  height: number
}

const STAR = '★'
const HALF_FRACTION = '½'

function incrementBuckets (ratingBuckets: Bucket[], movieList: HTMLCollectionOf<HTMLElementTagNameMap['li']>): void {
  for (const movie of movieList) {
    const bucketNumber = Number.parseInt(movie.getAttribute('data-owner-rating') ?? '0') - 1
    if (bucketNumber !== -1) {
      ratingBuckets[bucketNumber].count += 1
    }
  }
}

function setCountsForMovies (doc: Document, ratingBuckets: Bucket[]): void {
  const movieList = doc.querySelector('div#content > div > div > section > ul')?.getElementsByTagName<'li'>('li')
  if (!movieList) return

  incrementBuckets(ratingBuckets, movieList)
}

function setCountsForMoviesFromNextPage (doc: Document, ratingBuckets: Bucket[]): void {
  const nextPageLink = doc.querySelector('a.next')?.getAttribute('href')
  if (!nextPageLink) return

  const headers = { Accept: 'text/html' }

  axios
    .get(nextPageLink, { headers })
    .then((response) => {
      const nextDocument = (new DOMParser()).parseFromString(response.data, 'text/html')
      setCountsForMovies(nextDocument, ratingBuckets)
      setCountsForMoviesFromNextPage(nextDocument, ratingBuckets)
    })
    .catch((error) => {
      console.error('Could not fetch next page\n' + 
        `URL: ${nextPageLink}\n` +
        error
      )
    })
}

function setCountsForMoviesFromPreviousPage (doc: Document, ratingBuckets: Bucket[]): void {
  const previousPageLink = doc.querySelector('a.previous')?.getAttribute('href')
  if (!previousPageLink) return

  const headers = { Accept: 'text/html' }

  axios
    .get(previousPageLink, { headers })
    .then((response) => {
      const previousDocument = (new DOMParser()).parseFromString(response.data, 'text/html')
      setCountsForMoviesFromPreviousPage(previousDocument, ratingBuckets)
      setCountsForMovies(previousDocument, ratingBuckets)
    })
    .catch((error) => {
      console.error('Could not fetch next page\n' + 
        `URL: ${previousPageLink}\n` +
        error
      )
    })
}

export function getRatingBucketsWithCounts (): Bucket[] {
  const ratingBuckets = new Array(10).fill(undefined).map(() => { return { count: 0, height: 44 } })
  // setCountsForMoviesFromPreviousPage(document, ratingBuckets)
  setCountsForMovies(document, ratingBuckets)
  // setCountsForMoviesFromNextPage(document, ratingBuckets)
  return ratingBuckets
}

function createElementWithAttribute (tagName: string, attributes?: Record<string, string>): HTMLElement {
  const element = document.createElement(tagName)
  for (const attributeName in attributes) {
    element.setAttribute(attributeName, attributes[attributeName])
  }
  return element
}

function getStars (bucketNumber: number): string {   
  const stars = STAR.repeat(Math.floor(bucketNumber / 2))
  return bucketNumber % 2 !== 0 ? `${stars}${HALF_FRACTION}` : stars
}

function getOwnerName (): string {
  let name = document.querySelector('a.name > span')?.textContent ?? ''
  name = name.split(' ')[0] // If it looks like a full name, only take the first name
  return (name.slice(-1) === 's')? `${name}'` : `${name}'s`
}

function calculateCountsAndHeights (ratingBuckets: Bucket[]): number {
  let maxCount = 0
  let movieCount = 0
  for (const bucket of ratingBuckets) {
    if (bucket.count > maxCount) maxCount = bucket.count
    movieCount += bucket.count
  }
  for (const bucket of ratingBuckets) {
    if (bucket.count === 0) { bucket.height = 1; continue }
    bucket.height *= bucket.count / maxCount
  }
  return movieCount
}

function roundToNearestHundredth (num: number): number {
  return Math.round(num * 100) / 100.0
}

function calculateAverageRating (ratingBuckets: Bucket[], movieCount: number): string {
  if (movieCount === 0) return '-'
  let average = 0
  for (let i = 0; i < ratingBuckets.length; i++) {
    const starValue = (i + 1) * 0.5
    average += ratingBuckets[i].count * starValue / movieCount
  }
  if (average === 0) return '-'
  return `${roundToNearestHundredth(average)}`
}

export function buildHistogram (ratingBuckets: Bucket[]): DocumentFragment {
  const section = createElementWithAttribute('section', { class: 'section ratings-histogram-chart' })
  const star1Span = createElementWithAttribute('span', { class: 'rating-green rating-green-tiny rating-1' })
  const star1 = createElementWithAttribute('span', { class: 'rating rated-2' })
  star1.textContent = STAR
  const star5Span = createElementWithAttribute('span', { class: 'rating-green rating-green-tiny rating-5' })
  const star5 = createElementWithAttribute('span', { class: 'rating rated-10' })
  star5.textContent = STAR.repeat(5)
  const sectionHeader = createElementWithAttribute('h2', { class: 'section-heading' })
  sectionHeader.textContent = `${getOwnerName()} Ratings`
  
  // Find Highest Count & Count Movies
  const allRatingsLink = createElementWithAttribute('p', { class: 'all-link' })
  const movieTotal = calculateCountsAndHeights(ratingBuckets)
  allRatingsLink.textContent = `${movieTotal}`

  // Calculate Rating Average
  const averageRatingSpan = createElementWithAttribute('span', { class: 'average-rating' })
  const averageRating = calculateAverageRating(ratingBuckets, movieTotal)
  const averageRatingTitle = averageRating !== '-' ? `Mean rating of ${averageRating} based on ${movieTotal} ratings` :'No ratings'
  const averageRatingLink = createElementWithAttribute('a', { class: 'tooltip display-rating', title: averageRatingTitle })
  averageRatingLink.textContent = averageRating
  averageRatingSpan.appendChild(averageRatingLink)

  // Determine Complexity
  const simplify = ratingBuckets[0].count === 0 && ratingBuckets[2].count === 0 && ratingBuckets[4].count === 0 && ratingBuckets[6].count === 0 && ratingBuckets[8].count === 0
  const complexity = simplify ? 'condensed' : 'exploded'

  const listDiv = createElementWithAttribute('div', { class: `rating-histogram clear rating-histogram-${complexity}` })
  const listHead = document.createElement('ul')

  // Build Histogram
  for (const [ index, bucket ] of ratingBuckets.entries()) {
    const bucketNumber = index + 1
    const isHalfStarBucket = bucketNumber % 2 !== 0
    if (simplify && isHalfStarBucket) continue

    const width = simplify ? 31 : 15
    const leftAdjust = simplify ? (16 * bucketNumber) - 32 : (16 * bucketNumber) - 16
    const ratingGroupAttributes = {
      class: 'rating-histogram-bar',
      style: `width: ${width}px; left: ${leftAdjust}px`
    }
    const ratingGroup = createElementWithAttribute('li', ratingGroupAttributes)

    let ratingLinkText
    if (bucket.count === 0) {
      ratingLinkText = 'No ratings'
    } else {
      const ratingPercentage = movieTotal === 0 ? 0 : Math.round(bucket.count / movieTotal * 100)
      ratingLinkText = `${bucket.count} ${getStars(bucketNumber)} ratings (${ratingPercentage}%)`
    }
    const ratingLinkAttributes = {
      class: 'ir tooltip',
      'data-original-title': ratingLinkText
    }
    const ratingLink = createElementWithAttribute('a', ratingLinkAttributes)
    ratingLink.textContent = ratingLinkText
    
    const ratingBar = createElementWithAttribute('i', { style: `height: ${bucket.height}px` })

    ratingLink.appendChild(ratingBar)
    ratingGroup.appendChild(ratingLink)
    listHead.appendChild(ratingGroup)
  }
  
  // Build Elements
  star1Span.appendChild(star1)
  star5Span.appendChild(star5)
  listDiv.appendChild(star1Span)
  listDiv.appendChild(listHead)
  listDiv.appendChild(star5Span)
  section.appendChild(sectionHeader)
  section.appendChild(allRatingsLink)
  section.appendChild(averageRatingSpan)
  section.appendChild(listDiv)

  const histogramFragment = new DocumentFragment()
  histogramFragment.append(section)
  return histogramFragment
}
