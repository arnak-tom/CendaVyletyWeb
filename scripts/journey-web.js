import { Firebase } from './firebase.js';
import { ConvertUtil } from './convert-util.js';
import { ImageGallery } from './image-gallery.js';
import { Navigation }   from './navigation.js';
import { SearchField } from './search-field.js';
import { Administration } from "./administration.js";
import { JourneyWebSecurity } from "./security.js"

export class JourneyWeb
{
    static journeysCollectionName = "journeys";

    static #journeyCardTemplate = document.getElementById("journey-card-template");

    static #viewsCache = {};

    static async showCardsViewAsync()
    {
        document.getElementById("loader").style.display = "flex";

        await JourneyWeb.#loadViewAsync("/src/views/journeys-cards-view.html");

        const whereConditions = [];

        const orderByConditions = [["journeyDate", "desc"]];
  
        const journeysData = await Firebase.readDataAsync(JourneyWeb.journeysCollectionName, whereConditions, orderByConditions);

        journeysData.forEach(journey => 
        {
            const journeyCard = JourneyWeb.#journeyCardTemplate.content.cloneNode(true).firstElementChild;

            journeyCard.id = journey.journeyId;

            journeyCard.dataset.year = journey.year;

            journeyCard.dataset.docId = journey.docId;

            const journeyCardLabel = journeyCard.querySelector(".journey-card-label");

            const journeyDateFormatted = ConvertUtil.formatFirestoreTimestampForDisplay(journey.journeyDate);

            journeyCardLabel.querySelector("span").textContent = `${journey.title} ${journeyDateFormatted}`;

            const statusDiv = journeyCard.querySelector(".journey-card-status");

            if (journey.status)
            {
                statusDiv.classList.add(journey.status);
            }
            else
            {
                statusDiv.classList.add('todo');
            }

            journeyCardLabel.addEventListener('click', (e) => 
            {
                JourneyWeb.setJourneyCardContent(e.target, new ImageGallery());
            });
    
            document.querySelector("main").appendChild(journeyCard);
        });

        const navigation = new Navigation();

        navigation.buildNavigation(journeysData);

        const searchField = new SearchField()

        await searchField.init();

        const firstJourneyCardLabel = document.body.querySelector(".journey-card-label");

        if (firstJourneyCardLabel)
        {
            firstJourneyCardLabel.click();
        }

        JourneyWeb.#setLeftNavigationInitialState();

        window.scrollTo(0, 0);

        document.getElementById("loader").style.display = "none";
    }

    static async showTableViewAsync()
    {
        document.getElementById("loader").style.display = "flex";

        await JourneyWeb.#loadViewAsync("/src/views/journeys-table-view.html");

        const administration = new Administration();

        const journeysTable = document.getElementById("journeys-table");

        const currentYear = new Date().getFullYear();

        journeysTable.dataset.year = currentYear;

        const currentYearSwitcherDiv = document.querySelector(`#journeys-table-years-switch .switch-item[data-year='${currentYear}']`);

        if (currentYearSwitcherDiv)
        {
            currentYearSwitcherDiv.classList.add("current");
        }

        await administration.loadJourneysTableDataAsync();

        JourneyWebSecurity.enableOrDisableAdminSections();

        administration.addEventListeners();

        window.scrollTo(0, 0);

        document.getElementById("loader").style.display = "none";
    }

    static async #loadViewAsync(viewFileUrl) 
    {
        let viewCode = JourneyWeb.#viewsCache[viewFileUrl];

        if (!viewCode) 
        {
            viewCode = await JourneyWeb.#fetchText(viewFileUrl);

            JourneyWeb.#viewsCache[viewFileUrl] = viewCode;
        } 

        document.getElementById("view-content").innerHTML = viewCode;
    }

