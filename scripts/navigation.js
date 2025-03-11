import { JourneyWeb }   from './journey-web.js';

export class Navigation
{
    static #instance;

    constructor() 
    {
        if (Navigation.#instance) 
        {
            return Navigation.#instance;
        }

        Navigation.#instance = this;
    }

    buildNavigation()
    {
        const ulElement = document.querySelector("#leftNavigation ul");

        ulElement.replaceChildren();

        const years = this.#getUniqueYears();

        years.forEach(y => 
        {
            const journeyListElement = this.#addYearNode(ulElement, y);

            this.#addYearJourneyNodes(y, journeyListElement);
        });

        this.#addNavToggleEventListener();
    }

    #addYearJourneyNodes(year, journeyListElement)
    {
        const journeyCards = document.querySelectorAll(`.journey-card[data-year='${year}']`);

        journeyCards.forEach(journeyCard => 
        {
            const labelDiv = journeyCard.querySelector(".journey-card-label");

            const newListItem = document.createElement("li");

            newListItem.textContent = labelDiv.textContent;

            journeyListElement.appendChild(newListItem);

            newListItem.addEventListener('click', (e) => 
            {
                JourneyWeb.moveToJourneyCard(journeyCard);

                if (journeyCard.dataset.isLoaded !== "1")
                {
                    journeyCard.querySelector(".journey-card-label").click();
                }
            });
        });
    }

    #addYearNode(ulElement, year)
    {
        const newListItem = document.createElement("li");

        const yearSpan = document.createElement("span");

        const journeyList = document.createElement("ul");

        journeyList.className = "journeys-list";

        yearSpan.className = "year";

        yearSpan.textContent = year;

        newListItem.appendChild(yearSpan);

        newListItem.appendChild(journeyList);

        ulElement.appendChild(newListItem);

        return journeyList;
    }

    #addNavToggleEventListener()
    {
        // Zavření/ otevření menu
        document.querySelector(".main-nav-toggle .material-symbols-outlined").addEventListener("click", () => 
        {
           const leftNavigation = document.querySelector("#leftNavigation");
  
           leftNavigation.classList.toggle("closed");
  
           leftNavigation.querySelector(".main-navigation-list").classList.toggle("hidden");

           document.querySelector("#search").classList.toggle("hidden");
  
           document.querySelector("main").classList.toggle("wide");
  
           document.querySelector("#leftNavigation .main-nav-toggle .material-symbols-outlined").textContent = leftNavigation.classList.contains("closed")
              ? "arrow_menu_open"
              : "arrow_menu_close";
        });
    }

    #getUniqueYears()
    {
        const allCardsArray = [...document.querySelectorAll('.journey-card')];

        const allYears = allCardsArray.map(c => c.dataset.year)

        const yearsSet = new Set(allYears);

        return yearsSet;
    }
}