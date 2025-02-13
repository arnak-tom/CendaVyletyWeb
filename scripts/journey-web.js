export class JourneyWeb
{
    static async createCards()
    {
        let journeysByYear = await JourneyWeb.#fetchJson('/src/data/journey-list.json');

        if (journeysByYear == null)
        {
            return;
        }

        const template = document.getElementById("journey-card-template");

        journeysByYear = journeysByYear.sort((a, b) => b.year - a.year);
        

        journeysByYear.forEach((journeysOfYear) => 
        {
            const journeysSorted = journeysOfYear.journeys.sort((a, b) => b.id.localeCompare(a.id));

            journeysSorted.forEach( (journeyData) => 
            {
                const clone = template.content.cloneNode(true);

                const journeyCard = clone.firstElementChild;

                journeyCard.id = journeyData.id;

                journeyCard.dataset.year = journeysOfYear.year;

                journeyCard.querySelector(".journey-card-label span").textContent = journeyData.label;

                const statusDiv = journeyCard.querySelector(".journey-card-status");

                if (journeyData.status)
                {
                    statusDiv.classList.add(journeyData.status);
                }
                else
                {
                    statusDiv.classList.add('todo');
                }

                document.querySelector("main").appendChild(journeyCard);
            } );
            
        });
    }

    static async setJourneyCardContent(pointerEvent, imageGallery)
    {
        const labelElement = pointerEvent.target;

        if (labelElement) 
        {
            const journeyCard = labelElement.closest(".journey-card");

            if (journeyCard.dataset.isLoaded !== "1")
            {
                let dataFound = false;

                await JourneyWeb.#fetchText(`/src/journey-card-content/${journeyCard.dataset.year}/${journeyCard.id}.html`)
                    .then(data => 
                    {
                        if (data) 
                        {
                            dataFound = true;

                            labelElement.insertAdjacentHTML("afterend", data);
                        } 
                    } );

                if (!dataFound)
                {
                    return;
                }

                const journeyThumbnail = journeyCard.querySelector('.journey-thumbnail');

                if (journeyThumbnail)
                {
                    imageGallery.addThumbNailHandlers(journeyThumbnail);
                }

                journeyCard.dataset.isLoaded = "1";
            }

            const journeyCardContent = journeyCard.querySelector(".journey-card-content");

            journeyCardContent.classList.toggle("hidden");
        }
    }

    static async #fetchText(url) 
    {
        try 
        {
            const response = await fetch(url);
    
            // Ověříme, zda je odpověď v pořádku (status 200-299)
            if (!response.ok) 
            {
                throw new Error(`Chyba HTTP: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.text();

            return data;
        } 
        catch (error) 
        {
            console.error("Chyba při načítání:", error.message);

            return null;
        }
    }

    static async #fetchJson(url) 
    {
        try 
        {
            const response = await fetch(url);
    
            // Ověříme, zda je odpověď v pořádku (status 200-299)
            if (!response.ok) 
            {
                throw new Error(`Chyba HTTP: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();

            return data;
        } 
        catch (error) 
        {
            console.error("Chyba při načítání:", error.message);

            return null;
        }
    }
}