import { Firebase } from './firebase.js';
import { JourneyWeb }   from './journey-web.js';
import { ConvertUtil } from './convert-util.js';
import { ImageGallery } from './image-gallery.js';

export class SearchField
{
    static #instance;

    static MAX_SUGGESTIONS_COUNT = 20;

    #dataJsonUrl = '/src/data/journey-list.json';

    #searchInput     = document.getElementById("search");
    #suggestionsList = document.getElementById("suggestions");

    selectedIndex = -1; // Index vybraného prvku v seznamu návrhů

    data = {};

    constructor() 
    {
        if (SearchField.#instance) 
        {
            return SearchField.#instance;
        }

        SearchField.#instance = this;
    }

    async init() 
    {
        await this.#readData();

        this.#searchInput     = document.getElementById("search");
        this.#suggestionsList = document.getElementById("suggestions");

        this.#addEventListeners(this);

        return this; // Vrací instanci pro další použití
    }

    #addEventListeners(searchField)
    {
        searchField.#searchInput.addEventListener("input", function () 
        {
            const query = this.value.toLowerCase();

            searchField.#suggestionsList.innerHTML     = "";
            searchField.#suggestionsList.style.display = "none";

            searchField.selectedIndex = -1;

            if (query.length === 0) 
            {
                return;
            }

            // let matches = searchField.data
            //     .filter(journey => journey.label.toLowerCase().includes(query))
            //     .slice(0, SearchField.MAX_SUGGESTIONS_COUNT);

            let matches = searchField.data
                .filter(journey => journey.title.toLowerCase().includes(query))
                .slice(0, SearchField.MAX_SUGGESTIONS_COUNT);

            if (matches.length > 0) 
            {
                searchField.#suggestionsList.style.display = "block";

                matches.forEach((match, index) => 
                {
                    const journeyDateFormatted = ConvertUtil.formatFirestoreTimestampForDisplay(match.journeyDate);

                    const li = document.createElement("li");
                    li.innerHTML = `${searchField.highlightText(match.title, query)} ${journeyDateFormatted}`;
                    li.dataset.journeyCardId = match.journeyId;
                    li.addEventListener("click", async () => searchField.selectItem(match.journeyId));
                    searchField.#suggestionsList.appendChild(li);
                });
            }
        });

        searchField.#searchInput.addEventListener("keydown", async function (event) 
        {
            const items = searchField.#suggestionsList.querySelectorAll("li");

            if (items.length === 0) 
            {
                return;
            }

            if (event.key === "ArrowDown") 
            {
                event.preventDefault();

                searchField.selectedIndex = (searchField.selectedIndex + 1) % items.length;

                searchField.updateSelection(items);
            } 
            else if (event.key === "ArrowUp") 
            {
                event.preventDefault();

                searchField.selectedIndex = (searchField.selectedIndex - 1 + items.length) % items.length;

                searchField.updateSelection(items);
            } 
            else if (event.key === "Enter" && searchField.selectedIndex !== -1) 
            {
                event.preventDefault();

                await searchField.selectItem(items[searchField.selectedIndex].dataset.journeyCardId);
            }
        });

        document.addEventListener("click", (e) => 
        {
            if (e.target !== searchField.#searchInput) 
            {
                searchField.#suggestionsList.style.display = "none"; 

                searchField.#searchInput.value = "";
            }
        });
    }

    async #readData()
    {
        try 
        {
            const whereConditions = [];
            
            const orderByConditions = [["journeyDate", "desc"]];

            this.data = await Firebase.readDataAsync(JourneyWeb.journeysCollectionName, whereConditions, orderByConditions);
        } 
        catch (error) 
        {
            console.error("Chyba při načítání:", error.message);

            return null;
        }
    }

    highlightText(text, query) 
    {
        const regex = new RegExp(`(${query})`, "gi");

        return text.replace(regex, `<span class="highlight">$1</span>`);
    }

    async selectItem(journeyCardId) 
    {
        const leftNavToggle = document.body.querySelector(".main-nav-toggle .material-symbols-outlined");

        if (leftNavToggle)
        {
            if (window.innerWidth <= 768) 
            {
                leftNavToggle.click();
            }
        }

        this.#searchInput.value = "";

        this.#suggestionsList.style.display = "none";

        const journeyCardLabel = document.body.querySelector(`.journey-card[id='${journeyCardId}'] .journey-card-label`);

        const journeyCard = journeyCardLabel.closest(".journey-card");

        journeyCard.dataset.forceOpen = "true";

        //journeyCardLabel.click();

        await JourneyWeb.setJourneyCardContent(journeyCardLabel, new ImageGallery());

        // const journeyCardContent = journeyCard.querySelector(".journey-card-content");

        // if (journeyCardContent && journeyCardContent.classList.contains("hidden"))
        // {
        //     journeyCardContent.classList.remove("hidden");
        // }

        JourneyWeb.moveToJourneyCard(journeyCard);
    }

    updateSelection(items) 
    {
        items.forEach((item, index) => 
        {
            item.style.background = index === this.selectedIndex ? "#ddd" : "white";
        });
    }
}