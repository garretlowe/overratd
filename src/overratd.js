/*
 * Overratd | Adds rating histograms to public lists on Letterboxd
 * Copyright (C) 2022  Garret Lowe
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

function getElementByXPath(xpath) 
{
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getStars(bucket)
{   
    let stars = '\u2605'.repeat(Math.floor(bucket/2))
    if ((bucket) % 2 != 0)
    {
        return `${stars}\u00BD`;
    }
    return stars;
}

function getOwnerName()
{
    let name = getElementByXPath('//*[@id="html"]/body').getAttribute('data-owner');
    return (name.slice(-1) == 's')? `${name}'` : `${name}'s`;
}

var ratingBuckets = {
    '1': {
        'count': 0,
        'height': 44
    },
    '2': {
        'count': 0,
        'height': 44
    },
    '3': {
        'count': 0,
        'height': 44
    },
    '4': {
        'count': 0,
        'height': 44
    },
    '5': {
        'count': 0,
        'height': 44
    },
    '6': {
        'count': 0,
        'height': 44
    },
    '7': {
        'count': 0,
        'height': 44
    },
    '8': {
        'count': 0,
        'height': 44
    },
    '9': {
        'count': 0,
        'height': 44
    },
    '10': {
        'count': 0,
        'height': 44
    }
}

// Setup Elements
var listDiv = document.createElement('div');

var star1Span = document.createElement('span');
star1Span.setAttribute('class', 'rating-green rating-green-tiny rating-1');

var star1 = document.createElement('span');
star1.setAttribute('class', 'rating rated-2');
star1.textContent = '\u2605';

var star5Span = document.createElement('span');
star5Span.setAttribute('class', 'rating-green rating-green-tiny rating-5');

var star5 = document.createElement('span');
star5.setAttribute('class', 'rating rated-10');
star5.textContent = '\u2605\u2605\u2605\u2605\u2605';

var movieList = getElementByXPath("//*[@id=\"content\"]/div/div/section/ul").getElementsByTagName("li");

var section = document.createElement('section')
section.setAttribute('class', 'section ratings-histogram-chart');

var sectionHeader = document.createElement('h2');
sectionHeader.setAttribute('class', 'section-heading');
sectionHeader.textContent = `${getOwnerName()} Ratings`;

var allRatingsLink = document.createElement('p');
allRatingsLink.setAttribute('class', 'all-link');
allRatingsLink.textContent = movieList.length;

var listHead = document.createElement('ul');

// Collect Ratings
for (let i = 0; i < movieList.length; i++) 
{
    let bucket = movieList[i].getAttribute('data-owner-rating');
    if (bucket != 0) 
    {
        ratingBuckets[movieList[i].getAttribute('data-owner-rating')]['count'] += 1;
    }
}

// Determine Complexity
var simplify = ratingBuckets[1]['count'] == 0 && ratingBuckets[3]['count'] == 0 && ratingBuckets[5]['count'] == 0 && ratingBuckets[7]['count'] == 0 && ratingBuckets[9]['count'] == 0;

if (simplify) {
    listDiv.setAttribute('class', 'rating-histogram clear rating-histogram-condensed');
}
else
{
    listDiv.setAttribute('class', 'rating-histogram clear rating-histogram-exploded');
}

// Find Highest Count
let maxCount = 0
Object.keys(ratingBuckets).forEach(bucket => {
    if (ratingBuckets[bucket]['count'] > maxCount) {
        maxCount = ratingBuckets[bucket]['count'];
    }
});

// Calculate Heights
Object.keys(ratingBuckets).forEach(bucket => {
    if (ratingBuckets[bucket]['count'] == 0) 
    {
        ratingBuckets[bucket]['height'] = 1;
    }
    else 
    {
        ratingBuckets[bucket]['height'] *= ratingBuckets[bucket]['count']/maxCount;
    }
});

// Build Histogram
Object.keys(ratingBuckets).forEach(bucket => {
    // Skip bar if simplified
    if (simplify && bucket%2 != 0) {
        return;
    }

    // Create Bar
    let movie = document.createElement('li');
    movie.setAttribute('class', 'rating-histogram-bar');

    // Size according to complexity
    if (simplify) 
    {
        movie.setAttribute('style', `width: 31px; left: ${32*((bucket/2)-1)}px`);
    } 
    else 
    {
        movie.setAttribute('style', `width: 15px; left: ${16*(bucket-1)}px`);
    }

    let movieLink = document.createElement('a');
    movieLink.setAttribute('class', 'ir tooltip');

    let movieI = document.createElement('i');
    movieI.setAttribute('style', `height: ${ratingBuckets[bucket]['height']}px;`);
    if (ratingBuckets[bucket]['count'] == 0)
    {
        var linkText = 'No ratings';
    }
    else
    {
        var linkText = `${ratingBuckets[bucket]['count']}&nbsp${getStars(bucket)} ratings (${Math.round(ratingBuckets[bucket]['count']/movieList.length*100)}%)`;
    }
    movieLink.setAttribute('data-original-title', linkText);
    movieLink.textContent = linkText;

    movieLink.appendChild(movieI);
    movie.appendChild(movieLink);
    listHead.appendChild(movie);
});

// Build Elements
star1Span.appendChild(star1);
star5Span.appendChild(star5);
listDiv.appendChild(star1Span);
listDiv.appendChild(listHead);
listDiv.appendChild(star5Span);
section.appendChild(sectionHeader);
section.appendChild(allRatingsLink);
section.appendChild(listDiv);

getElementByXPath('//*[@id="content"]/div/div/aside').appendChild(section)
