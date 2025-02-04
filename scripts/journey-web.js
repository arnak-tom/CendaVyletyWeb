export class JourneyWeb
{
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
}