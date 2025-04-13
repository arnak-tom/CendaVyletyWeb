import { Firebase } from './firebase.js';

export class Whisperer
{


    constructor(collectionName, searchInputId, suggestionsListId, selectedListId) 
    {
        this.collectionName = collectionName;

        this.searchInput     = document.getElementById(searchInputId);
        this.suggestionsList = document.getElementById(suggestionsListId);
        this.selectedList    = document.getElementById(selectedListId);

        this.selectedIndex = -1; // Index vybraného prvku v seznamu návrhů
        
        this.selectedItems = [];

        this.#addEventListeners();
    }

    async loadData()
    {
        this.collectionDocuments = await Firebase.readDataAsync(this.collectionName);
    }

    removeAllSelectedItems()
    {
        this.selectedItems = [];
    }

    #addEventListeners()
    {
        // Našeptávač - zobrazení návrhů
        this.searchInput.addEventListener("input", () => 
        {
            this.selectedIndex = -1;

            const query = this.searchInput.value.toLowerCase();

            if (!query)
            { 
                return;
            }

            this.suggestionsList.innerHTML = "";
        
            this.collectionDocuments
                    .filter(item => item.name.toLowerCase().includes(query) && !this.selectedItems.includes(item.name))
                    .forEach(item => 
                    {
                        const li = document.createElement("li");

                        li.textContent = item.name;

                        li.addEventListener("click", () => this.addSelectedItem(item.name));

                        this.suggestionsList.appendChild(li);
                    });
        });

        
        this.searchInput.addEventListener("keydown", (event) =>
        {
            const suggestionsListItems = this.suggestionsList.querySelectorAll("li");

            if (event.key === "ArrowDown") 
            {
                event.preventDefault();

                if (suggestionsListItems && suggestionsListItems.length > 0)
                {
                    this.selectedIndex = (this.selectedIndex + 1) % suggestionsListItems.length;

                    console.debug(`selectedIndex = ${this.selectedIndex}`);

                    this.markSelectedItem(suggestionsListItems);
                }
            } 
            else if (event.key === "ArrowUp") 
            {
                event.preventDefault();

                if (suggestionsListItems && suggestionsListItems.length > 0)
                {
                    this.selectedIndex = (this.selectedIndex - 1 + suggestionsListItems.length) % suggestionsListItems.length;

                    console.debug(`selectedIndex = ${this.selectedIndex}`);

                    this.markSelectedItem(suggestionsListItems);
                }
            } 
            // Umožnit přidání nového bodu Enterem
            else if (event.key === "Enter" && this.searchInput.value.trim() !== "") 
            {
                event.preventDefault();

                console.debug(`selectedIndex = ${this.selectedIndex}`);

                let newItem = this.searchInput.value.trim();

                const suggestionsListItems = this.suggestionsList.querySelectorAll("li");

                if (suggestionsListItems && this.selectedIndex > -1)
                {
                    const selectedItem = suggestionsListItems[this.selectedIndex];

                    if (selectedItem)
                    {
                        newItem = selectedItem.textContent;
                    }
                }
            
                if (!this.selectedItems.includes(newItem)) 
                {
                    this.addSelectedItem(newItem);
                }
            
                this.searchInput.value = "";

                this.suggestionsList.innerHTML = ""; // Schovat našeptávač
            }
        });

        document.addEventListener("click", (e) => 
        {
            if (e.target !== this.searchInput) 
            {
                this.suggestionsList.innerHTML = "";

                this.searchInput.value = "";

                this.selectedIndex = -1;
            }
        });
    }

    // Přidání bodu do seznamu vybraných
    addSelectedItem(item) 
    {
        if (!this.selectedItems.includes(item)) 
        {
            this.selectedItems.push(item);
  
            const li = document.createElement("li");

            li.textContent = item;
      
            // Odstranění bodu
            const removeBtn = document.createElement("button");

            removeBtn.textContent = "×";

            removeBtn.addEventListener("click", () => 
            {
                this.selectedItems = this.selectedItems.filter(i => i !== item);

                li.remove();
            });
        
            li.appendChild(removeBtn);

            this.selectedList.appendChild(li);

            this.#addItemToFirestoreIfNeeded(item);
        }

        this.searchInput.value = "";

        this.suggestionsList.innerHTML = "";

        this.selectedIndex = -1;
    }

    markSelectedItem(items) 
    {
        items.forEach((item, index) => 
        {
            item.style.background = index === this.selectedIndex ? "#ddd" : "white";
        });
    }
  
    async #addItemToFirestoreIfNeeded(itemToAdd) 
    {
        if (!this.collectionDocuments.some(item => item.name === itemToAdd))
        {
            Firebase.addObjectToCollection(this.collectionName, { name: itemToAdd });

            this.loadData();
        }
    }
}