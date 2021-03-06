const baseUrl = "http://www.omdbapi.com/?apikey=edd66bb"; //"apiKey=2454706d";
const contentNode = document.querySelector(".content");
const resultsHeaderNode = document.querySelector(".results-header");
const resultsListNode = document.querySelector(".results-list");
const resultsPagesNode = document.querySelector(".results-pages");
const resultsShowingNode = document.querySelector(".results-showing");
const filmContainer = document.querySelector(".film-content");
const filmContainerIpad = document.querySelector(".film-content-ipad");
const form = document.querySelector(".form");
const searchInput = document.querySelector(".search");
let currentPage = 1;
let loaded = 0;
let currentID = "";

function getMoviesFromSearch (url){
    if (searchInput.value === "") return;
    resultsListNode.innerHTML = `<div class="padding">LOADING...</div>`;
    return fetch(url)
    .then(response => response.json())
    .then(body => {
        console.log("loaded from search ======= " + loaded);
        if (loaded === 0) { 
            searchHeaderMessage(body);
            pageNumbers(body);
            loaded = 1;
        }
        return body.Search;
    }).catch(error => console.log(error));
}

function getMoviesFromPagination (url){
    resultsListNode.innerHTML = `<div class="padding">LOADING...</div>`;
    return fetch(url)
    .then(response => response.json())
    .then(body => {
        console.log("loaded from pag ======= " + loaded);
        if (loaded === 0) { 
            searchHeaderMessage(body);
            pageNumbers(body);
            loaded = 1;
        }
        return body.Search
    })
    .catch(error => console.log(error))
}

// render film list
function renderFilmList(filmList) {
    if (filmList === undefined) {
        clearNodes();
        return;
    }
    return filmList.map(film => {
        return `<div class="result-link"><a href="#film-frame" id="${film.imdbID}">${film.Title}, ${film.Year}</a></div>`;
    }).join('');
}

function searchHeaderMessage (body) {
    const totalResults = body.totalResults ? body.totalResults : "No";
    let html = `<div><b><i>${totalResults} results for "${searchInput.value}"</i></b></div>`;
    resultsHeaderNode.innerHTML = '';
    resultsHeaderNode.innerHTML = html;
}

const pageNumbers = function (body) {
    const n = body.totalResults ? body.totalResults : 1;
    const totalPageLinks = Math.floor(n / 10) + 1;
    let html = ``;
    if (totalPageLinks <= 1) {
        resultsShowingNode.innerHTML = "";
        return;
    } else {
        resultsShowingNode.innerHTML = `<div><i>, page ${currentPage} of ${totalPageLinks}</i></div><div>`;
        for (let i=1; i<=totalPageLinks; i++) {
            const active = i === 1 ? " active" : "";
            // shadow-light
            html += `<a class="page-number-link${active}" href="#" onClick="fetchFromButton(${i},${totalPageLinks});">&nbsp;${i}&nbsp;</a>`
        }
    }
    resultsPagesNode.innerHTML = "";
    resultsPagesNode.innerHTML = html;

    const pageButtonList = document.querySelectorAll(".page-number-link");
    pageButtonList.forEach(pageButton => {
        pageButton.addEventListener("click", event => {
            const prevThumb = document.querySelector(".active");
            if (prevThumb !== null) {
                prevThumb.classList.remove("active");
                event.target.classList.add("active");
            }
        })
    });
}

form.addEventListener('submit', event => {	
    currentPage = 1;   
    event.preventDefault();
    if (event.target.value.length >= 3) {
        renderResultsFromSearch(currentPage);
    }
});

function renderResultsFromSearch(page, mode) {
    resultsListNode.classList.add("open");
    const url = `${baseUrl}&s=${searchInput.value}&page=${page}`;
    getMoviesFromSearch(url, mode).then(filmList => {
        resultsListNode.innerHTML = renderFilmList(filmList);
    });
}

function fetchFromButton(page, totalPageLinks) {
    resultsShowingNode.innerHTML = `<div><i>, page ${page} of ${totalPageLinks}</i></div>`;
    resultsListNode.classList.add("open");
    const url = `${baseUrl}&s=${searchInput.value}&page=${page}`;
    getMoviesFromPagination(url).then(filmList => {
        resultsListNode.innerHTML = renderFilmList(filmList);
        currentPage = page;    
    });
}  

