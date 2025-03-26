import { ConvertUtil } from './convert-util.js';
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

    buildNavigation(journeysData)
    {
        const ulElement = document.querySelector("#leftNavigation ul");

        ulElement.replaceChildren();

        const yearsSet = this.#getUniqueYearsSet(journeysData);

        const yearsDesc = [...yearsSet].sort((a, b) => b - a);

        yearsDesc.forEach(y => 
        {
            const journeyListElement = this.#addYearNode(ulElement, y);

            const journeysOfYear = journeysData.filter(j => j.year === y);

            this.#addYearJourneyNodes(journeysOfYear, journeyListElement);
        });

        this.#addNavToggleEventListener();
    }

    #addYearJourneyNodes(journeysOfYear, journeyListElement)
    {
        const journeysOfYearSorted = journeysOfYear.sort((a, b) => new Date(a.journeyDate) - new Date(b.journeyDate));;

        journeysOfYearSorted.forEach(journey => 
        {
            const newListItem = document.createElement("li");

            newListItem.innerHTML = `<div>${journey.title}</div><div class='journey-date'>${ConvertUtil.formatFirestoreTimestampForDisplay(journey.journeyDate)}</div>`;
            
            journeyListElement.appendChild(newListItem);

            newListItem.addEventListener('click', (e) => 
            {
                const leftNavToggle = document.body.querySelector(".main-nav-toggle .material-symbols-outlined");

                if (leftNavToggle)
                {
                    if (window.innerWidth <= 768) 
                    {
                        leftNavToggle.click();
                    }
                }

                const journeyCard = document.querySelector(`.journey-card[data-doc-id="${journey.docId}"]`);

                JourneyWeb.moveToJourneyCard(journeyCard);

                journeyCard.dataset.forceOpen = "true";

                journeyCard.querySelector(".journey-card-label").click();
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

    #getUniqueYearsSet(journeysData)
    {
        const allYears = journeysData.map(j => j.year);

        const yearsSet = new Set(allYears);

        return yearsSet;
    }
}