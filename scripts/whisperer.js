import { Firebase } from './firebase.js';

export class Whisperer
{


    constructor(collectionName, searchInputId, suggestionsListId, selectedListId) 
    {
        this.collectionName = collectionName;

        this.searchInput     = document.getElementById(searchInputId);
        this.suggestionsList = document.getElementById(suggestionsListId);
        this.selectedList    = document.getElementById(selectedListId);

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

        // Umožnit přidání nového bodu Enterem
        this.searchInput.addEventListener("keydown", (event) =>
        {
            if (event.key === "Enter" && this.searchInput.value.trim() !== "") 
            {
                event.preventDefault();

                const newItem = this.searchInput.value.trim();
            
                if (!this.selectedItems.includes(newItem)) 
                {
                    this.addSelectedItem(newItem);
                }
            
                this.searchInput.value = "";

                this.suggestionsList.innerHTML = ""; // Schovat našeptávač
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