searchInput.addEventListener('input', event => {
    // currentPage = 1;
    const input = event.target.value;
    if (input === "") {
        loaded = 0;
        return;
    } else {
        if (input[input.length-1] === ' ') return;
        if (event.target.value.length >= 3) {
            renderResultsFromSearch(currentPage);
            const msg = `The title "${input}" is unknown. Please try again.`;
            resultsHeaderNode.innerHTML = `<div class="results-showing">${msg}</div>`;
        } else {
            clearNodes('minimumLetters', input);
            const msg = `Type at least 3 letters to search...`;
            resultsHeaderNode.innerHTML = `<div class="results-showing">${msg}</div>`;
        }
    }
})    
resultsHeaderNode.innerHTML = `<div class="results-showing">Please start by typing in your search...</div>`;

function clearNodes(mode, input) {
    resultsListNode.classList.remove("open");
    resultsListNode.innerHTML = "";
    resultsPagesNode.innerHTML = "";
    resultsShowingNode.innerHTML = '';
}

/*
/////////////////////////////////////
FETCH
*/

contentNode.addEventListener('click', event => {
    if (event.target.matches('.result-link a')){
        filmContainer.innerHTML = "LOADING...";
        filmContainerIpad.innerHTML = "LOADING...";
        currentID = event.target.id;
        fetchSingleMovieByID(event.target.id);
    };
});

function fetchSingleMovieByID (id){
    const url = `${baseUrl}&i=${id}`;
    return fetch(url)
    .then(response => response.json())
    .then(filmObject => {
        if (window.innerWidth < 768) {
            filmContainer.classList.add("on");
            filmContainer.innerHTML = convertMovieObject (filmObject);
        } else {
            filmContainerIpad.innerHTML = convertMovieObject (filmObject);
        }
    }).catch(error => console.log(error));
}

Array.prototype.filterOut = function(ignore) {
    return this.filter(item => ignore.indexOf(item) < 0);
}

function getViewportSize () {
    return window.innerWidth < 768 ? 'mobile' : 'ipad';
}
let viewport = getViewportSize();
console.log(viewport);

window.addEventListener('resize', event => {
    let currentViewPort = getViewportSize ();
    if (currentViewPort !== viewport) {
        fetchSingleMovieByID(currentID);
        viewport = currentViewPort;
    }
});

function convertMovieObject (film) {
    const keys = Object.keys(film);
    const excludedArray = ["Website","Poster","Title","Plot","Response","Ratings"]
    const listOfDetailsArray = keys.filterOut(excludedArray).map(item => {
        return (film[item] !== "N/A") ? `<li><strong>${item}:</strong> ${film[item]}</li>` : ``;
    });
    const website = film.Website ? `<li><a href="${film.Website}" target="_blank">Visit website</a></li>` : ``;
    const firstPartOfList = listOfDetailsArray.filter((item, index) => {
        return index < Math.floor(listOfDetailsArray.length / 2);
    }) 
    const secondPartOfList = listOfDetailsArray.filter((item, index) => {
        return index >= listOfDetailsArray.length - Math.floor(listOfDetailsArray.length / 2);
    }) 

    let htmlString = '';
    if (viewport === 'mobile') {
        htmlString = 
        `<div class="article__main">
            <div class="article__image">
                <img src="${film.Poster}" class="article__image__src">
            </div>
            <div>
                <span class="article__header">
                    <div><strong>${film.Title}</strong></div>
                </span>
            </div>
            </div>
            <div class="article__text">
                <h3>Plot</h3>${film.Plot}
                <div><a href="https://www.imdb.com/title/${film.imdbID}" target="_blank">More details on IMDB</a></div>
                <div>
                    <ul>
                        ${listOfDetailsArray.join('')}
                        ${website}
                    </ul>
                </div>   
            </div>
        </div>`
    } else {
        htmlString = 
        `<div class="article__main">
            <div>
                <span class="article__header">
                    <div><strong>${film.Title}</strong></div>
                </span>
            </div>
            <div class="article__photo__wrapper">
                <div class="article__image">
                    <img src="${film.Poster}" class="article__image__src">
                </div>
                <div class="article__photo__keypoint">
                    <ul>
                        ${firstPartOfList.join('')}
                    </ul>
                </div>
            </div>
        </div>
        <div class="article__text">
            <h3>Plot</h3>${film.Plot}
            <div><a href="https://www.imdb.com/title/${film.imdbID}" target="_blank">More details on IMDB</a></div>
            <div>
                <ul>
                    ${secondPartOfList.join('')}
                    ${website}
                </ul>
            </div>   
        </div>`
    }
    return htmlString;
}