    static async setJourneyCardContent(labelElement, imageGallery)
    {
        if (labelElement) 
        {
            const journeyCard = labelElement.closest(".journey-card");

            if (journeyCard.dataset.isLoaded !== "1")
            {
                // const innerHtml = await JourneyWeb.#fetchText(`/src/journey-card-content/${journeyCard.dataset.year}/${journeyCard.id}.html`);

                // if (!innerHtml)
                // {
                //     return;
                // }

                // journeyCard.querySelector(".journey-attributes").innerHTML = innerHtml;

                const journeyThumbnail = journeyCard.querySelector('.journey-thumbnail');

                if (journeyThumbnail)
                {
                    imageGallery.addThumbNailHandlers(journeyThumbnail);
                }

                const journey = await Firebase.readDocumentByIdAsync("journeys", journeyCard.dataset.docId); 

                if (journey)
                {
                    const journeyMembersElement = journeyCard.querySelector('.journey-attribute-members .value');

                    if (journeyMembersElement && journey.journeyMembers && journey.journeyMembers.length > 0)
                    {
                        journeyMembersElement.textContent = journey.journeyMembers.join(", ");
                    }

                    const routeLengthElement = journeyCard.querySelector('.journey-attribute-route-length .value');

                    if (journey.routeLength && routeLengthElement)
                    {
                        routeLengthElement.textContent = journey.routeLength;
                    }

                    const metersClimbedElement = journeyCard.querySelector('.journey-attribute-meters-climbed .value');

                    if (journey.metersClimbed && metersClimbedElement)
                    {
                        metersClimbedElement.textContent = journey.metersClimbed;
                    }

                    const altitudeLowestElement = journeyCard.querySelector('.journey-attribute-altitude-lowest .value');

                    if (journey.altitudeLowest && altitudeLowestElement)
                    {
                        altitudeLowestElement.textContent = journey.altitudeLowest;
                    }

                    const altitudeHighestElement = journeyCard.querySelector('.journey-attribute-altitude-highest .value');

                    if (journey.altitudeHighest && altitudeHighestElement)
                    {
                        altitudeHighestElement.textContent = journey.altitudeHighest;
                    }

                    JourneyWeb.#setImagesGalleryItemsToCard(journeyCard, journey);

                    JourneyWeb.#setRouteLinkToCard(journeyCard, journey);

                    const journeyRoutePointsElement = journeyCard.querySelector('.journey-attribute-route-points .value');

                    if (journeyRoutePointsElement && journey.routePoints && journey.routePoints.length > 0)
                    {
                        journeyRoutePointsElement.textContent = journey.routePoints.join(" > ");
                    }

                    const restaurantsElement = journeyCard.querySelector('.journey-attribute-restaurants .value');

                    if (journey.restaurantsHtml && restaurantsElement)
                    {
                        restaurantsElement.innerHTML = journey.restaurantsHtml;
                    }

                    const storyElement = journeyCard.querySelector('.journey-attribute-story .value');

                    if (journey.storyHtml && storyElement)
                    {
                        storyElement.innerHTML = journey.storyHtml;
                    }
                }

                journeyCard.dataset.isLoaded = "1";
            }

            const journeyCardContentCurrent = journeyCard.querySelector(".journey-card-content");

            const wasCurrentHidden = journeyCardContentCurrent.classList.contains("hidden");
            

            const journeyCardContentActiveAll = document.querySelectorAll(".journey-card-content:not(.hidden)");

            journeyCardContentActiveAll.forEach(c => c.classList.add("hidden"));

            if (wasCurrentHidden)
            {
                journeyCardContentCurrent.classList.remove("hidden");
            }
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

    // static async #fetchJson(url) 
    // {
    //     try 
    //     {
    //         const response = await fetch(url);
    
    //         // Ověříme, zda je odpověď v pořádku (status 200-299)
    //         if (!response.ok) 
    //         {
    //             throw new Error(`Chyba HTTP: ${response.status} ${response.statusText}`);
    //         }
    
    //         const data = await response.json();

    //         return data;
    //     } 
    //     catch (error) 
    //     {
    //         console.error("Chyba při načítání:", error.message);

    //         return null;
    //     }
    // }

    static moveToJourneyCard(journeyCard)
    {
        const elementPosition = journeyCard.getBoundingClientRect().top + window.scrollY;

        const offset = 150; // Požadovaná vzdálenost od vrchu

        window.scrollTo({
                            top: elementPosition - offset,
                            behavior: "smooth" // Plynulé scrollování
                        });
    }

    static #setLeftNavigationInitialState()
    {
        const leftNavToggle = document.body.querySelector(".main-nav-toggle .material-symbols-outlined");

        if (leftNavToggle)
        {
            if (window.innerWidth <= 768) 
            {
                leftNavToggle.click();
            }
        }
    }

    static #setImagesGalleryItemsToCard(journeyCard, journey)
    {
        const journeyThumbnailImgElement = journeyCard.querySelector('.journey-card-images img.journey-thumbnail');

        if (journey.photoGalleryThumbnailUrl && journeyThumbnailImgElement)
        {
            journeyThumbnailImgElement.src = journey.photoGalleryThumbnailUrl;
            journeyThumbnailImgElement.alt = `${journey.title} ${journey.year}`;

            const imagesCountElement = journeyCard.querySelector(".journey-thumbnail-container .images-count");

            if (imagesCountElement && journey.photoGalleryItems && journey.photoGalleryItems.length > 0)
            {
                imagesCountElement.textContent = journey.photoGalleryItems.length;
            }

            if (journey.photoGalleryItems && journey.photoGalleryItems.length > 0)
            {
                journeyThumbnailImgElement.dataset.images = JSON.stringify(journey.photoGalleryItems);
            }
        }
    }

    static #setRouteLinkToCard(journeyCard, journey)
    {
        const journeyRouteLinkElement = journeyCard.querySelector('.journey-card-images a.journey-route-link');

        if (journeyRouteLinkElement && journey.journeyRouteUrl)
        {
            journeyRouteLinkElement.href = journey.journeyRouteUrl;
            journeyRouteLinkElement.classList.remove("hidden");

            const journeyRouteThumbnailElement = journeyCard.querySelector('.journey-card-images a.journey-route-link .journey-route-thumbnail');

            if (journeyRouteThumbnailElement && journey.journeyRouteThumbnailUrl)
            {
                journeyRouteThumbnailElement.src = journey.journeyRouteThumbnailUrl;
            }
        }

    }
}