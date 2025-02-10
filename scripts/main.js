import { JourneyWeb }   from './journey-web.js'
import { ImageGallery } from './image-gallery.js'
import { Navigation } from './navigation.js'

const imageGallery = new ImageGallery();









const cardsData = await JourneyWeb.createCards();






const navigation = new Navigation();












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