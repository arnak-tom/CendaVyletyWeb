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

        this.#buildNavigation();
    }

    #buildNavigation()
    {
        const ulElement = document.querySelector("#leftNavigation ul");

        const years = this.#getUniqueYears();

        years.forEach(y => 
        {
            const journeyListElement = this.#addYearNode(ulElement, y);

            this.#addYearJourneyNodes(y, journeyListElement);
        });
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
                const elementPosition = journeyCard.getBoundingClientRect().top + window.scrollY;
                const offset = 130; // Požadovaná vzdálenost od vrchu

                window.scrollTo({
                    top: elementPosition - offset,
                    behavior: "smooth" // Plynulé scrollování
                });

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

    #getUniqueYears()
    {
        const allCardsArray = [...document.querySelectorAll('.journey-card')];

        const allYears = allCardsArray.map(c => c.dataset.year)

        const yearsSet = new Set(allYears);

        return yearsSet;
    }
}