import { ImageGallery } from './image-gallery.js'
















// Otevření galerie fotek
const journeyThumbnails = document.querySelectorAll('.journey-thumbnail');

journeyThumbnails.forEach((thumbnailElement) => 
{
    thumbnailElement.addEventListener('click', () => 
    {
        ImageGallery.openGallery(thumbnailElement);
    });
});

// Posun na další fotku
const closeGalleryButton = document.querySelector('#pictureModal .close');

closeGalleryButton.addEventListener('click', () => 
{
    ImageGallery.closeGallery();
});

// Posun na předchozí fotku
const previousImageButton = document.querySelector('#pictureModal .prev');

previousImageButton.addEventListener('click', () => 
{
    ImageGallery.previousImage();
});

// Posun na další fotku
const nextImageButton = document.querySelector('#pictureModal .next');

nextImageButton.addEventListener('click', () => 
{
    ImageGallery.nextImage();
});

// Zoomování kolečkem myši
const modalImage = document.getElementById("pictureModal-img");

modalImage.addEventListener("wheel", (e) => 
{
    e.preventDefault();

    const modal = document.getElementById('pictureModal');

    var scale = +modal.getAttribute('data-scale');

    scale += e.deltaY < 0 ? 0.1 : -0.1; // Zoom-in kolečkem nahoru, zoom-out dolů
    scale = Math.max(scale, 0.5); // Min zoom = 0.5

    modalImage.style.transform = `scale(${scale})`;

    modal.setAttribute('data-scale', scale);
});


