import { JourneyWeb }   from './journey-web.js'
import { ImageGallery } from './image-gallery.js'

const imageGallery = new ImageGallery();





const journeyCards = document.querySelectorAll('.journey-card');

journeyCards.forEach((journeyCard) => 
{
    const journeyCardLabel = journeyCard.querySelector(".journey-card-label");

    journeyCardLabel.addEventListener('click', (e) => 
    {
        JourneyWeb.setJourneyCardContent(e, imageGallery);
    });
});

const firstJourneyCardLabel = document.body.querySelector(".journey-card-label");

firstJourneyCardLabel.click();