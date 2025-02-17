import { JourneyWeb }   from './journey-web.js';

export class SearchField
{
    static #instance;

    static MAX_SUGGESTIONS_COUNT = 10;

    #dataJsonUrl = '/src/data/journey-list.json';

    #searchInput     = document.getElementById("search");
    suggestionsList = document.getElementById("suggestions");

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

        this.#addEventListeners(this);

        return this; // Vrací instanci pro další použití
    }

    #addEventListeners(searchField)
    {
        this.#searchInput.addEventListener("input", function () 
        {
            const query = this.value.toLowerCase();

            searchField.suggestionsList.innerHTML     = "";
            searchField.suggestionsList.style.display = "none";

            searchField.selectedIndex = -1;

            if (query.length === 0) 
            {
                return;
            }

            let matches = searchField.data
                .filter(journey => journey.label.toLowerCase().includes(query))
                .slice(0, SearchField.MAX_SUGGESTIONS_COUNT);

            if (matches.length > 0) 
            {
                searchField.suggestionsList.style.display = "block";

                matches.forEach((match, index) => 
                {
                    const li = document.createElement("li");
                    li.innerHTML = searchField.highlightText(match.label, query);
                    li.dataset.journeyCardId = match.id;
                    li.addEventListener("click", () => searchField.selectItem(match.id));
                    searchField.suggestionsList.appendChild(li);
                });
            }
        });

        this.#searchInput.addEventListener("keydown", function (event) 
        {
            const items = searchField.suggestionsList.querySelectorAll("li");

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

                searchField.selectItem(items[searchField.selectedIndex].dataset.journeyCardId);
            }
        });

        document.addEventListener("click", (e) => 
        {
            if (e.target !== searchField.#searchInput) 
            {
                searchField.suggestionsList.style.display = "none"; 

                searchField.#searchInput.value = "";
            }
        });
    }

    async #readData()
    {
        try 
        {
            const response = await fetch(this.#dataJsonUrl);
    
            if (!response.ok) 
            {
                throw new Error(`Chyba HTTP: ${response.status} ${response.statusText}`);
            }
    
            this.data = (await response.json()).flatMap(year => year.journeys);
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

    selectItem(journeyCardId) 
    {
        this.#searchInput.value = "";

        this.suggestionsList.style.display = "none";

        const journeyCardLabel = document.body.querySelector(`.journey-card[id='${journeyCardId}'] .journey-card-label`);

        journeyCardLabel.click();

        const journeyCard = journeyCardLabel.closest(".journey-card");

        const journeyCardContent = journeyCard.querySelector(".journey-card-content");

        if (journeyCardContent && journeyCardContent.classList.contains("hidden"))
        {
            journeyCardContent.classList.remove("hidden");
        }

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