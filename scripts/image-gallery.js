export class ImageGallery 
{
    static #instance;

    #modalDiv;

    #modalImg;

    #onMouseMoveHandler;

    #shiftX;

    #shiftY;

    static get #MIN_WIDTH_PX() {
        return 300;
    }

    static get #MAX_WIDTH_PX() {
        return 3000;
    }

    static get #WIDTH_STEP_PX() {
        return 50;
    }

    constructor() 
    {
        if (ImageGallery.#instance) 
        {
            return ImageGallery.#instance;
        }

        ImageGallery.#instance = this;

        this.#modalImg = document.getElementById("pictureModal-img");

        this.#modalDiv = document.getElementById("pictureModal");

        this.#setEventHandlers();
    }

    addThumbNailHandlers(thumbnailElement)
    {
        thumbnailElement.addEventListener('click', () => 
        {
            this.#openGallery(thumbnailElement);
        });
    }

    // Otevření galerie fotek
    #openGallery(thumbnailElement) 
    {
        console.debug('Metoda ImageGalery.showFullImage(thumbnailElement) byla zavolána.');

        const imagesJson = thumbnailElement.getAttribute('data-images');
          
        this.#modalDiv.style.display =  'flex';
        this.#modalDiv.setAttribute('data-images', imagesJson);
        this.#modalDiv.setAttribute('data-images-current-index', '0');

        // Načtení JSON z atributu data-images
        const images = JSON.parse(imagesJson);

        this.#modalImg.src = images[0];

        this.#modalImg.style.cursor = "grab";
    }

    // Zavření galerie fotek
    #closeGallery() 
    {
        this.#modalDiv.style.display = 'none';
        
        this.#setModalImageToDefault();
    }

    // Posun na další fotku
    #nextImage()
    {
        this.#changeImage(1);
    }

    // Posun na předchozí fotku
    #previousImage()
    {
        this.#changeImage(-1);
    }

    //Zoomování kolečkem myši
    #zoomImageByWheel(wheelEvent) 
    {
        wheelEvent.preventDefault();

        const originalWidth = this.#modalImg.getBoundingClientRect().width;

        if ((originalWidth < ImageGallery.#MIN_WIDTH_PX) || (originalWidth > ImageGallery.#MAX_WIDTH_PX))
        {
            return;
        }

        const newWidth = wheelEvent.deltaY < 0 
            ? originalWidth + ImageGallery.#WIDTH_STEP_PX 
            : originalWidth - ImageGallery.#WIDTH_STEP_PX;

        if ((newWidth < ImageGallery.#MIN_WIDTH_PX) || (newWidth > ImageGallery.#MAX_WIDTH_PX))
        {
            return;
        }

        this.#modalImg.style.width     =  `${newWidth}px`;
        this.#modalImg.style.maxWidth  = "unset";
        this.#modalImg.style.maxHeight = "unset";
    }

    #onImageMouseDown(mouseEvent)
    {
        const boundingRect = this.#modalImg.getBoundingClientRect();

        this.#shiftX = mouseEvent.clientX - boundingRect.left;
        this.#shiftY = mouseEvent.clientY - boundingRect.top + window.scrollY;

        this.#modalImg.style.cursor = 'grabbing';

        this.#modalDiv.append(this.#modalImg);

        this.#moveAt(mouseEvent.pageX, mouseEvent.pageY);

        this.#modalDiv.addEventListener('mousemove', this.#onMouseMoveHandler);
    }

    #onImageMouseUp()
    {
        this.#modalImg.style.cursor = "grab";

        this.#modalDiv.removeEventListener('mousemove', this.#onMouseMoveHandler);
    }

    // # oznacuje privatni metodu
    #changeImage(direction) 
    {
        this.#setModalImageToDefault();

        const images = JSON.parse(this.#modalDiv.getAttribute('data-images'));

        var currentIndex = (+this.#modalDiv.getAttribute('data-images-current-index') + direction + images.length) % images.length;

        this.#modalDiv.setAttribute('data-images-current-index', currentIndex);

        this.#modalImg.src = images[currentIndex];
    }

    #moveAt(pageX, pageY) 
    {
        this.#modalImg.style.left = pageX - this.#shiftX + 'px';
        this.#modalImg.style.top  = pageY - this.#shiftY + 'px';
    }

    #setModalImageToDefault()
    {
        this.#modalImg.src = '';
        this.#modalImg.alt = '';

        this.#modalImg.style.width     = "unset";
        this.#modalImg.style.maxWidth  = "90%";
        this.#modalImg.style.maxHeight = "90%";

        this.#modalImg.style.left = "unset";
        this.#modalImg.style.top = "unset";

        this.#shiftX = 0;
        this.#shiftY = 0;
    }

    #setEventHandlers()
    {
        this.#modalDiv.addEventListener("wheel", (e) => 
        {
            console.debug("modal div WHEEL");

            e.preventDefault();
        });

        this.#modalImg.addEventListener("wheel", (e) => 
        {
            console.debug("modal div img WHEEL");

            this.#zoomImageByWheel(e);
        });

        const journeyThumbnails = document.querySelectorAll('.journey-thumbnail');

        journeyThumbnails.forEach((thumbnailElement) => 
        {
            thumbnailElement.addEventListener('click', () => 
            {
                this.#openGallery(thumbnailElement);
            });
        });

        const closeGalleryButton = document.querySelector('#pictureModal .close');

        closeGalleryButton.addEventListener('click', () => 
        {
            this.#closeGallery();
        });

        const previousImageButton = document.querySelector('#pictureModal .prev');

        previousImageButton.addEventListener('click', () => 
        {
            this.#previousImage();
        });

        const nextImageButton = document.querySelector('#pictureModal .next');

        nextImageButton.addEventListener('click', () => 
        {
            this.#nextImage();
        });

        this.#modalImg.addEventListener("mousedown", (e) => 
        {
            this.#onImageMouseDown(e);
        });

        this.#modalDiv.addEventListener("mouseup", () => 
        {
            this.#onImageMouseUp();
        });

        this.#onMouseMoveHandler = (mouseEvent) => 
        { 
            this.#moveAt(mouseEvent.pageX, mouseEvent.pageY, this.#shiftX, this.#shiftY); 
        };
    }
}