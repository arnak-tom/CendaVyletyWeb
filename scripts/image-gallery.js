export class ImageGallery 
{
    static openGallery(thumbnailElement) 
    {
        console.debug('Metoda ImageGalery.showFullImage(thumbnailElement) byla zavolána.');

        const modal = document.getElementById('pictureModal');
          
        modal.style.display =  'flex';
        modal.setAttribute('data-images', thumbnailElement.getAttribute('data-images'));
        modal.setAttribute('data-images-current-index', '0');
        modal.setAttribute('data-scale', '1');

        // Načtení JSON z atributu data-images
        const images = JSON.parse(thumbnailElement.getAttribute('data-images'));

        const modalImg = document.getElementById('pictureModal-img');

        modalImg.style.transform = `scale(1)`;

        modalImg.src = images[0];
    }

    static closeGallery() 
    {
        const modal = document.getElementById('pictureModal');
        const modalImg = document.getElementById('pictureModal-img');
        
        modal.style.display = 'none';
        modalImg.src = '';
        modalImg.alt = '';
    }

    static nextImage()
    {
        this.#changeImage(1);
    }

    static previousImage()
    {
        this.#changeImage(-1);
    }

    // # oznacuje privatni metodu
    static #changeImage(direction) 
    {
        const modal = document.getElementById('pictureModal');

        const images = JSON.parse(modal.getAttribute('data-images'));

        const modalImg = document.getElementById("pictureModal-img");

        var currentIndex = (+modal.getAttribute('data-images-current-index') + direction + images.length) % images.length;

        modal.setAttribute('data-images-current-index', currentIndex);
            
        modalImg.src = images[currentIndex];
    }
}